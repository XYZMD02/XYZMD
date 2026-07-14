/* 音乐伴侣 - 音乐播放器 (内联版)
 * 从 音乐.html 提取并隔离，避免与 SEA 站点冲突：
 *   $ -> mb$ , load/save -> mbLoad/mbSave , document.querySelector -> mbRoot.querySelector
 *   动画名加 mb- 前缀 ; init() 改为首次打开时由 music-buddy-entry.js 调用
 */
(function(){
'use strict';
var mbRoot=document.getElementById('music-buddy-page');
if(window.__mbAppLoaded)return;
window.__mbAppLoaded=true;

/* ============ 轻量QR码生成器 ============ */
function generateQR(text,canvas,size){
  // 使用Google Charts API生成二维码图片，绘制到canvas
  const ctx=canvas.getContext('2d');
  canvas.width=size; canvas.height=size;
  const img=new Image();
  img.crossOrigin='anonymous';
  img.onload=()=>{ctx.clearRect(0,0,size,size);ctx.drawImage(img,0,0,size,size);};
  img.onerror=()=>{ctx.fillStyle='#666';ctx.fillRect(0,0,size,size);ctx.fillStyle='#fff';ctx.font='14px sans-serif';ctx.textAlign='center';ctx.fillText('二维码加载失败',size/2,size/2);};
  img.src='https://api.qrserver.com/v1/create-qr-code/?size='+size+'x'+size+'&data='+encodeURIComponent(text);
}
/* ============ 工具 ============ */
const mb$ = id => document.getElementById(id);
const mbLoad = (k,def) => { try{const v=localStorage.getItem(k); return v?JSON.parse(v):def;}catch(e){return def;} };
const mbSave = (k,v) => { try{localStorage.setItem(k,JSON.stringify(v));}catch(e){} };
const toast = (msg) => { const t=mb$('mb-toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('show'),2600); };
const fmt = t => { if(!isFinite(t)||t<0)t=0; return Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0'); };
const uid = () => 'id_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// 安全显示：等一帧再触发 show 过渡，避免内容还没渲染就出现导致闪现
const mbShow = (el) => { if(el) requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('show'))); };
const mbHide = (el) => { if(el) el.classList.remove('show'); };

/* ============ 状态 ============ */
const audio = new Audio();
audio.volume = 0.8;

const MODES = [
  {key:'loop',label:'列表循环',icon:'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z'},
  {key:'order',label:'顺序播放',icon:'M4 6h12v2H4zm0 5h12v2H4zm0 5h8v2H4zm14 .5v-5l4 2.5z'},
  {key:'shuffle',label:'随机播放',icon:'M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4z'}
];

let state = mbLoad('mb_state', {
  user: { avatar:null, nick:'我的音乐', signature:'点击编辑签名', background:null,
    playlists:[{id:uid(),name:'默认歌单',cover:null,songs:[]}], history:[],
    recIntervalMin: 30, recIntervalMinUnit: 60, recIntervalMax: 120, recIntervalMaxUnit: 60,
    partnerCommentMin: 30, partnerCommentMinUnit: 60,
    partnerCommentMax: 120, partnerCommentMaxUnit: 60,
    partnerChatMin: 30, partnerChatMinUnit: 60,
    partnerChatMax: 120, partnerChatMaxUnit: 60,
    replyMin: 3, replyMinUnit: 60, replyMax: 10, replyMaxUnit: 60 },
  partners: [],
  favorites: [],
  comments: {},
  mode: 'loop', volume: 0.8, currentSongId: null, currentPlId: null,
  companion: null,
  apiUrl: '' // 自定义API地址
});
let proxyOnline = false;
let lyricData = null, lyricEls = [], showLyrics = true;
let chatOpen = false;
let editingPartnerId = null;
let pendingPartnerAvatar = null;
let pendingPlCover = null;
let allSongs = [];
let currentAddSongPl = null; // 当前添加歌曲的目标歌单
let currentPartnerId = null; // 当前查看的伴侣ID

function saveAll(){ mbSave('mb_state', state); }

/* 从网站总字卡库随机抽取一条文本 */
function getCardFromSite(){
  try {
    var replies = (typeof customReplies !== 'undefined' && customReplies) ? customReplies : (window._customReplies || []);
    if(replies && replies.length > 0){
      return replies[Math.floor(Math.random()*replies.length)];
    }
  } catch(e) {}
  return null;
}
function getCardOrDefault(defaultText){
  var card = getCardFromSite();
  return card || defaultText;
}

/* 从网站表情库获取表情列表 */
function getSiteStickers(){
  try {
    var lib = null;
    if(typeof window !== 'undefined' && window._stickerLibrary && Array.isArray(window._stickerLibrary)){
      lib = window._stickerLibrary;
    } else if(typeof stickerLibrary !== 'undefined' && Array.isArray(stickerLibrary)){
      lib = stickerLibrary;
    }
    if(lib){
      var filtered = lib.filter(Boolean);
      if(filtered.length > 0) return filtered;
    }
  } catch(e) {}
  return null;
}
function getStickerOrDefault(defaultArr){
  var stickers = getSiteStickers();
  return stickers || defaultArr;
}

/* ============ API ============ */
function getAPIBase(){
  return state.apiUrl || '';
}
async function checkProxy(){
  const base = getAPIBase();
  try{
    const r=await fetch(base+'/health',{signal:AbortSignal.timeout(3000)});
    const d=await r.json();
    proxyOnline = !!d.ok;
  }catch(e){ proxyOnline=false; }
  updateApiStatus();
}
function updateApiStatus(){
  const el=mb$('apiStatus'); const txt=mb$('apiStatusText');
  if(proxyOnline){ el.classList.add('online'); txt.textContent='已连接'; }
  else { el.classList.remove('online'); txt.textContent='未连接（可手动上传歌曲）'; }
}
async function apiGet(p){ const r=await fetch(getAPIBase()+p,{signal:AbortSignal.timeout(12000)}); if(!r.ok)throw new Error('HTTP '+r.status); return r.json(); }
async function apiPost(p,d){ const r=await fetch(getAPIBase()+p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d),signal:AbortSignal.timeout(12000)}); if(!r.ok)throw new Error('HTTP '+r.status); return r.json(); }

/* ============ 页面导航 ============ */
mbRoot.querySelectorAll('.nav-item').forEach(item=>{
  item.addEventListener('click',()=>{
    const page=item.dataset.page;
    mbRoot.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    item.classList.add('active');
    mbRoot.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));
    mb$('page'+page.charAt(0).toUpperCase()+page.slice(1)).classList.remove('hidden');
    if(page==='search') mb$('mb-searchInput').focus();
    if(page==='mine') updateMine();
  });
});
mb$('homeSearchInput').addEventListener('click',()=>{
  mbRoot.querySelector('.nav-item[data-page="search"]').click();
});

/* ============ 播放器核心 ============ */
function findSong(id){
  for(const pl of state.user.playlists){
    const i=pl.songs.findIndex(s=>s.id===id);
    if(i>=0) return {pl,song:pl.songs[i],index:i};
  }
  const fi=allSongs.findIndex(s=>s.id===id);
  if(fi>=0) return {pl:null,song:allSongs[fi],index:fi};
  return null;
}
function isFavorited(songId){ return state.favorites.some(f=>f.songId===songId); }

let _playRetryTimer=null;
function playSong(song){
  if(!song.src && song.neteaseId) song.src='https://music.163.com/song/media/outer/url?id='+song.neteaseId+'.mp3';
  audio.src=song.src; audio.load();
  state.currentSongId=song.id;
  const myId=song.id;
  clearTimeout(_playRetryTimer);
  if(!state.user.history.some(h=>h.id===song.id)){
    state.user.history.unshift({id:song.id,name:song.name,artist:song.artist,type:song.type,neteaseId:song.neteaseId,src:song.src,picUrl:song.picUrl,time:Date.now()});
    if(state.user.history.length>50) state.user.history.pop();
  }
  if(!allSongs.some(s=>s.id===song.id)) allSongs.push(song);
  saveAll();
  audio.play().then(()=>{ clearTimeout(_playRetryTimer); updatePlayUI(true); }).catch(()=>{});
  loadSongMeta(song);
  updateMiniPlayer(song);
  updateFullPlayer(song);
  _playRetryTimer=setTimeout(()=>{
    if(state.currentSongId===myId && audio.paused && !audio.duration){
      toast('播放失败，可能版权限制，可尝试搜索其他版本');
    }
  },5000);
  // 伴侣听歌记录
  state.partners.forEach(p=>{
    if(!p.history.some(h=>h.id===song.id)){
      p.history.unshift({id:song.id,name:song.name,artist:song.artist,neteaseId:song.neteaseId,src:song.src,time:Date.now()});
      if(p.history.length>20) p.history.pop();
    }
  });
  saveAll();
}

async function loadSongMeta(song){
  if(song.neteaseId && proxyOnline){
    apiGet('/api/song/url?id='+song.neteaseId).then(d=>{
      if(d.url){ const f=findSong(song.id); if(f){ f.song.src=d.url; saveAll();
        if(state.currentSongId===song.id){ audio.src=d.url; audio.load(); audio.play().then(()=>{ clearTimeout(_playRetryTimer); updatePlayUI(true); }).catch(()=>{ clearTimeout(_playRetryTimer); toast('播放失败，可能版权限制'); }); } } }
    }).catch(()=>{});
    apiGet('/api/song/detail?id='+song.neteaseId).then(d=>{
      if(d.detail){ const f=findSong(song.id); if(f){
        if(!song.customName) f.song.name=d.detail.name;
        f.song.artist=d.detail.artist; f.song.picUrl=d.detail.picUrl; saveAll();
        updateMiniPlayer(f.song); updateFullPlayer(f.song);
      } }
    }).catch(()=>{});
    apiGet('/api/lyric?id='+song.neteaseId).then(d=>{
      if(d.lrc){ const f=findSong(song.id); if(f){ f.song.lyrics=d.lrc; saveAll();
        if(state.currentSongId===song.id) prepareLyrics(f.song); } }
    }).catch(()=>{});
  }
}

function togglePlay(){ if(!audio.src){ toast('请先选择歌曲'); return; }
  if(audio.paused) audio.play().catch(()=>toast('播放失败')); else audio.pause(); }
function updatePlayUI(playing){
  const icon = playing ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>' : '<path d="M8 5v14l11-7z"/>';
  mb$('mpPlay').innerHTML='<svg viewBox="0 0 24 24">'+icon+'</svg>';
  mb$('fpPlay').innerHTML='<svg viewBox="0 0 24 24">'+icon+'</svg>';
  mb$('fpDisc').classList.toggle('playing',playing);
  mb$('floatPlayer').classList.toggle('playing',playing);
  const tonearm=mb$('fpTonearm'); if(tonearm) tonearm.classList.toggle('playing',playing);
}
function getCurIndex(){ return allSongs.findIndex(s=>s.id===state.currentSongId); }
function nextTrack(){
  const n=allSongs.length; if(!n) return;
  let i=getCurIndex();
  if(state.mode==='shuffle'){ if(n>1){let r;do{r=Math.floor(Math.random()*n)}while(r===i);i=r;} else i=0; }
  else i=(i+1)%n;
  playSong(allSongs[i]);
}
function prevTrack(){
  const n=allSongs.length; if(!n) return;
  let i=getCurIndex();
  if(state.mode==='shuffle') i=Math.floor(Math.random()*n);
  else i=i<=0?n-1:i-1;
  playSong(allSongs[i]);
}
audio.addEventListener('ended',nextTrack);
audio.addEventListener('error',function(){
  // 播放出错（如版权限制）时，显示提示并尝试下一首
  if(state.currentSongId){
    var f=findSong(state.currentSongId);
    if(f) toast('《'+f.song.name+'》播放失败，自动跳转下一首');
  }
  nextTrack();
});
audio.addEventListener('timeupdate',()=>{
  if(audio.duration){
    mb$('mpProgFill').style.width=(audio.currentTime/audio.duration*100)+'%';
    mb$('fpProgFill').style.width=(audio.currentTime/audio.duration*100)+'%';
    mb$('fpCurTime').textContent=fmt(audio.currentTime);
  }
  updateLyrics();
});
audio.addEventListener('loadedmetadata',()=>{ mb$('fpDurTime').textContent=fmt(audio.duration); });
audio.addEventListener('play',()=>updatePlayUI(true));
audio.addEventListener('pause',()=>updatePlayUI(false));

function setModeIcon(){
  const m=MODES.find(x=>x.key===state.mode)||MODES[0];
  mb$('fpModeBtn').innerHTML='<svg viewBox="0 0 24 24"><path d="'+m.icon+'"/></svg>';
}
mb$('fpModeBtn').addEventListener('click',()=>{
  const i=MODES.findIndex(m=>m.key===state.mode);
  state.mode=MODES[(i+1)%MODES.length].key; setModeIcon(); saveAll();
  toast('播放模式：'+MODES.find(m=>m.key===state.mode).label);
});
mb$('fpProgBar').addEventListener('click',e=>{ if(!audio.duration)return; const r=e.currentTarget.getBoundingClientRect(); audio.currentTime=(e.clientX-r.left)/r.width*audio.duration; });

/* 迷你播放器 */
function updateMiniPlayer(song){
  mb$('miniPlayer').classList.remove('hidden');
  mb$('mpName').textContent=song.name;
  mb$('mpArtist').textContent=song.artist||'';
  if(song.picUrl){ mb$('mpCover').innerHTML='<img src="'+esc(song.picUrl)+'">'; }
  else { mb$('mpCover').innerHTML='<div class="ph">🎵</div>'; }
  updateFloatCover(song);
}
function updateFloatCover(song){
  const fc=mb$('fpCover');
  if(!fc) return;
  if(song.picUrl){ fc.innerHTML='<img src="'+esc(song.picUrl)+'">'; }
  else { fc.innerHTML='<div class="ph">🎵</div>'; }
  // Also update global float
  if(window.MusicBuddyApp && window.MusicBuddyApp.updateGlobalFloat) window.MusicBuddyApp.updateGlobalFloat(song);
}
mb$('mpCover').addEventListener('click',()=>openFullPlayer());
mb$('mpInfo').addEventListener('click',()=>openFullPlayer());
mb$('mpPlay').addEventListener('click',togglePlay);
mb$('mpPrev').addEventListener('click',prevTrack);
mb$('mpNext').addEventListener('click',nextTrack);

/* 全屏播放器 */
function openFullPlayer(){
  var wrap=document.querySelector('#music-buddy-page .mb-app-wrap');
  if(wrap) wrap.classList.add('fp-open');
  mbShow(mb$('fullPlayer'));
  mbHide(mb$('floatPlayer'));
  if(state.currentSongId){
    const f=findSong(state.currentSongId);
    if(f && f.song.lyrics) prepareLyrics(f.song);
  }
}
function closeFullPlayer(){
  mbHide(mb$('fullPlayer'));
  chatOpen=false; mbHide(mb$('chatCard'));
  var wrap=document.querySelector('#music-buddy-page .mb-app-wrap');
  if(wrap) wrap.classList.remove('fp-open');
  if(state.currentSongId && state.companion) mbShow(mb$('floatPlayer'));
}
mb$('fpBack').addEventListener('click',closeFullPlayer);
mb$('fpPlay').addEventListener('click',togglePlay);
mb$('fpPrev').addEventListener('click',prevTrack);
mb$('fpNext').addEventListener('click',nextTrack);
mb$('fpPlBtn').addEventListener('click',()=>openPlaylistModal());
mb$('fpDisc').addEventListener('click',()=>{ showLyrics=!showLyrics; toggleLyricsView(); });
mb$('fpLyricToggle').addEventListener('click',()=>{ showLyrics=!showLyrics; toggleLyricsView(); });
function toggleLyricsView(){
  const disc=mb$('fpDiscArea');
  const lyrics=mb$('fpLyricsArea');
  if(showLyrics){
    disc.classList.add('lyrics-hidden');
    lyrics.classList.add('lyrics-full');
  } else {
    disc.classList.remove('lyrics-hidden');
    lyrics.classList.remove('lyrics-full');
  }
}

function updateFullPlayer(song){
  mb$('fpName').textContent=song.name||'未播放';
  mb$('fpArtist').textContent=song.artist||'';
  if(song.picUrl){ mb$('fpDiscImg').src=song.picUrl; mb$('fpDiscImg').style.display='block'; }
  else { mb$('fpDiscImg').style.display='none'; }
  updateFloatCover(song);
  const fav=isFavorited(song.id);
  mb$('fpFavBtn').classList.toggle('active',fav);
  mb$('fpFavBtn2').classList.toggle('active',fav);
  prepareLyrics(song);
}

/* 收藏 */
mb$('fpFavBtn').addEventListener('click',toggleFav);
mb$('fpFavBtn2').addEventListener('click',toggleFav);
function toggleFav(){
  if(!state.currentSongId){ toast('请先播放歌曲'); return; }
  const f=findSong(state.currentSongId); if(!f) return;
  const idx=state.favorites.findIndex(x=>x.songId===f.song.id);
  if(idx>=0){ state.favorites.splice(idx,1); toast('已取消收藏'); }
  else { state.favorites.push({songId:f.song.id,song:f.song}); toast('已收藏'); }
  saveAll();
  const fav=isFavorited(f.song.id);
  mb$('fpFavBtn').classList.toggle('active',fav);
  mb$('fpFavBtn2').classList.toggle('active',fav);
  updateMineStats();
}

/* 评论 */
mb$('fpCommentBtn').addEventListener('click',()=>openCommentModal());
function getCommentAvatar(c){
  if(c.isMe){
    if(c.avatar) return '<img src="'+c.avatar+'">';
    if(state.user.avatar) return '<img src="'+state.user.avatar+'">';
    return '<div class="ph" style="background:var(--sage);color:var(--cream);font-size:12px;display:flex;align-items:center;justify-content:center;width:100%;height:100%;">我</div>';
  } else {
    if(c.avatar) return '<img src="'+c.avatar+'">';
    const partner=state.partners.find(p=>p.nick===c.nick);
    if(partner&&partner.avatar) return '<img src="'+partner.avatar+'">';
    const p=state.partners[0];
    if(p&&p.avatar) return '<img src="'+p.avatar+'">';
    return '<div class="ph" style="background:var(--terra);color:var(--cream);font-size:12px;display:flex;align-items:center;justify-content:center;width:100%;height:100%;">TA</div>';
  }
}
function openCommentModal(){
  if(!state.currentSongId){ toast('请先播放歌曲'); return; }
  const f=findSong(state.currentSongId); if(!f) return;
  const songId=f.song.id;
  const list=state.comments[songId]||[];
  mb$('commentList').innerHTML = list.length ? list.map(c=>`
    <div class="cmt-item">
      <div class="av">${getCommentAvatar(c)}</div>
      <div class="body"><div class="nick">${esc(c.nick)}</div><div class="text">${esc(c.text)}</div><div class="time">${new Date(c.time).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div></div>
    </div>`).join('') : '<div class="empty-hint">还没有评论，来说点什么吧</div>';
  mbShow(mb$('commentModal'));
  mb$('mb-commentInput').focus();
}
mb$('commentSend').addEventListener('click',async()=>{
  const text=mb$('mb-commentInput').value.trim(); if(!text){ toast('请输入评论'); return; }
  const f=findSong(state.currentSongId); if(!f) return;
  if(!state.comments[f.song.id]) state.comments[f.song.id]=[];
  state.comments[f.song.id].push({nick:state.user.nick||'我',avatar:state.user.avatar,text,time:Date.now(),isMe:true});
  saveAll();
  mb$('mb-commentInput').value='';
  openCommentModal();
  toast('评论已发送');
  // 所有对象都可以回复评论 — 从网站总字卡抽取
  for(const partner of state.partners){
    let reply=getCardOrDefault('这首歌让我想起你笑的样子。');
    state.comments[f.song.id].push({nick:partner.nick,avatar:partner.avatar,text:reply,time:Date.now(),isMe:false});
  }
  saveAll(); setTimeout(()=>openCommentModal(),600);
});
mb$('mb-commentInput').addEventListener('keypress',e=>{ if(e.key==='Enter') mb$('commentSend').click(); });

/* 聊天卡片 */
mb$('fpChatBtn').addEventListener('click',()=>{
  chatOpen=!chatOpen;
  mb$('chatCard').classList.toggle('show',chatOpen);
  if(chatOpen && state.partners.length>0){
    const p=state.partners[0];
    mb$('chatPartnerName').textContent=p.nick;
    if(p.avatar){ mb$('chatPartnerAvatar').innerHTML='<img src="'+p.avatar+'">'; }
    else { mb$('chatPartnerAvatar').innerHTML='<div class="ph">👤</div>'; }
  }
});
mb$('chatClose').addEventListener('click',()=>{ chatOpen=false; mbHide(mb$('chatCard')); });

// 表情栏切换 — 从网站表情库加载
mb$('chatEmojiBtn').addEventListener('click',()=>{
  var bar=mb$('chatEmojiBar');
  if(bar.style.display==='flex'){ bar.style.display='none'; return; }
  // 从网站表情库加载表情
  var stickers = getSiteStickers();
  if(stickers && stickers.length > 0){
    bar.innerHTML = stickers.map(function(s){
      if(typeof s === 'string'){
        return '<span class="emoji-item" data-emoji="'+s+'">'+s+'</span>';
      } else if(s.url){
        return '<span class="emoji-item" data-emoji="'+s.url+'" data-type="img"><img src="'+s.url+'" style="width:28px;height:28px;object-fit:cover;"></span>';
      } else if(s.src){
        return '<span class="emoji-item" data-emoji="'+s.src+'" data-type="img"><img src="'+s.src+'" style="width:28px;height:28px;object-fit:cover;"></span>';
      }
      return '';
    }).join('');
  } else {
    // 回退到默认表情
    var defaults=['😊','😂','🥰','😴','🎵','💕','🌙','☕','🔥','✨','🎧','🌧️'];
    bar.innerHTML = defaults.map(function(e){ return '<span class="emoji-item" data-emoji="'+e+'">'+e+'</span>'; }).join('');
  }
  bar.style.display = 'flex';
});
// 表情点击发送
mb$('chatEmojiBar').addEventListener('click',function(e){
  var item=e.target.closest('.emoji-item');
  if(!item) return;
  var emoji=item.dataset.emoji;
  var type=item.dataset.type;
  var body=mb$('chatBody');
  var myAvatar=getMyChatAvatar();
  if(type==='img'){
    body.innerHTML+='<div class="chat-msg me"><div class="chat-av">'+myAvatar+'</div><div class="bubble img-bubble"><img src="'+emoji+'" style="max-width:80px;max-height:80px;border-radius:8px;"></div></div>';
  } else {
    body.innerHTML+='<div class="chat-msg me"><div class="chat-av">'+myAvatar+'</div><div class="bubble emoji-bubble">'+emoji+'</div></div>';
  }
  body.scrollTop=body.scrollHeight;
});
// 发送图片
mb$('chatImgBtn').addEventListener('click',()=>{ mb$('chatImgFile').click(); });
mb$('chatImgFile').addEventListener('change',function(e){
  var f=e.target.files[0]; if(!f) return; if(f.size>5*1024*1024){ toast('图片需小于5MB'); return; }
  var r=new FileReader(); r.onload=function(){
    var body=mb$('chatBody');
    var myAvatar=getMyChatAvatar();
    body.innerHTML+='<div class="chat-msg me"><div class="chat-av">'+myAvatar+'</div><div class="bubble img-bubble"><img src="'+r.result+'"></div></div>';
    body.scrollTop=body.scrollHeight;
    // 对方回复
    var partner=state.partners[0];
    if(partner){
      var partnerAvatar=getPartnerChatAvatar(partner);
      var delay=800+Math.random()*1200;
      setTimeout(function(){
        var reply=getCardOrDefault('好好看！');
        body.innerHTML+='<div class="chat-msg them"><div class="chat-av">'+partnerAvatar+'</div><div class="bubble">'+esc(reply)+'</div></div>';
        body.scrollTop=body.scrollHeight;
      },delay);
    }
  }; r.readAsDataURL(f); e.target.value='';
});
// 让对方发送消息（仅字卡/表情，不发送音频/视频/图片）
mb$('chatPartnerSendBtn').addEventListener('click',function(){
  if(state.partners.length===0){ toast('请先添加对象'); return; }
  var partner=state.partners[0];
  var partnerAvatar=getPartnerChatAvatar(partner);
  var body=mb$('chatBody');
  var r=Math.random();
  if(r<0.7){
    // 70% 发送字卡
    var card=getCardOrDefault('这首歌好像我们的故事。');
    body.innerHTML+='<div class="chat-msg them"><div class="chat-av">'+partnerAvatar+'</div><div class="bubble">'+esc(card)+'</div></div>';
  } else {
    // 30% 发送表情（从网站表情库）
    var stickers=getSiteStickers();
    var emoji;
    if(stickers && stickers.length>0){
      var pick=stickers[Math.floor(Math.random()*stickers.length)];
      if(typeof pick==='string'){ emoji=pick; body.innerHTML+='<div class="chat-msg them"><div class="chat-av">'+partnerAvatar+'</div><div class="bubble emoji-bubble">'+emoji+'</div></div>'; }
      else if(pick.url||pick.src){ var surl=pick.url||pick.src; body.innerHTML+='<div class="chat-msg them"><div class="chat-av">'+partnerAvatar+'</div><div class="bubble img-bubble"><img src="'+surl+'" style="max-width:80px;max-height:80px;border-radius:8px;"></div></div>'; }
    } else {
      var defaults=['😊','🥰','😴','🎵','💕','🌙','☕','🔥','✨','🎧','🌧️','😂','🤔','👀','💅'];
      emoji=defaults[Math.floor(Math.random()*defaults.length)];
      body.innerHTML+='<div class="chat-msg them"><div class="chat-av">'+partnerAvatar+'</div><div class="bubble emoji-bubble">'+emoji+'</div></div>';
    }
  }
  body.scrollTop=body.scrollHeight;
});
// 聊天发送
mb$('chatSend').addEventListener('click',function(){
  const text=mb$('chatInput').value.trim(); if(!text) return;
  const body=mb$('chatBody');
  const myAvatar=getMyChatAvatar();
  body.innerHTML+='<div class="chat-msg me"><div class="chat-av">'+myAvatar+'</div><div class="bubble">'+esc(text)+'</div></div>';
  mb$('chatInput').value='';
  body.scrollTop=body.scrollHeight;
  const partner=state.partners[0];
  const partnerAvatar=getPartnerChatAvatar(partner);
  const rMinMs = (state.user.replyMin || 3) * (state.user.replyMinUnit || 60) * 1000;
  const rMaxMs = (state.user.replyMax || 10) * (state.user.replyMaxUnit || 60) * 1000;
  const delay = Math.max(800, rMinMs + Math.random() * (rMaxMs - rMinMs));
  const reply=getCardOrDefault('我也在想这首歌。');
  setTimeout(()=>{ body.innerHTML+='<div class="chat-msg them"><div class="chat-av">'+partnerAvatar+'</div><div class="bubble">'+esc(reply)+'</div></div>'; body.scrollTop=body.scrollHeight; },delay);
});
mb$('chatInput').addEventListener('keypress',e=>{ if(e.key==='Enter') mb$('chatSend').click(); });

// 辅助函数
function getMyChatAvatar(){
  return state.user.avatar?'<img src="'+state.user.avatar+'">':'<div class="ph" style="background:var(--sage);color:var(--cream);font-size:10px;display:flex;align-items:center;justify-content:center;width:100%;height:100%;">我</div>';
}
function getPartnerChatAvatar(partner){
  return partner&&partner.avatar?'<img src="'+partner.avatar+'">':'<div class="ph" style="background:var(--terra);color:var(--cream);font-size:10px;display:flex;align-items:center;justify-content:center;width:100%;height:100%;">TA</div>';
}

/* 歌词 */
function parseLrc(raw){
  if(!raw) return {synced:false,lines:[]};
  const lines=[]; const re=/\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
  raw.split(/\r?\n/).forEach(line=>{
    const ms=[...line.matchAll(re)]; const text=line.replace(re,'').trim();
    if(ms.length===0){ if(text) lines.push({time:-1,text}); }
    else ms.forEach(m=>{ const t=parseInt(m[1])*60+parseInt(m[2])+(m[3]?parseInt(m[3])/(m[3].length===3?1000:100):0); if(text) lines.push({time:t,text}); });
  });
  const hasTime=lines.some(l=>l.time>=0);
  return {synced:hasTime,lines:hasTime?lines.filter(l=>l.time>=0).sort((a,b)=>a.time-b.time):lines};
}
function prepareLyrics(song){
  lyricData=parseLrc(song.lyrics||'');
  if(!mb$('fullPlayer').classList.contains('show')) return;
  if(!lyricData||lyricData.lines.length===0){
    mb$('fpLyricsScroll').innerHTML='<div class="fp-lyrics-empty">暂无歌词</div>';
    lyricEls=[]; return;
  }
  mb$('fpLyricsScroll').innerHTML=lyricData.lines.map((l,i)=>'<div class="fp-lyric-line" data-i="'+i+'">'+esc(l.text)+'</div>').join('');
  lyricEls=[...mb$('fpLyricsScroll').querySelectorAll('.fp-lyric-line')];
  lyricEls.forEach((el,i)=>el.addEventListener('click',()=>{ if(lyricData.synced&&lyricData.lines[i].time>=0&&audio.duration) audio.currentTime=lyricData.lines[i].time; }));
  updateLyrics();
}
function updateLyrics(){
  if(!mb$('fullPlayer').classList.contains('show')||!lyricData||!lyricEls.length) return;
  let cur=-1;
  if(lyricData.synced){ for(let i=0;i<lyricData.lines.length;i++){ if(lyricData.lines[i].time<=audio.currentTime) cur=i; else break; } }
  else if(audio.duration){ cur=Math.min(lyricData.lines.length-1,Math.floor(audio.currentTime/audio.duration*lyricData.lines.length)); }
  if(cur<0) return;
  lyricEls.forEach((el,i)=>el.classList.toggle('active',i===cur));
  const el=lyricEls[cur];
  if(el) mb$('fpLyricsScroll').scrollTo({top:el.offsetTop-mb$('fpLyricsScroll').clientHeight/2+el.clientHeight/2,behavior:'smooth'});
}

/* ============ 搜索 ============ */
async function doSearch(kw){
  if(!kw){ toast('请输入关键词'); return; }
  mb$('searchResults').innerHTML='<div class="sr-loading">搜索中…</div>';
  if(proxyOnline){
    try{ const d=await apiPost('/api/search',{keywords:kw,limit:20}); renderSearchResults(d.songs||[]); return; }catch(e){}
  }
  try{ const proxied='https://api.allorigins.win/raw?url='+encodeURIComponent('https://music.163.com/api/search/get?s='+encodeURIComponent(kw)+'&type=1&limit=20&offset=0');
    const res=await fetch(proxied,{signal:AbortSignal.timeout(10000)}); const d=await res.json();
    const list=(d.result&&d.result.songs)||[];
    renderSearchResults(list.map(s=>({id:s.id,name:s.name,artist:(s.artists||[]).map(a=>a.name).join('/'),album:(s.album||{}).name||'',picUrl:(s.album||{}).picUrl||(s.album||{}).picUrl||'',duration:s.duration})));
  }catch(e){ mb$('searchResults').innerHTML='<div class="sr-loading">搜索失败，请设置API地址</div>'; }
}
function renderSearchResults(songs){
  if(!songs.length){ mb$('searchResults').innerHTML='<div class="sr-loading">未找到相关歌曲</div>'; return; }
  mb$('searchResults').innerHTML=songs.map((s,i)=>`
    <div class="sr-item" data-id="${s.id}" data-name="${esc(s.name)}" data-artist="${esc(s.artist||'')}" data-pic-url="${s.picUrl||''}">
      <div class="sr-num">${String(i+1).padStart(2,'0')}</div>
      <div class="sr-info"><div class="sr-name">${esc(s.name)}</div><div class="sr-meta">${esc(s.artist||'')}${s.album?' · '+esc(s.album):''}</div></div>
      <button class="sr-add">＋</button>
    </div>`).join('');
  mb$('searchResults').querySelectorAll('.sr-item').forEach(el=>{
    el.addEventListener('click',()=>{
      const song={id:uid(),name:el.dataset.name,artist:el.dataset.artist,neteaseId:el.dataset.id,type:'netease',src:'https://music.163.com/song/media/outer/url?id='+el.dataset.id+'.mp3',picUrl:el.dataset.picUrl||'',lyrics:''};
      playSong(song);
    });
  });
}
mb$('searchBtn').addEventListener('click',()=>doSearch(mb$('mb-searchInput').value.trim()));
mb$('mb-searchInput').addEventListener('keypress',e=>{ if(e.key==='Enter') doSearch(mb$('mb-searchInput').value.trim()); });
mbRoot.querySelectorAll('.cat-card').forEach(c=>c.addEventListener('click',()=>{ mb$('mb-searchInput').value=c.dataset.kw; doSearch(c.dataset.kw); }));

/* ============ 我的页 ============ */
function updateMine(){
  if(state.user.avatar){ mb$('mineAvatar').innerHTML='<img src="'+state.user.avatar+'">'; }
  else { mb$('mineAvatar').innerHTML='<div class="ph">＋</div>'; }
  mb$('mineNick').textContent=state.user.nick;
  mb$('mineSig').textContent=state.user.signature;
  const settingsIcon='<div class="mine-settings" id="mineSettingsBtn" title="设置"><svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84a.484.484 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.488.488 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.27.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 15.6 12 3.6 3.6 0 0 1 12 15.6z"/></svg></div>';
  const uploadIcon='<div class="mine-bg-upload" id="bgUploadBtn"><svg viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg></div>';
  if(state.user.background){
    mb$('mineBg').innerHTML='<img src="'+state.user.background+'"><div class="gradient"></div>'+settingsIcon+uploadIcon;
  } else {
    mb$('mineBg').innerHTML=settingsIcon+uploadIcon;
  }
  bindMineAvatar();
  bindBgUpload();
  bindSettingsBtn();
  updateMineStats();
  renderMinePlaylists();
  renderHistory();
  renderFavoritesScroll();
  mb$('apiUrlInput').value = state.apiUrl || '';
}
['statFav','statPl','statHistory'].forEach(id=>{
  mb$(id).addEventListener('click',()=>{
    const tab=mb$(id).dataset.tab;
    mb$('favSection').style.display=tab==='fav'?'block':'none';
  });
});
function updateMineStats(){
  mb$('favCount').textContent=state.favorites.length;
  mb$('plCount').textContent=state.user.playlists.length;
  mb$('historyCount').textContent=state.user.history.length;
}

/* 歌单列表 - 图4横向卡片 */
function renderMinePlaylists(){
  if(!state.user.playlists.length){ mb$('plList').innerHTML='<div class="empty-hint">还没有歌单<br>点击上方按钮创建</div>'; return; }
  mb$('plList').innerHTML=state.user.playlists.map(p=>`
    <div class="pl-card" data-id="${p.id}">
      <div class="pl-cover">${p.cover?'<img src="'+p.cover+'">':'<div class="ph">🎵</div>'}</div>
      <div class="pl-info">
        <div class="pl-name">${esc(p.name)}</div>
        <div class="pl-count">${p.songs.length}首</div>
      </div>
      <span class="pl-del" data-del="${p.id}" style="color:var(--terra);padding:8px;font-size:16px;cursor:pointer;">✕</span>
    </div>`).join('');
  mb$('plList').querySelectorAll('.pl-card').forEach(el=>{
    el.addEventListener('click',e=>{
      if(e.target.dataset.del){ deletePlaylist(e.target.dataset.del); return; }
      state.currentPlId=el.dataset.id; saveAll();
      openPlaylistModal();
    });
  });
}
function deletePlaylist(id){
  const pl=state.user.playlists.find(p=>p.id===id);
  if(!pl) return;
  if(pl.songs.length>0 && !confirm('确定删除歌单「'+pl.name+'」吗？')) return;
  const i=state.user.playlists.findIndex(p=>p.id===id);
  if(i>=0) state.user.playlists.splice(i,1);
  saveAll(); renderMinePlaylists(); updateMineStats();
  toast('歌单已删除');
}

function renderHistory(){
  const el=mb$('historyList');
  const hCount=mb$('historySectionCount'); if(hCount) hCount.textContent=state.user.history.length;
  if(!state.user.history.length){ el.innerHTML='<div class="empty-hint">还没有听歌记录</div>'; return; }
  el.innerHTML=state.user.history.slice(0,30).map((s,i)=>`
    <div class="song-item" data-id="${s.id}">
      <div class="si-num">${String(i+1).padStart(2,'0')}</div>
      <div class="si-info"><div class="si-name ${s.id===state.currentSongId?'playing':''}">${esc(s.name)}</div><div class="si-artist">${esc(s.artist||'')}</div></div>
    </div>`).join('');
  el.querySelectorAll('.song-item').forEach(c=>c.addEventListener('click',()=>playSongById(c.dataset.id)));
}
function renderFavoritesScroll(){
  const el=mb$('favScroll');
  if(!state.favorites.length){ el.innerHTML='<div class="empty-hint">还没有收藏歌曲</div>'; return; }
  el.innerHTML=state.favorites.map(f=>{
    const s=f.song||f;
    return `<div class="daily-card" data-id="${s.id}">
      <div class="cover">${s.picUrl?'<img src="'+s.picUrl+'" style="width:100%;height:100%;object-fit:cover">':'<div class="emoji">♥</div>'}</div>
      <div class="info"><div class="name">${esc(s.name)}</div><div class="artist">${esc(s.artist||'')}</div></div>
    </div>`;
  }).join('');
  el.querySelectorAll('.daily-card').forEach(c=>c.addEventListener('click',()=>{
    const f=state.favorites.find(x=>(x.song||x).id===c.dataset.id);
    if(f) playSong(f.song||f);
  }));
}
function playSongById(id){
  const f=findSong(id); if(f) playSong(f.song);
}

/* 新建歌单 */
mb$('newPlBtn').addEventListener('click',()=>{
  pendingPlCover=null;
  mb$('newPlName').value='';
  mb$('plCoverUpload').querySelector('.preview').innerHTML='<div class="ph">＋</div>';
  mbShow(mb$('newPlModal'));
  mb$('newPlName').focus();
});
mb$('plCoverUpload').addEventListener('click',()=>mb$('plCoverFile').click());
mb$('plCoverFile').addEventListener('change',e=>{
  const f=e.target.files[0]; if(!f) return; if(f.size>3*1024*1024){ toast('图片需小于3MB'); return; }
  const r=new FileReader(); r.onload=()=>{
    pendingPlCover=r.result;
    mb$('plCoverUpload').querySelector('.preview').innerHTML='<img src="'+r.result+'">';
  }; r.readAsDataURL(f); e.target.value='';
});
mb$('createPlBtn').addEventListener('click',()=>{
  const name=mb$('newPlName').value.trim(); if(!name){ toast('请输入歌单名称'); return; }
  const pl={id:uid(),name:name,cover:pendingPlCover,songs:[]};
  state.user.playlists.push(pl); state.currentPlId=pl.id; saveAll();
  mbHide(mb$('newPlModal'));
  renderMinePlaylists(); updateMineStats();
  toast('歌单「'+name+'」已创建');
});

/* 头像/背景上传 — 直接绑定 + 事件委托双保险 */
function bindMineAvatar(){
  var el = mb$('mineAvatar');
  if(el && !el.dataset.mbBound){
    el.dataset.mbBound = '1';
    el.addEventListener('click',function(e){
      e.stopPropagation();
      var af = mb$('avatarFile');
      if(af) af.click();
    });
  }
}
bindMineAvatar();
mb$('avatarFile').addEventListener('change',function(e){
  var f=e.target.files[0]; if(!f) return; if(f.size>3*1024*1024){ toast('图片需小于3MB'); return; }
  var r=new FileReader(); r.onload=function(){ state.user.avatar=r.result; saveAll(); updateMine(); toast('头像已更新'); }; r.readAsDataURL(f); e.target.value='';
});
function bindBgUpload(){
  var btn = mb$('bgUploadBtn');
  if(btn && !btn.dataset.mbBound){
    btn.dataset.mbBound = '1';
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var bf = mb$('bgFile');
      if(bf) bf.click();
    });
  }
}
mb$('bgFile').addEventListener('change',function(e){
  var f=e.target.files[0]; if(!f) return; if(f.size>5*1024*1024){ toast('图片需小于5MB'); return; }
  var r=new FileReader(); r.onload=function(){ state.user.background=r.result; saveAll(); updateMine(); toast('背景已更新'); }; r.readAsDataURL(f); e.target.value='';
});

/* 设置 */
function openSettings(){
  mbShow(mb$('settingsModal'));
  mb$('recIntervalMinVal').value = state.user.recIntervalMin || 30;
  mb$('recIntervalMinUnit').value = state.user.recIntervalMinUnit || 60;
  mb$('recIntervalMaxVal').value = state.user.recIntervalMax || 120;
  mb$('recIntervalMaxUnit').value = state.user.recIntervalMaxUnit || 60;
  mb$('partnerCommentMinVal').value = state.user.partnerCommentMin || 30;
  mb$('partnerCommentMinUnit').value = state.user.partnerCommentMinUnit || 60;
  mb$('partnerCommentMaxVal').value = state.user.partnerCommentMax || 120;
  mb$('partnerCommentMaxUnit').value = state.user.partnerCommentMaxUnit || 60;
  mb$('partnerChatMinVal').value = state.user.partnerChatMin || 30;
  mb$('partnerChatMinUnit').value = state.user.partnerChatMinUnit || 60;
  mb$('partnerChatMaxVal').value = state.user.partnerChatMax || 120;
  mb$('partnerChatMaxUnit').value = state.user.partnerChatMaxUnit || 60;
  mb$('replyMinVal').value = state.user.replyMin || 3;
  mb$('replyMinUnit').value = state.user.replyMinUnit || 60;
  mb$('replyMaxVal').value = state.user.replyMax || 10;
  mb$('replyMaxUnit').value = state.user.replyMaxUnit || 60;
  mb$('settingsNickInput').value = state.user.nick || '';
}
function closeSettings(){ mbHide(mb$('settingsModal')); }
function saveSettings(){
  let minVal = parseInt(mb$('recIntervalMinVal').value, 10) || 30;
  const minUnit = parseInt(mb$('recIntervalMinUnit').value, 10) || 60;
  let maxVal = parseInt(mb$('recIntervalMaxVal').value, 10) || 120;
  const maxUnit = parseInt(mb$('recIntervalMaxUnit').value, 10) || 60;
  // 确保 min <= max
  var minMs = minVal * minUnit * 1000;
  var maxMs = maxVal * maxUnit * 1000;
  if(minMs > maxMs){ var t=minMs; minMs=maxMs; maxMs=t; }
  state.user.recIntervalMin = minVal;
  state.user.recIntervalMinUnit = minUnit;
  state.user.recIntervalMax = maxVal;
  state.user.recIntervalMaxUnit = maxUnit;
  // 对方主动评论间隔
  state.user.partnerCommentMin = parseInt(mb$('partnerCommentMinVal').value, 10) || 30;
  state.user.partnerCommentMinUnit = parseInt(mb$('partnerCommentMinUnit').value, 10) || 60;
  state.user.partnerCommentMax = parseInt(mb$('partnerChatMaxVal').value, 10) || 120;
  state.user.partnerCommentMaxUnit = parseInt(mb$('partnerCommentMaxUnit').value, 10) || 60;
  // 对方主动聊天间隔
  state.user.partnerChatMin = parseInt(mb$('partnerChatMinVal').value, 10) || 30;
  state.user.partnerChatMinUnit = parseInt(mb$('partnerChatMinUnit').value, 10) || 60;
  state.user.partnerChatMax = parseInt(mb$('partnerChatMaxVal').value, 10) || 120;
  state.user.partnerChatMaxUnit = parseInt(mb$('partnerChatMaxUnit').value, 10) || 60;
  // 对方回复间隔
  let replyMin = parseInt(mb$('replyMinVal').value, 10) || 3;
  const replyMinUnit = parseInt(mb$('replyMinUnit').value, 10) || 60;
  let replyMax = parseInt(mb$('replyMaxVal').value, 10) || 10;
  const replyMaxUnit = parseInt(mb$('replyMaxUnit').value, 10) || 60;
  if(replyMin * replyMinUnit > replyMax * replyMaxUnit){ replyMin = replyMax; replyMax = replyMin; mb$('replyMinVal').value = replyMin; mb$('replyMaxVal').value = replyMax; }
  state.user.replyMin = replyMin;
  state.user.replyMinUnit = replyMinUnit;
  state.user.replyMax = replyMax;
  state.user.replyMaxUnit = replyMaxUnit;
  state.user.nick = mb$('settingsNickInput').value.trim() || '我的音乐';
  saveAll();
  updateMine();
  restartPartnerTimer();
  closeSettings();
  toast('设置已保存');
}
function bindSettingsBtn(){
  const btn=mb$('mineSettingsBtn'); if(btn) btn.addEventListener('click', openSettings);
}
mb$('settingsClose').addEventListener('click', closeSettings);
mb$('settingsSaveBtn').addEventListener('click', saveSettings);

/* 签名编辑 */
mb$('mineSig').addEventListener('click',()=>{ mb$('sigInput').value=state.user.signature; mbShow(mb$('sigModal')); mb$('sigInput').focus(); });
mb$('sigSaveBtn').addEventListener('click',()=>{ state.user.signature=mb$('sigInput').value.trim()||'点击编辑签名'; saveAll(); updateMine(); mbHide(mb$('sigModal')); toast('签名已保存'); });
mb$('sigRandomBtn').addEventListener('click',async()=>{
  mb$('sigInput').value=getCardOrDefault('想被阳光晒透，连同心事一起晾干。');
});

/* API设置 */
mb$('apiSaveBtn').addEventListener('click',async()=>{
  const url=mb$('apiUrlInput').value.trim().replace(/\/$/,'');
  state.apiUrl=url; saveAll();
  toast('API地址已保存，正在检测…');
  await checkProxy();
  if(proxyOnline){ loadDaily(); loadRecommendAll(); }
});

/* ============ 扫码登录 ============ */
let qrTimer = null;
function stopQrPolling(){
  if(qrTimer){ clearInterval(qrTimer); qrTimer=null; }
}
function openQrLogin(){
  mbShow(mb$('qrModal'));
  mb$('qrNickname').style.display='none';
  mb$('qrRefresh').style.display='none';
  mb$('qrHint').textContent='加载中...';
  mb$('qrStatus').textContent='正在获取二维码...';
  mb$('qrCanvas').getContext('2d').clearRect(0,0,200,200);
  loadQrCode();
}
async function loadQrCode(){
  stopQrPolling();
  try {
    const apiUrl = state.apiUrl || location.origin;
    const resp = await fetch(apiUrl+'/api/qr/key');
    const data = await resp.json();
    if(data.error){ mb$('qrStatus').textContent='获取失败: '+data.error; return; }
    const key = data.key;
    const qrUrl = data.qrUrl;
    generateQR(qrUrl, mb$('qrCanvas'), 200);
    mb$('qrHint').textContent='请使用网易云音乐APP扫描二维码';
    mb$('qrStatus').textContent='等待扫码...';
    // 轮询
    qrTimer = setInterval(async ()=>{
      try {
        const r2 = await fetch(apiUrl+'/api/qr/check?key='+encodeURIComponent(key));
        const d2 = await r2.json();
        if(d2.code === 803){
          stopQrPolling();
          mb$('qrStatus').textContent='登录成功！';
          mb$('qrHint').style.display='none';
          mb$('qrNickname').textContent='欢迎，'+(d2.nickname||'');
          mb$('qrNickname').style.display='block';
          mb$('qrRefresh').style.display='block';
          toast('网易云登录成功！VIP歌曲现在可以播放了');
        } else if(d2.code === 800){
          stopQrPolling();
          mb$('qrStatus').textContent='二维码已过期';
          mb$('qrRefresh').style.display='block';
        } else if(d2.code === 802){
          mb$('qrStatus').textContent='已扫码，请在手机上确认';
        }
      } catch(e){}
    }, 3000);
  } catch(e){
    mb$('qrStatus').textContent='网络错误';
  }
}
mb$('qrLoginBtn').addEventListener('click', openQrLogin);
mb$('qrClose').addEventListener('click',()=>{ mbHide(mb$('qrModal')); stopQrPolling(); });
mb$('qrRefresh').addEventListener('click', loadQrCode);

/* ============ 歌单弹窗 ============ */
function openPlaylistModal(){
  const pl=state.user.playlists.find(p=>p.id===state.currentPlId)||state.user.playlists[0];
  mb$('plModalTitle').innerHTML=esc(pl.name)+' <button class="add-pl" id="addSongBtn" style="margin-left:8px;padding:4px 10px;font-size:11px;">＋ 添加歌曲</button>';
  if(!pl.songs.length){ mb$('plModalBody').innerHTML='<div class="empty-hint">歌单还是空的<br>点击上方按钮添加歌曲</div>'; }
  else {
    mb$('plModalBody').innerHTML=pl.songs.map((s,i)=>`
      <div class="plm-item" data-id="${s.id}">
        <div class="num">${String(i+1).padStart(2,'0')}</div>
        <div class="info"><div class="name ${s.id===state.currentSongId?'playing':''}">${esc(s.name)}</div><div class="meta">${esc(s.artist||'')}</div></div>
        <span class="del" data-del="${s.id}">✕</span>
      </div>`).join('');
    mb$('plModalBody').querySelectorAll('.plm-item').forEach(el=>{
      el.addEventListener('click',e=>{
        if(e.target.dataset.del){ removeSongFromPlaylist(e.target.dataset.del); return; }
        playSongById(el.dataset.id); mbHide(mb$('playlistModal'));
      });
    });
  }
  mbShow(mb$('playlistModal'));
  // 绑定添加歌曲按钮
  const addBtn=mb$('addSongBtn');
  if(addBtn) addBtn.addEventListener('click',()=>{
    currentAddSongPl=pl.id;
    mbHide(mb$('playlistModal'));
    openAddSongModal();
  });
}
function removeSongFromPlaylist(id){
  const pl=state.user.playlists.find(p=>p.id===state.currentPlId);
  if(!pl) return;
  const i=pl.songs.findIndex(s=>s.id===id); if(i<0) return;
  pl.songs.splice(i,1); saveAll(); openPlaylistModal(); renderMinePlaylists(); updateMineStats();
}
/* 打开对方推荐的歌单 */
function openRecPlaylist(plid){
  const p=state.partners[0]; if(!p) return;
  const pl=(p.recommendedPlaylists||[]).find(x=>x.id===plid);
  if(!pl) return;
  mb$('plModalTitle').innerHTML=esc(pl.name)+' <span style="font-size:12px;color:var(--ink3)">来自 '+esc(p.nick)+'</span>';
  if(!pl.songs.length){ mb$('plModalBody').innerHTML='<div class="empty-hint">歌单还是空的</div>'; }
  else {
    mb$('plModalBody').innerHTML=pl.songs.map((s,i)=>`
      <div class="plm-item" data-index="${i}">
        <div class="num">${String(i+1).padStart(2,'0')}</div>
        <div class="info"><div class="name">${esc(s.name)}</div><div class="meta">${esc(s.artist||'')}</div></div>
      </div>`).join('');
    mb$('plModalBody').querySelectorAll('.plm-item').forEach(el=>{
      el.addEventListener('click',()=>{
        const idx=parseInt(el.dataset.index);
        const s=pl.songs[idx];
        const song={id:uid(),name:s.name,artist:s.artist,neteaseId:s.neteaseId||s.id,picUrl:s.picUrl||'',type:'netease',src:s.src||'https://music.163.com/song/media/outer/url?id='+(s.neteaseId||s.id)+'.mp3',lyrics:''};
        playSong(song);
        mbHide(mb$('playlistModal'));
      });
    });
  }
  // 添加播放全部按钮
  if(pl.songs.length){
    const allBtn=document.createElement('button');
    allBtn.className='btn-primary';
    allBtn.style.cssText='width:100%;margin-top:12px;';
    allBtn.textContent='▶ 播放全部';
    allBtn.onclick=()=>{
      if(pl.songs.length){
        const s=pl.songs[0];
        const song={id:uid(),name:s.name,artist:s.artist,neteaseId:s.neteaseId||s.id,picUrl:s.picUrl||'',type:'netease',src:s.src||'https://music.163.com/song/media/outer/url?id='+(s.neteaseId||s.id)+'.mp3',lyrics:''};
        playSong(song);
        // 将剩余歌曲加入队列
        for(let i=1;i<pl.songs.length;i++){
          const ns=pl.songs[i];
          state.queue.push({id:uid(),name:ns.name,artist:ns.artist,neteaseId:ns.neteaseId||ns.id,picUrl:ns.picUrl||'',type:'netease',src:ns.src||'https://music.163.com/song/media/outer/url?id='+(ns.neteaseId||ns.id)+'.mp3',lyrics:''});
        }
        mbHide(mb$('playlistModal'));
      }
    };
    mb$('plModalBody').appendChild(allBtn);
  }
  mbShow(mb$('playlistModal'));
}

/* ============ 添加歌曲弹窗 ============ */
function openAddSongModal(){
  mb$('addSongContent').innerHTML = `
    <div id="addSongNetease">
      <div class="form-row" style="margin-bottom:8px">
        <input type="text" id="neteaseIdInput" placeholder="输入网易云歌曲ID（如 186016）">
      </div>
      <div class="form-row" style="margin-bottom:0">
        <div class="upload-box" id="neteaseCoverUpload" style="padding:16px;display:flex;align-items:center;gap:12px;">
          <div class="ph" style="width:40px;height:40px;border-radius:8px;overflow:hidden;background:var(--bg2);flex-shrink:0;font-size:20px;display:flex;align-items:center;justify-content:center">🎵</div>
          <span style="font-size:12px;color:var(--ink3)">上传封面（可选，不传则用网易云封面）</span>
          <input type="file" id="neteaseCoverInput" accept="image/*" style="display:none">
        </div>
      </div>
      <button class="btn-primary" id="addNeteaseBtn" style="margin-top:12px">添加</button>
    </div>`;
  bindAddSongEvents();
  // 绑定网易云封面上传
  const ncu=mb$('neteaseCoverUpload');
  if(ncu){
    ncu.addEventListener('click',()=>mb$('neteaseCoverInput').click());
    mb$('neteaseCoverInput').addEventListener('change',e=>{
      const f=e.target.files[0]; if(!f) return;
      const r=new FileReader(); r.onload=()=>{
        ncu.querySelector('.ph').innerHTML='<img src="'+r.result+'" style="width:100%;height:100%;object-fit:cover">';
      }; r.readAsDataURL(f); e.target.value='';
    });
  }
  mbShow(mb$('addSongModal'));
  renderAddedList();
}
function bindAddSongEvents(){
  mbRoot.querySelectorAll('.add-song-tab').forEach(t=>{
    t.addEventListener('click',()=>{
      mbRoot.querySelectorAll('.add-song-tab').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      const tab=t.dataset.tab;
      if(tab==='netease'){
        mb$('addSongContent').innerHTML=`
          <div class="form-row" style="margin-bottom:8px">
            <input type="text" id="neteaseIdInput" placeholder="输入网易云歌曲ID（如 186016）">
          </div>
          <div class="form-row" style="margin-bottom:0">
            <div class="upload-box" id="neteaseCoverUpload" style="padding:16px;display:flex;align-items:center;gap:12px;">
              <div class="ph" style="width:40px;height:40px;border-radius:8px;overflow:hidden;background:var(--bg2);flex-shrink:0;font-size:20px;display:flex;align-items:center;justify-content:center">🎵</div>
              <span style="font-size:12px;color:var(--ink3)">上传封面（可选，不传则用网易云封面）</span>
              <input type="file" id="neteaseCoverInput" accept="image/*" style="display:none">
            </div>
          </div>
          <button class="btn-primary" id="addNeteaseBtn" style="margin-top:12px">添加</button>`;
        mb$('addNeteaseBtn').addEventListener('click',addNeteaseSong);
        mb$('neteaseCoverUpload').addEventListener('click',()=>mb$('neteaseCoverInput').click());
        mb$('neteaseCoverInput').addEventListener('change',e=>{
          const f=e.target.files[0]; if(!f) return;
          const r=new FileReader(); r.onload=()=>{
            mb$('neteaseCoverUpload').querySelector('.ph').innerHTML='<img src="'+r.result+'" style="width:100%;height:100%;object-fit:cover">';
          }; r.readAsDataURL(f); e.target.value='';
        });
      } else if(tab==='url'){
        mb$('addSongContent').innerHTML=`
          <div class="form-row" style="margin-bottom:8px">
            <input type="text" id="urlSongName" placeholder="歌曲名称">
          </div>
          <div class="form-row" style="margin-bottom:8px">
            <input type="text" id="urlSongArtist" placeholder="歌手（可选）">
          </div>
          <div class="form-row" style="margin-bottom:8px">
            <input type="url" id="urlSongSrc" placeholder="音频URL（如 https://...mp3）">
          </div>
          <div class="form-row" style="margin-bottom:0">
            <div class="upload-box" id="urlCoverUpload" style="padding:16px;display:flex;align-items:center;gap:12px;">
              <div class="ph" style="width:40px;height:40px;border-radius:8px;overflow:hidden;background:var(--bg2);flex-shrink:0;font-size:20px;display:flex;align-items:center;justify-content:center">🎵</div>
              <span style="font-size:12px;color:var(--ink3)">上传封面（可选）</span>
              <input type="file" id="urlCoverInput" accept="image/*" style="display:none">
            </div>
          </div>
          <button class="btn-primary" id="addUrlBtn" style="margin-top:12px">添加</button>`;
        mb$('addUrlBtn').addEventListener('click',addUrlSong);
        let pendingUrlCover=null;
        mb$('urlCoverUpload').addEventListener('click',()=>mb$('urlCoverInput').click());
        mb$('urlCoverInput').addEventListener('change',e=>{
          const f=e.target.files[0]; if(!f) return;
          const r=new FileReader(); r.onload=()=>{
            pendingUrlCover=r.result;
            mb$('urlCoverUpload').querySelector('.ph').innerHTML='<img src="'+r.result+'" style="width:100%;height:100%;object-fit:cover">';
          }; r.readAsDataURL(f); e.target.value='';
        });
      } else if(tab==='file'){
        mb$('addSongContent').innerHTML=`
          <div class="upload-box" id="songFileUpload" style="padding:30px">
            <div class="ph" style="font-size:32px">📁</div>
            <span style="font-size:13px;color:var(--ink3)">点击选择音频文件</span>
            <input type="file" id="songFileInput" accept="audio/*" style="display:none" multiple>
          </div>
          <div style="margin-top:8px;font-size:11px;color:var(--ink3)">支持MP3、WAV等格式，可选择多个文件</div>
          <div class="form-row" style="margin-top:12px;margin-bottom:0">
            <div class="upload-box" id="fileCoverUpload" style="padding:16px;display:flex;align-items:center;gap:12px;">
              <div class="ph" style="width:40px;height:40px;border-radius:8px;overflow:hidden;background:var(--bg2);flex-shrink:0;font-size:20px;display:flex;align-items:center;justify-content:center">🎵</div>
              <span style="font-size:12px;color:var(--ink3)">为所有歌曲上传封面（可选）</span>
              <input type="file" id="fileCoverInput" accept="image/*" style="display:none">
            </div>
          </div>`;
        mb$('songFileUpload').addEventListener('click',()=>mb$('songFileInput').click());
        mb$('songFileInput').addEventListener('change',addFileSongs);
        mb$('fileCoverUpload').addEventListener('click',()=>mb$('fileCoverInput').click());
        mb$('fileCoverInput').addEventListener('change',e=>{
          const f=e.target.files[0]; if(!f) return;
          const r=new FileReader(); r.onload=()=>{
            mb$('fileCoverUpload').querySelector('.ph').innerHTML='<img src="'+r.result+'" style="width:100%;height:100%;object-fit:cover">';
          }; r.readAsDataURL(f); e.target.value='';
        });
      }
    });
  });
  // 网易云ID默认绑定
  if(mb$('addNeteaseBtn')) mb$('addNeteaseBtn').addEventListener('click',addNeteaseSong);
}

async function addNeteaseSong(){
  const id=mb$('neteaseIdInput').value.trim();
  if(!id){ toast('请输入歌曲ID'); return; }
  if(!proxyOnline){ toast('请先连接API'); return; }
  toast('正在获取歌曲信息…');
  const coverImg=mbRoot.querySelector('#neteaseCoverUpload img');
  const manualCover=coverImg?coverImg.src:'';
  try{
    const detail=await apiGet('/api/song/detail?id='+id);
    const d=detail.detail;
    const song={id:uid(),name:d.name,artist:d.artist,neteaseId:id,type:'netease',
      src:'https://music.163.com/song/media/outer/url?id='+id+'.mp3',
      picUrl:manualCover||d.picUrl,lyrics:''};
    addSongToPlaylist(song);
    mb$('neteaseIdInput').value='';
    if(mb$('neteaseCoverUpload').querySelector('.ph')) mb$('neteaseCoverUpload').querySelector('.ph').innerHTML='🎵';
  }catch(e){ toast('获取失败，请检查ID'); }
}
function addUrlSong(){
  const name=mb$('urlSongName').value.trim();
  const src=mb$('urlSongSrc').value.trim();
  if(!name||!src){ toast('请输入名称和URL'); return; }
  const artist=mb$('urlSongArtist').value.trim();
  const coverImg=mbRoot.querySelector('#urlCoverUpload img');
  const song={id:uid(),name,artist:artist||'未知',type:'url',src,picUrl:coverImg?coverImg.src:'',lyrics:''};
  addSongToPlaylist(song);
  mb$('urlSongName').value=''; mb$('urlSongArtist').value=''; mb$('urlSongSrc').value='';
  if(mb$('urlCoverUpload').querySelector('.ph')) mb$('urlCoverUpload').querySelector('.ph').innerHTML='🎵';
}
function addFileSongs(e){
  const files=e.target.files;
  const coverImg=mbRoot.querySelector('#fileCoverUpload img');
  const fileCover=coverImg?coverImg.src:'';
  Array.from(files).forEach(f=>{
    if(f.size>20*1024*1024){ toast(f.name+' 超过20MB，已跳过'); return; }
    const r=new FileReader();
    r.onload=()=>{
      const song={id:uid(),name:f.name.replace(/\.[^.]+$/,''),artist:'本地文件',type:'file',src:r.result,picUrl:fileCover,lyrics:''};
      addSongToPlaylist(song);
    };
    r.readAsDataURL(f);
  });
  e.target.value='';
  toast('已添加 '+files.length+' 首歌曲');
}
function addSongToPlaylist(song){
  const pl=state.user.playlists.find(p=>p.id===currentAddSongPl);
  if(!pl){ toast('歌单不存在'); return; }
  if(!pl.songs.some(s=>s.name===song.name && s.src===song.src)){
    pl.songs.push(song); saveAll();
    if(!allSongs.some(s=>s.id===song.id)) allSongs.push(song);
  }
  renderAddedList();
  // 刷新歌单弹窗和我的页统计
  if(mb$('playlistModal').classList.contains('show')) openPlaylistModal();
  renderMinePlaylists(); updateMineStats();
  toast('已添加「'+song.name+'」');
}
function renderAddedList(){
  const pl=state.user.playlists.find(p=>p.id===currentAddSongPl);
  if(!pl) return;
  if(!pl.songs.length){ mb$('songAddedList').innerHTML=''; return; }
  mb$('songAddedList').innerHTML='<div style="font-size:12px;color:var(--ink3);margin-bottom:8px">已添加 '+pl.songs.length+' 首</div>'+pl.songs.map(s=>`
    <div class="song-added-item">
      <div class="name">${esc(s.name)} - ${esc(s.artist||'')}</div>
      <div class="del" data-del="${s.id}">✕</div>
    </div>`).join('');
  mb$('songAddedList').querySelectorAll('.del').forEach(el=>{
    el.addEventListener('click',()=>{
      const id=el.dataset.del;
      const i=pl.songs.findIndex(s=>s.id===id);
      if(i>=0){ pl.songs.splice(i,1); saveAll(); renderAddedList(); }
    });
  });
}

/* ============ 伴侣管理 ============ */
mb$('partnerBtn').addEventListener('click',()=>{
  renderPartnerList();
  mbShow(mb$('partnerModal'));
});
function renderPartnerList(){
  const badge=mb$('partnerBadge');
  badge.style.display = state.partners.length>0 ? 'none' : 'block';
  if(!state.partners.length){
    mb$('partnerList').innerHTML='<div style="text-align:center;padding:20px;font-family:var(--fd);font-style:italic;color:var(--ink3);font-size:13px">还没有添加对象<br>点击上方按钮添加</div>';
    return;
  }
  mb$('partnerList').innerHTML=state.partners.map(p=>`
    <div class="partner-item ${p.notif?'has-notif':''}" data-id="${p.id}" style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--line);cursor:pointer;">
      <div style="width:40px;height:40px;border-radius:50%;overflow:hidden;background:var(--bg2);flex-shrink:0;position:relative;">${p.avatar?'<img src="'+p.avatar+'" style="width:100%;height:100%;object-fit:cover;">':'<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--sage);">👤</div>'}</div>
      <div style="flex:1"><div style="font-size:14px;font-weight:500">${esc(p.nick)}</div><div style="font-size:12px;color:var(--ink3);margin-top:2px">${esc(p.signature)}</div></div>
      <div style="color:var(--ink3);font-size:18px">›</div>
    </div>`).join('');
  mb$('partnerList').querySelectorAll('.partner-item').forEach(el=>{
    el.addEventListener('click',()=>{
      mbHide(mb$('partnerModal'));
      openPartnerHome(el.dataset.id);
    });
  });
}
mb$('addPartnerBtn').addEventListener('click',()=>{
  editingPartnerId=null; pendingPartnerAvatar=null;
  mb$('addPartnerTitle').textContent='添加对象';
  mb$('partnerNickInput').value='';
  var uploadEl = mb$('partnerAvatarUpload');
  if(uploadEl){
    var previewEl = uploadEl.querySelector('.preview');
    if(previewEl) previewEl.innerHTML='<div class="ph">＋</div>';
  }
  mbShow(mb$('addPartnerModal'));
  setTimeout(function(){ try{ mb$('partnerNickInput').focus(); }catch(e){} }, 100);
});
// 伴侣头像上传 — 使用事件委托
(function(){
  var uploadEl = mb$('partnerAvatarUpload');
  if(uploadEl){
    uploadEl.addEventListener('click',function(e){
      e.stopPropagation();
      var pf = mb$('partnerAvatarFile');
      if(pf) pf.click();
    });
  }
  var fileEl = mb$('partnerAvatarFile');
  if(fileEl){
    fileEl.addEventListener('change',function(e){
      var f=e.target.files[0]; if(!f) return; if(f.size>3*1024*1024){ toast('图片需小于3MB'); return; }
      var r=new FileReader(); r.onload=function(){
        pendingPartnerAvatar=r.result;
        var ue = mb$('partnerAvatarUpload');
        if(ue){
          var p = ue.querySelector('.preview');
          if(p) p.innerHTML='<img src="'+r.result+'">';
        }
      }; r.readAsDataURL(f); e.target.value='';
    });
  }
})();
mb$('savePartnerBtn').addEventListener('click',function(){
  const nick=mb$('partnerNickInput').value.trim(); if(!nick){ toast('请输入昵称'); return; }
  const sig=getCardOrDefault('总有一首歌，让我想起你。');
  const partner={id:uid(),avatar:pendingPartnerAvatar,nick,signature:sig,background:null,playlists:[],favorites:[],comments:[],history:[]};
  state.partners.push(partner); saveAll();
  mbHide(mb$('addPartnerModal'));
  renderPartnerList(); renderHomePartnerRec();
  toast('已添加对象：'+nick);
});

/* 对方主页 - 全页式 */
async function openPartnerHome(pid){
  const p=state.partners.find(x=>x.id===pid); if(!p) return;
  currentPartnerId=pid;
  // 自动生成歌单（从听歌记录）
  if(!p.playlists.find(pl=>pl.name==='TA听过的歌')){
    p.playlists.push({id:uid(),name:'TA听过的歌',cover:null,songs:p.history.slice(0,15).map(h=>({id:h.id,name:h.name,artist:h.artist,neteaseId:h.neteaseId,src:h.src,type:'netease'}))});
    saveAll();
  }
  // 随机更新签名 — 从网站总字卡抽取
  p.signature=getCardOrDefault(p.signature||'总有一首歌，让我想起你。'); saveAll();
  renderPartnerPage(p);
  mbShow(mb$('partnerPage'));
}

function renderPartnerPage(p){
  mb$('ppContent').innerHTML=`
    <div class="pp-header">
      <div class="pp-header-bg">${p.background?'<img src="'+p.background+'">':''}<div class="gradient"></div></div>
      <div class="pp-upload-btn" id="ppBgUploadBtn"><svg viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg></div>
      <input type="file" id="ppBgFile" accept="image/*" style="display:none">
      <div class="pp-profile">
        <div class="pp-avatar">${p.avatar?'<img src="'+p.avatar+'">':'<div class="ph">👤</div>'}</div>
        <div class="pp-nick">${esc(p.nick)}</div>
        <div class="pp-sig">${esc(p.signature)} <span class="refresh-sig" id="refreshPartnerSig">✦ 换一句</span></div>
      </div>
    </div>
    <div class="pp-body">
      <div class="pp-tabs">
        <div class="pp-tab active" data-tab="songs">TA的歌单</div>
        <div class="pp-tab" data-tab="fav">收藏</div>
        <div class="pp-tab" data-tab="cmt">评论</div>
      </div>
      <div id="ppTabContent"></div>
    </div>`;
  // 绑定背景上传
  const bgBtn=mb$('ppBgUploadBtn');
  if(bgBtn) bgBtn.addEventListener('click',()=>mb$('ppBgFile').click());
  const bgFile=mb$('ppBgFile');
  if(bgFile) bgFile.addEventListener('change',e=>{
    const f=e.target.files[0]; if(!f) return; if(f.size>5*1024*1024){ toast('图片需小于5MB'); return; }
    const r=new FileReader(); r.onload=()=>{ p.background=r.result; saveAll(); renderPartnerPage(p); toast('背景已更新'); }; r.readAsDataURL(f); e.target.value='';
  });
  // 绑定tab切换
  mb$('ppContent').querySelectorAll('.pp-tab').forEach(t=>{
    t.addEventListener('click',function(){
      var ppContentEl=mb$('ppContent');
      var tabContentEl=mb$('ppTabContent');
      if(!tabContentEl) return;
      // 防止重复点击同一tab
      if(t.classList.contains('active')) return;
      // 淡出当前内容
      tabContentEl.style.opacity='0';
      tabContentEl.style.transition='opacity .12s';
      requestAnimationFrame(function(){
        ppContentEl.querySelectorAll('.pp-tab').forEach(x=>x.classList.remove('active'));
        t.classList.add('active');
        renderPartnerTab(p,t.dataset.tab);
        // 淡入新内容
        requestAnimationFrame(function(){
          tabContentEl.style.opacity='1';
        });
      });
    });
  });
  // 刷新签名
  const rsBtn=mb$('refreshPartnerSig');
  if(rsBtn) rsBtn.addEventListener('click',function(){
    p.signature=getCardOrDefault('总有一首歌，让我想起你。'); saveAll(); renderPartnerPage(p);
  });
  renderPartnerTab(p,'songs');
}

function renderPartnerTab(p,tab){
  const c=mb$('ppTabContent');
  if(tab==='songs'){
    const pl=p.playlists[0];
    if(!pl||!pl.songs.length){ c.innerHTML='<div class="empty-hint">TA还没有听歌记录<br>播放歌曲后会自动生成</div>'; return; }
    c.innerHTML=pl.songs.map((s,i)=>`
      <div class="song-item" data-id="${s.id}">
        <div class="si-cover"><div class="ph">🎵</div></div>
        <div class="si-info"><div class="si-name">${esc(s.name)}${s.recommended?'<span style="display:inline-block;font-size:9px;color:#fff;background:#c97b5a;border-radius:4px;padding:0 4px;vertical-align:middle;margin-left:4px;font-weight:400;">推荐</span>':''}</div><div class="si-artist">${esc(s.artist||'')}</div></div>
      </div>`).join('');
    c.querySelectorAll('.song-item').forEach(el=>{
      el.addEventListener('click',()=>{
        const song=pl.songs.find(s=>s.id===el.dataset.id); if(song) playSong(song);
        mbHide(mb$('partnerPage'));
      });
    });
  } else if(tab==='fav'){
    const recs=p.recommendedSongs||[];
    if(!recs.length){ c.innerHTML='<div class="empty-hint">TA还没有向你推荐歌曲</div>'; return; }
    c.innerHTML=recs.map(r=>`
      <div class="record-item">
        <div class="icon fav">♥</div>
        <div class="info"><div class="song-name">${esc(r.name)} · ${esc(r.artist||'')}</div><div class="content">对方向你推荐了这首歌</div><div class="time">${r.recommendedAt?new Date(r.recommendedAt).toLocaleDateString('zh-CN'):''}</div></div>
      </div>`).join('');
    c.querySelectorAll('.record-item').forEach((el,i)=>{
      el.addEventListener('click',()=>{
        const r=recs[i];
        const song={id:uid(),name:r.name,artist:r.artist,neteaseId:r.neteaseId,type:'netease',src:r.src||'https://music.163.com/song/media/outer/url?id='+r.neteaseId+'.mp3',lyrics:''};
        playSong(song);
        mbHide(mb$('partnerPage'));
      });
    });
  } else if(tab==='cmt'){
    // 从 state.comments 中收集该对方的所有评论
    var partnerCmts=[];
    var allCmtKeys=Object.keys(state.comments||{});
    for(var ck=0; ck<allCmtKeys.length; ck++){
      var songId=allCmtKeys[ck];
      var cmts=state.comments[songId];
      if(!cmts || !cmts.length) continue;
      for(var ci=0; ci<cmts.length; ci++){
        var cmtItem=cmts[ci];
        if(!cmtItem.isMe && cmtItem.nick===p.nick){
          var songObj=null;
          var f=findSong(songId);
          if(f) songObj=f.song;
          if(!songObj && state.user.history){
            for(var hi=0; hi<state.user.history.length; hi++){
              if(state.user.history[hi].id===songId){ songObj=state.user.history[hi]; break; }
            }
          }
          partnerCmts.push({song:songObj||{name:'未知歌曲'}, text:cmtItem.text, time:cmtItem.time});
        }
      }
    }
    partnerCmts.sort(function(a,b){ return (b.time||0)-(a.time||0); });
    if(!partnerCmts.length){ c.innerHTML='<div class="empty-hint">TA还没有评论</div>'; return; }
    c.innerHTML=partnerCmts.map(function(item){
      return '<div class="record-item">'+
        '<div class="icon cmt">💬</div>'+
        '<div class="info"><div class="song-name">'+esc(item.song.name)+'</div>'+
        '<div class="content">'+esc(item.text)+'</div>'+
        '<div class="time">'+(item.time?new Date(item.time).toLocaleDateString('zh-CN'):'')+'</div></div></div>';
    }).join('');
  }
}

/* 对方主页返回 */
mb$('ppBack').addEventListener('click',()=>{
  mbHide(mb$('partnerPage'));
});

/* ============ 陪伴模式 ============ */
mb$('companionBtn').addEventListener('click',()=>{
  if(!state.partners.length){ toast('请先添加对象'); mb$('partnerBtn').click(); return; }
  renderCompanionStep1();
  mbShow(mb$('companionModal'));
});
let compMode='float', compPlSource='mine';
function renderCompanionStep1(){
  mb$('companionBody').innerHTML=`
    <div class="step-indicator"><div class="step-dot active"></div><div class="step-dot"></div><div class="step-dot"></div></div>
    <div class="companion-option ${compMode==='float'?'selected':''}" data-mode="float">
      <div class="icon float">🔊</div><div class="text"><div class="title">悬浮播放器</div><div class="desc">圆形播放器悬浮在页面上，切换界面不中断</div></div><div class="check"></div>
    </div>
    <div class="companion-option ${compMode==='immersive'?'selected':''}" data-mode="immersive">
      <div class="icon immersive">🎧</div><div class="text"><div class="title">沉浸模式</div><div class="desc">进入播放界面，可看歌词、唱片、边听边聊</div></div><div class="check"></div>
    </div>
    <div style="margin-top:16px"><label style="font-size:11px;color:var(--ink3);letter-spacing:2px;text-transform:uppercase">选择歌单</label></div>
    <div class="pl-selector" style="margin-top:8px">
      <div class="pl-sel ${compPlSource==='mine'?'selected':''}" data-src="mine">我的歌单</div>
      ${state.partners.map(p=>`<div class="pl-sel ${compPlSource===p.id?'selected':''}" data-src="${p.id}">${esc(p.nick)}的歌单</div>`).join('')}
    </div>
    <button class="btn-primary" id="compNext1" style="margin-top:20px">发送陪伴申请</button>
  `;
  mb$('companionBody').querySelectorAll('.companion-option').forEach(el=>{
    el.addEventListener('click',()=>{ compMode=el.dataset.mode; mb$('companionBody').querySelectorAll('.companion-option').forEach(x=>x.classList.remove('selected')); el.classList.add('selected'); });
  });
  mb$('companionBody').querySelectorAll('.pl-sel').forEach(el=>{
    el.addEventListener('click',()=>{ compPlSource=el.dataset.src; mb$('companionBody').querySelectorAll('.pl-sel').forEach(x=>x.classList.remove('selected')); el.classList.add('selected'); });
  });
  mb$('compNext1').addEventListener('click',()=>renderCompanionStep2());
}
async function renderCompanionStep2(){
  const partner=state.partners[0];
  mb$('companionBody').innerHTML=`
    <div class="step-indicator"><div class="step-dot"></div><div class="step-dot active"></div><div class="step-dot"></div></div>
    <div class="invite-waiting">
      <div class="spinner"></div>
      <p>正在向 ${esc(partner.nick)} 发送陪伴邀请…</p>
    </div>
  `;
  await new Promise(r=>setTimeout(r,2000+Math.random()*1500));
  const accept=Math.random()>0.3;
  if(accept){
    const reply=getCardOrDefault('好啊，一起听吧！');
    mb$('companionBody').innerHTML=`
      <div class="step-indicator"><div class="step-dot"></div><div class="step-dot"></div><div class="step-dot active"></div></div>
      <div class="invite-result">
        <div class="emoji">🎉</div>
        <h4>${esc(partner.nick)} 接受了邀请</h4>
        <p>"${esc(reply)}"</p>
      </div>
      <button class="btn-primary" id="compStart" style="margin-top:16px">开始陪伴</button>
    `;
    mb$('compStart').addEventListener('click',()=>{
      state.companion={partnerId:partner.id,mode:compMode,plSource:compPlSource,status:'active'};
      saveAll(); mbHide(mb$('companionModal'));
      startCompanion();
    });
  } else {
    const reason=getCardOrDefault('现在有点忙，晚点一起听好不好？');
    mb$('companionBody').innerHTML=`
      <div class="step-indicator"><div class="step-dot"></div><div class="step-dot"></div><div class="step-dot active"></div></div>
      <div class="invite-result">
        <div class="emoji">💭</div>
        <h4>${esc(partner.nick)} 暂时拒绝了</h4>
        <p>"${esc(reason)}"</p>
      </div>
      <div class="btn-row">
        <button class="btn-secondary" id="compCancel">关闭</button>
        <button class="btn-secondary" id="compRetry" style="background:var(--sage);color:var(--cream);border-color:var(--sage)">再次邀请</button>
      </div>
    `;
    mb$('compCancel').addEventListener('click',()=>mbHide(mb$('companionModal')));
    mb$('compRetry').addEventListener('click',()=>renderCompanionStep2());
  }
}
function startCompanion(){
  if(!state.companion) return;
  if(compMode==='float'){
    mbShow(mb$('floatPlayer'));
    if(!audio.paused) mb$('floatPlayer').classList.add('playing');
    toast('陪伴模式已开启 · 悬浮播放器');
  } else {
    openFullPlayer();
    chatOpen=true; mbShow(mb$('chatCard'));
    const p=state.partners.find(x=>x.id===state.companion.partnerId);
    if(p){ mb$('chatPartnerName').textContent=p.nick; if(p.avatar) mb$('chatPartnerAvatar').innerHTML='<img src="'+p.avatar+'">'; }
    toast('陪伴模式已开启 · 沉浸模式');
  }
}
mb$('floatPlayer').addEventListener('click',()=>{
  if(state.companion&&state.companion.mode==='immersive') { closeFullPlayer(); state.companion.mode='float'; mbShow(mb$('floatPlayer')); }
  else { openFullPlayer(); }
});

/* ============ 首页 ============ */
async function loadDaily(){
  if(proxyOnline){
    try{ const d=await apiGet('/api/daily'); renderDaily(d.songs||[]); return; }catch(e){}
  }
  renderDaily([]);
}
function renderDaily(songs){
  if(!songs.length){ mb$('dailyScroll').innerHTML='<div class="daily-card"><div class="cover"><span class="emoji">🎶</span></div><div class="info"><div class="name">暂无日推</div></div></div>'; return; }
  const emojis=['🎵','🍃','🌧️','☕','🌸','🌅'];
  const grads=['linear-gradient(135deg,var(--sage-l),var(--cream))','linear-gradient(135deg,var(--sky-l),var(--cream))','linear-gradient(135deg,var(--pink-l),var(--cream))','linear-gradient(135deg,var(--terra-l),var(--cream))','linear-gradient(135deg,var(--sage-l),var(--sky-l))','linear-gradient(135deg,var(--pink-l),var(--sage-l))'];
  mb$('dailyScroll').innerHTML=songs.map((s,i)=>`
    <div class="daily-card" data-id="${s.id}" data-name="${esc(s.name)}" data-artist="${esc(s.artist||'')}" data-pic="${esc(s.picUrl||'')}">
      <div class="cover">${s.picUrl?'<img src="'+esc(s.picUrl)+'" style="width:100%;height:100%;object-fit:cover">':'<div class="bg-grad" style="background:'+grads[i%grads.length]+'"></div><span class="emoji">'+emojis[i%emojis.length]+'</span>'}<div class="play-icon"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div></div>
      <div class="info"><div class="name">${esc(s.name)}</div><div class="artist">${esc(s.artist||'')}</div></div>
    </div>`).join('');
  mb$('dailyScroll').querySelectorAll('.daily-card').forEach(el=>{
    el.addEventListener('click',()=>{
      const song={id:uid(),name:el.dataset.name,artist:el.dataset.artist,neteaseId:el.dataset.id,picUrl:el.dataset.pic||'',type:'netease',src:'https://music.163.com/song/media/outer/url?id='+el.dataset.id+'.mp3',lyrics:''};
      playSong(song);
    });
  });
}
async function loadRecommendAll(){
  if(proxyOnline){
    try{ const d=await apiGet('/api/recommend'); renderRecAll(d.songs||[]); return; }catch(e){}
  }
  renderRecAll([]);
}
function renderRecAll(songs){
  if(!songs.length){ mb$('recAllList').innerHTML='<div class="empty-hint">启动API获取推荐<br>或在设置中输入API地址</div>'; return; }
  mb$('recAllList').innerHTML=songs.map(s=>`
    <div class="song-item" data-id="${s.id}" data-name="${esc(s.name)}" data-artist="${esc(s.artist||'')}">
      <div class="si-num">${esc((s.name||'').charAt(0))}</div>
      <div class="si-info"><div class="si-name">${esc(s.name)}</div><div class="si-artist">${esc(s.artist||'')}</div></div>
    </div>`).join('');
  mb$('recAllList').querySelectorAll('.song-item').forEach(el=>{
    el.addEventListener('click',()=>{
      const song={id:uid(),name:el.dataset.name,artist:el.dataset.artist,neteaseId:el.dataset.id,type:'netease',src:'https://music.163.com/song/media/outer/url?id='+el.dataset.id+'.mp3',lyrics:''};
      playSong(song);
    });
  });
}
function renderHomePartnerRec(){
  if(!state.partners.length){ mb$('partnerRecSection').style.display='none'; return; }
  mb$('partnerRecSection').style.display='block';
  const p=state.partners[0];
  if(p.avatar) mb$('recPartnerAvatar').innerHTML='<img src="'+p.avatar+'">';
  else mb$('recPartnerAvatar').innerHTML='<div class="ph">?</div>';
  mb$('recPartnerAvatar').className='partner-avatar'+(p.notif?' has-notif':'');
  mb$('recPartnerName').textContent=p.nick;
  const hasRecPl=(p.recommendedPlaylists||[]).length>0;
  const hasRecSongs=(p.recommendedSongs||[]).length>0;
  mb$('recPartnerSub').textContent=hasRecPl?'TA为你推荐了歌单':'TA为你点的歌';
  // 渲染推荐歌单
  const plScroll=mb$('recPlScroll');
  if(hasRecPl){
    plScroll.style.display='flex';
    plScroll.innerHTML=p.recommendedPlaylists.map(pl=>`
      <div class="daily-card" data-plid="${pl.id}" style="flex:0 0 150px">
        <div class="cover">${pl.cover?'<img src="'+esc(pl.cover)+'" style="width:100%;height:100%;object-fit:cover">':'<div class="emoji">🎵</div>'}</div>
        <div class="info"><div class="name">${esc(pl.name)}</div><div class="artist">${pl.songs.length}首</div></div>
      </div>`).join('');
    plScroll.querySelectorAll('.daily-card').forEach(el=>{
      el.addEventListener('click',()=>openRecPlaylist(el.dataset.plid));
    });
  } else { plScroll.style.display='none'; plScroll.innerHTML=''; }
  renderRecSongs(p);
  // 渲染"对方推荐"板块（带 recommended 标记的歌曲）
  renderChatRecommendedSongs(p);
  // 点击对方头像/昵称进入对方主页
  mb$('recPartnerAvatar').onclick=()=>openPartnerHome(p.id);
  mb$('recPartnerName').onclick=()=>openPartnerHome(p.id);
  mb$('recPartnerName').style.cursor='pointer';
  mb$('recPartnerAvatar').style.cursor='pointer';
}
function renderRecSongs(p){
  if(!p.recommendedSongs) p.recommendedSongs=[];
  const songs=p.recommendedSongs;
  if(!songs.length){
    mb$('recSongList').innerHTML='<div class="empty-hint">TA还没有为你推荐歌曲<br>稍等片刻，TA会为你挑选的</div>';
    return;
  }
  mb$('recSongList').innerHTML=songs.map(s=>`
    <div class="song-item" data-id="${s.id}" data-name="${esc(s.name)}" data-artist="${esc(s.artist||'')}" data-netease="${s.neteaseId||''}" data-src="${s.src||''}" data-pic-url="${s.picUrl||''}">
      <div class="si-num">♥</div>
      <div class="si-info"><div class="si-name">${esc(s.name)}${s.recommended?'<span style="display:inline-block;font-size:9px;color:#fff;background:#c97b5a;border-radius:4px;padding:0 4px;vertical-align:middle;margin-left:4px;font-weight:400;">推荐</span>':''}</div><div class="si-artist">${esc(s.artist||'')}</div></div>
    </div>`).join('');
  mb$('recSongList').querySelectorAll('.song-item').forEach(el=>{
    el.addEventListener('click',()=>{
      const song={id:uid(),name:el.dataset.name,artist:el.dataset.artist,neteaseId:el.dataset.netease,type:'netease',src:el.dataset.src||'https://music.163.com/song/media/outer/url?id='+el.dataset.netease+'.mp3',picUrl:el.dataset.picUrl||'',lyrics:''};
      playSong(song);
    });
  });
}
// 渲染"对方推荐"板块——展示聊天中推荐并加入歌单的歌曲
function renderChatRecommendedSongs(p){
  // 从默认歌单中筛选带 recommended 标记的歌曲
  var defaultPl = state.user.playlists[0];
  var chatRecSongs = defaultPl ? defaultPl.songs.filter(function(s){ return s.recommended; }) : [];
  // 查找或创建容器
  var container = document.getElementById('chatRecSongSection');
  if(!container){
    // 在 recSongList 之后插入
    var recSongListEl = mb$('recSongList');
    if(!recSongListEl) return;
    container = document.createElement('div');
    container.id = 'chatRecSongSection';
    container.style.cssText = 'margin-top:12px;';
    recSongListEl.parentNode.insertBefore(container, recSongListEl.nextSibling);
  }
  if(!chatRecSongs.length){
    container.style.display = 'none';
    container.innerHTML = '';
    return;
  }
  container.style.display = 'block';
  var html = '<div style="font-size:11px;color:#9a9189;margin-bottom:6px;letter-spacing:1px;">对方推荐（已加入歌单）</div>';
  chatRecSongs.forEach(function(s){
    html += '<div class="song-item" data-id="'+s.id+'" data-name="'+esc(s.name)+'" data-artist="'+esc(s.artist||'')+'" data-netease="'+(s.neteaseId||'')+'" data-src="'+(s.src||'')+'" data-pic-url="'+(s.picUrl||'')+'" style="cursor:pointer;">'
      + '<div class="si-num">🎵</div>'
      + '<div class="si-info"><div class="si-name">'+esc(s.name)+' <span style="display:inline-block;font-size:9px;color:#fff;background:#c97b5a;border-radius:4px;padding:0 4px;vertical-align:middle;margin-left:4px;font-weight:400;">推荐</span></div><div class="si-artist">'+esc(s.artist||'')+'</div></div>'
      + '</div>';
  });
  container.innerHTML = html;
  // 绑定点击播放
  container.querySelectorAll('.song-item').forEach(function(el){
    el.addEventListener('click', function(){
      var song = {id:uid(),name:el.dataset.name,artist:el.dataset.artist,neteaseId:el.dataset.netease,type:'netease',src:el.dataset.src||'https://music.163.com/song/media/outer/url?id='+el.dataset.netease+'.mp3',picUrl:el.dataset.picUrl||'',lyrics:''};
      playSong(song);
    });
  });
}
/* 点歌弹窗 */
function openDianGeModal(){
  mbShow(mb$('dianGeModal'));
  mb$('dianGeSearchInput').value='';
  mb$('dianGeSearchResults').innerHTML='<div class="empty-hint">搜索歌曲名或歌手</div>';
  renderDianGePlaylist();
  renderDianGeRecPlaylist();
  switchDianGeTab('search');
  mb$('dianGeSearchInput').focus();
}
function switchDianGeTab(tab){
  mbRoot.querySelectorAll('[data-dtab]').forEach(t=>t.classList.toggle('active',t.dataset.dtab===tab));
  mb$('dianGeSearchPanel').style.display=tab==='search'?'block':'none';
  mb$('dianGePlaylistPanel').style.display=tab==='playlist'?'block':'none';
  mb$('dianGeRecPlPanel').style.display=tab==='recplaylist'?'block':'none';
}
function renderDianGePlaylist(){
  const allSongs=[];
  state.user.playlists.forEach(pl=>{ pl.songs.forEach(s=>allSongs.push(s)); });
  const list=mb$('dianGePlaylistList');
  if(!allSongs.length){ list.innerHTML='<div class="empty-hint">歌单中还没有歌曲</div>'; return; }
  list.innerHTML=allSongs.map(s=>`
    <div class="sr-item" data-id="${s.neteaseId||s.id}" data-name="${esc(s.name)}" data-artist="${esc(s.artist||'')}" data-src="${s.src||''}">
      <div class="sr-info"><div class="sr-name">${esc(s.name)}</div><div class="sr-meta">${esc(s.artist||'')}</div></div>
      <button class="sr-add">点</button>
    </div>`).join('');
  list.querySelectorAll('.sr-item').forEach(el=>{
    el.querySelector('.sr-add').addEventListener('click',()=>{
      const p=state.partners[0]; if(!p) return;
      if(!p.recommendedSongs) p.recommendedSongs=[];
      const song={id:uid(),name:el.dataset.name,artist:el.dataset.artist,neteaseId:el.dataset.id,type:'netease',src:el.dataset.src||'https://music.163.com/song/media/outer/url?id='+el.dataset.id+'.mp3',lyrics:'',recommendedAt:Date.now()};
      p.recommendedSongs.unshift(song);
      if(p.recommendedSongs.length>10) p.recommendedSongs=p.recommendedSongs.slice(0,10);
      saveAll();
      mbHide(mb$('dianGeModal'));
      renderRecSongs(p);
      toast('已为TA点歌：'+song.name);
    });
  });
}
function renderDianGeRecPlaylist(){
  const list=mb$('dianGeRecPlList');
  if(!state.user.playlists.length){ list.innerHTML='<div class="empty-hint">还没有歌单<br>先去创建几个吧</div>'; return; }
  list.innerHTML=state.user.playlists.map(pl=>`
    <div class="sr-item" data-id="${pl.id}" data-name="${esc(pl.name)}" data-cover="${esc(pl.cover||'')}">
      <div class="sr-info">
        <div class="sr-name">${esc(pl.name)}</div>
        <div class="sr-meta">${pl.songs.length}首歌曲</div>
      </div>
      <button class="sr-add">荐</button>
    </div>`).join('');
  list.querySelectorAll('.sr-item').forEach(el=>{
    el.querySelector('.sr-add').addEventListener('click',()=>{
      const p=state.partners[0]; if(!p) return;
      if(!p.recommendedPlaylists) p.recommendedPlaylists=[];
      const pl=state.user.playlists.find(x=>x.id===el.dataset.id);
      if(!pl) return;
      const rec={id:pl.id,name:pl.name,cover:pl.cover||'',songs:pl.songs.map(s=>({id:s.id,name:s.name,artist:s.artist||'',neteaseId:s.neteaseId||s.id,src:s.src||'',picUrl:s.picUrl||''})),recommendedAt:Date.now()};
      p.recommendedPlaylists.unshift(rec);
      if(p.recommendedPlaylists.length>5) p.recommendedPlaylists=p.recommendedPlaylists.slice(0,5);
      saveAll();
      mbHide(mb$('dianGeModal'));
      renderHomePartnerRec();
      toast('已向TA推荐歌单：'+rec.name);
    });
  });
}
mb$('dianGeClose').addEventListener('click',()=>mbHide(mb$('dianGeModal')));
mbRoot.querySelectorAll('[data-dtab]').forEach(t=>t.addEventListener('click',()=>switchDianGeTab(t.dataset.dtab)));
mb$('dianGeSearchBtn').addEventListener('click',()=>doDianGeSearch(mb$('dianGeSearchInput').value.trim()));
mb$('dianGeSearchInput').addEventListener('keypress',e=>{ if(e.key==='Enter') doDianGeSearch(mb$('dianGeSearchInput').value.trim()); });
async function doDianGeSearch(kw){
  if(!kw){ toast('请输入搜索关键词'); return; }
  mb$('dianGeSearchResults').innerHTML='<div class="empty-hint">搜索中…</div>';
  if(proxyOnline){
    try{
      const d=await apiPost('/api/search',{keywords:kw,limit:15});
      const songs=d.songs||[];
      if(!songs.length){ mb$('dianGeSearchResults').innerHTML='<div class="empty-hint">未找到相关歌曲</div>'; return; }
      mb$('dianGeSearchResults').innerHTML=songs.map(s=>`
        <div class="sr-item" data-id="${s.id}" data-name="${esc(s.name)}" data-artist="${esc(s.artist||'')}">
          <div class="sr-info"><div class="sr-name">${esc(s.name)}</div><div class="sr-meta">${esc(s.artist||'')}${s.album?' · '+esc(s.album):''}</div></div>
          <button class="sr-add">点</button>
        </div>`).join('');
      mb$('dianGeSearchResults').querySelectorAll('.sr-item').forEach(el=>{
        el.querySelector('.sr-add').addEventListener('click',()=>{
          const p=state.partners[0]; if(!p) return;
          if(!p.recommendedSongs) p.recommendedSongs=[];
          const song={id:uid(),name:el.dataset.name,artist:el.dataset.artist,neteaseId:el.dataset.id,type:'netease',src:'https://music.163.com/song/media/outer/url?id='+el.dataset.id+'.mp3',lyrics:'',recommendedAt:Date.now()};
          p.recommendedSongs.unshift(song);
          if(p.recommendedSongs.length>10) p.recommendedSongs=p.recommendedSongs.slice(0,10);
          saveAll();
          mbHide(mb$('dianGeModal'));
          renderRecSongs(p);
          toast('已为TA点歌：'+song.name);
        });
      });
    }catch(e){ mb$('dianGeSearchResults').innerHTML='<div class="empty-hint">搜索失败，请重试</div>'; }
  } else {
    mb$('dianGeSearchResults').innerHTML='<div class="empty-hint">请先连接API</div>';
  }
}
mb$('recRefreshBtn').addEventListener('click',()=>{
  const p=state.partners[0]; if(!p) return;
  if(p.recommendedSongs&&p.recommendedSongs.length){
    const r=p.recommendedSongs[0];
    const song={id:uid(),name:r.name,artist:r.artist,neteaseId:r.neteaseId,type:'netease',src:r.src||'https://music.163.com/song/media/outer/url?id='+r.neteaseId+'.mp3',lyrics:''};
    playSong(song);
  } else {
    openDianGeModal();
  }
});

/* ============ 弹窗关闭 ============ */
mbRoot.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',()=>{var target=mb$(el.dataset.close); if(target) mbHide(target);}));
mbRoot.querySelectorAll('.mb-modal').forEach(m=>m.addEventListener('click',e=>{ if(e.target===m) mbHide(m); }));

/* ============ 键盘 ============ */
document.addEventListener('keydown',e=>{
  if(!mbRoot||mbRoot.style.display!=='flex')return;
  if(e.code==='Space'&&e.target.tagName!=='INPUT'&&e.target.tagName!=='TEXTAREA'){ e.preventDefault(); togglePlay(); }
  if(e.code==='Escape'){ mbHide(mb$('fullPlayer')); mbHide(mb$('partnerPage')); mbRoot.querySelectorAll('.mb-modal.show').forEach(m=>mbHide(m)); }
});

/* ============ 对方动态通知系统 ============ */
// 通知队列：多个聊天对象发信息时按列表顺序依次出现
window._notifQueue = [];
window._notifShowing = false;
function showPartnerNotif(partner, action, song, msg, type, targetId){
  // 将通知加入队列
  window._notifQueue.push({partner:partner, action:action, song:song, msg:msg, type:type, targetId:targetId});
  processNotifQueue();
}
function processNotifQueue(){
  if(window._notifShowing) return;
  if(window._notifQueue.length===0) return;
  var item = window._notifQueue.shift();
  window._notifShowing = true;
  var partner = item.partner;
  var action = item.action;
  var song = item.song;
  var msg = item.msg;
  var type = item.type;
  var targetId = item.targetId;
  var popup=mb$('notifPopup');
  var av=mb$('notifAvatar');
  if(partner.avatar) av.innerHTML='<img src="'+partner.avatar+'">';
  else av.innerHTML='<div class="ph">👤</div>';
  mb$('notifNick').textContent=partner.nick;
  mb$('notifAction').textContent=action;
  if(song){ mb$('notifSong').textContent=song.name||''; mb$('notifArtist').textContent=song.artist||''; mb$('notifSong').style.display='block'; mb$('notifArtist').style.display='block'; }
  else { mb$('notifSong').style.display='none'; mb$('notifArtist').style.display='none'; }
  mb$('notifMsg').textContent=msg||'';
  popup.dataset.type=type||'song';
  popup.dataset.target=targetId||'';
  mbShow(popup);
  partner.notif=true; saveAll(); renderPartnerList(); renderHomePartnerRec();
  // 5秒后自动关闭，然后处理队列中的下一个
  clearTimeout(window._notifTimer);
  window._notifTimer=setTimeout(function(){ closeNotif(); },5000);
}
function closeNotif(){
  mbHide(mb$('notifPopup'));
  // 延迟一下再处理下一个，确保关闭动画完成
  setTimeout(function(){
    window._notifShowing = false;
    processNotifQueue();
  }, 400);
}
mb$('notifClose').addEventListener('click',function(){ closeNotif(); });
mb$('notifDismiss').addEventListener('click',function(){ closeNotif(); });
mb$('notifListen').addEventListener('click',()=>{
  const popup=mb$('notifPopup');
  const type=popup.dataset.type;
  const targetId=popup.dataset.target;
  closeNotif();
  const p=state.partners.find(x=>x.notif);
  if(p){ p.notif=false; saveAll(); renderPartnerList(); renderHomePartnerRec(); }
  // 先关闭全屏播放器，防止界面崩坏闪现
  mbHide(mb$('fullPlayer'));
  var wrap=document.querySelector('#music-buddy-page .mb-app-wrap');
  if(wrap) wrap.classList.remove('fp-open');
  chatOpen=false; mbHide(mb$('chatCard'));
  if(type==='song' && targetId){
    // 播放推荐的歌曲
    const partner=state.partners.find(function(pp){ return pp.recommendedSongs && pp.recommendedSongs.some(function(s){return s.id===targetId;}); });
    if(partner){
      const rec=partner.recommendedSongs.find(function(s){return s.id===targetId;});
      if(rec) playSong(rec);
    }
    toast('正在播放推荐歌曲');
  } else if(type==='playlist' && targetId){
    openRecPlaylist(targetId);
  } else if(type==='companion' && targetId){
    // 对方主动申请一起听歌 — 打开陪伴弹窗
    if(!mbRoot.querySelector('#companionModal.show')){
      mbShow(mb$('companionModal'));
      if(typeof renderCompanionStep1==='function') renderCompanionStep1();
    }
  } else {
    toast('已查看');
  }
});
// 模拟歌曲池（用于对方随机推荐）
const SIM_SONGS=[
  {id:186016,name:'晴天',artist:'周杰伦',neteaseId:'186016',picUrl:'https://p2.music.126.net/KVVW0SSeBJXuqE3qWSnHBw==/109951167024880762.jpg'},
  {id:1293886117,name:'慢慢喜欢你',artist:'莫文蔚',neteaseId:'1293886117',picUrl:'https://p2.music.126.net/8KTm534J5Bcoyagn1vQxiA==/109951167893314360.jpg'},
  {id:1293886117,name:'起风了',artist:'买辣椒也用券',neteaseId:'1330348068',picUrl:'https://p2.music.126.net/diGAyEmpymX8G7JcnElncQ==/109951163699673355.jpg'},
  {id:447925558,name:'某种老朋友',artist:'林家谦',neteaseId:'447925558',picUrl:'https://p2.music.126.net/8KTm534J5Bcoyagn1vQxiA==/109951167893314360.jpg'},
  {id:1293886117,name:'遇见',artist:'孙燕姿',neteaseId:'287035',picUrl:'https://p2.music.126.net/tt8xwK-ASC2iqXNUXYKoDQ==/109951163606377163.jpg'},
  {id:1293886117,name:'小幸运',artist:'田馥甄',neteaseId:'409650778',picUrl:'https://p2.music.126.net/tt8xwK-ASC2iqXNUXYKoDQ==/109951163606377163.jpg'},
  {id:1293886117,name:'后来',artist:'刘若英',neteaseId:'5271858',picUrl:'https://p2.music.126.net/tt8xwK-ASC2iqXNUXYKoDQ==/109951163606377163.jpg'},
  {id:1293886117,name:'那些年',artist:'胡夏',neteaseId:'17706927',picUrl:'https://p2.music.126.net/tt8xwK-ASC2iqXNUXYKoDQ==/109951163606377163.jpg'},
  {id:1293886117,name:'平凡之路',artist:'朴树',neteaseId:'29004400',picUrl:'https://p2.music.126.net/tt8xwK-ASC2iqXNUXYKoDQ==/109951163606377163.jpg'},
  {id:1293886117,name:'红豆',artist:'王菲',neteaseId:'29947420',picUrl:'https://p2.music.126.net/tt8xwK-ASC2iqXNUXYKoDQ==/109951163606377163.jpg'},
];
// 模拟对方动态（推荐歌曲/推荐歌单/点赞收藏/主动申请一起听）
function simulatePartnerActivity(){
  if(!state.partners.length) return;
  const partner=state.partners[Math.floor(Math.random()*state.partners.length)];
  const msg=getCardOrDefault('这首歌好像我们的故事。');
  // 随机选择行为：0=推荐歌曲, 1=推荐歌单, 2=普通动态, 3=主动申请一起听
  const behavior=Math.floor(Math.random()*4);
  if(behavior===0){
    // 推荐歌曲 — 优先从用户歌单中选取，其次从随机歌曲池
    let songData=null;
    // 收集用户所有歌单中的歌曲
    var userSongs=[];
    state.user.playlists.forEach(function(pl){ pl.songs.forEach(function(s){ userSongs.push(s); }); });
    // 也从听歌记录中选取
    state.user.history.forEach(function(h){ userSongs.push(h); });
    if(userSongs.length>0 && Math.random()>0.4){
      // 60%概率从用户歌单/历史中推荐
      var pick=userSongs[Math.floor(Math.random()*userSongs.length)];
      songData={name:pick.name,artist:pick.artist||'',neteaseId:pick.neteaseId||'',picUrl:pick.picUrl||'',src:pick.src||''};
    } else {
      // 40%概率从随机歌曲池推荐
      var sim=SIM_SONGS[Math.floor(Math.random()*SIM_SONGS.length)];
      songData=sim;
    }
    if(!partner.recommendedSongs) partner.recommendedSongs=[];
    var song={id:uid(),name:songData.name,artist:songData.artist,neteaseId:songData.neteaseId,picUrl:songData.picUrl,type:'netease',src:songData.src||('https://music.163.com/song/media/outer/url?id='+songData.neteaseId+'.mp3'),lyrics:'',recommendedAt:Date.now()};
    partner.recommendedSongs.unshift(song);
    if(partner.recommendedSongs.length>10) partner.recommendedSongs=partner.recommendedSongs.slice(0,10);
    saveAll(); renderHomePartnerRec();
    showPartnerNotif(partner,'为你推荐了一首歌',song,msg,'song',song.id);
    // 如果用户当前在聊天界面（不在一起听页面），也在聊天界面弹出推荐
    var mbPage = document.getElementById('music-buddy-page');
    if(!mbPage || mbPage.style.display === 'none'){
      var chatSongData = {name: songData.name, artist: songData.artist||'', neteaseId: song.neteaseId||'', picUrl: songData.picUrl||'', src: songData.src||''};
      setTimeout(function(){
        showChatSongRecommend(chatSongData, partner.nick, partner.avatar);
      }, 500 + Math.random() * 1000);
    }
  } else if(behavior===1 && state.user.playlists.length>0){
    // 推荐歌单 — 从用户歌单中选取
    const pl=state.user.playlists[Math.floor(Math.random()*state.user.playlists.length)];
    if(!partner.recommendedPlaylists) partner.recommendedPlaylists=[];
    const rec={id:pl.id,name:pl.name,cover:pl.cover||'',songs:pl.songs.map(s=>({id:s.id,name:s.name,artist:s.artist||'',neteaseId:s.neteaseId||s.id,src:s.src||'',picUrl:s.picUrl||''})),recommendedAt:Date.now()};
    partner.recommendedPlaylists.unshift(rec);
    if(partner.recommendedPlaylists.length>5) partner.recommendedPlaylists=partner.recommendedPlaylists.slice(0,5);
    saveAll(); renderHomePartnerRec();
    showPartnerNotif(partner,'为你推荐了一个歌单',{name:pl.name,artist:pl.songs.length+'首歌曲'},msg,'playlist',pl.id);
  } else if(behavior===3 && !state.companion){
    // 主动申请一起听歌
    showPartnerNotif(partner,'想和你一起听歌',null,getCardOrDefault('现在方便一起听歌吗？'),'companion',partner.id);
  } else {
    // 普通动态
    const actions=['点赞了一首歌','收藏了一首歌'];
    const action=actions[Math.floor(Math.random()*actions.length)];
    var sim2=SIM_SONGS[Math.floor(Math.random()*SIM_SONGS.length)];
    showPartnerNotif(partner,action,{name:sim2.name,artist:sim2.artist},msg);
  }
}
let partnerTimer = null;
let partnerCommentTimer = null;
let partnerChatTimer = null;
function partnerIntervalMs(min, minUnit, max, maxUnit){
  const lo = (min||1) * (minUnit||60) * 1000;
  const hi = (max||1) * (maxUnit||60) * 1000;
  const loC = Math.max(5000, Math.min(lo, 24*3600*1000));
  const hiC = Math.max(loC, Math.min(hi, 24*3600*1000));
  return loC + Math.random() * Math.max(0, hiC - loC);
}
// 对方主动为你的歌曲发表评论
function simulatePartnerComment(){
  if(!state.partners.length) return;
  const partner=state.partners[Math.floor(Math.random()*state.partners.length)];
  let song=null;
  if(state.currentSongId){ const f=findSong(state.currentSongId); if(f) song=f.song; }
  if(!song && state.user.history && state.user.history.length){ song=state.user.history[Math.floor(Math.random()*state.user.history.length)]; }
  if(!song) return;
  if(!state.comments[song.id]) state.comments[song.id]=[];
  const reply=getCardOrDefault('这首歌让我想起你笑的样子。');
  state.comments[song.id].push({nick:partner.nick,avatar:partner.avatar,text:reply,time:Date.now(),isMe:false});
  saveAll();
  showPartnerNotif(partner,'评论了你的歌曲',song,reply,'comment',song.id);
}
function schedulePartnerComment(){
  const delay=partnerIntervalMs(state.user.partnerCommentMin,state.user.partnerCommentMinUnit,state.user.partnerCommentMax,state.user.partnerCommentMaxUnit);
  partnerCommentTimer=setTimeout(()=>{ simulatePartnerComment(); schedulePartnerComment(); },delay);
}
// 对方主动发起聊天
function simulatePartnerChat(){
  if(!state.partners.length) return;
  const partner=state.partners[0];
  const partnerAvatar=getPartnerChatAvatar(partner);
  const body=mb$('chatBody');
  if(!body) return;
  var r=Math.random();
  if(r<0.7){
    var card=getCardOrDefault('这首歌好像我们的故事。');
    body.innerHTML+='<div class="chat-msg them"><div class="chat-av">'+partnerAvatar+'</div><div class="bubble">'+esc(card)+'</div></div>';
  } else {
    var stickers=getSiteStickers();
    if(stickers && stickers.length>0){
      var pick=stickers[Math.floor(Math.random()*stickers.length)];
      if(typeof pick==='string'){ body.innerHTML+='<div class="chat-msg them"><div class="chat-av">'+partnerAvatar+'</div><div class="bubble emoji-bubble">'+pick+'</div></div>'; }
      else if(pick.url||pick.src){ var surl=pick.url||pick.src; body.innerHTML+='<div class="chat-msg them"><div class="chat-av">'+partnerAvatar+'</div><div class="bubble img-bubble"><img src="'+surl+'" style="max-width:80px;max-height:80px;border-radius:8px;"></div></div>'; }
    } else {
      var defaults=['😊','🥰','😴','🎵','💕','🌙','☕','🔥','✨','🎧','🌧️','😂','🤔','👀','💅'];
      var emoji=defaults[Math.floor(Math.random()*defaults.length)];
      body.innerHTML+='<div class="chat-msg them"><div class="chat-av">'+partnerAvatar+'</div><div class="bubble emoji-bubble">'+emoji+'</div></div>';
    }
  }
  body.scrollTop=body.scrollHeight;
}
function schedulePartnerChat(){
  const delay=partnerIntervalMs(state.user.partnerChatMin,state.user.partnerChatMinUnit,state.user.partnerChatMax,state.user.partnerChatMaxUnit);
  partnerChatTimer=setTimeout(()=>{ simulatePartnerChat(); schedulePartnerChat(); },delay);
}
function restartPartnerTimer(){
  if(partnerTimer) clearInterval(partnerTimer);
  if(partnerCommentTimer) clearTimeout(partnerCommentTimer);
  if(partnerChatTimer) clearTimeout(partnerChatTimer);
  // 推荐间隔 — 推荐歌曲/歌单/动态（最低~最高随机）
  var recMinMs = (state.user.recIntervalMin || 30) * (state.user.recIntervalMinUnit || 60) * 1000;
  var recMaxMs = (state.user.recIntervalMax || 120) * (state.user.recIntervalMaxUnit || 60) * 1000;
  if(recMinMs > recMaxMs){ var t=recMinMs; recMinMs=recMaxMs; recMaxMs=t; }
  recMinMs = Math.max(10000, recMinMs);
  recMaxMs = Math.max(recMinMs, Math.min(recMaxMs, 24 * 3600 * 1000));
  var recMs = recMinMs + Math.random() * (recMaxMs - recMinMs);
  partnerTimer = setInterval(simulatePartnerActivity, recMs);
  // 对方主动评论间隔
  schedulePartnerComment();
  // 对方主动聊天间隔
  schedulePartnerChat();
}
/* ============ 初始化 ============ */
async function init(){
  // 初始化完成前隐藏页面，避免异步加载导致闪现
  mbRoot.style.visibility = 'hidden';
  await checkProxy();
  setModeIcon();
  audio.volume=state.volume;
  if(!state.currentPlId) state.currentPlId=state.user.playlists[0].id;
  updateMine();
  renderHomePartnerRec();
  loadDaily();
  loadRecommendAll();
  if(state.currentSongId){
    const f=findSong(state.currentSongId);
    if(f){ updateMiniPlayer(f.song); updateFullPlayer(f.song); }
  }
  // 折叠切换
  function setupToggle(btnId, contentId){
    const btn=mb$(btnId); if(!btn) return;
    const content=mb$(contentId);
    btn.addEventListener('click',()=>{
      if(content.style.display==='none'){
        content.style.display='';
        btn.classList.remove('collapsed');
        btn.title='收起';
        btn.textContent='▲';
      } else {
        content.style.display='none';
        btn.classList.add('collapsed');
        btn.title='展开';
        btn.textContent='▼';
      }
    });
  }
  // For You: 切换 partner-rec 内容
  setupToggle('toggleRec','recContent');
  // History: 切换 historyList
  setupToggle('toggleHistory','historyList');
  restartPartnerTimer();
  // 初始化完成，显示页面
  mbRoot.style.visibility = '';
}

/* ============ 全局悬浮播放器 ============ */
var gFloat = document.getElementById('mbGlobalFloat');
var gFloatCover = document.getElementById('mbFloatCover');
var gFloatDragging = false;
var gFloatOffX = 0, gFloatOffY = 0;
var gFloatPopup = document.getElementById('mbFloatPopup');
var gFloatPopupOpen = false;

// 将悬浮球和弹窗移到 documentElement 下，避免 body 的 overflow:hidden / position:fixed 裁剪
if(gFloat && gFloat.parentNode !== document.documentElement){
  document.documentElement.appendChild(gFloat);
}
if(gFloatPopup && gFloatPopup.parentNode !== document.documentElement){
  document.documentElement.appendChild(gFloatPopup);
}

function updateGlobalFloat(song){
  if(!gFloatCover) return;
  if(song && song.picUrl){
    gFloatCover.innerHTML = '<img src="'+esc(song.picUrl)+'" style="width:100%;height:100%;object-fit:cover;">';
  } else {
    gFloatCover.innerHTML = '🎵';
  }
  // 更新弹窗信息
  updateFloatPopupSong(song);
}

function updateFloatPopupSong(song){
  if(!gFloatPopup) return;
  var nameEl = document.getElementById('mbFpName');
  var artistEl = document.getElementById('mbFpArtist');
  var coverEl = document.getElementById('mbFpCover');
  if(song){
    if(nameEl) nameEl.textContent = song.name || '未播放';
    if(artistEl) artistEl.textContent = song.artist || '-';
    if(coverEl){
      if(song.picUrl) coverEl.innerHTML = '<img src="'+esc(song.picUrl)+'" style="width:100%;height:100%;object-fit:cover;">';
      else coverEl.innerHTML = '🎵';
    }
  }
  // 更新播放/暂停图标
  updateFloatPlayIcon();
  // 更新播放模式图标
  updateFloatModeIcon();
  // 更新歌曲列表
  renderFloatSongList();
}

function updateFloatPlayIcon(){
  var icon = document.getElementById('mbFpPlayIcon');
  if(!icon) return;
  if(audio.paused){
    icon.innerHTML = '<polygon points="6,3 20,12 6,21" fill="#f5f2ed" stroke="none"/>';
  } else {
    icon.innerHTML = '<rect x="5" y="3" width="4" height="18" fill="#f5f2ed" rx="1"/><rect x="15" y="3" width="4" height="18" fill="#f5f2ed" rx="1"/>';
  }
}

function updateFloatModeIcon(){
  var icon = document.getElementById('mbFpModeIcon');
  if(!icon) return;
  var m = MODES.find(x=>x.key===state.mode)||MODES[0];
  icon.innerHTML = '<path d="'+m.icon+'"/>';
  var btn = document.getElementById('mbFpModeBtn');
  if(btn) btn.title = m.label;
}

function renderFloatSongList(){
  var listEl = document.getElementById('mbFpSongList');
  if(!listEl) return;
  // 获取当前播放歌单
  var pl = state.user.playlists.find(p=>p.id===state.currentPlId);
  var songs = pl ? pl.songs : allSongs;
  if(!songs.length){ listEl.innerHTML='<div style="text-align:center;padding:16px;color:#9a9189;font-style:italic;">暂无歌曲</div>'; return; }
  var html = '';
  songs.forEach(function(s, i){
    var isPlaying = s.id === state.currentSongId;
    html += '<div data-fsid="'+s.id+'" style="display:flex;align-items:center;gap:8px;padding:8px 6px;border-radius:8px;cursor:pointer;'+(isPlaying?'background:rgba(122,139,106,.15);':'')+'" onmouseover="this.style.background=\'rgba(122,139,106,.1)\'" onmouseout="this.style.background=\''+(isPlaying?'rgba(122,139,106,.15)':'transparent')+'\'">'
      + '<div style="width:36px;height:36px;border-radius:8px;overflow:hidden;flex-shrink:0;background:#ebe5dc;display:flex;align-items:center;justify-content:center;font-size:12px;color:#7a8b6a;">'
      + (s.picUrl ? '<img src="'+esc(s.picUrl)+'" style="width:100%;height:100%;object-fit:cover;">' : '🎵')
      + '</div>'
      + '<div style="flex:1;overflow:hidden;min-width:0;">'
      + '<div style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:'+(isPlaying?'#5d6e4d':'#2a2520')+';font-weight:'+(isPlaying?'500':'400')+';">'+esc(s.name)+(s.recommended?' <span style="display:inline-block;font-size:9px;color:#fff;background:#c97b5a;border-radius:4px;padding:0 4px;vertical-align:middle;margin-left:4px;font-weight:400;">推荐</span>':'')+'</div>'
      + '<div style="font-size:10px;color:#9a9189;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(s.artist||'')+'</div>'
      + '</div></div>';
  });
  listEl.innerHTML = html;
  // 绑定点击
  listEl.querySelectorAll('[data-fsid]').forEach(function(el){
    el.addEventListener('click', function(){
      var sid = this.dataset.fsid;
      var song = songs.find(function(s){ return s.id === sid; });
      if(song) playSong(song);
    });
  });
}

function toggleFloatPopup(){
  if(!gFloatPopup) return;
  gFloatPopupOpen = !gFloatPopupOpen;
  if(gFloatPopupOpen){
    // 定位到悬浮球上方
    if(gFloat){
      var rect = gFloat.getBoundingClientRect();
      gFloatPopup.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
      gFloatPopup.style.right = (window.innerWidth - rect.right) + 'px';
      gFloatPopup.style.left = 'auto';
    }
    gFloatPopup.style.display = 'block';
    // 更新内容
    var f = findSong(state.currentSongId);
    updateFloatPopupSong(f ? f.song : null);
  } else {
    gFloatPopup.style.display = 'none';
  }
}

function hideFloatPopup(){
  gFloatPopupOpen = false;
  if(gFloatPopup) gFloatPopup.style.display = 'none';
}

function showGlobalFloat(){
  if(!gFloat) return;
  // 只在一起听页面未显示时才显示全局悬浮
  var mbPage = document.getElementById('music-buddy-page');
  if(mbPage && mbPage.style.display !== 'none') {
    gFloat.style.display = 'none';
    hideFloatPopup();
    return;
  }
  if(state.currentSongId && state.companion) gFloat.style.display = 'block';
}
function hideGlobalFloat(){
  if(gFloat) gFloat.style.display = 'none';
  hideFloatPopup();
}

// 当离开一起听页面时显示全局悬浮
window.MusicBuddyApp = window.MusicBuddyApp || {};
window.MusicBuddyApp.showGlobalFloat = showGlobalFloat;
window.MusicBuddyApp.hideGlobalFloat = hideGlobalFloat;
window.MusicBuddyApp.updateGlobalFloat = updateGlobalFloat;

if(gFloat){
  // 点击切换弹窗（非拖动时）
  gFloat.addEventListener('click', function(e){
    if(gFloatDragging) return;
    toggleFloatPopup();
  });
  
  // 拖动支持
  var startX=0, startY=0, startLeft=0, startTop=0;
  function onStart(e){
    var touch = e.touches ? e.touches[0] : e;
    gFloatDragging = false;
    startX = touch.clientX;
    startY = touch.clientY;
    var rect = gFloat.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, {passive:false});
    document.addEventListener('touchend', onEnd);
  }
  function onMove(e){
    var touch = e.touches ? e.touches[0] : e;
    var dx = touch.clientX - startX;
    var dy = touch.clientY - startY;
    if(Math.abs(dx) > 4 || Math.abs(dy) > 4) gFloatDragging = true;
    if(gFloatDragging){
      e.preventDefault();
      var nx = startLeft + dx;
      var ny = startTop + dy;
      // clamp to viewport
      nx = Math.max(0, Math.min(nx, window.innerWidth - 52));
      ny = Math.max(0, Math.min(ny, window.innerHeight - 52));
      gFloat.style.left = nx + 'px';
      gFloat.style.top = ny + 'px';
      gFloat.style.right = 'auto';
      gFloat.style.bottom = 'auto';
    }
  }
  function onEnd(){
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onEnd);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onEnd);
    setTimeout(function(){ gFloatDragging = false; }, 100);
  }
  gFloat.addEventListener('mousedown', onStart);
  gFloat.addEventListener('touchstart', onStart, {passive:true});
}

/* ============ 悬浮弹窗按钮事件 ============ */
(function(){
  var playBtn = document.getElementById('mbFpPlayBtn');
  var prevBtn = document.getElementById('mbFpPrev');
  var nextBtn = document.getElementById('mbFpNext');
  var modeBtn = document.getElementById('mbFpModeBtn');

  if(playBtn) playBtn.addEventListener('click', function(e){
    e.stopPropagation();
    if(audio.paused) audio.play().then(function(){ updateFloatPlayIcon(); }).catch(function(){});
    else { audio.pause(); updateFloatPlayIcon(); }
  });
  if(prevBtn) prevBtn.addEventListener('click', function(e){
    e.stopPropagation(); prevTrack();
  });
  if(nextBtn) nextBtn.addEventListener('click', function(e){
    e.stopPropagation(); nextTrack();
  });
  if(modeBtn) modeBtn.addEventListener('click', function(e){
    e.stopPropagation();
    var i = MODES.findIndex(function(m){ return m.key === state.mode; });
    state.mode = MODES[(i+1)%MODES.length].key;
    updateFloatModeIcon();
    setModeIcon();
    saveAll();
    var label = MODES.find(function(m){ return m.key === state.mode; }).label;
    // 在弹窗上方显示模式提示
    if(gFloatPopup) {
      var tip = document.createElement('div');
      tip.textContent = label;
      tip.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(42,37,32,.8);color:#f5f2ed;padding:4px 12px;border-radius:12px;font-size:11px;white-space:nowrap;z-index:10;pointer-events:none;transition:opacity .3s;';
      gFloatPopup.style.position = 'fixed'; // 确保tip定位正确
      gFloatPopup.appendChild(tip);
      setTimeout(function(){ tip.style.opacity='0'; }, 800);
      setTimeout(function(){ if(tip.parentNode) tip.parentNode.removeChild(tip); }, 1200);
    }
  });

  // 点击弹窗外部关闭
  document.addEventListener('click', function(e){
    if(!gFloatPopupOpen) return;
    if(!gFloatPopup) return;
    if(gFloatPopup.contains(e.target)) return;
    if(gFloat && gFloat.contains(e.target)) return;
    hideFloatPopup();
  });

  // 播放状态变化时更新图标
  audio.addEventListener('play', function(){ updateFloatPlayIcon(); });
  audio.addEventListener('pause', function(){ updateFloatPlayIcon(); });
})();

/* ============ 确保悬浮球在其他界面也可见 ============ */
(function(){
  // Hook showHomePage：在显示主页后重新显示悬浮球
  if (typeof window.showHomePage === 'function') {
    var _origShowHome = window.showHomePage;
    window.showHomePage = function() {
      _origShowHome.apply(this, arguments);
      // 延迟调用，确保在主页渲染完成后执行
      setTimeout(function() {
        if (window.MusicBuddyApp && window.MusicBuddyApp.showGlobalFloat) {
          window.MusicBuddyApp.showGlobalFloat();
        }
      }, 50);
    };
  }

  // Hook switchObjectSession：切换会话后重新显示悬浮球
  if (typeof window.switchObjectSession === 'function') {
    var _origSwitch = window.switchObjectSession;
    window.switchObjectSession = function() {
      _origSwitch.apply(this, arguments);
      setTimeout(function() {
        if (window.MusicBuddyApp && window.MusicBuddyApp.showGlobalFloat) {
          window.MusicBuddyApp.showGlobalFloat();
        }
      }, 50);
    };
  }

  // 监听各种页面切换：通过 MutationObserver 监听 body class 变化
  var observer = new MutationObserver(function(mutations) {
    // 如果音乐伴侣页面已关闭且有当前歌曲，确保悬浮球可见
    var mbPage = document.getElementById('music-buddy-page');
    if (mbPage && mbPage.style.display === 'none' && state.currentSongId) {
      if (gFloat && gFloat.style.display === 'none' && state.companion) {
        gFloat.style.display = 'block';
      }
    }
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] });
})();

// Hook into music buddy entry close to show global float
var _origMbClose = window.MusicBuddyApp ? window.MusicBuddyApp.close : null;

// 在聊天界面显示推荐歌曲弹窗
// 在聊天界面显示推荐歌曲弹窗（与应用内 notifPopup 样式一致）
function showChatSongRecommend(songData, partnerName, partnerAvatar) {
  // 如果已有一个弹窗就先移除
  var old = document.getElementById('chat-song-rec-modal');
  if(old) old.parentNode && old.parentNode.removeChild(old);

  var modal = document.createElement('div');
  modal.id = 'chat-song-rec-modal';
  modal.style.cssText = 'position:fixed;top:50px;left:50%;transform:translateX(-50%) translateY(-80px);width:90%;max-width:340px;background:rgba(245,242,237,.98);backdrop-filter:blur(16px);border-radius:16px;box-shadow:0 12px 40px rgba(42,37,32,.18);z-index:999998;overflow:hidden;font-family:"Noto Serif SC",serif;color:#2a2520;opacity:0;visibility:hidden;pointer-events:none;transition:all .35s cubic-bezier(.4,0,.2,1);';

  var coverHtml = songData.picUrl
    ? '<img src="'+esc(songData.picUrl)+'" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" onerror="this.parentNode.innerHTML=\'🎵\'">'
    : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:18px;color:#7a8b6a;">🎵</div>';

  var avatarHtml = partnerAvatar
    ? '<img src="'+esc(partnerAvatar)+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">'
    : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:14px;color:#9a9189;">👤</div>';

  modal.innerHTML = ''
    +'<div style="display:flex;align-items:center;gap:10px;padding:14px 14px 8px;">'
    +'  <div style="width:40px;height:40px;border-radius:50%;overflow:hidden;flex-shrink:0;background:#ebe5dc;">'+avatarHtml+'</div>'
    +'  <div style="flex:1;min-width:0;">'
    +'    <div style="font-size:13px;font-weight:500;color:#2a2520;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(partnerName||'对方')+'</div>'
    +'    <div style="font-size:12px;color:#9a9189;margin-top:2px;">想和你一起听这首歌～</div>'
    +'  </div>'
    +'  <div style="cursor:pointer;width:24px;height:24px;display:flex;align-items:center;justify-content:center;color:#9a9189;font-size:16px;" id="chatRecClose">×</div>'
    +'</div>'
    +'<div style="display:flex;align-items:center;gap:10px;padding:6px 14px 10px;cursor:pointer;" id="chatRecSongArea">'
    +'  <div style="width:48px;height:48px;border-radius:10px;overflow:hidden;flex-shrink:0;background:#ebe5dc;box-shadow:0 2px 8px rgba(0,0,0,.08);">'+coverHtml+'</div>'
    +'  <div style="flex:1;min-width:0;">'
    +'    <div style="font-size:14px;font-weight:500;color:#2a2520;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(songData.name)+'</div>'
    +'    <div style="font-size:12px;color:#9a9189;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(songData.artist||'')+'</div>'
    +'  </div>'
    +'</div>'
    +'<div style="display:flex;border-top:1px solid rgba(42,37,32,.08);">'
    +'  <button id="chatRecReject" style="flex:1;height:42px;background:none;border:none;font-size:13px;color:#9a9189;cursor:pointer;font-family:inherit;">稍后</button>'
    +'  <div style="width:1px;background:rgba(42,37,32,.08);"></div>'
    +'  <button id="chatRecAccept" style="flex:1;height:42px;background:none;border:none;font-size:13px;color:#7a8b6a;font-weight:500;cursor:pointer;font-family:inherit;">好呀一起听</button>'
    +'</div>';

  document.documentElement.appendChild(modal);

  // 触发显示动画
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      modal.style.visibility = 'visible';
      modal.style.pointerEvents = 'auto';
      modal.style.opacity = '1';
      modal.style.transform = 'translateX(-50%) translateY(0)';
    });
  });

  function closeModal(rejected) {
    modal.style.opacity = '0';
    modal.style.visibility = 'hidden';
    modal.style.pointerEvents = 'none';
    modal.style.transform = 'translateX(-50%) translateY(-80px)';
    var msg = rejected
      ? '那下次再一起听这首歌吧～'
      : '太好啦！《'+songData.name+'》已经加入播放列表了，一起听吧 🎵';
    if(typeof window.addMessage === 'function'){
      window.addMessage({
        id: Date.now(), sender: '对方', text: msg,
        timestamp: new Date(), status: 'received', favorited: false, note: null, type: 'normal'
      });
    }
    setTimeout(function(){ if(modal.parentNode) modal.parentNode.removeChild(modal); }, 400);
  }

  document.getElementById('chatRecClose').addEventListener('click', function(e){ e.stopPropagation(); closeModal(true); });
  document.getElementById('chatRecReject').addEventListener('click', function(e){ e.stopPropagation(); closeModal(true); });
  document.getElementById('chatRecAccept').addEventListener('click', function(e){
    e.stopPropagation();
    window.MusicBuddyApp.addRecommendedSong(songData);
    closeModal(false);
  });
  // 点击歌曲区域也触发同意
  document.getElementById('chatRecSongArea').addEventListener('click', function(e){
    e.stopPropagation();
    window.MusicBuddyApp.addRecommendedSong(songData);
    closeModal(false);
  });

  // 10秒后自动关闭（等同拒绝）
  setTimeout(function(){
    if(modal.parentNode && modal.style.opacity !== '0') closeModal(true);
  }, 10000);
}

// 暴露给聊天界面的推荐歌曲接口
window.MusicBuddyApp.recommendSongToChat = function(songData, partnerName, partnerAvatar) {
  // songData: {name, artist, neteaseId, picUrl, src}
  // 在聊天界面显示推荐歌曲弹窗
  showChatSongRecommend(songData, partnerName, partnerAvatar);
};

window.MusicBuddyApp.addRecommendedSong = function(songData) {
  // 将推荐歌曲加入默认歌单，带 recommended 标记
  var song = {
    id: 'rec_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6),
    name: songData.name,
    artist: songData.artist || '',
    neteaseId: songData.neteaseId || '',
    picUrl: songData.picUrl || '',
    type: 'netease',
    src: songData.src || ('https://music.163.com/song/media/outer/url?id='+(songData.neteaseId||'')+'.mp3'),
    lyrics: '',
    recommended: true,
    recommendedAt: Date.now(),
    recommendedBy: songData.recommendedBy || '对方'
  };
  // 加入默认歌单
  var defaultPl = state.user.playlists[0];
  if(defaultPl && !defaultPl.songs.some(function(s){ return s.name === song.name && s.artist === song.artist; })){
    defaultPl.songs.push(song);
  }
  // 也加入 allSongs
  if(!allSongs.some(function(s){ return s.id === song.id; })){
    allSongs.push(song);
  }
  // 加入当前伴侣的推荐记录
  if(state.companion && state.companion.partnerId){
    var p = state.partners.find(function(pp){ return pp.id === state.companion.partnerId; });
    if(p){
      if(!p.recommendedSongs) p.recommendedSongs = [];
      if(!p.recommendedSongs.some(function(s){ return s.name === song.name; })){
        p.recommendedSongs.unshift(song);
        if(p.recommendedSongs.length > 20) p.recommendedSongs = p.recommendedSongs.slice(0,20);
      }
    }
  }
  saveAll();
  updateGlobalFloat(song);
  return song;
};

window.MusicBuddyApp.getRandomSongFromPlaylists = function() {
  // 从用户所有歌单中随机取一首歌
  var userSongs = [];
  state.user.playlists.forEach(function(pl){ pl.songs.forEach(function(s){ userSongs.push(s); }); });
  if(userSongs.length === 0) return null;
  return userSongs[Math.floor(Math.random() * userSongs.length)];
};

/* 暴露初始化接口给 music-buddy-entry.js：首次打开页面时调用 */
window.MusicBuddyApp=(window.MusicBuddyApp||{});
window.MusicBuddyApp.init=(typeof init==='function'?init:function(){});
window.MusicBuddyApp._initialized=false;
})();

// ---------- Chat ----------
function openConv(id,type){
  var c=contacts.find(function(x){return x.id===id});
  var g=groups.find(function(x){return x.id===id});
  var item=c||g;
  if(!item)return;
  if(cid&&cid!==id){
    lastCid=cid;
  }
  cid=id;window.currentCid=id;
  window.currentConvType=type||(c?'contact':'group');
  // ★ 切换联系人时重置渲染窗口，避免继承上一个联系人的窗口位置
  _renderStartIdx=null;
  var typingEl=$('typing');if(typingEl)typingEl.style.display=typingStates[id]?'flex':'none';
  var convTitle=$('conv-title');if(convTitle)convTitle.textContent=item.hideName?'':item.name;
  
  var avatarHtml='';
  if(c&&c.avatar){
    avatarHtml='<img src="'+c.avatar.replace(/"/g,'&quot;')+'">';
  }else if(g&&g.avatar&&g.avatar.startsWith('data:image')){
    avatarHtml='<img src="'+g.avatar.replace(/"/g,'&quot;')+'" style="display:block;width:100%;height:100%;object-fit:cover;">';
  }else if(g){
    avatarHtml='👥';
  }else{
    avatarHtml='✦';
  }
  $('nav-contact-avatar').innerHTML=avatarHtml;
  
  var avatarShape=c&&c.avatarShape||'square';
  var avatarRadius=avatarShape==='circle'?'50%':'16px';
  if($('nav-contact-avatar'))$('nav-contact-avatar').style.borderRadius=avatarRadius;
  document.documentElement.style.setProperty('--avatar-radius',avatarRadius);
  
  var isGroup=type==='group'||g;
  var state=isGroup?null:navDisplayStates[id];
  if(state){
    if(state.weather&&$('nav-weather'))$('nav-weather').textContent=state.weather;
    if(state.time&&$('nav-time'))$('nav-time').textContent=state.time;
    if(state.status&&$('nav-contact-status'))$('nav-contact-status').textContent=state.status;
    if(state.idle&&$('nav-idle'))$('nav-idle').textContent=state.idle;
    if(state.mood&&$('nav-mood'))$('nav-mood').textContent=state.mood;
  }
  var hideNavInfo=isGroup?true:!!(c&&c.hideNavInfo);
  if($('nav-info-row1'))$('nav-info-row1').style.display=hideNavInfo?'none':'';
  if($('nav-info-row2'))$('nav-info-row2').style.display=hideNavInfo?'none':'';
  var hideTopbarAvatarStatus=!!(c&&c.hideTopbarAvatarStatus);
  if($('nav-contact-status'))$('nav-contact-status').style.display=(isGroup||hideTopbarAvatarStatus)?'none':'';
  if($('nav-contact-avatar'))$('nav-contact-avatar').style.display=(isGroup||hideTopbarAvatarStatus)?'none':'flex';
  if($('nav-weather'))$('nav-weather').style.display=isGroup?'none':'';
  if($('nav-time'))$('nav-time').style.display=isGroup?'none':'';
  if($('nav-mood'))$('nav-mood').style.display=isGroup?'none':'';
  if($('nav-idle'))$('nav-idle').style.display=isGroup?'none':'';
  
  applyInputBarVisibility(c);
  
  var hideAvatars=!!(c&&c.hideChatAvatars);
  document.querySelectorAll('.ibar').forEach(function(el){
    if(hideAvatars){
      el.style.background='rgba(255,255,255,0.5)';
    }else{
      el.style.background='';
    }
  });
  
  showPg('pg-conv');
  updateBottomNavVisibility();

  // 星言日历：每日首次进入联系人面板时弹出今日心情与TA留言
  if(c){
    checkAndShowDailyMood(id);
  }else{
    updateDailyMoodBar(null);
  }
  
  // 优化：先从内存/localStorage同步加载并渲染消息（用户立刻看到聊天内容）
  var key=LM+id;
  var cached=memoryCache[key];
  if(!cached||!Array.isArray(cached)||cached.length===0){
    var lsVal=ls(key);
    if(lsVal&&Array.isArray(lsVal)){
      lsVal.forEach(function(x){
        if(!(x.ts instanceof Date))x.ts=new Date(x.ts);
        if(x.read===undefined)x.read=true;
      });
      memoryCache[key]=lsVal;
      cached=lsVal;
    }
  }
  
  if(cached&&cached.length>0){
    // 内存有数据：立即渲染
    renderMsgs(cached);
    markMessagesRead(id);
    // 后台从DB补充（如果有新数据）
    loadMsgsToCache(id).then(function(){
      renderMsgs();
      markMessagesRead(id);
    }).catch(function(){});
    loadContactMsgImages(id).catch(function(){});
  }else{
    // 内存没有数据：显示加载状态，异步从DB加载
    var box=$('msgbox');
    if(box){
      box.innerHTML='<div style="text-align:center;padding:40px 20px;color:var(--txt3);font-size:13px;"><div style="display:inline-block;width:24px;height:24px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin 0.8s linear infinite;margin-bottom:8px;"></div><div>加载消息中...</div></div>';
    }
    loadMsgsToCache(id).then(function(){
      renderMsgs();
      markMessagesRead(id);
      loadContactMsgImages(id).catch(function(){});
    }).catch(function(){});
  }
  
  // 确保滚动到最新消息
  setTimeout(function(){
    var box=$('msgbox');
    if(box)box.scrollTop=box.scrollHeight;
  },150);
  
  // chat settings 后台异步应用（不阻塞消息显示）
  applyChatSettings(c||g).catch(function(){});
  var savedInput=sessionStorage.getItem('msg-inp-'+id);
  if(savedInput)$('msg-inp').value=savedInput;
  else{$('msg-inp').value='';}
  $('msg-inp').style.height='auto';
  $('msg-inp').style.height=Math.min($('msg-inp').scrollHeight,100)+'px';
  replyingToMsg=null;
  $('quote-preview').style.display='none';
  updateSendBtn();
  
  var avatar=$('nav-contact-avatar');
  avatar.onclick=null;
  avatar.addEventListener('click',function(){if(c)showContactProfile(id)});
}

function showContactProfile(contactId){
  var c=contacts.find(function(x){return x.id===contactId});
  if(!c)return;

  currentProfileContactId=contactId;
  window._contactLetterTab='all';

  // 修复：先绑定所有按钮事件，再执行渲染，防止渲染异常导致按钮失效
  // 每个绑定独立 try-catch，防止一个失败导致后续全部失效
  try{$('contact-profile-anniversary-add').onclick=function(){showAddAnniversaryModal(contactId)};}catch(e){console.warn('bind anniversary-add failed:',e)}
  try{$('contact-profile-song-add').onclick=function(){showAddSongModal(contactId)};}catch(e){console.warn('bind song-add failed:',e)}
  try{$('contact-profile-divine-add').onclick=function(){showAddDivineRecordModal(contactId)};}catch(e){console.warn('bind divine-add failed:',e)}
  try{$('contact-profile-divine-import').onclick=function(){showImportDivineRecordModal(contactId)};}catch(e){console.warn('bind divine-import failed:',e)}
  try{$('contact-profile-call-btn').onclick=function(){hideOv('ov-contact-profile');cid=contactId;initiateCall()};}catch(e){console.warn('bind call-btn failed:',e)}
  try{$('contact-profile-toggle-status').onclick=function(){
    var c=$('contact-profile-status-collapse');
    var a=$('contact-profile-toggle-arrow');
    if(!c)return;
    if(c.style.display==='none'){c.style.display='block';if(a)a.style.transform='rotate(180deg)'}
    else{c.style.display='none';if(a)a.style.transform=''}
  };}catch(e){console.warn('bind toggle-status failed:',e)}
  try{$('contact-profile-write-letter').onclick=function(){openContactLetterWrite(contactId)};}catch(e){console.warn('bind write-letter failed:',e)}
  try{$('contact-profile-letter-import').onclick=function(){importContactLetters(contactId)};}catch(e){console.warn('bind letter-import failed:',e)}
  try{$('contact-profile-letter-export').onclick=function(){exportContactLetters(contactId)};}catch(e){console.warn('bind letter-export failed:',e)}
  try{$('contact-profile-giftbox-btn').onclick=function(){showGiftBox(contactId)};}catch(e){console.warn('bind giftbox-btn failed:',e)}

  $('contact-profile-avatar').innerHTML=c.avatar?'<img src="'+c.avatar.replace(/"/g,'&quot;')+'" style="display:block;width:100%;height:100%;object-fit:cover;">':'✦';
  $('contact-profile-avatar').onclick=function(){showAvatarPreview(c.avatar,c.name)};
  $('contact-profile-avatar').title='点击放大头像';
  $('contact-profile-nickname').textContent=c.name;
  $('contact-profile-status').textContent=c.status||'在线';

  try{renderContactAvatarHistory(contactId);}catch(e){console.warn('avatar history err:',e)}

  var state=navDisplayStates[contactId];
  $('contact-profile-weather').textContent=state&&state.weather||'-';
  $('contact-profile-time').textContent=state&&state.time||'-';
  $('contact-profile-nav-status').textContent=state&&state.status||'-';
  $('contact-profile-idle').textContent=state&&state.idle||'-';
  $('contact-profile-mood').textContent=state&&state.mood||'-';

  try{updateContactProfileStarCard(contactId);}catch(e){console.warn('starCard err:',e)}
  try{loadStarCalData().then(function(){updateContactProfileStarCard(contactId)});}catch(e){console.warn('starCal err:',e)}

  requestAnimationFrame(function(){
    try{renderContactAnniversaryList(contactId)}catch(e){console.warn('anniversary err:',e)}
    try{renderContactSongList(contactId)}catch(e){console.warn('song err:',e)}
    try{renderContactDivineHistory(contactId)}catch(e){console.warn('divine err:',e)}
    try{renderContactCallHistory(contactId)}catch(e){console.warn('call err:',e)}
    try{renderContactRedPacketHistory(contactId)}catch(e){console.warn('redpacket err:',e)}
    try{renderContactLetterHistory(contactId)}catch(e){console.warn('letter err:',e)}
    try{renderContactProfileGiftSummary(contactId)}catch(e){console.warn('gift err:',e)}
  });
  
  var letterTabs=document.querySelectorAll('.contact-letter-tab');
  letterTabs.forEach(function(t){
    t.onclick=function(){
      window._contactLetterTab=t.dataset.tab;
      renderContactLetterHistory(contactId);
    };
  });
  
  $('contact-profile-close').onclick=function(){hideOv('ov-contact-profile')};
  
  $('contact-profile-nickname').onclick=function(){
    var newName=prompt('请输入新的昵称：',c.name);
    if(newName&&newName.trim()){
      c.name=newName.trim();
      saveC();
      $('contact-profile-nickname').textContent=c.name;
      if($('conv-title')){$('conv-title').textContent=c.name}
      renderChatList();
      toast('昵称已修改');
    }
  };
  
  $('contact-profile-bg').style.background='white';
  
  var ov=$('ov-contact-profile');
  if(ov){ov.style.zIndex='9999';ov.style.background='var(--bg)';ov.style.alignItems='flex-start';}
  var modal=ov&&ov.querySelector('.modal');
  if(modal){modal.style.minHeight='100vh';modal.style.maxHeight='100vh';}
  showOv('ov-contact-profile');
  
  setupProfileSwipeBack();
}

async function refreshContactProfileStatus(e){
  if(e)e.stopPropagation();
  var contactId=currentProfileContactId;
  if(!contactId)return;
  var btn=$('contact-profile-refresh-status');
  if(btn){btn.textContent='⏳ 刷新中...';btn.disabled=true;}
  
  var c=contacts.find(function(x){return x.id===contactId});
  if(!c){if(btn){btn.textContent='🔄 刷新状态';btn.disabled=false;}return;}
  
  await updateNavContactStatus(c);
  await updateNavWeather(contactId);
  await updateNavTime(contactId);
  await updateNavIdle(contactId);
  await updateNavMood(contactId);
  
  var state=navDisplayStates[contactId];
  $('contact-profile-weather').textContent=state&&state.weather||'-';
  $('contact-profile-time').textContent=state&&state.time||'-';
  $('contact-profile-nav-status').textContent=state&&state.status||'-';
  $('contact-profile-idle').textContent=state&&state.idle||'-';
  $('contact-profile-mood').textContent=state&&state.mood||'-';
  
  if(btn){btn.textContent='🔄 刷新状态';btn.disabled=false;}
  toast('状态已刷新');
}

var _profileSwipeHandlers=null;
function setupProfileSwipeBack(){
  if(_profileSwipeHandlers){
    document.removeEventListener('touchstart',_profileSwipeHandlers.start,true);
    document.removeEventListener('touchmove',_profileSwipeHandlers.move,true);
    document.removeEventListener('touchend',_profileSwipeHandlers.end,true);
  }
  
  var startX=0,startY=0,isEdgeSwipe=false,hasMoved=false;
  var EDGE_THRESHOLD=30;
  var SWIPE_THRESHOLD=80;
  var VERTICAL_LIMIT=60;
  
  function onTouchStart(e){
    var touch=e.touches[0];
    startX=touch.clientX;
    startY=touch.clientY;
    isEdgeSwipe=(startX<=EDGE_THRESHOLD);
    hasMoved=false;
  }
  
  function onTouchMove(e){
    if(!isEdgeSwipe)return;
    var touch=e.touches[0];
    var dx=touch.clientX-startX;
    var dy=Math.abs(touch.clientY-startY);
    
    if(dx>0&&dy<VERTICAL_LIMIT){
      hasMoved=true;
      e.preventDefault();
      e.stopPropagation();
    }
  }
  
  function onTouchEnd(e){
    if(!isEdgeSwipe)return;
    if(!hasMoved){
      isEdgeSwipe=false;
      return;
    }
    
    var touch=(e.changedTouches&&e.changedTouches[0])||null;
    if(!touch){isEdgeSwipe=false;return;}
    
    var dx=touch.clientX-startX;
    var dy=Math.abs(touch.clientY-startY);
    
    if(dx>SWIPE_THRESHOLD&&dy<VERTICAL_LIMIT){
      hideOv('ov-contact-profile');
    }
    
    isEdgeSwipe=false;
    hasMoved=false;
  }
  
  _profileSwipeHandlers={start:onTouchStart,move:onTouchMove,end:onTouchEnd};
  
  document.addEventListener('touchstart',onTouchStart,true);
  document.addEventListener('touchmove',onTouchMove,{passive:false,capture:true});
  document.addEventListener('touchend',onTouchEnd,true);
}

function removeProfileSwipeBack(){
  if(_profileSwipeHandlers){
    document.removeEventListener('touchstart',_profileSwipeHandlers.start,true);
    document.removeEventListener('touchmove',_profileSwipeHandlers.move,true);
    document.removeEventListener('touchend',_profileSwipeHandlers.end,true);
    _profileSwipeHandlers=null;
  }
}

function changeProfileAvatar(contactId){
  var input=document.createElement('input');
  input.type='file';
  input.accept='image/'+'*';
  input.onchange=function(e){
    var file=e.target.files[0];
    if(!file)return;
    compressImage(file,512,0.92,function(res){
      if(!res){
        toast('图片压缩失败');
        return;
      }
      var c=contacts.find(function(x){return x.id===contactId});
      if(c){
        c.avatar=res;
        saveC();
        $('contact-profile-avatar').innerHTML='<img src="'+res.replace(/"/g,'&quot;')+'" style="display:block;width:100%;height:100%;object-fit:cover;">';
        renderChatList();
        renderMsgs();
        if($('nav-contact-avatar')){
          $('nav-contact-avatar').innerHTML=c.avatar?'<img src="'+c.avatar.replace(/"/g,'&quot;')+'" style="display:block;width:100%;height:100%;object-fit:cover;">':'✦';
        }
        if($('conv-title-avatar')){
          $('conv-title-avatar').innerHTML=c.avatar?'<img src="'+c.avatar.replace(/"/g,'&quot;')+'" style="display:block;width:100%;height:100%;object-fit:cover;">':'✦';
        }
        toast('头像已更新');
      }
    });
  };
  input.click();
}

// 放大查看头像
function showAvatarPreview(avatarUrl,name){
  if(!avatarUrl){toast('暂无头像');return;}
  var ov=document.createElement('div');
  ov.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;';
  ov.innerHTML='<div style="color:#fff;font-size:16px;margin-bottom:16px;">'+(name||'')+'</div>'+
    '<img src="'+avatarUrl.replace(/"/g,'&quot;')+'" style="max-width:90%;max-height:70vh;object-fit:contain;border-radius:12px;">'+
    '<div style="display:flex;gap:12px;margin-top:16px;">'+
    '<button style="padding:10px 24px;border:1px solid rgba(255,255,255,0.3);border-radius:8px;background:transparent;color:#fff;font-size:14px;cursor:pointer;" onclick="this.parentElement.parentElement.remove()">关闭</button>'+
    '</div>';
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  document.body.appendChild(ov);
}

// 渲染联系人主动更换头像记录
function renderContactAvatarHistory(contactId){
  var list=$('contact-profile-avatar-history');
  if(!list)return;
  var c=contacts.find(function(x){return x.id===contactId});
  if(!c){list.innerHTML='<div style="font-size:12px;color:var(--txt3);text-align:center;padding:12px;">暂无记录</div>';return;}
  var history=c.avatarChangeHistory||[];
  if(!history.length){
    list.innerHTML='<div style="font-size:12px;color:var(--txt3);text-align:center;padding:12px;">暂无记录</div>';
    return;
  }
  var html='';
  var rev=history.slice().reverse();
  rev.forEach(function(h,i){
    var typeLabel='';
    if(h.type==='chat')typeLabel='聊天头像';
    else if(h.type==='mail')typeLabel='信箱头像';
    else if(h.type==='moment')typeLabel='朋友圈头像';
    else typeLabel='头像';
    var dt=new Date(h.time);
    var dateStr=dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');
    var timeStr=String(dt.getHours()).padStart(2,'0')+':'+String(dt.getMinutes()).padStart(2,'0');
    html+='<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border-light);">'+
      '<div class="avh-img" data-avh-idx="'+i+'" data-avh-key="'+(h.avatar||'')+'" style="width:32px;height:32px;border-radius:50%;overflow:hidden;flex-shrink:0;background:var(--c3);display:flex;align-items:center;justify-content:center;cursor:pointer;" onclick="var s=this.querySelector(\'img\');if(s&&s.src){showAvatarPreview(s.src,\'更换'+typeLabel+'\');}">'+
      '<span style="font-size:14px;color:var(--txt3);">✦</span>'+
      '</div>'+
      '<div style="flex:1;min-width:0;">'+
      '<div style="font-size:12px;color:var(--txt);">更换了'+typeLabel+'</div>'+
      '<div style="font-size:10px;color:var(--txt3);">'+dateStr+' '+timeStr+'</div>'+
      '</div>'+
      '</div>';
  });
  list.innerHTML=html;
  // 分批异步加载图片，避免一次性加载过多导致卡顿
  if(window.localforage){
    var batchSize=5;
    var currentIndex=0;
    function loadNextBatch(){
      if(currentIndex>=rev.length)return;
      var end=Math.min(currentIndex+batchSize,rev.length);
      var batch=[];
      for(var i=currentIndex;i<end;i++){
        (function(idx, h){
          var avKey=h.avatar||'';
          var isRef=h.isRef===true;
          if(!avKey)return;
          var el=list.querySelector('.avh-img[data-avh-idx="'+idx+'"]');
          if(!el)return;
          if(isRef){
            batch.push(new Promise(function(resolve){
              window.localforage.getItem(avKey).then(function(imgData){
                if(imgData&&el){
                  el.innerHTML='<img src="'+imgData.replace(/"/g,'&quot;')+'" style="display:block;width:100%;height:100%;object-fit:cover;">';
                }
                resolve();
              }).catch(function(){resolve();});
            }));
          }else{
            el.innerHTML='<img src="'+avKey.replace(/"/g,'&quot;')+'" style="display:block;width:100%;height:100%;object-fit:cover;">';
          }
        })(i, rev[i]);
      }
      Promise.all(batch).then(function(){
        currentIndex=end;
        setTimeout(loadNextBatch, 0);
      }).catch(function(){
        currentIndex=end;
        setTimeout(loadNextBatch, 0);
      });
    }
    loadNextBatch();
  }else{
    rev.forEach(function(h,i){
      var avKey=h.avatar||'';
      var isRef=h.isRef===true;
      if(!avKey)return;
      var el=list.querySelector('.avh-img[data-avh-idx="'+i+'"]');
      if(!el)return;
      if(!isRef){
        el.innerHTML='<img src="'+avKey.replace(/"/g,'&quot;')+'" style="display:block;width:100%;height:100%;object-fit:cover;">';
      }
    });
  }
}

// 记录联系人主动更换头像（图片数据存储到IndexedDB，与头像库独立，避免localStorage空间不足）
async function recordAvatarChange(contactId,type,avatarData){
  var c=contacts.find(function(x){return x.id===contactId});
  if(!c)return;
  if(!c.avatarChangeHistory)c.avatarChangeHistory=[];
  var imgId='ml2_avh_'+contactId+'_'+Date.now()+'_'+Math.random().toString(36).substr(2,6);
  if(window.localforage&&avatarData){
    try{await window.localforage.setItem(imgId,avatarData);}catch(e){console.warn('recordAvatarChange: save image failed',e);}
  }
  c.avatarChangeHistory.push({
    time:Date.now(),
    type:type,
    avatar: imgId,
    isRef: true
  });
  saveC();
}

function uploadContactRingtone(contactId){
  var input=document.createElement('input');
  input.type='file';
  input.accept='audio/'+'*';
  input.onchange=function(e){
    var file=e.target.files[0];
    if(!file)return;
    var reader=new FileReader();
    reader.onload=function(ev){
      var dataUrl=ev.target.result;
      var c=contacts.find(function(x){return x.id===contactId});
      if(c){
        if(!c.soundSettings)c.soundSettings={sendEnabled:true,recvEnabled:true,sendSound:'',recvSound:'',ringtone:''};
        c.soundSettings.ringtone=dataUrl;
        saveC();
        toast('铃声已保存');
      }
      input.remove();
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function playContactRingtone(contactId){
  var c=contacts.find(function(x){return x.id===contactId});
  var ringtone=(c&&c.soundSettings&&c.soundSettings.ringtone)||(c&&c.ringtone);
  if(!ringtone)return;
  var audio=new Audio(ringtone);
  audio.volume=0.8;
  audio.play().catch(function(e){});
  toast('正在播放铃声...');
}

function deleteContactRingtone(contactId){
  var c=contacts.find(function(x){return x.id===contactId});
  if(!c)return;
  if(c.soundSettings)c.soundSettings.ringtone='';
  delete c.ringtone;
  saveC();
  toast('铃声已删除');
}

function renderContactDivineHistory(contactId){
  var list=$('contact-profile-divine-list');
  if(!list)return;
  list.innerHTML='';
  
  // 始终确保数据已加载（loadDivineHistory 会检查是否已加载过）
  loadDivineHistory();
  
  if(!divineHistory||!Array.isArray(divineHistory)){
    list.innerHTML='<div class="empty" style="text-align:center;padding:20px;color:var(--txt3);font-size:12px">暂无占卜记录</div>';
    return;
  }
  
  var contact=contacts.find(function(x){return x.id===contactId});
  var contactName=contact?contact.name:'';
  var contactRecords=divineHistory.filter(function(item){
    if(!item)return false;
    // 1. 直接按 contactId 匹配（联系人 id 或 target_xxx）
    if(item.contactId!==null&&item.contactId!==undefined&&String(item.contactId)===String(contactId))return true;
    // 2. 按 contactName 匹配（占卜对象是 target 类型时，contactId 是 target_xxx，但 contactName 是联系人名字）
    if(contactName&&item.contactName===contactName)return true;
    return false;
  });
  
  if(contactRecords.length===0){
    list.innerHTML='<div class="empty" style="text-align:center;padding:20px;color:var(--txt3);font-size:12px">暂无占卜记录</div>';
    return;
  }
  
  contactRecords.forEach(function(item){
    var el=document.createElement('div');
    el.className='result-card';
    el.style.marginBottom='8px';
    el.style.border='1px solid var(--border)';
    el.style.borderRadius='8px';
    el.style.cursor='pointer';
    el.style.transition='background 0.2s';
    el.onclick=function(){showDivineRecordDetail(item)};
    var textPreview=(item.text||'').substring(0,50);
    if((item.text||'').length>50)textPreview+='...';
    var questionText=item.question||'无问题';
    el.innerHTML='<div style="padding:10px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><span style="font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;margin-right:8px;">'+questionText+'</span><span style="font-size:10px;color:var(--txt3);flex-shrink:0;">'+(item.time||'')+'</span></div><div style="font-size:11px;color:var(--txt2);margin-bottom:6px">'+textPreview+'</div><div style="display:flex;gap:6px;"><button onclick="event.stopPropagation();editDivineRecord(\''+item.id+'\')" style="padding:2px 8px;font-size:10px;border:none;border-radius:4px;background:var(--accent);color:white;cursor:pointer">编辑</button><button onclick="event.stopPropagation();deleteDivineRecord(\''+item.id+'\')" style="padding:2px 8px;font-size:10px;border:none;border-radius:4px;background:#FF6B6B;color:white;cursor:pointer">删除</button></div></div>';
    list.appendChild(el);
  });
}

var contactLetterTargetId=null;
var _contactLetterIsReply=false; // ★ 标记聊天页写信弹窗是否为"回信"（true=回信，false=写信）
var contactAnniversaries={};

function getContactAnniversaries(contactId){
  if(!contactAnniversaries[contactId]){
    var saved=ls('ml2_contact_anniversaries_'+contactId);
    contactAnniversaries[contactId]=saved&&Array.isArray(saved)?saved:[];
  }
  return contactAnniversaries[contactId];
}

function saveContactAnniversaries(contactId){
  ls('ml2_contact_anniversaries_'+contactId,contactAnniversaries[contactId]);
}

function renderContactAnniversaryList(contactId){
  var list=$('contact-profile-anniversary-list');
  list.innerHTML='';
  
  var anniversaries=getContactAnniversaries(contactId);
  
  if(anniversaries.length===0){
    list.innerHTML='<div style="text-align:center;padding:20px;color:var(--txt3);font-size:12px">🎂 暂无纪念日</div>';
    return;
  }
  
  anniversaries.forEach(function(ann){
    var daysLeft=getDaysUntilAnniversary(ann.date);
    var dayText='';
    var dayColor='var(--txt)';
    
    if(daysLeft===0){
      dayText='今天';
      dayColor='var(--accent)';
    }else if(daysLeft===1){
      dayText='明天';
      dayColor='var(--accent)';
    }else if(daysLeft<0){
      dayText='已过去'+Math.abs(daysLeft)+'天';
      dayColor='var(--txt3)';
    }else{
      dayText=daysLeft+'天后';
    }
    
    var dateObj=new Date(ann.date);
    var dateStr=(dateObj.getMonth()+1)+'/'+dateObj.getDate();
    var yearStr=dateObj.getFullYear();
    
    var item=document.createElement('div');
    item.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:12px 12px;margin-bottom:8px;border-radius:12px;background:var(--c1);cursor:pointer;transition:background 0.2s;';
    item.innerHTML='<div><div style="font-size:13px;color:var(--txt);font-weight:500;">'+ann.name+'</div><div style="font-size:11px;color:var(--txt3);margin-top:3px;">'+dateStr+' ('+yearStr+'年)</div></div><div style="font-size:12px;color:'+dayColor+';font-weight:600;">'+dayText+'</div>';
    
    item.addEventListener('click',function(){
      showEditAnniversaryModal(contactId,ann);
    });
    
    list.appendChild(item);
  });
}

function getDaysUntilAnniversary(dateStr){
  var today=new Date();
  today.setHours(0,0,0,0);
  
  var anniversary=new Date(dateStr);
  anniversary.setHours(0,0,0,0);
  
  var thisYearAnniversary=new Date(today.getFullYear(),anniversary.getMonth(),anniversary.getDate());
  
  if(thisYearAnniversary<today){
    var diffTime=today-thisYearAnniversary;
    return -Math.ceil(diffTime/(1000*60*60*24));
  }
  
  var diffTime=thisYearAnniversary-today;
  var diffDays=Math.ceil(diffTime/(1000*60*60*24));
  
  return diffDays;
}

function showAddAnniversaryModal(contactId){
  var dateInput=document.createElement('input');
  dateInput.type='date';
  dateInput.style.cssText='width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:10px;font-size:13px;';
  
  var nameInput=document.createElement('input');
  nameInput.type='text';
  nameInput.placeholder='纪念日名称（如：相识纪念日）';
  nameInput.style.cssText='width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:10px;font-size:13px;';
  
  var content='<div style="padding:10px;">'+
    '<div style="font-size:14px;font-weight:600;color:var(--txt);margin-bottom:12px;">🎂 新增纪念日</div>'+
    '<div style="margin-bottom:8px;font-size:13px;color:var(--txt2);">纪念日名称</div>'+
    '</div>';
  
  var modal=document.createElement('div');
  modal.className='overlay';
  modal.id='ov-anniversary-add';
  modal.innerHTML='<div class="modal"><div class="modal-head"><div class="modal-title">🎂 新增纪念日</div><div class="modal-actions"><button class="btn-modal" onclick="hideOv(\'ov-anniversary-add\')">✕</button></div></div><div class="modal-body" style="padding:20px;"><div style="margin-bottom:12px;"><label style="font-size:13px;color:var(--txt2);margin-bottom:6px;display:block;">纪念日名称</label><input type="text" id="anniversary-name-input" placeholder="如：相识纪念日" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:13px;"></div><div style="margin-bottom:16px;"><label style="font-size:13px;color:var(--txt2);margin-bottom:6px;display:block;">日期</label><input type="date" id="anniversary-date-input" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:13px;"></div><div style="display:flex;gap:10px;"><button class="btn-outline" style="flex:1;padding:10px;border-radius:8px;font-size:13px;" onclick="hideOv(\'ov-anniversary-add\')">取消</button><button class="btn-primary" style="flex:1;padding:10px;border-radius:8px;font-size:13px;" onclick="addContactAnniversary(\''+contactId+'\')">添加</button></div></div></div></div>';
  
  document.body.appendChild(modal);
  showOv('ov-anniversary-add');
}

function addContactAnniversary(contactId){
  var name=$('anniversary-name-input').value.trim();
  var date=$('anniversary-date-input').value;
  
  if(!name){
    toast('请输入纪念日名称');
    return;
  }
  if(!date){
    toast('请选择日期');
    return;
  }
  
  var anniversaries=getContactAnniversaries(contactId);
  anniversaries.push({
    id:'ann_'+Date.now(),
    name:name,
    date:date
  });
  
  saveContactAnniversaries(contactId);
  renderContactAnniversaryList(contactId);
  hideOv('ov-anniversary-add');
  toast('纪念日已添加');
}

function showEditAnniversaryModal(contactId,ann){
  var modal=document.createElement('div');
  modal.className='overlay';
  modal.id='ov-anniversary-edit';
  modal.innerHTML='<div class="modal"><div class="modal-head"><div class="modal-title">🎂 编辑纪念日</div><div class="modal-actions"><button class="btn-modal" onclick="hideOv(\'ov-anniversary-edit\')">✕</button></div></div><div class="modal-body" style="padding:20px;"><div style="margin-bottom:12px;"><label style="font-size:13px;color:var(--txt2);margin-bottom:6px;display:block;">纪念日名称</label><input type="text" id="anniversary-edit-name" value="'+ann.name+'" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:13px;"></div><div style="margin-bottom:16px;"><label style="font-size:13px;color:var(--txt2);margin-bottom:6px;display:block;">日期</label><input type="date" id="anniversary-edit-date" value="'+ann.date+'" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:13px;"></div><div style="display:flex;gap:10px;"><button class="btn-outline" style="flex:1;padding:10px;border-radius:8px;font-size:13px;" onclick="hideOv(\'ov-anniversary-edit\')">取消</button><button class="btn-primary" style="flex:1;padding:10px;border-radius:8px;font-size:13px;" onclick="editContactAnniversary(\''+contactId+'\',\''+ann.id+'\')">保存</button></div><div style="margin-top:10px;"><button style="width:100%;padding:10px;border-radius:8px;font-size:13px;border:none;background:#ff6b6b;color:white;cursor:pointer;" onclick="deleteContactAnniversary(\''+contactId+'\',\''+ann.id+'\')">删除</button></div></div></div></div>';
  
  document.body.appendChild(modal);
  showOv('ov-anniversary-edit');
}

function editContactAnniversary(contactId,annId){
  var name=$('anniversary-edit-name').value.trim();
  var date=$('anniversary-edit-date').value;
  
  if(!name){
    toast('请输入纪念日名称');
    return;
  }
  if(!date){
    toast('请选择日期');
    return;
  }
  
  var anniversaries=getContactAnniversaries(contactId);
  var ann=anniversaries.find(function(a){return a.id===annId});
  if(ann){
    ann.name=name;
    ann.date=date;
    saveContactAnniversaries(contactId);
    renderContactAnniversaryList(contactId);
    hideOv('ov-anniversary-edit');
    toast('纪念日已更新');
  }
}

function deleteContactAnniversary(contactId,annId){
  customConfirm('确定要删除这个纪念日吗？').then(function(ok){
    if(!ok)return;
    var anniversaries=getContactAnniversaries(contactId);
    anniversaries=anniversaries.filter(function(a){return a.id!==annId});
    contactAnniversaries[contactId]=anniversaries;
    saveContactAnniversaries(contactId);
    renderContactAnniversaryList(contactId);
    hideOv('ov-anniversary-edit');
    toast('纪念日已删除');
    haptic('warn');
  });
}

var contactSongs={};
function getContactSongs(contactId){
  if(!contactSongs[contactId]){
    var saved=ls('ml2_contact_songs_'+contactId);
    contactSongs[contactId]=saved&&Array.isArray(saved)?saved:[];
  }
  return contactSongs[contactId];
}
function saveContactSongs(contactId){
  ls('ml2_contact_songs_'+contactId,contactSongs[contactId]);
}
function renderContactSongList(contactId){
  var list=$('contact-profile-song-list');
  list.innerHTML='';
  var songs=getContactSongs(contactId);
  if(songs.length===0){
    list.innerHTML='<div style="text-align:center;padding:20px;color:var(--txt3);font-size:12px">🎵 暂无推歌记录</div>';
    return;
  }
  songs.forEach(function(song){
    var item=document.createElement('div');
    item.style.cssText='display:flex;align-items:flex-start;gap:12px;padding:12px;margin-bottom:8px;border-radius:12px;background:var(--c1);cursor:pointer;transition:background 0.2s;';
    var imageHtml=song.image?'<img src="'+song.image+'" style="width:44px;height:44px;border-radius:8px;object-fit:cover;flex-shrink:0;">':'';
    var noteHtml=song.note?'<div style="font-size:11px;color:var(--txt3);margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+song.note+'</div>':'';
    item.innerHTML=''+imageHtml+'<div style="flex:1;min-width:0;"><div style="font-size:13px;color:var(--txt);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+song.title+'</div>'+noteHtml+'</div><div style="font-size:11px;color:var(--txt3);flex-shrink:0;margin-top:6px;">'+song.date+'</div>';
    item.onclick=function(){showEditSongModal(contactId,song)};
    list.appendChild(item);
  });
}
function showAddSongModal(contactId){
  var modal=document.createElement('div');
  modal.className='overlay';
  modal.id='ov-song-add';
  modal.innerHTML='<div class="modal"><div class="modal-head"><div class="modal-title">🎵 新增推歌记录</div><div class="modal-actions"><button class="btn-modal" onclick="hideOv(\'ov-song-add\')">✕</button></div></div><div class="modal-body" style="padding:20px;"><div style="margin-bottom:12px;"><label style="font-size:13px;color:var(--txt2);margin-bottom:6px;display:block;">歌曲名称</label><input type="text" id="song-title-input" placeholder="输入歌曲名称" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:13px;"></div><div style="margin-bottom:12px;"><label style="font-size:13px;color:var(--txt2);margin-bottom:6px;display:block;">日期</label><input type="date" id="song-date-input" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:13px;"></div><div style="margin-bottom:12px;"><label style="font-size:13px;color:var(--txt2);margin-bottom:6px;display:block;">备注</label><textarea id="song-note-input" placeholder="写下备注内容..." style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:13px;height:60px;resize:none;"></textarea></div><div style="margin-bottom:16px;"><label style="font-size:13px;color:var(--txt2);margin-bottom:6px;display:block;">图片</label><input type="file" id="song-image-input" accept="image/*" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:8px;font-size:13px;"><div id="song-image-preview" style="margin-top:8px;max-height:100px;display:none;"><img id="song-image-preview-img" style="max-height:100px;border-radius:8px;object-fit:cover;"></div></div><div style="display:flex;gap:10px;"><button class="btn-outline" style="flex:1;padding:10px;border-radius:8px;font-size:13px;" onclick="hideOv(\'ov-song-add\')">取消</button><button class="btn-primary" style="flex:1;padding:10px;border-radius:8px;font-size:13px;" onclick="addContactSong(\''+contactId+'\')">添加</button></div></div></div></div>';
  document.body.appendChild(modal);
  if($('song-image-input')){
$('song-image-input').addEventListener('change',function(e){
    var file=e.target.files[0];
    if(file){
      var reader=new FileReader();
      reader.onload=function(evt){
        $('song-image-preview-img').src=evt.target.result;
        $('song-image-preview').style.display='block';
      };
      reader.readAsDataURL(file);
    }
  });
  }
  showOv('ov-song-add');
}
function addContactSong(contactId){
  var title=$('song-title-input').value.trim();
  var date=$('song-date-input').value;
  var note=$('song-note-input').value.trim();
  
  if(!title){
    toast('请输入歌曲名称');
    return;
  }
  
  var songs=getContactSongs(contactId);
  var songData={
    id:'song_'+Date.now(),
    title:title,
    date:date||new Date().toISOString().slice(0,10),
    note:note,
    image:null
  };
  
  var fileInput=$('song-image-input');
  if(fileInput&&fileInput.files&&fileInput.files[0]){
    var reader=new FileReader();
    reader.onload=function(evt){
      songData.image=evt.target.result;
      songs.unshift(songData);
      saveContactSongs(contactId);
      renderContactSongList(contactId);
      hideOv('ov-song-add');
      toast('推歌记录已添加');
    };
    reader.readAsDataURL(fileInput.files[0]);
  }else{
    songs.unshift(songData);
    saveContactSongs(contactId);
    renderContactSongList(contactId);
    hideOv('ov-song-add');
    toast('推歌记录已添加');
  }
}
function showEditSongModal(contactId,song){
  var modal=document.createElement('div');
  modal.className='overlay';
  modal.id='ov-song-edit';
  var imageHtml=song.image?'<div style="margin-top:8px;"><img src="'+song.image+'" style="max-height:100px;border-radius:8px;object-fit:cover;"></div>':'';
  var noteValue=song.note||'';
  modal.innerHTML='<div class="modal"><div class="modal-head"><div class="modal-title">🎵 编辑推歌记录</div><div class="modal-actions"><button class="btn-modal" onclick="hideOv(\'ov-song-edit\')">✕</button></div></div><div class="modal-body" style="padding:20px;"><div style="margin-bottom:12px;"><label style="font-size:13px;color:var(--txt2);margin-bottom:6px;display:block;">歌曲名称</label><input type="text" id="song-edit-title" value="'+song.title+'" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:13px;"></div><div style="margin-bottom:12px;"><label style="font-size:13px;color:var(--txt2);margin-bottom:6px;display:block;">日期</label><input type="date" id="song-edit-date" value="'+song.date+'" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:13px;"></div><div style="margin-bottom:12px;"><label style="font-size:13px;color:var(--txt2);margin-bottom:6px;display:block;">备注</label><textarea id="song-edit-note" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:13px;height:60px;resize:none;">'+noteValue+'</textarea></div><div style="margin-bottom:16px;"><label style="font-size:13px;color:var(--txt2);margin-bottom:6px;display:block;">图片</label><input type="file" id="song-edit-image" accept="image/*" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:8px;font-size:13px;">'+imageHtml+'</div><div style="display:flex;gap:10px;"><button class="btn-outline" style="flex:1;padding:10px;border-radius:8px;font-size:13px;" onclick="hideOv(\'ov-song-edit\')">取消</button><button class="btn-primary" style="flex:1;padding:10px;border-radius:8px;font-size:13px;" onclick="editContactSong(\''+contactId+'\',\''+song.id+'\')">保存</button></div><div style="margin-top:10px;"><button style="width:100%;padding:10px;border-radius:8px;font-size:13px;border:none;background:#ff6b6b;color:white;cursor:pointer;" onclick="deleteContactSong(\''+contactId+'\',\''+song.id+'\')">删除</button></div></div></div></div>';
  document.body.appendChild(modal);
  showOv('ov-song-edit');
}
function editContactSong(contactId,songId){
  var title=$('song-edit-title').value.trim();
  var date=$('song-edit-date').value;
  var note=$('song-edit-note').value.trim();
  
  if(!title){
    toast('请输入歌曲名称');
    return;
  }
  
  var songs=getContactSongs(contactId);
  var song=songs.find(function(s){return s.id===songId});
  if(song){
    song.title=title;
    song.date=date;
    song.note=note;
    
    var fileInput=$('song-edit-image');
    if(fileInput&&fileInput.files&&fileInput.files[0]){
      var reader=new FileReader();
      reader.onload=function(evt){
        song.image=evt.target.result;
        saveContactSongs(contactId);
        renderContactSongList(contactId);
        hideOv('ov-song-edit');
        toast('推歌记录已更新');
      };
      reader.readAsDataURL(fileInput.files[0]);
    }else{
      saveContactSongs(contactId);
      renderContactSongList(contactId);
      hideOv('ov-song-edit');
      toast('推歌记录已更新');
    }
  }
}
function deleteContactSong(contactId,songId){
  customConfirm('确定要删除这个推歌记录吗？').then(function(ok){
    if(!ok)return;
    var songs=getContactSongs(contactId);
    songs=songs.filter(function(s){return s.id!==songId});
    contactSongs[contactId]=songs;
    saveContactSongs(contactId);
    renderContactSongList(contactId);
    hideOv('ov-song-edit');
    toast('推歌记录已删除');
    haptic('warn');
  });
}

function renderContactRedPacketHistory(contactId){
  var listEl=$('contact-profile-redpacket-list');
  var summaryEl=$('contact-profile-redpacket-summary');
  if(!listEl||!summaryEl)return;
  var packets=getPackets(contactId);
  // 统计：对方发的红包累计金额（只算 received 已领取的）
  var receivedTotal=0,sentTotal=0,receivedCount=0,sentCount=0;
  packets.forEach(function(p){
    if(p.direction==='receive'){
      receivedCount++;
      if(p.status==='received')receivedTotal+=p.amount;
    }else if(p.direction==='send'){
      sentCount++;
      if(p.status==='received')sentTotal+=p.amount;
    }
  });
  summaryEl.innerHTML=
    '<div style="flex:1;padding:10px 12px;background:#fef2f0;border-radius:10px;border:1px solid #ffccc7;">'+
      '<div style="font-size:11px;color:#cf1322;">TA 发红包 · 累计</div>'+
      '<div style="font-size:17px;font-weight:700;color:#cf1322;margin-top:2px;">¥'+(receivedTotal/100).toFixed(2)+'</div>'+
      '<div style="font-size:10px;color:var(--txt3);margin-top:2px;">'+receivedCount+' 个 · 已领取</div>'+
    '</div>'+
    '<div style="flex:1;padding:10px 12px;background:#f6ffed;border-radius:10px;border:1px solid #b7eb8f;">'+
      '<div style="font-size:11px;color:#389e0d;">我 发红包 · 累计</div>'+
      '<div style="font-size:17px;font-weight:700;color:#389e0d;margin-top:2px;">¥'+(sentTotal/100).toFixed(2)+'</div>'+
      '<div style="font-size:10px;color:var(--txt3);margin-top:2px;">'+sentCount+' 个 · 已领取</div>'+
    '</div>';
  if(packets.length===0){
    listEl.innerHTML='<div class="empty" style="text-align:center;padding:20px;color:var(--txt3);font-size:12px">🧧 暂无红包记录</div>';
    return;
  }
  packets.sort(function(a,b){return b.createdAt-a.createdAt;});
  listEl.innerHTML='';
  packets.forEach(function(p){
    var amountYuan=(p.amount/100).toFixed(2);
    var isReceive=p.direction==='receive';
    var statusText='',statusColor='';
    if(p.status==='received'){statusText='已领取';statusColor='color:#52c41a';}
    else if(p.status==='returned'){statusText='已退回';statusColor='color:#faad14';}
    else if(p.status==='pending'){statusText='待领取';statusColor='color:#fa8c16';}
    else if(p.status==='expired'){statusText='已过期';statusColor='color:var(--txt3)';}
    else{statusText=p.status||'';statusColor='color:var(--txt3)';}
    var time=new Date(p.createdAt).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
    var el=document.createElement('div');
    el.style.cssText='padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;';
    el.innerHTML='<div style="display:flex;align-items:center;gap:8px;">'+
      '<div style="font-size:18px;">🧧</div>'+
      '<div style="flex:1;">'+
        '<div style="display:flex;align-items:center;gap:6px;">'+
          '<span style="font-size:13px;font-weight:600;color:'+(isReceive?'#cf1322':'#389e0d')+';">'+(isReceive?'TA 发给我':'我 发给TA')+'</span>'+
          '<span style="font-size:12px;'+statusColor+'">'+statusText+'</span>'+
        '</div>'+
        '<div style="font-size:11px;color:var(--txt3);">'+(p.message||'')+' · '+time+'</div>'+
      '</div>'+
      '<div style="font-size:14px;font-weight:700;color:var(--txt);">¥'+amountYuan+'</div>'+
    '</div>';
    listEl.appendChild(el);
  });
}

function renderContactCallHistory(contactId){
  var list=$('contact-profile-call-list');
  list.innerHTML='';
  
  var contactCalls=callHistory.filter(function(c){return c.contactId===contactId});
  var c=contacts.find(function(x){return x.id===contactId});
  var contactAvatar=c&&c.avatar?'<img src="'+c.avatar.replace(/"/g,'&quot;')+'" style="display:block;width:100%;height:100%;object-fit:cover;border-radius:50%;">':'✦';
  var myAvatar=me.avatar?'<img src="'+me.avatar.replace(/"/g,'&quot;')+'" style="display:block;width:100%;height:100%;object-fit:cover;border-radius:50%;">':'✦';
  
  if(contactCalls.length===0){
    list.innerHTML='<div class="empty" style="text-align:center;padding:20px;color:var(--txt3);font-size:12px">📞 暂无通话记录</div>';
    return;
  }
  
  contactCalls.sort(function(a,b){return b.timestamp-a.timestamp});
  
  contactCalls.forEach(function(record){
    var direction=record.direction;
    var avatarHtml=direction==='incoming'?contactAvatar:myAvatar;
    var directionText=direction==='incoming'?'来电':'去电';
    var status=record.status;
    var statusText='';
    var statusColor='';
    if(status==='connected'){statusText='已接通';statusColor='color:#52c41a';}
    else if(status==='busy'){statusText='忙线';statusColor='color:#faad14';}
    else if(status==='rejected'){statusText='已拒绝';statusColor='color:#ff4d4f';}
    else if(status==='missed'){statusText='未接来电';statusColor='color:#ff4d4f';}
    else if(status==='disconnected'){statusText='通话中断';statusColor='color:#fa8c16';}
    else if(status==='hangup_by_contact'){statusText='对方挂断';statusColor='color:#fa8c16';}
    else if(status==='ended_by_user'){statusText='已挂断';statusColor='color:#fa8c16';}
    else{statusText='未接通';statusColor='color:var(--txt3)';}
    
    var duration='';
    if(record.duration>=0){
      var minutes=Math.floor(record.duration/60);
      var seconds=record.duration%60;
      duration=(minutes<10?'0':'')+minutes+':'+(seconds<10?'0':'')+seconds;
    }
    
    var time=new Date(record.timestamp).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
    
    var el=document.createElement('div');
    el.style.padding='10px';
    el.style.border='1px solid var(--border)';
    el.style.borderRadius='8px';
    el.style.marginBottom='8px';
    el.innerHTML='<div style="display:flex;align-items:center;gap:8px">'+
      '<div style="width:32px;height:32px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">'+avatarHtml+'</div>'+
      '<div style="flex:1">'+
        '<div style="display:flex;align-items:center;gap:6px;">'+
          '<span style="font-size:13px;font-weight:600;color:'+(direction==='incoming'?'#2e7d32':'#e65100')+';">'+directionText+'</span>'+
          '<span style="font-size:12px;'+statusColor+'">'+statusText+'</span>'+
        '</div>'+
        '<div style="font-size:11px;color:var(--txt3);">'+time+(status==='connected'||status==='disconnected'||status==='ended_by_user'||status==='hangup_by_contact'?' · '+duration:'')+'</div>'+
      '</div>'+
    '</div>';
    list.appendChild(el);
  });
}

function importContactLetters(contactId) {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.style.display = 'none';
  document.body.appendChild(input);
  input.onchange = function() {
    var file = this.files[0];
    if (!file) { document.body.removeChild(input); return; }
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var data = JSON.parse(ev.target.result);
        if (!data.letters || !Array.isArray(data.letters)) { toast('文件格式无效'); return; }
        var ll = ls(LL) || [];
        // 导入时只导入该联系人的信件，覆盖已有同ID信件
        data.letters.forEach(function(l) {
          l.fid = contactId;
          var existingIdx = ll.findIndex(function(x) { return x.id === l.id; });
          if (existingIdx >= 0) {
            ll[existingIdx] = l;
          } else {
            ll.push(l);
          }
        });
        ls(LL, ll);
        if (window.localforage) { try { window.localforage.setItem(LL, ll); } catch(e) {} }
        renderContactLetterHistory(contactId);
        toast('已导入 ' + data.letters.length + ' 封信件');
      } catch(e) {
        toast('文件解析失败');
      }
    };
    reader.readAsText(file);
    document.body.removeChild(input);
  };
  input.click();
}

function exportContactLetters(contactId) {
  var ll = ls(LL) || [];
  var contactLetters = ll.filter(function(l) { return l.fid === contactId; });
  if (contactLetters.length === 0) {
    toast('没有可导出的信件');
    return;
  }
  var c = contacts.find(function(x) { return x.id === contactId; });
  var exportData = {
    contactName: c ? c.name : '未知',
    contactId: contactId,
    exportTime: new Date().toISOString(),
    letters: contactLetters
  };
  var blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = '星言 ' + (c ? c.name : '未知') + '信箱数据_' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('已导出 ' + contactLetters.length + ' 封信件');
}

function renderContactLetterHistory(contactId){
  var list=$('contact-profile-letters-list');
  list.innerHTML='';
  
  var ll=ls(LL)||[];
  ll.forEach(function(l){if(!l.type)l.type='received';});
  var contactLetters=ll.filter(function(l){return l.fid===contactId});
  
  var activeTab=window._contactLetterTab||'all';
  
  if(activeTab==='incoming'){
    contactLetters=contactLetters.filter(function(l){return l.type==='received';});
  }else if(activeTab==='replies'){
    contactLetters=contactLetters.filter(function(l){return l.partnerReply;});
  }else if(activeTab==='sent'){
    contactLetters=contactLetters.filter(function(l){return l.type==='sent';});
  }
  
  var tabs=document.querySelectorAll('.contact-letter-tab');
  tabs.forEach(function(t){
    var isSel=t.dataset.tab===activeTab;
    t.classList.toggle('sel',isSel);
    t.style.background=isSel?'var(--c2)':'transparent';
    t.style.color=isSel?'var(--accent)':'var(--txt2)';
    if(isSel)t.style.fontWeight='600';else t.style.fontWeight='';
  });
  
  if(contactLetters.length===0){
    list.innerHTML='<div class="empty" style="text-align:center;padding:20px;color:var(--txt3);font-size:12px">✉ 暂无信件</div>';
    return;
  }
  
  contactLetters.forEach(function(l){
    l.type=l.type||'received';
    var ico=l.type==='sent'?'✉':'📬';
    var typeText=l.type==='sent'?'寄出的信':'对方来信';
    var status='';
    if(l.replyTo){
      var origLetter=ll.find(function(x){return x.id===l.replyTo});
      if(origLetter){
        status='<span style="font-size:10px;color:var(--accent);margin-left:4px">↩ 回复 '+origLetter.tt+'</span>';
      }else{
        status='<span style="font-size:10px;color:var(--accent);margin-left:4px">↩ 回复</span>';
      }
    }else if(l.partnerReply){
      status='<span style="font-size:10px;color:var(--accent);margin-left:4px">↩ 对方回信</span>';
    }else if(l.myReply&&l.type==='received'){
      status='<span style="font-size:10px;color:var(--txt3);margin-left:4px">↪ 已回信</span>';
    }else if(l.type==='sent'){
      status='<span style="font-size:10px;color:var(--txt3);margin-left:4px">✉ 已寄出</span>';
    }
    
    var el=document.createElement('div');
    el.style.padding='10px';
    el.style.border='1px solid #e8d5b7';
    el.style.borderRadius='8px';
    el.style.marginBottom='8px';
    el.style.cursor='pointer';
    el.style.background='#fdf5e6';
    el.innerHTML='<div style="display:flex;align-items:center;gap:8px"><span style="font-size:16px">'+ico+'</span><div style="flex:1"><div style="font-size:13px;font-weight:600;color:var(--txt)">'+l.tt+status+'</div><div style="font-size:11px;color:var(--txt3)">'+typeText+' · '+flt(l.tm)+'</div></div></div>';
    el.onclick=function(){openContactLetterDetail(l.id)};
    list.appendChild(el);
  });
}

function openContactLetterWrite(contactId){
  contactLetterTargetId=contactId;
  // ★ 标记本次写信是否为"回信"（由 replyToContactLetter 调用则为回信）
  _contactLetterIsReply = (typeof currentLetter!=='undefined'&&currentLetter&&currentLetter.fid===contactId)?true:false;
  var c=contacts.find(function(x){return x.id===contactId});
  $('write-letter-target').textContent='寄给：'+(c?c.name:'神秘人');
  $('write-letter-title-inp').value='';
  $('write-letter-content-inp').value='';
  showOv('ov-contact-letter');
}

function submitContactLetter(){
  var title=$('write-letter-title-inp').value.trim();
  var content=$('write-letter-content-inp').value.trim();
  
  if(!title){toast('请输入信件标题');return}
  if(!content){toast('请输入信件内容');return}
  if(!contactLetterTargetId){toast('请选择收信人');return}
  
  var ll=ls(LL)||[];
  var letter={
    id:'l_'+Date.now(),
    tt:title,
    ct:content,
    fid:contactLetterTargetId,
    tm:Date.now(),
    r:true,
    type:'sent',
    myReply:{content:content,tm:Date.now()}
  };
  ll.unshift(letter);
  ls(LL,ll);
  
  // ★ 修复：聊天页写信/回信后插入系统消息（与 TA 写信/回信对应）
  try{
    var targetC=contacts.find(function(x){return x.id===contactLetterTargetId});
    var tName=targetC?targetC.name||targetC.nickname||'联系人':'联系人';
    var isReply=!!(typeof _contactLetterIsReply!=='undefined'&&_contactLetterIsReply);
    var sysMsgs=msgs(contactLetterTargetId);
    sysMsgs.push({
      id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),
      s:SELF,
      t:isReply?('你回复了'+tName+'的信'):('你给'+tName+'写了一封信'),
      ts:new Date(),
      read:true,
      isSystem:true,
      isLetter:true,
      letterId:letter.id
    });
    savemsgs(contactLetterTargetId,sysMsgs);
    if(contactLetterTargetId===window.currentCid){renderMsgs();}
    renderChatList();
  }catch(e){console.warn('submit letter sys msg failed:',e);}
  
  hideOv('ov-contact-letter');
  contactLetterTargetId=null;
  _contactLetterIsReply=false;
  toast('信件已寄出');
  if(currentProfileContactId){
    renderContactLetterHistory(currentProfileContactId);
  }
}

function openContactLetterDetail(letterId){
  var ll=ls(LL)||[],l=ll.find(function(x){return x.id===letterId});if(!l)return;
  currentLetter=l;
  // ★ 从聊天点开信件：由调用方设置 _letterFromChat，此处不覆盖（openLetter 信箱入口会设为 false）
  // 修复：先渲染内容，再异步标记已读并写入存储，避免阻塞 UI
  l.r=true;

  var c=contacts.find(function(x){return x.id===l.fid});
  l.type=l.type||'received';

  var fromText=l.type==='sent'?'寄给 '+ (c?c.name:'神秘人'):'来自 '+ (c?c.name:'神秘人');
  var html='<div class="contact-letter-detail" style="padding:0;"><div style="font-size:16px;font-weight:600;color:#8b7355;margin-bottom:8px;text-align:center">✉ '+l.tt+'</div><div style="font-size:12px;color:#a89578;margin-bottom:20px;text-align:center">'+fromText+' · '+flt(l.tm)+'</div>';
  
  function makePaper(title,content,date,author,isMine){
    var borderColor=isMine?'#e8e0d0':'rgba(201,169,110,0.3)';
    var textColor=isMine?'#8b7355':'var(--txt)';
    var bgColor=isMine?'#f5efe0':'#fff';
    var accentColor=isMine?'rgba(139,115,85,0.15)':'rgba(201,169,110,0.15)';
    return '<div style="background:'+bgColor+';border-radius:12px;border:1px solid '+borderColor+';overflow:hidden;margin-bottom:16px;">'+
      '<div style="height:6px;background:linear-gradient(90deg,'+borderColor+','+accentColor+','+borderColor+');"></div>'+
      '<div style="padding:20px 20px 16px;position:relative;">'+
        '<div style="position:absolute;inset:0;background:repeating-linear-gradient(transparent,transparent 31px,'+accentColor+' 31px,'+accentColor+' 32px);pointer-events:none;border-radius:12px;"></div>'+
        '<div style="position:relative;z-index:1;">'+
          '<div style="font-size:11px;color:'+(isMine?'#a89578':'var(--txt3)')+';text-align:right;margin-bottom:12px;letter-spacing:1px;opacity:0.8;font-style:italic;">'+date+'</div>'+
          '<div style="font-size:13px;color:'+(isMine?'#8b7355':'var(--txt2)')+';margin-bottom:4px;font-weight:500;">'+title+'</div>'+
          '<div style="font-size:14px;color:'+textColor+';line-height:32px;padding-left:8px;word-break:break-word;">'+content+'</div>'+
          '<div style="border-top:1px dashed '+accentColor+';margin:12px 0;"></div>'+
          '<div style="font-size:11px;color:'+(isMine?'#a89578':'var(--txt3)')+';text-align:right;margin-bottom:4px;letter-spacing:0.5px;">'+date+'</div>'+
          '<div style="font-size:14px;color:#8b7355;text-align:right;font-weight:600;letter-spacing:1px;">'+author+'</div>'+
        '</div>'+
      '</div>'+
    '</div>';
  }
  
  if(l.type==='received'){
    html+=makePaper('亲爱的，',renderLetterContent(l.ct),flt(l.tm),c?c.name:'神秘人',false);
  }
  
  if(l.replyTo){
    var replyToLetter=ll.find(function(x){return x.id===l.replyTo});
    var replyContext=replyToLetter?'回复：'+replyToLetter.tt+'（'+flt(replyToLetter.tm)+'）':'回复了一封来自'+(c?c.name:'神秘人')+'的信';
    html+='<div style="background:#fff8e1;border:1px dashed #e8d5b7;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:12px;color:#8b7355;display:flex;align-items:center;gap:8px;"><span style="font-size:14px;">📎</span><span>'+replyContext+'</span></div>';
  }
  
  if(l.myReply){
    var myReplyTitle=l.type==='sent'?'我的信':'我的回信';
    html+=makePaper(myReplyTitle,renderLetterContent(l.myReply.content),flt(l.myReply.tm),'我',true);
  }
  
  if(l.partnerReply){
    html+=makePaper('亲爱的，',renderLetterContent(l.partnerReply.content),flt(l.partnerReply.tm),c?c.name:'神秘人',false);
  }
  
  if(l.type==='sent'&&!l.myReply){
    html+=makePaper('我的信',renderLetterContent(l.ct),flt(l.tm),'我',true);
  }
  
  html+='</div>';
  
  $('contact-letter-detail-content').innerHTML=html;
  
  var footer='<button class="btn-outline" onclick="hideOv(\'ov-contact-letter-detail\')">关闭</button>';
  if(l.fid&&!l.replied&&l.type==='received'){
    footer='<button class="btn-outline" onclick="hideOv(\'ov-contact-letter-detail\')">关闭</button><button class="btn" onclick="replyToContactLetter()">回信</button>';
  }
  $('contact-letter-detail-footer').innerHTML=footer;

  showOv('ov-contact-letter-detail');

  // 修复：异步写入已读状态，避免阻塞弹窗显示
  setTimeout(function(){
    try{
      ls(LL,ll);
      if(window.localforage){window.localforage.setItem(LL,ll).catch(function(){});}
      updateBadges();
    }catch(e){console.warn('letter read state save failed:',e);}
  },0);
}

function replyToContactLetter(){
  hideOv('ov-contact-letter-detail');
  if(currentLetter&&currentLetter.fid){
    openContactLetterWrite(currentLetter.fid);
  }
}

function showDivineRecordDetail(record){
  var modal=document.createElement('div');
  modal.className='overlay';
  modal.id='ov-divine-detail';
  var cardsHtml='';
  if(record.drawn&&record.drawn.length>0){
    cardsHtml='<div style="margin-bottom:16px"><div style="font-size:11px;color:var(--txt3);margin-bottom:8px;text-align:center">抽牌结果</div><div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">';
    record.drawn.forEach(function(card){
      cardsHtml+='<div style="width:50px;height:70px;border-radius:6px;background:var(--c1);border:1px solid var(--border);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:4px;"><span style="font-size:20px;">'+(card.emoji||'🎴')+'</span><span style="font-size:8px;color:var(--txt3);text-align:center;">'+(card.name||'')+'</span></div>';
    });
    cardsHtml+='</div></div>';
  }
  modal.innerHTML='<div class="modal" style="width:90%;max-width:450px;"><div class="modal-header"><h3>🔮 占卜详情</h3><button class="btn-close" onclick="hideOv(\'ov-divine-detail\')">×</button></div><div class="modal-body" style="max-height:500px;overflow-y:auto;padding:16px;"><div style="font-size:16px;font-weight:600;color:var(--txt);margin-bottom:8px;">'+record.question+'</div><div style="font-size:12px;color:var(--txt3);margin-bottom:16px;">'+record.time+'</div>'+cardsHtml+'<div style="background:var(--c1);padding:14px;border-radius:10px;border:1px solid var(--border);line-height:1.6;font-size:13px;color:var(--txt);white-space:pre-wrap;">'+(record.text||'')+'</div></div><div class="modal-footer" style="padding:12px;"><button class="btn-outline" style="width:100%;padding:10px;border-radius:8px;font-size:13px;" onclick="hideOv(\'ov-divine-detail\')">关闭</button></div></div></div>';
  document.body.appendChild(modal);
  showOv('ov-divine-detail');
}
function editDivineRecord(recordId){
  var record=divineHistory.find(function(item){return String(item.id)===String(recordId)});
  if(!record)return;
  
  $('edit-divine-question').value=record.question;
  $('edit-divine-text').value=record.text||'';
  $('edit-divine-mode').value=record.mode;
  
  var saveBtn=$('edit-divine-save');
  saveBtn.onclick=function(){
    record.question=$('edit-divine-question').value.trim()||'无';
    record.text=$('edit-divine-text').value;
    record.mode=$('edit-divine-mode').value;
    _persistDivineHistory();
    hideOv('ov-edit-divine');
    if(currentProfileContactId){
      renderContactDivineHistory(currentProfileContactId);
    }
  };
  
  showOv('ov-edit-divine');
}

function deleteDivineRecord(recordId){
  customConfirm('确定要删除这条占卜记录吗？').then(function(ok){
    if(!ok)return;
    divineHistory=divineHistory.filter(function(item){return String(item.id)!==String(recordId)});
    _persistDivineHistory();
    if(currentProfileContactId){
      renderContactDivineHistory(currentProfileContactId);
    }
    haptic('warn');
  });
}

function _persistDivineHistory(){
  try{
    var serialized=JSON.stringify(divineHistory);
    localStorage.setItem('ml2_lf_ml2_divine_history',serialized);
    localStorage.setItem('ml2_divine_history',serialized);
    if(window.localforage){
      window.localforage.setItem('ml2_divine_history',divineHistory).catch(function(e){
        console.warn('_persistDivineHistory localforage failed:',e);
      });
    }
  }catch(e){
    console.error('_persistDivineHistory error:',e);
  }
}

function showAddDivineRecordModal(contactId){
  var c=contacts.find(function(x){return x.id===contactId});
  $('add-divine-contact').textContent=c?c.name:'联系人';
  
  var saveBtn=$('add-divine-save');
  saveBtn.onclick=function(){
    var question=$('add-divine-question').value.trim()||'无';
    var text=$('add-divine-text').value;
    var mode=$('add-divine-mode').value;
    
    var newRecord={
      id:Date.now(),
      time:new Date().toLocaleString(),
      contactId:contactId,
      contactName:c?c.name:'对方',
      question:question,
      mode:mode,
      count:0,
      drawn:[],
      text:text
    };
    
    divineHistory.unshift(newRecord);
    _persistDivineHistory();
    
    $('add-divine-question').value='';
    $('add-divine-text').value='';
    hideOv('ov-add-divine');
    renderContactDivineHistory(contactId);
  };
  
  showOv('ov-add-divine');
}

function showImportDivineRecordModal(contactId){
  var c=contacts.find(function(x){return x.id===contactId});
  $('import-divine-contact').textContent=c?c.name:'联系人';
  
  var saveBtn=$('import-divine-save');
  saveBtn.onclick=function(){
    var text=$('import-divine-text').value;
    if(!text.trim()){
      alert('请输入要导入的文字内容');
      return;
    }
    
    var lines=text.trim().split('\n');
    var question=lines[0].trim()||'导入的占卜记录';
    var content=text;
    
    var newRecord={
      id:Date.now(),
      time:new Date().toLocaleString(),
      contactId:contactId,
      contactName:c?c.name:'对方',
      question:question,
      mode:'mixed',
      count:0,
      drawn:[],
      text:content
    };
    
    divineHistory.unshift(newRecord);
    _persistDivineHistory();
    
    $('import-divine-text').value='';
    hideOv('ov-import-divine');
    renderContactDivineHistory(contactId);
  };
  
  showOv('ov-import-divine');
}

// 保存/读取 hideTouchNames 设置到专用key，确保可靠读取
var _globalHideTouchNames={}; // 全局缓存，最可靠
function saveHideTouchNames(contactId,val){
  var key='ml2_hideTouchNames_'+contactId;
  ls(key,val?'1':'0');
  _globalHideTouchNames[contactId]=!!val;
  if(window.localforage){
    window.localforage.setItem(key,val?'1':'0').catch(function(){});
  }
}
function getHideTouchNames(contactId){
  var key='ml2_hideTouchNames_'+contactId;
  var v=ls(key);
  if(v==='1')return true;
  if(v==='0')return false;
  return null; // 未设置
}

var _renderingMsgs=false;
var _pendingRenderMsgs=false;
var _lastMsgCount=0;
var _renderMsgsTimer=null;
var _renderMsgsPending=false;
var _jumpFocusMsgId=null; // 日期跳转时聚焦的消息ID
var _renderStartIdx=null; // ★ 聊天渲染窗口起点（触顶加载/日期跳转时前移）
var _loadMoreLock=false;  // ★ 触顶加载防抖锁
var _jumpFocusJustJumped=false; // ★ 日期跳转后短暂保持窗口（防止普通渲染拉回末尾）
// 缓存 contactMap/groupMap，避免每次 renderMsgs 都遍历重建
var _contactMapCache=null;
var _groupMapCache=null;
var _contactMapSig='';
var _groupMapSig='';
function _getContactMap(){
  var sig=contacts.length+'_'+(contacts[contacts.length-1]?contacts[contacts.length-1].id:'');
  if(_contactMapSig!==sig||!_contactMapCache){
    _contactMapCache={};
    for(var i=0;i<contacts.length;i++){_contactMapCache[contacts[i].id]=contacts[i];}
    _contactMapSig=sig;
  }
  return _contactMapCache;
}
function _getGroupMap(){
  var sig=groups.length+'_'+(groups[groups.length-1]?groups[groups.length-1].id:'');
  if(_groupMapSig!==sig||!_groupMapCache){
    _groupMapCache={};
    for(var i=0;i<groups.length;i++){_groupMapCache[groups[i].id]=groups[i];}
    _groupMapSig=sig;
  }
  return _groupMapCache;
}

var _renderMsgsTimerCreatedAt=0;
function renderMsgs(messages){
  if(!cid)return;

  var isMobile=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if(isMobile){
    _renderMsgsPending=true;
    if(_renderMsgsTimer)return;
    _renderMsgsTimer=setTimeout(function(){
      _renderMsgsTimer=null;
      _renderMsgsTimerCreatedAt=0;
      if(!_renderMsgsPending)return;
      _renderMsgsPending=false;
      _doRenderMsgs(messages);
    },80);
    return;
  }

  _doRenderMsgs(messages);
}

function _doRenderMsgs(messages){
  if(!cid)return;
  if(_renderingMsgs){_pendingRenderMsgs=true;return;}
  _renderingMsgs=true;

  requestAnimationFrame(function(){
    try{
      var c=contacts.find(function(x){return x.id===cid});
      var g=groups.find(function(x){return x.id===cid});
      var m=messages||msgs(cid);
      var box=$('msgbox');
      if(!box)return;

      var isMobile=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      var MAX_RENDER=isMobile?80:500;
      var msgsToRender=m;
      // ★ 修复：渲染窗口——终点永远是 m.length（最新消息必须显示），触顶加载只前移起点
      var startIdx=(typeof _renderStartIdx==='number')?_renderStartIdx:Math.max(0,m.length-MAX_RENDER);
      if(startIdx<0)startIdx=0;
      // 日期跳转优先：渲染包含焦点消息的窗口
      if(_jumpFocusMsgId){
        var focusIdx=-1;
        for(var fi=0;fi<m.length;fi++){
          if(m[fi].id===_jumpFocusMsgId){focusIdx=fi;break;}
        }
        if(focusIdx>=0){
          startIdx=Math.max(0,focusIdx-Math.floor(MAX_RENDER/2));
          startIdx=Math.min(startIdx,Math.max(0,m.length-MAX_RENDER));
          _renderStartIdx=startIdx;
        }
        _jumpFocusMsgId=null; // 用完即清
      }
      // 普通渲染（非触顶加载、非日期跳转）：窗口含末尾 MAX_RENDER 条，最新消息一定可见
      if(!_loadMoreLock&&!_jumpFocusJustJumped){
        if(startIdx>Math.max(0,m.length-MAX_RENDER))startIdx=Math.max(0,m.length-MAX_RENDER);
      }
      msgsToRender=m.slice(startIdx);
      _renderStartIdx=startIdx;
      
      var isGroup=!!g;
      var myAvatar=c&&c.myAvatar?'<img src="'+c.myAvatar.replace(/"/g,'&quot;')+'">':me.avatar?'<img src="'+me.avatar.replace(/"/g,'&quot;')+'">':'✦';
      var otherAvatar=c&&c.avatar?'<img src="'+c.avatar.replace(/"/g,'&quot;')+'">':'✦';
      
      var cd='',html=['<div class="ph"></div>'],lt=0,GAP=300000;
      var starEn=getSpeed('star-en')===1;
      var timelineStyle=getContactTimelineStyle(cid);
      var hideAvatars=!!(c&&c.hideChatAvatars);
      if(hideAvatars){timelineStyle='bubble';}
      // 计算气泡透明度：完全由用户设置控制，与applyChatSettings保持一致
      var _bubbleOp=1;
      try{
        var _curEntity=c||g;
        if(_curEntity&&_curEntity.chatSettings&&_curEntity.chatSettings.bubbleOpacity!=null){
          _bubbleOp=parseFloat(_curEntity.chatSettings.bubbleOpacity);
        }
      }catch(e){}
      var bubbleOpacity='';
      if(hideAvatars){
        // ★ 修复：简约模式（隐藏双方头像）时用默认 0.85；取消后按美化设置透明度
        bubbleOpacity='opacity:0.85;';
      }else if(_bubbleOp!==1&&_bubbleOp>0){
        bubbleOpacity='opacity:'+_bubbleOp+';';
      }
      
      var starColorCached='';
      if(starEn){
        try{starColorCached=getComputedStyle(document.documentElement).getPropertyValue('--star-color').trim()||'var(--txt3)';}catch(e){starColorCached='var(--txt3)';}
      }
      
      var contactMap=_getContactMap();
      var groupMap=_getGroupMap();
      // 优化：预计算"隐藏系统小字昵称"状态，避免在循环内对每条消息重复四级检查+contacts.find
      var _preHideSysNames=_globalHideTouchNames[cid]===true;
      if(!_preHideSysNames)_preHideSysNames=getHideTouchNames(cid)===true;
      if(!_preHideSysNames&&typeof editingContact!=='undefined'&&editingContact&&editingContact.id===cid&&editingContact.hideTouchNames){
        _preHideSysNames=true;
      }
      if(!_preHideSysNames){
        var _preSysContact=contactMap[cid];
        _preHideSysNames=!!(_preSysContact&&_preSysContact.hideTouchNames);
      }
      document.querySelectorAll('.ibar').forEach(function(el){
        if(hideAvatars){
          el.style.background='rgba(255,255,255,0.5)';
        }else{
          el.style.background='';
        }
      });
      
      for(var i=0;i<msgsToRender.length;i++){
        var x=msgsToRender[i];
        var d=x.ts instanceof Date?x.ts:new Date(x.ts);
    var ds=d.toDateString();
    
    if(ds!==cd){
      cd=ds;
      var td=new Date().toDateString();
      var yd=new Date(Date.now()-864e5).toDateString();
      html.push('<div class="th"></div><div class="ts">'+(ds===td?'今天':ds===yd?'昨天':fd(d))+'</div>');
    }
    
    var gap=i===0||(d.getTime()-lt)>GAP;
    var isProactive=x.isInitiative===true||x.isInitiative==='true';
    
    if(x.isTouch===true||x.isTouch==='true'){
      // 优化：使用预计算的 _preHideSysNames，避免循环内重复检查
      var _hideTouch=_preHideSysNames;
      // 当隐藏拍一拍昵称时，双方昵称都替换
      var touchSenderName=x.s===SELF?'我':(_hideTouch?'TA':(x.senderName||(c&&c.name?c.name:'对方')));
      // 替换touchAction中的contact名称为"TA"或"我"
      var touchActionText=x.touchAction||'';
      if(_hideTouch&&c&&c.name){
        touchActionText=touchActionText.replace(new RegExp(c.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'),x.s===SELF?'TA':'我');
      }
      // 替换touchTarget中的联系人为"TA"或"我"
      var touchTarget=x.touchTarget||'你';
      if(_hideTouch){
        touchTarget=x.s===SELF?'TA':'我';
      }
      var touchContent=touchSenderName+' '+touchActionText.replace('你',touchTarget);
      var touchCheckboxHtml='';
      if(longScreenshotMode){
        var isTouchChecked=longScreenshotSelectedMsgs.indexOf(x.id)>=0;
        touchCheckboxHtml='<div class="ss-check-wrap"><input type="checkbox" '+(isTouchChecked?'checked':'')+' onclick="event.stopPropagation();toggleLongScreenshotMsg(\''+x.id+'\')" style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent);"></div>';
      }else if(favMsgMode){
        var isFavTouchChecked=selectedFavMsgIds.indexOf(x.id)>=0;
        touchCheckboxHtml='<div class="ss-check-wrap"><input type="checkbox" '+(isFavTouchChecked?'checked':'')+' onclick="event.stopPropagation();toggleFavMsg(\''+x.id+'\')" style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent);"></div>';
      }else if(copyMsgMode){
        var isCopyTouchChecked=selectedCopyMsgIds.indexOf(x.id)>=0;
        touchCheckboxHtml='<div class="ss-check-wrap"><input type="checkbox" '+(isCopyTouchChecked?'checked':'')+' onclick="event.stopPropagation();toggleCopyMsg(\''+x.id+'\')" style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent);"></div>';
      }
      html.push('<div class="mr'+((longScreenshotMode||favMsgMode||copyMsgMode)?' mr-ss':'')+' touch-msg '+(x.s===SELF?'self':'other')+'" data-mid="'+x.id+'">'+touchCheckboxHtml+'<div class="message-touch">'+touchContent+'</div></div>');
      lt=d.getTime();
      continue;
    }
    
    if(x.isCall===true||x.isCall==='true'){
      var callCheckboxHtml='';
      if(longScreenshotMode){
        var isCallChecked=longScreenshotSelectedMsgs.indexOf(x.id)>=0;
        callCheckboxHtml='<div class="ss-check-wrap"><input type="checkbox" '+(isCallChecked?'checked':'')+' onclick="event.stopPropagation();toggleLongScreenshotMsg(\''+x.id+'\')" style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent);"></div>';
      }
      var callMsgText=x.callMessage||'通话记录';
      // 优化：使用预计算的 _preHideSysNames
      var _hideCall=_preHideSysNames;
      if(_hideCall&&c&&c.name){
        callMsgText=callMsgText.replace(new RegExp(c.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'),'TA');
      }
      html.push('<div class="message-call-row'+(longScreenshotMode?' mr-ss':'')+'" data-mid="'+x.id+'">'+callCheckboxHtml+'<div class="message-call" onclick="var t=this.nextElementSibling;t.style.display=t.style.display===\'none\'?\'\':\'none\'" style="font-size:12px;color:var(--txt3);text-align:center;padding:8px 16px;background:rgba(0,0,0,0.04);border-radius:20px;display:inline-block;max-width:80%;cursor:pointer;">'+callMsgText+'</div><div class="message-call-time" style="font-size:10px;color:var(--txt4);text-align:center;margin-top:2px;display:none;">'+fts(d)+'</div></div>');
      lt=d.getTime();
      continue;
    }

    if(x.isGift===true&&x.isGiftReply!==true){
      var giftIcon=x.giftIcon||'🎁';
      var giftName=(x.giftName||'礼物').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      var giftMsg=(x.giftMsg||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      var isFromTA=x.isGiftFromTA===true;
      var giftBg=isFromTA?'#fff8f3':'var(--c2)';
      var giftTopColor=isFromTA?'#e07080':'var(--txt3)';
      var giftDirText=getGiftDirText(isFromTA,x.senderId||cid);
      var giftHtml='<div class="gift-chat-card" data-gid="'+x.id+'" style="background:'+giftBg+';border-radius:14px;padding:14px;max-width:260px;box-shadow:0 2px 8px rgba(0,0,0,.06);border:1px solid rgba(0,0,0,.04);cursor:pointer;transition:transform .12s;" onclick="openGiftChatDetail(\''+x.id+'\')">';
      // 顶部
      giftHtml+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">';
      giftHtml+='<div style="font-size:12px;color:'+giftTopColor+';font-weight:600;">'+giftDirText+'</div>';
      giftHtml+='<div style="font-size:10px;color:var(--txt3);">'+fts(d)+'</div>';
      giftHtml+='</div>';
      // 中间：礼物图标
      giftHtml+='<div style="text-align:center;margin:8px 0;">';
      giftHtml+='<div style="font-size:40px;line-height:1;">'+renderGiftIcon(giftIcon,40)+'</div>';
      giftHtml+='<div style="font-size:15px;font-weight:600;color:var(--txt);margin-top:6px;">'+giftName+'</div>';
      giftHtml+='</div>';
      // 留言
      if(giftMsg){
        giftHtml+='<div style="font-size:12px;color:var(--txt2);line-height:1.6;text-align:center;margin-top:8px;padding:8px 0;border-top:1px solid rgba(0,0,0,.05);">';
        giftHtml+='「'+giftMsg+'」';
        giftHtml+='</div>';
      }
      giftHtml+='</div>';
      var giftCheckHtml='';
      if(longScreenshotMode){
        var isGiftChecked=longScreenshotSelectedMsgs.indexOf(x.id)>=0;
        giftCheckHtml='<div class="ss-check-wrap"><input type="checkbox" '+(isGiftChecked?'checked':'')+' onclick="event.stopPropagation();toggleLongScreenshotMsg(\''+x.id+'\')" style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent);"></div>';
      }
      html.push('<div class="mr'+((longScreenshotMode||favMsgMode||copyMsgMode)?' mr-ss':'')+' gift-msg-row '+(x.s===SELF?'self':'other')+'" data-mid="'+x.id+'">'+giftCheckHtml+giftHtml+'</div>');
      lt=d.getTime();
      continue;
    }

    // TA划重点系统消息：渲染为居中的小字提示，受"隐藏系统小字昵称"控制
    if(x.isTAHighlight===true){
      // 优化：使用预计算的 _preHideSysNames 和 contactMap，避免循环内 contacts.find
      var _hideHL=_preHideSysNames;
      var _hlContact2=contactMap[cid];
      var _hlName=(_hlContact2&&_hlContact2.name)?_hlContact2.name:'TA';
      var _hlText=_hideHL?('TA 划了想说的重点'):(_hlName+' 划了想说的重点');
      var hlCheckboxHtml='';
      if(longScreenshotMode){
        var isHLChecked=longScreenshotSelectedMsgs.indexOf(x.id)>=0;
        hlCheckboxHtml='<div class="ss-check-wrap"><input type="checkbox" '+(isHLChecked?'checked':'')+' onclick="event.stopPropagation();toggleLongScreenshotMsg(\''+x.id+'\')" style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent);"></div>';
      }
      html.push('<div class="message-call-row'+(longScreenshotMode?' mr-ss':'')+'" data-mid="'+x.id+'">'+hlCheckboxHtml+'<div class="message-call" style="font-size:12px;color:var(--txt3);text-align:center;padding:8px 16px;background:rgba(0,0,0,0.04);border-radius:20px;display:inline-block;max-width:80%;">✏️ '+_hlText+'</div></div>');
      lt=d.getTime();
      continue;
    }

    var contentHtml='';
    var isRedpacketMsg=false;
    if(x.isRedpacketCollected===true){
      var colAmt=x.redpacketCollectedAmount||'0';
      var colText=x.redpacketCollectedText||'红包已领取';
      contentHtml='<div class="message-redpacket-collected" style="background:linear-gradient(135deg,#f5e6d3,#e8d0b8);border-radius:12px;padding:14px;max-width:280px;box-shadow:0 2px 10px rgba(138,109,59,0.1);border:1px solid rgba(138,109,59,0.08);"><div style="display:flex;align-items:center;gap:10px;font-size:13px;color:#8a6d3b;"><span style="font-size:20px;flex-shrink:0;">🧧</span><span style="flex:1;min-width:0;font-weight:500;">'+colText+'</span><span style="font-weight:600;font-size:16px;flex-shrink:0;">¥'+colAmt+'</span></div></div>';
    }else if(x.isRedpacket===true||x.isRedpacket==='true'){
      isRedpacketMsg=true;
      var rpAmount=x.redpacketAmount||'0';
      var rpGreeting=x.redpacketGreeting||'恭喜发财，大吉大利';
      var rpStatus=x.redpacketStatus||(x.redpacketOpened?'received':'pending');
      var rpBg,rpAccentColor,rpTextColor,rpStatusText,rpCursor,rpOpacity,rpStatusBg;
      if(rpStatus==='received'){
        rpBg='linear-gradient(135deg,#e8d5b0,#d4b88a)';
        rpAccentColor='#8a6d3b';
        rpTextColor='#8a6d3b';
        rpStatusText=x.s===SELF?'TA 已领取':'已领取';
        rpCursor='default';
        rpOpacity='1';
        rpStatusBg='rgba(138,109,59,0.1)';
      }else if(rpStatus==='returned'){
        rpBg='linear-gradient(135deg,#d0d0d0,#b8b8b8)';
        rpAccentColor='#777';
        rpTextColor='#777';
        rpStatusText='已退回';
        rpCursor='default';
        rpOpacity='1';
        rpStatusBg='rgba(120,120,120,0.1)';
      }else if(rpStatus==='expired'){
        rpBg='linear-gradient(135deg,#d0d0d0,#b8b8b8)';
        rpAccentColor='#777';
        rpTextColor='#777';
        rpStatusText='已过期';
        rpCursor='default';
        rpOpacity='1';
        rpStatusBg='rgba(120,120,120,0.1)';
      }else{
        rpBg='linear-gradient(135deg,#d93025,#c41e1e)';
        rpAccentColor='#d4a853';
        rpTextColor='#fff';
        rpStatusText=x.s===SELF?'等待领取':'点击领取';
        rpCursor=x.s===SELF?'default':'pointer';
        rpOpacity='1';
        rpStatusBg='rgba(0,0,0,0.15)';
      }
      contentHtml='<div class="message-redpacket" onclick="handleRedPacketClick(\''+x.id+'\',\''+x.s+'\',event)" style="background:'+rpBg+';border-radius:12px;overflow:hidden;max-width:280px;cursor:'+rpCursor+';box-shadow:0 2px 10px rgba(212,48,37,0.2);">'
        +'<div style="padding:14px;display:flex;align-items:center;gap:10px;">'
        +'<div style="width:40px;height:40px;border-radius:50%;background:'+(rpStatus==='pending'?'rgba(212,168,83,0.25)':'rgba(138,109,59,0.15)')+';display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">🧧</div>'
        +'<div style="flex:1;min-width:0;">'
        +'<div style="font-size:13px;font-weight:500;color:'+rpTextColor+';overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:3px;">'+rpGreeting+'</div>'
        +'<div style="font-size:11px;color:'+rpTextColor+';opacity:0.7;">红包</div>'
        +'</div>'
        +'<div style="font-size:16px;font-weight:600;color:'+rpAccentColor+';flex-shrink:0;text-shadow:'+(rpStatus==='pending'?'0 1px 2px rgba(0,0,0,0.2)':'none')+';">¥'+rpAmount+'</div>'
        +'</div>'
        +'<div style="padding:6px 14px;background:'+rpStatusBg+';font-size:11px;color:'+rpTextColor+';opacity:'+(rpStatus==='pending'?'0.9':'0.85')+';text-align:center;">'+rpStatusText+'</div>'
        +'</div>';
    }else if(x.isSystem===true||x.isSystem==='true'||x.isAvatarChange===true||x.isAvatarChange==='true'){
      var sysText=x.t;
      // 优化：使用预计算的 _preHideSysNames
      var _hideSys=_preHideSysNames;
      if(_hideSys&&c&&c.name){
        sysText=sysText.replace(new RegExp(c.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'),'TA');
      }
      if(x.isLetter&&x.letterId){
        html.push('<div class="message-system-row" data-mid="'+x.id+'"><div class="message-system message-system-clickable" data-letter-id="'+x.letterId+'" style="font-size:12px;color:#333;text-align:center;padding:8px 20px;margin:2px auto;background:rgba(0,0,0,0.06);border-radius:14px;cursor:pointer;display:inline-block;max-width:90%;">'+sysText+'</div></div>');
      }else if(typeof x.isLetter==='undefined'&&x.t&&(/写了一封信|回了信|回复了你的信|你回复了/.test(x.t))){
        // ★ 兼容旧消息：文本含"写信/回信"关键词但无 isLetter 标记的，也显示灰色可点击框
        html.push('<div class="message-system-row" data-mid="'+x.id+'"><div class="message-system message-system-clickable" data-letter-id="'+x.id+'" style="font-size:12px;color:#333;text-align:center;padding:8px 20px;margin:2px auto;background:rgba(0,0,0,0.06);border-radius:14px;cursor:pointer;display:inline-block;max-width:90%;">'+sysText+'</div></div>');
      }else{
        html.push('<div class="message-system-row" data-mid="'+x.id+'"><div class="message-system" style="font-size:12px;color:#333;text-align:center;padding:6px 16px;opacity:0.8;">'+sysText+'</div></div>');
      }
      lt=d.getTime();
      continue;
    }else if(x.retracted){
      contentHtml='<div class="message-retracted" onclick="event.stopPropagation();showRetractedContent(this)">对方撤回了一条消息</div>';
      var originalHtml='';
      if(x.originalImg){
        var origImgUrl=x.originalImg;
        if(origImgUrl&&!origImgUrl.startsWith('data:image/')){
          var cachedOrigImg=memoryCache['_img_'+origImgUrl];
          if(cachedOrigImg){origImgUrl=cachedOrigImg}
          else{origImgUrl='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23eee" width="100" height="100" rx="8"/%3E%3Ctext fill="%23999" font-size="12" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E图片加载失败%3C/text%3E%3C/svg%3E'}
        }
        originalHtml='<img src="'+origImgUrl.replace(/"/g,'&quot;')+'" class="message-img" style="max-width:100px;max-height:100px;">';
      }else if(x.originalContent){
        originalHtml=x.originalContent.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
      }
      if(originalHtml){
        contentHtml+='<div class="retracted-original" style="display:none;">'+originalHtml+'</div>';
      }
    }else if(x.img||(x.imgs&&x.imgs.length>0)||(x.t&&typeof x.t==='string'&&x.t.startsWith('data:image/'))){
        var imgsArr=(x.imgs&&x.imgs.length>0)?x.imgs:(x.img?[x.img]:[x.t]);
        var totalImgs=imgsArr.length;
        var isSticker=x.isSticker===true;
        var imgsHtml='';
        var gridWrapStyle='';
        var itemStyle='';
        if(totalImgs===1){
          gridWrapStyle='';
          itemStyle='';
        }else if(totalImgs===2){
          gridWrapStyle='display:grid;grid-template-columns:1fr 1fr;gap:4px;max-width:320px;';
          itemStyle='width:100%;height:120px;object-fit:cover;border-radius:8px;';
        }else if(totalImgs===3){
          gridWrapStyle='display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;max-width:320px;';
          itemStyle='width:100%;height:100px;object-fit:cover;border-radius:8px;';
        }else if(totalImgs===4){
          gridWrapStyle='display:grid;grid-template-columns:1fr 1fr;gap:4px;max-width:320px;';
          itemStyle='width:100%;height:120px;object-fit:cover;border-radius:8px;';
        }else{
          gridWrapStyle='display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;max-width:320px;';
          itemStyle='width:100%;height:100px;object-fit:cover;border-radius:8px;';
        }
        var imgClass=isSticker?'message-sticker':'message-img';
        for(var _i=0;_i<totalImgs;_i++){
          var _u=imgsArr[_i];
          // 修复：确保 _u 是字符串，避免非字符串类型导致 .startsWith()/.replace() 崩溃
          if(_u!=null&&typeof _u!=='string')_u=String(_u);
          var _realUrl=_u;
          var _cacheK=_u;
          var onerrorHandler2='';
          if(_u&&!_u.startsWith('data:image/')){
            var cachedImg2=memoryCache['_img_'+_u];
            if(cachedImg2){
              _u=cachedImg2;_realUrl=cachedImg2;
            }else{
              // ★ 修复：http 图 iOS ATS 禁明文——占位图挂 onerror（加载失败可重试/查看原链接），并尝试转 https
              var _retryUrl=_u;
              if(_retryUrl.indexOf('http:')===0)_retryUrl='https:'+_retryUrl.substring(5);
              onerrorHandler2=' onerror="retryLoadImg(this,\''+_cacheK.replace(/"/g,'&quot;')+'\')" onload="this.setAttribute(\'data-real\',\''+_realUrl.replace(/"/g,'&quot;')+'\')"';
              _u='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23f0f0f0" width="100" height="100" rx="8"/%3E%3Ctext fill="%23999" font-size="12" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E加载中%3C/text%3E%3C/svg%3E';
            }
          }
          imgsHtml+='<img src="'+_u.replace(/"/g,'&quot;')+'" class="'+imgClass+'" data-orig="'+_realUrl.replace(/"/g,'&quot;')+'" data-key="'+_cacheK.replace(/"/g,'&quot;')+'" loading="lazy" decoding="async"'+(itemStyle?' style="'+itemStyle+'"':'')+onerrorHandler2+'>';
        }
        if(totalImgs===1){
          var imgHtml=imgsHtml;
          // 修复：确保 x.t 是字符串后再调用 .trim()，避免非字符串类型导致渲染崩溃
          var _imgText=typeof x.t==='string'?x.t:(x.t!=null?String(x.t):'');
          // ★ 修复：图片消息的 t 字段若是 base64/图片 url（旧格式），不当作文字渲染，避免显示乱码
          var _isImgTextLike=_imgText&&(_imgText.startsWith('data:image/')||(_imgText.startsWith('http')&&/\.(png|jpe?g|gif|webp|svg|bmp)(\?|#|$)/i.test(_imgText)));
          if(_imgText&&_imgText.trim()&&!_isImgTextLike&&typeof window.isEmojiOnly==='function'&&!isEmojiOnly(_imgText)){
            var textHtml=_imgText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
            // ★ 表情包+文字组合：文字旁也加 ▶ 语音按钮（仅启用且有音色时）
            var _comboVoice='';
            if(x.s===OTHER&&!x.retracted&&typeof window.getMmSettings==='function'&&typeof window.getContactVoiceId==='function'){
              try{
                var _mmC=getMmSettings();
                if(_mmC.enabled!==false&&getContactVoiceId(cid)){
                  _comboVoice='<span onclick="event.stopPropagation();mmSpeakMsg(\''+x.id+'\',this)" title="用梦角的声音播放" data-mid="'+x.id+'" style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;margin-left:4px;color:var(--accent);cursor:pointer;user-select:none;-webkit-user-select:none;vertical-align:middle;flex-shrink:0;"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>';
                }
              }catch(e){}
            }
            contentHtml='<div class="message-text-img-combo">'+imgHtml+'<div class="message-text-below">'+textHtml+_comboVoice+'</div></div>';
          }else{
            contentHtml=imgHtml;
          }
        }else{
          contentHtml='<div style="'+gridWrapStyle+'">'+imgsHtml+'</div>';
          var _imgText2=typeof x.t==='string'?x.t:(x.t!=null?String(x.t):'');
          var _isImgTextLike2=_imgText2&&(_imgText2.startsWith('data:image/')||(_imgText2.startsWith('http')&&/\.(png|jpe?g|gif|webp|svg|bmp)(\?|#|$)/i.test(_imgText2)));
          if(_imgText2&&_imgText2.trim()&&!_isImgTextLike2){
            var textHtml2=_imgText2.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
            contentHtml+='<div class="message-text-below">'+textHtml2+'</div>';
          }
        }
      }else if(x.isLink&&x.linkUrl){
        // ★ 链接卡片：小红书/B站/QQ音乐/网易云等
        var _lp=x.linkPlatform||'链接';
        var _li=x.linkIcon||'🔗';
        var _lc=x.linkColor||'var(--accent)';
        contentHtml='<div onclick="window.open(\''+x.linkUrl.replace(/'/g,'&#39;').replace(/"/g,'&quot;')+'\',\'_blank\')" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:var(--c2);border:1px solid var(--border);cursor:pointer;max-width:240px;">'+
          '<span style="font-size:24px;flex-shrink:0;">'+_li+'</span>'+
          '<div style="min-width:0;flex:1;">'+
            '<div style="font-weight:600;font-size:13px;color:'+_lc+';">'+_lp+'</div>'+
            '<div style="font-size:11px;color:var(--txt3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+String(x.linkUrl).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div>'+
          '</div>'+
          '<span style="font-size:11px;color:var(--txt3);flex-shrink:0;">打开 ↗</span>'+
        '</div>';
      }else if(x.voice){
        var voiceUrl=x.voice;
        // 修复：确保 voiceUrl 是字符串，避免对象类型导致 startsWith 报错
        if(voiceUrl&&typeof voiceUrl!=='string'){
          if(voiceUrl.url){voiceUrl=voiceUrl.url;}
          else{voiceUrl=String(voiceUrl);}
        }
        if(voiceUrl&&!voiceUrl.startsWith('data:audio/')){
          var cachedVoice=memoryCache['_img_'+voiceUrl];
          if(cachedVoice){voiceUrl=cachedVoice}
        }
        var voiceDisplayText=x.voiceText||'语音消息';
        if(x.sttText)voiceDisplayText=voiceDisplayText+'（'+x.sttText+'）';
        contentHtml='<div class="voice-message-player" style="display:flex;align-items:center;gap:8px;padding:8px;"><button class="voice-play-btn" onclick="playVoiceMsg(this)" data-src="'+voiceUrl.replace(/"/g,'&quot;')+'" style="width:28px;height:28px;border-radius:50%;border:none;background:rgba(255,255,255,0.25);color:inherit;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;">▶</button><div class="voice-wave-bars" style="display:flex;align-items:flex-end;gap:2px;height:18px;flex:1;"><span style="width:3px;background:currentColor;border-radius:2px;opacity:0.5;animation:voiceWave 0.8s ease-in-out infinite alternate;animation-play-state:paused;height:40%;animation-delay:0s;"></span><span style="width:3px;background:currentColor;border-radius:2px;opacity:0.5;animation:voiceWave 0.8s ease-in-out infinite alternate;animation-play-state:paused;height:60%;animation-delay:0.1s;"></span><span style="width:3px;background:currentColor;border-radius:2px;opacity:0.5;animation:voiceWave 0.8s ease-in-out infinite alternate;animation-play-state:paused;height:80%;animation-delay:0.2s;"></span><span style="width:3px;background:currentColor;border-radius:2px;opacity:0.5;animation:voiceWave 0.8s ease-in-out infinite alternate;animation-play-state:paused;height:60%;animation-delay:0.3s;"></span><span style="width:3px;background:currentColor;border-radius:2px;opacity:0.5;animation:voiceWave 0.8s ease-in-out infinite alternate;animation-play-state:paused;height:40%;animation-delay:0.4s;"></span></div><div style="font-size:11px;opacity:0.7;flex-shrink:0;">'+voiceDisplayText+'</div></div>';
      }else{
        // 修复：确保 x.t 是字符串后再调用 .replace()，避免非字符串类型导致渲染崩溃
        var _plainText=typeof x.t==='string'?x.t:(x.t!=null?String(x.t):'');
        contentHtml=_plainText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
        // ★ 梦角文字消息旁：播放按钮（MiniMax 音色 TTS）——仅该梦角已复刻音色时显示，纯矢量图标
        // ★ 梦角文字消息旁：播放按钮（MiniMax 音色 TTS）——仅该梦角已复刻音色且内容为真实文字（非纯表情/emoji）时显示
        var _hasRealText=_plainText&&_plainText.trim()&&/[a-zA-Z\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef0-9]/.test(_plainText)&&!isEmojiOnly(_plainText);
        if(_hasRealText&&x.s===OTHER&&!x.retracted&&typeof window.mmSpeak==='function'&&typeof window.getContactVoiceId==='function'&&typeof window.getMmSettings==='function'){
          var _mmSt=getMmSettings(cid);
          var _hasVoice=_mmSt.enabled!==false&&!!getContactVoiceId(cid);
          if(_hasVoice){
            contentHtml+='<span onclick="event.stopPropagation();mmSpeakMsg(\''+x.id+'\',this)" title="用梦角的声音播放" data-mid="'+x.id+'" style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;margin-left:4px;color:var(--accent);cursor:pointer;user-select:none;-webkit-user-select:none;vertical-align:middle;flex-shrink:0;">'+
              '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'+
              '</span>';
          }
        }
      }
    
    // ★ AI 解读块：解读附加在原消息上；解读中显示进度，完成后自动展开显示
    if(x.aiInterpret!==undefined&&x.aiInterpret!==null){
      if(x.aiLoading){
        contentHtml+='<div style="margin-top:8px;padding:8px 10px;border-radius:10px;background:rgba(0,0,0,0.05);border:1px dashed var(--border);font-size:12px;color:var(--txt2);"><span style="display:inline-block;animation:aiPulse 1s ease-in-out infinite;">📜 TA正在解读...</span></div>';
      }else if(x.aiError){
        contentHtml+='<div style="margin-top:8px;padding:8px 10px;border-radius:10px;background:rgba(0,0,0,0.05);border:1px dashed var(--border);font-size:12px;color:#ff4d4f;">📜 解读失败：'+String(x.aiError).replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div>';
      }else if(x.aiInterpret){
        var _aiEsc=String(x.aiInterpret).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
        var _aiId='aii_'+x.id;
        contentHtml+='<div onclick="var _e=document.getElementById(\''+_aiId+'\');if(_e){var _open=_e.style.display!==\'none\';_e.style.display=_open?\'none\':\'block\';this.querySelector(\'.aii-toggle\').textContent=_open?\'📜 查看解读\':\'📜 收起解读\';}" style="margin-top:8px;padding:8px 10px;border-radius:10px;background:rgba(0,0,0,0.05);border:1px dashed var(--border);cursor:pointer;font-size:12px;color:var(--accent);user-select:none;-webkit-user-select:none;"><span class="aii-toggle">📜 收起解读</span></div><div id="'+_aiId+'" style="display:block;margin-top:6px;padding:10px 12px;border-radius:10px;background:rgba(0,0,0,0.04);font-size:13px;color:var(--txt);line-height:1.7;word-break:break-all;">'+_aiEsc+'</div>';
      }
    }
    
    var quoteHtml='';
    if(x.quote){
      var quoteMsg=m.find(function(q){return q.id===x.quote});
      if(quoteMsg){
        var quoteContent='';
        if(quoteMsg.retracted){
          quoteContent='对方撤回了一条消息';
        }else if(quoteMsg.isTouch){
          // 修复：确保 quoteContent 始终为字符串，避免非字符串类型导致 .replace() 崩溃
          quoteContent=String(quoteMsg.touchAction || '[拍一拍]');
        }else if(quoteMsg.isCall||quoteMsg.callMessage){
          quoteContent=String(quoteMsg.callMessage||'[通话]');
        }else if(quoteMsg.isVoice||quoteMsg.voice){
          quoteContent='[语音]';
        }else if(quoteMsg.img){
          var quoteImgUrl=quoteMsg.img;
          if(quoteImgUrl&&!quoteImgUrl.startsWith('data:image/')){
            var cachedQuoteImg=memoryCache['_img_'+quoteImgUrl];
            if(cachedQuoteImg){quoteImgUrl=cachedQuoteImg}
          }
          var isSticker=quoteMsg.isSticker===true;
          var imgClass=isSticker?'message-sticker':'message-img';
          quoteContent='<img src="'+quoteImgUrl.replace(/"/g,'&quot;')+'" class="'+imgClass+'" style="max-width:48px;max-height:48px;border-radius:4px;object-fit:cover;">';
        }else if(quoteMsg.isLetter){
          quoteContent='[一封信]';
        }else if(quoteMsg.redpacketAmount){
          quoteContent='🧧 红包 ¥'+quoteMsg.redpacketAmount;
        }else if(quoteMsg.t){
          // ★ 修复：优先显示原文（文字消息不应显示成情绪字卡）；仅当无原文时才用情绪卡内容
          quoteContent=String(quoteMsg.t);
        }else if(quoteMsg.moodCard||quoteMsg.heartCard||quoteMsg.intentCard){
          var cardParts=[];
          if(quoteMsg.moodCard&&quoteMsg.moodCard.content)cardParts.push('💭 '+quoteMsg.moodCard.content);
          if(quoteMsg.heartCard&&quoteMsg.heartCard.content)cardParts.push('❤️ '+quoteMsg.heartCard.content);
          if(quoteMsg.intentCard&&quoteMsg.intentCard.content)cardParts.push('💬 '+quoteMsg.intentCard.content);
          quoteContent=cardParts.join(' ');
        }else if(quoteMsg.callMessage){
          quoteContent=String(quoteMsg.callMessage);
        }else{
          quoteContent='[消息]';
        }
        // 修复：确保 quoteContent 是字符串后再调用字符串方法
        if(typeof quoteContent!=='string')quoteContent=String(quoteContent||'');
        if(!quoteMsg.img&&quoteContent.length>30)quoteContent=quoteContent.substring(0,30)+'...';
        quoteHtml='<div class="message-quote">'+(quoteMsg.img?quoteContent:quoteContent.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'))+'</div>';
      }else{
        quoteHtml='<div class="message-quote">[消息已被删除]</div>';
      }
    }
    
    var isLiked=x.liked?'true':'false';
    var starHtml='';
    if(starEn&&x.s===OTHER&&isProactive){
      starHtml='<span class="message-star" style="color:'+starColorCached+'">⭐</span>';
    }
    var readIgnoredHtml=(x.s===SELF&&x.readIgnored)?'<div class="message-read-ignored" style="font-size:11px;color:#333;white-space:nowrap;align-self:flex-end;margin-top:2px;">已读不回</div>':'';
    var moodCardHtml='';
    var hasMood=x.moodCard&&x.moodCard.content;
    var hasHeart=x.heartCard&&x.heartCard.content;
    var hasIntent=x.intentCard&&x.intentCard.content;
    if(hasMood||hasHeart||hasIntent){
      var moodColor=x.s===SELF?'var(--txt2)':'var(--txt3)';
      var pillStyle='display:inline-flex;align-items:center;font-size:11px;color:'+moodColor+';white-space:nowrap;';
      var pills=[];
      if(hasMood)pills.push('<span class="message-mood-pill" style="'+pillStyle+'">💭 '+x.moodCard.content+'</span>');
      if(hasHeart)pills.push('<span class="message-mood-pill" style="'+pillStyle+'">❤️ '+x.heartCard.content+'</span>');
      if(hasIntent)pills.push('<span class="message-mood-pill" style="'+pillStyle+'">💬 '+x.intentCard.content+'</span>');
      moodCardHtml='<div class="message-mood-card" style="display:inline-flex;flex-direction:row;flex-wrap:nowrap;gap:8px;margin-top:4px;padding:4px 10px;background:rgba(255,255,255,0.85);border-radius:12px;border:1px solid rgba(0,0,0,0.06);flex-shrink:0;">'+pills.join('')+'</div>';
    }
    var editBtnHtml='';
    var canRetract=false;
    var retractBtnHtml='';
    if(!isMobile){
      editBtnHtml=x.s===SELF&&x.t?'<button class="msg-action-btn edit-btn" title="编辑" onclick="handleEditMsg(\''+x.id+'\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7.5"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>':'';
      canRetract=x.s===SELF&&!x.retracted&&(x.t||x.img);
      retractBtnHtml=canRetract?'<button class="msg-action-btn retract-btn" title="撤回" onclick="handleRetractMsg(\''+x.id+'\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7h14M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg></button>':'';
    }
    var actionsHtml=(longScreenshotMode||favMsgMode)?'':(isMobile?'':'<div class="msg-actions"><button class="msg-action-btn reply-btn" title="引用" onclick="handleReplyMsg(\''+x.id+'\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg></button>'+editBtnHtml+retractBtnHtml+'<button class="msg-action-btn delete-btn" title="删除" onclick="handleDeleteMsg(\''+x.id+'\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button></div>');
    
    var timeHtml='<div class="mt">'+fts(d)+'</div>';
    var avatarHtml='';
    
    if(!hideAvatars){
      if(x.s===SELF){
        avatarHtml='<div class="ma-wrap"><div class="ma" data-contact-id="'+cid+'">'+myAvatar+'</div>'+(timelineStyle==='avatar'?timeHtml:'')+'</div>';
      }else if(isGroup&&x.senderId){
        var sender=contactMap[x.senderId];
        var grp=groupMap[cid];
        var memberAv='';
        if(grp&&grp.memberSettings&&grp.memberSettings[x.senderId]&&grp.memberSettings[x.senderId].avatar){
          memberAv=grp.memberSettings[x.senderId].avatar;
        }else if(sender&&sender.avatar){
          memberAv=sender.avatar;
        }else{
          memberAv='✦';
        }
        var senderAv=(typeof memberAv==='string'&&memberAv.startsWith('data:image'))?'<img src="'+memberAv.replace(/"/g,'&quot;')+'">':String(memberAv||'✦');
        avatarHtml='<div class="ma-wrap"><div class="ma" data-contact-id="'+x.senderId+'">'+senderAv+'</div>'+(timelineStyle==='avatar'?timeHtml:'')+'</div>';
      }else{
        avatarHtml='<div class="ma-wrap"><div class="ma" data-contact-id="'+cid+'">'+otherAvatar+'</div>'+(timelineStyle==='avatar'?timeHtml:'')+'</div>';
      }
    }
    
    var bubbleTimeHtml=timelineStyle==='bubble'?'<div class="mb-time">'+fts(d)+'</div>':(timelineStyle==='inside'?'<div class="mb-time-inside">'+fts(d)+'</div>':'');
    var senderNameHtml='';
    
    if(isGroup&&x.s!==SELF&&x.senderId){
      var grp2=groupMap[cid];
      var displayName='';
      if(grp2&&grp2.memberSettings&&grp2.memberSettings[x.senderId]&&grp2.memberSettings[x.senderId].nickname){
        displayName=grp2.memberSettings[x.senderId].nickname;
      }else{
        displayName=x.senderName||'';
      }
      if(displayName){
        senderNameHtml='<div class="sender-name" style="font-size:11px;color:var(--txt3);margin-bottom:4px;">'+displayName+'</div>';
      }
    }
    
    var ssCheckboxHtml='';
    if(longScreenshotMode&&!x.retracted&&(x.t||x.img||x.isTouch||x.isCall||x.isRedpacket||x.voice)){
      var isChecked=longScreenshotSelectedMsgs.indexOf(x.id)>=0;
      ssCheckboxHtml='<div class="ss-check-wrap"><input type="checkbox" '+(isChecked?'checked':'')+' onclick="event.stopPropagation();toggleLongScreenshotMsg(\''+x.id+'\')" style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent);"></div>';
    }else if(favMsgMode&&!x.retracted&&(x.t||x.img||x.isTouch||x.isRedpacket||x.voice)){
      var isFavChecked=selectedFavMsgIds.indexOf(x.id)>=0;
      ssCheckboxHtml='<div class="ss-check-wrap"><input type="checkbox" '+(isFavChecked?'checked':'')+' onclick="event.stopPropagation();toggleFavMsg(\''+x.id+'\')" style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent);"></div>';
    }else if(copyMsgMode&&!x.retracted&&(x.t||x.isTouch)){
      var isCopyChecked=selectedCopyMsgIds.indexOf(x.id)>=0;
      ssCheckboxHtml='<div class="ss-check-wrap"><input type="checkbox" '+(isCopyChecked?'checked':'')+' onclick="event.stopPropagation();toggleCopyMsg(\''+x.id+'\')" style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent);"></div>';
    }
    var isLetterMsg=x.isLetter&&x.letterId;
    var isCollectedMsg=x.isRedpacketCollected===true;
    if(isRedpacketMsg){
      html.push('<div class="mr'+((longScreenshotMode||favMsgMode||copyMsgMode)?' mr-ss':'')+' '+(x.s===SELF?'self':'other')+(gap?' has-gap':'')+'" data-mid="'+x.id+'" data-liked="'+isLiked+'">'+ssCheckboxHtml+avatarHtml+'<div class="mc">'+senderNameHtml+starHtml+contentHtml+bubbleTimeHtml+moodCardHtml+readIgnoredHtml+'</div></div>');
    }else if(isCollectedMsg){
      html.push('<div class="mr'+((longScreenshotMode||favMsgMode||copyMsgMode)?' mr-ss':'')+' '+(x.s===SELF?'self':'other')+(gap?' has-gap':'')+'" data-mid="'+x.id+'" data-liked="'+isLiked+'">'+ssCheckboxHtml+avatarHtml+'<div class="mc">'+senderNameHtml+contentHtml+'</div></div>');
    }else if(isLetterMsg){
      html.push('<div class="mr'+((longScreenshotMode||favMsgMode||copyMsgMode)?' mr-ss':'')+' '+(x.s===SELF?'self':'other')+(gap?' has-gap':'')+'" data-mid="'+x.id+'" data-liked="'+isLiked+'" style="justify-content:center;width:100%;display:flex;margin:0 auto;">'+ssCheckboxHtml+'<div class="mc" style="width:auto;max-width:85%;display:flex;justify-content:center;margin:0 auto;">'+contentHtml+'</div></div>');
    }else{
      html.push('<div class="mr'+((longScreenshotMode||favMsgMode||copyMsgMode)?' mr-ss':'')+' '+(x.s===SELF?'self':'other')+(gap?' has-gap':'')+(x.retracted?' retracted':'')+'" data-mid="'+x.id+'" data-liked="'+isLiked+'">'+ssCheckboxHtml+avatarHtml+'<div class="mc">'+senderNameHtml+starHtml+'<div class="mb" style="'+bubbleOpacity+'">'+quoteHtml+contentHtml+bubbleTimeHtml+actionsHtml+'</div>'+moodCardHtml+readIgnoredHtml+'</div></div>');
    }
    lt=d.getTime();
  }
  
  box.innerHTML=html.join('');

  // ★ 事件委托：绑定到消息容器，点任何信件系统消息都触发（不依赖渲染后查询时机，更可靠）
  // 防重复：box 是固定容器，多次渲染会重复绑定，用标记保证只绑一次
  if(!box._letterDelegateBound){
    box._letterDelegateBound=true;
    box.addEventListener('click',function(ev){
      var el=ev.target&&ev.target.closest?ev.target.closest('.message-system-clickable'):null;
      if(!el)return;
      var lid=el.getAttribute('data-letter-id');
      if(lid&&typeof openLetterDetail==='function'){
        _letterFromChat=true; // ★ 从聊天点开信件：回信后不跳转信箱页
        openLetterDetail(lid);
      }
    });
    // ★ 触顶加载更早的消息（原 80 条硬截断导致历史消息不可见/无法上划）
    box.addEventListener('scroll',function(){
      if(_loadMoreLock)return;
      if(box.scrollTop<60){
        var allMsgs=msgs(cid);
        if(!allMsgs||allMsgs.length===0)return;
        var curStart=(typeof _renderStartIdx==='number')?_renderStartIdx:Math.max(0,allMsgs.length-80);
        if(curStart<=0)return; // 已到最早
        _loadMoreLock=true;
        var newStart=Math.max(0,curStart-80);
        var prevHeight=box.scrollHeight;
        _renderStartIdx=newStart;
        _jumpFocusJustJumped=true;
        setTimeout(function(){_jumpFocusJustJumped=false;},1500);
        try{renderMsgs(allMsgs);}catch(e){}
        // 渲染后保持滚动位置（新内容加到顶部）
        setTimeout(function(){
          try{
            box.scrollTop=box.scrollHeight-prevHeight;
          }catch(e){}
          _loadMoreLock=false;
        },80);
      }
    });
  }

  initMsgActions();
  if(!longScreenshotMode){
    // ★ 修复：只在"触顶加载/日期跳转"状态不滚底；普通渲染（含消息超80条）必须滚底
    // 之前用 _renderStartIdx>0 判断导致消息超80条后永远不滚底，新消息要手动滑动才能看到
    var _isAtEnd=!(_loadMoreLock||_jumpFocusJustJumped);
    if(_isAtEnd){
      requestAnimationFrame(function(){box.scrollTop=box.scrollHeight});
      // ★ 修复：iOS 键盘弹出/收起动画期间视口高度变化，rAF 一次可能滚不到位；
      // 延迟再滚两次，确保新消息始终自动滚到底部可见
      setTimeout(function(){try{box.scrollTop=box.scrollHeight;}catch(e){}},200);
      setTimeout(function(){try{box.scrollTop=box.scrollHeight;}catch(e){}},500);
    }
  }
  // ★ 修复：输入框 blur 后 300ms 内阻止误重聚焦（点其他按钮/切页后键盘重弹问题）——只绑一次
  try{
    var _msgInpFix=$('msg-inp');
    if(_msgInpFix&&!_msgInpFix._keyboardGuardBound){
      _msgInpFix._keyboardGuardBound=true;
      var _lastBlurFix=0;
      _msgInpFix.addEventListener('blur',function(){_lastBlurFix=Date.now();});
      _msgInpFix.addEventListener('focus',function(){
        if(Date.now()-_lastBlurFix<300){
          this.blur();
        }
      });
    }
  }catch(e){}

  try{
    var _entity=groups.find(function(x){return x.id===cid})||contacts.find(function(x){return x.id===cid});
    if(_entity&&_entity.chatSettings&&_entity.chatSettings.customCSS&&_entity.chatSettings.customCSS.trim()){
      var _bubbles=box.querySelectorAll('.mb');
      for(var _bi=0;_bi<_bubbles.length;_bi++){
        _bubbles[_bi].style.setProperty('--border','none','important');
        _bubbles[_bi].style.setProperty('box-shadow','none','important');
      }
    }
  }catch(e){
    console.error('renderMsgs error:',e);
  }
  // ★ 修复：关闭 _doRenderMsgs 最外层 rAF 回调里 1504 行的 try（缺失的 catch，导致整页 JS 语法崩溃）
  }catch(e){
    console.error('renderMsgs outer error:',e);
  }
  _renderingMsgs=false;
  renderChatMusicStatus();
  if(_pendingRenderMsgs){
    _pendingRenderMsgs=false;
    renderMsgs(messages);
  }
  });
}

var replyingToMsg=null;
if($('quote-cancel'))$('quote-cancel').addEventListener('click',function(){
  replyingToMsg=null;
  $('quote-preview').style.display='none';
});

var _msgActionsInitialized=false;
function initMsgActions(){
  if(_msgActionsInitialized)return;
  var box=$('msgbox');
  if(!box)return;
  
  _msgActionsInitialized=true;
  
  var isTouchDevice='ontouchstart' in window;
  var longPressTimer=null;
  var longPressMsg=null;
  var startX=0,startY=0;
  
  var clearLongPress=function(){
    if(longPressTimer){cancelSafeTimer(longPressTimer);longPressTimer=null;}
    longPressMsg=null;
  };
  
  var handleTouchMove=rafThrottle(function(dx,dy){
    if(Math.abs(dx)>10||Math.abs(dy)>10){
      clearLongPress();
    }
  });
  
  var touchStartHandler=function(e){
    var el=e.target.closest('.mb');
    if(!el)return;
    if(e.target.closest('.message-system-clickable'))return;
    var mrEl=el.closest('.mr');
    if(!mrEl)return;
    var t=e.touches&&e.touches[0];
    startX=t?t.clientX:0;
    startY=t?t.clientY:0;
    longPressMsg={id:mrEl.dataset.mid,liked:mrEl.dataset.liked==='true',startX:startX,startY:startY};
    longPressTimer=safeSetTimeout(function(){
      if(!longPressMsg)return;
      showMsgActionMenu(startX,startY,longPressMsg.id,longPressMsg.liked);
      longPressMsg=null;
      haptic('light');
    },500);
  };
  
  var touchEndHandler=clearLongPress;
  
  var touchMoveHandler=function(e){
    var t=e.touches&&e.touches[0];
    var dx=t?t.clientX-startX:0;
    var dy=t?t.clientY-startY:0;
    handleTouchMove(dx,dy);
  };
  
  if(isTouchDevice){
    box.addEventListener('touchstart',touchStartHandler,{passive:true});
    box.addEventListener('touchend',touchEndHandler,{passive:true});
    box.addEventListener('touchmove',touchMoveHandler,{passive:true});
  }
  
  var clickHandler=function(e){
    // ★ 语音播放按钮：事件委托兜底（仅匹配播放按钮 span[data-mid]，避免误触消息行）
    var mmPlayBtn=e.target.closest('span[data-mid]');
    if(mmPlayBtn&&typeof mmSpeakMsg==='function'){
      var _mmId=mmPlayBtn.getAttribute('data-mid');
      if(_mmId){
        e.stopPropagation();
        mmSpeakMsg(_mmId,mmPlayBtn);
        return;
      }
    }
    var retractedEl=e.target.closest('.message-retracted');
    if(retractedEl){
      showRetractedContent(retractedEl);
      return;
    }
    var maEl=e.target.closest('.ma');
    if(maEl){
      var msgEl=maEl.closest('.mr');
      if(msgEl&&msgEl.classList.contains('self'))return;
      var contactId=maEl.dataset.contactId;
      if(contactId){
        showContactTouchMenu(contactId,maEl);
        haptic('light');
      }
      return;
    }
    var mbEl=e.target.closest('.mb');
    if(mbEl&&!e.target.closest('.ma')&&!e.target.closest('.mr-ss')&&!e.target.closest('.message-touch')&&!e.target.closest('.message-system-clickable')){
      var mrEl=mbEl.closest('.mr');
      if(!mrEl)return;
      var msgId=mrEl.dataset.mid;
      var liked=mrEl.dataset.liked==='true';
      if(msgId){
        showMsgActionMenu(e.clientX||e.pageX||0,e.clientY||e.pageY||0,msgId,liked);
        haptic('light');
      }
    }
  };
  
  box.addEventListener('click',clickHandler);
}

async function loadNavDisplayStates(){
  var data=null;
  if(memoryCache.hasOwnProperty('ml2_nav_display_states')){
    data=memoryCache['ml2_nav_display_states'];
  }
  if(!data&&window.localforage){
    data=await window.localforage.getItem('ml2_nav_display_states');
  }
  // localStorage兜底
  if(!data||typeof data!=='object'){
    var lsVal=safeGetItem('ml2_lf_ml2_nav_display_states');
    if(lsVal){
      try{data=JSON.parse(lsVal);}catch(e){}
    }
  }
  if(data&&typeof data==='object'){
    navDisplayStates=data;
    memoryCache['ml2_nav_display_states']=navDisplayStates;
    for(var key in navDisplayStates){
      var state=navDisplayStates[key];
      if(state){
        if(typeof state.lastStatusChange==='string')state.lastStatusChange=parseInt(state.lastStatusChange)||Date.now();
        if(typeof state.lastWeatherChange==='string')state.lastWeatherChange=parseInt(state.lastWeatherChange)||Date.now();
        if(typeof state.lastTimeChange==='string')state.lastTimeChange=parseInt(state.lastTimeChange)||Date.now();
        if(typeof state.lastIdleChange==='string')state.lastIdleChange=parseInt(state.lastIdleChange)||Date.now();
        if(typeof state.lastMoodChange==='string')state.lastMoodChange=parseInt(state.lastMoodChange)||Date.now();
      }
    }
  }
}

async function saveNavDisplayStates(){
  memoryCache['ml2_nav_display_states']=navDisplayStates;
  // 直接写入 IndexedDB（不依赖 isLFAvailable()，确保数据落盘）
  if(window.localforage){
    try{await window.localforage.setItem('ml2_nav_display_states',navDisplayStates);}catch(e){}
  }
  ls('ml2_nav_display_states',navDisplayStates);
}

function resetNavDisplayTimers(){
  for(var i=0;i<contacts.length;i++){
    var c=contacts[i];
    // 即使 navDisplayStates 中尚无该联系人的条目，也需创建并重置，
    // 否则首次启动时 checkNavDisplay 会用 Date.now() 初始化，导致条件永远不满足。
    if(!navDisplayStates[c.id]){
      navDisplayStates[c.id]={};
    }
    navDisplayStates[c.id].lastStatusChange=0;
    navDisplayStates[c.id].nextStatusChange=0;
    navDisplayStates[c.id].lastWeatherChange=0;
    navDisplayStates[c.id].nextWeatherChange=0;
    navDisplayStates[c.id].lastTimeChange=0;
    navDisplayStates[c.id].nextTimeChange=0;
    navDisplayStates[c.id].lastIdleChange=0;
    navDisplayStates[c.id].nextIdleChange=0;
    navDisplayStates[c.id].lastMoodChange=0;
    navDisplayStates[c.id].nextMoodChange=0;
  }
}

async function updateNavWeather(contactId){
  if(!navDisplayStates[contactId]){
    navDisplayStates[contactId]={};
  }
  var publicCards=await getNavCards('public');
  var privateCards=await getNavCards('private',contactId);
  var weatherCards=publicCards.filter(function(c){return c.category==='weather'}).concat(
    privateCards.filter(function(c){return c.category==='weather'})
  );
  var weatherText='☀️ 晴朗';
  if(weatherCards.length>0){
    var lastIndex=navDisplayStates[contactId].lastWeatherIndex||-1;
    var newIndex;
    do{
      newIndex=Math.floor(Math.random()*weatherCards.length);
    }while(weatherCards.length>1&&newIndex===lastIndex);
    navDisplayStates[contactId].lastWeatherIndex=newIndex;
    weatherText=weatherCards[newIndex].content;
  }
  navDisplayStates[contactId].weather=weatherText;
  navDisplayStates[contactId].lastWeatherChange=Date.now();
  await saveNavDisplayStates();
  if(cid===contactId&&$('nav-weather')){
    $('nav-weather').textContent=weatherText;
    $('nav-weather').style.display='';
  }
}

async function updateNavTime(contactId){
  if(!navDisplayStates[contactId]){
    navDisplayStates[contactId]={};
  }
  var publicCards=await getNavCards('public');
  var privateCards=await getNavCards('private',contactId);
  var timeCards=publicCards.filter(function(c){return c.category==='time'}).concat(
    privateCards.filter(function(c){return c.category==='time'})
  );
  var now=new Date();
  var timeText=now.getHours()+':'+(now.getMinutes()<10?'0':'')+now.getMinutes();
  var isCard=false;
  if(timeCards.length>0){
    var lastIndex=navDisplayStates[contactId].lastTimeIndex||-1;
    var newIndex;
    do{
      newIndex=Math.floor(Math.random()*timeCards.length);
    }while(timeCards.length>1&&newIndex===lastIndex);
    navDisplayStates[contactId].lastTimeIndex=newIndex;
    timeText=timeCards[newIndex].content;
    isCard=true;
  }
  navDisplayStates[contactId].time=timeText;
  navDisplayStates[contactId].timeIsCard=isCard;
  navDisplayStates[contactId].lastTimeChange=Date.now();
  await saveNavDisplayStates();
  if(cid===contactId&&$('nav-time')){
    $('nav-time').textContent=timeText;
    $('nav-time').style.display='';
  }
}

async function updateNavIdle(contactId){
  if(!navDisplayStates[contactId]){
    navDisplayStates[contactId]={};
  }
  var publicCards=await getNavCards('public');
  var privateCards=await getNavCards('private',contactId);
  var idleCards=publicCards.filter(function(c){return c.category==='idle'}).concat(
    privateCards.filter(function(c){return c.category==='idle'})
  );
  var idleText='🌙 空闲';
  if(idleCards.length>0){
    var lastIndex=navDisplayStates[contactId].lastIdleIndex||-1;
    var newIndex;
    do{
      newIndex=Math.floor(Math.random()*idleCards.length);
    }while(idleCards.length>1&&newIndex===lastIndex);
    navDisplayStates[contactId].lastIdleIndex=newIndex;
    idleText=idleCards[newIndex].content;
  }
  navDisplayStates[contactId].idle=idleText;
  navDisplayStates[contactId].lastIdleChange=Date.now();
  await saveNavDisplayStates();
  if(cid===contactId&&$('nav-idle')){
    $('nav-idle').textContent=idleText;
    $('nav-idle').style.display='';
  }
}

async function updateNavMood(contactId){
  if(!navDisplayStates[contactId]){
    navDisplayStates[contactId]={};
  }
  var publicCards=await getNavCards('public');
  var privateCards=await getNavCards('private',contactId);
  var moodCards=publicCards.filter(function(c){return c.category==='mood'}).concat(
    privateCards.filter(function(c){return c.category==='mood'})
  );
  var moodText='😊 开心';
  if(moodCards.length>0){
    var lastIndex=navDisplayStates[contactId].lastMoodIndex||-1;
    var newIndex;
    do{
      newIndex=Math.floor(Math.random()*moodCards.length);
    }while(moodCards.length>1&&newIndex===lastIndex);
    navDisplayStates[contactId].lastMoodIndex=newIndex;
    moodText=moodCards[newIndex].content;
  }
  navDisplayStates[contactId].mood=moodText;
  navDisplayStates[contactId].lastMoodChange=Date.now();
  await saveNavDisplayStates();
  if(cid===contactId&&$('nav-mood')){
    $('nav-mood').textContent=moodText;
    $('nav-mood').style.display='';
  }
}

function refreshNavDisplay(){
  if(!cid)return;
  var state=navDisplayStates[cid];
  var isGroup=window.currentConvType==='group';
  if(state){
    if(state.weather&&$('nav-weather')){
      $('nav-weather').textContent=state.weather;
      $('nav-weather').style.display=isGroup?'none':'';
    }
    if(state.time&&$('nav-time')){
      $('nav-time').textContent=state.time;
      $('nav-time').style.display=isGroup?'none':'';
    }
    if(state.status&&$('nav-contact-status')){
      $('nav-contact-status').textContent=state.status;
      var c2=contacts.find(function(x){return x.id===cid});
      var hideStatus2=!!(c2&&c2.hideTopbarAvatarStatus);
      $('nav-contact-status').style.display=(isGroup||hideStatus2)?'none':'';
    }
    if(state.idle&&$('nav-idle')){
      $('nav-idle').textContent=state.idle;
      $('nav-idle').style.display=isGroup?'none':'';
    }
    if(state.mood&&$('nav-mood')){
      $('nav-mood').textContent=state.mood;
      $('nav-mood').style.display=isGroup?'none':'';
    }
    // 同步更新顶部栏头像（联系人随机头像库更换时）
    if(!isGroup&&$('nav-contact-avatar')){
      var currentContact=contacts.find(function(x){return x.id===cid});
      var avatarHtml='';
      if(currentContact&&currentContact.avatar){avatarHtml='<img src="'+currentContact.avatar.replace(/"/g,'&quot;')+'">';}
      else{avatarHtml='✦';}
      $('nav-contact-avatar').innerHTML=avatarHtml;
    }
  }
}

async function checkNavDisplay(){
  for(var i=0;i<contacts.length;i++){
    var c=contacts[i];
    if(!navDisplayStates[c.id]){
      navDisplayStates[c.id]={
        lastStatusChange:0,
        nextStatusChange:0,
        lastWeatherChange:0,
        nextWeatherChange:0,
        lastTimeChange:0,
        nextTimeChange:0,
        lastIdleChange:0,
        nextIdleChange:0,
        lastMoodChange:0,
        nextMoodChange:0
      };
    }
    var state=navDisplayStates[c.id];
    if(state.lastStatusChange===undefined||state.lastStatusChange===null||state.lastStatusChange>Date.now()){
      state.lastStatusChange=0;
      state.nextStatusChange=0;
    }
    if(state.lastWeatherChange===undefined||state.lastWeatherChange===null||state.lastWeatherChange>Date.now()){
      state.lastWeatherChange=0;
      state.nextWeatherChange=0;
    }
    if(state.lastTimeChange===undefined||state.lastTimeChange===null||state.lastTimeChange>Date.now()){
      state.lastTimeChange=0;
      state.nextTimeChange=0;
    }
    if(state.lastIdleChange===undefined||state.lastIdleChange===null||state.lastIdleChange>Date.now()){
      state.lastIdleChange=0;
      state.nextIdleChange=0;
    }
    if(state.lastMoodChange===undefined||state.lastMoodChange===null||state.lastMoodChange>Date.now()){
      state.lastMoodChange=0;
      state.nextMoodChange=0;
    }
    
    if((Date.now()-state.lastStatusChange)/36e5>=state.nextStatusChange){
      await updateNavContactStatus(c);
      state.lastStatusChange=Date.now();
      state.nextStatusChange=1+Math.random()*7;
    }
    
    if((Date.now()-state.lastWeatherChange)/36e5>=state.nextWeatherChange){
      await updateNavWeather(c.id);
      state.lastWeatherChange=Date.now();
      state.nextWeatherChange=1+Math.random()*7;
    }
    
    if((Date.now()-state.lastTimeChange)/36e5>=state.nextTimeChange){
      await updateNavTime(c.id);
      state.lastTimeChange=Date.now();
      state.nextTimeChange=1+Math.random()*7;
    }
    
    if((Date.now()-state.lastIdleChange)/36e5>=state.nextIdleChange){
      await updateNavIdle(c.id);
      state.lastIdleChange=Date.now();
      state.nextIdleChange=1+Math.random()*7;
    }
    
    if((Date.now()-state.lastMoodChange)/36e5>=state.nextMoodChange){
      await updateNavMood(c.id);
      state.lastMoodChange=Date.now();
      state.nextMoodChange=1+Math.random()*7;
    }
  }
  await saveNavDisplayStates();
}

// setInterval(checkNavDisplay,60000); // 移到初始化完成后启动

async function updateNavContactStatus(contact){
  if(!navDisplayStates[contact.id]){
    navDisplayStates[contact.id]={};
  }
  var publicCards=await getNavCards('public');
  var privateCards=await getNavCards('private',contact.id);
  var statusCards=publicCards.filter(function(c){return c.category==='status'}).concat(
    privateCards.filter(function(c){return c.category==='status'})
  );
  var statusText='在线';
  if(statusCards.length>0){
    var lastIndex=navDisplayStates[contact.id].lastStatusIndex||-1;
    var newIndex;
    do{
      newIndex=Math.floor(Math.random()*statusCards.length);
    }while(statusCards.length>1&&newIndex===lastIndex);
    navDisplayStates[contact.id].lastStatusIndex=newIndex;
    statusText=statusCards[newIndex].content;
  }
  navDisplayStates[contact.id].status=statusText;
  navDisplayStates[contact.id].lastStatusChange=Date.now();
  await saveNavDisplayStates();
  if(cid===contact.id&&$('nav-contact-status')){
    $('nav-contact-status').textContent=statusText;
    var hideTopStatus=!!(contact&&contact.hideTopbarAvatarStatus);
    $('nav-contact-status').style.display=hideTopStatus?'none':'';
  }
}

function handleReplyMsg(msgId){
  var m=msgs(cid);
  var msg=m.find(function(m){return m.id===msgId});
  if(!msg)return;
  replyingToMsg=msgId;
  var content='';
  var replyContact=contacts.find(function(x){return x.id===cid});
  if(msg.retracted){
    content='对方撤回了一条消息';
  }else if(msg.isTouch){
    var _hideTouchReply=_globalHideTouchNames[cid]===true;
    if(!_hideTouchReply&&getHideTouchNames(cid)===true){
      _hideTouchReply=true;
    }
    if(!_hideTouchReply&&typeof editingContact!=='undefined'&&editingContact&&editingContact.id===cid&&editingContact.hideTouchNames){
      _hideTouchReply=true;
    }
    if(!_hideTouchReply){
      var touchContact=contacts.find(function(ct){return ct.id===cid});
      _hideTouchReply=!!(touchContact&&touchContact.hideTouchNames);
    }
    var touchName=(msg.s===SELF?'我':(_hideTouchReply?'TA':(msg.senderName||'对方')));
    var replyTouchAction=msg.touchAction||'';
    if(_hideTouchReply&&replyContact&&replyContact.name){
      replyTouchAction=replyTouchAction.replace(new RegExp(replyContact.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'),msg.s===SELF?'TA':'我');
    }
    var replyTouchTarget=msg.touchTarget||'你';
    if(_hideTouchReply){
      replyTouchTarget=msg.s===SELF?'TA':'我';
    }
    var touchContent=touchName+' '+replyTouchAction.replace('你',replyTouchTarget);
    content='<span style="font-size:12px;color:var(--txt2)">'+touchContent+'</span>';
  }else if(msg.img){
    var replyImgUrl=msg.img;
    if(replyImgUrl&&!replyImgUrl.startsWith('data:image/')){
      var cachedReplyImg=memoryCache['_img_'+replyImgUrl];
      if(cachedReplyImg)replyImgUrl=cachedReplyImg;
    }
    var isSticker=msg.isSticker===true;
    var imgClass=isSticker?'message-sticker':'message-img';
    content='<img src="'+replyImgUrl.replace(/"/g,'&quot;')+'" class="'+imgClass+'" style="max-width:60px;max-height:60px;border-radius:6px;object-fit:cover;">';
  }else if(msg.t){
    content=msg.t;
  }else{
    content='[消息]';
  }
  if(!msg.img&&content.length>30)content=content.substring(0,30)+'...';
  $('quote-preview-content').innerHTML=content;
  $('quote-preview').style.display='flex';
}

function handleDeleteMsg(msgId){
  customConfirm('确定删除这条消息吗？').then(function(ok){
    if(!ok)return;
    var m=msgs(cid);
    m=m.filter(function(m){return m.id!==msgId});
    savemsgs(cid,m);
    renderMsgs();
    haptic('warn');
  });
}

function handleRetractMsg(msgId){
  customConfirm('确定撤回这条消息吗？').then(function(ok){
    if(!ok)return;
    var m=msgs(cid);
    var msg=m.find(function(m){return m.id===msgId});
    if(msg){
      msg.retracted=true;
      msg.originalContent=msg.t;
      msg.originalImg=msg.img;
      msg.t='';
      msg.img='';
      savemsgs(cid,m);
      renderMsgs();
      haptic('light');
      toast('消息已撤回');
    }
  });
}

function handleEditMsg(msgId){
  var m=msgs(cid);
  var msg=m.find(function(m){return m.id===msgId});
  if(msg&&msg.t&&msg.s===SELF){
    var newText=prompt('编辑消息内容：',msg.t);
    if(newText!==null&&newText!==msg.t){
      msg.t=newText;
      savemsgs(cid,m);
      renderMsgs();
      toast('消息已编辑');
    }
  }else if(msg&&msg.t&&msg.s!==SELF){
    toast('只能编辑自己发送的消息');
  }else{
    toast('此消息无法编辑');
  }
}

function fallbackCopy(text){
  var textarea=document.createElement('textarea');
  textarea.value=text;
  textarea.style.position='fixed';
  textarea.style.left='-9999px';
  textarea.style.top='-9999px';
  textarea.style.opacity='0';
  document.body.appendChild(textarea);
  textarea.select();
  try{
    var successful=document.execCommand('copy');
    if(successful){
      toast('已复制到剪贴板');
    }else{
      toast('复制失败');
    }
  }catch(err){
    toast('复制失败');
  }
  document.body.removeChild(textarea);
}

function showMsgActionMenu(x,y,msgId,isLiked,isNonInstant){
  document.removeEventListener('click',hideMsgActionMenuOnce);
  var menu=$('msg-action-menu');
  var replyBtn=$('msg-action-reply');
  var editBtn=$('msg-action-edit');
  var retractBtn=$('msg-action-retract');
  var copyBtn=$('msg-action-copy');
  var deleteBtn=$('msg-action-delete');
  var aiBtn=$('msg-action-ai');
  var sttBtn=$('msg-action-stt');
  
  var getMsgs=function(){return isNonInstant?nonInstantMsgs(nonInstantCid):msgs(cid)};
  var saveMsgs=function(id,m){return isNonInstant?saveNonInstantMsgs(id,m):savemsgs(id,m)};
  var renderMsgsFunc=function(){return isNonInstant?renderNonInstantMsgs():renderMsgs()};
  var currentId=isNonInstant?nonInstantCid:cid;
  
  var msg=getMsgs().find(function(m){return m.id===msgId});
  var isSelf=msg&&msg.s===SELF;
  
  replyBtn.style.display='flex';
  deleteBtn.style.display='flex';
  if(aiBtn)aiBtn.style.display='flex';
  if(aiBtn){
    var apiSet=(typeof getApiSettings==='function')?getApiSettings():{enabled:false};
    aiBtn.style.display=apiSet.enabled?'flex':'none';
  }
  aiBtn.onclick=function(e){e.stopPropagation();
    if(typeof aiInterpretCard==='function'){aiInterpretCard(msgId);}
    else{hideMsgActionMenu();toast('AI 功能未加载');}
  };
  // ★ 收藏按钮：直接收藏这条消息到"我的收藏"
  var favBtn=$('msg-action-fav');
  if(favBtn){
    favBtn.style.display='flex';
    favBtn.onclick=function(e){e.stopPropagation();
      hideMsgActionMenu();
      if(typeof favMsgDirect==='function'){favMsgDirect(msgId,currentId);}
      else{toast('收藏功能未加载');}
    };
  }
  // ★ 语音转文字按钮：仅语音消息显示
  if(sttBtn){
    var _isVoiceMsg=msg&&(msg.isVoice===true||msg.voice);
    sttBtn.style.display=_isVoiceMsg?'flex':'none';
    sttBtn.onclick=function(e){e.stopPropagation();
      hideMsgActionMenu();
      if(typeof voiceToText==='function'){voiceToText(msgId);}
      else{toast('语音转文字不可用');}
    };
  }
  
  if(isSelf){
    editBtn.style.display='flex';
    retractBtn.style.display='flex';
    copyBtn.style.display='none';
  }else{
    editBtn.style.display='none';
    retractBtn.style.display='none';
    copyBtn.style.display='none';
  }
  
  replyBtn.onclick=function(e){e.stopPropagation();
    var msg=getMsgs().find(function(m){return m.id===msgId});
    if(!msg){hideMsgActionMenu();return;}
    replyingToMsg=msgId;
    var content='';
    if(msg.retracted){
      content='对方撤回了一条消息';
    }else if(msg.img){
      var actionImgUrl=msg.img;
      if(actionImgUrl&&!actionImgUrl.startsWith('data:image/')){
        var cachedActionImg=memoryCache['_img_'+actionImgUrl];
        if(cachedActionImg)actionImgUrl=cachedActionImg;
      }
      var isSticker=msg.isSticker===true;
      var imgClass=isSticker?'message-sticker':'message-img';
      content='<img src="'+actionImgUrl.replace(/"/g,'&quot;')+'" class="'+imgClass+'" style="max-width:60px;max-height:60px;border-radius:6px;object-fit:cover;">';
    }else if(msg.t){
      content=msg.t;
    }else{
      content='[消息]';
    }
    if(!msg.img&&content.length>30)content=content.substring(0,30)+'...';
    $('quote-preview-content').innerHTML=content;
    $('quote-preview').style.display='flex';
    hideMsgActionMenu();
  };
  
  editBtn.onclick=function(e){e.stopPropagation();
    var m=getMsgs();
    var msg=m.find(function(m){return m.id===msgId});
    if(msg&&msg.t&&msg.s===SELF){
      var newText=prompt('编辑消息内容：',msg.t);
      if(newText!==null&&newText!==msg.t){
        msg.t=newText;
        saveMsgs(currentId,m);
        renderMsgsFunc();
        toast('消息已编辑');
      }
    }else if(msg&&msg.t&&msg.s!==SELF){
      toast('只能编辑自己发送的消息');
    }else{
      toast('此消息无法编辑');
    }
    hideMsgActionMenu();
  };
  
  retractBtn.onclick=function(e){e.stopPropagation();
    var m=getMsgs();
    var msg=m.find(function(m){return m.id===msgId});
    if(msg&&msg.s===SELF){
      msg.retracted=true;
      msg.originalText=msg.t;
      msg.t='';
      saveMsgs(currentId,m);
      renderMsgsFunc();
      toast('消息已撤回');
      haptic('light');
    }else{
      toast('只能撤回自己发送的消息');
    }
    hideMsgActionMenu();
  };
  
  copyBtn.onclick=function(e){e.stopPropagation();
    var msg=getMsgs().find(function(m){return m.id===msgId});
    if(msg){
      if(msg.t){
        if(navigator.clipboard&&navigator.clipboard.writeText){
          navigator.clipboard.writeText(msg.t).then(function(){
            toast('已复制到剪贴板');
          }).catch(function(){
            fallbackCopy(msg.t);
          });
        }else{
          fallbackCopy(msg.t);
        }
      }else if(msg.img){
        var img=new Image();
        img.crossOrigin='anonymous';
        img.onload=function(){
          var canvas=document.createElement('canvas');
          canvas.width=img.width;
          canvas.height=img.height;
          var ctx=canvas.getContext('2d');
          ctx.drawImage(img,0,0);
          canvas.toBlob(function(blob){
            if(blob){
              navigator.clipboard.write([new ClipboardItem({'image/png':blob})]).then(function(){
                toast('图片已复制到剪贴板');
              }).catch(function(){
                toast('复制失败，请手动保存图片');
              });
            }
          },'image/png');
        };
        img.onerror=function(){
          toast('无法复制此图片');
        };
        img.src=msg.img;
      }else{
        toast('没有可复制的内容');
      }
    }
    hideMsgActionMenu();
  };
  
  var doDeleteAction=function(e){e.stopPropagation();
    customConfirm('确定删除这条消息吗？').then(function(ok){
      if(!ok){hideMsgActionMenu();return}
      var m=getMsgs();
      m=m.filter(function(m){return m.id!==msgId});
      saveMsgs(currentId,m);
      renderMsgsFunc();
      haptic('warn');
      hideMsgActionMenu();
    });
  };
  deleteBtn.onclick=doDeleteAction;
  deleteBtn.ontouchend=function(e){e.preventDefault();doDeleteAction(e)};
  
  var menuWidth=menu.offsetWidth||200;
  var menuHeight=menu.offsetHeight||40;
  var maxX=window.innerWidth-menuWidth-10;
  var maxY=window.innerHeight-menuHeight-10;
  var finalX=Math.max(10,Math.min(x,maxX));
  var finalY=Math.max(10,Math.min(y,maxY));
  menu.style.left=finalX+'px';
  menu.style.top=finalY+'px';
  menu.style.display='flex';
  
  setTimeout(function(){
    document.addEventListener('click',hideMsgActionMenuOnce);
    document.addEventListener('touchstart',hideMsgActionMenuOnce);
  }, 0);
}

function hideMsgActionMenu(){
  var el=$('msg-action-menu');if(el)el.style.display='none';
}

function hideMsgActionMenuOnce(e){
  var el=$('msg-action-menu');if(!el||!el.contains(e.target)){
    hideMsgActionMenu();
    document.removeEventListener('click',hideMsgActionMenuOnce);
    document.removeEventListener('touchstart',hideMsgActionMenuOnce);
  }
}
function showRetractedContent(el){
  var original=el.nextElementSibling;
  if(original&&original.classList.contains('retracted-original')){
    original.style.display=original.style.display==='none'?'block':'none';
  }
};

// ---------- 星言日历：今日心情与TA留言（每日生成，IndexedDB 存储）----------






















  
    
    
    




var STAR_MOODS=[
  // 温暖类
  {mood:'温柔',emoji:'🌷',category:'温暖'},{mood:'开心',emoji:'😊',category:'温暖'},
  {mood:'愉快',emoji:'☀️',category:'温暖'},{mood:'满足',emoji:'🍵',category:'温暖'},
  {mood:'放松',emoji:'🌿',category:'温暖'},{mood:'安心',emoji:'🤍',category:'温暖'},
  // 平静类
  {mood:'平静',emoji:'🌙',category:'平静'},{mood:'安静',emoji:'🌌',category:'平静'},
  {mood:'慵懒',emoji:'☁️',category:'平静'},{mood:'平稳',emoji:'⚖️',category:'平静'},
  {mood:'专注',emoji:'📖',category:'平静'},{mood:'思考中',emoji:'💭',category:'平静'},
  // 想念类
  {mood:'想念',emoji:'💫',category:'想念'},{mood:'等待',emoji:'🕊️',category:'想念'},
  {mood:'期待',emoji:'✨',category:'想念'},{mood:'牵挂',emoji:'🫧',category:'想念'},
  {mood:'想靠近',emoji:'🌠',category:'想念'},
  // 低落类
  {mood:'疲惫',emoji:'🌧️',category:'低落'},{mood:'有些累',emoji:'😮‍💨',category:'低落'},
  {mood:'孤单',emoji:'🌑',category:'低落'},{mood:'烦恼',emoji:'🌫️',category:'低落'},
  {mood:'迷茫',emoji:'❓',category:'低落'},
  // 活跃类
  {mood:'精神很好',emoji:'🌟',category:'活跃'},{mood:'兴致高涨',emoji:'🎉',category:'活跃'},
  {mood:'好奇',emoji:'👀',category:'活跃'},{mood:'充满动力',emoji:'🔥',category:'活跃'},
  {mood:'忙碌中',emoji:'💼',category:'活跃'}
];

// TA正在 - 预设状态列表
var STAR_ACTIVITIES=[
  '📖 看书','📚 整理书籍','📝 写东西','✍️ 记录想法','💻 工作中','📂 整理资料',
  '📱 回复消息','💬 和别人聊天','🎵 听音乐','🎧 戴着耳机发呆','🎶 哼着歌','☕ 喝茶',
  '🍵 泡茶中','🧋 喝点饮料','🍰 吃点心','🍜 吃饭中','🍎 吃水果','🥣 准备吃点东西',
  '🛋️ 休息中','😴 小睡一会','🌙 发呆','💭 想事情','🤔 思考中','✨ 放空自己',
  '🚶 散步','🌸 看风景','🌳 晒太阳','🌤️ 吹吹风','🌧️ 听雨声','🌌 看夜空',
  '📷 看照片','🎮 放松中','🎨 创作中','🖌️ 画画','📸 整理照片','🎬 看视频',
  '📺 看电影','📖 看漫画','🎲 找点事情做','🧹 整理东西','🪴 照顾植物','🕯️ 安静待着',
  '🪟 看着窗外','⌛ 等待中','💌 想着你','💫 回忆过去','🌠 想靠近你','🤍 陪着你',
  '⭐ 守着这里','🌙 等你来聊天','📍 在线中','💼 忙碌中','🌿 放松一下','🪄 准备开始今天的事情',
  '🎁 想给你一点惊喜','☁️ 什么都不做','🫧 静静待着','🏠 在这里等你'
];

// 心情类别对应的小装饰背景色
var MOOD_CATEGORY_STYLES={
  '温暖':{bg:'linear-gradient(135deg, #F6C7D3, #FFE9E2)', accent:'#F6C7D3', color:'#F6C7D3', glow:'#FFD7C7', paper:'#FFF5F3', cardBg:'linear-gradient(135deg, #F6C7D3 0%, #FFE9E2 50%, #FFF5F3 100%)', divider:'rgba(246,199,211,0.4)', lightBg:'rgba(246,199,211,0.12)'},
  '平静':{bg:'linear-gradient(135deg, #AFC6E9, #DCE9F8)', accent:'#AFC6E9', color:'#AFC6E9', glow:'#BFD8F4', paper:'#F5F8FC', cardBg:'linear-gradient(135deg, #AFC6E9 0%, #DCE9F8 50%, #F5F8FC 100%)', divider:'rgba(175,198,233,0.4)', lightBg:'rgba(175,198,233,0.12)'},
  '想念':{bg:'linear-gradient(135deg, #C8B6E8, #E6DAF8)', accent:'#C8B6E8', color:'#C8B6E8', glow:'#D7C8FF', paper:'#F8F5FC', cardBg:'linear-gradient(135deg, #C8B6E8 0%, #E6DAF8 50%, #F8F5FC 100%)', divider:'rgba(200,182,232,0.4)', lightBg:'rgba(200,182,232,0.12)'},
  '低落':{bg:'linear-gradient(135deg, #AAB7C8, #D6DEE8)', accent:'#AAB7C8', color:'#AAB7C8', glow:'#BCC7D6', paper:'#F5F7F9', cardBg:'linear-gradient(135deg, #AAB7C8 0%, #D6DEE8 50%, #F5F7F9 100%)', divider:'rgba(170,183,200,0.4)', lightBg:'rgba(170,183,200,0.12)'},
  '活跃':{bg:'linear-gradient(135deg, #F4C66A, #FFE7A8)', accent:'#F4C66A', color:'#F4C66A', glow:'#FFD45E', paper:'#FFFCF5', cardBg:'linear-gradient(135deg, #F4C66A 0%, #FFE7A8 50%, #FFFCF5 100%)', divider:'rgba(244,198,106,0.4)', lightBg:'rgba(244,198,106,0.12)'}
};
var MOOD_DESCRIPTIONS={
  '温柔':'今天很温柔。','开心':'今天心情很好。','愉快':'今天过得很轻松。',
  '满足':'今天觉得很满足。','放松':'今天慢慢放松着。','安心':'今天很安心。',
  '平静':'今天很平静。','安静':'今天想安静一点。','慵懒':'今天节奏慢了一些。',
  '平稳':'今天一切都很稳定。','专注':'今天专注于眼前的事情。','思考中':'今天一直在思考。',
  '想念':'今天有些想你。','等待':'今天静静等着与你相遇。','期待':'今天期待着一点惊喜。',
  '牵挂':'今天一直惦记着你。','想靠近':'今天想离你近一点。',
  '疲惫':'今天有一点累。','有些累':'今天想慢慢休息一下。','孤单':'今天有些安静。',
  '烦恼':'今天有些事情放不下。','迷茫':'今天还在寻找答案。',
  '精神很好':'今天状态很好。','兴致高涨':'今天充满热情。','好奇':'今天对很多事情都很好奇。',
  '充满动力':'今天想做很多事情。','忙碌中':'今天一直没有停下来。'
};
var GREETING_SHOWN_KEY='ml2_greeting_shown';
function getGreeting(){
  var h=new Date().getHours();
  if(h>=5&&h<12)return '☀️ 早安。';
  if(h>=12&&h<14)return '🍃 中午好。';
  if(h>=14&&h<18)return '🌤 下午好。';
  if(h>=18&&h<22)return '🌙 晚上好。';
  return '✨ 还没睡吗？';
}
function shouldShowGreeting(contactId){
  var todayStr=getTodayStr();
  var key=contactId+'_'+todayStr;
  var shown=ls(GREETING_SHOWN_KEY)||{};
  if(shown[key])return false;
  shown[key]=true;
  ls(GREETING_SHOWN_KEY,shown);
  return true;
}

var _starCalData={}; // {contactId_dateStr: {mood, emoji, category, message, date, contactId, timestamp}}
var _starCalShown={}; // {contactId_dateStr: true} 当天是否已弹出
var _starCalCalendarDate=new Date();
var _starCalContactId=null;

// 获取今日日期字符串
function getTodayStr(){
  var d=new Date();
  return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);
}

// 从 IndexedDB 加载星言日历数据
async function loadStarCalData(){
  try{
    var data=await lsGetWithDB('ml2_star_cal');
    if(data&&typeof data==='object'&&Object.keys(data).length>0){
      // 修复：合并而非覆盖，避免内存中已有但DB中尚未同步的新数据丢失
      if(_starCalData&&Object.keys(_starCalData).length>0){
        Object.keys(_starCalData).forEach(function(k){
          if(!data[k])data[k]=_starCalData[k];
        });
      }
      _starCalData=data;
    }else{
      var cached=ls('ml2_star_cal');
      if(cached&&typeof cached==='object'&&Object.keys(cached).length>0){
        if(_starCalData&&Object.keys(_starCalData).length>0){
          Object.keys(_starCalData).forEach(function(k){
            if(!cached[k])cached[k]=_starCalData[k];
          });
        }
        _starCalData=cached;
      }
    }
    // 迁移旧数据：将不带前导零的日期 key（如 2026-8-3）转换为带前导零的格式（如 2026-08-03）
    var migrated=false;
    Object.keys(_starCalData).forEach(function(k){
      var m=k.match(/^([^_]+)_(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if(m){
        var newKey=m[1]+'_'+m[2]+'-'+('0'+m[3]).slice(-2)+'-'+('0'+m[4]).slice(-2);
        if(newKey!==k&&!_starCalData[newKey]){
          _starCalData[newKey]=_starCalData[k];
          delete _starCalData[k];
          migrated=true;
        }
      }
    });
    if(migrated)saveStarCalData();
  }catch(e){
    var fb=ls('ml2_star_cal');
    if(fb&&typeof fb==='object'&&Object.keys(fb).length>0)_starCalData=fb;
  }
}

// 保存星言日历数据到 IndexedDB
function saveStarCalData(){
  ls('ml2_star_cal',_starCalData);
  if(window.localforage){
    window.localforage.setItem('ml2_star_cal',_starCalData).catch(function(){});
  }
  // 修复：同步写入 localStorage 作为备份，确保数据不丢失
  try{
    var serialized=JSON.stringify(_starCalData);
    localStorage.setItem('ml2_lf_ml2_star_cal',serialized);
  }catch(e){}
}

// 获取联系人可用的字卡（公用字卡库 + 联系人专享主字卡）
function getContactWordCards(contactId){
  if(!contactId||!globalCards)return[];
  return globalCards.filter(function(card){
    if(!card||!card.content)return false;
    if(!card.content.trim())return false;
    if(card.category==='stickers'||card.category==='voices'||card.category==='touch')return false;
    // 公用字卡
    if(card.type==='public')return true;
    // 联系人专享字卡
    if(card.type==='private'){
      if(card.contactId===contactId)return true;
      var pc=cardPrivateContacts&&cardPrivateContacts.find(function(p){return p.id===card.contactId&&p.bindContactId===contactId});
      if(pc)return true;
    }
    if(!card.type)return true;
    return false;
  });
}

// 从字卡池中随机选取组成留言（最多10个字卡，中间空一格）
function generateDailyMessage(contactId){
  var cards=getContactWordCards(contactId);
  // 如果开启了星言日历留言的默认通用字卡，也加入字卡池
  if(defaultCommonEnabled&&defaultCommonAllContacts&&defaultCommonUseCalendar){
    var dcCards=(_defaultCommonCards||[]).filter(function(c){
      if(!c||!c.content||!c.content.trim())return false;
      if(c.category==='stickers'||c.category==='voices'||c.category==='touch')return false;
      return true;
    });
    cards=cards.concat(dcCards);
  }
  if(cards.length===0)return '';
  // 随机选取 1~10 个字卡（或字卡总数，取较小值）
  var maxCount=Math.min(10,cards.length);
  var minCount=Math.min(3,maxCount);
  var count=minCount+Math.floor(Math.random()*(maxCount-minCount+1));
  // 随机抽取不重复的字卡
  var pool=cards.slice();
  var selected=[];
  for(var i=0;i<count&&pool.length>0;i++){
    var idx=Math.floor(Math.random()*pool.length);
    selected.push(pool[idx].content.trim());
    pool.splice(idx,1);
  }
  // 加上随机 emoji 和颜文字
  var emojis=['✨','🌸','🌙','💫','🤍','☁️','🌿','🌷','🍵','🕊️'];
  var kaomojis=['(´,,•ω•,,)','(⑅˃◡˂⑅)','(◍•ᴗ•◍)','(˘ω˘)','(◡‿◡)','( ´ ▽ ` )','(◕ᴗ◕✿)','(﹡ˆᴗˆ﹡)'];
  var emoji=emojis[Math.floor(Math.random()*emojis.length)];
  var kaomoji=kaomojis[Math.floor(Math.random()*kaomojis.length)];
  return selected.join(' ')+' '+emoji+kaomoji;
}

// 生成或获取今日心情与留言
function getOrGenerateDailyMood(contactId){
  if(!contactId)return null;
  var todayStr=getTodayStr();
  var key=contactId+'_'+todayStr;
  if(_starCalData[key]){
    var existing=_starCalData[key];
    // 向后兼容：确保旧数据有 activity 字段
    if(!existing.activity){
      existing.activity=STAR_ACTIVITIES[Math.floor(Math.random()*STAR_ACTIVITIES.length)];
    }
    if(!existing.category){
      var moodItem2=STAR_MOODS.find(function(m){return m.mood===existing.mood});
      if(moodItem2)existing.category=moodItem2.category;
    }
    if(!existing.message){
      existing.message=generateDailyMessage(contactId)||'今天也想对你说点什么...';
    }
    // 修复：已有数据被补充字段后也要保存
    saveStarCalData();
    return existing;
  }
  // 生成新的一天的心情和留言
  var moodItem=STAR_MOODS[Math.floor(Math.random()*STAR_MOODS.length)];
  var activity=STAR_ACTIVITIES[Math.floor(Math.random()*STAR_ACTIVITIES.length)];
  var message=generateDailyMessage(contactId);
  var entry={
    mood:moodItem.mood,
    emoji:moodItem.emoji,
    category:moodItem.category,
    activity:activity,
    message:message||'今天也想对你说点什么...',
    date:todayStr,
    contactId:contactId,
    timestamp:Date.now()
  };
  _starCalData[key]=entry;
  saveStarCalData();
  return entry;
}

// 检查并显示每日心情弹窗（首次进入联系人面板时）
function checkAndShowDailyMood(contactId){
  if(!contactId)return;
  var todayStr=getTodayStr();
  var shownKey=contactId+'_'+todayStr;
  // 每次重新打开网页后，首次点击联系人都弹窗（仅用内存标记，不持久化到 localStorage）
  if(_starCalShown[shownKey])return;
  // 修复：始终从 localStorage 同步加载最新数据，避免内存缓存与存储不同步
  var cached=ls('ml2_star_cal');
  if(cached&&typeof cached==='object'&&Object.keys(cached).length>0){
    // 合并：保留内存中已有但 localStorage 中可能没有的新数据
    if(_starCalData&&Object.keys(_starCalData).length>0){
      Object.keys(_starCalData).forEach(function(k){
        if(!cached[k])cached[k]=_starCalData[k];
      });
    }
    _starCalData=cached;
  }
  var entry=getOrGenerateDailyMood(contactId);
  if(!entry)return;
  _starCalShown[shownKey]=true;
  showDailyMoodPopup(entry);
  updateDailyMoodBar(contactId);
  // 后台异步加载完整数据（不影响弹窗），合并而非覆盖
  loadStarCalData().then(function(){updateDailyMoodBar(contactId);}).catch(function(){});
}

// 显示每日心情弹窗
function showDailyMoodPopup(entry){
  if(!entry)return;
  var style=MOOD_CATEGORY_STYLES[entry.category]||MOOD_CATEGORY_STYLES['平静'];
  var todayStr=getTodayStr();
  var desc=MOOD_DESCRIPTIONS[entry.mood]||'';
  var catIcon={'温暖':'🌷','平静':'🌙','想念':'💫','低落':'🌧️','活跃':'🌟'};
  var icon=catIcon[entry.category]||'🌙';
  var greeting=getGreeting();
  var showGreeting=shouldShowGreeting(window.currentCid||entry.contactId);
  
  var overlay=document.createElement('div');
  overlay.className='overlay';
  overlay.style.cssText='z-index:10001 !important;display:flex !important;align-items:center;justify-content:center;padding:20px 0;overflow-y:auto;';
  
  overlay.innerHTML=
    '<div id="daily-mood-card-wrap" style="width:330px;max-width:calc(100vw - 40px);max-height:calc(100vh - 40px);border-radius:24px;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(90,74,58,0.18);position:relative;overflow:hidden;background:'+style.cardBg+';border:1px solid rgba(255,255,255,0.5);">' +
    '<div style="position:absolute;top:16px;left:16px;font-size:36px;opacity:0.7;z-index:0;animation:starCalFadeIn 0.5s ease;">'+icon+'</div>' +
    '<div style="position:absolute;bottom:-40px;right:-40px;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle,'+style.glow+' 0%,transparent 70%);opacity:0.5;z-index:0;animation:starCalGlowIn 0.8s ease;"></div>' +
    '<button id="daily-mood-close" style="position:absolute;top:12px;right:12px;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,0.92);border:none;color:#5a4a3a;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:10;flex-shrink:0;">✕</button>' +
    '<div id="daily-mood-scroll" style="padding:48px 22px 16px;text-align:center;flex:1 1 auto;min-height:0;overflow-y:auto;display:flex;flex-direction:column;position:relative;z-index:1;">' +
      '<div style="font-size:14px;font-weight:700;color:#5a4a3a;margin-bottom:2px;flex-shrink:0;letter-spacing:1px;">✨ 今日</div>' +
      (showGreeting?('<div style="font-size:19px;font-weight:600;color:#5a4a3a;margin-bottom:12px;flex-shrink:0;animation:starCalFadeIn 0.4s ease;">'+greeting+'</div>'):'') +
      '<div style="width:40px;height:2px;background:'+style.accent+';border-radius:2px;margin:0 auto 16px;flex-shrink:0;opacity:0.5;"></div>' +
      '<div style="margin-bottom:16px;flex-shrink:0;">' +
        '<div style="font-size:11px;color:#8a7a6a;margin-bottom:6px;letter-spacing:1px;text-transform:uppercase;">🌙 TA的心情</div>' +
        '<div style="font-size:42px;margin-bottom:6px;line-height:1;animation:starCalFadeIn 0.6s ease;">'+entry.emoji+'</div>' +
        '<div style="font-size:18px;font-weight:700;color:#5a4a3a;">'+escapeDreamHtml(entry.mood)+'</div>' +
        (desc?('<div style="font-size:12px;color:#8a7a6a;margin-top:3px;font-style:italic;">'+desc+'</div>'):'') +
      '</div>' +
      '<div style="padding:12px 16px;background:rgba(255,255,255,0.85);border-radius:14px;margin-bottom:14px;flex-shrink:0;">' +
        '<div style="font-size:11px;color:#8a7a6a;margin-bottom:3px;letter-spacing:1px;">📍 TA正在</div>' +
        '<div style="font-size:15px;color:#5a4a3a;font-weight:500;">'+escapeDreamHtml(entry.activity||'')+'</div>' +
      '</div>' +
      '<div style="padding:18px 16px;background:'+style.paper+';border-radius:12px;margin-bottom:12px;flex:0 1 auto;min-height:70px;display:flex;flex-direction:column;box-shadow:0 2px 12px rgba(0,0,0,0.06);position:relative;border:1px solid rgba(0,0,0,0.04);overflow-wrap:break-word;word-wrap:break-word;">' +
        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;flex-shrink:0;">' +
          '<span style="font-size:14px;">✉️</span>' +
          '<span style="font-size:11px;color:#8a7a6a;letter-spacing:1px;">TA的留言</span>' +
        '</div>' +
        '<div style="font-size:14px;color:#4a3a2a;line-height:1.9;white-space:pre-wrap;word-break:break-word;overflow-wrap:break-word;text-align:left;font-family:serif;">「'+escapeDreamHtml(entry.message)+'」</div>' +
      '</div>' +
    '</div>' +
    '<button id="daily-mood-submit" style="padding:16px 20px;background:'+style.accent+';color:#fff;border:none;border-radius:0 0 24px 24px;font-size:16px;font-weight:600;cursor:pointer;width:100%;flex-shrink:0;box-sizing:border-box;letter-spacing:1px;position:relative;z-index:1;">收下 ✨</button>' +
  '</div>';
  
  var styleEl=document.createElement('style');
  styleEl.textContent='@keyframes starCalFadeIn{from{opacity:0}to{opacity:1}}@keyframes starCalGlowIn{from{opacity:0;transform:scale(0.8)}to{opacity:0.5;transform:scale(1)}}';
  overlay.appendChild(styleEl);
  
  overlay.addEventListener('click',function(e){if(e.target===overlay)overlay.remove()});
  var closeBtn=overlay.querySelector('#daily-mood-close');
  if(closeBtn)closeBtn.addEventListener('click',function(e){e.stopPropagation();overlay.remove()});
  var submitBtn=overlay.querySelector('#daily-mood-submit');
  if(submitBtn)submitBtn.addEventListener('click',function(e){e.stopPropagation();overlay.remove()});
  document.body.appendChild(overlay);
}

// 从状态栏点击查看今日心情卡片
function showDailyMoodCard(){
  if(!window.currentCid)return;
  var todayStr=getTodayStr();
  var key=window.currentCid+'_'+todayStr;
  var entry=_starCalData[key];
  if(entry){
    showDailyMoodPopup(entry);
  }else{
    entry=getOrGenerateDailyMood(window.currentCid);
    if(entry)showDailyMoodPopup(entry);
    updateDailyMoodBar(window.currentCid);
  }
}

// 更新联系人页面的今日心情状态栏
function updateDailyMoodBar(contactId){
  var bar=$('daily-mood-bar');
  if(!bar)return;
  if(!contactId){
    bar.style.display='none';
    return;
  }
  var todayStr=getTodayStr();
  var key=contactId+'_'+todayStr;
  var entry=_starCalData[key];
  if(!entry){
    bar.style.display='none';
    return;
  }
  bar.style.display='block';
  var emojiEl=$('daily-mood-emoji');
  var moodEl=$('daily-mood-text');
  var msgEl=$('daily-msg-text');
  if(emojiEl)emojiEl.textContent=entry.emoji;
  if(moodEl)moodEl.textContent=entry.mood;
  if(msgEl)msgEl.textContent='「'+entry.message+'」';
  // 根据心情类别微调背景
  var style=MOOD_CATEGORY_STYLES[entry.category]||MOOD_CATEGORY_STYLES['平静'];
  bar.style.background=style.bg;
}

// ---------- 星言日历日历视图 ----------
function showStarCal(contactId){
  _starCalContactId=contactId||(cid||null)||(contacts.length>0?contacts[0].id:null);
  _starCalCalendarDate=new Date();
  showPg('pg-star-cal');
  // 修复：先同步从 localStorage 加载数据，确保立即显示
  var cached=ls('ml2_star_cal');
  if(cached&&typeof cached==='object'&&Object.keys(cached).length>0){
    if(_starCalData&&Object.keys(_starCalData).length>0){
      Object.keys(_starCalData).forEach(function(k){
        if(!cached[k])cached[k]=_starCalData[k];
      });
    }
    _starCalData=cached;
  }
  renderStarCalContactSelect();
  // 先用内存数据立即渲染日历
  renderStarCalCalendar();
  showStarCalDetail(getTodayStr());
  // 后台异步从 IndexedDB 加载完整数据，加载后重新渲染
  loadStarCalData().then(function(){
    renderStarCalContactSelect();
    renderStarCalCalendar();
    showStarCalDetail(getTodayStr());
  }).catch(function(){});
  var prevBtn=$('star-cal-prev-month');
  var nextBtn=$('star-cal-next-month');
  if(prevBtn)prevBtn.onclick=function(){
    _starCalCalendarDate.setMonth(_starCalCalendarDate.getMonth()-1);
    renderStarCalCalendar();
  };
  if(nextBtn)nextBtn.onclick=function(){
    _starCalCalendarDate.setMonth(_starCalCalendarDate.getMonth()+1);
    renderStarCalCalendar();
  };
}

function renderStarCalContactSelect(){
  var wrap=$('star-cal-contact-select');
  if(!wrap)return;
  wrap.innerHTML=contacts.map(function(c){
    var active=c.id===_starCalContactId;
    return '<button onclick="selectStarCalContact(\''+c.id+'\')" style="padding:6px 14px;border:1px solid '+(active?'#5a4a3a':'#e8e0d5')+';border-radius:16px;background:'+(active?'#5a4a3a':'#fff')+';color:'+(active?'#fffcf9':'#5a4a3a')+';font-size:12px;cursor:pointer;white-space:nowrap;flex-shrink:0;">'+escapeDreamHtml(c.name)+'</button>';
  }).join('');
}

function selectStarCalContact(contactId){
  _starCalContactId=contactId;
  renderStarCalContactSelect();
  renderStarCalCalendar();
  showStarCalDetail(getTodayStr());
}

async function renderStarCalCalendar(){
  await loadStarCalData();
  var calendar=$('star-cal-calendar');
  var monthLabel=$('star-cal-month-label');
  if(!calendar)return;
  var year=_starCalCalendarDate.getFullYear();
  var month=_starCalCalendarDate.getMonth();
  if(monthLabel)monthLabel.textContent=year+'年'+(month+1)+'月';

  // 星期标题
  var weekdays=['日','一','二','三','四','五','六'];
  var html=weekdays.map(function(w){
    return '<div style="text-align:center;font-size:11px;color:#8a7a6a;padding:4px 0;font-weight:500;">'+w+'</div>';
  }).join('');

  // 获取当月天数和第一天星期
  var firstDay=new Date(year,month,1).getDay();
  var daysInMonth=new Date(year,month+1,0).getDate();
  var todayStr=getTodayStr();

  // 空白填充
  for(var i=0;i<firstDay;i++){
    html+='<div></div>';
  }
  // 日期格子
  for(var d=1;d<=daysInMonth;d++){
    var dateStr=year+'-'+('0'+(month+1)).slice(-2)+'-'+('0'+d).slice(-2);
    var key=_starCalContactId+'_'+dateStr;
    var entry=_starCalData[key];
    var isToday=dateStr===todayStr;
    var style=entry?MOOD_CATEGORY_STYLES[entry.category]||MOOD_CATEGORY_STYLES['平静']:null;
    var bg=style?style.color+'30':'#fff';
    var border=isToday?'2px solid #5a4a3a':'1px solid #f0ebe3';
    var emojiHtml=entry?'<div style="font-size:18px;">'+entry.emoji+'</div>':'';
    var moodHtml=entry?'<div style="font-size:9px;color:#5a4a3a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+escapeDreamHtml(entry.mood)+'</div>':'';
    html+='<div onclick="showStarCalDetail(\''+dateStr+'\')" style="min-height:52px;padding:4px 2px;background:'+bg+';border:'+border+';border-radius:10px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;transition:all 0.2s;" onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'\'">'
      +'<div style="font-size:11px;color:'+(isToday?'#5a4a3a':'#8a7a6a')+';font-weight:'+(isToday?'600':'400')+';">'+d+'</div>'
      +emojiHtml+moodHtml
      +'</div>';
  }
  calendar.innerHTML=html;
}

function updateContactProfileStarCard(contactId){
  if(!contactId)return;
  var todayStr=getTodayStr();
  var key=contactId+'_'+todayStr;
  var entry=_starCalData[key];
  if(!entry){
    entry=getOrGenerateDailyMood(contactId);
  }
  var moodEl=$('contact-profile-star-mood');
  var emojiEl=$('contact-profile-star-mood-emoji');
  var activityEl=$('contact-profile-star-activity');
  var msgEl=$('contact-profile-star-msg');
  var dateEl=$('contact-profile-star-date');
  if(!entry){
    if(moodEl)moodEl.textContent='';
    if(emojiEl)emojiEl.textContent='📝';
    if(activityEl)activityEl.textContent='';
    if(msgEl)msgEl.textContent='暂无今日记录';
    if(dateEl)dateEl.textContent='';
    return;
  }
  if(moodEl)moodEl.textContent=entry.mood||'';
  if(emojiEl)emojiEl.textContent=entry.emoji||'📝';
  if(activityEl)activityEl.textContent=entry.activity||'';
  if(msgEl)msgEl.textContent='「'+(entry.message||'暂无留言')+'」';
  if(dateEl)dateEl.textContent='✨ '+todayStr;
}

function showStarCalDetail(dateStr){
  var detail=$('star-cal-detail');
  if(!detail)return;
  var key=_starCalContactId+'_'+dateStr;
  var entry=_starCalData[key];
  if(!entry){
    detail.style.display='block';
    detail.style.background='#fff';
    detail.innerHTML='<div style="text-align:center;padding:20px;color:#8a7a6a;"><div style="font-size:32px;margin-bottom:8px;">📝</div><div style="font-size:14px;color:#5a4a3a;font-weight:500;">'+dateStr+'</div><div style="font-size:12px;margin-top:6px;">这一天没有记录</div></div>';
    return;
  }
  var style=MOOD_CATEGORY_STYLES[entry.category]||MOOD_CATEGORY_STYLES['平静'];
  var desc=MOOD_DESCRIPTIONS[entry.mood]||'';
  detail.style.display='block';
  detail.style.background=style.cardBg;
  detail.style.borderRadius='20px';
  detail.style.border='1px solid rgba(255,255,255,0.5)';
  detail.innerHTML='<div style="font-size:12px;color:#8a7a6a;margin-bottom:4px;">✨ '+dateStr+'</div>'
    +'<div style="width:36px;height:3px;background:'+style.accent+';border-radius:2px;margin-bottom:16px;opacity:0.5;"></div>'
    +'<div style="margin-bottom:14px;">'
    +'<div style="font-size:12px;color:#8a7a6a;margin-bottom:6px;">🌙 TA的心情</div>'
    +'<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:28px;">'+entry.emoji+'</span><span style="font-size:18px;font-weight:600;color:#5a4a3a;">'+escapeDreamHtml(entry.mood)+'</span></div>'
    +(desc?('<div style="font-size:12px;color:#8a7a6a;margin-top:2px;margin-left:36px;">'+desc+'</div>'):'')
    +'</div>'
    +'<div style="padding:10px 14px;background:rgba(255,255,255,0.85);border-radius:12px;margin-bottom:14px;">'
    +'<div style="font-size:12px;color:#8a7a6a;margin-bottom:4px;">📍 TA正在</div>'
    +'<div style="font-size:15px;color:#5a4a3a;font-weight:500;">'+escapeDreamHtml(entry.activity||'')+'</div>'
    +'</div>'
    +'<div style="padding:14px;background:'+style.paper+';border-radius:12px;box-shadow:0 1px 8px rgba(0,0,0,0.04);border:1px solid rgba(0,0,0,0.03);">'
    +'<div style="display:flex;align-items:center;gap:5px;margin-bottom:8px;"><span style="font-size:13px;">✉️</span><span style="font-size:11px;color:#8a7a6a;">TA的留言</span></div>'
    +'<div style="font-size:14px;color:#4a3a2a;line-height:1.8;white-space:pre-wrap;word-break:break-word;font-family:serif;">「'+escapeDreamHtml(entry.message)+'」</div>'
    +'</div>';
}

// ---------- Diary（日记本 - IndexedDB 本地存储）----------
var dreamEntries=[];
var selectedDiaryMood='';
var selectedDiaryWeather='';
var editingDreamId=null;
var _diaryMoods=[
  {emoji:'😊',label:'正向'},{emoji:'😀',label:'开心'},{emoji:'🥰',label:'幸福'},{emoji:'😄',label:'兴奋'},
  {emoji:'🤩',label:'激动'},{emoji:'🥳',label:'开心庆祝'},{emoji:'😌',label:'放松'},{emoji:'🫶',label:'感动'},
  {emoji:'🤍',label:'安心'},{emoji:'😐',label:'日常'},{emoji:'🙂',label:'平静'},{emoji:'🤔',label:'思考'},
  {emoji:'😶',label:'发呆'},{emoji:'😴',label:'困倦'},{emoji:'🥱',label:'犯困'},{emoji:'😮',label:'好奇'},
  {emoji:'💭',label:'情感'},{emoji:'🥹',label:'想念'},{emoji:'🥺',label:'委屈'},{emoji:'😊',label:'害羞'},
  {emoji:'😍',label:'心动'},{emoji:'🤭',label:'偷笑'},{emoji:'😞',label:'低落'},{emoji:'😔',label:'失落'},
  {emoji:'😞',label:'难过'},{emoji:'😢',label:'想哭'},{emoji:'😭',label:'大哭'},{emoji:'😮‍💨',label:'疲惫'},
  {emoji:'😵‍💫',label:'迷茫'},{emoji:'😖',label:'烦恼'},{emoji:'😠',label:'情绪波动'},{emoji:'😤',label:'不服'},
  {emoji:'😠',label:'生气'},{emoji:'😡',label:'愤怒'},{emoji:'🙄',label:'无语'},{emoji:'🤯',label:'崩溃'},
  {emoji:'😰',label:'焦虑'}
];
var _diaryWeathers=['☀️','⛅','☁️','🌧️','⛈️','❄️','🌙','🌈','🌫️','🌬️'];

// 初始化心情/天气选择器按钮
function initDiarySelectors(){
  var moodWrap=$('diary-mood-selector');
  var weatherWrap=$('diary-weather-selector');
  if(moodWrap&&!moodWrap.hasChildNodes()){
    moodWrap.innerHTML=_diaryMoods.map(function(m){
      var emoji=typeof m==='object'?m.emoji:m;
      var label=typeof m==='object'?m.label:'';
      return '<button class="diary-mood-btn" data-mood="'+emoji+'" title="'+label+'" style="min-width:38px;height:38px;padding:0 6px;border:1px solid #e8e0d5;border-radius:12px;background:#fff;font-size:16px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;transition:all 0.2s;flex-shrink:0;"><span>'+emoji+'</span><span style="font-size:9px;color:#8a7a6a;">'+label+'</span></button>';
    }).join('');
  }
  if(weatherWrap&&!weatherWrap.hasChildNodes()){
    weatherWrap.innerHTML=_diaryWeathers.map(function(w){
      return '<button class="diary-weather-btn" data-weather="'+w+'" style="width:38px;height:38px;border:1px solid #e8e0d5;border-radius:12px;background:#fff;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;">'+w+'</button>';
    }).join('');
  }
}

// 从 IndexedDB 优先加载日记数据（防止数据丢失）
async function loadDreamEntries(){
  try{
    var data=await lsGetWithDB('ml2_dream');
    if(data&&Array.isArray(data)){
      dreamEntries=data;
    }else{
      var cached=ls('ml2_dream');
      if(cached&&Array.isArray(cached))dreamEntries=cached;
    }
  }catch(e){
    var fallback=ls('ml2_dream');
    if(fallback&&Array.isArray(fallback))dreamEntries=fallback;
  }
}

function saveDreamEntries(){
  ls('ml2_dream',dreamEntries);
  // 同时写入 IndexedDB 确保持久化
  if(window.localforage){
    window.localforage.setItem('ml2_dream',dreamEntries).catch(function(){});
  }
}

function showDreamInput(){
  initDiarySelectors();
  editingDreamId=null;
  $('dream-title').value='';
  $('dream-content').value='';
  $('dream-date').value=new Date().toISOString().split('T')[0];
  $('dream-modal-title').textContent='写日记';
  $('dream-save-btn').textContent='保存';
  selectedDiaryMood='';
  selectedDiaryWeather='';
  resetDiarySelectorStyles();
  showOv('ov-dream-input');
}

function resetDiarySelectorStyles(){
  document.querySelectorAll('.diary-mood-btn').forEach(function(b){b.style.border='1px solid #e8e0d5';b.style.background='#fff';b.style.transform='scale(1)'});
  document.querySelectorAll('.diary-weather-btn').forEach(function(b){b.style.border='1px solid #e8e0d5';b.style.background='#fff';b.style.transform='scale(1)'});
}

function setDiaryMood(mood){
  selectedDiaryMood=mood;
  document.querySelectorAll('.diary-mood-btn').forEach(function(b){
    if(b.dataset.mood===mood){b.style.border='2px solid #5a4a3a';b.style.background='#f7f3ee';b.style.transform='scale(1.1)'}
    else{b.style.border='1px solid #e8e0d5';b.style.background='#fff';b.style.transform='scale(1)'}
  });
}

function setDiaryWeather(weather){
  selectedDiaryWeather=weather;
  document.querySelectorAll('.diary-weather-btn').forEach(function(b){
    if(b.dataset.weather===weather){b.style.border='2px solid #5a4a3a';b.style.background='#f7f3ee';b.style.transform='scale(1.1)'}
    else{b.style.border='1px solid #e8e0d5';b.style.background='#fff';b.style.transform='scale(1)'}
  });
}

function saveDreamEntry(){
  var title=$('dream-title').value.trim();
  var content=$('dream-content').value.trim();
  var dreamDate=$('dream-date').value;

  // 表单校验：高亮错误输入框
  var hasError=false;
  var contentEl=$('dream-content');
  var dateEl=$('dream-date');
  if(!content){contentEl.style.borderColor='#d4625a';hasError=true;}
  else{contentEl.style.borderColor='#e8e0d5'}
  if(!dreamDate){dateEl.style.borderColor='#d4625a';hasError=true;}
  else{dateEl.style.borderColor='#e8e0d5'}
  if(hasError){toast('请填写日期和日记内容');return;}

  var dateStr=formatDreamDate(dreamDate);
  var entryData={
    title:title||'无标题',
    content:content,
    date:dateStr,
    timestamp:new Date(dreamDate).getTime(),
    mood:selectedDiaryMood||'',
    weather:selectedDiaryWeather||'',
    updatedAt:Date.now()
  };

  if(editingDreamId){
    // 编辑模式
    var idx=dreamEntries.findIndex(function(e){return e.id===editingDreamId});
    if(idx>=0){
      entryData.id=editingDreamId;
      entryData.createdAt=dreamEntries[idx].createdAt||dreamEntries[idx].timestamp;
      dreamEntries[idx]=entryData;
    }
    toast('日记已更新');
  }else{
    // 新建模式
    entryData.id=Date.now();
    entryData.createdAt=Date.now();
    dreamEntries.push(entryData);
    toast('日记已保存');
  }
  saveDreamEntries();
  hideOv('ov-dream-input');
  renderDreamList();
}

function editDreamEntry(id){
  var entry=dreamEntries.find(function(e){return e.id===id});
  if(!entry)return;
  initDiarySelectors();
  editingDreamId=id;
  $('dream-title').value=entry.title||'';
  $('dream-content').value=entry.content||'';
  // 从 dateStr 反向解析为 input[type=date] 格式
  var d=new Date(entry.timestamp);
  $('dream-date').value=d.toISOString().split('T')[0];
  $('dream-modal-title').textContent='编辑日记';
  $('dream-save-btn').textContent='更新';
  selectedDiaryMood=entry.mood||'';
  selectedDiaryWeather=entry.weather||'';
  resetDiarySelectorStyles();
  if(selectedDiaryMood)setDiaryMood(selectedDiaryMood);
  if(selectedDiaryWeather)setDiaryWeather(selectedDiaryWeather);
  showOv('ov-dream-input');
}

function deleteDream(id){
  if(!confirm('确定删除此篇日记？此操作不可撤销。'))return;
  dreamEntries=dreamEntries.filter(function(e){return e.id!==id});
  saveDreamEntries();
  renderDreamList();
  toast('日记已删除');
}

function clearDreamFilter(){
  var filterEl=$('dream-filter-date');
  var searchEl=$('dream-search');
  if(filterEl)filterEl.value='';
  if(searchEl)searchEl.value='';
  renderDreamList();
}

function formatDreamDate(dateStr){
  var d=new Date(dateStr);
  var y=d.getFullYear();
  var m=('0'+(d.getMonth()+1)).slice(-2);
  var day=('0'+d.getDate()).slice(-2);
  return y+'-'+m+'-'+day;
}

function escapeDreamHtml(text){
  if(!text)return '';
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function renderDreamList(){
  await loadDreamEntries();
  var container=$('dream-list-container');
  if(!container)return;

  // 获取筛选与搜索条件
  var filterDate=$('dream-filter-date')?$('dream-filter-date').value:'';
  var searchKw=$('dream-search')?$('dream-search').value.trim().toLowerCase():'';

  // 统计信息
  var statsEl=$('dream-stats');
  var totalCount=dreamEntries.length;

  if(totalCount===0){
    if(statsEl)statsEl.textContent='共 0 篇日记';
    container.innerHTML='<div style="text-align:center;padding:60px 20px;color:#8a7a6a;"><div style="font-size:48px;margin-bottom:16px;">📭</div><div style="font-size:15px;font-weight:500;color:#5a4a3a;margin-bottom:6px;">还没有写过日记</div><div style="font-size:13px;color:#8a7a6a;">点击右上角"+"开始记录美好的一天</div></div>';
    return;
  }

  // 筛选
  var filtered=dreamEntries.slice();
  if(filterDate){
    var filterTs=new Date(filterDate).getTime();
    filtered=filtered.filter(function(e){
      var eTs=e.timestamp||0;
      // 按日期匹配（年月日）
      var eDate=new Date(eTs);
      var fDate=new Date(filterTs);
      return eDate.getFullYear()===fDate.getFullYear()&&eDate.getMonth()===fDate.getMonth()&&eDate.getDate()===fDate.getDate();
    });
  }
  if(searchKw){
    filtered=filtered.filter(function(e){
      return (e.title&&e.title.toLowerCase().indexOf(searchKw)>=0)||(e.content&&e.content.toLowerCase().indexOf(searchKw)>=0);
    });
  }

  // 更新统计栏
  if(statsEl){
    if(filterDate||searchKw){
      statsEl.textContent='筛选结果：'+filtered.length+' 篇（共 '+totalCount+' 篇）';
    }else{
      statsEl.textContent='共 '+totalCount+' 篇日记';
    }
  }

  if(filtered.length===0){
    container.innerHTML='<div style="text-align:center;padding:40px 20px;color:#8a7a6a;"><div style="font-size:36px;margin-bottom:12px;">🔍</div><div style="font-size:14px;">没有找到匹配的日记</div><button onclick="clearDreamFilter()" style="margin-top:12px;padding:8px 16px;border:1px solid #e8e0d5;border-radius:12px;background:#fff;color:#5a4a3a;font-size:13px;cursor:pointer;">清除筛选</button></div>';
    return;
  }

  filtered.sort(function(a,b){return (b.timestamp||0)-(a.timestamp||0)});
  container.innerHTML=filtered.map(function(entry){
    var moodHtml=entry.mood?'<span style="font-size:18px;margin-right:6px;">'+entry.mood+'</span>':'';
    var weatherHtml=entry.weather?'<span style="font-size:14px;">'+entry.weather+'</span>':'';
    var titleHtml=escapeDreamHtml(entry.title||'无标题');
    var contentHtml=escapeDreamHtml(entry.content||'');
    var dateDisplay=entry.date||formatDreamDate(new Date(entry.timestamp||Date.now()).toISOString());
    return '<div style="padding:18px;background:#fff;border-radius:20px;margin-bottom:14px;border:1px solid #f0ebe3;transition:all 0.25s ease;cursor:pointer;" onclick="viewDreamEntry('+entry.id+')" onmouseover="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 6px 20px rgba(90,74,58,0.08)\'" onmouseout="this.style.transform=\'\';this.style.boxShadow=\'\'">'
      +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">'
      +'<div style="font-size:16px;font-weight:600;color:#5a4a3a;display:flex;align-items:center;flex:1;min-width:0;">'+moodHtml+'<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+titleHtml+'</span></div>'
      +'<div style="font-size:12px;color:#8a7a6a;display:flex;align-items:center;gap:5px;flex-shrink:0;margin-left:8px;">'+weatherHtml+'<span>'+dateDisplay+'</span></div>'
      +'</div>'
      +'<div style="font-size:14px;color:#4a3a2a;line-height:1.7;white-space:pre-wrap;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:4;line-clamp:4;-webkit-box-orient:vertical;">'+contentHtml+'</div>'
      +'<div style="margin-top:14px;display:flex;gap:8px;justify-content:flex-end;">'
      +'<button onclick="event.stopPropagation();editDreamEntry('+entry.id+')" style="padding:6px 14px;border:1px solid #e8e0d5;border-radius:12px;background:#fff;color:#5a4a3a;font-size:12px;cursor:pointer;min-height:32px;">✏️ 编辑</button>'
      +'<button onclick="event.stopPropagation();deleteDream('+entry.id+')" style="padding:6px 14px;border:1px solid #e8e0d5;border-radius:12px;background:#fff;color:#d4625a;font-size:12px;cursor:pointer;min-height:32px;">🗑 删除</button>'
      +'</div>'
      +'</div>';
  }).join('');
}

function viewDreamEntry(id){
  var entry=dreamEntries.find(function(e){return e.id===id});
  if(!entry)return;
  var moodHtml=entry.mood?'<span style="font-size:28px;margin-right:8px;">'+entry.mood+'</span>':'';
  var weatherHtml=entry.weather?'<span style="font-size:20px;">'+entry.weather+'</span>':'';
  var titleHtml=escapeDreamHtml(entry.title||'无标题');
  var contentHtml=escapeDreamHtml(entry.content||'');
  var dateDisplay=entry.date||formatDreamDate(new Date(entry.timestamp||Date.now()).toISOString());
  var overlay=document.createElement('div');
  overlay.className='overlay';
  overlay.style.cssText='z-index:10000;';
  overlay.innerHTML='<div style="width:100%;max-width:440px;background:#fffcf9;border-radius:32px 32px 0 0;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;margin:0 auto;margin-top:auto;box-shadow:0 -4px 30px rgba(90,74,58,0.15);">'
    +'<div class="modal-head" style="padding:18px 24px;border-bottom:1px solid #f0ebe3;">'
    +'<div class="modal-title" style="font-size:17px;font-weight:600;color:#5a4a3a;display:flex;align-items:center;">'+moodHtml+titleHtml+'</div>'
    +'<button class="btn-nav" style="font-size:22px;color:#5a4a3a;">×</button>'
    +'</div>'
    +'<div style="flex:1;overflow-y:auto;padding:20px 24px;-webkit-overflow-scrolling:touch;">'
    +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:18px;font-size:13px;color:#8a7a6a;">'+weatherHtml+'<span>📅 '+dateDisplay+'</span></div>'
    +'<div style="font-size:15px;color:#4a3a2a;line-height:1.9;white-space:pre-wrap;word-break:break-word;">'+contentHtml+'</div>'
    +'</div>'
    +'<div style="padding:16px 24px;border-top:1px solid #f0ebe3;display:flex;gap:10px;">'
    +'<button id="dream-view-edit-btn" style="flex:1;padding:12px;background:#5a4a3a;color:#fffcf9;border:none;border-radius:16px;font-size:14px;font-weight:500;cursor:pointer;">✏️ 编辑</button>'
    +'<button id="dream-view-close-btn" style="flex:1;padding:12px;background:#f0ebe3;color:#5a4a3a;border:none;border-radius:16px;font-size:14px;font-weight:500;cursor:pointer;">关闭</button>'
    +'</div>'
    +'</div>';
  overlay.addEventListener('click',function(e){if(e.target===overlay)overlay.remove()});
  overlay.querySelector('.btn-nav').addEventListener('click',function(){overlay.remove()});
  overlay.querySelector('#dream-view-close-btn').addEventListener('click',function(){overlay.remove()});
  overlay.querySelector('#dream-view-edit-btn').addEventListener('click',function(){
    overlay.remove();
    editDreamEntry(id);
  });
  document.body.appendChild(overlay);
  requestAnimationFrame(function(){overlay.style.opacity='1'});
}

// Mood and weather selectors - 事件委托
document.addEventListener('click',function(e){
  var moodBtn=e.target.closest('.diary-mood-btn');
  if(moodBtn){setDiaryMood(moodBtn.dataset.mood)}
  var weatherBtn=e.target.closest('.diary-weather-btn');
  if(weatherBtn){setDiaryWeather(weatherBtn.dataset.weather)}
});

// ---------- TA's Favorites ----------
var taFavorites={};
var taFavoritesSettings={
  instantProbability:30,
  delayProbability:20,
  minCount:1,
  maxCount:5
};

function loadTAFavorites(){var saved=ls('ml2_ta_favorites');if(saved&&typeof saved==='object')taFavorites=saved}
function saveTAFavorites(){ls('ml2_ta_favorites',taFavorites)}
function loadTAFavoritesSettings(){var saved=ls('ml2_ta_favorites_settings');if(saved&&typeof saved==='object')Object.assign(taFavoritesSettings,saved)}
function saveTAFavoritesSettings(){ls('ml2_ta_favorites_settings',taFavoritesSettings)}

function addToTAFavorites(contactId,msg){
  if(!taFavorites[contactId])taFavorites[contactId]=[];
  var favItem={
    id:'fav_'+Date.now(),
    msgId:msg.id,
    text:msg.t||'',
    image:msg.img?1:0,
    isSticker:msg.isSticker?1:0,
    isVoice:msg.voice?1:0,
    isTouch:msg.isTouch?1:0,
    isRedpacket:msg.isRedpacket?1:0,
    isCall:msg.isCall?1:0,
    timestamp:Date.now(),
    msgTime:msg.ts,
    cid:contactId
  };
  // 图片数据单独存储，避免收藏夹数据过大导致localStorage写入失败
  if(msg.img){
    try{ls('ml2_ta_fav_img_'+favItem.id,msg.img);}catch(e){}
  }
  taFavorites[contactId].push(favItem);
  saveTAFavorites();
}

function showTAFavorites(){
  loadTAFavorites();
  loadTAFavoritesSettings();
  var list=$('ta-favorites-list');
  if(!list)return;
  
  var html='';
  var favorites=taFavorites[cid]||[];
  var contact=contacts.find(function(c){return c.id===cid})||groups.find(function(g){return g.id===cid})||{name:'未知联系人',avatar:''};
  var titleEl=document.querySelector('#ov-ta-favorites .modal-title');
  if(titleEl)titleEl.textContent='⭐ '+contact.name+'的收藏夹';
  
  if(favorites.length===0){
    html='<div style="text-align:center;padding:40px;color:var(--txt2);"><div style="font-size:14px;">暂无收藏</div><div style="font-size:12px;margin-top:4px;">消息发送后有概率被TA收藏</div></div>';
    list.innerHTML=html;
    showOv('ov-ta-favorites');
    return;
  }
  
  favorites.sort(function(a,b){return b.timestamp-a.timestamp});
  
  // 获取最新收藏时间
  var latestTime='';
  if(favorites.length>0 && favorites[0].msgTime){
    var ld=new Date(favorites[0].msgTime);
    latestTime=(ld.getMonth()+1)+'/'+ld.getDate()+' '+('0'+ld.getHours()).slice(-2)+':'+('0'+ld.getMinutes()).slice(-2);
  }
  
  var avatarHtml=contact.avatar?'<img src="'+contact.avatar.replace(/"/g,'&quot;')+'" style="display:block;width:100%;height:100%;object-fit:cover;">':'✦';
  
  html+='<div style="margin-bottom:20px;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border);"><div style="width:36px;height:36px;border-radius:8px;background:var(--c3);overflow:hidden;flex-shrink:0;">'+avatarHtml+'</div><div style="font-size:14px;font-weight:600;color:var(--txt);">'+contact.name+'</div><div style="font-size:12px;color:var(--txt2);">('+favorites.length+'条收藏)</div>'+(latestTime?'<div style="font-size:11px;color:var(--txt3);margin-left:auto;">最新: '+latestTime+'</div>':'')+'</div>';
  
  // ★ 时间只显示具体日期（月/日），不用 今天/昨天/本周 等
  function fmtDay(t){
    var d=new Date(t);
    return (d.getMonth()+1)+'月'+d.getDate()+'日';
  }
  var lastGroup='';
  favorites.forEach(function(fav){
    var d=null;
    if(fav.msgTime){d=new Date(fav.msgTime);}
    var group=d?fmtDay(fav.msgTime):'';
    if(group&&group!==lastGroup){
      html+='<div style="text-align:center;margin:16px 0 8px;font-size:11px;color:var(--txt3);">'+group+'</div>';
      lastGroup=group;
    }
    var contentHtml='';
    // ★ 表情包：优先渲染图片
    if(fav.isSticker&&fav.image){
      contentHtml+='<div class="ta-fav-img-placeholder" data-fav-id="'+fav.id+'" data-sticker="1" style="max-width:140px;max-height:140px;border-radius:8px;margin-top:8px;background:var(--c3);display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--txt3);min-height:90px;">加载中...</div>';
    }
    if(fav.text){
      contentHtml+='<div style="font-size:14px;color:var(--txt);line-height:1.5;">'+fav.text+'</div>';
    }
    if(fav.image&&!fav.isSticker){
      contentHtml+='<div class="ta-fav-img-placeholder" data-fav-id="'+fav.id+'" style="max-width:120px;max-height:120px;border-radius:8px;margin-top:8px;background:var(--c3);display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--txt3);min-height:80px;">加载中...</div>';
    }
    if(fav.isVoice){
      contentHtml+='<div style="font-size:13px;color:var(--txt2);margin-top:4px;display:flex;align-items:center;gap:6px;"><span>🎤</span><span>语音消息</span></div>';
    }
    if(fav.isTouch){
      contentHtml+='<div style="font-size:13px;color:var(--txt2);margin-top:4px;">💫 '+ (fav.text||'一个触碰') +'</div>';
    }
    if(fav.isRedpacket){
      contentHtml+='<div style="font-size:13px;color:var(--txt2);margin-top:4px;">🧧 红包消息</div>';
    }
    if(fav.isCall){
      contentHtml+='<div style="font-size:13px;color:var(--txt2);margin-top:4px;">📞 通话消息</div>';
    }
    
    // ★ 每条收藏显示日期（月/日 时:分）
    var favTimeHtml='';
    if(fav.msgTime){
      var fd=new Date(fav.msgTime);
      favTimeHtml='<div style="font-size:10px;color:var(--txt3);margin-bottom:4px;">'+(fd.getMonth()+1)+'/'+fd.getDate()+' '+('0'+fd.getHours()).slice(-2)+':'+('0'+fd.getMinutes()).slice(-2)+'</div>';
    }
    html+='<div style="padding:12px;background:var(--c2);border-radius:8px;margin-bottom:8px;">'+favTimeHtml+contentHtml+'</div>';
  });
  
  html+='</div>';
  
  list.innerHTML=html;
  showOv('ov-ta-favorites');
  
  // 异步加载图片
  var placeholders=list.querySelectorAll('.ta-fav-img-placeholder');
  placeholders.forEach(function(ph){
    var favId=ph.getAttribute('data-fav-id');
    var imgKey='ml2_ta_fav_img_'+favId;
    var imgData=ls(imgKey);
    if(imgData){
      ph.outerHTML='<img src="'+imgData+'" style="max-width:120px;max-height:120px;border-radius:8px;margin-top:8px;object-fit:cover;">';
    }else if(window.localforage){
      window.localforage.getItem(imgKey).then(function(data){
        if(data){
          ph.outerHTML='<img src="'+data+'" style="max-width:120px;max-height:120px;border-radius:8px;margin-top:8px;object-fit:cover;">';
        }else{
          ph.style.display='none';
        }
      }).catch(function(){
        ph.style.display='none';
      });
    }else{
      ph.style.display='none';
    }
  });
}

function showTAFavoritesSettings(){
  loadTAFavoritesSettings();
  $('ta-fav-instant-slider').value=taFavoritesSettings.instantProbability;
  $('ta-fav-instant-value').textContent=taFavoritesSettings.instantProbability+'%';
  $('ta-fav-delay-slider').value=taFavoritesSettings.delayProbability;
  $('ta-fav-delay-value').textContent=taFavoritesSettings.delayProbability+'%';
  $('ta-fav-min-count-slider').value=taFavoritesSettings.minCount;
  $('ta-fav-min-count-value').textContent=taFavoritesSettings.minCount;
  $('ta-fav-max-count-slider').value=taFavoritesSettings.maxCount;
  $('ta-fav-max-count-value').textContent=taFavoritesSettings.maxCount;
  showOv('ov-ta-favorites-settings');
}

function simulateTAFavorite(){
  if(!cid)return;
  loadTAFavorites();
  loadTAFavoritesSettings();
  var m=msgs(cid);
  if(m.length===0)return;
  
  var recentMsgs=m.filter(function(msg){return msg.s===SELF});
  if(recentMsgs.length===0)return;
  
  var minCount=taFavoritesSettings.minCount||1;
  var maxCount=taFavoritesSettings.maxCount||5;
  var count=minCount+Math.floor(Math.random()*(maxCount-minCount+1));
  count=Math.min(count,recentMsgs.length);
  
  for(var i=0;i<count;i++){
    var randomMsg=recentMsgs[Math.floor(Math.random()*recentMsgs.length)];
    var instantOrDelay=Math.random();
    
    if(instantOrDelay<0.5){
      if(Math.random()*100<taFavoritesSettings.instantProbability){
        setTimeout(function(msg){return function(){addToTAFavorites(cid,msg);};}(randomMsg),(1+Math.random()*3)*1000);
      }
    }else{
      if(Math.random()*100<taFavoritesSettings.delayProbability){
        setTimeout(function(msg){return function(){addToTAFavorites(cid,msg);};}(randomMsg),(60+Math.random()*174)*60*1000);
      }
    }
  }
}

if($('ta-fav-instant-slider')){
  $('ta-fav-instant-slider').addEventListener('input',function(){
    taFavoritesSettings.instantProbability=parseInt(this.value);
    $('ta-fav-instant-value').textContent=taFavoritesSettings.instantProbability+'%';
    saveTAFavoritesSettings();
  });
}
if($('ta-fav-delay-slider')){
  $('ta-fav-delay-slider').addEventListener('input',function(){
    taFavoritesSettings.delayProbability=parseInt(this.value);
    $('ta-fav-delay-value').textContent=taFavoritesSettings.delayProbability+'%';
    saveTAFavoritesSettings();
  });
}
if($('ta-fav-min-count-slider')){
  $('ta-fav-min-count-slider').addEventListener('input',function(){
    taFavoritesSettings.minCount=parseInt(this.value);
    $('ta-fav-min-count-value').textContent=taFavoritesSettings.minCount;
    saveTAFavoritesSettings();
  });
}
if($('ta-fav-max-count-slider')){
  $('ta-fav-max-count-slider').addEventListener('input',function(){
    taFavoritesSettings.maxCount=parseInt(this.value);
    $('ta-fav-max-count-value').textContent=taFavoritesSettings.maxCount;
    saveTAFavoritesSettings();
  });
}

// ---------- TA's Highlights (聊天重点) ----------
var taHighlightsSelected={};
var taHighlightsMsg={};
var taHighlightsSettings={
  dailySelectProb:60,
  selectCountMin:1,
  selectCountMax:5,
  leaveMsgProb:60,
  msgCardCountMin:1,
  msgCardCountMax:30
};
var taHighlightsLastCheckDate=null;
var taHighlightProbability=60;
var taHighlightLastTriggerDate=null;
var taHighlightRandomTriggerMinute=null;
var taHighlightViewDate=new Date();

function loadTAHighlightsSelected(){var saved=ls('ml2_ta_highlights_selected');if(saved&&typeof saved==='object')taHighlightsSelected=saved}
function saveTAHighlightsSelectedData(){ls('ml2_ta_highlights_selected',taHighlightsSelected)}
function loadTAHighlightsMsg(){var saved=ls('ml2_ta_highlights_msg');if(saved&&typeof saved==='object')taHighlightsMsg=saved}
function saveTAHighlightsMsgData(){ls('ml2_ta_highlights_msg',taHighlightsMsg)}
function loadTAHighlightsSettings(){var saved=ls('ml2_ta_highlights_settings');if(saved&&typeof saved==='object')Object.assign(taHighlightsSettings,saved)}
function saveTAHighlightsSettingsData(){ls('ml2_ta_highlights_settings',taHighlightsSettings)}
function loadTAHighlightsLastCheck(){taHighlightsLastCheckDate=ls('ml2_ta_highlights_last_check')||null}
function saveTAHighlightsLastCheck(){ls('ml2_ta_highlights_last_check',taHighlightsLastCheckDate)}
function loadTAHighlightProbability(){var saved=ls('ml2_ta_highlight_probability');if(saved!==undefined)taHighlightProbability=saved}
function saveTAHighlightProbability(){ls('ml2_ta_highlight_probability',taHighlightProbability)}
function loadTAHighlightLastTriggerDate(){taHighlightLastTriggerDate=ls('ml2_ta_highlight_last_trigger_date')||null}
function saveTAHighlightLastTriggerDate(){ls('ml2_ta_highlight_last_trigger_date',taHighlightLastTriggerDate)}

function getTaHighlightDateStr(d){return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
function formatTaHighlightDateDisplay(d){return d.getFullYear()+'年'+(d.getMonth()+1)+'月'+d.getDate()+'日'}
function isSameTaHighlightDay(d1,d2){return d1.getFullYear()===d2.getFullYear()&&d1.getMonth()===d2.getMonth()&&d1.getDate()===d2.getDate()}
function changeTaHighlightDate(delta){
  var d=new Date(taHighlightViewDate);
  d.setDate(d.getDate()+delta);
  var today=new Date();today.setHours(0,0,0,0);
  var newDay=new Date(d);newDay.setHours(0,0,0,0);
  if(newDay>today)return;
  taHighlightViewDate=d;
  // 修复：根据当前所在页面/overlay 决定调用哪个渲染函数
  // 避免在半屏overlay未打开时调用 renderTAHighlightsContent 提前return导致日期切换无反应
  var fullContent=$('ta-highlights-full-content');
  var halfContent=$('ta-highlights-selected-msgs');
  if(fullContent && (window.currentPage==='pg-ta-highlights' || fullContent.innerHTML)){
    renderTAHighlightsFull();
  }else if(halfContent){
    renderTAHighlightsContent();
  }else{
    // 兜底：两个都调用
    renderTAHighlightsContent();
    renderTAHighlightsFull();
  }
}
function goToTaHighlightToday(){
  taHighlightViewDate=new Date();
  var fullContent=$('ta-highlights-full-content');
  var halfContent=$('ta-highlights-selected-msgs');
  if(fullContent && (window.currentPage==='pg-ta-highlights' || fullContent.innerHTML)){
    renderTAHighlightsFull();
  }else if(halfContent){
    renderTAHighlightsContent();
  }else{
    renderTAHighlightsContent();
    renderTAHighlightsFull();
  }
}
function openTaHighlightDatePicker(){
  var input=document.createElement('input');
  input.type='date';
  input.value=getTaHighlightDateStr(taHighlightViewDate);
  input.max=getTaHighlightDateStr(new Date());
  input.style.position='fixed';input.style.opacity='0';input.style.pointerEvents='none';
  document.body.appendChild(input);
  input.addEventListener('change',function(){
    if(input.value){
      taHighlightViewDate=new Date(input.value+'T00:00:00');
      var fullContent=$('ta-highlights-full-content');
      var halfContent=$('ta-highlights-selected-msgs');
      if(fullContent && (window.currentPage==='pg-ta-highlights' || fullContent.innerHTML)){
        renderTAHighlightsFull();
      }else if(halfContent){
        renderTAHighlightsContent();
      }else{
        renderTAHighlightsContent();
        renderTAHighlightsFull();
      }
    }
    if(input.parentNode)document.body.removeChild(input);
  });
  input.addEventListener('blur',function(){setTimeout(function(){if(input.parentNode)document.body.removeChild(input)},200)});
  try{input.showPicker();}catch(e){input.click();}
  if(!input.showPicker){input.click();}
}
function renderTAHighlightCalendarNav(){
  var today=new Date();today.setHours(0,0,0,0);
  var viewDay=new Date(taHighlightViewDate);viewDay.setHours(0,0,0,0);
  var isToday=isSameTaHighlightDay(taHighlightViewDate,new Date());
  var canGoNext=viewDay<today;
  var html='<div style="display:flex;align-items:center;justify-content:center;gap:12px;padding:10px 0;margin-bottom:12px;background:var(--c2);border-radius:14px;flex-wrap:wrap;">';
  html+='<button onclick="changeTaHighlightDate(-1)" style="width:34px;height:34px;border-radius:17px;border:1px solid var(--border);background:var(--c1);color:var(--txt);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;">◀</button>';
  html+='<span onclick="openTaHighlightDatePicker()" style="font-size:16px;font-weight:600;color:var(--txt);cursor:pointer;padding:4px 8px;border-radius:8px;user-select:none;" title="点击选择日期">'+formatTaHighlightDateDisplay(taHighlightViewDate)+'</span>';
  html+='<button onclick="changeTaHighlightDate(1)" style="width:34px;height:34px;border-radius:17px;border:1px solid '+(canGoNext?'var(--border)':'var(--border)')+';background:'+(canGoNext?'var(--c1)':'var(--c3)')+';color:'+(canGoNext?'var(--txt)':'var(--txt3)')+';font-size:16px;cursor:'+(canGoNext?'pointer':'default')+';display:flex;align-items:center;justify-content:center;line-height:1;"'+(canGoNext?'':' disabled')+'>▶</button>';
  if(!isToday){
    html+='<button onclick="goToTaHighlightToday()" style="padding:6px 14px;border-radius:17px;border:1px solid var(--accent);background:var(--c1);color:var(--accent);font-size:13px;cursor:pointer;white-space:nowrap;">返回今天</button>';
  }
  html+='</div>';
  return html;
}

function showTAHighlights(){
  taHighlightViewDate=new Date();
  loadTAHighlightsSelected();
  loadTAHighlightsMsg();
  renderTAHighlightsContent();
  showOv('ov-ta-highlights');
}

function renderTAHighlightsContent(){
  var charMsgDiv=$('ta-highlights-char-msgs');
  var selDiv=$('ta-highlights-selected-msgs');
  if(!charMsgDiv||!selDiv)return;

  var contact=contacts.find(function(c){return c.id===cid})||groups.find(function(g){return g.id===cid})||{name:'未知联系人',avatar:''};
  var avatarHtml=contact.avatar?'<img src="'+contact.avatar.replace(/"/g,'&quot;')+'" style="display:block;width:100%;height:100%;object-fit:cover;">':'✦';

  // Selected messages - 显示所有重点消息，按日期分组
  var selectedMap=taHighlightsSelected[cid]||{};
  var selHtml='';
  var allMsgs=msgs(cid);
  var entries=[];
  for(var msgId in selectedMap){
    if(selectedMap.hasOwnProperty(msgId)){
      var msg=allMsgs.find(function(m){return m.id===msgId});
      if(msg){
        entries.push({msg:msg,selectedBy:selectedMap[msgId]});
      }
    }
  }
  entries.sort(function(a,b){return (b.msg.ts||0)-(a.msg.ts||0)});

  var taEntries=entries.filter(function(e){return e.selectedBy==='ta'});
  var userEntries=entries.filter(function(e){return e.selectedBy==='user'});
  
  function renderEntryList(entryList,borderColor,bgColor,tagColor,tagText){
    var html='';
    if(entryList.length>0){
      var lastDate='';
      entryList.forEach(function(entry){
        var msg=entry.msg;
        var d=new Date(msg.ts);
        var dateStr=(d.getMonth()+1)+'/'+d.getDate();
        var timeStr=dateStr+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);
        
        if(dateStr!==lastDate){
          html+='<div style="text-align:center;margin:12px 0 8px;font-size:11px;color:var(--txt3);">'+dateStr+'</div>';
          lastDate=dateStr;
        }
        
        var contentHtml='';
        if(msg.t){
          contentHtml+='<div style="font-size:13px;color:var(--txt);line-height:1.5;word-break:break-all;">'+msg.t+'</div>';
        }
        if(msg.img){
          contentHtml+='<img src="'+msg.img+'" style="max-width:100px;max-height:100px;border-radius:8px;margin-top:4px;object-fit:cover;" loading="lazy">';
        }
        if(msg.isSticker){
          contentHtml+='<img src="'+msg.img+'" style="max-width:100px;max-height:100px;border-radius:8px;margin-top:4px;object-fit:contain;" loading="lazy">';
        }
        if(msg.isTouch&&msg.touchAction){
          contentHtml+='<div style="font-size:13px;color:var(--txt2);">[戳一戳] '+msg.touchAction+'</div>';
        }
        if(!contentHtml)contentHtml='<div style="font-size:12px;color:var(--txt3);">[空消息]</div>';
        
        var isMe=msg.s===SELF;
        html+='<div style="padding:10px;background:'+bgColor+';border-left:3px solid '+borderColor+';border-radius:6px;margin-bottom:8px;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="font-size:10px;color:'+tagColor+';background:'+bgColor+';padding:1px 6px;border-radius:4px;font-weight:500;">'+tagText+'</span><span style="font-size:11px;color:var(--txt3);">'+(isMe?'我':'TA')+' · '+timeStr+'</span></div>'+contentHtml+'</div>';
      });
    }
    return html;
  }
  
  if(taEntries.length>0 || userEntries.length>0){
    selHtml='<div style="display:flex;align-items:center;gap:16px;margin-bottom:10px;"><div style="font-size:14px;font-weight:600;color:var(--txt);">'+contact.name+'的重点消息</div><div style="font-size:12px;color:var(--txt2);">('+entries.length+')</div></div>';
    if(taEntries.length>0){
      selHtml+='<div style="font-size:12px;color:#e8873b;margin-bottom:6px;font-weight:500;">TA选的 ('+taEntries.length+')</div>';
      selHtml+=renderEntryList(taEntries,'#e8873b','rgba(232,135,59,0.06)','#e8873b','TA选的');
    }
    if(userEntries.length>0){
      selHtml+='<div style="font-size:12px;color:#1572f7;margin:'+(taEntries.length>0?'12px 0 6px 0':'0 0 6px 0')+';font-weight:500;">我选的 ('+userEntries.length+')</div>';
      selHtml+=renderEntryList(userEntries,'#1572f7','rgba(21,114,247,0.06)','#1572f7','我选的');
    }
  }else{
    selHtml='<div style="text-align:center;padding:20px;color:var(--txt2);font-size:13px;">'+contact.name+' 还没有选择重点消息</div>';
  }
  selDiv.innerHTML=selHtml;

  // Character messages - 显示所有想说的话，按日期分组
  var charMsgs=taHighlightsMsg[cid]||[];
  var charHtml='';
  if(charMsgs.length>0){
    charHtml+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border);"><div style="width:36px;height:36px;border-radius:8px;background:var(--c3);display:flex;align-items:center;justify-content:center;overflow:hidden;font-size:12px;color:var(--txt2);">'+avatarHtml+'</div><div style="font-size:14px;font-weight:600;color:var(--txt);">'+contact.name+' 想说的话</div><div style="font-size:12px;color:var(--txt2);">('+charMsgs.length+')</div></div>';
    
    var lastDate='';
    charMsgs.slice().reverse().forEach(function(entry){
      var d=new Date(entry.timestamp);
      var dateStr=(d.getMonth()+1)+'/'+d.getDate();
      var timeStr=dateStr+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);
      
      if(dateStr!==lastDate){
        charHtml+='<div style="text-align:center;margin:12px 0 8px;font-size:11px;color:var(--txt3);">'+dateStr+'</div>';
        lastDate=dateStr;
      }
      
      var cardHtml='';
      if(entry.cards&&Array.isArray(entry.cards)){
        entry.cards.forEach(function(card){
          if(card.img){
            cardHtml+='<img src="'+card.img+'" style="max-width:60px;max-height:60px;border-radius:6px;margin:2px;object-fit:contain;vertical-align:middle;display:inline-block;" loading="lazy">';
          }else if(card.voice){
            cardHtml+='<span style="display:inline-block;background:rgba(21,114,247,0.12);color:var(--accent);padding:2px 8px;border-radius:6px;margin:2px;font-size:14px;font-weight:500;">🎤 语音</span>';
          }else{
            var word=card.text||'';
            if(word.trim()){
              cardHtml+='<span style="display:inline-block;background:rgba(21,114,247,0.12);color:var(--accent);padding:2px 8px;border-radius:6px;margin:2px;font-size:14px;font-weight:500;">'+word+'</span>';
            }
          }
        });
      }else{
        var cardWords=(entry.text||'').split(' ');
        cardWords.forEach(function(word){
          if(word.trim()){
            cardHtml+='<span style="display:inline-block;background:rgba(21,114,247,0.12);color:var(--accent);padding:2px 8px;border-radius:6px;margin:2px;font-size:14px;font-weight:500;">'+word+'</span>';
          }
        });
      }
      charHtml+='<div style="padding:12px;background:var(--c2);border-radius:12px;margin-bottom:8px;"><div style="font-size:14px;color:var(--txt);line-height:2.2;word-break:break-all;">'+cardHtml+'</div><div style="font-size:11px;color:var(--txt2);margin-top:6px;">'+timeStr+'</div></div>';
    });
  }else{
    charHtml='';
  }
  charMsgDiv.innerHTML=charHtml;
}

function showTAHighlightsSelectMsg(){
  loadTAHighlightsSelected();
  var allMsgs=msgs(cid);
  var selectedMap=taHighlightsSelected[cid]||{};
  var list=$('ta-highlights-select-list');
  if(!list)return;

  if(allMsgs.length===0){
    list.innerHTML='<div style="text-align:center;padding:40px;color:var(--txt2);font-size:13px;">暂无聊天消息</div>';
    showOv('ov-ta-highlights-select');
    return;
  }

  var html='';
  // 倒序显示，最新在顶
  for(var i=allMsgs.length-1;i>=0;i--){
    var msg=allMsgs[i];
    var isChecked=selectedMap.hasOwnProperty(msg.id);
    var isUserSelected=selectedMap[msg.id]==='user';
    var isTASelected=selectedMap[msg.id]==='ta';
    var tagColor=isUserSelected?'#1572f7':(isTASelected?'#e8873b':'');
    var tagText=isUserSelected?'我选的':(isTASelected?'TA选的':'');
    var contentHtml='';
    if(msg.t){
      contentHtml+='<div style="font-size:13px;color:var(--txt);line-height:1.5;word-break:break-all;">'+(msg.t.length>50?msg.t.substring(0,50)+'...':msg.t)+'</div>';
    }
    if(msg.img){
      contentHtml+='<img src="'+msg.img+'" style="max-width:60px;max-height:60px;border-radius:6px;margin-top:4px;object-fit:cover;" loading="lazy">';
    }
    if(msg.isSticker){
      contentHtml+='<img src="'+msg.img+'" style="max-width:60px;max-height:60px;border-radius:6px;margin-top:4px;object-fit:contain;" loading="lazy">';
    }
    if(msg.isTouch&&msg.touchAction){
      contentHtml+='<div style="font-size:12px;color:var(--txt2);">[戳一戳] '+msg.touchAction+'</div>';
    }
    if(!contentHtml)contentHtml='<div style="font-size:12px;color:var(--txt3);">[空消息]</div>';

    var isMe=msg.s===SELF;
    var d=new Date(msg.ts);
    var timeStr=(d.getMonth()+1)+'/'+d.getDate()+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);

    html+='<label style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--c2);border-radius:8px;margin-bottom:6px;cursor:pointer;'+(tagColor?'border-left:3px solid '+tagColor:'')+'">';
    html+='<input type="checkbox" value="'+msg.id+'" '+(isChecked?'checked':'')+' style="flex-shrink:0;width:18px;height:18px;">';
    html+='<div style="flex:1;min-width:0;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;"><span style="font-size:11px;color:var(--txt3);">'+(isMe?'我':'TA')+' · '+timeStr+'</span>'+(tagText?'<span style="font-size:10px;color:'+tagColor+';font-weight:500;">'+tagText+'</span>':'')+'</div>'+contentHtml+'</div>';
    html+='</label>';
  }
  list.innerHTML=html;
  showOv('ov-ta-highlights-select');
}

function selectAllTAHighlightsMsg(){
  var list=$('ta-highlights-select-list');
  if(!list)return;
  var checkboxes=list.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(function(cb){cb.checked=true});
}

function saveTAHighlightsSelectedUI(){
  var list=$('ta-highlights-select-list');
  if(!list)return;
  var checkboxes=list.querySelectorAll('input[type="checkbox"]:checked');
  var selectedMap={};
  // 保留已有的TA选择
  var existing=taHighlightsSelected[cid]||{};
  for(var msgId in existing){
    if(existing.hasOwnProperty(msgId)&&existing[msgId]==='ta'){
      selectedMap[msgId]='ta';
    }
  }
  // 添加用户新选择
  checkboxes.forEach(function(cb){selectedMap[cb.value]='user'});
  taHighlightsSelected[cid]=selectedMap;
  saveTAHighlightsSelectedData();
  hideOv('ov-ta-highlights-select');
  renderTAHighlightsContent();
  var userCount=0;
  for(var k in selectedMap){if(selectedMap[k]==='user')userCount++;}
  toast('已保存 '+userCount+' 条重点消息');
}

function viewTAHighlightsSelected(){
  loadTAHighlightsSelected();
  var selected=taHighlightsSelected[cid];
  if(!selected||Object.keys(selected).length===0){
    toast('TA还没有选择重点消息');
    return;
  }
  var allMsgs=msgs(cid);
  var selectedMsgs=allMsgs.filter(function(m){return selected[m.id];});
  if(selectedMsgs.length===0){
    toast('暂无已选消息');
    return;
  }
  var html='<div class="sh" style="display:flex;justify-content:space-between;align-items:center;"><h3>📋 TA已选重点消息</h3><button class="btn-close" onclick="hideOv(\'ov-ta-highlights-select\')">✕</button></div>';
  html+='<div class="sb" style="padding:16px;max-height:60vh;overflow-y:auto;">';
  selectedMsgs.forEach(function(m){
    var time=new Date(m.ts).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
    var text='';
    if(m.t){
      text=m.t;
    }else if(m.img){
      if(m.isSticker){
        text='<img src="'+m.img+'" style="max-width:80px;max-height:80px;border-radius:6px;object-fit:contain;" loading="lazy">';
      }else{
        text='<img src="'+m.img+'" style="max-width:120px;max-height:120px;border-radius:8px;object-fit:cover;" loading="lazy">';
      }
    }else if(m.voice){
      text='🎤 [语音消息]';
    }else if(m.isRedpacket){
      var _rpSt=m.redpacketStatus||(m.redpacketOpened?'received':'pending');
      var _rpTxt=_rpSt==='received'?'已领取':(_rpSt==='returned'?'已退回':(_rpSt==='expired'?'已过期':(m.s===SELF?'等待领取':'未领取')));
      text='🧧 红包 ¥'+(m.redpacketAmount||'?')+' ('+_rpTxt+')';
    }else if(m.callMessage){
      text=m.callMessage;
    }else{
      text='[消息]';
    }
    html+='<div style="padding:10px 12px;margin-bottom:8px;background:var(--c2);border-radius:10px;font-size:13px;color:var(--txt);"><div style="font-size:11px;color:var(--txt3);margin-bottom:4px;">'+time+'</div>'+text+'</div>';
  });
  html+='</div>';
  showOv('ov-ta-highlights-select');
  var ov=$('ov-ta-highlights-select');
  if(ov)ov.innerHTML='<div class="sheet" style="max-width:420px;">'+html+'</div>';
}

function showTAHighlightsSettings(){
  loadTAHighlightsSettings();
  loadTAHighlightProbability();
  // 兜底默认值,防止undefined
  if(taHighlightsSettings.dailySelectProb===undefined||taHighlightsSettings.dailySelectProb===null)taHighlightsSettings.dailySelectProb=60;
  if(taHighlightsSettings.selectCountMin===undefined||taHighlightsSettings.selectCountMin===null)taHighlightsSettings.selectCountMin=1;
  if(taHighlightsSettings.selectCountMax===undefined||taHighlightsSettings.selectCountMax===null)taHighlightsSettings.selectCountMax=5;
  if(taHighlightsSettings.leaveMsgProb===undefined||taHighlightsSettings.leaveMsgProb===null)taHighlightsSettings.leaveMsgProb=60;
  if(taHighlightsSettings.msgCardCountMin===undefined||taHighlightsSettings.msgCardCountMin===null)taHighlightsSettings.msgCardCountMin=1;
  if(taHighlightsSettings.msgCardCountMax===undefined||taHighlightsSettings.msgCardCountMax===null)taHighlightsSettings.msgCardCountMax=30;
  if(taHighlightProbability===undefined||taHighlightProbability===null)taHighlightProbability=60;

  $('ta-hl-trigger-prob-slider').value=taHighlightProbability;
  $('ta-hl-trigger-prob-value').textContent=taHighlightProbability+'%';
  $('ta-hl-daily-select-slider').value=taHighlightsSettings.dailySelectProb;
  $('ta-hl-daily-select-value').textContent=taHighlightsSettings.dailySelectProb+'%';
  $('ta-hl-select-min').value=taHighlightsSettings.selectCountMin;
  $('ta-hl-select-max').value=taHighlightsSettings.selectCountMax;
  $('ta-hl-leave-msg-slider').value=taHighlightsSettings.leaveMsgProb;
  $('ta-hl-leave-msg-value').textContent=taHighlightsSettings.leaveMsgProb+'%';
  $('ta-hl-msg-min').value=taHighlightsSettings.msgCardCountMin;
  $('ta-hl-msg-max').value=taHighlightsSettings.msgCardCountMax;
  showOv('ov-ta-highlights-settings');
}

function taHlStepper(key,delta){
  var minVals={selectCountMin:1,selectCountMax:1,msgCardCountMin:1,msgCardCountMax:1};
  var maxVals={selectCountMin:50,selectCountMax:50,msgCardCountMin:30,msgCardCountMax:30};
  var newVal=taHighlightsSettings[key]+delta;
  if(newVal<minVals[key])newVal=minVals[key];
  if(newVal>maxVals[key])newVal=maxVals[key];
  taHighlightsSettings[key]=newVal;
  saveTAHighlightsSettingsData();
  var inputMap={selectCountMin:'ta-hl-select-min',selectCountMax:'ta-hl-select-max',msgCardCountMin:'ta-hl-msg-min',msgCardCountMax:'ta-hl-msg-max'};
  var el=$(inputMap[key]);
  if(el)el.value=newVal;
}

function updateTAHighlightTriggerProb(){
  var slider=$('ta-hl-trigger-prob-slider');
  if(!slider)return;
  taHighlightProbability=parseInt(slider.value);
  $('ta-hl-trigger-prob-value').textContent=taHighlightProbability+'%';
  saveTAHighlightProbability();
  throttledSaveData();
}

function renderTAHighlightsFull(){
  loadTAHighlightsSelected();
  loadTAHighlightsMsg();
  var wrap=$('ta-highlights-contact-select-wrap');
  if(wrap){
    var wrapHtml='';
    contacts.forEach(function(c){
      var isActive=c.id===cid;
      wrapHtml+='<button onclick="switchTAHighlightsContact(\''+c.id+'\')" style="padding:8px 14px;border-radius:20px;border:1px solid '+(isActive?'var(--accent)':'var(--border)')+';background:'+(isActive?'var(--accent)':'var(--c2)')+';color:'+(isActive?'#fff':'var(--txt)')+';font-size:13px;cursor:pointer;white-space:nowrap;flex-shrink:0;">'+c.name+'</button>';
    });
    wrap.innerHTML=wrapHtml;
  }
  renderTAHighlightsFullContent();
}

function switchTAHighlightsContact(contactId){
  cid=contactId;
  renderTAHighlightsFull();
}

function renderTAHighlightsFullContent(){
  var contentDiv=$('ta-highlights-full-content');
  if(!contentDiv)return;

  var contact=contacts.find(function(c){return c.id===cid})||groups.find(function(g){return g.id===cid})||{name:'未知联系人',avatar:''};
  var avatarHtml=contact.avatar?'<img src="'+contact.avatar.replace(/"/g,'&quot;')+'" style="display:block;width:100%;height:100%;object-fit:cover;">':'✦';

  var html=renderTAHighlightCalendarNav();

  // Character messages - 按日期过滤
  var charMsgs=taHighlightsMsg[cid]||[];
  var filteredCharMsgs=[];
  charMsgs.forEach(function(entry){
    var d=new Date(entry.timestamp);
    if(isSameTaHighlightDay(d,taHighlightViewDate))filteredCharMsgs.push(entry);
  });
  if(filteredCharMsgs.length>0){
    html+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border);"><div style="width:36px;height:36px;border-radius:8px;background:var(--c3);overflow:hidden;flex-shrink:0;font-size:12px;color:var(--txt2);">'+avatarHtml+'</div><div style="font-size:14px;font-weight:600;color:var(--txt);">'+contact.name+' 想说的话</div></div>';
    filteredCharMsgs.slice().reverse().forEach(function(entry){
      var d=new Date(entry.timestamp);
      var timeStr=(d.getMonth()+1)+'/'+d.getDate()+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);
      var cardWords=entry.text.split(' ');
      var cardHtml='';
      cardWords.forEach(function(word){
        if(word.trim()){
          cardHtml+='<span style="display:inline-block;background:rgba(21,114,247,0.12);color:var(--accent);padding:2px 8px;border-radius:6px;margin:2px;font-size:14px;font-weight:500;">'+word+'</span>';
        }
      });
      html+='<div style="padding:12px;background:var(--c2);border-radius:12px;margin-bottom:8px;"><div style="font-size:14px;color:var(--txt);line-height:2.2;word-break:break-all;">'+cardHtml+'</div><div style="font-size:11px;color:var(--txt2);margin-top:6px;">'+timeStr+'</div></div>';
    });
  }else{
    html+='<div style="text-align:center;padding:20px;color:var(--txt2);font-size:13px;">当天没有聊天重点</div>';
  }

  // Selected messages - 按日期过滤
  var selectedMap=taHighlightsSelected[cid]||{};
  var entries=[];
  var allMsgs=msgs(cid);
  for(var msgId in selectedMap){
    if(selectedMap.hasOwnProperty(msgId)){
      var msg=allMsgs.find(function(m){return m.id===msgId});
      if(msg){
        var msgDate=new Date(msg.ts);
        if(isSameTaHighlightDay(msgDate,taHighlightViewDate))entries.push({msg:msg,selectedBy:selectedMap[msgId]});
      }
    }
  }
  entries.sort(function(a,b){return (b.msg.ts||0)-(a.msg.ts||0)});

  if(entries.length>0){
    html+='<div style="font-size:13px;font-weight:600;color:var(--txt);margin-top:16px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;"><span>已选重点消息 ('+entries.length+')</span><span style="display:flex;gap:8px;font-size:11px;font-weight:400;"><span style="color:#1572f7;">● 我选的</span><span style="color:#e8873b;">● TA选的</span></span></div>';
    entries.forEach(function(entry){
      var msg=entry.msg;
      var isUser=entry.selectedBy==='user';
      var borderColor=isUser?'#1572f7':'#e8873b';
      var bgColor=isUser?'rgba(21,114,247,0.06)':'rgba(232,135,59,0.06)';
      var tagColor=isUser?'#1572f7':'#e8873b';
      var tagText=isUser?'我选的':'TA选的';
      var contentHtml='';
      if(msg.t){
        contentHtml+='<div style="font-size:13px;color:var(--txt);line-height:1.5;word-break:break-all;">'+msg.t+'</div>';
      }
      if(msg.img){
        contentHtml+='<img src="'+msg.img+'" style="max-width:100px;max-height:100px;border-radius:8px;margin-top:4px;object-fit:cover;" loading="lazy">';
      }
      if(msg.isSticker){
        contentHtml+='<img src="'+msg.img+'" style="max-width:100px;max-height:100px;border-radius:8px;margin-top:4px;object-fit:contain;" loading="lazy">';
      }
      if(msg.isTouch&&msg.touchAction){
        contentHtml+='<div style="font-size:13px;color:var(--txt2);">[戳一戳] '+msg.touchAction+'</div>';
      }
      var isMe=msg.s===SELF;
      var d=new Date(msg.ts);
      var timeStr=(d.getMonth()+1)+'/'+d.getDate()+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);
      html+='<div style="padding:10px;background:'+bgColor+';border-left:3px solid '+borderColor+';border-radius:6px;margin-bottom:6px;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="font-size:10px;color:'+tagColor+';background:'+bgColor+';padding:1px 6px;border-radius:4px;font-weight:500;">'+tagText+'</span><span style="font-size:11px;color:var(--txt3);">'+(isMe?'我':'TA')+' · '+timeStr+'</span></div>'+contentHtml+'</div>';
    });
  }else{
    html+='<div style="text-align:center;padding:20px;color:var(--txt2);font-size:13px;margin-top:16px;">暂无已选消息</div>';
  }

  contentDiv.innerHTML=html;
}

// Auto-trigger: character selects messages daily (使用 setInterval 定时检查，替代不可靠的 setTimeout)
var _taHighlightInterval=null;
function checkTAHighlightsDaily(){
  loadTAHighlightsSettings();
  loadTAHighlightProbability();
  loadTAHighlightLastTriggerDate();
  // 清除旧的定时器
  if(_taHighlightInterval){clearInterval(_taHighlightInterval);_taHighlightInterval=null;}

  var doDailyCheck=function(){
    var now=new Date();
    var today=now.toDateString();
    // 今天已触发过，不再检查
    if(taHighlightLastTriggerDate===today)return;

    // 读取今天是否已决定触发，以及随机触发分钟
    var decidedToday=ls('ml2_ta_hl_decided_'+today);
    var triggerMinute=ls('ml2_ta_hl_trigger_minute_'+today);

    if(!decidedToday){
      // 今天还未决定：进行概率判定
      decidedToday='yes';
      if(Math.random()*100>=taHighlightProbability){
        // 概率未通过，今天不触发
        decidedToday='no';
      }
      ls('ml2_ta_hl_decided_'+today,decidedToday);
      // 生成随机触发分钟（0-1439），但确保不晚于当前时间太多
      var currentMin=now.getHours()*60+now.getMinutes();
      triggerMinute=currentMin+Math.floor(Math.random()*Math.max(60,1440-currentMin));
      if(triggerMinute>=1440)triggerMinute=1439;
      ls('ml2_ta_hl_trigger_minute_'+today,triggerMinute);
    }

    // 如果今天不触发，直接返回
    if(decidedToday==='no'){
      taHighlightLastTriggerDate=today;
      saveTAHighlightLastTriggerDate();
      return;
    }

    // 检查是否到达触发时间
    var currentMin=now.getHours()*60+now.getMinutes();
    if(currentMin>=triggerMinute){
      // 到达触发时间，执行划重点
      taHighlightLastTriggerDate=today;
      saveTAHighlightLastTriggerDate();
      throttledSaveData();
      loadTAHighlightsSettings();
      contacts.forEach(function(contact){
        if(Math.random()*100<taHighlightsSettings.dailySelectProb){
          simulateTAHighlightSelect(contact.id);
        }
      });
    }
  };

  // 立即执行一次检查
  try{doDailyCheck();}catch(e){console.warn('doDailyCheck init error:',e);}
  // 每5分钟检查一次
  // 修复：用 try/catch 包裹回调，避免错误每 5 分钟持续累积
  _taHighlightInterval=setInterval(function(){try{doDailyCheck();}catch(e){console.warn('doDailyCheck error:',e);}},5*60*1000);
}

function simulateTAHighlightSelect(contactId){
  loadTAHighlightsSelected();
  loadTAHighlightsMsg();
  loadTAHighlightsSettings();
  var allMsgs=msgs(contactId);
  if(allMsgs.length===0)return;

  var minCount=taHighlightsSettings.selectCountMin;
  var maxCount=taHighlightsSettings.selectCountMax;
  var count=minCount+Math.floor(Math.random()*(maxCount-minCount+1));
  count=Math.min(count,allMsgs.length);

  if(!taHighlightsSelected[contactId])taHighlightsSelected[contactId]={};
  var pool=allMsgs.slice();
  var actuallySelected=0;
  for(var i=0;i<count;i++){
    var idx=Math.floor(Math.random()*pool.length);
    // 跳过系统消息（拍一拍、通话、礼物、已是重点提示），只选真正的聊天内容
    var selMsg=pool[idx];
    if(selMsg&&(selMsg.isTouch||selMsg.isCall||selMsg.isGift||selMsg.isTAHighlight||selMsg.isSystem||selMsg.isAvatarChange)){
      pool.splice(idx,1);
      i--;
      continue;
    }
    taHighlightsSelected[contactId][pool[idx].id]='ta';
    pool.splice(idx,1);
    actuallySelected++;
    if(pool.length===0)break;
  }

  saveTAHighlightsSelectedData();

  // 修复：触发划重点后，在聊天里发送一条系统小字消息【联系人昵称 划了想说的重点】
  // 该消息的联系人昵称受"隐藏聊天内系统小字消息的双方昵称"功能控制
  if(actuallySelected>0){
    var c=contacts.find(function(x){return x.id===contactId;});
    var cName=c?c.name:'TA';
    var m=msgs(contactId);
    if(m&&m.length>0){
      m.push({
        id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),
        s:OTHER,
        t:'',
        ts:new Date(),
        pc:false,
        isTAHighlight:true,
        isSystem:true,
        read:false,
        senderName:cName,
        senderId:contactId
      });
      savemsgs(contactId,m);
      if(cid===contactId)renderMsgs(m);
      renderChatList();
    }
  }

  // With probability, leave a message
  if(actuallySelected>0&&Math.random()*100<taHighlightsSettings.leaveMsgProb){
    simulateTAHighlightLeaveMsg(contactId);
  }
}

function simulateTAHighlightLeaveMsg(contactId){
  loadTAHighlightsMsg();
  loadTAHighlightsSettings();
  if(globalCards.length===0)return;

  var minCards=taHighlightsSettings.msgCardCountMin;
  var maxCards=taHighlightsSettings.msgCardCountMax;
  var cardCount=minCards+Math.floor(Math.random()*(maxCards-minCards+1));
  cardCount=Math.min(cardCount,globalCards.length);

  var cards=[];
  var pool=globalCards.slice();
  for(var i=0;i<cardCount;i++){
    var idx=Math.floor(Math.random()*pool.length);
    var card=pool[idx];
    // 提取卡片内容，兼容不同卡片类型
    var cardContent=card.content||card.t||card.text||'';
    if(typeof cardContent!=='string')cardContent=String(cardContent);
    
    // 存储卡片完整信息，用于后续渲染
    cards.push({
      text: cardContent,
      type: card.category||'text',
      img: (card.category==='stickers'||card.category==='image')?cardContent:null,
      voice: card.category==='voices'?cardContent:null
    });
    pool.splice(idx,1);
    if(pool.length===0)break;
  }

  if(!taHighlightsMsg[contactId])taHighlightsMsg[contactId]=[];
  taHighlightsMsg[contactId].push({
    cards: cards,
    timestamp: Date.now()
  });
  saveTAHighlightsMsgData();
}

function summonTAHighlight(){
  hideOv('ov-ta-highlights-settings');
  if(!cid){
    toast('请先选择一个联系人');
    return;
  }
  toast('已召唤！30秒后触发划重点');
  setTimeout(function(){
    if(!cid)return;
    simulateTAHighlightSelect(cid);
    renderTAHighlightsContent();
    toast('划重点已触发！');
  },30000);
}

// Settings sliders
if($('ta-hl-daily-select-slider')){
  $('ta-hl-daily-select-slider').addEventListener('input',function(){
    taHighlightsSettings.dailySelectProb=parseInt(this.value);
    $('ta-hl-daily-select-value').textContent=taHighlightsSettings.dailySelectProb+'%';
    saveTAHighlightsSettingsData();
  });
}
if($('ta-hl-leave-msg-slider')){
  $('ta-hl-leave-msg-slider').addEventListener('input',function(){
    taHighlightsSettings.leaveMsgProb=parseInt(this.value);
    $('ta-hl-leave-msg-value').textContent=taHighlightsSettings.leaveMsgProb+'%';
    saveTAHighlightsSettingsData();
  });
}


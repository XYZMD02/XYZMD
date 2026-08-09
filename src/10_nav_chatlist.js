// ---------- Nav ----------
var currentPage='';
var showPgCallbacks={};
function showChatPage(){
  if(currentPage!=='pg-conv'){
    showPg('pg-conv');
  }
  if(cid){
    checkNavDisplay().then(function(){refreshNavDisplay()});
    var m=msgs(cid);
    if(m)renderMsgs(m);
  }
}

var pageHistory=[];
function navToPage(id){
  if(currentPage&&!['pg-list','pg-conv','pg-moments','pg-me','pg-settings','pg-login','pg-onboarding'].includes(currentPage)){
    pageHistory.push(currentPage);
  }
  showPg(id);
}
function navBack(){
  if(pageHistory.length>0){
    var prev=pageHistory.pop();
    showPg(prev);
  }else{
    showPg('pg-conv');
  }
}

// 缓存 tabs 元素和 tab 类型映射，避免每次切换都 querySelectorAll
var _cachedTabsEls=null;
var _cachedTabsData=null; // [{el, tabs:[{el,type}]}]
var _badgeCache={unread:0,ts:0};
function _getTabsCache(){
  if(!_cachedTabsEls){
    _cachedTabsEls=document.querySelectorAll('.tabs');
    _cachedTabsData=[];
    _cachedTabsEls.forEach(function(el){
      var tabData=[];
      el.querySelectorAll('.tab').forEach(function(tb){
        var tabType=tb.dataset.p==='pg-list'?'list':(tb.dataset.p==='pg-moments'?'moments':(tb.dataset.p==='pg-more'?'more':'my'));
        tabData.push({el:tb,type:tabType});
      });
      _cachedTabsData.push({el:el,tabs:tabData});
    });
  }
  return _cachedTabsData;
}
function _invalidateTabsCache(){
  _cachedTabsEls=null;
  _cachedTabsData=null;
}

function showPg(id){
  if(currentPage===id)return;
  // ★ 修复：切换页面时强制收起输入法（blur 输入框），避免输入框残留 focus 导致键盘重弹
  try{
    var _inp=document.activeElement;
    if(_inp&&(_inp.id==='msg-inp'||_inp.tagName==='TEXTAREA'||_inp.tagName==='INPUT')){
      _inp.blur();
    }
  }catch(e){}
  if(currentPage==='pg-conv'&&cid&&$('msg-inp')){
    sessionStorage.setItem('msg-inp-'+cid,$('msg-inp').value);
  }
  if(currentPage==='pg-conv'&&id!=='pg-conv'){
    if(longScreenshotMode)cancelLongScreenshot();
    if(favMsgMode)cancelFavMsgMode();
    if(copyMsgMode)cancelCopyMsg();
  }
  currentPage=id;

  // 合并 overlay 关闭和 page 切换，减少 DOM 操作次数
  document.querySelectorAll('.overlay.show').forEach(function(o){
    o.classList.remove('show');
    o.classList.remove('sheet-overlay');
  });

  hideMsgActionMenu();

  var el=$(id);
  if(el){
    // 先移除旧 active，再添加新的
    var prevActive=document.querySelector('.page.active');
    if(prevActive)prevActive.classList.remove('active');
    el.classList.add('active');
  }

  // 合并 updateTabs + updateBottomNavVisibility，使用缓存
  var m={pg_list:'list',pg_moments:'moments',pg_my:'my',pg_more:'more',pg_conv:'list',pg_letters:'my',pg_letter_detail:'my',pg_cards:'my',pg_touch:'my',pg_update_history:'my',pg_usage_guide:'my',pg_storage:'my',pg_giftbox:'my'};
  var a=id.replace(/-/g,'_');var t=m[a]||'list';
  var isConvPage=id==='pg-conv';
  var hideBottomNav=ls('ml2_hide_bottom_nav')||false;
  var hideTabs=isConvPage&&hideBottomNav;
  var tabsData=_getTabsCache();
  tabsData.forEach(function(td){
    td.el.style.display=hideTabs?'none':'flex';
    td.tabs.forEach(function(tb){
      tb.el.classList.toggle('on',tb.type===t);
    });
  });
  var contactSwitcherBtn=$('contact-switcher-btn');
  if(contactSwitcherBtn){
    contactSwitcherBtn.style.display=hideTabs?'flex':'none';
  }
  updateBadges();

  if(id==='pg-moments'){
    requestAnimationFrame(renderMoments);
  }

  if(id!=='pg-conv'){
    document.documentElement.style.setProperty('--chat-bg-image','none');
    var phoneEl=document.querySelector('.phone');
    if(phoneEl)phoneEl.style.background='';
    if(id==='pg-list'){
      var convPg=$('pg-conv');
      if(convPg){
        convPg.style.background='';
        convPg.style.backgroundImage='';
        convPg.style.backgroundAttachment='';
      }
    }
    var msgboxEl=$('msgbox');
    if(msgboxEl){msgboxEl.style.background='';msgboxEl.style.backgroundImage='';msgboxEl.style.backgroundAttachment='';}
    var inputWrapEl=document.querySelector('.input-wrap');
    if(inputWrapEl){inputWrapEl.style.background='';inputWrapEl.style.backgroundImage='';inputWrapEl.style.backgroundAttachment='';}
    var ibarEl=document.querySelector('.ibar');
    if(ibarEl){ibarEl.style.background='';ibarEl.style.backgroundImage='';ibarEl.style.backgroundAttachment='';ibarEl.style.backdropFilter='';ibarEl.style.webkitBackdropFilter='';}
    var navEl=document.querySelector('#pg-conv .nav-extended');
    if(navEl){navEl.style.background='';navEl.style.backgroundImage='';navEl.style.backgroundAttachment='';}
    var navEl2=document.querySelector('#pg-conv .nav');
    if(navEl2){navEl2.style.background='';navEl2.style.backgroundImage='';navEl2.style.backgroundAttachment='';}
    var tabsEl=document.querySelector('#pg-conv .tabs');
    if(tabsEl){tabsEl.style.background='';tabsEl.style.backgroundImage='';tabsEl.style.backgroundAttachment='';tabsEl.style.backdropFilter='';tabsEl.style.webkitBackdropFilter='';}
  }else if(cid){
    var entity=groups.find(function(x){return x.id===cid})||contacts.find(function(x){return x.id===cid});
    if(entity){applyChatSettings(entity)}
    checkNavDisplay().then(function(){refreshNavDisplay()});
  }
  var isChatPage=id==='pg-conv';
  if(currentCall&&$('call-mini-bar')){
    if(isChatPage){minimizeCall()}
    else{$('call-mini-bar').style.display='none';}
  }else if(!currentCall&&$('call-mini-bar')){
    $('call-mini-bar').style.display='none';
  }


  if(showPgCallbacks[id]){showPgCallbacks[id]();}
}
var tabsInitialized=false;
function initTabs(){
  if(tabsInitialized)return;
  tabsInitialized=true;
  var pageMap={chat:'pg-list',moments:'pg-moments',more:'pg-more',settings:'pg-my'};
  var items=typeof bottomNavItems!=='undefined'?bottomNavItems:[
    {id:'chat',name:'聊天',icon:'💬'},{id:'moments',name:'朋友圈',icon:'📸'},{id:'more',name:'更多',icon:'✨'},{id:'settings',name:'设置',icon:'⚙️'}
  ];
  var enabled=typeof customBottomNavEnabled!=='undefined'?customBottomNavEnabled:['chat','moments','more','settings'];
  var customIcons=getCustomIcons();
  document.querySelectorAll('.tabs').forEach(function(el){
    var html='';
    var first=true;
    items.forEach(function(item){
      if(enabled.indexOf(item.id)<0)return;
      var pg=pageMap[item.id]||'';
      var iconHtml=customIcons[item.id]
        ? '<img src="'+customIcons[item.id]+'" style="width:36px;height:36px;object-fit:contain;border-radius:4px;vertical-align:middle;">'
        : item.icon;
      html+='<div class="tab'+(first?' on':'')+'" data-p="'+pg+'"><span class="t-ico">'+iconHtml+'</span><span style="font-size:10px;">'+item.name+'</span></div>';
      first=false;
    });
    el.innerHTML=html;
    var handleTabClick=function(targetPg){
      if(targetPg==='pg-list'){
        if(currentPage==='pg-conv'){
          requestAnimationFrame(function(){showPg('pg-list')});
        }else if(cid){
          requestAnimationFrame(function(){openConv(cid)});
        }else{
          requestAnimationFrame(function(){showPg('pg-list')});
        }
      }else{
        requestAnimationFrame(function(){showPg(targetPg)});
      }
    };
    // 性能优化：移动端只用 touchend（preventDefault 阻止后续 click），
    // 桌面端只用 click，避免双触发导致 showPg 被调用两次
    var isMobile=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    el.querySelectorAll('.tab').forEach(function(tb){
      var pg=tb.dataset.p;
      if(isMobile){
        // 移动端：只用 touchend，preventDefault 阻止合成 click 事件
        tb.addEventListener('touchend',function(e){
          if(window._tsM){window._tsM=false;return;}
          e.preventDefault();
          handleTabClick(pg);
        },{passive:false});
      }else{
        // 桌面端：只用 click
        tb.addEventListener('click',function(e){
          e.preventDefault();
          handleTabClick(pg);
        });
      }
    });
  });
  _invalidateTabsCache(); // tab 内容可能变化，清除缓存
  updateBadges();
}
function updateTabs(pg){
  // showPg 已内联实现此逻辑，这里保留供外部调用，使用缓存
  var m={pg_list:'list',pg_moments:'moments',pg_my:'my',pg_more:'more',pg_conv:'list',pg_letters:'my',pg_letter_detail:'my',pg_cards:'my',pg_touch:'my',pg_update_history:'my',pg_usage_guide:'my',pg_storage:'my',pg_giftbox:'my'};
  var a=pg.replace(/-/g,'_');var t=m[a]||'list';
  var tabsData=_getTabsCache();
  tabsData.forEach(function(td){
    td.tabs.forEach(function(tb){
      tb.el.classList.toggle('on',tb.type===t);
    });
  });
  updateBadges();
}
initTabs();
loadContactOrder();
loadContactOrderAsync();

function updateBottomNavVisibility(){
  var hideBottomNav=ls('ml2_hide_bottom_nav')||false;
  var isConvPage=currentPage==='pg-conv';
  var hideTabs=isConvPage&&hideBottomNav;
  var tabsData=_getTabsCache();
  tabsData.forEach(function(td){
    td.el.style.display=hideTabs?'none':'flex';
  });
  var contactSwitcherBtn=$('contact-switcher-btn');
  if(contactSwitcherBtn){
    contactSwitcherBtn.style.display=hideTabs?'flex':'none';
  }
}

function updateBadges(){
  // 缓存信件未读数 1 秒，避免每次切换 tab 都从 localStorage 读取并解析
  var now=Date.now();
  if(_badgeCache.ts&&now-_badgeCache.ts<1000){
    var lb=$('letter-badge');if(lb)lb.textContent=_badgeCache.unread>0?_badgeCache.unread+' 封':'';
    return;
  }
  var ll=ls(LL)||[];var u=ll.filter(function(l){return!l.r}).length;
  _badgeCache.unread=u;
  _badgeCache.ts=now;
  var lb=$('letter-badge');if(lb)lb.textContent=u>0?u+' 封':'';
}

// ---------- Time ----------
function ft(d){d=d instanceof Date?d:new Date(d);return('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)+':'+('0'+d.getSeconds()).slice(-2)}
function fts(d){d=d instanceof Date?d:new Date(d);return('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)+':'+('0'+d.getSeconds()).slice(-2)}
function fd(d){d=d instanceof Date?d:new Date(d);return d.getFullYear()+'年'+(d.getMonth()+1)+'月'+d.getDate()+'日'}
function flt(ts){var d=new Date(ts),n=new Date();var td=new Date(n.getFullYear(),n.getMonth(),n.getDate()),yd=new Date(td.getTime()-864e5);if(d>=td)return ft(d);if(d>=yd)return'昨天 '+ft(d);if(d.getFullYear()===n.getFullYear())return(d.getMonth()+1)+'/'+d.getDate()+' '+ft(d);return d.getFullYear()+'/'+(d.getMonth()+1)+'/'+d.getDate()+' '+ft(d)}

// ---------- Chat List ----------
function _getMsgPreview(last){
  if(!last)return '';
  if(last.retracted)return '对方撤回了一条消息';
  if(last.isTAHighlight===true){
    var _hlCP=contacts.find(function(x){return x.id===(last.senderId||cid)});
    var _hlName=_hlCP?_hlCP.name:'TA';
    return '✏️ '+_hlName+' 划了想说的重点';
  }
  if(last.isSystem||last.isAvatarChange)return last.t||'';
  if(last.isRedpacket)return '[红包] ¥'+(last.redpacketAmount||'?');
  if(last.isCall)return last.callMessage||'[通话]';
  if(last.isGift===true){
    if(last.isGiftReply===true)return last.t||'';
    return '🎁 '+(last.giftName||'礼物');
  }
  if(last.isTouch){
    var _htCP=_globalHideTouchNames[last.s===SELF?cid:last.senderId]===true;
    var _ts=last.s===SELF?'我':'';
    var _tt=last.touchTarget||'';
    if(_htCP&&last.s!==SELF)_tt='我';
    return _ts+' '+last.touchAction.replace('你',_tt);
  }
  if(last.voice)return '[语音]';
  if(last.img)return '[图片]';
  return last.t||'';
}
function getLastMsgSummary(id){
  var key=LM+id;
  var cached=memoryCache[key];
  var m=[];

  if(cached&&cached.length>0){
    m=cached;
  }else{
    var lsVal=ls(key);
    if(lsVal&&Array.isArray(lsVal)){
      m=lsVal;
    }
  }

  if(m.length>0){
    var last=m[m.length-1];
    if(last){
      var ts=last.ts instanceof Date?last.ts:new Date(last.ts);
      // 优化：从后向前遍历计算未读数，遇到已读消息即停止
      var unread=0;
      for(var ui=m.length-1;ui>=0;ui--){
        var msg=m[ui];
        if(msg.s===SELF||msg.isTouch||msg.isSystem)continue;
        if(msg.read)break;
        unread++;
      }
      return {
        content:_getMsgPreview(last),
        time:ts,
        unread:unread
      };
    }
  }
  return null;
}

// 防抖：防止消息加载过程中连续多次渲染造成卡顿
var _renderChatListTimer=null;
var _renderChatListPending=false;
function renderChatList(){
  _renderChatListPending=true;
  if(_renderChatListTimer)return;
  _renderChatListTimer=setTimeout(function(){
    _renderChatListTimer=null;
    if(!_renderChatListPending)return;
    _renderChatListPending=false;
    _doRenderChatList();
  },30);
}
function _doRenderChatList(){
  var el=$('clist-inner')||$('clist');
  if(!el)return;
  // 仅在联系人列表页(pg-list)时清除聊天背景，避免在聊天页面对话时清除
  if(window.currentPage==='pg-list'){
    document.documentElement.style.setProperty('--chat-bg-image','none');
    var phoneEl=document.querySelector('.phone');
    if(phoneEl){phoneEl.style.background='';phoneEl.style.backgroundImage='';}
    var pgList=$('pg-list');
    if(pgList){pgList.style.background='';pgList.style.backgroundImage='';}
  }
  try{
  var allItems=[];
  
  contacts.forEach(function(c){
    var summary=getLastMsgSummary(c.id);
    var p=summary?summary.content:'',t=summary?flt(summary.time):'';
    var unread=summary?summary.unread:0;

    var av=c.avatar?'<img src="'+c.avatar.replace(/"/g,'&quot;')+'" loading="lazy">':'✦';
    allItems.push({id:c.id,name:c.name,avatar:av,lastMsg:p,time:t,type:'contact',obj:c,unread:unread,lastTs:summary?summary.time:0});
  });
  groups.forEach(function(g){
    var summary=getLastMsgSummary(g.id);
    var p=summary?summary.content:'',t=summary?flt(summary.time):'';
    var unread=summary?summary.unread:0;

    var groupAvatar=g.avatar&&g.avatar.startsWith('data:image')?'<img src="'+g.avatar.replace(/"/g,'&quot;')+'" style="display:block;width:100%;height:100%;object-fit:cover;">':'👥';
    allItems.push({id:g.id,name:g.name,avatar:groupAvatar,lastMsg:p,time:t,type:'group',obj:g,unread:unread,lastTs:summary?summary.time:0});
  });
  if(allItems.length===0){el.innerHTML='<div class="empty">暂无联系人<br><span style="font-size:12px;color:var(--txt3)">点击右上角 + 创建梦角</span></div>';return}
  var sorted=allItems.sort(function(a,b){
    return b.lastTs-a.lastTs;
  });
  el.innerHTML=sorted.map(function(item){
    var isGroup=item.type==='group';
    var unreadBadge=item.unread>0?'<span class="cunread">'+(item.unread>99?'99+':item.unread)+'</span>':'';
    return'<div class="citem" data-id="'+item.id+'" data-type="'+item.type+'"><div class="cwrap"><div class="cav">'+item.avatar+'</div><div class="cinfo"><div class="ct"><div class="cn-wrap"><span class="cn">'+item.name+'</span>'+unreadBadge+'</div><span class="ctm">'+item.time+'</span></div><div class="cp">'+item.lastMsg+'</div></div></div></div>';
  }).join('');

  // 优化：事件委托只绑定一次，避免每次渲染都重新创建函数
  if(!el._chatListBound){
    el._chatListBound=true;
    el.onclick=function(e){
      var w=e.target.closest('.cwrap');
      if(w){
        openConv(w.parentElement.dataset.id,w.parentElement.dataset.type);
      }
    };
    el.ontouchend=function(e){
      e.preventDefault();
      var w=e.target.closest('.cwrap');
      if(w){
        openConv(w.parentElement.dataset.id,w.parentElement.dataset.type);
      }
    };
  }
  }catch(e){
    console.error('renderChatList error:',e);
    el.innerHTML='<div class="empty" style="padding:40px 20px"><div style="font-size:24px;margin-bottom:8px;opacity:0.5;">⚠</div><div style="font-size:13px;color:var(--txt3);">列表渲染出错</div><div style="font-size:11px;color:var(--accent);margin-top:8px;cursor:pointer;text-decoration:underline;" onclick="renderChatList()">点击重试</div></div>';
  }
}

function markMessagesRead(id){
  var m=msgs(id);
  var changed=false;
  var beforeUnread=m.filter(function(msg){return msg.s!==SELF&&!msg.read&&!msg.isTouch&&!msg.isSystem}).length;
  m.forEach(function(msg){
    if(msg.s!==SELF&&!msg.read){
      msg.read=true;
      changed=true;
    }
  });
  var afterUnread=m.filter(function(msg){return msg.s!==SELF&&!msg.read&&!msg.isTouch&&!msg.isSystem}).length;
  if(changed){
    savemsgs(id,m);
    renderChatList();
  }
}

var contactTimelineStyles={};
function getContactTimelineStyle(contactId){
  return contactTimelineStyles[contactId]||'avatar';
}
function setContactTimelineStyle(contactId,style){
  contactTimelineStyles[contactId]=style;
  ls('ml2_timeline_'+contactId,style);
  if(window.localforage){
    try{window.localforage.setItem('ml2_timeline_'+contactId,style)}catch(e){}
  }
  if(cid===contactId)renderMsgs();
}
async function loadContactTimelineStyles(){
  if(window.localforage){
    try{
      var keys=await window.localforage.keys();
      for(var i=0;i<keys.length;i++){
        var key=keys[i];
        if(key&&key.startsWith('ml2_timeline_')){
          var contactId=key.replace('ml2_timeline_','');
          var val=await window.localforage.getItem(key);
          if(val)contactTimelineStyles[contactId]=val;
        }
      }
    }catch(e){}
  }
}

async function retryLoadImg(imgEl,imgKey){
  if(!window.localforage||!imgKey)return;
  // 修复1：检查元素是否仍在DOM中，避免对已分离的元素（被 innerHTML 替换掉的旧元素）继续操作
  // 这是控制台错误持续累积的根源：旧 img 被替换后，其异步 retryLoadImg 仍在运行
  if(!imgEl||!document.contains(imgEl))return;
  // 修复2：重入保护，防止 onload 在真实图片加载完成后再次触发 retryLoadImg
  // 之前 onload 会在 placeholder 加载和真实图片加载时各触发一次，造成冗余的 localforage 查询
  if(imgEl.dataset.retryStarted==='1')return;
  imgEl.dataset.retryStarted='1';
  // 修复3：立即移除 onload 处理器，防止后续 src 变化再次触发
  imgEl.onload=null;
  imgEl.removeAttribute('onload');
  try{
    var imgData=await window.localforage.getItem(imgKey);
    // 再次检查元素是否仍在DOM中（await 期间可能已被替换）
    if(!imgEl||!document.contains(imgEl))return;
    if(imgData){
      memoryCache['_img_'+imgKey]=imgData;
      imgEl.src=imgData;
    }else{
      imgEl.src='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23f0f0f0" width="100" height="100" rx="8"/%3E%3Ctext fill="%23999" font-size="12" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E图片丢失%3C/text%3E%3C/svg%3E';
    }
  }catch(e){
    console.warn('Failed to load img from localforage:',e);
    if(imgEl&&document.contains(imgEl)){
      imgEl.src='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23f0f0f0" width="100" height="100" rx="8"/%3E%3Ctext fill="%23999" font-size="12" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E加载失败%3C/text%3E%3C/svg%3E';
    }
  }
}

async function loadContactMsgImages(id){
  if(!window.localforage)return;
  var key=LM+id;
  var raw=await window.localforage.getItem(key);
  if(!raw)return;
  var msgsData=raw;
  if(typeof raw==='string'){
    try{msgsData=JSON.parse(raw)}catch(e){return;}
  }
  if(!Array.isArray(msgsData))return;
  var promises=[];
  msgsData.forEach(function(msg){
    if(msg.img&&typeof msg.img==='string'&&msg.img.startsWith('ml2_msg_img_')){
      if(!memoryCache['_img_'+msg.img]){
        promises.push(window.localforage.getItem(msg.img).then(function(d){
          if(d){
            memoryCache['_img_'+msg.img]=d;
          }else{
            // 兜底:尝试从localStorage读取(兼容旧版本:直读 + localforage lf前缀)
            try{
              var raw=safeGetItem(msg.img);
              if(!raw)raw=safeGetItem('ml2_lf_'+msg.img);
              if(raw)memoryCache['_img_'+msg.img]=raw;
            }catch(e){}
          }
        }).catch(function(){}));
      }
    }
    if(msg.originalImg&&typeof msg.originalImg==='string'&&msg.originalImg.startsWith('ml2_msg_img_')){
      if(!memoryCache['_img_'+msg.originalImg]){
        promises.push(window.localforage.getItem(msg.originalImg).then(function(d){
          if(d){
            memoryCache['_img_'+msg.originalImg]=d;
          }else{
            try{
              var raw=safeGetItem(msg.originalImg);
              if(!raw)raw=safeGetItem('ml2_lf_'+msg.originalImg);
              if(raw)memoryCache['_img_'+msg.originalImg]=raw;
            }catch(e){}
          }
        }).catch(function(){}));
      }
    }
  });
  if(promises.length)await Promise.all(promises);
}

async function migrateFromMoonlight(){
  var migrated=ls('ml2_migrated_from_moonlight');
  if(migrated)return;
  
  try{
    var oldStore=localforage.createInstance({
      name:'Moonlight',
      version:2.0,
      storeName:'moonlight_data'
    });
    
    var keys=await oldStore.keys();
    if(keys.length===0){
      ls('ml2_migrated_from_moonlight',true);
      return;
    }
    
    console.log('Found Moonlight data, migrating...');
    
    for(var i=0;i<keys.length;i++){
      var key=keys[i];
      var value=await oldStore.getItem(key);
      if(value!==null&&value!==undefined){
        await window.localforage.setItem(key,value);
        if(typeof Storage !== 'undefined' && Storage.cache){
          Storage.cache[key]=value;
        }
      }
    }
    
    await oldStore.clear();
    
    ls('ml2_migrated_from_moonlight',true);
    console.log('Migration from Moonlight completed!');
    
    renderChatList();
  }catch(e){
    console.warn('Failed to migrate from Moonlight:',e);
  }
}

async function loadMsgsToCache(id){
  var key=LM+id;
  var cached=memoryCache[key];
  if(cached && Array.isArray(cached) && cached.length > 0) return;
  
  // 同步从localStorage加载（快速路径）
  var lsVal=ls(key);
  if(lsVal&&Array.isArray(lsVal)&&lsVal.length>0){
    for(var i=0;i<lsVal.length;i++){
      if(!(lsVal[i].ts instanceof Date))lsVal[i].ts=new Date(lsVal[i].ts);
      if(lsVal[i].read===undefined)lsVal[i].read=true;
    }
    memoryCache[key]=lsVal;
    return;
  }
  
  // 异步从IndexedDB加载（慢速路径）
  if(window.localforage){
    try{
      var dbVal=await window.localforage.getItem(key);
      if(dbVal&&Array.isArray(dbVal)&&dbVal.length>0){
        for(var i=0;i<dbVal.length;i++){
          if(!(dbVal[i].ts instanceof Date))dbVal[i].ts=new Date(dbVal[i].ts);
          if(dbVal[i].read===undefined)dbVal[i].read=true;
        }
        memoryCache[key]=dbVal;
        // 回写localStorage（加速下次访问）
        try{ls(key,dbVal);}catch(e){}
      }
    }catch(e){console.warn('loadMsgsToCache localforage failed:',e);}
  }
}

async function preloadAllMsgs(){
  if(!window.localforage)return;
  try{
    var allKeys=await window.localforage.keys();
    var msgKeys=[];
    for(var i=0;i<allKeys.length;i++){
      var k=allKeys[i];
      if(k&&k.indexOf(LM)===0)msgKeys.push(k);
    }
    for(var j=0;j<msgKeys.length;j++){
      var key=msgKeys[j];
      var id=key.substring(LM.length);
      await loadMsgsToCache(id);
    }
  }catch(e){console.warn('preloadAllMsgs failed:',e);}
}

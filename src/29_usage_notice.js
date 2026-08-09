<script>
// ========== 首次访问强制使用须知 ==========
var NOTICE_SEEN_KEY = 'star_usage_notice_seen';
var NOTICE_SEEN_COOKIE = 'star_notice_seen';

function saveNoticeSeen() {
  window._noticeSeen = true;
  try { sessionStorage.setItem(NOTICE_SEEN_KEY, '1'); } catch(e) {}
  try { localStorage.setItem(NOTICE_SEEN_KEY, '1'); } catch(e) {}
  try { document.cookie = NOTICE_SEEN_COOKIE + '=1;path=/;max-age=31536000'; } catch(e) {}
  if(window.localforage){
    try { window.localforage.setItem(NOTICE_SEEN_KEY, '1'); } catch(e) {}
  }
}

function getNoticeSeen() {
  if(window._noticeSeen) return '1';
  try {
    var v = sessionStorage.getItem(NOTICE_SEEN_KEY);
    if(v) return v;
  } catch(e) {}
  try {
    var v = localStorage.getItem(NOTICE_SEEN_KEY);
    if(v) return v;
  } catch(e) {}
  try {
    var cookies = document.cookie ? document.cookie.split(';') : [];
    for(var i = 0; i < cookies.length; i++){
      var c = cookies[i].trim();
      if(c.indexOf(NOTICE_SEEN_COOKIE + '=') === 0) return '1';
    }
  } catch(e) {}
  return null;
}

function finishFirstTimeNotice() {
  try{
    saveNoticeSeen();
    hasEnteredApp=true;
    // 恢复顶部栏和底部导航栏
    var nav = document.getElementById('usage-notice-nav');
    if (nav) nav.style.display = '';
    var tabs = document.getElementById('usage-notice-tabs');
    if (tabs) tabs.style.display = '';
    var phone = document.querySelector('.phone');
    if (phone) {
      phone.style.display = 'flex';
      phone.style.opacity = '1';
    }
    
    // 首次使用须知完成后，进入主界面
    
    // 如果初始化已完成，直接渲染
    if(appInitDone){
      setTimeout(function(){
        try{showPg('pg-list');renderChatList();}catch(e){console.error('finishFirstTimeNotice render error:',e);}
      }, 100);
      return;
    }
    
    // 初始化未完成，显示加载状态并等待
    showPg('pg-list');
    var clistInner = document.getElementById('clist-inner');
    if(clistInner) clistInner.innerHTML = '<div class="empty" style="padding:60px 0"><div style="font-size:40px;margin-bottom:16px;animation:splashPulse 1.5s ease-in-out infinite">✦</div><div style="font-size:14px;color:var(--txt3)">正在加载...</div></div>';
    
    var checkInterval = setInterval(function(){
      if(appInitDone){
        clearInterval(checkInterval);
        try{renderChatList();}catch(e){}
      }
    },200);
    
    setTimeout(function(){
      clearInterval(checkInterval);
      if(!appInitDone) try{renderChatList();}catch(e){}
    },10000);
  }catch(e){
    console.error('finishFirstTimeNotice error:',e);
    var phone=document.querySelector('.phone');
    if(phone){phone.style.display='flex';phone.style.opacity='1';}
    try{showPg('pg-list');renderChatList();}catch(e2){}
  }
}

(function initFirstTimeCheck() {
  try {
    var seen = getNoticeSeen();
    
    if (seen) {
      // 已看过使用须知：改为两个按钮（使用须知 + 进入）
      var splashBtns = document.getElementById('splash-buttons');
      if (splashBtns) {
        splashBtns.innerHTML = '<button id="splash-usage-btn" onclick="showUsageNoticeFromSplash()" style="flex:1;padding:14px;border:1.5px solid #d4c9b8;border-radius:12px;background:rgba(255,255,255,0.7);color:#8c7b6b;font-size:14px;font-weight:500;cursor:pointer;letter-spacing:2px;min-height:48px;touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:all 0.2s;">使用须知</button>' +
          '<button id="splash-enter-btn" onclick="enterApp()" style="flex:1;padding:14px;border:none;border-radius:12px;background:linear-gradient(135deg, #3d3429 0%, #2c2416 100%);color:#fff;font-size:14px;font-weight:500;cursor:pointer;letter-spacing:2px;min-height:48px;touch-action:manipulation;-webkit-tap-highlight-color:transparent;box-shadow:0 2px 8px rgba(44,36,22,0.15);transition:all 0.2s;">进入</button>';
        
        // 为移动端兼容添加 touchend 事件
        var enterBtn = document.getElementById('splash-enter-btn');
        if (enterBtn) {
          enterBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            enterApp();
          });
        }
        var usageBtn = document.getElementById('splash-usage-btn');
        if (usageBtn) {
          usageBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showUsageNoticeFromSplash();
          });
        }
      }
    }
  } catch(e) {
    console.error('initFirstTimeCheck error:', e);
  }
})();
</script>

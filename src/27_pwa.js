<script>
// PWA Service Worker 注册 + 自动更新（部署新版本后自动刷新一次，避免一直跑旧缓存）
(function(){
  if(!('serviceWorker' in navigator))return;
  var APP_VERSION='1.7';
  window.__APP_VERSION=APP_VERSION;

  function doRegister(){
    // file:// 或其他不支持 SW 的协议下静默跳过，不打印报错
    if(!location.protocol||(location.protocol!=='http:'&&location.protocol!=='https:')){
      console.log('SW skipped (unsupported protocol:',location.protocol||'null',')');
      return;
    }
    navigator.serviceWorker.register('sw.js').then(function(reg){
      console.log('SW registered:',reg.scope,'app version',APP_VERSION);
      reg.addEventListener('updatefound',function(){
        var newWorker=reg.installing;
        if(!newWorker)return;
        newWorker.addEventListener('statechange',function(){
          // 新版本已安装，且当前页面仍由旧SW控制 → 自动刷新一次加载新版本
          if(newWorker.state==='installed'&&navigator.serviceWorker.controller){
            if(sessionStorage.getItem('sw_reloaded')!==APP_VERSION){
              sessionStorage.setItem('sw_reloaded',APP_VERSION);
              location.reload();
            }
          }
        });
      });
      if(reg.active){
        flushPendingNotifications();
      }
    }).catch(function(err){
      console.warn('SW registration failed:',err);
    });
  }

  // ★ PWA 安装：捕获 beforeinstallprompt（Chrome/Edge 触发），供应用内"安装应用"按钮调用
  var deferredInstallPrompt=null;
  window.__deferredInstallPrompt=null;
  window.addEventListener('beforeinstallprompt',function(e){
    e.preventDefault();
    deferredInstallPrompt=e;
    window.__deferredInstallPrompt=e;
    // 通知应用可安装
    try{ window.dispatchEvent(new CustomEvent('pwa-installable',{detail:{deferredPrompt:e}})); }catch(err){}
  });
  // 手动触发安装（设置页/开屏"安装应用"按钮调用）
  window.__promptInstall=function(){
    if(deferredInstallPrompt){
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then(function(){deferredInstallPrompt=null;window.__deferredInstallPrompt=null;});
    }else{
      return false;
    }
    return true;
  };
  window.addEventListener('appinstalled',function(){
    deferredInstallPrompt=null;
    window.__deferredInstallPrompt=null;
    try{ window.dispatchEvent(new CustomEvent('pwa-installed')); }catch(err){}
    try{ if(typeof toast==='function') toast('✅ 已安装到桌面'); }catch(err){}
  });

  // 页面加载后若由旧SW控制，先让其失效并刷新以加载新SW
  if(navigator.serviceWorker.controller){
    navigator.serviceWorker.addEventListener('controllerchange',function(){
      if(sessionStorage.getItem('sw_reloaded')!==APP_VERSION){
        sessionStorage.setItem('sw_reloaded',APP_VERSION);
        location.reload();
      }
    });
  }
  doRegister();

  // 通话小框拖拽 + 「−」按钮（此脚本在 mini-bar DOM 后执行，元素一定存在）
  (function(){
    var bar=$('call-mini-bar');
    var btn=$('call-mini-expand-btn');
    if(!bar||!btn)return;
    var dragStarted=false,moved=false,startX=0,startY=0,origLeft=0,origTop=0;
    var lastTouchTime=0;
    function onDown(e){
      if(e.target===btn)return;
      // 忽略 touchend 之后浏览器模拟的 mousedown，防止重置拖拽状态
      if(e.type==='mousedown'&&Date.now()-lastTouchTime<500)return;
      if(e.type==='touchstart')lastTouchTime=Date.now();
      dragStarted=true;moved=false;
      var p=e.touches?e.touches[0]:e;
      startX=p.clientX;startY=p.clientY;
      var r=bar.getBoundingClientRect();origLeft=r.left;origTop=r.top;
      bar.style.cursor='grabbing';
    }
    function onMove(e){
      if(!dragStarted)return;
      var p=e.touches?e.touches[0]:e;
      if(Math.abs(p.clientX-startX)>5||Math.abs(p.clientY-startY)>5){
        moved=true;
        if(e.cancelable)e.preventDefault();
        // 使用原始位置 + 总偏移量，避免累积计算导致跳跃
        var dx=p.clientX-startX,dy=p.clientY-startY;
        bar.style.left=(Math.max(4,Math.min(origLeft+dx,window.innerWidth-bar.offsetWidth-4)))+'px';
        bar.style.top=(Math.max(4,Math.min(origTop+dy,window.innerHeight-bar.offsetHeight-4)))+'px';
        bar.style.bottom='auto';bar.style.transform='none';
      }
    }
    function onUp(e){
      // 忽略 touchend 之后浏览器模拟的 mouseup
      if(e&&e.type==='mouseup'&&Date.now()-lastTouchTime<500)return;
      if(dragStarted){
        dragStarted=false;
        bar.style.cursor='grab';
        if(moved)callMiniBarPos={left:bar.style.left,top:bar.style.top,bottom:bar.style.bottom,transform:bar.style.transform};
      }
    }
    bar.addEventListener('mousedown',onDown);
    bar.addEventListener('touchstart',onDown,{passive:true});
    document.addEventListener('mousemove',onMove);
    document.addEventListener('touchmove',onMove,{passive:false});
    document.addEventListener('mouseup',onUp);
    // 使用 capture:true 注册 touchend/touchcancel，确保在全局防误触的
    // stopPropagation 之前执行（全局处理器在 capture 阶段调用 stopPropagation
    // 会阻止 bubble 阶段的监听器，导致 onUp 不执行、拖拽无法固定）
    document.addEventListener('touchend',onUp,{capture:true});
    document.addEventListener('touchcancel',onUp,{capture:true});
    bar.addEventListener('click',function(e){
      if(e.target===btn||moved)return;
      if(currentCall){bar.style.display='none';showOv('ov-calling');}
      else{bar.style.display='none';}
    });
    var expandMini=function(e){
      if(e&&e.stopPropagation)e.stopPropagation();
      if(isSwipe())return;
      if(currentCall){bar.style.display='none';showOv('ov-calling');}
      else{bar.style.display='none';}
    };
    btn.addEventListener('click',expandMini);
  })();
})();

// 通话背景图片上传（在半框页面中）
function handleCallBgUpload(event) {
  var file = event.target.files[0];
  if (!file) return;
  var contactId = currentCall ? currentCall.contactId : null;
  if (!contactId) { toast('无法获取联系人信息'); return; }
  var reader = new FileReader();
  reader.onload = function() {
    var dataUrl = reader.result;
    ls('ml2_call_bg_' + contactId, dataUrl);
    var bg = $('calling-bg');
    if (bg) bg.style.backgroundImage = 'url(' + dataUrl + ')';
    toast('通话背景已更新');
  };
  reader.readAsDataURL(file);
}

function clearCallBg() {
  var contactId = currentCall ? currentCall.contactId : null;
  if (!contactId) { toast('无法获取联系人信息'); return; }
  ls('ml2_call_bg_' + contactId, '');
  var bg = $('calling-bg');
  if (bg) bg.style.backgroundImage = '';
  toast('通话背景已清除');
}

// 积压通知队列（SW 未就绪时暂存）
var pendingNotifications=[];
function flushPendingNotifications(){
  if(!navigator.serviceWorker||!navigator.serviceWorker.controller)return;
  if(pendingNotifications.length===0)return;
  while(pendingNotifications.length>0){
    var pn=pendingNotifications.shift();
    try{
      navigator.serviceWorker.controller.postMessage({
        type:'SHOW_NOTIFICATION',
        title:pn.title,
        body:pn.body,
        icon:pn.icon||''
      });
    }catch(e){}
  }
}

// visibilitychange 监听：用户切回前台时发送积压通知
document.addEventListener('visibilitychange',function(){
  if(document.visibilityState==='visible'){
    flushPendingNotifications();
  }
});

function d2ShowPage(pageId) {
  var el = $(pageId);
  if (el) { el.style.display = 'flex'; el.classList.add('d2-active'); }
}
function d2HidePage(pageId) {
  var el = $(pageId);
  if (el) { el.style.display = 'none'; el.classList.remove('d2-active'); }
}
// ================================================================
        //  数据：雷诺曼 36 张 + 塔罗大阿尔卡纳 22 张
        // ================================================================

        const LENORMAND = [
            { id: 1,  name: '骑士',    file: '1.骑士.jpg' },
            { id: 2,  name: '四叶草',  file: '2.四叶草.jpg' },
            { id: 3,  name: '船',      file: '3.船.jpg' },
            { id: 4,  name: '房子',    file: '4.房子.jpg' },
            { id: 5,  name: '树',      file: '5.树.jpg' },
            { id: 6,  name: '云',      file: '6.云.jpg' },
            { id: 7,  name: '蛇',      file: '7.蛇.jpg' },
            { id: 8,  name: '棺材',    file: '8.棺材.jpg' },
            { id: 9,  name: '花束',    file: '9.花束.jpg' },
            { id: 10, name: '镰刀',    file: '10.镰刀.jpg' },
            { id: 11, name: '鞭子',    file: '11.鞭子.jpg' },
            { id: 12, name: '鸟',      file: '12.鸟.jpg' },
            { id: 13, name: '孩子',    file: '13.孩子.jpg' },
            { id: 14, name: '狐狸',    file: '14.狐狸.jpg' },
            { id: 15, name: '熊',      file: '15.熊.jpg' },
            { id: 16, name: '星星',    file: '16.星星.jpg' },
            { id: 17, name: '鹤',      file: '17.鹤.jpg' },
            { id: 18, name: '狗',      file: '18.狗.jpg' },
            { id: 19, name: '塔',      file: '19.塔.jpg' },
            { id: 20, name: '花园',    file: '20.花园.jpg' },
            { id: 21, name: '山',      file: '21.山.jpg' },
            { id: 22, name: '路口',    file: '22.路口.jpg' },
            { id: 23, name: '老鼠',    file: '23.老鼠.jpg' },
            { id: 24, name: '心',      file: '24.心.jpg' },
            { id: 25, name: '戒指',    file: '25.戒指.jpg' },
            { id: 26, name: '信',      file: '26.信.jpg' },
            { id: 27, name: '书',      file: '27.书.jpg' },
            { id: 28, name: '男人',    file: '28.男人.jpg' },
            { id: 28, name: '男人',    file: '28.男人 (2).jpg' },
            { id: 29, name: '女人',    file: '29.女人.jpg' },
            { id: 29, name: '女人',    file: '29.女人 (2).jpg' },
            { id: 30, name: '百合',    file: '30.百合.jpg' },
            { id: 31, name: '太阳',    file: '31.太阳.jpg' },
            { id: 32, name: '月亮',    file: '32.月亮.jpg' },
            { id: 33, name: '钥匙',    file: '33.钥匙.jpg' },
            { id: 34, name: '鱼',      file: '34.鱼.jpg' },
            { id: 35, name: '锚',      file: '35.锚.jpg' },
            { id: 36, name: '十字架',  file: '36.十字架.jpg' },
            { id: 37, name: '灵体',    file: '37.灵体.jpg' },
            { id: 38, name: '香炉',    file: '38.香炉.jpg' },
            { id: 39, name: '床',      file: '39.床.jpg' },
            { id: 40, name: '市场',    file: '40.市场.jpg' }
        ];

        // 大阿尔卡纳 22 张
        const MAJOR_ARCANA = [
            { id: 0,  name: '愚者',      file: '0愚人.png' },
            { id: 1,  name: '魔术师',    file: '1魔术师.png' },
            { id: 2,  name: '女祭司',    file: '2女祭司.png' },
            { id: 3,  name: '皇后',      file: '3皇后.png' },
            { id: 4,  name: '皇帝',      file: '4皇帝.png' },
            { id: 5,  name: '教皇',      file: '5教皇.png' },
            { id: 6,  name: '恋人',      file: '6恋人.png' },
            { id: 7,  name: '战车',      file: '7战车.png' },
            { id: 8,  name: '力量',      file: '8力量.png' },
            { id: 9,  name: '隐士',      file: '9隐士.png' },
            { id: 10, name: '命运之轮',  file: '10命运之轮.png' },
            { id: 11, name: '正义',      file: '11正义.png' },
            { id: 12, name: '倒吊人',    file: '12倒吊人.png' },
            { id: 13, name: '死神',      file: '13死神.png' },
            { id: 14, name: '节制',      file: '14节制.png' },
            { id: 15, name: '恶魔',      file: '15恶魔.png' },
            { id: 16, name: '高塔',      file: '16塔.png' },
            { id: 17, name: '星星',      file: '17星星.png' },
            { id: 18, name: '月亮',      file: '18月亮.png' },
            { id: 19, name: '太阳',      file: '19太阳.png' },
            { id: 20, name: '审判',      file: '20审判.png' },
            { id: 21, name: '世界',      file: '21世界.png' }
        ];

        // 小阿尔卡纳 56 张（圣杯/权杖/宝剑/星币 各14张）
        const MINOR_ARCANA = [];
        const SUITS = ['圣杯', '权杖', '宝剑', '星币'];
        const COURTS = ['侍从', '骑士', '王后', '国王'];
        let minorId = 22;
        SUITS.forEach(suit => {
            for (let i = 1; i <= 10; i++) {
                MINOR_ARCANA.push({ id: minorId++, name: suit + i, file: suit + i + '.png' });
            }
            COURTS.forEach(court => {
                MINOR_ARCANA.push({ id: minorId++, name: suit + court, file: suit + court + '.png' });
            });
        });

        // 合并：78 张完整塔罗牌
        const TAROT = [...MAJOR_ARCANA, ...MINOR_ARCANA];

        // 合并：全部牌（塔罗78 + 雷诺曼40）
        const ALL_CARDS = [...TAROT, ...LENORMAND];

        // 图片基础路径（使用内联Base64数据）
        const IMG_BASE = '';
        const IMG_BASE_LEN = '';
        const getCardImage = function(filename, isTarot) {
            if (typeof TAROT_IMAGES !== 'undefined' && isTarot && TAROT_IMAGES[filename]) {
                return TAROT_IMAGES[filename];
            }
            if (typeof LENORMAND_IMAGES !== 'undefined' && !isTarot && LENORMAND_IMAGES[filename]) {
                return LENORMAND_IMAGES[filename];
            }
            return (isTarot ? '塔罗牌电子牌面/' : '雷诺曼牌电子牌面/') + filename;
        };

        // ================================================================
        //  抽牌模式配置
        // ================================================================
        const MIXED_STEPS = [
            { label: 'TA的回应', deck: 'lenormand', countRange: [1, 5], useReverse: false, emoji: '📬' },
            { label: 'TA的情绪', deck: 'tarot', countRange: [3, 3], useReverse: true, emoji: '💭' },
            { label: 'TA的秘密', deck: 'tarot', countRange: [1, 3], useReverse: true, emoji: '🔮' }
        ];

        const FREE_STEPS = [
            { label: 'TA的回应', deck: 'lenormand', countRange: [1, 5], useReverse: false, emoji: '📬', key: 'reply' },
            { label: 'TA的情绪', deck: 'tarot', countRange: [1, 3], useReverse: true, emoji: '💭', key: 'mood' },
            { label: 'TA的秘密', deck: 'tarot', countRange: [1, 3], useReverse: true, emoji: '🔮', key: 'secret' }
        ];

        // ================================================================
        //  全局抽牌状态
        // ================================================================
        const d2DrawState = {
            mode: 'mixed',
            subMode: 'random',
            question: '',
            contactId: '',
            contactName: '',
            mixedStep: 0,
            mixedAllResults: [],
            drawCount: 0,
            drawnSoFar: 0,
            deckType: 'lenormand',
            useReverse: false,
            currentResults: [],
            isDrawing: false,
            phase: 'idle',
            animId: null
        };

        // DOM 引用
        const homePage = $('d2-page-home');
        const drawPage = $('d2-page-draw');
        const questionInput = $('d2-questionInput');
        const contactSelect = $('d2-contactSelect');
        const btnStart = $('d2-btnStart');
        const btnBack = $('d2-btnBack');
        const drawTitle = $('d2-drawTitle');
        const drawCount = $('d2-drawCount');
        const questionDisplay = $('d2-questionDisplay');
        const drawQuestion = $('d2-drawQuestion');
        const shuffleBox = $('d2-shuffleBox');
        const resultArea = $('d2-resultArea');
        const resultGrid = $('d2-resultGrid');
        const btnRedraw = $('d2-btnRedraw');
        const btnNext = $('d2-btnNext');
        const flowHint = $('d2-flowHint');
        const drawPileArea = $('d2-drawPileArea');
        const cardGrid = $('d2-cardGrid');
        const cardRow1 = $('d2-cardRow1');
        const cardRow2 = $('d2-cardRow2');
        const pileHint = $('d2-pileHint');
        const drawnCards = $('d2-drawnCards');
        const freeFinishBtn = $('d2-freeFinishBtn');
        const modeTabs = $('d2-modeTabs');
        const drawOptions = $('d2-drawOptions');
        const homeSub = $('d2-homeSub');

        // ================================================================
        //  牌轮相关变量
        // ================================================================
        let d2PileRemaining = [];
        let d2PileIsTarot = false;

        // 抽牌历史记录（使用独立的存储键，避免与旧占卜系统冲突）
        let d2DrawHistory = [];
        try { const saved = localStorage.getItem('ml2_divine_history_d2'); if (saved) d2DrawHistory = JSON.parse(saved); } catch(e) {}
        function d2SaveHistory() { try { localStorage.setItem('ml2_divine_history_d2', JSON.stringify(d2DrawHistory)); } catch(e) {} }
        // ★ 全局入口：AI 占卜解读结果存进占卜历史（最新一条）并同步聊天记录
        window.d2SaveAiInterpret = function(text) {
          try {
            if (text && d2DrawHistory.length > 0) {
              d2DrawHistory[0].aiInterpret = text;
              d2SaveHistory();
            }
            // 同步到主占卜历史（ml2_divine_history）
            try {
              var mainHist = [];
              try { var mh = localStorage.getItem('ml2_divine_history'); if (mh) mainHist = JSON.parse(mh); } catch(e2){}
              if (mainHist.length > 0) {
                var nowStr2 = new Date().toLocaleString('zh-CN');
                var rec2 = mainHist.find(function(h){ return h.time === nowStr2 || (h.aiInterpret === undefined && (h.results || h.phases || h.cards)); });
                if (rec2) { rec2.aiInterpret = text; }
                localStorage.setItem('ml2_divine_history', JSON.stringify(mainHist));
              }
            } catch(e3){}
            // 同步聊天记录：当前聊天里插入一条 TA 的解读消息
            try {
              if (typeof cid !== 'undefined' && cid && typeof msgs === 'function' && typeof savemsgs === 'function') {
                var mm = msgs(cid);
                if (!mm || !Array.isArray(mm)) mm = [];
                var aiMsg = {id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9), s:OTHER, t:'📜 占卜解读：\n'+text, ts:new Date(), pc:false, isAuto:true, isInitiative:false, quote:null, isSticker:false, isVoice:false, senderName:'TA', senderId:cid, read:(cid===window.currentCid), isAiInterpret:true};
                mm.push(aiMsg);
                savemsgs(cid, mm);
                if (cid === window.currentCid && typeof renderMsgs === 'function') renderMsgs(mm);
                if (typeof renderChatList === 'function') renderChatList();
              }
            } catch(e4){}
          } catch(e) { console.warn('d2SaveAiInterpret failed:', e); }
        };

        // 修复：同步 d2 记录到主占卜历史(divineHistory)，使梦角主页能看到占卜记录
        function d2SyncToMainHistory(d2Record) {
            try {
                if (typeof divineHistory === 'undefined' || !Array.isArray(divineHistory)) {
                    if (typeof loadDivineHistory === 'function') { try{loadDivineHistory();}catch(e){} }
                    if (typeof divineHistory === 'undefined' || !Array.isArray(divineHistory)) divineHistory = [];
                }
                // 构建 text 文本表示
                var textParts = [];
                var totalCount = 0;
                if (d2Record.results) {
                    // 单步结果
                    d2Record.results.forEach(function(r) {
                        textParts.push('【' + r.name + '】' + (r.reversed ? '逆位' : ''));
                        totalCount++;
                    });
                } else if (d2Record.phases) {
                    // 多步结果
                    d2Record.phases.forEach(function(phase) {
                        textParts.push('--- ' + phase.label + ' ---');
                        phase.results.forEach(function(r) {
                            textParts.push('【' + r.name + '】' + (r.reversed ? '逆位' : ''));
                            totalCount++;
                        });
                    });
                }
                var mainRecord = {
                    id: Date.now(),
                    time: d2Record.time || new Date().toLocaleString('zh-CN'),
                    contactId: d2Record.contactId || null,
                    contactName: d2Record.contactName || '对方',
                    question: d2Record.question || '无',
                    mode: d2Record.mode === 'tarot' ? 'tarot' : (d2Record.mode === 'lenormand' ? 'lenormand' : 'mixed'),
                    count: totalCount,
                    drawn: [],
                    text: textParts.join('\n'),
                    _source: 'd2'
                };
                // 检查是否已存在相同记录（避免重复）
                var existing = divineHistory.find(function(h) {
                    return h && h.contactId === mainRecord.contactId && h.question === mainRecord.question && h.time === mainRecord.time;
                });
                if (!existing) {
                    divineHistory.unshift(mainRecord);
                    if (typeof _persistDivineHistory === 'function') { try { _persistDivineHistory(); } catch(e) {} }
                }
            } catch(e) { console.warn('d2SyncToMainHistory error:', e); }
        }

        // ================================================================
        //  工具函数
        // ================================================================
        function d2ShuffleArr(arr) {
            const a = [...arr];
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        }
        function d2Rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
        function d2GetDeck(deckType) { return deckType === 'tarot' ? TAROT : LENORMAND; }
        function d2GetDeckLabel(deckType) { return deckType === 'tarot' ? '塔罗牌' : '雷诺曼牌'; }

        // ================================================================
        //  更新流程指示器（仅混合模式）
        // ================================================================
        function d2UpdateFlowSteps() {
            const steps = flowHint.querySelectorAll('.d2-step');
            steps.forEach((el, idx) => {
                el.classList.remove('d2-active', 'd2-done');
                if (idx < d2DrawState.mixedStep) el.classList.add('d2-done');
                else if (idx === d2DrawState.mixedStep) el.classList.add('d2-active');
            });
        }

        // ================================================================
        //  开始抽牌流程
        // ================================================================
        function d2StartDrawSequence(question, drawType) {
            d2DrawState.question = question.trim() || '（未写下问题）';
            questionDisplay.textContent = d2DrawState.question;
            drawQuestion.style.display = 'block';

            d2HidePage('d2-page-home');
            d2ShowPage('d2-page-draw');

            d2DrawState.phase = 'idle';
            d2DrawState.isDrawing = false;
            d2DrawState.animId = null;
            d2PileRemaining = [];
            resultArea.classList.add('d2-hidden');
            resultGrid.innerHTML = '';
            shuffleBox.classList.add('d2-hidden');
            shuffleBox.innerHTML = '';
            drawPileArea.classList.add('d2-hidden');
            cardRow1.innerHTML = '';
            cardRow2.innerHTML = '';
            drawnCards.innerHTML = '';
            btnRedraw.disabled = false;

            if (d2DrawState.mode === 'mixed') {
                d2DrawState.mixedStep = 0;
                d2DrawState.mixedAllResults = [];
                flowHint.classList.remove('d2-hidden');
                btnNext.style.display = '';
                btnNext.disabled = true;
                d2UpdateFlowSteps();
                if (d2DrawState.subMode === 'free') {
                    d2StartFreeStep();
                } else {
                    d2StartMixedStep();
                }
            } else {
                flowHint.classList.add('d2-hidden');
                btnNext.style.display = 'none';
                const parts = drawType.split('-');
                d2DrawState.deckType = parts[0];
                d2DrawState.drawCount = parseInt(parts[1]);
                d2DrawState.useReverse = (d2DrawState.deckType === 'tarot');
                d2DrawState.currentResults = [];
                setTimeout(() => d2DoDraw(), 400);
            }
        }

        function d2StartMixedStep() {
            const step = MIXED_STEPS[d2DrawState.mixedStep];
            d2DrawState.deckType = step.deck;
            d2DrawState.drawCount = d2Rand(step.countRange[0], step.countRange[1]);
            d2DrawState.useReverse = step.useReverse;
            d2DrawState.currentResults = [];
            d2DrawState.drawnSoFar = 0;
            d2DrawState.isDrawing = false;
            d2DrawState.animId = null;
            d2PileRemaining = [];
            resultArea.classList.add('d2-hidden');
            resultGrid.innerHTML = '';
            shuffleBox.classList.add('d2-hidden');
            shuffleBox.innerHTML = '';
            drawPileArea.classList.add('d2-hidden');
            cardRow1.innerHTML = '';
            cardRow2.innerHTML = '';
            drawnCards.innerHTML = '';

            drawTitle.textContent = step.emoji + ' ' + step.label;
            drawCount.textContent = '最多 ' + d2DrawState.drawCount + ' 张';
            d2UpdateFlowSteps();
            btnNext.disabled = true;
            btnRedraw.disabled = false;

            setTimeout(() => d2DoDraw(), 400);
        }

        function d2StartFreeStep() {
            const step = FREE_STEPS[d2DrawState.mixedStep];
            d2DrawState.deckType = step.deck;
            d2DrawState.drawCount = step.countRange[1];
            d2DrawState.useReverse = step.useReverse;
            d2DrawState.currentResults = [];
            d2DrawState.drawnSoFar = 0;
            d2DrawState.isDrawing = false;
            d2DrawState.animId = null;
            d2PileRemaining = [];
            resultArea.classList.add('d2-hidden');
            resultGrid.innerHTML = '';
            shuffleBox.classList.add('d2-hidden');
            shuffleBox.innerHTML = '';
            drawPileArea.classList.add('d2-hidden');
            cardRow1.innerHTML = '';
            cardRow2.innerHTML = '';
            drawnCards.innerHTML = '';
            if (freeFinishBtn) freeFinishBtn.style.display = 'none';

            drawTitle.textContent = step.emoji + ' ' + step.label + ' (自由抽牌)';
            drawCount.textContent = '0 / 最多 ' + d2DrawState.drawCount + ' 张';
            d2UpdateFlowSteps();
            btnNext.disabled = true;
            btnRedraw.disabled = false;

            setTimeout(() => d2DoDraw(), 400);
        }

        function d2DoDraw() {
            if (d2DrawState.isDrawing) return;
            d2DrawState.isDrawing = true;
            d2DrawState.drawnSoFar = 0;
            d2DrawState.currentResults = [];
            d2DrawState.animId = null;

            btnRedraw.disabled = true;
            btnNext.disabled = true;

            resultArea.classList.add('d2-hidden');
            resultGrid.innerHTML = '';
            shuffleBox.innerHTML = '';
            shuffleBox.classList.remove('d2-hidden');
            drawPileArea.classList.add('d2-hidden');
            drawnCards.innerHTML = '';

            const deck = d2GetDeck(d2DrawState.deckType);
            d2PileIsTarot = (d2DrawState.deckType === 'tarot');

            // ★ 展示全部牌库，用户自由选牌
            d2PileRemaining = d2ShuffleArr(deck);

            d2DrawState.phase = 'drawing';
            drawCount.textContent = '0 / ' + d2DrawState.drawCount;

            d2ShowShuffleAnimation(deck.length, () => {
                shuffleBox.classList.add('d2-hidden');
                shuffleBox.innerHTML = '';
                d2ShowPile();
            });
        }

        // ================================================================
        //  洗牌动画
        // ================================================================
        function d2ShowShuffleAnimation(total, onDone) {
            shuffleBox.classList.remove('d2-hidden');
            shuffleBox.innerHTML = '';
            const box = shuffleBox;
            const count = Math.min(total + 6, 24);
            const cards = [];
            for (let i = 0; i < count; i++) {
                const el = document.createElement('div');
                el.className = 'd2-shuffle-card-fly d2-back';
                const size = 55 + d2Rand(0, 25);
                const x = d2Rand(-90, 90);
                const y = d2Rand(-70, 70);
                const rot = d2Rand(-50, 50);
                el.style.width = size + 'px';
                el.style.height = (size * 1.6) + 'px';
                el.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
                el.style.opacity = 0.3 + Math.random() * 0.5;
                el.style.zIndex = count - i;
                box.appendChild(el);
                cards.push(el);
            }
            requestAnimationFrame(() => {
                cards.forEach((el, i) => {
                    const t = (i / cards.length) * 2.5;
                    setTimeout(() => {
                        const px = (Math.random() - 0.5) * 140;
                        const py = (Math.random() - 0.5) * 100;
                        const pr = (Math.random() - 0.5) * 70;
                        el.style.transform = `translate(${px}px, ${py}px) rotate(${pr}deg) scale(0.9)`;
                        el.style.opacity = 0.5 + Math.random() * 0.5;
                    }, t * 400);
                });
            });
            setTimeout(() => {
                cards.forEach((el, i) => {
                    const delay = i * 0.06;
                    setTimeout(() => {
                        const offX = (i - cards.length / 2) * 0.8;
                        const offY = (i - cards.length / 2) * 1.2;
                        el.style.transform = `translate(${offX}px, ${offY}px) rotate(0deg) scale(0.98)`;
                        el.style.opacity = 0.9;
                        el.style.zIndex = cards.length - i;
                    }, delay * 180);
                });
            }, 1600);
            setTimeout(() => {
                if (onDone) onDone();
            }, 2000);
        }

        // ================================================================
        //  显示两行牌网格
        // ================================================================
        function d2ShowPile() {
            drawPileArea.classList.remove('d2-hidden');
            d2RenderCardGrid();
            d2UpdatePileHint();
        }

        function d2RenderCardGrid() {
            cardRow1.innerHTML = '';
            cardRow2.innerHTML = '';
            const total = d2PileRemaining.length;
            if (total === 0) return;
            const half = Math.ceil(total / 2);
            for (let i = 0; i < total; i++) {
                const el = document.createElement('div');
                el.className = 'd2-grid-card';
                el.setAttribute('data-idx', i);
                el.addEventListener('click', function() {
                    var idx = parseInt(this.getAttribute('data-idx'));
                    d2DrawOneCardFromPile(idx);
                });
                if (i < half) {
                    cardRow1.appendChild(el);
                } else {
                    cardRow2.appendChild(el);
                }
            }
        }

        function d2UpdatePileHint() {
            if (d2DrawState.mode === 'mixed' && d2DrawState.subMode === 'free') {
                pileHint.textContent = '点击牌背抽取 · 剩 ' + d2PileRemaining.length + ' 张 · 已抽 ' + d2DrawState.drawnSoFar + ' / 最多 ' + d2DrawState.drawCount + ' 张';
                if (freeFinishBtn) {
                    freeFinishBtn.style.display = d2DrawState.drawnSoFar > 0 ? 'block' : 'none';
                }
            } else {
                pileHint.textContent = '点击牌背抽取 · 剩 ' + d2PileRemaining.length + ' 张 · 可抽 ' + (d2DrawState.drawCount - d2DrawState.drawnSoFar) + ' 张';
                if (freeFinishBtn) freeFinishBtn.style.display = 'none';
            }
        }

        function d2FinishFreeStep() {
            if (d2DrawState.currentResults.length === 0) return;
            d2OnDrawComplete();
        }

        // ================================================================//  从网格中抽出一张牌
        // ================================================================
        function d2DrawOneCardFromPile(pileIdx) {
            if (pileIdx < 0 || pileIdx >= d2PileRemaining.length) return;
            if (d2DrawState.drawnSoFar >= d2DrawState.drawCount) return;

            // 从牌堆中移除该牌
            const card = d2PileRemaining.splice(pileIdx, 1)[0];
            d2DrawState.drawnSoFar++;
            if (d2DrawState.mode === 'mixed' && d2DrawState.subMode === 'free') {
                drawCount.textContent = '已抽 ' + d2DrawState.drawnSoFar + ' / 最多 ' + d2DrawState.drawCount + ' 张';
            } else {
                drawCount.textContent = d2DrawState.drawnSoFar + ' / ' + d2DrawState.drawCount;
            }

            // 随机决定正逆位（仅塔罗牌）
            const isRev = d2DrawState.useReverse ? Math.random() < 0.5 : false;
            const result = {
                card,
                reversed: isRev,
                type: d2DrawState.deckType === 'tarot' ? '塔罗' : '雷诺曼'
            };
            d2DrawState.currentResults.push(result);

            // 重新渲染网格
            if (d2PileRemaining.length > 0) {
                d2RenderCardGrid();
                d2UpdatePileHint();
            } else {
                cardRow1.innerHTML = '';
                cardRow2.innerHTML = '';
                pileHint.textContent = '牌库已空';
            }

            // 渲染抽出的牌到drawnCards区域
            const div = document.createElement('div');
            div.className = 'd2-drawn-card-item';
            let imgHTML = '';
            if (d2PileIsTarot) {
                const revClass = isRev ? ' d2-rev' : '';
                imgHTML = '<div class="d2-dc-img' + revClass + '"><img src="' + getCardImage(card.file, true) + '" alt="' + card.name + '" draggable="false"></div>';
            } else {
                imgHTML = '<div class="d2-dc-img"><img src="' + getCardImage(card.file, false) + '" alt="' + card.name + '" draggable="false"></div>';
            }
            div.innerHTML = imgHTML +
                '<div class="d2-dc-name">' + card.name + '</div>' +
                (d2PileIsTarot ? '<div class="d2-dc-pos ' + (isRev ? 'd2-down' : 'd2-up') + '">' + (isRev ? '逆位' : '正位') + '</div>' : '');
            drawnCards.appendChild(div);

            // 抽够数量或牌库空 → 完成
            if (d2DrawState.drawnSoFar >= d2DrawState.drawCount || d2PileRemaining.length === 0) {
                setTimeout(d2OnDrawComplete, 600);
            }
        }

        function d2OnDrawComplete() {
            d2RenderResult(d2DrawState.currentResults);
            resultArea.classList.remove('d2-hidden');
            drawPileArea.classList.add('d2-hidden');
            drawnCards.innerHTML = '';
            cardRow1.innerHTML = '';
            cardRow2.innerHTML = '';
            if (freeFinishBtn) freeFinishBtn.style.display = 'none';

            d2DrawState.isDrawing = false;
            d2DrawState.phase = 'result';
            btnRedraw.disabled = false;
            d2ShowResultButtons();

            const isMultiStep = d2DrawState.mode === 'mixed';

            if (!isMultiStep) {
                const record = {
                    time: new Date().toLocaleString('zh-CN'),
                    mode: d2DrawState.mode,
                    question: d2DrawState.question,
                    contactId: d2DrawState.contactId,
                    contactName: d2DrawState.contactName,
                    results: d2DrawState.currentResults.map(r => ({ name: r.card.name, reversed: r.reversed, type: r.type, file: r.card.file }))
                };
                d2DrawHistory.unshift(record);
                d2SaveHistory();
                d2SyncToMainHistory(record);
            }

            if (isMultiStep) {
                const isFreeSub = d2DrawState.subMode === 'free';
                const steps = isFreeSub ? FREE_STEPS : MIXED_STEPS;
                const startFunc = isFreeSub ? d2StartFreeStep : d2StartMixedStep;
                const showAllFunc = isFreeSub ? d2ShowAllFreeResults : d2ShowAllMixedResults;

                d2DrawState.mixedAllResults.push({
                    step: d2DrawState.mixedStep,
                    label: steps[d2DrawState.mixedStep].label,
                    results: [...d2DrawState.currentResults]
                });

                const nextStep = d2DrawState.mixedStep + 1;
                if (nextStep >= steps.length) {
                    btnNext.textContent = '✨ 查看全部结果';
                    btnNext.disabled = false;
                    btnNext.onclick = showAllFunc;
                } else {
                    btnNext.textContent = '继续 → ' + steps[nextStep].emoji + ' ' + steps[nextStep].label;
                    btnNext.disabled = false;
                    btnNext.onclick = function() {
                        d2DrawState.mixedStep = nextStep;
                        resultArea.classList.add('d2-hidden');
                        resultGrid.innerHTML = '';
                        drawnCards.innerHTML = '';
                        startFunc();
                    };
                }
            } else {
                btnNext.style.display = 'none';
            }
        }

        function d2ShowAllMixedResults() {
            resultArea.classList.remove('d2-hidden');
            resultGrid.innerHTML = '';

            const nowStr = new Date().toLocaleString('zh-CN');
            const existingRecord = d2DrawHistory.find(function(h) {
                return h.mode === 'mixed' && h.question === d2DrawState.question && h.time === nowStr && h.subMode === d2DrawState.subMode;
            });
            if (!existingRecord) {
                const record = {
                    time: nowStr,
                    mode: 'mixed',
                    subMode: d2DrawState.subMode,
                    question: d2DrawState.question,
                    contactId: d2DrawState.contactId,
                    contactName: d2DrawState.contactName,
                    phases: d2DrawState.mixedAllResults.map(phase => ({
                        label: phase.label,
                        results: phase.results.map(r => ({ name: r.card.name, reversed: r.reversed, type: r.type, file: r.card.file }))
                    }))
                };
                d2DrawHistory.unshift(record);
                d2SaveHistory();
                d2SyncToMainHistory(record);
            }

            d2DrawState.mixedAllResults.forEach(phase => {
                const header = document.createElement('div');
                header.style.cssText = 'width:100%;text-align:center;font-size:13px;font-weight:700;color:#8b7a9e;padding:6px 0 3px;letter-spacing:2px;border-top:1px solid #e8dcee;margin-top:6px;';
                header.textContent = phase.label + ' (' + phase.results.length + '张)';
                resultGrid.appendChild(header);
                const wrap = document.createElement('div');
                wrap.style.cssText = 'display:flex;flex-wrap:wrap;justify-content:center;gap:6px;width:100%;padding:2px 0;';
                phase.results.forEach(item => {
                    const div = document.createElement('div');
                    const isTarot = item.type === '塔罗';
                    div.className = 'd2-result-card' + (isTarot ? ' d2-tarot-card' : '');
                    div.style.cssText = 'width:calc(33.33% - 6px);max-width:85px;padding:4px 3px;';
                    const imgSrc = getCardImage(item.card.file, isTarot);
                    const revClass = isTarot && item.reversed ? ' d2-img-reversed' : '';
                    div.innerHTML = '<div class="d2-tarot-img-wrap' + revClass + '"><img class="d2-tarot-img" src="' + imgSrc + '" alt="' + item.card.name + '" draggable="false"></div>' +
                        '<div class="d2-rname">' + item.card.name + '</div>' +
                        (isTarot ? '<div class="d2-rpos ' + (item.reversed ? 'd2-down' : 'd2-up') + '">' + (item.reversed ? '逆位' : '正位') + '</div>' : '');
                    wrap.appendChild(div);
                });
                resultGrid.appendChild(wrap);
            });
            btnNext.textContent = '🎉 全部完成';
            btnNext.disabled = true;
            d2ShowResultButtons();
        }

        function d2ShowAllFreeResults() {
            resultArea.classList.remove('d2-hidden');
            resultGrid.innerHTML = '';

            const nowStr = new Date().toLocaleString('zh-CN');
            const existingRecord = d2DrawHistory.find(function(h) {
                return (h.mode === 'free' || (h.mode === 'mixed' && h.subMode === 'free')) && h.question === d2DrawState.question && h.time === nowStr;
            });
            if (!existingRecord) {
                const record = {
                    time: nowStr,
                    mode: 'mixed',
                    subMode: 'free',
                    question: d2DrawState.question,
                    contactId: d2DrawState.contactId,
                    contactName: d2DrawState.contactName,
                    phases: d2DrawState.mixedAllResults.map(phase => ({
                        label: phase.label,
                        results: phase.results.map(r => ({ name: r.card.name, reversed: r.reversed, type: r.type, file: r.card.file }))
                    }))
                };
                d2DrawHistory.unshift(record);
                d2SaveHistory();
                d2SyncToMainHistory(record);
            }

            d2DrawState.mixedAllResults.forEach(phase => {
                const header = document.createElement('div');
                header.style.cssText = 'width:100%;text-align:center;font-size:13px;font-weight:700;color:#8b7a9e;padding:6px 0 3px;letter-spacing:2px;border-top:1px solid #e8dcee;margin-top:6px;';
                header.textContent = phase.label + ' (' + phase.results.length + '张)';
                resultGrid.appendChild(header);
                const wrap = document.createElement('div');
                wrap.style.cssText = 'display:flex;flex-wrap:wrap;justify-content:center;gap:6px;width:100%;padding:2px 0;';
                phase.results.forEach(item => {
                    const div = document.createElement('div');
                    const isTarot = item.type === '塔罗';
                    div.className = 'd2-result-card' + (isTarot ? ' d2-tarot-card' : '');
                    div.style.cssText = 'width:calc(33.33% - 6px);max-width:85px;padding:4px 3px;';
                    const imgSrc = getCardImage(item.card.file, isTarot);
                    const revClass = isTarot && item.reversed ? ' d2-img-reversed' : '';
                    div.innerHTML = '<div class="d2-tarot-img-wrap' + revClass + '"><img class="d2-tarot-img" src="' + imgSrc + '" alt="' + item.card.name + '" draggable="false"></div>' +
                        '<div class="d2-rname">' + item.card.name + '</div>' +
                        (isTarot ? '<div class="d2-rpos ' + (item.reversed ? 'd2-down' : 'd2-up') + '">' + (item.reversed ? '逆位' : '正位') + '</div>' : '');
                    wrap.appendChild(div);
                });
                resultGrid.appendChild(wrap);
            });
            btnNext.textContent = '🎉 全部完成';
            btnNext.disabled = true;
            d2ShowResultButtons();
        }

        // ================================================================
        //  渲染结果（塔罗牌显示图片，雷诺曼显示emoji）
        // ================================================================
        function d2RenderResult(result) {
            resultGrid.innerHTML = '';
            const isTarot = result.length > 0 && result[0].type === '塔罗';
            result.forEach((item) => {
                const div = document.createElement('div');
                div.className = 'd2-result-card' + (isTarot ? ' d2-tarot-card' : '');
                const card = item.card;
                const isRev = item.reversed;
                const posText = isRev ? '逆位' : '正位';
                const posClass = isRev ? 'd2-down' : 'd2-up';

                if (isTarot) {
                    const rotation = isRev ? 'd2-img-reversed' : '';
                    div.innerHTML = '<div class="d2-tarot-img-wrap ' + rotation + '">' +
                        '<img src="' + getCardImage(card.file, true) + '" alt="' + card.name + '" class="d2-tarot-img" draggable="false">' +
                        '</div><div class="d2-rname">' + card.name + '</div>' +
                        '<div class="d2-rpos ' + posClass + '">' + posText + '</div>' +
                        '<div class="d2-rnum">' + item.type + ' · #' + card.id + '</div>';
                } else {
                    div.innerHTML = '<div class="d2-tarot-img-wrap">' +
                        '<img src="' + getCardImage(card.file, false) + '" alt="' + card.name + '" class="d2-tarot-img" draggable="false">' +
                        '</div><div class="d2-rname">' + card.name + '</div>' +
                        '<div class="d2-rnum">' + item.type + ' · #' + card.id + '</div>';
                }
                resultGrid.appendChild(div);
            });
        }

        // ================================================================
        //  复制占卜结果
        // ================================================================
        function d2CopyResult() {
            let text = '';
            const isMultiStep = d2DrawState.mode === 'mixed';
            const isFreeSub = d2DrawState.subMode === 'free';
            const steps = isFreeSub ? FREE_STEPS : MIXED_STEPS;

            if (isMultiStep) {
                if (d2DrawState.mixedAllResults.length === steps.length) {
                    text = '问题：' + d2DrawState.question + '\n';
                    if (d2DrawState.contactName) text += '占卜对象：' + d2DrawState.contactName + '\n\n';
                    else text += '\n';
                    d2DrawState.mixedAllResults.forEach(phase => {
                        text += phase.label + '：\n';
                        phase.results.forEach((r, i) => {
                            text += (i + 1) + '. ' + r.card.name;
                            if (r.reversed) text += '（逆位）';
                            text += '\n';
                        });
                        text += '\n';
                    });
                } else if (d2DrawState.phase === 'result') {
                    text = '问题：' + d2DrawState.question + '\n';
                    if (d2DrawState.contactName) text += '占卜对象：' + d2DrawState.contactName + '\n\n';
                    else text += '\n';
                    text += steps[d2DrawState.mixedStep].label + '：\n';
                    d2DrawState.currentResults.forEach((r, i) => {
                        text += (i + 1) + '. ' + r.card.name;
                        if (r.reversed) text += '（逆位）';
                        text += '\n';
                    });
                }
            } else {
                text = '问题：' + d2DrawState.question + '\n';
                if (d2DrawState.contactName) text += '占卜对象：' + d2DrawState.contactName + '\n\n';
                else text += '\n';
                text += '牌面：\n';
                d2DrawState.currentResults.forEach((r, i) => {
                    text += (i + 1) + '. ' + r.card.name;
                    if (r.reversed) text += '（逆位）';
                    text += '\n';
                });
            }

            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                    toast('已复制到剪贴板');
                }).catch(() => {
                    d2FallbackCopy(text);
                });
            } else {
                d2FallbackCopy(text);
            }
        }

        function d2FallbackCopy(text) {
            const ta = document.createElement('textarea');
            ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
            document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy'); toast('已复制到剪贴板'); } catch(e) { toast('复制失败'); }
            document.body.removeChild(ta);
        }

        // ================================================================
        //  历史记录弹窗
        // ================================================================
        function d2ShowHistory() {
            let html = '<div style="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;">';
            html += '<div style="background:#fff;border-radius:12px;width:100%;max-width:400px;max-height:80vh;display:flex;flex-direction:column;overflow:hidden;">';
            html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #e8dcee;flex-shrink:0;">';
            html += '<span style="font-size:16px;font-weight:700;color:#8b7a9e;">抽牌记录</span>';
            html += '<button onclick="this.closest(\'div\').parentElement.parentElement.remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#8a7a8a;padding:4px 8px;">×</button>';
            html += '</div>';
            html += '<div style="flex:1;overflow-y:auto;padding:8px 12px;">';
            if (d2DrawHistory.length === 0) {
                html += '<div style="text-align:center;color:#b0a0b8;padding:24px;font-size:14px;">暂无抽牌记录</div>';
            } else {
                d2DrawHistory.forEach((h, idx) => {
                    html += '<div style="padding:8px 0;border-bottom:1px solid #f0e8f4;font-size:12px;">';
                    html += '<div style="color:#8b7a9e;font-weight:600;margin-bottom:2px;">' + h.time + '</div>';
                    html += '<div style="color:#8a7a8a;">问题：' + (h.question || '') + '</div>';
                    if (h.contactName) html += '<div style="color:#8a7a8a;">占卜对象：' + h.contactName + '</div>';
                    if (h.mode === 'mixed' || h.mode === 'free') {
                        const isFreeMode = h.mode === 'free' || h.subMode === 'free';
                        const modeLabel = isFreeMode ? '[混合·自由抽牌] ' : (h.mode === 'mixed' ? '[混合·随机抽牌] ' : '');
                        html += '<div style="color:#8a7a8a;margin-top:2px;font-weight:500;">' + modeLabel + '</div>';
                        if (h.phases) {
                            h.phases.forEach(phase => {
                                html += '<div style="color:#8a7a8a;margin-top:2px;">' + phase.label + '：' + phase.results.map(r => r.name + (r.reversed ? '(逆)' : '')).join('、') + '</div>';
                            });
                        }
                    } else if (h.results) {
                        html += '<div style="color:#8a7a8a;margin-top:2px;">' + (h.stepLabel ? h.stepLabel + '：' : '') + h.results.map(r => r.name + (r.reversed ? '(逆)' : '')).join('、') + '</div>';
                    }
                    if (h.aiInterpret) {
                        html += '<div style="margin-top:6px;padding:8px 10px;background:#faf3ff;border:1px dashed #d8c6e8;border-radius:8px;color:#7a5a8a;line-height:1.6;word-break:break-all;">📜 <b>AI 解读</b><br>' + String(h.aiInterpret).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>') + '</div>';
                    }
                    html += '</div>';
                });
            }
            html += '</div>';
            html += '<div style="padding:10px 16px;border-top:1px solid #e8dcee;flex-shrink:0;display:flex;gap:8px;">';
            html += '<button onclick="if(confirm(\'确定清空所有记录？\')){d2DrawHistory=[];d2SaveHistory();this.closest(\'div\').parentElement.parentElement.remove();}" style="flex:1;padding:8px;border:1px solid #d8cee0;border-radius:20px;background:#fff;color:#8a7a8a;font-size:12px;font-family:inherit;cursor:pointer;">清空记录</button>';
            html += '<button onclick="this.closest(\'div\').parentElement.parentElement.remove()" style="flex:1;padding:8px;border:1px solid #8b7a9e;border-radius:20px;background:#8b7a9e;color:#fff;font-size:12px;font-family:inherit;cursor:pointer;">关闭</button>';
            html += '</div>';
            html += '</div></div>';
            document.body.insertAdjacentHTML('beforeend', html);
        }

        // ================================================================
        //  重新抽牌（回到首页重新输入问题）
        // ================================================================
        function d2RedrawCurrent() {
            if (d2DrawState.isDrawing) return;
            d2GoHome();
        }

        // ================================================================
        //  返回首页
        // ================================================================
        function d2GoHome() {
            d2HidePage('d2-page-draw');
            d2ShowPage('d2-page-home');
            d2DrawState.phase = 'idle';
            d2DrawState.isDrawing = false;
            d2DrawState.currentResults = [];
            d2DrawState.mixedAllResults = [];
            d2DrawState.mixedStep = 0;
            d2DrawState.question = '';
            if (questionInput) questionInput.value = '';
            resultArea.classList.add('d2-hidden');
            shuffleBox.classList.add('d2-hidden');
            shuffleBox.innerHTML = '';
            drawPileArea.classList.add('d2-hidden');
            cardRow1.innerHTML = '';
            cardRow2.innerHTML = '';
            drawnCards.innerHTML = '';
            resultGrid.innerHTML = '';
            d2PileRemaining = [];
            if (d2DrawState.animId) { cancelAnimationFrame(d2DrawState.animId); d2DrawState.animId = null; }
            btnNext.disabled = false;
            btnRedraw.disabled = false;
            $('d2-btnCopyResult').style.display = 'none';
            $('d2-btnHistory').style.display = 'none';
            drawQuestion.style.display = 'none';
            const steps = flowHint.querySelectorAll('.d2-step');
            steps.forEach(el => el.classList.remove('d2-active', 'd2-done'));
        }

        // ================================================================
        //  模式切换 & 事件绑定
        // ================================================================
        const subTabs = $('d2-subTabs');
        const mixedRandomPanel = $('d2-mixed-random');
        const mixedFreePanel = $('d2-mixed-free');

        function updateSubTabsVisibility(){
            if(d2DrawState.mode === 'mixed'){
                subTabs.classList.remove('d2-hidden');
                if(d2DrawState.subMode === 'random'){
                    mixedRandomPanel.style.display = 'block';
                    mixedFreePanel.style.display = 'none';
                }else{
                    mixedRandomPanel.style.display = 'none';
                    mixedFreePanel.style.display = 'block';
                }
            }else{
                subTabs.classList.add('d2-hidden');
            }
        }

        modeTabs.addEventListener('click', function(e) {
            const tab = e.target.closest('.d2-mode-tab');
            if (!tab) return;
            const mode = tab.getAttribute('data-mode');
            d2DrawState.mode = mode;

            this.querySelectorAll('.d2-mode-tab').forEach(t => t.classList.remove('d2-active'));
            tab.classList.add('d2-active');

            document.querySelectorAll('.d2-opt-group').forEach(g => g.classList.remove('d2-active'));
            const optGroup = document.getElementById('d2-opt-' + mode);
            if (optGroup) optGroup.classList.add('d2-active');

            updateSubTabsVisibility();

            const subtitles = {
                mixed: d2DrawState.subMode === 'random'
                    ? '📬 TA的回应 · 💭 TA的情绪 · 🔮 TA的秘密（随机抽牌）'
                    : '📬 TA的回应 · 💭 TA的情绪 · 🔮 TA的秘密（自由抽牌）',
                tarot: '78张塔罗 · 带正逆位',
                lenormand: '40张雷诺曼 · Rana体系'
            };
            homeSub.textContent = subtitles[mode] || '选择抽牌模式';
        });

        subTabs.addEventListener('click', function(e) {
            const tab = e.target.closest('.d2-sub-tab');
            if (!tab) return;
            const sub = tab.getAttribute('data-sub');
            d2DrawState.subMode = sub;

            this.querySelectorAll('.d2-sub-tab').forEach(t => t.classList.remove('d2-active'));
            tab.classList.add('d2-active');

            updateSubTabsVisibility();

            const subtitles = {
                mixed: d2DrawState.subMode === 'random'
                    ? '📬 TA的回应 · 💭 TA的情绪 · 🔮 TA的秘密（随机抽牌）'
                    : '📬 TA的回应 · 💭 TA的情绪 · 🔮 TA的秘密（自由抽牌）',
                tarot: '78张塔罗 · 带正逆位',
                lenormand: '40张雷诺曼 · Rana体系'
            };
            homeSub.textContent = subtitles[d2DrawState.mode] || '选择抽牌模式';
        });

        // 自由抽牌开始按钮
        const btnFreeStart = $('d2-btnFreeStart');
        if (btnFreeStart) {
            btnFreeStart.addEventListener('click', function() {
                const question = questionInput.value;
                if (!question.trim()) {
                    if (!confirm('还未写下问题，是否直接开始？')) return;
                }
                btnFreeStart.disabled = true;
                d2StartDrawSequence(question, null);
                setTimeout(() => { btnFreeStart.disabled = false; }, 500);
            });
        }

        btnStart.addEventListener('click', () => {
            const question = questionInput.value;
            if (!question.trim()) {
                if (!confirm('还未写下问题，是否直接开始？')) return;
            }
            btnStart.disabled = true;
            d2StartDrawSequence(question, null);
            setTimeout(() => { btnStart.disabled = false; }, 500);
        });

        questionInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') btnStart.click();
        });

        drawOptions.addEventListener('click', function(e) {
            const btn = e.target.closest('[data-draw]');
            if (!btn) return;
            const drawType = btn.getAttribute('data-draw');
            const question = questionInput.value;
            if (!question.trim()) {
                if (!confirm('还未写下问题，是否直接开始？')) return;
            }
            d2StartDrawSequence(question, drawType);
        });

        btnBack.addEventListener('click', d2GoHome);
        btnRedraw.addEventListener('click', d2RedrawCurrent);
        $('d2-btnCopyResult').addEventListener('click', d2CopyResult);
        $('d2-btnHistory').addEventListener('click', d2ShowHistory);
        var d2AiBtn=$('d2-btnAi');
        if(d2AiBtn)d2AiBtn.addEventListener('click', function(){ if(typeof d2AiInterpret==='function')d2AiInterpret(); });

        // d2GoHome() called from d2ShowDivination
        // 首页历史记录按钮
        $('d2-btnHomeHistory').addEventListener('click', () => {
            d2ShowHistory();
        });

        // 速占按钮
        $('d2-btnQuick').addEventListener('click', () => {
            d2QuickDraw();
        });

        console.log('🃏 梦占塔罗已加载（78张塔罗 + 40张雷诺曼 Rana体系）');
        console.log('📬 TA的回应 1~5张（随机）');
        console.log('💭 TA的情绪 3张（固定正逆位）');
        console.log('🔮 TA的秘密 1~3张（随机）');
        console.log('✦ 自由占卜模式：可自由选择每类牌数量');

// d2-占卜初始化
function d2InitDivination() {
  // 初始化在 d2ShowDivination 中调用
}

// 暴露到全局作用域
window.d2FinishFreeStep = d2FinishFreeStep;

/* end d2-占卜JS */

function d2ShowDivination(displayMode) {
  // displayMode: 'full' (默认全屏) | 'half' (半框弹窗，从聊天栏更多功能打开)
  displayMode = displayMode || 'full';
  // 隐藏所有旧页面，显示新占卜首页
  var d2app = $('d2-app');
  if (!d2app) { console.warn('d2-app container not found'); return; }
  
  // 初始化数据
  if (typeof d2DrawHistory === 'undefined') {
    try { var s = localStorage.getItem('ml2_divine_history'); if (s) d2DrawHistory = JSON.parse(s); else d2DrawHistory = []; } catch(e) { d2DrawHistory = []; }
  }
  
  // 显示占卜容器
  d2app.style.display = 'flex';
  d2app.style.flexDirection = 'column';
  d2app.style.alignItems = 'center';
  d2app.style.position = 'fixed';
  d2app.style.zIndex = '9999';
  d2app.style.width = '100%';
  d2app.style.height = '100%';
  d2app.style.overflowY = 'auto';
  d2app.style.touchAction = 'pan-y pinch-zoom';
  
  if (displayMode === 'half') {
    // 半框模式：作为弹窗显示，背景半透明
    d2app.style.inset = '0';
    d2app.style.background = 'rgba(0,0,0,0.55)';
    d2app.style.justifyContent = 'center';
    d2app.style.padding = '20px';
    d2app.style.paddingTop = '20px';
    d2app.style.paddingBottom = '20px';
    d2app.style.minHeight = '100vh';
    d2app.style.minHeight = '100dvh';
    d2app.setAttribute('data-display', 'half');
  } else {
    // 全屏模式
    d2app.style.inset = '0';
    d2app.style.background = '#faf7f2';
    d2app.style.justifyContent = 'flex-start';
    d2app.style.padding = '10px 12px 10px';
    d2app.style.paddingTop = 'calc(10px + env(safe-area-inset-top))';
    d2app.style.paddingBottom = 'calc(10px + env(safe-area-inset-bottom))';
    d2app.style.minHeight = '100vh';
    d2app.style.minHeight = '100dvh';
    d2app.setAttribute('data-display', 'full');
  }
  
  // 半框模式：点击背景关闭
  if (displayMode === 'half') {
    d2app.onclick = function(e) {
      if (e.target === d2app) {
        d2CloseDivination();
      }
    };
  } else {
    d2app.onclick = null;
  }
  
  // 隐藏所有页面
  ['d2-page-home','d2-page-draw'].forEach(function(id) {
    var el = $(id);
    if (el) { el.style.display = 'none'; el.classList.remove('d2-active'); }
  });
  
  // 显示首页
  d2ShowPage('d2-page-home');
  
  // 重置状态
  d2DrawState.mode = 'mixed';
  d2DrawState.subMode = 'random';
  d2DrawState.question = '';
  d2DrawState.contactId = '';
  d2DrawState.contactName = '';
  d2DrawState.mixedStep = 0;
  d2DrawState.mixedAllResults = [];
  d2DrawState.drawCount = 0;
  d2DrawState.drawnSoFar = 0;
  d2DrawState.currentResults = [];
  d2DrawState.isDrawing = false;
  d2DrawState.phase = 'idle';
  d2DrawState.animId = null;
  d2PileRemaining = [];
  d2PileIsTarot = false;
  
  var qi = $('d2-questionInput');
  if (qi) qi.value = '';
  
  // 渲染占卜对象选择器
  var cs = $('d2-contactSelect');
  if (cs) {
    var html = '<div class="d2-contact-chip d2-active" data-cid="">不选对象</div>';
    if (typeof contacts !== 'undefined' && contacts.length > 0) {
      contacts.forEach(function(c) {
        html += '<div class="d2-contact-chip" data-cid="' + c.id + '">' + c.name + '</div>';
      });
    }
    cs.innerHTML = html;
    cs.querySelectorAll('.d2-contact-chip').forEach(function(chip) {
      chip.addEventListener('click', function() {
        cs.querySelectorAll('.d2-contact-chip').forEach(function(c) { c.classList.remove('d2-active'); });
        this.classList.add('d2-active');
        var cid = this.dataset.cid || '';
        d2DrawState.contactId = cid;
        var contact = contacts.find(function(x) { return x.id === cid; });
        d2DrawState.contactName = contact ? contact.name : '';
      });
    });
  }
  
  // 更新模式标签
  var mt = $('d2-modeTabs');
  if (mt) {
    mt.querySelectorAll('.d2-mode-tab').forEach(function(t) { t.classList.remove('d2-active'); });
    var firstTab = mt.querySelector('[data-mode="mixed"]');
    if (firstTab) firstTab.classList.add('d2-active');
  }
  
  // 更新子选项标签
  var st = $('d2-subTabs');
  if (st) {
    st.querySelectorAll('.d2-sub-tab').forEach(function(t) { t.classList.remove('d2-active'); });
    var firstSub = st.querySelector('[data-sub="random"]');
    if (firstSub) firstSub.classList.add('d2-active');
  }
  
  // 更新选项组
  var dopts = $('d2-drawOptions');
  if (dopts) {
    dopts.querySelectorAll('.d2-opt-group').forEach(function(g) { g.classList.remove('d2-active'); });
    var firstOpt = $('d2-opt-mixed');
    if (firstOpt) firstOpt.classList.add('d2-active');
  }
  
  // 更新子面板显示
  if (typeof updateSubTabsVisibility === 'function') {
    updateSubTabsVisibility();
  }
  
  var hs = $('d2-homeSub');
  if (hs) hs.textContent = '📬 TA的回应 · 💭 TA的情绪 · 🔮 TA的秘密（随机抽牌）';
}

function d2CloseDivination() {
  var d2app = $('d2-app');
  if (d2app) {
    d2app.style.display = 'none';
    d2app.style.position = '';
    d2app.style.inset = '';
    d2app.style.zIndex = '';
    d2app.style.background = '';
    d2app.style.width = '';
    d2app.style.height = '';
    d2app.style.minHeight = '';
    d2app.style.padding = '';
    d2app.style.paddingTop = '';
    d2app.style.paddingBottom = '';
    d2app.style.overflowY = '';
    d2app.style.justifyContent = '';
    d2app.removeAttribute('data-display');
  }
}

// ================================================================
//  速占模式：跳过洗牌和选牌，直接出结果
// ================================================================
function d2QuickDraw() {
  var qi = $('d2-questionInput');
  var question = qi ? qi.value : '';
  d2DrawState.question = question.trim() || '（未写下问题）';
  d2DrawState.contactId = d2DrawState.contactId || '';
  d2DrawState.contactName = d2DrawState.contactName || '';

  d2HidePage('d2-page-home');
  d2ShowPage('d2-page-draw');

  d2DrawState.phase = 'idle';
  d2DrawState.isDrawing = false;
  d2DrawState.animId = null;
  d2PileRemaining = [];
  resultArea.classList.add('d2-hidden');
  resultGrid.innerHTML = '';
  shuffleBox.classList.add('d2-hidden');
  shuffleBox.innerHTML = '';
  drawPileArea.classList.add('d2-hidden');
  cardRow1.innerHTML = '';
  cardRow2.innerHTML = '';
  drawnCards.innerHTML = '';
  btnRedraw.disabled = false;
  flowHint.classList.add('d2-hidden');
  btnNext.style.display = 'none';

  var mode = d2DrawState.mode;
  if (mode === 'mixed') {
    d2QuickDrawMixed();
  } else {
    var deckType = mode;
    d2DrawState.deckType = deckType;
    d2DrawState.drawCount = 3;
    d2DrawState.useReverse = (deckType === 'tarot');
    d2DrawState.currentResults = [];
    d2QuickDrawSingle();
  }
}

function d2QuickDrawMixed() {
  d2DrawState.mixedStep = 0;
  d2DrawState.mixedAllResults = [];
  d2QuickDrawMixedStep();
}

function d2QuickDrawMixedStep() {
  var step = MIXED_STEPS[d2DrawState.mixedStep];
  d2DrawState.deckType = step.deck;
  d2DrawState.drawCount = d2Rand(step.countRange[0], step.countRange[1]);
  d2DrawState.useReverse = step.useReverse;
  d2DrawState.currentResults = [];
  d2DrawState.drawnSoFar = 0;

  drawTitle.textContent = step.emoji + ' ' + step.label;
  drawCount.textContent = '速占中...';
  questionDisplay.textContent = d2DrawState.question;
  drawQuestion.style.display = 'block';

  var deck = d2GetDeck(d2DrawState.deckType);
  var shuffled = d2ShuffleArr(deck);
  for (var i = 0; i < d2DrawState.drawCount && i < shuffled.length; i++) {
    var card = shuffled[i];
    var isRev = d2DrawState.useReverse ? Math.random() < 0.5 : false;
    d2DrawState.currentResults.push({
      card: card,
      reversed: isRev,
      type: d2DrawState.deckType === 'tarot' ? '塔罗' : '雷诺曼'
    });
  }

  d2DrawState.mixedAllResults.push({
    step: d2DrawState.mixedStep,
    label: step.label,
    results: d2DrawState.currentResults.slice()
  });

  d2DrawState.mixedStep++;
  if (d2DrawState.mixedStep < MIXED_STEPS.length) {
    setTimeout(function() { d2QuickDrawMixedStep(); }, 200);
  } else {
    d2QuickDrawShowAll();
  }
}

function d2QuickDrawSingle() {
  drawTitle.textContent = d2DrawState.deckType === 'tarot' ? '🔮 塔罗牌' : '🌙 雷诺曼牌';
  drawCount.textContent = '速占中...';
  questionDisplay.textContent = d2DrawState.question;
  drawQuestion.style.display = 'block';

  var deck = d2GetDeck(d2DrawState.deckType);
  var shuffled = d2ShuffleArr(deck);
  for (var i = 0; i < d2DrawState.drawCount && i < shuffled.length; i++) {
    var card = shuffled[i];
    var isRev = d2DrawState.useReverse ? Math.random() < 0.5 : false;
    d2DrawState.currentResults.push({
      card: card,
      reversed: isRev,
      type: d2DrawState.deckType === 'tarot' ? '塔罗' : '雷诺曼'
    });
  }

  d2RenderResult(d2DrawState.currentResults);
  resultArea.classList.remove('d2-hidden');
  d2DrawState.isDrawing = false;
  d2DrawState.phase = 'result';
  btnRedraw.disabled = false;
  btnNext.style.display = 'none';
  d2ShowResultButtons();

  var record = {
    time: new Date().toLocaleString('zh-CN'),
    mode: d2DrawState.mode,
    question: d2DrawState.question,
    contactId: d2DrawState.contactId,
    contactName: d2DrawState.contactName,
    results: d2DrawState.currentResults.map(function(r) { return { name: r.card.name, reversed: r.reversed, type: r.type, file: r.card.file }; })
  };
  d2DrawHistory.unshift(record);
  d2SaveHistory();
  d2SyncToMainHistory(record);
}

function d2QuickDrawShowAll() {
  d2DrawState.phase = 'result';
  resultArea.classList.remove('d2-hidden');
  resultGrid.innerHTML = '';

  var nowStr = new Date().toLocaleString('zh-CN');
  var record = {
    time: nowStr,
    mode: 'mixed',
    subMode: d2DrawState.subMode,
    question: d2DrawState.question,
    contactId: d2DrawState.contactId,
    contactName: d2DrawState.contactName,
    phases: d2DrawState.mixedAllResults.map(function(phase) {
      return {
        label: phase.label,
        results: phase.results.map(function(r) { return { name: r.card.name, reversed: r.reversed, type: r.type, file: r.card.file }; })
      };
    })
  };
  d2DrawHistory.unshift(record);
  d2SaveHistory();
  d2SyncToMainHistory(record);

  d2DrawState.mixedAllResults.forEach(function(phase) {
    var header = document.createElement('div');
    header.style.cssText = 'width:100%;text-align:center;font-size:13px;font-weight:700;color:#8b7a9e;padding:6px 0 3px;letter-spacing:2px;border-top:1px solid #e8dcee;margin-top:6px;';
    header.textContent = phase.label + ' (' + phase.results.length + '张)';
    resultGrid.appendChild(header);
    var wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-wrap:wrap;justify-content:center;gap:6px;width:100%;padding:2px 0;';
    phase.results.forEach(function(item) {
      var div = document.createElement('div');
      var isTarot = item.type === '塔罗';
      div.className = 'd2-result-card' + (isTarot ? ' d2-tarot-card' : '');
      div.style.cssText = 'width:calc(33.33% - 6px);max-width:85px;padding:4px 3px;';
      var imgSrc = getCardImage(item.card.file, isTarot);
      var revClass = isTarot && item.reversed ? ' d2-img-reversed' : '';
      div.innerHTML = '<div class="d2-tarot-img-wrap' + revClass + '"><img class="d2-tarot-img" src="' + imgSrc + '" alt="' + item.card.name + '" draggable="false"></div>' +
        '<div class="d2-rname">' + item.card.name + '</div>' +
        (isTarot ? '<div class="d2-rpos ' + (item.reversed ? 'd2-down' : 'd2-up') + '">' + (item.reversed ? '逆位' : '正位') + '</div>' : '');
      wrap.appendChild(div);
    });
    resultGrid.appendChild(wrap);
  });

  d2ShowResultButtons();
  btnNext.style.display = 'none';
  drawCount.textContent = '速占完成';
}

// 统一显示结果按钮
function d2ShowResultButtons() {
  $('d2-btnCopyResult').style.display = '';
  $('d2-btnHistory').style.display = '';
  var aiBtn=$('d2-btnAi');
  if(aiBtn)aiBtn.style.display='';
  var sendBtn = $('d2-btnSendChat');
  var sendSetting = $('d2-sendSetting');
  var sendEnabled = localStorage.getItem('ml2_divine_send_to_chat') !== 'false';
  if (sendBtn) sendBtn.style.display = sendEnabled ? '' : 'none';
  if (sendSetting) sendSetting.style.display = '';
  var toggle = $('d2-sendToggle');
  if (toggle) toggle.checked = sendEnabled;
}

// 发送占卜结果到当前聊天（由联系人发送）
function d2SendResultToChat() {
  if (typeof cid === 'undefined' || !cid) {
    toast('请先打开一个聊天');
    return;
  }
  var text = d2BuildResultText();
  if (!text) { toast('无结果可发送'); return; }
  try {
    var m = msgs(cid);
    m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9), s:OTHER, t:text, ts:new Date(), pc:false, isAuto:false, isInitiative:false, read:(cid===window.currentCid)});
    savemsgs(cid, m);
    d2CloseDivination();
    if (typeof showPg === 'function') { showPg('pg-conv'); }
    renderMsgs(m);
    if (typeof renderChatList === 'function') { renderChatList(); }
    toast('占卜结果已发送');
  } catch(e) {
    console.error('发送占卜结果失败:', e);
    toast('发送失败');
  }
}

// 构建占卜结果文本
function d2BuildResultText() {
  var text = '';
  var isMultiStep = d2DrawState.mode === 'mixed';
  var steps = MIXED_STEPS;

  if (isMultiStep) {
    if (d2DrawState.mixedAllResults.length === steps.length) {
      text = '🔮 占卜结果\n';
      if (d2DrawState.question) text += '问题：' + d2DrawState.question + '\n';
      if (d2DrawState.contactName) text += '对象：' + d2DrawState.contactName + '\n';
      text += '\n';
      d2DrawState.mixedAllResults.forEach(function(phase) {
        text += phase.label + '：\n';
        phase.results.forEach(function(r, i) {
          text += (i + 1) + '. ' + r.card.name;
          if (r.reversed) text += '（逆位）';
          text += '\n';
        });
        text += '\n';
      });
    } else if (d2DrawState.phase === 'result') {
      text = '🔮 占卜结果\n';
      if (d2DrawState.question) text += '问题：' + d2DrawState.question + '\n';
      if (d2DrawState.contactName) text += '对象：' + d2DrawState.contactName + '\n\n';
      text += steps[d2DrawState.mixedStep].label + '：\n';
      d2DrawState.currentResults.forEach(function(r, i) {
        text += (i + 1) + '. ' + r.card.name;
        if (r.reversed) text += '（逆位）';
        text += '\n';
      });
    }
  } else {
    text = '🔮 占卜结果\n';
    if (d2DrawState.question) text += '问题：' + d2DrawState.question + '\n';
    if (d2DrawState.contactName) text += '对象：' + d2DrawState.contactName + '\n\n';
    d2DrawState.currentResults.forEach(function(r, i) {
      text += (i + 1) + '. ' + r.card.name;
      if (r.reversed) text += '（逆位）';
      text += '\n';
    });
  }
  return text;
}

// 切换发送至聊天开关
function d2ToggleSendToChat() {
  var toggle = $('d2-sendToggle');
  var enabled = toggle ? toggle.checked : true;
  localStorage.setItem('ml2_divine_send_to_chat', enabled ? 'true' : 'false');
  var sendBtn = $('d2-btnSendChat');
  if (sendBtn) sendBtn.style.display = enabled ? '' : 'none';
}

// 从半框切换到全屏
function d2SwitchToFull() {
  var d2app = $('d2-app');
  if (!d2app) return;
  d2app.style.background = '#faf7f2';
  d2app.style.justifyContent = 'flex-start';
  d2app.style.padding = '10px 12px 10px';
  d2app.style.paddingTop = 'calc(10px + env(safe-area-inset-top))';
  d2app.style.paddingBottom = 'calc(10px + env(safe-area-inset-bottom))';
  d2app.setAttribute('data-display', 'full');
  d2app.onclick = null;
}
</script>

<div id="mood-card-help-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;align-items:center;justify-content:center;">
  <div style="background:var(--bg);border-radius:16px;width:90%;max-width:360px;max-height:80vh;overflow:hidden;">
    <div style="padding:16px;border-bottom:1px solid var(--c2);display:flex;justify-content:space-between;align-items:center;">
      <div style="font-weight:600;font-size:16px;color:var(--txt);">☁️ 情绪分组权重</div>
      <button id="mood-card-help-close" style="width:28px;height:28px;border:none;background:none;font-size:20px;color:var(--txt3);cursor:pointer;">&times;</button>
    </div>
    <div style="padding:16px;overflow-y:auto;max-height:calc(80vh - 60px);">
      <div style="font-size:12px;color:var(--txt3);margin-bottom:12px;">聊天情绪字卡采用三层随机机制：<br>1. 70%概率发送情绪字卡<br>2. 按权重抽取情绪分组<br>3. 在分组内等概率抽取字卡</div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--c2);border-radius:8px;">
          <span style="color:#52c41a;">喜悦与正向</span>
          <span style="font-weight:600;color:var(--txt);">30%</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--c2);border-radius:8px;">
          <span style="color:#ff69b4;">亲近与爱意</span>
          <span style="font-weight:600;color:var(--txt);">20%</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--c2);border-radius:8px;">
          <span style="color:#bfbfbf;">中性与日常</span>
          <span style="font-weight:600;color:var(--txt);">15%</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--c2);border-radius:8px;">
          <span style="color:#1890ff;">思考与复杂情绪</span>
          <span style="font-weight:600;color:var(--txt);">10%</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--c2);border-radius:8px;">
          <span style="color:#8c8c8c;">克制与隐藏</span>
          <span style="font-weight:600;color:var(--txt);">8%</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--c2);border-radius:8px;">
          <span style="color:#eb2f96;">害羞与社交情绪</span>
          <span style="font-weight:600;color:var(--txt);">6%</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--c2);border-radius:8px;">
          <span style="color:#722ed1;">悲伤与低落</span>
          <span style="font-weight:600;color:var(--txt);">4%</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--c2);border-radius:8px;">
          <span style="color:#fa8c16;">不安与恐惧</span>
          <span style="font-weight:600;color:var(--txt);">3%</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--c2);border-radius:8px;">
          <span style="color:#722ed1;">特殊表达情绪</span>
          <span style="font-weight:600;color:var(--txt);">2%</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--c2);border-radius:8px;">
          <span style="color:#13c2c2;">自我情绪</span>
          <span style="font-weight:600;color:var(--txt);">1%</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--c2);border-radius:8px;">
          <span style="color:#f5222d;">愤怒与不满</span>
          <span style="font-weight:600;color:var(--txt);">1%</span>
        </div>
      </div>
    </div>
  </div>
</div>


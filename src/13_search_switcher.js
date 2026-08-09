// ============ Date Search Calendar ============
var dateSearchState={year:0,month:0};
var dateSearchWeekdays=['日','一','二','三','四','五','六'];

async function showDateSearchModal(){
  if(!cid){toast('请先选择一个联系人');return;}
  var now=new Date();
  dateSearchState.year=now.getFullYear();
  dateSearchState.month=now.getMonth();
  showOv('ov-date-search');
  
  // 确保消息已加载（从内存或IndexedDB）
  var msgsData=memoryCache[LM+cid];
  if(!msgsData||msgsData.length===0){
    if(window.localforage){
      try{
        var dbVal=await window.localforage.getItem(LM+cid);
        if(dbVal&&Array.isArray(dbVal)){
          memoryCache[LM+cid]=dbVal;
        }
      }catch(e){}
    }
  }
  
  renderDateSearchCalendar();
}

function renderDateSearchCalendar(){
  var y=dateSearchState.year,m=dateSearchState.month;
  var labelEl=$('date-search-month-label');
  if(labelEl)labelEl.textContent=y+'年'+(m+1)+'月';
  
  // 渲染星期标题
  var wdEl=$('date-search-weekdays');
  if(wdEl){
    wdEl.innerHTML=dateSearchWeekdays.map(function(d){return '<div>'+d+'</div>';}).join('');
  }
  
  // 获取当前联系人所有消息的日期集合
  var msgsData=memoryCache[LM+cid]||[];
  var datesWithMsgs={};
  for(var i=0;i<msgsData.length;i++){
    var ts=msgsData[i].ts;
    if(!ts)continue;
    var d=new Date(ts);
    var key=d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
    if(!datesWithMsgs[key])datesWithMsgs[key]=[];
    datesWithMsgs[key].push(msgsData[i]);
  }
  
  // 计算日历格子
  var firstDay=new Date(y,m,1);
  var firstWeekday=firstDay.getDay();
  var daysInMonth=new Date(y,m+1,0).getDate();
  
  var calEl=$('date-search-calendar');
  if(!calEl)return;
  
  var html='';
  // 空白填充
  for(var s=0;s<firstWeekday;s++){
    html+='<div></div>';
  }
  
  var today=new Date();
  var todayKey=today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  
  for(var d=1;d<=daysInMonth;d++){
    var dateKey=y+'-'+(m+1)+'-'+d;
    var hasMsgs=!!datesWithMsgs[dateKey];
    var isToday=dateKey===todayKey;
    
    var classes=[];
    classes.push('date-cell');
    if(!hasMsgs)classes.push('date-empty');
    if(isToday)classes.push('date-today');
    
    html+='<div class="'+classes.join(' ')+'" data-date="'+dateKey+'" style="'+
      'aspect-ratio:1;display:flex;align-items:center;justify-content:center;'+
      'border-radius:50%;font-size:15px;cursor:'+(hasMsgs?'pointer':'default')+';'+
      'color:'+(hasMsgs?'var(--txt)':'var(--txt3)')+';'+
      'background:'+(isToday?'var(--accent)':'transparent')+';'+
      'font-weight:'+(hasMsgs?'600':'400')+';'+
      'transition:background .2s;user-select:none;">'+
      d+'</div>';
  }
  
  calEl.innerHTML=html;
  
  // 绑定点击事件
  var cells=calEl.querySelectorAll('.date-cell');
  cells.forEach(function(cell){
    cell.addEventListener('click',function(){
      if(cell.classList.contains('date-empty'))return;
      var dateKey=cell.dataset.date;
      jumpToDateInChat(dateKey,datesWithMsgs[dateKey]);
    });
  });
  
  // 更新选中信息
  var infoEl=$('date-search-selected-info');
  if(infoEl){
    var totalDays=Object.keys(datesWithMsgs).length;
    var totalMsgs=msgsData.length;
    infoEl.textContent='本月有 '+totalDays+' 天共 '+totalMsgs+' 条消息';
  }
}

function jumpToDateInChat(dateKey,msgsOfDay){
  if(!cid)return;
  hideOv('ov-date-search');
  
  var doJump=function(){
    var msgbox=$('msgbox');
    if(!msgbox){
      // msgbox 可能还没渲染完成，再等一下
      setTimeout(doJump,200);
      return;
    }
    
    // 找到当天第一条消息
    var firstMsg=msgsOfDay[0];
    if(firstMsg){
      // ★ 修复：设置焦点消息 id，强制 _doRenderMsgs 渲染包含该消息的窗口，
      // 否则目标日期在最近 80 条之外时 DOM 里根本找不到元素
      try{
        _jumpFocusMsgId=firstMsg.id;
        _jumpFocusJustJumped=true;
        setTimeout(function(){_jumpFocusJustJumped=false;},2500);
        // ★ 修复：先查目标是否已在渲染窗口中——在则直接滚动，不重建 DOM（重建会打断平滑滚动）
        var msgEl0=document.querySelector('[data-mid="'+firstMsg.id+'"]');
        if(!msgEl0){
          var allMsgs=msgs(cid);
          if(allMsgs&&allMsgs.length>0){
            _loadMoreLock=true; // 防触顶加载打断
            renderMsgs(allMsgs);
            setTimeout(function(){_loadMoreLock=false;},1500);
          }
        }
      }catch(e){console.warn('jumpToDate render fail:',e);}
      // 渲染后滚动到焦点元素（渲染是异步/节流的，延迟查找）
      var msgEl=document.querySelector('[data-mid="'+firstMsg.id+'"]');
      if(msgEl){
        msgEl.scrollIntoView({behavior:'auto',block:'start'});
        msgEl.style.background='rgba(201,169,110,0.15)';
        setTimeout(function(){msgEl.style.background='';},2500);
      }else{
        var attempts=0;
        var tryFind=function(){
          attempts++;
          var el=document.querySelector('[data-mid="'+firstMsg.id+'"]');
          if(el){
            el.scrollIntoView({behavior:'auto',block:'start'});
            el.style.background='rgba(201,169,110,0.15)';
            setTimeout(function(){el.style.background='';},2500);
          }else if(attempts<15){
            setTimeout(tryFind,100);
          }
        };
        setTimeout(tryFind,300);
      }
    }
    
    toast(dateKey+' · '+msgsOfDay.length+' 条消息');
  };
  
  // 如果当前打开的不是这个联系人，先打开
  if(!window.currentCid||window.currentCid!==cid){
    openConv(cid,window.currentConvType||'contact');
    setTimeout(doJump,500);
  }else{
    setTimeout(doJump,100);
  }
}

// 绑定日期翻页
var _dsPrev=$('date-search-prev-month');
if(_dsPrev)_dsPrev.onclick=function(){
  dateSearchState.month--;
  if(dateSearchState.month<0){dateSearchState.month=11;dateSearchState.year--;}
  renderDateSearchCalendar();
};
var _dsNext=$('date-search-next-month');
if(_dsNext)_dsNext.onclick=function(){
  dateSearchState.month++;
  if(dateSearchState.month>11){dateSearchState.month=0;dateSearchState.year++;}
  renderDateSearchCalendar();
};

var callSettings={enabled:true,incomingProbability:8,pickupProbability:70,busyProbability:15,rejectProbability:15,hangupProbability:0.01,contactSettings:{}};
var callHistory=[];
var currentCall=null;
var callDurationTimer=null;
var lastCallEndTime={}; // 记录每个联系人上次通话结束时间，防止短时间内重复来电
var lastIncomingCallTime={}; // 记录每个联系人上次来电触发时间，防止频繁来电
var _callChecks={};
var hasEnteredApp=false;
var callStartTime=0;
var callConnectedTime=0;
var lastEmojiGroup='';
var emojiBatchMode=false;
var emojiSelectedStickers=[];
var incomingCallTimer=null;
var incomingRingtoneAudio=null;

function getContactCallSettings(contactId){
  if(callSettings.contactSettings[contactId]){
    return Object.assign({},callSettings,callSettings.contactSettings[contactId]);
  }
  return callSettings;
}

function showCallPanel(){
  showOv('ov-call');
  renderCallHistory();
}

function showCallSettingsPanel(){
  showOv('ov-call-settings');
  renderCallSettings();
}

async function loadCallSettings(){
  var saved=null;
  if(memoryCache.hasOwnProperty('ml2_call_settings')){
    saved=memoryCache['ml2_call_settings'];
  }
  if(!saved&&window.localforage){
    saved=await window.localforage.getItem('ml2_call_settings');
  }
  if(saved&&typeof saved==='object'){
    callSettings=saved;
    memoryCache['ml2_call_settings']=callSettings;
  }
  
  if(!callSettings.contactSettings)callSettings.contactSettings={};
  
  if($('call-incoming-prob-input'))$('call-incoming-prob-input').value=callSettings.incomingProbability;
  if($('call-incoming-prob-slider'))$('call-incoming-prob-slider').value=callSettings.incomingProbability;
  if($('call-pickup-prob-input'))$('call-pickup-prob-input').value=callSettings.pickupProbability;
  if($('call-pickup-prob-slider'))$('call-pickup-prob-slider').value=callSettings.pickupProbability;
  if($('call-busy-prob-input'))$('call-busy-prob-input').value=callSettings.busyProbability;
  if($('call-busy-prob-slider'))$('call-busy-prob-slider').value=callSettings.busyProbability;
  if($('call-reject-prob-input'))$('call-reject-prob-input').value=callSettings.rejectProbability;
  if($('call-reject-prob-slider'))$('call-reject-prob-slider').value=callSettings.rejectProbability;
  if($('call-hangup-prob-input'))$('call-hangup-prob-input').value=callSettings.hangupProbability;
  if($('call-hangup-prob-slider'))$('call-hangup-prob-slider').value=callSettings.hangupProbability;
}

var currentCallContactId=contacts.length>0?contacts[0].id:null;

function renderCallSettings(){
  var sel=$('call-contact-select');
  if(sel){
    sel.innerHTML='';
    contacts.forEach(function(c){
      var opt=document.createElement('option');
      opt.value=c.id;
      opt.textContent=c.name;
      sel.appendChild(opt);
    });
    if(!currentCallContactId&&contacts.length>0)currentCallContactId=contacts[0].id;
    sel.value=currentCallContactId;
  }
  
  syncCallUI();
  
  bindCallSteppers();
}

function syncCallUI(){
  var sel=$('call-contact-select');
  if(!sel)return;
  
  currentCallContactId=sel.value;
  
  var settings;
  var cs=callSettings.contactSettings[currentCallContactId]||{};
  settings={
    enabled:cs.enabled!==undefined?cs.enabled:true,
    incomingProbability:cs.incomingProbability!==undefined?cs.incomingProbability:callSettings.incomingProbability,
    pickupProbability:cs.pickupProbability!==undefined?cs.pickupProbability:callSettings.pickupProbability,
    busyProbability:cs.busyProbability!==undefined?cs.busyProbability:callSettings.busyProbability,
    rejectProbability:cs.rejectProbability!==undefined?cs.rejectProbability:callSettings.rejectProbability,
    hangupProbability:cs.hangupProbability!==undefined?cs.hangupProbability:callSettings.hangupProbability
  };
  
  if($('call-incoming-val'))$('call-incoming-val').value=settings.incomingProbability;
  if($('call-pickup-val'))$('call-pickup-val').value=settings.pickupProbability;
  if($('call-busy-val'))$('call-busy-val').value=settings.busyProbability;
  if($('call-reject-val'))$('call-reject-val').value=settings.rejectProbability;
  if($('call-hangup-val'))$('call-hangup-val').value=settings.hangupProbability;
}

function bindCallSteppers(){
  document.querySelectorAll('#ov-call-settings .stepper').forEach(function(s){
    var input=s.querySelector('input');
    var stp=parseFloat(input.getAttribute('step'))||1;
    function stepDown(e){if(e)e.preventDefault();var v=parseFloat(input.value)||0;var nv=Math.max(0,v-stp);input.value=(stp<1?nv.toFixed(2):nv);input.dispatchEvent(new Event('change'));}
    function stepUp(e){if(e)e.preventDefault();var v=parseFloat(input.value)||0;var nv=v+stp;input.value=(stp<1?nv.toFixed(2):nv);input.dispatchEvent(new Event('change'));}
    var bm=s.querySelector('button:first-child');if(bm){bm.addEventListener('click',stepDown);bm.addEventListener('touchend',stepDown);}
    var bp=s.querySelector('button:last-child');if(bp){bp.addEventListener('click',stepUp);bp.addEventListener('touchend',stepUp);}
  });
}

async function saveCallSettings(){
  var incomingVal=parseFloat($('call-incoming-val').value)||8;
  var pickupVal=parseFloat($('call-pickup-val').value)||70;
  var busyVal=parseFloat($('call-busy-val').value)||15;
  var rejectVal=parseFloat($('call-reject-val').value)||15;
  var hangupVal=parseFloat($('call-hangup-val').value)||0.01;
  
  if(!callSettings.contactSettings)callSettings.contactSettings={};
  callSettings.contactSettings[currentCallContactId]={
    incomingProbability:incomingVal,
    pickupProbability:pickupVal,
    busyProbability:busyVal,
    rejectProbability:rejectVal,
    hangupProbability:hangupVal
  };
  
  ls('ml2_call_settings',callSettings);
}

async function loadCallHistory(){
  var saved=null;
  if(memoryCache.hasOwnProperty('ml2_call_history')){
    saved=memoryCache['ml2_call_history'];
  }
  if(!saved&&window.localforage){
    saved=await window.localforage.getItem('ml2_call_history');
  }
  // localStorage兜底
  if(!saved||!Array.isArray(saved)){
    var lsVal=safeGetItem('ml2_lf_ml2_call_history');
    if(lsVal){
      try{saved=JSON.parse(lsVal);}catch(e){}
    }
  }
  if(saved&&Array.isArray(saved)){
    callHistory=saved;
    memoryCache['ml2_call_history']=callHistory;
  }
}

async function saveCallHistory(){
  ls('ml2_call_history',callHistory);
}

function renderCallHistory(){
  var list=$('call-history-list');
  var empty=$('call-history-empty');
  
  if(callHistory.length===0){
    list.innerHTML='';
    empty.style.display='block';
    return;
  }
  
  empty.style.display='none';
  var sorted=callHistory.sort(function(a,b){return b.timestamp-a.timestamp});
  
  list.innerHTML=sorted.map(function(record){
    var direction=record.direction;
    var directionIcon=direction==='incoming'?'📞':'📲';
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
    
    return '<div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--c2);border-radius:10px;margin-bottom:8px;">'+
      '<div style="width:40px;height:40px;border-radius:50%;background:'+(direction==='incoming'?'#e8f5e9':'#fff3e0')+';display:flex;align-items:center;justify-content:center;font-size:18px;">'+directionIcon+'</div>'+
      '<div style="flex:1;">'+
        '<div style="display:flex;align-items:center;gap:6px;">'+
          '<span style="font-size:14px;font-weight:600;color:'+(direction==='incoming'?'#2e7d32':'#e65100')+';">'+directionText+'</span>'+
          '<span style="font-size:12px;font-weight:500;color:var(--txt);">'+(record.contactName||'对方')+'</span>'+
          '<span style="font-size:12px;'+statusColor+'">'+statusText+'</span>'+
        '</div>'+
        '<div style="font-size:12px;color:var(--txt3);margin-top:2px;">'+time+(status==='connected'||status==='disconnected'||status==='ended_by_user'||status==='hangup_by_contact'?' · '+duration:'')+'</div>'+
      '</div>'+
    '</div>';
  }).join('');
}

function initiateCall(){
  if(!cid){toast('请先选择联系人');return;}
  if(currentCall){toast('已有通话中');return;}
  
  var contact=contacts.find(function(c){return c.id===cid});
  if(!contact){toast('联系人不存在');return;}
  
  hideOv('ov-call');
  
  var random=Math.random()*100;
  var status='';
  
  var callMsgId=createCallMessage(contact.id,'calling',0);
  
  if(random<callSettings.busyProbability){
    status='busy';
    showCallingModal(contact,status);
    updateCallMessage(contact.id,callMsgId,status,0);
    setTimeout(function(){endCall(status,0)},3000);
    return;
  }
  
  if(random<callSettings.busyProbability+callSettings.rejectProbability){
    status='rejected';
    showCallingModal(contact,status);
    updateCallMessage(contact.id,callMsgId,status,0);
    setTimeout(function(){endCall(status,0)},3000);
    return;
  }
  
  if(random<callSettings.busyProbability+callSettings.rejectProbability+callSettings.pickupProbability){
    status='connected';
    showCallingModal(contact,status);
    startCallDuration();
    
    setTimeout(function(){
      minimizeCall();
      updateCallMessage(contact.id,callMsgId,status,0);
    },2000);
    // 注意：挂断概率统一由 startCallDuration() 处理（接听后10秒保护期 + 每30秒检查一次），
    // 此处不再单独设置定时器，避免重复/过早挂断。
  }else{
    status='missed';
    showCallingModal(contact,status);
    updateCallMessage(contact.id,callMsgId,status,0);
    setTimeout(function(){endCall(status,0)},5000);
  }
}

function showCallingModal(contact,status){
  currentCall={contactId:contact.id,contactName:contact.name,direction:'outgoing',status:status,timestamp:Date.now(),duration:0};
  
  if(contact.avatar){
    $('calling-avatar').innerHTML='<img src="'+contact.avatar.replace(/"/g,'&quot;')+'" style="display:block;width:100%;height:100%;object-fit:cover;">';
  }else{
    $('calling-avatar').textContent='✦';
  }
  $('calling-name').textContent=contact.name;
  
  if(status==='connected'){
    $('calling-status').textContent='正在通话...';
  }else if(status==='busy'){
    $('calling-status').textContent='对方忙线中...';
  }else if(status==='rejected'){
    $('calling-status').textContent='对方已拒绝';
  }else{
    $('calling-status').textContent='正在呼叫...';
  }
  
  $('calling-duration').textContent='00:00';
  
  // 加载通话背景（按联系人独立）
  var savedBg=contact.id?ls('ml2_call_bg_'+contact.id):'';
  var bg=$('calling-bg');
  if(bg){
    bg.style.backgroundImage=savedBg?'url('+savedBg+')':'';
    bg.style.backgroundSize='cover';
    bg.style.backgroundPosition='center';
  }
  
  showOv('ov-calling');
  
  // Show end button for outgoing calls, hide incoming buttons
  if($('calling-incoming-btns'))$('calling-incoming-btns').style.display='none';
  // outgoing 的 rejected/busy/missed 是自动结束状态，不显示挂断按钮避免用户误触覆盖终态消息
  if(status==='rejected'||status==='busy'||status==='missed'){
    if($('calling-end-btn-wrap'))$('calling-end-btn-wrap').style.display='none';
  }else{
    if($('calling-end-btn-wrap'))$('calling-end-btn-wrap').style.display='block';
  }
}

function startCallDuration(){
  callStartTime=Date.now();
  currentCall.duration=0;
  if(currentCall&&currentCall.status==='connected'){
    callConnectedTime=Date.now();
  }
  var _checkCounter=0; // 挂断概率检查计数器

  callDurationTimer=setInterval(function(){
    if(!currentCall)return;
    var elapsed=Math.floor((Date.now()-callStartTime)/1000);
    currentCall.duration=elapsed;
    var minutes=Math.floor(elapsed/60);
    var seconds=elapsed%60;
    var timeStr=(minutes<10?'0':'')+minutes+':'+(seconds<10?'0':'')+seconds;
    if($('calling-duration'))$('calling-duration').textContent=timeStr;
    if($('call-mini-time'))$('call-mini-time').textContent=timeStr;

    if(minutes>=80){
      endCall('hangup_by_contact',currentCall.duration);
      return;
    }

    // 仅在已接听（connected）状态才检查对方主动挂断概率
    if(currentCall.status!=='connected')return;

    // 保护期：接通后至少10秒内不检查挂断
    if(Date.now()-callConnectedTime<10000)return;

    // 每30秒才检查一次挂断概率（用户配置：每30秒检查一次）
    _checkCounter++;
    if(_checkCounter<30)return;
    _checkCounter=0;

    var hangupProb=callSettings.hangupProbability;
    if(hangupProb===undefined||hangupProb===null)hangupProb=0.01;
    if(Math.random()*100<hangupProb){
      endCall('hangup_by_contact',currentCall.duration);
    }
  },1000);
}

function createCallMessage(contactId,status){
  var m=msgs(contactId);
  var contact=contacts.find(function(c){return c.id===contactId});
  var callMsg=contact?'📞 正在呼叫 '+contact.name+'...':'📞 正在呼叫...';
  var callMsgId='call_'+Date.now();
  m.push({id:callMsgId,s:OTHER,t:'',ts:new Date(),pc:false,isAuto:true,isInitiative:false,isCall:true,callStatus:status,callDuration:0,callMessage:callMsg,senderName:'系统',read:false});
  savemsgs(contactId,m);
  if(cid===contactId){renderMsgs(m)}
  renderChatList();
  return callMsgId;
}

function updateCallMessage(contactId,callMsgId,status,duration){
  var m=msgs(contactId);
  var msgIndex=m.findIndex(function(msg){return msg.id===callMsgId});
  if(msgIndex>=0){
    var callMsg='';
    var contact=contacts.find(function(c){return c.id===contactId});
    var contactName=contact?contact.name:'对方';
    if(status==='connected'){
      var isIncoming=currentCall&&currentCall.direction==='incoming';
      callMsg='📞 '+(isIncoming?'我':contactName)+' 已接通电话';
    }else if(status==='busy'){
      callMsg='📞 '+contactName+' 忙线中';
    }else if(status==='rejected'){
      callMsg='📞 '+contactName+' 已拒绝通话';
    }else{
      callMsg='📞 '+contactName+' 未接通';
    }
    m[msgIndex].callMessage=callMsg;
    m[msgIndex].callStatus=status;
    m[msgIndex].callDuration=duration;
    savemsgs(contactId,m);
    if(cid===contactId){renderMsgs(m)}
    renderChatList();
  }
}

// 用户主动挂断（防止与概率挂断的竞态条件）
function userEndCall(){
  if(!currentCall){
    // 通话可能已被概率挂断结束，直接清理界面
    if($('call-mini-bar'))$('call-mini-bar').style.display='none';
    hideOv('ov-calling');
    return;
  }
  // 先清除所有计时器，避免概率检查在 endCall 前触发
  if(incomingRingtoneAudio){try{incomingRingtoneAudio.pause();incomingRingtoneAudio=null}catch(e){}}
  if(incomingCallTimer){clearInterval(incomingCallTimer);incomingCallTimer=null}
  if(callDurationTimer){clearInterval(callDurationTimer);callDurationTimer=null}
  if($('calling-countdown'))$('calling-countdown').style.display='none';
  // 用户主动挂断标记为 ended_by_user
  endCall('ended_by_user',currentCall.duration);
}

function endCall(status,duration){
  if(!currentCall)return;
  var callContactId=currentCall.contactId;
  var callDirection=currentCall.direction;
  var callContactName=currentCall.contactName||(contacts.find(function(c){return c.id===callContactId})||{}).name||'对方';
  
  // Stop ringtone
  if(incomingRingtoneAudio){
    try{incomingRingtoneAudio.pause();incomingRingtoneAudio=null}catch(e){}
  }
  
  // Stop countdown timer
  if(incomingCallTimer){
    clearInterval(incomingCallTimer);
    incomingCallTimer=null;
  }
  if($('calling-countdown'))$('calling-countdown').style.display='none';
  
  clearInterval(callDurationTimer);
  callDurationTimer=null;
  
  // 记录通话结束时间，用于冷却判断（在设置currentCall.status前先保存contactId）
  lastCallEndTime[callContactId]=Date.now();
  
  currentCall.status=status;
  currentCall.duration=duration;
  
  callHistory.push(currentCall);
  saveCallHistory();
  
  var contactId=callContactId;
  var contact=contacts.find(function(c){return c.id===contactId});
  
  currentCall=null;
  
  if(contactId){
    _callChecks[contactId]={count:0,lastTime:0};
  }
  
  // Reset button states
  if($('calling-incoming-btns'))$('calling-incoming-btns').style.display='none';
  if($('calling-end-btn-wrap'))$('calling-end-btn-wrap').style.display='block';
  if($('calling-countdown'))$('calling-countdown').style.display='none';
  
  hideOv('ov-calling');
  // 强制隐藏小窗（兜底：即使之前的操作出错也能隐藏）
  var mb=$('call-mini-bar');if(mb)mb.style.display='none';
  
  if($('call-history-list'))renderCallHistory();
  if($('contact-profile-call-list')&&cid)renderContactCallHistory(cid);
  
  var callMsg='';
  var contactName=contact?contact.name:callContactName;
  var myName=me&&me.name?me.name:'我';
  if(status==='connected'){
    toast('通话结束');
    callMsg='📞 通话已接通，时长 '+formatDuration(duration);
  }else if(status==='ended_by_user'){
    toast(myName+' 已挂断');
    if(callDirection==='incoming'){
      callMsg='📞 '+myName+' 挂断了来电，时长 '+formatDuration(duration);
    }else{
      callMsg='📞 '+myName+' 已挂断通话，时长 '+formatDuration(duration);
    }
  }else if(status==='hangup_by_contact'){
    toast(contactName+' 已挂断');
    if(callDirection==='incoming'){
      callMsg='📞 '+contactName+' 挂断了电话，时长 '+formatDuration(duration);
    }else{
      callMsg='📞 '+contactName+' 挂断了电话，时长 '+formatDuration(duration);
    }
  }else if(status==='rejected'){
    if(callDirection==='incoming'){
      toast(myName+' 已拒绝来电');
      callMsg='📞 '+myName+' 拒绝了 '+contactName+' 的来电';
    }else{
      toast(contactName+' 已拒绝');
      callMsg='📞 '+contactName+' 已拒绝通话';
    }
  }else if(status==='missed'){
    toast('未接听');
    callMsg='📞 '+contactName+' 来电未接听';
  }else if(status==='busy'){
    toast(contactName+' 忙线中');
    callMsg='📞 '+contactName+' 忙线中';
  }else if(status==='disconnected'){
    var durStr=formatDuration(duration);
    toast('通话中断（'+durStr+'）');
    callMsg='📞 通话异常中断（时长 '+durStr+'）';
  }else{
    toast(contactName+' 未接通');
    callMsg='📞 '+contactName+' 未接通';
  }
  
  if(contactId){
    var m=msgs(contactId);
    var lastCallMsg=m.filter(function(msg){return msg.isCall}).pop();
    
    if(lastCallMsg&&lastCallMsg.callMessage==='📞 通话已接通'&&status==='connected'){
      updateCallMessage(contactId,lastCallMsg.id,status,duration);
    }else if(lastCallMsg&&lastCallMsg.callStatus&&lastCallMsg.callStatus!=='calling'){
      // 兜底保护：已是终态（rejected/busy/missed）的消息不被 ended_by_user 覆盖
      var _isTerminal=['rejected','busy','missed'].indexOf(lastCallMsg.callStatus)>=0;
      var _isUserOverride=status==='ended_by_user';
      if(!(_isTerminal&&_isUserOverride)){
        lastCallMsg.callMessage=callMsg;
        lastCallMsg.callStatus=status;
        lastCallMsg.callDuration=duration;
        savemsgs(contactId,m);
        if(cid===contactId){renderMsgs(m)}
        renderChatList();
      }
    }else{
      m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),s:OTHER,t:'',ts:new Date(),pc:false,isAuto:true,isInitiative:false,isCall:true,callStatus:status,callDuration:duration,callMessage:callMsg,senderName:'系统',read:false});
      savemsgs(contactId,m);
      if(cid===contactId){renderMsgs(m)}
      renderChatList();
    }
  }
}

function formatDuration(seconds){
  if(!seconds)return '0秒';
  var m=Math.floor(seconds/60);
  var s=seconds%60;
  if(m>0)return m+'分'+s+'秒';
  return s+'秒';
}

function minimizeCall(){
  hideOv('ov-calling');
  var bar=$('call-mini-bar');
  var currentActive=document.querySelector('.page.active');
  var currentId=currentActive?currentActive.id:'';
  if(currentId==='pg-conv'){
    bar.style.display='flex';
  }else{
    bar.style.display='none';
  }
  // 恢复保存的位置，否则居中显示
  if(callMiniBarPos){
    bar.style.left=callMiniBarPos.left;
    bar.style.top=callMiniBarPos.top;
    bar.style.bottom=callMiniBarPos.bottom;
    bar.style.transform=callMiniBarPos.transform;
  }else{
    bar.style.left='50%';
    bar.style.bottom='100px';
    bar.style.top='auto';
    bar.style.transform='translateX(-50%)';
  }
  if(currentCall){
    var contact=contacts.find(function(c){return c.id===currentCall.contactId});
    if(contact){
      if(contact.avatar){
        $('call-mini-avatar').innerHTML='<img src="'+contact.avatar.replace(/"/g,'&quot;')+'" style="display:block;width:100%;height:100%;object-fit:cover;">';
      }else{
        $('call-mini-avatar').textContent='✦';
      }
      $('call-mini-name').textContent=contact.nickname||'通话中';
      updateMiniCallTime();
    }
  }
  // 加载通话半框背景图片（按联系人独立）
  var callBg=currentCall&&currentCall.contactId?ls('ml2_call_bg_'+currentCall.contactId):'';
  if(callBg){
    bar.style.backgroundImage='url('+callBg+')';
  }else{
    bar.style.backgroundImage='';
  }
}

function updateMiniCallTime(){
  if(currentCall){
    var elapsed;
    if(currentCall.startTime){
      elapsed=Math.floor((Date.now()-currentCall.startTime)/1000);
    }else{
      elapsed=currentCall.duration||0;
    }
    var m=Math.floor(elapsed/60);
    var s=elapsed%60;
    $('call-mini-time').textContent=(m<10?'0':'')+m+':'+(s<10?'0':'')+s;
  }
}

var callMiniBarPos=null; // 保存通话小框的拖拽位置（监听器在脚本3附加，确保小窗DOM已存在）

document.addEventListener('visibilitychange',function(){
  if(!currentCall)return;
  if(document.hidden){
    minimizeCall();
  }else{
    if(currentCall.status==='connected'){
      var elapsed=Math.floor((Date.now()-callStartTime)/1000);
      currentCall.duration=elapsed;
      updateMiniCallTime();
    }
  }
});

function checkIncomingCall(){
  if(!hasEnteredApp)return;
  if(!cid)return;
  if(currentCall&&currentCall.contactId===cid)return;
  if(currentCall)return;
  if(pomodoroState.isRunning&&!pomodoroState.isPaused&&pomodoroSettings.blockDuringFocus)return;
  
  // 冷却时间：通话结束后60秒内不会再接到同一联系人来电
  var lastEnd=lastCallEndTime[cid]||0;
  if(Date.now()-lastEnd<60000)return;
  
  var cs=callSettings.contactSettings[cid]||{};
  var enabled=cs.enabled!==undefined?cs.enabled:true;
  if(!enabled)return;
  
  var incomingProb=cs.incomingProbability!==undefined?cs.incomingProbability:callSettings.incomingProbability;
  var random=Math.random()*100;
  if(random<incomingProb){
    var contact=contacts.find(function(c){return c.id===cid});
    if(!contact)return;
    
    currentCall={contactId:contact.id,contactName:contact.name,direction:'incoming',status:'ringing',timestamp:Date.now(),duration:0};
    
    if(contact.avatar){
      $('calling-avatar').innerHTML='<img src="'+contact.avatar.replace(/"/g,'&quot;')+'" style="display:block;width:100%;height:100%;object-fit:cover;">';
    }else{
      $('calling-avatar').textContent='✦';
    }
    $('calling-name').textContent=contact.name;
    $('calling-status').textContent='对方来电...';
    $('calling-duration').textContent='00:00';
    
    // 加载通话背景（按联系人独立）
    var savedBg=contact.id?ls('ml2_call_bg_'+contact.id):'';
    var bg=$('calling-bg');
    if(bg){
      bg.style.backgroundImage=savedBg?'url('+savedBg+')':'';
      bg.style.backgroundSize='cover';
      bg.style.backgroundPosition='center';
    }
    
    showOv('ov-calling');
    startCallDuration();
    
    // 在聊天中插入来电消息
    var callMsgId='call_'+Date.now();
    var inMsgs=msgs(contact.id);
    inMsgs.push({id:callMsgId,s:OTHER,t:'',ts:new Date(),pc:false,isAuto:true,isInitiative:false,isCall:true,callStatus:'ringing',callDuration:0,callMessage:'📞 '+contact.name+' 来电',senderName:'系统',read:false});
    savemsgs(contact.id,inMsgs);
    var _callCid=contact.id;
    var _callMsgs=inMsgs;
    setTimeout(function(){
      if(cid===_callCid){renderMsgs(_callMsgs)}
      renderChatList();
    },150);
    currentCall.callMsgId=callMsgId;
    
    // Show incoming call buttons
    if($('calling-incoming-btns'))$('calling-incoming-btns').style.display='flex';
    if($('calling-end-btn-wrap'))$('calling-end-btn-wrap').style.display='none';
    
    // Play ringtone
    var ringtone=(contact.soundSettings&&contact.soundSettings.ringtone)||contact.ringtone;
    if(ringtone){
      try{
        if(incomingRingtoneAudio){incomingRingtoneAudio.pause();incomingRingtoneAudio=null}
        incomingRingtoneAudio=new Audio(ringtone);
        incomingRingtoneAudio.loop=true;
        incomingRingtoneAudio.volume=0.8;
        incomingRingtoneAudio.play().catch(function(e){});
      }catch(e){}
    }
    
    // Show notification
    if('Notification' in window&&Notification.permission==='granted'){
      try{var n=new Notification(contact.name+' 来电',{body:'对方正在呼叫你...',icon:contact.avatar||'',tag:'milk-call'});n.onclick=function(){window.focus();n.close()};setTimeout(function(){n.close()},30000)}catch(e){}
    }
    
    // 来电最多响铃30秒，超时未接则记为「未接电话」
    if($('calling-countdown'))$('calling-countdown').style.display='block';
    var _inCount=30;
    if($('calling-countdown'))$('calling-countdown').textContent=_inCount+'秒后未接听';
    if(incomingCallTimer){clearInterval(incomingCallTimer);incomingCallTimer=null;}
    incomingCallTimer=setInterval(function(){
      if(!currentCall||currentCall.direction!=='incoming'||currentCall.status!=='ringing'){
        clearInterval(incomingCallTimer);incomingCallTimer=null;return;
      }
      _inCount--;
      if(_inCount<=0){
        clearInterval(incomingCallTimer);incomingCallTimer=null;
        if($('calling-countdown'))$('calling-countdown').style.display='none';
        endCall('missed',0);
      }else if($('calling-countdown')){
        $('calling-countdown').textContent=_inCount+'秒后未接听';
      }
    },1000);
  }
}
function checkIncomingCallForContact(contactId){
  if(!hasEnteredApp)return;
  if(!contactId)return;
  if(currentCall&&currentCall.contactId===contactId)return;
  if(currentCall)return;
  if(pomodoroState.isRunning&&!pomodoroState.isPaused&&pomodoroSettings.blockDuringFocus)return;

  // 冷却时间：通话结束后60秒内不会再接到同一联系人来电
  var lastEnd=lastCallEndTime[contactId]||0;
  if(Date.now()-lastEnd<60000)return;

  // 检查免打扰是否开启「禁止联系人主动打电话」
  var _s=ls('ml2_speed')||{};
  if(_s.dnd_block_call===1)return;

  var cs=callSettings.contactSettings[contactId]||{};
  var enabled=cs.enabled!==undefined?cs.enabled:true;
  if(!enabled)return;

  // 上次来电触发后，必须间隔至少 5 分钟才能再次触发同一联系人来电
  var lastIncoming=lastIncomingCallTime[contactId]||0;
  if(Date.now()-lastIncoming<300000)return;
  
  var incomingProb=cs.incomingProbability!==undefined?cs.incomingProbability:callSettings.incomingProbability;
  var random=Math.random()*100;
  if(random<incomingProb){
    // 记录触发时间，防止短期内重复触发
    lastIncomingCallTime[contactId]=Date.now();
    var contact=contacts.find(function(c){return c.id===contactId});
    if(!contact)return;
    
    currentCall={contactId:contact.id,contactName:contact.name,direction:'incoming',status:'ringing',timestamp:Date.now(),duration:0};
    
    if(contact.avatar){
      $('calling-avatar').innerHTML='<img src="'+contact.avatar.replace(/"/g,'&quot;')+'" style="display:block;width:100%;height:100%;object-fit:cover;">';
    }else{
      $('calling-avatar').textContent='✦';
    }
    $('calling-name').textContent=contact.name;
    $('calling-status').textContent='对方来电...';
    $('calling-duration').textContent='00:00';
    
    // 加载通话背景（按联系人独立）
    var savedBg=contact.id?ls('ml2_call_bg_'+contact.id):'';
    var bg=$('calling-bg');
    if(bg){
      bg.style.backgroundImage=savedBg?'url('+savedBg+')':'';
      bg.style.backgroundSize='cover';
      bg.style.backgroundPosition='center';
    }
    
    showOv('ov-calling');
    startCallDuration();
    
    // 在聊天中插入来电消息
    var callMsgId2='call_'+Date.now();
    var inMsgs2=msgs(contact.id);
    inMsgs2.push({id:callMsgId2,s:OTHER,t:'',ts:new Date(),pc:false,isAuto:true,isInitiative:false,isCall:true,callStatus:'ringing',callDuration:0,callMessage:'📞 '+contact.name+' 来电',senderName:'系统',read:false});
    savemsgs(contact.id,inMsgs2);
    var _callCid2=contact.id;
    var _callMsgs2=inMsgs2;
    setTimeout(function(){
      if(cid===_callCid2){renderMsgs(_callMsgs2)}
      renderChatList();
    },150);
    currentCall.callMsgId=callMsgId2;
    
    // Show incoming call buttons
    if($('calling-incoming-btns'))$('calling-incoming-btns').style.display='flex';
    if($('calling-end-btn-wrap'))$('calling-end-btn-wrap').style.display='none';
    
    // Play ringtone
    var ringtone2=(contact.soundSettings&&contact.soundSettings.ringtone)||contact.ringtone;
    if(ringtone2){
      try{
        if(incomingRingtoneAudio){incomingRingtoneAudio.pause();incomingRingtoneAudio=null}
        incomingRingtoneAudio=new Audio(ringtone2);
        incomingRingtoneAudio.loop=true;
        incomingRingtoneAudio.volume=0.8;
        incomingRingtoneAudio.play().catch(function(e){});
      }catch(e){}
    }
    
    // Show notification
    if('Notification' in window&&Notification.permission==='granted'){
      try{var n=new Notification(contact.name+' 来电',{body:'对方正在呼叫你...',icon:contact.avatar||'',tag:'milk-call'});n.onclick=function(){window.focus();n.close()};setTimeout(function(){n.close()},30000)}catch(e){}
    }
    
    // 来电最多响铃30秒，超时未接则记为「未接电话」
    if($('calling-countdown'))$('calling-countdown').style.display='block';
    var _inCount2=30;
    if($('calling-countdown'))$('calling-countdown').textContent=_inCount2+'秒后未接听';
    if(incomingCallTimer){clearInterval(incomingCallTimer);incomingCallTimer=null;}
    incomingCallTimer=setInterval(function(){
      if(!currentCall||currentCall.direction!=='incoming'||currentCall.status!=='ringing'){
        clearInterval(incomingCallTimer);incomingCallTimer=null;return;
      }
      _inCount2--;
      if(_inCount2<=0){
        clearInterval(incomingCallTimer);incomingCallTimer=null;
        if($('calling-countdown'))$('calling-countdown').style.display='none';
        endCall('missed',0);
      }else if($('calling-countdown')){
        $('calling-countdown').textContent=_inCount2+'秒后未接听';
      }
    },1000);
  }
}

async function searchChatRecords(){
  var keyword=$('search-chat-input').value.trim();
  var resultsContainer=$('search-chat-results');
  resultsContainer.innerHTML='';
  
  if(!keyword){
    resultsContainer.innerHTML='<div style="text-align:center;color:var(--txt3);padding:20px">输入关键词搜索聊天记录</div>';
    return;
  }
  
  if(!cid){
    resultsContainer.innerHTML='<div style="text-align:center;color:var(--txt3);padding:20px">请先选择联系人</div>';
    return;
  }
  
  var contact=contacts.find(function(c){return c.id===cid});
  if(!contact){
    resultsContainer.innerHTML='<div style="text-align:center;color:var(--txt3);padding:20px">联系人不存在</div>';
    return;
  }
  
  var allMessages=msgs(cid);
  if(allMessages.length===0&&window.localforage){
    try{
      var dbVal=await window.localforage.getItem(LM+cid);
      if(dbVal&&Array.isArray(dbVal)){
        memoryCache[LM+cid]=dbVal;
        allMessages=dbVal.map(function(x){
          x.ts=new Date(x.ts);
          if(x.img&&typeof x.img==='string'&&x.img.startsWith('ml2_msg_img_')){
            var cached=memoryCache['_img_'+x.img];
            if(cached){x.img=cached;}
          }
          if(x.originalImg&&typeof x.originalImg==='string'&&x.originalImg.startsWith('ml2_msg_img_')){
            var cachedOrig=memoryCache['_img_'+x.originalImg];
            if(cachedOrig){x.originalImg=cachedOrig;}
          }
          return x;
        });
      }
    }catch(e){}
  }
  
  var filtered=allMessages.filter(function(m){
    if(m.t&&typeof m.t==='string'){
      return m.t.toLowerCase().indexOf(keyword.toLowerCase())!==-1;
    }
    if(m.img){
      return '[图片]'.toLowerCase().indexOf(keyword.toLowerCase())!==-1;
    }
    if(m.isTouch&&m.touchAction){
      return m.touchAction.toLowerCase().indexOf(keyword.toLowerCase())!==-1;
    }
    return false;
  });
  
  // 按时间倒序排列（最新的在最上面）
  filtered.sort(function(a,b){
    var ta=a.ts?new Date(a.ts).getTime():0;
    var tb=b.ts?new Date(b.ts).getTime():0;
    return tb-ta;
  });
  
  // 显示搜索结果条数
  var countText='<div style="font-size:12px;color:var(--txt3);padding:4px 0 8px;">找到 '+filtered.length+' 条相关聊天记录</div>';
  
  if(filtered.length===0){
    resultsContainer.innerHTML='<div style="text-align:center;color:var(--txt3);padding:20px">未找到相关消息</div>';
    return;
  }
  
  resultsContainer.innerHTML=countText;
  
  filtered.forEach(function(msg){
    var resultItem=document.createElement('div');
    resultItem.style.background='var(--c2)';
    resultItem.style.borderRadius='10px';
    resultItem.style.padding='12px';
    resultItem.style.marginBottom='8px';
    resultItem.style.cursor='pointer';
    resultItem.style.transition='background .2s';
    
    var timeStr=new Date(msg.ts).toLocaleString('zh-CN',{
      month:'2-digit',
      day:'2-digit',
      hour:'2-digit',
      minute:'2-digit'
    });
    
    var displayText='';
    if(msg.t&&typeof msg.t==='string'){
      displayText=msg.t.replace(new RegExp(keyword,'gi'),'<span style="background:#ffe58f;border-radius:2px;padding:0 2px">'+keyword+'</span>');
    }else if(msg.img){
      displayText='[图片]';
    }else if(msg.isTouch&&msg.touchAction){
      displayText=msg.touchAction.replace(new RegExp(keyword,'gi'),'<span style="background:#ffe58f;border-radius:2px;padding:0 2px">'+keyword+'</span>');
    }
    
    resultItem.innerHTML='<div style="font-size:12px;color:var(--txt3);margin-bottom:4px">'+(msg.s===SELF?'我':'对方')+' · '+timeStr+'</div>'+
      '<div style="font-size:14px;color:var(--txt);line-height:1.5;word-break:break-all">'+displayText+'</div>';
    
    resultItem.addEventListener('click',function(){
      hideOv('ov-search-chat');
      scrollToMessage(msg.id);
    });
    
    resultItem.addEventListener('mouseenter',function(){
      resultItem.style.background='var(--c3)';
    });
    
    resultItem.addEventListener('mouseleave',function(){
      resultItem.style.background='var(--c2)';
    });
    
    resultsContainer.appendChild(resultItem);
  });
  
  $('search-chat-back-btn').style.display='block';
}
function scrollToMessage(msgId){
  var msgbox=$('msgbox');
  var msgEl=document.querySelector('[data-mid="'+msgId+'"]');
  if(msgEl&&msgbox){
    msgEl.scrollIntoView({behavior:'smooth',block:'center'});
    msgEl.style.background='rgba(201,169,110,0.1)';
    setTimeout(function(){
      msgEl.style.background='';
    },2000);
  }
}
function showFullDivination(){divineMode='full';resetDivine();renderDContacts();showPg('pg-divine-full')}

if($('btn-prev-contact')){
  $('btn-prev-contact').addEventListener('click',function(){
    var prevContactId=getPrevContact();
    if(prevContactId)openConv(prevContactId);
  });
  $('btn-prev-contact').addEventListener('touchend',function(e){
    e.preventDefault();
    var prevContactId=getPrevContact();
    if(prevContactId)openConv(prevContactId);
  });
}
if($('btn-next-contact')){
  $('btn-next-contact').addEventListener('click',function(){
    var nextContactId=getNextContact();
    if(nextContactId)openConv(nextContactId);
  });
  $('btn-next-contact').addEventListener('touchend',function(e){
    e.preventDefault();
    var nextContactId=getNextContact();
    if(nextContactId)openConv(nextContactId);
  });
}
// 顶部栏切换联系人按钮
if($('btn-switch-contact')){
  $('btn-switch-contact').addEventListener('click',function(){
    showContactSwitcher();
  });
  $('btn-switch-contact').addEventListener('touchend',function(e){
    e.preventDefault();
    showContactSwitcher();
  });
}

// ---------- Contact Switcher ----------
if($('contact-switcher-btn')){
  $('contact-switcher-btn').addEventListener('click',function(){
    showContactSwitcher();
  });
  $('contact-switcher-btn').addEventListener('touchend',function(e){
    e.preventDefault();
    showContactSwitcher();
  });
}

function showContactSwitcher(){
  var list=$('contact-switcher-list');
  if(!list)return;
  var allContacts=contacts.slice();
  var allGroups=groups.slice();
  var html='';
  // ★ 修复：切换窗口加入群聊（之前只显示联系人，无法切到群聊）
  if(allGroups.length>0){
    html+='<div style="padding:8px 12px 4px;font-size:12px;color:var(--txt3);font-weight:600;">👥 群聊</div>';
    allGroups.forEach(function(g){
      var isActive=g.id===cid;
      var avatarHtml=g.avatar?'<img src="'+g.avatar.replace(/"/g,'&quot;')+'" style="width:40px;height:40px;border-radius:10px;object-fit:cover;">':'<div style="width:40px;height:40px;border-radius:10px;background:var(--c3);display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--txt2);">👥</div>';
      html+='<div class="contact-switcher-item" data-cid="'+g.id.replace(/"/g,'&quot;')+'" data-type="group" style="display:flex;align-items:center;gap:12px;padding:10px 12px;margin:2px 4px;border-radius:10px;cursor:pointer;background:'+(isActive?'var(--c3)':'var(--c2)')+';transition:background 0.15s;">'+
        avatarHtml+
        '<div style="flex:1;min-width:0;">'+
          '<div style="font-size:15px;font-weight:'+(isActive?'600':'400')+';color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+g.name.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div>'+
          '<div style="font-size:12px;color:var(--txt3);">'+(isActive?'当前聊天':'群聊')+'</div>'+
        '</div>'+
      '</div>';
    });
  }
  if(allContacts.length>0){
    html+='<div style="padding:8px 12px 4px;font-size:12px;color:var(--txt3);font-weight:600;">👤 联系人</div>';
  }
  allContacts.forEach(function(c){
    var isActive=c.id===cid;
    var avatarHtml=c.avatar?'<img src="'+c.avatar.replace(/"/g,'&quot;')+'" style="width:40px;height:40px;border-radius:10px;object-fit:cover;">':'<div style="width:40px;height:40px;border-radius:10px;background:var(--c3);display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--txt2);">✦</div>';
    html+='<div class="contact-switcher-item" data-cid="'+c.id.replace(/"/g,'&quot;')+'" style="display:flex;align-items:center;gap:12px;padding:10px 12px;margin:2px 4px;border-radius:10px;cursor:pointer;background:'+(isActive?'var(--c3)':'var(--c2)')+';transition:background 0.15s;">'+
      avatarHtml+
      '<div style="flex:1;min-width:0;">'+
        '<div style="font-size:15px;font-weight:'+(isActive?'600':'400')+';color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+c.name.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div>'+
        '<div style="font-size:12px;color:var(--txt3);">'+(isActive?'当前聊天':'')+'</div>'+
      '</div>'+
    '</div>';
  });
  list.innerHTML=html;
  list.querySelectorAll('.contact-switcher-item').forEach(function(item){
    item.addEventListener('click',function(){
      var targetCid=this.dataset.cid;
      hideOv('ov-contact-switcher');
      if(targetCid&&targetCid!==cid){
        openConv(targetCid);
      }
    });
    item.addEventListener('touchend',function(e){
      e.preventDefault();
      var targetCid=this.dataset.cid;
      hideOv('ov-contact-switcher');
      if(targetCid&&targetCid!==cid){
        openConv(targetCid);
      }
    });
    item.addEventListener('mouseenter',function(){
      if(this.dataset.cid!==cid)this.style.background='var(--c3)';
    });
    item.addEventListener('mouseleave',function(){
      if(this.dataset.cid!==cid)this.style.background='var(--c2)';
    });
  });
  showOv('ov-contact-switcher');
}

// ---------- Non-Instant Chat ----------
var nonInstantCid=null;
var LMNI='star_noninstant_';

function nonInstantMsgs(id){
  var key=LMNI+id;
  var m=ls(key)||[];
  if(!Array.isArray(m))m=[];
  m.forEach(function(x){
    if(x.ts&&!(x.ts instanceof Date)){
      x.ts=new Date(x.ts);
    }
  });
  return m;
}
function saveNonInstantMsgs(id,m){
  var key=LMNI+id;
  var data=m.map(function(x){
    return{
      id:x.id,
      s:x.s,
      t:x.t,
      img:x.img,
      imgs:x.imgs,
      ts:x.ts instanceof Date?x.ts.toISOString():x.ts,
      pc:x.pc,
      isAuto:x.isAuto,
      isInitiative:x.isInitiative,
      quote:x.quote,
      liked:x.liked,
      isSticker:x.isSticker,
      isRedpacket:x.isRedpacket,
      redpacketAmount:x.redpacketAmount,
      redpacketGreeting:x.redpacketGreeting,
      redpacketStatus:x.redpacketStatus,
      redpacketDirection:x.redpacketDirection,
      redpacketRpId:x.redpacketRpId,
      redpacketOpened:x.redpacketOpened
    }
  });
  ls(key,data);
}

function openNonInstantChat(){
  nonInstantMode=true;
  var lastCid=ls('nonInstantLastCid');
  if(lastCid&&contacts.find(function(x){return x.id===lastCid})){
    selectNonInstantContact(lastCid);
  }else{
    nonInstantCid=null;
    var ctni=$('conv-title-noninstant');if(ctni)ctni.textContent='选择联系人';
    var mbni=$('msgbox-noninstant');if(mbni)mbni.innerHTML='<div class="empty" style="padding:60px 0">请选择一个联系人开始传讯</div>';
  }
  showPg('pg-noninstant');
}

function toggleNonInstantContactList(){
  var list=$('noninstant-contact-list');
  if(list.style.display==='block'){
    list.style.display='none';
  }else{
    renderNonInstantContactList();
    list.style.display='block';
  }
}

function renderNonInstantContactList(){
  var list=$('noninstant-contact-list');
  if(!contacts.length){
    list.innerHTML='<div style="padding:20px;text-align:center;color:var(--txt3)">暂无联系人</div>';
    return;
  }
  list.innerHTML=contacts.map(function(c){
    var av=c.avatar?'<img src="'+c.avatar.replace(/"/g,'&quot;')+'">':'';
    return'<div class="citem" style="padding:12px 16px;border-bottom:1px solid var(--border);cursor:pointer;" onclick="selectNonInstantContact(\''+c.id+'\')"><div class="cav" style="width:40px;height:40px">'+av+'</div><div class="cinfo"><div class="cn" style="font-size:14px">'+c.name+'</div><div class="cp" style="font-size:12px;color:var(--txt3)">非即时传讯</div></div></div>';
  }).join('');
}

function selectNonInstantContact(id){
  nonInstantCid=id;
  ls('nonInstantLastCid',id);
  var c=contacts.find(function(x){return x.id===id});
  if(c){
    var ctni=$('conv-title-noninstant');if(ctni)ctni.textContent=c.name;
    var bsni=$('btn-send-noninstant');if(bsni)bsni.disabled=false;
    renderNonInstantMsgs();
  }
  var ncl=$('noninstant-contact-list');if(ncl)ncl.style.display='none';
}

function renderNonInstantMsgs(){
  if(!nonInstantCid)return;
  var c=contacts.find(function(x){return x.id===nonInstantCid});
  if(!c)return;
  var m=nonInstantMsgs(nonInstantCid);
  var box=$('msgbox-noninstant');if(!box)return;
  var av=function(isS){if(isS)return c&&c.myAvatar?'<img src="'+c.myAvatar.replace(/"/g,'&quot;')+'">':me.avatar?'<img src="'+me.avatar.replace(/"/g,'&quot;')+'">':'✦';return c&&c.avatar?'<img src="'+c.avatar.replace(/"/g,'&quot;')+'">':'✦'};
  var cd='',html='<div class="ph"></div>',lt=0,GAP=300000;
  m.forEach(function(x,idx){
    var d=x.ts instanceof Date?x.ts:new Date(x.ts),ds=d.toDateString();
    if(ds!==cd){cd=ds;var td=new Date().toDateString(),yd=new Date(Date.now()-864e5).toDateString();html+='<div class="th"></div><div class="ts">'+(ds===td?'今天':ds===yd?'昨天':fd(d))+'</div>'}
    var gap=idx===0||(d.getTime()-lt)>GAP;
    var isLiked=x.liked?'true':'false';
    
    var quoteHtml='';
    if(x.quote){
      var quoteMsg=m.find(function(msg){return msg.id===x.quote});
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
        }else if(quoteMsg.moodCard||quoteMsg.heartCard||quoteMsg.intentCard){
          var cardParts2=[];
          if(quoteMsg.moodCard&&quoteMsg.moodCard.content)cardParts2.push('💭 '+quoteMsg.moodCard.content);
          if(quoteMsg.heartCard&&quoteMsg.heartCard.content)cardParts2.push('❤️ '+quoteMsg.heartCard.content);
          if(quoteMsg.intentCard&&quoteMsg.intentCard.content)cardParts2.push('💬 '+quoteMsg.intentCard.content);
          quoteContent=cardParts2.join(' ');
        }else if(quoteMsg.t){
          // 修复：确保非字符串类型（数字、对象等）不会导致后续 .replace() 崩溃
          quoteContent=String(quoteMsg.t);
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
    
    var isRedpacketMsg=false;
    var rpContentHtml='';
    if(x.isRedpacketCollected===true){
      var colAmt2=x.redpacketCollectedAmount||'0';
      var colText2=x.redpacketCollectedText||'红包已领取';
      rpContentHtml='<div class="message-redpacket-collected" style="background:linear-gradient(135deg,#f5e6d3,#e8d0b8);border-radius:12px;padding:14px;max-width:280px;box-shadow:0 2px 10px rgba(138,109,59,0.1);border:1px solid rgba(138,109,59,0.08);"><div style="display:flex;align-items:center;gap:10px;font-size:13px;color:#8a6d3b;"><span style="font-size:20px;flex-shrink:0;">🧧</span><span style="flex:1;min-width:0;font-weight:500;">'+colText2+'</span><span style="font-weight:600;font-size:16px;flex-shrink:0;">¥'+colAmt2+'</span></div></div>';
      isRedpacketMsg=true;
    }else if(x.isRedpacket===true||x.isRedpacket==='true'){
      isRedpacketMsg=true;
      var rpAmount=x.redpacketAmount||'0';
      var rpGreeting=x.redpacketGreeting||'恭喜发财，大吉大利';
      var rpStatus=x.redpacketStatus||(x.redpacketOpened?'received':'pending');
      var rpBg,rpAccentColor,rpTextColor,rpStatusText,rpCursor,rpOpacity,rpStatusBg;
      if(rpStatus==='received'){rpBg='linear-gradient(135deg,#e8d5b0,#d4b88a)';rpAccentColor='#8a6d3b';rpTextColor='#8a6d3b';rpStatusText=x.s===SELF?'TA 已领取':'已领取';rpCursor='default';rpOpacity='1';rpStatusBg='rgba(138,109,59,0.1)';}
      else if(rpStatus==='returned'){rpBg='linear-gradient(135deg,#d0d0d0,#b8b8b8)';rpAccentColor='#777';rpTextColor='#777';rpStatusText='已退回';rpCursor='default';rpOpacity='1';rpStatusBg='rgba(120,120,120,0.1)';}
      else if(rpStatus==='expired'){rpBg='linear-gradient(135deg,#d0d0d0,#b8b8b8)';rpAccentColor='#777';rpTextColor='#777';rpStatusText='已过期';rpCursor='default';rpOpacity='1';rpStatusBg='rgba(120,120,120,0.1)';}
      else{rpBg='linear-gradient(135deg,#d93025,#c41e1e)';rpAccentColor='#d4a853';rpTextColor='#fff';rpStatusText=x.s===SELF?'等待领取':'点击领取';rpCursor=x.s===SELF?'default':'pointer';rpOpacity='1';rpStatusBg='rgba(0,0,0,0.15)';}
      rpContentHtml='<div class="message-redpacket" onclick="handleRedPacketClick(\''+x.id+'\',\''+x.s+'\',event)" style="background:'+rpBg+';border-radius:12px;overflow:hidden;max-width:280px;cursor:'+rpCursor+';box-shadow:0 2px 10px rgba(212,48,37,0.2);">'
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
      lt=d.getTime();
    }else{
    var imgsArr=(x.imgs&&x.imgs.length>0)?x.imgs:(x.img?[x.img]:(x.t&&typeof x.t==='string'&&x.t.startsWith('data:image/')?[x.t]:null));
    var totalImgs=imgsArr?imgsArr.length:0;
    var isSticker=x.isSticker===true;
    var imgClass=isSticker?'message-sticker':'message-img';
    var contentHtml='';
    if(imgsArr){
      var imgsHtml='';
      var gridWrapStyle='';
      var itemStyle='';
      if(totalImgs===1){gridWrapStyle='';itemStyle='';}
      else if(totalImgs===2){gridWrapStyle='display:grid;grid-template-columns:1fr 1fr;gap:4px;max-width:320px;';itemStyle='width:100%;height:120px;object-fit:cover;border-radius:8px;';}
      else if(totalImgs===3){gridWrapStyle='display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;max-width:320px;';itemStyle='width:100%;height:100px;object-fit:cover;border-radius:8px;';}
      else if(totalImgs===4){gridWrapStyle='display:grid;grid-template-columns:1fr 1fr;gap:4px;max-width:320px;';itemStyle='width:100%;height:120px;object-fit:cover;border-radius:8px;';}
      else{gridWrapStyle='display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;max-width:320px;';itemStyle='width:100%;height:100px;object-fit:cover;border-radius:8px;';}
      for(var _i2=0;_i2<totalImgs;_i2++){
        var _u2=imgsArr[_i2];
        // 修复：确保 _u2 是字符串，避免非字符串类型导致 .replace() 崩溃
        if(_u2!=null&&typeof _u2!=='string')_u2=String(_u2);
        imgsHtml+='<img src="'+_u2.replace(/"/g,'&quot;')+'" class="'+imgClass+'" data-orig="'+_u2.replace(/"/g,'&quot;')+'" loading="lazy" decoding="async"'+(itemStyle?' style="'+itemStyle+'"':'')+'>';
      }
      if(totalImgs===1){
        var imgHtml=imgsHtml;
        // 修复：确保 x.t 是字符串后再调用 .trim()，避免非字符串类型导致渲染崩溃
        var _imgText3=typeof x.t==='string'?x.t:(x.t!=null?String(x.t):'');
        if(_imgText3&&_imgText3.trim()){
          var textHtml=_imgText3.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
          contentHtml='<div class="message-text-img-combo">'+imgHtml+'<div class="message-text-below">'+textHtml+'</div></div>';
        }else{contentHtml=imgHtml;}
      }else{
        contentHtml='<div style="'+gridWrapStyle+'">'+imgsHtml+'</div>';
        var _imgText4=typeof x.t==='string'?x.t:(x.t!=null?String(x.t):'');
        if(_imgText4&&_imgText4.trim()){
          var textHtml2=_imgText4.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
          contentHtml+='<div class="message-text-below">'+textHtml2+'</div>';
        }
      }
    }else{
      var _plainText3=typeof x.t==='string'?x.t:(x.t!=null?String(x.t):'');
      contentHtml=_plainText3.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
    }
    if(isRedpacketMsg){
      html+='<div class="mr '+(x.s===SELF?'self':'other')+(gap?' has-gap':'')+'" data-mid="'+x.id+'" data-liked="'+isLiked+'"><div class="ma-wrap"><div class="ma">'+av(x.s===SELF)+'</div><div class="mt">'+fts(d)+'</div></div><div class="mc">'+rpContentHtml+'</div></div>';
    }else{
      html+='<div class="mr '+(x.s===SELF?'self':'other')+(gap?' has-gap':'')+'" data-mid="'+x.id+'" data-liked="'+isLiked+'"><div class="ma-wrap"><div class="ma">'+av(x.s===SELF)+'</div><div class="mt">'+fts(d)+'</div></div><div class="mc"><div class="mb">'+quoteHtml+contentHtml+'</div></div></div>';
    }
    lt=d.getTime();
    }
  });
  box.innerHTML=html;
  if(!longScreenshotMode){
    requestAnimationFrame(function(){box.scrollTop=box.scrollHeight});
  }
  initNonInstantMsgActions();
}
var _nonInstInited=false;
function initNonInstantMsgActions(){
  if(_nonInstInited)return;
  _nonInstInited=true;
  var box=$('msgbox-noninstant');
  if(!box)return;
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
  
  box.addEventListener('mousedown',function(e){
    if(e.button!==0)return;
    var el=e.target.closest('.mr');
    if(!el)return;
    longPressMsg={id:el.getAttribute('data-mid'),liked:el.getAttribute('data-liked')==='true'};
    longPressTimer=safeSetTimeout(function(){
      if(!longPressMsg)return;
      showMsgActionMenu(e.clientX,e.clientY,longPressMsg.id,longPressMsg.liked,true);
      longPressMsg=null;
    },500);
  });
  box.addEventListener('mouseup',clearLongPress);
  box.addEventListener('mouseleave',clearLongPress);
  
  box.addEventListener('touchstart',function(e){
    var el=e.target.closest('.mr');
    if(!el)return;
    var t=e.touches&&e.touches[0];
    startX=t?t.clientX:0;
    startY=t?t.clientY:0;
    longPressMsg={id:el.getAttribute('data-mid'),liked:el.getAttribute('data-liked')==='true',startX:startX,startY:startY};
    longPressTimer=safeSetTimeout(function(){
      if(!longPressMsg)return;
      showMsgActionMenu(startX,startY,longPressMsg.id,longPressMsg.liked,true);
      longPressMsg=null;
      haptic('light');
    },500);
  },{passive:true});
  box.addEventListener('touchend',clearLongPress,{passive:true});
  box.addEventListener('touchmove',function(e){
    var t=e.touches&&e.touches[0];
    var dx=t?t.clientX-startX:0;
    var dy=t?t.clientY-startY:0;
    handleTouchMove(dx,dy);
  },{passive:true});
}

function sendNonInstantMsg(){
  if(!nonInstantCid)return;
  var inp=$('msg-inp-noninstant'),t=inp.value.trim();
  if(pendingImages.length>0){
    var imgs=pendingImages.slice();
    pendingImages=[];
    renderPendingImages('inline-image-bar-noninstant','nith_');
    var m2=nonInstantMsgs(nonInstantCid);
    m2.push({id:Date.now(),s:SELF,t:t||'',imgs:imgs,img:imgs.length===1?imgs[0]:'',ts:new Date(),pc:false,read:true,isSticker:false});
    saveNonInstantMsgs(nonInstantCid,m2);
    inp.value='';inp.style.height='36px';
    renderNonInstantMsgs();
    playSound('send',nonInstantCid);
    scheduleNonInstantReply(nonInstantCid);
    return;
  }
  if(!t)return;
  var m=nonInstantMsgs(nonInstantCid);
  m.push({id:Date.now(),s:SELF,t:t,ts:new Date(),pc:false,read:true});
  saveNonInstantMsgs(nonInstantCid,m);
  inp.value='';
  inp.style.height='36px';
  renderNonInstantMsgs();
  playSound('send',nonInstantCid);
  scheduleNonInstantReply(nonInstantCid);
}

function scheduleNonInstantReply(targetId){
  var minDelay=getSpeed('ni-min',targetId)*1000;
  var maxDelay=getSpeed('ni-max',targetId)*1000;
  var delay=minDelay+Math.random()*(maxDelay-minDelay);
  setTimeout(function(){
    genNonInstantReply(targetId);
  },delay);
}

function genNonInstantReply(targetId){
  if(!targetId)return;
  var userCards=globalCards.filter(function(card){
    if(!card)return false;
    if(!card.content)return false;
    if(card.category!=='stickers'&&card.category!=='voices'&&(!card.content.trim()))return false;
    if(card.groupId){
      var group=cardGroups.find(function(g){return g.id===card.groupId});
      if(group&&group.disabled)return false;
      if(group&&group.type==='public'&&group.disabledContacts&&group.disabledContacts.indexOf(targetId)>=0)return false;
    }
    if(card.type==='public')return true;
    if(card.type==='private'){
      if(card.contactId===targetId)return true;
      var pc=cardPrivateContacts.find(function(p){return p.id===card.contactId&&p.bindContactId===targetId});
      if(pc)return true;
    }
    if(!card.type)return true;
    return false;
  });
  
  // 构建可用字卡池
  var availableCards=userCards.slice();
  
  // 将默认通用字卡添加到池中（各分类独立概率已在getDefaultCommonCardsForContact中处理）
  if(defaultCommonEnabled&&defaultCommonAllContacts&&defaultCommonUseChat){
    var dcCards=getDefaultCommonCardsForContact(targetId);
    if(dcCards.length>0){
      dcCards.forEach(function(text){
        availableCards.push({content:text,category:'custom',type:'default_common',groupId:null});
      });
    }
  }
  
  var textCards=availableCards.filter(function(c){return c.category!=='stickers'&&c.category!=='voices'&&c.category!=='emojis'&&c.category!=='kaomoji'});
  var emojiCards=availableCards.filter(function(c){return c.category==='emojis'});
  var kaomojiCards=availableCards.filter(function(c){return c.category==='kaomoji'});
  var stickerCards=availableCards.filter(function(c){return c.category==='stickers'});
  var voiceCards=availableCards.filter(function(c){return c.category==='voices'});
  
  var reply='',pc=false,imgSrc='',voiceSrc='',voiceText='';
  
  var onlyVoice=(textCards.length===0&&emojiCards.length===0&&kaomojiCards.length===0&&stickerCards.length===0&&voiceCards.length>0);
  var onlyText=(textCards.length>0&&emojiCards.length===0&&kaomojiCards.length===0&&stickerCards.length===0&&voiceCards.length===0);
  var onlyEmoji=(textCards.length===0&&emojiCards.length>0&&kaomojiCards.length===0&&stickerCards.length===0&&voiceCards.length===0);
  var onlyKaomoji=(textCards.length===0&&emojiCards.length===0&&kaomojiCards.length>0&&stickerCards.length===0&&voiceCards.length===0);
  var onlySticker=(textCards.length===0&&emojiCards.length===0&&kaomojiCards.length===0&&stickerCards.length>0&&voiceCards.length===0);
  
  if(onlyVoice){
    var vrc=voiceCards[Math.floor(Math.random()*voiceCards.length)];
    voiceSrc=vrc.content;
    voiceText=vrc.voiceText||'';
  }else if(onlySticker){
    var src=stickerCards[Math.floor(Math.random()*stickerCards.length)];
    imgSrc=src.content;
  }else if(onlyText){
    var avl=textCards.filter(function(card){return card.content&&card.content.trim()});
    if(avl.length>=1){
      var cnt=Math.floor(Math.random()*Math.min(10,avl.length))+1;
      reply=avl.slice().sort(function(){return Math.random()-.5}).slice(0,cnt).map(function(c){return c.content}).join(' ');
      pc=true;
    }
    if(!reply&&textCards.length){
      var rc=textCards[Math.floor(Math.random()*textCards.length)];
      reply=rc.content;
    }
  }else if(onlyEmoji){
    var erc=emojiCards[Math.floor(Math.random()*emojiCards.length)];
    reply=erc.content;
  }else if(onlyKaomoji){
    var krc=kaomojiCards[Math.floor(Math.random()*kaomojiCards.length)];
    reply=krc.content;
  }else{
    var stickerProb=getSpeed('sticker-prob');
    var isStickerReply=stickerCards.length>0&&Math.random()*100<stickerProb;
    
    var emojiProb=getSpeed('emoji-prob');
    var isEmojiReply=!isStickerReply&&emojiCards.length>0&&Math.random()*100<emojiProb;
    
    var voiceProb=getSpeed('voice-prob')||10;
    if(textCards.length===0&&emojiCards.length===0&&voiceCards.length>0)voiceProb=100;
    var isVoiceReply=!isStickerReply&&!isEmojiReply&&voiceCards.length>0&&Math.random()*100<voiceProb;
    
    if(isStickerReply){
      var rc=stickerCards[Math.floor(Math.random()*stickerCards.length)];
      imgSrc=rc.content;
    }else if(isEmojiReply){
      var erc=emojiCards[Math.floor(Math.random()*emojiCards.length)];
      reply=erc.content;
    }else if(isVoiceReply){
      var vrc=voiceCards[Math.floor(Math.random()*voiceCards.length)];
      voiceSrc=vrc.content;
      voiceText=vrc.voiceText||'';
    }else{
      var avl=textCards.filter(function(card){return card.content&&card.content.trim()});
      if(avl.length>=1){
        var cnt=Math.floor(Math.random()*Math.min(10,avl.length))+1;
        reply=avl.slice().sort(function(){return Math.random()-.5}).slice(0,cnt).map(function(c){return c.content}).join(' ');
        pc=true;
      }
      if(!reply&&textCards.length){
        var rc=textCards[Math.floor(Math.random()*textCards.length)];
        reply=rc.content;
      }
      if(!reply&&!imgSrc&&!voiceSrc&&voiceCards.length>0){
        var vrc2=voiceCards[Math.floor(Math.random()*voiceCards.length)];
        voiceSrc=vrc2.content;
        voiceText=vrc2.voiceText||'';
      }
      if(!reply&&!imgSrc&&!voiceSrc)reply='请在字卡库里上传字卡后开始聊天';
    }
    
    // 颜文字概率：独立于主字卡，可附加到文字回复中
    var kaomojiProb=getSpeed('kaomoji-prob');
    if(kaomojiProb>0&&kaomojiCards.length>0&&Math.random()*100<kaomojiProb){
      var kc=kaomojiCards[Math.floor(Math.random()*kaomojiCards.length)];
      if(reply&&reply!=='请在字卡库里上传字卡后开始聊天'){
        reply=reply+' '+kc.content;
      }else{
        reply=kc.content;
      }
    }
  }
  
  var quoteMsgId=null;
  var quoteProb=getSpeed('quote-prob',targetId)/100;
  if(quoteProb>0&&Math.random()<quoteProb){
    var messages=nonInstantMsgs(targetId);
    var selfMsgs=messages.filter(function(m){return m.s===SELF});
    if(selfMsgs.length>0){
      quoteMsgId=selfMsgs[selfMsgs.length-1].id;
    }
  }
  
  var m=nonInstantMsgs(targetId);
  m.push({id:Date.now(),s:OTHER,t:reply,img:imgSrc,voice:voiceSrc,voiceText:voiceText,ts:new Date(),pc:pc,isAuto:true,isInitiative:false,quote:quoteMsgId,isSticker:imgSrc?true:false,isVoice:voiceSrc?true:false,read:(nonInstantCid===targetId)});
  saveNonInstantMsgs(targetId,m);
  
  if(targetId===nonInstantCid){
    renderNonInstantMsgs();
  }
  playSound('noninstant',targetId);
}

if($('noninstant-contact-selector')){
  $('noninstant-contact-selector').addEventListener('click',toggleNonInstantContactList);
  $('noninstant-contact-selector').addEventListener('touchend',function(e){e.preventDefault();toggleNonInstantContactList()});
}
if($('msg-inp-noninstant')){$('msg-inp-noninstant').addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey&&getSpeed('enter-send')===1){e.preventDefault();sendNonInstantMsg()}});$('msg-inp-noninstant').addEventListener('input',function(){this.style.height='auto';this.style.height=Math.min(this.scrollHeight,100)+'px'});}
if($('btn-send-noninstant')){
  $('btn-send-noninstant').addEventListener('click',function(e){e.stopPropagation();if($('msg-inp-noninstant'))$('msg-inp-noninstant').blur();if($('ov-chat-more').classList.contains('show'))hideOv('ov-chat-more');if($('ov-emoji').classList.contains('show'))hideOv('ov-emoji');sendNonInstantMsg()});
  $('btn-send-noninstant').addEventListener('touchend',function(e){e.preventDefault();e.stopPropagation();if($('msg-inp-noninstant'))$('msg-inp-noninstant').blur();if($('ov-chat-more').classList.contains('show'))hideOv('ov-chat-more');if($('ov-emoji').classList.contains('show'))hideOv('ov-emoji');sendNonInstantMsg()});
}
if($('btn-back-noninstant')){
  $('btn-back-noninstant').addEventListener('click',function(){nonInstantMode=false;showPg('pg-more');var ncl=$('noninstant-contact-list');if(ncl)ncl.style.display='none'});
  $('btn-back-noninstant').addEventListener('touchend',function(e){e.preventDefault();nonInstantMode=false;showPg('pg-more');var ncl=$('noninstant-contact-list');if(ncl)ncl.style.display='none'});
}
if($('btn-more-noninstant')){
  $('btn-more-noninstant').addEventListener('click',function(){openNonInstantContactEdit()});
  $('btn-more-noninstant').addEventListener('touchend',function(e){e.preventDefault();openNonInstantContactEdit()});
}
if($('btn-ibar-more-noninstant')){
  var _moreClickedNI=false;
  function toggleChatMoreNI(){
    if(_moreClickedNI)return;
    _moreClickedNI=true;
    setTimeout(function(){_moreClickedNI=false},300);
    var chatMoreOvNI=$('ov-chat-more');if(chatMoreOvNI&&chatMoreOvNI.classList.contains('show')){hideOv('ov-chat-more')}else{hideOv('ov-emoji');renderChatMorePanel();showOv('ov-chat-more')}
  }
  $('btn-ibar-more-noninstant').addEventListener('click',function(e){e.stopPropagation();if($('msg-inp-noninstant'))$('msg-inp-noninstant').blur();toggleChatMoreNI()});
  $('btn-ibar-more-noninstant').addEventListener('touchend',function(e){e.preventDefault();e.stopPropagation();if($('msg-inp-noninstant'))$('msg-inp-noninstant').blur();toggleChatMoreNI()});
}
if($('btn-ibar-emoji-noninstant')){
  var _emojiClickedNI=false;
  function toggleChatEmojiNI(){
    if(_emojiClickedNI)return;
    _emojiClickedNI=true;
    setTimeout(function(){_emojiClickedNI=false},300);
    if($('ov-emoji').classList.contains('show')){
      hideOv('ov-emoji');
      var activeTab=document.querySelector('.emoji-tab.sel');
      if(activeTab)ls('last_emoji_tab',activeTab.dataset.tab);
    }else{
      hideOv('ov-chat-more');
      var lastTab=ls('last_emoji_tab')||'public';
      renderEmojiPanel(lastTab);
    }
  }
  $('btn-ibar-emoji-noninstant').addEventListener('click',function(){if($('msg-inp-noninstant'))$('msg-inp-noninstant').blur();toggleChatEmojiNI()});
  $('btn-ibar-emoji-noninstant').addEventListener('touchend',function(e){e.preventDefault();if($('msg-inp-noninstant'))$('msg-inp-noninstant').blur();toggleChatEmojiNI()});
}

document.addEventListener('click',function(e){
  var list=$('noninstant-contact-list');
  var sel=$('noninstant-contact-selector');
  if((!list || !list.contains(e.target)) && (!sel || !sel.contains(e.target))){
    if(list)list.style.display='none';
  }
});


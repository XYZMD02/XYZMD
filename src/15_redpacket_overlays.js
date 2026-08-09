// ============ Red Packet Functions (Redesigned) ============
var RP_CONFIG={
  systemTriggerRate:0.04,
  systemDailyLimit:5,
  specialPoolRate:0.4,
  specialAmounts:[5.2,52,520,5200,13.14,1314],
  randomSmallRate:0.8,
  randomSmallCap:200,
  returnRate:0.2,
  instantCollectRate:0.7,
  pendingCollectRate:0.08,
  expiryMs:24*3600*1000,
  triggerDelayMin:800,
  triggerDelayMax:2000,
  replyDelayMin:3000,
  replyDelayMax:8000,
  debugRate:null
};

// Wallet: {myBalance:number, systemBalance:number} in cents (1 yuan = 100 cents)
function getWallet(contactId){
  var w=ls('ml2_rp_wallet_'+contactId);
  if(!w||typeof w!=='object'){w={myBalance:100000,systemBalance:100000};ls('ml2_rp_wallet_'+contactId,w);}
  if(typeof w.myBalance!=='number')w.myBalance=100000;
  if(typeof w.systemBalance!=='number')w.systemBalance=100000;
  return w;
}
function saveWallet(contactId,w){ls('ml2_rp_wallet_'+contactId,w);}

// Packet records
function getPackets(contactId){return ls('ml2_rp_packets_'+contactId)||[];}
function savePackets(contactId,packets){ls('ml2_rp_packets_'+contactId,packets);}
function getPacketById(contactId,rpId){
  var packets=getPackets(contactId);
  return packets.find(function(p){return p.id===rpId});
}
function updatePacketRecord(contactId,updatedRp){
  var packets=getPackets(contactId);
  for(var i=0;i<packets.length;i++){
    if(packets[i].id===updatedRp.id){packets[i]=updatedRp;break;}
  }
  savePackets(contactId,packets);
}

// Daily counter
function getDailyCounter(contactId){
  var today=new Date().toISOString().slice(0,10);
  var counter=ls('ml2_rp_daily_'+contactId);
  if(!counter||counter.date!==today){counter={date:today,count:0};ls('ml2_rp_daily_'+contactId,counter);}
  return counter;
}
function incrementDailyCounter(contactId){
  var counter=getDailyCounter(contactId);
  counter.count++;
  ls('ml2_rp_daily_'+contactId,counter);
}

// Create packet record
function createPacket(contactId,direction,amountCents,message){
  var rp={
    id:'rp_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),
    contactId:contactId,
    direction:direction,
    amount:amountCents,
    status:'pending',
    message:message||'',
    createdAt:Date.now(),
    processedAt:null
  };
  var packets=getPackets(contactId);
  packets.push(rp);
  savePackets(contactId,packets);
  return rp;
}

// Render red packet as a chat message
function renderRedPacketCard(contactId,rp){
  var m=msgs(contactId);
  var amountYuan=(rp.amount/100).toFixed(2);
  var isMySend=rp.direction==='send';
  var contact=contacts.find(function(c){return c.id===contactId});
  m.push({
    id:'m_'+rp.id,
    s:isMySend?SELF:OTHER,
    t:'',
    ts:new Date(rp.createdAt),
    pc:false,
    isRedpacket:true,
    redpacketAmount:amountYuan,
    redpacketGreeting:rp.message||'恭喜发财，大吉大利',
    redpacketStatus:rp.status,
    redpacketDirection:rp.direction,
    redpacketRpId:rp.id,
    redpacketOpened:rp.status==='received',
    read:isMySend?true:false,
    senderName:isMySend?'我':(contact?contact.name:'TA'),
    senderId:isMySend?me.id:contactId
  });
  savemsgs(contactId,m);
  if(cid===contactId)renderMsgs(m);
  renderChatList();
  try{renderContactRedPacketHistory(contactId)}catch(e){}
  if(!isMySend){
    var uids=ls('ml2_uids')||{};
    if(!uids[contactId])uids[contactId]=0;
    uids[contactId]++;
    ls('ml2_uids',uids);
  }
}

// Update message status in chat
function updateRedPacketMessageStatus(contactId,rpId,newStatus){
  var m=msgs(contactId);
  var updated=false;
  for(var i=0;i<m.length;i++){
    if(m[i].redpacketRpId===rpId){
      m[i].redpacketStatus=newStatus;
      m[i].redpacketOpened=(newStatus==='received');
      updated=true;
      break;
    }
  }
  if(updated){
    savemsgs(contactId,m);
    if(cid===contactId)renderMsgs(m);
    renderChatList();
    try{renderContactRedPacketHistory(contactId)}catch(e){}
  }
  return updated;
}

function pushCollectedCard(contactId,rp,isSelfCollect){
  var m=msgs(contactId);
  var amountYuan=(rp.amount/100).toFixed(2);
  var contact=contacts.find(function(c){return c.id===contactId});
  var collectorName=isSelfCollect?'我':(contact?contact.name:'TA');
  var senderName=isSelfCollect?(contact?contact.name:'TA'):'我';
  var collectedMsg=isSelfCollect?'我领取了'+(contact?contact.name:'TA')+'的红包':(contact?contact.name:'TA')+'领取了你的红包';
  m.push({
    id:'m_collected_'+rp.id,
    s:isSelfCollect?SELF:OTHER,
    t:'',
    ts:new Date(),
    pc:false,
    isRedpacketCollected:true,
    redpacketCollectedAmount:amountYuan,
    redpacketCollectedText:collectedMsg,
    read:true,
    senderName:isSelfCollect?'我':(contact?contact.name:'TA'),
    senderId:isSelfCollect?me.id:contactId
  });
  savemsgs(contactId,m);
  if(cid===contactId)renderMsgs(m);
  renderChatList();
}

function showNotification(title,body){
  toast(title);
  if('Notification' in window&&Notification.permission==='granted'){
    try{var n=new Notification(title,{body:body,icon:'',tag:'redpacket-'+Date.now()});setTimeout(function(){n.close()},4000)}catch(e){}
  }
}

// Red packet greeting pool (20 items with weighted probability)
var RP_GREETING_POOL=[
  // 宠溺 (4 items, weight 2 = 8 total)
  {text:'拿去买奶茶',weight:2,category:'宠溺'},
  {text:'今天零花钱',weight:2,category:'宠溺'},
  {text:'随便花',weight:2,category:'宠溺'},
  {text:'买点好吃的',weight:2,category:'宠溺'},
  // 温柔 (4 items, weight 2 = 8 total)
  {text:'收下嘛',weight:2,category:'温柔'},
  {text:'手滑了一下',weight:2,category:'温柔'},
  {text:'不许拒绝',weight:2,category:'温柔'},
  {text:'偷偷塞给你的',weight:2,category:'温柔'},
  // 调皮 (4 items, weight 1 = 4 total)
  {text:'捡到钱了分你一半',weight:1,category:'调皮'},
  {text:'今天心情好~',weight:1,category:'调皮'},
  {text:'嘘，别告诉别人',weight:1,category:'调皮'},
  {text:'发工资了',weight:1,category:'调皮'},
  // 日常 (4 items, weight 1 = 4 total)
  {text:'今天的咖啡我请',weight:1,category:'日常'},
  {text:'路上看到就想到你了',weight:1,category:'日常'},
  {text:'补上昨天的',weight:1,category:'日常'},
  {text:'刚好有零钱',weight:1,category:'日常'},
  // 惊喜 (4 items, weight 1 = 4 total)
  {text:'没有理由就是想发',weight:1,category:'惊喜'},
  {text:'突然想你了',weight:1,category:'惊喜'},
  {text:'打开有惊喜',weight:1,category:'惊喜'},
  {text:'奖励你的',weight:1,category:'惊喜'}
];

function getRandomRedPacketGreeting(){
  var totalWeight=0;
  for(var i=0;i<RP_GREETING_POOL.length;i++){totalWeight+=RP_GREETING_POOL[i].weight;}
  var r=Math.random()*totalWeight;
  var cumulative=0;
  for(var j=0;j<RP_GREETING_POOL.length;j++){
    cumulative+=RP_GREETING_POOL[j].weight;
    if(r<cumulative)return RP_GREETING_POOL[j].text;
  }
  return RP_GREETING_POOL[0].text;
}

// System auto-send (TA → me), 4% trigger
function trySystemAutoSend(contactId){
  if(!contactId)return;
  var counter=getDailyCounter(contactId);
  if(counter.count>=RP_CONFIG.systemDailyLimit)return;
  var triggerRate=(RP_CONFIG.debugRate!==null&&RP_CONFIG.debugRate!==undefined)?RP_CONFIG.debugRate:RP_CONFIG.systemTriggerRate;
  if(Math.random()>=triggerRate)return;
  var wallet=getWallet(contactId);
  if(wallet.systemBalance<1)return;
  incrementDailyCounter(contactId);
  var amountCents;
  if(Math.random()<RP_CONFIG.specialPoolRate){
    var pool=RP_CONFIG.specialAmounts;
    amountCents=Math.round(pool[Math.floor(Math.random()*pool.length)]*100);
  }else{
    if(Math.random()<RP_CONFIG.randomSmallRate){
      var cap=Math.min(RP_CONFIG.randomSmallCap*100,wallet.systemBalance);
      amountCents=Math.floor(Math.random()*cap)+1;
    }else{
      amountCents=Math.floor(Math.random()*wallet.systemBalance)+1;
    }
  }
  if(amountCents>wallet.systemBalance)amountCents=wallet.systemBalance;
  wallet.systemBalance-=amountCents;
  saveWallet(contactId,wallet);
  var msg=getRandomRedPacketGreeting();
  var rp=createPacket(contactId,'receive',amountCents,msg);
  renderRedPacketCard(contactId,rp);
}

// User manual send
function sendRedPacket(contactId,amountYuan,message){
  if(!contactId)return false;
  var amountCents=Math.round(Number(amountYuan)*100);
  if(isNaN(amountCents)||amountCents<1){toast('请输入有效金额');return false;}
  var wallet=getWallet(contactId);
  if(amountCents>wallet.myBalance){toast('余额不足');return false;}
  wallet.myBalance-=amountCents;
  saveWallet(contactId,wallet);
  var rp=createPacket(contactId,'send',amountCents,message||'恭喜发财，大吉大利');
  renderRedPacketCard(contactId,rp);
  hideOv('ov-redpacket');
  toast('红包已发送');
  var delay=RP_CONFIG.replyDelayMin+Math.random()*(RP_CONFIG.replyDelayMax-RP_CONFIG.replyDelayMin);
  setTimeout(function(){handleSendResponse(contactId,rp);},delay);
  return true;
}

// System response to user's red packet (return / instant collect / pending)
function handleSendResponse(contactId,rp){
  if(!contactId||!rp){console.warn('handleSendResponse: invalid params');return;}
  var r=Math.random();
  if(r<RP_CONFIG.returnRate){
    rp.status='returned';rp.processedAt=Date.now();
    var w=getWallet(contactId);w.myBalance+=rp.amount;saveWallet(contactId,w);
    updatePacketRecord(contactId,rp);
    updateRedPacketMessageStatus(contactId,rp.id,'returned');
    return;
  }
  var collectThreshold=RP_CONFIG.instantCollectRate/(1-RP_CONFIG.returnRate);
  if(r<RP_CONFIG.returnRate+collectThreshold*(1-RP_CONFIG.returnRate)){
    rp.status='received';rp.processedAt=Date.now();
    var w2=getWallet(contactId);w2.systemBalance+=rp.amount;saveWallet(contactId,w2);
    updatePacketRecord(contactId,rp);
    updateRedPacketMessageStatus(contactId,rp.id,'received');
    pushCollectedCard(contactId,rp,false);
    playSound('recvSound',contactId);
    showNotification('红包已被领取','TA 领取了你的 ¥'+(rp.amount/100).toFixed(2)+' 红包');
  }else{
    rp.status='pending';
    updatePacketRecord(contactId,rp);
    updateRedPacketMessageStatus(contactId,rp.id,'pending');
  }
}

// Try collect pending packets (I sent, waiting for TA)
function tryCollectPending(contactId){
  if(!contactId)return;
  var packets=getPackets(contactId);
  var pending=packets.filter(function(p){return p.direction==='send'&&p.status==='pending';});
  if(pending.length===0)return;
  if(Math.random()<RP_CONFIG.pendingCollectRate){
    var rp=pending[0];
    rp.status='received';rp.processedAt=Date.now();
    var w=getWallet(contactId);w.systemBalance+=rp.amount;saveWallet(contactId,w);
    updatePacketRecord(contactId,rp);
    updateRedPacketMessageStatus(contactId,rp.id,'received');
    pushCollectedCard(contactId,rp,false);
    playSound('recvSound',contactId);
    showNotification('红包已被领取','TA 领取了你的 ¥'+(rp.amount/100).toFixed(2)+' 红包');
  }
}

// Check expiry
function checkExpiry(contactId){
  if(!contactId)return;
  var now=Date.now();
  var packets=getPackets(contactId);
  var changed=false;
  packets.forEach(function(rp){
    if(rp.status==='pending'&&now-rp.createdAt>RP_CONFIG.expiryMs){
      rp.status='expired';rp.processedAt=now;
      var w=getWallet(contactId);
      if(rp.direction==='send')w.myBalance+=rp.amount;
      else w.systemBalance+=rp.amount;
      saveWallet(contactId,w);
      updateRedPacketMessageStatus(contactId,rp.id,'expired');
      changed=true;
    }
  });
  if(changed)savePackets(contactId,packets);
}

// Called after each reply finishes
function onReplyFinished(contactId){
  if(!contactId)return;
  setTimeout(function(){trySystemAutoSend(contactId);},RP_CONFIG.triggerDelayMin+Math.random()*(RP_CONFIG.triggerDelayMax-RP_CONFIG.triggerDelayMin));
  setTimeout(function(){tryCollectPending(contactId);},1200+Math.random()*1500);
  setTimeout(function(){checkExpiry(contactId);},500);
  // 礼物：和红包一样，回复后按概率随机触发
  // 防御：GIFT_CONFIG 可能在文件加载完成前的早期回复中尚未赋值（var 提升但赋值在后部）
  if(window.GIFT_CONFIG&&GIFT_CONFIG.triggerDelayMin!==undefined){
    setTimeout(function(){trySystemAutoGift(contactId);},GIFT_CONFIG.triggerDelayMin+Math.random()*(GIFT_CONFIG.triggerDelayMax-GIFT_CONFIG.triggerDelayMin));
  }
}

// User clicks to open a red packet (TA sent to me)
function openRedPacketMessage(contactId,rpId){
  var rp=getPacketById(contactId,rpId);
  if(!rp){
    toast('红包记录不存在');
    return;
  }
  // If already collected, just show the opened modal
  if(rp.status==='received'||rp.status==='returned'||rp.status==='expired'){
    var contact2=contacts.find(function(c){return c.id===contactId});
    var amountYuan2=(rp.amount/100).toFixed(2);
    // ★ 修复：隐藏昵称设置也作用于红包弹窗（显示 TA 而不是昵称）
    var _hideRpName2=!!(contact2&&(contact2.hideQuoteNames||contact2.hideTouchNames||getHideTouchNames(contactId)===true));
    $('opened-redpacket-from').textContent='来自 '+(_hideRpName2?'TA':(contact2?contact2.name:'TA'));
    $('opened-redpacket-amount').textContent=amountYuan2;
    $('opened-redpacket-greeting').textContent=rp.message||'';
    $('opened-redpacket-status').textContent=rp.status==='received'?'红包已存入你的余额':(rp.status==='returned'?'红包已退回':'红包已过期');
    showOv('ov-redpacket-opened');
    return;
  }
  if(rp.status!=='pending')return;
  rp.status='received';rp.processedAt=Date.now();
  var w=getWallet(contactId);w.myBalance+=rp.amount;saveWallet(contactId,w);
  updatePacketRecord(contactId,rp);
  updateRedPacketMessageStatus(contactId,rpId,'received');
  pushCollectedCard(contactId,rp,true);
  var contact=contacts.find(function(c){return c.id===contactId});
  var amountYuan=(rp.amount/100).toFixed(2);
  // ★ 修复：隐藏昵称设置也作用于红包弹窗（显示 TA 而不是昵称）
  var _hideRpName=!!(contact&&(contact.hideQuoteNames||contact.hideTouchNames||getHideTouchNames(contactId)===true));
  $('opened-redpacket-from').textContent='来自 '+(_hideRpName?'TA':(contact?contact.name:'TA'));
  $('opened-redpacket-amount').textContent=amountYuan;
  $('opened-redpacket-greeting').textContent=rp.message||'';
  $('opened-redpacket-status').textContent='红包已存入你的余额';
  showOv('ov-redpacket-opened');
}

// Handle red packet click
function handleRedPacketClick(msgId,sender,event){
  if(event&&event.stopPropagation)event.stopPropagation();
  var m=msgs(cid);
  for(var i=0;i<m.length;i++){
    if(m[i].id===msgId && (m[i].isRedpacket||m[i].redpacketRpId)){
      var status=m[i].redpacketStatus||(m[i].redpacketOpened?'received':'pending');
      if(status==='received'){
        if(sender===SELF){toast('TA 已领取你的红包');}else{toast('红包已领取');}
        break;
      }
      if(status==='returned'){toast('红包已退回');break;}
      if(status==='expired'){toast('红包已过期');break;}
      if(status==='pending'){
        if(sender===SELF){toast('等待TA领取...');break;}
        var rpId=m[i].redpacketRpId||m[i].id.replace('m_','');
        openRedPacketMessage(cid,rpId);
        break;
      }
      break;
    }
  }
}

// UI functions
function showRedPacketModal(contactId){
  var contact=contacts.find(function(c){return c.id===contactId});
  if(!contact)return;
  var w=getWallet(contactId);
  $('redpacket-to-name').textContent='给 '+contact.name+' 发一个红包';
  $('redpacket-balance').textContent=(w.myBalance/100).toFixed(2);
  $('redpacket-amount').value=52;
  $('redpacket-greeting').value='恭喜发财，大吉大利';
  showOv('ov-redpacket');
}
function showRedPacketBalanceModal(contactId){
  var contact=contacts.find(function(c){return c.id===contactId});
  if(!contact)return;
  var w=getWallet(contactId);
  $('balance-contact-name').textContent=contact.name+' 的红包余额';
  $('current-balance').textContent=(w.myBalance/100).toFixed(2);
  $('my-balance-input').value=(w.myBalance/100).toFixed(2);
  $('ta-balance-input').value=(w.systemBalance/100).toFixed(2);
  showOv('ov-redpacket-balance');
}
function initRedPacketEventListeners(){
  if($('redpacket-send-btn')){
    $('redpacket-send-btn').addEventListener('click',function(){
      var amount=$('redpacket-amount').value;
      var greeting=$('redpacket-greeting').value.trim();
      sendRedPacket(cid,amount,greeting);
    });
  }
  ['52','520','1314'].forEach(function(v){
    var btn=$('redpacket-quick-'+v);
    if(btn){btn.addEventListener('click',function(){$('redpacket-amount').value=v;});}
  });
  if($('redpacket-manage-balance')){
    $('redpacket-manage-balance').addEventListener('click',function(){
      hideOv('ov-redpacket');
      if(cid)showRedPacketBalanceModal(cid);
    });
  }
  if($('save-my-balance')){
    $('save-my-balance').addEventListener('click',function(){
      if(!cid)return;
      var val=Number($('my-balance-input').value)||0;
      var w=getWallet(cid);w.myBalance=Math.round(val*100);saveWallet(cid,w);
      $('current-balance').textContent=(w.myBalance/100).toFixed(2);
      $('redpacket-balance').textContent=(w.myBalance/100).toFixed(2);
      toast('我的余额已更新');
    });
  }
  if($('save-ta-balance')){
    $('save-ta-balance').addEventListener('click',function(){
      if(!cid)return;
      var val=Number($('ta-balance-input').value)||0;
      var w=getWallet(cid);w.systemBalance=Math.round(val*100);saveWallet(cid,w);
      toast('TA的余额已更新');
    });
  }
}
initRedPacketEventListeners();

if($('call-incoming-prob-input'))$('call-incoming-prob-input').addEventListener('input',function(){
  $('call-incoming-prob-slider').value=this.value;
});
if($('call-incoming-prob-slider'))$('call-incoming-prob-slider').addEventListener('input',function(){
  $('call-incoming-prob-input').value=this.value;
});
if($('call-pickup-prob-input'))$('call-pickup-prob-input').addEventListener('input',function(){
  $('call-pickup-prob-slider').value=this.value;
});
if($('call-pickup-prob-slider'))$('call-pickup-prob-slider').addEventListener('input',function(){
  $('call-pickup-prob-input').value=this.value;
});
if($('call-busy-prob-input'))$('call-busy-prob-input').addEventListener('input',function(){
  $('call-busy-prob-slider').value=this.value;
});
if($('call-busy-prob-slider'))$('call-busy-prob-slider').addEventListener('input',function(){
  $('call-busy-prob-input').value=this.value;
});
if($('call-reject-prob-input'))$('call-reject-prob-input').addEventListener('input',function(){
  $('call-reject-prob-slider').value=this.value;
});
if($('call-reject-prob-slider'))$('call-reject-prob-slider').addEventListener('input',function(){
  $('call-reject-prob-input').value=this.value;
});
if($('call-hangup-prob-input'))$('call-hangup-prob-input').addEventListener('input',function(){
  $('call-hangup-prob-slider').value=this.value;
});
if($('call-hangup-prob-slider'))$('call-hangup-prob-slider').addEventListener('input',function(){
  $('call-hangup-prob-input').value=this.value;
});
if($('save-call-settings')){$('save-call-settings').addEventListener('click',function(){saveCallSettings();hideOv('ov-call-settings');toast('设置已保存')});$('save-call-settings').addEventListener('touchend',function(e){e.preventDefault();saveCallSettings();hideOv('ov-call-settings');toast('设置已保存')});}
$('initiate-call-btn')&&($('initiate-call-btn').addEventListener('click',initiateCall),$('initiate-call-btn').addEventListener('touchend',function(e){e.preventDefault();initiateCall()}));
$('call-end-btn')&&($('call-end-btn').addEventListener('click',function(){userEndCall()}),$('call-end-btn').addEventListener('touchend',function(e){e.preventDefault();userEndCall()}));
$('call-answer-btn')&&($('call-answer-btn').addEventListener('click',function(){
  if(!currentCall)return;
  if(currentCall.direction!=='incoming'||currentCall.status!=='ringing')return;
  // Stop ringtone
  if(incomingRingtoneAudio){try{incomingRingtoneAudio.pause();incomingRingtoneAudio=null}catch(e){}}
  // Stop countdown timer
  if(incomingCallTimer){clearInterval(incomingCallTimer);incomingCallTimer=null}
  if($('calling-countdown'))$('calling-countdown').style.display='none';
  // Switch to connected state
  if($('calling-incoming-btns'))$('calling-incoming-btns').style.display='none';
  if($('calling-end-btn-wrap'))$('calling-end-btn-wrap').style.display='block';
  currentCall.status='connected';
  $('calling-status').textContent='正在通话...';
  callConnectedTime=Date.now();
  toast('已接听');
  if(currentCall.callMsgId){
    updateCallMessage(currentCall.contactId,currentCall.callMsgId,'connected',0);
  }
  setTimeout(function(){minimizeCall()},800);
}),$('call-answer-btn').addEventListener('touchend',function(e){
  e.preventDefault();
  if(!currentCall)return;
  if(currentCall.direction!=='incoming'||currentCall.status!=='ringing')return;
  if(incomingRingtoneAudio){try{incomingRingtoneAudio.pause();incomingRingtoneAudio=null}catch(e){}}
  if(incomingCallTimer){clearInterval(incomingCallTimer);incomingCallTimer=null}
  if($('calling-countdown'))$('calling-countdown').style.display='none';
  if($('calling-incoming-btns'))$('calling-incoming-btns').style.display='none';
  if($('calling-end-btn-wrap'))$('calling-end-btn-wrap').style.display='block';
  currentCall.status='connected';
  $('calling-status').textContent='正在通话...';
  callConnectedTime=Date.now();
  toast('已接听');
  if(currentCall.callMsgId){
    updateCallMessage(currentCall.contactId,currentCall.callMsgId,'connected',0);
  }
  setTimeout(function(){minimizeCall()},800);
}));
$('call-reject-btn')&&($('call-reject-btn').addEventListener('click',function(){
  if(!currentCall)return;
  endCall('rejected',currentCall.duration);
}),$('call-reject-btn').addEventListener('touchend',function(e){
  e.preventDefault();
  if(!currentCall)return;
  endCall('rejected',currentCall.duration);
}));
$('call-minimize-btn')&&($('call-minimize-btn').addEventListener('click',minimizeCall),$('call-minimize-btn').addEventListener('touchend',function(e){e.preventDefault();minimizeCall()}));

$('touch-custom-input')&&$('touch-custom-input').addEventListener('keypress',function(e){if(e.key==='Enter'){$('touch-custom-send-btn').click()}});
function performTouch(targetId,action){
  var contact=contacts.find(function(c){return c.id===targetId});
  var group=groups.find(function(g){return g.id===targetId});
  if(!contact&&!group)return;
  
  var isGroupCtx = groups.find(function(g){return g.id===cid});
  var sendTargetId = isGroupCtx ? cid : targetId;
  var targetName=contact?contact.name:(group?group.name:'');
  var senderName = '我';
  
  var m=msgs(sendTargetId);
  var newMsg={
    id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),
    s:SELF, t:'', ts:new Date(), pc:false,
    isAuto:false, isInitiative:false,
    isTouch:true, touchAction:action,
    touchTarget: targetName,
    isGroup:!!group||!!isGroupCtx,
    senderName: senderName,
    senderId: me.id,
    read:true
  };
  m.push(newMsg);
  savemsgs(sendTargetId,m);
  if(cid===sendTargetId){
    renderMsgs(m);
    showTouchAnimation(action, targetName);
  }
  setTimeout(function(){
    renderChatList();
    scheduleTouchReply(sendTargetId);
  },200);
}
function scheduleTouchReply(targetId){
  if(!targetId)return;
  var rnProb=getSpeed('rn-prob',targetId,true);
  if(Math.random()*100<rnProb){
    markMessageReadIgnored(targetId,true);
    return;
  }
  var touchProb=getSpeed('touch-prob',targetId);
  if(touchProb>0&&Math.random()*100<touchProb){
    contactPerformTouch(targetId);
    return;
  }
  var rsMin=getSpeed('rs-min',targetId),rsMax=getSpeed('rs-max',targetId);
  typingStates[targetId]=true;
  if(cid===window.currentCid){var typingEl=$('typing');if(typingEl)typingEl.style.display='flex';}
  var delay=(rsMin+Math.random()*(rsMax-rsMin))*1000;
  // ★ 修复：拍一拍/红包用独立 timer（rpTimers），不再复用 rtimers（回复计时器），避免互相 clear 打断对方
  if(window._rpTimers===undefined)window._rpTimers={};
  if(window._rpTimers[targetId])clearTimeout(window._rpTimers[targetId]);
  window._rpTimers[targetId]=setTimeout(async function(){
    window._rpTimers[targetId]=null;
    var group=groups.find(function(g){return g.id===targetId});
    var isGroup=!!group;
    if(!isGroup){
      typingStates[targetId]=false;
      if(targetId===window.currentCid){var typingEl2=$('typing');if(typingEl2)typingEl2.style.display='none';}
    }
    await genReply(targetId);
    onReplyFinished(targetId);
  },delay);
}
function showTouchAnimation(action,targetName,isOther){var el=document.createElement('div');el.style.position='fixed';el.style.top='50%';el.style.left='50%';el.style.transform='translate(-50%,-50%)';el.style.background='rgba(0,0,0,.7)';el.style.color='#fff';el.style.padding='12px 24px';el.style.borderRadius='20px';el.style.fontSize='14px';el.style.zIndex='300';el.style.animation='touchAnim .8s ease-out forwards';el.textContent=isOther?(targetName||'对方')+' '+action:action.replace('你',targetName||'你');document.body.appendChild(el);setTimeout(function(){if(el.parentNode)el.remove()},800)}
function contactPerformTouch(contactId){
  var cards=[];
  var publicTouchCards=globalCards.filter(function(c){
    if(!c||c.category!=='touch')return false;
    if(c.type!=='public'&&c.type)return false;
    if(c.groupId){
      var group=cardGroups.find(function(g){return g.id===c.groupId});
      if(group&&group.disabled)return false;
      if(group&&group.type==='public'&&group.disabledContacts&&group.disabledContacts.indexOf(contactId)>=0)return false;
    }
    return true;
  });
  var privateTouchCards=globalCards.filter(function(c){
    if(!c||c.category!=='touch')return false;
    if(c.type!=='private'||c.contactId!==contactId)return false;
    if(c.groupId){
      var group=cardGroups.find(function(g){return g.id===c.groupId});
      if(group&&group.disabled)return false;
    }
    return true;
  });
  cards=cards.concat(publicTouchCards.map(function(c){return c.content}));
  cards=cards.concat(privateTouchCards.map(function(c){return c.content}));
  
  // 同时从独立的拍一拍字卡存储中获取（包含分组字卡）
  var storedPublicTouchCards=getAllTouchCards('public');
  cards=cards.concat(storedPublicTouchCards);
  var storedPrivateTouchCards=getAllTouchCards('private',contactId);
  cards=cards.concat(storedPrivateTouchCards);
  
  // ★ 修复：用户没有自定义拍一拍字卡时，补充默认通用字卡中的【拍一拍】内容
  if(cards.length===0){
    try{
      var _dcTouchArr=typeof getDefaultTouchCards==='function'?getDefaultTouchCards():[];
      cards=cards.concat(_dcTouchArr);
    }catch(e){console.warn('default touch cards fill failed:',e);}
  }
  
  if(cards.length===0)cards=TOUCH_ACTIONS;
  var action=cards[Math.floor(Math.random()*cards.length)];
  
  var contact=contacts.find(function(c){return c.id===contactId});
  if(!contact)return;
  var m=msgs(contactId);
  m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),s:OTHER,t:'',ts:new Date(),pc:false,isAuto:true,isInitiative:false,isTouch:true,touchAction:action,touchTarget:'你',read:false});
  savemsgs(contactId,m);
  if(cid===contactId){renderMsgs(m);showTouchAnimation(action,contact.name,true)}
  renderChatList();
  playSound('recv',contactId);
}

async function loadTouchCardsFromIndexedDB(){
  if(!window.localforage)return;
  var keys=['ml2_touch_cards_public','ml2_touch_cards_private','ml2_touch_groups','ml2_touch_group_cards'];
  for(var i=0;i<keys.length;i++){
    var key=keys[i];
    try{
      var indexedVal=await window.localforage.getItem(key);
      if(indexedVal!==null&&indexedVal!==undefined){
        ls(key,indexedVal);
      }
    }catch(e){}
  }
}

// ---------- Overlays ----------
function showOv(id){var el=$(id);if(!el)return;el.classList.add('show');if(el.querySelector('.sheet')&&!el.classList.contains('center-overlay'))el.classList.add('sheet-overlay')}function hideOv(id){
  if(id==='ov-contact-profile'){removeProfileSwipeBack();}
  var el=$(id);if(!el)return;requestAnimationFrame(function(){el.classList.remove('show');el.classList.remove('sheet-overlay')})
}
['ov-add','ov-edit','ov-speed','ov-letter-settings','ov-chat-more','ov-emoji','ov-decision','ov-group-decision','ov-divine','ov-divine-history','ov-moments-publish','ov-contact-touch','ov-search-chat','ov-beautify','ov-call','ov-call-settings','ov-contact-letter','ov-contact-letter-detail','ov-group-settings','ov-add-group-member','ov-survey','ov-survey-batch','ov-survey-detail','ov-contact-chatbar','ov-ta-favorites-settings','ov-copy-msg','ov-group-contact-filter','ov-pomodoro','ov-pomodoro-settings','ov-redpacket-balance','ov-redpacket-opened','ov-redpacket','ov-gift-send','ov-gift-detail','ov-gift-view','ov-giftbox'].forEach(function(id){
  var el=$(id);
  if(el){
    el.addEventListener('click',function(e){if(e.target===this)hideOv(id)});
    el.addEventListener('touchend',function(e){if(e.target===this){e.preventDefault();hideOv(id)}});
  }
});

// ov-calling 单独处理：防止误触
var _callingShownTime=0;
var _origShowOv=showOv;
showOv=function(id){
  _origShowOv(id);
  if(id==='ov-calling'){_callingShownTime=Date.now();}
};
// 防止来电窗口误触关闭和误触接通：阻止触摸事件传播到按钮
if($('ov-calling')){
$('ov-calling').addEventListener('touchstart',function(e){
  if(e.target===this){
    e.preventDefault();
  }
},{passive:false});
$('ov-calling').addEventListener('click',function(e){
  if(e.target===this){
    e.stopPropagation();
    // 来电时不允许点击背景关闭
    if(currentCall&&currentCall.direction==='incoming')return;
    // 去电时延迟1.5秒后才允许点击背景关闭
    if(Date.now()-_callingShownTime>1500){
      hideOv('ov-calling');
    }
  }
});
}

// ---------- Card Settings ----------
var globalCards=[];
var _defaultCommonCards=[]; // 独立存储默认通用字卡数据
var cardGroups=[];
var _defaultCommonGroups=[]; // 独立存储默认通用字卡分组
var currentCardType='public';
var currentCardCategory='custom';
var currentNavCardType='weather';
var currentCardGroup='all';
var selectedPrivateContact=null;
var foldedGroups={};
var allGroupsFolded=false;
var batchSelectedCards=[];


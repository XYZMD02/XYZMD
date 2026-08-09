// ===== 批量发送模式 =====
var isBatchMode = false;
var batchMessages = [];

function toggleBatchMode() {
  isBatchMode = !isBatchMode;
  var batchBtn = $('batch-btn');
  var batchPreview = $('batch-preview');
  var msgInp = $('msg-inp');
  
  if (isBatchMode) {
    if (batchBtn) batchBtn.classList.add('active');
    if (batchBtn) batchBtn.title = '退出批量模式';
    if (batchPreview) { batchPreview.classList.add('show'); batchPreview.style.display = 'flex'; }
    batchMessages = [];
    if (msgInp) msgInp.placeholder = '此刻，想说的有很多很多...';
    updateBatchPreview();
  } else {
    if (batchBtn) batchBtn.classList.remove('active');
    if (batchBtn) batchBtn.title = '批量发送模式';
    if (batchPreview) { batchPreview.classList.remove('show'); batchPreview.style.display = 'none'; }
    batchMessages = [];
    if (msgInp) msgInp.placeholder = '输入消息...';
  }
  updateSendBtn();
}

function addToBatch() {
  var inp = $('msg-inp');
  var t = inp.value.trim();
  if (!t) return;
  
  batchMessages.push({
    id: Date.now() + '_' + batchMessages.length,
    text: t,
    type: 'text'
  });
  
  inp.value = '';
  inp.style.height = 'auto';
  updateBatchPreview();
  updateSendBtn();
  haptic('light');
}

function updateBatchPreview() {
  var preview = $('batch-preview');
  if (!preview) return;
  
  var listHTML = '';
  if (batchMessages.length > 0) {
    listHTML = batchMessages.map(function(msg, index) {
      if (msg.type === 'image') {
        var imgSrc = msg.originalImage || msg.image;
        return '<div class="batch-preview-item" data-index="' + index + '">' +
          '<img src="' + imgSrc + '" style="width:60px;height:60px;border-radius:8px;object-fit:cover;flex-shrink:0;">' +
          '<span class="batch-preview-text">图片</span>' +
          '<button class="batch-preview-remove">×</button>' +
        '</div>';
      }
      return '<div class="batch-preview-item" data-index="' + index + '">' +
        '<span class="batch-preview-text">' + escapeHtml(msg.text) + '</span>' +
        '<button class="batch-preview-remove">×</button>' +
      '</div>';
    }).join('');
  } else {
    listHTML = '<div style="text-align:center;color:var(--txt3);font-size:12px;padding:10px;">暂无消息</div>';
  }
  
  preview.innerHTML = 
    '<div class="batch-preview-title">' +
      '<span style="font-size:10px;color:var(--txt4);">批量发送：支持一次输入多条消息内容，并按照顺序逐条发送到聊天记录中（群友想要，借鉴milk老师的字卡功能搓了，总之感谢milk老师）</span>' +
      '<button class="batch-add-img-btn" id="batch-add-img-btn" title="添加图片">🖼️</button>' +
    '</div>' +
    '<div class="batch-preview-list">' + listHTML + '</div>' +
    '<div class="batch-actions">' +
      '<button class="batch-action-btn batch-cancel-btn">取消</button>' +
      '<button class="batch-action-btn batch-send-btn"' + (batchMessages.length === 0 ? ' disabled' : '') + '>发送全部 (' + batchMessages.length + ')</button>' +
    '</div>';
}

function sendBatchMessages() {
  if (batchMessages.length === 0) return;
  if (!cid) { toast('请先选择联系人'); return; }
  
  toast('正在发送 ' + batchMessages.length + ' 条消息...');
  
  var totalDelay = batchMessages.length * 300;
  
  batchMessages.forEach(function(msg, index) {
    setTimeout(function() {
      var m = msgs(cid);
      if (msg.type === 'image') {
        var msgObj = {
          id: 'm_' + Date.now() + '_' + index + '_' + Math.random().toString(36).substr(2, 5),
          s: SELF,
          t: '',
          img: msg.image,
          ts: new Date(),
          pc: false,
          isSticker: false,
          isGroup: window.currentConvType === 'group',
          read: true,
          senderName: '我',
          senderId: me.id
        };
        m.push(msgObj);
      } else {
        var msgObj = {
          id: 'm_' + Date.now() + '_' + index + '_' + Math.random().toString(36).substr(2, 5),
          s: SELF,
          t: msg.text,
          ts: new Date(),
          pc: false,
          isGroup: window.currentConvType === 'group',
          read: true,
          senderName: '我',
          senderId: me.id
        };
        m.push(msgObj);
      }
      savemsgs(cid, m);
      renderMsgs(m);
      var msgbox=$('msgbox');if(msgbox)msgbox.scrollTop=msgbox.scrollHeight;
      
      if (index === batchMessages.length - 1) {
        renderChatList();
      }
      
      playSound('send', cid);
    }, index * 300);
  });
  
  // 统一调度回复
  setTimeout(function() {
    if (!pomodoroState.isRunning || !pomodoroState.isPaused || !pomodoroSettings.blockDuringFocus) {
      scheduleReply();
    }
  }, totalDelay);
  
  // 退出批量模式
  isBatchMode = false;
  batchMessages = [];
  var batchBtn = $('batch-btn');
  var batchPreview = $('batch-preview');
  var msgInp = $('msg-inp');
  if (batchBtn) batchBtn.classList.remove('active');
  if (batchPreview) { 
    batchPreview.classList.remove('show'); 
    batchPreview.style.display = 'none';
    batchPreview.innerHTML = '';
  }
  if (msgInp) {
    msgInp.placeholder = '输入消息...';
    msgInp.value = '';
    msgInp.style.height = '36px';
  }
  updateSendBtn();
}

function sendMsg(){
  if(!cid)return;
  if(isBatchMode){addToBatch();return;}
  var inp=$('msg-inp'),t=inp.value.trim();
  if(pendingImages.length>0){
    var imgs=pendingImages.slice();
    pendingImages=[];
    renderPendingImages('inline-image-bar','iith_');
    var m=msgs(cid);
    var msg={id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),s:SELF,t:t||'',imgs:imgs,img:imgs.length===1?imgs[0]:'',ts:new Date(),pc:false,quote:replyingToMsg,isGroup:window.currentConvType==='group',read:true,senderName:'我',senderId:me.id,isSticker:false};
    m.push(msg);
    savemsgs(cid,m);
    inp.value='';inp.style.height='36px';replyingToMsg=null;$('quote-preview').style.display='none';
    renderMsgs(m);updateSendBtn();renderChatList();scheduleReply();playSound('send',cid);haptic('light');simulateTAFavorite();
    return;
  }
  if(!t)return;
  var m2=msgs(cid);var msg2={id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),s:SELF,t:t,ts:new Date(),pc:false,quote:replyingToMsg,isGroup:window.currentConvType==='group',read:true,senderName:'我',senderId:me.id};m2.push(msg2);savemsgs(cid,m2);inp.value='';inp.style.height='36px';replyingToMsg=null;$('quote-preview').style.display='none';renderMsgs(m2);updateSendBtn();renderChatList();scheduleReply();playSound('send',cid);haptic('light');simulateTAFavorite();
}
function updateSendBtn(){var inp=$('msg-inp'),s=$('btn-send');if(inp.value.trim().length>0||pendingImages.length>0){s.classList.remove('disabled')}else{s.classList.add('disabled')}}
function scheduleReply(){console.log('[reply] scheduleReply cid='+cid);if(!cid||cid==='fh')return;if(isBatchMode)return;if(pomodoroState.isRunning&&!pomodoroState.isPaused&&pomodoroSettings.blockDuringFocus)return;var rsMin=getSpeed('rs-min',cid),rsMax=getSpeed('rs-max',cid),rnProb=getSpeed('rn-prob',cid,true);var targetId=cid;var msgbox=$('msgbox');if(msgbox)msgbox.scrollTop=msgbox.scrollHeight;if(Math.random()*100<rnProb){console.log('[reply] rnProb 已读不回',rnProb);rtimers[targetId]=setTimeout(function(){markMessageReadIgnored(targetId)},(1+Math.random()*3)*1000);return}typingStates[targetId]=true;if(cid===window.currentCid){var typingEl=$('typing');if(typingEl)typingEl.style.display='flex';}var delay=(rsMin+Math.random()*(rsMax-rsMin))*1000;if(rtimers[targetId])clearTimeout(rtimers[targetId]);rtimers[targetId]=setTimeout(function(){console.log('[reply] delay结束, 调genReply',targetId);try{var group=groups.find(function(g){return g.id===targetId});var isGroup=!!group;if(isGroup){/* For group chats, keep typing indicator visible until all members respond */genReply(targetId).catch(function(e){console.warn('genReply group failed:',e)});}else{typingStates[targetId]=false;if(targetId===window.currentCid){var typingEl2=$('typing');if(typingEl2)typingEl2.style.display='none';}genReply(targetId).catch(function(e){console.warn('genReply failed:',e)})}}catch(e){console.warn('scheduleReply exec failed:',e);typingStates[targetId]=false;if(targetId===window.currentCid){var _te=$('typing');if(_te)_te.style.display='none';}}},delay)}
function markMessageReadIgnored(targetId,silent){
  var m=msgs(targetId);
  if(m.length===0)return;
  var lastSelfMsg=m.filter(function(msg){return msg.s===SELF}).pop();
  if(lastSelfMsg){
    lastSelfMsg.readIgnored=silent?'touch':true;
    savemsgs(targetId,m);
    if(targetId===window.currentCid)renderMsgs(m);
    renderChatList();
  }
}



async function genReply(targetId,forceSingle){
  console.log('[reply] genReply target='+targetId+' forceSingle='+forceSingle);
  if(!targetId)targetId=cid;
  if(!targetId)return;

  // ★ 修复：确保用户自己的字卡（globalCards）已加载，避免点【让对方继续说】时
  // globalCards 未加载导致只剩默认通用字卡（用户自己的公用/专享字卡没进池）
  // ★ 修复：loadGlobalCards 读 IndexedDB 在部分设备可能挂起 → 加 1.5 秒超时，超时继续（按空字卡走兜底）
  if(typeof globalCards==='undefined'||!globalCards||globalCards.length===0){
    try{
      if(typeof loadGlobalCards==='function'){
        console.log('[reply] 开始 loadGlobalCards');
        await Promise.race([
          loadGlobalCards(),
          new Promise(function(_res){setTimeout(function(){_res();},1500);})
        ]);
        console.log('[reply] loadGlobalCards 完成, globalCards.length='+(globalCards?globalCards.length:'undef'));
      }
    }catch(e){console.warn('genReply loadGlobalCards failed:',e);}
  }

  if(!currentCall){
    checkIncomingCall();
  }
  
  var group=groups.find(function(g){return g.id===targetId});
  var isGroup=!!group;
  var senderId=targetId;
  var senderName='';
  
  if(isGroup){
    var groupMsgs=msgs(targetId);
    var hasUserSpoken=groupMsgs.some(function(msg){return msg.s===SELF});
    if(!hasUserSpoken){
      typingStates[targetId]=false;
      if(targetId===window.currentCid){var typingEl0=$('typing');if(typingEl0)typingEl0.style.display='none';}
      return;
    }
    
    var otherMembers=group.memberIds.filter(function(id){return id!==me.id});
    if(otherMembers.length===0){
      typingStates[targetId]=false;
      if(targetId===window.currentCid){var typingEl0=$('typing');if(typingEl0)typingEl0.style.display='none';}
      return;
    }
    
    // 遍历所有成员，根据每个成员的概率设置决定是否回复
    var selectedMembers=[];
    for(var i=0;i<otherMembers.length;i++){
      var memberId=otherMembers[i];
      // 获取该成员的群聊回复概率
      var pyEn=getSpeed('py-en',memberId);
      var pyProb=getSpeed('py-prob',memberId);
      
      // 检查是否启用了回复功能
      if(pyEn===0||pyEn===false){
        continue; // 该成员未启用群聊回复
      }
      
      // 根据概率决定是否回复
      if(Math.random()*100<pyProb){
        selectedMembers.push(memberId);
      }
    }
    
    // 如果没有成员命中概率，至少选择1个成员回复（使用全局默认概率）
    if(selectedMembers.length===0){
      var defaultProb=getSpeed('py-prob');
      // 如果默认概率为0或未设置，则随机选择一个成员
      if(defaultProb<=0){
        selectedMembers=[otherMembers[Math.floor(Math.random()*otherMembers.length)]];
      }
      // 否则保持为空，没有成员回复
    }
    
    // Clear typing indicator after the last member's reply
    var totalMembers=selectedMembers.length;
    if(totalMembers===0){
      typingStates[targetId]=false;
      if(targetId===window.currentCid){var typingEl0=$('typing');if(typingEl0)typingEl0.style.display='none';}
      return;
    }
    
    var completedCount=0;
    var onMemberComplete=function(){
      completedCount++;
      if(completedCount>=totalMembers){
        typingStates[targetId]=false;
        if(targetId===window.currentCid){var typingEl=$('typing');if(typingEl)typingEl.style.display='none';}
      }
    };
    
    // Generate replies for each selected member with staggered delays
    var baseDelay=0;
    for(var idx=0;idx<selectedMembers.length;idx++){
      // 获取该成员的等待时间设置
      var rsMin=getSpeed('rs-min',selectedMembers[idx])*1000;
      var rsMax=getSpeed('rs-max',selectedMembers[idx])*1000;
      var memberDelay=rsMin+Math.random()*(rsMax-rsMin);
      
      (function(memberId,delay){
        setTimeout(async function(){
          try{
            await genSingleMemberReply(targetId,memberId,group,undefined,forceSingle);
          }finally{
            onMemberComplete();
          }
        },delay);
      })(selectedMembers[idx],baseDelay+memberDelay);
      
      baseDelay+=500; // 成员之间错开500ms
    }
    return;
  }
  
  // Non-group chat: single reply
  if(group&&group.memberIds&&group.memberIds.length>0){
    var allMembers=group.memberIds;
    senderId=allMembers[Math.floor(Math.random()*allMembers.length)];
  }
  var sender=contacts.find(function(c){return c.id===senderId});
  var baseName=sender?sender.name:'未知';
  senderName=baseName;
  
  await genSingleMemberReply(targetId,senderId,null,senderName,forceSingle);
}

async function genSingleMemberReply(targetId,senderId,group,preComputedSenderName,forceSingle){
  var isGroup=!!group;
  var senderName=preComputedSenderName||'';
  
  if(isGroup){
    var sender=contacts.find(function(c){return c.id===senderId});
    var baseName=sender?sender.name:'未知';
    var groupNickname=group.memberSettings&&group.memberSettings[senderId]&&group.memberSettings[senderId].nickname||'';
    senderName=groupNickname||baseName;
  }
  
  if(!senderId||senderId===me.id)return;
  
  var touchProb=getSpeed('touch-prob',senderId);
  if(touchProb>0&&Math.random()*100<touchProb){
    contactPerformTouch(targetId);
    return;
  }
  // ★ 修复：默认通用字卡的【拍一拍】只在用户明确选择拍一拍时触发（不发普通文字）
  // 注意：不再因 defaultCommonEnabled 开关而随机触发，避免把正常字卡回复变成拍一拍
  try{
    if(typeof _fallbackDefaultCat!=='undefined'&&_fallbackDefaultCat==='touch'){
      var _dcTouchProb=defaultCommonProbs&&defaultCommonProbs.touch!=null?defaultCommonProbs.touch:30;
      if(Math.random()*100<_dcTouchProb){
        var _dcTouchCards=typeof getDefaultTouchCards==='function'?getDefaultTouchCards():[];
        if(_dcTouchCards.length>0){
          contactPerformTouch(targetId);
          return;
        }
      }
    }
  }catch(e){console.warn('default touch check failed:',e);}
  
  var userCards=globalCards.filter(function(card){
    if(!card)return false;
    if(!card.content)return false;
    if(card.category!=='stickers'&&card.category!=='voices'&&(!card.content.trim()))return false;
    if(card.category==='touch')return false;
    if(card.groupId){
      var cg=cardGroups.find(function(g){return g.id===card.groupId});
      if(cg&&cg.disabled)return false;
      if(cg&&cg.type==='public'&&cg.disabledContacts&&cg.disabledContacts.indexOf(senderId)>=0)return false;
    }
    if(card.type==='public')return true;
    if(card.type==='private'){
      if(card.contactId===senderId)return true;
      var pc=cardPrivateContacts.find(function(p){return p.id===card.contactId&&p.bindContactId===senderId});
      if(pc)return true;
    }
    if(!card.type)return true;
    return false;
  });
  
  // 构建可用字卡池（只有用户自己的字卡）
  var availableCards=userCards.slice();
  
  // ★ 修复：默认通用字卡（11007条）不混入池——否则数量占绝对多数，几乎必然抽到默认字卡。
  // 改为独立判定：按"整体出现概率"决定本次回复是否用默认字卡；用则单独从默认字卡抽。
  var _useDefaultOnly=false;
  if(defaultCommonEnabled&&defaultCommonAllContacts&&defaultCommonUseChat){
    if(availableCards.length===0){
      // 没有自己的字卡：默认字卡兜底（仍受整体概率控制）
      var _dc0=getDefaultCommonCardsForContact(senderId);
      if(_dc0&&_dc0.length>0){
        availableCards=_dc0.map(function(text){return {content:text,category:'custom',type:'default_common',groupId:null};});
        _useDefaultOnly=true;
      }
    }
    // 有自己的字卡：默认字卡不进池，由后面的独立概率逻辑决定是否用默认字卡
  }
  
  // ★ 兜底：既没有自己的字卡，默认字卡也没触发 → 用默认通用字卡（force 绕过开关/概率），发提示兜底
  if(!availableCards.length){
    try{
      var _fbCards=getDefaultCommonCardsForContact(senderId,true,_fallbackDefaultCat||'main');
      if(_fbCards&&_fbCards.length>0){
        availableCards=_fbCards.map(function(text){return {content:text,category:'custom',type:'default_common',groupId:null};});
        _useDefaultOnly=true;
      }
    }catch(e){console.warn('fallback default cards failed:',e);}
  }
  
  if(!availableCards.length){
    console.log('[reply] 无可用字卡 availableCards=0, 走提示分支');
    if(isGroup)return; // Skip group members with no cards silently
    var m=msgs(targetId);
    // ★ 修复：聊天记录为空也要发提示消息（之前直接 return 导致点【继续说】无任何反应）
    if(!m||!Array.isArray(m))m=[];
    var replyMsg={id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),s:OTHER,t:'请在字卡库里上传字卡后开始聊天',img:'',voice:'',voiceText:'',ts:new Date(),pc:false,isAuto:true,isInitiative:false,quote:null,isSticker:false,isVoice:false,senderName:senderName,senderId:senderId,isGroup:isGroup,read:(targetId===cid)};
    m.push(replyMsg);
    savemsgs(targetId,m);
    if(targetId===window.currentCid)renderMsgs(m);renderChatList();playSound('recv',targetId);
    return;
  }
  
  var textCards=availableCards.filter(function(c){return c.category!=='stickers'&&c.category!=='voices'&&c.category!=='emojis'&&c.category!=='kaomoji'&&c.category!=='image'});
  var emojiCards=availableCards.filter(function(c){return c.category==='emojis'});
  var kaomojiCards=availableCards.filter(function(c){return c.category==='kaomoji'});
  var stickerCards=availableCards.filter(function(c){return c.category==='stickers'});
  var voiceCards=availableCards.filter(function(c){return c.category==='voices'});
  var imageCards=availableCards.filter(function(c){return c.category==='image'});

  var reply='',pc=false,imgSrc='',voiceSrc='',voiceText='',isStickerImg=false,_firstType='text';

  // 核心逻辑：仅有语音字卡 → 100%语音回复；仅有文字字卡 → 100%文字回复
  var onlyVoice=(textCards.length===0&&emojiCards.length===0&&kaomojiCards.length===0&&stickerCards.length===0&&imageCards.length===0&&voiceCards.length>0);
  var onlyText=(textCards.length>0&&emojiCards.length===0&&kaomojiCards.length===0&&stickerCards.length===0&&imageCards.length===0&&voiceCards.length===0);
  var onlyEmoji=(textCards.length===0&&emojiCards.length>0&&kaomojiCards.length===0&&stickerCards.length===0&&imageCards.length===0&&voiceCards.length===0);
  var onlyKaomoji=(textCards.length===0&&emojiCards.length===0&&kaomojiCards.length>0&&stickerCards.length===0&&imageCards.length===0&&voiceCards.length===0);
  var onlySticker=(textCards.length===0&&emojiCards.length===0&&kaomojiCards.length===0&&stickerCards.length>0&&imageCards.length===0&&voiceCards.length===0);
  var onlyImage=(textCards.length===0&&emojiCards.length===0&&kaomojiCards.length===0&&stickerCards.length===0&&imageCards.length>0&&voiceCards.length===0);
  
  if(onlyVoice){_firstType='voice';
    var vrc=voiceCards[Math.floor(Math.random()*voiceCards.length)];

    voiceSrc=vrc.content;
    voiceText=vrc.voiceText||'';
  }else if(onlySticker){_firstType='sticker';
    var src=stickerCards[Math.floor(Math.random()*stickerCards.length)];

    imgSrc=src.content;
    isStickerImg=true;
  }else if(onlyImage){_firstType='image';
    var imgRC=imageCards[Math.floor(Math.random()*imageCards.length)];
    imgSrc=imgRC.content;
    isStickerImg=false;
  }else if(onlyText){
    var pyEn=getSpeed('py-en',senderId),pyProb=getSpeed('py-prob',senderId)/100,pyMin=getSpeed('py-min',senderId),pyMax=getSpeed('py-max',senderId);
    if(pyEn&&Math.random()<pyProb){
      // ★ 修复：多条字卡同样优先用户自己的字卡，默认字卡按概率补充
      var userTextCardsAvl=textCards.filter(function(card){return card.content&&card.content.trim()&&card.type!=='default_common'});
      var dcTextCardsAvl=textCards.filter(function(card){return card.content&&card.content.trim()&&card.type==='default_common'});
      var avl=userTextCardsAvl.slice();
      // ★ 默认字卡已由 getDefaultCommonCardsForContact 按整体概率过滤（命中才返回），这里直接混入
      if(dcTextCardsAvl.length>0){
        avl=avl.concat(dcTextCardsAvl.slice(0,Math.max(1,Math.floor((userTextCardsAvl.length||1)*0.5))));
      }
      if(avl.length===0)avl=dcTextCardsAvl.slice();
      if(avl.length>=pyMin){
        var cnt=Math.max(pyMin,Math.floor(Math.random()*(Math.min(pyMax,avl.length)-pyMin+1))+pyMin);
        var selectedCards=avl.slice().sort(function(){return Math.random()-.5}).slice(0,cnt);
        reply=selectedCards.map(function(c){return c.content}).join(' ');
        
        pc=true;
      }
    }
    if(!reply&&textCards.length){
      // ★ 修复：优先用用户自己的字卡，默认通用字卡按概率"补充"而非按数量淹没
      // 避免默认字卡几百条数量占比导致几乎总是抽到默认字卡
      var userTextCards=textCards.filter(function(c){return c.type!=='default_common'});
      var dcTextCards=textCards.filter(function(c){return c.type==='default_common'});
      if(userTextCards.length>0){
        // ★ 默认字卡已由 getDefaultCommonCardsForContact 按整体概率过滤（命中才返回），这里直接混入
        if(dcTextCards.length>0){
          // 混合：从用户字卡和默认字卡里各按比例抽
          var pool=userTextCards.concat(dcTextCards.slice(0,Math.max(1,Math.floor(userTextCards.length*0.5))));
          var rc=pool[Math.floor(Math.random()*pool.length)];
          reply=rc.content;
        }else{
          var rc2=userTextCards[Math.floor(Math.random()*userTextCards.length)];
          reply=rc2.content;
        }
      }else{
        // 没有自己的字卡：直接用默认字卡
        var rc3=dcTextCards[Math.floor(Math.random()*dcTextCards.length)];
        reply=rc3.content;
      }
    }
  }else if(onlyEmoji){_firstType='emoji';
    var erc=emojiCards[Math.floor(Math.random()*emojiCards.length)];
    
    reply=erc.content;
  }else if(onlyKaomoji){_firstType='kaomoji';
    var krc=kaomojiCards[Math.floor(Math.random()*kaomojiCards.length)];
    
    reply=krc.content;
  }else{
    // 混合字卡：使用概率
    var stickerProb=getSpeed('sticker-prob',senderId);
    var isStickerReply=stickerCards.length>0&&Math.random()*100<stickerProb;

    var emojiProb=getSpeed('emoji-prob',senderId);
    var isEmojiReply=!isStickerReply&&emojiCards.length>0&&Math.random()*100<emojiProb;

    var imageProb=getSpeed('image-prob',senderId)||5;
    var isImageReply=!isStickerReply&&!isEmojiReply&&imageCards.length>0&&Math.random()*100<imageProb;

    var voiceProb=getSpeed('voice-prob',senderId)||10;
    if(textCards.length===0&&emojiCards.length===0&&voiceCards.length>0)voiceProb=100;
    var isVoiceReply=!isStickerReply&&!isEmojiReply&&!isImageReply&&voiceCards.length>0&&Math.random()*100<voiceProb;

    if(isStickerReply){_firstType='sticker';
      var rc=stickerCards[Math.floor(Math.random()*stickerCards.length)];

      imgSrc=rc.content;
      isStickerImg=true;
      // ★ 修复：图片表情可与文字字卡同发
      if(textCards.length>0&&Math.random()<0.5){
        reply=textCards[Math.floor(Math.random()*textCards.length)].content;
      }
    }else if(isImageReply){_firstType='image';
      var irc=imageCards[Math.floor(Math.random()*imageCards.length)];
      imgSrc=irc.content;
      isStickerImg=false;
    }else if(isEmojiReply){_firstType='emoji';
      var erc=emojiCards[Math.floor(Math.random()*emojiCards.length)];

      reply=erc.content;
      // ★ 修复：emoji 表情也可附带文字字卡
      if(textCards.length>0&&Math.random()<0.3){
        reply=textCards[Math.floor(Math.random()*textCards.length)].content+' '+reply;
      }
    }else if(isVoiceReply){_firstType='voice';
      var vrc=voiceCards[Math.floor(Math.random()*voiceCards.length)];

      voiceSrc=vrc.content;
      voiceText=vrc.voiceText||'';
    }else{
      var pyEn=getSpeed('py-en',senderId),pyProb=getSpeed('py-prob',senderId)/100,pyMin=getSpeed('py-min',senderId),pyMax=getSpeed('py-max',senderId);
      if(pyEn&&Math.random()<pyProb){
        var avl=textCards.filter(function(card){return card.content&&card.content.trim()});
        if(avl.length>=pyMin){
          var cnt=Math.max(pyMin,Math.floor(Math.random()*(Math.min(pyMax,avl.length)-pyMin+1))+pyMin);
          var selectedCards=avl.slice().sort(function(){return Math.random()-.5}).slice(0,cnt);
          reply=selectedCards.map(function(c){return c.content}).join(' ');
          
          pc=true;
        }
      }
      if(!reply&&textCards.length){
        var rc=textCards[Math.floor(Math.random()*textCards.length)];
        
        reply=rc.content;
      }
      if(!reply&&!imgSrc&&!voiceSrc&&voiceCards.length>0){
        var vrc2=voiceCards[Math.floor(Math.random()*voiceCards.length)];
        
        voiceSrc=vrc2.content;
        voiceText=vrc2.voiceText||'';
        reply='';
      }
      if(!reply&&!imgSrc&&!voiceSrc)reply='请在字卡库里上传字卡后开始聊天';
      
      // 颜文字概率：独立于主字卡，可附加到文字回复中
      var kaomojiProb=getSpeed('kaomoji-prob',senderId);
      if(kaomojiProb>0&&kaomojiCards.length>0&&Math.random()*100<kaomojiProb){
        var kc=kaomojiCards[Math.floor(Math.random()*kaomojiCards.length)];
        
        if(reply&&reply!=='请在字卡库里上传字卡后开始聊天'){
          reply=reply+' '+kc.content;
        }else{
          reply=kc.content;
        }
      }
    }
  }
  
  var quoteMsgId=null;
  var quoteProb=getSpeed('quote-prob',senderId)/100;
  if(quoteProb>0&&Math.random()<quoteProb){
    var messages=msgs(targetId);
    var selfMsgs=messages.filter(function(m){return m.s===SELF});
    if(selfMsgs.length>0){
      quoteMsgId=selfMsgs[selfMsgs.length-1].id;
    }
  }
  
  console.log('[reply] availableCards.length='+availableCards.length+' 到达moodCard步骤');
  var moodCard=null,heartCard=null,intentCard=null;
  // ★ 修复：情绪/心意/交流意图字卡用 3 秒超时——localforage(IndexedDB) 在部分 iOS/Edge 可能挂起，
  // 无超时会导致 genReply 永远卡在 await、消息发不出来。
  // 3 秒内读到→带情绪卡；超时→跳过情绪卡但回复正常发出。
  // ★ 异常/超时绝不阻断主回复
  try{
    var _cardsResult=await Promise.race([
      (async function(){
        var _mc=await getRandomMoodCard(targetId);
        if(_mc){emotionStreak+=1;}else{emotionStreak=0;}
        var _hc=await getRandomHeartCard(targetId, _mc);
        var _ic=await getRandomIntentCard(targetId, _hc);
        return {moodCard:_mc,heartCard:_hc,intentCard:_ic};
      })(),
      new Promise(function(_res){setTimeout(function(){_res(null);},3000);})
    ]);
    if(_cardsResult){
      moodCard=_cardsResult.moodCard;
      heartCard=_cardsResult.heartCard;
      intentCard=_cardsResult.intentCard;
    }
  }catch(e){console.warn('[reply] mood/heart/intent cards timeout/failed:',e);}
  console.log('[reply] moodCard步骤完成 moodCard='+(moodCard?'有':'无'));
  
  var m=msgs(targetId);
  if(!m||!Array.isArray(m))m=[];
  // ★ 修复：过滤损坏的空槽/undefined 元素（历史数据损坏会导致 push/render 时抛错 → 静默无消息）
  if(m.some(function(x){return !x;})){
    m=m.filter(function(x){return !!x;});
    try{savemsgs(targetId,m);}catch(e){console.warn('[reply] 过滤损坏消息后保存失败:',e);}
  }
  // ★ 修复：按"回复消息条数"设置（reply-min ~ reply-max）随机发送多条
  // 传 senderId：getSpeed 优先 per-contact，无则回退全局，两者都能读到
  // ★ 继续说（forceSingle）只发 1 条
  var _replyCount=1;
  if(!forceSingle){
    var _rMin=parseInt(getSpeed('reply-min',senderId))||1;
    var _rMax=parseInt(getSpeed('reply-max',senderId))||5;
    if(_rMax<_rMin)_rMax=_rMin;
    if(_rMin<1)_rMin=1;
    if(_rMax>10)_rMax=10;
    _replyCount=_rMin+Math.floor(Math.random()*(_rMax-_rMin+1));
  }
  var _replyBaseId='m_'+Date.now();
  var _sentCount=0;
  // ★ 修复：replyMsg 提升为函数级变量（rcProb 撤回块闭包引用它，若为 _sendReplyBatch 局部则 undefined 抛错）
  var replyMsg=null;
  // ★ 修复：多条消息逐条延迟发送（间隔 1.2~2.8 秒），不是一次性全蹦出来
  function _sendReplyBatch(idx){
    if(idx>=_replyCount){
      savemsgs(targetId,m);
      if(targetId===window.currentCid)renderMsgs(m);renderChatList();playSound('recv',targetId);
      return;
    }
    // 多字卡随机：每条从 textCards 重新抽（若前面没生成 reply 池）
    var _curReply=reply, _curImg=imgSrc, _curVoice=voiceSrc, _curVoiceText=voiceText;
    if(idx>0){
      // ★ 模拟真人：仅表情包可小概率连发同一条（真人常见）；语音/图片/文字同批内绝不重复
      var _usedSticker=[],_usedImage=[],_usedVoice=[],_usedText=[];
      for(var _ui=0;_ui<m.length;_ui++){
        var _um=m[_ui];
        if(!_um)continue;
        if(_um.isSticker&&_um.img)_usedSticker.push(_um.img);
        else if(_um.img)_usedImage.push(_um.img);
        if(_um.voice)_usedVoice.push(_um.voice);
        if(_um.t&&!_um.voice)_usedText.push(_um.t);
      }
      function _pickNoDup(_arr,_used,_maxTry){
        _maxTry=_maxTry||12;
        // ★ 增强：先从池中剔除所有已用内容，再随机抽——卡池再小也绝不重复（除非池里全是已用的）
        var _fresh=[];
        for(var _fi=0;_fi<_arr.length;_fi++){
          if(_used.indexOf(_arr[_fi].content)<0)_fresh.push(_arr[_fi]);
        }
        if(_fresh.length>0)return _fresh[Math.floor(Math.random()*_fresh.length)];
        for(var _t=0;_t<_maxTry;_t++){
          var _c=_arr[Math.floor(Math.random()*_arr.length)];
          if(_used.indexOf(_c.content)<0)return _c;
        }
        return _arr[Math.floor(Math.random()*_arr.length)];
      }
      if(Math.random()<0.15&&_firstType==='sticker'&&imgSrc&&isStickerImg&&stickerCards&&stickerCards.length>0){
        // 保持 _curImg 不变（连发相同表情包图片，真人常见）——仅表情包图片允许 15% 重复
      }else if(_firstType==='sticker'&&imgSrc&&stickerCards&&stickerCards.length>0){
        var _rc2=_pickNoDup(stickerCards,_usedSticker);
        _curImg=_rc2.content;
      }else if(_firstType==='image'&&imgSrc&&imageCards&&imageCards.length>0){
        var _rc3=_pickNoDup(imageCards,_usedImage);
        _curImg=_rc3.content;
      }else if(_firstType==='voice'&&voiceSrc&&voiceCards&&voiceCards.length>0){
        var _rc4=_pickNoDup(voiceCards,_usedVoice);
        _curVoice=_rc4.content;
        _curVoiceText=_rc4.voiceText||'';
      }else if(!_curImg&&!_curVoice&&!imgSrc&&!voiceSrc&&_firstType==='emoji'&&emojiCards&&emojiCards.length>0){
        // ★ 修复：emoji 不允许重复，直接去重重抽
        var _rc6=_pickNoDup(emojiCards,_usedText);
        _curReply=_rc6.content;
      }else if(!_curImg&&!_curVoice&&!imgSrc&&!voiceSrc&&_firstType==='kaomoji'&&kaomojiCards&&kaomojiCards.length>0){
        // ★ 修复：颜文字不允许重复，直接去重重抽
        var _rc7=_pickNoDup(kaomojiCards,_usedText);
        _curReply=_rc7.content;
      }
      // ★ 修复：文字重选——文字型消息（含表情包+文字）绝不重复，每次去重重抽；
      // emoji/颜文字/语音/图片由各自分支处理，不在这里覆盖
      if(textCards&&textCards.length>0&&_curReply&&_firstType!=='emoji'&&_firstType!=='kaomoji'&&_firstType!=='voice'&&_firstType!=='image'){
      var _rc5=_pickNoDup(textCards,_usedText);
      _curReply=_rc5.content;
      // 多字卡设置：概率附加更多字卡
      var _pyEn=getSpeed('py-en',targetId), _pyProb=getSpeed('py-prob',targetId)/100;
      if(_pyEn&&Math.random()<_pyProb){
        var _pyMin=parseInt(getSpeed('py-min',targetId))||2;
        var _pyMax=parseInt(getSpeed('py-max',targetId))||4;
        var _extra=Math.floor(Math.random()*Math.max(1,_pyMax-_pyMin+1))+_pyMin;
        for(var _ei=0;_ei<_extra&&textCards.length>0;_ei++){
          _curReply+=' '+textCards[Math.floor(Math.random()*textCards.length)].content;
        }
      }
    }
    } // ★ 修复：关闭 if(idx>0) 块（此前 push 代码被错误包在 if(idx>0) 内，idx=0 时第一条消息永远不发出）
    replyMsg={id:_replyBaseId+'_'+idx+'_'+Math.random().toString(36).substr(2,6),s:OTHER,t:_curReply,img:_curImg,voice:_curVoice,voiceText:_curVoiceText,ts:new Date(),pc:pc,isAuto:true,isInitiative:false,quote:(idx===0?quoteMsgId:null),isSticker:isStickerImg,isVoice:_curVoice?true:false,senderName:senderName,senderId:senderId,isGroup:isGroup,read:(targetId===cid),moodCard:(idx===0?moodCard:null),heartCard:(idx===0?heartCard:null),intentCard:(idx===0?intentCard:null)};
    m.push(replyMsg);
    _sentCount++;
    console.log('[reply] 已push消息 idx='+idx+' m.length='+m.length+' reply='+String(_curReply||'').slice(0,20));
    savemsgs(targetId,m);
    if(targetId===window.currentCid)renderMsgs(m);renderChatList();
    if(idx===0)playSound('recv',targetId);
    if(idx<_replyCount-1){
      // ★ 拟真间隔：按本条消息长度决定基础间隔，长消息打字久；偶发停顿思考 / 偶发快速连发
      var _mlen=(_curReply||'').length+(imgSrc?10:0)+(voiceSrc?8:0);
      var _mbase=900;
      if(_mlen>60)_mbase=2600;
      else if(_mlen>30)_mbase=2000;
      else if(_mlen>15)_mbase=1500;
      else _mbase=1000;
      var _mturn=Math.random();
      if(_mturn<0.08){
        // 8% 停顿思考 2.5~4.5s
        _mbase+=2500+Math.random()*2000;
      }else if(_mturn>0.9){
        // 10% 快速连发（打断感）
        _mbase=500+Math.random()*500;
      }
      setTimeout(function(){_sendReplyBatch(idx+1);},_mbase+Math.random()*800);
    }else{
      setTimeout(function(){_sendReplyBatch(idx+1);},0);
    }
  }
  _sendReplyBatch(0);
  
  setTimeout(function(){maybeTriggerStarMusicRequest(targetId)},2000);
  
  if(document.visibilityState !== 'visible'){
    var item=contacts.find(function(x){return x.id===targetId})||group;
    var msgText='';
    if(voiceSrc){msgText='[语音]';}
    else if(imgSrc){msgText='[图片]';}
    else if(reply){msgText=reply;}
    else{msgText='[表情]';}
    showPushNotification(item?item.name:'联系人',msgText,(item&&item.avatar)?item.avatar:'',targetId);
  }
  
  var rcProb=getSpeed('rc-prob',senderId);
  if(Math.random()*100<rcProb){
    setTimeout(function(){
      var all=msgs(targetId);
      if(all.length>0){
        var lastMsg=all[all.length-1];
        // ★ 修复：数组可能含 undefined 空槽（数据损坏/并发写），读 .id 会抛错导致整个回复中断
        if(lastMsg&&lastMsg.id===replyMsg.id){
          lastMsg.retracted=true;
          lastMsg.originalContent=lastMsg.t||'';
          lastMsg.originalImg=lastMsg.img||'';
          lastMsg.t='';
          lastMsg.img='';
          savemsgs(targetId,all);
          if(targetId===window.currentCid)renderMsgs(all);
          renderChatList();
        }
      }
    },(1+Math.random()*3)*1000);
  }
}
if($('msg-inp')){$('msg-inp').addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey&&getSpeed('enter-send')===1){e.preventDefault();sendMsg()}});$('msg-inp').addEventListener('input',function(){this.style.height='auto';this.style.height=Math.min(this.scrollHeight,100)+'px';updateSendBtn()});}
if($('btn-send')){
  $('btn-send').addEventListener('click',function(e){e.stopPropagation();if($('msg-inp'))$('msg-inp').blur();sendMsg();});
  $('btn-send').addEventListener('touchend',function(e){e.preventDefault();e.stopPropagation();if($('msg-inp'))$('msg-inp').blur();sendMsg();});
}
// 「让对方继续说」按钮
if($('btn-ibar-continue')){
  $('btn-ibar-continue').addEventListener('click',function(e){
    if(isSwipe()){_tsM=false;return;}
    e.stopPropagation();
    if($('msg-inp'))$('msg-inp').blur();
    simulateReply();
  });
  $('btn-ibar-continue').addEventListener('touchend',function(e){
    if(isSwipe()){_tsM=false;return;}
    e.preventDefault();
    e.stopPropagation();
    if($('msg-inp'))$('msg-inp').blur();
    simulateReply();
  });
}
// ★ 无字卡时用户选择的默认字卡分类（'main'/'kaomoji'/'emoji'/'touch'），空=未选择
var _fallbackDefaultCat='';
// 判断当前联系人是否有可用字卡（用户导入的，不含默认通用）
function hasUserCardsForTarget(targetId){
  try{
    var senderId=targetId;
    var has=false;
    (globalCards||[]).forEach(function(card){
      if(has)return;
      if(!card||!card.content)return;
      if(card.category==='touch')return;
      if(!card.content.trim())return;
      if(card.groupId){
        var cg=cardGroups.find(function(g){return g.id===card.groupId});
        if(cg&&cg.disabled)return;
        if(cg&&cg.type==='public'&&cg.disabledContacts&&cg.disabledContacts.indexOf(senderId)>=0)return;
      }
      if(card.type==='public'){has=true;return;}
      if(card.type==='private'){
        if(card.contactId===senderId){has=true;return;}
        var pc=cardPrivateContacts.find(function(p){return p.id===card.contactId&&p.bindContactId===senderId});
        if(pc){has=true;return;}
      }
      if(!card.type){has=true;return;}
    });
    return has;
  }catch(e){return false;}
}
// 弹窗选择默认字卡分类（主字卡/颜文字/emoji/拍一拍）
function showDefaultCatPicker(targetId){
  return new Promise(function(resolve){
    var ov=document.createElement('div');
    ov.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';
    var modal=document.createElement('div');
    modal.style.cssText='background:#fff;border-radius:16px;padding:20px;max-width:320px;width:100%;box-shadow:0 8px 30px rgba(0,0,0,.2);';
    var title=document.createElement('div');
    title.textContent='没有可用的字卡';title.style.cssText='font-size:15px;font-weight:600;color:var(--txt);margin-bottom:6px;text-align:center;';
    var sub=document.createElement('div');
    sub.textContent='是否使用通用默认字卡让TA回复？';sub.style.cssText='font-size:13px;color:var(--txt2);margin-bottom:14px;text-align:center;';
    var opts=[['main','主字卡'],['kaomoji','颜文字'],['emoji','Emoji'],['touch','拍一拍']];
    var grid=document.createElement('div');
    grid.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;';
    var selected=null;
    opts.forEach(function(o){
      var btn=document.createElement('div');
      btn.textContent=o[1];
      btn.style.cssText='padding:14px 10px;border:1.5px solid var(--border);border-radius:12px;background:var(--c2);color:var(--txt);font-size:14px;text-align:center;cursor:pointer;min-height:48px;display:flex;align-items:center;justify-content:center;transition:all .15s;-webkit-tap-highlight-color:transparent;';
      btn.addEventListener('click',function(){
        if(selected)selected.style.cssText='padding:14px 10px;border:1.5px solid var(--border);border-radius:12px;background:var(--c2);color:var(--txt);font-size:14px;text-align:center;cursor:pointer;min-height:48px;display:flex;align-items:center;justify-content:center;';
        btn.style.cssText='padding:14px 10px;border:1.5px solid var(--accent);border-radius:12px;background:rgba(201,169,110,.12);color:var(--accent);font-size:14px;text-align:center;cursor:pointer;min-height:48px;display:flex;align-items:center;justify-content:center;font-weight:600;';
        selected=btn;
      });
      grid.appendChild(btn);
    });
    var btns=document.createElement('div');
    btns.style.cssText='display:flex;gap:12px;';
    var cancel=document.createElement('button');
    cancel.textContent='取消';cancel.style.cssText='flex:1;padding:12px;border:none;border-radius:10px;background:var(--c2);color:var(--txt2);font-size:15px;cursor:pointer;min-height:44px;';
    var ok=document.createElement('button');
    ok.textContent='让TA用此字卡回复';ok.style.cssText='flex:1;padding:12px;border:none;border-radius:10px;background:var(--accent);color:#fff;font-size:15px;font-weight:600;cursor:pointer;min-height:44px;';
    function close(v){try{document.body.removeChild(ov);}catch(e){}resolve(v);}
    cancel.addEventListener('click',function(){close(null);});
    ok.addEventListener('click',function(){
      if(!selected){toast('请先选择一个分类');return;}
      close(selected._cat);
    });
    // 记录分类到按钮
    grid.childNodes.forEach(function(btn,i){
      btn._cat=opts[i][0];
    });
    modal.appendChild(title);modal.appendChild(sub);modal.appendChild(grid);modal.appendChild(btns);
    btns.appendChild(cancel);btns.appendChild(ok);
    ov.appendChild(modal);
    document.body.appendChild(ov);
  });
}
async function simulateReply(){
  console.log('[reply] simulateReply cid='+cid);
  // ★ 无字卡时：先弹窗让用户选择默认字卡分类
  // 仅当"没有自己的字卡 且 默认通用字卡未开启"时才弹窗（开启默认字卡时直接可用，无需弹窗）
  if(cid&&cid!=='fh'){
    var hasCards=hasUserCardsForTarget(cid);
    var defaultEnabled=typeof defaultCommonEnabled!=='undefined'&&defaultCommonEnabled&&defaultCommonAllContacts&&defaultCommonUseChat;
    if(!hasCards&&!defaultEnabled){
      var picked=await showDefaultCatPicker(cid);
      if(!picked){
        return; // 用户取消
      }
      _fallbackDefaultCat=picked;
    }
  }
  // 如果没有打开的聊天，自动打开第一个联系人并让TA回复
  if(!cid||cid==='fh'){
    if(contacts.length===0&&groups.length===0){
      toast('还没有联系人，先创建一个吧');
      return;
    }
    var firstTarget=contacts.length>0?contacts[0]:groups[0];
    cid=firstTarget.id;
    window.currentCid=cid;
    window.currentConvType=groups.find(function(g){return g.id===cid})?'group':'contact';
    showPg('pg-conv');
    toast('正在让'+firstTarget.name+'回复...');
  }
  if(!contacts.length&&!groups.length)return;
  typingStates[cid]=true;
  if($('typing'))$('typing').style.display='flex';
  var beforeCount=0;
  try{
    var beforeMsgs=msgs(cid);
    if(beforeMsgs&&Array.isArray(beforeMsgs))beforeCount=beforeMsgs.length;
  }catch(e){}
  try{
    // ★ 修复：继续说 = 立即发 1 条（forceSingle），不走 reply-min/max 区间多发
    await genReply(cid,true);
  }catch(e){
    console.warn('simulateReply error:',e);
  }
  // ★ 修复：弹窗选择的分类只在当次回复生效，用完即重置，
  // 避免 _fallbackDefaultCat 残留 'touch' 导致之后每次回复都触发拍一拍
  _fallbackDefaultCat='';
  // 只在 genReply 真的产生了新消息时才触发回复后行为（红包/礼物检查），
  // 避免消息为空时误触发 onReplyFinished 导致 GIFT_CONFIG 等未就绪报错
  var afterCount=0;
  try{
    var afterMsgs=msgs(cid);
    if(afterMsgs&&Array.isArray(afterMsgs))afterCount=afterMsgs.length;
  }catch(e){}
  if(cid&&afterCount>beforeCount)onReplyFinished(cid);
  var group=groups.find(function(g){return g.id===cid});
  var isGroup=!!group;
  if(!isGroup){
    typingStates[cid]=false;
    if($('typing'))$('typing').style.display='none';
  }
}
// 批量发送事件委托
if($('batch-preview')){
  $('batch-preview').addEventListener('click', function(e) {
    var removeBtn = e.target.closest('.batch-preview-remove');
    if (removeBtn) {
      var item = removeBtn.closest('.batch-preview-item');
      if (item) {
        var idx = parseInt(item.dataset.index);
        if (!isNaN(idx) && idx >= 0 && idx < batchMessages.length) {
          batchMessages.splice(idx, 1);
          updateBatchPreview();
          updateSendBtn();
        }
      }
      return;
    }
    var addImgBtn = e.target.closest('.batch-add-img-btn');
    if (addImgBtn) {
      var inp = $('chat-image-input');
      if (inp) inp.click();
      return;
    }
    var sendBtn = e.target.closest('.batch-send-btn');
    if (sendBtn && !sendBtn.disabled) {
      sendBatchMessages();
      return;
    }
    if (e.target.matches('.batch-cancel-btn') || e.target.closest('.batch-cancel-btn')) {
      isBatchMode = false;
      batchMessages = [];
      var bbtn = $('batch-btn');
      var bprev = $('batch-preview');
      var binp = $('msg-inp');
      if (bbtn) bbtn.classList.remove('active');
      if (bprev) { bprev.classList.remove('show'); bprev.style.display = 'none'; }
      if (binp) binp.placeholder = '输入消息...';
      updateSendBtn();
      return;
    }
  });
}

if($('batch-btn')){
  $('batch-btn').addEventListener('click', function(e){e.stopPropagation();if($('msg-inp'))$('msg-inp').blur();toggleBatchMode()});
  $('batch-btn').addEventListener('touchend', function(e){e.preventDefault();e.stopPropagation();if($('msg-inp'))$('msg-inp').blur();toggleBatchMode()});
}
if($('btn-ibar-emoji')){
  $('btn-ibar-emoji').addEventListener('click',function(){if($('msg-inp'))$('msg-inp').blur();toggleChatEmoji()});
  $('btn-ibar-emoji').addEventListener('touchend',function(e){e.preventDefault();if($('msg-inp'))$('msg-inp').blur();toggleChatEmoji()});
}

// Pending images for text+multi-image combined messages
var pendingImages=[];
function renderPendingImages(barId,thumbPrefix){
  var bar=$(barId);if(!bar)return;
  if(pendingImages.length===0){bar.style.display='none';bar.innerHTML='';return;}
  bar.style.display='flex';
  bar.innerHTML='';
  pendingImages.forEach(function(imgData,idx){
    var wrap=document.createElement('div');
    wrap.style.cssText='position:relative;width:56px;height:56px;flex-shrink:0;';
    var img=document.createElement('img');
    img.src=imgData;
    img.style.cssText='width:100%;height:100%;object-fit:cover;border-radius:8px;border:1px solid var(--border);';
    var closeBtn=document.createElement('button');
    closeBtn.innerHTML='×';
    closeBtn.style.cssText='position:absolute;top:-4px;right:-4px;width:18px;height:18px;border-radius:50%;background:#ff4d4f;color:#fff;border:none;font-size:12px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.2);';
    closeBtn.onclick=function(){
      pendingImages.splice(idx,1);
      renderPendingImages(barId,thumbPrefix);
      updateSendBtn();
    };
    wrap.appendChild(img);
    wrap.appendChild(closeBtn);
    bar.appendChild(wrap);
  });
  var addBtn=document.createElement('div');
  addBtn.style.cssText='width:56px;height:56px;flex-shrink:0;border:1.5px dashed var(--border);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--txt3);font-size:20px;cursor:pointer;background:var(--c2);';
  addBtn.textContent='+';
  addBtn.onclick=function(){if(barId==='inline-image-bar')$('chat-image-input').click();else $('chat-image-input-noninstant').click();};
  bar.appendChild(addBtn);
}

if($('btn-ibar-image')){
  $('btn-ibar-image').addEventListener('click',function(e){e.stopPropagation();$('chat-image-input').click();});
  $('btn-ibar-image').addEventListener('touchend',function(e){e.preventDefault();e.stopPropagation();$('chat-image-input').click();});
}
if($('btn-ibar-image-noninstant')){
  $('btn-ibar-image-noninstant').addEventListener('click',function(e){e.stopPropagation();$('chat-image-input-noninstant').click();});
  $('btn-ibar-image-noninstant').addEventListener('touchend',function(e){e.preventDefault();e.stopPropagation();$('chat-image-input-noninstant').click();});
}

if($('chat-image-input-noninstant')){
  $('chat-image-input-noninstant').addEventListener('change',function(e){
    var files=e.target.files;
    if(!files||files.length===0)return;
    var processed=0;
    for(var i=0;i<files.length;i++){
      (function(f){
        compressImage(f,1600,0.92,function(res){
          pendingImages.push(res);
          processed++;
          if(processed===files.length){renderPendingImages('inline-image-bar-noninstant','nith_');updateSendBtn();}
        });
      })(files[i]);
    }
    this.value='';
  });
}

// inline clear buttons are now per-thumbnail + buttons
window.clearPendingImage=function(idx,barId,thumbPrefix){
  pendingImages.splice(idx,1);
  renderPendingImages(barId,thumbPrefix);
  updateSendBtn();
};
if($('btn-more')){
  $('btn-more').addEventListener('click',function(){
    var isGroup=window.currentConvType==='group';
    if(isGroup){
      openGroupSettings();
    }else{
      openContactEdit();
    }
  });
  $('btn-more').addEventListener('touchend',function(e){
    e.preventDefault();
    var isGroup=window.currentConvType==='group';
    if(isGroup){
      openGroupSettings();
    }else{
      openContactEdit();
    }
  });
}
if($('btn-ibar-more')){
  var _moreClicked=false;
  function toggleChatMore(){
    if(_moreClicked)return;
    _moreClicked=true;
    setTimeout(function(){_moreClicked=false},300);
    var chatMoreOv=$('ov-chat-more');if(chatMoreOv&&chatMoreOv.classList.contains('show')){
      hideOv('ov-chat-more');
    }else{
      hideOv('ov-emoji');
      renderChatMorePanel();
      showOv('ov-chat-more');
    }
  }
  $('btn-ibar-more').addEventListener('click',function(e){
    e.stopPropagation();
    if($('msg-inp'))$('msg-inp').blur();
    toggleChatMore();
  });
  $('btn-ibar-more').addEventListener('touchend',function(e){
    e.preventDefault();
    e.stopPropagation();
    if($('msg-inp'))$('msg-inp').blur();
    toggleChatMore();
  });
}
if($('ov-chat-more'))$('ov-chat-more').addEventListener('click',function(e){
  if(isSwipe()){
    _tsM=false;
    return;
  }
  if(e.target===$('ov-chat-more')){
    hideOv('ov-chat-more');
    return;
  }
  var item=e.target.closest('.chat-more-item');
  if(item&&item.dataset.action){
    handleChatMoreAction(item.dataset.action);
  }
});

if($('ov-emoji'))$('ov-emoji').addEventListener('click',function(e){
  if(e.target===$('ov-emoji')){
    hideOv('ov-emoji');
  }
});
function sendSticker(sticker){
  if(momentsInputForEmoji){
    var input=momentsInputForEmoji;
    // ★ 修复：所有表情包（含 http url 图片表情）统一用 [表情:id] 占位符，
    // 未发送草稿不显示 url，发送后再解析成图片
    if(sticker.content){
      var stickerText='[表情:'+(sticker.id||sticker.name||'未命名')+']';
      var s=input.selectionStart||input.value.length;
      var e=input.selectionEnd||input.value.length;
      input.value=input.value.slice(0,s)+stickerText+input.value.slice(e);
      try{input.selectionStart=input.selectionEnd=s+stickerText.length}catch(err){}
      input.focus();
    }
    momentsInputForEmoji=null;
    hideOv('ov-emoji');
    return;
  }
  if(!cid)return;
  if(sticker.content&&sticker.content.startsWith('data:image')){
    var m=msgs(cid);
    var quoteId=replyingToMsg;
    m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),s:SELF,t:'',img:sticker.content,ts:new Date(),pc:false,quote:quoteId,isSticker:true,read:true,senderName:'我',senderId:me.id});
    savemsgs(cid,m);
    replyingToMsg=null;
    $('quote-preview').style.display='none';
    renderMsgs(m);
    renderChatList();
    scheduleReply();
    playSound('send',cid);
  }else if(sticker.content){
    var inp=$('msg-inp');
    inp.value+=sticker.content;
    updateSendBtn();
  }
  hideOv('ov-emoji');
}

function sendCardMsg(cardId){
  var card=globalCards.find(function(c){return c.id===cardId});
  if(!card)return;
  
  if(momentsInputForEmoji){
    var input=momentsInputForEmoji;
    if(card.category==='stickers'){
      var stickerText='[表情:'+(card.id||card.name||'未命名')+']';
      var s=input.selectionStart||input.value.length;
      var e=input.selectionEnd||input.value.length;
      input.value=input.value.slice(0,s)+stickerText+input.value.slice(e);
      try{input.selectionStart=input.selectionEnd=s+stickerText.length}catch(err){}
      input.focus();
      momentsInputForEmoji=null;
      hideOv('ov-emoji');
    }else if(card.category==='image'){
      var imgText='[图片]';
      var si=input.selectionStart||input.value.length;
      var ei=input.selectionEnd||input.value.length;
      input.value=input.value.slice(0,si)+imgText+input.value.slice(ei);
      try{input.selectionStart=input.selectionEnd=si+imgText.length}catch(err){}
      input.focus();
      momentsInputForEmoji=null;
      hideOv('ov-emoji');
    }else if(card.category==='voices'){
      var vText=card.voiceText||card.content||'[语音]';
      var s2=input.selectionStart||input.value.length;
      var e2=input.selectionEnd||input.value.length;
      input.value=input.value.slice(0,s2)+vText+input.value.slice(e2);
      try{input.selectionStart=input.selectionEnd=s2+vText.length}catch(err){}
      input.focus();
      momentsInputForEmoji=null;
      hideOv('ov-emoji');
    }else{
      var cText=card.content||'';
      var s3=input.selectionStart||input.value.length;
      var e3=input.selectionEnd||input.value.length;
      input.value=input.value.slice(0,s3)+cText+input.value.slice(e3);
      try{input.selectionStart=input.selectionEnd=s3+cText.length}catch(err){}
      input.focus();
      momentsInputForEmoji=null;
      hideOv('ov-emoji');
    }
    return;
  }
  
  if(!cid)return;
  
  var m=msgs(cid);
  
  if(card.category==='stickers'&&card.content&&card.content.startsWith('data:image')){
    m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),s:SELF,t:'',img:card.content,ts:new Date(),pc:false,quote:replyingToMsg,isSticker:true,read:true,senderName:'我',senderId:me.id});
  }else if(card.category==='image'&&card.content&&card.content.startsWith('data:image')){
    m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),s:SELF,t:'',img:card.content,ts:new Date(),pc:false,quote:replyingToMsg,isSticker:false,read:true,senderName:'我',senderId:me.id});
  }else if(card.category==='voices'&&card.content){
    m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),s:SELF,t:'',voice:card.content,voiceText:card.voiceText||'',ts:new Date(),pc:false,quote:replyingToMsg,isVoice:true,read:true,senderName:'我',senderId:me.id});
  }else if(card.category==='touch'){
    m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),s:SELF,t:card.text||card.content||'',ts:new Date(),pc:false,quote:replyingToMsg,isTouch:true,touchAction:card.text||card.content||'',read:true,senderName:'我',senderId:me.id});
  }else{
    m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),s:SELF,t:card.content||'',ts:new Date(),pc:false,quote:replyingToMsg,read:true,senderName:'我',senderId:me.id});
  }
  
  savemsgs(cid,m);
  replyingToMsg=null;
  if($('quote-preview'))$('quote-preview').style.display='none';
  renderMsgs(m);
  renderChatList();
  scheduleReply();
  playSound('send',cid);
  haptic('light');
  simulateTAFavorite();
  
}
function sendImage(imgSrc){
  if(!cid)return;
  var m=msgs(cid);
  m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),s:SELF,t:'',img:imgSrc,ts:new Date(),pc:false,quote:replyingToMsg,isSticker:false,read:true,senderName:'我',senderId:me.id});
  savemsgs(cid,m);
  renderMsgs(m);
  renderChatList();
  scheduleReply();
  playSound('send',cid);
  hideOv('ov-emoji');
  replyingToMsg=null;
  $('quote-preview').style.display='none';
  simulateTAFavorite();
}

function sendImageWithText(imgSrc,text){
  if(!cid)return;
  var m=msgs(cid);
  m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),s:SELF,t:text||'',img:imgSrc,ts:new Date(),pc:false,quote:replyingToMsg,isSticker:false,read:true,senderName:'我',senderId:me.id});
  savemsgs(cid,m);
  renderMsgs(m);
  renderChatList();
  scheduleReply();
  playSound('send',cid);
  hideOv('ov-emoji');
  replyingToMsg=null;
  $('quote-preview').style.display='none';
  simulateTAFavorite();
}
var chatSearchTimer=null;
if($('search-chat-input'))$('search-chat-input').addEventListener('input',function(){
  if(chatSearchTimer)clearTimeout(chatSearchTimer);
  chatSearchTimer=setTimeout(searchChatRecords,300);
});
if($('search-chat-back-btn')){
  $('search-chat-back-btn').addEventListener('click',function(){
    hideOv('ov-search-chat');
    var msgbox=$('msgbox');
    if(msgbox){
      msgbox.scrollTop=msgbox.scrollHeight;
    }
  });
  $('search-chat-back-btn').addEventListener('touchend',function(e){
    e.preventDefault();
    hideOv('ov-search-chat');
    var msgbox=$('msgbox');
    if(msgbox){
      msgbox.scrollTop=msgbox.scrollHeight;
    }
  });
}
if($('chat-image-input')){
$('chat-image-input').addEventListener('change',function(e){
  if (isBatchMode) {
    var files = this.files;
    for (var i = 0; i < files.length; i++) {
      (function(file) {
        var reader = new FileReader();
        reader.onload = function(e) {
          var originalImg = e.target.result;
          compressImage(file, 2000, 0.98, function(res) {
            batchMessages.push({
              id: Date.now() + '_' + batchMessages.length,
              type: 'image',
              image: res,
              originalImage: originalImg,
              text: ''
            });
            updateBatchPreview();
            updateSendBtn();
            haptic('light');
          });
        };
        reader.readAsDataURL(file);
      })(files[i]);
    }
    this.value = '';
    return;
  }
  var files=e.target.files;
  if(!files||files.length===0)return;
  var processed=0;
  var total=files.length;
  for(var i=0;i<total;i++){
    (function(fi){
      compressImage(fi,1600,0.92,function(res){
        pendingImages.push(res);
        processed++;
        if(processed===total){renderPendingImages('inline-image-bar','iith_');updateSendBtn();}
      });
    })(files[i]);
  }
  this.value='';
});
}
function bindMoreBtn(id, handler){
  var btn=$(id);
  if(!btn)return;
  btn.addEventListener('click',function(e){
    if(isSwipe()){_tsM=false;return;}
    handler();
  });
  btn.addEventListener('touchend',function(e){
    if(isSwipe()){
      _tsM=false;
      return;
    }
    e.preventDefault();
    handler();
  });
}

bindMoreBtn('more-divine-btn',function(){d2ShowDivination()});
bindMoreBtn('more-letters-btn',function(){showPg('pg-letters');switchEnvTab('partner')});
bindMoreBtn('more-noninstant-btn',function(){openNonInstantChat()});
bindMoreBtn('more-board-btn',function(){showPg('pg-board');renderBoard()});

bindMoreBtn('more-survey-btn',function(){openSurveyModal('full')});

bindMoreBtn('more-dream-btn',function(){showPg('pg-dream');renderDreamList()});
bindMoreBtn('more-star-cal-btn',function(){showStarCal(cid||null)});
bindMoreBtn('more-period-btn',function(){showPg('pg-period');renderPeriod()});
bindMoreBtn('more-ta-highlights-btn',function(){taHighlightViewDate=new Date();showPg('pg-ta-highlights');renderTAHighlightsFull()});
bindMoreBtn('more-chat-stats-btn',function(){showPg('pg-chat-stats');renderChatStatsMain()});
bindMoreBtn('more-star-music-btn',function(){showPg('pg-star-music');renderStarMusicPage()});
bindMoreBtn('more-giftbox-btn',function(){showGiftBox('')});


function showDivination(){resetDivine();renderDContacts();showOv('ov-divine')}
function showDivinationFromChat(){hideOv('ov-chat-more');resetDivine();renderDContacts();showOv('ov-divine')}
function showSearchChatModal(){
  showOv('ov-search-chat');
  $('search-chat-input').value='';
  $('search-chat-results').innerHTML='';
  $('search-chat-back-btn').style.display='none';
  $('search-chat-input').focus();
}


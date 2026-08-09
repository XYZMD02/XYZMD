// ---------- Auto Send ----------
var lastAutoSendTime={};
var nextAutoSendTime={}; // ★ 主动发消息的"下次触发时间戳"（间隔触发）
var proactiveScheduled={};
function maybeAutoSend(onlyTargetId){
  if(!hasEnteredApp)return;
  if(currentCall)return;
  
  // 确保 globalCards 已加载，避免因字卡为空导致无法触发主动发消息
  // 不阻塞 return，允许在字卡为空时仍可发送带情绪/心意/交流意图字卡的消息
  if(!globalCards||globalCards.length===0){
    try{loadGlobalCards().then(function(){maybeAutoSend(onlyTargetId);}).catch(function(){});}catch(e){}
  }

  // TA Highlight 每日触发由 checkTAHighlightsDaily() 的 setInterval 统一管理，此处不再重复

  var cs=contacts.filter(function(x){return x.id!=='fh'});
  if(!cs.length)return;
  // ★ 支持单联系人精确触发：只处理指定联系人（链式调度用）
  if(onlyTargetId){
    cs=cs.filter(function(x){return x.id===onlyTargetId});
    if(!cs.length)return;
  }

  cs.forEach(function(contact){
    var targetId=contact.id;
    // Check if this contact should call us
    checkIncomingCallForContact(targetId);
    var asEn=getSpeed('as-en');
    if(asEn!==1)return;
    
    var dndEn=getSpeed('dnd-en');
    var asProb=getSpeed('as-prob');
    var asMin=getSpeed('as-min'),asMax=getSpeed('as-max')*60;
    
    if(dndEn===1){
      asProb=10;
      asMin=1;
      asMax=10800;
    }

    var minInterval=asMin*1000;
    var maxInterval=asMax*1000;
    
    var now=Date.now();
    
    // ★ 修复：真正的"间隔触发"——下次触发时间 = 上次发送 + 随机(最短~最长)，
    // 到了时间点才判定概率并发送，时间戳 = 实际发送时刻，不做提前调度/延迟送达
    var nextTime=nextAutoSendTime[targetId];
    if(!nextTime||nextTime<lastAutoSendTime[targetId]||nextTime<now-maxInterval*2){
      // 初始化或数据异常：首次/重置时立即按概率判定
      nextTime=now;
    }
    if(now<nextTime){
      return; // 还没到下次触发时间
    }

    // 修复：如果该联系人已有待发送的主动消息调度中，跳过避免重复触发
    if(proactiveScheduled[targetId])return;
    // 到点了，重置下次时间（无论概率是否命中，下次都要等一个随机间隔）
    nextAutoSendTime[targetId]=now+minInterval+Math.random()*(maxInterval-minInterval);

    // 间隔已到，按概率决定是否触发
    if(Math.random()*100>asProb)return;

    // ★ 修复：到点即发，不做延迟送达——直接异步发送（时间戳=now）
    proactiveScheduled[targetId]=true;
    (async function(){
      // 修复：使用 try-finally 确保 proactiveScheduled 标志位在任何情况下都被清除
      try{
        if(currentCall)return;

        // Check touch probability first
        var touchProb=getSpeed('touch-prob',targetId);
        if(touchProb>0&&Math.random()*100<touchProb){
          contactPerformTouch(targetId);
          return;
        }

      var userCards=globalCards.filter(function(card){
        if(!card)return false;
        if(card.groupId){
          var group=cardGroups.find(function(g){return g.id===card.groupId});
          if(group&&group.disabled)return false;
          if(group&&group.type==='public'&&group.disabledContacts&&group.disabledContacts.indexOf(targetId)>=0)return false;
        }
        if(card.type==='public')return true;
        if(card.type==='private'&&card.contactId===targetId)return true;
        return false;
      });
      
      // 构建可用字卡池
      var availableCards = userCards.slice();
      
      // 将默认通用字卡添加到池中（各分类独立概率已在getDefaultCommonCardsForContact中处理）
      if(defaultCommonEnabled&&defaultCommonAllContacts&&defaultCommonUseChat){
        var dcCards=getDefaultCommonCardsForContact(targetId);
        if(dcCards.length>0){
          dcCards.forEach(function(text){
            availableCards.push({content:text,category:'custom',type:'default_common',groupId:null});
          });
        }
      }

      // 后备：如果可用字卡为空，使用默认通用字卡确保主动消息能发出
      if(availableCards.length===0&&typeof _defaultCommonCards!=='undefined'&&_defaultCommonCards&&_defaultCommonCards.length>0){
        _defaultCommonCards.forEach(function(card){
          if(card&&card.content){
            availableCards.push(card);
          }
        });
      }

      var reply='',imgSrc='',voiceSrc='',voiceText='';
      var textCards=[],stickerCards=[],voiceCards=[],emojiCards=[],kaomojiCards=[],imageCards=[];
      
      if(availableCards.length>0){
        var textCards=availableCards.filter(function(c){return c.category!=='stickers'&&c.category!=='voices'&&c.category!=='emojis'&&c.category!=='kaomoji'&&c.category!=='image'});
        var stickerCards=availableCards.filter(function(c){return c.category==='stickers'});
        var voiceCards=availableCards.filter(function(c){return c.category==='voices'});
        var emojiCards=availableCards.filter(function(c){return c.category==='emojis'});
        var kaomojiCards=availableCards.filter(function(c){return c.category==='kaomoji'});
        var imageCards=availableCards.filter(function(c){return c.category==='image'});
        
        var stickerProb=getSpeed('sticker-prob',targetId);
        var isStickerReply=stickerCards.length>0&&Math.random()*100<stickerProb;
        
        var voiceProb=getSpeed('voice-prob',targetId)||10;
        var isVoiceReply=!isStickerReply&&voiceCards.length>0&&Math.random()*100<voiceProb;
        
        var emojiProb=getSpeed('emoji-prob',targetId);
        var isEmojiReply=!isStickerReply&&!isVoiceReply&&emojiCards.length>0&&Math.random()*100<emojiProb;
        
        var imageProb=getSpeed('image-prob',targetId);
        var isImageReply=!isStickerReply&&!isVoiceReply&&!isEmojiReply&&imageCards.length>0&&Math.random()*100<imageProb;
        
        if(isStickerReply){
          var rc=stickerCards[Math.floor(Math.random()*stickerCards.length)];
          imgSrc=rc.content;
          var _isStickerType=true;
          // ★ 修复：图片表情可与文字字卡同发——抽一张文字卡拼进 reply
          if(textCards.length>0&&Math.random()<0.5){
            reply=textCards[Math.floor(Math.random()*textCards.length)].content;
          }
        }else if(isImageReply){
          // ★ 修复：图片字卡可发——命中时发图，并大概率附带文字字卡
          var irc=imageCards[Math.floor(Math.random()*imageCards.length)];
          imgSrc=irc.content;
          if(textCards.length>0&&Math.random()<0.6){
            reply=textCards[Math.floor(Math.random()*textCards.length)].content;
          }
        }else if(isVoiceReply){
          var vrc=voiceCards[Math.floor(Math.random()*voiceCards.length)];
          voiceSrc=vrc.content;
          voiceText=vrc.voiceText||'';
        }else if(isEmojiReply){
          var erc=emojiCards[Math.floor(Math.random()*emojiCards.length)];
          reply=erc.content;
          // ★ 修复：emoji 表情也可附带文字字卡
          if(textCards.length>0&&Math.random()<0.3){
            reply=textCards[Math.floor(Math.random()*textCards.length)].content+' '+reply;
          }
        }else{
          var rc=textCards.length>0?textCards[Math.floor(Math.random()*textCards.length)]:availableCards[Math.floor(Math.random()*availableCards.length)];
          reply=rc.content;
        }
        
        // 颜文字概率：独立于主字卡，可附加到文字回复中
        var kaomojiProb=getSpeed('kaomoji-prob',targetId);
        if(kaomojiProb>0&&kaomojiCards.length>0&&Math.random()*100<kaomojiProb){
          var kc=kaomojiCards[Math.floor(Math.random()*kaomojiCards.length)];
          if(reply){
            reply=reply+' '+kc.content;
          }else{
            reply=kc.content;
          }
        }
      }
      
      var moodCard=await getRandomMoodCard(targetId, true);
      if(moodCard){emotionStreak+=1;}else{emotionStreak=0;}
      var heartCard=await getRandomHeartCard(targetId, moodCard);
      var intentCard=await getRandomIntentCard(targetId, heartCard);
      
      // 情绪/心意/交流意图字卡是发送消息时附属的，必须有文字内容才发送
      if(!reply&&!imgSrc&&!voiceSrc){
        return;
      }
      
      var quoteMsgId=null;
      var quoteProb=getSpeed('quote-prob',targetId)/100;
      if(quoteProb>0&&Math.random()<quoteProb){
        var messages=msgs(targetId);
        var selfMsgs=messages.filter(function(m){return m.s===SELF});
        if(selfMsgs.length>0){
          quoteMsgId=selfMsgs[selfMsgs.length-1].id;
        }
      }
      
      var m=msgs(targetId);
      // 修复：消息为空时不再跳过——新联系人/无历史记录也允许主动发消息
      if(!m||m.length===0){
        m=[];
        memoryCache[LM+targetId]=m;
        savemsgs(targetId,m);
      }
      var _asMin=parseInt(getSpeed('as-count-min',targetId))||1;
      var _asMax=parseInt(getSpeed('as-count-max',targetId))||1;
      if(_asMax<_asMin)_asMax=_asMin;
      if(_asMax>20)_asMax=20;
      var _asCount=_asMin+Math.floor(Math.random()*(_asMax-_asMin+1));
      if(_asCount<1)_asCount=1;
      var _asBaseId='m_'+Date.now();
      // ★ 修复：主动发送多条也逐条延迟（间隔拟真：按长度+偶发停顿/快发），且同批去重
      // 仅表情包图片允许 15% 小概率连发同一条；文字/emoji/颜文字/图片/语音同批内绝不重复
      function _sendAsBatch(ai){
        if(ai>=_asCount){
          savemsgs(targetId,m);
          lastAutoSendTime[targetId]=Date.now();
          if(cid===targetId){renderMsgs(m);playSound('recv',targetId)}renderChatList();
          return;
        }
        var _curReply=reply,_curImg=imgSrc,_curVoice=voiceSrc,_curVoiceText=voiceText;
        if(ai>0){
          var _usedSt2=[],_usedIm2=[],_usedVo2=[],_usedTe2=[];
          for(var _bi=0;_bi<m.length;_bi++){
            var _bm=m[_bi];
            if(!_bm)continue;
            if(_bm.isSticker&&_bm.img)_usedSt2.push(_bm.img);
            else if(_bm.img)_usedIm2.push(_bm.img);
            if(_bm.voice)_usedVo2.push(_bm.voice);
            if(_bm.t&&!_bm.voice)_usedTe2.push(_bm.t);
          }
          function _pickND2(_arr,_used){
            var _fr2=[];
            for(var _fi2=0;_fi2<_arr.length;_fi2++){
              if(_used.indexOf(_arr[_fi2].content)<0)_fr2.push(_arr[_fi2]);
            }
            if(_fr2.length>0)return _fr2[Math.floor(Math.random()*_fr2.length)];
            for(var _ti2=0;_ti2<12;_ti2++){
              var _c2=_arr[Math.floor(Math.random()*_arr.length)];
              if(_used.indexOf(_c2.content)<0)return _c2;
            }
            return _arr[Math.floor(Math.random()*_arr.length)];
          }
          if(Math.random()<0.15&&_isStickerType===true&&imgSrc&&stickerCards&&stickerCards.length>0){
            // 保持 _curImg 不变（连发相同表情包图片，真人常见）——仅表情包图片允许 15% 重复
          }else if(_isStickerType===true&&imgSrc&&stickerCards&&stickerCards.length>0){
            var _rcB2=_pickND2(stickerCards,_usedSt2);
            _curImg=_rcB2.content;
          }else if(_isStickerType!==true&&imgSrc&&imageCards&&imageCards.length>0){
            var _rcB3=_pickND2(imageCards,_usedIm2);
            _curImg=_rcB3.content;
          }else if(voiceSrc&&voiceCards&&voiceCards.length>0){
            var _rcB4=_pickND2(voiceCards,_usedVo2);
            _curVoice=_rcB4.content;
            _curVoiceText=_rcB4.voiceText||'';
          }else if(!imgSrc&&!voiceSrc&&emojiCards&&emojiCards.length>0&&reply){
            // emoji 不允许重复，直接去重重抽
            var _rcB6=_pickND2(emojiCards,_usedTe2);
            _curReply=_rcB6.content;
          }else if(!imgSrc&&!voiceSrc&&kaomojiCards&&kaomojiCards.length>0&&reply){
            var _rcB7=_pickND2(kaomojiCards,_usedTe2);
            _curReply=_rcB7.content;
          }
          // ★ 修复：文字型消息（含表情包+文字）绝不重复，每次去重重抽
          if(textCards&&textCards.length>0&&_curReply&&(!imgSrc||_isStickerType===true||!voiceSrc)){
            var _rcB5=_pickND2(textCards,_usedTe2);
            _curReply=_rcB5.content;
          }
        }
        m.push({id:_asBaseId+'_'+ai+'_'+Math.random().toString(36).substr(2,6),s:OTHER,t:_curReply,img:_curImg,voice:_curVoice,voiceText:_curVoiceText,ts:new Date(),pc:false,isAuto:true,isInitiative:true,read:(cid===targetId),moodCard:(ai===0?moodCard:null),heartCard:(ai===0?heartCard:null),intentCard:(ai===0?intentCard:null),quote:(ai===0?quoteMsgId:null),isSticker:(_isStickerType===true),isVoice:_curVoice?true:false});
        savemsgs(targetId,m);
        if(cid===targetId){renderMsgs(m)}renderChatList();
        if(ai===0)playSound('recv',targetId);
        if(ai<_asCount-1){
          // ★ 拟真间隔：按本条消息长度决定基础间隔，偶发停顿思考 / 偶发快速连发
          var _mlen2=(_curReply||'').length+(imgSrc?10:0)+(voiceSrc?8:0);
          var _mbase2=900;
          if(_mlen2>60)_mbase2=2600;
          else if(_mlen2>30)_mbase2=2000;
          else if(_mlen2>15)_mbase2=1500;
          else _mbase2=1000;
          var _mturn2=Math.random();
          if(_mturn2<0.08)_mbase2+=2500+Math.random()*2000;
          else if(_mturn2>0.9)_mbase2=500+Math.random()*500;
          setTimeout(function(){_sendAsBatch(ai+1);},_mbase2+Math.random()*800);
        }else{
          setTimeout(function(){_sendAsBatch(ai+1);},0);
        }
      }
      _sendAsBatch(0);

      if(document.visibilityState!=='visible'){
        var msgText='';
        if(reply){msgText=reply;}
        else if(imgSrc){msgText='[图片]';}
        else if(voiceSrc){msgText='[语音]';}
        else{msgText='[表情]';}
        showPushNotification(contact.name,msgText,(contact&&contact.avatar)?contact.avatar:'',targetId);
      }
      var rcProb=getSpeed('rc-prob',targetId);if(Math.random()*100<rcProb){
        // 修复：延迟回调用 try/catch 包裹，避免抛错时成为未捕获异常
        setTimeout(function(){try{var all=msgs(targetId);if(all.length>0){var lastMsg=all[all.length-1];lastMsg.retracted=true;lastMsg.originalContent=lastMsg.t||'';lastMsg.originalImg=lastMsg.img||'';lastMsg.originalVoice=lastMsg.voice||'';lastMsg.t='';lastMsg.img='';lastMsg.voice='';}savemsgs(targetId,all);
          if(cid===targetId)renderMsgs(all);renderChatList();}catch(e){console.warn('maybeAutoSend retract callback error:',e);}},(1+Math.random()*3)*1000);
      }
      }catch(asyncErr){
        // 修复：添加 catch 块捕获 async 错误，避免变成 unhandled rejection 持续累积
        console.warn('maybeAutoSend async error:',asyncErr);
      }finally{
        // 修复：确保 proactiveScheduled 标志位在任何情况下都被清除
        // 避免手机后台暂停定时器后标志位永久残留导致主动消息永久阻塞
        proactiveScheduled[targetId]=false;
      }
    })();
  });
}

// ★ 修复：主动发消息改为"精确间隔触发"——每个联系人独立链式 setTimeout，
// 间隔 = 随机(最短~最长)，到点才执行发送逻辑并排下一次，无固定轮询、无延迟送达
var _autoSendTimers={};
function scheduleAutoSendFor(targetId){
  try{
    if(_autoSendTimers[targetId]){clearTimeout(_autoSendTimers[targetId]);_autoSendTimers[targetId]=null;}
    var asEn=getSpeed('as-en');
    if(asEn!==1){return;}
    var dndEn=getSpeed('dnd-en');
    var asMin=getSpeed('as-min'),asMax=getSpeed('as-max')*60;
    if(dndEn===1){asMin=1;asMax=10800;}
    var minMs=asMin*1000,maxMs=asMax*1000;
    if(maxMs<minMs)maxMs=minMs+1000;
    // 链式：到点执行该联系人的发送逻辑，然后排下一次
    var delay=minMs+Math.random()*(maxMs-minMs);
    _autoSendTimers[targetId]=setTimeout(function(){
      _autoSendTimers[targetId]=null;
      try{
        // 链式已精确到点，重置 nextTime 让 maybeAutoSend 直接执行发送逻辑
        nextAutoSendTime[targetId]=0;
        maybeAutoSendOne(targetId);
      }catch(e){console.warn('scheduleAutoSendFor exec error:',e);}
      // 无论是否发送成功，都排下一次（间隔从执行时刻起算）
      scheduleAutoSendFor(targetId);
    },delay);
  }catch(e){console.warn('scheduleAutoSendFor error:',e);}
}
function initAutoSendSchedule(){
  var cs=contacts.filter(function(x){return x.id!=='fh'});
  cs.forEach(function(c){scheduleAutoSendFor(c.id);});
}
function maybeAutoSendOne(targetId){
  maybeAutoSend(targetId);
}

// ---------- Init ----------
// ---------- More Settings ----------
['ov-decision','ov-group-decision'].forEach(function(id){$(id).addEventListener('click',function(e){if(e.target===this)hideOv(id)})});

// ---------- Decision Function ----------
var decisionHistory=[],groupDecisionHistory=[],groupDecisionMembers=[];
async function loadDecisionData(){
  var dh=ls('ml2_decision_history');var gh=ls('ml2_group_decision_history');var gm=ls('ml2_group_decision_members');var ds=ls('ml2_decision_settings');
  if(!dh){dh=await lsGetWithDB('ml2_decision_history')}
  if(!gh){gh=await lsGetWithDB('ml2_group_decision_history')}
  if(!gm){gm=await lsGetWithDB('ml2_group_decision_members')}
  if(!ds){ds=await lsGetWithDB('ml2_decision_settings')}
  if(dh&&Array.isArray(dh))decisionHistory=dh;
  if(gh&&Array.isArray(gh))groupDecisionHistory=gh;
  if(gm&&Array.isArray(gm))groupDecisionMembers=gm;
  if(!groupDecisionMembers.length)groupDecisionMembers=['成员A','成员B','成员C','成员D','成员E'];
  if(ds&&typeof ds==='object'){
    if($('decision-typea-think-time'))$('decision-typea-think-time').value=ds.typeaThinkTime||3;
    if($('decision-typea-max-select'))$('decision-typea-max-select').value=ds.typeaMaxSelect||1;
    if($('decision-think-time'))$('decision-think-time').value=ds.thinkTime||3;
    if($('decision-max-select'))$('decision-max-select').value=ds.maxSelect||1;
    if($('group-decision-typea-think-time'))$('group-decision-typea-think-time').value=ds.groupTypeaThinkTime||3;
    if($('group-decision-typea-max-select'))$('group-decision-typea-max-select').value=ds.groupTypeaMaxSelect||1;
    if($('group-decision-typeb-think-time'))$('group-decision-typeb-think-time').value=ds.groupTypebThinkTime||3;
    if($('group-decision-typeb-max-select'))$('group-decision-typeb-max-select').value=ds.groupTypebMaxSelect||1;
  }
}
function saveDecisionHistory(){ls('ml2_decision_history',decisionHistory)}
function saveGroupDecisionHistory(){ls('ml2_group_decision_history',groupDecisionHistory)}
function saveGroupDecisionMembers(){ls('ml2_group_decision_members',groupDecisionMembers)}
function saveDecisionSettings(){
  var ds=ls('ml2_decision_settings')||{};
  if($('decision-typea-think-time'))ds.typeaThinkTime=parseInt($('decision-typea-think-time').value)||3;
  if($('decision-typea-max-select'))ds.typeaMaxSelect=parseInt($('decision-typea-max-select').value)||1;
  if($('decision-think-time'))ds.thinkTime=parseInt($('decision-think-time').value)||3;
  if($('decision-max-select'))ds.maxSelect=parseInt($('decision-max-select').value)||1;
  if($('group-decision-typea-think-time'))ds.groupTypeaThinkTime=parseInt($('group-decision-typea-think-time').value)||3;
  if($('group-decision-typea-max-select'))ds.groupTypeaMaxSelect=parseInt($('group-decision-typea-max-select').value)||1;
  if($('group-decision-typeb-think-time'))ds.groupTypebThinkTime=parseInt($('group-decision-typeb-think-time').value)||3;
  if($('group-decision-typeb-max-select'))ds.groupTypebMaxSelect=parseInt($('group-decision-typeb-max-select').value)||1;
  ls('ml2_decision_settings',ds);
  if(window.localforage)window.localforage.setItem('ml2_decision_settings',ds);
}

async function showDecisionModal(){
  await loadDecisionData();
  syncDecisionReplyButtons();
  showOv('ov-decision');
}
function initDecisionSliders(){
  var sliders=[
    {id:'decision-typea-think-time',val:'decision-typea-think-time-value',unit:'秒'},
    {id:'decision-typea-max-select',val:'decision-typea-max-select-value',unit:'个'},
    {id:'decision-think-time',val:'decision-think-time-value',unit:'秒'},
    {id:'decision-max-select',val:'decision-max-select-value',unit:'个'}
  ];
  sliders.forEach(function(s){
    var el=$(s.id);if(!el||el.dataset.init)return;
    el.dataset.init='1';
    $(s.val).textContent=el.value+s.unit;
    el.addEventListener('input',function(){$(s.val).textContent=this.value+s.unit;saveDecisionSettings()});
  });
  
  var textareas=[
    {id:'decision-question',clear:'decision-question-clear'},
    {id:'decision-typeb-question',clear:'decision-typeb-question-clear'},
    {id:'decision-options',clear:'decision-options-clear'},
    {id:'group-decision-question',clear:'group-decision-question-clear'},
    {id:'group-decision-typeb-question',clear:'group-decision-typeb-question-clear'},
    {id:'group-decision-options',clear:'group-decision-options-clear'}
  ];
  textareas.forEach(function(t){
    var el=$(t.id);if(!el||el.dataset.init)return;
    el.dataset.init='1';
    el.addEventListener('input',function(){
      var clearBtn=$(t.clear);
      if(clearBtn)clearBtn.style.display=this.value.trim()?'block':'none';
    });
  });
}
function switchDecisionTab(tab){
  document.querySelectorAll('#ov-decision .decision-tab').forEach(function(el){el.classList.remove('active')});
  $('decision-tab-'+tab).classList.add('active');
  $('decision-typea-panel').style.display=tab==='typea'?'block':'none';
  $('decision-typeb-panel').style.display=tab==='typeb'?'block':'none';
  $('decision-history-panel').style.display=tab==='history'?'block':'none';
  if(tab==='history')renderDecisionHistory();
}
function makeDecision(type){
  var question,thinkTime,maxSelect;
  if(type==='typea'){
    question=$('decision-question').value.trim();
    thinkTime=parseInt($('decision-typea-think-time').value)||3;
    maxSelect=parseInt($('decision-typea-max-select').value)||1;
  }else{
    question=$('decision-typeb-question').value.trim();
    thinkTime=parseInt($('decision-think-time').value)||3;
    maxSelect=parseInt($('decision-max-select').value)||1;
  }
  if(!question){toast('请输入你的问题');return}
  if(type==='typeb'){
    var optionsText=$('decision-options').value.trim();
    if(!optionsText){toast('请输入选项');return}
    var options=optionsText.split('\n').filter(function(o){return o.trim()});
    if(options.length<2){toast('至少需要2个选项');return}
  }
  var resultPanel=$(type==='typea'?'decision-result-a':'decision-result-b');
  var resultText=$(type==='typea'?'decision-result-text-a':'decision-result-text-b');
  resultPanel.style.display='block';
  resultText.textContent='正在思考中... '+thinkTime+'秒';
  resultText.style.fontSize='16px';
  var countdown=thinkTime;
  var countdownTimer=setInterval(function(){
    countdown--;
    if(countdown>0)resultText.textContent='正在思考中... '+countdown+'秒';
  },1000);
  setTimeout(function(){
    clearInterval(countdownTimer);
    var result;
    if(type==='typea'){
      var options=['是','否','半对','这个我不选','正在忙，暂未回复'];
      var shuffled=options.sort(function(){return Math.random()-0.5});
      var selectCount=Math.floor(Math.random()*maxSelect)+1;
      result=shuffled.slice(0,Math.min(selectCount,shuffled.length)).join('、');
      resultText.style.fontSize='24px';
    }else{
      var optionsText=$('decision-options').value.trim();
      var options=optionsText.split('\n').filter(function(o){return o.trim()});
      var specialOptions=['这个我不选','正在忙，暂未回复'];
      var allOptions=[...options,...specialOptions];
      var shuffled=allOptions.sort(function(){return Math.random()-0.5});
      var selectCount=Math.floor(Math.random()*maxSelect)+1;
      result=shuffled.slice(0,Math.min(selectCount,shuffled.length)).join('、');
      resultText.style.fontSize='18px';
    }
    resultText.textContent=result;
    var targetContact=cid?contacts.find(function(c){return c.id===cid}):null;
    var targetName=targetContact?targetContact.name:'';
    var savedOptions=(type==='typeb')?(optionsText.split('\n').filter(function(o){return o.trim()})):null;
    decisionHistory.unshift({id:Date.now(),type:type,question:question,result:result,time:new Date().toLocaleString(),target:targetName,options:savedOptions});
    saveDecisionHistory();
    var replyText;
    if(type==='typeb'&&savedOptions){
      replyText='【帮我决定】'+question+'\n选项：\n'+savedOptions.map(function(o,i){return (i+1)+'. '+o}).join('\n')+'\n→ '+result;
    }else{
      replyText='【帮我决定】'+question+' → '+result;
    }
    var settings=ls('ml2_settings')||{};
    if(cid&&settings.decisionReplyToChat){
      var m=msgs(cid);
      m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),s:OTHER,t:replyText,ts:new Date(),read:(cid===window.currentCid)});
      setTimeout(function(){savemsgs(cid,m);renderMsgs();},100);
    }
    toast('帮我决定已完成');
  },thinkTime*1000);
}
function renderDecisionHistory(){
  var list=$('decision-history-list');
  if(decisionHistory.length===0){
    $('decision-history-empty').style.display='block';
    list.innerHTML='';
    return;
  }
  $('decision-history-empty').style.display='none';
  list.innerHTML=decisionHistory.map(function(r){
    var targetHtml=r.target?'<div class="history-target" style="font-size:11px;color:var(--accent);margin-bottom:2px;">'+r.target+'</div>':'';
    var optionsHtml=(r.options&&Array.isArray(r.options))?'<div style="font-size:10px;color:var(--txt3);margin:4px 0;">选项：'+r.options.map(function(o,i){return (i+1)+'. '+o}).join('，')+'</div>':'';
    return'<div class="history-item"><div class="history-question">'+r.question+'</div>'+optionsHtml+'<div class="history-result">'+r.result+'</div>'+targetHtml+'<div class="history-time">'+r.time+'</div></div>';
  }).join('');
}

// ---------- Group Decision Function ----------
async function showGroupDecisionModal(){
  await loadDecisionData();
  syncDecisionReplyButtons();
  renderGroupMembers();
  showOv('ov-group-decision');
}
function initGroupDecisionSliders(){
  var sliders=[
    {id:'group-decision-typea-think-time',val:'group-decision-typea-think-time-value',unit:'秒'},
    {id:'group-decision-typea-max-select',val:'group-decision-typea-max-select-value',unit:'个'},
    {id:'group-decision-typeb-think-time',val:'group-decision-typeb-think-time-value',unit:'秒'},
    {id:'group-decision-typeb-max-select',val:'group-decision-typeb-max-select-value',unit:'个'}
  ];
  sliders.forEach(function(s){
    var el=$(s.id);if(!el||el.dataset.init)return;
    el.dataset.init='1';
    $(s.val).textContent=el.value+s.unit;
    el.addEventListener('input',function(){$(s.val).textContent=this.value+s.unit;saveDecisionSettings()});
  });
}
function switchGroupDecisionTab(tab){
  document.querySelectorAll('#ov-group-decision .decision-tab').forEach(function(el){el.classList.remove('active')});
  $('group-decision-tab-'+tab).classList.add('active');
  $('group-decision-typea-panel').style.display=tab==='typea'?'block':'none';
  $('group-decision-typeb-panel').style.display=tab==='typeb'?'block':'none';
  $('group-decision-history-panel').style.display=tab==='history'?'block':'none';
  if(tab==='history')renderGroupDecisionHistory();
}
function renderGroupMembers(){
  var list=$('group-decision-members-list');
  list.innerHTML=groupDecisionMembers.map(function(m,i){
    return'<div class="member-item"><input type="checkbox" id="gm-'+i+'" checked><label for="gm-'+i+'">'+m+'</label></div>';
  }).join('');
}
function toggleAllGroupMembers(){
  var cbs=document.querySelectorAll('#group-decision-members-list input[type="checkbox"]');
  var allChecked=Array.from(cbs).every(function(cb){return cb.checked});
  cbs.forEach(function(cb){cb.checked=!allChecked});
}
function removeSelectedGroupMembers(){
  var selected=[];
  document.querySelectorAll('#group-decision-members-list input[type="checkbox"]:checked').forEach(function(cb){
    var idx=parseInt(cb.id.replace('gm-',''));
    selected.push(idx);
  });
  if(selected.length===0){toast('请选择要删除的成员');return}
  if(!confirm('确定删除选中的成员？'))return;
  selected.sort(function(a,b){return b-a}).forEach(function(idx){groupDecisionMembers.splice(idx,1)});
  saveGroupDecisionMembers();
  renderGroupMembers();
  toast('已删除 '+selected.length+' 个成员');
}
function addGroupMember(){
  var v=prompt('请输入成员名称：');
  if(!v||!v.trim())return;
  if(groupDecisionMembers.includes(v.trim())){toast('成员已存在');return}
  groupDecisionMembers.push(v.trim());
  saveGroupDecisionMembers();
  renderGroupMembers();
  toast('成员已添加');
}
function makeGroupDecision(type){
  var selectedMembers=[];
  document.querySelectorAll('#group-decision-members-list input[type="checkbox"]:checked').forEach(function(cb){
    var idx=parseInt(cb.id.replace('gm-',''));
    selectedMembers.push(groupDecisionMembers[idx]);
  });
  if(selectedMembers.length===0){toast('请至少选择一个成员');return}
  var question;
  if(type==='typea')question=$('group-decision-question').value.trim();
  else question=$('group-decision-typeb-question').value.trim();
  if(!question){toast('请输入你的问题');return}
  var thinkTimeSlider=$(type==='typea'?'group-decision-typea-think-time':'group-decision-typeb-think-time');
  var maxSelectSlider=$(type==='typea'?'group-decision-typea-max-select':'group-decision-typeb-max-select');
  var thinkTime=parseInt(thinkTimeSlider?thinkTimeSlider.value:'3');
  var maxSelect=parseInt(maxSelectSlider?maxSelectSlider.value:'1');
  var resultPanel=$(type==='typea'?'group-decision-result-a':'group-decision-result-b');
  var resultText=$(type==='typea'?'group-decision-result-text-a':'group-decision-result-text-b');
  resultPanel.style.display='block';
  resultText.textContent='正在思考中... '+thinkTime+'秒';
  resultText.style.fontSize='16px';
  var countdown=thinkTime;
  var countdownTimer=setInterval(function(){
    countdown--;
    if(countdown>0)resultText.textContent='正在思考中... '+countdown+'秒';
  },1000);
  setTimeout(function(){
    clearInterval(countdownTimer);
    var results={};
    if(type==='typea'){
      var options=['是','否','半对','这个我不选','正在忙，暂未回复'];
      selectedMembers.forEach(function(m){
        var shuffled=options.slice().sort(function(){return Math.random()-0.5});
        var sc=Math.floor(Math.random()*maxSelect)+1;
        results[m]=shuffled.slice(0,Math.min(sc,shuffled.length)).join('、');
      });
    }else{
      var optionsText=$('group-decision-options').value.trim();
      if(!optionsText){toast('请输入选项');return}
      var options=optionsText.split('\n').filter(function(o){return o.trim()});
      var specialOptions=['这个我不选','正在忙，暂未回复'];
      var allOptions=[...options,...specialOptions];
      if(allOptions.length<2){toast('至少需要2个选项');return}
      selectedMembers.forEach(function(m){
        var shuffled=allOptions.slice().sort(function(){return Math.random()-0.5});
        var sc=Math.floor(Math.random()*maxSelect)+1;
        results[m]=shuffled.slice(0,Math.min(sc,shuffled.length)).join('、');
      });
    }
    var resultStr=selectedMembers.map(function(m){return m+'：'+results[m]}).join('\n');
    resultText.textContent=resultStr;
    resultText.style.fontSize='16px';
    var savedGroupOptions=(type==='typeb')?(optionsText.split('\n').filter(function(o){return o.trim()})):null;
    groupDecisionHistory.unshift({id:Date.now(),type:type,question:question,members:selectedMembers,results:results,time:new Date().toLocaleString(),options:savedGroupOptions});
    saveGroupDecisionHistory();
    var replyText;
    if(type==='typeb'&&savedGroupOptions){
      replyText='【多人决定】'+question+'\n选项：\n'+savedGroupOptions.map(function(o,i){return (i+1)+'. '+o}).join('\n')+'\n'+selectedMembers.map(function(m){return '【'+m+'】'+results[m]}).join('\n');
    }else{
      replyText='【多人决定】'+question+'\n'+selectedMembers.map(function(m){return '【'+m+'】'+results[m]}).join('\n');
    }
    var settings=ls('ml2_settings')||{};
    if(cid&&settings.decisionReplyToChat){
      var m=msgs(cid);
      m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),s:OTHER,t:replyText,ts:new Date(),read:(cid===window.currentCid)});
      setTimeout(function(){savemsgs(cid,m);renderMsgs();},100);
    }
    toast('多人决定已完成');
  },thinkTime*1000);
}
function renderGroupDecisionHistory(){
  var list=$('group-decision-history-list');
  if(groupDecisionHistory.length===0){
    $('group-decision-history-empty').style.display='block';
    list.innerHTML='';
    return;
  }
  $('group-decision-history-empty').style.display='none';
  list.innerHTML=groupDecisionHistory.map(function(r){
    var resultsStr=r.members.map(function(m){return m+'：'+r.results[m]}).join(', ');
    var optionsHtml=(r.options&&Array.isArray(r.options))?'<div style="font-size:10px;color:var(--txt3);margin:4px 0;">选项：'+r.options.map(function(o,i){return (i+1)+'. '+o}).join('，')+'</div>':'';
    return'<div class="history-item"><div class="history-question">'+r.question+'</div>'+optionsHtml+'<div class="history-result">'+resultsStr+'</div><div class="history-time">'+r.time+'</div></div>';
  }).join('');
}

function toggleDecisionReplyToChat(){
  var settings=ls('ml2_settings')||{};
  settings.decisionReplyToChat=!settings.decisionReplyToChat;
  ls('ml2_settings',settings);
  syncDecisionReplyButtons();
  toast('已'+(settings.decisionReplyToChat?'开启':'关闭')+'帮我决定回复发送到聊天');
}
function syncDecisionReplyButtons(){
  var settings=ls('ml2_settings')||{};
  if(settings.decisionReplyToChat===undefined){
    settings.decisionReplyToChat=true;
    ls('ml2_settings',settings);
  }
  var enabled=settings.decisionReplyToChat===true;
  ['decision-reply-chat-btn','group-decision-reply-chat-btn'].forEach(function(id){
    var btn=$(id);
    if(btn){
      btn.textContent=enabled?'💬':'🚫';
      btn.style.opacity=enabled?'1':'0.5';
      btn.title=enabled?'回复发送到聊天（已开启）':'回复发送到聊天（已关闭）';
    }
  });
}

// ---------- Sound Settings ----------
var soundSettings={enabled:true,sendSound:'',recvSound:'',volume:50};
function loadSoundSettings(){var s=ls('ml2_sound');if(s){soundSettings.enabled=s.enabled!==false;soundSettings.sendSound=s.sendSound||'';soundSettings.recvSound=s.recvSound||'';soundSettings.noninstantSound=s.noninstantSound||'';soundSettings.volume=s.volume!==undefined?s.volume:50}else{soundSettings.enabled=true;soundSettings.sendSound='';soundSettings.recvSound='';soundSettings.noninstantSound='';soundSettings.volume=50}}
function saveSoundSettings(){ls('ml2_sound',soundSettings)}
function syncSoundUI(){
  $('sound-en').checked=soundSettings.enabled;
  $('sound-volume').value=soundSettings.volume;
  $('sound-volume-val').textContent=soundSettings.volume+'%';
  if(soundSettings.sendSound){
    $('send-sound-info').textContent='已设置';
    $('send-sound-play').style.display='inline-block';
    $('send-sound-delete').style.display='inline-block';
    $('send-sound-btn').style.display='none';
  }else{
    $('send-sound-info').textContent='未设置';
    $('send-sound-play').style.display='none';
    $('send-sound-delete').style.display='none';
    $('send-sound-btn').style.display='inline-block';
  }
  if(soundSettings.recvSound){
    $('recv-sound-info').textContent='已设置';
    $('recv-sound-play').style.display='inline-block';
    $('recv-sound-delete').style.display='inline-block';
    $('recv-sound-btn').style.display='none';
  }else{
    $('recv-sound-info').textContent='未设置';
    $('recv-sound-play').style.display='none';
    $('recv-sound-delete').style.display='none';
    $('recv-sound-btn').style.display='inline-block';
  }
  if(soundSettings.noninstantSound){
    $('noninstant-sound-info').textContent='已设置';
    $('noninstant-sound-play').style.display='inline-block';
    $('noninstant-sound-delete').style.display='inline-block';
    $('noninstant-sound-btn').style.display='none';
  }else{
    $('noninstant-sound-info').textContent='未设置';
    $('noninstant-sound-play').style.display='none';
    $('noninstant-sound-delete').style.display='none';
    $('noninstant-sound-btn').style.display='inline-block';
  }
}
function openSoundSettings(){loadSoundSettings();syncSoundUI();showOv('ov-sound')}
var keepAliveAudio=null;
var keepAliveInterval=null;
var keepAliveEnabled=false;

function initKeepAlive(){
  var saved=ls('keepAliveEnabled');
  keepAliveEnabled=saved!==undefined?saved:true;
  
  if(keepAliveEnabled){
    startKeepAlive(false);
  }
}

function startKeepAlive(showToast){
  if(keepAliveAudio)return;
  
  try{
    var ctx=new (window.AudioContext||window.webkitAudioContext)();
    var oscillator=ctx.createOscillator();
    var gainNode=ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type='sine';
    oscillator.frequency.value=1;
    gainNode.gain.value=0.0001;
    oscillator.start();
    keepAliveAudio={ctx:ctx,oscillator:oscillator,gainNode:gainNode};
    
    // 在用户首次交互时恢复 AudioContext（现代浏览器安全策略要求）
    if(ctx.state==='suspended'){
      var resumeOnInteraction=function(){
        if(keepAliveAudio&&keepAliveAudio.ctx&&keepAliveAudio.ctx.state==='suspended'){
          keepAliveAudio.ctx.resume().catch(function(){});
        }
      };
      document.addEventListener('click',resumeOnInteraction,{once:true});
      document.addEventListener('touchstart',resumeOnInteraction,{once:true});
      document.addEventListener('keydown',resumeOnInteraction,{once:true});
    }
    
    keepAliveInterval=setInterval(function(){
      if(keepAliveAudio&&keepAliveAudio.ctx&&keepAliveAudio.ctx.state==='suspended'){
        keepAliveAudio.ctx.resume().catch(function(){});
      }
    },5000);
    
    // navigator.wakeLock 防止屏幕休眠（持续请求，处理release后自动重试）
    var wakeLockSentinel=null;
    var requestWakeLock=function(){
      if(navigator.wakeLock&&document.visibilityState==='visible'){
        navigator.wakeLock.request('screen').then(function(sentinel){
          wakeLockSentinel=sentinel;
          if(wakeLockSentinel){
            wakeLockSentinel.addEventListener('release',function(){
              setTimeout(function(){
                if(keepAliveEnabled)requestWakeLock();
              },1000);
            });
          }
        }).catch(function(){});
      }
    };
    requestWakeLock();
    document.addEventListener('visibilitychange',function(){
      if(document.visibilityState==='visible'&&keepAliveEnabled)requestWakeLock();
    });
    
    if(showToast!==false)toast('后台保活已启动');
    // 浏览器通知：提示正在播放静音音频以保持后台活跃
    try{
      if('Notification' in window){
        if(Notification.permission==='granted'){
          new Notification('后台保活已启动',{body:'正在播放静音音频以保持后台活跃，请勿关闭此页面'});
        }else if(Notification.permission==='default'){
          Notification.requestPermission().then(function(perm){
            if(perm==='granted'){
              new Notification('后台保活已启动',{body:'正在播放静音音频以保持后台活跃，请勿关闭此页面'});
            }
          });
        }
      }
    }catch(e){}
  }catch(e){
    console.error('Failed to start keep alive:',e);
  }
}

function stopKeepAlive(){
  if(keepAliveAudio){
    try{
      keepAliveAudio.oscillator.stop();
      keepAliveAudio.ctx.close();
    }catch(e){}
    keepAliveAudio=null;
  }
  if(keepAliveInterval){
    clearInterval(keepAliveInterval);
    keepAliveInterval=null;
  }
  toast('后台保活已停止');
}

function toggleKeepAlive(){
  keepAliveEnabled=!keepAliveEnabled;
  ls('keepAliveEnabled',keepAliveEnabled);
  $('keep-alive-status').textContent=keepAliveEnabled?'已开启':'已关闭';
  $('keep-alive-status').style.color=keepAliveEnabled?'var(--accent)':'var(--txt3)';
  if(keepAliveEnabled){
    startKeepAlive();
  }else{
    stopKeepAlive();
  }
}

var pushNotifyEnabled=false;

function initPushNotify(){
  var saved=ls('pushNotifyEnabled');
  pushNotifyEnabled=saved!==undefined?saved:true;
  updatePushNotifyStatusUI();
}

function updatePushNotifyStatusUI(){
  var statusEl=$('push-notify-status');
  if(!statusEl)return;
  if(!pushNotifyEnabled){
    statusEl.textContent='已关闭';
    statusEl.style.color='var(--txt3)';
    return;
  }
  if(!('Notification' in window)){
    statusEl.textContent='浏览器不支持';
    statusEl.style.color='#ff4d4f';
    return;
  }
  if(Notification.permission==='granted'){
    statusEl.textContent='已开启';
    statusEl.style.color='var(--accent)';
  }else if(Notification.permission==='denied'){
    statusEl.textContent='已拒绝（需在浏览器设置中手动开启）';
    statusEl.style.color='#ff4d4f';
  }else{
    statusEl.textContent='待授权（点击开启）';
    statusEl.style.color='#faad14';
  }
}

function requestNotificationPermission(showToast){
  if('Notification' in window){
    Notification.requestPermission().then(function(permission){
      if(permission==='granted'&&showToast!==false){
        toast('消息通知已开启');
      }
    });
  }
}

function togglePushNotify(){
  pushNotifyEnabled=!pushNotifyEnabled;
  ls('pushNotifyEnabled',pushNotifyEnabled);
  
  if(pushNotifyEnabled){
    if(!('Notification' in window)){
      updatePushNotifyStatusUI();
      toast('当前浏览器不支持消息通知');
      return;
    }
    if(Notification.permission==='granted'){
      updatePushNotifyStatusUI();
      toast('后台消息弹窗已开启');
    }else if(Notification.permission==='denied'){
      updatePushNotifyStatusUI();
      toast('通知权限已被拒绝，请在浏览器设置中手动开启');
    }else{
      Notification.requestPermission().then(function(permission){
        if(permission==='granted'){
          toast('消息通知已开启');
        }else{
          toast('通知权限未授权，可在浏览器设置中手动开启');
        }
        updatePushNotifyStatusUI();
      });
    }
  }else{
    updatePushNotifyStatusUI();
    toast('后台消息弹窗已关闭');
  }
}

function toggleFullscreenMode(){
  if(window.innerWidth<768){
    toast('此功能仅支持电脑和平板');
    return;
  }
  var enabled=!document.body.classList.contains('fullscreen-mode');
  if(enabled){
    document.body.classList.add('fullscreen-mode');
    try{
      var el=document.documentElement;
      if(el.requestFullscreen)el.requestFullscreen();
      else if(el.webkitRequestFullscreen)el.webkitRequestFullscreen();
      else if(el.mozRequestFullScreen)el.mozRequestFullScreen();
    }catch(e){}
    ls('fullscreenModeEnabled',true);
    updateFullscreenStatusUI();
    toast('全屏模式已开启');
  }else{
    document.body.classList.remove('fullscreen-mode');
    try{
      if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen();
      else if(document.webkitFullscreenElement&&document.webkitExitFullscreen)document.webkitExitFullscreen();
      else if(document.mozFullScreenElement&&document.mozCancelFullScreen)document.mozCancelFullScreen();
    }catch(e){}
    ls('fullscreenModeEnabled',false);
    updateFullscreenStatusUI();
    toast('全屏模式已关闭');
  }
}

function updateFullscreenStatusUI(){
  var status=$('fullscreen-mode-status');
  if(!status)return;
  var enabled=document.body.classList.contains('fullscreen-mode');
  status.textContent=enabled?'已开启':'已关闭';
  status.style.color=enabled?'var(--accent)':'var(--txt3)';
}

function initFullscreenMode(){
  var enabled=ls('fullscreenModeEnabled');
  if(enabled&&window.innerWidth>=768){
    document.body.classList.add('fullscreen-mode');
  }
  updateFullscreenStatusUI();
  window.addEventListener('resize',function(){
    if(window.innerWidth<768&&document.body.classList.contains('fullscreen-mode')){
      document.body.classList.remove('fullscreen-mode');
      ls('fullscreenModeEnabled',false);
      updateFullscreenStatusUI();
    }
  });
}

// ===== 夜间模式 =====
var nightModeEnabled=false;
function updateNightModeStatusUI(){
  var status=$('night-mode-status');
  if(!status)return;
  status.textContent=nightModeEnabled?'已开启':'已关闭';
  status.style.color=nightModeEnabled?'var(--accent)':'var(--txt3)';
}
function applyNightMode(){
  document.body.classList.toggle('night',nightModeEnabled);
  // 主题色 meta 跟随（移动端状态栏）
  var meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.setAttribute('content',nightModeEnabled?'#141418':'#fafafa');
}
function toggleNightMode(){
  nightModeEnabled=!nightModeEnabled;
  ls('nightModeEnabled',nightModeEnabled);
  applyNightMode();
  updateNightModeStatusUI();
  // 重新应用当前联系人的聊天设置，让气泡颜色跟随夜间变量
  if(cid){
    var c=contacts.find(function(x){return x.id===cid});
    if(c)applyChatSettings(c);
  }
  toast(nightModeEnabled?'夜间模式已开启':'夜间模式已关闭');
  haptic('light');
}
function initNightMode(){
  nightModeEnabled=ls('nightModeEnabled')===true;
  applyNightMode();
  updateNightModeStatusUI();
}

function showPushNotification(contactName, message, avatarUrl, contactId){
  if(!pushNotifyEnabled)return;
  if(!('Notification' in window))return;
  if(Notification.permission!=='granted')return;
  
  var icon=avatarUrl||'';
  var notifTag='xingyan-msg-'+(contactId||'unknown')+'-'+Date.now();
  
  // 优先通过 Service Worker 发送通知（Android standalone 模式更可靠）
  if(navigator.serviceWorker&&navigator.serviceWorker.controller){
    try{
      navigator.serviceWorker.controller.postMessage({
        type:'SHOW_NOTIFICATION',
        title:contactName,
        body:message,
        icon:icon,
        tag:notifTag,
        contactId:contactId
      });
      return;
    }catch(e){}
  }
  
  // 降级：直接使用 Notification API
  try{
    var notifOpts={body:message,tag:notifTag,renotify:true};
    if(icon){notifOpts.icon=icon;notifOpts.badge=icon;}
    var notification=new Notification(contactName,notifOpts);
    notification.onclick=function(){
      window.focus();
      notification.close();
      if(contactId){
        var contact=contacts.find(function(c){return c.id===contactId});
        if(contact){
          selectContact(contact);
          if($('tab-chat'))$('tab-chat').click();
        }
      }
    };
    setTimeout(function(){notification.close()},10000);
  }catch(e){
    console.error('Failed to show notification:',e);
  }
}

function playSound(type,targetId){
  if(!soundSettings.enabled)return;
  var src='';
  if(targetId){
    var contact=contacts.find(function(x){return x.id===targetId});
    if(contact&&contact.soundSettings){
      if(type==='send')src=contact.soundSettings.sendSound||soundSettings.sendSound;
      else if(type==='noninstant')src=contact.soundSettings.noninstantSound||soundSettings.noninstantSound;
      else src=contact.soundSettings.recvSound||soundSettings.recvSound;
    }else{
      if(type==='send')src=soundSettings.sendSound;
      else if(type==='noninstant')src=soundSettings.noninstantSound;
      else src=soundSettings.recvSound;
    }
  }else{
    if(type==='send')src=soundSettings.sendSound;
    else if(type==='noninstant')src=soundSettings.noninstantSound;
    else src=soundSettings.recvSound;
  }
  if(!src)return;
  try{var a=new Audio(src);a.volume=soundSettings.volume/100;a.play()}catch(e){}
}

function openContactSoundSettings(){
  if(!cid)return;
  var contact=contacts.find(function(x){return x.id===cid});
  if(!contact)return;
  
  if(!contact.soundSettings){
    contact.soundSettings={
      sendEnabled:true,
      recvEnabled:true,
      sendSound:'',
      recvSound:'',
      ringtone:''
    };
  }
  if(!contact.soundSettings.ringtone)contact.soundSettings.ringtone='';
  
  var content=$('contact-sound-content');
  content.innerHTML='<div style="font-size:12px;color:var(--txt2);margin-bottom:8px;font-weight:600">发送消息音效</div><div class="set-row"><span>开启发送音效</span><label class="tsw"><input type="checkbox" id="contact-send-en" '+((contact.soundSettings.sendEnabled)?'checked':'')+'><span class="sl"></span></label></div><div style="margin-bottom:16px"><div class="sound-upload-area" id="contact-send-sound-area"><div class="sound-upload-btn" id="contact-send-sound-btn">上传音效</div><div class="sound-info" id="contact-send-sound-info">'+((contact.soundSettings.sendSound)?'已设置':'未设置')+'</div><button class="btn-outline" id="contact-send-sound-play" style="display:'+((contact.soundSettings.sendSound)?'inline-block':'none')+'">试听</button><button class="btn-outline" id="contact-send-sound-stop" style="display:none;">暂停</button><button class="btn-outline danger" id="contact-send-sound-delete" style="display:'+((contact.soundSettings.sendSound)?'inline-block':'none')+'">删除</button></div><input type="file" id="contact-send-sound-input" accept="audio/*" style="display:none;"></div><div style="font-size:12px;color:var(--txt2);margin-bottom:8px;font-weight:600">接收消息音效</div><div class="set-row"><span>开启接收音效</span><label class="tsw"><input type="checkbox" id="contact-recv-en" '+((contact.soundSettings.recvEnabled)?'checked':'')+'><span class="sl"></span></label></div><div style="margin-bottom:16px"><div class="sound-upload-area" id="contact-recv-sound-area"><div class="sound-upload-btn" id="contact-recv-sound-btn">上传音效</div><div class="sound-info" id="contact-recv-sound-info">'+((contact.soundSettings.recvSound)?'已设置':'未设置')+'</div><button class="btn-outline" id="contact-recv-sound-play" style="display:'+((contact.soundSettings.recvSound)?'inline-block':'none')+'">试听</button><button class="btn-outline" id="contact-recv-sound-stop" style="display:none;">暂停</button><button class="btn-outline danger" id="contact-recv-sound-delete" style="display:'+((contact.soundSettings.recvSound)?'inline-block':'none')+'">删除</button></div><input type="file" id="contact-recv-sound-input" accept="audio/*" style="display:none;"></div><div style="font-size:12px;color:var(--txt2);margin-bottom:8px;font-weight:600;border-top:1px solid var(--border);padding-top:16px;">🔔 来电铃声</div><div style="margin-bottom:12px"><div class="sound-upload-area" id="contact-ringtone-area"><div class="sound-upload-btn" id="contact-ringtone-upload-btn">上传铃声</div><div class="sound-info" id="contact-ringtone-info">'+((contact.soundSettings.ringtone)?'已设置':'未设置')+'</div><button class="btn-outline" id="contact-ringtone-play" style="display:'+((contact.soundSettings.ringtone)?'inline-block':'none')+'">试听</button><button class="btn-outline" id="contact-ringtone-stop" style="display:none;">暂停</button><button class="btn-outline danger" id="contact-ringtone-delete" style="display:'+((contact.soundSettings.ringtone)?'inline-block':'none')+'">删除</button></div><input type="file" id="contact-ringtone-input" accept="audio/*" style="display:none;"></div><div style="display:flex;gap:8px;margin-top:16px;padding-top:16px;border-top:1px solid var(--border);"><button class="btn-outline" id="contact-sound-cancel" style="flex:1;">取消</button><button class="btn" id="contact-sound-save" style="flex:1;">保存</button></div>';
  
  var sendAudio=null;
  var recvAudio=null;
  var ringtoneAudio=null;
  
  $('contact-send-en').addEventListener('change',function(){contact.soundSettings.sendEnabled=this.checked});
  $('contact-recv-en').addEventListener('change',function(){contact.soundSettings.recvEnabled=this.checked});
  
  $('contact-send-sound-btn').addEventListener('click',function(){$('contact-send-sound-input').click()});
  $('contact-send-sound-btn').addEventListener('touchend',function(e){e.preventDefault();$('contact-send-sound-input').click()});
  $('contact-send-sound-input').addEventListener('change',function(e){
    var file=e.target.files[0];if(!file)return;
    var reader=new FileReader();
    reader.onload=function(event){contact.soundSettings.sendSound=event.target.result;$('contact-send-sound-info').textContent='已设置';$('contact-send-sound-play').style.display='inline-block';$('contact-send-sound-stop').style.display='none';$('contact-send-sound-delete').style.display='inline-block';$('contact-send-sound-btn').style.display='none';toast('发送音效已设置')};
    reader.readAsDataURL(file);
    e.target.value='';
  });
  $('contact-send-sound-play').addEventListener('click',function(){
    if(contact.soundSettings.sendSound){
      try{
        if(sendAudio){sendAudio.pause();sendAudio=null;}
        sendAudio=new Audio(contact.soundSettings.sendSound);
        sendAudio.volume=soundSettings.volume/100;
        sendAudio.play();
        $('contact-send-sound-play').style.display='none';
        $('contact-send-sound-stop').style.display='inline-block';
        sendAudio.onended=function(){
          $('contact-send-sound-play').style.display='inline-block';
          $('contact-send-sound-stop').style.display='none';
        };
      }catch(e){}
    }
  });
  $('contact-send-sound-stop').addEventListener('click',function(){
    if(sendAudio){sendAudio.pause();sendAudio=null;}
    $('contact-send-sound-play').style.display='inline-block';
    $('contact-send-sound-stop').style.display='none';
  });
  $('contact-send-sound-delete').addEventListener('click',function(){contact.soundSettings.sendSound='';$('contact-send-sound-info').textContent='未设置';$('contact-send-sound-play').style.display='none';$('contact-send-sound-stop').style.display='none';$('contact-send-sound-delete').style.display='none';$('contact-send-sound-btn').style.display='inline-block';toast('音效已删除')});
  
  $('contact-recv-sound-btn').addEventListener('click',function(){$('contact-recv-sound-input').click()});
  $('contact-recv-sound-btn').addEventListener('touchend',function(e){e.preventDefault();$('contact-recv-sound-input').click()});
  $('contact-recv-sound-input').addEventListener('change',function(e){
    var file=e.target.files[0];if(!file)return;
    var reader=new FileReader();
    reader.onload=function(event){contact.soundSettings.recvSound=event.target.result;$('contact-recv-sound-info').textContent='已设置';$('contact-recv-sound-play').style.display='inline-block';$('contact-recv-sound-stop').style.display='none';$('contact-recv-sound-delete').style.display='inline-block';$('contact-recv-sound-btn').style.display='none';toast('接收音效已设置')};
    reader.readAsDataURL(file);
    e.target.value='';
  });
  $('contact-recv-sound-play').addEventListener('click',function(){
    if(contact.soundSettings.recvSound){
      try{
        if(recvAudio){recvAudio.pause();recvAudio=null;}
        recvAudio=new Audio(contact.soundSettings.recvSound);
        recvAudio.volume=soundSettings.volume/100;
        recvAudio.play();
        $('contact-recv-sound-play').style.display='none';
        $('contact-recv-sound-stop').style.display='inline-block';
        recvAudio.onended=function(){
          $('contact-recv-sound-play').style.display='inline-block';
          $('contact-recv-sound-stop').style.display='none';
        };
      }catch(e){}
    }
  });
  $('contact-recv-sound-stop').addEventListener('click',function(){
    if(recvAudio){recvAudio.pause();recvAudio=null;}
    $('contact-recv-sound-play').style.display='inline-block';
    $('contact-recv-sound-stop').style.display='none';
  });
  $('contact-recv-sound-delete').addEventListener('click',function(){contact.soundSettings.recvSound='';$('contact-recv-sound-info').textContent='未设置';$('contact-recv-sound-play').style.display='none';$('contact-recv-sound-stop').style.display='none';$('contact-recv-sound-delete').style.display='none';$('contact-recv-sound-btn').style.display='inline-block';toast('音效已删除')});
  
  $('contact-ringtone-upload-btn').addEventListener('click',function(){$('contact-ringtone-input').click()});
  $('contact-ringtone-upload-btn').addEventListener('touchend',function(e){e.preventDefault();$('contact-ringtone-input').click()});
  $('contact-ringtone-input').addEventListener('change',function(e){
    var file=e.target.files[0];if(!file)return;
    var reader=new FileReader();
    reader.onload=function(event){contact.soundSettings.ringtone=event.target.result;$('contact-ringtone-info').textContent='已设置';$('contact-ringtone-play').style.display='inline-block';$('contact-ringtone-stop').style.display='none';$('contact-ringtone-delete').style.display='inline-block';$('contact-ringtone-upload-btn').style.display='none';toast('来电铃声已设置')};
    reader.readAsDataURL(file);
    e.target.value='';
  });
  $('contact-ringtone-play').addEventListener('click',function(){
    if(contact.soundSettings.ringtone){
      try{
        if(ringtoneAudio){ringtoneAudio.pause();ringtoneAudio=null;}
        ringtoneAudio=new Audio(contact.soundSettings.ringtone);
        ringtoneAudio.volume=soundSettings.volume/100;
        ringtoneAudio.play();
        $('contact-ringtone-play').style.display='none';
        $('contact-ringtone-stop').style.display='inline-block';
        ringtoneAudio.onended=function(){
          $('contact-ringtone-play').style.display='inline-block';
          $('contact-ringtone-stop').style.display='none';
        };
      }catch(e){}
    }
  });
  $('contact-ringtone-stop').addEventListener('click',function(){
    if(ringtoneAudio){ringtoneAudio.pause();ringtoneAudio=null;}
    $('contact-ringtone-play').style.display='inline-block';
    $('contact-ringtone-stop').style.display='none';
  });
  $('contact-ringtone-delete').addEventListener('click',function(){contact.soundSettings.ringtone='';$('contact-ringtone-info').textContent='未设置';$('contact-ringtone-play').style.display='none';$('contact-ringtone-stop').style.display='none';$('contact-ringtone-delete').style.display='none';$('contact-ringtone-upload-btn').style.display='inline-block';toast('铃声已删除')});
  
  $('contact-sound-save').addEventListener('click',function(){
    saveC();
    hideOv('ov-contact-sound');
    toast('音效设置已保存');
  });
  
  $('contact-sound-cancel').addEventListener('click',function(){
    hideOv('ov-contact-sound');
  });
  
  hideOv('ov-chat-more');
  showOv('ov-contact-sound');
}

if($('close-contact-sound'))$('close-contact-sound').addEventListener('click',function(){saveC();hideOv('ov-contact-sound');toast('音效设置已保存')});
if($('sound-volume'))$('sound-volume').addEventListener('input',function(){soundSettings.volume=parseInt(this.value);$('sound-volume-val').textContent=this.value+'%';saveSoundSettings()});

if($('send-sound-btn')){$('send-sound-btn').addEventListener('click',function(){$('send-sound-input').click()});$('send-sound-btn').addEventListener('touchend',function(e){e.preventDefault();$('send-sound-input').click()})}
if($('send-sound-input'))$('send-sound-input').addEventListener('change',function(e){
  var file=e.target.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=function(event){soundSettings.sendSound=event.target.result;saveSoundSettings();syncSoundUI();toast('发送音效已设置')};
  reader.readAsDataURL(file);
  e.target.value='';
});
if($('send-sound-play'))$('send-sound-play').addEventListener('click',function(){playSound('send')});
if($('send-sound-delete'))$('send-sound-delete').addEventListener('click',function(){if(confirm('确定删除发送音效？')){soundSettings.sendSound='';saveSoundSettings();syncSoundUI();toast('已删除')}});

if($('recv-sound-btn')){$('recv-sound-btn').addEventListener('click',function(){$('recv-sound-input').click()});$('recv-sound-btn').addEventListener('touchend',function(e){e.preventDefault();$('recv-sound-input').click()})}
if($('recv-sound-input'))$('recv-sound-input').addEventListener('change',function(e){
  var file=e.target.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=function(event){soundSettings.recvSound=event.target.result;saveSoundSettings();syncSoundUI();toast('接收音效已设置')};
  reader.readAsDataURL(file);
  e.target.value='';
});
if($('recv-sound-play'))$('recv-sound-play').addEventListener('click',function(){playSound('recv')});
if($('recv-sound-delete'))$('recv-sound-delete').addEventListener('click',function(){if(confirm('确定删除接收音效？')){soundSettings.recvSound='';saveSoundSettings();syncSoundUI();toast('已删除')}});

if($('noninstant-sound-btn')){$('noninstant-sound-btn').addEventListener('click',function(){$('noninstant-sound-input').click()});$('noninstant-sound-btn').addEventListener('touchend',function(e){e.preventDefault();$('noninstant-sound-input').click()})}
if($('noninstant-sound-input'))$('noninstant-sound-input').addEventListener('change',function(e){
  var file=e.target.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=function(event){soundSettings.noninstantSound=event.target.result;saveSoundSettings();syncSoundUI();toast('非即时传讯音效已设置')};
  reader.readAsDataURL(file);
  e.target.value='';
});
if($('noninstant-sound-play'))$('noninstant-sound-play').addEventListener('click',function(){playSound('noninstant')});
if($('noninstant-sound-delete'))$('noninstant-sound-delete').addEventListener('click',function(){if(confirm('确定删除非即时传讯音效？')){soundSettings.noninstantSound='';saveSoundSettings();syncSoundUI();toast('已删除')}});


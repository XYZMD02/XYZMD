// ---------- Per-Contact Chatbar Customization ----------
var contactChatbarWorkingCopy=null;

function getContactChatbarEnabled(contactId){
  var c=contacts.find(function(x){return x.id===contactId});
  if(c&&c.chatbarEnabled&&Array.isArray(c.chatbarEnabled))return c.chatbarEnabled.slice();
  return customChatbarEnabled.slice();
}

function getContactChatbarOrder(contactId){
  var c=contacts.find(function(x){return x.id===contactId});
  if(c&&c.chatbarOrder&&Array.isArray(c.chatbarOrder))return c.chatbarOrder.slice();
  return chatbarItems.map(function(item){return item.id});
}

function openContactChatbarSettings(contactId){
  var c=contacts.find(function(x){return x.id===contactId});
  if(!c)return;
  contactChatbarWorkingCopy={
    contactId:contactId,
    enabled:getContactChatbarEnabled(contactId),
    order:getContactChatbarOrder(contactId)
  };
  renderContactChatbarList();
  showOv('ov-contact-chatbar');
  $('contact-chatbar-save-btn').onclick=function(){saveContactChatbarSettings(contactId)};
  $('contact-chatbar-reset-btn').onclick=function(){resetContactChatbarSettings(contactId)};
}

function renderContactChatbarList(){
  var list=$('contact-chatbar-list');
  if(!list||!contactChatbarWorkingCopy)return;
  list.innerHTML='';
  
  var order=contactChatbarWorkingCopy.order;
  var enabled=contactChatbarWorkingCopy.enabled;
  
  var categories={};
  order.forEach(function(itemId){
    var item=chatbarItems.find(function(x){return x.id===itemId});
    if(!item)return;
    var cat=item.category||'其他';
    if(!categories[cat])categories[cat]=[];
    categories[cat].push(item);
  });
  
  var html='';
  chatbarCategoryOrder.forEach(function(catName){
    var items=categories[catName];
    if(!items||items.length===0)return;
    html+='<div style="margin-bottom:16px;">';
    html+='<div style="font-size:12px;color:var(--txt3);padding-left:4px;font-weight:500;letter-spacing:.5px;margin-bottom:8px;">'+catName+'</div>';
    html+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">';
    items.forEach(function(item){
      var isEnabled=enabled.indexOf(item.id)>=0;
      var isFixed=item.fixed===true;
      var itemIndex=order.indexOf(item.id);
      var prevDisabled=itemIndex===0?' disabled style="opacity:0.3;cursor:not-allowed"':'';
      var nextDisabled=itemIndex===order.length-1?' disabled style="opacity:0.3;cursor:not-allowed"':'';
      
      html+='<div style="display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;padding:12px 8px;border-radius:10px;background:'+(isEnabled?'#f8f8f8':'#f0f0f0')+';transition:all .15s;'+(isFixed?'opacity:0.6;':'')+'">';
      html+='<div style="width:36px;height:36px;border-radius:50%;background:var(--c3);display:flex;align-items:center;justify-content:center;font-size:18px;">'+item.icon+'</div>';
      html+='<span style="font-size:12px;color:'+(isEnabled?'var(--txt3)':'var(--txt4)')+';text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">'+item.name+'</span>';
      if(!isFixed){
        html+='<div style="display:flex;align-items:center;gap:4px;margin-top:2px;">';
        html+='<button onclick="toggleContactChatbarItem(\''+item.id+'\')" style="width:20px;height:20px;border-radius:50%;border:none;font-size:10px;display:flex;align-items:center;justify-content:center;'+(isEnabled?'background:#52c41a;color:#fff;':'background:#ddd;color:#fff;')+'">'+(isEnabled?'✓':'')+'</button>';
        html+='<button onclick="moveContactChatbarItem(\''+item.id+'\',-1)" '+prevDisabled+' style="width:20px;height:20px;border:none;border-radius:4px;background:var(--c3);color:var(--txt3);font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;">↑</button>';
        html+='<button onclick="moveContactChatbarItem(\''+item.id+'\',1)" '+nextDisabled+' style="width:20px;height:20px;border:none;border-radius:4px;background:var(--c3);color:var(--txt3);font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;">↓</button>';
        html+='</div>';
      }
      html+='</div>';
    });
    html+='</div></div>';
  });
  
  list.innerHTML=html;
}

function toggleContactChatbarItem(itemId){
  if(!contactChatbarWorkingCopy)return;
  var item=chatbarItems.find(function(x){return x.id===itemId});
  if(item&&item.fixed)return;
  var enabled=contactChatbarWorkingCopy.enabled;
  var idx=enabled.indexOf(itemId);
  if(idx>=0){enabled.splice(idx,1)}else{enabled.push(itemId)}
  renderContactChatbarList();
}

function moveContactChatbarItem(itemId,direction){
  if(!contactChatbarWorkingCopy)return;
  var order=contactChatbarWorkingCopy.order;
  var index=order.indexOf(itemId);
  if(index<0)return;
  var newIndex=index+direction;
  if(newIndex<0||newIndex>=order.length)return;
  var temp=order[index];
  order[index]=order[newIndex];
  order[newIndex]=temp;
  renderContactChatbarList();
}

function saveContactChatbarSettings(contactId){
  if(!contactChatbarWorkingCopy)return;
  var c=contacts.find(function(x){return x.id===contactId});
  if(!c)return;
  c.chatbarEnabled=contactChatbarWorkingCopy.enabled.slice();
  c.chatbarOrder=contactChatbarWorkingCopy.order.slice();
  saveC();
  if(cid===contactId){
    renderChatMorePanel();
  }
  toast('聊天栏设置已保存');
  hideOv('ov-contact-chatbar');
  contactChatbarWorkingCopy=null;
}

function resetContactChatbarSettings(contactId){
  if(!contactChatbarWorkingCopy)return;
  contactChatbarWorkingCopy.enabled=customChatbarEnabled.slice();
  contactChatbarWorkingCopy.order=chatbarItems.map(function(item){return item.id});
  renderContactChatbarList();
}


// ---------- Bottom Nav Customization ----------
var bottomNavItems=[
  {id:'chat',name:'聊天',icon:'💬',fixed:true},
  {id:'moments',name:'朋友圈',icon:'📸',fixed:false},
  {id:'more',name:'更多',icon:'✨',fixed:true},
  {id:'settings',name:'设置',icon:'⚙️',fixed:true}
];
var customBottomNavEnabled=['chat','moments','more','settings'];

function renderCustomBottomNavList(){
  var list=$('custom-bottom-nav-list');
  if(!list)return;
  list.innerHTML='';
  
  bottomNavItems.forEach(function(item,index){
    var isEnabled=customBottomNavEnabled.indexOf(item.id)>=0;
    var disabledAttr=item.fixed?' disabled':'';
    var disabledStyle=item.fixed?' style="opacity:0.5;cursor:not-allowed"':'';
    
    var html='<div class="chatbar-item-row" data-id="'+item.id+'" data-index="'+index+'" style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--c2);border-radius:8px;margin-bottom:8px;-webkit-user-select:none;user-select:none;">';
    html+='<input type="checkbox" '+ (isEnabled?'checked':'') + disabledAttr +' onchange="toggleBottomNavItem(\''+item.id+'\')" style="width:18px;height:18px;cursor:pointer;flex-shrink:0;">';
    html+='<div style="width:36px;height:36px;border-radius:50%;background:var(--c3);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">'+item.icon+'</div>';
    html+='<div style="flex:1;font-size:14px;color:var(--txt);">'+item.name+'</div>';
    html+='<div style="display:flex;flex-direction:column;gap:2px;">';
    html+='<button onclick="moveBottomNavItem(\''+item.id+'\',-1)" style="width:24px;height:24px;border:none;border-radius:4px;background:var(--c3);color:var(--txt3);font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;"'+(index===0?' disabled style="opacity:0.3;cursor:not-allowed"':'')+'>↑</button>';
    html+='<button onclick="moveBottomNavItem(\''+item.id+'\',1)" style="width:24px;height:24px;border:none;border-radius:4px;background:var(--c3);color:var(--txt3);font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;"'+(index===bottomNavItems.length-1?' disabled style="opacity:0.3;cursor:not-allowed"':'')+'>↓</button>';
    html+='</div>';
    html+='</div>';
    list.innerHTML+=html;
  });
}

function moveBottomNavItem(itemId,direction){
  var index=bottomNavItems.findIndex(function(item){return item.id===itemId});
  if(index<0)return;
  
  var newIndex=index+direction;
  if(newIndex<0||newIndex>=bottomNavItems.length)return;
  
  var temp=bottomNavItems[index];
  bottomNavItems[index]=bottomNavItems[newIndex];
  bottomNavItems[newIndex]=temp;
  
  var enabledIndex=customBottomNavEnabled.indexOf(itemId);
  if(enabledIndex>=0){
    var newEnabledIndex=enabledIndex+direction;
    if(newEnabledIndex>=0&&newEnabledIndex<customBottomNavEnabled.length){
      var tempEnabled=customBottomNavEnabled[enabledIndex];
      customBottomNavEnabled[enabledIndex]=customBottomNavEnabled[newEnabledIndex];
      customBottomNavEnabled[newEnabledIndex]=tempEnabled;
    }
  }
  
  renderCustomBottomNavList();
}

function toggleBottomNavItem(itemId){
  var index=customBottomNavEnabled.indexOf(itemId);
  if(index>=0){
    customBottomNavEnabled.splice(index,1);
  }else{
    customBottomNavEnabled.push(itemId);
  }
  renderCustomBottomNavList();
}

function loadBottomNavSettings(){
  if(!customBottomNavEnabled)customBottomNavEnabled=['chat','moments','more','settings'];
  var saved=ls('ml2_custom_bottomnav');
  if(saved&&Array.isArray(saved))customBottomNavEnabled=saved;
  refreshBottomNavDisplay();
}

async function saveBottomNavSettings(){
  ls('ml2_custom_bottomnav',customBottomNavEnabled);
  if(window.localforage){
    try{await window.localforage.setItem('ml2_custom_bottomnav',customBottomNavEnabled)}catch(e){}
  }
  refreshBottomNavDisplay();
  toast('底部栏设置已保存');
}

function resetBottomNavSettings(){
  customBottomNavEnabled=['chat','moments','more','settings'];
  renderCustomBottomNavList();
}

function refreshBottomNavDisplay(){
  updateBottomNavVisibility();
  tabsInitialized=false;
  initTabs();
}

loadBottomNavSettings();

// ---------- Copy Messages ----------
var selectedMsgIds=[];

function showCopyMsgModal(){
  selectedMsgIds=[];
  renderCopyMsgList();
  showOv('ov-copy-msg');
}

function renderCopyMsgList(){
  var list=$('copy-msg-list');
  if(!list)return;
  list.innerHTML='';
  
  var m=msgs(cid);
  if(!m||!m.length){
    list.innerHTML='<div style="text-align:center;padding:40px;color:var(--txt2);">暂无消息</div>';
    return;
  }
  
  var c=contacts.find(function(x){return x.id===cid})||groups.find(function(x){return x.id===cid});
  var myName='我';
  var contactName=c?c.name:'对方';
  
  // 按时间戳降序排序，最新消息在最顶
  var sorted=m.slice().sort(function(a,b){
    var ats=a.ts?new Date(a.ts).getTime():0;
    var bts=b.ts?new Date(b.ts).getTime():0;
    return bts-ats;
  });
  var html='';
  for(var i=0;i<sorted.length;i++){
    var msg=sorted[i];
    if(msg.retracted)continue;
    if(!msg.t&&!msg.isTouch)continue;
    
    var isSelected=selectedMsgIds.indexOf(msg.id)>=0;
    var isSelf=msg.s===SELF;
    var name=isSelf?myName:contactName;
    var displayText='';
    var isPoke=false;
    if(msg.isTouch){
      var _hideTouchSS=_globalHideTouchNames[cid]===true;
      if(!_hideTouchSS)_hideTouchSS=getHideTouchNames(cid)===true;
      if(!_hideTouchSS&&c&&c.hideTouchNames)_hideTouchSS=true;
      var touchDisplayName=isSelf?'我':(_hideTouchSS?'TA':contactName);
      var touchTarget=msg.touchTarget||'你';
      if(_hideTouchSS){
        touchTarget=isSelf?'TA':'我';
      }
      displayText=touchDisplayName+' '+msg.touchAction.replace('你',touchTarget);
      isPoke=true;
    }else{
      displayText=msg.t;
    }
    
    html+='<div style="display:flex;align-items:flex-start;gap:12px;padding:12px;background:var(--c2);border-radius:8px;margin-bottom:8px;">';
    html+='<input type="checkbox" '+ (isSelected?'checked':'') +' onchange="toggleSelectMsg(\''+msg.id+'\')" style="width:18px;height:18px;cursor:pointer;margin-top:2px;">';
    html+='<div style="flex:1;">';
    html+='<div style="font-size:12px;color:var(--txt3);margin-bottom:2px;">'+name+(isPoke?' 拍了拍':'')+'</div>';
    html+='<div style="font-size:14px;color:var(--txt);">'+displayText+'</div>';
    html+='</div>';
    html+='</div>';
  }
  list.innerHTML=html;
}

function toggleSelectMsg(msgId){
  var index=selectedMsgIds.indexOf(msgId);
  if(index>=0){
    selectedMsgIds.splice(index,1);
  }else{
    selectedMsgIds.push(msgId);
  }
}

function selectAllCopyMsg(){
  var m=msgs(cid);
  if(!m)return;
  
  var textMsgs=m.filter(function(msg){return (msg.t||msg.isTouch)&&!msg.retracted});
  selectedMsgIds=textMsgs.map(function(msg){return msg.id});
  renderCopyMsgList();
}

function copySelectedMsg(){
  if(selectedMsgIds.length===0){
    toast('请先选择要复制的消息');
    return;
  }
  
  var m=msgs(cid);
  if(!m)return;
  
  var c=contacts.find(function(x){return x.id===cid})||groups.find(function(x){return x.id===cid});
  var myName='我';
  var contactName=c?c.name:'对方';
  
  var selectedMsgs=m.filter(function(msg){return selectedMsgIds.indexOf(msg.id)>=0});
  selectedMsgs.sort(function(a,b){return (a.ts||0)-(b.ts||0)});
  
  var text='';
  selectedMsgs.forEach(function(msg){
    var isSelf=msg.s===SELF;
    var name=isSelf?myName:contactName;
    if(msg.isTouch){
      text+=name+' '+msg.touchAction.replace('你',msg.touchTarget||'你')+'\n';
    }else{
      text+=name+'：'+msg.t+'\n';
    }
  });
  
  var textToCopy=text.trim();
  if(!textToCopy){toast('无可复制的内容');return;}
  
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(textToCopy).then(function(){
      toast('已复制到剪贴板');
      hideOv('ov-copy-msg');
    }).catch(function(){
      fallbackCopy(textToCopy);
    });
  }else{
    fallbackCopy(textToCopy);
  }
}

function fallbackCopy(text){
  try{
    var ta=document.createElement('textarea');
    ta.value=text;ta.style.position='fixed';ta.style.left='-9999px';ta.style.top='-9999px';
    document.body.appendChild(ta);
    ta.focus();ta.select();
    var success=document.execCommand('copy');
    document.body.removeChild(ta);
    if(success){toast('已复制到剪贴板');hideOv('ov-copy-msg')}
    else{toast('复制失败，请手动复制')}
  }catch(e){toast('复制失败，请手动复制')}
}

// ---------- Favorite Chat Messages ----------
var favMsgMode=false;
var selectedFavMsgIds=[];
var myFavs={};

function loadFavs(){
  var saved=ls('ml2_chat_favorites');
  if(saved&&typeof saved==='object'){myFavs=saved}
  else{myFavs={}}
}

function saveFavs(){
  ls('ml2_chat_favorites',myFavs);
}

loadFavs();

function showFavMsgModal(){
  if(!cid){toast('请先选择对话');return}
  showChatPage();
  if(longScreenshotMode)cancelLongScreenshot();
  if(copyMsgMode)cancelCopyMsg();
  favMsgMode=true;
  selectedFavMsgIds=[];
  var bar=$('fav-msg-bar');
  if(bar)bar.style.display='block';
  updateFavMsgCount();
  var m=msgs(cid);
  if(m)renderMsgs(m);
  var box=$('msgbox');
  if(box)requestAnimationFrame(function(){box.scrollTop=box.scrollHeight});
  toast('点击消息旁的复选框勾选要收藏的消息');
}

function toggleFavMsg(msgId){
  var index=selectedFavMsgIds.indexOf(msgId);
  if(index>=0){
    selectedFavMsgIds.splice(index,1);
  }else{
    selectedFavMsgIds.push(msgId);
  }
  updateFavMsgCount();
}

function selectAllFavMsg(){
  var m=msgs(cid);
  if(!m||!m.length)return;
  var selectableMsgs=m.filter(function(msg){
    return !msg.retracted&&(msg.t||msg.img||msg.isTouch||msg.isRedpacket||msg.voice);
  });
  var allSelected=selectableMsgs.length>0&&selectedFavMsgIds.length===selectableMsgs.length;
  if(allSelected){
    selectedFavMsgIds=[];
  }else{
    selectedFavMsgIds=selectableMsgs.map(function(msg){return msg.id});
  }
  var m2=msgs(cid);
  if(m2)renderMsgs(m2);
  updateFavMsgCount();
}

function updateFavMsgCount(){
  var countEl=$('fav-msg-count');
  if(countEl)countEl.textContent='已选 '+selectedFavMsgIds.length+' 条';
}

function cancelFavMsgMode(){
  favMsgMode=false;
  selectedFavMsgIds=[];
  var bar=$('fav-msg-bar');
  if(bar)bar.style.display='none';
  var m=msgs(cid);
  if(m)renderMsgs(m);
}

function confirmFavMsgs(){
  if(selectedFavMsgIds.length===0){
    toast('请先选择要收藏的消息');
    return;
  }
  
  var m=msgs(cid);
  if(!m)return;
  
  var c=contacts.find(function(x){return x.id===cid})||groups.find(function(x){return x.id===cid});
  var myName='我';
  var contactName=c?c.name:'对方';
  
  if(!myFavs[cid]){myFavs[cid]=[]}
  
  var count=0;
  selectedFavMsgIds.forEach(function(msgId){
    var msg=m.find(function(x){return x.id===msgId});
    if(!msg)return;
    
    var isSelf=msg.s===SELF;
    var name=isSelf?myName:contactName;
    var msgType='';
    var msgText='';
    
    if(msg.isTouch){
      msgType='touch';
      msgText=name+' '+msg.touchAction.replace('你',msg.touchTarget||'你');
    }else if(msg.img){
      var isSticker=msg.isSticker===true;
      msgType=isSticker?'sticker':'image';
      msgText=msg.t||'[图片]';
    }else if(msg.voice){
      msgType='voice';
      msgText=msg.voiceText||'语音消息';
    }else{
      msgType='text';
      msgText=msg.t||'';
    }
    
    var favId='fav_'+Date.now()+'_'+Math.random().toString(36).substr(2,6);
    var msgData={};
    if(msg.t)msgData.t=msg.t;
    if(msg.img)msgData.img=msg.img;
    if(msg.isTouch)msgData.isTouch=true;
    if(msg.touchAction)msgData.touchAction=msg.touchAction;
    if(msg.touchTarget)msgData.touchTarget=msg.touchTarget;
    if(msg.isSticker)msgData.isSticker=msg.isSticker;
    if(msg.voice)msgData.voice=msg.voice;
    if(msg.voiceText)msgData.voiceText=msg.voiceText;
    if(msg.mmAudioUrl)msgData.mmAudioUrl=msg.mmAudioUrl;
    msgData.s=msg.s;
    
    myFavs[cid].push({
      id:favId,
      msgText:msgText,
      msgType:msgType,
      timestamp:msg.ts instanceof Date?msg.ts.getTime():(msg.ts||Date.now()),
      savedAt:Date.now(),
      msgData:msgData
    });
    count++;
  });
  
  saveFavs();
  toast('已收藏 '+count+' 条消息');
  cancelFavMsgMode();
}

// ★ 菜单直接收藏单条消息（气泡操作菜单 ⭐ 按钮）
function favMsgDirect(msgId,ownerId){
  var targetId=ownerId||(typeof cid!=='undefined'?cid:null);
  if(!targetId){toast('请先打开聊天');return;}
  var m=(typeof msgs==='function')?msgs(targetId):null;
  if(!m||!m.find){toast('消息不存在');return;}
  var msg=m.find(function(x){return x.id===msgId});
  if(!msg){toast('消息不存在');return;}
  if(!myFavs[targetId])myFavs[targetId]=[];
  // 去重：同一消息不重复收藏
  var dup=myFavs[targetId].some(function(f){return f.msgId===msgId});
  if(dup){toast('这条消息已收藏');return;}
  var c=contacts.find(function(x){return x.id===targetId})||groups.find(function(x){return x.id===targetId});
  var myName='我',contactName=c?c.name:'对方';
  var isSelf=msg.s===SELF;
  var name=isSelf?myName:contactName;
  var msgType='',msgText='';
  if(msg.isTouch){msgType='touch';msgText=name+' '+(msg.touchAction||'触碰');}
  else if(msg.img){msgType=msg.isSticker===true?'sticker':'image';msgText=msg.t||'[图片]';}
  else if(msg.voice){msgType='voice';msgText=msg.voiceText||'语音消息';}
  else{msgType='text';msgText=msg.t||'';}
  var msgData={};
  if(msg.t)msgData.t=msg.t;
  if(msg.img)msgData.img=msg.img;
  if(msg.isTouch)msgData.isTouch=true;
  if(msg.touchAction)msgData.touchAction=msg.touchAction;
  if(msg.touchTarget)msgData.touchTarget=msg.touchTarget;
  if(msg.isSticker)msgData.isSticker=msg.isSticker;
  if(msg.voice)msgData.voice=msg.voice;
  if(msg.voiceText)msgData.voiceText=msg.voiceText;
  if(msg.mmAudioUrl)msgData.mmAudioUrl=msg.mmAudioUrl;
  msgData.s=msg.s;
  myFavs[targetId].push({id:'fav_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),msgId:msgId,msgText:msgText,msgType:msgType,timestamp:msg.ts instanceof Date?msg.ts.getTime():(msg.ts||Date.now()),savedAt:Date.now(),msgData:msgData});
  saveFavs();
  toast('已收藏');
}

function showMyFavs(){
  renderMyFavs();
  showOv('ov-my-favs');
}

function renderMyFavs(){
  var list=$('my-favs-list');
  if(!list)return;
  list.innerHTML='';
  
  var contactIds=Object.keys(myFavs);
  if(contactIds.length===0){
    list.innerHTML='<div style="text-align:center;padding:40px;color:var(--txt2);">暂无收藏</div>';
    return;
  }
  
  var html='';
  
  contactIds.forEach(function(contactId){
    var favs=myFavs[contactId]||[];
    if(favs.length===0)return;
    
    var c=contacts.find(function(x){return x.id===contactId})||groups.find(function(x){return x.id===contactId});
    var contactName=c?c.name:'未知联系人';
    var avatar=c?c.avatar:'';
    
    html+='<div style="margin-bottom:16px;">';
    html+='<div style="font-size:14px;font-weight:600;color:var(--txt);margin-bottom:8px;display:flex;align-items:center;gap:8px;">';
    if(avatar){
      html+='<img src="'+avatar.replace(/"/g,'&quot;')+'" style="width:24px;height:24px;border-radius:50%;object-fit:cover;">';
    }
    html+=contactName+' ('+favs.length+'条)</div>';
    
    favs.forEach(function(fav){
      var savedAtStr='';
      if(fav.savedAt){
        var d=new Date(fav.savedAt);
        savedAtStr=(d.getMonth()+1)+'/'+d.getDate()+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);
      }
      
      var previewHtml='';
      if(fav.msgType==='image'||fav.msgType==='sticker'){
        var imgUrl=fav.msgData.img||'';
        if(imgUrl&&!imgUrl.startsWith('data:image/')){
          var cachedImg=memoryCache['_img_'+imgUrl];
          if(cachedImg){imgUrl=cachedImg}
        }
        previewHtml='<img src="'+imgUrl.replace(/"/g,'&quot;')+'" style="max-width:60px;max-height:60px;border-radius:6px;object-fit:cover;margin-top:4px;" onerror="this.style.display=\'none\'">';
        if(fav.msgText&&fav.msgText!=='[图片]'){
          previewHtml='<div style="font-size:13px;color:var(--txt);">'+fav.msgText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div>'+previewHtml;
        }
      }else if(fav.msgType==='voice'){
        var _favUrl=fav.msgData&&fav.msgData.mmAudioUrl;
        previewHtml='<span style="color:var(--txt3);">🎤 '+fav.msgText+'</span>';
        if(_favUrl){
          previewHtml+='<button onclick="playFavVoice(\''+fav.id+'\')" style="margin-top:4px;display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border:none;border-radius:12px;background:var(--accent);color:#fff;font-size:12px;cursor:pointer;">▶ 播放已存语音（不消耗额度）</button>';
        }
      }else{
        var txt=fav.msgText||'';
        if(txt.length>40){txt=txt.substring(0,40)+'...'}
        previewHtml=txt.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        // ★ 文字消息若已合成过语音，显示免费重播按钮
        if(fav.msgData&&fav.msgData.mmAudioUrl){
          previewHtml+='<button onclick="playFavVoice(\''+fav.id+'\')" style="margin-top:4px;display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border:none;border-radius:12px;background:var(--accent);color:#fff;font-size:12px;cursor:pointer;">▶ 播放语音（不消耗额度）</button>';
        }
      }
      
      html+='<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--c2);border-radius:8px;margin-bottom:6px;">';
      html+='<div style="flex:1;min-width:0;">';
      html+='<div style="font-size:14px;color:var(--txt);word-break:break-all;">'+previewHtml+'</div>';
      html+='<div style="font-size:11px;color:var(--txt3);margin-top:4px;">收藏于 '+savedAtStr+'</div>';
      html+='</div>';
      html+='<button onclick="deleteFav(\''+contactId+'\',\''+fav.id+'\')" style="border:none;background:none;color:var(--txt3);cursor:pointer;font-size:14px;padding:4px;flex-shrink:0;" title="删除">🗑</button>';
      html+='</div>';
    });
    
    html+='</div>';
  });
  
  list.innerHTML=html;
}

function playFavVoice(favId){
  var found=null;
  Object.keys(myFavs).forEach(function(cc){
    (myFavs[cc]||[]).forEach(function(f){
      if(f.id===favId)found=f;
    });
  });
  if(!found||!found.msgData||!found.msgData.mmAudioUrl){toast('该语音没有保存的音频');return;}
  try{
    var au=new Audio(found.msgData.mmAudioUrl);
    au.play();
    toast('播放已保存的语音');
  }catch(e){
    toast('播放失败');
  }
}

function deleteFav(contactId,favId){
  if(!myFavs[contactId])return;
  myFavs[contactId]=myFavs[contactId].filter(function(f){return f.id!==favId});
  if(myFavs[contactId].length===0){
    delete myFavs[contactId];
  }
  saveFavs();
  renderMyFavs();
  toast('已删除收藏');
}

// ---------- Custom Contact Order Settings ----------
var customContactOrder=[];

function loadContactOrder(){var saved=ls('ml2_custom_contact_order');if(saved&&Array.isArray(saved))customContactOrder=saved}
async function saveContactOrder(){
  ls('ml2_custom_contact_order',customContactOrder);
  if(window.localforage){
    try{await window.localforage.setItem('ml2_custom_contact_order',customContactOrder)}catch(e){}
  }
  toast('联系人顺序已保存');
}
function resetContactOrder(){customContactOrder=[];renderCustomContactOrderList()}
async function loadContactOrderAsync(){
  if(window.localforage){
    try{
      var saved=await window.localforage.getItem('ml2_custom_contact_order');
      if(saved&&Array.isArray(saved)){
        customContactOrder=saved;
        memoryCache['ml2_custom_contact_order']=saved;
      }
    }catch(e){}
  }
}

function renderCustomContactOrderList(){
  var list=$('custom-contact-order-list');
  if(!list)return;
  list.innerHTML='';
  
  var allContacts=[].concat(contacts,groups);
  allContacts.forEach(function(contact){
    var isSelected=customContactOrder.indexOf(contact.id)>=0;
    var index=customContactOrder.indexOf(contact.id);
    
    var avatarHtml=contact.avatar?'<img src="'+contact.avatar.replace(/"/g,'&quot;')+'" style="display:block;width:100%;height:100%;object-fit:cover;">':(contact.type==='group'?'👥':'✦');
    
    var html='<div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--c2);border-radius:8px;margin-bottom:8px;">';
    html+='<div style="width:36px;height:36px;border-radius:8px;background:var(--c3);display:flex;align-items:center;justify-content:center;overflow:hidden;">'+avatarHtml+'</div>';
    html+='<div style="flex:1;font-size:14px;color:var(--txt);">'+contact.name+'</div>';
    
    if(isSelected){
      html+='<button onclick="moveContactOrder('+index+',-1)" style="padding:6px;border:none;background:none;color:var(--txt2);cursor:pointer;"'+(index===0?' disabled':'')+'>↑</button>';
      html+='<button onclick="moveContactOrder('+index+',1)" style="padding:6px;border:none;background:none;color:var(--txt2);cursor:pointer;"'+(index===customContactOrder.length-1?' disabled':'')+'>↓</button>';
      html+='<button onclick="toggleContactOrder(\''+contact.id+'\')" style="padding:6px 12px;border:none;background:var(--accent);color:white;border-radius:6px;font-size:12px;cursor:pointer;">已添加</button>';
    }else{
      html+='<button onclick="toggleContactOrder(\''+contact.id+'\')" style="padding:6px 12px;border:1px solid var(--border);background:none;color:var(--txt);border-radius:6px;font-size:12px;cursor:pointer;">添加</button>';
    }
    
    html+='</div>';
    list.innerHTML+=html;
  });
}

function toggleContactOrder(contactId){
  var index=customContactOrder.indexOf(contactId);
  if(index>=0){
    customContactOrder.splice(index,1);
  }else{
    customContactOrder.push(contactId);
  }
  renderCustomContactOrderList();
}

function moveContactOrder(index,direction){
  var newIndex=index+direction;
  if(newIndex<0||newIndex>=customContactOrder.length)return;
  var temp=customContactOrder[index];
  customContactOrder[index]=customContactOrder[newIndex];
  customContactOrder[newIndex]=temp;
  renderCustomContactOrderList();
}

function getPrevContact(){
  if(customContactOrder.length>0){
    var index=customContactOrder.indexOf(cid);
    if(index>=0){
      var prevIndex=(index-1+customContactOrder.length)%customContactOrder.length;
      return customContactOrder[prevIndex];
    }
  }
  var idx=contacts.findIndex(function(x){return x.id===cid});
  if(idx<0)return contacts.length>0?contacts[0].id:null;
  return contacts[(idx-1+contacts.length)%contacts.length].id;
}

function getNextContact(){
  if(customContactOrder.length>0){
    var index=customContactOrder.indexOf(cid);
    if(index>=0){
      var nextIndex=(index+1)%customContactOrder.length;
      return customContactOrder[nextIndex];
    }
  }
  var idx=contacts.findIndex(function(x){return x.id===cid});
  if(idx<0)return contacts.length>0?contacts[0].id:null;
  return contacts[(idx+1)%contacts.length].id;
}

// ---------- Contact Edit ----------
var editingContact=null;
function openContactEdit(){
  if(!cid)return;
  editingContact=contacts.find(function(x){return x.id===cid});
  if(!editingContact)return;
  var avPreview=$('contact-avatar-preview');
  if(editingContact.avatar){
    avPreview.innerHTML='<img src="'+editingContact.avatar.replace(/"/g,'&quot;')+'">';
  }else{
    avPreview.textContent='✦';
  }
  $('contact-name-input').value=editingContact.name||'';
  var myAvPreview=$('my-avatar-preview');
  if(editingContact.myAvatar){
    myAvPreview.innerHTML='<img src="'+editingContact.myAvatar.replace(/"/g,'&quot;')+'">';
  }else if(me.avatar){
    myAvPreview.innerHTML='<img src="'+me.avatar.replace(/"/g,'&quot;')+'">';
  }else{
    myAvPreview.textContent='✦';
  }
  $('my-name-input')&&($('my-name-input').value=editingContact.myName||'');
  renderMyAvatars();
  $('hide-topbar-all')&&($('hide-topbar-all').checked=!!(editingContact.hideName&&editingContact.hideNavInfo&&editingContact.hideTopbarAvatarStatus));
  $('hide-system-names')&&($('hide-system-names').checked=!!(editingContact.hideQuoteNames&&editingContact.hideTouchNames));
  $('hide-bottom-nav')&&($('hide-bottom-nav').checked=!!(ls('ml2_hide_bottom_nav')||false));
  $('hide-chat-avatars')&&($('hide-chat-avatars').checked=!!editingContact.hideChatAvatars);
  $('hide-send-btn')&&($('hide-send-btn').checked=!!editingContact.hideSendBtn);
  // 聊天输入栏收纳功能：加载全局checkbox状态
  var ibh=ls('ml2_input_bar_hidden')||{};
  $('show-ibar-emoji')&&($('show-ibar-emoji').checked=!ibh.emoji);
  $('show-ibar-image')&&($('show-ibar-image').checked=!ibh.image);
  $('show-ibar-batch')&&($('show-ibar-batch').checked=!ibh.batch);
  $('show-ibar-continue')&&($('show-ibar-continue').checked=!ibh.continue);
  $('show-ibar-send')&&($('show-ibar-send').checked=!ibh.send);
  var avatarShape=editingContact.avatarShape||'square';
  var avatarRadius=avatarShape==='circle'?'50%':'16px';
  if($('contact-avatar-preview'))$('contact-avatar-preview').style.borderRadius=avatarRadius;
  if($('my-avatar-preview'))$('my-avatar-preview').style.borderRadius=avatarRadius;
  if($('avatar-shape-square'))$('avatar-shape-square').checked=(avatarShape==='square');
  if($('avatar-shape-circle'))$('avatar-shape-circle').checked=(avatarShape==='circle');
  if($('avatar-shape-square-label'))$('avatar-shape-square-label').style.borderColor=(avatarShape==='square'?'var(--accent)':'transparent');
  if($('avatar-shape-circle-label'))$('avatar-shape-circle-label').style.borderColor=(avatarShape==='circle'?'var(--accent)':'transparent');
  
  if($('avatar-shape-square')){
    $('avatar-shape-square').onchange=function(){
      if(this.checked){
        if($('contact-avatar-preview'))$('contact-avatar-preview').style.borderRadius='16px';
        if($('my-avatar-preview'))$('my-avatar-preview').style.borderRadius='16px';
        if($('avatar-shape-square-label'))$('avatar-shape-square-label').style.borderColor='var(--accent)';
        if($('avatar-shape-circle-label'))$('avatar-shape-circle-label').style.borderColor='transparent';
      }
    };
  }
  if($('avatar-shape-circle')){
    $('avatar-shape-circle').onchange=function(){
      if(this.checked){
        if($('contact-avatar-preview'))$('contact-avatar-preview').style.borderRadius='50%';
        if($('my-avatar-preview'))$('my-avatar-preview').style.borderRadius='50%';
        if($('avatar-shape-square-label'))$('avatar-shape-square-label').style.borderColor='transparent';
        if($('avatar-shape-circle-label'))$('avatar-shape-circle-label').style.borderColor='var(--accent)';
      }
    };
  }
  $('reply-count-value')&&($('reply-count-value').textContent=editingContact.replyCount||1);
  $('initiative-count-value')&&($('initiative-count-value').textContent=editingContact.initiativeCount||1);
  $('contact-edit-chatbar-btn')&&($('contact-edit-chatbar-btn').onclick=function(){openContactChatbarSettings(editingContact.id)});
  $('contact-edit-topbar-btn')&&($('contact-edit-topbar-btn').onclick=function(){openContactTopbarOrder()});
  $('contact-export-chat-btn')&&($('contact-export-chat-btn').onclick=function(){exportSingleContactChat(editingContact.id)});
  $('contact-import-chat-btn')&&($('contact-import-chat-btn').onclick=function(){importSingleContactChat(editingContact.id)});
  
  // 初始化随机头像库
  if(!editingContact.avatarLib){editingContact.avatarLib={enabled:true,avatarKeys:[],avatarChat:true,avatarMail:false,avatarMoment:false};}
  if(editingContact.avatarLib.enabled===undefined)editingContact.avatarLib.enabled=true;
  if(editingContact.avatarLib.avatarChat===undefined)editingContact.avatarLib.avatarChat=true;
  if(editingContact.avatarLib.avatarMail===undefined)editingContact.avatarLib.avatarMail=false;
  if(editingContact.avatarLib.avatarMoment===undefined)editingContact.avatarLib.avatarMoment=false;
  var avLibEnabled=$('avatar-lib-enabled');
  if(avLibEnabled){avLibEnabled.checked=!!editingContact.avatarLib.enabled;}
  var avLibChat=$('avatar-lib-chat');
  if(avLibChat){avLibChat.checked=!!editingContact.avatarLib.avatarChat;}
  var avLibMail=$('avatar-lib-mail');
  if(avLibMail){avLibMail.checked=!!editingContact.avatarLib.avatarMail;}
  var avLibMoment=$('avatar-lib-moment');
  if(avLibMoment){avLibMoment.checked=!!editingContact.avatarLib.avatarMoment;}
  renderAvatarLibImages();
  
  showOv('ov-contact-edit');
}
function openNonInstantContactEdit(){
  if(!nonInstantCid)return;
  editingContact=contacts.find(function(x){return x.id===nonInstantCid});
  if(!editingContact)return;
  var avPreview=$('contact-avatar-preview');
  if(avPreview){
    if(editingContact.avatar){
      avPreview.innerHTML='<img src="'+editingContact.avatar.replace(/"/g,'&quot;')+'">';
    }else{
      avPreview.textContent='✦';
    }
  }
  $('contact-name-input')&&($('contact-name-input').value=editingContact.name||'');
  var myAvPreview=$('my-avatar-preview');
  if(myAvPreview){
    if(editingContact.myAvatar){
      myAvPreview.innerHTML='<img src="'+editingContact.myAvatar.replace(/"/g,'&quot;')+'">';
    }else if(me.avatar){
      myAvPreview.innerHTML='<img src="'+me.avatar.replace(/"/g,'&quot;')+'">';
    }else{
      myAvPreview.textContent='✦';
    }
  }
  $('my-name-input')&&($('my-name-input').value=editingContact.myName||'');
  $('contact-edit-chatbar-btn')&&($('contact-edit-chatbar-btn').onclick=function(){openContactChatbarSettings(editingContact.id)});
  $('contact-edit-topbar-btn')&&($('contact-edit-topbar-btn').onclick=function(){openContactTopbarOrder()});
  showOv('ov-contact-edit');
}
function saveContactEdit(){
  if(!editingContact)return;
  var nameInput=$('contact-name-input');
  if(nameInput){
    var name=nameInput.value.trim();
    if(name){
      editingContact.name=name;
    }
  }
  var myNameInput=$('my-name-input');
  if(myNameInput){
    editingContact.myName=myNameInput.value.trim()||null;
  }
  var hideTopbarAllCheckbox=$('hide-topbar-all');
  if(hideTopbarAllCheckbox){
    editingContact.hideName=hideTopbarAllCheckbox.checked;
    editingContact.hideNavInfo=hideTopbarAllCheckbox.checked;
    editingContact.hideTopbarAvatarStatus=hideTopbarAllCheckbox.checked;
    if($('nav-info-row1'))$('nav-info-row1').style.display=hideTopbarAllCheckbox.checked?'none':'';
    if($('nav-info-row2'))$('nav-info-row2').style.display=hideTopbarAllCheckbox.checked?'none':'';
    if($('nav-contact-avatar'))$('nav-contact-avatar').style.display=hideTopbarAllCheckbox.checked?'none':'flex';
    if($('nav-contact-status'))$('nav-contact-status').style.display=hideTopbarAllCheckbox.checked?'none':'';
  }
  var hideSystemNamesCheckbox=$('hide-system-names');
  if(hideSystemNamesCheckbox){
    editingContact.hideQuoteNames=hideSystemNamesCheckbox.checked;
    editingContact.hideTouchNames=hideSystemNamesCheckbox.checked;
    saveHideTouchNames(editingContact.id,editingContact.hideTouchNames);
  }
  var hideBottomNavCheckbox=$('hide-bottom-nav');
  if(hideBottomNavCheckbox){
    ls('ml2_hide_bottom_nav',hideBottomNavCheckbox.checked);
    updateBottomNavVisibility();
  }
  var hideChatAvatarsCheckbox=$('hide-chat-avatars');
  if(hideChatAvatarsCheckbox){
    editingContact.hideChatAvatars=hideChatAvatarsCheckbox.checked;
    document.querySelectorAll('.ibar').forEach(function(el){
      if(hideChatAvatarsCheckbox.checked){
        el.style.background='rgba(255,255,255,0.5)';
      }else{
        el.style.background='';
      }
    });
  }
  var hideSendBtnCheckbox=$('hide-send-btn');
  // 聊天输入栏收纳功能：读取5个checkbox状态，保存为全局设置
  var showEmoji=$('show-ibar-emoji');
  var showImage=$('show-ibar-image');
  var showBatch=$('show-ibar-batch');
  var showContinue=$('show-ibar-continue');
  var showSend=$('show-ibar-send');
  if(showEmoji||showImage||showBatch||showContinue||showSend){
    var ibh=ls('ml2_input_bar_hidden')||{};
    if(showEmoji)ibh.emoji=!showEmoji.checked;
    if(showImage)ibh.image=!showImage.checked;
    if(showBatch)ibh.batch=!showBatch.checked;
    if(showContinue)ibh.continue=!showContinue.checked;
    if(showSend)ibh.send=!showSend.checked;
    ls('ml2_input_bar_hidden',ibh);
    // 立即应用收纳设置
    applyInputBarVisibility();
  }
  if($('avatar-shape-square')&&$('avatar-shape-square').checked)editingContact.avatarShape='square';
  if($('avatar-shape-circle')&&$('avatar-shape-circle').checked)editingContact.avatarShape='circle';
  
  // 保存随机头像库设置
  var avLibEnabled=$('avatar-lib-enabled');
  if(avLibEnabled){
    editingContact.avatarLib=editingContact.avatarLib||{enabled:false,avatarKeys:[],avatarChat:true,avatarMail:true,avatarMoment:true};
    editingContact.avatarLib.enabled=avLibEnabled.checked;
  }
  var avLibChat=$('avatar-lib-chat');
  if(avLibChat&&editingContact.avatarLib){editingContact.avatarLib.avatarChat=avLibChat.checked;}
  var avLibMail=$('avatar-lib-mail');
  if(avLibMail&&editingContact.avatarLib){editingContact.avatarLib.avatarMail=avLibMail.checked;}
  var avLibMoment=$('avatar-lib-moment');
  if(avLibMoment&&editingContact.avatarLib){editingContact.avatarLib.avatarMoment=avLibMoment.checked;}
  
  saveC();
  var convTitle=$('conv-title');
  if(convTitle){
    convTitle.textContent=editingContact.hideName?'':editingContact.name;
  }
  renderChatList();
  // ★ 修复：联系人设置（含简约模式/透明度）保存后重新应用聊天设置，取消简约模式时透明度恢复正常
  try{ if(typeof applyChatSettings==='function') applyChatSettings(editingContact); }catch(e){console.warn('applyChatSettings after save failed:',e)}
  renderMsgs();
  updateBottomNavVisibility();
  hideOv('ov-contact-edit');
  toast('联系人信息已更新');
}

try{$('close-contact-edit')&&$('close-contact-edit').addEventListener('click',function(){hideOv('ov-contact-edit')});}catch(e){console.warn('bind close-contact-edit failed:',e)}
try{$('avatar-shape-square')&&$('avatar-shape-square').addEventListener('change',function(){
  if(this.checked){
    $('avatar-shape-square-label').style.borderColor='var(--accent)';
    $('avatar-shape-circle-label').style.borderColor='transparent';
  }
});}catch(e){console.warn('bind avatar-shape-square failed:',e)}
try{$('avatar-shape-circle')&&$('avatar-shape-circle').addEventListener('change',function(){
  if(this.checked){
    $('avatar-shape-circle-label').style.borderColor='var(--accent)';
    $('avatar-shape-square-label').style.borderColor='transparent';
  }
});}catch(e){console.warn('bind avatar-shape-circle failed:',e)}
try{$('avatar-shape-square-label')&&$('avatar-shape-square-label').addEventListener('click',function(){
  $('avatar-shape-square').checked=true;
  $('avatar-shape-square-label').style.borderColor='var(--accent)';
  $('avatar-shape-circle-label').style.borderColor='transparent';
});}catch(e){console.warn('bind avatar-shape-square-label failed:',e)}
try{$('avatar-shape-circle-label')&&$('avatar-shape-circle-label').addEventListener('click',function(){
  $('avatar-shape-circle').checked=true;
  $('avatar-shape-circle-label').style.borderColor='var(--accent)';
  $('avatar-shape-square-label').style.borderColor='transparent';
});}catch(e){console.warn('bind avatar-shape-circle-label failed:',e)}
try{$('contact-edit-cancel')&&$('contact-edit-cancel').addEventListener('click',function(){hideOv('ov-contact-edit')});}catch(e){console.warn('bind contact-edit-cancel failed:',e)}
var _contactEditTouched=false;
try{$('contact-edit-save')&&($('contact-edit-save').addEventListener('touchend',function(e){e.preventDefault();_contactEditTouched=true;saveContactEdit()}),$('contact-edit-save').addEventListener('click',function(){if(_contactEditTouched){_contactEditTouched=false;return;}saveContactEdit()}));}catch(e){console.warn('bind contact-edit-save failed:',e)}

if($('contact-delete-btn'))$('contact-delete-btn').addEventListener('click',function(){
  if(!editingContact)return;
  customConfirm('确定要删除联系人「'+editingContact.name+'」吗？删除后聊天记录也会被清除。').then(function(ok){
    if(!ok)return;
    var did=editingContact.id;
    contacts=contacts.filter(function(x){return x.id!==did});
    momentsMembers=momentsMembers.filter(function(m){return m.contactId!==did&&m.id!==did});
    saveC();
    saveMomentsData();
    savemsgs(did,[]);
    // ★ 同步清理该联系人的图片/语音数据，防止孤儿数据累积占满存储
    removeContactMediaData(did);
    hideOv('ov-contact-edit');
    showPg('pg-list');
    renderChatList();
    renderDContacts();
    toast('已删除联系人');
    haptic('warn');
  });
});
// 清空聊天记录
// 删除某联系人的所有图片/语音数据（聊天记录清理时调用，防止孤儿数据累积）
function removeContactMediaData(contactId){
  if(!contactId)return;
  try{
    var removedKeys=[];
    // IndexedDB 中的图片/语音键：ml2_msg_img_<id> 或 ml2_msg_voice_<id>
    if(window.localforage){
      window.localforage.keys().then(function(keys){
        keys.forEach(function(k){
          if(k&&(k.indexOf('ml2_msg_img_'+contactId)===0||k.indexOf('ml2_msg_voice_'+contactId)===0)){
            window.localforage.removeItem(k).catch(function(){});
            removedKeys.push(k);
          }
        });
        // localStorage 备份也清理
        removedKeys.forEach(function(k){
          try{localStorage.removeItem(k);}catch(e){}
          try{localStorage.removeItem('ml2_lf_'+k);}catch(e){}
        });
      }).catch(function(){});
    }
  }catch(e){console.warn('removeContactMediaData failed:',e);}
}
if($('contact-clear-chat-btn')){
  $('contact-clear-chat-btn').addEventListener('click',function(){
    if(!editingContact)return;
    customConfirm('确定要清空与「'+editingContact.name+'」的所有聊天记录吗？此操作不可撤销。').then(function(ok){
      if(!ok)return;
      var did=editingContact.id;
      var key=LM+did;
      // 立即清除缓存和定时器
      if(_saveMsgTimers[did]){clearTimeout(_saveMsgTimers[did]);delete _saveMsgTimers[did];}
      memoryCache[key]=[];
      // 立即保存空数组
      ls(key,[]);
      if(window.localforage){window.localforage.setItem(key,[]).catch(function(){})}
      // ★ 同步清理该联系人的图片/语音数据，防止孤儿数据累积占满存储
      removeContactMediaData(did);
      if(cid===did){
        msgCache={};
        renderMsgs();
      }
      toast('聊天记录已清空');
      haptic('warn');
    });
  });
}
if($('contact-avatar-input')){
  $('contact-avatar-input').addEventListener('change',function(e){
    var file=e.target.files[0];if(!file)return;
    compressImage(file,512,0.92,async function(res){
      editingContact.avatar=res;
      var preview=$('contact-avatar-preview');
      if(preview)preview.innerHTML='<img src="'+res.replace(/"/g,'&quot;')+'">';
      saveC();
      renderChatList();
      toast('头像已更新');
    });
    e.target.value='';
  });
}
if($('my-avatar-input')){$('my-avatar-input').addEventListener('change',function(e){
  var files=e.target.files;if(!files||!files.length)return;
  var count=0;
  var total=files.length;
  for(var i=0;i<total;i++){
    (function(file){
      compressImage(file,512,0.92,async function(res){
        if(!editingContact.myAvatars)editingContact.myAvatars=[];
        editingContact.myAvatars.push(res);
        count++;
        if(i===0){
          editingContact.myAvatar=res;
          $('my-avatar-preview').innerHTML='<img src="'+res.replace(/"/g,'&quot;')+'">';
        }
        if(count===total){
          renderMyAvatars();
          saveC();
          renderMsgs();
          toast(total>1?'已批量上传 '+total+' 个头像':'我的头像已更新');
        }
      });
    })(files[i]);
  }
  e.target.value='';
});}

// 渲染我的多头像列表
function renderMyAvatars(){
  var list=$('my-avatars-list');
  if(!list||!editingContact)return;
  var avatars=editingContact.myAvatars||[];
  list.innerHTML='';
  if(avatars.length===0){
    list.innerHTML='<div style="font-size:11px;color:var(--txt3);width:100%;text-align:center;padding:4px;">上传后此处可管理多个头像</div>';
    return;
  }
  avatars.forEach(function(av,idx){
    var itemWrap=document.createElement('div');
    itemWrap.style.cssText='display:flex;flex-direction:column;align-items:center;gap:2px;';
    // 图片容器
    var imgWrap=document.createElement('div');
    imgWrap.style.cssText='position:relative;width:40px;height:40px;border-radius:8px;overflow:hidden;border:1px solid var(--border);cursor:pointer;flex-shrink:0;';
    var img=document.createElement('img');
    img.src=av;
    img.style.cssText='display:block;width:100%;height:100%;object-fit:cover;';
    img.title='点击切换到此头像';
    img.onclick=function(e){
      e.stopPropagation();
      editingContact.myAvatar=av;
      $('my-avatar-preview').innerHTML='<img src="'+av.replace(/"/g,'&quot;')+'">';
      saveC();
      renderMsgs();
      renderMyAvatars();
    };
    imgWrap.appendChild(img);
    itemWrap.appendChild(imgWrap);
    // 删除按钮（在图片下方，手机端可用）
    var delBtn=document.createElement('div');
    delBtn.style.cssText='font-size:10px;color:var(--txt3);cursor:pointer;padding:1px 4px;';
    delBtn.textContent='删除';
    delBtn.title='删除此头像';
    delBtn.addEventListener('click',function(e){
      e.stopPropagation();
      editingContact.myAvatars.splice(idx,1);
      if(editingContact.myAvatar===av){
        editingContact.myAvatar=editingContact.myAvatars.length>0?editingContact.myAvatars[editingContact.myAvatars.length-1]:'';
        $('my-avatar-preview').innerHTML=editingContact.myAvatar?'<img src="'+editingContact.myAvatar.replace(/"/g,'&quot;')+'">':'✦';
      }
      saveC();
      renderMsgs();
      renderMyAvatars();
    });
    itemWrap.appendChild(delBtn);
    list.appendChild(itemWrap);
  });
}


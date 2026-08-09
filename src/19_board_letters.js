// ---------- Letters ----------

var currentLetterContact='all';
var currentLetterCategory='all';
var currentLetterTab='partner';

if($('letters-back'))$('letters-back').addEventListener('click',function(){showPg('pg-my')});

if($('env-contact-btn'))$('env-contact-btn').addEventListener('click',function(){
  toggleEnvContactList();
});

function toggleEnvContactList(){
  var popup=$('env-contact-list-popup');
  if(popup.style.display==='block'){
    popup.style.display='none';
  }else{
    renderEnvContactList();
    popup.style.display='block';
  }
}

function renderEnvContactList(){
  var popup=$('env-contact-list-popup');
  var html='<div class="env-contact-option" data-cid="all" style="padding:10px 12px;cursor:pointer;font-size:13px;color:var(--txt);border-bottom:1px solid var(--border);">全部联系人</div>';
  contacts.forEach(function(c){
    var letterCount=getLetterCount(c.id);
    var mailAv=c.mailAvatar||c.avatar;
    html+='<div class="env-contact-option" data-cid="'+c.id+'" style="padding:10px 12px;cursor:pointer;font-size:13px;color:var(--txt);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">'+
      '<div style="display:flex;align-items:center;gap:8px;">'+
      (mailAv?'<img src="'+mailAv.replace(/"/g,'&quot;')+'" style="width:24px;height:24px;border-radius:50%;object-fit:cover;">':'<div style="width:24px;height:24px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px">✦</div>')+
      '<span>'+c.name+'</span>'+
      '</div>'+
      '<span style="font-size:11px;color:var(--txt3);">'+letterCount+'封</span>'+
      '</div>';
  });
  popup.innerHTML=html;
  
  popup.querySelectorAll('.env-contact-option').forEach(function(opt){
    opt.addEventListener('click',function(){
      var cid=this.dataset.cid;
      selectEnvContact(cid);
      popup.style.display='none';
    });
  });
}

// ========== 信箱头像管理 ==========
var _mailAvatarContactId=null;

function showMailAvatarSettings(){
  renderMailAvatarList();
  showOv('ov-mail-avatar');
}

function renderMailAvatarList(){
  var list=$('mail-avatar-list');
  if(!list)return;
  if(!contacts||!contacts.length){
    list.innerHTML='<div style="text-align:center;padding:20px;color:var(--txt3);">暂无联系人</div>';
    return;
  }
  var html='';
  contacts.forEach(function(c){
    if(c.id==='fh')return;
    var mailAv=c.mailAvatar||c.avatar;
    html+='<div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--c2);border-radius:12px;margin-bottom:8px;">'+
      '<div style="width:48px;height:48px;border-radius:12px;background:var(--c3);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;cursor:pointer;" onclick="triggerMailAvatarUpload(\''+c.id+'\')">'+
      (mailAv?'<img src="'+mailAv.replace(/"/g,'&quot;')+'" style="display:block;width:100%;height:100%;object-fit:cover;">':'✦')+
      '</div>'+
      '<div style="flex:1;min-width:0;">'+
      '<div style="font-size:14px;color:var(--txt);font-weight:500;">'+c.name+'</div>'+
      '<div style="font-size:11px;color:var(--txt3);margin-top:2px;">'+(c.mailAvatar?'已设置信箱头像':'使用聊天头像')+'</div>'+
      '</div>'+
      '<div style="display:flex;gap:6px;flex-shrink:0;">'+
      '<button style="padding:6px 12px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt);font-size:12px;cursor:pointer;" onclick="triggerMailAvatarUpload(\''+c.id+'\')">更换</button>'+
      (c.mailAvatar?'<button style="padding:6px 12px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:#ff4d4f;font-size:12px;cursor:pointer;" onclick="removeMailAvatar(\''+c.id+'\')">清除</button>':'')+
      '</div>'+
      '</div>';
  });
  list.innerHTML=html;
}

function triggerMailAvatarUpload(contactId){
  _mailAvatarContactId=contactId;
  var input=document.createElement('input');
  input.type='file';
  input.accept='image/'+'*';
  input.onchange=function(e){
    var f=e.target.files[0];
    if(!f)return;
    compressImage(f,256,0.8,function(dataUrl){
      if(!dataUrl)return;
      var c=contacts.find(function(x){return x.id===_mailAvatarContactId});
      if(!c)return;
      c.mailAvatar=dataUrl;
      saveC();
      renderMailAvatarList();
      // 刷新信箱联系人选择器
      if(typeof renderEnvContactList==='function')renderEnvContactList();
      // 刷新信箱列表
      if(typeof renderLetters==='function')renderLetters();
      toast('信箱头像已更新');
    });
    e.target.value='';
  };
  input.click();
}

function removeMailAvatar(contactId){
  if(!confirm('确定清除该联系人的信箱头像？清除后将使用聊天头像。'))return;
  var c=contacts.find(function(x){return x.id===contactId});
  if(!c)return;
  delete c.mailAvatar;
  saveC();
  renderMailAvatarList();
  if(typeof renderEnvContactList==='function')renderEnvContactList();
  if(typeof renderLetters==='function')renderLetters();
  toast('信箱头像已清除');
}

function getLetterCount(contactId){
  var ll=ls(LL)||[];
  return ll.filter(function(l){return l.fid===contactId}).length;
}

function selectEnvContact(contactId){
  currentLetterContact=contactId;
  var contact=contacts.find(function(c){return c.id===contactId});
  $('env-contact-label').textContent=contactId==='all'?'全部联系人':contact.name;
  switchEnvTab(currentLetterTab);
}

function filterLettersByContact(letters){
  if(currentLetterContact==='all')return letters;
  return letters.filter(function(l){return l.fid===currentLetterContact});
}

function switchEnvTab(tab){
  currentLetterTab=tab;
  document.querySelectorAll('.env-tab-btn').forEach(function(btn){btn.classList.remove('sel');btn.style.borderBottomColor='transparent';btn.style.color='var(--txt3)'});
  var activeBtn=$('env-tab-'+tab);
  if(activeBtn){activeBtn.classList.add('sel');activeBtn.style.borderBottomColor='#8b7355';activeBtn.style.color='#8b7355'}
  
  $('env-partner-section').style.display='none';
  $('env-inbox-section').style.display='none';
  $('env-outbox-section').style.display='none';
  $('env-compose-form').style.display='none';
  $('env-send-area').style.display='none';
  
  if(tab==='partner'){
    $('env-partner-section').style.display='block';
    renderEnvPartnerList();
  }else if(tab==='inbox'){
    $('env-inbox-section').style.display='block';
    renderEnvInboxList();
  }else if(tab==='outbox'){
    $('env-outbox-section').style.display='block';
    renderEnvOutboxList();
  }
}

function renderEnvPartnerList(){
  var ll=ls(LL)||[];
  var partnerLetters=filterLettersByContact(ll.filter(function(l){return l.type==='received'}));
  
  var list=$('env-partner-list');
  if(!list)return;
  
  if(!partnerLetters.length){
    list.innerHTML='<div style="text-align:center;padding:40px;color:var(--txt3);font-size:14px;"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.4;margin-bottom:12px;"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg><div>对方还没有写信</div><div style="font-size:12px;margin-top:4px;">Ta可能正在酝酿一份惊喜~</div></div>';
    return;
  }
  
  list.innerHTML=partnerLetters.slice().sort(function(a,b){return b.tm-a.tm}).map(function(l){
    var c=contacts.find(function(x){return x.id===l.fid});
    var av=c&&(c.mailAvatar||c.avatar)?'<img src="'+(c.mailAvatar||c.avatar).replace(/"/g,'&quot;')+'" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">':'<div style="width:40px;height:40px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px">✦</div>';
    
    return'<div class="letter-item" data-lid="'+l.id+'" style="background:#fffdf8;border:1px solid #e8e0d0;border-radius:12px;padding:12px;margin-bottom:8px;box-sizing:border-box;width:100%;"><div style="display:flex;align-items:flex-start;gap:8px;"><div style="flex-shrink:0;width:48px;text-align:center;"><div style="font-size:10px;color:var(--txt3);line-height:1.4;">'+flt(l.tm)+'</div></div><div style="flex-shrink:0">'+av+'</div><div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:14px;color:var(--txt);margin-bottom:2px;">来自 '+ (c?c.name:'神秘人') +'</div><div style="font-size:13px;color:var(--txt2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+l.tt+'</div></div></div></div>';
  }).join('');
  
  list.onclick=function(e){var t=e.target.closest('.letter-item');if(t)openLetterDetail(t.dataset.lid)};
}

function renderEnvInboxList(){
  var ll=ls(LL)||[];
  var inboxLetters=filterLettersByContact(ll.filter(function(l){return l.type==='received'&&l.partnerReply}));
  
  var list=$('env-inbox-list');
  if(!list)return;
  
  if(!inboxLetters.length){
    list.innerHTML='<div style="text-align:center;padding:40px;color:var(--txt3);font-size:14px;"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.4;margin-bottom:12px;"><path d="M22 13V19a2 2 0 01-2 2H4a2 2 0 01-2-2v-6"/><polyline points="15 3 21 3 21 9"/><line x1="21" y1="3" x2="10" y2="14"/></svg><div>还没有收到回信</div><div style="font-size:12px;margin-top:4px;">耐心等待对方的回复吧~</div></div>';
    return;
  }
  
  list.innerHTML=inboxLetters.slice().sort(function(a,b){return b.tm-a.tm}).map(function(l){
    var c=contacts.find(function(x){return x.id===l.fid});
    var av=c&&(c.mailAvatar||c.avatar)?'<img src="'+(c.mailAvatar||c.avatar).replace(/"/g,'&quot;')+'" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">':'<div style="width:40px;height:40px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px">✦</div>';
    
    return'<div class="letter-item" data-lid="'+l.id+'" style="background:#fffdf8;border:1px solid #e8e0d0;border-radius:12px;padding:12px;margin-bottom:8px;box-sizing:border-box;width:100%;"><div style="display:flex;align-items:flex-start;gap:8px;"><div style="flex-shrink:0;width:48px;text-align:center;"><div style="font-size:10px;color:var(--txt3);line-height:1.4;">'+(l.partnerReply?flt(l.partnerReply.tm):flt(l.tm))+'</div></div><div style="flex-shrink:0">'+av+'</div><div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:14px;color:var(--txt);margin-bottom:2px;">'+ (c?c.name:'神秘人') +' 的回信</div><div style="font-size:13px;color:var(--txt2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+l.tt+'</div></div></div></div>';
  }).join('');
  
  list.onclick=function(e){var t=e.target.closest('.letter-item');if(t)openLetterDetail(t.dataset.lid)};
}

function renderEnvOutboxList(){
  var ll=ls(LL)||[];
  try{var localStored=safeGetItem('ml2_lf_'+LL);if(localStored){var lfData=JSON.parse(localStored);if(lfData&&Array.isArray(lfData))lfData.forEach(function(l){if(l&&(l.type==='sent'||(l.type==='received'&&l.replied))){var exists=ll.find(function(x){return x.id===l.id});if(!exists)ll.push(l)}})}}catch(e){}
  var outboxLetters=filterLettersByContact(ll.filter(function(l){return l&&(l.type==='sent'||(l.type==='received'&&l.replied))}));
  
  var list=$('env-outbox-list');
  if(!list)return;
  
  if(!outboxLetters.length){
    list.innerHTML='<div style="text-align:center;padding:40px;color:var(--txt3);font-size:14px;"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.4;margin-bottom:12px;"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg><div>还没有寄出任何信件</div><div style="font-size:12px;margin-top:4px;">提笔写下心意，寄送给Ta吧~</div></div>';
    return;
  }
  
  list.innerHTML=outboxLetters.slice().sort(function(a,b){return b.tm-a.tm}).map(function(l){
    if(!l)return'';
    var c=contacts.find(function(x){return x.id===l.fid});
    var av=c&&(c.mailAvatar||c.avatar)?'<img src="'+(c.mailAvatar||c.avatar).replace(/"/g,'&quot;')+'" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">':'<div style="width:40px;height:40px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px">✦</div>';
    var status=l.partnerReply?'对方已回复':'已寄出';
    var statusColor=l.partnerReply?'var(--accent)':'var(--txt3)';
    
    return'<div class="letter-item" data-lid="'+l.id+'" style="background:#fffdf8;border:1px solid #e8e0d0;border-radius:12px;padding:12px;margin-bottom:8px;box-sizing:border-box;width:100%;"><div style="display:flex;align-items:flex-start;gap:8px;"><div style="flex-shrink:0;width:48px;text-align:center;"><div style="font-size:10px;color:var(--txt3);line-height:1.4;">'+(l.tm?flt(l.tm):'')+'</div></div><div style="flex-shrink:0">'+av+'</div><div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:14px;color:var(--txt);margin-bottom:2px;">寄给 '+ (c?c.name:'神秘人') +'</div><div style="font-size:13px;color:var(--txt2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:1px;">'+(l.tt||'')+'</div><div style="font-size:12px;color:'+statusColor+';margin-top:1px;">'+status+'</div></div></div></div>';
  }).join('');
  
  list.onclick=function(e){var t=e.target.closest('.letter-item');if(t)openLetterDetail(t.dataset.lid)};
}

function openLetterDetail(lid){
  var ll=ls(LL)||[],l=ll.find(function(x){return x.id===lid});if(!l)return;
  currentLetter=l;
  // ★ 修复：不强制覆盖 _letterFromChat（聊天点击已设为 true，信箱入口 openLetter 已设为 false）
  l.r=true;ls(LL,ll);if(window.localforage){try{window.localforage.setItem(LL,ll)}catch(e){}}
  var c=contacts.find(function(x){return x.id===l.fid});
  l.type=l.type||'received';
  
  function createLetterPaper(title,content,date,author,isMine){
    var borderColor=isMine?'#e8e0d0':'rgba(201,169,110,0.3)';
    var textColor=isMine?'#8b7355':'var(--txt)';
    var bgColor=isMine?'#f5efe0':'#fff';
    var accentColor=isMine?'rgba(139,115,85,0.15)':'rgba(201,169,110,0.15)';
    
    return'<div style="background:'+bgColor+';border-radius:12px;border:1px solid '+borderColor+';overflow:hidden;margin-bottom:16px;">'+
      '<div style="height:6px;background:linear-gradient(90deg,'+borderColor+','+accentColor+','+borderColor+');"></div>'+
      '<div style="padding:20px 20px 16px;position:relative;">'+
        '<div style="position:absolute;inset:0;background:repeating-linear-gradient(transparent,transparent 31px,'+accentColor+' 31px,'+accentColor+' 32px);pointer-events:none;border-radius:12px;"></div>'+
        '<div style="position:relative;z-index:1;">'+
          '<div style="font-size:11px;color:'+(isMine?'#a89578':'var(--txt3)')+';text-align:right;margin-bottom:12px;letter-spacing:1px;opacity:0.8;font-style:italic;">'+date+'</div>'+
          '<div style="font-size:13px;color:'+(isMine?'#8b7355':'var(--txt2)')+';margin-bottom:4px;font-weight:500;">'+title+'</div>'+
          '<div style="font-size:14px;color:'+textColor+';line-height:32px;padding-left:8px;word-break:break-word;">'+content+'</div>'+
          '<div style="border-top:1px dashed '+accentColor+';margin:12px 0;"></div>'+
          '<div style="font-size:11px;color:'+(isMine?'#a89578':'var(--txt3)')+';text-align:right;margin-bottom:4px;letter-spacing:0.5px;">'+date+'</div>'+
          '<div style="font-size:14px;color:'+(isMine?'#8b7355':'#8b7355')+';text-align:right;font-weight:600;letter-spacing:1px;">'+author+'</div>'+
        '</div>'+
      '</div>'+
    '</div>';
  }
  
  var html='';
  
  if(l.type==='received'){
    html+=createLetterPaper('亲爱的，',renderLetterContent(l.ct),flt(l.tm),c?c.name:'神秘人',false);
  }
  
  if(l.myReply){
    var myTitle=l.type==='sent'?'我的信':'我的回信';
    html+=createLetterPaper('亲爱的，',renderLetterContent(l.myReply.content),flt(l.myReply.tm),'我',true);
  }
  
  if(l.partnerReply){
    html+=createLetterPaper('亲爱的，',renderLetterContent(l.partnerReply.content),flt(l.partnerReply.tm),c?c.name:'神秘人',false);
  }
  
  if(l.type==='sent'&&!l.myReply){
    html+=createLetterPaper('亲爱的，',renderLetterContent(l.ct),flt(l.tm),'我',true);
  }
  
  // ★ AI 解读块：信件详情内显示解读（解读中/失败/结果收纳展开），保留在原信件下方
  if(l.aiLoading){
    html+='<div style="padding:12px 14px;border-radius:12px;background:rgba(0,0,0,0.05);border:1px dashed var(--border);font-size:13px;color:var(--txt2);margin-bottom:12px;"><span style="display:inline-block;animation:aiPulse 1s ease-in-out infinite;">📜 TA正在解读这封信...</span></div>';
  }else if(l.aiError){
    html+='<div style="padding:12px 14px;border-radius:12px;background:rgba(0,0,0,0.05);border:1px dashed var(--border);font-size:12px;color:#ff4d4f;margin-bottom:12px;">📜 解读失败：'+String(l.aiError).replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div>';
  }else if(l.aiInterpret){
    var _aiEsc2=String(l.aiInterpret).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
    html+='<div onclick="var _e=document.getElementById(\'aii_letter\');if(_e){var _o=_e.style.display!==\'none\';_e.style.display=_o?\'none\':\'block\';this.querySelector(\'.aii-lt\').textContent=_o?\'📜 查看解读\':\'📜 收起解读\';}" style="padding:10px 14px;border-radius:12px;background:rgba(0,0,0,0.05);border:1px dashed var(--border);font-size:13px;color:var(--accent);cursor:pointer;margin-bottom:6px;user-select:none;-webkit-user-select:none;"><span class="aii-lt">📜 收起解读</span></div><div id="aii_letter" style="display:block;padding:12px 14px;border-radius:12px;background:rgba(0,0,0,0.04);font-size:13px;color:var(--txt);line-height:1.7;word-break:break-all;margin-bottom:12px;">'+_aiEsc2+'</div>';
  }
  
  $('letter-detail-content').innerHTML=html;
  
  if(l.fid&&!l.myReply&&l.type==='received'){
    $('letter-detail-footer').innerHTML='<button class="btn-outline" onclick="hideOv(\'ov-letter-detail\')" style="flex:1;">关闭</button><button class="btn-outline" onclick="aiInterpretLetter(\''+l.id+'\')" style="flex:1;">📜 AI 解读</button><button class="btn" onclick="showReplyForm()" style="flex:1;background:#fdf8e8;color:#8b7355;border:1px solid #e8e0d0;">提笔回信</button>';
  }else{
    $('letter-detail-footer').innerHTML='<button class="btn-outline" onclick="hideOv(\'ov-letter-detail\')" style="flex:1;">关闭</button><button class="btn-outline" onclick="aiInterpretLetter(\''+l.id+'\')" style="flex:1;">📜 AI 解读</button>';
  }
  
  showOv('ov-letter-detail');
}

// ★ AI 解读信件：结果保留在信件详情内（不弹窗），存到信数据重新打开仍在
function aiInterpretLetter(lid){
  var ll=ls(LL)||[];
  var l=ll.find(function(x){return x.id===lid});
  if(!l){toast('信件不存在');return;}
  var s=(typeof getApiSettings==='function')?getApiSettings():{enabled:false,apiKey:''};
  if(!s.enabled||!s.apiKey){
    var r=confirm('还没有接入 AI 接口，无法解读。\n\n请在 底部导航「设置」→「API 接口」中：\n1. 打开「启用 AI 解读」开关\n2. 填入 API 地址和 Key（如 DeepSeek）\n3. 保存后即可使用\n\n现在去配置吗？');
    if(r&&typeof openApiSettings==='function')openApiSettings();
    return;
  }
  var letterText=l.ct||'';
  if(l.partnerReply&&l.partnerReply.content)letterText+='\n[TA的回信] '+l.partnerReply.content;
  if(l.myReply&&l.myReply.content)letterText+='\n[我的信] '+l.myReply.content;
  if(!letterText){toast('信件内容为空');return;}
  // 标记解读中，保存并重渲染信件详情
  l.aiLoading=true;l.aiInterpret='';l.aiError='';
  ls(LL,ll);
  if(window.localforage)window.localforage.setItem(LL,ll).catch(function(){});
  openLetterDetail(lid);
  var genderText=getContactGender(l.fid)==='girl'?'女朋友':'男朋友';
  var personaText='';
  var contactPersona=getContactPersona(l.fid);
  if(contactPersona)personaText='\n【TA的完整人设】'+contactPersona;
  var systemPrompt='你是用户当前联系人的梦角TA——用户另一个世界的恋人（'+genderText+'）。不同联系人是不同的人、不同的梦角，你的人设和语气只属于当前联系人。\n'+
  AI_BASE_SETTING+personaText+'\n'+
  '【解读要求】用 100~200 字解读这段内容：字面意思 → 你真正想说的话 → 此刻的感受 → 给用户的一句话回应。用第二人称"你"对用户说话，第一人称"我"=你。';
  var userPrompt='这是TA（或你们之间）的一封信：「'+letterText+'」。请以TA的身份解读它想传达的意思。';
  fetch(s.baseUrl.replace(/\/+$/,'')+'/chat/completions',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+s.apiKey},
    body:JSON.stringify({model:s.model,messages:[{role:'system',content:systemPrompt},{role:'user',content:userPrompt}],max_tokens:500})
  }).then(function(res){
    if(!res.ok){throw new Error('HTTP '+res.status);}
    return res.json();
  }).then(function(data){
    var text=(data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||'';
    if(!text){throw new Error('返回为空');}
    var ll2=ls(LL)||[];
    var l2=ll2.find(function(x){return x.id===lid});
    if(l2){l2.aiInterpret=text;l2.aiLoading=false;l2.aiError='';ls(LL,ll2);if(window.localforage)window.localforage.setItem(LL,ll2).catch(function(){});}
    openLetterDetail(lid);
  }).catch(function(e){
    console.warn('AI letter interpret failed:',e);
    var ll3=ls(LL)||[];
    var l3=ll3.find(function(x){return x.id===lid});
    if(l3){l3.aiLoading=false;l3.aiError=String(e.message||e);l3.aiInterpret='';ls(LL,ll3);if(window.localforage)window.localforage.setItem(LL,ll3).catch(function(){});}
    openLetterDetail(lid);
    toast('AI 解读失败，请检查 API 配置');
  });
}
function showReplyForm(){  if(!currentLetter)return;
  var c=contacts.find(function(x){return x.id===currentLetter.fid});
  
  $('letter-detail-content').innerHTML='<div style="background:#f5efe0;border-radius:12px;border:1px solid #e8e0d0;overflow:hidden;">'+
    '<div style="height:6px;background:linear-gradient(90deg,#e8e0d0,rgba(139,115,85,0.2),#e8e0d0);"></div>'+
    '<div style="padding:20px 20px 16px;">'+
      '<div style="font-size:12px;color:var(--txt3);margin-bottom:12px;text-align:center;">给 '+ (c?c.name:'神秘人') +' 的回信</div>'+
      '<textarea id="reply-content-input" style="width:100%;height:200px;border:none;background:transparent;font-size:14px;color:var(--txt);line-height:32px;padding-left:8px;outline:none;resize:none;" placeholder="亲爱的，&#10;&#10;今天想跟你说..."></textarea>'+
    '</div>'+
  '</div>';
  
  $('letter-detail-footer').innerHTML='<button class="btn-outline" onclick="openLetterDetail(\''+currentLetter.id+'\')" style="flex:1;">取消</button><button class="btn" onclick="sendReply()" style="flex:1;background:#fdf8e8;color:#8b7355;border:1px solid #e8e0d0;">封 · 寄出</button>';
}

if($('write-letter-btn'))$('write-letter-btn').addEventListener('click',openNewEnvelopeForm);

function openNewEnvelopeForm(){
  $('env-partner-section').style.display='none';
  $('env-inbox-section').style.display='none';
  $('env-outbox-section').style.display='none';
  $('env-compose-form').style.display='flex';
  $('env-send-area').style.display='none';
  $('envelope-input').value='';
  
  var select=$('envelope-target-select');
  select.innerHTML='<option value="">请选择联系人</option>';
  var cs=contacts.filter(function(x){return x.id!=='fh'});
  cs.forEach(function(c){
    select.innerHTML+='<option value="'+c.id+'">'+c.name+'</option>';
  });
}

function cancelEnvelopeCompose(){
  $('env-compose-form').style.display='none';
  $('env-send-area').style.display='none';
  if(!currentLetterTab)currentLetterTab='partner';
  switchEnvTab(currentLetterTab);
}

if($('send-envelope'))$('send-envelope').addEventListener('click',function(){
  var content=$('envelope-input').value.trim();
  if(!content){toast('信件内容不能为空');return}
  
  var targetId=$('envelope-target-select').value;
  if(!targetId){toast('请选择要寄信的联系人');return}
  
  var target=contacts.find(function(x){return x.id===targetId});
  if(!target){toast('联系人不存在');return}
  
  var titles=['好久不见','最近还好吗','想你了','给你写了封信','深夜随想','一些想说的话'];
  var title=titles[Math.floor(Math.random()*titles.length)];
  
  var ll=ls(LL)||[];
  var letter={
    id:'l_'+Date.now(),
    tt:title,
    ct:content,
    fid:target.id,
    tm:Date.now(),
    r:true,
    type:'sent',
    myReply:{content:content,tm:Date.now()}
  };
  ll.unshift(letter);
  ls(LL,ll);
  if(window.localforage){
    try{window.localforage.setItem(LL,ll)}catch(e){}
  }
  
  // ★ 修复：我在聊天中插入"写信"系统消息（与TA写信的提示对应）
  try{
    var myMsgs=msgs(target.id);
    myMsgs.push({
      id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),
      s:SELF,
      t:'你给'+(target.name||target.nickname||'联系人')+'写了一封信',
      ts:new Date(),
      read:true,
      isSystem:true,
      isLetter:true,
      letterId:letter.id
    });
    savemsgs(target.id,myMsgs);
    if(target.id===window.currentCid){renderMsgs();}
    renderChatList();
  }catch(e){console.warn('send letter sys msg failed:',e);}
  
  toast('信件已寄出');
  cancelEnvelopeCompose();
  renderEnvOutboxList();
});

function renderLetters(){
  var ll=ls(LL)||[],el=$('letters-scroll');if(!el)return;
  
  var filtered=ll.filter(function(l){
    l.type=l.type||'received';
    if(currentLetterContact!=='all'&&l.fid!==currentLetterContact){
      return false;
    }
    if(currentLetterCategory==='replied'){
      return l.myReply&&l.type==='received';
    }
    if(currentLetterCategory==='sent'){
      return l.type==='sent';
    }
    return true;
  });
  
  if(!filtered.length){
    if(currentLetterContact==='all'){
      el.innerHTML='<div class="empty">✉<br><span style="font-size:12px;color:var(--txt3)">暂无信件</span></div>';
    }else{
      var c=contacts.find(function(x){return x.id===currentLetterContact});
      el.innerHTML='<div class="empty">✉<br><span style="font-size:12px;color:var(--txt3)">与'+(c?c.name:'联系人')+'暂无信件</span></div>';
    }
    return;
  }
  
  el.innerHTML=filtered.map(function(l){var c=contacts.find(function(x){return x.id===l.fid});
    l.type=l.type||'received';
    var ico=l.type==='sent'?'✉':'📬';
    var senderName=l.senderName||(c?c.name:null)||'神秘人';
    var fromText=l.type==='sent'?'寄给 '+senderName:'来自 '+senderName;
    var status='';
    if(l.replyTo){
      var origLetter=filtered.find(function(x){return x.id===l.replyTo})||(ls(LL)||[]).find(function(x){return x.id===l.replyTo});
      if(origLetter){
        status='<span style="font-size:10px;color:var(--accent);margin-left:4px">↩ 回复 '+origLetter.tt+'</span>';
      }else{
        status='<span style="font-size:10px;color:var(--accent);margin-left:4px">↩ 回复</span>';
      }
    }else if(l.partnerReply)status='<span style="font-size:10px;color:var(--accent);margin-left:4px">↩ 对方已回复</span>';
    else if(l.myReply&&l.type==='received')status='<span style="font-size:10px;color:var(--txt3);margin-left:4px">↪ 已回信</span>';
    else if(l.type==='sent')status='<span style="font-size:10px;color:var(--txt3);margin-left:4px">✉ 已寄出</span>';
    return'<div class="letter-item'+(l.r?'':' unread')+'" data-lid="'+l.id+'"><div class="l-ico">'+ico+'</div><div class="l-info"><div class="l-from">'+fromText+'</div><div class="l-title">'+l.tt+status+'</div></div><div class="l-time">'+flt(l.tm)+'</div></div>'}).join('');
  el.querySelectorAll('.letter-item').forEach(function(it){it.addEventListener('click',function(){openLetter(this.dataset.lid)})});
}
var currentLetter=null;
var _letterFromChat=false; // ★ 标记当前信件是否从聊天页打开（true=聊天回信不跳转信箱）
function openLetter(lid){
  _letterFromChat=false; // ★ openLetter 用于信箱列表，回信后应跳转回信箱页
  openContactLetterDetail(lid);
}
function generateLetterContent(cid){
  var maxCards=getSpeed('ld-max-cards');
  var kaomojiEn=getSpeed('ld-kaomoji-en',cid);
  var emojiEn=getSpeed('ld-emoji-en',cid);
  var stickerEn=getSpeed('ld-sticker-en',cid);
  var cards=globalCards.filter(function(x){
    if(!x.content||!x.content.trim())return false;
    if(x.category==='voices')return false;
    if(!kaomojiEn&&x.category==='kaomoji')return false;
    if(!emojiEn&&x.category==='emojis')return false;
    if(!stickerEn&&x.category==='stickers')return false;
    if(x.type==='public')return true;
    if(x.type==='private'&&x.contactId===cid)return true;
    return false;
  });
  // 默认通用字卡（写信场景，各分类独立概率已在getDefaultCommonCardsForContact中处理）
  if(defaultCommonEnabled&&defaultCommonAllContacts&&defaultCommonUseLetter){
    var dcCards=getDefaultCommonCardsForContact(cid);
    if(dcCards.length>0){
      dcCards.forEach(function(text){
        cards.push({content:text,category:'custom',type:'default_common'});
      });
    }
  }
  if(!cards.length){
    return '最近总是想起我们以前聊的那些。时间过得真快，但有些东西没变。给我回信吧，或者直接来找我聊天。';
  }
  var shuffled=cards.sort(function(){return Math.random()-0.5});
  var count=Math.max(1,Math.floor(Math.random()*maxCards));
  var selected=shuffled.slice(0,Math.min(count,shuffled.length));
  return selected.map(function(c){
    if(c.category==='stickers'){
      return '[STICKER]'+c.content+'[/STICKER]';
    }
    return c.content;
  }).join(' ');
}
function renderLetterContent(text){
  if(!text)return '';
  var parts=text.split(/\[STICKER\]/);
  var html='';
  parts.forEach(function(part,idx){
    if(idx===0){
      html+=part.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }else{
      var endIdx=part.indexOf('[/STICKER]');
      if(endIdx>=0){
        var imgSrc=part.substring(0,endIdx);
        var rest=part.substring(endIdx+11);
        html+='<img src="'+imgSrc+'" class="letter-sticker">';
        html+=rest.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      }else{
        html+=part.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      }
    }
  });
  return html;
}
function maybeGenLetter(){
  var cs=contacts.filter(function(x){return x.id!=='fh'});if(!cs.length)return;
  // ★★ 修复：真正按"最短~最长写信时间"间隔触发，而不是每30秒抽签
  // 记录全局下一次可写信时间戳，未到时间不抽签
  var _nextKey='ml2_letter_next_write_time';
  var _next=ls(_nextKey)||0;
  var _nowTs=Date.now();
  if(_next>0&&_nowTs<_next)return; // 还没到下次写信时间
  // 已有排期中（未发出）的计划信时跳过
  try{
    var _pending=ls(LL)||[];
    for(var _pi=0;_pi<_pending.length;_pi++){
      if(_pending[_pi]&&_pending[_pi]._pendingWrite){
        // 若排期超过 24 小时仍未发出（应用关闭等异常），视为过期可重新排期
        if(_pending[_pi]._pendingWriteAt&&_nowTs-_pending[_pi]._pendingWriteAt>24*60*60*1000){
          continue;
        }
        return;
      }
    }
  }catch(e){}
  var sender=cs[Math.floor(Math.random()*cs.length)],tts=['好久不见','最近还好吗','想你了','给你写了封信','深夜随想','一些想说的话'];
  var writeProb=getSpeed('ld-write-prob',sender.id);if(Math.random()*100>writeProb)return;
  var ct=generateLetterContent(sender.id);
  var minDelay=getSpeed('ld-write-min',sender.id)*60000;
  var maxDelay=getSpeed('ld-write-max',sender.id)*60000;
  if(!minDelay||!maxDelay||maxDelay<minDelay){maxDelay=minDelay+60000;}
  var delay=minDelay+Math.random()*(maxDelay-minDelay);
  // 无论是否最终命中，先设置下次可写信时间 = 当前 + 随机间隔，保证间隔真正生效
  var _nextDelay=minDelay+Math.random()*(maxDelay-minDelay);
  ls(_nextKey,_nowTs+_nextDelay);
  if(window.localforage){try{window.localforage.setItem(_nextKey,_nowTs+_nextDelay)}catch(e){}}
  // 预登记：标记这封信处于"排期中"，避免重复触发
  var _letterId='l_'+Date.now();
  try{
    var _ll=ls(LL)||[];
    _ll.unshift({id:_letterId,fid:sender.id,_pendingWrite:true,_pendingWriteAt:Date.now()});
    ls(LL,_ll);
    if(window.localforage){try{window.localforage.setItem(LL,_ll)}catch(e){}}
  }catch(e){}
  setTimeout(function(){
    // 修复：延迟回调用 try/catch 包裹，避免抛错时无法被外层定时器捕获
    try{
    var ll=ls(LL)||[];var l={id:_letterId,fid:sender.id,senderName:sender.name,tt:tts[Math.floor(Math.random()*tts.length)],ct:ct,tm:Date.now(),r:false,replied:false,type:'received',myReply:null,partnerReply:null};ll.unshift(l);ls(LL,ll);if(window.localforage){try{window.localforage.setItem(LL,ll)}catch(e){}}updateBadges();renderLetters();
    // 清除同 id 的排期假条目（_pendingWrite）
    try{
      var _ll2=ls(LL)||[];
      _ll2=_ll2.filter(function(x){return !(x&&x._pendingWrite&&x.id===_letterId)});
      ls(LL,_ll2);
      if(window.localforage){try{window.localforage.setItem(LL,_ll2)}catch(e){}}
    }catch(e){}

    // 在聊天中插入系统消息
    var contactMsgs=msgs(sender.id);
    contactMsgs.push({
      id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),
      s:OTHER,
      t:(sender.name||sender.nickname||'联系人')+'给你写了一封信',
      ts:new Date(),
      read:(sender.id===window.currentCid),
      isSystem:true,
      isLetter:true,
      letterId:l.id
    });
    savemsgs(sender.id,contactMsgs);
    if(sender.id===window.currentCid){renderMsgs();}
    renderChatList();
    }catch(e){console.warn('maybeGenLetter delayed callback error:',e);}
    },delay);
}
function showReplyInput(){
  if($('reply-section'))$('reply-section').style.display='flex';
  if($('reply-btn-section'))$('reply-btn-section').style.display='none';
  
  if(currentLetter&&currentLetter.ct&&$('reply-original-letter')){
    $('reply-original-letter').style.display='block';
    if($('reply-original-content'))$('reply-original-content').textContent=currentLetter.ct;
  }else if($('reply-original-letter')){
    $('reply-original-letter').style.display='none';
  }
  
  setTimeout(function(){
    if($('reply-content-input'))$('reply-content-input').focus();
  },100);
}
function cancelReply(){
  if($('reply-section'))$('reply-section').style.display='none';
  if($('reply-original-letter'))$('reply-original-letter').style.display='none';
  if($('reply-btn-section'))$('reply-btn-section').style.display=(currentLetter&&currentLetter.fid&&!currentLetter.replied)?'block':'none';
  if($('reply-content-input'))$('reply-content-input').value='';
}

// ★ 执行联系人回信确认（partnerReply 写入 + 聊天系统消息）
function completeLetterReply(contactId,letterId){
  try{
    var ll=ls(LL)||[];
    var lidx=ll.findIndex(function(x){return x.id===letterId});
    if(lidx<0)return;
    if(ll[lidx].partnerReply)return; // 已回信过
    var replyMessages=['收到你的回信了，很开心','谢谢你的回信','你的信我看了，很感动','看到你的回信了，真好','你的心意我收到了'];
    ll[lidx].partnerReply={content:replyMessages[Math.floor(Math.random()*replyMessages.length)],tm:Date.now()};
    ll[lidx]._replyPending=false;
    ll[lidx]._replyScheduledAt=null;
    ls(LL,ll);
    if(window.localforage){try{window.localforage.setItem(LL,ll)}catch(e){}}
    // 聊天系统消息
    try{
      var c=contacts.find(function(x){return x.id===contactId});
      var contactMsgs2=msgs(contactId);
      contactMsgs2.push({
        id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),
        s:OTHER,
        t:(c?c.name||c.nickname:'联系人')+'回复了你的信',
        ts:new Date(),
        read:(contactId===window.currentCid),
        isSystem:true,
        isLetter:true,
        letterId:letterId
      });
      savemsgs(contactId,contactMsgs2);
      if(contactId===window.currentCid){renderMsgs();}
      renderChatList();
    }catch(e){console.warn('reply confirm sys msg failed:',e);}
  }catch(e){console.warn('completeLetterReply error:',e);}
}

// ★ 定期检查：刷新/重开后补触发已到点的计划回信（解决 setTimeout 刷新丢失问题）
function checkPendingLetterReplies(){
  try{
    var ll=ls(LL)||[];
    var now=Date.now();
    ll.forEach(function(l){
      if(l&&l._replyPending&&l._replyScheduledAt&&now>=l._replyScheduledAt&&l.fid){
        completeLetterReply(l.fid,l.id);
      }
    });
  }catch(e){console.warn('checkPendingLetterReplies error:',e);}
}
// 启动检查器：每 30 秒检查一次到点的计划回信
try{setInterval(function(){try{checkPendingLetterReplies();}catch(e){}},30000);}catch(e){}

function sendReply(){
  if(!currentLetter){toast('出错了，请重试');return;}
  var content=$('reply-content-input').value.trim();
  if(!content){
    toast('请输入回信内容');
    return;
  }
  var c=contacts.find(function(x){return x.id===currentLetter.fid});
  var originalLetterId=currentLetter.id;
  var originalTitle=currentLetter.tt;
  currentLetter.replied=true;
  currentLetter.myReply={content:content,tm:Date.now()};
  
  var ll=ls(LL)||[];
  var idx=ll.findIndex(function(x){return x.id===currentLetter.id});
  if(idx>-1){
    ll[idx]=currentLetter;
  }
  
  var replyLetter={
    id:'l_'+Date.now()+'_r',
    tt:'回复：'+originalTitle,
    ct:content,
    fid:currentLetter.fid,
    tm:Date.now(),
    r:true,
    type:'sent',
    myReply:{content:content,tm:Date.now()},
    replyTo:originalLetterId,
    replyToTitle:originalTitle
  };
  ll.unshift(replyLetter);
  
  ls(LL,ll);
  if(window.localforage){try{window.localforage.setItem(LL,ll)}catch(e){}}
  
  renderLetters();
  if(currentProfileContactId){
    renderContactLetterHistory(currentProfileContactId);
  }
  if($('reply-content-input'))$('reply-content-input').value='';
  
  // 信箱清理
  if($('env-compose-form'))$('env-compose-form').style.display='none';
  hideOv('ov-letter-detail');
  try{switchEnvTab('outbox');}catch(e){}
  
  // 联系人根据信箱设置回信
  if(c){
    var replyProb=getSpeed('ld-reply-prob',c.id);
    if(Math.random()*100<replyProb){
      // ★ 修复：回信确认改为"计划时间"持久化——按设定的回信时间延迟，且刷新/重开不丢失
      // 原 setTimeout 方案刷新页面后定时器消失，导致永远看不到二次回信
      var replyMin=getSpeed('ld-reply-min',c.id)*60000;
      var replyMax=getSpeed('ld-reply-max',c.id)*60000;
      var replyDelay=replyMin+Math.random()*(replyMax-replyMin);
      var scheduledAt=Date.now()+replyDelay;
      var letterId=originalLetterId;
      // 把计划回信时间写入信件数据（持久化），由定时检查触发
      var ll3=ls(LL)||[];
      var lidx3=ll3.findIndex(function(x){return x.id===letterId});
      if(lidx3>-1){
        ll3[lidx3]._replyScheduledAt=scheduledAt;
        ll3[lidx3]._replyPending=true;
        ls(LL,ll3);
        if(window.localforage){try{window.localforage.setItem(LL,ll3)}catch(e){}}
      }
      // 定时器：到点执行回信（即使页面刷新，也会由 checkPendingLetterReplies 补触发）
      setTimeout(function(){
        try{
          completeLetterReply(c.id,letterId);
        }catch(e){console.warn('scheduled reply error:',e);}
      },replyDelay);
    }
  }
  
  if(currentProfileContactId){
    renderContactLetterHistory(currentProfileContactId);
  }
  
  // ★ 修复：我在聊天中插入"回信"系统消息（与TA回信的提示对应）
  try{
    var myReplyMsgs=msgs(c?c.id:currentLetter.fid);
    myReplyMsgs.push({
      id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),
      s:SELF,
      t:'你回复了'+(c?c.name||c.nickname||'联系人':'联系人')+'的信',
      ts:new Date(),
      read:true,
      isSystem:true,
      isLetter:true,
      letterId:replyLetter.id
    });
    savemsgs(c?c.id:currentLetter.fid,myReplyMsgs);
    if((c?c.id:currentLetter.fid)===window.currentCid){renderMsgs();}
    renderChatList();
  }catch(e){console.warn('send reply sys msg failed:',e);}
  
  toast('回信已寄出');
  // ★ 修复：从聊天页回信时不跳转信箱页；从信箱页回信才跳转（保持原行为）
  if(!_letterFromChat){
    showPg('pg-letters');
    switchEnvTab('partner');
  }
}

function openContactTopbarSettings(){
  showPg('pg-contact-topbar-settings');
}

function openContactTopbarOrder(){
  renderCustomContactOrderList();
  showOv('ov-contact-topbar-order');
  $('contact-topbar-order-save-btn')&&($('contact-topbar-order-save-btn').onclick=function(){saveContactOrder();hideOv('ov-contact-topbar-order')});
  $('contact-topbar-order-reset-btn')&&($('contact-topbar-order-reset-btn').onclick=function(){resetContactOrder()});
}

function openReplySettings(){
  showPg('pg-reply-settings');
}

// ---------- My page ----------
function bindMyPageEvents(){
  var els=[
    
    ['topbar-settings-btn',openContactTopbarSettings],
    ['call-settings-btn',function(){renderCallSettings();showOv('ov-call-settings')}],
    ['touch-settings-btn',openTouchSettings],
    ['settings-btn',openCardSettings],
    ['mood-cards-settings-btn',openMoodCardsSettings],
    ['reply-settings-btn',openReplySettings],
    ['dnd-settings-btn',openDndSettings],
    ['api-settings-btn',openApiSettings],
    ['sound-btn',openSoundSettings],
    ['export-data-btn',async function(){
      // ★ 导出确认：Via 等浏览器 customConfirm 动态弹窗可能不渲染，用原生 confirm 保证可靠
      var confirmed=false;
      try{
        if(typeof confirm==='function'&&/via|ucbrowser|baiduboxapp/i.test(navigator.userAgent)){
          confirmed=confirm('确定导出数据？将生成一个包含全部数据（聊天记录、联系人、字卡、设置等）的文件，请妥善保存。');
        }else{
          confirmed=await customConfirm('确定导出数据？将生成一个包含全部数据（聊天记录、联系人、字卡、设置等）的文件，请妥善保存。');
        }
      }catch(e){confirmed=confirm('确定导出数据？将生成一个包含全部数据的备份文件，请妥善保存。');}
      if(confirmed){
        try{
          toast('正在导出，请稍候...');
          // ★ 必须 await：exportData 是异步的，不等待会导致 iOS 失去用户手势上下文，下载/分享被拒绝
          await exportData();
        }catch(e){console.error('export failed:',e);toast('导出失败，请重试');}
      }
    }],
    

    ['clear-cache-btn',async function(){
      if(window._clearingData)return;
      window._clearingData=true;
      try{
        var confirmed=await customConfirm('确定清除所有数据？包括联系人、聊天记录、信箱、朋友圈等，且无法恢复。');
        if(!confirmed){window._clearingData=false;return;}
        try{if(window.indexedDB)indexedDB.deleteDatabase('StarDB')}catch(e){}
        if(window.localforage){
          await window.localforage.clear().catch(function(){});
          localStorage.clear();
          sessionStorage.clear();
          try{if(window.indexedDB)indexedDB.deleteDatabase('StarDB')}catch(e){}
          try{if(window.indexedDB)indexedDB.deleteDatabase('Star')}catch(e){}
          location.reload();
        }else{
          localStorage.clear();
          sessionStorage.clear();
          try{if(window.indexedDB)indexedDB.deleteDatabase('StarDB')}catch(e){}
          try{if(window.indexedDB)indexedDB.deleteDatabase('Star')}catch(e){}
          location.reload();
        }
      }catch(e){window._clearingData=false;}
    }],
    ['keep-alive-btn',toggleKeepAlive],
    ['push-notify-btn',togglePushNotify],
    ['fullscreen-mode-btn',toggleFullscreenMode],
    ['night-mode-btn',toggleNightMode],
    ['pwa-install-btn',function(){
      // ★ PWA 安装：Chrome/Edge 走 beforeinstallprompt；iOS 提示用 Safari"添加到主屏幕"
      var ok=false;
      try{ if(window.__promptInstall) ok=window.__promptInstall(); }catch(e){}
      if(!ok){
        if(/iPhone|iPad|iPod/i.test(navigator.userAgent)){
          toast('iOS 请用 Safari 打开后：分享 → 添加到主屏幕');
        }else{
          toast('当前浏览器暂不支持安装，请用 Chrome 打开后点右上角菜单 → 安装应用');
        }
      }
    }],
    ['custom-settings-back',function(){hideCustomSettings()}],
    ['custom-settings-add-btn',addCustomCard],
    ['custom-settings-dedup-btn',clearDuplicateCards],
    ['custom-settings-clear-btn',clearCustomCards],
    ['custom-tab-public',function(){switchCustomType('public')}],
    ['custom-tab-private',function(){switchCustomType('private')}],
    
    ['topbar-settings-back',function(){showPg('pg-my')}],
    ['add-nav-card-btn',function(){addNavCard()}],
    ['add-nav-group-btn',function(){
      var name=prompt('请输入分组名称：');
      if(!name||!name.trim())return;
      name=name.trim();
      if(name.length>20){toast('分组名称不能超过20个字符');return}
      var isSentence=/[，。！？；：、\.\?!;:]/.test(name);
      if(isSentence&&name.length>6){toast('分组名称不能是句子');return}
      cardGroups.push({id:'g_'+Date.now(),name:name,category:navCardCurrentCategory,type:navCardCurrentType,contactId:navCardCurrentType==='private'?navCardCurrentContact:null});
      saveCardGroups();
      renderNavCardGroupTags();
      toast('分组已添加');
    }],
    ['export-nav-cards-btn',exportNavCards],
    ['import-nav-cards-btn',function(){$('nav-card-file-input').click()}],
    ['nav-card-import-btn',importNavCardsFromText],
    ['open-nav-batch-import-btn',function(){openCardBatchImportModal('nav')}],
    ['nav-card-clear-btn',clearNavCards],
    
    ['reply-settings-back',function(){showPg('pg-my')}],
    ['reply-speed-btn',function(){openSpeedSettings()}],
    ['reply-moments-btn',function(){showMomentsSettings()}],
    ['reply-letter-btn',function(){showLetterSettings()}],
    ['reply-noninstant-btn',function(){openNonInstantSettings()}]
  ];
  els.forEach(function(item){
    var el=$(item[0]);
    if(el){
      var _lastTouchFire=0;
      el.addEventListener('click',function(e){
        // ★ 修复：touchend 已触发过则跳过 click，防止 Via 等浏览器双触发导致弹窗/页面卡顿
        if(Date.now()-_lastTouchFire<500){return;}
        if(isSwipe()){_tsM=false;return;}
        item[1]();
      });
      el.addEventListener('touchend',function(e){
        if(isSwipe()){
          _tsM=false;
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        _lastTouchFire=Date.now();
        item[1]();
      });
    }
  });
  
  // ★ PWA 可安装时显示"安装到桌面"按钮
  try{
    if(window.__deferredInstallPrompt){
      var _installBtn=$('pwa-install-btn');
      if(_installBtn)_installBtn.style.display='flex';
    }
    window.addEventListener('pwa-installable',function(){
      var _installBtn=$('pwa-install-btn');
      if(_installBtn)_installBtn.style.display='flex';
    });
  }catch(e){}
  
  var importBtn=$('import-data-btn');
  if(importBtn){
    importBtn.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      // ★ iOS Safari 修复：动态创建可见的 file input（display:none 的 input.click() 在 iOS 上无法弹出选择器）
      try{
        var dyn=document.createElement('input');
        dyn.type='file';
        dyn.accept='.json,application/json';
        dyn.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;opacity:0;z-index:999999;';
        dyn.addEventListener('change',function(){
          var file=dyn.files&&dyn.files[0];
          try{document.body.removeChild(dyn);}catch(e){}
          if(file)handleImportFile(file);
        });
        dyn.addEventListener('cancel',function(){try{document.body.removeChild(dyn);}catch(e){}});
        document.body.appendChild(dyn);
        dyn.click();
      }catch(e2){
        // 降级：用原有隐藏 input
        var importInput=$('import-data-input');
        if(importInput){importInput.value='';importInput.click();}
      }
    });
    importBtn.addEventListener('touchstart',function(e){
      this._touchStartTime=Date.now();
    });
    importBtn.addEventListener('touchend',function(e){
      if(this._touchStartTime&&Date.now()-this._touchStartTime>=800){
        e.preventDefault();
        e.stopPropagation();
        openImportPaste();
      }
      this._touchStartTime=null;
    });
    importBtn.addEventListener('touchmove',function(){
      this._touchStartTime=null;
    });
  }
  
  // 清除数据按钮：移动端统一 touch 事件确保可靠触发
  var clearBtn=$('clear-cache-btn');
  if(clearBtn){
    var clearHandler=async function(){
      var confirmed=await customConfirm('确定清除所有数据？包括联系人、聊天记录、信箱、朋友圈等，且无法恢复。');
      if(!confirmed)return;
      try{if(window.indexedDB)indexedDB.deleteDatabase('StarDB')}catch(e){}
      if(window.localforage){
        window.localforage.clear().then(function(){
          localStorage.clear();
          sessionStorage.clear();
          try{if(window.indexedDB)indexedDB.deleteDatabase('StarDB')}catch(e){}
          try{if(window.indexedDB)indexedDB.deleteDatabase('Star')}catch(e){}
          location.reload();
        }).catch(function(){
          localStorage.clear();
          sessionStorage.clear();
          try{if(window.indexedDB)indexedDB.deleteDatabase('StarDB')}catch(e){}
          try{if(window.indexedDB)indexedDB.deleteDatabase('Star')}catch(e){}
          location.reload();
        });
      }else{
        localStorage.clear();
        sessionStorage.clear();
        try{if(window.indexedDB)indexedDB.deleteDatabase('StarDB')}catch(e){}
        try{if(window.indexedDB)indexedDB.deleteDatabase('Star')}catch(e){}
        location.reload();
      }
    };
    // 直接用 touchend 触发，不依赖 touchstart 状态
    clearBtn.addEventListener('touchend',function(e){
      if(window._clearingData)return;
      e.preventDefault();
      e.stopPropagation();
      clearHandler();
    });
    // 阻止 touchmove 取消触发
    clearBtn.addEventListener('touchmove',function(e){
      e.preventDefault();
    });
  }
  
  }

var navCardCurrentType='public';
var navCardCurrentContact=null;
var navCardCurrentCategory='all';
var navCardCurrentGroup='all';
var navCardGroups={public:['默认'],private:{}};
var navCardCollapsedGroups={};
var navBatchSelectedCards=[];

async function loadNavCardGroups(){
  if(window.localforage){
    try{
      var saved=await window.localforage.getItem('ml2_nav_card_groups');
      if(saved){
        try{navCardGroups=JSON.parse(saved)}catch(e){}
      }
    }catch(e){}
  }
  // localStorage fallback
  var localStored=ls('ml2_nav_card_groups');
  if(localStored&&typeof localStored==='object'){
    navCardGroups=localStored;
  }
  // 迁移：清理"分类名"残留——天气/时间/对方状态/空闲状态/心情是分类，不应作为分组
  var catNames=['天气','时间','对方状态','空闲状态','心情'];
  if(navCardGroups&&navCardGroups.public&&Array.isArray(navCardGroups.public)){
    navCardGroups.public=navCardGroups.public.filter(function(g){return catNames.indexOf(g)<0});
    if(navCardGroups.public.length===0)navCardGroups.public=['默认'];
  }
  if(navCardGroups&&navCardGroups.private&&typeof navCardGroups.private==='object'){
    var pk=Object.keys(navCardGroups.private);
    pk.forEach(function(k){
      if(Array.isArray(navCardGroups.private[k])){
        navCardGroups.private[k]=navCardGroups.private[k].filter(function(g){return catNames.indexOf(g)<0});
        if(navCardGroups.private[k].length===0)navCardGroups.private[k]=['默认'];
      }
    });
  }
  saveNavCardGroups();
}

function saveNavCardGroups(){
  ls('ml2_nav_card_groups',navCardGroups);
  if(window.localforage){
    try{window.localforage.setItem('ml2_nav_card_groups',navCardGroups).catch(function(){});}catch(e){}
  }
}

// 首次使用时自动播种默认公开字卡
var _defaultNavCards=[
  // 天气
  {content:'晴天',group:'默认',category:'weather'},{content:'多云',group:'默认',category:'weather'},{content:'阴天',group:'默认',category:'weather'},{content:'下雨了',group:'默认',category:'weather'},{content:'小雨',group:'默认',category:'weather'},{content:'大雨',group:'默认',category:'weather'},{content:'下雪了',group:'默认',category:'weather'},{content:'小雪',group:'默认',category:'weather'},{content:'中雪',group:'默认',category:'weather'},{content:'大雪',group:'默认',category:'weather'},{content:'暴雪',group:'默认',category:'weather'},{content:'起雾了',group:'默认',category:'weather'},{content:'大雾',group:'默认',category:'weather'},{content:'雷阵雨',group:'默认',category:'weather'},{content:'打雷了',group:'默认',category:'weather'},{content:'风大',group:'默认',category:'weather'},{content:'雨停了',group:'默认',category:'weather'},{content:'雪停了',group:'默认',category:'weather'},{content:'雾散了',group:'默认',category:'weather'},{content:'天晴了',group:'默认',category:'weather'},{content:'太阳雨',group:'默认',category:'weather'},{content:'雨过天晴',group:'默认',category:'weather'},{content:'雨夹雪',group:'默认',category:'weather'},{content:'冻雨',group:'默认',category:'weather'},
  // 时间
  {content:'卯初（05:00–05:29）',group:'默认',category:'time'},{content:'卯正（05:30–06:29）',group:'默认',category:'time'},{content:'辰初（07:00–07:29）',group:'默认',category:'time'},{content:'辰正（07:30–08:29）',group:'默认',category:'time'},{content:'巳初（09:00–09:29）',group:'默认',category:'time'},{content:'巳正（09:30–10:29）',group:'默认',category:'time'},{content:'午初（11:00–11:29）',group:'默认',category:'time'},{content:'午正（11:30–12:29）',group:'默认',category:'time'},{content:'未初（13:00–13:29）',group:'默认',category:'time'},{content:'未正（13:30–14:29）',group:'默认',category:'time'},{content:'申初（15:00–15:29）',group:'默认',category:'time'},{content:'申正（15:30–16:29）',group:'默认',category:'time'},{content:'酉初（17:00–17:29）',group:'默认',category:'time'},{content:'酉正（17:30–18:29）',group:'默认',category:'time'},{content:'戌初（19:00–19:29）',group:'默认',category:'time'},{content:'戌正（19:30–20:29）',group:'默认',category:'time'},{content:'亥初（21:00–21:29）',group:'默认',category:'time'},{content:'亥正（21:30–22:29）',group:'默认',category:'time'},{content:'子初（23:00–23:29）',group:'默认',category:'time'},{content:'子正（23:30–00:29）',group:'默认',category:'time'},{content:'丑初（01:00–01:29）',group:'默认',category:'time'},{content:'丑正（01:30–02:29）',group:'默认',category:'time'},{content:'寅初（03:00–03:29）',group:'默认',category:'time'},{content:'寅正（03:30–04:29）',group:'默认',category:'time'},
  // 心情状态
  {content:'开心',group:'默认',category:'mood'},{content:'有点开心',group:'默认',category:'mood'},{content:'一般般',group:'默认',category:'mood'},{content:'不太开心',group:'默认',category:'mood'},{content:'难过',group:'默认',category:'mood'},{content:'生气',group:'默认',category:'mood'},{content:'烦躁',group:'默认',category:'mood'},{content:'累',group:'默认',category:'mood'},{content:'困',group:'默认',category:'mood'},{content:'无聊',group:'默认',category:'mood'},{content:'想说话',group:'默认',category:'mood'},{content:'不想说话',group:'默认',category:'mood'},{content:'紧张',group:'默认',category:'mood'},{content:'安心',group:'默认',category:'mood'},{content:'委屈',group:'默认',category:'mood'},{content:'懵',group:'默认',category:'mood'},{content:'平静',group:'默认',category:'mood'},{content:'兴奋',group:'默认',category:'mood'},{content:'害怕',group:'默认',category:'mood'},{content:'期待',group:'默认',category:'mood'},{content:'失落',group:'默认',category:'mood'},{content:'满足',group:'默认',category:'mood'},{content:'尴尬',group:'默认',category:'mood'},{content:'害羞',group:'默认',category:'mood'},{content:'骄傲',group:'默认',category:'mood'},{content:'自卑',group:'默认',category:'mood'},{content:'柔软',group:'默认',category:'mood'},{content:'坚硬',group:'默认',category:'mood'},{content:'空空的',group:'默认',category:'mood'},{content:'满满的',group:'默认',category:'mood'},
  // 空闲状态
  {content:'空闲',group:'默认',category:'idle'},{content:'很闲',group:'默认',category:'idle'},{content:'有点闲',group:'默认',category:'idle'},{content:'不忙',group:'默认',category:'idle'},{content:'忙',group:'默认',category:'idle'},{content:'有点忙',group:'默认',category:'idle'},{content:'很忙',group:'默认',category:'idle'},{content:'刚忙完',group:'默认',category:'idle'},{content:'没事',group:'默认',category:'idle'},{content:'有事',group:'默认',category:'idle'},{content:'在等',group:'默认',category:'idle'},{content:'在躺',group:'默认',category:'idle'},{content:'在坐',group:'默认',category:'idle'},{content:'在走',group:'默认',category:'idle'},{content:'在吃',group:'默认',category:'idle'},{content:'在喝',group:'默认',category:'idle'},{content:'在听',group:'默认',category:'idle'},{content:'在看',group:'默认',category:'idle'},{content:'在发呆',group:'默认',category:'idle'},{content:'在放空',group:'默认',category:'idle'},{content:'在休息',group:'默认',category:'idle'},{content:'在摸鱼',group:'默认',category:'idle'},{content:'能聊',group:'默认',category:'idle'},{content:'只能一会儿',group:'默认',category:'idle'},{content:'随时断',group:'默认',category:'idle'},
  // 对方状态
  {content:'收到信息',group:'默认',category:'status'},{content:'看到消息',group:'默认',category:'status'},{content:'刚刚看到',group:'默认',category:'status'},{content:'正在查看',group:'默认',category:'status'},{content:'正在回复',group:'默认',category:'status'},{content:'回应中',group:'默认',category:'status'},{content:'回复稍慢',group:'默认',category:'status'},{content:'等待回复',group:'默认',category:'status'},{content:'准备回应',group:'默认',category:'status'},{content:'思考中',group:'默认',category:'status'},{content:'整理思绪',group:'默认',category:'status'},{content:'正在理解',group:'默认',category:'status'},{content:'确认想法',group:'默认',category:'status'},{content:'考虑中',group:'默认',category:'status'},{content:'回忆中',group:'默认',category:'status'},{content:'寻找答案',group:'默认',category:'status'},{content:'认真思考',group:'默认',category:'status'},{content:'认真倾听',group:'默认',category:'status'},{content:'继续倾听',group:'默认',category:'status'},{content:'等待交流',group:'默认',category:'status'},{content:'等待你说完',group:'默认',category:'status'},{content:'保持联系',group:'默认',category:'status'},{content:'交流中',group:'默认',category:'status'},{content:'继续回应',group:'默认',category:'status'},{content:'陪伴中',group:'默认',category:'status'},{content:'安静陪伴',group:'默认',category:'status'},{content:'默默关注',group:'默认',category:'status'},{content:'注意到了',group:'默认',category:'status'},{content:'记住了',group:'默认',category:'status'},{content:'关注你的话',group:'默认',category:'status'},{content:'保持关注',group:'默认',category:'status'},{content:'暂时安静',group:'默认',category:'status'},{content:'稍后回来',group:'默认',category:'status'},{content:'暂时离开',group:'默认',category:'status'},{content:'无法及时回应',group:'默认',category:'status'},{content:'给你空间',group:'默认',category:'status'}
];
var _oldDefaultNavCardsToRemove=[
  {content:'打雷了（怕怕）',category:'weather'},{content:'今天风刮的好大',category:'weather'},
  {content:'正在确认',category:'status'},{content:'等待你的话',category:'status'},{content:'准备交流',category:'status'},{content:'继续交流',category:'status'},{content:'正在等待',category:'status'},{content:'没有打扰',category:'status'},{content:'回应稍慢',category:'status'}
];

var _navCardsVersion='v2';

var _defaultMoodCards=[
  {group:'喜悦与正向',weight:30,cards:[{content:'开心',rarity:'normal'},{content:'快乐',rarity:'normal'},{content:'愉悦',rarity:'normal'},{content:'高兴',rarity:'normal'},{content:'满足',rarity:'normal'},{content:'幸福',rarity:'normal'},{content:'安心',rarity:'normal'},{content:'放松',rarity:'normal'},{content:'轻松',rarity:'normal'},{content:'温暖',rarity:'normal'},{content:'舒心',rarity:'normal'},{content:'欣慰',rarity:'normal'},{content:'愉快',rarity:'normal'},{content:'期待',rarity:'normal'},{content:'兴奋',rarity:'normal'},{content:'惊喜',rarity:'normal'},{content:'雀跃',rarity:'rare'},{content:'满足感',rarity:'normal'},{content:'充实',rarity:'normal'},{content:'踏实',rarity:'normal'},{content:'安心感',rarity:'normal'},{content:'幸运',rarity:'normal'},{content:'庆幸',rarity:'normal'},{content:'感激',rarity:'normal'},{content:'感动',rarity:'normal'},{content:'欣喜',rarity:'normal'},{content:'释然',rarity:'special'}]},
  {group:'亲近与爱意',weight:20,cards:[{content:'喜欢',rarity:'normal'},{content:'在意',rarity:'normal'},{content:'珍惜',rarity:'normal'},{content:'信任',rarity:'normal'},{content:'依赖',rarity:'normal'},{content:'亲近',rarity:'normal'},{content:'眷恋',rarity:'rare'},{content:'想念',rarity:'normal'},{content:'思念',rarity:'normal'},{content:'牵挂',rarity:'normal'},{content:'心软',rarity:'normal'},{content:'心疼',rarity:'normal'},{content:'怜惜',rarity:'normal'},{content:'宠溺',rarity:'rare'},{content:'偏爱',rarity:'normal'},{content:'包容',rarity:'normal'},{content:'纵容',rarity:'rare'},{content:'依恋',rarity:'normal'},{content:'舍不得',rarity:'rare'},{content:'想靠近',rarity:'normal'},{content:'想陪伴',rarity:'normal'},{content:'想照顾',rarity:'normal'},{content:'想保护',rarity:'normal'},{content:'想了解',rarity:'normal'},{content:'想回应',rarity:'normal'}]},
  {group:'悲伤与低落',weight:4,cards:[{content:'难过',rarity:'normal'},{content:'伤心',rarity:'normal'},{content:'失落',rarity:'normal'},{content:'遗憾',rarity:'normal'},{content:'孤单',rarity:'normal'},{content:'孤独',rarity:'normal'},{content:'寂寞',rarity:'normal'},{content:'委屈',rarity:'normal'},{content:'无奈',rarity:'normal'},{content:'疲惫',rarity:'normal'},{content:'疲倦',rarity:'normal'},{content:'低落',rarity:'normal'},{content:'沮丧',rarity:'normal'},{content:'失望',rarity:'normal'},{content:'心酸',rarity:'normal'},{content:'苦涩',rarity:'normal'},{content:'空虚',rarity:'normal'},{content:'迷茫',rarity:'normal'},{content:'迷失',rarity:'normal'},{content:'沉重',rarity:'normal'},{content:'压抑',rarity:'rare'},{content:'痛苦',rarity:'normal'},{content:'悲伤',rarity:'normal'},{content:'哀伤',rarity:'normal'},{content:'落寞',rarity:'normal'}]},
  {group:'愤怒与不满',weight:1,cards:[{content:'生气',rarity:'normal'},{content:'愤怒',rarity:'normal'},{content:'恼火',rarity:'normal'},{content:'烦躁',rarity:'normal'},{content:'不耐烦',rarity:'normal'},{content:'不满',rarity:'normal'},{content:'厌烦',rarity:'normal'},{content:'抗拒',rarity:'normal'},{content:'排斥',rarity:'normal'},{content:'恼怒',rarity:'normal'},{content:'气恼',rarity:'normal'},{content:'不甘',rarity:'normal'},{content:'嫉妒',rarity:'normal'},{content:'吃醋',rarity:'normal'},{content:'愤懑',rarity:'rare'},{content:'委屈',rarity:'normal'},{content:'赌气',rarity:'rare'},{content:'冷淡',rarity:'normal'},{content:'疏离',rarity:'rare'}]},
  {group:'不安与恐惧',weight:3,cards:[{content:'害怕',rarity:'normal'},{content:'恐惧',rarity:'normal'},{content:'担心',rarity:'normal'},{content:'忧虑',rarity:'normal'},{content:'焦虑',rarity:'normal'},{content:'紧张',rarity:'normal'},{content:'不安',rarity:'normal'},{content:'慌张',rarity:'normal'},{content:'慌乱',rarity:'normal'},{content:'害怕失去',rarity:'normal'},{content:'忐忑',rarity:'rare'},{content:'不知所措',rarity:'normal'},{content:'心慌',rarity:'normal'},{content:'压力',rarity:'normal'},{content:'担忧',rarity:'normal'},{content:'敏感',rarity:'normal'}]},
  {group:'害羞与社交情绪',weight:6,cards:[{content:'害羞',rarity:'normal'},{content:'不好意思',rarity:'normal'},{content:'脸红',rarity:'normal'},{content:'羞涩',rarity:'normal'},{content:'尴尬',rarity:'normal'},{content:'拘谨',rarity:'normal'},{content:'腼腆',rarity:'normal'},{content:'害臊',rarity:'rare'},{content:'紧张',rarity:'normal'},{content:'小心翼翼',rarity:'normal'},{content:'不自然',rarity:'normal'},{content:'犹豫',rarity:'normal'},{content:'迟疑',rarity:'normal'},{content:'想说又停下',rarity:'normal'}]},
  {group:'思考与复杂情绪',weight:10,cards:[{content:'疑惑',rarity:'normal'},{content:'困惑',rarity:'normal'},{content:'好奇',rarity:'normal'},{content:'惊讶',rarity:'normal'},{content:'意外',rarity:'normal'},{content:'震惊',rarity:'normal'},{content:'犹豫',rarity:'normal'},{content:'纠结',rarity:'normal'},{content:'矛盾',rarity:'normal'},{content:'迟疑',rarity:'normal'},{content:'怀疑',rarity:'normal'},{content:'不确定',rarity:'normal'},{content:'复杂',rarity:'normal'},{content:'说不清',rarity:'normal'},{content:'想不明白',rarity:'special'},{content:'若有所思',rarity:'rare'},{content:'沉思',rarity:'normal'},{content:'认真',rarity:'normal'},{content:'专注',rarity:'normal'}]},
  {group:'自我情绪',weight:1,cards:[{content:'骄傲',rarity:'normal'},{content:'自豪',rarity:'normal'},{content:'自信',rarity:'normal'},{content:'满足',rarity:'normal'},{content:'羞愧',rarity:'normal'},{content:'自责',rarity:'rare'},{content:'后悔',rarity:'normal'},{content:'内疚',rarity:'normal'},{content:'不甘心',rarity:'rare'},{content:'委屈自己',rarity:'special'},{content:'怀疑自己',rarity:'normal'},{content:'失落感',rarity:'special'},{content:'无力',rarity:'special'},{content:'疲惫感',rarity:'special'},{content:'释怀',rarity:'rare'},{content:'接受',rarity:'normal'},{content:'放下',rarity:'normal'}]},
  {group:'克制与隐藏',weight:8,cards:[{content:'平静',rarity:'normal'},{content:'冷静',rarity:'normal'},{content:'克制',rarity:'normal'},{content:'忍耐',rarity:'normal'},{content:'沉默',rarity:'normal'},{content:'压下情绪',rarity:'normal'},{content:'隐藏情绪',rarity:'normal'},{content:'假装平静',rarity:'special'},{content:'表面平静',rarity:'normal'},{content:'心里在意',rarity:'normal'},{content:'偷偷开心',rarity:'rare'},{content:'偷偷难过',rarity:'rare'},{content:'默默期待',rarity:'rare'},{content:'默默守护',rarity:'rare'},{content:'不愿表达',rarity:'normal'},{content:'不知道怎么说',rarity:'special'}]},
  {group:'中性与日常',weight:15,cards:[{content:'普通',rarity:'normal'},{content:'平常',rarity:'normal'},{content:'淡然',rarity:'normal'},{content:'随意',rarity:'normal'},{content:'自然',rarity:'normal'},{content:'放空',rarity:'normal'},{content:'发呆',rarity:'normal'},{content:'安静',rarity:'normal'},{content:'专注',rarity:'normal'},{content:'认真',rarity:'normal'},{content:'观察',rarity:'normal'},{content:'等待',rarity:'normal'},{content:'好奇',rarity:'normal'},{content:'期待中',rarity:'normal'},{content:'没有特别情绪',rarity:'normal'}]},
  {group:'特殊表达情绪',weight:2,cards:[{content:'想被理解',rarity:'normal'},{content:'想被看见',rarity:'normal'},{content:'想确认',rarity:'normal'},{content:'想解释',rarity:'normal'},{content:'想安慰你',rarity:'normal'},{content:'想陪着你',rarity:'normal'},{content:'想靠近一点',rarity:'normal'},{content:'舍不得离开',rarity:'special'},{content:'放心了',rarity:'normal'},{content:'安心下来',rarity:'normal'},{content:'松了一口气',rarity:'special'},{content:'忍不住开心',rarity:'rare'},{content:'忍不住在意',rarity:'rare'},{content:'藏着心事',rarity:'rare'},{content:'有话想说',rarity:'rare'},{content:'不知道怎么表达',rarity:'special'}]}
];

var _moodCardsVersion='v1';


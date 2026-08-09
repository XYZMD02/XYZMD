// ========== 联系人随机头像库 ==========
// 渲染头像库中的图片缩略图
function renderAvatarLibImages(){
  var container=$('avatar-lib-images');
  if(!container||!editingContact)return;
  var lib=editingContact.avatarLib||{enabled:false,avatarKeys:[],avatarChat:true,avatarMail:true,avatarMoment:true};
  var keys=lib.avatarKeys||[];
  container.innerHTML='';
  if(keys.length===0){
    container.innerHTML='<div style="font-size:11px;color:var(--txt3);width:100%;text-align:center;padding:8px;">暂无头像图片，请上传</div>';
    return;
  }
  keys.forEach(function(key,idx){
    var itemWrap=document.createElement('div');
    itemWrap.style.cssText='display:flex;flex-direction:column;align-items:center;gap:2px;';
    // 图片
    var imgWrap=document.createElement('div');
    imgWrap.style.cssText='position:relative;width:48px;height:48px;border-radius:8px;overflow:hidden;border:1px solid var(--border);cursor:pointer;';
    imgWrap.title='点击直接切换联系人头像';
    var imgEl=document.createElement('img');
    imgEl.style.cssText='display:block;width:100%;height:100%;object-fit:cover;';
    imgEl.alt='头像'+(idx+1);
    imgEl.addEventListener('click',function(e){
      e.stopPropagation();
      switchContactAvatarFromLib(idx);
    });
    imgWrap.appendChild(imgEl);
    itemWrap.appendChild(imgWrap);
    // 删除按钮（在图片下方，低可见度，手机端也可用）
    var delBtn=document.createElement('div');
    delBtn.style.cssText='font-size:10px;color:var(--txt3);cursor:pointer;padding:1px 4px;';
    delBtn.textContent='删除';
    delBtn.title='删除此图片';
    delBtn.addEventListener('click',function(e){e.stopPropagation();deleteAvatarLibImage(idx);});
    itemWrap.appendChild(delBtn);
    container.appendChild(itemWrap);
    // 异步加载图片数据
    if(window.localforage){
      window.localforage.getItem(key).then(function(data){
        if(data){imgEl.src=data;}
      }).catch(function(){});
    }
  });
}

// 从头像库直接切换联系人头像
async function switchContactAvatarFromLib(idx){
  if(!editingContact||!editingContact.avatarLib)return;
  var keys=editingContact.avatarLib.avatarKeys||[];
  if(idx<0||idx>=keys.length)return;
  var key=keys[idx];
  if(!window.localforage){toast('存储不可用');return;}
  // 先重置随机更换计时器（同步操作，确保在 saveContactEdit 之前生效）
  if(!editingContact.avatarLibLastChange){editingContact.avatarLibLastChange={chat:0,mail:0,moment:0};}
  if(!editingContact.avatarLibNextChange){editingContact.avatarLibNextChange={chat:0,mail:0,moment:0};}
  editingContact.avatarLibLastChange.chat=Date.now();
  editingContact.avatarLibNextChange.chat=1+Math.random()*7;
  try{
    var imgData=await window.localforage.getItem(key);
    if(imgData){
      // 检查是否与当前头像相同
      if(imgData===editingContact.avatar){
        return;
      }
      editingContact.avatar=imgData;
      saveC();
      var preview=$('contact-avatar-preview');
      if(preview)preview.innerHTML='<img src="'+imgData.replace(/"/g,'&quot;')+'">';
      renderChatList();
      if(cid===editingContact.id){renderMsgs();refreshNavDisplay();}
      toast('头像已切换');
    }
  }catch(e){console.warn('switchAvatarFromLib failed:',e);}
}

// 删除头像库中的一张图片
async function deleteAvatarLibImage(idx){
  if(!editingContact||!editingContact.avatarLib)return;
  var keys=editingContact.avatarLib.avatarKeys||[];
  if(idx<0||idx>=keys.length)return;
  var key=keys[idx];
  keys.splice(idx,1);
  // 从 localforage 删除图片数据
  if(window.localforage){
    try{await window.localforage.removeItem(key);}catch(e){}
  }
  renderAvatarLibImages();
  toast('已删除头像图片');
}

// 上传头像图片到头像库
async function addAvatarLibImages(files){
  if(!editingContact||!files||files.length===0)return;
  if(!editingContact.avatarLib){editingContact.avatarLib={enabled:false,avatarKeys:[],avatarChat:true,avatarMail:true,avatarMoment:true};}
  var lib=editingContact.avatarLib;
  if(!lib.avatarKeys)lib.avatarKeys=[];
  var maxImages=20;
  if(lib.avatarKeys.length>=maxImages){toast('最多上传'+maxImages+'张头像图片');return;}
  
  var added=0;
  // 将 FileList 转为数组，避免异步过程中被清空
  var fileArr=[];
  for(var i=0;i<files.length;i++){fileArr.push(files[i]);}
  
  for(var i=0;i<fileArr.length;i++){
    if(lib.avatarKeys.length>=maxImages)break;
    var file=fileArr[i];
    if(!file||!file.type||!file.type.match(/image\//))continue;
    try{
      await new Promise(function(resolve,reject){
        compressImage(file,1024,0.95,function(dataUrl){
          if(!dataUrl){reject(new Error('compressImage returned empty'));return;}
          var key='ml2_avatar_lib_'+editingContact.id+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
          lib.avatarKeys.push(key);
          // 保存到 localforage
          if(window.localforage){
            window.localforage.setItem(key,dataUrl).catch(function(e){console.warn('[avatarLib] save failed:',e);});
          }
          resolve();
        });
      });
      added++;
    }catch(e){console.warn('[avatarLib] compress failed for file:',file.name,e);}
  }
  if(added>0){
    renderAvatarLibImages();
    toast('已添加'+added+'张头像图片');
  }else{
    toast('未添加图片，请检查文件格式');
  }
}

// 头像库上传按钮事件（不使用 e.preventDefault()，避免取消用户手势导致文件选择器无法打开）
var _avatarLibTouchFired=false;
if($('avatar-lib-add-btn')){
  $('avatar-lib-add-btn').addEventListener('click',function(){
    if(_avatarLibTouchFired){_avatarLibTouchFired=false;return;}
    $('avatar-lib-input').click();
  });
  $('avatar-lib-add-btn').addEventListener('touchend',function(e){
    _avatarLibTouchFired=true;
    $('avatar-lib-input').click();
  });
}
if($('avatar-lib-input')){
  $('avatar-lib-input').addEventListener('change',function(e){
    if(e.target.files&&e.target.files.length>0){
      addAvatarLibImages(e.target.files);
    }
    e.target.value='';
  });
}

// 联系人随机更换头像（由定时器触发）
// 刷新机制与顶部栏字卡一致：每个联系人独立，聊天/信箱/朋友圈头像独立，更换间隔1-8小时
async function checkAvatarLibRefresh(){
  if(!contacts||!contacts.length)return;
  var now=Date.now();
  for(var i=0;i<contacts.length;i++){
    var c=contacts[i];
    if(!c.avatarLib||!c.avatarLib.enabled)continue;
    var keys=c.avatarLib.avatarKeys;
    if(!keys||keys.length===0)continue;
    
    // 初始化各类型最后更换时间和下次更换时间（独立）
    // 与顶部栏字卡机制一致：初始lastChange=0, nextChange=0，首次检查立即触发，之后1-8小时更换一次
    // 兼容旧数据：avatarLibLastChange/avatarLibNextChange 可能是数字（旧格式），需转为对象
    if(!c.avatarLibLastChange||typeof c.avatarLibLastChange!=='object'){c.avatarLibLastChange={chat:0,mail:0,moment:0};}
    if(!c.avatarLibNextChange||typeof c.avatarLibNextChange!=='object'){c.avatarLibNextChange={chat:0,mail:0,moment:0};}
    
    // 检查并修复异常的时间戳（未来时间戳或无效值）
    ['chat','mail','moment'].forEach(function(type){
      var lastChange=c.avatarLibLastChange[type]||0;
      if(lastChange>now||lastChange<0||isNaN(lastChange)){
        c.avatarLibLastChange[type]=0;
        c.avatarLibNextChange[type]=0;
      }
    });
    
    var changed=false;
    
    // 聊天头像（独立判断）
    if(c.avatarLib.avatarChat!==false){
      if((now-(c.avatarLibLastChange.chat||0))/36e5>=c.avatarLibNextChange.chat){
        var newIdxChat=Math.floor(Math.random()*keys.length);
        var newKeyChat=keys[newIdxChat];
        if(window.localforage){
          try{
            var imgData=await window.localforage.getItem(newKeyChat);
            if(imgData&&imgData!==c.avatar){
              if(!c.avatarLibOriginal){c.avatarLibOriginal=c.avatar;}
              c.avatar=imgData;
              changed=true;
              await recordAvatarChange(c.id,'chat',imgData);
              insertAvatarChangeMsg(c,'chat');
              c.avatarLibLastChange.chat=now;
              c.avatarLibNextChange.chat=1+Math.random()*7;
            }
          }catch(e){console.warn('[avatarLib] chat load failed:',e);}
        }
      }
    }
    
    // 信箱头像（独立判断）
    if(c.avatarLib.avatarMail!==false){
      if((now-(c.avatarLibLastChange.mail||0))/36e5>=c.avatarLibNextChange.mail){
        var newIdxMail=Math.floor(Math.random()*keys.length);
        var newKeyMail=keys[newIdxMail];
        if(window.localforage){
          try{
            var imgData=await window.localforage.getItem(newKeyMail);
            if(imgData&&imgData!==(c.mailAvatar||c.avatar)){
              if(!c.avatarLibMailOriginal){c.avatarLibMailOriginal=c.mailAvatar||c.avatar;}
              c.mailAvatar=imgData;
              changed=true;
              await recordAvatarChange(c.id,'mail',imgData);
              insertAvatarChangeMsg(c,'mail');
              c.avatarLibLastChange.mail=now;
              c.avatarLibNextChange.mail=1+Math.random()*7;
            }
          }catch(e){console.warn('[avatarLib] mail load failed:',e);}
        }
      }
    }
    
    // 朋友圈头像（独立判断）
    if(c.avatarLib.avatarMoment!==false){
      if((now-(c.avatarLibLastChange.moment||0))/36e5>=c.avatarLibNextChange.moment){
        var newIdxMoment=Math.floor(Math.random()*keys.length);
        var newKeyMoment=keys[newIdxMoment];
        if(window.localforage){
          try{
            var imgData=await window.localforage.getItem(newKeyMoment);
            if(imgData&&imgData!==(c.momentsAvatar||c.avatar)){
              if(!c.avatarLibMomentOriginal){c.avatarLibMomentOriginal=c.momentsAvatar||c.avatar;}
              c.momentsAvatar=imgData;
              changed=true;
              await recordAvatarChange(c.id,'moment',imgData);
              insertAvatarChangeMsg(c,'moment');
              if(typeof momentsMembers!=='undefined'&&momentsMembers){
                var boundMember=momentsMembers.find(function(m){return m.contactId===c.id});
                if(boundMember){boundMember.avatar=imgData;saveMomentsData();}
              }
              c.avatarLibLastChange.moment=now;
              c.avatarLibNextChange.moment=1+Math.random()*7;
            }
          }catch(e){console.warn('[avatarLib] moment load failed:',e);}
        }
      }
    }
    
    if(changed){
      saveC();
      renderChatList();
      if(cid===c.id){renderMsgs();refreshNavDisplay();}
      if(typeof renderLetters==='function'){renderLetters();}
      console.log('[avatarLib]',c.name,'更换了头像');
    }
  }
}

// 插入头像更换系统消息
function insertAvatarChangeMsg(contact,type){
  var typeLabel='';
  if(type==='chat')typeLabel='聊天头像';
  else if(type==='mail')typeLabel='信箱头像';
  else if(type==='moment')typeLabel='朋友圈头像';
  else typeLabel='头像';
  var msg={
    id:'sys_avatar_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
    s:OTHER,
    t:contact.name+' 更换了'+typeLabel,
    ts:new Date().toISOString(),
    isSystem:true,
    isAvatarChange:true,
    avatarChangeType:type
  };
  var key=LM+contact.id;
  var m=msgs(contact.id)||[];
  m.push(msg);
  memoryCache[key]=m;
  savemsgs(contact.id,m);
}

// 同步头像库数据到 localforage（在 syncAllDataToDB 中也会调用）
async function syncAvatarLibToDB(){
  if(!window.localforage)return;
  for(var i=0;i<contacts.length;i++){
    var c=contacts[i];
    if(!c.avatarLib||!c.avatarLib.avatarKeys||c.avatarLib.avatarKeys.length===0)continue;
    var keys=c.avatarLib.avatarKeys;
    for(var j=0;j<keys.length;j++){
      var key=keys[j];
      // 检查是否已有缓存
      var cached=memoryCache['_img_'+key];
      if(cached){
        window.localforage.setItem(key,cached).catch(function(){});
      }
    }
  }
}

if($('beautify-chat-btn')){$('beautify-chat-btn').addEventListener('click',function(){openBeautify();hideOv('ov-contact-edit')});$('beautify-chat-btn').addEventListener('touchend',function(e){e.preventDefault();openBeautify();hideOv('ov-contact-edit')});}
if($('contact-sound-btn'))$('contact-sound-btn').addEventListener('click',function(){openContactSoundSettings();hideOv('ov-contact-edit')});

async function openBeautify(){
  if(!cid)return;
  var entity=groups.find(function(x){return x.id===cid})||contacts.find(function(x){return x.id===cid});
  if(!entity)return;
  var defaults=getDefaultChatSettings();
  var settings=Object.assign({},defaults);
  if(entity.chatSettings){
    for(var key in entity.chatSettings){
      if(entity.chatSettings.hasOwnProperty(key)&&entity.chatSettings[key]!==undefined&&entity.chatSettings[key]!==null){
        settings[key]=entity.chatSettings[key];
      }
    }
    if(settings.sendBtnBg==='#94a3b8'){settings.sendBtnBg='#000000';entity.chatSettings.sendBtnBg='#000000';}
    if(settings.myQuoteColor==='#94a3b8'){settings.myQuoteColor='#000000';entity.chatSettings.myQuoteColor='#000000';}
    if(settings.otherQuoteColor==='#94a3b8'){settings.otherQuoteColor='#000000';entity.chatSettings.otherQuoteColor='#000000';}
    if(settings.myTimelineColor==='#94a3b8'){settings.myTimelineColor='#000000';entity.chatSettings.myTimelineColor='#000000';}
    if(settings.otherTimelineColor==='#94a3b8'){settings.otherTimelineColor='#000000';entity.chatSettings.otherTimelineColor='#000000';}
    if(settings.myTouchColor==='#94a3b8'){settings.myTouchColor='#000000';entity.chatSettings.myTouchColor='#000000';}
    if(settings.otherTouchColor==='#94a3b8'){settings.otherTouchColor='#000000';entity.chatSettings.otherTouchColor='#000000';}
    if(settings.sendBtnText==='#94a3b8'){settings.sendBtnText='#ffffff';entity.chatSettings.sendBtnText='#ffffff';}
    // 迁移：统一气泡文字颜色默认值（我方和对方都需要从旧值 #1a1a1a 迁移到 #666666）
    if(settings.myBubbleText==='#1a1a1a'){settings.myBubbleText='#666666';entity.chatSettings.myBubbleText='#666666';}
    if(settings.otherBubbleText==='#1a1a1a'){settings.otherBubbleText='#666666';entity.chatSettings.otherBubbleText='#666666';}
  }
  // 保存迁移后的设置
  if(entity.chatSettings){
    saveC();
    if(groups.find(function(x){return x.id===cid}))ls('ml2_groups',groups);
  }
  
  $('my-bubble-text').value=settings.myBubbleText;
  $('my-bubble-bg').value=settings.myBubbleBg;
  $('other-bubble-text').value=settings.otherBubbleText;
  $('other-bubble-bg').value=settings.otherBubbleBg;
  $('my-quote-color').value=settings.myQuoteColor;
  $('other-quote-color').value=settings.otherQuoteColor;
  $('send-btn-bg').value=settings.sendBtnBg;
  $('send-btn-text').value=settings.sendBtnText;
  $('my-timeline-color').value=settings.myTimelineColor;
  $('other-timeline-color').value=settings.otherTimelineColor;
  $('my-touch-color').value=settings.myTouchColor;
  $('other-touch-color').value=settings.otherTouchColor;
  $('bubble-font-size-slider').value=settings.bubbleFontSize;
  $('bubble-font-size-value').textContent=settings.bubbleFontSize+'px';
  $('bubble-padding-slider').value=settings.bubblePadding;
  $('bubble-padding-value').textContent=settings.bubblePadding+'px';
  var op=settings.bubbleOpacity!=null?settings.bubbleOpacity:1;
  $('bubble-opacity-slider').value=op;
  $('bubble-opacity-value').textContent=Math.round(op*100)+'%';
  $('custom-font-input').value=settings.customFont||'';
  $('custom-css-input').value=settings.customCSS||'';
  $('nav-status-color').value=settings.navStatusColor||'#666666';
  $('timeline-font-size-slider').value=settings.timelineFontSize;
  $('timeline-font-size-value').textContent=settings.timelineFontSize+'px';
  
  var currentTimeline=getContactTimelineStyle(cid);
  $('beautify-timeline-options').querySelectorAll('.timeline-option').forEach(function(opt){
    opt.classList.toggle('sel',opt.dataset.value===currentTimeline);
  });
  
  try{await renderChatBgList(entity)}catch(e){console.error('renderChatBgList error:',e)}
  try{renderBeautifyPreview(settings)}catch(e){console.error('renderBeautifyPreview error:',e)}
  
  showOv('ov-beautify');
}

document.querySelectorAll('.beautify-tab').forEach(function(btn){
  btn.addEventListener('click',function(){
    document.querySelectorAll('.beautify-tab').forEach(function(b){
      b.classList.remove('active');
      b.style.color='var(--txt2)';
      b.style.borderBottomColor='transparent';
    });
    this.classList.add('active');
    this.style.color='var(--accent)';
    this.style.borderBottomColor='var(--accent)';
    
    var tabId='beautify-tab-'+this.dataset.tab;
    document.querySelectorAll('[id^="beautify-tab-"]').forEach(function(t){
      t.style.display='none';
    });
    document.getElementById(tabId).style.display='block';
  });
});

function renderBeautifyPreview(settings){
  var preview=$('beautify-preview');
  if(!preview)return;
  var fontSize=settings.bubbleFontSize||14;
  var padding=settings.bubblePadding||10;
  var opacity=settings.bubbleOpacity!=null?settings.bubbleOpacity:1;
  var customCSS=settings.customCSS||'';
  var html='';
  
  html+='<div style="display:flex;align-items:flex-start;gap:8px;width:100%">';
  html+='<div style="width:32px;height:32px;border-radius:4px;background:'+settings.otherBubbleBg+';display:flex;align-items:center;justify-content:center;font-size:14px;color:'+settings.otherBubbleText+'">星</div>';
  html+='<div class="mb other" style="background:'+settings.otherBubbleBg+';color:'+settings.otherBubbleText+';padding:'+padding+'px;border-radius:20px 20px 20px 0;font-size:'+fontSize+'px;max-width:70%;line-height:1.5;box-sizing:border-box;opacity:'+opacity+';">正在输入文字中</div>';
  html+='</div>';
  
  html+='<div style="display:flex;align-items:flex-start;gap:8px;width:100%;justify-content:flex-end">';
  html+='<div class="mb self" style="background:'+settings.myBubbleBg+';color:'+settings.myBubbleText+';padding:'+padding+'px;border-radius:20px 20px 0 20px;font-size:'+fontSize+'px;max-width:70%;line-height:1.5;box-sizing:border-box;opacity:'+opacity+';">正在挑选字卡中</div>';
  html+='<div style="width:32px;height:32px;border-radius:4px;background:'+settings.myBubbleBg+';display:flex;align-items:center;justify-content:center;font-size:14px;color:'+settings.myBubbleText+'">言</div>';
  html+='</div>';
  
  preview.innerHTML=html;
  
  var previewStyle=document.getElementById('beautify-preview-style');
  if(!previewStyle){
    previewStyle=document.createElement('style');
    previewStyle.id='beautify-preview-style';
    document.head.appendChild(previewStyle);
  }
  
  if(customCSS.trim()){
    var hasSelectors=/\{[\s\S]*\}/.test(customCSS);
    if(!hasSelectors){
      previewStyle.textContent='#beautify-preview .mb.self{border:none;box-shadow:none}#beautify-preview .mb.other{border:none;box-shadow:none}#beautify-preview .mb.self{'+customCSS+'}'+
        '#beautify-preview .mb.other{'+customCSS+'}';
    }else{
      var mappedPreviewCSS=customCSS
        .replace(/\.message-sent\b/g,'.mb.self')
        .replace(/\.message-received\b/g,'.mb.other')
        .replace(/\.mr\.self\s*\.mb/g,'.mb.self')
        .replace(/\.mr\.other\s*\.mb/g,'.mb.other')
        .replace(/\.long-ss-container\s+\.mr\.self\s*\.mb/g,'.mb.self')
        .replace(/\.long-ss-container\s+\.mr\.other\s*\.mb/g,'.mb.other')
        // ★ 修复：预览也支持 .message 系列选择器
        .replace(/\.message\.self\b/g,'.mb.self')
        .replace(/\.message\.other\b/g,'.mb.other')
        .replace(/\.message\b(?![-.])/g,'.mb');
      mappedPreviewCSS=mappedPreviewCSS.replace(/([^{};]+?)(?=\s*\{)/g,function(m){
        var trimmed=m.trim();
        if(trimmed.startsWith('@')||trimmed.startsWith('#beautify-preview'))return m;
        return m.replace(/([^{},]+)/g,function(sel){
          var s=sel.trim();
          if(!s||s.startsWith('@')||s.startsWith('#beautify-preview'))return sel;
          if(s.indexOf('.mb.self')>=0||s.indexOf('.mb.other')>=0){
            return sel.replace(/\.mb\.self/g,'#beautify-preview .mb.self').replace(/\.mb\.other/g,'#beautify-preview .mb.other');
          }
          return '#beautify-preview '+sel;
        });
      });
      previewStyle.textContent='#beautify-preview .mb.self{border:none;box-shadow:none}#beautify-preview .mb.other{border:none;box-shadow:none}'+mappedPreviewCSS;
    }
  }else{
    previewStyle.textContent='#beautify-preview .mb.self{border:none;box-shadow:none}#beautify-preview .mb.other{border:none;box-shadow:none}';
  }
}

$('apply-font-btn').addEventListener('click',function(){
  var entity=groups.find(function(x){return x.id===cid})||contacts.find(function(x){return x.id===cid});
  if(!entity)return;
  if(!entity.chatSettings)entity.chatSettings=getDefaultChatSettings();
  var fontVal=$('custom-font-input').value.trim();
  // 检测是否为远程字体URL
  var fontUrlMatch=fontVal.match(/^https?:\/\/.+\.(ttf|woff|woff2|otf)$/i);
  if(fontUrlMatch){
    var statusEl=$('font-loading-status');
    statusEl.style.display='block';
    statusEl.textContent='⏳ 正在下载字体文件，请稍候...';
    var fontUrl=fontVal;
    fetch(fontUrl,{mode:'cors'}).then(function(res){
      if(!res.ok)throw new Error('HTTP '+res.status);
      return res.blob();
    }).then(function(blob){
      var blobUrl=URL.createObjectURL(blob);
      // 存储blob URL
      entity.chatSettings.customFont=blobUrl;
      ls('global_custom_font',blobUrl);
      // 持久化字体数据为 Data URL，等待写入完成后再应用
      try{
        var _fontReader=new FileReader();
        _fontReader.onload=function(){
          if(typeof localforage!=='undefined'){
            localforage.setItem('global_custom_font_data',_fontReader.result).then(function(){
              applyChatSettings(entity);renderMsgs();
            });
          }else{applyChatSettings(entity);renderMsgs();}
        };
        _fontReader.readAsDataURL(blob);
      }catch(e){applyChatSettings(entity);renderMsgs();}
      saveC();
      if(groups.find(function(x){return x.id===cid}))ls('ml2_groups',groups);
      statusEl.style.display='none';
      toast('字体已应用');
    }).catch(function(err){
      console.error('字体下载失败:',err);
      statusEl.textContent='❌ 字体下载失败，请检查链接是否正确，或尝试本地上传';
      setTimeout(function(){statusEl.style.display='none'},3000);
    });
  }else{
    entity.chatSettings.customFont=fontVal;
    ls('global_custom_font',fontVal);
    saveC();
    if(groups.find(function(x){return x.id===cid}))ls('ml2_groups',groups);
    applyChatSettings(entity);
    renderMsgs();
    toast('字体已应用');
  }
});

// 本地上传字体按钮
$('upload-font-btn').addEventListener('click',function(){
  $('custom-font-file-input').click();
});

// 字体文件选择处理
$('custom-font-file-input').addEventListener('change',function(){
  var file=this.files[0];
  if(!file)return;
  var entity=groups.find(function(x){return x.id===cid})||contacts.find(function(x){return x.id===cid});
  if(!entity)return;
  if(!entity.chatSettings)entity.chatSettings=getDefaultChatSettings();
  var statusEl=$('font-loading-status');
  statusEl.style.display='block';
  statusEl.textContent='⏳ 正在加载字体文件...';
  var reader=new FileReader();
  reader.onload=function(e){
    var arrayBuffer=e.target.result;
    var blob=new Blob([arrayBuffer],{type:'application/x-font-ttf'});
    var blobUrl=URL.createObjectURL(blob);
    entity.chatSettings.customFont=blobUrl;
    ls('global_custom_font',blobUrl);
    // 持久化字体数据为 Data URL，等待写入完成后再应用
    try{
      var _fontReader2=new FileReader();
      _fontReader2.onload=function(){
        if(typeof localforage!=='undefined'){
          localforage.setItem('global_custom_font_data',_fontReader2.result).then(function(){
            applyChatSettings(entity);renderMsgs();
          });
        }else{applyChatSettings(entity);renderMsgs();}
      };
      _fontReader2.readAsDataURL(blob);
    }catch(e){applyChatSettings(entity);renderMsgs();}
    saveC();
    if(groups.find(function(x){return x.id===cid}))ls('ml2_groups',groups);
    statusEl.style.display='none';
    toast('字体已应用');
    $('custom-font-input').value='[本地字体] '+file.name;
  };
  reader.onerror=function(){
    statusEl.textContent='❌ 字体文件读取失败';
    setTimeout(function(){statusEl.style.display='none'},3000);
  };
  reader.readAsArrayBuffer(file);
});

$('clear-font-btn').addEventListener('click',function(){
  $('custom-font-input').value='';
  var entity=groups.find(function(x){return x.id===cid})||contacts.find(function(x){return x.id===cid});
  if(!entity)return;
  if(!entity.chatSettings)entity.chatSettings=getDefaultChatSettings();
  entity.chatSettings.customFont='';
  ls('global_custom_font','');
  // 同步清除持久化的字体数据
  try{if(typeof localforage!=='undefined')localforage.removeItem('global_custom_font_data')}catch(e){}
  saveC();
  if(groups.find(function(x){return x.id===cid}))ls('ml2_groups',groups);
  applyChatSettings(entity);
  renderMsgs();
  toast('字体已清空');
});

$('clear-css-btn').addEventListener('click',function(){
  $('custom-css-input').value='';
});

// ★ 恢复气泡颜色按钮（美化面板气泡样式tab内）：只重置气泡颜色相关字段
var _resetBeautifyTouched=false;
$('reset-bubble-color-btn').addEventListener('touchend',function(e){e.preventDefault();e.stopPropagation();_resetBeautifyTouched=true;resetBeautify()});
$('reset-bubble-color-btn').addEventListener('click',function(e){e.preventDefault();if(_resetBeautifyTouched){_resetBeautifyTouched=false;return;}resetBeautify()});

var _cssApplied=false;
$('apply-css-btn').addEventListener('touchend',function(e){e.preventDefault();e.stopPropagation();_cssApplied=true;doApplyCSS()});
$('apply-css-btn').addEventListener('click',function(e){e.preventDefault();if(_cssApplied){_cssApplied=false;return;}doApplyCSS()});
function doApplyCSS(){
  var entity=groups.find(function(x){return x.id===cid})||contacts.find(function(x){return x.id===cid});
  if(!entity&&typeof editingContact!=='undefined'&&editingContact){
    entity=editingContact;
  }
  if(!entity){toast('请先选择联系人');return;}
  if(!entity.chatSettings)entity.chatSettings=getDefaultChatSettings();
  entity.chatSettings.customCSS=$('custom-css-input').value.trim();
  saveC();
  if(groups.find(function(x){return x.id===cid}))ls('ml2_groups',groups);
  applyChatSettings(entity);
  var defaults=getDefaultChatSettings();
  var merged=Object.assign({},defaults,entity.chatSettings);
  renderBeautifyPreview(merged);
  toast('CSS已应用');
}

var beautifyDebounceTimer=null;
function debounceApplyChatSettings(){
  clearTimeout(beautifyDebounceTimer);
  beautifyDebounceTimer=setTimeout(function(){
    // ★ 修复：美化弹窗可能从设置页打开（cid 为 undefined），此时用 editingContact；
    // 之前只用 cid 找导致从设置页打开时 CSS/美化设置不保存、聊天不生效
    var entity=groups.find(function(x){return x.id===cid})||contacts.find(function(x){return x.id===cid});
    if(!entity&&typeof editingContact!=='undefined'&&editingContact)entity=editingContact;
    if(!entity)return;
    if(!entity.chatSettings)entity.chatSettings=getDefaultChatSettings();
    
    entity.chatSettings.myBubbleText=$('my-bubble-text').value;
    entity.chatSettings.myBubbleBg=$('my-bubble-bg').value;
    entity.chatSettings.otherBubbleText=$('other-bubble-text').value;
    entity.chatSettings.otherBubbleBg=$('other-bubble-bg').value;
    entity.chatSettings.myQuoteColor=$('my-quote-color').value;
    entity.chatSettings.otherQuoteColor=$('other-quote-color').value;
    entity.chatSettings.sendBtnBg=$('send-btn-bg').value;
    entity.chatSettings.sendBtnText=$('send-btn-text').value;
    entity.chatSettings.myTimelineColor=$('my-timeline-color').value;
    entity.chatSettings.otherTimelineColor=$('other-timeline-color').value;
    entity.chatSettings.myTouchColor=$('my-touch-color').value;
    entity.chatSettings.otherTouchColor=$('other-touch-color').value;
    entity.chatSettings.bubbleFontSize=parseInt($('bubble-font-size-slider').value);
    entity.chatSettings.bubblePadding=parseInt($('bubble-padding-slider').value);
    entity.chatSettings.bubbleOpacity=parseFloat($('bubble-opacity-slider').value);
    var fontVal=$('custom-font-input').value.trim();
    ls('global_custom_font',fontVal);
    entity.chatSettings.customFont=fontVal;
    entity.chatSettings.customCSS=$('custom-css-input').value.trim();
    entity.chatSettings.navStatusColor=$('nav-status-color').value;
    entity.chatSettings.timelineFontSize=parseInt($('timeline-font-size-slider').value);
    
    saveC();
    if(groups.find(function(x){return x.id===entity.id}))ls('ml2_groups',groups);
    applyChatSettings(entity);
    
    var defaults=getDefaultChatSettings();
    var merged=Object.assign({},defaults,entity.chatSettings);
    renderBeautifyPreview(merged);
  },300);
}

$('custom-font-input').addEventListener('input',debounceApplyChatSettings);
$('custom-css-input').addEventListener('input',debounceApplyChatSettings);

var colorInputs=['my-bubble-text','my-bubble-bg','other-bubble-text','other-bubble-bg','my-quote-color','other-quote-color','send-btn-bg','send-btn-text','my-timeline-color','other-timeline-color','my-touch-color','other-touch-color','nav-status-color'];
colorInputs.forEach(function(id){
  if($(id))$(id).addEventListener('input',debounceApplyChatSettings);
});

$('bubble-font-size-slider').addEventListener('input',function(){
  $('bubble-font-size-value').textContent=this.value+'px';
  debounceApplyChatSettings();
});
$('bubble-padding-slider').addEventListener('input',function(){
  $('bubble-padding-value').textContent=this.value+'px';
  debounceApplyChatSettings();
});
$('bubble-opacity-slider').addEventListener('input',function(){
  $('bubble-opacity-value').textContent=Math.round(parseFloat(this.value)*100)+'%';
  debounceApplyChatSettings();
});
$('timeline-font-size-slider').addEventListener('input',function(){
  $('timeline-font-size-value').textContent=this.value+'px';
  debounceApplyChatSettings();
});

function getDefaultChatSettings(){
  return {
    fontSize:16,
    chatBgKeys:[],
    chatBgIndex:0,
    myBubbleText:'#666666',
    myBubbleBg:'#ffffff',
    otherBubbleText:'#666666',
    otherBubbleBg:'#ffffff',
    myQuoteColor:'#000000',
    otherQuoteColor:'#000000',
    sendBtnBg:'#000000',
    sendBtnText:'#ffffff',
    myTimelineColor:'#000000',
    otherTimelineColor:'#000000',
    myTouchColor:'#000000',
    otherTouchColor:'#000000',
    bubbleFontSize:16,
    bubblePadding:14,
    bubbleOpacity:1,
    customFont:'',
    customCSS:'',
    navStatusColor:'#666666',
    timelineFontSize:9
  };
}

async function saveChatBg(contactId, bgData){
  try{
    var timestamp=Date.now();
    var key='ml2_bg_'+contactId+'_'+timestamp;
    if(window.localforage){
      await window.localforage.setItem(key,bgData);
    }else{
      ls(key,bgData);
    }
    return key;
  }catch(e){
    console.error('Failed to save chat background:',e);
    return null;
  }
}

async function preloadChatBackgrounds(){
  try{
    var allEntities=contacts.concat(groups);
    var bgKeys=[];
    allEntities.forEach(function(entity){
      if(entity.chatSettings&&entity.chatSettings.chatBgKeys){
        entity.chatSettings.chatBgKeys.forEach(function(key){
          if(!key.startsWith('data:')&&bgKeys.indexOf(key)===-1){
            bgKeys.push(key);
          }
        });
      }
    });
    var promises=bgKeys.map(function(key){
      return loadChatBg(key);
    });
    await Promise.all(promises);
  }catch(e){
    console.error('Preload backgrounds error:',e);
  }
}

async function loadChatBg(key){
  try{
    if(chatBgCache[key]){
      return chatBgCache[key];
    }
    var bg=null;
    if(window.localforage){
      bg=await window.localforage.getItem(key);
    }
    if(!bg){
      bg=await Storage.getAsync(key);
    }
    if(bg){
      chatBgCache[key]=bg;
    }
    return bg;
  }catch(e){
    return null;
  }
}

async function deleteChatBg(key){
  try{
    if(window.localforage){
      await window.localforage.removeItem(key);
    }
  }catch(e){}
}

async function renderChatBgList(contact){
  if(!contact.chatSettings)contact.chatSettings=getDefaultChatSettings();
  var settings=contact.chatSettings;
  var bgKeys=settings.chatBgKeys||settings.chatBgList||[];
  var list=$('chat-bg-list');
  list.innerHTML='';
  
  for(var i=0;i<bgKeys.length;i++){
    var bgKey=bgKeys[i];
    var bg=null;
    
    if(bgKey.startsWith('data:')){
      bg=bgKey;
    }else{
      bg=await loadChatBg(bgKey);
    }
    
    if(bg){
      var el=document.createElement('div');
      el.style.width='60px';
      el.style.height='60px';
      el.style.borderRadius='8px';
      el.style.border=i===settings.chatBgIndex?'2px solid var(--accent)':'2px solid transparent';
      el.style.backgroundImage='url('+bg+')';
      el.style.backgroundSize='cover';
      el.style.backgroundPosition='center';
      el.style.cursor='pointer';
      el.style.position='relative';
      el.onclick=function(idx){
        return async function(){
          settings.chatBgIndex=idx;
          saveC();
          if(groups.find(function(x){return x.id===contact.id}))ls('ml2_groups',groups);
          await applyChatSettings(contact);
          await renderChatBgList(contact);
        };
      }(i);
      
      var delBtn=document.createElement('button');
      delBtn.textContent='×';
      delBtn.style.position='absolute';
      delBtn.style.top='-4px';
      delBtn.style.right='-4px';
      delBtn.style.width='18px';
      delBtn.style.height='18px';
      delBtn.style.border='none';
      delBtn.style.borderRadius='50%';
      delBtn.style.background='#ff4d4f';
      delBtn.style.color='#fff';
      delBtn.style.fontSize='12px';
      delBtn.style.cursor='pointer';
      delBtn.style.display='flex';
      delBtn.style.alignItems='center';
      delBtn.style.justifyContent='center';
      delBtn.onclick=function(idx,key){
        return async function(e){
          e.stopPropagation();
          await deleteChatBg(key);
          bgKeys.splice(idx,1);
          if(settings.chatBgIndex>=bgKeys.length){
            settings.chatBgIndex=Math.max(0,bgKeys.length-1);
          }
          saveC();
          if(groups.find(function(x){return x.id===contact.id}))ls('ml2_groups',groups);
          await applyChatSettings(contact);
          await renderChatBgList(contact);
        };
      }(i,bgKey);
      el.appendChild(delBtn);
      
      list.appendChild(el);
    }
  }
}

$('chat-bg-edit').addEventListener('click',function(){$('chat-bg-input').click()});
$('chat-bg-input').addEventListener('change',function(e){
  var files=e.target.files;if(!files||files.length===0)return;
  var entity=groups.find(function(x){return x.id===cid})||contacts.find(function(x){return x.id===cid});
  if(!entity)return;
  if(!entity.chatSettings)entity.chatSettings=getDefaultChatSettings();
  if(!entity.chatSettings.chatBgKeys)entity.chatSettings.chatBgKeys=[];
  var total=files.length;
  var done=0;
  var added=0;
  var processed={};
  for(var i=0;i<files.length;i++){
    (function(file,idx){
      if(processed[idx])return;
      processed[idx]=true;
      compressImage(file,1920,0.95,async function(res){
        done++;
        if(!res){
          if(done>=total)finish();
          return;
        }
        var bgKey='ml2_bg_'+entity.id+'_'+Date.now()+'_'+idx;
        try{
          if(window.localforage){
            await window.localforage.setItem(bgKey,res);
          }else{
            ls(bgKey,res);
          }
          entity.chatSettings.chatBgKeys.push(bgKey);
          added++;
        }catch(err){
          console.error('Failed to save chat background:',err);
        }
        if(done>=total)finish();
      });
    })(files[i],i);
  }
  function finish(){
    if(added>0){
      entity.chatSettings.chatBgIndex=entity.chatSettings.chatBgKeys.length-1;
    }
    saveC();
    if(groups.find(function(x){return x.id===cid}))ls('ml2_groups',groups);
    renderChatBgList(entity);
    applyChatSettings(entity);
    if(added>0)toast('已添加 '+added+' 张背景图片');
  }
  e.target.value='';
});

$('clear-bg-btn').addEventListener('click',async function(){
  var entity=groups.find(function(x){return x.id===cid})||contacts.find(function(x){return x.id===cid});
  if(!entity){toast('未找到联系人');return;}
  if(!entity.chatSettings)entity.chatSettings=getDefaultChatSettings();
  var bgKeys=entity.chatSettings.chatBgKeys||[];
  for(var i=0;i<bgKeys.length;i++){
    var key=bgKeys[i];
    if(!key.startsWith('data:'))await deleteChatBg(key);
  }
  entity.chatSettings.chatBgKeys=[];
  entity.chatSettings.chatBgIndex=0;
  saveC();
  if(groups.find(function(x){return x.id===cid}))ls('ml2_groups',groups);
  await renderChatBgList(entity);
  await applyChatSettings(entity);
});

var _beautifyTouched=false;
var saveBeautifySettings=async function(){
  var entity=groups.find(function(x){return x.id===cid})||contacts.find(function(x){return x.id===cid});
  if(!entity&&typeof editingContact!=='undefined'&&editingContact){
    entity=editingContact;
  }
  if(!entity){toast('请先选择联系人');return;}
  if(!entity.chatSettings)entity.chatSettings=getDefaultChatSettings();
  
  entity.chatSettings.myBubbleText=$('my-bubble-text').value;
  entity.chatSettings.myBubbleBg=$('my-bubble-bg').value;
  entity.chatSettings.otherBubbleText=$('other-bubble-text').value;
  entity.chatSettings.otherBubbleBg=$('other-bubble-bg').value;
  entity.chatSettings.myQuoteColor=$('my-quote-color').value;
  entity.chatSettings.otherQuoteColor=$('other-quote-color').value;
  entity.chatSettings.sendBtnBg=$('send-btn-bg').value;
  entity.chatSettings.sendBtnText=$('send-btn-text').value;
  entity.chatSettings.myTimelineColor=$('my-timeline-color').value;
  entity.chatSettings.otherTimelineColor=$('other-timeline-color').value;
  entity.chatSettings.myTouchColor=$('my-touch-color').value;
  entity.chatSettings.otherTouchColor=$('other-touch-color').value;
  entity.chatSettings.bubbleFontSize=parseInt($('bubble-font-size-slider').value);
  entity.chatSettings.bubblePadding=parseInt($('bubble-padding-slider').value);
  entity.chatSettings.bubbleOpacity=parseFloat($('bubble-opacity-slider').value);
  entity.chatSettings.customFont=$('custom-font-input').value.trim();
  entity.chatSettings.customCSS=$('custom-css-input').value.trim();
  entity.chatSettings.navStatusColor=$('nav-status-color').value;
  entity.chatSettings.timelineFontSize=parseInt($('timeline-font-size-slider').value);
  entity.chatSettings.chatBgIndex=entity.chatSettings.chatBgIndex||0;
  
  var selectedTimeline=$('beautify-timeline-options').querySelector('.timeline-option.sel');
  if(selectedTimeline){
    setContactTimelineStyle(cid,selectedTimeline.dataset.value);
  }
  
  var isGroup=groups.find(function(x){return x.id===cid});
  saveC();
  if(isGroup)ls('ml2_groups',groups);
  
  if(window.localforage){
    try{await window.localforage.setItem(LC,contacts)}catch(e){}
    if(isGroup)try{await window.localforage.setItem('ml2_groups',groups)}catch(e){}
  }
  
  await applyChatSettings(entity);
  hideOv('ov-beautify');
  toast('聊天设置已保存');
};
$('save-beautify-btn').addEventListener('touchend',function(e){e.preventDefault();e.stopPropagation();_beautifyTouched=true;saveBeautifySettings()});
$('save-beautify-btn').addEventListener('click',function(e){e.preventDefault();e.stopPropagation();if(_beautifyTouched){_beautifyTouched=false;return;}saveBeautifySettings()});

$('beautify-timeline-options').addEventListener('click',function(e){
  var target=e.target.closest('.timeline-option');
  if(!target)return;
  var options=$('beautify-timeline-options').querySelectorAll('.timeline-option');
  options.forEach(function(opt){opt.classList.remove('sel')});
  target.classList.add('sel');
});

// 全部应用功能已移除，每个联系人的美化独立

// ★ 底部「恢复默认」按钮：完整恢复该联系人的全部美化设置为默认
var _resetAllTouched=false;
$('reset-beautify-btn').addEventListener('touchend',function(e){e.preventDefault();e.stopPropagation();_resetAllTouched=true;resetAllBeautify()});
$('reset-beautify-btn').addEventListener('click',async function(e){
  e.preventDefault();
  if(_resetAllTouched){_resetAllTouched=false;return;}
  resetAllBeautify();
});
async function resetAllBeautify(){
  if(!cid)return;
  var entity=groups.find(function(x){return x.id===cid})||contacts.find(function(x){return x.id===cid});
  if(!entity)return;
  entity.chatSettings=null;
  saveC();
  if(groups.find(function(x){return x.id===cid}))ls('ml2_groups',groups);
  if(window.localforage){
    try{await window.localforage.setItem(LC,contacts)}catch(e){}
    if(groups.find(function(x){return x.id===cid}))try{await window.localforage.setItem('ml2_groups',groups)}catch(e){}
  }
  await applyChatSettings(entity);
  renderMsgs();
  await openBeautify();
  toast('已恢复默认设置');
}



async function applyChatSettings(contact){
  if(!contact)return;
  if(!contact.chatSettings)contact.chatSettings=getDefaultChatSettings();
  var defaults=getDefaultChatSettings();
  var settings=Object.assign({},defaults);
  for(var key in contact.chatSettings){
    if(contact.chatSettings.hasOwnProperty(key)&&contact.chatSettings[key]!==undefined&&contact.chatSettings[key]!==null){
      settings[key]=contact.chatSettings[key];
    }
  }
  if(settings.sendBtnBg==='#94a3b8'){settings.sendBtnBg='#000000';contact.chatSettings.sendBtnBg='#000000';}
  if(settings.myQuoteColor==='#94a3b8'){settings.myQuoteColor='#000000';contact.chatSettings.myQuoteColor='#000000';}
  if(settings.otherQuoteColor==='#94a3b8'){settings.otherQuoteColor='#000000';contact.chatSettings.otherQuoteColor='#000000';}
  if(settings.myTimelineColor==='#94a3b8'){settings.myTimelineColor='#000000';contact.chatSettings.myTimelineColor='#000000';}
  if(settings.otherTimelineColor==='#94a3b8'){settings.otherTimelineColor='#000000';contact.chatSettings.otherTimelineColor='#000000';}
  if(settings.myTouchColor==='#94a3b8'){settings.myTouchColor='#000000';contact.chatSettings.myTouchColor='#000000';}
  if(settings.otherTouchColor==='#94a3b8'){settings.otherTouchColor='#000000';contact.chatSettings.otherTouchColor='#000000';}
  if(settings.sendBtnText==='#94a3b8'){settings.sendBtnText='#ffffff';contact.chatSettings.sendBtnText='#ffffff';}
  // 迁移：统一气泡文字颜色默认值（我方和对方都需要从旧值 #1a1a1a 迁移到 #666666）
  if(settings.myBubbleText==='#1a1a1a'){settings.myBubbleText='#666666';contact.chatSettings.myBubbleText='#666666';}
  if(settings.otherBubbleText==='#1a1a1a'){settings.otherBubbleText='#666666';contact.chatSettings.otherBubbleText='#666666';}
  // 保存迁移后的设置
  if(contact.chatSettings){
    saveC();
    if(groups.find(function(x){return x.id===contact.id}))ls('ml2_groups',groups);
  }
  
  var msgbox=$('msgbox');
  var convPage=$('pg-conv');
  var typing=$('typing');
  
  if(!msgbox||!convPage)return;
  
  msgbox.style.fontSize=settings.bubbleFontSize+'px';
  
  var bgKeys=settings.chatBgKeys||settings.chatBgList||[];
  if(bgKeys.length>0){
    var bgIndex=settings.chatBgIndex;
    if(bgIndex===undefined||bgIndex===null)bgIndex=0;
    if(bgIndex>=bgKeys.length)bgIndex=bgKeys.length-1;
    var bgKey=bgKeys[bgIndex];
    var bg=null;
    
    if(bgKey.startsWith('data:')){
      bg=bgKey;
    }else{
      if(chatBgCache[bgKey]){
        bg=chatBgCache[bgKey];
      }else{
        bg=await loadChatBg(bgKey);
      }
    }
    
    if(!bg&&bgKey&&!bgKey.startsWith('data:')){
      try{
        var fallbackBg=await window.localforage.getItem(bgKey);
        if(fallbackBg){
          bg=fallbackBg;
          chatBgCache[bgKey]=bg;
        }
      }catch(e){console.warn('Failed to load bg from localforage:',e);}
    }
    if(!bg&&bgKey&&!bgKey.startsWith('data:')){
      try{
        var storageBg=await Storage.getAsync(bgKey);
        if(storageBg){
          bg=storageBg;
          chatBgCache[bgKey]=bg;
        }
      }catch(e){console.warn('Failed to load bg from Storage:',e);}
    }
    
    if(bg){
      var cssBg=bg.startsWith('url(')?bg:'url('+bg+')';
      document.documentElement.style.setProperty('--chat-bg-image',cssBg);
      
      var phone=document.querySelector('.phone');
      if(phone)phone.style.background='transparent';
      convPage.style.background='transparent';
      convPage.style.backgroundImage='none';
      convPage.style.backgroundSize='';
      convPage.style.backgroundPosition='';
      convPage.style.backgroundRepeat='';
      convPage.style.backgroundAttachment='';
      msgbox.style.background='transparent';
      msgbox.style.backgroundImage='none';
      msgbox.style.backgroundSize='';
      msgbox.style.backgroundPosition='';
      msgbox.style.backgroundRepeat='';
      msgbox.style.backgroundAttachment='';
      if(typing){
        typing.style.background='transparent';
        typing.style.backgroundImage='none';
        typing.style.border='none';
        typing.style.boxShadow='none';
      }
      var inputWrap=document.querySelector('.input-wrap');
      if(inputWrap){
        inputWrap.style.background='transparent';
        inputWrap.style.backgroundImage='none';
        inputWrap.style.backgroundSize='';
        inputWrap.style.backgroundPosition='';
        inputWrap.style.backgroundRepeat='';
        inputWrap.style.backgroundAttachment='';
      }
      var ibar=document.querySelector('.ibar');
      if(ibar){
        ibar.style.background='transparent';
        ibar.style.backgroundImage='none';
        ibar.style.backgroundSize='';
        ibar.style.backgroundPosition='';
        ibar.style.backgroundRepeat='';
        ibar.style.backgroundAttachment='';
        ibar.style.backdropFilter='none';
        ibar.style.webkitBackdropFilter='none';
        ibar.style.borderTop='none';
      }
      var nav=convPage.querySelector('.nav');
      if(nav){
        nav.style.background='transparent';
        nav.style.backgroundImage='none';
        nav.style.backgroundSize='';
        nav.style.backgroundPosition='';
        nav.style.backgroundRepeat='';
        nav.style.backgroundAttachment='';
        nav.style.backdropFilter='none';
        nav.style.webkitBackdropFilter='none';
        nav.style.borderBottom='none';
      }
      var navExtended=convPage.querySelector('.nav-extended');
      if(navExtended){
        navExtended.style.background='transparent';
        navExtended.style.backgroundImage='none';
        navExtended.style.backgroundSize='';
        navExtended.style.backgroundPosition='';
        navExtended.style.backgroundRepeat='';
        navExtended.style.backgroundAttachment='';
        navExtended.style.backdropFilter='none';
        navExtended.style.webkitBackdropFilter='none';
        navExtended.style.borderBottom='none';
      }
      var chatMusicStatus=convPage.querySelector('#chat-music-status');
      if(chatMusicStatus){
        chatMusicStatus.style.background='rgba(255,255,255,0.15)';
        chatMusicStatus.style.backgroundImage='none';
        chatMusicStatus.style.backdropFilter='none';
        chatMusicStatus.style.webkitBackdropFilter='none';
        chatMusicStatus.style.borderBottom='none';
      }
      var tabs2=convPage.querySelector('.tabs');
      if(tabs2){
        tabs2.style.background='transparent';
        tabs2.style.backgroundImage='none';
        tabs2.style.backgroundSize='';
        tabs2.style.backgroundPosition='';
        tabs2.style.backgroundRepeat='';
        tabs2.style.backgroundAttachment='';
        tabs2.style.backdropFilter='none';
        tabs2.style.webkitBackdropFilter='none';
        tabs2.style.borderTop='none';
      }
    }
  }else{
    document.documentElement.style.removeProperty('--chat-bg-image');
    
    var phone=document.querySelector('.phone');
    if(phone)phone.style.background='';
    convPage.style.background='';
    convPage.style.backgroundImage='';
    convPage.style.backgroundSize='';
    convPage.style.backgroundPosition='';
    convPage.style.backgroundRepeat='';
    convPage.style.backgroundAttachment='';
    msgbox.style.background='';
    msgbox.style.backgroundImage='';
    msgbox.style.backgroundAttachment='';
    if(typing){
      typing.style.background='';
      typing.style.backgroundImage='';
      typing.style.border='';
      typing.style.boxShadow='';
    }
    var inputWrap=document.querySelector('.input-wrap');
    if(inputWrap){
      inputWrap.style.background='';
      inputWrap.style.backgroundImage='';
      inputWrap.style.backgroundAttachment='';
    }
    var ibar=document.querySelector('.ibar');
    if(ibar){
      ibar.style.background='';
      ibar.style.backgroundImage='';
      ibar.style.backgroundAttachment='';
      ibar.style.backdropFilter='';
      ibar.style.webkitBackdropFilter='';
      ibar.style.borderTop='';
    }
    var tabs=convPage.querySelector('.tabs');
    if(tabs){
      tabs.style.background='';
      tabs.style.backgroundImage='';
      tabs.style.backgroundAttachment='';
      tabs.style.backdropFilter='';
      tabs.style.webkitBackdropFilter='';
      tabs.style.borderTop='';
    }
    var nav=convPage.querySelector('.nav');
    if(nav){
      nav.style.background='';
      nav.style.backgroundImage='';
      nav.style.backgroundSize='';
      nav.style.backgroundPosition='';
      nav.style.backgroundAttachment='';
      nav.style.borderBottom='';
    }
    var navExtended=convPage.querySelector('.nav-extended');
    if(navExtended){
      navExtended.style.background='';
      navExtended.style.backgroundImage='';
      navExtended.style.backgroundSize='';
      navExtended.style.backgroundPosition='';
      navExtended.style.backgroundAttachment='';
      navExtended.style.borderBottom='';
    }
    var chatMusicStatus=convPage.querySelector('#chat-music-status');
    if(chatMusicStatus){
      chatMusicStatus.style.background='';
      chatMusicStatus.style.backgroundImage='';
      chatMusicStatus.style.backdropFilter='';
      chatMusicStatus.style.webkitBackdropFilter='';
      chatMusicStatus.style.borderBottom='';
    }
  }
  
  var _isNight=document.body.classList.contains('night');
  var _hasMyBg=contact.chatSettings&&contact.chatSettings.myBubbleBg;
  var _hasOtherBg=contact.chatSettings&&contact.chatSettings.otherBubbleBg;
  var _hasMyText=contact.chatSettings&&contact.chatSettings.myBubbleText;
  var _hasOtherText=contact.chatSettings&&contact.chatSettings.otherBubbleText;
  document.documentElement.style.setProperty('--my-bubble-text',_isNight&&!_hasMyText?'#eef0f5':(settings.myBubbleText||'#666666'));
  document.documentElement.style.setProperty('--my-bubble-bg',_isNight&&!_hasMyBg?'#3a3a4a':(settings.myBubbleBg||'#ffffff'));
  document.documentElement.style.setProperty('--other-bubble-text',_isNight&&!_hasOtherText?'#e2e4ec':(settings.otherBubbleText||'#666666'));
  document.documentElement.style.setProperty('--other-bubble-bg',_isNight&&!_hasOtherBg?'#2c2c3a':(settings.otherBubbleBg||'#ffffff'));
  document.documentElement.style.setProperty('--my-quote-color',_isNight&&!_hasMyText?'#c8c8d2':(settings.myQuoteColor||'#000000'));
  document.documentElement.style.setProperty('--other-quote-color',_isNight&&!_hasOtherText?'#c8c8d2':(settings.otherQuoteColor||'#000000'));
  document.documentElement.style.setProperty('--my-timeline-color',_isNight&&!_hasMyText?'#b0b0bc':(settings.myTimelineColor||'#000000'));
  document.documentElement.style.setProperty('--other-timeline-color',_isNight&&!_hasOtherText?'#b0b0bc':(settings.otherTimelineColor||'#000000'));
  document.documentElement.style.setProperty('--my-touch-color',_isNight&&!_hasMyText?'#c8c8d2':(settings.myTouchColor||'#000000'));
  document.documentElement.style.setProperty('--other-touch-color',_isNight&&!_hasOtherText?'#c8c8d2':(settings.otherTouchColor||'#000000'));
  
  msgbox.style.setProperty('--bubble-opacity',settings.bubbleOpacity!=null?settings.bubbleOpacity:1);
  // 将opacity应用到现有气泡（处理inline style的气泡）
  var opVal=settings.bubbleOpacity!=null?settings.bubbleOpacity:1;
  document.querySelectorAll('.mb').forEach(function(el){el.style.opacity=opVal;});
  msgbox.style.setProperty('--bubble-font-size',settings.bubbleFontSize+'px');
  msgbox.style.setProperty('--bubble-padding',settings.bubblePadding+'px '+Math.round(settings.bubblePadding*1.4)+'px');
  msgbox.style.setProperty('--timeline-font-size',settings.timelineFontSize+'px');
  
  var sendBtn=$('btn-send');
  if(sendBtn){
    sendBtn.style.background=settings.sendBtnBg;
    sendBtn.style.color=settings.sendBtnText;
  }
  
  // 全局字体：从 localforage 读取 Data URL，直接用于 @font-face（不依赖 blob URL）
  if(!window._loadedFonts)window._loadedFonts={};
  var _fontKey='global-font';
  try{
    var _savedDataUrl=await localforage.getItem('global_custom_font_data');
    if(_savedDataUrl){
      if(!window._loadedFonts[_fontKey]){
        // 清除旧的字体样式元素
        var _oldStyle=document.getElementById('custom-font-style-global');
        if(_oldStyle)_oldStyle.remove();
        var _fontStyle=document.createElement('style');
        _fontStyle.id='custom-font-style-global';
        _fontStyle.textContent='@font-face{font-family:"custom-font-global";src:url("'+_savedDataUrl+'");font-display:swap;}';
        document.head.appendChild(_fontStyle);
        window._loadedFonts[_fontKey]='custom-font-global';
      }
      var _fontFamily=window._loadedFonts[_fontKey];
      document.body.style.fontFamily='"'+_fontFamily+'",sans-serif';
      document.documentElement.style.fontFamily='"'+_fontFamily+'",sans-serif';
    }else{
      // 没有字体数据，清除
      var _oldStyle=document.getElementById('custom-font-style-global');
      if(_oldStyle)_oldStyle.remove();
      delete window._loadedFonts[_fontKey];
      document.body.style.fontFamily='';
      document.documentElement.style.fontFamily='';
    }
  }catch(e){
    // localforage 不可用时的降级：尝试老的 blob URL 方式
    var globalFont=ls('global_custom_font')||'';
    if(globalFont&&/^blob:/.test(globalFont)){
      // blob URL 已失效，无法降级，清空
      document.body.style.fontFamily='';
      document.documentElement.style.fontFamily='';
    }else if(globalFont&&globalFont.match(/^(https?:\/\/.+\.(ttf|woff|woff2|otf))/i)){
      // 远程 URL 字体
      var fontCacheKey=globalFont;
      if(!window._loadedFonts[fontCacheKey]){
        var fontFamilyName='custom-font-'+(Object.keys(window._loadedFonts).length+1);
        var fontStyle=document.createElement('style');
        fontStyle.id='custom-font-style-'+Object.keys(window._loadedFonts).length;
        fontStyle.textContent='@font-face{font-family:"'+fontFamilyName+'";src:url("'+globalFont+'");font-display:swap;}';
        document.head.appendChild(fontStyle);
        window._loadedFonts[fontCacheKey]=fontFamilyName;
      }
      var fontFamilyName=window._loadedFonts[fontCacheKey];
      document.body.style.fontFamily='"'+fontFamilyName+'",sans-serif';
      document.documentElement.style.fontFamily='"'+fontFamilyName+'",sans-serif';
    }else if(globalFont){
      document.body.style.fontFamily=globalFont;
      document.documentElement.style.fontFamily=globalFont;
    }else{
      document.body.style.fontFamily='';
      document.documentElement.style.fontFamily='';
    }
  }
  
  var navStyle=$('custom-nav-style');
  if(!navStyle){
    navStyle=document.createElement('style');
    navStyle.id='custom-nav-style';
    document.head.appendChild(navStyle);
  }
  navStyle.textContent='.nav-weather,.nav-time,.nav-contact-status,.nav-idle,.nav-mood{color:'+settings.navStatusColor+'!important}';
  
  var customStyle=$('custom-chat-style');
  if(!customStyle){
    customStyle=document.createElement('style');
    customStyle.id='custom-chat-style';
    document.head.appendChild(customStyle);
  }
  var css=(settings.customCSS||'');
  console.log('[customCSS check] len='+(css||'').length+' content='+String(css||'').slice(0,120));
  if(css.trim()){
    var msgbox=$('msgbox');
    if(msgbox){
      var bubbles=msgbox.querySelectorAll('.mb');
      for(var bi=0;bi<bubbles.length;bi++){
        bubbles[bi].style.setProperty('--border','transparent');
      }
      // ★ 内联双保险：解析用户 CSS（支持 .mb.self/.mr.self 与 .mb.other/.mr.other 分组），
      // 直接写到气泡内联 style——内联优先级最高，任何 CSS 规则覆盖都无效，100% 生效
      try{
        function _parseInlineCss(_cssStr){
          var _selfDecls=[],_otherDecls=[],_allDecls=[];
          // 按选择器块切分
          var _blocks=_cssStr.match(/[^{}]+{[^}]*}/g)||[];
          if(_blocks.length>0){
            _blocks.forEach(function(blk){
              var _sel=(blk.split('{')[0]||'').trim();
              var _body=(blk.split('{')[1]||'').replace(/}/g,'');
              var _decls=_body.split(';').map(function(d){return d.trim();}).filter(function(d){return d&&d.indexOf(':')>0;});
              var _isSelf=/\.self\b/.test(_sel);
              var _isOther=/\.other\b/.test(_sel);
              _decls.forEach(function(d){
                var _kv=d.split(/:(.+)/);
                if(_kv.length<2)return;
                var _prop=_kv[0].trim(),_val=_kv[1].trim().replace(/!important\s*$/i,'').trim();
                if(/^(background|background-color|color|border|border-color|border-radius|box-shadow|padding|margin|font-size|font-weight|text-shadow)$/i.test(_prop)){
                  if(_isSelf&&!_isOther)_selfDecls.push({p:_prop,v:_val});
                  else if(_isOther&&!_isSelf)_otherDecls.push({p:_prop,v:_val});
                  else _allDecls.push({p:_prop,v:_val});
                }
              });
            });
          }else{
            // 无选择器：全部应用到所有气泡
            _cssStr.split(';').forEach(function(d){
              d=d.trim();if(!d||d.indexOf(':')<0)return;
              var _kv=d.split(/:(.+)/);if(_kv.length<2)return;
              var _prop=_kv[0].trim(),_val=_kv[1].trim().replace(/!important\s*$/i,'').trim();
              if(/^(background|background-color|color|border|border-color|border-radius|box-shadow|padding|margin|font-size|font-weight|text-shadow)$/i.test(_prop)){
                _allDecls.push({p:_prop,v:_val});
              }
            });
          }
          return {self:_selfDecls,other:_otherDecls,all:_allDecls};
        }
        var _parsed=_parseInlineCss(css);
        for(var bi2=0;bi2<bubbles.length;bi2++){
          var _b=bubbles[bi2];
          var _isSelf=!!(_b.closest('.mr.self')||_b.classList.contains('self'));
          var _isOther=!!(_b.closest('.mr.other')||_b.classList.contains('other'));
          var _applyTo=_isSelf?_parsed.self.concat(_parsed.all):(_isOther?_parsed.other.concat(_parsed.all):_parsed.all);
          _applyTo.forEach(function(dec){
            try{_b.style.setProperty(dec.p,dec.v,'important');}catch(e3){}
          });
        }
      }catch(e1){console.warn('inline css apply failed:',e1);}
    }
    var hasSelectors=/\{[\s\S]*\}/.test(css);
    if(!hasSelectors){
      // ★ 修复：给用户自定义 CSS 每个声明追加 !important，避免夜间规则覆盖导致失效
      // 同时处理分号结尾和无分号的最后一条声明；若用户已写 !important 则不重复追加
      var cssImp=css.replace(/([a-z-]+)\s*:\s*([^;{}]+?)\s*([;}])/gi,function(_m,_p,_v,_end){
        var _v2=_v.replace(/\s*!important\s*$/i,'').trim();
        return _p+':'+_v2+'!important'+_end;
      });
      // ★ 修复：同时输出 body.night 前缀版本（同特异性后插入胜），保证夜间模式用户 CSS 不被夜间气泡规则覆盖
      var wrapped='.mr{contain:none!important;padding-top:8px!important;margin-top:0!important}';
      wrapped+='.mr .mc{overflow:visible!important}';
      wrapped+='body.night .mr .mc{overflow:visible!important}';
      wrapped+='.mr .mb{overflow:visible!important;position:relative!important}';
      wrapped+='.mr.self .mb{--border:transparent;border:none;box-shadow:none}';
      wrapped+='.mr.other .mb{--border:transparent;border:none;box-shadow:none}';
      wrapped+='.long-ss-container .mr.self .mb{--border:transparent;border:none;box-shadow:none}';
      wrapped+='.long-ss-container .mr.other .mb{--border:transparent;border:none;box-shadow:none}';
      wrapped+='.mr.self .mb{'+cssImp+'}';
      wrapped+='.mr.other .mb{'+cssImp+'}';
      wrapped+='.long-ss-container .mr.self .mb{'+cssImp+'}';
      wrapped+='.long-ss-container .mr.other .mb{'+cssImp+'}';
      wrapped+='body.night .mr.self .mb{'+cssImp+'}';
      wrapped+='body.night .mr.other .mb{'+cssImp+'}';
      wrapped+='body.night .long-ss-container .mr.self .mb{'+cssImp+'}';
      wrapped+='body.night .long-ss-container .mr.other .mb{'+cssImp+'}';
      customStyle.textContent=wrapped;
      // 诊断日志（vConsole 可查）：确认注入的 CSS
      console.log('[customCSS applied]', wrapped.slice(0,200));
    }else{
      var mappedCSS=css
        .replace(/\.message-sent\b/g,'.mr.self .mb')
        .replace(/\.message-received\b/g,'.mr.other .mb')
        .replace(/\.mb\.self\b/g,'.mr.self .mb')
        .replace(/\.mb\.other\b/g,'.mr.other .mb')
        .replace(/\.long-ss-container\s+\.mr\.self\s*\.mb/g,'.mr.self .mb')
        .replace(/\.long-ss-container\s+\.mr\.other\s*\.mb/g,'.mr.other .mb')
        // ★ 修复：支持 .message / .message.self / .message.other 选择器（用户常用写法）
        .replace(/\.message\.self\b/g,'.mr.self .mb')
        .replace(/\.message\.other\b/g,'.mr.other .mb')
        .replace(/\.message\b(?![-.])/g,'.mr .mb');
      // ★ 修复：给用户自定义 CSS 每个声明追加 !important，避免夜间规则等覆盖导致失效
      // 同时处理分号结尾和无分号的最后一条声明；若用户已写 !important 则不重复追加
      // ★ .message 同时映射 .mr .mb 与 .mr .mc（.mc 有 overflow:hidden 会裁气泡，需同步覆盖）
      mappedCSS=mappedCSS.replace(/([a-z-]+)\s*:\s*([^;{}]+?)\s*([;}])/gi,function(_m,_p,_v,_end){
        var _v2=_v.replace(/\s*!important\s*$/i,'').trim();
        return _p+':'+_v2+'!important'+_end;
      });
      // ★ 若用户 CSS 里设置了 overflow，则同步生成 .mr .mc 覆盖规则（.mc 有 overflow:hidden 会裁气泡）
      // 注意：_ov[0] 已含 !important，不能重复追加，否则 !important!important 非法不生效
      var _mcOverflowCSS='';
      if(/overflow\s*:/.test(mappedCSS)){
        var _overflowRule=mappedCSS.match(/[^{}]*\{[^}]*overflow:[^}]*\}/g)||[];
        _overflowRule.forEach(function(r){
          var _ov=r.match(/overflow\s*:\s*[^;}]+/);
          if(_ov){
            _mcOverflowCSS+='.mr .mc{'+_ov[0]+'}';
            _mcOverflowCSS+='body.night .mr .mc{'+_ov[0]+'}';
          }
        });
      }
      // ★ 修复：复制一份 body.night 前缀版本（同特异性后插入胜），夜间模式用户 CSS 同样生效
      // ★ .mr{contain:content} 的 paint 会强制裁剪溢出（伪元素/阴影），应用用户 CSS 时无条件清除
      // ★ 移动浏览器 contain:paint 裁剪 bug 兜底：给 .mr 加顶部内边距，让 ::before 装饰在容器内显示不被裁
      customStyle.textContent='.mr{contain:none!important;padding-top:8px!important;margin-top:0!important}'
        +'.mr .mc{overflow:visible!important}'
        +'body.night .mr .mc{overflow:visible!important}'
        +'.mr .mb{overflow:visible!important;position:relative!important}'
        +'.mr.self .mb{--border:transparent;border:none;box-shadow:none}.mr.other .mb{--border:transparent;border:none;box-shadow:none}.long-ss-container .mr.self .mb{--border:transparent;border:none;box-shadow:none}.long-ss-container .mr.other .mb{--border:transparent;border:none;box-shadow:none}'+mappedCSS+'\n'+mappedCSS.replace(/\.mr\.self/g,'body.night .mr.self').replace(/\.mr\.other/g,'body.night .mr.other')+_mcOverflowCSS;
    }
  }else{
    var msgbox=$('msgbox');
    if(msgbox){
      var bubbles=msgbox.querySelectorAll('.mb');
      for(var bi=0;bi<bubbles.length;bi++){
        bubbles[bi].style.removeProperty('--border');
      }
    }
    customStyle.textContent='';
  }
}

// ★ 恢复美化默认设置：清空自定义CSS + 重置当前联系人所有美化字段为默认值
function resetBeautify(){
  try{
    var entity=groups.find(function(x){return x.id===cid})||contacts.find(function(x){return x.id===cid});
    if(!entity&&typeof editingContact!=='undefined'&&editingContact){
      entity=editingContact;
    }
    if(!entity){toast('请先选择联系人');return;}
    // ★ 恢复默认：只重置气泡颜色相关字段（解决微信绿等颜色问题），保留用户自定义的字体大小/边距/透明度
    if(!entity.chatSettings)entity.chatSettings={};
    entity.chatSettings.myBubbleBg='#ffffff';
    entity.chatSettings.otherBubbleBg='#ffffff';
    entity.chatSettings.myBubbleText='#666666';
    entity.chatSettings.otherBubbleText='#666666';
    entity.chatSettings.customCSS='';
    entity.chatSettings.customFont='';
    // 保留：fontSize, bubbleFontSize, bubblePadding, bubbleOpacity, chatBg, 颜色其他(quote/sendBtn/timeline/touch) 等用户自定义
    saveC();
    if(groups.find(function(x){return x.id===entity.id}))ls('ml2_groups',groups);
    // 清空CSS输入框
    if($('custom-css-input'))$('custom-css-input').value='';
    // 重新应用默认设置
    applyChatSettings(entity);
    renderMsgs();
    toast('已恢复默认设置');
    haptic('light');
  }catch(e){console.error('resetBeautify error:',e);toast('恢复失败，请重试');}
}

function createAnnouncementStars(){
  var annContainer=$('announcement-stars');
  if(annContainer){
    annContainer.innerHTML='';
    var colors=['#fbbf24','#fcd34d','#fde68a','#e0e7ff','#c7d2fe','#a5b4fc','#fecaca','#fca5a5','#f9a8d4','#f472b6','#a78bfa','#8b5cf6'];
    for(var i=0;i<30;i++){
      var star=document.createElement('div');
      star.style.position='absolute';
      star.style.left=(Math.random()*100)+'%';
      star.style.top=(Math.random()*100)+'%';
      star.style.fontSize=(Math.random()*12+8)+'px';
      star.textContent=Math.random()>0.3?'✦':'✧';
      var color=colors[Math.floor(Math.random()*colors.length)];
      star.style.color=color;
      star.style.opacity=Math.random()*0.5+0.2;
      star.style.animation='starTwinkle '+((Math.random()*8+4))+'s ease-in-out infinite';
      star.style.animationDelay=(Math.random()*8)+'s';
      annContainer.appendChild(star);
    }
  }
}
// ★ 作者域名校验：防止他人自部署后冒用/修改公告内容
var AUTHOR_DOMAINS=['ling233330-star.github.io','localhost','127.0.0.1'];
function isAuthorDomain(){
  try{
    var host=location.hostname||'';
    // 本地文件打开（file://）无法验证归属，不显示官方徽标——官方版一定在官方域名上
    if(!host||host==='')return false;
    // 本机调试（localhost/127.0.0.1）视为作者
    if(host==='localhost'||host==='127.0.0.1')return true;
    // 精确匹配作者域名（不接受子域名伪冒）
    for(var i=0;i<AUTHOR_DOMAINS.length;i++){
      if(host===AUTHOR_DOMAINS[i])return true;
    }
    return false;
  }catch(e){return false;}
}
function showAnnouncement(){
  // 隐藏早期加载动画（确保至少显示 2 秒作为数据缓冲）
  var earlyLoading=document.getElementById('early-loading');
  var doHide=function(){
    if(earlyLoading){earlyLoading.style.display='none';}
    createAnnouncementStars();
    var ann=document.getElementById('announcement-screen');
    if(ann){
      // ★ 作者域名标识：仅作者部署的域名显示"本人部署"徽标，不限制他人自部署使用
      if(isAuthorDomain()){
        var content=document.getElementById('announcement-content');
        if(content){
          try{
            var badge=document.createElement('div');
            badge.style.cssText='display:inline-block;margin-top:10px;padding:4px 14px;border-radius:12px;background:rgba(201,169,110,0.15);border:1px solid rgba(201,169,110,0.4);color:#8b7355;font-size:11px;letter-spacing:1px;';
            badge.textContent='本人部署 · 官方版';
            var firstChild=content.firstChild;
            content.insertBefore(badge,firstChild);
          }catch(e){console.warn('announcement badge failed:',e);}
        }
      }
      ann.style.display='flex';
      setTimeout(function(){ann.style.opacity='1'},50);
    }
  };
  if(earlyLoading&&earlyLoading.style.display!=='none'){
    var elapsed=Date.now()-(window._earlyLoadingStart||0);
    var minShow=2000;
    if(elapsed<minShow){
      setTimeout(doHide,minShow-elapsed);
      return;
    }
  }
  doHide();
}
function enterApp(){
  // #region debug-point C:enter-app
  console.log('[DEBUG] enterApp called');
  // #endregion
  // 确保早期加载动画已隐藏
  try{var el=document.getElementById('early-loading');if(el)el.style.display='none';}catch(e){}
  try{
    var seen = getNoticeSeen();
    // #region debug-point C1:check-seen
    console.log('[DEBUG] getNoticeSeen:', seen);
    // #endregion
    
    // 如果是首次使用，强制跳转到使用须知
    if (!seen) {
      // #region debug-point C2:first-time
      console.log('[DEBUG] first time, showing usage notice');
      // #endregion
      showUsageNoticeFromSplash();
      return;
    }
    
    hasEnteredApp=true;
    // #region debug-point C3:has-entered
    console.log('[DEBUG] hasEnteredApp set to true');
    // #endregion
    
    // 立即隐藏开屏、显示 phone 容器，避免白屏
    var ann=document.getElementById('announcement-screen');
    if(ann){
      // #region debug-point C4:hide-ann
      console.log('[DEBUG] hiding announcement screen');
      // #endregion
      ann.style.opacity='0';
      setTimeout(function(){
        ann.style.display='none';
        ann.style.pointerEvents='none';
      },500);
    }
    var phone=document.querySelector('.phone');
    if(phone){
      // #region debug-point C5:show-phone
      console.log('[DEBUG] showing phone container');
      // #endregion
      phone.style.display='flex';
      phone.style.opacity='1';
    }
    
    // 如果初始化已完成，直接渲染
    // #region debug-point C6:check-init
    console.log('[DEBUG] appInitDone:', appInitDone);
    // #endregion
    if(appInitDone){
      setTimeout(function(){
        // #region debug-point C7:render-list
        console.log('[DEBUG] rendering chat list after init done');
        // #endregion
        try{showPg('pg-list');renderChatList();}catch(e){console.error('enterApp render error:',e);}
      },100);
      return;
    }
    
    // 初始化未完成，显示加载状态并等待
    // #region debug-point C8:init-pending
    console.log('[DEBUG] init not done, showing loading state');
    // #endregion
    showPg('pg-list');
    var clistInner = document.getElementById('clist-inner');
    if(clistInner) clistInner.innerHTML = '<div style="padding:80px 0;display:flex;flex-direction:column;align-items:center;"><div style="font-size:32px;color:#c9a96e;margin-bottom:20px;animation:splashPulse 1.5s ease-in-out infinite">✦</div><div class="loading-dots" style="margin-bottom:20px;"><span></span><span></span><span></span></div><div class="loading-text">正在加载数据...</div></div>';
    
    var checkInterval = setInterval(function(){
      if(appInitDone){
        clearInterval(checkInterval);
        try{renderChatList();}catch(e){}
      }
    },200);
    
    // 最多等 10 秒，超时强制渲染
    setTimeout(function(){
      clearInterval(checkInterval);
      if(!appInitDone) try{renderChatList();}catch(e){}
    },10000);
  }catch(e){
    console.error('enterApp error:',e);
    // 紧急回退：强制显示手机界面
    try{var el0=document.getElementById('early-loading');if(el0)el0.style.display='none';}catch(e3){}
    var phone=document.querySelector('.phone');
    if(phone){phone.style.display='flex';phone.style.opacity='1';}
    var ann=document.getElementById('announcement-screen');
    if(ann){ann.style.display='none';ann.style.pointerEvents='none';}
    try{showPg('pg-list');renderChatList();}catch(e2){}
  }
}
async function preloadMsgsFromDB(){
  if(!window.localforage)return;

  try{
    var keys=await window.localforage.keys();
    var msgKeys=keys.filter(function(k){return k&&k.startsWith(LM)});
    if(msgKeys.length===0)return;

    // 优化：如果 restoreFromDB 已把这些消息加载进 memoryCache，则跳过（避免启动时双倍全量读取）
    var allLoaded=true;
    for(var ci=0;ci<msgKeys.length;ci++){
      var cachedArr=memoryCache[msgKeys[ci]];
      if(!cachedArr||!Array.isArray(cachedArr)||cachedArr.length===0){allLoaded=false;break;}
    }
    if(allLoaded){
      return;
    }

    // 优化：分批读取消息（每批 3 个联系人），批次间让出主线程，
    // 避免数据量大时一次性 Promise.all + JSON.parse 卡死 UI
    var results=[];
    for(var bi=0;bi<msgKeys.length;bi+=3){
      var batchKeys=msgKeys.slice(bi,bi+3);
      var batchResults=await Promise.all(batchKeys.map(function(k){
        return window.localforage.getItem(k).then(function(val){
          return {key:k,val:val};
        }).catch(function(){return {key:k,val:null};});
      }));
      results=results.concat(batchResults);
      // 每批之间让出主线程，保证界面可交互、进度条可更新
      if(bi+3<msgKeys.length){
        await new Promise(function(r){setTimeout(r,0);});
      }
    }

    var hasNewData=false;
    for(var i=0;i<results.length;i++){
      var k=results[i].key;
      var val=results[i].val;
      if(val===null||val===undefined)continue;

      if(typeof val==='string'){
        try{val=JSON.parse(val)}catch(e){continue;}
      }
      if(!Array.isArray(val))continue;

      // 处理日期
      for(var j=0;j<val.length;j++){
        if(val[j]&&!(val[j].ts instanceof Date)){
          try{val[j].ts=new Date(val[j].ts);}catch(e){}
        }
        if(val[j]&&val[j].read===undefined)val[j].read=true;
      }

      var currentData=memoryCache[k]||[];
      if(!Array.isArray(currentData)||currentData.length===0){
        memoryCache[k]=val;
        hasNewData=true;
      }else{
        // 关键修复：按 ID 合并，而不是仅比较最后一条消息的时间戳
        // 旧逻辑缺陷：如果 memoryCache 是刚保存的少量新消息（时间戳新），IndexedDB 是大量旧消息（时间戳旧但数量多），
        // 旧逻辑会拒绝加载 IndexedDB 数据，导致历史记录丢失
        var currentIds={};
        var mergedArr=[];
        var needUpdate=false;
        // 先放入 DB 数据
        val.forEach(function(x){
          if(x&&x.id){
            currentIds[x.id]=true;
            mergedArr.push(x);
          }
        });
        // 追加 memoryCache 中不存在于 DB 的新消息
        currentData.forEach(function(x){
          if(x&&x.id&&!currentIds[x.id]){
            currentIds[x.id]=true;
            mergedArr.push(x);
            needUpdate=true;
          }
        });
        // 按 ts 排序
        mergedArr.sort(function(a,b){
          var ta=a.ts instanceof Date?a.ts.getTime():(a.ts?new Date(a.ts).getTime():0);
          var tb=b.ts instanceof Date?b.ts.getTime():(b.ts?new Date(b.ts).getTime():0);
          return ta-tb;
        });
        // 如果 DB 数据比 memoryCache 多，或者有新消息需要合并，则更新
        if(val.length>currentData.length||needUpdate){
          memoryCache[k]=mergedArr;
          hasNewData=true;
        }
      }
    }

    if(hasNewData){
      renderChatList();
      if(cid){
        renderMsgs();
      }
    }
  }catch(e){}
}

function waitForLocalforage(){
  return new Promise(function(resolve){
    if(window.localforage){
      resolve();
    }else{
      document.addEventListener('localforageReady',function(){
        resolve();
      },{once:true});
      document.addEventListener('localforageFailed',function(){
        resolve();
      },{once:true});
      setTimeout(function(){
        resolve();
      },1500);
    }
  });
}

function withTimeout(promise, ms, fallback){
  return new Promise(function(resolve){
    var timeout=setTimeout(function(){
      console.warn('Timeout after '+ms+'ms, using fallback');
      resolve(fallback);
    },ms);
    promise.then(function(result){
      clearTimeout(timeout);
      resolve(result);
    }).catch(function(){
      clearTimeout(timeout);
      resolve(fallback);
    });
  });
}

// 强制迁移旧版默认设置到新版默认值（仅当用户未手动修改过时）
var CURRENT_VERSION = '1.7.2';
function migrateSettings(){
  var migratedVersion = null;
  try { migratedVersion = localStorage.getItem('star_settings_migrated_version'); } catch(e) {}
  if (migratedVersion === CURRENT_VERSION) return;
  
  // 迁移主动发消息默认概率 50→10（仅当从未设置过或还是旧默认值时）
  var speedData = ls('ml2_speed');
  if (!speedData) speedData = {};
  var updated = false;
  
  // 只有在从未设置过（undefined）时才设置新默认值
  if (speedData.as_prob === undefined) {
    speedData.as_prob = 10;
    updated = true;
  }
  if (speedData.as_min === undefined) {
    speedData.as_min = 5;
    updated = true;
  }
  if (speedData.as_max === undefined) {
    speedData.as_max = 10;
    updated = true;
  }
  if (speedData.as_count === undefined) {
    speedData.as_count = 1;
    updated = true;
  }
  // ★ 修复：as-count-min/max 默认值迁移（旧版无此字段，用 as_count 或 1 兜底）
  if (speedData.as_count_min === undefined) {
    speedData.as_count_min = speedData.as_count || 1;
    updated = true;
  }
  if (speedData.as_count_max === undefined) {
    speedData.as_count_max = speedData.as_count || 1;
    updated = true;
  }
  if (speedData.reply_min === undefined) {
    speedData.reply_min = 1;
    updated = true;
  }
  if (speedData.reply_max === undefined) {
    speedData.reply_max = 5;
    updated = true;
  }
  if (speedData.rn_prob === undefined) {
    speedData.rn_prob = 20;
    updated = true;
  }
  if (speedData.rc_prob === undefined) {
    speedData.rc_prob = 5;
    updated = true;
  }
  if (speedData.quote_prob === undefined) {
    speedData.quote_prob = 5;
    updated = true;
  }
  if (speedData.sticker_prob === undefined) {
    speedData.sticker_prob = 10;
    updated = true;
  }
  if (speedData.image_prob === undefined) {
    speedData.image_prob = 5;
    updated = true;
  }
  if (speedData.voice_prob === undefined) {
    speedData.voice_prob = 10;
    updated = true;
  }
  if (speedData.touch_prob === undefined) {
    speedData.touch_prob = 5;
    updated = true;
  }
  if (speedData.emoji_prob === undefined) {
    speedData.emoji_prob = 5;
    updated = true;
  }
  if (speedData.kaomoji_prob === undefined) {
    speedData.kaomoji_prob = 5;
    updated = true;
  }
  
  if (updated) {
    ls('ml2_speed', speedData);
    if (window.localforage) {
      try { window.localforage.setItem('ml2_speed', speedData); } catch(e) {}
    }
  }
  
  // 迁移朋友圈设置默认值
  var momentsData = ls('ml2_moments_settings');
  if (!momentsData || typeof momentsData !== 'object') momentsData = {};
  var momentsUpdated = false;
  var momentsDefaults = {
    likeProbability: 60, likeSpeedMin: 1, likeSpeedMax: 60,
    commentProbability: 70, commentSpeedMin: 1, commentSpeedMax: 60,
    replyProbability: 60, replySpeedMin: 1, replySpeedMax: 60,
    friendPostProbability: 40, friendPostIntervalMin: 1, friendPostIntervalMax: 720,
    friendPostDailyMax: 5, friendPostCooldownMin: 30,
    maxCardsPerComment: 5, imageProbability: 50, maxImagesPerComment: 3,
    cardProbability: 80,
    friendLikeFriendProbability: 40, friendCommentFriendProbability: 25,
    friendCommentFriendSpeedMin: 10, friendCommentFriendSpeedMax: 60,
    friendCommentFriendCardProbability: 50, friendCommentFriendMaxCards: 3,
    friendCommentFriendImageProbability: 10, friendReplyFriendProbability: 15,
    friendReplyFriendSpeedMin: 5, friendReplyFriendSpeedMax: 30,
    friendCommentKaomojiProb: 5, friendCommentEmojiProb: 5, friendCommentStickerProb: 5,
    friendReplyKaomojiProb: 5, friendReplyEmojiProb: 5, friendReplyStickerProb: 5,
    friendPostKaomojiProb: 10, friendPostEmojiProb: 10, friendPostStickerProb: 30, friendPostImageProb: 30,
    minCardsPerPost: 4, maxCardsPerPost: 15
  };
  Object.keys(momentsDefaults).forEach(function(key) {
    if (momentsData[key] !== momentsDefaults[key]) {
      momentsData[key] = momentsDefaults[key];
      momentsUpdated = true;
    }
  });
  if (momentsUpdated) {
    ls('ml2_moments_settings', momentsData);
    if (window.localforage) {
      try { window.localforage.setItem('ml2_moments_settings', momentsData); } catch(e) {}
    }
  }
  
  try { localStorage.setItem('star_settings_migrated_version', CURRENT_VERSION); } catch(e) {}
}

var appInitDone=false;
async function initApp(){
  var t0=Date.now();
  try{
    // 进度反馈：初始化开始
    if(typeof updateSplashProgress==='function')updateSplashProgress(5,'正在准备存储...');
    // 先确保 localforage 就绪（内联后立即就绪，不会等 CDN）
    try{await withTimeout(waitForLocalforage(),1500,undefined);}catch(e){}
    // ★ 一次性清理：清除旧系统独立存储的拍一拍数据（早期版本遗留，与聊天字卡库分开）
    // 用户已在聊天字卡库删除公用/专享拍一拍字卡，但旧系统 ml2_touch_* 数据残留导致拍一拍仍显示
    try{
      var _touchCleanedFlag=ls('ml2_touch_legacy_cleaned');
      if(!_touchCleanedFlag){
        // 1) 旧系统独立存储（整个键删除，均为拍一拍专用）
        ['ml2_touch_cards_public','ml2_touch_cards_private','ml2_touch_groups','ml2_touch_group_cards'].forEach(function(k){
          try{localStorage.removeItem(k);}catch(e){}
          try{localStorage.removeItem('ml2_lf_'+k);}catch(e){}
          try{delete cache[k];}catch(e){}
          if(window.localforage){try{window.localforage.removeItem(k).catch(function(){});}catch(e){}}
        });
        // 2) 导航系统字卡库中 category==='touch' 的拍一拍字卡（保留其他分类字卡）
        try{
          var navPubRaw=safeGetItem('ml2_nav_cards_public');
          var navPub=navPubRaw?JSON.parse(navPubRaw):[];
          if(Array.isArray(navPub)){
            var navFiltered=navPub.filter(function(c){return !(c&&c.category==='touch')});
            if(navFiltered.length!==navPub.length){
              safeSetItem('ml2_nav_cards_public',navFiltered);
              if(window.localforage){try{window.localforage.setItem('ml2_nav_cards_public',navFiltered).catch(function(){});}catch(e){}}
            }
          }
        }catch(e){console.warn('clean nav touch cards failed:',e);}
        // 3) 导航系统私有字卡库中的 touch 字卡
        try{
          for(var pci=0;pci<localStorage.length;pci++){
            var pk=localStorage.key(pci);
            if(pk&&pk.indexOf('ml2_nav_cards_private_')===0){
              try{
                var privRaw=safeGetItem(pk);
                var privArr=privRaw?JSON.parse(privRaw):[];
                if(Array.isArray(privArr)){
                  var privFiltered=privArr.filter(function(c){return !(c&&c.category==='touch')});
                  if(privFiltered.length!==privArr.length)safeSetItem(pk,privFiltered);
                }
              }catch(e){}
            }
          }
        }catch(e){}
        ls('ml2_touch_legacy_cleaned',true);
        console.warn('[cleanup] 已清除旧系统拍一拍数据（ml2_touch_* + 导航touch卡）');
      }
    }catch(e){console.warn('cleanup legacy touch failed:',e);}
    console.log('[perf] waitForLocalforage:',Date.now()-t0,'ms');
    
    // ★ 快速阶段：只加载联系人+自己（这是首屏必需，1-2秒内完成）
    if(typeof updateSplashProgress==='function')updateSplashProgress(20,'正在读取联系人...');
    var t1=Date.now();
    var loadResults=await Promise.allSettled([
      withTimeout(loadC(),3000,undefined),
      withTimeout(loadPAsync(),2000,undefined)
    ]);
    console.log('[perf] loadC+loadPAsync:',Date.now()-t1,'ms');
    if(loadResults[0].status==='rejected')console.warn('loadC failed:',loadResults[0].reason);
    if(loadResults[1].status==='rejected')console.warn('loadPAsync failed:',loadResults[1].reason);
    
    try{refreshMy();}catch(e){console.warn('refreshMy failed:',e);}
    try{migrateSettings();}catch(e){console.warn('migrateSettings failed:',e);}
    appInitDone=true;
    console.log('[perf] 快速阶段总耗时:',Date.now()-t0,'ms');
    if(typeof updateSplashProgress==='function')updateSplashProgress(60,'正在进入...');
    // 立即渲染联系人列表，让用户看到界面
    try{renderChatList();}catch(e){console.warn('early renderChatList failed:',e);}
    
    // ★ 后台阶段：其余所有数据异步加载，不阻塞开屏
    setTimeout(function(){
      try{
        Promise.allSettled([
          withTimeout(loadGroups(),3000,undefined),
          withTimeout(loadCallSettings(),3000,undefined),
          withTimeout(loadChatbarSettingsAsync(),3000,undefined),
          withTimeout(loadCallHistory(),3000,undefined),
          withTimeout(loadNavDisplayStates(),3000,undefined),
          withTimeout(preloadCriticalData(),3000,undefined)
        ]).then(function(){
          try{renderChatList();}catch(e){}
        });
      }catch(e){console.warn('bg load failed:',e);}
    },100);
    
    // 后台加载聊天记录（分批，不阻塞）
    setTimeout(function(){
      try{preloadMsgsFromDB().then(function(){try{renderChatList();}catch(e){}});}catch(e){}
    },300);
    
    // 后台加载其他数据
    setTimeout(function(){try{loadCustomGifts();}catch(e){console.warn('custom gifts load err:',e);}},800);
    setTimeout(function(){try{checkDailyGifts();}catch(e){console.warn('daily gift check err:',e);}},5000);
    setTimeout(function(){try{loadGlobalCards();}catch(e){}},2000);
    setTimeout(function(){try{preloadChatBackgrounds();}catch(e){}},3000);
    setTimeout(function(){try{preloadMsgImages();}catch(e){}},4000);
  }catch(e){
    console.error('Init error:',e);
    appInitDone=true;
    renderChatList();
  }
}

try{
  initApp().then(function(){
    // 数据加载完成后，隐藏加载动画并显示公告屏
    try{showAnnouncement();}catch(e){console.error('showAnnouncement err:',e);try{var el=document.getElementById('early-loading');if(el)el.style.display='none';}catch(e2){}}
    try{createAnnouncementStars();}catch(e){}
    // 每日备份提醒：每天提示一次导出数据，防止聊天记录因浏览器清理/换设备而丢失
    setTimeout(function(){
      try{maybeRemindBackup();}catch(e){console.warn('backup remind err:',e);}
    },8000);
  }).catch(function(e){
    console.error('initApp rejected:',e);renderChatList();
    try{var el=document.getElementById('early-loading');if(el)el.style.display='none';}catch(e2){}
  });
}catch(e){
  console.error('initApp err:',e);renderChatList();
  try{var el=document.getElementById('early-loading');if(el)el.style.display='none';}catch(e2){}
}
// ===== 每日备份提醒（数据防丢）=====
var BACKUP_REMIND_KEY='star_backup_remind_date';
function maybeRemindBackup(){
  try{
    var today=new Date();
    var todayStr=today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    var last=safeGetItem(BACKUP_REMIND_KEY);
    if(last===todayStr)return; // 今天已提醒过
    safeSetItem(BACKUP_REMIND_KEY,todayStr);
    // 显示轻量提醒条：点击可去导出，也可关闭
    showBackupRemindToast();
  }catch(e){console.warn('maybeRemindBackup error:',e);}
}
function showBackupRemindToast(){
  try{
    if(typeof toast==='function'){
      // 普通 toast 无法带按钮，用自定义浮动提醒条
      var bar=document.createElement('div');
      bar.style.cssText='position:fixed;left:12px;right:12px;bottom:calc(80px + env(safe-area-inset-bottom, 0px));z-index:99998;background:#fff;border:1px solid var(--border);border-radius:14px;box-shadow:0 4px 20px rgba(0,0,0,.15);padding:12px 14px;display:flex;align-items:center;gap:10px;';
      var msg=document.createElement('div');
      msg.style.cssText='flex:1;font-size:13px;color:var(--txt);line-height:1.5;';
      msg.textContent='📦 该备份聊天记录了：数据存在浏览器本地，清除缓存/换设备可能会丢失。建议定期导出保存。';
      var goBtn=document.createElement('button');
      goBtn.textContent='去导出';goBtn.style.cssText='flex-shrink:0;padding:8px 14px;border:none;border-radius:10px;background:var(--accent);color:#fff;font-size:13px;font-weight:600;cursor:pointer;min-height:36px;-webkit-tap-highlight-color:transparent;';
      var closeBtn=document.createElement('button');
      closeBtn.textContent='✕';closeBtn.style.cssText='flex-shrink:0;width:28px;height:28px;border:none;border-radius:50%;background:var(--c2);color:var(--txt3);font-size:13px;cursor:pointer;';
      goBtn.addEventListener('click',function(){
        try{bar.remove();}catch(e){}
        try{exportData();}catch(e){console.warn('export err:',e);}
      });
      closeBtn.addEventListener('click',function(){
        try{bar.remove();}catch(e){}
      });
      bar.appendChild(msg);bar.appendChild(goBtn);bar.appendChild(closeBtn);
      document.body.appendChild(bar);
      // 20 秒后自动消失（避免一直占用屏幕）
      setTimeout(function(){try{bar.remove();}catch(e){}},20000);
    }
  }catch(e){console.warn('showBackupRemindToast error:',e);}
}
// 定期同步关键数据到 IndexedDB，防止手机端浏览器清理 localStorage 导致数据丢失
// 修复：用 try/catch 包裹回调，避免 syncAllDataToDB 内部 try/catch 之外的代码抛错时持续累积
setInterval(function(){
  try{syncAllDataToDB();}catch(e){console.warn('syncAllDataToDB timer error:',e);}
},30000);

// 强制将所有关键数据同步到 IndexedDB（localforage），防止手机端数据丢失
// 优化：使用脏标记机制，只同步发生变化的数据，避免每30秒全量同步造成卡顿
var _syncDirtyKeys={}; // 脏数据标记：记录哪些 key 的数据发生了变化
var _lastFullSyncTime=0; // 上次全量同步的时间戳
function markSyncDirty(key){ _syncDirtyKeys[key]=true; }
function syncAllDataToDB(){
  if(!window.localforage)return;
  try{
    var now=Date.now();
    // 首次同步或距离上次全量同步超过5分钟时，执行一次全量同步
    var doFullSync=(now-_lastFullSyncTime)>300000;
    if(doFullSync){
      _lastFullSyncTime=now;
      // 全量同步核心数据
      if(contacts&&contacts.length>0){
        window.localforage.setItem(LC,contacts).catch(function(){});
      }
      if(me&&Object.keys(me).length>0){
        window.localforage.setItem(LP,me).catch(function(){});
      }
      if(groups&&groups.length>0){
        window.localforage.setItem('ml2_groups',groups).catch(function(){});
      }
      if(globalCards&&globalCards.length>0){
        var cardsRef=globalCards.map(function(c){
          if(c.content&&c.content.length>1024&&c.content.startsWith('data:image/')){
            var imgKey='ml2_card_img_'+c.id;
            var ref=Object.assign({},c,{content:imgKey});
            window.localforage.setItem(imgKey,c.content).catch(function(){});
            return ref;
          }
          return c;
        });
        window.localforage.setItem('ml2_global_cards',cardsRef).catch(function(){});
      }
      if(cardGroups&&cardGroups.length>0){
        window.localforage.setItem('ml2_card_groups',cardGroups).catch(function(){});
      }
      if(navDisplayStates&&Object.keys(navDisplayStates).length>0){
        window.localforage.setItem('ml2_nav_display_states',navDisplayStates).catch(function(){});
      }
      // 同步其他配置数据
      try{
        var pomodoroSettings=localStorage.getItem('ml2_pomodoro_direct');
        if(pomodoroSettings)window.localforage.setItem('ml2_pomodoro_direct',pomodoroSettings).catch(function(){});
      }catch(e){}
      try{
        var callSettings=localStorage.getItem('ml2_call_settings');
        if(callSettings)window.localforage.setItem('ml2_call_settings',callSettings).catch(function(){});
      }catch(e){}
      try{
        var chatbar=localStorage.getItem('ml2_custom_chatbar');
        if(chatbar)window.localforage.setItem('ml2_custom_chatbar',chatbar).catch(function(){});
      }catch(e){}
      try{
        var momentsNotif=localStorage.getItem('ml2_moments_notifications');
        if(momentsNotif)window.localforage.setItem('ml2_moments_notifications',JSON.parse(momentsNotif)).catch(function(){});
      }catch(e){}
      try{
        var customIconsData=localStorage.getItem('ml2_custom_icons');
        if(customIconsData)window.localforage.setItem('ml2_custom_icons',JSON.parse(customIconsData)).catch(function(){});
      }catch(e){}
      try{
        var momentsData=localStorage.getItem(LMOM);
        if(momentsData)window.localforage.setItem(LMOM,JSON.parse(momentsData)).catch(function(){});
      }catch(e){}
      // 同步信件数据
      try{
        var lettersData=ls(LL);
        if(lettersData&&Array.isArray(lettersData)&&lettersData.length>0){
          window.localforage.setItem(LL,lettersData).catch(function(){});
        }
      }catch(e){console.warn('[syncAllDataToDB] letters sync error:',e);}
      syncAvatarLibToDB();
    }

    // 增量同步：只同步标记为脏的消息数据
    try{
      if(Storage.cache){
        var _msgBatch=[];
        for(var ck in Storage.cache){
          if(Storage.cache.hasOwnProperty(ck)&&ck.indexOf(LM)===0){
            // 增量模式：只同步脏 key；全量模式：同步所有
            if(!doFullSync&&!_syncDirtyKeys[ck])continue;
            var _msgVal=Storage.cache[ck];
            if(_msgVal&&Array.isArray(_msgVal)&&_msgVal.length>0){
              _msgBatch.push({key:ck,val:_msgVal});
            }
            _syncDirtyKeys[ck]=false;
          }
        }
        // 分批写入 IndexedDB，每批 5 个，批间让出主线程
        var _batchSize=5;
        var _batchIdx=0;
        function _writeNextBatch(){
          if(_batchIdx>=_msgBatch.length)return;
          var batch=_msgBatch.slice(_batchIdx,_batchIdx+_batchSize);
          _batchIdx+=_batchSize;
          batch.forEach(function(item){
            try{window.localforage.setItem(item.key,item.val).catch(function(){});}catch(e){}
          });
          if(_batchIdx<_msgBatch.length){
            setTimeout(_writeNextBatch,0); // 让出主线程
          }
        }
        _writeNextBatch();
      }
    }catch(e){}
  }catch(e){console.warn('[syncAllDataToDB] error:',e);}
}

// 强制全量同步所有消息数据到 IndexedDB（页面关闭时调用，确保数据不丢失）
function forceSyncAllMsgsToDB(){
  if(!window.localforage)return;
  try{
    // 同步所有消息数据（不分批，直接写入）
    if(Storage.cache){
      for(var ck in Storage.cache){
        if(Storage.cache.hasOwnProperty(ck)&&ck.indexOf(LM)===0){
          var _msgVal=Storage.cache[ck];
          if(_msgVal&&Array.isArray(_msgVal)&&_msgVal.length>0){
            try{window.localforage.setItem(ck,_msgVal);}catch(e){}
            _syncDirtyKeys[ck]=false;
          }
        }
      }
    }
    // 同步核心数据
    if(contacts&&contacts.length>0){
      try{window.localforage.setItem(LC,contacts);}catch(e){}
    }
    if(me&&Object.keys(me).length>0){
      try{window.localforage.setItem(LP,me);}catch(e){}
    }
    if(groups&&groups.length>0){
      try{window.localforage.setItem('ml2_groups',groups);}catch(e){}
    }
  }catch(e){console.warn('forceSyncAllMsgsToDB error:',e);}
}

window.addEventListener('beforeunload', function() {
  if(currentCall){
    endCall('disconnected', currentCall.duration||0);
  }
  syncAllDataToDB();
  forceSyncAllMsgsToDB();
  clearAllTimers();
});

window.addEventListener('pagehide', function() {
  syncAllDataToDB();
  forceSyncAllMsgsToDB();
  clearAllTimers();
  if(Storage.flushLSWrites) Storage.flushLSWrites();
});

// 手机端切后台/锁屏时同步数据（比 beforeunload 更可靠）
// 优化：只刷新待写队列和触发一次 IndexedDB 同步，不再遍历整个 cache JSON.stringify
// 避免切后台时大量 JSON.stringify 阻塞主线程导致卡顿
document.addEventListener('visibilitychange',function(){
  if(document.hidden){
    // 1. 刷新待写的 localStorage 队列（只有变化过的 key 才在队列里）
    try{
      if(Storage.flushLSWrites) Storage.flushLSWrites();
    }catch(e){}
    // 2. 异步同步到 IndexedDB（可能完成也可能不完成，但多一层保障）
    // syncAllDataToDB 内部已经优化为只同步 memoryCache 中的消息数据
    try{
      syncAllDataToDB();
    }catch(e){}
  }
});

// Reload data from localforage when it becomes available
window.addEventListener('localforageReady',async function(){
  // 安全网：确保 Storage 模块知道 localforage 已就绪
  // 如果 CDN 加载时 Storage 尚未定义，markReady() 可能未被调用，导致 isLFAvailable() 永远返回 false
  if(typeof Storage !== 'undefined' && Storage.markReady) {
    Storage.markReady();
  }

  try{
    var dbSaved=await localforage.getItem(LC);
    if(dbSaved&&Array.isArray(dbSaved)&&dbSaved.length>0){
      var currentIds=contacts.map(function(c){return c.id});
      var hasNew=dbSaved.some(function(c){return currentIds.indexOf(c.id)===-1});
      
      var shouldUpdate=false;
      if(hasNew){
        shouldUpdate=true;
      }else if(contacts.length<dbSaved.length){
        shouldUpdate=true;
      }else{
        var hasMoreSettings=false;
        for(var i=0;i<contacts.length;i++){
          var c=contacts[i];
          var dbC=dbSaved.find(function(d){return d.id===c.id});
          if(dbC&&(!c.chatSettings||!dbC.chatSettings)){
            continue;
          }
          if(c.chatSettings&&!dbC.chatSettings){
            hasMoreSettings=true;
            break;
          }
        }
        if(!hasMoreSettings){
          shouldUpdate=true;
        }
      }
      
      if(shouldUpdate){
        var mergedContacts=[];
        dbSaved.forEach(function(dbC){
          var c=contacts.find(function(x){return x.id===dbC.id});
          if(c&&c.chatSettings&&(!dbC.chatSettings||Object.keys(c.chatSettings).length>Object.keys(dbC.chatSettings||{}).length)){
            dbC.chatSettings=c.chatSettings;
          }
          // ★ 修复：头像/个人头像等字段优先保留本地（较新的），避免 IndexedDB 旧快照覆盖新头像
          if(c){
            if(c.avatar&&!dbC.avatar)dbC.avatar=c.avatar;
            if(c.myAvatar&&!dbC.myAvatar)dbC.myAvatar=c.myAvatar;
            if(c.avatar&&dbC.avatar&&c.avatar!==dbC.avatar)dbC.avatar=c.avatar;
            if(c.myAvatar&&dbC.myAvatar&&c.myAvatar!==dbC.myAvatar)dbC.myAvatar=c.myAvatar;
            // 其它字段：本地有值且 db 没有时补充
            if(c.nickname&&!dbC.nickname)dbC.nickname=c.nickname;
            if(c.name&&!dbC.name)dbC.name=c.name;
          }
          mergedContacts.push(dbC);
        });
        // 本地有而 db 缺失的联系人：保留本地
        contacts.forEach(function(lc){
          if(!mergedContacts.some(function(d){return d.id===lc.id})){
            mergedContacts.push(lc);
          }
        });
        contacts=mergedContacts;
        await resolveContactAvatars();
        renderChatList();
        if(cid){
          var contact=contacts.find(function(x){return x.id===cid});
          if(contact){
            applyChatSettings(contact);
            renderMsgs();
          }
        }
      }
    }
    await loadGlobalCards();
    await loadContactOrderAsync();
    await loadTouchCardsFromIndexedDB();
    await loadMomentsData();
    await loadLettersFromIndexedDB();
    try{await preloadCriticalData();}catch(e){}
  }catch(e){
    console.error('localforageReady reload error:',e);
  }
});

// localforage 加载失败时标记状态，切换为 localStorage 模式
window.addEventListener('localforageFailed', function(){
  if (typeof Storage !== 'undefined' && Storage.markFailed) {
    Storage.markFailed();
  }
  console.warn('localforage failed to load, switched to localStorage-only mode');
});

setTimeout(async function(){
  try{
    loadDivineTargets();
    try{await migrateMsgsImages();}catch(e){console.warn('migrateMsgsImages failed:',e)}
    try{await migrateOrigImgs();}catch(e){console.warn('migrateOrigImgs failed:',e)}
    try{await preloadMsgImages();}catch(e){console.warn('preloadMsgImages failed:',e)}
    try{await loadTouchCardsFromIndexedDB();}catch(e){console.warn('loadTouchCardsFromIndexedDB failed:',e)}
    try{await loadMomentsData();}catch(e){console.warn('loadMomentsData failed:',e)}
    // 修复：100ms初始化序列中缺少从 IndexedDB 加载信件，
    // 之前仅在 localforageReady 事件中加载，如果该事件延迟或不触发（如localforage CDN加载慢），
    // renderLetters() 就会读到空值，导致信箱显示为空
    try{await loadLettersFromIndexedDB();}catch(e){console.warn('loadLettersFromIndexedDB failed:',e)}
    try{loadMomentsNotifications();}catch(e){console.warn('loadMomentsNotifications failed:',e)}
    try{await preloadCriticalData();}catch(e){}
    try{updateMomentsNotificationsBadge();}catch(e){console.warn('updateMomentsNotificationsBadge failed:',e)}
    try{loadBoardData();}catch(e){console.warn('loadBoardData failed:',e)}

    try{await loadDecisionData();}catch(e){console.warn('loadDecisionData failed:',e)}
    try{initDecisionSliders();}catch(e){console.warn('initDecisionSliders failed:',e)}
    try{initGroupDecisionSliders();}catch(e){console.warn('initGroupDecisionSliders failed:',e)}
    try{renderDContacts();}catch(e){console.warn('renderDContacts failed:',e)}
    try{loadDivineHistory();}catch(e){console.warn('loadDivineHistory failed:',e)}
    // 修复：renderLetters() 移到 loadLettersFromIndexedDB 之后，确保数据加载完再渲染
    try{renderLetters();}catch(e){console.warn('renderLetters failed:',e)}
    try{maybeGenMoments();}catch(e){console.warn('maybeGenMoments failed:',e)}
    try{updateBadges();}catch(e){console.warn('updateBadges failed:',e)}
    // 兜底：再过2秒后再执行一次 loadLettersFromIndexedDB + renderLetters + updateBadges，
    // 防止因初始化竞态导致数据没加载到（例如 localforage 在此期间才真正就绪）
    setTimeout(async function(){
      try{
        await loadLettersFromIndexedDB();
        renderLetters();
        updateBadges();
        if(currentProfileContactId){
          try{renderContactLetterHistory(currentProfileContactId);}catch(e){}
        }
      }catch(e){console.warn('[Fallback] letters reload failed:',e);}
    },2000);
    // 兜底：3秒后重新加载占卜记录和朋友圈通知，防止初始化竞态导致数据缺失
    setTimeout(function(){
      try{loadDivineHistory();}catch(e){console.warn('[Fallback] divine reload failed:',e)}
      try{loadMomentsNotifications();}catch(e){console.warn('[Fallback] moments notif reload failed:',e)}
      try{updateMomentsNotificationsBadge();}catch(e){}
    },3000);
    try{loadSoundSettings();}catch(e){console.warn('loadSoundSettings failed:',e)}
    try{initKeepAlive();}catch(e){console.warn('initKeepAlive failed:',e)}
    try{initPushNotify();}catch(e){console.warn('initPushNotify failed:',e)}
    try{initFullscreenMode();}catch(e){console.warn('initFullscreenMode failed:',e)}
    try{initNightMode();}catch(e){console.warn('initNightMode failed:',e)}
    if(cid){try{var c=contacts.find(function(x){return x.id===cid});if(c)await applyChatSettings(c)}catch(e){console.warn('applyChatSettings failed:',e)}}
    // 修复：setInterval 的 try/catch 只能捕获注册时的错误，不能捕获回调执行时的错误
    // 之前回调抛错会导致错误每 30 秒/60 秒持续累积，且不会停止定时器
    // 现在用匿名函数包裹 try/catch，确保每次执行的异常被捕获而不影响下次调度
    try{setInterval(function(){try{maybeGenLetter();}catch(e){console.warn('maybeGenLetter error:',e);}},30000);}catch(e){}
    try{setTimeout(function(){try{maybeGenLetter();}catch(e){console.warn('maybeGenLetter init error:',e);}},10000);}catch(e){}
    try{$('nav-contact-avatar').addEventListener('click',function(){
    if(cid){
      showContactProfile(cid);
    }
  });}catch(e){}

  try{setTimeout(function(){

    }, 2000);}catch(e){}
    try{setTimeout(function(){try{maybeAutoSend();}catch(e){console.warn('maybeAutoSend init error:',e);}},5000);}catch(e){}
    // ★ 修复：主动发消息改为精确间隔链式调度（无固定轮询），启动即排
    try{setTimeout(function(){try{initAutoSendSchedule();}catch(e){console.warn('initAutoSendSchedule error:',e);}},8000);}catch(e){}
    // 朋友圈动态：即使前面的初始化失败，也要确保定时任务启动
    try{setTimeout(scheduleFriendMoments,60000);}catch(e){console.warn('scheduleFriendMoments init failed:',e)}
    // 兜底：5秒后再启动一次，防止第一次因数据未就绪而失败
    try{setTimeout(function(){try{scheduleFriendMoments();}catch(e){}},5000);}catch(e){}
    try{setInterval(function(){checkNavDisplay().catch(function(e){});},60000);}catch(e){}
    try{checkNavDisplay().catch(function(e){});}catch(e){}
    // 联系人随机头像库刷新（与顶部栏字卡刷新频率一致）
    try{setInterval(function(){checkAvatarLibRefresh().catch(function(e){});},60000);}catch(e){}
    try{checkAvatarLibRefresh().catch(function(e){});}catch(e){}
    try{initImageViewer();}catch(e){console.warn('initImageViewer failed:',e)}

    // 顶部栏时间实时更新（每秒），仅在非字卡模式时显示北京时间
    // 修复：回调内用 try/catch 包裹，避免每秒抛错持续累积
    try{setInterval(function(){
      try{
      if(!cid||!$('nav-time'))return;
      var state=navDisplayStates[cid];
      if(state&&!state.timeIsCard){
        var now=new Date();
        var timeText=now.getHours()+':'+(now.getMinutes()<10?'0':'')+now.getMinutes();
        $('nav-time').textContent=timeText;
        state.time=timeText;
      }
      }catch(e){console.warn('nav-time update error:',e);}
    },1000);}catch(e){}

    try{bindMyPageEvents();}catch(e){console.warn('bindMyPageEvents failed:',e)}
  }catch(e){console.error('Delayed init error:',e)}
},100);

var currentCustomCategory='';
var currentCustomTitle='';
var currentCustomType='public';
var currentCustomContact='';
var currentCustomGroup='';
var customCardGroups={};
var customCardGroupsCollapsed={};

function openCustomSettings(category,title,hasContact){
  currentCustomCategory=category;
  currentCustomTitle=title;
  currentCustomType='public';
  currentCustomContact='';
  loadCustomCardGroups();
  if(!customCardGroups[category]){
    customCardGroups[category]=['默认分组'];
    saveCustomCardGroups();
  }
  currentCustomGroup=customCardGroups[category][0];
  $('custom-settings-title').textContent=title;
  updateCustomTypeTabs();
  if(hasContact){
    $('custom-tab-private').style.display='inline-block';
  }else{
    $('custom-tab-private').style.display='none';
  }
  $('custom-settings-contact-select-wrap').style.display='none';
  renderCustomGroupSelect();
  renderCustomCardList();
  $('custom-settings-input').value='';
  showPg('pg-custom-settings');
}

function hideCustomSettings(){
  showPg('pg-my');
}

function switchCustomType(type){
  currentCustomType=type;
  updateCustomTypeTabs();
  if(currentCustomType==='private'){
    $('custom-settings-contact-select-wrap').style.display='block';
    renderCustomContactSelect();
    currentCustomContact=contacts[0]?contacts[0].id:'';
  }else{
    $('custom-settings-contact-select-wrap').style.display='none';
    currentCustomContact='';
    $('custom-settings-contact-tags').innerHTML='';
  }
  renderCustomGroupSelect();
  renderCustomCardList();
}

function updateCustomTypeTabs(){
  $('custom-tab-public').classList.toggle('sel',currentCustomType==='public');
  $('custom-tab-private').classList.toggle('sel',currentCustomType==='private');
}

function renderCustomContactSelect(){
  var tagsHtml='';
  contacts.forEach(function(c){
    var isSel=currentCustomContact===c.id;
    tagsHtml+='<button style="padding:6px 14px;border-radius:20px;border:none;background:var(--c2);color:var(--txt);cursor:pointer;font-size:12px" onclick="selectCustomContact(\''+c.id+'\')" class="'+(isSel?'sel':'')+'">'+c.name+'</button>';
  });
  $('custom-settings-contact-tags').innerHTML=tagsHtml;
  document.querySelectorAll('#custom-settings-contact-tags button').forEach(function(b){
    b.addEventListener('click',function(){
      document.querySelectorAll('#custom-settings-contact-tags button').forEach(function(x){x.classList.remove('sel')});
      this.classList.add('sel');
    });
  });
}

function selectCustomContact(id){
  currentCustomContact=id;
  renderCustomCardList();
}

function loadCustomCardGroups(){
  var data=ls('ml2_custom_card_groups');
  if(data&&typeof data==='object'){
    customCardGroups=data;
  }else{
    customCardGroups={};
  }
}

function saveCustomCardGroups(){
  ls('ml2_custom_card_groups',customCardGroups);
}

function renderCustomGroupSelect(){
  var groups=customCardGroups[currentCustomCategory]||['默认分组'];
  var tagsHtml='';
  groups.forEach(function(groupName){
    var isSel=currentCustomGroup===groupName;
    var isCollapsed=customCardGroupsCollapsed[groupName];
    tagsHtml+='<button style="padding:6px 14px;border-radius:20px;border:none;background:var(--c2);color:var(--txt);cursor:pointer;font-size:12px;display:flex;align-items:center;gap:4px" onclick="toggleCustomGroup(\''+groupName+'\')" class="'+(isSel?'sel':'')+'">'+groupName+'<span style="font-size:10px;opacity:0.5" onclick="event.stopPropagation();showEditGroupModal(\''+groupName+'\')">✎</span><span style="font-size:10px">'+(isCollapsed?'▶':'▼')+'</span></button>';
  });
  $('custom-settings-group-tags').innerHTML=tagsHtml;
}

function toggleCustomGroup(groupName){
  var isSel=currentCustomGroup===groupName;
  if(isSel){
    customCardGroupsCollapsed[groupName]=!customCardGroupsCollapsed[groupName];
  }else{
    currentCustomGroup=groupName;
    customCardGroupsCollapsed[groupName]=false;
  }
  renderCustomGroupSelect();
  renderCustomCardList();
}

function selectCustomGroup(groupName){
  currentCustomGroup=groupName;
  renderCustomGroupSelect();
  renderCustomCardList();
}

function showAddGroupModal(){
  var overlay=document.createElement('div');
  overlay.id='ov-add-group';
  overlay.className='overlay';
  overlay.innerHTML='<div class="popup"><div class="popup-header"><span class="popup-title">新建分组</span><button class="btn-close" onclick="hideOv(\'ov-add-group\')">×</button></div><div class="popup-body"><input type="text" id="new-group-name" placeholder="输入分组名称" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:12px;font-size:14px"><div style="display:flex;gap:8px"><button class="btn" onclick="addCustomGroup()">创建</button><button class="btn-outline" onclick="hideOv(\'ov-add-group\')">取消</button></div></div></div>';
  document.body.appendChild(overlay);
  setTimeout(function(){$('new-group-name').focus()},100);
}

function showEditGroupModal(oldName){
  var overlay=document.createElement('div');
  overlay.id='ov-edit-group';
  overlay.className='overlay';
  overlay.innerHTML='<div class="popup"><div class="popup-header"><span class="popup-title">编辑分组</span><button class="btn-close" onclick="hideOv(\'ov-edit-group\')">×</button></div><div class="popup-body"><input type="text" id="edit-group-name" value="'+oldName+'" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:12px;font-size:14px"><div style="display:flex;gap:8px"><button class="btn" onclick="editCustomGroup(\''+oldName+'\')">保存</button><button class="btn-outline" onclick="hideOv(\'ov-edit-group\')">取消</button><button class="btn-danger-soft" onclick="deleteCustomGroup(\''+oldName+'\')" style="margin-left:auto">删除</button></div></div></div>';
  document.body.appendChild(overlay);
  setTimeout(function(){$('edit-group-name').select()},100);
}

function addCustomGroup(){
  var name=$('new-group-name').value.trim();
  if(!name){toast('请输入分组名称');return}
  if(!customCardGroups[currentCustomCategory]){
    customCardGroups[currentCustomCategory]=[];
  }
  if(customCardGroups[currentCustomCategory].indexOf(name)!==-1){
    toast('分组已存在');
    return;
  }
  customCardGroups[currentCustomCategory].push(name);
  saveCustomCardGroups();
  currentCustomGroup=name;
  renderCustomGroupSelect();
  renderCustomCardList();
  hideOv('ov-add-group');
  toast('分组已创建');
}

function editCustomGroup(oldName){
  var name=$('edit-group-name').value.trim();
  if(!name){toast('请输入分组名称');return}
  var groups=customCardGroups[currentCustomCategory];
  if(groups.indexOf(name)!==-1&&name!==oldName){
    toast('分组已存在');
    return;
  }
  var idx=groups.indexOf(oldName);
  if(idx!==-1){
    groups[idx]=name;
    saveCustomCardGroups();
    if(currentCustomGroup===oldName){
      currentCustomGroup=name;
    }
    globalCards.forEach(function(card){
      if(card.groupName===oldName&&card.category===currentCustomCategory){
        card.groupName=name;
      }
    });
    saveGlobalCardsDebounced();
    renderCustomGroupSelect();
    renderCustomCardList();
  }
  hideOv('ov-edit-group');
  toast('分组已更新');
}

function deleteCustomGroup(groupName){
  if(groupName==='默认分组'){
    toast('默认分组不能删除');
    return;
  }
  if(!confirm('确定要删除分组「'+groupName+'」吗？该分组下的字卡将被移动到默认分组。')){
    return;
  }
  var groups=customCardGroups[currentCustomCategory];
  var idx=groups.indexOf(groupName);
  if(idx!==-1){
    groups.splice(idx,1);
    saveCustomCardGroups();
    if(currentCustomGroup===groupName){
      currentCustomGroup=groups[0]||'默认分组';
    }
    globalCards.forEach(function(card){
      if(card.groupName===groupName&&card.category===currentCustomCategory){
        card.groupName='默认分组';
      }
    });
    saveGlobalCardsDebounced();
    renderCustomGroupSelect();
    renderCustomCardList();
  }
  hideOv('ov-edit-group');
  toast('分组已删除');
}

function renderCustomCardList(){
  if(customCardGroupsCollapsed[currentCustomGroup]){
    $('custom-settings-card-list').innerHTML='';
    $('custom-settings-empty').style.display='none';
    return;
  }
  
  var cards=globalCards.filter(function(c){
    if(c.category!==currentCustomCategory)return false;
    if(c.groupName!==currentCustomGroup)return false;
    if(currentCustomType==='public'){
      return c.type==='public';
    }else{
      return c.type==='private'&&c.contactId===currentCustomContact;
    }
    return false;
  });
  var list=$('custom-settings-card-list');
  var empty=$('custom-settings-empty');
  list.innerHTML='';
  if(cards.length===0){
    empty.style.display='block';
    return;
  }
  empty.style.display='none';
  
  cards.forEach(function(card,idx){
    var div=document.createElement('div');
    div.style.display='flex';
    div.style.justifyContent='space-between';
    div.style.alignItems='center';
    div.style.padding='10px 12px';
    div.style.background='var(--c2)';
    div.style.borderRadius='8px';
    div.style.marginBottom='6px';
    div.innerHTML='<span style="flex:1;font-size:13px;color:var(--txt)">'+card.content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</span><button style="border:none;background:none;color:#ff4d4f;cursor:pointer;font-size:14px;padding:4px 8px" onclick="deleteCustomCard('+idx+')">🗑</button>';
    list.appendChild(div);
  });
}

async function addCustomCard(){
  var text=$('custom-settings-input').value.trim();
  if(!text){toast('请输入内容');return}
  if(currentCustomType==='private'&&!currentCustomContact){
    toast('请先选择联系人');
    return;
  }
  var lines=text.split('\n').filter(function(l){return l.trim()});
  lines.forEach(function(content){
    content=content.trim();
    if(!content)return;
    globalCards.push({
      id:'card_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),
      type:currentCustomType,
      category:currentCustomCategory,
      content:content,
      contactId:currentCustomType==='private'?currentCustomContact:'',
      groupName:currentCustomGroup
    });
  });
  await saveGlobalCardsDebounced();
  renderCustomCardList();
  $('custom-settings-input').value='';
  toast('已添加'+lines.length+'张字卡');
}

async function deleteCustomCard(idx){
  var cards=globalCards.filter(function(c){
    if(c.category!==currentCustomCategory)return false;
    if(c.groupName!==currentCustomGroup)return false;
    if(currentCustomType==='public'){
      return c.type==='public';
    }else{
      return c.type==='private'&&c.contactId===currentCustomContact;
    }
    return false;
  });
  var cardToDelete=cards[idx];
  globalCards=globalCards.filter(function(c){return c.id!==cardToDelete.id});
  await saveGlobalCardsDebounced();
  renderCustomCardList();
  toast('已删除');
}

async function clearCustomCards(){
  if(confirm('确定要清空当前分组的所有字卡吗？')){
    globalCards=globalCards.filter(function(c){
      if(c.category!==currentCustomCategory)return true;
      if(c.groupName!==currentCustomGroup)return true;
      if(currentCustomType==='public'){
        return c.type!=='public';
      }else{
        return !(c.type==='private'&&c.contactId===currentCustomContact);
      }
    });
    await saveGlobalCardsDebounced();
    renderCustomCardList();
    toast('已清空');
  }
}

async function clearDuplicateCards(){
  var seen={};
  var originalCount=0;
  var duplicateCount=0;
  globalCards=globalCards.filter(function(c){
    if(c.category!==currentCustomCategory)return true;
    if(c.groupName!==currentCustomGroup)return true;
    var isMatch=false;
    if(currentCustomType==='public'){
      isMatch=c.type==='public';
    }else{
      isMatch=c.type==='private'&&c.contactId===currentCustomContact;
    }
    if(!isMatch)return true;
    originalCount++;
    var key=c.content.trim();
    if(seen[key]){
      duplicateCount++;
      return false;
    }
    seen[key]=true;
    return true;
  });
  if(duplicateCount>0){
    await saveGlobalCardsDebounced();
    renderCustomCardList();
    toast('已清除'+duplicateCount+'张重复字卡');
  }else{
    toast('没有重复字卡');
  }
}

function initImageViewer(){
  var viewer=$('image-viewer');
  var closeBtn=$('image-viewer-close');
  var content=$('image-viewer-content');
  
  closeBtn.addEventListener('click',function(){
    viewer.style.display='none';
  });
  
  viewer.addEventListener('click',function(e){
    if(e.target===viewer){
      viewer.style.display='none';
    }
  });
  
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&viewer.style.display==='flex'){
      viewer.style.display='none';
    }
  });
  
  document.addEventListener('click',function(e){
    if(e.target.classList.contains('message-img')){
      e.stopPropagation();
      var origSrc=e.target.dataset.orig;
      content.src=origSrc||e.target.src;
      viewer.style.display='flex';
    }
  });
}

function openSurveyModal(mode){
  var sheet=$('survey-sheet');
  var overlay=$('ov-survey');
  sheet.style.cssText='';
  if(mode==='full'){
    sheet.style.position='fixed';
    sheet.style.top='0';
    sheet.style.left='0';
    sheet.style.right='0';
    sheet.style.bottom='0';
    sheet.style.width='100%';
    sheet.style.maxWidth='none';
    sheet.style.borderRadius='0';
    sheet.style.maxHeight='100vh';
    sheet.style.height='100vh';
    sheet.style.height='100dvh';
    overlay.classList.remove('center-overlay');
    overlay.classList.add('sheet-overlay');
  }else{
    sheet.style.width='90%';
    sheet.style.maxWidth='420px';
    sheet.style.maxHeight='80vh';
    sheet.style.borderRadius='24px';
    overlay.classList.add('center-overlay');
    overlay.classList.remove('sheet-overlay');
  }
  showOv('ov-survey');
  // 先加载字卡数据再初始化
  loadGlobalCards().then(function(){
    loadCardPrivateContacts();
    SurveyApp.init();
    SurveyApp.showSurveyTab('create');
  });
}

var SurveyApp = (function() {
  var surveyDuration = 120;
  var surveyEarlySubmitProb = 10;
  var surveySkipProb = 0; // ★ 未作答概率：本次问卷可能出现某题未作答的概率（0-100）
  var currentSurvey = null;
  var currentQuestionIndex = 0;
  var remainingSeconds = 0;
  var timerInterval = null;
  var surveyStartTime = 0;
  var surveyAnswers = {};
  var selectedSurveyContacts = [];
  
  var lsSetWithDB=function(key,val){
    return new Promise(function(resolve){
      ls(key,val);
      resolve();
    });
  }
  
  function loadSurveyDuration(){
    lsGetWithDB('ml2_surveyDuration').then(function(saved){
      if(saved){
        var val=parseFloat(saved);
        // 兼容旧版：旧版存储为分钟（值<=30），新版存储为秒
        if(val<=30)val=val*60;
        surveyDuration=Math.max(1,Math.min(1800,Math.round(val)));
      }
    });
  }
  
  function saveSurveyDuration(){
    lsSetWithDB('ml2_surveyDuration',surveyDuration.toString());
  }
  
  function loadEarlySubmitProb(){
    lsGetWithDB('ml2_surveyEarlySubmitProb').then(function(saved){
      if(saved){
        surveyEarlySubmitProb=parseFloat(saved);
      }
    });
  }
  
  function saveEarlySubmitProb(){
    lsSetWithDB('ml2_surveyEarlySubmitProb',surveyEarlySubmitProb.toString());
  }

  function loadSkipProb(){
    lsGetWithDB('ml2_surveySkipProb').then(function(saved){
      if(saved){
        surveySkipProb=parseFloat(saved);
      }
    });
  }

  function saveSkipProb(){
    lsSetWithDB('ml2_surveySkipProb',surveySkipProb.toString());
  }
  
  async function loadSurveyRecords(){
    var saved=null;
    if(window.localforage){
      try{
        saved=await window.localforage.getItem('ml2_surveyRecords');
        if(saved){
          if(typeof saved==='string'){
            var parsed=JSON.parse(saved);
            if(Array.isArray(parsed))return parsed;
          }else if(Array.isArray(saved)){
            return saved;
          }
        }
      }catch(e){}
    }
    // 从 localStorage 降级读取
    try{
      var lsSaved=ls('ml2_surveyRecords');
      if(lsSaved&&Array.isArray(lsSaved))return lsSaved;
    }catch(e){}
    // 直接读取 localStorage 原始数据
    try{
      var raw=localStorage.getItem('ml2_lf_ml2_surveyRecords');
      if(raw){
        var parsed=JSON.parse(raw);
        if(Array.isArray(parsed))return parsed;
      }
    }catch(e){}
    return [];
  }
  
  async function saveSurveyRecord(record){
    var records=await loadSurveyRecords();
    if(!records)records=[];
    records.unshift(record);
    // 直接保存到 localStorage 和 localforage，避免通过 Storage.set 的缓存机制
    try{
      localStorage.setItem('ml2_lf_ml2_surveyRecords',JSON.stringify(records));
    }catch(e){}
    if(window.localforage){
      try{await window.localforage.setItem('ml2_surveyRecords',JSON.stringify(records))}catch(e){}
    }
    // 同步更新 Storage 缓存
    try{ls('ml2_surveyRecords',records);}catch(e){}
  }
  
  function updateQuestionNumbers(){
    var questions=document.querySelectorAll('.survey-question-item');
    questions.forEach(function(item,index){
      item.dataset.index=index;
      var numberSpan=item.querySelector('span:first-child');
      if(numberSpan){
        numberSpan.textContent=(index+1)+'.';
      }
    });
  }
  
  function addSurveyQuestion(){
    var questionsList=document.getElementById('survey-questions-list');
    var index=questionsList.children.length;
    
    var newItem=document.createElement('div');
    newItem.className='survey-question-item';
    newItem.dataset.index=index;
    newItem.innerHTML='<div style="display:flex;flex-direction:column;gap:8px;"><div style="display:flex;align-items:center;gap:10px;"><span style="font-size:12px;color:var(--txt2);padding-top:8px;">'+(index+1)+'.</span><input type="text" class="survey-question-input" placeholder="输入问题内容" style="flex:1;padding:10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);font-size:14px;color:var(--txt);outline:none;box-sizing:border-box;"><button class="survey-delete-question-btn" onclick="SurveyApp.deleteSurveyQuestion(this)" style="padding:6px 10px;border:none;border-radius:6px;background:#ff4d4f;color:#fff;font-size:12px;cursor:pointer;white-space:nowrap;">删除</button></div><div style="display:flex;align-items:center;gap:8px;padding-left:22px;"><span style="font-size:11px;color:var(--txt3);flex-shrink:0;">答案</span><input type="text" class="survey-option-input survey-answer-input" placeholder="答案选项，用逗号分隔（不填则字卡回复）" style="flex:1;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);font-size:12px;color:var(--txt);outline:none;box-sizing:border-box;"><button class="survey-add-option-btn" onclick="SurveyApp.addSurveyOption(this)" style="padding:6px 12px;border:none;border-radius:6px;background:var(--accent);color:#fff;font-size:12px;cursor:pointer;white-space:nowrap;display:none;">+ 选项</button></div></div>';
    
    questionsList.appendChild(newItem);
  }
  
  function deleteSurveyQuestion(btn){
    var item=btn.closest('.survey-question-item');
    var questionsList=document.getElementById('survey-questions-list');
    
    if(questionsList.children.length<=1){
      toast('至少保留一个问题');
      return;
    }
    
    item.remove();
    updateQuestionNumbers();
  }
  
  function showBatchAddQuestions(){
    // ★ 重构：分组式批量添加——打开时先给一组（问题+答案）
    var groupsContainer=document.getElementById('survey-batch-groups');
    if(groupsContainer)groupsContainer.innerHTML='';
    addSurveyBatchGroup();
    showOv('ov-survey-batch');
  }
  
  // ★ 新增一组（问题 + 答案选项）
  function addSurveyBatchGroup(){
    var container=document.getElementById('survey-batch-groups');
    if(!container)return;
    var group=document.createElement('div');
    group.style.cssText='background:var(--c2);border-radius:10px;padding:10px;margin-bottom:10px;';
    group.innerHTML=
      '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">'+
        '<span style="font-size:11px;color:var(--txt3);flex-shrink:0;">问题</span>'+
        '<input type="text" class="survey-batch-q" placeholder="输入问题内容" style="flex:1;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);font-size:13px;color:var(--txt);outline:none;box-sizing:border-box;">'+
        '<button onclick="SurveyApp.removeSurveyBatchGroup(this)" style="width:28px;height:28px;border:none;border-radius:50%;background:rgba(255,77,79,0.1);color:#ff4d4f;font-size:14px;cursor:pointer;flex-shrink:0;">✕</button>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:6px;">'+
        '<span style="font-size:11px;color:var(--txt3);flex-shrink:0;">答案</span>'+
        '<input type="text" class="survey-batch-opts" placeholder="答案选项，用逗号分隔（不填则字卡回复）" style="flex:1;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);font-size:13px;color:var(--txt);outline:none;box-sizing:border-box;">'+
      '</div>';
    container.appendChild(group);
  }
  
  function removeSurveyBatchGroup(btn){
    var group=btn.closest('div');
    if(group&&group.parentNode)group.parentNode.removeChild(group);
  }
  
  function batchAddQuestions(){
    // ★ 重构：从分组列表读取（每组：问题 + 答案）
    var groupsContainer=document.getElementById('survey-batch-groups');
    if(!groupsContainer)return;
    
    var entries=[];
    var qInputs=groupsContainer.querySelectorAll('.survey-batch-q');
    var optsInputs=groupsContainer.querySelectorAll('.survey-batch-opts');
    qInputs.forEach(function(qInput,i){
      var qText=qInput.value.trim();
      if(!qText)return;
      var optsText=optsInputs[i]?optsInputs[i].value.trim():'';
      var opts=optsText?optsText.split(',').map(function(o){return o.trim()}).filter(function(o){return o}):[];
      entries.push({q:qText,opts:opts});
    });
    
    if(entries.length===0){
      toast('请输入至少一个问题');
      return;
    }
    
    var questionsList=document.getElementById('survey-questions-list');
    
    entries.forEach(function(entry){
      var index=questionsList.children.length;
      var qTrim=entry.q;
      var hasOptions=entry.opts.length>0;var hasOptions=!!entry.opts.length>0;
      var optionsHtml='';
      var typeVal=hasOptions?'options':'text';
      var optionsDisplay=hasOptions?'block':'none';
      
      if(hasOptions){
        optionsHtml='<div class="survey-options-container" style="display:'+optionsDisplay+';padding-left:22px;">'+
          '<div style="display:flex;flex-wrap:wrap;gap:6px;">'+
          entry.opts.map(function(opt,i){
            return '<input type="text" class="survey-option-input" value="'+opt.replace(/"/g,'&quot;')+'" placeholder="选项'+(i+1)+'" style="flex:1;min-width:100px;max-width:200px;padding:6px 10px;border:1px solid var(--border);border-radius:6px;background:var(--c1);font-size:12px;color:var(--txt);outline:none;">';
          }).join('')+
          '<button class="survey-add-option-btn" onclick="SurveyApp.addSurveyOption(this)" style="padding:6px 12px;border:none;border-radius:6px;background:var(--accent);color:#fff;font-size:12px;cursor:pointer;white-space:nowrap;">+ 添加选项</button>'+
          '</div></div>';
      }
      
      newItem.innerHTML='<div style="display:flex;flex-direction:column;gap:8px;"><div style="display:flex;align-items:center;gap:10px;"><span style="font-size:12px;color:var(--txt2);padding-top:8px;">'+(index+1)+'.</span><input type="text" class="survey-question-input" value="'+qTrim.replace(/"/g,'&quot;')+'" style="flex:1;padding:10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);font-size:14px;color:var(--txt);outline:none;box-sizing:border-box;"><button class="survey-delete-question-btn" onclick="SurveyApp.deleteSurveyQuestion(this)" style="padding:6px 10px;border:none;border-radius:6px;background:#ff4d4f;color:#fff;font-size:12px;cursor:pointer;white-space:nowrap;">删除</button></div><div style="display:flex;align-items:center;gap:8px;padding-left:22px;"><span style="font-size:11px;color:var(--txt3);flex-shrink:0;">答案</span><input type="text" class="survey-option-input survey-answer-input" value="'+(hasOptions?entry.opts.join(',').replace(/"/g,'&quot;'):'')+'" placeholder="答案选项，用逗号分隔（不填则字卡回复）" style="flex:1;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);font-size:12px;color:var(--txt);outline:none;box-sizing:border-box;"></div></div>';
      
      questionsList.appendChild(newItem);
    });
    
    hideOv('ov-survey-batch');
    toast('成功添加'+questions.length+'个问题');
  }
  
  function init(){
    loadSurveyDuration();
    loadEarlySubmitProb();
    loadSkipProb();
    loadCardPrivateContacts();
  }
  
  function renderSurveyContactList(){
    var list=$('survey-contact-list');
    if(!list)return;
    selectedSurveyContacts=[];
    list.innerHTML='';
    contacts.forEach(function(c){
      if(c.id==='fh')return;
      var el=document.createElement('div');
      el.className='survey-contact-chip';
      el.textContent=c.name;
      el.dataset.cid=c.id;
      el.style.cssText='padding:6px 12px;border-radius:20px;background:var(--c1);border:1px solid var(--border);font-size:12px;color:var(--txt);cursor:pointer;transition:all 0.2s;';
      el.onclick=function(){
        var idx=selectedSurveyContacts.indexOf(c.id);
        if(idx>=0){
          selectedSurveyContacts.splice(idx,1);
          this.style.background='var(--c1)';
          this.style.border='1px solid var(--border)';
          this.style.color='var(--txt)';
        }else{
          selectedSurveyContacts.push(c.id);
          this.style.background='var(--accent)';
          this.style.border='none';
          this.style.color='#fff';
        }
      };
      list.appendChild(el);
    });
  }
  
  // ★ 全屏切换：问卷弹窗在全屏/居中弹窗间切换
  function toggleSurveyFullscreen(){
    try{
      var sheet=$('survey-sheet');
      var overlay=$('ov-survey');
      if(!sheet||!overlay)return;
      if(sheet.style.position==='fixed'){
        // 退出全屏 → 居中弹窗
        sheet.style.position='';
        sheet.style.top='';
        sheet.style.left='';
        sheet.style.right='';
        sheet.style.bottom='';
        sheet.style.width='90%';
        sheet.style.maxWidth='420px';
        sheet.style.borderRadius='24px';
        sheet.style.maxHeight='80vh';
        sheet.style.height='';
        overlay.classList.add('center-overlay');
        overlay.classList.remove('sheet-overlay');
        var fsBtn=$('survey-fullscreen-btn');
        if(fsBtn)fsBtn.textContent='⛶';
      }else{
        // 进入全屏
        sheet.style.position='fixed';
        sheet.style.top='0';
        sheet.style.left='0';
        sheet.style.right='0';
        sheet.style.bottom='0';
        sheet.style.width='100%';
        sheet.style.maxWidth='none';
        sheet.style.borderRadius='0';
        sheet.style.maxHeight='100vh';
        sheet.style.height='100vh';
        sheet.style.height='100dvh';
        overlay.classList.remove('center-overlay');
        overlay.classList.add('sheet-overlay');
        var fsBtn2=$('survey-fullscreen-btn');
        if(fsBtn2)fsBtn2.textContent='⤢';
      }
    }catch(e){console.warn('toggleSurveyFullscreen error:',e);}
  }
  
  function showSurveyTab(tab){
    var createPanel=$('survey-create-panel');
    var takingPanel=$('survey-taking-panel');
    var recordsPanel=$('survey-records-panel');
    var tabCreate=$('survey-tab-create');
    var tabRecords=$('survey-tab-records');
    if(createPanel)createPanel.style.display=tab==='create'?'block':'none';
    if(takingPanel)takingPanel.style.display=tab==='taking'?'block':'none';
    if(recordsPanel)recordsPanel.style.display=tab==='records'?'block':'none';
    if(tabCreate){tabCreate.style.background=tab==='create'?'var(--accent)':'var(--c1)';tabCreate.style.color=tab==='create'?'#fff':'var(--txt)';tabCreate.style.border=tab==='create'?'none':'1px solid var(--border)';}
    if(tabRecords){tabRecords.style.background=tab==='records'?'var(--accent)':'var(--c1)';tabRecords.style.color=tab==='records'?'#fff':'var(--txt)';tabRecords.style.border=tab==='records'?'none':'1px solid var(--border)';}
    if(tab==='create'){
      renderSurveyContactList();
    }
    if(tab==='records'){
      loadSurveyRecords().then(function(records){
        var list=$('survey-records-list');
        var noRecords=$('survey-no-records');
        if(list&&noRecords){
          if(!records||records.length===0){
            list.innerHTML='';
            noRecords.style.display='block';
          }else{
            noRecords.style.display='none';
            var html='';
            records.forEach(function(r,i){
              html+='<div data-record-index="'+i+'" style="padding:12px;background:var(--c2);border-radius:8px;margin-bottom:8px;cursor:pointer;">';
              html+='<div style="font-size:14px;font-weight:600;color:var(--txt);">'+escapeHTML(r.title||'无标题')+'</div>';
              html+='<div style="font-size:12px;color:var(--txt2);margin-top:4px;">'+r.questions.length+'个问题 · '+r.contactName+'</div>';
              html+='<div style="font-size:11px;color:var(--txt3);margin-top:2px;">'+r.time+'</div>';
              html+='</div>';
            });
            list.innerHTML=html;
          // 使用事件委托处理点击记录
          list.querySelectorAll('[data-record-index]').forEach(function(el){
            el.addEventListener('click',function(e){
              var idx=parseInt(this.dataset.recordIndex);
              if(!isNaN(idx))showSurveyDetail(idx);
            });
          });
          }
        }
      });
    }
  }
  
  function showSurveyDetail(index){
    loadSurveyRecords().then(function(records){
      if(!records||!records[index])return;
      var r=records[index];
      var content=$('survey-detail-content');
      if(!content)return;
      var html='';
      html+='<div style="padding:12px;background:var(--c2);border-radius:8px;margin-bottom:12px;">';
      html+='<div style="font-size:16px;font-weight:600;color:var(--txt);">'+escapeHTML(r.title||'无标题')+'</div>';
      html+='<div style="font-size:12px;color:var(--txt2);margin-top:4px;">联系人：'+escapeHTML(r.contactName||'未知')+'</div>';
      html+='<div style="font-size:12px;color:var(--txt3);margin-top:2px;">'+r.time+'</div>';
      html+='</div>';
      html+='<div style="padding:12px;">';
      r.questions.forEach(function(q,i){
        // ★ 兼容多种答案格式：r.answers[i].answer / r.answers[i].value / r.answers[i] 字符串
        var rawAns=r.answers&&r.answers[i]?r.answers[i]:null;
        var answer='';
        if(rawAns){
          if(typeof rawAns==='string')answer=rawAns;
          else if(rawAns.answer!=null)answer=rawAns.answer;
          else if(rawAns.value!=null)answer=rawAns.value;
        }
        var isAnswered=!!answer;
        // ★ 旧版遗留的 (未回答) 占位符视为未作答
        if(answer==='(未回答)'||answer==='未回答'){answer='';isAnswered=false;}
        html+='<div style="margin-bottom:16px;">';
        html+='<div style="font-size:14px;color:var(--txt);font-weight:500;">'+(i+1)+'. '+escapeHTML(q.text||'')+'</div>';
        // 选项题：显示全部选项+联系人作答（有 options 且 answer 匹配某选项时高亮）
        if(q.options&&q.options.length>0&&isAnswered&&q.options.some(function(o){return o.trim()===answer.trim()})){
          html+='<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:8px;">';
          q.options.forEach(function(opt){
            var isSelected=answer.trim()===opt.trim();
            var optBg=isSelected?'#333333':'#f0f0f0';
            var optBorder=isSelected?'#333333':'#ddd';
            var optColor=isSelected?'#ffffff':'#333333';
            var optWeight=isSelected?'font-weight:600;':'';
            html+='<div style="padding:6px 14px;border-radius:20px;border:1px solid '+optBorder+';background:'+optBg+';color:'+optColor+';font-size:13px;'+optWeight+'">'+
              escapeHTML(opt)+(isSelected?' ✓':'')+'</div>';
          });
          html+='</div>';
        }else if(q.options&&q.options.length>0&&!isAnswered){
          // 选项题但未作答：显示全部选项（无高亮）
          html+='<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:8px;">';
          q.options.forEach(function(opt){
            html+='<div style="padding:6px 14px;border-radius:20px;border:1px solid #ddd;background:#f0f0f0;color:#333;font-size:13px;">'+escapeHTML(opt)+'</div>';
          });
          html+='</div>';
          html+='<div style="margin-top:6px;color:var(--txt3);font-size:12px;">未作答</div>';
        }else{
          // 字卡回复 / 其他
          html+='<div style="margin-top:6px;padding:8px 12px;background:var(--c2);border-radius:6px;">';
          html+='<div style="font-size:13px;color:var(--accent);font-weight:500;">回答：</div>';
          html+='<div style="font-size:14px;color:var(--txt);margin-top:2px;">'+escapeHTML(isAnswered?answer:'未作答')+'</div>';
          html+='</div>';
        }
        html+='</div>';
      });
      html+='</div>';
      content.innerHTML=html;
      showOv('ov-survey-detail');
    });
  }
  
  function addSurveyOption(btn){
    var container=btn.parentElement;
    var newInput=document.createElement('input');
    newInput.type='text';
    newInput.className='survey-option-input';
    newInput.placeholder='选项'+(container.querySelectorAll('.survey-option-input').length+1);
    newInput.style.cssText='flex:1;min-width:100px;max-width:200px;padding:6px 10px;border:1px solid var(--border);border-radius:6px;background:var(--c1);font-size:12px;color:var(--txt);outline:none;';
    container.insertBefore(newInput,btn);
  }
  
  async function startSurvey(){
    var titleInput=$('survey-title-input');
    var questions=document.querySelectorAll('#survey-questions-list .survey-question-item');
    if(!titleInput||!titleInput.value.trim()){toast('请输入问卷标题');return;}
    var surveyQuestions=[];
    var valid=true;
    questions.forEach(function(item){
      var input=item.querySelector('.survey-question-input');
      if(!input||!input.value.trim()){valid=false;return;}
      // ★ 新版：答案输入框（.survey-answer-input）填了值 → 选项回复；没填 → 字卡回复
      var answerInput=item.querySelector('.survey-answer-input');
      var answerText=answerInput?answerInput.value.trim():'';
      var qType=(answerText&&answerText.split(/[,，]/).filter(function(x){return x.trim()}).length>0)?'options':'text';
      var q={text:input.value.trim(),type:qType};
      if(qType==='options'){
        q.options=answerText.split(/[,，]/).map(function(o){return o.trim()}).filter(function(o){return o});
      }
      surveyQuestions.push(q);
    });
    if(!valid){toast('请填写所有问题');return;}
    if(surveyQuestions.length===0){toast('请至少添加一个问题');return;}
    if(selectedSurveyContacts.length===0){toast('请至少选择一个联系人回答问卷');return;}

    // 构建多联系人独立会话结构
    var sessions={};
    selectedSurveyContacts.forEach(function(cid){
      sessions[cid]={answers:{},questionIndex:0,completed:false};
    });

    currentSurvey={
      title:titleInput.value.trim(),
      questions:surveyQuestions,
      contactIds:selectedSurveyContacts,
      currentContactId:selectedSurveyContacts[0],
      sessions:sessions
    };
    currentQuestionIndex=0;
    currentContactIndex=0;
    surveyAnswers={};
    surveySubmitted=false;
    showSurveyTab('taking');
    await loadGlobalCards();
    loadCardPrivateContacts();
    renderCurrentQuestion();
    renderSurveyContactSelector();
    startTimer();
  }
  
  function getCurrentSession(){
    if(!currentSurvey||!currentSurvey.sessions||!currentSurvey.currentContactId)return null;
    return currentSurvey.sessions[currentSurvey.currentContactId]||null;
  }

  function switchSurveyContact(contactId){
    if(!currentSurvey||!currentSurvey.sessions)return;
    if(currentSurvey.sessions[contactId]){
      currentSurvey.currentContactId=contactId;
      var sess=currentSurvey.sessions[contactId];
      surveyAnswers=sess.answers;
      currentQuestionIndex=sess.questionIndex;
      renderCurrentQuestion();
      renderSurveyContactSelector();
    }
  }
  
  function startTimer(){
    clearInterval(timerInterval);
    remainingSeconds=surveyDuration;
    surveyStartTime=Date.now();
    updateTimerDisplay();
    timerInterval=setInterval(function(){
      remainingSeconds--;
      updateTimerDisplay();
      
      // 每1秒检查提前交卷概率（仅当前联系人）
      if(currentSurvey&&surveyEarlySubmitProb>0&&Math.random()*100<surveyEarlySubmitProb){
        var sessEarly=getCurrentSession();
        // 当前联系人所有问题都答了才提交
        if(sessEarly&&currentSurvey.questions.every(function(q,i){return sessEarly.answers[i]})){
          submitSurvey();
          return;
        }
      }
      
      // 检查是否有问题需要自动答题
      if(currentSurvey&&currentQuestionIndex<currentSurvey.questions.length){
        // 在当前问题未答时，模拟联系人答题
        if(!surveyAnswers[currentQuestionIndex]){
          var sessAuto=getCurrentSession();
          if(sessAuto&&!sessAuto.completed){
          // 根据总时长和题目数量，计算每题答题间隔（用真实时间戳，避免整数秒 tick 偏差）
          var totalQ=currentSurvey.questions.length;
          var avgTimePerQ=Math.max(0.5, surveyDuration/totalQ);
          // ★ 修复：用真实经过时间（Date.now），不依赖整数秒递减，短时长也能精确按节奏答题
          var elapsedSeconds=(Date.now()-surveyStartTime)/1000;
          // ★ 用 while(true)+break：一次 tick 内答完所有已到期的题（短时长如1秒多题也能全部答完）
          // q 和 expectedAnswerTime 在循环内获取/计算（推进 currentQuestionIndex 后更新）
          var _safetyGuard=0;
          while(currentQuestionIndex<currentSurvey.questions.length){
            if(++_safetyGuard>100){break;}
            var q=currentSurvey.questions[currentQuestionIndex];
            var expectedAnswerTime=(currentQuestionIndex+1)*avgTimePerQ;
            if(elapsedSeconds<expectedAnswerTime)break;
            var answered=false;
            // ★ 未作答概率：命中则本题留空（不答），仍推进到下一题
            if(surveySkipProb>0&&Math.random()*100<surveySkipProb){
              surveyAnswers[currentQuestionIndex]={value:'(未作答)'};
              sessAuto.answers[currentQuestionIndex]={value:'(未作答)'};
              answered=true;
            }else if(q.type==='options'){
              // ★ 修复：过滤空选项，确保设置了选项的题一定有有效答案
              var validOpts=(q.options||[]).filter(function(o){return o&&String(o).trim()!==''});
              if(validOpts.length>0){
                var randomOpt=validOpts[Math.floor(Math.random()*validOpts.length)];
                surveyAnswers[currentQuestionIndex]={value:randomOpt};
                sessAuto.answers[currentQuestionIndex]={value:randomOpt};
                answered=true;
              }
            }else{
              var currentContactId=currentSurvey.currentContactId||null;
              var textCards=globalCards.filter(function(c){
                if(!c||!c.content||!c.content.trim())return false;
                if(c.category==='stickers'||c.category==='voices')return false;
                if(c.type==='private'){
                  if(c.contactId===currentContactId)return true;
                  var pc=cardPrivateContacts.find(function(p){return p.id===c.contactId&&p.bindContactId===currentContactId});
                  if(pc)return true;
                  return false;
                }
                return true;
              });
              if(textCards.length>0){
                // 随机选择1~15个字卡，不重复，中间用空格分隔
                var cardCount=Math.min(textCards.length,Math.floor(Math.random()*15)+1);
                var selectedCards=[];
                var tempCards=textCards.slice();
                for(var ci=0;ci<cardCount;ci++){
                  var idx=Math.floor(Math.random()*tempCards.length);
                  selectedCards.push(tempCards[idx].content);
                  tempCards.splice(idx,1);
                }
                surveyAnswers[currentQuestionIndex]={value:selectedCards.join(' ')};
                sessAuto.answers[currentQuestionIndex]={value:selectedCards.join(' ')};
                answered=true;
              }
            }
            // 无论是否答上都必须推进，防止死循环
            if(currentQuestionIndex<currentSurvey.questions.length-1){
              currentQuestionIndex++;
              sessAuto.questionIndex=currentQuestionIndex;
            }
            renderCurrentQuestion();
            if(!answered){break;}
          }
          }
        }
      }
      
      // 当前联系人所有问题都答完后自动提交，不等时间到
      if(currentSurvey&&currentSurvey.questions.length>0){
        var sessDone=getCurrentSession();
        if(sessDone&&!sessDone.completed&&currentSurvey.questions.every(function(q,i){return sessDone.answers[i]&&sessDone.answers[i].value&&sessDone.answers[i].value!=='(未回答)'})){
          clearInterval(timerInterval);
          submitSurvey();
          return;
        }
      }
      
      if(remainingSeconds<=0){
        clearInterval(timerInterval);
        // 时间到：提交所有未完成联系人的问卷
        submitAllSessions();
      }
    },1000);
  }
  
  function updateTimerDisplay(){
    var display=$('survey-timer-display');
    if(!display)return;
    var mins=Math.floor(remainingSeconds/60);
    var secs=remainingSeconds%60;
    display.textContent=(mins<10?'0':'')+mins+':'+(secs<10?'0':'')+secs;
  }
  
  async function renderCurrentQuestion(){
    if(!currentSurvey)return;
    // 同步当前联系人会话状态到全局变量
    var sess=getCurrentSession();
    if(sess){
      surveyAnswers=sess.answers;
      currentQuestionIndex=sess.questionIndex;
    }
    // 确保字卡数据已加载
    if((!globalCards||globalCards.length===0)&&window.localforage){
      try{await loadGlobalCards();}catch(e){}
    }
    if((!globalCards||globalCards.length===0)){
      try{
        var lsCards=ls('ml2_global_cards');
        if(lsCards&&Array.isArray(lsCards)&&lsCards.length>0)globalCards=lsCards;
      }catch(e){}
    }
    var qText=$('survey-question-text');
    var qIndex=$('survey-question-index');
    var totalQ=$('survey-total-questions');
    var answerArea=$('survey-answer-area');
    var prevBtn=$('survey-prev-btn');
    var nextBtn=$('survey-next-btn');
    if(qText)qText.textContent=currentSurvey.questions[currentQuestionIndex].text;
    if(qIndex)qIndex.textContent=currentQuestionIndex+1;
    if(totalQ)totalQ.textContent=currentSurvey.questions.length;
    if(prevBtn)prevBtn.disabled=currentQuestionIndex===0;
    if(nextBtn){
      if(currentQuestionIndex>=currentSurvey.questions.length-1){
        nextBtn.querySelector('span').textContent='提交';
      }else{
        nextBtn.querySelector('span').textContent='下一题';
      }
    }
    
    // 渲染答题进度条
    var progressEl=$('survey-progress');
    if(progressEl&&currentSurvey){
      var totalQNum=currentSurvey.questions.length;
      var progressHtml='';
      for(var pi=0;pi<totalQNum;pi++){
        var isCurrent=pi===currentQuestionIndex;
        var isAnswered=!!surveyAnswers[pi];
        progressHtml+='<div style="width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;cursor:pointer;transition:all 0.2s;border:2px solid '+(isCurrent?'var(--accent)':(isAnswered?'var(--accent)':'var(--border)'))+';background:'+(isAnswered?'var(--accent)':'transparent')+';color:'+(isAnswered?'#fff':'var(--txt3)')+';" onclick="SurveyApp.goToSurveyQuestion('+pi+')" title="问题'+(pi+1)+'">'+(pi+1)+'</div>';
      }
      progressEl.innerHTML=progressHtml;
    }
    
    // 显示当前答题状态
    var answerStatus=$('survey-answer-status');
    if(answerStatus){
      var answeredCount=0;
      if(currentSurvey){
        for(var ai=0;ai<currentSurvey.questions.length;ai++){
          if(surveyAnswers[ai])answeredCount++;
        }
      }
      // ★ 实时显示梦角已提交的答案（每题一个标签，可直接看到内容）
      var answerSummaryHtml='<div style="font-size:12px;color:var(--txt2);margin-top:6px;display:flex;flex-wrap:wrap;gap:4px;">';
      if(currentSurvey){
        for(var bi=0;bi<currentSurvey.questions.length;bi++){
          var an=surveyAnswers[bi];
          if(an&&an.value&&an.value!=='(未回答)'){
            var anText=String(an.value);
            if(anText.length>12)anText=anText.substring(0,12)+'…';
            answerSummaryHtml+='<span style="padding:2px 8px;background:rgba(110,123,150,0.18);border-radius:10px;color:var(--txt);">Q'+(bi+1)+': '+escapeHTML(anText)+'</span>';
          }
        }
      }
      answerSummaryHtml+='</div>';
      answerStatus.innerHTML='<span style="font-size:13px;color:var(--txt2);">已回答 '+answeredCount+'/'+currentSurvey.questions.length+'</span>'+answerSummaryHtml;
    }
    if(!answerArea)return;
    var q=currentSurvey.questions[currentQuestionIndex];
    var saved=surveyAnswers[currentQuestionIndex];
    if(q.type==='options'){
      var html='<div style="display:flex;flex-direction:column;gap:8px;">';
      q.options.forEach(function(opt,i){
        var checked=saved&&saved.value===opt?'checked':'';
        html+='<label style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--c1);border-radius:8px;cursor:pointer;border:1px solid '+(checked?'var(--accent)':'var(--border)')+';">';
        html+='<input type="radio" name="survey-option" value="'+escapeHTML(opt)+'" '+checked+' onchange="SurveyApp.selectSurveyOption(\''+escapeHTML(opt)+'\')" style="accent-color:var(--accent);">';
        html+='<span style="font-size:14px;color:var(--txt);">'+escapeHTML(opt)+'</span>';
        html+='</label>';
      });
      html+='</div>';
      answerArea.innerHTML=html;
    }else{
      var val=saved?saved.value:'';
      answerArea.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:6px;min-height:40px;padding:8px;border:1px solid var(--border);border-radius:8px;background:var(--c1);" id="survey-card-area">'+(val?'<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;background:var(--accent);color:#fff;border-radius:12px;font-size:12px;">'+escapeHTML(val)+'<span style="cursor:pointer;margin-left:2px;" onclick="SurveyApp.removeSelectedCard()">×</span></span>':'<span style="color:var(--txt3);font-size:12px;">点击下方字卡选择回复</span>')+'</div><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;max-height:150px;overflow-y:auto;" id="survey-card-selector"></div>';
      var selector=$('survey-card-selector');
      if(selector){
        var currentContactId=currentSurvey&&currentSurvey.currentContactId||null;
        var cards=globalCards.filter(function(c){
          if(!c||!c.content||!c.content.trim())return false;
          if(c.category==='stickers'||c.category==='voices')return false;
          if(c.type==='private'){
            if(c.contactId===currentContactId)return true;
            var pc=cardPrivateContacts.find(function(p){return p.id===c.contactId&&p.bindContactId===currentContactId});
            if(pc)return true;
            return false;
          }
          return true;
        });
        // ★ 默认通用字卡：开启"调查问卷可使用"时，与聊天等其他场景一致——
        // getDefaultCommonCardsForContact 内部已按整体概率+分类占比过滤，命中才返回
        if(typeof defaultCommonEnabled!=='undefined'&&defaultCommonEnabled&&typeof defaultCommonUseSurvey!=='undefined'&&defaultCommonUseSurvey){
          try{
            var dcSurveyCards=getDefaultCommonCardsForContact(currentContactId||'');
            if(dcSurveyCards&&dcSurveyCards.length>0){
              dcSurveyCards.slice(0,30).forEach(function(text){
                var content=typeof text==='object'?text.content:text;
                if(content&&cards.length<60)cards.push({content:content,type:'default_common'});
              });
            }
          }catch(e){console.warn('survey dc cards failed:',e);}
        }
        if(cards.length===0){
          selector.innerHTML='<span style="color:var(--txt3);font-size:12px;">暂无可用字卡</span>';
        }else{
          selector.innerHTML=cards.slice(0,30).map(function(c){
            return '<span style="display:inline-block;padding:4px 8px;background:var(--c2);border-radius:8px;font-size:12px;color:var(--txt);cursor:pointer;border:1px solid var(--border);" onclick="SurveyApp.addSelectedCard(\''+escapeHTML(c.content).replace(/'/g,"\\'")+'\')">'+escapeHTML(c.content).substring(0,15)+(c.content.length>15?'...':'')+'</span>';
          }).join('');
        }
      }
    }
  }
  
  function selectSurveyOption(opt){
    surveyAnswers[currentQuestionIndex]={value:opt};
    var sess=getCurrentSession();
    if(sess)sess.answers[currentQuestionIndex]={value:opt};
    renderCurrentQuestion();
  }
  
  function addSelectedCard(content){
    surveyAnswers[currentQuestionIndex]={value:content};
    var sess=getCurrentSession();
    if(sess)sess.answers[currentQuestionIndex]={value:content};
    renderCurrentQuestion();
  }
  
  function removeSelectedCard(){
    delete surveyAnswers[currentQuestionIndex];
    var sess=getCurrentSession();
    if(sess)delete sess.answers[currentQuestionIndex];
    renderCurrentQuestion();
  }
  
  function nextSurveyQuestion(){
    if(!currentSurvey)return;
    var sess=getCurrentSession();
    if(!sess)return;
    if(currentQuestionIndex>=currentSurvey.questions.length-1){
      submitSurvey();
      return;
    }
    sess.questionIndex=currentQuestionIndex+1;
    currentQuestionIndex=sess.questionIndex;
    surveyAnswers=sess.answers;
    renderCurrentQuestion();
  }
  
  function prevSurveyQuestion(){
    if(!currentSurvey)return;
    var sess=getCurrentSession();
    if(!sess)return;
    if(currentQuestionIndex<=0)return;
    sess.questionIndex=currentQuestionIndex-1;
    currentQuestionIndex=sess.questionIndex;
    surveyAnswers=sess.answers;
    renderCurrentQuestion();
  }
  
  function goToSurveyQuestion(index){
    if(!currentSurvey||index<0||index>=currentSurvey.questions.length)return;
    var sess=getCurrentSession();
    if(!sess)return;
    sess.questionIndex=index;
    currentQuestionIndex=index;
    surveyAnswers=sess.answers;
    renderCurrentQuestion();
  }
  
  async function submitSurvey(){
    if(!currentSurvey)return;
    var contactId=currentSurvey.currentContactId;
    var sess=currentSurvey.sessions[contactId];
    if(!sess||sess.completed)return;
    var answers=[];
    currentSurvey.questions.forEach(function(q,i){
      answers.push({question:q.text,answer:sess.answers[i]&&sess.answers[i].value?sess.answers[i].value:''});
    });
    var contact=contacts.find(function(c){return c.id===contactId});
    var record={
      title:currentSurvey.title,
      contactName:contact?contact.name:'未知',
      contactId:contactId,
      time:new Date().toLocaleString('zh-CN'),
      questions:currentSurvey.questions,
      answers:answers
    };
    await saveSurveyRecord(record);
    sess.completed=true;
    clearInterval(timerInterval);
    renderSurveyContactSelector();
    toast('「'+(contact?contact.name:'未知')+'」问卷已提交');
    // ★ 插入聊天系统消息：联系人提交了调查问卷（昵称可被"隐藏双方昵称"功能隐藏）
    try{
      if(contactId){
        var _sName=contact?contact.name:(contactId);
        var _sMsgs=msgs(contactId)||[];
        _sMsgs.push({
          id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),
          s:OTHER,
          t:_sName+'提交了调查问卷',
          ts:new Date(),
          read:(contactId===window.currentCid),
          isSystem:true,
          isSurvey:true
        });
        savemsgs(contactId,_sMsgs);
        if(contactId===window.currentCid){renderMsgs();}
        renderChatList();
      }
    }catch(e){console.warn('survey sys msg failed:',e);}
    // 检查是否所有联系人都已完成
    var allDone=currentSurvey.contactIds.every(function(cid){return currentSurvey.sessions[cid].completed});
    if(allDone){
      surveySubmitted=true;
      toast('所有问卷已完成');
      showSurveyTab('records');
    }
  }

  async function submitAllSessions(){
    if(!currentSurvey)return;
    var pending=currentSurvey.contactIds.filter(function(cid){return !currentSurvey.sessions[cid].completed});
    for(var i=0;i<pending.length;i++){
      var contactId=pending[i];
      var sess=currentSurvey.sessions[contactId];
      var answers=[];
      currentSurvey.questions.forEach(function(q,idx){
        answers.push({question:q.text,answer:sess.answers[idx]&&sess.answers[idx].value?sess.answers[idx].value:''});
      });
      var contact=contacts.find(function(c){return c.id===contactId});
      var record={
        title:currentSurvey.title,
        contactName:contact?contact.name:'未知',
        contactId:contactId,
        time:new Date().toLocaleString('zh-CN'),
        questions:currentSurvey.questions,
        answers:answers
      };
      await saveSurveyRecord(record);
      sess.completed=true;
    }
    surveySubmitted=true;
    renderSurveyContactSelector();
    toast('时间到，所有问卷已提交');
    showSurveyTab('records');
  }
  
  function resetSurvey(){
    if(!confirm('确定要重置问卷吗？这将清空所有问题。'))return;
    var titleInput=$('survey-title-input');
    var questionsList=$('survey-questions-list');
    if(titleInput)titleInput.value='';
    if(questionsList){
      questionsList.innerHTML='<div class="survey-question-item" data-index="0"><div style="display:flex;flex-direction:column;gap:8px;"><div style="display:flex;align-items:center;gap:10px;"><span style="font-size:12px;color:var(--txt2);padding-top:8px;">1.</span><input type="text" class="survey-question-input" placeholder="输入问题内容" style="flex:1;padding:10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);font-size:14px;color:var(--txt);outline:none;box-sizing:border-box;"><button class="survey-delete-question-btn" onclick="SurveyApp.deleteSurveyQuestion(this)" style="padding:6px 10px;border:none;border-radius:6px;background:#ff4d4f;color:#fff;font-size:12px;cursor:pointer;white-space:nowrap;">删除</button></div><div style="display:flex;align-items:center;gap:8px;padding-left:22px;"><span style="font-size:11px;color:var(--txt3);flex-shrink:0;">答案</span><input type="text" class="survey-option-input survey-answer-input" placeholder="答案选项，用逗号分隔（不填则字卡回复）" style="flex:1;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);font-size:12px;color:var(--txt);outline:none;box-sizing:border-box;"></div></div></div>';
    }
    showSurveyTab('create');
    toast('问卷已重置');
  }
  
  function showSurveySettings(){
    $('survey-duration-input')&&($('survey-duration-input').value=surveyDuration);
    $('survey-duration-unit').textContent='秒';
    $('survey-early-submit-value').textContent=surveyEarlySubmitProb;
    $('survey-early-submit-input')&&($('survey-early-submit-input').value='');
    $('survey-skip-value')&&($('survey-skip-value').textContent=surveySkipProb);
    $('survey-skip-input')&&($('survey-skip-input').value='');
    showOv('ov-survey-settings');
  }

  function adjustSkipProb(delta){
    surveySkipProb=Math.max(0,Math.min(100,surveySkipProb+delta));
    var display=surveySkipProb<1?surveySkipProb.toFixed(1):Math.round(surveySkipProb);
    $('survey-skip-value')&&($('survey-skip-value').textContent=display);
    saveSkipProb();
  }

  function setSkipProbDirect(){
    var input=$('survey-skip-input');
    if(!input)return;
    var val=parseFloat(input.value);
    if(isNaN(val)){input.value='';return;}
    surveySkipProb=Math.max(0,Math.min(100,val));
    var display=surveySkipProb<1?surveySkipProb.toFixed(1):Math.round(surveySkipProb);
    $('survey-skip-value')&&($('survey-skip-value').textContent=display);
    input.value='';
    saveSkipProb();
  }
  
  function adjustSurveyDuration(delta){
    var step=delta<0?1:10; // 减按钮步长1秒，加按钮步长10秒
    if(delta<0){
      surveyDuration=Math.max(1,surveyDuration-step);
    }else{
      surveyDuration=Math.min(1800,surveyDuration+step);
    }
    $('survey-duration-input')&&($('survey-duration-input').value=surveyDuration);
    $('survey-duration-unit').textContent='秒';
    saveSurveyDuration();
  }
  
  function setSurveyDuration(val){
    surveyDuration=Math.max(1,Math.min(1800,Math.round(val)));
    $('survey-duration-input')&&($('survey-duration-input').value=surveyDuration);
    saveSurveyDuration();
  }
  
  function adjustEarlySubmitProb(delta){
    surveyEarlySubmitProb=Math.max(0,Math.min(100,surveyEarlySubmitProb+delta));
    var display=surveyEarlySubmitProb<1?surveyEarlySubmitProb.toFixed(1):Math.round(surveyEarlySubmitProb);
    $('survey-early-submit-value').textContent=display;
    saveEarlySubmitProb();
  }
  
  function setEarlySubmitProbDirect(){
    var input=$('survey-early-submit-input');
    if(!input)return;
    var val=parseFloat(input.value);
    if(isNaN(val)){input.value='';return;}
    surveyEarlySubmitProb=Math.max(0,Math.min(100,val));
    var display=surveyEarlySubmitProb<1?surveyEarlySubmitProb.toFixed(1):Math.round(surveyEarlySubmitProb);
    $('survey-early-submit-value').textContent=display;
    input.value='';
    saveEarlySubmitProb();
  }
  
  function renderSurveyContactSelector(){
    if(!currentSurvey||currentSurvey.contactIds.length<=1)return;
    var container=document.createElement('div');
    container.id='survey-contact-selector';
    container.style.cssText='display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;margin-bottom:16px;padding:8px;background:var(--c2);border-radius:8px;';
    
    currentSurvey.contactIds.forEach(function(contactId){
      var contact=contacts.find(function(c){return c.id===contactId});
      var sess=currentSurvey.sessions[contactId];
      var isActive=contactId===currentSurvey.currentContactId;
      var isCompleted=sess&&sess.completed;

      var btn=document.createElement('button');
      btn.textContent=(contact?contact.name:'未知')+(isCompleted?' ✓':'');
      btn.style.cssText='padding:6px 14px;border-radius:20px;font-size:13px;cursor:pointer;border:'+(isActive?'2px solid var(--accent)':'1px solid var(--border)')+';background:'+(isActive?'var(--accent)':(isCompleted?'#e8f5e9':'var(--c1)'))+';color:'+(isActive?'#fff':(isCompleted?'#2e7d32':'var(--txt)'))+';transition:all 0.2s;';
      if(isCompleted&&!isActive){
        btn.style.cursor='default';
        btn.style.opacity='0.7';
      }
      btn.onclick=function(){
        if(sess.completed){
          toast('「'+(contact?contact.name:'未知')+'」已完成提交');
          return;
        }
        switchSurveyContact(contactId);
      };
      container.appendChild(btn);
    });
    
    var takingPanel=$('survey-taking-panel');
    var timer=$('survey-timer');
    if(takingPanel&&timer){
      var existing=$('survey-contact-selector');
      if(existing)existing.remove();
      takingPanel.insertBefore(container,timer);
    }
  }
  
  return {
    init:init,
    addSurveyQuestion:addSurveyQuestion,
    deleteSurveyQuestion:deleteSurveyQuestion,
    showBatchAddQuestions:showBatchAddQuestions,
    batchAddQuestions:batchAddQuestions,
    addSurveyBatchGroup:addSurveyBatchGroup,
    removeSurveyBatchGroup:removeSurveyBatchGroup,
    toggleSurveyFullscreen:toggleSurveyFullscreen,
    addSurveyOption:addSurveyOption,
    startSurvey:startSurvey,
    renderCurrentQuestion:renderCurrentQuestion,
    selectSurveyOption:selectSurveyOption,
    addSelectedCard:addSelectedCard,
    removeSelectedCard:removeSelectedCard,
    nextSurveyQuestion:nextSurveyQuestion,
    prevSurveyQuestion:prevSurveyQuestion,
    goToSurveyQuestion:goToSurveyQuestion,
    showSurveyTab:showSurveyTab,
    resetSurvey:resetSurvey,
    showSurveySettings:showSurveySettings,
    adjustSurveyDuration:adjustSurveyDuration,
    setSurveyDuration:setSurveyDuration,
    adjustEarlySubmitProb:adjustEarlySubmitProb,
    adjustSkipProb:adjustSkipProb,
    setSkipProbDirect:setSkipProbDirect,
    showSurveyDetail:showSurveyDetail,
    _loadRecords:loadSurveyRecords
  };
})();



// ---------- Copy Message Mode ----------
var copyMsgMode=false;
var selectedCopyMsgIds=[];

function showCopyMsg(){
  if(!cid){toast('请先选择对话');return}
  showChatPage();
  if(longScreenshotMode)cancelLongScreenshot();
  if(favMsgMode)cancelFavMsgMode();
  copyMsgMode=true;
  selectedCopyMsgIds=[];
  var bar=$('copy-msg-bar');
  if(bar)bar.style.display='block';
  updateCopyMsgCount();
  var m=msgs(cid);
  if(m)renderMsgs(m);
  var box=$('msgbox');
  if(box)requestAnimationFrame(function(){box.scrollTop=box.scrollHeight});
  toast('点击消息旁的复选框勾选要复制的消息');
}

function toggleCopyMsg(msgId){
  var index=selectedCopyMsgIds.indexOf(msgId);
  if(index>=0){
    selectedCopyMsgIds.splice(index,1);
  }else{
    selectedCopyMsgIds.push(msgId);
  }
  updateCopyMsgCount();
}

function selectAllCopyMsg(filterType){
  var m=msgs(cid);
  if(!m||!m.length)return;
  
  var selectableMsgs=m.filter(function(msg){
    return !msg.retracted&&(msg.t||msg.isTouch||msg.isRedpacket);
  });
  
  if(filterType==='today'){
    var today=new Date();
    today.setHours(0,0,0,0);
    var todayMs=today.getTime();
    selectableMsgs=selectableMsgs.filter(function(msg){
      var ts=msg.ts?new Date(msg.ts).getTime():0;
      return ts>=todayMs;
    });
  }
  
  var allSelected=selectableMsgs.length>0&&selectedCopyMsgIds.length===selectableMsgs.length;
  if(allSelected){
    selectedCopyMsgIds=[];
  }else{
    selectedCopyMsgIds=selectableMsgs.map(function(msg){return msg.id});
  }
  var m2=msgs(cid);
  if(m2)renderMsgs(m2);
  updateCopyMsgCount();
}

function updateCopyMsgCount(){
  var countEl=$('copy-msg-count');
  if(countEl)countEl.textContent='已选 '+selectedCopyMsgIds.length+' 条';
}

function cancelCopyMsg(){
  copyMsgMode=false;
  selectedCopyMsgIds=[];
  var bar=$('copy-msg-bar');
  if(bar)bar.style.display='none';
  var m=msgs(cid);
  if(m)renderMsgs(m);
}

function confirmCopyMsg(){
  if(selectedCopyMsgIds.length===0){
    toast('请先选择要复制的消息');
    return;
  }
  
  var m=msgs(cid);
  if(!m)return;
  
  var c=contacts.find(function(x){return x.id===cid})||groups.find(function(x){return x.id===cid});
  var myName='我';
  var contactName=c?c.name:'对方';
  
  var selectedMsgs=m.filter(function(msg){return selectedCopyMsgIds.indexOf(msg.id)>=0});
  selectedMsgs.sort(function(a,b){
    var ats=a.ts?new Date(a.ts).getTime():0;
    var bts=b.ts?new Date(b.ts).getTime():0;
    return ats-bts;
  });
  
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
      cancelCopyMsg();
    }).catch(function(){
      fallbackCopy(textToCopy);
    });
  }else{
    fallbackCopy(textToCopy);
  }
}

// ---------- Chat Stats ----------
var chatStatsContactId=null;

function showChatStatsHalf(){
  if(!cid)return;
  var c=contacts.find(function(x){return x.id===cid});
  if(!c)return;
  chatStatsContactId=cid;
  var ms=msgs(cid)||[];
  var days=0;
  if(ms.length>0){
    var firstTs=ms[0].ts; if(typeof firstTs==='string')firstTs=new Date(firstTs);
    days=Math.floor((Date.now()-firstTs.getTime())/(86400000));
  }
  $('chat-stats-half-name').textContent=c.name;
  $('chat-stats-half-days').textContent=days;
  
  var cardsHtml='';
  cardsHtml+='<div onclick="hideOv(\'ov-chat-stats-half\');showPg(\'pg-stats-record\');renderStatsRecord()" style="display:flex;align-items:center;gap:14px;padding:18px;background:var(--c2);border-radius:var(--radius);margin-bottom:12px;cursor:pointer;">';
  cardsHtml+='<div style="width:48px;height:48px;border-radius:12px;background:#e8e8e8;display:flex;align-items:center;justify-content:center;font-size:28px;">🌙</div>';
  cardsHtml+='<div style="flex:1;"><div style="font-weight:500;font-size:16px;">相处记录</div><div style="font-size:13px;color:var(--txt2);margin-top:2px;">记录你们留下了多少时间和痕迹</div></div>';
  cardsHtml+='<div style="color:var(--txt2);font-size:18px;">›</div></div>';
  
  cardsHtml+='<div onclick="hideOv(\'ov-chat-stats-half\');showPg(\'pg-stats-chat\');renderStatsChat()" style="display:flex;align-items:center;gap:14px;padding:18px;background:var(--c2);border-radius:var(--radius);margin-bottom:12px;cursor:pointer;">';
  cardsHtml+='<div style="width:48px;height:48px;border-radius:12px;background:#e8e8e8;display:flex;align-items:center;justify-content:center;font-size:28px;">💬</div>';
  cardsHtml+='<div style="flex:1;"><div style="font-weight:500;font-size:16px;">聊天记录</div><div style="font-size:13px;color:var(--txt2);margin-top:2px;">记录你们平时如何交流</div></div>';
  cardsHtml+='<div style="color:var(--txt2);font-size:18px;">›</div></div>';
  
  cardsHtml+='<div onclick="hideOv(\'ov-chat-stats-half\');showPg(\'pg-stats-expression\');renderStatsExpression()" style="display:flex;align-items:center;gap:14px;padding:18px;background:var(--c2);border-radius:var(--radius);margin-bottom:12px;cursor:pointer;">';
  cardsHtml+='<div style="width:48px;height:48px;border-radius:12px;background:#e8e8e8;display:flex;align-items:center;justify-content:center;font-size:28px;">✨</div>';
  cardsHtml+='<div style="flex:1;"><div style="font-weight:500;font-size:16px;">星言表达</div><div style="font-size:13px;color:var(--txt2);margin-top:2px;">记录你们使用过哪些表达方式</div></div>';
  cardsHtml+='<div style="color:var(--txt2);font-size:18px;">›</div></div>';
  
  $('chat-stats-half-cards').innerHTML=cardsHtml;
  showOv('ov-chat-stats-half');
}

// 从 IndexedDB 预加载关键数据到 localStorage（原 preloadCardUsageData 的非字卡部分）
async function preloadCriticalData(){
  if(!window.localforage)return;
  try{
    // 优化：并行加载所有关键数据（原来~20次串行await，现在并行一次读取）
    var keys=[
      'ml2_chat_favorites','ml2_ta_favorites','ml2_ta_favorites_settings',
      'ml2_ta_highlights_selected','ml2_ta_highlights_msg','ml2_ta_highlights_settings',
      'ml2_ta_highlight_probability','ml2_ta_highlight_last_trigger_date',
      'keepAliveEnabled','pushNotifyEnabled',
      'ml2_star_music_library','ml2_star_music_playlists','ml2_star_music_history',
      'ml2_star_music_settings','ml2_star_music_global','ml2_default_common_settings'
    ];
    var values=await Promise.all(keys.map(function(k){
      return lsGetWithDB(k).catch(function(){return null;});
    }));
    
    if(values[0]&&typeof values[0]==='object'){ls('ml2_chat_favorites',values[0]);myFavs=values[0];}
    if(values[1]&&typeof values[1]==='object'){ls('ml2_ta_favorites',values[1]);taFavorites=values[1];}
    if(values[2]&&typeof values[2]==='object'){ls('ml2_ta_favorites_settings',values[2]);Object.assign(taFavoritesSettings,values[2]);}
    if(values[3]&&typeof values[3]==='object'){ls('ml2_ta_highlights_selected',values[3]);taHighlightsSelected=values[3];}
    if(values[4]&&typeof values[4]==='object'){ls('ml2_ta_highlights_msg',values[4]);taHighlightsMsg=values[4];}
    if(values[5]&&typeof values[5]==='object'){ls('ml2_ta_highlights_settings',values[5]);taHighlightsSettings=values[5];}
    if(values[6]!==undefined&&values[6]!==null){ls('ml2_ta_highlight_probability',values[6]);taHighlightProbability=values[6];}
    if(values[7]!==undefined&&values[7]!==null){ls('ml2_ta_highlight_last_trigger_date',values[7]);taHighlightLastTriggerDate=values[7];}
    if(values[8]!==undefined&&values[8]!==null)ls('keepAliveEnabled',values[8]);
    if(values[9]!==undefined&&values[9]!==null)ls('pushNotifyEnabled',values[9]);
    if(values[10]&&Array.isArray(values[10])){ls('ml2_star_music_library',values[10]);starMusicLibrary=values[10];}
    if(values[11]&&Array.isArray(values[11])){ls('ml2_star_music_playlists',values[11]);starMusicPlaylists=values[11];}
    if(values[12]&&Array.isArray(values[12])){ls('ml2_star_music_history',values[12]);starMusicHistory=values[12];}
    if(values[13]&&typeof values[13]==='object'){ls('ml2_star_music_settings',values[13]);starMusicSettings=values[13];}
    if(values[14]&&typeof values[14]==='object'){ls('ml2_star_music_global',values[14]);starMusicGlobalSettings=values[14];STAR_MUSIC_REQUEST_PROB=values[14].requestProb||5;STAR_MUSIC_COOLDOWN_MS=values[14].cooldownMs||3600000;}
    if(values[15]&&typeof values[15]==='object'){
      var dcMigrated=ls('ml2_default_common_migrated_v2');
      if(!dcMigrated&&values[15].enabled===true){values[15].enabled=false;}
      ls('ml2_default_common_settings',values[15]);loadDefaultCommonSettings();
    }
  }catch(e){console.warn('preloadCriticalData error:',e);}
}

function renderChatStatsMain(){
  var wrap=$('chat-stats-contact-select-wrap');
  if(!wrap)return;
  var html='<div style="font-size:12px;color:var(--txt2);margin-bottom:8px;font-weight:600;">选择联系人</div>';
  html+='<select id="chat-stats-contact-select" onchange="onChatStatsContactChange()" style="width:100%;padding:12px 14px;border:1px solid var(--border);border-radius:12px;background:var(--c2);color:var(--txt);font-size:15px;min-height:44px;">';
  html+='<option value="">请选择联系人</option>';
  contacts.forEach(function(c){
    html+='<option value="'+c.id+'"'+(chatStatsContactId===c.id?' selected':'')+'>'+c.name+'</option>';
  });
  html+='</select>';
  wrap.innerHTML=html;
  
  if(chatStatsContactId){
    updateChatStatsHeader();
  }else{
    $('chat-stats-main-header').style.display='none';
    $('chat-stats-cards').style.display='none';
  }
}

function onChatStatsContactChange(){
  var sel=$('chat-stats-contact-select');
  chatStatsContactId=sel.value||null;
  updateChatStatsHeader();
}

function updateChatStatsHeader(){
  if(!chatStatsContactId){
    $('chat-stats-main-header').style.display='none';
    $('chat-stats-cards').style.display='none';
    return;
  }
  var c=contacts.find(function(x){return x.id===chatStatsContactId});
  if(!c)return;
  $('chat-stats-contact-name').textContent=c.name;
  var ms=msgs(chatStatsContactId)||[];
  var days=0;
  if(ms.length>0){
    var firstTs=ms[0].ts; if(typeof firstTs==='string')firstTs=new Date(firstTs);
    days=Math.floor((Date.now()-firstTs.getTime())/(86400000));
  }
  $('chat-stats-days-num').textContent=days;
  $('chat-stats-main-header').style.display='block';
  $('chat-stats-cards').style.display='block';
}

// ---------- 相处记录 ----------
function renderStatsRecord(){
  if(!chatStatsContactId)return;
  var c=contacts.find(function(x){return x.id===chatStatsContactId});
  if(!c)return;
  var ms=msgs(chatStatsContactId)||[];
  var days=0,firstTime='',lastTime='',msgCount=ms.length,textCount=0;
  if(ms.length>0){
    var firstTs=ms[0].ts; if(typeof firstTs==='string')firstTs=new Date(firstTs);
    var lastTs=ms[ms.length-1].ts; if(typeof lastTs==='string')lastTs=new Date(lastTs);
    days=Math.floor((Date.now()-firstTs.getTime())/(86400000));
    firstTime=fd(firstTs);
    lastTime=fd(lastTs);
    ms.forEach(function(m){
      if(m.t&&typeof m.t==='string')textCount+=m.t.length;
    });
  }
  var ll=ls(LL)||[];
  var lettersCount=ll.filter(function(l){return l.fid===chatStatsContactId}).length;
  var favsCount=0;
  if(myFavs[chatStatsContactId])favsCount=myFavs[chatStatsContactId].length;
  
  $('stats-record-days').textContent=days;
  var cards=$('stats-record-cards');
  var html='';
  html+=statsInfoCard('📅','第一次聊天',firstTime||'暂无记录');
  html+=statsInfoCard('🕰','最近聊天',lastTime||'暂无记录');
  html+=statsInfoCard('💬','聊天消息',msgCount+'条');
  html+=statsInfoCard('📝','文字数量',textCount+'字');
  html+=statsInfoCard('⭐','收藏记录',favsCount+'条');
  html+=statsInfoCard('✉️','信箱记录',lettersCount+'封');
  cards.innerHTML=html;
}

function statsInfoCard(icon,label,value){
  return '<div style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:var(--c2);border-radius:var(--radius);margin-bottom:8px;">'+
    '<div style="font-size:22px;">'+icon+'</div>'+
    '<div style="flex:1;font-size:14px;color:var(--txt2);">'+label+'</div>'+
    '<div style="font-size:15px;font-weight:500;color:var(--txt);">'+value+'</div>'+
    '</div>';
}

// ---------- 聊天记录 ----------
function renderStatsChat(){
  if(!chatStatsContactId)return;
  var ms=msgs(chatStatsContactId)||[];
  var content=$('stats-chat-content');
  if(!content)return;
  if(ms.length===0){content.innerHTML='<div style="text-align:center;color:var(--txt2);padding:40px;">暂无聊天记录</div>';return;}
  
  var userCount=0,taCount=0;
  var hourCount={};
  var dayCount={};
  var dateCount={};
  var dayNames=['日','一','二','三','四','五','六'];
  ms.forEach(function(m){
    if(m.s===SELF)userCount++;else taCount++;
    var ts=m.ts; if(typeof ts==='string')ts=new Date(ts);
    var h=ts.getHours(); hourCount[h]=(hourCount[h]||0)+1;
    var day=ts.getDay(); dayCount[day]=(dayCount[day]||0)+1;
    var dateStr=ts.getFullYear()+'-'+(ts.getMonth()+1)+'-'+ts.getDate();
    dateCount[dateStr]=(dateCount[dateStr]||0)+1;
  });
  
  var total=userCount+taCount;
  var userPct=total>0?Math.round(userCount/total*100):0;
  var taPct=total>0?Math.round(taCount/total*100):0;
  
  var peakHour=0,peakHourVal=0;
  for(var h in hourCount){if(hourCount[h]>peakHourVal){peakHourVal=hourCount[h];peakHour=h;}}
  var peakHourStr=peakHour+':00 - '+(parseInt(peakHour)+1)+':00';
  
  var peakDay=0,peakDayVal=0;
  for(var d in dayCount){if(dayCount[d]>peakDayVal){peakDayVal=dayCount[d];peakDay=d;}}
  var peakDayStr='星期'+dayNames[peakDay];
  
  var firstTs=ms[0].ts; if(typeof firstTs==='string')firstTs=new Date(firstTs);
  var totalDays=Math.max(1,Math.floor((Date.now()-firstTs.getTime())/(86400000)));
  var avgDaily=Math.round(total/totalDays);
  
  var consecutiveDays=calcConsecutiveDays(dateCount);
  var maxSingleDay=0;
  for(var d2 in dateCount){if(dateCount[d2]>maxSingleDay)maxSingleDay=dateCount[d2];}
  
  var html='';
  html+='<div style="margin-bottom:20px;">';
  html+='<div style="font-size:14px;font-weight:500;color:var(--txt);margin-bottom:12px;">消息比例</div>';
  html+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">';
  html+='<div style="font-size:13px;color:var(--txt2);width:40px;">你</div>';
  html+='<div style="flex:1;height:8px;background:var(--c2);border-radius:4px;overflow:hidden;"><div style="height:100%;background:var(--accent);width:'+userPct+'%;border-radius:4px;"></div></div>';
  html+='<div style="font-size:13px;color:var(--txt);width:70px;text-align:right;">'+userCount+'条 '+userPct+'%</div>';
  html+='</div>';
  html+='<div style="display:flex;align-items:center;gap:10px;">';
  html+='<div style="font-size:13px;color:var(--txt2);width:40px;">TA</div>';
  html+='<div style="flex:1;height:8px;background:var(--c2);border-radius:4px;overflow:hidden;"><div style="height:100%;background:var(--txt2);width:'+taPct+'%;border-radius:4px;"></div></div>';
  html+='<div style="font-size:13px;color:var(--txt);width:70px;text-align:right;">'+taCount+'条 '+taPct+'%</div>';
  html+='</div>';
  html+='</div>';
  
  html+=statsInfoCard('🕐','最常聊天时间',peakHourStr);
  html+=statsInfoCard('📅','最常聊天日期',peakDayStr);
  html+=statsInfoCard('📊','平均每日消息',avgDaily+'条');
  html+=statsInfoCard('🔥','最长连续聊天',consecutiveDays+'天');
  html+=statsInfoCard('📈','单日最高消息',maxSingleDay+'条');
  
  content.innerHTML=html;
}

function calcConsecutiveDays(dateCount){
  var dates=Object.keys(dateCount).sort();
  if(dates.length===0)return 0;
  var maxStreak=1,curStreak=1;
  for(var i=1;i<dates.length;i++){
    var prev=new Date(dates[i-1]); var curr=new Date(dates[i]);
    var diff=(curr-prev)/(86400000);
    if(diff===1){curStreak++;maxStreak=Math.max(maxStreak,curStreak);}
    else{curStreak=1;}
  }
  return maxStreak;
}

// ---------- 星言表达 ----------
function renderStatsExpression(){
  if(!chatStatsContactId)return;
  var ms=msgs(chatStatsContactId)||[];
  var content=$('stats-expression-content');
  if(!content)return;
  if(ms.length===0){content.innerHTML='<div style="text-align:center;color:var(--txt2);padding:40px;">暂无聊天记录</div>';return;}
  
  var textCardCount={},emotionCardCount={},heartCardCount={},intentCardCount={};
  ms.forEach(function(m){
    if(m.textCard&&typeof m.textCard==='string'){textCardCount[m.textCard]=(textCardCount[m.textCard]||0)+1;}
    if(m.moodCard&&m.moodCard.content){emotionCardCount[m.moodCard.content]=(emotionCardCount[m.moodCard.content]||0)+1;}
    if(m.heartCard&&m.heartCard.content){heartCardCount[m.heartCard.content]=(heartCardCount[m.heartCard.content]||0)+1;}
    if(m.intentCard&&m.intentCard.content){intentCardCount[m.intentCard.content]=(intentCardCount[m.intentCard.content]||0)+1;}
  });
  
  var html='';
  html+=statsCardSection('📝','文字字卡',textCardCount,'常用文字','暂无使用记录');
  html+=statsCardSection('💭','情绪字卡',emotionCardCount,'常见情绪','暂无使用记录');
  html+=statsCardSection('❤️','心意字卡',heartCardCount,'常传递心意','暂无使用记录');
  html+=statsCardSection('💬','交流意图',intentCardCount,'常用交流','暂无使用记录');
  content.innerHTML=html;
}

function statsCardSection(icon,title,countMap,topLabel,emptyText){
  var entries=[];
  for(var key in countMap){if(countMap.hasOwnProperty(key))entries.push({name:key,count:countMap[key]});}
  entries.sort(function(a,b){return b.count-a.count});
  var top=entries.length>0?entries[0].name:'';
  var html='<div style="margin-bottom:18px;">';
  html+='<div style="font-size:14px;font-weight:500;color:var(--txt);margin-bottom:10px;">'+icon+' '+title+'</div>';
  if(entries.length===0){
    html+='<div style="text-align:center;color:var(--txt2);padding:16px;background:var(--c2);border-radius:var(--radius);">'+emptyText+'</div>';
  }else{
    html+='<div style="background:var(--c2);border-radius:var(--radius);padding:14px 16px;">';
    html+='<div style="font-size:13px;color:var(--txt2);margin-bottom:8px;">'+topLabel+'</div>';
    html+='<div style="font-size:18px;font-weight:500;color:var(--accent);margin-bottom:12px;">「'+top+'」</div>';
    var showEntries=entries.slice(0,5);
    showEntries.forEach(function(e){
      var barW=entries.length>0?Math.max(2,Math.round(e.count/entries[0].count*100)):0;
      html+='<div style="display:flex;align-items:center;gap:8px;padding:6px 0;position:relative;">';
      html+='<div style="position:absolute;left:0;top:0;bottom:0;width:'+barW+'%;background:var(--accent);opacity:0.06;border-radius:4px;"></div>';
      html+='<div style="flex:1;font-size:13px;color:var(--txt);position:relative;z-index:1;">'+e.name+'</div>';
      html+='<div style="font-size:13px;font-weight:500;color:var(--txt2);position:relative;z-index:1;">'+e.count+'次</div>';
      html+='</div>';
    });
    html+='</div>';
  }
  html+='</div>';
  return html;
}

// ---------- 星音陪伴 ----------
var starMusicLibrary=[];
var starMusicPlaylists=[];
var starMusicCurrentId=null;
var starMusicRepeatMode='list';
var starMusicHistory=[];
var starMusicSettings={};
var starMusicAudio=null;
var starMusicProgressInterval=null;
var starMusicCurrentTab='library';
var starMusicEditId=null;
var starMusicRequestData=null;
var starMusicLastContactId=null; // 记录最近一次触发音乐行为的联系人，用于歌曲结束后TA自动行为
var starMusicCooldown={};
var STAR_MUSIC_COOLDOWN_MS=600000;
var STAR_MUSIC_REQUEST_PROB=5;
var starMusicGlobalSettings={requestProb:5,cooldownEnabled:true,cooldownMs:600000,autoKeepProb:70,autoNextProb:15,autoRandomProb:10,autoModeProb:5,floatingPlayerEnabled:true};
var starMusicReturnPage='pg-more';

var STAR_MUSIC_TAGS=[
  {category:'🌙 氛围',tags:['安静','温柔','夜晚','陪伴','放松','宁静','治愈','梦幻']},
  {category:'☀️ 日常',tags:['开心','轻松','活力','日常','阳光','温暖','甜蜜']},
  {category:'🌧 情绪',tags:['安慰','平静','思考','独处','感伤','怀念']},
  {category:'✨ 特别',tags:['纪念','喜欢','收藏','重要']}
];

function loadStarMusicData(){
  // 防御：var 提升阶段顶层调用（39972行）时这些变量可能还是 undefined
  if(!Array.isArray(starMusicLibrary))starMusicLibrary=[];
  if(!Array.isArray(starMusicPlaylists))starMusicPlaylists=[];
  if(!Array.isArray(starMusicHistory))starMusicHistory=[];
  if(!starMusicSettings||typeof starMusicSettings!=='object')starMusicSettings={};
  if(!starMusicGlobalSettings||typeof starMusicGlobalSettings!=='object')starMusicGlobalSettings={requestProb:5,cooldownEnabled:true,cooldownMs:600000,autoKeepProb:70,autoNextProb:15,autoRandomProb:10,autoModeProb:5,floatingPlayerEnabled:true};
  var saved=ls('ml2_star_music_library');
  if(saved&&Array.isArray(saved)){
    // 数据迁移：为旧数据补充 source 字段
    starMusicLibrary=saved.map(function(m){
      var item=Object.assign({},m);
      // 判断来源：有 size 字段 或 无 url 字段 → 本地；有 url 字段且非 data: → 网络
      if(!item.source){
        if(item.size||!item.url){
          item.source='local';
        }else if(item.url){
          item.source='url';
        }
      }
      return item;
    });
    // 保存迁移后的数据
    saveStarMusicData();
  }
  var savedPl=ls('ml2_star_music_playlists');
  if(savedPl&&Array.isArray(savedPl))starMusicPlaylists=savedPl;
  var savedHist=ls('ml2_star_music_history');
  if(savedHist&&Array.isArray(savedHist))starMusicHistory=savedHist;
  var savedSet=ls('ml2_star_music_settings');
  if(savedSet&&typeof savedSet==='object')starMusicSettings=savedSet;
  var savedGlobal=ls('ml2_star_music_global');
  if(savedGlobal&&typeof savedGlobal==='object'){
    // 确保floatingPlayerEnabled存在（兼容旧数据）
    if(savedGlobal.floatingPlayerEnabled===undefined)savedGlobal.floatingPlayerEnabled=true;
    starMusicGlobalSettings=savedGlobal;
    STAR_MUSIC_REQUEST_PROB=starMusicGlobalSettings.requestProb||5;
    STAR_MUSIC_COOLDOWN_MS=starMusicGlobalSettings.cooldownMs||3600000;
  }
  // 初始化默认歌单（仅首次运行）
  initDefaultStarMusicPlaylist();
}

// ---------- 默认歌单初始化 ----------
var _starMusicDefaultPlaylistId=null;
function initDefaultStarMusicPlaylist(){
  // 防御：var 提升阶段顶层调用时数组可能还是 undefined（初始赋值在文件后部）
  if(!Array.isArray(starMusicPlaylists))starMusicPlaylists=[];
  if(!Array.isArray(starMusicLibrary))starMusicLibrary=[]; // ★ 修复：starMusicLibrary 同样可能未赋值
  // 检查是否已有默认歌单（无论标记如何都检查，保证默认歌单/歌曲存在）
  var existing=starMusicPlaylists.find(function(p){return p.name==='默认歌单'});
  var plId='spl_default_playlist';
  if(existing){
    _starMusicDefaultPlaylistId=existing.id;
    plId=existing.id;
  }else{
    starMusicPlaylists.push({id:plId,name:'默认歌单',createdAt:Date.now()});
    _starMusicDefaultPlaylistId=plId;
  }
  // 网易云免费歌曲列表（ID → 名称/歌手 已通过API查询）
  var defaultSongs=[
    {id:'2613048732',name:'Moonlit Dream',artist:'DLSS/shell'},
    {id:'1940074698',name:'I Wish My Mind Would Shut Up',artist:'Ivoris'},
    {id:'2117214224',name:'Clues',artist:'Ashley Alisha'},
    {id:'2699367434',name:'down down down (Chinese Ver.)',artist:'柳多恋'},
    {id:'25727705',name:'Replay',artist:'SHINee'},
    {id:'31517929',name:'두근거려 (Beautiful)',artist:'BAEKHYUN'},
    {id:'27538343',name:'Baby',artist:'EXO-K'},
    {id:'26428011',name:'My Lady',artist:'EXO'},
    {id:'27538353',name:'XOXO (Kisses & Hugs)',artist:'EXO-K'},
    {id:'27538354',name:'나비소녀 (Don\'t Go)',artist:'EXO-K'},
    {id:'1358943106',name:'Paper Cuts',artist:'EXO-CBX'},
    {id:'1842746085',name:'Diamond Crystal',artist:'EXO-CBX'},
    {id:'534544348',name:'Cosmic Railway',artist:'EXO'},
    {id:'1861326454',name:'寂',artist:'七朵组合'},
    {id:'1951980693',name:'艳',artist:'ONER'},
    {id:'3356975915',name:'Montagem pitty',artist:'见过夏天P/洛天依'},
    {id:'3340162145',name:'反乌托邦Pt.2',artist:'鬼面P/洛天依/乌托邦P'},
    {id:'3360389284',name:'失温症 (洛天依 ver.)',artist:'洛天依/路灯/J_2C'},
    {id:'2639291583',name:'モニタリング',artist:'DECO*27/初音ミク'},
    {id:'3326907142',name:'I Can\'t Wait (feat. GUMI)',artist:'d0tc0mmie/GUMI'}
  ];
  var added=0;
  defaultSongs.forEach(function(s){
    // 检查是否已存在（避免重复添加）
    var exists=starMusicLibrary.some(function(m){return m.neteaseId===s.id||m.name===s.name});
    if(exists)return;
    var newId='sm_default_'+s.id+'_'+Date.now();
    starMusicLibrary.push({
      id:newId,
      neteaseId:s.id,
      name:s.name,
      artist:s.artist,
      url:'http://music.163.com/song/media/outer/url?id='+s.id+'.mp3',
      source:'url',
      duration:0,
      tags:[],
      playlistId:plId,
      addedAt:Date.now()
    });
    added++;
  });
  if(added>0){
    saveStarMusicData();
    saveStarMusicPlaylists();
  }
  ls('ml2_star_music_default_done',1);
}

// ---------- 批量选择模式 ----------
var _starMusicBatchMode=false;
var _starMusicBatchSelected={};

function toggleStarMusicBatchMode(){
  _starMusicBatchMode=!_starMusicBatchMode;
  if(!_starMusicBatchMode)_starMusicBatchSelected={};
  renderStarMusicList();
}

function starMusicBatchAddToPlaylist(){
  var selectedIds=Object.keys(_starMusicBatchSelected).filter(function(k){return _starMusicBatchSelected[k]});
  if(selectedIds.length===0){toast('请先选择歌曲');return;}
  // 打开歌单选择弹窗
  var html='';
  if(starMusicPlaylists.length===0){
    html='<div style="text-align:center;color:var(--txt2);padding:30px;font-size:13px;">还没有歌单</div>';
  }else{
    starMusicPlaylists.forEach(function(pl){
      html+='<div onclick="confirmBatchAddToPlaylist(\''+pl.id+'\')" style="display:flex;align-items:center;gap:14px;padding:16px;background:var(--c2);border-radius:14px;margin-bottom:8px;cursor:pointer;border:1px solid var(--border);transition:all 0.15s;">';
      html+='<div style="width:40px;height:40px;border-radius:10px;background:var(--c1);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">📂</div>';
      html+='<div style="flex:1;"><div style="font-size:15px;font-weight:500;">'+pl.name+'</div></div>';
      html+='</div>';
    });
  }
  $('star-add-to-pl-title').textContent='📂 选择目标歌单（已选 '+selectedIds.length+' 首）';
  $('star-add-to-pl-list').innerHTML=html;
  showOv('ov-star-add-to-playlist');
}

function confirmBatchAddToPlaylist(plId){
  var selectedIds=Object.keys(_starMusicBatchSelected).filter(function(k){return _starMusicBatchSelected[k]});
  var count=0;
  selectedIds.forEach(function(mid){
    var m=starMusicLibrary.find(function(x){return x.id===mid});
    if(m){m.playlistId=plId;count++;}
  });
  if(count>0){
    saveStarMusicData();
    toast('已将 '+count+' 首添加到歌单');
  }
  _starMusicBatchMode=false;
  _starMusicBatchSelected={};
  hideOv('ov-star-add-to-playlist');
  renderStarMusicList();
}
function saveStarMusicData(){
  ls('ml2_star_music_library',starMusicLibrary);
  if(window.localforage){
    window.localforage.setItem('ml2_star_music_library',starMusicLibrary).catch(function(){});
  }
}
function saveStarMusicPlaylists(){ls('ml2_star_music_playlists',starMusicPlaylists)}
function saveStarMusicHistory(){ls('ml2_star_music_history',starMusicHistory)}
function saveStarMusicSettings(){ls('ml2_star_music_settings',starMusicSettings)}

function loadStarMusicFile(id,cb){
  if(window.localforage){
    window.localforage.getItem('ml2_star_music_'+id).then(function(d){
      if(d)cb(d);else cb(null);
    }).catch(function(){cb(null)});
  }else{cb(null)}
}
function saveStarMusicFile(id,dataUrl){
  if(window.localforage){
    window.localforage.setItem('ml2_star_music_'+id,dataUrl).catch(function(){});
  }
}

function openAddStarMusicUrlModal(){
  $('star-music-url-name').value='';
  $('star-music-url-artist').value='';
  $('star-music-url-link').value='';
  showOv('ov-star-add-music-url');
  setTimeout(function(){var inp=$('star-music-url-name');if(inp)inp.focus()},200);
}

function closeAddStarMusicUrlModal(){
  hideOv('ov-star-add-music-url');
}

function openBatchImportModal(){
  $('star-music-batch-text').value='';
  var idTa=$('star-music-batch-id');
  if(idTa)idTa.value='';
  switchBatchImportMode('id');
  showOv('ov-star-batch-import');
  setTimeout(function(){var ta=$('star-music-batch-id');if(ta)ta.focus()},200);
}

function closeBatchImportModal(){
  hideOv('ov-star-batch-import');
}

var batchImportMode='id';
function switchBatchImportMode(mode){
  batchImportMode=mode;
  var idMode=$('batch-id-mode');
  var fmtMode=$('batch-format-mode');
  var btnId=$('batch-tab-id');
  var btnFmt=$('batch-tab-format');
  var importBtn=$('batch-import-btn');
  if(mode==='id'){
    if(idMode)idMode.style.display='';
    if(fmtMode)fmtMode.style.display='none';
    if(btnId){btnId.style.background='var(--accent)';btnId.style.color='#fff';btnId.style.border='none';}
    if(btnFmt){btnFmt.style.background='var(--c2)';btnFmt.style.color='var(--txt)';btnFmt.style.border='1px solid var(--border)';}
    if(importBtn){importBtn.onclick=batchImportById;}
  }else{
    if(idMode)idMode.style.display='none';
    if(fmtMode)fmtMode.style.display='';
    if(btnId){btnId.style.background='var(--c2)';btnId.style.color='var(--txt)';btnId.style.border='1px solid var(--border)';}
    if(btnFmt){btnFmt.style.background='var(--accent)';btnFmt.style.color='#fff';btnFmt.style.border='none';}
    if(importBtn){importBtn.onclick=batchImportStarMusic;}
  }
}

function batchImportStarMusic(){
  var rawText=$('star-music-batch-text').value;
  if(!rawText||!rawText.trim()){toast('请粘贴歌曲信息');return;}
  
  // 修复1：统一处理 Windows/Unix 换行符
  var text=rawText.replace(/\r\n/g,'\n').replace(/\r/g,'\n').trim();
  
  // 修复2：同时支持空行分隔和无空行分隔
  // 方案：逐行扫描，按顺序自动归类到 name/artist/url
  var allLines=text.split('\n');
  var blocks=[];
  var currentBlock=[];
  for(var i=0;i<allLines.length;i++){
    var l=allLines[i].replace(/\r/g,'').trim();
    if(!l){
      if(currentBlock.length>0){blocks.push(currentBlock);currentBlock=[];}
    }else{
      currentBlock.push(l);
    }
  }
  if(currentBlock.length>0)blocks.push(currentBlock);
  
  var imported=0,failed=0;
  var errors=[];
  
  for(var b=0;b<blocks.length;b++){
    var blockLines=blocks[b];
    if(blockLines.length===0)continue;
    
    var name='',artist='',url='';
    
    // 修复3：逐行智能解析，支持多种键名和分隔符
    for(var l=0;l<blockLines.length;l++){
      var line=blockLines[l].replace(/\r/g,'').trim();
      if(!line)continue;
      
      // 查找第一个分隔符位置（支持中英文冒号、等号、空格分隔等）
      // 使用更宽泛的分隔符匹配：冒号、等号、空格、tab
      var sepIdx=-1;
      var seperators=['：',':','＝','='];
      for(var s=0;s<seperators.length;s++){
        var idx=line.indexOf(seperators[s]);
        if(idx>0&&(sepIdx==-1||idx<sepIdx)){
          // 取第一个出现的分隔符，但要确保不是URL内部的（如://或?=）
          // 排除 :// 中的冒号和 ?= 中的等号
          if(!((seperators[s]==':'&&line.substr(idx,3)==='://')||
             (seperators[s]=='='&&idx>0&&line[idx-1]=='?'))){
            sepIdx=idx;
          }
        }
      }
      
      if(sepIdx<0)continue;
      
      var key=line.substring(0,sepIdx).trim().toLowerCase();
      var value=line.substring(sepIdx+1).trim();
      
      // 去除值首尾的反引号、引号
      value=value.replace(/^[`'"]+/,'').replace(/[`'"]+$/,'').trim();
      
      if(!value)continue;
      
      // 修复4：更全面的键名匹配
      if(key==='歌曲名称'||key==='歌名'||key==='名称'||key==='name'||key==='歌曲'){
        name=value;
      }else if(key==='歌手'||key==='艺术家'||key==='艺人'||key==='artist'||key==='演唱'||key==='演唱者'){
        artist=value;
      }else if(key==='音乐直链url'||key==='音乐直链'||key==='音乐链接'||key==='链接'||key==='直链'||key==='url'||key==='音乐url'||key==='link'){
        url=value;
      }
    }
    
    if(!name){failed++;errors.push('第'+(b+1)+'首：缺少歌曲名称');continue;}
    if(!url){failed++;errors.push('第'+(b+1)+'首：缺少音乐直链URL');continue;}
    // 修复：更宽泛的 URL 验证
    if(!/^(https?:\/\/|file:\/\/|data:|\/)/i.test(url)){failed++;errors.push('第'+(b+1)+'首：URL格式不正确');continue;}
    
    var newId='sm_batch_'+Date.now()+'_'+Math.random().toString(36).substr(2,6);
    starMusicLibrary.push({
      id:newId,
      name:name,
      artist:artist,
      url:url,
      source:'url',
      duration:0,
      tags:[],
      playlistId:'default',
      addedAt:Date.now()
    });
    imported++;
  }
  
  if(imported>0){
    saveStarMusicData();
    closeBatchImportModal();
    closeAddStarMusicUrlModal();
    renderStarMusicPage();
    var msg='成功导入 '+imported+' 首';
    if(failed>0)msg+='，'+failed+' 首失败';
    if(errors.length)msg+='\n\n失败原因：\n'+errors.slice(0,3).join('\n');
    if(errors.length>3)msg+='\n...等'+errors.length+'条';
    alert(msg);
  }else{
    toast('全部导入失败：'+(errors[0]||'请检查格式'));
  }
}

function batchImportById(){
  var rawText=$('star-music-batch-id').value;
  if(!rawText||!rawText.trim()){toast('请输入网易云歌曲ID或链接');return;}
  var text=rawText.replace(/\r\n/g,'\n').replace(/\r/g,'\n').trim();
  var lines=text.split('\n');
  var imported=0,failed=0;
  var errors=[];
  var pendingIds=[]; // 需要自动识别的ID列表
  
  for(var i=0;i<lines.length;i++){
    var line=lines[i].trim();
    if(!line)continue;
    
    // 解析 "ID 歌名"、纯ID、或URL
    var id='',name='';
    var spaceIdx=line.indexOf(' ');
    var firstPart=spaceIdx>0?line.substring(0,spaceIdx).trim():line;
    
    // 尝试从第一部分提取ID
    if(/^\d+$/.test(firstPart)){
      id=firstPart;
      if(spaceIdx>0)name=line.substring(spaceIdx+1).trim();
    }else{
      // 尝试从URL提取ID
      var idMatch=firstPart.match(/[?&]id=(\d+)/);
      if(idMatch){
        id=idMatch[1];
        if(spaceIdx>0)name=line.substring(spaceIdx+1).trim();
      }else{
        var pathMatch=firstPart.match(/\/(\d+)(?:\.mp3)?$/);
        if(pathMatch){
          id=pathMatch[1];
          if(spaceIdx>0)name=line.substring(spaceIdx+1).trim();
        }
      }
    }
    
    if(!id){failed++;errors.push('第'+(i+1)+'行：无效的ID格式');continue;}
    
    var url='http://music.163.com/song/media/outer/url?id='+id+'.mp3';
    if(!name)name='网易云音乐-'+id;
    
    var newId='sm_batch_'+Date.now()+'_'+Math.random().toString(36).substr(2,6);
    starMusicLibrary.push({
      id:newId,
      name:name,
      artist:'',
      url:url,
      source:'url',
      duration:0,
      tags:[],
      playlistId:'default',
      addedAt:Date.now()
    });
    // 记录需要自动识别的（用户未提供歌名的）
    if(!line.includes(' ')){
      pendingIds.push({id:id,libraryId:newId});
    }
    imported++;
  }
  
  if(imported>0){
    saveStarMusicData();
    closeBatchImportModal();
    renderStarMusicPage();
    var msg='成功导入 '+imported+' 首';
    if(failed>0)msg+='，'+failed+' 首失败';
    if(errors.length&&failed>0)msg+='\n\n失败原因：\n'+errors.slice(0,3).join('\n');
    if(imported>1||failed>0)alert(msg);
    else toast(msg);
    
    // 批量自动识别歌曲信息
    if(pendingIds.length>0){
      toast('正在识别歌曲信息...');
      var recognized=0;
      pendingIds.forEach(function(item){
        fetchNeteaseSongInfo(item.id,function(info){
          if(info){
            var m=starMusicLibrary.find(function(x){return x.id===item.libraryId});
            if(m){
              m.name=info.name;
              if(info.artist)m.artist=info.artist;
              recognized++;
              saveStarMusicData();
              renderStarMusicPage();
              updateStarMusicPlayerBar();
            }
          }
          // 全部识别完成后提示
          if(recognized===pendingIds.length||(pendingIds.indexOf(item)===pendingIds.length-1)){
            if(recognized>0){
              toast('已识别 '+recognized+'/'+pendingIds.length+' 首歌曲信息');
            }
          }
        });
      });
    }
  }else{
    toast('全部导入失败：'+(errors[0]||'请检查ID格式'));
  }
}

// ---- 网易云歌曲信息自动识别（多源fallback） ----
function fetchNeteaseSongInfo(id,cb){
  var apis=[
    // meting音乐解析API - 首选（支持title字段）
    {url:'https://api.injahow.cn/meting/?type=netease&id='+id,parse:function(d){
      if(!d)return null;
      var name=d.name||d.title;
      if(!name)return null;
      var artist=d.artist;
      if(Array.isArray(artist))artist=artist.map(function(a){return a.name||a}).join('/');
      else if(typeof artist!=='string')artist='';
      return {name:name,artist:artist};
    }},
    // 备用meting API
    {url:'https://meting.summerstack.dev/?type=netease&id='+id,parse:function(d){
      if(!d)return null;
      var name=d.name||d.title;
      if(!name)return null;
      var artist=d.artist;
      if(Array.isArray(artist))artist=artist.map(function(a){return a.name||a}).join('/');
      else if(typeof artist!=='string')artist='';
      return {name:name,artist:artist};
    }},
    // 网易云直链API（CORS代理 allorigins）
    {url:'https://api.allorigins.win/raw?url='+encodeURIComponent('https://music.163.com/api/song/detail/?ids='+id),parse:function(text){
      // 可能返回JSON文本，需要解析
      var d;try{d=typeof text==='string'?JSON.parse(text):text;}catch(e){d=null;}
      if(d&&d.songs&&d.songs[0]){
        var s=d.songs[0];
        var artistName='';
        if(s.artists&&s.artists.length){
          artistName=s.artists.map(function(a){return a.name}).join('/');
        }
        return {name:s.name,artist:artistName};
      }
      return null;
    },isText:true},
    // CORS代理 corsproxy.io
    {url:'https://corsproxy.io/?'+encodeURIComponent('https://music.163.com/api/song/detail/?ids='+id),parse:function(text){
      var d;try{d=typeof text==='string'?JSON.parse(text):text;}catch(e){d=null;}
      if(d&&d.songs&&d.songs[0]){
        var s=d.songs[0];
        var artistName='';
        if(s.artists&&s.artists.length){
          artistName=s.artists.map(function(a){return a.name}).join('/');
        }
        return {name:s.name,artist:artistName};
      }
      return null;
    },isText:true},
    // 直接请求网易云API（可能需要CORS代理）
    {url:'https://api.allorigins.win/get?url='+encodeURIComponent('https://music.163.com/api/song/detail/?ids='+id),parse:function(d){
      // allorigins的get模式：{contents: "json string"}
      var actualData;try{actualData=JSON.parse(d.contents);}catch(e){return null;}
      if(actualData&&actualData.songs&&actualData.songs[0]){
        var s=actualData.songs[0];
        var artistName='';
        if(s.artists&&s.artists.length){
          artistName=s.artists.map(function(a){return a.name}).join('/');
        }
        return {name:s.name,artist:artistName};
      }
      return null;
    }}
  ];
  
  var idx=0;
  function tryNext(){
    if(idx>=apis.length){cb(null);return;}
    var api=apis[idx++];
    var controller=new AbortController();
    var timeout=setTimeout(function(){controller.abort()},8000);
    fetch(api.url,{signal:controller.signal}).then(function(r){
      if(!r.ok)throw new Error('HTTP '+r.status);
      if(api.isText)return r.text();
      return r.json();
    }).then(function(data){
      clearTimeout(timeout);
      try{
        var result=api.parse(data);
        if(result&&result.name){cb(result);}
        else tryNext();
      }catch(e){tryNext();}
    }).catch(function(){
      clearTimeout(timeout);
      tryNext();
    });
  }
  tryNext();
}

function addStarMusicByUrl(){
  var name=$('star-music-url-name').value.trim();
  var artist=$('star-music-url-artist').value.trim();
  var urlInput=$('star-music-url-link').value.trim();
  if(!urlInput){toast('请输入网易云ID或音乐链接');return;}
  var url=urlInput;
  var neteaseId='';
  
  // 尝试提取网易云ID
  if(/^\d+$/.test(urlInput)){
    neteaseId=urlInput;
  }else{
    // 从URL中提取ID
    var idMatch=urlInput.match(/[?&]id=(\d+)/);
    if(idMatch){neteaseId=idMatch[1];}
    else{
      var pathMatch=urlInput.match(/\/(\d+)(?:\.mp3)?$/);
      if(pathMatch){neteaseId=pathMatch[1];}
    }
  }
  
  if(neteaseId){
    url='http://music.163.com/song/media/outer/url?id='+neteaseId+'.mp3';
    if(!name)name='网易云音乐-'+neteaseId;
  }
  if(!/^(https?:\/\/|file:\/\/|data:|\/)/i.test(url)){toast('请输入有效的ID或链接');return;}
  var newId='sm_'+Date.now()+'_'+Math.random().toString(36).substr(2,6);
  starMusicLibrary.push({
    id:newId,
    name:name,
    artist:artist,
    url:url,
    source:'url',
    duration:0,
    tags:[],
    playlistId:'default',
    addedAt:Date.now()
  });
  saveStarMusicData();
  closeAddStarMusicUrlModal();
  renderStarMusicPage();
  toast('链接音乐已添加');
  // 网易云ID自动识别歌曲信息
  if(neteaseId){
    fetchNeteaseSongInfo(neteaseId,function(info){
      if(info){
        var m=starMusicLibrary.find(function(x){return x.id===newId});
        if(m){
          m.name=info.name;
          if(info.artist)m.artist=info.artist;
          saveStarMusicData();
          renderStarMusicPage();
          updateStarMusicPlayerBar();
          toast('已识别：'+info.name+(info.artist?' - '+info.artist:''));
        }
      }
    });
  }
}

function switchStarMusicTab(tab){
  starMusicCurrentTab=tab;
  var tabs=document.querySelectorAll('.star-music-tab');
  tabs.forEach(function(t){t.style.background='var(--c2)';t.style.color='var(--txt2)';t.classList.remove('active')});
  var active=document.querySelector('.star-music-tab[data-tab="'+tab+'"]');
  if(active){active.style.background='var(--accent)';active.style.color='#fff';active.classList.add('active')}
  $('star-music-library-tab').style.display=tab==='library'?'block':'none';
  $('star-music-playlists-tab').style.display=tab==='playlists'?'block':'none';
  $('star-music-history-tab').style.display=tab==='history'?'block':'none';
  $('star-music-dream-perms-tab').style.display=tab==='dream_perms'?'block':'none';
  if(tab==='playlists')renderStarMusicPlaylists();
  if(tab==='history')renderStarMusicHistory();
  if(tab==='dream_perms')renderStarMusicDreamPerms();
}

function renderStarMusicPage(){
  loadStarMusicData();
  if(!starMusicLibrary.length){
    $('star-music-list').innerHTML='';
    $('star-music-empty').style.display='block';
  }else{
    $('star-music-empty').style.display='none';
    renderStarMusicList();
  }
  switchStarMusicTab(starMusicCurrentTab);
  updateStarMusicPlayerBar();
  // Sync floating toggle
  var mainToggle=$('main-floating-toggle');
  if(mainToggle)mainToggle.checked=starMusicGlobalSettings.floatingPlayerEnabled!==false;
}

function renderStarMusicList(){
  var list=$('star-music-list');
  var selectedCount=Object.keys(_starMusicBatchSelected).filter(function(k){return _starMusicBatchSelected[k]}).length;
  // 头部：批量模式按钮
  var headerBtns='<button onclick="triggerStarMusicUpload()" style="padding:7px 16px;border:1px solid var(--border);border-radius:18px;background:var(--c2);color:var(--txt);font-size:12px;cursor:pointer;font-weight:500;">📤 上传</button><button onclick="openAddStarMusicUrlModal()" style="padding:7px 16px;border:1px solid var(--border);border-radius:18px;background:var(--c2);color:var(--txt);font-size:12px;cursor:pointer;font-weight:500;">🔗 链接</button>';
  if(_starMusicBatchMode){
    headerBtns='<button onclick="toggleStarMusicBatchMode()" style="padding:7px 16px;border:1px solid #e74c3c;border-radius:18px;background:rgba(231,76,60,0.1);color:#e74c3c;font-size:12px;cursor:pointer;font-weight:500;">✕ 取消选择</button>';
  }else{
    headerBtns+='<button onclick="toggleStarMusicBatchMode()" style="padding:7px 16px;border:1px solid var(--border);border-radius:18px;background:var(--c2);color:var(--txt);font-size:12px;cursor:pointer;font-weight:500;">☑ 批量选择</button>';
  }
  var html='<div style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:12px;color:var(--txt2);">共 '+starMusicLibrary.length+' 首</span><div style="display:flex;gap:6px;">'+headerBtns+'</div></div>';
  // ★ 音乐库只显示"不在任何歌单里"的歌（playlistId 为 default/空/undefined 表示未入歌单）
  // 在歌单里的歌只在对应歌单里显示，避免重复、方便管理
  var libraryList=starMusicLibrary.filter(function(m){
    var pid=m.playlistId;
    return !pid||pid==='default'||pid===''||pid===undefined||pid===null;
  });
  if(libraryList.length===0){
    list.innerHTML=html+'<div style="text-align:center;color:var(--txt3);padding:40px 20px;font-size:13px;">音乐库为空，点击右上角上传或添加链接</div>';
    return;
  }
  libraryList.forEach(function(m,i){
    var isActive=m.id===starMusicCurrentId;
    var isPlaying=isActive&&starMusicAudio&&!starMusicAudio.paused;
    var isLocal=m.source==='local'||(!m.source&&(m.size||!m.url));
    var isChecked=_starMusicBatchSelected[m.id];
    // 批量模式时点击行切换选中，否则播放
    var clickHandler=_starMusicBatchMode?"event.stopPropagation();toggleStarMusicBatchSelect('"+m.id+"')":'playStarMusic(\''+m.id+'\')';
    html+='<div onclick="'+clickHandler+'" style="display:flex;align-items:center;gap:14px;padding:14px;background:'+(isActive?'var(--accent)':(isChecked?'rgba(107,91,149,0.12)':'var(--c2)'))+';border-radius:14px;margin-bottom:8px;cursor:pointer;transition:all 0.15s;border:1px solid '+(isChecked?'rgba(107,91,149,0.4)':(isActive?'var(--accent)':'var(--border)'))+';">';
    // 批量模式：显示勾选框
    if(_starMusicBatchMode){
      html+='<div style="flex-shrink:0;width:24px;height:24px;border-radius:6px;border:2px solid '+(isChecked?'#6b5b95':'var(--border)')+';background:'+(isChecked?'#6b5b95':'transparent')+';display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:bold;">'+(isChecked?'✓':'')+'</div>';
    }
    html+='<div style="position:relative;flex-shrink:0;"><div style="width:44px;height:44px;border-radius:12px;background:'+(isActive?'rgba(255,255,255,0.2)':'var(--c1)')+';display:flex;align-items:center;justify-content:center;font-size:22px;">'+(isPlaying?'⏸':'🎵')+'</div>';
    // 来源类型小图标标识
    html+='<div style="position:absolute;bottom:-2px;right:-2px;width:16px;height:16px;border-radius:50%;background:'+(isLocal?(isActive?'rgba(255,255,255,0.9)':'#6b5b95'):(isActive?'rgba(255,255,255,0.9)':'#4a90d9'))+';display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,0.15);" title="'+(isLocal?'本地文件':'网络链接')+'">';
    if(isLocal){
      html+='<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="'+(isActive?'#6b5b95':'#fff')+'" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>';
    }else{
      html+='<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="'+(isActive?'#4a90d9':'#fff')+'" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
    }
    html+='</div></div>';
    html+='<div style="flex:1;min-width:0;"><div style="font-size:15px;font-weight:500;color:'+(isActive?'#fff':'var(--txt)')+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+(m.name||m.title||'未知歌曲')+'</div>';
    if(m.artist)html+='<div style="font-size:12px;color:'+(isActive?'rgba(255,255,255,0.7)':'var(--txt2)')+';margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+m.artist+'</div>';
    html+='<div style="display:flex;align-items:center;gap:6px;margin-top:3px;">';
    // 来源文字标签
    html+='<span style="font-size:10px;padding:1px 6px;border-radius:4px;background:'+(isActive?'rgba(255,255,255,0.25)':(isLocal?'rgba(107,91,149,0.12)':'rgba(74,144,217,0.12)'))+';color:'+(isActive?'#fff':(isLocal?'#6b5b95':'#4a90d9'))+';">'+(isLocal?'📁 本地':'🔗 网络')+'</span>';
    if(m.tags&&m.tags.length)html+='<span style="font-size:10px;color:'+(isActive?'rgba(255,255,255,0.6)':'var(--txt3)')+';">'+m.tags.slice(0,2).join(' · ')+'</span>';
    html+='</div></div>';
    html+='<div style="font-size:12px;color:'+(isActive?'rgba(255,255,255,0.7)':'var(--txt3)')+';flex-shrink:0;">'+formatStarMusicDuration(m.duration||0)+'</div>';
    if(!_starMusicBatchMode){
      html+='<button onclick="event.stopPropagation();openStarMusicEdit(\''+m.id+'\')" style="width:30px;height:30px;border:none;border-radius:50%;background:rgba(0,0,0,0.08);font-size:14px;cursor:pointer;color:'+(isActive?'#fff':'var(--txt2)')+';flex-shrink:0;">⋯</button>';
    }
    html+='</div>';
  });
  // 批量模式底部操作栏
  if(_starMusicBatchMode){
    html+='<div style="position:sticky;bottom:0;padding:12px 0;margin-top:8px;display:flex;gap:10px;background:var(--c1);">';
    html+='<button onclick="selectAllStarMusic()" style="flex:1;padding:12px;border:1px solid var(--border);border-radius:12px;background:var(--c2);color:var(--txt);font-size:13px;cursor:pointer;font-weight:500;">全选</button>';
    html+='<button onclick="starMusicBatchAddToPlaylist()" style="flex:2;padding:12px;border:none;border-radius:12px;background:'+(selectedCount>0?'var(--accent)':'var(--c3)')+';color:'+(selectedCount>0?'#fff':'var(--txt3)')+';font-size:13px;cursor:pointer;font-weight:500;">添加到歌单'+(selectedCount>0?' ('+selectedCount+')':'')+'</button>';
    html+='</div>';
  }
  list.innerHTML=html;
}

function toggleStarMusicBatchSelect(mid){
  _starMusicBatchSelected[mid]=!_starMusicBatchSelected[mid];
  renderStarMusicList();
}

function selectAllStarMusic(){
  var allSelected=starMusicLibrary.every(function(m){return _starMusicBatchSelected[m.id]});
  starMusicLibrary.forEach(function(m){
    _starMusicBatchSelected[m.id]=!allSelected;
  });
  renderStarMusicList();
}

function formatStarMusicDuration(sec){
  var m=Math.floor(sec/60),s=Math.floor(sec%60);
  return ('0'+m).slice(-2)+':'+('0'+s).slice(-2);
}

function renderStarMusicPlaylists(){
  var list=$('star-music-playlists-list');
  var html='';
  starMusicPlaylists.forEach(function(pl){
    var count=starMusicLibrary.filter(function(m){return m.playlistId===pl.id}).length;
    html+='<div onclick="filterStarMusicByPlaylist(\''+pl.id+'\')" style="display:flex;align-items:center;gap:14px;padding:16px;background:var(--c2);border-radius:14px;margin-bottom:8px;cursor:pointer;border:1px solid var(--border);transition:all 0.15s;">';
    html+='<div style="width:48px;height:48px;border-radius:14px;background:var(--c1);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">📂</div><div style="flex:1;"><div style="font-size:15px;font-weight:500;">'+pl.name+'</div><div style="font-size:12px;color:var(--txt2);margin-top:2px;">'+count+' 首音乐</div></div>';
    html+='<button onclick="event.stopPropagation();showAddToPlaylist(\''+pl.id+'\')" style="width:30px;height:30px;border:none;border-radius:50%;background:rgba(107,91,149,0.12);font-size:16px;cursor:pointer;color:#6b5b95;flex-shrink:0;" title="添加歌曲">+</button>';
    html+='<button onclick="event.stopPropagation();deleteStarPlaylist(\''+pl.id+'\')" style="width:30px;height:30px;border:none;border-radius:50%;background:rgba(0,0,0,0.06);font-size:14px;cursor:pointer;color:var(--txt3);flex-shrink:0;" title="删除歌单">🗑</button>';
    html+='</div>';
  });
  list.innerHTML=html||'<div style="text-align:center;color:var(--txt2);padding:40px;font-size:14px;">还没有歌单<br><span style="font-size:12px;">点击下方按钮创建你的第一个歌单</span></div>';
}

var _addToPlaylistId='';
function showAddToPlaylist(pid){
  _addToPlaylistId=pid;
  var pl=starMusicPlaylists.find(function(p){return p.id===pid});
  if(!pl)return;
  $('star-add-to-pl-title').textContent='➕ 添加歌曲到「'+pl.name+'」';
  var html='';
  if(starMusicLibrary.length===0){
    html='<div style="text-align:center;color:var(--txt2);padding:30px;font-size:13px;">音乐库还没有歌曲</div>';
  }else{
    starMusicLibrary.forEach(function(m){
      var inPl=m.playlistId===pid;
      var isLocal=m.source==='local'||(!m.source&&(m.size||!m.url));
      html+='<label style="display:flex;align-items:center;gap:12px;padding:12px;background:'+(inPl?'rgba(107,91,149,0.08)':'var(--c2)')+';border-radius:12px;margin-bottom:6px;cursor:pointer;border:1px solid '+(inPl?'rgba(107,91,149,0.3)':'var(--border)')+';">';
      html+='<input type="checkbox" data-mid="'+m.id+'" '+(inPl?'checked':'')+' style="width:18px;height:18px;accent-color:#6b5b95;flex-shrink:0;">';
      html+='<div style="width:36px;height:36px;border-radius:10px;background:var(--c1);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">🎵</div>';
      html+='<div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+(m.name||m.title||'未知歌曲')+'</div>';
      if(m.artist)html+='<div style="font-size:11px;color:var(--txt2);margin-top:1px;">'+m.artist+'</div>';
      html+='</div>';
      html+='<span style="font-size:10px;padding:1px 6px;border-radius:4px;background:'+(isLocal?'rgba(107,91,149,0.12)':'rgba(74,144,217,0.12)')+';color:'+(isLocal?'#6b5b95':'#4a90d9')+';flex-shrink:0;">'+(isLocal?'本地':'网络')+'</span>';
      if(inPl)html+='<span style="font-size:10px;color:#6b5b95;flex-shrink:0;">已收录</span>';
      html+='</label>';
    });
  }
  $('star-add-to-pl-list').innerHTML=html;
  showOv('ov-star-add-to-playlist');
}

function confirmAddToPlaylist(){
  if(!_addToPlaylistId)return;
  var checkboxes=document.querySelectorAll('#star-add-to-pl-list input[type="checkbox"]');
  var added=0,removed=0;
  checkboxes.forEach(function(cb){
    var mid=cb.dataset.mid;
    var m=starMusicLibrary.find(function(x){return x.id===mid});
    if(!m)return;
    if(cb.checked){
      if(m.playlistId!==_addToPlaylistId){m.playlistId=_addToPlaylistId;added++;}
    }else{
      if(m.playlistId===_addToPlaylistId){m.playlistId='default';removed++;}
    }
  });
  saveStarMusicData();
  hideOv('ov-star-add-to-playlist');
  renderStarMusicPlaylists();
  if(starMusicCurrentTab==='library')renderStarMusicList();
  var msg='';
  if(added>0)msg+='已添加 '+added+' 首';
  if(removed>0)msg+=(msg?'，':'')+'已移出 '+removed+' 首';
  if(!msg)msg='无变化';
  toast(msg);
}

function filterStarMusicByPlaylist(pid){
  var pl=starMusicPlaylists.find(function(p){return p.id===pid});
  if(!pl)return;
  // 退出批量模式
  _starMusicBatchMode=false;_starMusicBatchSelected={};
  switchStarMusicTab('library');
  var filtered=starMusicLibrary.filter(function(m){return m.playlistId===pid});
  $('star-music-list').innerHTML='<div style="font-size:13px;color:var(--txt2);margin-bottom:10px;display:flex;align-items:center;gap:6px;"><span style="cursor:pointer;color:#6b5b95;" onclick="renderStarMusicList()">← 全部</span><span>📂 '+pl.name+' · '+filtered.length+' 首</span></div>'+filtered.map(function(m){var isActive=m.id===starMusicCurrentId;var isLocal=m.source==='local'||(!m.source&&(m.size||!m.url));var artistHtml=m.artist?'<div style="font-size:12px;color:'+(isActive?'rgba(255,255,255,0.7)':'var(--txt2)')+';">'+m.artist+'</div>':'';var srcBadge='<span style="font-size:10px;padding:1px 6px;border-radius:4px;background:'+(isActive?'rgba(255,255,255,0.25)':(isLocal?'rgba(107,91,149,0.12)':'rgba(74,144,217,0.12)'))+';color:'+(isActive?'#fff':(isLocal?'#6b5b95':'#4a90d9'))+';">'+(isLocal?'📁 本地':'🔗 网络')+'</span>';return'<div onclick="playStarMusic(\''+m.id+'\')" style="display:flex;align-items:center;gap:14px;padding:14px;background:'+(isActive?'#6b5b95':'var(--c2)')+';border-radius:14px;margin-bottom:8px;cursor:pointer;border:1px solid '+(isActive?'#6b5b95':'var(--border)')+';"><div style="width:44px;height:44px;border-radius:12px;background:'+(isActive?'rgba(255,255,255,0.2)':'var(--c1)')+';display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">🎵</div><div style="flex:1;min-width:0;"><div style="font-size:15px;font-weight:500;color:'+(isActive?'#fff':'var(--txt)')+';">'+m.name+'</div>'+artistHtml+'<div style="margin-top:3px;">'+srcBadge+'</div></div><div style="font-size:12px;color:'+(isActive?'rgba(255,255,255,0.7)':'var(--txt3)')+';">'+formatStarMusicDuration(m.duration||0)+'</div></div>'}).join('');
}

function showCreateStarPlaylist(){
  $('star-playlist-name-input').value='';
  showOv('ov-star-create-playlist');
  setTimeout(function(){var inp=$('star-playlist-name-input');if(inp)inp.focus()},200);
}

function confirmCreateStarPlaylist(){
  var name=$('star-playlist-name-input').value.trim();
  if(!name){toast('请输入歌单名称');return}
  starMusicPlaylists.push({id:'spl_'+Date.now(),name:name,createdAt:Date.now()});
  saveStarMusicPlaylists();
  hideOv('ov-star-create-playlist');
  renderStarMusicPlaylists();
  toast('歌单已创建');
}

function deleteStarPlaylist(pid){
  if(!confirm('确定删除此歌单？音乐不会被删除。'))return;
  starMusicLibrary.forEach(function(m){if(m.playlistId===pid)m.playlistId='default'});
  starMusicPlaylists=starMusicPlaylists.filter(function(p){return p.id!==pid});
  saveStarMusicData();saveStarMusicPlaylists();
  renderStarMusicPlaylists();
}

function triggerStarMusicUpload(){
  var inp=document.createElement('input');
  inp.type='file';inp.accept='audio/*,.mp3,.m4a,.aac,.acc,.ogg,.wav,.flac,.wma,.amr';inp.multiple=true;
  inp.onchange=function(){if(this.files.length)uploadStarMusicFiles(this.files)};
  inp.click();
}

function uploadStarMusicFiles(files){
  var loaded=0,skipped=0,total=files.length;
  function processNext(idx){
    if(idx>=files.length){
      var msg='已添加 '+loaded+' 首音乐';
      if(skipped>0)msg+='，'+skipped+' 首格式不支持已跳过';
      toast(msg);
      renderStarMusicPage();renderStarMusicPlaylists();return
    }
    var file=files[idx];
    // 检查文件大小（限制50MB）
    if(file.size>50*1024*1024){
      toast(file.name+' 过大（>50MB），已跳过');
      skipped++;
      processNext(idx+1);
      return;
    }
    var reader=new FileReader();
    reader.onload=function(e){
      var dataUrl=e.target.result;
      // 检查dataUrl大小
      var dataSize=0;
      try{dataSize=new Blob([dataUrl]).size;}catch(e){}
      if(dataSize>50*1024*1024){
        toast(file.name+' 转换后过大，已跳过');
        skipped++;
        processNext(idx+1);
        return;
      }
      var audio=document.createElement('audio');
      audio.preload='metadata';
      audio.onloadedmetadata=function(){
        var id='sm_'+Date.now()+'_'+Math.random().toString(36).substr(2,6);
        starMusicLibrary.push({id:id,name:file.name.replace(/\.[^.]+$/,''),duration:audio.duration||0,playlistId:'default',tags:[],createdAt:Date.now(),size:dataSize,source:'local'});
        saveStarMusicFile(id,dataUrl);
        saveStarMusicData();
        loaded++;
        // 释放临时Audio对象
        audio.onloadedmetadata=null;
        audio.onerror=null;
        audio.src='';
        try{audio.load();}catch(e){}
        audio=null;
        // 释放dataUrl引用
        dataUrl=null;
        try{delete e.target.result;}catch(err){}
        processNext(idx+1);
      };
      // 解码失败时仍然保存文件（时长设0），不静默跳过
      audio.onerror=function(){
        var id='sm_'+Date.now()+'_'+Math.random().toString(36).substr(2,6);
        starMusicLibrary.push({id:id,name:file.name.replace(/\.[^.]+$/,''),duration:0,playlistId:'default',tags:[],createdAt:Date.now(),size:dataSize,source:'local',decodeWarning:true});
        saveStarMusicFile(id,dataUrl);
        saveStarMusicData();
        loaded++;
        toast(file.name+' 已添加（浏览器无法预览时长，但可正常播放）');
        audio.onloadedmetadata=null;
        audio.onerror=null;
        audio.src='';
        try{audio.load();}catch(e){}
        audio=null;
        dataUrl=null;
        try{delete e.target.result;}catch(err){}
        processNext(idx+1);
      };
      audio.src=dataUrl;
    };
    reader.onerror=function(){
      toast(file.name+' 读取失败，已跳过');
      skipped++;
      processNext(idx+1);
    };
    reader.readAsDataURL(file);
  }
  processNext(0);
}

function playStarMusic(id){
  var m=starMusicLibrary.find(function(x){return x.id===id});
  if(!m)return;
  starMusicCurrentId=id;
  if(starMusicAudio){
    try{
      starMusicAudio.pause();
      starMusicAudio.onended=null;
      starMusicAudio.onerror=null;
      starMusicAudio.onplay=null;
      starMusicAudio.onpause=null;
      starMusicAudio.removeAttribute('src');
      starMusicAudio.load();
    }catch(e){}
    starMusicAudio=null;
  }
  if(starMusicProgressInterval){clearInterval(starMusicProgressInterval);starMusicProgressInterval=null}
  
  if((m.source==='url'||(!m.source&&m.url))&&m.url){
    starMusicAudio=new Audio(m.url);
    starMusicAudio.preload='auto';
    starMusicAudio.onended=function(){
      // TA 自动音乐行为：根据权限和概率决定是否切歌/切模式
      var handled=false;
      try{handled=maybeTAAutoMusicAction();}catch(e){}
      if(!handled)starMusicNext();
    };
    starMusicAudio.onerror=function(){toast('播放失败')};
    starMusicAudio.onloadedmetadata=function(){
      var dur=starMusicAudio.duration||0;
      var prog=$('star-music-now-playing-progress');
      if(prog)prog.textContent=formatStarMusicDuration(0)+' / '+formatStarMusicDuration(dur);
      if(m&&dur){m.duration=dur;saveStarMusicData()}
    };
    starMusicAudio.onplay=function(){
      var playIconOn=$('star-music-play-icon');if(playIconOn)playIconOn.innerHTML='<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>';
      var chatIcon=$('chat-music-play-icon');if(chatIcon)chatIcon.innerHTML='<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>';
    };
    starMusicAudio.onpause=function(){
      var playIconPause=$('star-music-play-icon');if(playIconPause)playIconPause.innerHTML='<path d="M8 5v14l11-7z"/>';
      var chatIcon2=$('chat-music-play-icon');if(chatIcon2)chatIcon2.innerHTML='<path d="M8 5v14l11-7z"/>';
    };
    var playPromise=starMusicAudio.play();
    if(playPromise&&playPromise.catch)playPromise.catch(function(){});
    updateStarMusicPlayerBar();
    if(starMusicCurrentTab==='library')renderStarMusicList();
    startStarMusicProgress();
    return;
  }

  loadStarMusicFile(id,function(dataUrl){
    if(!dataUrl){toast('音乐文件加载失败');return}
    starMusicAudio=new Audio();
    starMusicAudio.preload='auto';
    starMusicAudio.src=dataUrl;
    starMusicAudio.onended=function(){
      // TA 自动音乐行为：根据权限和概率决定是否切歌/切模式
      var handled=false;
      try{handled=maybeTAAutoMusicAction();}catch(e){}
      if(!handled)starMusicNext();
    };
    starMusicAudio.onerror=function(){toast('播放失败')};
    starMusicAudio.onloadedmetadata=function(){
      var dur=starMusicAudio.duration||0;
      var prog=$('star-music-now-playing-progress');
      if(prog)prog.textContent=formatStarMusicDuration(0)+' / '+formatStarMusicDuration(dur);
      if(m&&dur){m.duration=dur;saveStarMusicData()}
    };
    starMusicAudio.onplay=function(){
      var playIconOn=$('star-music-play-icon');if(playIconOn)playIconOn.innerHTML='<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>';
      var chatIcon=$('chat-music-play-icon');if(chatIcon)chatIcon.innerHTML='<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>';
    };
    starMusicAudio.onpause=function(){
      var playIconPause=$('star-music-play-icon');if(playIconPause)playIconPause.innerHTML='<path d="M8 5v14l11-7z"/>';
      var chatIcon2=$('chat-music-play-icon');if(chatIcon2)chatIcon2.innerHTML='<path d="M8 5v14l11-7z"/>';
    };
    var playPromise=starMusicAudio.play();
    if(playPromise&&playPromise.catch)playPromise.catch(function(){});
    updateStarMusicPlayerBar();
    if(starMusicCurrentTab==='library')renderStarMusicList();
    startStarMusicProgress();
  });
}

function toggleStarMusicPlay(){
  if(!starMusicAudio)return;
  // 修复：显式处理播放/暂停，使用 Promise 处理播放，强制同步 UI 状态
  if(starMusicAudio.paused){
    var pp=starMusicAudio.play();
    if(pp&&pp.catch)pp.catch(function(e){});
  }else{
    // 本地音乐暂停修复：先记录状态，调用 pause 后强制刷新 UI
    try{starMusicAudio.pause()}catch(e){}
  }
  // 强制同步所有播放按钮图标与悬浮框可见性（不依赖 onplay/onpause 事件时序）
  setTimeout(function(){
    var isPlaying=starMusicAudio&&!starMusicAudio.paused;
    var playIcon=document.getElementById('star-music-play-icon');
    if(playIcon){
      playIcon.innerHTML=isPlaying
        ? '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>'
        : '<path d="M8 5v14l11-7z"/>';
    }
    var chatIcon=document.getElementById('chat-music-play-icon');
    if(chatIcon){
      chatIcon.innerHTML=isPlaying
        ? '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>'
        : '<path d="M8 5v14l11-7z"/>';
    }
    // 更新歌曲列表中的播放状态图标
    if(starMusicCurrentTab==='library')renderStarMusicList();
    // 悬浮框在播放/暂停状态均保持可见（用户可随时恢复播放）
    renderChatMusicStatus();
  },0);
}

function starMusicNext(){
  if(!starMusicLibrary.length)return;
  var filtered=starMusicLibrary;
  var idx=filtered.findIndex(function(m){return m.id===starMusicCurrentId});
  var next;
  if(starMusicRepeatMode==='single'){next=filtered[idx]}
  else if(starMusicRepeatMode==='shuffle'){next=filtered[Math.floor(Math.random()*filtered.length)]}
  else{next=filtered[(idx+1)%filtered.length]}
  if(next)playStarMusic(next.id);
}

function starMusicPrev(){
  if(!starMusicLibrary.length)return;
  var filtered=starMusicLibrary;
  var idx=filtered.findIndex(function(m){return m.id===starMusicCurrentId});
  var prev=filtered[(idx-1+filtered.length)%filtered.length];
  if(prev)playStarMusic(prev.id);
}

// TA 自动音乐行为：在歌曲结束时根据权限和概率触发
// 行为池：保持原样继续播放(autoKeepProb)、下一首(autoNextProb)、随机播放(autoRandomProb)、切换模式(autoModeProb)
function maybeTAAutoMusicAction(){
  if(!starMusicLibrary.length||!starMusicCurrentId)return false;
  // 找到当前播放歌曲对应的联系人
  var contactId=starMusicLastContactId;
  if(!contactId&&starMusicRequestData&&starMusicRequestData.contactId){
    contactId=starMusicRequestData.contactId;
  }
  if(!contactId){
    // 回退：找第一个启用权限的联系人
    var enabledCid=null;
    if(Array.isArray(contacts)){
      for(var i=0;i<contacts.length;i++){
        var s=getStarMusicSettings(contacts[i].id);
        if(s&&s.enabled){enabledCid=contacts[i].id;break;}
      }
    }
    contactId=enabledCid;
  }
  if(!contactId)return false;
  var settings=getStarMusicSettings(contactId);
  if(!settings||!settings.enabled)return false;

  // 计算行为池
  var keepProb=starMusicGlobalSettings.autoKeepProb||70;
  var nextProb=starMusicGlobalSettings.autoNextProb||15;
  var randomProb=starMusicGlobalSettings.autoRandomProb||10;
  var modeProb=starMusicGlobalSettings.autoModeProb||5;
  // 仅保留有权限的行为
  if(!settings.allowControl){nextProb=0;randomProb=0;}
  if(!settings.allowModeChange){modeProb=0;}
  // 归一化
  var total=keepProb+nextProb+randomProb+modeProb;
  if(total<=0)return false;
  var rnd=Math.random()*total;
  var action='keep';
  if(rnd<keepProb)action='keep';
  else if(rnd<keepProb+nextProb)action='next';
  else if(rnd<keepProb+nextProb+randomProb)action='random';
  else action='mode';

  // 用于系统消息显示的联系人名称
  var contact=contacts.find(function(x){return x.id===contactId});
  var contactName=contact?(contact.name||contact.nickname||'TA'):'TA';

  if(action==='next'){
    // TA 切到下一首
    var idx=starMusicLibrary.findIndex(function(m){return m.id===starMusicCurrentId});
    var next=starMusicLibrary[(idx+1)%starMusicLibrary.length];
    if(next){
      var nextName=next.name||next.title||'未知歌曲';
      toast('TA 切到了下一首');
      sendStarMusicSystemMsg(contactId,contactName+' 切到了下一首《'+nextName+'》',{systemType:'music-next',trackId:next.id});
      setTimeout(function(){playStarMusic(next.id)},300);
    }
  }else if(action==='random'){
    // TA 随机选一首
    var rand=starMusicLibrary[Math.floor(Math.random()*starMusicLibrary.length)];
    if(rand&&rand.id!==starMusicCurrentId){
      var randName=rand.name||rand.title||'未知歌曲';
      toast('TA 随机点了一首《'+rand.name+'》');
      sendStarMusicSystemMsg(contactId,contactName+' 随机点了一首《'+randName+'》',{systemType:'music-random',trackId:rand.id});
      setTimeout(function(){playStarMusic(rand.id)},300);
    }
  }else if(action==='mode'){
    // TA 切换播放模式
    var modes=['list','shuffle','single'];
    var curIdx=modes.indexOf(starMusicRepeatMode||'list');
    var newIdx=(curIdx+1)%modes.length;
    starMusicRepeatMode=modes[newIdx];
    var labels={list:'顺序播放',shuffle:'随机播放',single:'单曲循环'};
    toast('TA 切换播放模式：'+labels[starMusicRepeatMode]);
    sendStarMusicSystemMsg(contactId,contactName+' 切换播放模式：'+labels[starMusicRepeatMode],{systemType:'music-mode',mode:starMusicRepeatMode});
    try{updateStarMusicModeIcon();}catch(e){}
    saveStarMusicData();
  }
  // action==='keep' 或 action==='mode' 不拦截默认切歌
  return false;
}

function startStarMusicProgress(){
  if(starMusicProgressInterval)clearInterval(starMusicProgressInterval);
  starMusicProgressInterval=setInterval(function(){
    if(!starMusicAudio||!starMusicCurrentId)return;
    var cur=starMusicAudio.currentTime||0;
    var dur=starMusicAudio.duration||0;
    if(isNaN(dur))dur=0;
    if(isNaN(cur))cur=0;
    $('star-music-now-playing-progress').textContent=formatStarMusicDuration(cur)+' / '+formatStarMusicDuration(dur);
    // 同时更新悬浮播放栏的进度
    var chatProg=document.getElementById('chat-music-progress');
    var chatTime=document.getElementById('chat-music-time');
    if(chatProg&&dur>0){chatProg.style.width=((cur/dur)*100)+'%';}
    if(chatTime){chatTime.textContent=formatStarMusicTime(cur);}
  },500);
}

function stopStarMusic(){
  if(starMusicAudio){
    try{
      starMusicAudio.pause();
      starMusicAudio.onended=null;
      starMusicAudio.onerror=null;
      starMusicAudio.onplay=null;
      starMusicAudio.onpause=null;
      starMusicAudio.removeAttribute('src');
      starMusicAudio.load();
    }catch(e){}
    starMusicAudio=null;
  }
  if(starMusicProgressInterval){clearInterval(starMusicProgressInterval);starMusicProgressInterval=null}
  starMusicCurrentId=null;
  updateStarMusicPlayerBar();
}

function updateStarMusicPlayerBar(){
  var bar=$('star-music-player-bar');
  if(!bar)return;
  if(!starMusicCurrentId||!starMusicAudio){
    bar.style.display='none';
    _chatMusicBarClosed=true;
    renderChatMusicStatus();
    return;
  }
  bar.style.display='block';
  // 新歌曲播放时重置悬浮框关闭状态
  _chatMusicBarClosed=false;
  var m=starMusicLibrary.find(function(x){return x.id===starMusicCurrentId});
  if(m){
    var displayName=m.name||m.title||'未知歌曲';
    $('star-music-now-playing-name').textContent=displayName;
    var artistEl=$('star-music-now-playing-artist');
    if(artistEl){
      if(m.artist){artistEl.textContent=m.artist;artistEl.style.display='block';}
      else{artistEl.style.display='none';}
    }
    var chatName=$('chat-music-status-name');if(chatName)chatName.textContent=displayName;
  }
  var isPlaying=starMusicAudio&&!starMusicAudio.paused;
  var playIcon=$('star-music-play-icon');if(playIcon)playIcon.innerHTML=isPlaying?'<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>':'<path d="M8 5v14l11-7z"/>';
  var chatIcon=$('chat-music-play-icon');if(chatIcon)chatIcon.innerHTML=isPlaying?'<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>':'<path d="M8 5v14l11-7z"/>';
  renderChatMusicStatus();
  updateStarMusicModeIcon();
}

function updateStarMusicModeIcon(){
  var mode=starMusicRepeatMode||'list';
  var modeBtn=$('star-music-mode-btn');
  var modeIcon=$('star-music-mode-icon');
  var chatBtn=$('chat-music-mode-btn');
  var chatIcon=$('chat-music-mode-icon');
  var icons={
    list:'<path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/>',
    shuffle:'<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
    single:'<path d="M5 3l14 9-14 9V3z"/><circle cx="12" cy="12" r="10"/><text x="12" y="16" text-anchor="middle" font-size="8" fill="currentColor" stroke="none">1</text>'
  };
  var colors={list:'var(--accent)',shuffle:'var(--accent)',single:'var(--accent)'};
  if(mode==='single'){
    if(modeIcon)modeIcon.innerHTML='<circle cx="12" cy="12" r="10"/><text x="12" y="16" text-anchor="middle" font-size="9" fill="currentColor" stroke="none" font-weight="bold">1</text>';
    if(chatIcon)chatIcon.innerHTML='<circle cx="12" cy="12" r="10"/><text x="12" y="16" text-anchor="middle" font-size="9" fill="currentColor" stroke="none" font-weight="bold">1</text>';
  }else if(mode==='shuffle'){
    if(modeIcon)modeIcon.innerHTML='<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>';
    if(chatIcon)chatIcon.innerHTML='<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>';
  }else{
    if(modeIcon)modeIcon.innerHTML='<path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/>';
    if(chatIcon)chatIcon.innerHTML='<path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/>';
  }
  var activeColor=mode==='list'||mode==='shuffle'||mode==='single'?'var(--accent)':'var(--txt2)';
  if(modeBtn)modeBtn.style.color=mode==='list'?'var(--txt)':'var(--accent)';
  if(chatBtn)chatBtn.style.color=mode==='list'?'var(--txt2)':'var(--accent)';
}

function toggleStarMusicMode(){
  var modes=['list','shuffle','single'];
  var idx=modes.indexOf(starMusicRepeatMode||'list');
  idx=(idx+1)%modes.length;
  starMusicRepeatMode=modes[idx];
  var labels={list:'顺序播放',shuffle:'随机播放',single:'单曲循环'};
  toast('播放模式：'+labels[starMusicRepeatMode]);
  updateStarMusicModeIcon();
}

function openStarMusicEdit(id){
  starMusicEditId=id;
  var m=starMusicLibrary.find(function(x){return x.id===id});
  if(!m)return;
  $('star-music-edit-name').value=m.name||'';
  $('star-music-edit-artist').value=m.artist||'';
  var tagsHtml='';
  STAR_MUSIC_TAGS.forEach(function(group){
    tagsHtml+='<div style="width:100%;font-size:11px;color:var(--txt3);margin:6px 0 2px;">'+group.category+'</div>';
    group.tags.forEach(function(tag){
      var selected=m.tags&&m.tags.indexOf(tag)>=0;
      tagsHtml+='<button class="star-tag-btn'+(selected?' active':'')+'" data-tag="'+tag+'" onclick="toggleStarMusicEditTag(this)" style="padding:4px 10px;border:1px solid '+(selected?'var(--accent)':'var(--border)')+';border-radius:14px;font-size:11px;cursor:pointer;background:'+(selected?'var(--accent)':'var(--c2)')+';color:'+(selected?'#fff':'var(--txt2)')+';">'+tag+'</button>';
    });
  });
  $('star-music-edit-tags').innerHTML=tagsHtml;
  var plHtml='<option value="default">默认</option>';
  starMusicPlaylists.forEach(function(pl){plHtml+='<option value="'+pl.id+'"'+(m.playlistId===pl.id?' selected':'')+'>'+pl.name+'</option>'});
  $('star-music-edit-playlist').innerHTML=plHtml;
  showOv('ov-star-music-edit');
}

function toggleStarMusicEditTag(btn){
  btn.classList.toggle('active');
  var selected=btn.classList.contains('active');
  btn.style.background=selected?'var(--accent)':'var(--c2)';
  btn.style.color=selected?'#fff':'var(--txt2)';
  btn.style.borderColor=selected?'var(--accent)':'var(--border)';
}

function saveStarMusicEdit(){
  var m=starMusicLibrary.find(function(x){return x.id===starMusicEditId});
  if(!m)return;
  m.name=$('star-music-edit-name').value.trim()||m.name;
  m.artist=$('star-music-edit-artist').value.trim();
  m.playlistId=$('star-music-edit-playlist').value;
  m.tags=[];
  document.querySelectorAll('#star-music-edit-tags .star-tag-btn.active').forEach(function(b){m.tags.push(b.dataset.tag)});
  saveStarMusicData();
  hideOv('ov-star-music-edit');
  renderStarMusicPage();
  toast('已保存');
}

function deleteStarMusic(){
  if(!confirm('确定删除这首音乐？'))return;
  var deleteId=starMusicEditId;
  var deleteItem=starMusicLibrary.find(function(x){return x.id===deleteId});
  var isLocal=deleteItem&&(deleteItem.source==='local'||(!deleteItem.source&&(deleteItem.size||!deleteItem.url)));
  starMusicLibrary=starMusicLibrary.filter(function(x){return x.id!==deleteId});
  if(starMusicCurrentId===deleteId)stopStarMusic();
  // 从localforage中删除本地音频文件（释放IndexedDB空间）
  if(window.localforage&&deleteId&&isLocal){
    window.localforage.removeItem('ml2_star_music_'+deleteId).then(function(){
      // 同时尝试清理 localStorage 中可能缓存的 dataUrl
      try{localStorage.removeItem('ml2_sf_ml2_star_music_'+deleteId);}catch(e){}
    }).catch(function(){});
  }
  saveStarMusicData();
  hideOv('ov-star-music-edit');
  renderStarMusicPage();
  toast('已删除');
}

// ---------- 星音记录 ----------
function renderStarMusicHistory(){
  var list=$('star-music-history-list');
  var empty=$('star-music-history-empty');
  if(!starMusicHistory.length){list.innerHTML='';empty.style.display='block';return}
  empty.style.display='none';
  var html='';
  starMusicHistory.slice().reverse().forEach(function(h){
    var d=new Date(h.timestamp);
    html+='<div style="padding:14px;background:var(--c2);border-radius:14px;margin-bottom:8px;border:1px solid var(--border);">';
    html+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;"><div style="width:36px;height:36px;border-radius:10px;background:var(--c1);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">🎵</div><span style="font-size:14px;font-weight:500;">'+h.trackName+'</span></div>';
    html+='<div style="font-size:12px;color:var(--txt2);margin-left:46px;">'+fd(d)+' '+ft(d)+(h.contactName?' · '+h.contactName:'')+'</div>';
    html+='<div style="font-size:12px;color:var(--txt3);margin-left:46px;margin-top:2px;">'+h.triggerType+'</div>';
    html+='</div>';
  });
  list.innerHTML=html;
}

function addStarMusicRecord(trackId,contactId,triggerType){
  var m=starMusicLibrary.find(function(x){return x.id===trackId});
  if(!m)return;
  var c=contacts.find(function(x){return x.id===contactId});
  starMusicHistory.push({id:'smh_'+Date.now(),trackId:trackId,trackName:m.name,contactId:contactId,contactName:c?c.name:'',triggerType:triggerType,timestamp:Date.now()});
  if(starMusicHistory.length>200)starMusicHistory=starMusicHistory.slice(-200);
  saveStarMusicHistory();
}

// ---------- 梦角音乐请求 ----------
function getStarMusicSettings(contactId){
  if(!starMusicSettings[contactId])starMusicSettings[contactId]={enabled:false,allowRequest:true,allowControl:false,allowModeChange:false,allowDefaultPlaylist:false};
  // 兼容旧数据：补充默认歌单权限字段（默认关闭）
  if(starMusicSettings[contactId].allowDefaultPlaylist===undefined)starMusicSettings[contactId].allowDefaultPlaylist=false;
  return starMusicSettings[contactId];
}

// 向联系人聊天发送一条星音系统消息
function sendStarMusicSystemMsg(contactId,text,extra){
  try{
    if(!contactId||!text)return;
    var sysMsg={
      id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),
      s:OTHER,
      t:text,
      ts:new Date(),
      read:(contactId===window.currentCid),
      isSystem:true,
      systemType:'music'
    };
    if(extra&&typeof extra==='object')Object.assign(sysMsg,extra);
    var m=msgs(contactId);
    if(m){
      m.push(sysMsg);
      savemsgs(contactId,m);
      if(contactId===window.currentCid)renderMsgs(m);
      renderChatList();
    }
  }catch(e){console.warn('sendStarMusicSystemMsg failed:',e);}
}

function maybeTriggerStarMusicRequest(contactId){
  if(!starMusicLibrary.length)return;
  if(!contactId)return;
  var settings=getStarMusicSettings(contactId);
  if(!settings.enabled||!settings.allowRequest)return;
  var now=Date.now();
  if(starMusicGlobalSettings.cooldownEnabled&&starMusicCooldown[contactId]&&(now-starMusicCooldown[contactId])<starMusicGlobalSettings.cooldownMs)return;
  var prob=starMusicGlobalSettings.requestProb||5;
  if(Math.random()*100>=prob)return;
  starMusicCooldown[contactId]=now;
  starMusicLastContactId=contactId;
  // ★ 默认歌单的歌：默认不参与梦角随机（除非该联系人在梦角权限里开启了"允许使用默认歌单"）
  var DEFAULT_PL_ID='spl_default_playlist';
  var candidateTracks=starMusicLibrary.filter(function(m){return m.playlistId!==DEFAULT_PL_ID});
  if(settings.allowDefaultPlaylist&&starMusicLibrary.some(function(m){return m.playlistId===DEFAULT_PL_ID})){
    candidateTracks=candidateTracks.concat(starMusicLibrary.filter(function(m){return m.playlistId===DEFAULT_PL_ID}));
  }
  if(candidateTracks.length===0)return;
  var track=candidateTracks[Math.floor(Math.random()*candidateTracks.length)];
  starMusicRequestData={trackId:track.id,contactId:contactId};
  // 在聊天里发送一条系统消息，记录TA的音乐请求
  var contact=contacts.find(function(x){return x.id===contactId});
  var contactName=contact?(contact.name||contact.nickname||'TA'):'TA';
  var trackName=track.name||track.title||'未知歌曲';
  var artist=track.artist?(' - '+track.artist):'';
  sendStarMusicSystemMsg(contactId,contactName+' 想和你一起听《'+trackName+'》'+artist,{systemType:'music-request',trackId:track.id});
  $('star-music-request-name').textContent='《'+track.name+'》';
  showOv('ov-star-music-request');
}

function acceptStarMusicRequest(){
  if(!starMusicRequestData)return;
  var trackId=starMusicRequestData.trackId;
  var contactId=starMusicRequestData.contactId;
  starMusicLastContactId=contactId; // 记录联系人，用于歌曲结束后TA自动行为
  hideOv('ov-star-music-request');
  playStarMusic(trackId);
  addStarMusicRecord(trackId,contactId,'TA请求播放');
  starMusicRequestData=null;
  toast('开始播放');
}

function rejectStarMusicRequest(){
  hideOv('ov-star-music-request');
  starMusicRequestData=null;
}

// ---------- 悬浮音乐播放小框 ----------
var _chatMusicBarClosed=false;
function isStarMusicFloatingEnabled(){
  return starMusicGlobalSettings.floatingPlayerEnabled!==false;
}
function renderChatMusicStatus(){
  var bar=$('chat-music-status');
  if(!bar)return;
  // 悬浮框在播放/暂停状态均显示，仅在用户主动关闭或无歌曲时隐藏
  if(!starMusicCurrentId||!starMusicAudio||_chatMusicBarClosed||!isStarMusicFloatingEnabled()){
    bar.style.display='none';return;
  }
  bar.style.display='flex';
  var m=starMusicLibrary.find(function(x){return x.id===starMusicCurrentId});
  if(m){
    $('chat-music-status-name').textContent=m.name||m.title||'未知歌曲';
  }
  // 更新进度条与时间
  var prog=$('chat-music-progress');
  var timeEl=$('chat-music-time');
  if(starMusicAudio&&starMusicAudio.duration){
    var pct=(starMusicAudio.currentTime/starMusicAudio.duration)*100;
    if(prog)prog.style.width=pct+'%';
    if(timeEl)timeEl.textContent=formatStarMusicTime(starMusicAudio.currentTime);
  }else{
    if(prog)prog.style.width='0%';
    if(timeEl)timeEl.textContent='00:00';
  }
  var playIcon=$('chat-music-play-icon');
  if(playIcon){
    playIcon.innerHTML=starMusicAudio&&!starMusicAudio.paused
      ? '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>'
      : '<path d="M8 5v14l11-7z"/>';
  }
}

function closeChatMusicBar(){
  var bar=$('chat-music-status');
  if(bar){
    _chatMusicBarClosed=true;
    bar.style.display='none';
  }
}

// 悬浮框位置记忆 + 拖拽
function setupChatMusicFloatDrag(){
  var bar=$('chat-music-status');
  if(!bar)return;
  // 恢复记忆位置
  try{
    var saved=ls('ml2_chat_music_pos');
    if(saved&&typeof saved==='object'){
      if(saved.left)bar.style.left=saved.left;
      if(saved.top)bar.style.top=saved.top;
      if(saved.right)bar.style.right=saved.right;
      if(saved.bottom)bar.style.bottom=saved.bottom;
    }
  }catch(e){}

  // 拖拽功能 - 整个小框可拖动
  var dragStarted=false,moved=false,startX=0,startY=0,origLeft=0,origTop=0;
  var touchMoveHandler=null; // 动态绑定/解绑，避免全局 passive:false 影响页面滚动

  function onDown(e){
    // 只在非按钮区域触发拖拽
    var tag=(e.target.tagName||'').toLowerCase();
    if(tag==='button'||tag==='input'||e.target.closest('button')||e.target.closest('input'))return;
    dragStarted=true;moved=false;
    var p=e.touches?e.touches[0]:e;
    startX=p.clientX;startY=p.clientY;
    var r=bar.getBoundingClientRect();origLeft=r.left;origTop=r.top;
    bar.style.cursor='grabbing';
    // 仅在拖拽开始时绑定 touchmove（passive:false），避免全局监听器阻止页面滚动
    if(e.touches){
      touchMoveHandler=onMove;
      document.addEventListener('touchmove',touchMoveHandler,{passive:false});
    }
  }
  function onMove(e){
    if(!dragStarted)return;
    var p=e.touches?e.touches[0]:e;
    if(Math.abs(p.clientX-startX)>3||Math.abs(p.clientY-startY)>3){
      moved=true;
      if(e.cancelable)e.preventDefault();
      var dx=p.clientX-startX,dy=p.clientY-startY;
      bar.style.left=(Math.max(4,Math.min(origLeft+dx,window.innerWidth-bar.offsetWidth-4)))+'px';
      bar.style.top=(Math.max(4,Math.min(origTop+dy,window.innerHeight-bar.offsetHeight-4)))+'px';
      bar.style.right='auto';bar.style.bottom='auto';bar.style.transform='none';
    }
  }
  function onUp(){
    if(dragStarted){
      dragStarted=false;
      bar.style.cursor='grab';
      if(moved){
        // 保存位置
        ls('ml2_chat_music_pos',{left:bar.style.left,top:bar.style.top});
      }
      // 拖拽结束后立即解绑 touchmove，恢复页面的正常滚动
      if(touchMoveHandler){
        document.removeEventListener('touchmove',touchMoveHandler);
        touchMoveHandler=null;
      }
    }
  }

  bar.style.cursor='grab';
  bar.addEventListener('mousedown',onDown);
  bar.addEventListener('touchstart',onDown,{passive:true});
  document.addEventListener('mousemove',onMove);
  document.addEventListener('mouseup',onUp);
  // 使用 capture:true 注册 touchend/touchcancel，确保在全局防误触的
  // stopPropagation 之前执行（全局处理器在 capture 阶段调用 stopPropagation
  // 会阻止 bubble 阶段的监听器，导致 onUp 不执行、拖拽状态无法重置）
  document.addEventListener('touchend',onUp,{capture:true});
  document.addEventListener('touchcancel',onUp,{capture:true});
}

function formatStarMusicTime(sec){
  var m=Math.floor(sec/60),s=Math.floor(sec%60);
  return ('0'+m).slice(-2)+':'+('0'+s).slice(-2);
}

// ---------- 联系人设置中的星音权限 ----------
function renderStarMusicContactSettings(contactId){
  var container=$('star-music-contact-settings');
  if(!container)return;
  var settings=getStarMusicSettings(contactId);
  var html='<div style="font-size:14px;font-weight:500;color:var(--txt);margin-bottom:8px;">🎵 星音权限</div>';
  html+='<div style="margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--c2);border-radius:8px;"><span style="font-size:13px;">开启星音权限</span><label class="tsw tsw-sm"><input type="checkbox" '+(settings.enabled?'checked':'')+' onchange="toggleStarMusicEnabled(\''+contactId+'\',this.checked)"><span class="sl"></span></label></div>';
  if(settings.enabled){
    html+='<div style="padding:0 14px;margin-bottom:12px;">';
    html+=starMusicPermToggle('💌 音乐请求','允许TA申请播放音乐',settings.allowRequest,function(v){getStarMusicSettings(contactId).allowRequest=v;saveStarMusicSettings()});
    html+=starMusicPermToggle('⏭ 音乐操作','允许下一首/上一首/随机播放',settings.allowControl,function(v){getStarMusicSettings(contactId).allowControl=v;saveStarMusicSettings()});
    html+=starMusicPermToggle('🔁 播放模式','允许切换循环模式',settings.allowModeChange,function(v){getStarMusicSettings(contactId).allowModeChange=v;saveStarMusicSettings()});
    html+='</div>';
  }
  container.innerHTML=html;
}

function starMusicPermToggle(icon,label,checked,onChange){
  var toggleId='sm_toggle_'+Math.random().toString(36).slice(2,8);
  setTimeout(function(){
    var cb=document.getElementById(toggleId);
    if(cb)cb.addEventListener('change',function(){onChange(cb.checked)});
  },0);
  return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);"><span style="font-size:13px;">'+icon+' '+label+'</span><label class="tsw tsw-sm"><input type="checkbox" id="'+toggleId+'" '+(checked?'checked':'')+'><span class="sl"></span></label></div>';
}

function toggleStarMusicEnabled(contactId,enabled){
  getStarMusicSettings(contactId).enabled=enabled;
  saveStarMusicSettings();
  renderStarMusicContactSettings(contactId);
}

// ---------- 梦角权限标签页 ----------
function renderStarMusicDreamPerms(){
  var list=$('star-music-dream-perms-list');
  var empty=$('star-music-dream-perms-empty');
  if(!list)return;
  var contacts=getAllContacts();
  if(!contacts||!contacts.length){
    list.innerHTML='';
    empty.style.display='block';
    return;
  }
  empty.style.display='none';
  var html='<div style="font-size:12px;color:var(--txt2);margin-bottom:12px;">设置每个梦角的星音权限（音乐请求、音乐操作、播放模式）</div>';
  contacts.forEach(function(c){
    var settings=getStarMusicSettings(c.id);
    var isEnabled=settings.enabled;
    var avatarHtml='👤';
    if(c.avatar){
      if(typeof c.avatar==='string'&&c.avatar.startsWith('data:image/')){
        avatarHtml='<img src="'+c.avatar+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
      }else if(typeof c.avatar==='string'&&c.avatar.length<10){
        avatarHtml=c.avatar;
      }
    }
    html+='<div style="padding:14px;background:var(--c2);border-radius:12px;margin-bottom:10px;border:1px solid '+(isEnabled?'var(--accent)':'var(--border)')+';">';
    html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">';
    html+='<div style="display:flex;align-items:center;gap:10px;">';
    html+='<div style="width:36px;height:36px;border-radius:50%;background:var(--c1);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;overflow:hidden;">'+avatarHtml+'</div>';
    html+='<span style="font-size:14px;font-weight:500;color:var(--txt);">'+(c.name||'未命名')+'</span>';
    html+='</div>';
    html+='<label class="tsw tsw-sm"><input type="checkbox" '+(isEnabled?'checked':'')+' onchange="toggleStarMusicDreamPerm(\''+c.id+'\',this.checked)"><span class="sl"></span></label>';
    html+='</div>';
    if(isEnabled){
      html+='<div style="padding:8px 0 0 0;border-top:1px solid var(--border);margin-top:8px;">';
      html+=starMusicPermToggle('💌 音乐请求','允许TA申请播放音乐',settings.allowRequest,function(v){getStarMusicSettings(c.id).allowRequest=v;saveStarMusicSettings();renderStarMusicDreamPerms();});
      html+=starMusicPermToggle('⏭ 音乐操作','允许下一首/上一首/随机播放',settings.allowControl,function(v){getStarMusicSettings(c.id).allowControl=v;saveStarMusicSettings();renderStarMusicDreamPerms();});
      html+=starMusicPermToggle('🔁 播放模式','允许切换循环模式',settings.allowModeChange,function(v){getStarMusicSettings(c.id).allowModeChange=v;saveStarMusicSettings();renderStarMusicDreamPerms();});
      html+=starMusicPermToggle('🎵 默认歌单','允许使用内置默认歌单的歌曲',settings.allowDefaultPlaylist,function(v){getStarMusicSettings(c.id).allowDefaultPlaylist=v;saveStarMusicSettings();renderStarMusicDreamPerms();});
      html+='</div>';
    }
    html+='</div>';
  });
  list.innerHTML=html;
}

function toggleStarMusicDreamPerm(contactId,enabled){
  getStarMusicSettings(contactId).enabled=enabled;
  saveStarMusicSettings();
  renderStarMusicDreamPerms();
}

function getAllContacts(){
  // 优先使用全局contacts变量（由loadC()加载）
  if(Array.isArray(contacts)&&contacts.length){
    return contacts.filter(function(c){return c&&c.id}).slice();
  }
  // 尝试从缓存/存储加载
  var saved=ls(LC);
  if(saved&&Array.isArray(saved)){
    return saved.filter(function(c){return c&&c.id}).slice();
  }
  return [];
}

// ---------- 星音陪伴说明弹窗 ----------
function showStarMusicInfo(){
  loadStarMusicData();
  $('sm-info-prob-slider').value=starMusicGlobalSettings.requestProb||5;
  $('sm-info-prob-val').textContent=(starMusicGlobalSettings.requestProb||5)+'%';
  $('sm-info-cooldown-toggle').checked=starMusicGlobalSettings.cooldownEnabled!==false;
  var row=$('sm-info-cooldown-row');
  if(row)row.style.display=starMusicGlobalSettings.cooldownEnabled!==false?'flex':'none';
  var cooldownMs=starMusicGlobalSettings.cooldownMs||600000;
  var cooldownMin=cooldownMs===0?0:Math.round(cooldownMs/60000);
  var sel=$('sm-info-cooldown-select');
  if(sel){
    var opts=sel.options;
    for(var i=0;i<opts.length;i++){if(parseInt(opts[i].value)===cooldownMin){sel.value=opts[i].value;break}}
  }
  // Auto-action settings
  $('sm-info-auto-keep').value=starMusicGlobalSettings.autoKeepProb||70;
  $('sm-info-auto-keep-val').textContent=(starMusicGlobalSettings.autoKeepProb||70)+'%';
  $('sm-info-auto-next').value=starMusicGlobalSettings.autoNextProb||15;
  $('sm-info-auto-next-val').textContent=(starMusicGlobalSettings.autoNextProb||15)+'%';
  $('sm-info-auto-random').value=starMusicGlobalSettings.autoRandomProb||10;
  $('sm-info-auto-random-val').textContent=(starMusicGlobalSettings.autoRandomProb||10)+'%';
  $('sm-info-auto-mode').value=starMusicGlobalSettings.autoModeProb||5;
  $('sm-info-auto-mode-val').textContent=(starMusicGlobalSettings.autoModeProb||5)+'%';
  // Floating player toggle
  var floatingToggle=$('sm-info-floating-toggle');
  if(floatingToggle)floatingToggle.checked=starMusicGlobalSettings.floatingPlayerEnabled!==false;
  var mainToggle=$('main-floating-toggle');
  if(mainToggle)mainToggle.checked=starMusicGlobalSettings.floatingPlayerEnabled!==false;
  showOv('ov-star-music-info');
}

function updateStarMusicInfoProb(val){
  $('sm-info-prob-val').textContent=val+'%';
}

function toggleStarMusicCooldown(enabled){
  var row=$('sm-info-cooldown-row');
  if(row)row.style.display=enabled?'flex':'none';
}

function toggleStarMusicFloatingPlayer(enabled){
  starMusicGlobalSettings.floatingPlayerEnabled=enabled;
  ls('ml2_star_music_global',starMusicGlobalSettings);
  if(!enabled){
    closeChatMusicBar();
  }else if(starMusicAudio&&!starMusicAudio.paused){
    renderChatMusicStatus();
  }
}

function updateStarMusicCooldown(val){}

function saveStarMusicInfoSettings(){
  starMusicGlobalSettings.requestProb=parseInt($('sm-info-prob-slider').value)||5;
  starMusicGlobalSettings.cooldownEnabled=$('sm-info-cooldown-toggle').checked;
  var cooldownVal=parseInt($('sm-info-cooldown-select').value)||10;
  starMusicGlobalSettings.cooldownMs=cooldownVal===0?0:cooldownVal*60000;
  // Auto-action settings
  starMusicGlobalSettings.autoKeepProb=parseInt($('sm-info-auto-keep').value)||70;
  starMusicGlobalSettings.autoNextProb=parseInt($('sm-info-auto-next').value)||15;
  starMusicGlobalSettings.autoRandomProb=parseInt($('sm-info-auto-random').value)||10;
  starMusicGlobalSettings.autoModeProb=parseInt($('sm-info-auto-mode').value)||5;
  // Floating player toggle
  var floatingToggle=$('sm-info-floating-toggle');
  if(floatingToggle)starMusicGlobalSettings.floatingPlayerEnabled=floatingToggle.checked;
  STAR_MUSIC_REQUEST_PROB=starMusicGlobalSettings.requestProb;
  STAR_MUSIC_COOLDOWN_MS=starMusicGlobalSettings.cooldownMs;
  ls('ml2_star_music_global',starMusicGlobalSettings);
  hideOv('ov-star-music-info');
  toast('设置已保存');
}


// ---------- 自定义歌曲（星音陪伴） ----------
var starMusicCustomSongs=[];
var starMusicCustomAudio=null;

function loadCustomSongs(){
  var saved=ls('ml2_star_custom_songs');
  if(saved&&Array.isArray(saved))starMusicCustomSongs=saved;
}
function saveCustomSongs(){ls('ml2_star_custom_songs',starMusicCustomSongs)}

function openAddCustomSongModal(){
  $('custom-song-title').value='';
  $('custom-song-artist').value='';
  $('custom-song-url').value='';
  showOv('ov-star-add-custom-song');
  setTimeout(function(){var inp=$('custom-song-title');if(inp)inp.focus()},200);
}

function closeAddCustomSongModal(){
  hideOv('ov-star-add-custom-song');
}

function addCustomSong(){
  var title=$('custom-song-title').value.trim();
  var artist=$('custom-song-artist').value.trim();
  var url=$('custom-song-url').value.trim();
  if(!title){toast('请输入歌名');return}
  if(!url){toast('请输入直链');return}
  if(!url.startsWith('http')){toast('请输入完整链接');return}

  loadCustomSongs();
  starMusicCustomSongs.push({
    id:'cs_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),
    title:title, sub:artist, url:url, isCustom:true, createdAt:Date.now()
  });
  saveCustomSongs();
  renderCustomSongs();
  closeAddCustomSongModal();
  toast('已添加：'+title);
}

function renderCustomSongs(){
  loadCustomSongs();
  var list=$('star-music-custom-list');
  if(!list)return;
  var html='';
  starMusicCustomSongs.forEach(function(m){
    html+='<div onclick="playCustomSong(\''+m.id+'\')" style="display:flex;align-items:center;gap:14px;padding:14px;background:var(--c2);border-radius:14px;margin-bottom:8px;cursor:pointer;border:1px solid var(--border);transition:all 0.15s;">';
    html+='<div style="width:44px;height:44px;border-radius:12px;background:var(--c1);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">🔗</div>';
    html+='<div style="flex:1;min-width:0;"><div style="font-size:15px;font-weight:500;color:var(--txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+escHtml(m.title)+'</div>';
    if(m.sub)html+='<div style="font-size:11px;color:var(--txt2);margin-top:3px;">'+escHtml(m.sub)+'</div>';
    html+='</div>';
    html+='<button onclick="event.stopPropagation();deleteCustomSong(\''+m.id+'\')" style="width:30px;height:30px;border:none;border-radius:50%;background:rgba(0,0,0,0.06);font-size:14px;cursor:pointer;color:var(--txt3);flex-shrink:0;">🗑</button>';
    html+='</div>';
  });
  if(!starMusicCustomSongs.length)html='';
  list.innerHTML=html;
}

function escHtml(str){
  var d=document.createElement('div');
  d.textContent=str;
  return d.innerHTML;
}

function playCustomSong(id){
  loadCustomSongs();
  var m=starMusicCustomSongs.find(function(x){return x.id===id});
  if(!m)return;
  if(starMusicAudio){
    try{starMusicAudio.pause();}catch(e){}
  }
  if(starMusicCustomAudio){
    try{starMusicCustomAudio.pause();starMusicCustomAudio=null;}catch(e){}
  }
  starMusicCustomAudio=new Audio(m.url);
  starMusicCustomAudio.play().catch(function(e){toast('播放失败，请检查链接是否有效')});
  toast('正在播放：'+m.title);
}

function deleteCustomSong(id){
  if(!confirm('确定删除这首自定义歌曲？'))return;
  if(starMusicCustomAudio){
    try{starMusicCustomAudio.pause();starMusicCustomAudio=null;}catch(e){}
  }
  starMusicCustomSongs=starMusicCustomSongs.filter(function(x){return x.id!==id});
  saveCustomSongs();
  renderCustomSongs();
  toast('已删除');
}

// Extend switchStarMusicTab to also render custom songs on library tab
(function(){
  var _origSwitch = switchStarMusicTab;
  switchStarMusicTab = function(tab){
    _origSwitch(tab);
    if(tab==='library') renderCustomSongs();
  };
})();

// Initial load
(function(){
  loadCustomSongs();
  // Defer render until DOM is ready
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){renderCustomSongs()});
  }else{
    renderCustomSongs();
  }
})();


// ---------- Long Screenshot ----------
var longScreenshotMode=false;
var longScreenshotSelectedMsgs=[];

function showLongScreenshot(){
  if(!cid){toast('请先选择对话');return}
  showChatPage();
  if(favMsgMode)cancelFavMsgMode();
  if(copyMsgMode)cancelCopyMsg();
  longScreenshotMode=true;
  longScreenshotSelectedMsgs=[];
  var bar=$('long-screenshot-bar');
  if(bar)bar.style.display='block';
  updateLongScreenshotCount();
  // Re-render chat with checkboxes
  var m=msgs(cid);
  if(m)renderMsgs(m);
  // Scroll to bottom
  var box=$('msgbox');
  if(box)requestAnimationFrame(function(){box.scrollTop=box.scrollHeight});
  toast('点击消息旁的复选框勾选要截取的消息');
}

function cancelLongScreenshot(){
  longScreenshotMode=false;
  longScreenshotSelectedMsgs=[];
  var bar=$('long-screenshot-bar');
  if(bar)bar.style.display='none';
  var m=msgs(cid);
  if(m)renderMsgs(m);
}

function toggleLongScreenshotMsg(msgId){
  var idx=longScreenshotSelectedMsgs.indexOf(msgId);
  if(idx>=0){longScreenshotSelectedMsgs.splice(idx,1)}else{longScreenshotSelectedMsgs.push(msgId)}
  updateLongScreenshotCount();
}

function updateLongScreenshotCount(){
  var countEl=$('long-screenshot-count');
  if(countEl)countEl.textContent='已选 '+longScreenshotSelectedMsgs.length+' 条';
}

function selectAllLongScreenshot(filterType){
  var box=$('msgbox');
  if(!box)return;
  var m=msgs(cid);
  if(!m||!m.length)return;
  var selectableMsgs=m.filter(function(x){return !x.retracted&&(x.t||x.img||x.isTouch||x.isCall||x.isRedpacket||x.voice)});
  
  if(filterType==='today'){
    var today=new Date();
    today.setHours(0,0,0,0);
    var todayMs=today.getTime();
    selectableMsgs=selectableMsgs.filter(function(msg){
      var ts=msg.ts?new Date(msg.ts).getTime():0;
      return ts>=todayMs;
    });
  }
  
  var allSelected=selectableMsgs.length>0&&longScreenshotSelectedMsgs.length===selectableMsgs.length;
  if(allSelected){
    longScreenshotSelectedMsgs=[];
  }else{
    longScreenshotSelectedMsgs=selectableMsgs.map(function(x){return x.id});
  }
  var m2=msgs(cid);
  if(m2)renderMsgs(m2);
  updateLongScreenshotCount();
}

function loadHtml2Canvas(){
  return new Promise(function(resolve,reject){
    if(window.html2canvas){resolve();return}
    var script=document.createElement('script');
    script.src='https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
    script.onload=function(){resolve()};
    script.onerror=function(){reject(new Error('html2canvas load failed'))};
    document.head.appendChild(script);
  });
}

async function generateLongScreenshot(){
  if(longScreenshotSelectedMsgs.length===0){toast('请先勾选要截取的消息');return}
  
  var m=msgs(cid);
  var c=contacts.find(function(x){return x.id===cid})||groups.find(function(x){return x.id===cid});
  var isGroup=!!groups.find(function(x){return x.id===cid});
  var myName='我';
  var contactName=c?c.name:'TA';
  var hideNames=c&&c.hideQuoteNames;
  var hideTouchLSScreen=c&&c.hideTouchNames;
  var chatSettings=c&&c.chatSettings?c.chatSettings:{};
  
  var selectedMsgs=[];
  longScreenshotSelectedMsgs.forEach(function(msgId){
    var msg=m.find(function(x){return x.id===msgId});
    if(msg)selectedMsgs.push(msg);
  });
  selectedMsgs.sort(function(a,b){
    var ats=a.ts?new Date(a.ts).getTime():0;
    var bts=b.ts?new Date(b.ts).getTime():0;
    return ats-bts;
  });
  
  toast('正在生成长截图...');
  
  try{
    // Load html2canvas
    if(!window.html2canvas){
      await loadHtml2Canvas();
    }
    
    // Build avatar HTML
    var myAvatarHtml=c&&c.myAvatar?'<img src="'+c.myAvatar.replace(/"/g,'&quot;')+'" crossorigin="anonymous">':me.avatar?'<img src="'+me.avatar.replace(/"/g,'&quot;')+'" crossorigin="anonymous">':'✦';
    var otherAvatarHtml=c&&c.avatar?'<img src="'+c.avatar.replace(/"/g,'&quot;')+'" crossorigin="anonymous">':'✦';
    
    // Build message HTML
    var htmlParts=[];
    var cd='',lt=0,GAP=300000;
    var starEn=getSpeed('star-en')===1;
    var timelineStyle=getContactTimelineStyle(cid);
    
    for(var i=0;i<selectedMsgs.length;i++){
      var x=selectedMsgs[i];
      var d=x.ts instanceof Date?x.ts:new Date(x.ts);
      var ds=d.toDateString();
      
      if(ds!==cd){
        cd=ds;
        var td=new Date().toDateString();
        var yd=new Date(Date.now()-864e5).toDateString();
        htmlParts.push('<div class="ts">'+(ds===td?'今天':ds===yd?'昨天':fd(d))+'</div>');
      }
      
      var gap=i===0||(d.getTime()-lt)>GAP;
      var isProactive=x.isInitiative===true||x.isInitiative==='true';
      
      // Touch messages
      if(x.isTouch===true||x.isTouch==='true'){
        var touchSenderName=x.s===SELF?'我':(hideTouchLSScreen?'TA':(x.senderName||contactName));
        var touchLSTarget=x.touchTarget||'你';
        if(hideTouchLSScreen){
          touchLSTarget=x.s===SELF?'TA':'我';
        }
        var touchContent=touchSenderName+' '+x.touchAction.replace('你',touchLSTarget);
        htmlParts.push('<div class="mr touch-msg '+(x.s===SELF?'self':'other')+'"><div class="message-touch">'+touchContent.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div></div>');
        lt=d.getTime();
        continue;
      }
      
      // Call messages
      if(x.isCall===true||x.isCall==='true'){
        htmlParts.push('<div class="message-call-row"><div class="message-call" onclick="var t=this.nextElementSibling;t.style.display=t.style.display===\'none\'?\'\':\'none\'" style="cursor:pointer;">'+(x.callMessage||'通话记录').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div><div class="message-call-time" style="display:none;">'+fts(d)+'</div></div>');
        lt=d.getTime();
        continue;
      }

      // Gift messages
      if(x.isGift===true&&x.isGiftReply!==true){
        var giftIconLS=x.giftIcon||'🎁';
        var giftNameLS=(x.giftName||'礼物').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        var giftMsgLS=(x.giftMsg||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        var isFromTALS=x.isGiftFromTA===true;
        var giftBgLS=isFromTALS?'#fff8f3':'var(--c2)';
        var giftTopColorLS=isFromTALS?'#e07080':'var(--txt3)';
        var giftDirTextLS=getGiftDirText(isFromTALS,x.senderId||cid);
        var giftHtmlLS='<div style="background:'+giftBgLS+';border-radius:14px;padding:14px;max-width:260px;box-shadow:0 2px 8px rgba(0,0,0,.06);border:1px solid rgba(0,0,0,.04);">';
        giftHtmlLS+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">';
        giftHtmlLS+='<div style="font-size:12px;color:'+giftTopColorLS+';font-weight:600;">'+giftDirTextLS+'</div>';
        giftHtmlLS+='</div>';
        giftHtmlLS+='<div style="text-align:center;margin:8px 0;">';
        giftHtmlLS+='<div style="font-size:40px;line-height:1;">'+renderGiftIcon(giftIconLS,40)+'</div>';
        giftHtmlLS+='<div style="font-size:15px;font-weight:600;color:var(--txt);margin-top:6px;">'+giftNameLS+'</div>';
        giftHtmlLS+='</div>';
        if(giftMsgLS){
          giftHtmlLS+='<div style="font-size:12px;color:var(--txt2);line-height:1.6;text-align:center;margin-top:8px;padding:8px 0;border-top:1px solid rgba(0,0,0,.05);">';
          giftHtmlLS+='「'+giftMsgLS+'」';
          giftHtmlLS+='</div>';
        }
        giftHtmlLS+='</div>';
        htmlParts.push('<div class="mr gift-msg-row '+(x.s===SELF?'self':'other')+'">'+giftHtmlLS+'</div>');
        lt=d.getTime();
        continue;
      }

      // TA划重点系统消息
      if(x.isTAHighlight===true){
        var _hideHL_LS=_globalHideTouchNames[cid]===true;
        if(!_hideHL_LS)_hideHL_LS=getHideTouchNames(cid)===true;
        var _hlName_LS=c?c.name:'TA';
        var _hlText_LS=_hideHL_LS?('TA 划了想说的重点'):(_hlName_LS+' 划了想说的重点');
        htmlParts.push('<div class="message-call-row"><div class="message-call" style="cursor:default;">✏️ '+_hlText_LS.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div></div>');
        lt=d.getTime();
        continue;
      }

      // Red packet collected messages
      if(x.isRedpacketCollected===true){
        var colAmt3=x.redpacketCollectedAmount||'0';
        var colText3=x.redpacketCollectedText||'红包已领取';
        htmlParts.push('<div class="message-redpacket-collected" style="background:linear-gradient(135deg,#f5e6d3,#e8d0b8);border-radius:12px;padding:14px;max-width:280px;box-shadow:0 2px 10px rgba(138,109,59,0.1);border:1px solid rgba(138,109,59,0.08);"><div style="display:flex;align-items:center;gap:10px;font-size:13px;color:#8a6d3b;"><span style="font-size:20px;flex-shrink:0;">🧧</span><span style="flex:1;min-width:0;font-weight:500;">'+colText3+'</span><span style="font-weight:600;font-size:16px;flex-shrink:0;">¥'+colAmt3+'</span></div></div>');
      }
      // Red packet messages
      else if(x.isRedpacket===true||x.isRedpacket==='true'){
        var rpAmt=x.redpacketAmount||'0';
        var rpSt=x.redpacketStatus||(x.redpacketOpened?'received':'pending');
        var rpBg2,rpAccent2,rpText2,rpTxt2,rpOpacity2,rpStatusBg2;
        if(rpSt==='received'){rpBg2='linear-gradient(135deg,#e8d5b0,#d4b88a)';rpAccent2='#8a6d3b';rpText2='#8a6d3b';rpTxt2=x.s===SELF?'TA 已领取':'已领取';rpOpacity2='1';rpStatusBg2='rgba(138,109,59,0.1)';}
        else if(rpSt==='returned'){rpBg2='linear-gradient(135deg,#d0d0d0,#b8b8b8)';rpAccent2='#777';rpText2='#777';rpTxt2='已退回';rpOpacity2='1';rpStatusBg2='rgba(120,120,120,0.1)';}
        else if(rpSt==='expired'){rpBg2='linear-gradient(135deg,#d0d0d0,#b8b8b8)';rpAccent2='#777';rpText2='#777';rpTxt2='已过期';rpOpacity2='1';rpStatusBg2='rgba(120,120,120,0.1)';}
        else{rpBg2='linear-gradient(135deg,#d93025,#c41e1e)';rpAccent2='#d4a853';rpText2='#fff';rpTxt2=x.s===SELF?'等待领取':'点击领取';rpOpacity2='1';rpStatusBg2='rgba(0,0,0,0.15)';}
        htmlParts.push('<div class="message-redpacket" style="background:'+rpBg2+';border-radius:12px;overflow:hidden;max-width:280px;box-shadow:0 2px 10px rgba(212,48,37,0.2);">'
          +'<div style="padding:14px;display:flex;align-items:center;gap:10px;">'
          +'<div style="width:40px;height:40px;border-radius:50%;background:'+(rpSt==='pending'?'rgba(212,168,83,0.25)':'rgba(138,109,59,0.15)')+';display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">🧧</div>'
          +'<div style="flex:1;min-width:0;">'
          +'<div style="font-size:13px;font-weight:500;color:'+rpText2+';overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:3px;">'+(x.redpacketGreeting||'恭喜发财')+'</div>'
          +'<div style="font-size:11px;color:'+rpText2+';opacity:0.7;">红包</div>'
          +'</div>'
          +'<div style="font-size:16px;font-weight:600;color:'+rpAccent2+';flex-shrink:0;text-shadow:'+(rpSt==='pending'?'0 1px 2px rgba(0,0,0,0.2)':'none')+';">¥'+rpAmt+'</div>'
          +'</div>'
          +'<div style="padding:6px 14px;background:'+rpStatusBg2+';font-size:11px;color:'+rpText2+';opacity:'+(rpSt==='pending'?'0.9':'0.6')+';text-align:center;">'+rpTxt2+'</div>'
          +'</div>');
        lt=d.getTime();
        continue;
      }
      
      // Content
      var contentHtml='';
      if(x.retracted){
        contentHtml='<div class="message-retracted">对方撤回了一条消息</div>';
      }else if(x.img||(x.t&&typeof x.t==='string'&&x.t.startsWith('data:image/'))){
        var imgUrl=x.img||x.t;
        if(imgUrl&&!imgUrl.startsWith('data:image/')){
          var cachedImg=memoryCache['_img_'+imgUrl];
          if(cachedImg){imgUrl=cachedImg}
        }
        var isSticker=x.isSticker===true;
        var imgClass=isSticker?'message-sticker':'message-img';
        var imgHtml='<img src="'+imgUrl.replace(/"/g,'&quot;')+'" class="'+imgClass+'" crossorigin="anonymous">';
        // 修复：确保 x.t 是字符串后再调用 .trim()，避免非字符串类型导致渲染崩溃
        var _imgText5=typeof x.t==='string'?x.t:(x.t!=null?String(x.t):'');
        if(_imgText5&&_imgText5.trim()){
          var textHtml=_imgText5.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
          contentHtml='<div class="message-text-img-combo">'+imgHtml+'<div class="message-text-below">'+textHtml+'</div></div>';
        }else{
          contentHtml=imgHtml;
        }
      }else if(x.voice){
        contentHtml='<div class="voice-message-player">🎤 <span style="font-size:11px;opacity:0.7;">'+(x.voiceText||'语音消息')+'</span></div>';
      }else{
        // 修复：确保 x.t 是字符串后再调用 .replace()，避免非字符串类型导致渲染崩溃
        var _plainText=typeof x.t==='string'?x.t:(x.t!=null?String(x.t):'');
        contentHtml=_plainText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
      }
      
      // Quote
      var quoteHtml='';
      if(x.quote){
        var quoteMsg=m.find(function(q){return q.id===x.quote});
        if(quoteMsg){
          var quoteContent='';
          if(quoteMsg.retracted){quoteContent='对方撤回了一条消息'}
          else if(quoteMsg.isTouch){quoteContent=quoteMsg.touchAction||'[拍一拍]'}
          else if(quoteMsg.isCall||quoteMsg.callMessage){quoteContent=quoteMsg.callMessage||'[通话]'}
          else if(quoteMsg.isVoice||quoteMsg.voice){quoteContent='[语音]'}
          else if(quoteMsg.img){quoteContent='[图片]'}
          else if(quoteMsg.isLetter){quoteContent='[一封信]'}
          else if(quoteMsg.redpacketAmount){quoteContent='🧧 红包 ¥'+quoteMsg.redpacketAmount}
          else if(quoteMsg.moodCard||quoteMsg.heartCard||quoteMsg.intentCard){
            var cardParts3=[];
            if(quoteMsg.moodCard&&quoteMsg.moodCard.content)cardParts3.push('💭 '+quoteMsg.moodCard.content);
            if(quoteMsg.heartCard&&quoteMsg.heartCard.content)cardParts3.push('❤️ '+quoteMsg.heartCard.content);
            if(quoteMsg.intentCard&&quoteMsg.intentCard.content)cardParts3.push('💬 '+quoteMsg.intentCard.content);
            quoteContent=cardParts3.join(' ');
          }
          else if(quoteMsg.t){quoteContent=quoteMsg.t}
          else if(quoteMsg.callMessage){quoteContent=quoteMsg.callMessage}
          else{quoteContent='[消息]'}
          if(quoteContent.length>30)quoteContent=quoteContent.substring(0,30)+'...';
          quoteHtml='<div class="message-quote">'+quoteContent.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div>';
        }else{
          quoteHtml='<div class="message-quote">[消息已被删除]</div>';
        }
      }
      
      // Avatar
      var avatarHtml='';
      if(x.s===SELF){
        avatarHtml='<div class="ma-wrap"><div class="ma">'+myAvatarHtml+'</div>';
      }else if(isGroup&&x.senderId){
        var sender=contacts.find(function(sc){return sc.id===x.senderId});
        var senderAv=sender&&sender.avatar?'<img src="'+sender.avatar.replace(/"/g,'&quot;')+'" crossorigin="anonymous">':'✦';
        avatarHtml='<div class="ma-wrap"><div class="ma">'+senderAv+'</div>';
      }else{
        avatarHtml='<div class="ma-wrap"><div class="ma">'+otherAvatarHtml+'</div>';
      }
      
      // Sender name
      var senderNameHtml='';
      if(isGroup&&x.s!==SELF&&x.senderName){
        senderNameHtml='<div class="sender-name">'+x.senderName.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div>';
      }
      
      // Star
      var starHtml='';
    if(starEn&&x.s===OTHER&&isProactive){
      var starColor=getComputedStyle(document.documentElement).getPropertyValue('--star-color').trim()||'var(--txt3)';
      starHtml='<span class="message-star" style="color:'+starColor+'">⭐</span>';
    }
      
      // Read ignored
      var readIgnoredHtml=(x.s===SELF&&x.readIgnored)?'<div class="message-read-ignored">已读不回</div>':'';
      
      // Time
      var timeHtml='<div class="mt">'+fts(d)+'</div>';
      var bubbleTimeHtml=timelineStyle==='bubble'?'<div class="mb-time">'+fts(d)+'</div>':(timelineStyle==='inside'?'<div class="mb-time-inside">'+fts(d)+'</div>':'');
      
      // 将时间放入 ma-wrap 内（ma 下方），而不是 ma 内部
      if(timelineStyle==='avatar'){
        avatarHtml+=timeHtml;
      }
      avatarHtml+='</div>';
      
      htmlParts.push('<div class="mr '+(x.s===SELF?'self':'other')+(gap?' has-gap':'')+(x.retracted?' retracted':'')+'">'+avatarHtml+'<div class="mc">'+senderNameHtml+starHtml+'<div class="mb">'+quoteHtml+contentHtml+bubbleTimeHtml+'</div>'+readIgnoredHtml+'</div></div>');
      lt=d.getTime();
    }
    
    // Create temporary container
    var container=document.createElement('div');
    container.className='long-ss-container';
    
    // Apply background image from CSS variable
    var bgStyle=getComputedStyle(document.documentElement).getPropertyValue('--chat-bg-image').trim();
    if(bgStyle&&bgStyle!=='none'){
      container.style.backgroundImage=bgStyle;
      container.style.backgroundSize='cover';
      container.style.backgroundPosition='center center';
      container.style.backgroundRepeat='no-repeat';
    }
    
    // Apply bubble CSS variables from chatSettings
    var bubbleFontSize=chatSettings.bubbleFontSize||16;
    var bubblePadding=chatSettings.bubblePadding||14;
    container.style.setProperty('--bubble-font-size',bubbleFontSize+'px');
    container.style.setProperty('--bubble-padding',bubblePadding+'px '+Math.round(bubblePadding*1.4)+'px');
    
    container.innerHTML=htmlParts.join('');
    document.body.appendChild(container);
    
    // Wait for all images to load
    var images=container.querySelectorAll('img');
    if(images.length>0){
      await Promise.all(Array.from(images).map(function(img){
        return new Promise(function(resolve){
          if(img.complete){resolve();return}
          img.onload=function(){resolve()};
          img.onerror=function(){resolve()};
          setTimeout(function(){resolve()},3000);
        });
      }));
    }
    
    // Small delay for layout to settle
    await new Promise(function(r){setTimeout(r,100)});
    
    // 临时显示容器以便 html2canvas 正确渲染
    container.style.visibility='visible';
    
    // Capture with html2canvas
    var capturedCanvas=await window.html2canvas(container,{
      scale:1.5,
      useCORS:true,
      backgroundColor:null,
      logging:false,
      allowTaint:false
    });
    
    // 隐藏容器
    container.style.visibility='hidden';
    
    // Remove temporary container
    document.body.removeChild(container);
    
    // Download
    capturedCanvas.toBlob(function(blob){
      var url=URL.createObjectURL(blob);
      var a=document.createElement('a');
      a.href=url;
      a.download='聊天记录_'+contactName+'_'+new Date().toISOString().slice(0,10)+'.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast('长截图已保存');
      cancelLongScreenshot();
    },'image/png');
  }catch(e){
    console.error('generateLongScreenshot error:',e);
    toast('生成失败，请重试');
  }
}

function loadImage(src){
  return new Promise(function(resolve,reject){
    var img=new Image();
    img.crossOrigin='anonymous';
    img.onload=function(){resolve(img)};
    img.onerror=function(){reject(new Error('load failed'))};
    img.src=src;
  });
}

function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

function wrapText(ctx,text,maxWidth){
  var words=text.split('');
  var lines=[];
  var currentLine='';
  for(var i=0;i<words.length;i++){
    var testLine=currentLine+words[i];
    var metrics=ctx.measureText(testLine);
    if(metrics.width>maxWidth&&currentLine.length>0){
      lines.push(currentLine);
      currentLine=words[i];
    }else{
      currentLine=testLine;
    }
  }
  if(currentLine.length>0)lines.push(currentLine);
  return lines;
}

// Send push notification on new message
var origSendMsg=sendMsg;
sendMsg=function(){
  origSendMsg.apply(this,arguments);
  setTimeout(function(){
    var c=contacts.find(function(x){return x.id===cid});
    if(c&&document.visibilityState!=='visible'&&pushNotifyEnabled){
      if('Notification' in window&&Notification.permission==='granted'){
        try{var n=new Notification(c.name||'新消息',{body:'收到一条新消息',icon:c.avatar||'',tag:'milk-msg'});n.onclick=function(){window.focus();n.close()};setTimeout(function(){n.close()},5000)}catch(e){}
      }
    }
  },2000);
};

</script>
<div id="image-viewer">
  <button id="image-viewer-close">×</button>
  <img id="image-viewer-content" src="">
</div>

<!-- Mini Call Bar -->
<div id="call-mini-bar" style="display:none;position:fixed;bottom:100px;left:50%;transform:translateX(-50%);width:auto;min-width:120px;height:44px;border-radius:12px;background:#ffffff;box-shadow:0 3px 14px rgba(0,0,0,0.1);z-index:10000;border:1px solid var(--border-light);align-items:center;justify-content:space-between;gap:4px;padding:0 10px;cursor:grab;transition:box-shadow 0.2s;background-size:cover;background-position:center;touch-action:none;-webkit-user-select:none;user-select:none;">
  <div style="display:flex;align-items:center;gap:8px;">
    <div id="call-mini-avatar" style="width:30px;height:30px;border-radius:50%;background:var(--c3);display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--txt2);overflow:hidden;border:2px solid rgba(255,255,255,0.6);box-shadow:0 2px 6px rgba(0,0,0,0.06);">👤</div>
    <div style="display:flex;flex-direction:column;">
      <div id="call-mini-name" style="font-size:12px;font-weight:500;color:var(--txt);line-height:1.2;text-shadow:0 0 6px rgba(255,255,255,0.8);">通话中</div>
      <div id="call-mini-time" style="font-size:10px;color:var(--txt3);line-height:1.2;text-shadow:0 0 6px rgba(255,255,255,0.8);">00:00</div>
    </div>
  </div>
  <button id="call-mini-expand-btn" style="background:none;border:none;color:var(--txt3);font-size:18px;font-weight:bold;cursor:pointer;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:var(--transition-fast);touch-action:manipulation;-webkit-tap-highlight-color:transparent;z-index:10001;">−</button>
</div>


<!-- ===== d2-占卜页面（从新抽牌4移植） ===== -->
<div class="d2-app" id="d2-app">

        <!-- ===== 首页 ===== -->
        <div class="d2-page d2-active" id="d2-page-home">
            <button class="d2-home-back" onclick="d2CloseDivination()" title="关闭">×</button>
            <button class="d2-btn-to-full" onclick="d2SwitchToFull()" title="切换全屏">⛶</button>
            <div class="d2-home-wrapper">
            <div class="d2-home-header">
                <div class="d2-home-title">
                    ✨ 梦占塔罗
                    <small>☄ 以牌为桥 · 连接彼此 ☄</small>
                </div>
                <div class="d2-home-divider"></div>
                <div class="d2-home-sub" id="d2-homeSub">以牌为桥，问TA心意</div>
            </div>

            <div class="d2-home-content">

            <!-- 模式选择 -->
            <div class="d2-mode-tabs" id="d2-modeTabs">
                <button class="d2-mode-tab d2-active" data-mode="mixed">混合模式</button>
                <button class="d2-mode-tab" data-mode="tarot">塔罗牌</button>
                <button class="d2-mode-tab" data-mode="lenormand">雷诺曼牌</button>
            </div>

            <!-- 混合模式子选项 -->
            <div class="d2-sub-tabs" id="d2-subTabs">
                <button class="d2-sub-tab d2-active" data-sub="random">随机抽牌</button>
                <button class="d2-sub-tab" data-sub="free">自由抽牌</button>
            </div>

            <!-- 占卜对象选择 -->
            <div class="d2-contact-area" id="d2-contactArea">
                <label>✨ 占卜对象</label>
                <div class="d2-contact-select" id="d2-contactSelect"></div>
            </div>

            <div class="d2-question-area" id="d2-questionArea">
                <label for="questionInput">📝 想问TA什么？输入你的问题</label>
                <input type="text" id="d2-questionInput" placeholder="例如：TA现在对我是什么感觉？" maxlength="60">
            </div>

            <div class="d2-draw-options" id="d2-drawOptions">
                <!-- 混合模式 -->
                <div class="d2-opt-group d2-active" id="d2-opt-mixed">
                    <!-- 随机抽牌选项 -->
                    <div id="d2-mixed-random">
                        <button class="d2-btn-start" id="d2-btnStart">✦ 开始抽牌 ✦</button>
                        <div style="font-size:11px;color:#8a7a6a;margin-top:6px;letter-spacing:1px;text-align:center;line-height:1.6;">
                            📬 TA的回应 · 雷诺曼牌 1~5张（随机）<br>
                            💭 TA的情绪 · 塔罗牌 3张（固定，含正逆位）<br>
                            🔮 TA的秘密 · 塔罗牌 1~3张（随机，含正逆位）
                        </div>
                    </div>
                    <!-- 自由抽牌选项 -->
                    <div id="d2-mixed-free" style="display:none;">
                        <div style="font-size:11px;color:#8a7a6a;margin-bottom:8px;text-align:center;line-height:1.8;">
                            自由抽牌，想抽几张就抽几张<br>
                            📬 TA的回应 · 雷诺曼牌 最多5张<br>
                            💭 TA的情绪 · 塔罗牌 最多3张<br>
                            🔮 TA的秘密 · 塔罗牌 最多3张
                        </div>
                        <button class="d2-btn-start" id="d2-btnFreeStart">✦ 开始抽牌 ✦</button>
                        <div style="font-size:11px;color:#8a7a6a;margin-top:6px;text-align:center;">
                            每类牌可自由抽取，满意后点击「完成此步」进入下一步
                        </div>
                    </div>
                </div>
                <!-- 塔罗牌模式 -->
                <div class="d2-opt-group" id="d2-opt-tarot">
                    <div class="d2-opt-btns">
                        <button class="d2-btn-start" data-draw="tarot-1">抽 1 张</button>
                        <button class="d2-btn-start" data-draw="tarot-3">抽 3 张</button>
                    </div>
                </div>
                <!-- 雷诺曼牌模式 -->
                <div class="d2-opt-group" id="d2-opt-lenormand">
                    <div class="d2-opt-btns">
                        <button class="d2-btn-start" data-draw="lenormand-1">抽 1 张</button>
                        <button class="d2-btn-start" data-draw="lenormand-3">抽 3 张</button>
                    </div>
                </div>
            </div>

            <button class="d2-btn-start" id="d2-btnHomeHistory" style="background:transparent;border:1px solid #d8cee0;color:#8a7a8a;margin-top:6px;">📜 历史记录</button>

            <button class="d2-btn-quick" id="d2-btnQuick" style="margin-top:10px;">⚡ 速占 · 一键出结果</button>

        </div>

        <div class="d2-disclaimer-area">
            <div class="d2-ornament">✦ ✦ ✦</div>
            <div class="d2-disclaimer" style="margin-top: 8px;">
                本抽牌功能仅供学习、交流与娱乐参考。<br>
                牌面图片版权归原作者及出版方所有，仅用于抽牌结果展示。<br>
                如相关权利人对展示内容有任何意见，请联系我们，我们将在核实后及时处理。
            </div>
            <div class="d2-disclaimer" style="margin-top: 2px; font-size: 9px;">
                关于混合模式：借鉴小红书 @心汋是颗彩虹多宝糖 老师的占卜帖子，已和老师打过招呼
            </div>
        </div>
        </div>
    </div>

        <!-- ===== 抽牌页面 ===== -->
        <div class="d2-page" id="d2-page-draw">
            <div class="d2-draw-header">
                <button class="d2-back" id="d2-btnBack">←</button>
                <span class="d2-title" id="d2-drawTitle">抽牌</span>
                <span class="d2-count" id="d2-drawCount">0 张</span>
            </div>

            <!-- 流程指示（仅混合模式显示） -->
            <div class="d2-flow-hint d2-hidden" id="d2-flowHint">
                <span class="d2-step" data-step="reply"><span class="d2-dot"></span> 📬 TA的回应</span>
                <span class="d2-arrow">→</span>
                <span class="d2-step" data-step="mood"><span class="d2-dot"></span> 💭 TA的情绪</span>
                <span class="d2-arrow">→</span>
                <span class="d2-step" data-step="secret"><span class="d2-dot"></span> 🔮 TA的秘密</span>
            </div>

            <div class="d2-draw-question" id="d2-drawQuestion">所问：<strong id="d2-questionDisplay"></strong></div>

            <div class="d2-draw-stage" id="d2-drawStage">
                <!-- 洗牌区域 -->
                <div class="d2-shuffle-box" id="d2-shuffleBox"></div>
                <!-- 牌轮展开 -->
                <div class="d2-draw-pile-area d2-hidden" id="d2-drawPileArea">
                    <div class="d2-card-grid" id="d2-cardGrid">
                        <div class="d2-card-row" id="d2-cardRow1"></div>
                        <div class="d2-card-row" id="d2-cardRow2"></div>
                    </div>
                    <div class="d2-pile-hint" id="d2-pileHint">点击牌背抽取</div>
                    <div id="d2-freeFinishBtn" style="display:none;text-align:center;margin:8px 0;">
                        <button onclick="d2FinishFreeStep()" style="padding:8px 24px;border:1px solid #8b7a9e;border-radius:20px;background:#8b7a9e;color:#fff;font-size:13px;font-family:inherit;cursor:pointer;">✓ 完成此步</button>
                    </div>
                    <div class="d2-drawn-cards-area" id="d2-drawnCards"></div>
                </div>
                <!-- 结果区域 -->
                <div id="d2-resultArea" class="d2-hidden" style="width:100%;">
                    <div class="d2-result-grid" id="d2-resultGrid"></div>
                </div>
            </div>

            <div class="d2-draw-actions" id="d2-drawActions">
                <button class="d2-btn d2-btn-outline" id="d2-btnRedraw">↺ 重新抽</button>
                <button class="d2-btn d2-btn-primary" id="d2-btnNext" style="display:none;">继续 →</button>
                <button class="d2-btn d2-btn-outline" id="d2-btnCopyResult" style="display:none;">📋 复制结果</button>
                <button class="d2-btn d2-btn-outline" id="d2-btnHistory" style="display:none;">📜 历史记录</button>
                <button class="d2-btn d2-btn-outline" id="d2-btnAi" style="display:none;">⭐ AI 解读</button>
                <button class="d2-btn-send-chat" id="d2-btnSendChat" style="display:none;" onclick="d2SendResultToChat()">💬 发送至聊天</button>
                <label class="d2-send-setting" id="d2-sendSetting" style="display:none;" title="关闭后不再自动显示发送按钮"><input type="checkbox" id="d2-sendToggle" checked onchange="d2ToggleSendToChat()"> 发送至聊天</label>
            </div>
            <div id="d2-ai-area" style="display:none;width:100%;margin-top:8px;padding:12px;border-radius:12px;background:var(--c3);border:1px dashed var(--border);box-sizing:border-box;"></div>
            <div class="d2-disclaimer" style="margin-top: 6px; padding-bottom: 8px;">
                牌面图片仅用于抽牌结果展示，不可下载。
            </div>
        </div>

        </div>
<!-- end d2-占卜页面 -->


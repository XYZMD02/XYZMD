// ---------- Emoji Panel ----------
function renderEmojiPanel(tab){
  var currentTab=tab;
  var content=$('emoji-content');
  content.innerHTML='';
  
  // 切换到非我的表情包时退出批量模式
  if(tab!=='mine'&&emojiBatchMode){
    emojiBatchMode=false;
    emojiSelectedStickers=[];
  }
  
  document.querySelectorAll('.emoji-tab').forEach(function(t){
    t.classList.toggle('sel',t.dataset.tab===tab);
  });
  
  showOv('ov-emoji');
  
  var cardType='public';
  if(tab==='mine'){cardType='personal';}
  else if(tab==='private'){cardType='private';}
  
  var stickers=[];
  if(tab==='mine'){
    stickers=globalCards.filter(function(c){return c.type==='personal'&&c.category==='stickers'});
  }else if(tab==='public'){
    stickers=globalCards.filter(function(c){return c.type==='public'&&c.category==='stickers'});
  }else if(tab==='private'){
    stickers = globalCards.filter(function(c) {
      return c.type === 'private' && c.category === 'stickers' && c.contactId === cid;
    });
  }

  // 底部按钮 - 仅在批量模式下显示
  var bottomBtns=$('emoji-bottom-btns');
  if(bottomBtns){
    if(tab==='mine'&&emojiBatchMode){
      bottomBtns.style.display='flex';
      bottomBtns.style.gap='6px';
      bottomBtns.style.padding='8px 12px';
      bottomBtns.innerHTML='';
      
      // 已选计数
      var countLabel=document.createElement('span');
      countLabel.style.cssText='font-size:12px;color:var(--txt3);align-self:center;margin-right:auto;';
      countLabel.textContent='已选 '+emojiSelectedStickers.length+' 个';
      bottomBtns.appendChild(countLabel);
      
      // 全选/取消全选
      var selAllBtn=document.createElement('button');
      selAllBtn.textContent=emojiSelectedStickers.length===stickers.length?'取消全选':'全选';
      selAllBtn.style.cssText='padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:var(--c1);color:var(--txt);font-size:12px;cursor:pointer;';
      selAllBtn.addEventListener('click',function(e){
        e.stopPropagation();
        if(emojiSelectedStickers.length===stickers.length){
          emojiSelectedStickers=[];
        }else{
          emojiSelectedStickers=stickers.map(function(s){return s.id});
        }
        renderEmojiPanel('mine');
      });
      bottomBtns.appendChild(selAllBtn);
      
      // 删除选中
      var delBtn=document.createElement('button');
      delBtn.innerHTML='🗑 删除';
      delBtn.style.cssText='padding:6px 14px;border:none;border-radius:6px;background:#ff4d4f;color:#fff;font-size:12px;cursor:pointer;';
      delBtn.addEventListener('click',function(e){
        e.stopPropagation();
        if(emojiSelectedStickers.length===0){alert('请先选择表情');return;}
        if(!confirm('确定删除选中的 '+emojiSelectedStickers.length+' 个表情？'))return;
        globalCards=globalCards.filter(function(c){return emojiSelectedStickers.indexOf(c.id)<0});
        saveGlobalCardsDebounced();
        emojiSelectedStickers=[];
        emojiBatchMode=false;
        renderEmojiPanel('mine');
      });
      bottomBtns.appendChild(delBtn);
    }else{
      bottomBtns.style.display='none';
    }
  }

  var groupedStickers={};
  
  var defaultGroupId='default_stickers'+(tab==='private'?'_'+cid:'');
  var hasStickersDefaultGroup=cardGroups.some(function(g){return g.id===defaultGroupId});
  if(!hasStickersDefaultGroup){
    var existingDefault=cardGroups.find(function(g){
      return g.name==='默认分组'&&g.category==='stickers'&&g.type===cardType&&(!g.contactId||g.contactId===cid);
    });
    if(existingDefault){
      existingDefault.id=defaultGroupId;
      existingDefault.contactId=tab==='private'?cid:null;
      saveCardGroups();
    }else{
      cardGroups.push({id:defaultGroupId,name:'默认分组',category:'stickers',type:cardType,contactId:tab==='private'?cid:null});
      saveCardGroups();
    }
  }
  
  var stickerGroups=cardGroups.filter(function(g){
    return g.category==='stickers'&&g.type===cardType&&(!g.contactId||g.contactId===cid);
  });
  
  stickerGroups.forEach(function(g){
    if(!groupedStickers[g.name])groupedStickers[g.name]=[];
  });
  
  stickers.forEach(function(sticker){
    var groupName='默认分组';
    if(sticker.groupId){
      var group=cardGroups.find(function(g){return g.id===sticker.groupId&&(!g.type||g.type===cardType)});
      groupName=group?group.name:'未命名分组';
    }
    if(!groupedStickers[groupName])groupedStickers[groupName]=[];
    groupedStickers[groupName].push(sticker);
  });
  
  var groupNames=stickerGroups.map(function(g){return g.name});
  
  content.innerHTML='';
  
  // 我的表情包工具栏（组合分组标签 + 操作按钮为一行）
  if(tab==='mine'){
    var toolBar=document.createElement('div');
    toolBar.style.cssText='display:flex;align-items:center;gap:4px;padding:6px 8px;border-bottom:1px solid var(--border);background:var(--c2);';
    
    // 左侧：分组标签
    var groupTabsMini=document.createElement('div');
    groupTabsMini.style.cssText='display:flex;align-items:center;gap:2px;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none;';
    groupTabsMini.addEventListener('wheel',function(e){e.stopPropagation()});
    
    var hasGroups=groupNames.length>0;
    if(hasGroups){
      var firstGroup=groupNames[0];
      var selectedGroup=firstGroup;
      if(lastEmojiGroup&&groupedStickers[lastEmojiGroup]){
        selectedGroup=lastEmojiGroup;
      }
      
      groupNames.forEach(function(gn){
        var tab=document.createElement('div');
        var isSel=gn===selectedGroup;
        tab.style.cssText='padding:4px 8px;border-radius:6px;font-size:11px;white-space:nowrap;cursor:pointer;flex-shrink:0;' +
          (isSel?'background:var(--accent);color:#fff;':'background:var(--c1);color:var(--txt2);');
        tab.textContent=gn+' ('+groupedStickers[gn].length+')';
        tab.addEventListener('click',function(e){
          e.stopPropagation();
          lastEmojiGroup=gn;
          stickers=groupedStickers[gn];
          renderEmojiPanel('mine');
        });
        groupTabsMini.appendChild(tab);
      });
      stickers=groupedStickers[selectedGroup];
    }else{
      var noGroup=document.createElement('span');
      noGroup.style.cssText='font-size:11px;color:var(--txt3);';
      noGroup.textContent='全部表情';
      groupTabsMini.appendChild(noGroup);
    }
    toolBar.appendChild(groupTabsMini);
    
    // 上传按钮（主要操作）
    var uploadBtn=document.createElement('button');
    uploadBtn.innerHTML='📷';
    uploadBtn.title='上传表情';
    uploadBtn.style.cssText='width:26px;height:26px;padding:0;border:none;border-radius:6px;background:var(--accent);color:#fff;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
    uploadBtn.addEventListener('click',function(e){
      e.stopPropagation();
      uploadStickersToMine();
    });
    toolBar.appendChild(uploadBtn);
    
    // 新建分组
    var newGroupBtn=document.createElement('button');
    newGroupBtn.innerHTML='➕';
    newGroupBtn.title='新建分组';
    newGroupBtn.style.cssText='width:26px;height:26px;padding:0;border:1px solid var(--border);border-radius:6px;background:var(--c1);color:var(--txt2);font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
    newGroupBtn.addEventListener('click',function(e){
      e.stopPropagation();
      var gName=prompt('请输入分组名称：');
      if(!gName||!gName.trim())return;
      cardGroups.push({id:'mine_grp_'+Date.now(),name:gName.trim(),category:'stickers',type:'personal'});
      saveCardGroups();
      renderEmojiPanel('mine');
    });
    toolBar.appendChild(newGroupBtn);
    
    // 管理分组
    var manageBtn=document.createElement('button');
    manageBtn.innerHTML='📁';
    manageBtn.title='管理分组';
    manageBtn.style.cssText='width:26px;height:26px;padding:0;border:1px solid var(--border);border-radius:6px;background:var(--c1);color:var(--txt2);font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
    manageBtn.addEventListener('click',function(e){
      e.stopPropagation();
      showGroupManageDialog();
    });
    toolBar.appendChild(manageBtn);
    
    // 批量管理
    var batchBtn=document.createElement('button');
    batchBtn.innerHTML=emojiBatchMode?'✕':'📋';
    batchBtn.title=emojiBatchMode?'退出批量':'批量管理';
    var batchColor=emojiBatchMode?'#ff4d4f':'var(--border)';
    var batchBg=emojiBatchMode?'#ff4d4f':'var(--c1)';
    var batchText=emojiBatchMode?'#fff':'var(--txt2)';
    batchBtn.style.cssText='width:26px;height:26px;padding:0;border:1px solid '+batchColor+';border-radius:6px;background:'+batchBg+';color:'+batchText+';font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
    batchBtn.addEventListener('click',function(e){
      e.stopPropagation();
      emojiBatchMode=!emojiBatchMode;
      if(!emojiBatchMode)emojiSelectedStickers=[];
      renderEmojiPanel('mine');
    });
    toolBar.appendChild(batchBtn);
    
    content.appendChild(toolBar);
  }
  
  if(tab==='mine'&&stickers.length===0){
    var emptyDiv=document.createElement('div');
    emptyDiv.style.cssText='width:100%;text-align:center;padding:40px 20px;color:var(--txt3);';
    emptyDiv.innerHTML='<div style="font-size:48px;margin-bottom:12px;">📷</div>'+
      '<div style="font-size:15px;color:var(--txt);font-weight:500;margin-bottom:6px;">还没有自己的表情</div>'+
      '<div style="font-size:12px;color:var(--txt3);margin-bottom:20px;line-height:1.6;">点击上方「上传表情」选择图片<br>或点击「新建分组」开始整理</div>'+
      '<button onclick="uploadStickersToMine()" style="padding:10px 24px;background:var(--accent);color:#fff;border:none;border-radius:20px;font-size:14px;cursor:pointer;font-weight:500;">立即上传</button>';
    content.appendChild(emptyDiv);
  }
  
  var groupTabsContainer=$('emoji-group-tabs');
  groupTabsContainer.innerHTML='';
  
  if(tab==='mine'){
    // 我的表情包：分组标签已整合到工具栏，隐藏独立的分组标签栏
    groupTabsContainer.style.display='none';
  }else{
    groupTabsContainer.style.display='flex';
    groupNames.forEach(function(groupName){
      var tabEl=document.createElement('div');
      tabEl.className='emoji-group-tab';
      tabEl.style.position='relative';
      tabEl.style.display='flex';
      tabEl.style.alignItems='center';
      tabEl.style.gap='4px';
      var labelSpan=document.createElement('span');
      labelSpan.textContent=groupName+' ('+groupedStickers[groupName].length+')';
      tabEl.appendChild(labelSpan);
      tabEl.addEventListener('click',function(e){
        document.querySelectorAll('#emoji-group-tabs .emoji-group-tab').forEach(function(t){t.classList.remove('sel')});
        tabEl.classList.add('sel');
        lastEmojiGroup=groupName;
        renderEmojiGroupContent(groupedStickers[groupName],content);
      });
      groupTabsContainer.appendChild(tabEl);
    });
    
    if(groupNames.length>0){
      var selectedGroupName=groupNames[0];
      if(lastEmojiGroup&&groupedStickers[lastEmojiGroup]){
        selectedGroupName=lastEmojiGroup;
      }
      var tabs=groupTabsContainer.querySelectorAll('.emoji-group-tab');
      tabs.forEach(function(t,i){
        if(groupNames[i]===selectedGroupName){
          t.classList.add('sel');
        }
      });
      stickers=groupedStickers[selectedGroupName];
    }
  }
  
  var itemsDiv=document.createElement('div');
  itemsDiv.className='emoji-items-container';
  itemsDiv.style.display='flex';
  itemsDiv.style.flexWrap='wrap';
  itemsDiv.style.gap='6px';
  itemsDiv.style.padding='8px 12px';
  itemsDiv.style.flex=1;
  itemsDiv.style.overflowY='auto';
  
  var isBatchMode=tab==='mine'&&emojiBatchMode;
  
  stickers.forEach(function(sticker){
    var el=document.createElement('div');
    el.className='emoji-item';
    el.style.position='relative';
    el.style.background='transparent';
    el.style.border='none';
    el.style.width='52px';
    el.style.height='52px';
    el.style.borderRadius='8px';
    if(sticker.content){
      el.innerHTML='<img src="'+sticker.content.replace(/"/g,'&quot;')+'" style="width:100%;height:100%;object-fit:contain;border-radius:6px;image-rendering:auto;-webkit-transform:translateZ(0);transform:translateZ(0);">';
    }
    if(isBatchMode){
      // 批量模式：显示复选框
      var isSelected=emojiSelectedStickers.indexOf(sticker.id)>=0;
      var cb=document.createElement('input');
      cb.type='checkbox';
      cb.checked=isSelected;
      cb.style.cssText='position:absolute;top:2px;left:2px;z-index:2;width:16px;height:16px;cursor:pointer;margin:0;';
      cb.addEventListener('click',function(e){
        e.stopPropagation();
        var idx=emojiSelectedStickers.indexOf(sticker.id);
        if(idx>=0){
          emojiSelectedStickers.splice(idx,1);
        }else{
          emojiSelectedStickers.push(sticker.id);
        }
        renderEmojiPanel(currentTab);
      });
      el.appendChild(cb);
      if(isSelected)el.style.outline='2px solid var(--accent)';
    }
    el.addEventListener('click',function(e){
      e.stopPropagation();
      if(el._stickerSent){el._stickerSent=false;return;}
      if(isBatchMode){
        var idx=emojiSelectedStickers.indexOf(sticker.id);
        if(idx>=0){
          emojiSelectedStickers.splice(idx,1);
        }else{
          emojiSelectedStickers.push(sticker.id);
        }
        renderEmojiPanel(currentTab);
        return;
      }
      sendSticker(sticker);
    });
    el.addEventListener('touchend',function(e){
      e.preventDefault();
      e.stopPropagation();
      el._stickerSent=true;
      if(isBatchMode){
        var idx=emojiSelectedStickers.indexOf(sticker.id);
        if(idx>=0){
          emojiSelectedStickers.splice(idx,1);
        }else{
          emojiSelectedStickers.push(sticker.id);
        }
        renderEmojiPanel(currentTab);
        return;
      }
      if(typeof stickerDelBtn!=='undefined'&&e.target===stickerDelBtn)return;
      sendSticker(sticker);
    });
    itemsDiv.appendChild(el);
  });
  content.appendChild(itemsDiv);
  
  // 批量模式操作栏
  if(isBatchMode){
    var batchBar=document.createElement('div');
    batchBar.className='emoji-batch-bar';
    batchBar.style.cssText='display:flex;align-items:center;gap:8px;padding:8px 12px;border-top:1px solid var(--border);flex-shrink:0;';
    
    var selCount=document.createElement('span');
    selCount.style.cssText='font-size:12px;color:var(--txt3);white-space:nowrap;';
    selCount.textContent='已选 '+emojiSelectedStickers.length+' 张';
    batchBar.appendChild(selCount);
    
    var batchDelBtn=document.createElement('button');
    batchDelBtn.textContent='🗑 删除选中';
    batchDelBtn.style.cssText='flex:1;padding:8px;border:1px solid #ff4d4f;border-radius:8px;background:var(--c1);color:#ff4d4f;font-size:13px;cursor:pointer;';
    batchDelBtn.addEventListener('click',function(e){
      e.stopPropagation();
      if(emojiSelectedStickers.length===0){toast('请先选择要删除的表情');return}
      if(!confirm('确定删除选中的 '+emojiSelectedStickers.length+' 张表情吗？'))return;
      globalCards=globalCards.filter(function(c){return emojiSelectedStickers.indexOf(c.id)<0});
      saveGlobalCardsDebounced();
      emojiSelectedStickers=[];
      renderEmojiPanel('mine');
    });
    batchBar.appendChild(batchDelBtn);
    
    var batchMoveBtn=document.createElement('button');
    batchMoveBtn.textContent='📂 移动选中';
    batchMoveBtn.style.cssText='flex:1;padding:8px;border:1px solid #ff9800;border-radius:8px;background:var(--c1);color:#ff9800;font-size:13px;cursor:pointer;';
    batchMoveBtn.addEventListener('click',function(e){
      e.stopPropagation();
      if(emojiSelectedStickers.length===0){toast('请先选择要移动的表情');return}
      showMoveStickerDialog();
    });
    batchBar.appendChild(batchMoveBtn);
    
    var batchCancelBtn=document.createElement('button');
    batchCancelBtn.textContent='✕ 退出';
    batchCancelBtn.style.cssText='padding:8px 12px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt3);font-size:13px;cursor:pointer;';
    batchCancelBtn.addEventListener('click',function(e){
      e.stopPropagation();
      emojiBatchMode=false;
      emojiSelectedStickers=[];
      renderEmojiPanel('mine');
    });
    batchBar.appendChild(batchCancelBtn);
    
    content.appendChild(batchBar);
  }
}

function renderEmojiGroupContent(stickers,container){
  var existingItems=container.querySelector('.emoji-items-container');
  if(existingItems)existingItems.remove();
  var existingBatchBar=container.querySelector('.emoji-batch-bar');
  if(existingBatchBar)existingBatchBar.remove();
  
  var itemsDiv=document.createElement('div');
  itemsDiv.className='emoji-items-container';
  itemsDiv.style.display='flex';
  itemsDiv.style.flexWrap='wrap';
  itemsDiv.style.gap='6px';
  itemsDiv.style.padding='8px 12px';
  itemsDiv.style.flex=1;
  itemsDiv.style.overflowY='auto';
  
  var isBatchMode=emojiBatchMode;
  
  stickers.forEach(function(sticker){
    var el=document.createElement('div');
    el.className='emoji-item';
    el.style.position='relative';
    el.style.background='transparent';
    el.style.border='none';
    el.style.width='52px';
    el.style.height='52px';
    el.style.borderRadius='8px';
    if(sticker.category==='stickers'&&sticker.content){
      var img=document.createElement('img');
      img.style.width='100%';
      img.style.height='100%';
      img.style.objectFit='contain';
      img.style.borderRadius='6px';
      img.style.imageRendering='auto';
      img.style.webkitTransform='translateZ(0)';
      img.style.transform='translateZ(0)';
      if(sticker.content.startsWith('data:image/')){
        img.src=sticker.content;
      }else if(sticker.content.startsWith('ml2_card_img_')){
        var cachedImg=memoryCache['_img_'+sticker.content];
        if(cachedImg){
          img.src=cachedImg;
        }else{
          img.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
          if(window.localforage){
            window.localforage.getItem(sticker.content).then(function(imgData){
              if(imgData){
                memoryCache['_img_'+sticker.content]=imgData;
                img.src=imgData;
              }
            }).catch(function(){});
          }
        }
      }else{
        img.src=sticker.content;
      }
      el.appendChild(img);
    }else{
      el.textContent=sticker.content;
    }
    if(isBatchMode){
      var isSelected=emojiSelectedStickers.indexOf(sticker.id)>=0;
      var cb=document.createElement('input');
      cb.type='checkbox';
      cb.checked=isSelected;
      cb.style.cssText='position:absolute;top:2px;left:2px;z-index:2;width:16px;height:16px;cursor:pointer;margin:0;';
      cb.addEventListener('click',function(e){
        e.stopPropagation();
        var idx=emojiSelectedStickers.indexOf(sticker.id);
        if(idx>=0){
          emojiSelectedStickers.splice(idx,1);
        }else{
          emojiSelectedStickers.push(sticker.id);
        }
        renderEmojiGroupContent(stickers,container);
      });
      el.appendChild(cb);
      if(isSelected)el.style.outline='2px solid var(--accent)';
    }else if(sticker.type==='personal'){
      var stickerDelBtn=document.createElement('span');
      stickerDelBtn.textContent='✕';
      stickerDelBtn.title='删除贴纸';
      stickerDelBtn.style.cssText='position:absolute;top:0;right:0;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;background:rgba(0,0,0,0.35);border-radius:0 6px 0 4px;opacity:0;cursor:pointer;line-height:1;transition:opacity 0.2s;z-index:1;';
      stickerDelBtn.addEventListener('click',function(e){
        e.stopPropagation();
        globalCards=globalCards.filter(function(c){return c.id!==sticker.id});
        saveGlobalCardsDebounced();
        renderEmojiPanel('mine');
      });
      el.appendChild(stickerDelBtn);
      el.onmouseenter=function(){stickerDelBtn.style.opacity='1'};
      el.onmouseleave=function(){stickerDelBtn.style.opacity='0'};
    }
    el.addEventListener('click',function(e){
      if(isBatchMode){
        var idx=emojiSelectedStickers.indexOf(sticker.id);
        if(idx>=0){
          emojiSelectedStickers.splice(idx,1);
        }else{
          emojiSelectedStickers.push(sticker.id);
        }
        renderEmojiGroupContent(stickers,container);
        return;
      }
      if(typeof stickerDelBtn!=='undefined'&&e.target===stickerDelBtn)return;
      sendSticker(sticker);
    });
    itemsDiv.appendChild(el);
  });
  
  container.appendChild(itemsDiv);
  
  // 批量模式操作栏（在renderEmojiGroupContent中也添加）
  if(isBatchMode){
    var batchBar=document.createElement('div');
    batchBar.className='emoji-batch-bar';
    batchBar.style.cssText='display:flex;align-items:center;gap:8px;padding:8px 12px;border-top:1px solid var(--border);flex-shrink:0;';
    
    var selCount=document.createElement('span');
    selCount.style.cssText='font-size:12px;color:var(--txt3);white-space:nowrap;';
    selCount.textContent='已选 '+emojiSelectedStickers.length+' 张';
    batchBar.appendChild(selCount);
    
    var batchDelBtn=document.createElement('button');
    batchDelBtn.textContent='🗑 删除选中';
    batchDelBtn.style.cssText='flex:1;padding:8px;border:1px solid #ff4d4f;border-radius:8px;background:var(--c1);color:#ff4d4f;font-size:13px;cursor:pointer;';
    batchDelBtn.addEventListener('click',function(e){
      e.stopPropagation();
      if(emojiSelectedStickers.length===0){toast('请先选择要删除的表情');return}
      if(!confirm('确定删除选中的 '+emojiSelectedStickers.length+' 张表情吗？'))return;
      globalCards=globalCards.filter(function(c){return emojiSelectedStickers.indexOf(c.id)<0});
      saveGlobalCardsDebounced();
      emojiSelectedStickers=[];
      renderEmojiPanel('mine');
    });
    batchBar.appendChild(batchDelBtn);
    
    var batchMoveBtn=document.createElement('button');
    batchMoveBtn.textContent='📂 移动选中';
    batchMoveBtn.style.cssText='flex:1;padding:8px;border:1px solid #ff9800;border-radius:8px;background:var(--c1);color:#ff9800;font-size:13px;cursor:pointer;';
    batchMoveBtn.addEventListener('click',function(e){
      e.stopPropagation();
      if(emojiSelectedStickers.length===0){toast('请先选择要移动的表情');return}
      showMoveStickerDialog();
    });
    batchBar.appendChild(batchMoveBtn);
    
    var batchCancelBtn=document.createElement('button');
    batchCancelBtn.textContent='✕ 退出';
    batchCancelBtn.style.cssText='padding:8px 12px;border:1px solid var(--border);border-radius:8px;background:var(--c1);color:var(--txt3);font-size:13px;cursor:pointer;';
    batchCancelBtn.addEventListener('click',function(e){
      e.stopPropagation();
      emojiBatchMode=false;
      emojiSelectedStickers=[];
      renderEmojiPanel('mine');
    });
    batchBar.appendChild(batchCancelBtn);
    
    container.appendChild(batchBar);
  }
}

// 管理分组对话框（隐藏式删除分组）
function showGroupManageDialog(){
  var personalGroups=cardGroups.filter(function(g){
    return g.category==='stickers'&&g.type==='personal'&&(!g.contactId||g.contactId===cid);
  });
  
  var html='<div style="max-height:60vh;overflow-y:auto;">';
  if(personalGroups.length===0){
    html+='<div style="padding:20px;text-align:center;color:var(--txt4);font-size:13px;">暂无分组</div>';
  }else{
    personalGroups.forEach(function(g){
      var count=globalCards.filter(function(c){return c.groupId===g.id&&c.category==='stickers'}).length;
      html+='<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid var(--border);">'+
        '<span style="font-size:14px;color:var(--txt);">'+g.name+' <span style="font-size:12px;color:var(--txt4);">('+count+'张)</span></span>'+
        '<div style="display:flex;gap:6px;align-items:center;">'+
          '<button class="modal-btn-icon" onclick="renamePersonalGroup(\''+g.id+'\')" title="重命名">✏️</button>';
      if(g.name!=='默认分组'){
        html+='<button class="modal-btn-icon" onclick="deletePersonalGroup(\''+g.id+'\')" title="删除分组" style="color:var(--danger);font-size:10px;opacity:0.3;">✕</button>';
      }
      html+='</div></div>';
    });
  }
  html+='</div>';
  
  showModal('分组管理',html);
}

// 删除个人分组（隐藏功能，通过管理对话框操作）
function deletePersonalGroup(gid){
  if(!confirm('确定删除该分组及其所有贴纸吗？'))return;
  globalCards=globalCards.filter(function(c){return c.groupId!==gid||c.category!=='stickers'});
  cardGroups=cardGroups.filter(function(g){return g.id!==gid});
  saveGlobalCardsDebounced();
  saveCardGroups();
  if(lastEmojiGroup){
    var deletedGroup=cardGroups.find(function(g){return g.id===gid});
    if(!deletedGroup||lastEmojiGroup===deletedGroup.name)lastEmojiGroup='';
  }
  hideOv('ov-modal');
  renderEmojiPanel('mine');
  toast('分组已删除');
}

// 重命名个人分组
function renamePersonalGroup(gid){
  var group=cardGroups.find(function(g){return g.id===gid});
  if(!group)return;
  var name=prompt('请输入新名称：',group.name);
  if(!name||!name.trim()||name.trim()===group.name)return;
  if(name.length>20){toast('分组名称不能超过20个字符');return}
  var isSentence=/[，。！？；：、\.\?!;:]/.test(name);
  if(isSentence&&name.length>6){toast('分组名称不能是句子');return}
  group.name=name.trim();
  saveCardGroups();
  hideOv('ov-modal');
  renderEmojiPanel('mine');
  toast('分组已重命名');
}

// 移动选中贴纸到分组对话框
function showMoveStickerDialog(){
  if(emojiSelectedStickers.length===0){toast('请先选择要移动的表情');return}
  
  var personalGroups=cardGroups.filter(function(g){
    return g.category==='stickers'&&g.type==='personal'&&(!g.contactId||g.contactId===cid);
  });
  
  if(personalGroups.length===0){
    toast('没有可用的分组');
    return;
  }
  
  var html='<div style="padding:8px 0;">';
  html+='<div style="font-size:13px;color:var(--txt3);margin-bottom:12px;padding:0 12px;">已选择 '+emojiSelectedStickers.length+' 张表情，移动到：</div>';
  personalGroups.forEach(function(g){
    html+='<div style="padding:10px 16px;cursor:pointer;border-bottom:1px solid var(--border);transition:background 0.2s;" onmouseenter="this.style.background=\'var(--bg2)\'" onmouseleave="this.style.background=\'transparent\'" onclick="doMoveStickersToGroup(\''+g.id+'\')">'+
      '<span style="font-size:14px;">📂 '+g.name+'</span></div>';
  });
  html+='</div>';
  
  showModal('移动到分组',html);
}

// 执行移动贴纸到分组
function doMoveStickersToGroup(gid){
  emojiSelectedStickers.forEach(function(sid){
    var card=globalCards.find(function(c){return c.id===sid});
    if(card){
      card.groupId=gid;
    }
  });
  saveGlobalCardsDebounced();
  emojiSelectedStickers=[];
  emojiBatchMode=false;
  hideOv('ov-modal');
  renderEmojiPanel('mine');
  toast('移动完成');
}

// 通用模态对话框
function showModal(title,bodyHtml){
  var existing=$('ov-modal');
  if(existing){
    hideOv('ov-modal');
    existing.remove();
  }
  
  var modal=document.createElement('div');
  modal.className='overlay';
  modal.id='ov-modal';
  modal.style.zIndex='10001';
  modal.innerHTML='<div class="modal" style="max-width:400px;">'+
    '<div class="modal-head">'+
      '<div class="modal-title">'+title+'</div>'+
      '<div class="modal-actions"><button class="modal-btn-icon" onclick="hideOv(\'ov-modal\')">✕</button></div>'+
    '</div>'+
    '<div class="modal-body">'+bodyHtml+'</div></div>';
  modal.addEventListener('click',function(e){if(e.target===modal)hideOv('ov-modal')});
  document.body.appendChild(modal);
  setTimeout(function(){modal.classList.add('show')},10);
}

document.querySelectorAll('.emoji-tab').forEach(function(t){
  t.addEventListener('click',function(){renderEmojiPanel(this.dataset.tab)});
});

// 点击表情面板外部关闭
if($('ov-emoji'))$('ov-emoji').addEventListener('click',function(e){
  if(e.target===this){
    if(emojiBatchMode){
      emojiBatchMode=false;
      emojiSelectedStickers=[];
    }
    hideOv('ov-emoji');
  }
});

if($('emoji-new-group-btn')){var emojiNewGroupFn=function(e){
  e.stopPropagation();
  var name=prompt('请输入分组名称：');
  if(!name||!name.trim())return;
  if(name.length>20){toast('分组名称不能超过20个字符');return}
  var isSentence=/[，。！？；：、\.\?!;:]/.test(name);
  if(isSentence&&name.length>6){toast('分组名称不能是句子');return}
  cardGroups.push({id:'g_'+Date.now(),name:name.trim(),category:'stickers',type:'personal',contactId:null});
  saveCardGroups();
  renderEmojiPanel('mine');
  toast('分组已添加');
};$('emoji-new-group-btn').addEventListener('click',emojiNewGroupFn);$('emoji-new-group-btn').addEventListener('touchend',function(e){e.preventDefault();emojiNewGroupFn(e)});}

if($('emoji-upload-sticker-btn')){var emojiUploadFn=function(e){
  e.stopPropagation();
  uploadStickersToMine();
};$('emoji-upload-sticker-btn').addEventListener('click',emojiUploadFn);$('emoji-upload-sticker-btn').addEventListener('touchend',function(e){e.preventDefault();emojiUploadFn(e)});}

// ---------- Add Contact ----------
var addAv=null;
if($('btn-add')){var btnAddFn=function(e){e.stopPropagation();showAddMenu()};$('btn-add').addEventListener('click',btnAddFn);$('btn-add').addEventListener('touchend',function(e){e.preventDefault();btnAddFn(e)});}

function showAddMenu(){
  hideAddMenu();
  var overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;z-index:9998;background:rgba(0,0,0,0.15);';
  overlay.id='add-menu-overlay';
  
  var menu=document.createElement('div');
  menu.style.cssText='position:absolute;top:52px;right:12px;background:var(--c1);border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.15);padding:6px;min-width:160px;z-index:9999;border:1px solid var(--border);';
  
  var menuItem1=document.createElement('div');
  menuItem1.style.cssText='display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer;border-radius:8px;';
  menuItem1.innerHTML='<span style="font-size:18px">👤</span><span>添加联系人</span>';
  menuItem1.addEventListener('click',function(){hideAddMenu();addAv=null;$('add-av-up').innerHTML='✦';$('add-name-inp').value='';$('add-av-inp').value='';showOv('ov-add')});
  menuItem1.addEventListener('touchend',function(e){e.preventDefault();hideAddMenu();addAv=null;$('add-av-up').innerHTML='✦';$('add-name-inp').value='';$('add-av-inp').value='';showOv('ov-add')},{passive:false});
  
  var menuItem2=document.createElement('div');
  menuItem2.style.cssText='display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer;border-radius:8px;';
  menuItem2.innerHTML='<span style="font-size:18px">👥</span><span>创建群聊</span>';
  menuItem2.addEventListener('click',function(){hideAddMenu();showCreateGroupModal()});
  menuItem2.addEventListener('touchend',function(e){e.preventDefault();hideAddMenu();showCreateGroupModal()},{passive:false});
  
  menu.appendChild(menuItem1);
  menu.appendChild(menuItem2);
  document.body.appendChild(overlay);
  document.body.appendChild(menu);
  window.addMenuEl=menu;
  window.addMenuOverlay=overlay;
  
  // 多种事件监听确保兼容性
  overlay.addEventListener('click',hideAddMenu);
  overlay.addEventListener('touchend',function(e){e.preventDefault();e.stopPropagation();hideAddMenu();},{passive:false});
  overlay.addEventListener('touchstart',function(e){e.preventDefault();e.stopPropagation();hideAddMenu();},{passive:false});
  overlay.addEventListener('mousedown',function(e){e.preventDefault();e.stopPropagation();hideAddMenu();});
  
  // 全局点击监听
  setTimeout(function(){
    document.addEventListener('click',hideAddMenu,{once:true});
    document.addEventListener('touchstart',hideAddMenu,{once:true});
  },10);
}

function hideAddMenu(e){
  if(window.addMenuEl){
    window.addMenuEl.remove();
    window.addMenuEl=null;
  }
  if(window.addMenuOverlay){
    window.addMenuOverlay.remove();
    window.addMenuOverlay=null;
  }
}

var selectedGroupMembers=[];
function showCreateGroupModal(){
  selectedGroupMembers=[];
  $('group-name-inp').value='';
  var list=$('create-group-contacts');
  list.innerHTML='';
  contacts.forEach(function(c){
    var av=c.avatar||'✦';
    var el=document.createElement('div');
    el.style.cssText='display:flex;align-items:center;gap:10px;padding:10px;border-radius:8px;cursor:pointer';
    el.innerHTML='<div class="cav" style="width:36px;height:36px">'+(av.startsWith('data:image')?'<img src="'+av+'">':av)+'</div>'+
      '<div style="flex:1;font-size:14px">'+c.name+'</div>'+
      '<div class="tsw"><input type="checkbox" data-cid="'+c.id+'"><span class="sl"></span></div>';
    el.addEventListener('click',function(){
      var cb=this.querySelector('input[type="checkbox"]');
      cb.checked=!cb.checked;
      var cid=cb.getAttribute('data-cid');
      if(cb.checked){
        selectedGroupMembers.push(cid);
      }else{
        selectedGroupMembers=selectedGroupMembers.filter(function(id){return id!==cid});
      }
    });
    list.appendChild(el);
  });
  showOv('ov-create-group');
}

function openGroupSettings(){
  var group=groups.find(function(g){return g.id===cid});
  if(!group)return;
  
  $('group-settings-name-input').value=group.name;
  if(group.avatar&&group.avatar.startsWith('data:image')){
    $('group-settings-avatar').innerHTML='<img src="'+group.avatar+'" style="display:block;width:100%;height:100%;object-fit:cover;">';
  }else{
    $('group-settings-avatar').textContent=group.avatar||'👥';
  }
  
  var membersList=$('group-settings-members');
  membersList.innerHTML='';
  
  var myAv=me.avatar||'👤';
  var myGroupNickname=group.memberSettings&&group.memberSettings[me.id]&&group.memberSettings[me.id].nickname||'';
  var myDisplayName=myGroupNickname||'我';
  var myGroupAvatar=group.memberSettings&&group.memberSettings[me.id]&&group.memberSettings[me.id].avatar||'';
  var myDisplayAvatar=myGroupAvatar||myAv;
  
  var myEl=document.createElement('div');
  myEl.style.cssText='display:flex;align-items:center;gap:12px;padding:10px;border-radius:var(--radius-sm);background:var(--c2);margin-bottom:6px;';
  
  var myAvatarHtml='';
  if(myDisplayAvatar.startsWith('data:image')){
    myAvatarHtml='<img src="'+myDisplayAvatar+'" style="display:block;width:100%;height:100%;object-fit:cover;">';
  }else{
    myAvatarHtml=myDisplayAvatar;
  }
  
  myEl.innerHTML='<div style="width:40px;height:40px;border-radius:var(--radius-sm);background:var(--c3);display:flex;align-items:center;justify-content:center;font-size:16px;overflow:hidden;cursor:pointer;" data-edit-avatar="'+me.id+'">'+myAvatarHtml+'</div><div style="flex:1;"><div style="font-size:14px;color:var(--txt);font-weight:500;cursor:pointer;" data-edit-name="'+me.id+'">'+myDisplayName+'</div><div style="font-size:11px;color:var(--txt3);">群昵称</div></div>';
  membersList.appendChild(myEl);
  
  group.memberIds.forEach(function(memberId){
    if(memberId===me.id)return;
    
    var contact=contacts.find(function(c){return c.id===memberId});
    if(!contact)return;
    
    var av=contact.avatar||'✦';
    var name=contact.name||'未知成员';
    
    var groupNickname=group.memberSettings&&group.memberSettings[memberId]&&group.memberSettings[memberId].nickname||'';
    var displayName=groupNickname||name;
    
    var groupAvatar=group.memberSettings&&group.memberSettings[memberId]&&group.memberSettings[memberId].avatar||'';
    var displayAvatar=groupAvatar||av;
    
    var el=document.createElement('div');
    el.style.cssText='display:flex;align-items:center;gap:12px;padding:10px;border-radius:var(--radius-sm);background:var(--c2);margin-bottom:6px;';
    
    var actions='<button class="btn-secondary" data-kick="'+memberId+'" style="padding:3px 8px;border-radius:var(--radius-sm);font-size:11px;color:#ff4d4f;border-color:#ff4d4f;margin-left:auto;">踢出</button>';
    
    var avatarHtml='';
    if(displayAvatar.startsWith('data:image')){
      avatarHtml='<img src="'+displayAvatar+'" style="display:block;width:100%;height:100%;object-fit:cover;">';
    }else{
      avatarHtml=displayAvatar;
    }
    
    var subText='';
    if(groupNickname){
      subText='<div style="font-size:11px;color:var(--txt3);">群昵称：'+groupNickname+'</div><div style="font-size:11px;color:var(--txt3);">联系人昵称：'+name+'</div>';
    }else{
      subText='<div style="font-size:11px;color:var(--txt3);">联系人昵称：'+name+'</div>';
    }
    el.innerHTML='<div style="width:40px;height:40px;border-radius:var(--radius-sm);background:var(--c3);display:flex;align-items:center;justify-content:center;font-size:16px;overflow:hidden;cursor:pointer;" data-edit-avatar="'+memberId+'">'+avatarHtml+'</div><div style="flex:1;"><div style="font-size:14px;color:var(--txt);font-weight:500;cursor:pointer;" data-edit-name="'+memberId+'">'+displayName+'</div>'+subText+'</div>'+actions;
    membersList.appendChild(el);
  });
  
  showOv('ov-group-settings');
}

if($('close-group-settings'))$('close-group-settings').addEventListener('click',function(){hideOv('ov-group-settings')});
if($('group-settings-beautify'))$('group-settings-beautify').addEventListener('click',function(){
  hideOv('ov-group-settings');
  openBeautify();
});
if($('group-settings-speed'))$('group-settings-speed').addEventListener('click',function(){
  hideOv('ov-group-settings');
  openGroupSpeedSettings();
});
if($('group-settings-add-member'))$('group-settings-add-member').addEventListener('click',function(){
  hideOv('ov-group-settings');
  openAddGroupMember();
});
var pendingGroupAvatar=null;
if($('group-settings-avatar'))$('group-settings-avatar').addEventListener('click',function(){
  $('group-settings-avatar-input').click();
});
if($('group-settings-avatar-input'))$('group-settings-avatar-input').addEventListener('change',function(){
  var f=this.files[0];
  if(!f)return;
  compressImage(f,100,0.7,function(res){
    pendingGroupAvatar=res;
    $('group-settings-avatar').innerHTML='<img src="'+res+'" style="display:block;width:100%;height:100%;object-fit:cover;">';
  });
});
if($('group-settings-save'))$('group-settings-save').addEventListener('click',function(){
  var group=groups.find(function(g){return g.id===cid});
  if(!group)return;
  var newName=$('group-settings-name-input').value.trim();
  if(newName){
    group.name=newName;
  }
  if(pendingGroupAvatar){
    group.avatar=pendingGroupAvatar;
    pendingGroupAvatar=null;
  }
  ls('ml2_groups',groups);
  $('conv-title').textContent=group.name;
  toast('群聊设置已保存');
  hideOv('ov-group-settings');
});
if($('group-settings-members'))$('group-settings-members').addEventListener('click',function(e){
  e.stopPropagation();
  var target=e.target;
  
  var editNameEl=target.closest('[data-edit-name]');
  var editAvatarEl=target.closest('[data-edit-avatar]');
  var kickBtn=target.closest('[data-kick]');
  
  var editName=editNameEl?editNameEl.getAttribute('data-edit-name'):null;
  var editAvatar=editAvatarEl?editAvatarEl.getAttribute('data-edit-avatar'):null;
  var kick=kickBtn?kickBtn.getAttribute('data-kick'):null;
  
  if(editName){
    var group=groups.find(function(g){return g.id===cid});
    var currentNickname=group.memberSettings&&group.memberSettings[editName]&&group.memberSettings[editName].nickname||'';
    customPrompt('设置群昵称（留空使用原名）',currentNickname).then(function(nickname){
      if(nickname!==undefined){
        if(!group.memberSettings)group.memberSettings={};
        if(!group.memberSettings[editName])group.memberSettings[editName]={};
        group.memberSettings[editName].nickname=nickname||'';
        ls('ml2_groups',groups);
        openGroupSettings();
      }
    });
  }
  
  if(editAvatar){
    var input=document.createElement('input');
    input.type='file';
    input.accept='image/'+'*';
    input.style.display='none';
    document.body.appendChild(input);
    input.onchange=function(){
      var f=this.files[0];
      if(!f){
        document.body.removeChild(input);
        return;
      }
      compressImage(f,100,0.7,function(res){
        var group=groups.find(function(g){return g.id===cid});
        if(!group)return;
        if(!group.memberSettings)group.memberSettings={};
        if(!group.memberSettings[editAvatar])group.memberSettings[editAvatar]={};
        group.memberSettings[editAvatar].avatar=res;
        ls('ml2_groups',groups);
        openGroupSettings();
        document.body.removeChild(input);
      });
    };
    input.click();
  }
  
  if(kick){
    var group=groups.find(function(g){return g.id===cid});
    var contact=contacts.find(function(c){return c.id===kick});
    var name=contact&&contact.name||'未知成员';
    customConfirm('确定要将「'+name+'」踢出群聊吗？').then(function(ok){
      if(ok){
        group.memberIds=group.memberIds.filter(function(id){return id!==kick});
        ls('ml2_groups',groups);
        openGroupSettings();
        toast('已将「'+name+'」踢出群聊');
      }
    });
  }
});
if($('group-settings-delete'))$('group-settings-delete').addEventListener('click',function(){
  var group=groups.find(function(g){return g.id===cid});
  if(!group)return;
  customConfirm('确定要删除群聊「'+group.name+'」吗？删除后所有群聊记录将被清除。').then(function(ok){
    if(ok){
      groups=groups.filter(function(g){return g.id!==cid});
      ls('ml2_groups',groups);
      ls('ml2_messages_'+cid,null);
      hideOv('ov-group-settings');
      showPg('pg-list');
      renderChatList();
      toast('群聊已删除');
    }
  });
});

function openAddGroupMember(){
  var group=groups.find(function(g){return g.id===cid});
  if(!group)return;
  
  var list=$('add-group-member-list');
  list.innerHTML='';
  
  contacts.forEach(function(contact){
    if(group.memberIds.indexOf(contact.id)===-1){
      var av=contact.avatar||'✦';
      var name=contact.name||'未知';
      var el=document.createElement('div');
      el.style.cssText='display:flex;align-items:center;gap:10px;padding:8px;border-radius:var(--radius-sm);background:var(--c2);margin-bottom:6px;';
      el.innerHTML='<div style="width:32px;height:32px;border-radius:var(--radius-sm);background:var(--c3);display:flex;align-items:center;justify-content:center;font-size:14px;overflow:hidden;">'+(av.startsWith('data:image')?'<img src="'+av+'" style="display:block;width:100%;height:100%;object-fit:cover;">':av)+'</div><div style="flex:1;"><div style="font-size:13px;color:var(--txt);font-weight:500;">'+name+'</div></div><button class="btn-secondary" data-add="'+contact.id+'" style="padding:3px 8px;border-radius:var(--radius-sm);font-size:11px;">添加</button>';
      list.appendChild(el);
    }
  });
  
  if(list.children.length===0){
    list.innerHTML='<div style="text-align:center;padding:20px;color:var(--txt3);">没有可添加的联系人</div>';
  }
  
  showOv('ov-add-group-member');
}

if($('close-add-group-member'))$('close-add-group-member').addEventListener('click',function(){hideOv('ov-add-group-member')});
if($('add-group-member-list'))$('add-group-member-list').addEventListener('click',function(e){
  var target=e.target;
  var addId=target.getAttribute('data-add');
  if(addId){
    var group=groups.find(function(g){return g.id===cid});
    if(group&&group.memberIds.indexOf(addId)===-1){
      group.memberIds.push(addId);
      ls('ml2_groups',groups);
      hideOv('ov-add-group-member');
      openGroupSettings();
      var contact=contacts.find(function(c){return c.id===addId});
      var name=contact&&contact.name||'未知成员';
      toast('已添加「'+name+'」到群聊');
    }
  }
});

if($('close-create-group')){var closeGroupFn=function(){hideOv('ov-create-group')};$('close-create-group').addEventListener('click',closeGroupFn);$('close-create-group').addEventListener('touchend',function(e){e.preventDefault();closeGroupFn()});}
if($('btn-create-group')){var createGroupFn=function(){
  var name=$('group-name-inp').value.trim();
  if(!name){toast('请输入群聊名称');return}
  if(selectedGroupMembers.length<1){toast('请至少选择一个联系人');return}
  var group={
    id:'g_'+Date.now(),
    name:name,
    type:'group',
    memberIds:[me.id].concat(selectedGroupMembers),
    memberSettings:{}
  };
  groups.push(group);
  ls('ml2_groups',groups);
  hideOv('ov-create-group');
  renderChatList();
  toast('群聊「'+name+'」已创建');
};$('btn-create-group').addEventListener('click',createGroupFn);$('btn-create-group').addEventListener('touchend',function(e){e.preventDefault();createGroupFn()});}
if($('close-add')){var closeAddFn=function(){hideOv('ov-add')};$('close-add').addEventListener('click',closeAddFn);$('close-add').addEventListener('touchend',function(e){e.preventDefault();closeAddFn()});}
if($('add-av-up')){$('add-av-up').addEventListener('click',function(){$('add-av-inp').click()});$('add-av-up').addEventListener('touchend',function(e){e.preventDefault();$('add-av-inp').click()})}
if($('add-av-inp'))$('add-av-inp').addEventListener('change',function(){var f=this.files[0];if(!f)return;compressImage(f,100,0.7,function(res){addAv=res;$('add-av-up').innerHTML='<img src="'+res+'" style="width:100%;height:100%;object-fit:cover">'})});
if($('btn-save-ct')){$('btn-save-ct').addEventListener('click',function(){var n=$('add-name-inp').value.trim();if(!n){toast('请输入昵称');return}var avatarData=addAv||'';var newContact={id:'c_'+Date.now(),name:n,avatar:avatarData};contacts.push(newContact);saveC();var existingMember=momentsMembers.find(function(m){return m.contactId===newContact.id||m.id===newContact.id});if(!existingMember){momentsMembers.push({id:newContact.id,nickname:newContact.name,avatar:avatarData,enabled:true,sessionId:'',contactId:newContact.id})}saveMomentsData();hideOv('ov-add');renderChatList();renderDContacts();maybeGenMoments();toast('已添加「'+n+'」')});
$('btn-save-ct').addEventListener('touchend',function(e){e.preventDefault();$('btn-save-ct').click()});}

// ---------- Edit Profile ----------
var editAv=null;
if($('close-edit')){var closeEditFn=function(){hideOv('ov-edit')};$('close-edit').addEventListener('click',closeEditFn);$('close-edit').addEventListener('touchend',function(e){e.preventDefault();closeEditFn()});}
if($('edit-av-up')){$('edit-av-up').addEventListener('click',function(){$('edit-av-inp').click()});$('edit-av-up').addEventListener('touchend',function(e){e.preventDefault();$('edit-av-inp').click()})}
if($('edit-av-inp'))$('edit-av-inp').addEventListener('change',function(){var f=this.files[0];if(!f)return;compressImage(f,256,0.8,function(res){editAv=res;$('edit-av-up').innerHTML='<img src="'+res+'" style="width:100%;height:100%;object-fit:cover">'})});
if($('btn-save-edit')){$('btn-save-edit').addEventListener('click',function(){var n=$('edit-name-inp').value.trim();if(!n){toast('请输入昵称');return}me.name=n;me.avatar=editAv||me.avatar||'';saveP();hideOv('ov-edit');toast('已保存')});$('btn-save-edit').addEventListener('touchend',function(e){e.preventDefault();$('btn-save-edit').click()});}
function refreshMy(){}

// ---------- Touch Settings ----------
var currentTouchType='public';
var currentTouchGroup='all';
var currentTouchContact='';
function getTouchGroups(type){var allGroups=ls('ml2_touch_groups')||{public:['默认'],private:['默认']};if(!allGroups.public)allGroups.public=['默认'];if(!allGroups.private)allGroups.private=['默认'];if(type){var r=allGroups[type];return Array.isArray(r)?r:['默认'];}return allGroups}
function saveTouchGroups(type,groups){var allGroups=ls('ml2_touch_groups')||{public:['默认'],private:['默认']};if(!allGroups.public)allGroups.public=['默认'];if(!allGroups.private)allGroups.private=['默认'];if(type){allGroups[type]=groups}else{allGroups=groups}ls('ml2_touch_groups',allGroups)}
function getTouchCardsPublic(){return ls('ml2_touch_cards_public')||DEF_TOUCH_CARDS_PUBLIC}
function saveTouchCardsPublic(cards){ls('ml2_touch_cards_public',cards)}
function getTouchCardsPrivate(contactId){var allPrivate=ls('ml2_touch_cards_private')||{};if(Array.isArray(allPrivate)){allPrivate={};ls('ml2_touch_cards_private',allPrivate)}return contactId?allPrivate[contactId]||[]:[]}
function saveTouchCardsPrivate(cards,contactId){var allPrivate=ls('ml2_touch_cards_private')||{};allPrivate[contactId]=cards;ls('ml2_touch_cards_private',allPrivate)}
function getAllTouchCards(type,contactId){var cards=type==='public'?getTouchCardsPublic():getTouchCardsPrivate(contactId);var groupData=ls('ml2_touch_group_cards')||{};var groups=getTouchGroups(type);groups.forEach(function(g){if(g!=='默认'){var key=type+'_'+g+(contactId?'_'+contactId:'');cards=cards.concat(groupData[key]||[])}});return cards}
function getTouchCardsByGroup(type,group,contactId){if(group==='all')return getAllTouchCards(type,contactId);var allCards=type==='public'?getTouchCardsPublic():getTouchCardsPrivate(contactId);if(group==='默认')return allCards;var groupData=ls('ml2_touch_group_cards')||{};var key=type+'_'+group+(contactId?'_'+contactId:'');return groupData[key]||[]}
function saveTouchCardsByGroup(type,group,cards,contactId){if(group==='默认'){if(type==='public'){saveTouchCardsPublic(cards)}else{saveTouchCardsPrivate(cards,contactId)}}else{var groupData=ls('ml2_touch_group_cards')||{};var key=type+'_'+group+(contactId?'_'+contactId:'');groupData[key]=cards;ls('ml2_touch_group_cards',groupData)}}
function renderTouchGroups(){var groups=getTouchGroups(currentTouchType);var list=$('touch-groups-list');list.innerHTML='';var allBtn=document.createElement('button');allBtn.className='btn-outline'+(currentTouchGroup==='all'?' active':'');allBtn.style.padding='4px 12px';allBtn.style.fontSize='12px';allBtn.style.borderRadius='16px';allBtn.textContent='全部';allBtn.onclick=function(){currentTouchGroup='all';renderTouchGroups();renderTouchCards()};list.appendChild(allBtn);groups.forEach(function(g){var btn=document.createElement('button');btn.className='btn-outline'+(currentTouchGroup===g?' active':'');btn.style.padding='4px 12px';btn.style.fontSize='12px';btn.style.borderRadius='16px';btn.textContent=g;btn.onclick=function(){currentTouchGroup=g;renderTouchGroups();renderTouchCards()};list.appendChild(btn)})}
function renderTouchGroupSelect(){var groups=getTouchGroups(currentTouchType);var select=$('touch-group-select');if(!select)return;var currentVal=select.value;select.innerHTML='<option value="all">全部分组</option>';groups.forEach(function(g){var opt=document.createElement('option');opt.value=g;opt.textContent=g;select.appendChild(opt)});select.value=currentVal}
function renderTouchContactSelect(){var container=$('touch-contact-tags');container.innerHTML='';contacts.forEach(function(c){var tag=document.createElement('button');tag.className='btn-sm'+(currentTouchContact===c.id?' active':'');tag.style.padding='6px 14px';tag.style.fontSize='13px';tag.style.borderRadius='20px';tag.style.border='1px solid var(--border)';tag.style.background=currentTouchContact===c.id?'var(--accent)':'var(--c2)';tag.style.color=currentTouchContact===c.id?'#fff':'var(--txt)';tag.textContent=c.name||'联系人';tag.onclick=function(){currentTouchContact=c.id;currentTouchGroup='all';renderTouchContactSelect();renderTouchGroupSelect();renderTouchCards()};container.appendChild(tag)})}
function renderTouchCards(){var cards=getTouchCardsByGroup(currentTouchType,currentTouchGroup,currentTouchContact);var list=$('touch-cards-list');if(!list)return;list.innerHTML='';var tc=$('touch-total-count');if(tc)tc.textContent='共 '+cards.length+' 张';if(cards.length===0){list.innerHTML='<div style="text-align:center;color:var(--txt3);padding:40px 20px;font-size:13px">暂无字卡</div>';return}cards.forEach(function(card,idx){if(typeof card!=='string'){card=String(card||'')}var el=document.createElement('div');el.style.display='flex';el.style.alignItems='center';el.style.gap='8px';el.style.padding='10px 12px';el.style.background='var(--c2)';el.style.borderRadius='10px';el.style.marginBottom='6px';el.innerHTML='<span style="color:var(--txt3);font-size:12px;flex-shrink:0;width:20px;text-align:center">'+(idx+1)+'</span><span style="flex:1;color:var(--txt);font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+card.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</span><button style="padding:2px 8px;font-size:11px;flex-shrink:0;border:none;background:rgba(255,107,107,.1);color:#ff6b6b;border-radius:4px;cursor:pointer;transition:all .2s" onclick="removeTouchCard('+idx+')">×</button>';list.appendChild(el)})}
function removeTouchCard(idx){var cards=getTouchCardsByGroup(currentTouchType,currentTouchGroup,currentTouchContact);cards.splice(idx,1);saveTouchCardsByGroup(currentTouchType,currentTouchGroup,cards,currentTouchContact);renderTouchCards();toast('已删除')}
function openTouchSettings(){currentTouchType='public';currentTouchGroup='all';renderTouchGroupSelect();renderTouchCards();showPg('pg-touch')}
function showTouchPage(contactId){
  currentTouchType='public';
  currentTouchGroup='all';
  currentTouchContactId=contactId;
  showPg('pg-touch');
  renderTouchGroupSelect();
  renderTouchCards();
}
function switchTouchType(type){currentTouchType=type;currentTouchGroup='all';currentTouchContact='';document.querySelectorAll('.card-type-tab').forEach(function(t){t.classList.toggle('sel',t.dataset.type===type)});renderTouchGroupSelect();renderTouchCards();if(type==='private'){renderTouchContactSelect();$('touch-contact-select-wrap').style.display='block'}else{$('touch-contact-select-wrap').style.display='none'}}
$('close-touch')&&$('close-touch').addEventListener('click',function(){showPg('pg-my')});
document.querySelectorAll('.card-type-tab[data-type="public"],.card-type-tab[data-type="private"]').forEach(function(t){t.addEventListener('click',function(){switchTouchType(this.dataset.type)})});
$('touch-group-select')&&$('touch-group-select').addEventListener('change',function(){currentTouchGroup=this.value;renderTouchCards()});
$('touch-add-group-btn')&&$('touch-add-group-btn').addEventListener('click',function(){var val=prompt('请输入分组名称：');if(!val)return;val=val.trim();if(!val){toast('请输入分组名称');return}var groups=getTouchGroups(currentTouchType);if(groups.indexOf(val)>=0){toast('分组已存在');return}groups.push(val);saveTouchGroups(currentTouchType,groups);renderTouchGroupSelect();toast('已添加分组')});
$('touch-edit-group-btn')&&$('touch-edit-group-btn').addEventListener('click',function(){var oldName=$('touch-group-select').value;if(oldName==='all'||oldName==='默认'){toast('该分组不能编辑');return}var newName=prompt('请输入新的分组名称：',oldName);if(!newName)return;newName=newName.trim();if(!newName){toast('请输入分组名称');return}var groups=getTouchGroups(currentTouchType);if(groups.indexOf(newName)>=0&&newName!==oldName){toast('分组已存在');return}var idx=groups.indexOf(oldName);if(idx>=0){groups[idx]=newName;saveTouchGroups(currentTouchType,groups);var groupData=ls('ml2_touch_group_cards')||{};var oldKey=currentTouchType+'_'+oldName;var newKey=currentTouchType+'_'+newName;if(groupData[oldKey]){groupData[newKey]=groupData[oldKey];delete groupData[oldKey];ls('ml2_touch_group_cards',groupData)}currentTouchGroup=newName;renderTouchGroupSelect();renderTouchCards();toast('已修改分组名称')}});
$('touch-del-group-btn')&&$('touch-del-group-btn').addEventListener('click',function(){var groupName=$('touch-group-select').value;if(groupName==='all'||groupName==='默认'){toast('该分组不能删除');return}if(!confirm('确定要删除分组「'+groupName+'」及其所有字卡吗？'))return;var groups=getTouchGroups(currentTouchType);groups=groups.filter(function(g){return g!==groupName});saveTouchGroups(currentTouchType,groups);var groupData=ls('ml2_touch_group_cards')||{};delete groupData[currentTouchType+'_'+groupName];ls('ml2_touch_group_cards',groupData);currentTouchGroup='all';renderTouchGroupSelect();renderTouchCards();toast('已删除分组')});
$('touch-batch-add-btn')&&$('touch-batch-add-btn').addEventListener('click',function(){var val=$('touch-batch-input').value.trim();if(!val){toast('请输入内容');return}var lines=val.split('\n').map(function(l){return l.trim()}).filter(function(l){return l});if(lines.length===0){toast('请输入内容');return}if(currentTouchType==='private'&&!currentTouchContact){toast('请先选择联系人');return}var cards=getTouchCardsByGroup(currentTouchType,currentTouchGroup,currentTouchContact);cards.push.apply(cards,lines);saveTouchCardsByGroup(currentTouchType,currentTouchGroup,cards,currentTouchContact);$('touch-batch-input').value='';renderTouchCards();toast('已导入 '+lines.length+' 条')});
$('touch-clear-btn')&&$('touch-clear-btn').addEventListener('click',function(){if(currentTouchType==='private'&&!currentTouchContact){toast('请先选择联系人');return}if(confirm('确定要清空当前字卡吗？')){saveTouchCardsByGroup(currentTouchType,currentTouchGroup,[],currentTouchContact);renderTouchCards();toast('已清空')}});
function resetTouchSettings(){ls('ml2_touch_cards_public',[]);ls('ml2_touch_cards_private',{});ls('ml2_touch_groups',{public:['默认'],private:['默认']});ls('ml2_touch_group_cards',{});toast('已重置')}
function importTouchCards(text){
  var lines=text.split('\n').map(function(l){return l.trim()}).filter(function(l){return l});
  if(lines.length===0){toast('请输入内容');return}
  
  if(currentCardType==='private'&&!selectedPrivateContact){toast('请先选择联系人');return}
  
  // 使用当前选中的分组作为默认分组
  var defaultGroup='默认';
  if(currentCardGroup&&currentCardGroup!=='all'&&currentCardGroup.indexOf('default_touch')===0){
    var dgParts=currentCardGroup.split('_');
    defaultGroup=dgParts[dgParts.length-1]||'默认';
  }else if(currentTouchGroup&&currentTouchGroup!=='all'){
    defaultGroup=currentTouchGroup;
  }
  var currentGroup=defaultGroup;
  var cardGroups={};
  
  lines.forEach(function(line){
    if(line.startsWith('【')&&line.endsWith('】')){
      currentGroup=line.substring(1,line.length-1);
      var groups=getTouchGroups(currentCardType);
      if(groups.indexOf(currentGroup)<0){
        groups.push(currentGroup);
        saveTouchGroups(currentCardType,groups);
      }
    }else{
      if(!cardGroups[currentGroup])cardGroups[currentGroup]=[];
      cardGroups[currentGroup].push(line);
    }
  });
  
  var totalAdded=0;
  for(var group in cardGroups){
    if(!cardGroups.hasOwnProperty(group))continue;
    var existingCards=getTouchCardsByGroup(currentCardType,group,selectedPrivateContact);
    var newCards=cardGroups[group];
    existingCards=existingCards.concat(newCards);
    saveTouchCardsByGroup(currentCardType,group,existingCards,selectedPrivateContact);
    totalAdded+=newCards.length;
  }
  
  if(totalAdded===0){toast('未检测到有效字卡内容');return}
  
  $('batch-touch-inp').value='';
  renderCardGroups();
  if(typeof _doRenderCardList==='function')_doRenderCardList();
  toast('已导入 '+totalAdded+' 条');
}
function deduplicateTouchCards(){
  var cards=getTouchCardsByGroup(currentCardType,currentTouchGroup,selectedPrivateContact);
  var unique=[];
  var seen={};
  cards.forEach(function(card){
    if(!seen[card]){
      seen[card]=true;
      unique.push(card);
    }
  });
  saveTouchCardsByGroup(currentCardType,currentTouchGroup,unique,selectedPrivateContact);
  renderCardGroups();
  if(typeof _doRenderCardList==='function')_doRenderCardList();
  toast('已移除重复，保留 '+unique.length+' 条');
}
function clearAllTouchCards(){
  var allGroups=getTouchGroups(currentCardType);
  allGroups.forEach(function(group){
    saveTouchCardsByGroup(currentCardType,group,[],selectedPrivateContact);
  });
  renderCardGroups();
  if(typeof _doRenderCardList==='function')_doRenderCardList();
  toast('已清空所有拍一拍字卡');
}

function showContactTouchMenu(contactId,avatarEl){renderTouchMenu(contactId)}
function showChatTouchMenu(contactId){renderTouchMenu(contactId)}
function readNavTouchCards(key){
  var result=[];
  try{
    var raw=safeGetItem(key);
    if(!raw){raw=ls(key);}
    if(raw){
      var arr=typeof raw==='string'?JSON.parse(raw):raw;
      if(Array.isArray(arr)){
        arr.forEach(function(c){
          if(c&&c.category==='touch'&&c.content){
            result.push({content:c.content,group:c.group||'默认',type:key.indexOf('public')>=0?'public':'private'});
          }
        });
      }
    }
  }catch(e){}
  try{
    var lfRaw=safeGetItem('ml2_lf_'+key);
    if(lfRaw){
      var lfArr=typeof lfRaw==='string'?JSON.parse(lfRaw):lfRaw;
      if(Array.isArray(lfArr)){
        lfArr.forEach(function(c){
          if(c&&c.category==='touch'&&c.content){
            var group=c.group||'默认';
            var exists=result.some(function(x){return x.content===c.content&&x.group===group});
            if(!exists)result.push({content:c.content,group:group,type:key.indexOf('public')>=0?'public':'private'});
          }
        });
      }
    }
  }catch(e){}
  return result;
}
function renderTouchMenu(contactId){
  var contact=contacts.find(function(c){return c.id===contactId});
  if(!contact)return;
  $('touch-contact-name').textContent='我对 '+contact.name;
  var list=$('touch-action-list');
  list.innerHTML='';
  var tabBox=$('touch-tabs-container');
  if(tabBox)tabBox.innerHTML='';

  var currentGroup='全部';
  var defaultActions=TOUCH_ACTIONS.slice();

  // ===== Old touch system: public cards + groups =====
  var pubCardsRaw=getAllTouchCards('public');
  var pubGroupOrder=getTouchGroups('public');
  var allOldPubCards=[];
  // 展开 old 系统每张卡的 {content, group}
  pubGroupOrder.forEach(function(gr){
    getTouchCardsByGroup('public',gr).forEach(function(text){
      if(text&&typeof text==='string')allOldPubCards.push({content:text,group:gr||'默认',type:'public'});
    });
  });
  // old system 中没有分组归属的 public 卡也塞进来
  getAllTouchCards('public').forEach(function(c){
    var content=typeof c==='string'?c:(c&&c.content);
    if(!content)return;
    var has=allOldPubCards.some(function(x){return x.content===content});
    if(!has)allOldPubCards.push({content:content,group:(typeof c==='object'&&c.group)||'默认',type:'public'});
  });

  // ===== Old touch system: private cards (current chat contact owns) =====
  var oldPrivateOwnedCards=[];
  var privGroupOrder=getTouchGroups('private');
  privGroupOrder.forEach(function(gr){
    getTouchCardsByGroup('private',gr,contactId).forEach(function(text){
      if(text&&typeof text==='string')oldPrivateOwnedCards.push({content:text,group:gr||'默认',type:'private'});
    });
  });
  getTouchCardsPrivate(contactId).forEach(function(c){
    var content=typeof c==='string'?c:(c&&c.content);
    if(!content)return;
    var has=oldPrivateOwnedCards.some(function(x){return x.content===content});
    if(!has)oldPrivateOwnedCards.push({content:content,group:(typeof c==='object'&&c.group)||'默认',type:'private'});
  });

  // ===== Nav system public touch cards =====
  var navPubCards=readNavTouchCards('ml2_nav_cards_public');
  navPubCards.forEach(function(c){
    var has=allOldPubCards.some(function(x){return x.content===c.content&&x.group===c.group});
    if(!has)allOldPubCards.push(c);
  });

  // ===== Nav system private cards (only cardPrivateContacts bound to contactId) =====
  var boundPrivateCards=[];
  (cardPrivateContacts||[]).forEach(function(pc){
    var isBound=pc.bindContactId===contactId;
    if(!isBound)return;
    // pc.id 是字卡联系人ID，nav 私钥是 ml2_nav_cards_private_{pc.id}
    var key='ml2_nav_cards_private_'+pc.id;
    readNavTouchCards(key).forEach(function(c){
      var has=boundPrivateCards.some(function(x){return x.content===c.content&&x.group===c.group});
      if(!has)boundPrivateCards.push(c);
    });
    // old system 私钥: private 类型 + 分组 + contactId === pc.id
    (getTouchGroups('private')).forEach(function(gr){
      getTouchCardsByGroup('private',gr,pc.id).forEach(function(text){
        if(!text||typeof text!=='string')return;
        var has=boundPrivateCards.some(function(x){return x.content===text&&x.group===gr});
        if(!has)boundPrivateCards.push({content:text,group:gr||'默认',type:'private'});
      });
    });
    getTouchCardsPrivate(pc.id).forEach(function(c){
      var content=typeof c==='string'?c:(c&&c.content);
      if(!content)return;
      var has=boundPrivateCards.some(function(x){return x.content===content});
      if(!has)boundPrivateCards.push({content:content,group:(typeof c==='object'&&c.group)||'默认',type:'private'});
    });
  });

  // 合并所有卡
  var allPubCards=allOldPubCards.filter(function(c){return c&&c.content});
  var allPrivCards=oldPrivateOwnedCards.concat(boundPrivateCards).filter(function(c,i,self){
    return c&&c.content&&self.findIndex(function(x){return x.content===c.content&&x.group===c.group})===i;
  });
  var allCards=allPubCards.concat(allPrivCards);

  // ===== Build group list =====
  var groups=['全部'];
  // 先加 public 卡中出现过的分组（按 group 名去重）
  function addGroupUnique(g){if(g&&groups.indexOf(g)<0)groups.push(g);}
  // 从 navCardGroups.public 读取公用字卡分组
  if(navCardGroups&&navCardGroups.public)navCardGroups.public.forEach(addGroupUnique);
  allPubCards.forEach(function(c){addGroupUnique(c.group);});
  // 再加 private 卡中出现过的分组（只在有绑定/私卡时显示，但公用字卡如果重名则不重复）
  if(allPrivCards.length>0){
    if(navCardGroups&&navCardGroups.private){
      Object.keys(navCardGroups.private).forEach(function(k){
        (navCardGroups.private[k]||[]).forEach(addGroupUnique);
      });
    }
    allPrivCards.forEach(function(c){addGroupUnique(c.group);});
  }

  // ===== Render tabs (only once, to dedicated container) =====
  var tabsHtml='<div id="touch-group-tabs" style="display:flex;flex-wrap:wrap;gap:4px;">';
  groups.forEach(function(g){
    tabsHtml+='<button class="touch-group-tab'+(g===currentGroup?' sel':'')+'" data-tg="'+g+'" style="padding:4px 10px;font-size:11px;border-radius:6px;border:1px solid var(--border);background:'+(g===currentGroup?'var(--accent)':'var(--c2)')+';color:'+(g===currentGroup?'#fff':'var(--txt)')+';cursor:pointer;">'+g+'</button>';
  });
  tabsHtml+='</div>';
  if(tabBox){tabBox.innerHTML=tabsHtml;}
  else{list.insertAdjacentHTML('beforebegin',tabsHtml);}

  function renderCards(group){
    list.innerHTML='';
    var cardsToShow=[];
    if(group==='全部'||group==='默认'){
      cardsToShow=cardsToShow.concat(defaultActions);
    }
    if(group==='全部'){
      allCards.forEach(function(c){if(c.content&&cardsToShow.indexOf(c.content)<0)cardsToShow.push(c.content);});
    }else{
      allCards.forEach(function(c){
        if(c.group===group&&c.content&&cardsToShow.indexOf(c.content)<0)cardsToShow.push(c.content);
      });
    }
    if(cardsToShow.length===0){
      list.innerHTML='<div style="text-align:center;color:var(--txt3);padding:20px;font-size:13px;">暂无拍一拍字卡</div>';
      return;
    }
    cardsToShow.forEach(function(action){
      if(!action)return;
      var btn=document.createElement('button');
      btn.className='btn';
      btn.style.width='100%';
      btn.style.justifyContent='flex-start';
      btn.textContent=action;
      btn.onclick=function(){performTouch(contactId,action);hideOv('ov-contact-touch');};
      list.appendChild(btn);
    });
  }
  renderCards(currentGroup);

  // Bind group tab clicks
  setTimeout(function(){
    var tabs=document.querySelectorAll('.touch-group-tab');
    tabs.forEach(function(tab){
      tab.addEventListener('click',function(){
        currentGroup=this.getAttribute('data-tg');
        tabs.forEach(function(t){
          t.classList.remove('sel');
          t.style.background='var(--c2)';
          t.style.color='var(--txt)';
        });
        this.classList.add('sel');
        this.style.background='var(--accent)';
        this.style.color='#fff';
        renderCards(currentGroup);
      });
    });
  },30);
  showOv('ov-contact-touch');
}
function showGroupTouchMemberSelect(groupId){
  var group = groups.find(function(g){return g.id===groupId});
  if(!group) return;
  var list = $('group-touch-member-list');
  if(!list) return;
  list.innerHTML = '';
  var memberIds = group.memberIds || [];
  if(!memberIds.length){ toast('群内暂无成员'); return; }
  memberIds.forEach(function(mid){
    var contact = contacts.find(function(c){return c.id===mid});
    if(!contact) return;
    var displayName = contact.name;
    if(group.memberSettings && group.memberSettings[mid] && group.memberSettings[mid].nickname){
      displayName = group.memberSettings[mid].nickname;
    }
    var row = document.createElement('button');
    row.className = 'btn';
    row.style.cssText = 'width:100%;justify-content:flex-start;padding:10px 14px;';
    row.textContent = displayName;
    row.onclick = function(){
      hideOv('ov-group-touch-select');
      showChatTouchMenu(mid);
    };
    list.appendChild(row);
  });
  showOv('ov-group-touch-select');
}
if($('touch-custom-send-btn'))$('touch-custom-send-btn').addEventListener('click',function(){var val=$('touch-custom-input').value.trim();if(!val){toast('请输入内容');return}var contactId=cid;performTouch(contactId,val);$('touch-custom-input').value='';hideOv('ov-contact-touch')});


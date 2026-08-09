// ---------- Batch Card Operations ----------
function toggleBatchSelect(cardId){
  var idx=batchSelectedCards.indexOf(cardId);
  if(idx>=0){
    batchSelectedCards.splice(idx,1);
  }else{
    batchSelectedCards.push(cardId);
  }
  updateBatchSelectionUI();
  var el=document.querySelector('[data-id="'+cardId+'"]');
  if(el){
    el.classList.toggle('batch-selected',idx<0);
    var cb=el.querySelector('.batch-select-checkbox');
    if(cb)cb.checked=(idx<0);
  }
}

function selectAllBatchCards(){
  var allCards=[];
  var containers=document.querySelectorAll('#card-list .card-item, #card-list .card-sticker-item');
  containers.forEach(function(el){
    var cid=el.getAttribute('data-id');
    if(cid)allCards.push(cid);
  });
  
  if(batchSelectedCards.length===allCards.length&&allCards.length>0){
    batchSelectedCards=[];
  }else{
    batchSelectedCards=allCards.slice();
  }
  
  var selectAllBtn=$('batch-select-all-btn');
  if(selectAllBtn)selectAllBtn.textContent=batchSelectedCards.length===allCards.length&&allCards.length>0?'取消全选':'全选';
  
  updateBatchSelectionUI();
  renderCardList();
}

async function moveBatchCardsToGroup(){
  var groupSelect=$('batch-move-group-select');
  if(!groupSelect)return;
  var targetGroupId=groupSelect.value;
  if(!targetGroupId){
    toast('请选择目标分组');
    return;
  }
  if(batchSelectedCards.length===0){
    toast('请先选择字卡');
    return;
  }
  
  var groupInfo=cardGroups.find(function(g){return g.id===targetGroupId});
  // 拍一拍字卡分组不在cardGroups中，从targetGroupId解析
  if(!groupInfo&&targetGroupId.startsWith('default_touch')){
    var parts=targetGroupId.split('_');
    var groupName=parts[parts.length-1];
    groupInfo={id:targetGroupId,name:groupName||'默认',category:'touch'};
  }
  var groupName=groupInfo?groupInfo.name:targetGroupId;
  if(!confirm('确定将 '+batchSelectedCards.length+' 张字卡移动到分组"'+groupName+'"吗？'))return;
  
  var moveCount=0;
  var isTouchCategory=targetGroupId.indexOf('default_touch')===0;
  
  // 拍一拍字卡：按索引降序排列，从后往前处理避免索引偏移
  var touchCardsToMove=[];
  for(var i=0;i<batchSelectedCards.length;i++){
    var cardId=batchSelectedCards[i];
    if(cardId.startsWith('touch_')){
      var touchParts=cardId.split('_');
      var tType=touchParts[1];
      var tContactId=tType==='private'?touchParts[2]:null;
      var tIndex=parseInt(touchParts[touchParts.length-1]);
      var allTouchCards=getAllTouchCards(tType,tContactId);
      if(tIndex>=0&&tIndex<allTouchCards.length){
        touchCardsToMove.push({cardId:cardId,type:tType,contactId:tContactId,index:tIndex,text:allTouchCards[tIndex]});
      }
    }
  }
  // 按索引降序排列
  touchCardsToMove.sort(function(a,b){return b.index-a.index});
  
  for(var i=0;i<touchCardsToMove.length;i++){
    var tc=touchCardsToMove[i];
    var cardText=tc.text;
    // 找到当前所在分组（每次重新计算，因为前面已移除的会影响索引）
    var allCards=getAllTouchCards(tc.type,tc.contactId);
    var curIdx=allCards.indexOf(cardText);
    if(curIdx<0)continue;
    
    var srcGroup='默认';
    var defaultCards=tc.type==='public'?getTouchCardsPublic():getTouchCardsPrivate(tc.contactId);
    if(curIdx>=defaultCards.length){
      var groupData=ls('ml2_touch_group_cards')||{};
      var groups=getTouchGroups(tc.type);
      var remainingIndex=curIdx-defaultCards.length;
      var accumulated=0;
      for(var g=0;g<groups.length;g++){
        if(groups[g]==='默认')continue;
        var gKey=tc.type+'_'+groups[g]+(tc.contactId?'_'+tc.contactId:'');
        var count=groupData[gKey]?groupData[gKey].length:0;
        if(remainingIndex<accumulated+count){
          srcGroup=groups[g];
          break;
        }
        accumulated+=count;
      }
    }
    // 从源分组移除
    var srcCards=getTouchCardsByGroup(tc.type,srcGroup,tc.contactId);
    var srcIdx=srcCards.indexOf(cardText);
    if(srcIdx>=0){
      srcCards.splice(srcIdx,1);
      saveTouchCardsByGroup(tc.type,srcGroup,srcCards,tc.contactId);
      // 添加到目标分组
      var dstCards=getTouchCardsByGroup(tc.type,groupName,tc.contactId);
      dstCards.push(cardText);
      saveTouchCardsByGroup(tc.type,groupName,dstCards,tc.contactId);
      moveCount++;
    }
  }
  
  // 非拍一拍字卡
  for(var i=0;i<batchSelectedCards.length;i++){
    var cardId=batchSelectedCards[i];
    if(!cardId.startsWith('touch_')){
      var card=globalCards.find(function(c){return c.id===cardId});
      if(card){
        card.groupId=targetGroupId;
        moveCount++;
      }
    }
  }
  
  batchSelectedCards=[];
  await saveGlobalCardsDebounced();
  updateBatchSelectionUI();
  renderCardList();
  toast('已移动 '+moveCount+' 张字卡到"'+groupName+'"');
}

async function deleteBatchCards(){
  if(batchSelectedCards.length===0){
    toast('请先选择字卡');
    return;
  }
  if(!confirm('确定要删除选中的 '+batchSelectedCards.length+' 张字卡吗？此操作不可撤销。'))return;
  
  var deleteCount=0;
  for(var i=0;i<batchSelectedCards.length;i++){
    var cardId=batchSelectedCards[i];
    if(cardId.startsWith('touch_')){
      var parts=cardId.split('_');
      var type=parts[1];
      var contactId=type==='private'?parts[2]:null;
      var index=parseInt(parts[parts.length-1]);
      var allCards=getAllTouchCards(type,contactId);
      if(index>=0&&index<allCards.length){
        var cardText=allCards[index];
        // 找到所属分组
        var srcGroup='默认';
        var defaultCards=type==='public'?getTouchCardsPublic():getTouchCardsPrivate(contactId);
        if(index>=defaultCards.length){
          var groupData=ls('ml2_touch_group_cards')||{};
          var groups=getTouchGroups(type);
          var remainingIndex=index-defaultCards.length;
          var accumulated=0;
          for(var g=0;g<groups.length;g++){
            if(groups[g]==='默认')continue;
            var gKey=type+'_'+groups[g]+(contactId?'_'+contactId:'');
            var count=groupData[gKey]?groupData[gKey].length:0;
            if(remainingIndex<accumulated+count){
              srcGroup=groups[g];
              break;
            }
            accumulated+=count;
          }
        }
        // 从分组中删除
        var srcCards=getTouchCardsByGroup(type,srcGroup,contactId);
        var srcIdx=srcCards.indexOf(cardText);
        if(srcIdx>=0){
          srcCards.splice(srcIdx,1);
          saveTouchCardsByGroup(type,srcGroup,srcCards,contactId);
          deleteCount++;
        }
      }
    }else{
      var card=globalCards.find(function(c){return c.id===cardId});
      if(card&&card.content&&card.content.startsWith('data:image/')){
        var imgKey='ml2_card_img_'+card.id;
        if(window.localforage){
          window.localforage.removeItem(imgKey).catch(function(){});
        }
      }
      globalCards=globalCards.filter(function(c){return c.id!==cardId});
      deleteCount++;
    }
  }
  
  batchSelectedCards=[];
  await saveGlobalCardsDebounced();
  updateBatchSelectionUI();
  renderCardList();
  toast('已删除 '+deleteCount+' 张字卡');
}

function updateBatchSelectionUI(){
  var bar=$('batch-ops-bar');
  var countEl=$('batch-selected-count');
  var selectAllBtn=$('batch-select-all-btn');
  var groupSelect=$('batch-move-group-select');
  
  if(bar){
    bar.style.display=batchSelectedCards.length>0?'block':'none';
  }
  if(countEl){
    countEl.textContent='已选 '+batchSelectedCards.length+' 张';
  }
  
  if(groupSelect){
    var validGroups;
    if(currentCardCategory==='touch'){
      var touchGroups=getTouchGroups(currentCardType);
      if(!Array.isArray(touchGroups))touchGroups=['默认'];
      validGroups=touchGroups.map(function(groupName){
        return{
          id:'default_touch'+(currentCardType==='private'?'_'+selectedPrivateContact:'')+'_'+groupName,
          name:groupName
        };
      });
    }else{
      validGroups=(cardGroups||[]).filter(function(g){
        if(!g||!g.id||!g.name)return false;
        if(g.category!==currentCardCategory)return false;
        if(g.type!==currentCardType)return false;
        if(currentCardType==='private'&&g.contactId!==selectedPrivateContact)return false;
        return true;
      });
    }
    groupSelect.innerHTML='<option value="">移动到分组...</option>'+
      validGroups.map(function(g){return'<option value="'+g.id+'">'+g.name+'</option>'}).join('');
  }
  
  if(selectAllBtn){
    var allContainers=document.querySelectorAll('#card-list .card-item, #card-list .card-sticker-item');
    selectAllBtn.textContent=batchSelectedCards.length===allContainers.length&&allContainers.length>0?'取消全选':'全选';
  }
}

if($('toggle-fold-btn'))$('toggle-fold-btn').addEventListener('click',toggleAllFold);

function parseCardsWithGroups(text){
  var lines=text.split(/[\n\r]+/).map(function(s){return s.trim()}).filter(function(s){return s});
  var cards=[];
  var defaultId='default_'+currentCardCategory+(currentCardType==='private'?'_'+selectedPrivateContact:'');
  var targetGroupId=currentCardGroup==='all'?defaultId:currentCardGroup;
  var currentGroup=targetGroupId;
  var groupAdded=false;
  
  var existingGroup=cardGroups.find(function(g){return g.id===targetGroupId});
  if(!existingGroup){
    var defaultGroupName='默认分组';
    var foundDefault=cardGroups.find(function(g){return g.category===currentCardCategory&&(!g.type||g.type===currentCardType)});
    if(foundDefault){
      currentGroup=foundDefault.id;
    }else{
      var newGroup={id:'g_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),name:defaultGroupName,category:currentCardCategory,type:currentCardType};
      cardGroups.push(newGroup);
      groupAdded=true;
      currentGroup=newGroup.id;
    }
  }
  
  lines.forEach(function(line){
    var groupMatch=line.match(/^【(.+?)】$/);
    if(groupMatch){
      var groupName=groupMatch[1].trim();
      if(!groupName){
        cards.push({
          id:'c_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
          content:line,
          type:currentCardType,
          category:currentCardCategory,
          groupId:currentGroup,
          contactId:currentCardType==='private'?selectedPrivateContact:null
        });
        return;
      }
      var existingGroup=cardGroups.find(function(g){return g.name===groupName&&g.category===currentCardCategory&&(!g.type||g.type===currentCardType)});
      if(existingGroup){
        currentGroup=existingGroup.id;
      }else{
        var newGroup={id:'g_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),name:groupName,category:currentCardCategory,type:currentCardType};
        cardGroups.push(newGroup);
        groupAdded=true;
        currentGroup=newGroup.id;
      }
    }else{
      cards.push({
        id:'c_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
        content:line,
        type:currentCardType,
        category:currentCardCategory,
        groupId:currentGroup,
        contactId:currentCardType==='private'?selectedPrivateContact:null
      });
    }
  });
  
  if(groupAdded){
    saveCardGroups();
    renderCardGroups();
  }
  
  return cards;
}

/* ====== 批量导入字卡弹出页面 ====== */
var cardBatchImportContext='chat'; // 'chat' 或 'nav'
var cardBatchImportSelectedCategory='weather';

function openCardBatchImportModal(context){
  cardBatchImportContext=context||'chat';
  var titleEl=$('batch-import-title');
  if(titleEl)titleEl.textContent=cardBatchImportContext==='nav'?'批量导入顶部栏字卡':'批量导入字卡';

  // 清空输入
  var ta=$('batch-import-textarea');
  if(ta)ta.value='';

  // 填充分组下拉
  fillBatchImportGroups();

  // 填充分类（仅顶部栏字卡库需要）
  var catWrap=$('batch-import-category-wrap');
  if(cardBatchImportContext==='nav'){
    catWrap.style.display='block';
    fillBatchImportCategories();
  }else{
    catWrap.style.display='none';
  }

  showOv('ov-batch-import');
}

function fillBatchImportGroups(){
  var sel=$('batch-import-group');
  if(!sel)return;
  var html='';
  if(cardBatchImportContext==='chat'){
    // 聊天字卡库分组
    var validGroups=(cardGroups||[]).filter(function(g){
      if(!g||!g.id||!g.name)return false;
      if(g.category!==currentCardCategory)return false;
      if(g.type!==currentCardType)return false;
      if(currentCardType==='private'&&g.contactId!==selectedPrivateContact)return false;
      // 过滤掉"默认分组"，避免与下方手动添加的重复
      if(g.name==='默认分组')return false;
      return true;
    });
    var defaultId='default_'+currentCardCategory+(currentCardType==='private'?'_'+selectedPrivateContact:'');
    html+='<option value="'+defaultId+'">默认分组</option>';
    validGroups.forEach(function(g){
      html+='<option value="'+g.id+'">'+g.name+'</option>';
    });
  }else{
    // 顶部栏字卡库分组
    var groups=getNavCardGroups(navCardCurrentType);
    html+='<option value="默认">默认分组</option>';
    groups.forEach(function(g){
      if(g!=='默认')html+='<option value="'+g+'">'+g+'</option>';
    });
  }
  sel.innerHTML=html;
}

function fillBatchImportCategories(){
  var list=$('batch-import-category-list');
  if(!list)return;
  var cats=[
    {key:'weather',name:'☀️ 天气'},
    {key:'time',name:'⏰ 时间'},
    {key:'status',name:'💬 对方状态'},
    {key:'idle',name:'🌙 空闲状态'},
    {key:'mood',name:'😊 心情状态'},
    {key:'other',name:'📝 其他'}
  ];
  cardBatchImportSelectedCategory=navCardCurrentCategory!=='all'?navCardCurrentCategory:'weather';
  list.innerHTML=cats.map(function(c){
    return '<button class="card-category-tab'+(c.key===cardBatchImportSelectedCategory?' sel':'')+'" data-cat="'+c.key+'" style="padding:8px 14px;font-size:13px;border-radius:8px;min-height:38px;">'+c.name+'</button>';
  }).join('');
  list.querySelectorAll('.card-category-tab').forEach(function(btn){
    btn.onclick=function(){
      list.querySelectorAll('.card-category-tab').forEach(function(x){x.classList.remove('sel')});
      this.classList.add('sel');
      cardBatchImportSelectedCategory=this.dataset.cat;
    };
  });
}

function confirmBatchImport(){
  var text=$('batch-import-textarea').value.trim();
  if(!text){toast('请输入字卡内容');return}

  if(cardBatchImportContext==='chat'){
    confirmChatBatchImport(text);
  }else{
    confirmNavBatchImport(text);
  }
}

function confirmChatBatchImport(text){
  var targetGroupId=$('batch-import-group').value;
  var lines=text.split(/[\n\r]+/).map(function(s){return s.trim()}).filter(function(s){return s});
  var cards=[];
  var currentGroup=targetGroupId;
  var groupAdded=false;

  // 确保目标分组存在
  var existingGroup=cardGroups.find(function(g){return g.id===targetGroupId});
  if(!existingGroup){
    var newGroup={id:targetGroupId,name:'默认分组',category:currentCardCategory,type:currentCardType};
    if(currentCardType==='private')newGroup.contactId=selectedPrivateContact;
    cardGroups.push(newGroup);
    groupAdded=true;
  }

  lines.forEach(function(line){
    var groupMatch=line.match(/^【(.+?)】$/);
    if(groupMatch){
      var groupName=groupMatch[1].trim();
      if(groupName){
        var g=cardGroups.find(function(x){return x.name===groupName&&x.category===currentCardCategory&&(!x.type||x.type===currentCardType)});
        if(g){
          currentGroup=g.id;
        }else{
          var ng={id:'g_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),name:groupName,category:currentCardCategory,type:currentCardType};
          if(currentCardType==='private')ng.contactId=selectedPrivateContact;
          cardGroups.push(ng);
          groupAdded=true;
          currentGroup=ng.id;
        }
      }
    }else{
      cards.push({
        id:'c_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
        content:line,
        type:currentCardType,
        category:currentCardCategory,
        groupId:currentGroup,
        contactId:currentCardType==='private'?selectedPrivateContact:null
      });
    }
  });

  if(cards.length===0){toast('未检测到有效字卡内容');return}

  globalCards.push.apply(globalCards,cards);
  if(groupAdded){
    saveCardGroups();
    renderCardGroups();
  }
  renderCardList();
  saveGlobalCardsDebounced();
  hideOv('ov-batch-import');
  toast('已导入 '+cards.length+' 张字卡');
}

async function confirmNavBatchImport(text){
  var targetGroup=$('batch-import-group').value;
  var category=cardBatchImportSelectedCategory;
  var lines=text.split(/[\n\r]+/).map(function(s){return s.trim()}).filter(function(s){return s});
  var cards=await getNavCards(navCardCurrentType,navCardCurrentContact);
  var added=0;
  var currentGroup=targetGroup;

  // 确保分组存在
  var groups=getNavCardGroups(navCardCurrentType);
  if(!groups.includes(currentGroup)){
    groups.push(currentGroup);
    if(navCardCurrentType==='public'){
      navCardGroups.public=groups;
    }else if(navCardCurrentContact){
      navCardGroups.private[navCardCurrentContact]=groups;
    }
    saveNavCardGroups();
  }

  lines.forEach(function(line){
    var groupMatch=line.match(/^【(.+?)】$/);
    if(groupMatch){
      var groupName=groupMatch[1].trim();
      if(groupName){
        currentGroup=groupName;
        if(!groups.includes(groupName)){
          groups.push(groupName);
          if(navCardCurrentType==='public'){
            navCardGroups.public=groups;
          }else if(navCardCurrentContact){
            navCardGroups.private[navCardCurrentContact]=groups;
          }
          saveNavCardGroups();
        }
      }
    }else{
      var exists=cards.some(function(c){return c.content===line&&c.category===category});
      if(!exists){
        cards.push({content:line,group:currentGroup,category:category});
        added++;
      }
    }
  });

  await saveNavCards(cards,navCardCurrentType,navCardCurrentContact);
  renderNavCardGroupTags();
  renderNavCards();
  hideOv('ov-batch-import');
  toast('成功导入 '+added+' 张字卡');
}

// 批量导入弹出页面事件绑定
if($('batch-import-confirm')){$('batch-import-confirm').addEventListener('click',function(){
  confirmBatchImport();
});}

// 聊天字卡库"打开导入页面"按钮
if($('open-batch-import-btn')){$('open-batch-import-btn').addEventListener('click',function(){
  openCardBatchImportModal('chat');
});}

if($('batch-import-new-group')){$('batch-import-new-group').addEventListener('click',function(){
  customPrompt('请输入新分组名称：','').then(function(name){
    if(!name)return;
    name=name.trim();
    if(!name){toast('请输入分组名称');return}
    var newGroupId=name;
    if(cardBatchImportContext==='chat'){
      var newGroup={id:'g_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),name:name,category:currentCardCategory,type:currentCardType};
      if(currentCardType==='private')newGroup.contactId=selectedPrivateContact;
      cardGroups.push(newGroup);
      saveCardGroups();
      renderCardGroups();
      newGroupId=newGroup.id;
    }else{
      addNavCardGroup(name);
    }
    fillBatchImportGroups();
    var sel=$('batch-import-group');
    if(sel)sel.value=newGroupId;
    toast('已创建分组「'+name+'」');
  });
});}

if($('batch-import-txt-btn')){$('batch-import-txt-btn').addEventListener('click',function(){
  $('batch-import-file').click();
});}

if($('batch-import-file')){$('batch-import-file').addEventListener('change',function(e){
  var file=e.target.files[0];
  if(!file)return;
  var reader=new FileReader();
  reader.onload=function(event){
    var ta=$('batch-import-textarea');
    if(ta)ta.value=event.target.result;
    toast('已加载文件：'+file.name);
  };
  reader.readAsText(file,'UTF-8');
  e.target.value='';
});}

if($('batch-touch-btn')){$('batch-touch-btn').addEventListener('click',function(){
  var text=$('batch-touch-inp').value.trim();
  if(!text){toast('请输入内容');return}
  importTouchCards(text);
});}

if($('import-touch-txt-btn')){$('import-touch-txt-btn').addEventListener('click',function(){
  $('touch-txt-file-input').click();
});}

if($('touch-txt-file-input')){$('touch-txt-file-input').addEventListener('change',function(e){
  var file=e.target.files[0];
  if(!file)return;
  var reader=new FileReader();
  reader.onload=function(evt){
    importTouchCards(evt.target.result);
  };
  reader.readAsText(file);
  e.target.value='';
});}

if($('dedup-touch-btn'))$('dedup-touch-btn').addEventListener('click',function(){
  deduplicateTouchCards();
});

if($('clear-touch-btn'))$('clear-touch-btn').addEventListener('click',function(){
  if(!confirm('确定要清空所有拍一拍字卡吗？'))return;
  clearAllTouchCards();
});

if($('import-txt-btn')){$('import-txt-btn').addEventListener('click',function(){
  $('txt-file-input').click();
});}

if($('txt-file-input')){$('txt-file-input').addEventListener('change',function(e){
  var file=e.target.files[0];
  if(!file)return;
  
  var reader=new FileReader();
  reader.onload=function(event){
    var text=event.target.result;
    var cards=parseCardsWithGroups(text);
    if(!cards.length){toast('未检测到有效字卡内容');return}
    globalCards.push.apply(globalCards,cards);
    renderCardList();
    toast('已从TXT文件导入 '+cards.length+' 张字卡');
    saveGlobalCardsDebounced();
  };
  reader.readAsText(file,'UTF-8');
  e.target.value='';
});}

if($('clear-chat-btn')){$('clear-chat-btn').addEventListener('click',function(){
  if(confirm('确定清空当前分类的字卡？')){
    globalCards=globalCards.filter(function(card){
      if(card.type!==currentCardType)return true;
      if(card.category!==currentCardCategory)return true;
      if(currentCardType==='private'&&card.contactId!==selectedPrivateContact)return true;
      if(currentCardGroup!=='all'&&card.groupId!==currentCardGroup)return true;
      return false;
    });
    saveGlobalCardsDebounced();
    renderCardList();
    toast('已清空');
  }
});}

// ★ 清空全部公用字卡（所有分类/分组中 type=public 的字卡）
if($('clear-public-cards-btn')){$('clear-public-cards-btn').addEventListener('click',function(){
  var count=globalCards.filter(function(c){return c.type==='public'||!c.type;}).length;
  if(count===0){toast('没有公用字卡');return;}
  if(!confirm('确定清空全部公用字卡？共 '+count+' 张，该操作不可恢复！')){
    return;
  }
  globalCards=globalCards.filter(function(c){return !(c.type==='public'||!c.type);});
  saveGlobalCardsDebounced();
  renderCardList();
  toast('已清空全部公用字卡');
});}

// ★ 清空全部专享字卡（所有分类/分组/联系人中 type=private 的字卡）
if($('clear-private-cards-btn')){$('clear-private-cards-btn').addEventListener('click',function(){
  var count=globalCards.filter(function(c){return c.type==='private';}).length;
  if(count===0){toast('没有专享字卡');return;}
  if(!confirm('确定清空全部专享字卡？共 '+count+' 张，该操作不可恢复！')){
    return;
  }
  globalCards=globalCards.filter(function(c){return c.type!=='private';});
  saveGlobalCardsDebounced();
  renderCardList();
  toast('已清空全部专享字卡');
});}

if($('dedup-card-btn')){$('dedup-card-btn').addEventListener('click',async function(){
  var seen={};
  var duplicateCount=0;
  var originalCount=0;
  
  globalCards=globalCards.filter(function(card){
    if(card.type!==currentCardType)return true;
    if(card.category!==currentCardCategory)return true;
    if(currentCardType==='private'&&card.contactId!==selectedPrivateContact)return true;
    if(currentCardGroup!=='all'&&card.groupId!==currentCardGroup)return true;
    
    originalCount++;
    var key=card.content.trim();
    if(seen[key]){
      duplicateCount++;
      return false;
    }
    seen[key]=true;
    return true;
  });
  
  if(duplicateCount>0){
    saveGlobalCardsDebounced();
    renderCardList();
    toast('已清除 '+duplicateCount+' 张重复字卡');
  }else{
    toast('暂无重复字卡');
  }
});}

// ---------- Sticker Upload ----------
var currentStickerData=[];
function triggerStickerUpload(){
  var fileInput=$('sticker-file-input');
  if(fileInput){
    fileInput.click();
  }else{
    console.error('sticker-file-input not found');
    toast('上传控件未找到，请刷新页面');
  }
}

function optimizeImage(file, maxWidth, quality) {
  maxWidth = maxWidth || 400;
  quality = quality || 0.85;
  // GIF 动图跳过 canvas 处理，直接读取保留动画
  if(file.type==='image/gif'||(file.name&&file.name.toLowerCase().endsWith('.gif'))){
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function(e) { resolve(e.target.result); };
      reader.onerror = function() { reject(new Error('GIF读取失败')); };
      reader.readAsDataURL(file);
    });
  }
  return new Promise(function(resolve, reject) {
    var img = new Image();
    var objectUrl = URL.createObjectURL(file);
    img.onload = function() {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      var width = img.width;
      var height = img.height;
      // 限制最大尺寸，提高处理速度
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      // 限制高度，防止超长图片
      if (height > maxWidth * 2) {
        width = Math.round((width * maxWidth * 2) / height);
        height = maxWidth * 2;
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      var isSmall = file.size < 300 * 1024;
      var dataUrl = canvas.toDataURL(isSmall ? 'image/png' : 'image/jpeg', isSmall ? undefined : quality);
      URL.revokeObjectURL(objectUrl);
      resolve(dataUrl);
    };
    img.onerror = function() {
      URL.revokeObjectURL(objectUrl);
      // 降级：直接读取
      var reader = new FileReader();
      reader.onload = function(e) { resolve(e.target.result); };
      reader.onerror = function() { reject(new Error('图片处理失败')); };
      reader.readAsDataURL(file);
    };
    img.src = objectUrl;
  });
}



function uploadStickersToMine(){
  var input=document.createElement('input');
  input.type='file';
  input.accept='image/'+'*';
  input.multiple=true;
  input.style.display='none';
  document.body.appendChild(input);
  
  input.addEventListener('change',async function(e){
    var files=e.target.files;
    if(!files||files.length===0){
      input.remove();
      return;
    }
    
    var oversized=[];
    var validFiles=[];
    for(var i=0;i<files.length;i++){
      if(files[i].size>2*1024*1024){
        oversized.push(files[i]);
      }else{
        validFiles.push(files[i]);
      }
    }
    
    if(oversized.length>0){
      toast(oversized.length+' 张图片超过 2MB，已跳过');
    }
    
    if(!validFiles.length){
      input.remove();
      return;
    }
    
    var progressDiv=document.createElement('div');
    progressDiv.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:#fff;padding:24px 40px;border-radius:12px;font-size:14px;z-index:2000;text-align:center;';
    progressDiv.innerHTML='<div style="margin-bottom:12px;">正在处理图片...</div><div style="width:200px;height:4px;background:rgba(255,255,255,0.2);border-radius:2px;overflow:hidden;"><div id="upload-progress-bar" style="height:100%;background:#fff;border-radius:2px;width:0%;transition:width 0.3s ease;"></div></div><div id="upload-progress-text" style="margin-top:8px;font-size:12px;">0/'+validFiles.length+'</div>';
    document.body.appendChild(progressDiv);
    
    var ok=0,fail=0;
    var stickerData=[];
    
    for(var i=0;i<validFiles.length;i++){
      try{
        var data=await optimizeImage(validFiles[i],500,0.9);
        stickerData.push(data);
        ok++;
      }catch(err){
        fail++;
      }
      
      var progress=((i+1)/validFiles.length)*100;
      if($('upload-progress-bar'))$('upload-progress-bar').style.width=progress+'%';
      if($('upload-progress-text'))$('upload-progress-text').textContent=(i+1)+'/'+validFiles.length;
      
      await new Promise(function(r){setTimeout(r,50)});
    }
    
    if(progressDiv)progressDiv.remove();
    
    if(stickerData.length>0){
      var targetGroup=null;
      if(lastEmojiGroup&&lastEmojiGroup!=='默认分组'){
        targetGroup=cardGroups.find(function(g){
          return g.name===lastEmojiGroup&&g.category==='stickers'&&g.type==='personal'&&!g.contactId;
        });
      }
      if(!targetGroup){
        targetGroup=cardGroups.find(function(g){
          return g.id==='default_stickers'||(g.name==='默认分组'&&g.category==='stickers'&&g.type==='personal'&&!g.contactId);
        });
      }
      
      if(!targetGroup){
        targetGroup={id:'default_stickers',name:'默认分组',category:'stickers',type:'personal',contactId:null};
        cardGroups.push(targetGroup);
      }else{
        targetGroup.id=targetGroup.id||'default_stickers';
        targetGroup.contactId=null;
      }
      saveCardGroups();
      
      var targetGroupId=targetGroup.id;
      
      var saveProgressDiv=document.createElement('div');
      saveProgressDiv.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:#fff;padding:24px 40px;border-radius:12px;font-size:14px;z-index:2000;text-align:center;';
      saveProgressDiv.innerHTML='<div>正在保存...</div>';
      document.body.appendChild(saveProgressDiv);
      
      stickerData.forEach(function(data){
        var card={
          id:'sticker_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
          content:data,
          type:'personal',
          category:'stickers',
          groupId:targetGroupId
        };
        globalCards.push(card);
      });
      
      saveGlobalCardsDebounced();
      
      if(saveProgressDiv)saveProgressDiv.remove();
      
      renderEmojiPanel('mine');
      toast('已保存 '+stickerData.length+' 张图片表情');
    }
    
    if(fail>0){
      toast('处理完成：'+ok+' 成功 '+fail+' 失败','warning');
    }
    
    input.remove();
  });
  
  input.click();
}




// ---------- Voice Upload ----------
var currentVoiceData=[];
if($('voice-upload-btn'))$('voice-upload-btn').addEventListener('click',function(e){
  e.stopPropagation();
  $('voice-file-input').click();
});
if($('voice-upload-area'))$('voice-upload-area').addEventListener('click',function(e){
  $('voice-file-input').click();
});
if($('voice-file-input')){$('voice-file-input').addEventListener('change',function(e){
  var files=e.target.files;
  if(!files||files.length===0)return;
  
  currentVoiceData=[];
  $('voice-preview').innerHTML='';
  
  var validFiles=[];
  for(var i=0;i<files.length;i++){
    validFiles.push(files[i]);
  }
  
  if(!validFiles.length)return;
  
  var loadedCount=0;
  for(var i=0;i<validFiles.length;i++){
    (function(file,index){
      var reader=new FileReader();
      reader.onload=function(evt){
        var data=evt.target.result;
        var fileName=file.name.replace(/\.[^.]+$/,'');
        
        var audio=new Audio(data);
        audio.onloadedmetadata=function(){
          var duration=audio.duration;
          currentVoiceData.push({data:data,name:file.name,voiceText:fileName,duration:duration});
          $('voice-preview').innerHTML+='<div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--c2);border-radius:8px;margin-bottom:4px;"><input type="text" value="'+fileName+'" style="flex:1;padding:4px 8px;border:1px solid var(--c3);border-radius:6px;font-size:13px;color:var(--txt);background:var(--c1);outline:none;" oninput="updateVoiceText('+index+',this.value)"><span style="font-size:12px;color:var(--txt3);flex-shrink:0;">'+(duration>0?Math.floor(duration)+'s':'')+'</span><button onclick="playVoice(this)" data-idx="'+index+'" style="border:none;background:transparent;color:var(--accent);cursor:pointer;font-size:14px;">▶</button></div>';
          loadedCount++;
          if(loadedCount===validFiles.length){
            $('voice-preview').style.display='block';
            $('save-voice-btn').style.display='block';
            $('voice-upload-info').textContent='已选择 '+validFiles.length+' 个语音文件';
          }
        };
        audio.onerror=function(){
          currentVoiceData.push({data:data,name:file.name,voiceText:fileName,duration:0});
          $('voice-preview').innerHTML+='<div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--c2);border-radius:8px;margin-bottom:4px;"><input type="text" value="'+fileName+'" style="flex:1;padding:4px 8px;border:1px solid var(--c3);border-radius:6px;font-size:13px;color:var(--txt);background:var(--c1);outline:none;" oninput="updateVoiceText('+index+',this.value)"><span style="font-size:12px;color:var(--txt3);flex-shrink:0;">未知时长</span><button onclick="playVoice(this)" data-idx="'+index+'" style="border:none;background:transparent;color:var(--accent);cursor:pointer;font-size:14px;">▶</button></div>';
          loadedCount++;
          if(loadedCount===validFiles.length){
            $('voice-preview').style.display='block';
            $('save-voice-btn').style.display='block';
            $('voice-upload-info').textContent='已选择 '+validFiles.length+' 个语音文件';
          }
        };
      };
      reader.readAsDataURL(file);
    })(validFiles[i],i);
  }
  e.target.value='';
});}
function updateVoiceText(idx,text){
  if(currentVoiceData[idx]){
    currentVoiceData[idx].voiceText=text;
  }
}
function playVoice(btn){
  var idx=parseInt(btn.dataset.idx);
  if(isNaN(idx)||!currentVoiceData[idx])return;
  var audio=new Audio(currentVoiceData[idx].data);
  audio.play();
}
if($('save-voice-btn')){$('save-voice-btn').addEventListener('click',async function(){
  if(!currentVoiceData||currentVoiceData.length===0)return;
  
  var defaultGroupId='default_voices'+(currentCardType==='private'?'_'+selectedPrivateContact:'');
  var targetGroupId=currentCardGroup==='all'?defaultGroupId:currentCardGroup;
  
  var existingGroup=cardGroups.find(function(g){
    return g.id===targetGroupId&&g.category==='voices'&&g.type===currentCardType&&(currentCardType!=='private'||g.contactId===selectedPrivateContact);
  });
  
  if(!existingGroup){
    var groupName=cardGroups.find(function(g){return g.id===targetGroupId})?.name||'默认分组';
    var newGroup={id:'g_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),name:groupName,category:'voices',type:currentCardType};
    if(currentCardType==='private')newGroup.contactId=selectedPrivateContact;
    cardGroups.push(newGroup);
    saveCardGroups();
    targetGroupId=newGroup.id;
  }
  
  currentVoiceData.forEach(function(item){
    var card={
      id:'voice_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
      content:item.data,
      type:currentCardType,
      category:'voices',
      groupId:targetGroupId,
      voiceText:item.voiceText||item.name.replace(/\.[^.]+$/,''),
      duration:item.duration||0
    };
    if(currentCardType==='private')card.contactId=selectedPrivateContact;
    globalCards.push(card);
  });
  
  var saved=saveGlobalCardsDebounced();
  renderCardGroups();
  renderCardList();
  toast('已保存 '+currentVoiceData.length+' 个语音到分组');
  currentVoiceData=[];
  $('voice-preview').style.display='none';
  $('voice-preview').innerHTML='';
  $('save-voice-btn').style.display='none';
  $('voice-upload-info').textContent='点击上传语音（支持多选）';
});}
if($('clear-voice-btn'))$('clear-voice-btn').addEventListener('click',function(){
  if(confirm('确定清空所有语音？')){
    globalCards=globalCards.filter(function(c){return c.category!=='voices'});
    saveGlobalCardsDebounced();
    renderCardList();
    toast('已清空');
  }
});

// ---------- Sticker Upload ----------
var currentStickerData=[];
var stickerUploading=false;
async function handleStickerFileSelect(e){
  if(stickerUploading)return;
  stickerUploading=true;
  
  var files=e.target.files;
  if(!files||files.length===0){
    e.target.value='';
    stickerUploading=false;
    return;
  }
  
  currentStickerData=[];
  $('sticker-preview').innerHTML='';
  
  var oversized=[];
  var validFiles=[];
  for(var i=0;i<files.length;i++){
    if(files[i].size>2*1024*1024){
      oversized.push(files[i]);
    }else{
      validFiles.push(files[i]);
    }
  }
  
  if(oversized.length>0){
    toast(oversized.length+' 张图片超过 2MB，已跳过');
  }
  
  if(!validFiles.length){
    e.target.value='';
    stickerUploading=false;
    return;
  }
  
  var progressDiv=document.createElement('div');
  progressDiv.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:#fff;padding:24px 40px;border-radius:12px;font-size:14px;z-index:2000;text-align:center;';
  progressDiv.innerHTML='<div style="margin-bottom:12px;">正在处理图片...</div><div style="width:200px;height:4px;background:rgba(255,255,255,0.2);border-radius:2px;overflow:hidden;"><div id="sticker-progress-bar" style="height:100%;background:#fff;border-radius:2px;width:0%;transition:width 0.3s ease;"></div></div><div id="sticker-progress-text" style="margin-top:8px;font-size:12px;">0/'+validFiles.length+'</div>';
  document.body.appendChild(progressDiv);
  
  var ok=0,fail=0;
  var previewHtml='';
  for(var i=0;i<validFiles.length;i++){
    try{
      var data=await optimizeImage(validFiles[i],400,0.85);
      currentStickerData.push(data);
      previewHtml+='<div style="width:80px;height:80px;border-radius:8px;overflow:hidden;border:2px solid var(--border);"><img src="'+data+'" style="display:block;width:100%;height:100%;object-fit:cover;"></div>';
      ok++;
    }catch(err){
      fail++;
    }
    
    var progress=((i+1)/validFiles.length)*100;
    if($('sticker-progress-bar'))$('sticker-progress-bar').style.width=progress+'%';
    if($('sticker-progress-text'))$('sticker-progress-text').textContent=(i+1)+'/'+validFiles.length;
  }
  
  if(progressDiv)progressDiv.remove();
  $('sticker-preview').innerHTML=previewHtml;
  
  if(currentStickerData.length>0){
    $('sticker-preview').style.display='flex';
    $('save-sticker-btn').style.display='block';
    $('sticker-upload-info').textContent='已选择 '+currentStickerData.length+' 张图片';
  }
  
  if(fail>0){
    toast('处理完成：'+ok+' 成功 '+fail+' 失败','warning');
  }
  
  e.target.value='';
  stickerUploading=false;
}

if($('sticker-upload-btn'))$('sticker-upload-btn').addEventListener('click',function(e){
  e.stopPropagation();
  $('sticker-file-input').click();
});
if($('sticker-upload-area'))$('sticker-upload-area').addEventListener('click',function(e){
  $('sticker-file-input').click();
});
if($('sticker-file-input')){$('sticker-file-input').addEventListener('change',handleStickerFileSelect);}
if($('save-sticker-btn')){$('save-sticker-btn').addEventListener('click',async function(){
  try{
    if(!currentStickerData||currentStickerData.length===0){
      toast('请先选择图片');
      return;
    }
    
    var targetGroupId=currentCardGroup;
    
    if(targetGroupId==='all'){
      var defaultGroupId='default_stickers'+(currentCardType==='private'?'_'+selectedPrivateContact:'');
      var existingDefault=cardGroups.find(function(g){
        return g.id===defaultGroupId||(g.name==='默认分组'&&g.category==='stickers'&&g.type===currentCardType&&(!g.contactId||g.contactId===selectedPrivateContact));
      });
      if(existingDefault){
        existingDefault.id=defaultGroupId;
        existingDefault.contactId=currentCardType==='private'?selectedPrivateContact:null;
        saveCardGroups();
        targetGroupId=defaultGroupId;
      }else{
        cardGroups.push({id:defaultGroupId,name:'默认分组',category:'stickers',type:currentCardType,contactId:currentCardType==='private'?selectedPrivateContact:null});
        saveCardGroups();
        targetGroupId=defaultGroupId;
      }
    }else{
      var selectedGroup=cardGroups.find(function(g){return g.id===targetGroupId});
      if(selectedGroup){
        selectedGroup.category='stickers';
        selectedGroup.type=currentCardType;
        if(currentCardType==='private')selectedGroup.contactId=selectedPrivateContact;
        saveCardGroups();
      }else{
        cardGroups.push({id:targetGroupId,name:'未命名分组',category:'stickers',type:currentCardType,contactId:currentCardType==='private'?selectedPrivateContact:null});
        saveCardGroups();
      }
    }
    
    currentStickerData.forEach(function(data){
      var card={
        id:'sticker_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
        content:data,
        type:currentCardType,
        category:'stickers',
        groupId:targetGroupId
      };
      if(currentCardType==='private')card.contactId=selectedPrivateContact;
      globalCards.push(card);
    });
    
    saveGlobalCardsDebounced();
    currentCardGroup=targetGroupId;
    renderCardGroups();
    renderCardList();
    toast('已保存 '+currentStickerData.length+' 张图片表情到分组');
    currentStickerData=[];
    $('sticker-preview').style.display='none';
    $('sticker-preview').innerHTML='';
    $('save-sticker-btn').style.display='none';
    $('sticker-upload-info').textContent='点击上传图片表情（支持多选）';
  }catch(e){
    console.error('保存图片表情失败:',e);
    toast('保存失败：'+e.message,'warning');
  }
});}
if($('clear-sticker-btn'))$('clear-sticker-btn').addEventListener('click',async function(){
  if(confirm('确定清空所有图片表情？')){
    var stickerCards=globalCards.filter(function(c){return c.category==='stickers'});
    for(var i=0;i<stickerCards.length;i++){
      var card=stickerCards[i];
      if(card.content&&card.content.startsWith('ml2_card_img_')){
        try{
          if(window.localforage){
            await window.localforage.removeItem(card.content);
          }
        }catch(e){}
      }
    }
    globalCards=globalCards.filter(function(c){return c.category!=='stickers'});
    await saveGlobalCardsDebounced();
    renderCardList();
    toast('已清空');
  }
});

// ---------- Image Upload ----------
var currentImageData=[];
async function handleImageFileSelect(e){
  var files=e.target.files;
  if(!files||files.length===0)return;
  var validFiles=[];
  for(var i=0;i<files.length;i++){
    if(files[i].size>10*1024*1024){
      toast(files[i].name+' 超过10MB，已跳过');
    }else{
      validFiles.push(files[i]);
    }
  }
  if(!validFiles.length){e.target.value='';return;}
  var progressDiv=document.createElement('div');
  progressDiv.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:#fff;padding:24px 40px;border-radius:12px;font-size:14px;z-index:2000;text-align:center;';
  progressDiv.innerHTML='<div style="margin-bottom:12px;">正在处理图片...</div><div style="width:200px;height:4px;background:rgba(255,255,255,0.2);border-radius:2px;overflow:hidden;"><div id="image-progress-bar" style="height:100%;background:#fff;border-radius:2px;width:0%;transition:width 0.3s ease;"></div></div><div id="image-progress-text" style="margin-top:8px;font-size:12px;">0/'+validFiles.length+'</div>';
  document.body.appendChild(progressDiv);
  currentImageData=[];
  var previewHtml='';
  for(var i=0;i<validFiles.length;i++){
    try{
      var data=await optimizeImage(validFiles[i],1280,0.9);
      currentImageData.push(data);
      previewHtml+='<div style="width:80px;height:80px;border-radius:8px;overflow:hidden;border:2px solid var(--border);"><img src="'+data+'" style="display:block;width:100%;height:100%;object-fit:cover;"></div>';
    }catch(err){}
    var progress=((i+1)/validFiles.length)*100;
    if($('image-progress-bar'))$('image-progress-bar').style.width=progress+'%';
    if($('image-progress-text'))$('image-progress-text').textContent=(i+1)+'/'+validFiles.length;
    await new Promise(function(r){setTimeout(r,50)});
  }
  if(progressDiv.parentNode)progressDiv.remove();
  if(currentImageData.length>0){
    $('image-preview').style.display='flex';
    $('save-image-btn').style.display='block';
    $('image-upload-info').textContent='已选择 '+currentImageData.length+' 张图片';
  }
  e.target.value='';
}
if($('image-upload-btn'))$('image-upload-btn').addEventListener('click',function(e){
  e.stopPropagation();
  $('image-file-input').click();
});
if($('image-upload-area'))$('image-upload-area').addEventListener('click',function(e){
  $('image-file-input').click();
});
if($('image-file-input')){$('image-file-input').addEventListener('change',handleImageFileSelect);}
if($('save-image-btn')){$('save-image-btn').addEventListener('click',async function(){
  try{
    if(!currentImageData||currentImageData.length===0){
      toast('请先选择图片');
      return;
    }
    var targetGroupId=currentCardGroup;
    if(targetGroupId==='all'){
      var defaultGroupId='default_image'+(currentCardType==='private'?'_'+selectedPrivateContact:'');
      var existingDefault=cardGroups.find(function(g){
        return g.id===defaultGroupId||(g.name==='默认分组'&&g.category==='image'&&g.type===currentCardType&&(!g.contactId||g.contactId===selectedPrivateContact));
      });
      if(existingDefault){
        existingDefault.id=defaultGroupId;
        existingDefault.contactId=currentCardType==='private'?selectedPrivateContact:null;
        saveCardGroups();
        targetGroupId=defaultGroupId;
      }else{
        cardGroups.push({id:defaultGroupId,name:'默认分组',category:'image',type:currentCardType,contactId:currentCardType==='private'?selectedPrivateContact:null});
        saveCardGroups();
        targetGroupId=defaultGroupId;
      }
    }else{
      var selectedGroup=cardGroups.find(function(g){return g.id===targetGroupId});
      if(selectedGroup){
        selectedGroup.category='image';
        selectedGroup.type=currentCardType;
        if(currentCardType==='private')selectedGroup.contactId=selectedPrivateContact;
        saveCardGroups();
      }else{
        cardGroups.push({id:targetGroupId,name:'未命名分组',category:'image',type:currentCardType,contactId:currentCardType==='private'?selectedPrivateContact:null});
        saveCardGroups();
      }
    }
    currentImageData.forEach(function(data){
      var card={
        id:'image_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
        content:data,
        type:currentCardType,
        category:'image',
        groupId:targetGroupId
      };
      if(currentCardType==='private')card.contactId=selectedPrivateContact;
      globalCards.push(card);
    });
    saveGlobalCardsDebounced();
    currentCardGroup=targetGroupId;
    renderCardGroups();
    renderCardList();
    toast('已保存 '+currentImageData.length+' 张图片到分组');
    currentImageData=[];
    $('image-preview').style.display='none';
    $('image-preview').innerHTML='';
    $('save-image-btn').style.display='none';
    $('image-upload-info').textContent='点击上传图片（支持多选，原图大小发送）';
  }catch(e){
    console.error('保存图片失败:',e);
    toast('保存失败：'+e.message,'warning');
  }
});}
if($('clear-image-btn'))$('clear-image-btn').addEventListener('click',async function(){
  if(confirm('确定清空所有图片？')){
    var imageCards=globalCards.filter(function(c){return c.category==='image'});
    for(var i=0;i<imageCards.length;i++){
      var card=imageCards[i];
      if(card.content&&card.content.startsWith('ml2_card_img_')){
        try{
          if(window.localforage){
            await window.localforage.removeItem(card.content);
          }
        }catch(e){}
      }
    }
    globalCards=globalCards.filter(function(c){return c.category!=='image'});
    await saveGlobalCardsDebounced();
    renderCardList();
    toast('已清空');
  }
});

function playVoiceMsg(btn){
  var src=btn.dataset.src;
  if(!src)return;
  var player=btn.closest('.voice-message-player');
  var bars=player.querySelectorAll('.voice-wave-bars span');
  bars.forEach(function(bar){bar.style.animationPlayState='running';});
  btn.textContent='⏸';
  var audio=new Audio(src);
  audio.onended=function(){
    bars.forEach(function(bar){bar.style.animationPlayState='paused';});
    btn.textContent='▶';
  };
  audio.play();
}

// ---------- Speed Settings ----------
var speedSettings={
  'rs-min':{key:'rs_min',default:1,min:1,max:600,step:1,val:'rs-min-val'},
  'rs-max':{key:'rs_max',default:40,min:1,max:600,step:1,val:'rs-max-val'},
  'py-en':{key:'py_en',default:1,min:0,max:1,step:1,val:'py-en'},
  'py-prob':{key:'py_prob',default:50,min:0,max:100,step:5,format:function(v){return v+'%'},val:'prob-val'},
  'py-min':{key:'py_min',default:2,min:1,max:15,step:1,val:'min-val'},
  'py-max':{key:'py_max',default:5,min:1,max:15,step:1,val:'max-val'},
  'dnd-en':{key:'dnd_en',default:0,min:0,max:1,step:1,val:'dnd-en'},
  'as-en':{key:'as_en',default:1,min:0,max:1,step:1,val:'as-en'},
  'as-prob':{key:'as_prob',default:10,min:0,max:100,step:5,val:'as-prob-val'},
  'as-min':{key:'as_min',default:5,min:1,max:600,step:1,val:'as-min-val'},
  'as-max':{key:'as_max',default:10,min:1,max:60,step:1,val:'as-max-val'},
  'as-count':{key:'as_count',default:1,min:1,max:5,step:1,val:'as-count-val'},
  'as-count-min':{key:'as_count_min',default:1,min:1,max:20,step:1,val:'as-count-min-val'},
  'as-count-max':{key:'as_count_max',default:1,min:1,max:20,step:1,val:'as-count-max-val'},
  'reply-min':{key:'reply_min',default:1,min:1,max:10,step:1,val:'reply-min-val'},
  'reply-max':{key:'reply_max',default:2,min:1,max:10,step:1,val:'reply-max-val'},
  'rn-prob':{key:'rn_prob',default:20,min:0,max:100,step:5,val:'rn-prob-val'},
  'rc-prob':{key:'rc_prob',default:5,min:0,max:100,step:1,val:'rc-prob-val'},
  'quote-prob':{key:'quote_prob',default:5,min:0,max:100,step:1,val:'quote-prob-val'},
  'sticker-prob':{key:'sticker_prob',default:10,min:0,max:100,step:1,val:'sticker-prob-val'},
  'image-prob':{key:'image_prob',default:5,min:0,max:100,step:1,val:'image-prob-val'},
  'voice-prob':{key:'voice_prob',default:10,min:0,max:100,step:1,val:'voice-prob-val'},
  'touch-prob':{key:'touch_prob',default:5,min:0,max:100,step:1,val:'touch-prob-val'},
  'emoji-prob':{key:'emoji_prob',default:5,min:0,max:100,step:1,val:'emoji-prob-val'},
  'kaomoji-prob':{key:'kaomoji_prob',default:5,min:0,max:100,step:1,val:'kaomoji-prob-val'},
  'star-en':{key:'star_en',default:1,min:0,max:1,step:1,val:'star-en'},
  'enter-send':{key:'enter_send',default:1,min:0,max:1,step:1,val:'enter-send'},
  
  'ld-max-cards':{key:'ld_max_cards',default:100,min:1,max:500,step:10,val:'ld-max-cards-val'},
  'ld-write-prob':{key:'ld_write_prob',default:30,min:0,max:100,step:5,val:'ld-write-prob-val'},
  'ld-write-min':{key:'ld_write_min',default:1,min:1,max:1440,step:1,val:'ld-write-min-val'},
  'ld-write-max':{key:'ld_write_max',default:480,min:1,max:1440,step:60,val:'ld-write-max-val'},
  'ld-reply-prob':{key:'ld_reply_prob',default:80,min:0,max:100,step:5,val:'ld-reply-prob-val'},
  'ld-reply-min':{key:'ld_reply_min',default:1,min:1,max:1440,step:1,val:'ld-reply-min-val'},
  'ld-reply-max':{key:'ld_reply_max',default:480,min:1,max:1440,step:60,val:'ld-reply-max-val'},
  'ld-kaomoji-en':{key:'ld_kaomoji_en',default:1,min:0,max:1,step:1,val:'ld-kaomoji-en'},
  'ld-emoji-en':{key:'ld_emoji_en',default:1,min:0,max:1,step:1,val:'ld-emoji-en'},
  'ld-sticker-en':{key:'ld_sticker_en',default:1,min:0,max:1,step:1,val:'ld-sticker-en'},
  'ni-min':{key:'ni_min',default:1,min:1,max:86400,step:1,val:'ni-min-val'},
  'ni-max':{key:'ni_max',default:86400,min:1,max:86400,step:60,val:'ni-max-val'}
};
function getSpeed(k,contactId,skipGroupFallback){
  var m=speedSettings[k];
  if(!m)return 0;
  var s=ls('ml2_speed');
  if(!s)s={};
  var val=null;
  
  if(contactId&&s.contacts&&s.contacts[contactId]){
    val=s.contacts[contactId][m.key];
  }
  
  if((val===null||val===undefined)&&contactId&&!skipGroupFallback){
    var group=groups.find(function(g){return g.memberIds&&g.memberIds.indexOf(contactId)>=0});
    if(group&&s.groupMembers&&s.groupMembers[group.id]&&s.groupMembers[group.id][contactId]){
      val=s.groupMembers[group.id][contactId][m.key];
    }
  }
  
  if(val===null||val===undefined){
    val=s[m.key];
  }
  
  if(val===null||val===undefined){
    val=m.default;
  }
  
  return val;
}
function saveSpeedSettings(){
  var s=ls('ml2_speed');
  if(!s)s={};
  var contactSelect=$('speed-contact-select')||$('letter-contact-select');
  var contactId=contactSelect?contactSelect.value:null;
  
  if(contactId==='__all__'){
    // 选择"所有联系人"时：保存到全局设置（作为所有联系人的默认值）
    Object.keys(speedSettings).forEach(function(k){
      var m=speedSettings[k];
      var el;
      var IS_CHECKBOX=k==='py-en'||k==='star-en'||k==='enter-send'||k==='as-en'||k==='dnd-en'||k==='ld-kaomoji-en'||k==='ld-emoji-en'||k==='ld-sticker-en';
      if(IS_CHECKBOX){
        el=$(m.val);
        if(el)s[m.key]=el.checked?1:0;
      }else{
        el=document.getElementById(m.val);
        if(el)s[m.key]=parseInt(el.value);
      }
    });
  }else if(contactId){
    // 选中具体联系人时：只保存到该联系人的独立设置，不改全局
    if(!s.contacts)s.contacts={};
    if(!s.contacts[contactId])s.contacts[contactId]={};
    Object.keys(speedSettings).forEach(function(k){
      var m=speedSettings[k];
      var el;
      var IS_CHECKBOX=k==='py-en'||k==='star-en'||k==='enter-send'||k==='as-en'||k==='dnd-en'||k==='ld-kaomoji-en'||k==='ld-emoji-en'||k==='ld-sticker-en';
      if(IS_CHECKBOX){
        el=$(m.val);
        if(el)s.contacts[contactId][m.key]=el.checked?1:0;
      }else{
        el=document.getElementById(m.val);
        if(el)s.contacts[contactId][m.key]=parseInt(el.value);
      }
    });
  }else{
    // 未选中联系人时：保存到全局设置（作为所有联系人的默认值）
    Object.keys(speedSettings).forEach(function(k){
      var m=speedSettings[k];
      var el;
      var IS_CHECKBOX=k==='py-en'||k==='star-en'||k==='enter-send'||k==='as-en'||k==='dnd-en'||k==='ld-kaomoji-en'||k==='ld-emoji-en'||k==='ld-sticker-en';
      if(IS_CHECKBOX){
        el=$(m.val);
        if(el)s[m.key]=el.checked?1:0;
      }else{
        el=document.getElementById(m.val);
        if(el)s[m.key]=parseInt(el.value);
      }
    });
  }
  
  ls('ml2_speed',s);
  toast('设置已保存');
}
function syncSpeedUI(){var contactSelect=$('speed-contact-select')||$('letter-contact-select');var contactId=contactSelect?contactSelect.value:null;Object.keys(speedSettings).forEach(function(k){var m=speedSettings[k];var IS_CHECKBOX=k==='py-en'||k==='star-en'||k==='enter-send'||k==='as-en'||k==='dnd-en'||k==='ld-kaomoji-en'||k==='ld-emoji-en'||k==='ld-sticker-en';if(IS_CHECKBOX){var el=$(m.val);if(el)el.checked=getSpeed(k,contactId)===1}else{var el=document.getElementById(m.val);if(el)el.value=getSpeed(k,contactId)}})}
function applySpeedToAllContacts(){
  var activeLetterOv=$('ov-letter-settings');
  var activeSpeedOv=$('ov-speed-settings');
  var letterVisible=activeLetterOv&&activeLetterOv.style.display!=='none';
  var speedVisible=activeSpeedOv&&activeSpeedOv.style.display!=='none';
  var contactSelect;
  if(letterVisible&&!speedVisible){
    contactSelect=$('letter-contact-select');
  }else{
    contactSelect=$('speed-contact-select')||$('letter-contact-select');
  }
  var contactId=contactSelect?contactSelect.value:null;
  // ★ 修复：contactId 为空（默认"全部联系人"）时不再报"请先选择联系人"，直接视为应用到全部
  if(!contactId)contactId='__all__';
  
  var s=ls('ml2_speed');
  if(!s)s={};
  var currentSettings={};
  Object.keys(speedSettings).forEach(function(k){
    var m=speedSettings[k];
    var el;
    var IS_CHECKBOX=k==='py-en'||k==='star-en'||k==='enter-send'||k==='as-en'||k==='dnd-en'||k==='ld-kaomoji-en'||k==='ld-emoji-en'||k==='ld-sticker-en';
    if(IS_CHECKBOX){
      el=$(m.val);
      if(el)currentSettings[m.key]=el.checked?1:0;
    }else{
      el=document.getElementById(m.val);
      if(el)currentSettings[m.key]=parseInt(el.value);
    }
  });
  
  if(contactId==='__all__'&&!letterVisible){
    if(!confirm('确定将当前设置保存为全局默认值吗？所有联系人将使用这些设置。'))return;
    Object.keys(currentSettings).forEach(function(key){
      s[key]=currentSettings[key];
    });
    // 清除所有联系人的独立设置
    if(s.contacts){
      s.contacts={};
    }
    ls('ml2_speed',s);
    toast('已保存为全局默认值');
  }else{
    if(!confirm('确定将当前联系人的设置应用到所有联系人吗？'))return;
    if(!s.contacts)s.contacts={};
    var contacts=ls('ml2_c')||[];
    contacts.forEach(function(c){
      if(c.id===contactId)return;
      s.contacts[c.id]=JSON.parse(JSON.stringify(currentSettings));
    });
    ls('ml2_speed',s);
    toast('已应用到所有联系人');
  }
}
function openDndSettings(){
  var dndEn=getSpeed('dnd-en',null);
  var el=$('dnd-en-page');
  if(el)el.checked=dndEn===1;
  var s=ls('ml2_speed')||{};
  var dndBlockCall=document.getElementById('dnd-block-call-page');
  if(dndBlockCall)dndBlockCall.checked=s.dnd_block_call===1;
  showPg('pg-dnd-settings');
}
function saveDndSettings(){
  var el=$('dnd-en-page');
  var dndEn=el?el.checked?1:0:0;
  var s=ls('ml2_speed')||{contacts:{}};
  s.dnd_en=dndEn;
  var dndBlockCallEl=document.getElementById('dnd-block-call-page');
  var dndBlockCall=dndBlockCallEl?(dndBlockCallEl.checked?1:0):0;
  s.dnd_block_call=dndBlockCall;
  ls('ml2_speed',s);
  if(window.localforage)localforage.setItem('ml2_speed',s).catch(function(){});
  toast(dndEn===1?'已开启免打扰模式':'已关闭免打扰模式');
}
function populateContactSelect(selectId){var sel=$(selectId);if(!sel)return;sel.innerHTML='';var allOpt=document.createElement('option');allOpt.value='__all__';allOpt.textContent='所有联系人';sel.appendChild(allOpt);contacts.forEach(function(c){var opt=document.createElement('option');opt.value=c.id;opt.textContent=c.name;sel.appendChild(opt)});}
function openSpeedSettings(){populateContactSelect('speed-contact-select');$('speed-contact-select').value='__all__';syncSpeedUI();showOv('ov-speed')}
function showLetterSettings(){populateContactSelect('letter-contact-select');$('letter-contact-select').value='__all__';syncSpeedUI();showOv('ov-letter-settings')}
function openNonInstantSettings(){renderNonInstantSettings();showPg('pg-noninstant-settings')}
if($('noninstant-settings-back'))$('noninstant-settings-back').addEventListener('click',function(){saveNonInstantSettings();showPg('pg-my');toast('设置已保存')});
$('noninstant-contact-select')&&$('noninstant-contact-select').addEventListener('change',selectNonInstantSettingsContact);

function renderNonInstantSettings(){
  var sel=$('noninstant-contact-select');
  var content=$('noninstant-settings-content');
  if(!sel||!content)return;
  sel.innerHTML='';
  content.style.display='none';
  content.innerHTML='';
  contacts.forEach(function(c){
    var opt=document.createElement('option');
    opt.value=c.id;
    opt.textContent=c.name;
    sel.appendChild(opt);
  });
  if(contacts.length>0){
    sel.value=contacts[0].id;
    selectNonInstantSettingsContact();
  }
}

function selectNonInstantSettingsContact(){
  var sel=$('noninstant-contact-select');
  var content=$('noninstant-settings-content');
  if(!sel||!content)return;
  var contactId=sel.value;
  if(!contactId){
    content.style.display='none';
    content.innerHTML='';
    return;
  }
  var c=contacts.find(function(x){return x.id===contactId});
  if(!c)return;
  var s=ls('ml2_speed')||{};
  var cSettings=s.contacts&&s.contacts[c.id]?s.contacts[c.id]:{};
  
  var minVal=cSettings['ni_min']!==undefined?cSettings['ni_min']:1;
  var maxVal=cSettings['ni_max']!==undefined?cSettings['ni_max']:86400;
  var minHours=minVal<60?minVal+'秒':(minVal<3600?(minVal/60).toFixed(0)+'分钟':(minVal/3600).toFixed(1)+'小时');
  var maxHours=maxVal<60?maxVal+'秒':(maxVal<3600?(maxVal/60).toFixed(0)+'分钟':(maxVal/3600).toFixed(1)+'小时');
  
  var replyMin=cSettings['ni-reply-min']!==undefined?cSettings['ni-reply-min']:1;
  var replyMax=cSettings['ni-reply-max']!==undefined?cSettings['ni-reply-max']:5;
  
  var pyEn=cSettings['ni-py-en']!==undefined?cSettings['ni-py-en']:1;
  var pyMin=cSettings['ni-py-min']!==undefined?cSettings['ni-py-min']:2;
  var pyMax=cSettings['ni-py-max']!==undefined?cSettings['ni-py-max']:8;
  var pyProb=cSettings['ni-py-prob']!==undefined?cSettings['ni-py-prob']:50;
  
  var enterSend=cSettings['ni-enter-send']!==undefined?cSettings['ni-enter-send']:1;
  
  var av=c.avatar||'?';
  content.innerHTML='<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:linear-gradient(135deg,rgba(0,150,255,0.08),rgba(0,150,255,0.03));border-radius:12px;margin-bottom:16px;border:1px solid rgba(0,150,255,0.15);"><div class="cav" style="width:40px;height:40px">'+av+'</div><div style="flex:1;font-weight:600;font-size:15px;color:var(--txt);">'+c.name+'</div><span style="font-size:11px;color:var(--accent);background:rgba(0,150,255,0.1);padding:3px 10px;border-radius:10px;">非即时传讯</span></div>'+
    '<div style="margin-bottom:16px;padding:12px;background:var(--c2);border-radius:10px;">'+
    '<div style="font-size:13px;color:var(--txt);margin-bottom:10px;font-weight:600">回复时间范围</div>'+
    '<div class="set-row"><span>最短回复时间</span><div class="stepper" data-k="ni-min-'+c.id+'"><button>−</button><input type="number" class="noninstant-sv" data-contact="'+c.id+'" data-key="ni_min" value="'+minVal+'"><button>+</button></div><span style="font-size:12px;color:var(--txt3);margin-left:4px">秒</span></div>'+
    '<div class="set-row"><span>最长回复时间</span><div class="stepper" data-k="ni-max-'+c.id+'"><button>−</button><input type="number" class="noninstant-sv" data-contact="'+c.id+'" data-key="ni_max" value="'+maxVal+'"><button>+</button></div><span style="font-size:12px;color:var(--txt3);margin-left:4px">秒</span></div>'+
    '<div style="margin-top:8px;font-size:11px;color:var(--txt3);text-align:right">约 '+minHours+' ~ '+maxHours+'</div>'+
    '</div>'+
    '<div style="margin-bottom:16px;padding:12px;background:var(--c2);border-radius:10px;">'+
    '<div style="font-size:13px;color:var(--txt);margin-bottom:10px;font-weight:600">回复消息条数</div>'+
    '<div class="set-row"><span style="color:var(--txt3);font-size:12px;">当我发送1条消息，联系人每次回复消息条数</span></div>'+
    '<div class="set-row"><span>最少</span><div class="stepper" data-k="ni-reply-min-'+c.id+'"><button>−</button><input type="number" class="noninstant-sv" data-contact="'+c.id+'" data-key="ni-reply-min" value="'+replyMin+'"><button>+</button></div><span style="font-size:12px;color:var(--txt3);margin-left:4px">条</span></div>'+
    '<div class="set-row"><span>最多</span><div class="stepper" data-k="ni-reply-max-'+c.id+'"><button>−</button><input type="number" class="noninstant-sv" data-contact="'+c.id+'" data-key="ni-reply-max" value="'+replyMax+'"><button>+</button></div><span style="font-size:12px;color:var(--txt3);margin-left:4px">条</span></div>'+
    '</div>'+
    '<div style="margin-bottom:16px;padding:12px;background:var(--c2);border-radius:10px;">'+
    '<div style="font-size:13px;color:var(--txt);margin-bottom:10px;font-weight:600">多字卡设置</div>'+
    '<div style="font-size:11px;color:var(--txt3);margin-bottom:8px;">联系人回复的每条聊天消息使用多条字卡（每个字卡中间空一格）</div>'+
    '<div class="set-row"><span>开启</span><label class="tsw"><input type="checkbox" class="noninstant-cb" data-contact="'+c.id+'" data-key="ni-py-en"'+(pyEn===1?' checked':'')+'><span class="sl"></span></label></div>'+
    '<div class="set-row"><span>概率</span><div class="stepper" data-k="ni-py-prob-'+c.id+'"><button>−</button><input type="number" class="noninstant-sv" data-contact="'+c.id+'" data-key="ni-py-prob" value="'+pyProb+'"><button>+</button></div><span style="font-size:12px;color:var(--txt3);margin-left:4px">%</span></div>'+
    '<div class="set-row"><span>最少字卡</span><div class="stepper" data-k="ni-py-min-'+c.id+'"><button>−</button><input type="number" class="noninstant-sv" data-contact="'+c.id+'" data-key="ni-py-min" value="'+pyMin+'"><button>+</button></div></div>'+
    '<div class="set-row"><span>最多字卡</span><div class="stepper" data-k="ni-py-max-'+c.id+'"><button>−</button><input type="number" class="noninstant-sv" data-contact="'+c.id+'" data-key="ni-py-max" value="'+pyMax+'"><button>+</button></div></div>'+
    '</div>'+
    '<div style="margin-bottom:16px;padding:12px;background:var(--c2);border-radius:10px;">'+
    '<div style="font-size:13px;color:var(--txt);margin-bottom:10px;font-weight:600">发送设置</div>'+
    '<div class="set-row"><span>回车键发送消息</span><label class="tsw"><input type="checkbox" class="noninstant-cb" data-contact="'+c.id+'" data-key="ni-enter-send"'+(enterSend===1?' checked':'')+'><span class="sl"></span></label></div>'+
    '</div>';
  content.style.display='block';
  bindNonInstantSteppers();
}

function bindNonInstantSteppers(){
  document.querySelectorAll('#noninstant-settings-content .stepper').forEach(function(s){
    var btnMinus=s.querySelector('button:first-child');
    var btnPlus=s.querySelector('button:last-child');
    var input=s.querySelector('input');
    btnMinus.addEventListener('click',function(){
      var val=parseInt(input.value)||0;
      if(val>0)input.value=val-1;
      input.dispatchEvent(new Event('change'));
    });
    btnPlus.addEventListener('click',function(){
      var val=parseInt(input.value)||0;
      input.value=val+1;
      input.dispatchEvent(new Event('change'));
    });
  });
}

function saveNonInstantSettings(){
  var s=ls('ml2_speed')||{};
  if(!s.contacts)s.contacts={};
  document.querySelectorAll('.noninstant-sv').forEach(function(input){
    var contactId=input.getAttribute('data-contact');
    var key=input.getAttribute('data-key');
    var val=parseInt(input.value)||0;
    if(!s.contacts[contactId])s.contacts[contactId]={};
    s.contacts[contactId][key]=val;
  });
  document.querySelectorAll('.noninstant-cb').forEach(function(cb){
    var contactId=cb.getAttribute('data-contact');
    var key=cb.getAttribute('data-key');
    var val=cb.checked?1:0;
    if(!s.contacts[contactId])s.contacts[contactId]={};
    s.contacts[contactId][key]=val;
  });
  ls('ml2_speed',s);
}
var currentGroupSpeedGroupId=null;

function openGroupSpeedSettings(){
  var group=groups.find(function(g){return g.id===cid});
  if(!group){toast('未找到群聊');return}
  currentGroupSpeedGroupId=group.id;
  var sel=$('group-speed-contact-select');
  if(!sel)return;
  sel.innerHTML='';
  group.memberIds.forEach(function(memberId){
    var contact=contacts.find(function(c){return c.id===memberId});
    if(!contact)return;
    var opt=document.createElement('option');
    opt.value=contact.id;
    opt.textContent=contact.name;
    sel.appendChild(opt);
  });
  if(group.memberIds.length>0){
    sel.value=group.memberIds[0];
  }
  syncGroupSpeedUI();
  showOv('ov-group-speed');
}

function syncGroupSpeedUI(){
  var sel=$('group-speed-contact-select');
  if(!sel)return;
  var memberId=sel.value;
  var s=ls('ml2_speed')||{};
  var groupSettings=s.groupMembers&&s.groupMembers[currentGroupSpeedGroupId]&&s.groupMembers[currentGroupSpeedGroupId][memberId]||{};
  
  var fields=[
    {key:'rs_min',id:'gs-rs-min-val',default:1},
    {key:'rs_max',id:'gs-rs-max-val',default:84},
    {key:'py_en',id:'gs-py-en',isCheckbox:true,default:1},
    {key:'py_prob',id:'gs-prob-val',default:50},
    {key:'py_min',id:'gs-min-val',default:2},
    {key:'py_max',id:'gs-max-val',default:5},
    {key:'as_en',id:'gs-as-en',isCheckbox:true,default:1},
    {key:'as_prob',id:'gs-as-prob-val',default:10},
    {key:'as_min',id:'gs-as-min-val',default:5},
    {key:'as_max',id:'gs-as-max-val',default:10},
    {key:'rn_prob',id:'gs-rn-prob-val',default:20},
    {key:'rc_prob',id:'gs-rc-prob-val',default:5},
    {key:'quote_prob',id:'gs-quote-prob-val',default:5},
    {key:'sticker_prob',id:'gs-sticker-prob-val',default:10},
    {key:'image_prob',id:'gs-image-prob-val',default:5},
    {key:'voice_prob',id:'gs-voice-prob-val',default:10},
    {key:'touch_prob',id:'gs-touch-prob-val',default:5},
    {key:'emoji_prob',id:'gs-emoji-prob-val',default:5}
  ];
  
  fields.forEach(function(f){
    var el=document.getElementById(f.id);
    if(!el)return;
    var val=groupSettings[f.key];
    if(val===undefined||val===null)val=f.default;
    if(f.isCheckbox){
      el.checked=val===1;
    }else{
      el.value=val;
    }
  });
}

function saveGroupSpeedSettings(){
  var sel=$('group-speed-contact-select');
  if(!sel)return;
  var memberId=sel.value;
  var s=ls('ml2_speed')||{};
  if(!s.groupMembers)s.groupMembers={};
  if(!s.groupMembers[currentGroupSpeedGroupId])s.groupMembers[currentGroupSpeedGroupId]={};
  if(!s.groupMembers[currentGroupSpeedGroupId][memberId])s.groupMembers[currentGroupSpeedGroupId][memberId]={};
  
  var fields=[
    {key:'rs_min',id:'gs-rs-min-val',isCheckbox:false},
    {key:'rs_max',id:'gs-rs-max-val',isCheckbox:false},
    {key:'py_en',id:'gs-py-en',isCheckbox:true},
    {key:'py_prob',id:'gs-prob-val',isCheckbox:false},
    {key:'py_min',id:'gs-min-val',isCheckbox:false},
    {key:'py_max',id:'gs-max-val',isCheckbox:false},
    {key:'as_en',id:'gs-as-en',isCheckbox:true},
    {key:'as_prob',id:'gs-as-prob-val',isCheckbox:false},
    {key:'as_min',id:'gs-as-min-val',isCheckbox:false},
    {key:'as_max',id:'gs-as-max-val',isCheckbox:false},
    {key:'rn_prob',id:'gs-rn-prob-val',isCheckbox:false},
    {key:'rc_prob',id:'gs-rc-prob-val',isCheckbox:false},
    {key:'quote_prob',id:'gs-quote-prob-val',isCheckbox:false},
    {key:'sticker_prob',id:'gs-sticker-prob-val',isCheckbox:false},
    {key:'image_prob',id:'gs-image-prob-val',isCheckbox:false},
    {key:'voice_prob',id:'gs-voice-prob-val',isCheckbox:false},
    {key:'touch_prob',id:'gs-touch-prob-val',isCheckbox:false},
    {key:'emoji_prob',id:'gs-emoji-prob-val',isCheckbox:false}
  ];
  
  fields.forEach(function(f){
    var el=document.getElementById(f.id);
    if(!el)return;
    if(f.isCheckbox){
      s.groupMembers[currentGroupSpeedGroupId][memberId][f.key]=el.checked?1:0;
    }else{
      s.groupMembers[currentGroupSpeedGroupId][memberId][f.key]=parseInt(el.value)||0;
    }
  });
  
  ls('ml2_speed',s);
}

if($('close-speed'))$('close-speed').addEventListener('click',function(){saveSpeedSettings();hideOv('ov-speed');toast('设置已保存')});
if($('close-letter-settings'))$('close-letter-settings').addEventListener('click',function(){saveSpeedSettings();hideOv('ov-letter-settings');toast('设置已保存')});
if($('py-en'))$('py-en').addEventListener('change',function(){saveSpeedSettings();toast(this.checked?'拼字卡功能已开启':'拼字卡功能已关闭')});
if($('as-en'))$('as-en').addEventListener('change',function(){saveSpeedSettings();toast(this.checked?'主动发送消息已开启':'主动发送消息已关闭')});
if($('star-en'))$('star-en').addEventListener('change',function(){saveSpeedSettings();toast(this.checked?'星星标识已开启':'星星标识已关闭')});
if($('enter-send'))$('enter-send').addEventListener('change',function(){saveSpeedSettings();toast(this.checked?'回车键发送已开启':'回车键发送已关闭')});
document.querySelectorAll('.stepper').forEach(function(st){var k=st.dataset.k,m=speedSettings[k];if(!m||!m.val)return;var el=document.getElementById(m.val);if(!el)return;st.children[0].addEventListener('click',function(){var cur=parseInt(el.value)||m.min,nxt=Math.max(m.min,cur-m.step);el.value=nxt;saveSpeedSettings()});st.children[2].addEventListener('click',function(){var cur=parseInt(el.value)||m.min,nxt=Math.min(m.max,cur+m.step);el.value=nxt;saveSpeedSettings()});el.addEventListener('input',function(){var val=parseInt(this.value);if(isNaN(val))val=m.min;val=Math.max(m.min,Math.min(m.max,val));this.value=val;saveSpeedSettings()})});
// 朋友圈设置stepper通用处理
document.querySelectorAll('#ov-moments-settings .stepper').forEach(function(st){
  var input=st.querySelector('input.sv');
  if(!input)return;
  var btnMinus=st.children[0];
  var btnPlus=st.children[2];
  if(btnMinus){
    btnMinus.addEventListener('click',function(){var v=parseInt(input.value)||0;if(v>0)input.value=v-1;});
    btnMinus.addEventListener('touchend',function(e){e.preventDefault();var v=parseInt(input.value)||0;if(v>0)input.value=v-1;});
  }
  if(btnPlus){
    btnPlus.addEventListener('click',function(){var v=parseInt(input.value)||0;input.value=v+1;});
    btnPlus.addEventListener('touchend',function(e){e.preventDefault();var v=parseInt(input.value)||0;input.value=v+1;});
  }
});

// ---------- Toast ----------
var _toastTimer=null;
function toast(t){if(_toastTimer){clearTimeout(_toastTimer);var old=document.querySelector('.toast');if(old)old.remove()}var el=document.createElement('div');el.className='toast';el.textContent=t;document.body.appendChild(el);_toastTimer=setTimeout(function(){if(el.parentNode)el.remove();_toastTimer=null},1900)}
function escapeHTML(s){if(!s)return'';var d=document.createElement('div');d.textContent=s;return d.innerHTML}
function showSurveyDetail(idx){if(!SurveyApp)return;SurveyApp._loadRecords().then(function(records){if(!records||idx<0||idx>=records.length)return;var r=records[idx];var html='<div style="font-size:16px;font-weight:600;color:#333;margin-bottom:12px;">'+escapeHTML(r.title||'无标题')+'</div>';html+='<div style="font-size:12px;color:#888;margin-bottom:16px;">'+r.contactName+' · '+r.time+'</div>';r.questions.forEach(function(q,i){html+='<div style="padding:12px;background:#f8f9fa;border-radius:8px;margin-bottom:8px;">';html+='<div style="font-size:14px;font-weight:600;color:#333;margin-bottom:6px;">Q'+(i+1)+': '+escapeHTML(q.text)+'</div>';var a=r.answers&&r.answers[i];
// ★ 兼容多种答案格式：answer / value / 字符串
var ansVal='';
if(a){
  if(typeof a==='string')ansVal=a;
  else if(a.answer!=null)ansVal=a.answer;
  else if(a.value!=null)ansVal=a.value;
}
// ★ 旧版遗留的 (未回答) 占位符视为未作答
if(ansVal==='(未回答)'||ansVal==='未回答')ansVal='';
var isAns=!!ansVal;
if(q.options&&q.options.length>0&&isAns&&q.options.some(function(o){return o.trim()===ansVal.trim()})){
  html+='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;">';
  q.options.forEach(function(opt){
    var sel=ansVal.trim()===opt.trim();
    html+='<div style="padding:6px 14px;border-radius:20px;border:1px solid '+(sel?'#333333':'#ddd')+';background:'+(sel?'#333333':'#f0f0f0')+';color:'+(sel?'#fff':'#333')+';font-size:13px;'+(sel?'font-weight:600;':'')+'">'+escapeHTML(opt)+(sel?' ✓':'')+'</div>';
  });
  html+='</div>';
}else if(q.options&&q.options.length>0&&!isAns){
  html+='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;">';
  q.options.forEach(function(opt){
    html+='<div style="padding:6px 14px;border-radius:20px;border:1px solid #ddd;background:#f0f0f0;color:#333;font-size:13px;">'+escapeHTML(opt)+'</div>';
  });
  html+='</div>';
  html+='<div style="font-size:12px;color:#aaa;margin-top:4px;">未作答</div>';
}else{
  html+='<div style="font-size:13px;color:#666;">A: '+escapeHTML(isAns?ansVal:'未作答')+'</div>';
}
html+='</div>'});$('survey-detail-content').innerHTML=html;showOv('ov-survey-detail')})}
// 触感反馈（移动端）
function haptic(type){
  try{
    if(!navigator.vibrate)return;
    var p={light:10,medium:20,heavy:40,success:[10,30,10],warn:[20,40,20]}[type]||10;
    navigator.vibrate(p);
  }catch(e){}
}
function customConfirm(msg){
  return new Promise(function(resolve){
    var _done=false;
    function finish(val){
      if(_done)return;
      _done=true;
      if(ov.parentNode)document.body.removeChild(ov);
      resolve(val);
    }
    var ov=document.createElement('div');
    ov.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.6);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';
    var modal=document.createElement('div');
    modal.style.cssText='background:#fff;border-radius:16px;padding:24px;max-width:320px;width:100%;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,.2);';
    var m=document.createElement('div');
    m.textContent=msg;m.style.cssText='font-size:15px;color:var(--txt);margin-bottom:20px;line-height:1.6;';
    var btns=document.createElement('div');
    btns.style.cssText='display:flex;gap:12px;';
    var cancel=document.createElement('button');
    cancel.textContent='取消';cancel.style.cssText='flex:1;padding:12px 20px;border:none;border-radius:10px;background:var(--c2);color:var(--txt2);font-size:15px;cursor:pointer;min-height:44px;-webkit-tap-highlight-color:transparent;';
    var ok=document.createElement('button');
    ok.textContent='确定';ok.style.cssText='flex:1;padding:12px 20px;border:none;border-radius:10px;background:var(--accent);color:#fff;font-size:15px;cursor:pointer;min-height:44px;-webkit-tap-highlight-color:transparent;';
    btns.appendChild(cancel);btns.appendChild(ok);
    modal.appendChild(m);modal.appendChild(btns);
    ov.appendChild(modal);document.body.appendChild(ov);
    // ★ 防抖：同一操作只生效一次（避免 touch + click 双触发）
    ov.addEventListener('click',function(e){if(e.target===ov)finish(false);});
    cancel.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();finish(false);});
    ok.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();finish(true);});
    // touch 事件（移动端）：结束后触发一次，配合 click 防抖
    cancel.addEventListener('touchend',function(e){e.preventDefault();e.stopPropagation();finish(false);});
    ok.addEventListener('touchend',function(e){e.preventDefault();e.stopPropagation();finish(true);});
    cancel.addEventListener('touchstart',function(e){e.preventDefault();});
    ok.addEventListener('touchstart',function(e){e.preventDefault();});
  });
}
function customPrompt(msg,defaultValue){
  return new Promise(function(resolve){
    var ov=document.createElement('div');
    ov.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:99999;display:flex;align-items:center;justify-content:center;';
    var modal=document.createElement('div');
    modal.style.cssText='background:#fff;border-radius:12px;padding:20px;max-width:300px;width:80%;box-shadow:0 4px 20px rgba(0,0,0,.15);';
    var m=document.createElement('div');
    m.textContent=msg;m.style.cssText='font-size:14px;color:var(--txt);margin-bottom:12px;line-height:1.5;';
    var inp=document.createElement('input');
    inp.type='text';
    inp.value=defaultValue||'';
    inp.style.cssText='width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:14px;color:var(--txt);box-sizing:border-box;margin-bottom:16px;';
    var btns=document.createElement('div');
    btns.style.cssText='display:flex;gap:8px;';
    var cancel=document.createElement('button');
    cancel.textContent='取消';cancel.style.cssText='flex:1;padding:10px;border:none;border-radius:8px;background:var(--c3);color:var(--txt2);font-size:14px;cursor:pointer;';
    var ok=document.createElement('button');
    ok.textContent='确定';ok.style.cssText='flex:1;padding:10px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:14px;cursor:pointer;';
    btns.appendChild(cancel);btns.appendChild(ok);
    modal.appendChild(m);modal.appendChild(inp);modal.appendChild(btns);
    ov.appendChild(modal);document.body.appendChild(ov);
    inp.focus();
    ov.addEventListener('touchend',function(e){if(e.target===ov){e.preventDefault();document.body.removeChild(ov);resolve(undefined)}});
    cancel.onclick=function(){document.body.removeChild(ov);resolve(undefined)};
    cancel.ontouchend=function(e){e.preventDefault();document.body.removeChild(ov);resolve(undefined)};
    ok.onclick=function(){document.body.removeChild(ov);resolve(inp.value)};
    ok.ontouchend=function(e){e.preventDefault();document.body.removeChild(ov);resolve(inp.value)};
  });
}


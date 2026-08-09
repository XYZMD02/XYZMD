// ========== 默认通用字卡 ==========
var defaultCommonEnabled=false;
var defaultCommonAllContacts=false;
var defaultCommonCurrentCat='main';
var defaultCommonDisabledGroups={};
var defaultCommonCollapsedGroups={};
var defaultCommonProbs={main:30,kaomoji:30,emoji:30,touch:30};
var defaultCommonOverallProb=30; // ★ 默认字卡整体出现概率（0-100）
var defaultCommonUseChat=true;
var defaultCommonUseLetter=false;
var defaultCommonUseMoments=false;
var defaultCommonUseCalendar=false;
var defaultCommonUseSurvey=false; // ★ 默认通用字卡：调查问卷可使用

function loadDefaultCommonSettings(){
  var saved=ls('ml2_default_common_settings');
  if(saved&&typeof saved==='object'){
    defaultCommonEnabled=saved.enabled||false;
    defaultCommonAllContacts=defaultCommonEnabled;
    defaultCommonDisabledGroups=saved.disabledGroups||{};
    defaultCommonCollapsedGroups=saved.collapsedGroups||{};
    // ★ 整体出现概率（默认字卡整体是否触发，0-100）
    defaultCommonOverallProb=saved.overallProb!=null?saved.overallProb:30;
    if(saved.probs&&typeof saved.probs==='object'){
      defaultCommonProbs.main=saved.probs.main!=null?saved.probs.main:30;
      defaultCommonProbs.kaomoji=saved.probs.kaomoji!=null?saved.probs.kaomoji:30;
      defaultCommonProbs.emoji=saved.probs.emoji!=null?saved.probs.emoji:30;
      defaultCommonProbs.touch=saved.probs.touch!=null?saved.probs.touch:30;
    }else if(saved.prob!=null){
      defaultCommonProbs.main=saved.prob;
      defaultCommonProbs.kaomoji=saved.prob;
      defaultCommonProbs.emoji=saved.prob;
      defaultCommonProbs.touch=saved.prob;
    }
    defaultCommonUseChat=saved.useChat!==undefined?saved.useChat:true;
    defaultCommonUseLetter=saved.useLetter||false;
    defaultCommonUseMoments=saved.useMoments||false;
    defaultCommonUseCalendar=saved.useCalendar||false;
    defaultCommonUseSurvey=saved.useSurvey||false; // ★ 调查问卷可使用
  }
}

function saveDefaultCommonSettings(){
  ls('ml2_default_common_settings',{
    enabled:defaultCommonEnabled,
    allContacts:defaultCommonAllContacts,
    disabledGroups:defaultCommonDisabledGroups,
    collapsedGroups:defaultCommonCollapsedGroups,
    probs:defaultCommonProbs,
    overallProb:defaultCommonOverallProb,
    useChat:defaultCommonUseChat,
    useLetter:defaultCommonUseLetter,
    useMoments:defaultCommonUseMoments,
    useCalendar:defaultCommonUseCalendar,
    useSurvey:defaultCommonUseSurvey // ★ 调查问卷可使用
  });
}

function toggleDefaultCommonEnabled(enabled){
  defaultCommonEnabled=enabled;
  defaultCommonAllContacts=enabled; // 开启时自动对所有联系人生效
  saveDefaultCommonSettings();
  renderDefaultCommonCards();
  var useScenes=$('default-common-use-scenes');
  if(useScenes)useScenes.style.display=enabled?'block':'none';
}

function updateDefaultCommonProb(cat,value){
  defaultCommonProbs[cat]=parseInt(value)||30;  var probText=$('dc-prob-text-'+cat);
  if(probText)probText.textContent=defaultCommonProbs[cat]+'%';
  // Update the current category's probability display in the slider
  var currentCat=defaultCommonCurrentCat;
  if(cat===currentCat){
    var curText=$('dc-prob-text-main');
    if(curText)curText.textContent=defaultCommonProbs[cat]+'%';
    var curSlider=$('dc-prob-slider-main');
    if(curSlider&&parseInt(curSlider.value)!==defaultCommonProbs[cat]){
      // Don't reset slider visually
    }
  }
  // Also update the global probability display
  var globalText=$('default-common-prob-text');
  if(globalText)globalText.textContent=defaultCommonProbs[cat]+'%';
  var globalSlider=$('default-common-prob-slider');
  if(globalSlider)globalSlider.value=defaultCommonProbs[cat];
  saveDefaultCommonSettings();
}

// ★ 整体出现概率（默认字卡整体触发概率，0-100）
function updateDefaultCommonOverallProb(value){
  defaultCommonOverallProb=parseInt(value)||30;
  var ot=$('dc-overall-prob-text');
  if(ot)ot.textContent=defaultCommonOverallProb+'%';
  saveDefaultCommonSettings();
}

function toggleDefaultCommonAllGroups(){
  // Check if any group is currently collapsed
  var anyCollapsed=false;
  Object.keys(defaultCommonCollapsedGroups).forEach(function(gid){
    if(defaultCommonCollapsedGroups[gid]===true)anyCollapsed=true;
  });
  // If no explicit state, groups are expanded by default
  if(!anyCollapsed){
    // All expanded, so collapse all
    defaultCommonCollapsedGroups={};
    (_defaultCommonGroups||[]).forEach(function(g){
      defaultCommonCollapsedGroups[g.id]=true;
    });
  }else{
    // Some collapsed, expand all
    defaultCommonCollapsedGroups={};
  }
  saveDefaultCommonSettings();
  renderDefaultCommonCardList();
  updateFoldAllButton();
}

function updateFoldAllButton(){
  var btn=$('dc-fold-all-btn');
  if(!btn)return;
  var anyCollapsed=false;
  Object.keys(defaultCommonCollapsedGroups).forEach(function(gid){
    if(defaultCommonCollapsedGroups[gid]===true)anyCollapsed=true;
  });
  btn.textContent=anyCollapsed?'展开全部':'折叠全部';
}

function updateDefaultCommonUseScene(scene,checked){
  if(scene==='chat')defaultCommonUseChat=checked;
  else if(scene==='letter')defaultCommonUseLetter=checked;
  else if(scene==='moments')defaultCommonUseMoments=checked;
  else if(scene==='calendar')defaultCommonUseCalendar=checked;
  else if(scene==='survey')defaultCommonUseSurvey=checked; // ★ 调查问卷
  saveDefaultCommonSettings();
}

function toggleDefaultCommonAllContacts(enabled){
  // 已废弃：单一开关模式，保留兼容
  toggleDefaultCommonEnabled(enabled);
}

function renderDefaultCommonCards(){
  // Hide/show regular card UI elements
  var privateSel=$('private-contact-sel'); if(privateSel)privateSel.style.display='none';
  var catTabs=$('card-category-tabs'); if(catTabs)catTabs.style.display='none';
  var cardToolbar=document.querySelector('.card-toolbar'); if(cardToolbar)cardToolbar.style.display='none';
  var cardSearch=$('card-search-input'); if(cardSearch)cardSearch.parentElement.style.display='none';
  var batchOps=$('batch-ops-bar'); if(batchOps)batchOps.style.display='none';
  var cardList=$('card-list'); if(cardList)cardList.style.display='none';
  var batchCardText=$('batch-card-text'); if(batchCardText)batchCardText.style.display='none';
  var batchCardVoice=$('batch-card-voice'); if(batchCardVoice)batchCardVoice.style.display='none';
  var batchCardSticker=$('batch-card-sticker'); if(batchCardSticker)batchCardSticker.style.display='none';
  var cardEmpty=$('card-empty'); if(cardEmpty)cardEmpty.style.display='none';
  
  // Show default common UI (settings + category tabs + card list)
  var dcSettings=$('default-common-settings');
  if(dcSettings)dcSettings.style.display='block';
  var dcCatTabs=$('default-common-category-tabs');
  if(dcCatTabs)dcCatTabs.style.display='block';
  var dcArea=$('default-common-cards-area');
  if(dcArea)dcArea.style.display='block';
  
  // Update toggle state
  var enabledToggle=$('default-common-enabled-toggle');
  if(enabledToggle)enabledToggle.checked=defaultCommonEnabled;
  
  // Update per-category probability slider for current category
  var catNames={main:'主字卡',kaomoji:'颜文字',emoji:'Emoji',touch:'拍一拍'};
  var currentProb=defaultCommonProbs[defaultCommonCurrentCat]||30;
  var probLabel=$('dc-prob-label');
  if(probLabel)probLabel.textContent=catNames[defaultCommonCurrentCat]+'概率：';
  var probText=$('dc-prob-text-main');
  if(probText){
    probText.textContent=currentProb+'%';
    probText.title=catNames[defaultCommonCurrentCat]+'触发概率';
  }
  var probSlider=$('dc-prob-slider-main');
  if(probSlider){
    probSlider.value=currentProb;
    probSlider.oninput=function(){updateDefaultCommonProb(defaultCommonCurrentCat,this.value)};
  }
  
  // ★ 同步整体出现概率滑条
  var overallText=$('dc-overall-prob-text');
  if(overallText)overallText.textContent=(defaultCommonOverallProb!=null?defaultCommonOverallProb:30)+'%';
  var overallSlider=$('dc-overall-prob-slider');
  if(overallSlider)overallSlider.value=defaultCommonOverallProb!=null?defaultCommonOverallProb:30;
  
  // Update global probability display
  var globalText=$('default-common-prob-text');
  if(globalText)globalText.textContent=currentProb+'%';
  var globalSlider=$('default-common-prob-slider');
  if(globalSlider)globalSlider.value=currentProb;
  
  // Update use scene checkboxes
  var useScenes=$('default-common-use-scenes');
  if(useScenes)useScenes.style.display=defaultCommonEnabled?'block':'none';
  var dcChat=$('dc-use-chat'); if(dcChat)dcChat.checked=defaultCommonUseChat;
  var dcLetter=$('dc-use-letter'); if(dcLetter)dcLetter.checked=defaultCommonUseLetter;
  var dcMoments=$('dc-use-moments'); if(dcMoments)dcMoments.checked=defaultCommonUseMoments;
  var dcCalendar=$('dc-use-calendar'); if(dcCalendar)dcCalendar.checked=defaultCommonUseCalendar;
  var dcSurvey=$('dc-use-survey'); if(dcSurvey)dcSurvey.checked=defaultCommonUseSurvey; // ★ 调查问卷
  
  // Update category tabs
  document.querySelectorAll('#default-common-cat-tabs .card-category-tab').forEach(function(t){
    t.classList.toggle('sel',t.dataset.dcCat===defaultCommonCurrentCat);
  });
  
  // Update fold-all button
  updateFoldAllButton();
  
  // Render cards (read-only mode)
  renderDefaultCommonCardList();
}

function renderDefaultCommonCardList(){
  var list=$('default-common-cards-list');
  var empty=$('default-common-cards-empty');
  if(!list){alert('找不到 default-common-cards-list 元素!');return;}
  
  // Get search term
  var searchInput=$('default-common-search');
  var searchTerm=searchInput?searchInput.value.trim().toLowerCase():'';
  var isSearching=searchTerm.length>0;
  
  // Filter by current category
  var catMap={main:'custom',kaomoji:'kaomoji',emoji:'emojis',touch:'touch'};
  var targetCategory=catMap[defaultCommonCurrentCat]||'custom';
  
  // 使用独立的默认通用字卡数据源
  var filtered=_defaultCommonCards.filter(function(card){
    if(!card)return false;
    if(card.category!==targetCategory)return false;
    // Apply search filter
    if(isSearching){
      var t=(card.content||card.text||card.voiceText||'').toLowerCase();
      if(t.indexOf(searchTerm)===-1)return false;
    }
    return true;
  });
  
  // Group by groupId
  var grouped={};
  filtered.forEach(function(card){
    var gid=card.groupId||'default_'+targetCategory;
    if(!grouped[gid])grouped[gid]=[];
    grouped[gid].push(card);
  });
  
  var groupIds=Object.keys(grouped);
  
  // Sort by _defaultCommonGroups order
  var validIds=(_defaultCommonGroups||[]).map(function(g){return g.id});
  groupIds.sort(function(a,b){
    var ai=validIds.indexOf(a),bi=validIds.indexOf(b);
    return (ai<0?9999:ai)-(bi<0?9999:bi);
  });
  
  // 显示统计信息
  var catNames={main:'主字卡',kaomoji:'颜文字',emoji:'Emoji',touch:'拍一拍'};
  var statsHtml='<div style="padding:10px 14px;margin-bottom:12px;background:linear-gradient(135deg,rgba(212,168,83,0.12),rgba(212,168,83,0.05));border-radius:10px;border:1px solid rgba(212,168,83,0.2);font-size:13px;color:var(--txt);display:flex;align-items:center;gap:16px;flex-wrap:wrap;">'+
    '<span style="display:flex;align-items:center;gap:6px;">📂 当前分类: <strong>'+(catNames[defaultCommonCurrentCat]||'主字卡')+'</strong></span>'+
    '<span style="color:var(--txt3);">|</span>'+
    '<span style="display:flex;align-items:center;gap:6px;">📊 <strong>'+filtered.length+'</strong> 张字卡</span>'+
    '<span style="color:var(--txt3);">|</span>'+
    '<span style="display:flex;align-items:center;gap:6px;">📁 <strong>'+groupIds.length+'</strong> 个分组</span>'+
    (defaultCommonEnabled?'<span style="color:var(--txt3);">|</span><span style="color:#52c41a;">✅ 已开启</span>':'<span style="color:var(--txt3);">|</span><span style="color:var(--txt3);">⏸ 已关闭</span>')+
    (defaultCommonEnabled?'<span style="color:var(--txt3);">|</span><span style="color:#d4a850;font-weight:600;">🎯 '+defaultCommonProbs[defaultCommonCurrentCat]+'% 触发</span>':'')+
    (isSearching?'<span style="color:var(--txt3);">|</span><span style="color:#1890ff;">🔍 搜索: "'+searchTerm+'"</span>':'')+
    '</div>';
  
  var html='';
  if(filtered.length===0){
    if(isSearching){
      html=statsHtml+'<div style="padding:30px;text-align:center;color:var(--txt3)"><div style="font-size:48px;margin-bottom:12px;">🔍</div><div>未找到匹配的字卡</div><div style="font-size:12px;margin-top:8px;">尝试其他关键词</div></div>';
    }else{
      html=statsHtml+'<div style="padding:30px;text-align:center;color:var(--txt3)"><div style="font-size:48px;margin-bottom:12px;">📭</div><div>该分类暂无字卡</div><div style="font-size:12px;margin-top:8px;">请切换到【主字卡】查看默认字卡</div></div>';
    }
    list.innerHTML=html;
    empty.style.display='none';
    return;
  }
  
  html=statsHtml;
  
  groupIds.forEach(function(gid){
    var groupCards=grouped[gid];
    var gInfo=(_defaultCommonGroups||[]).find(function(g){return g.id===gid});
    var gName=gInfo?gInfo.name:'默认分组';
    // When searching, auto-expand groups; otherwise use saved state (default expanded)
    var gCollapsed=isSearching?false:(defaultCommonCollapsedGroups[gid]===true);
    
    html+='<div class="card-group">'+
      '<div class="card-group-header" onclick="toggleDefaultCommonGroup(\''+gid.replace(/'/g,"\\'")+'\')" style="cursor:pointer">'+
        '<span class="card-group-icon">📁</span>'+
        '<span class="card-group-name">'+gName+'</span>'+
        '<span class="card-group-badge">'+groupCards.length+' 张</span>'+
        '<span class="card-group-fold">'+(gCollapsed?'▶':'▼')+'</span>'+
      '</div>'+
      '<div class="card-group-body" style="display:'+(gCollapsed?'none':'block')+'">'+
        '<div class="card-group-items">';
    groupCards.forEach(function(card){
      var t=card.content||card.text||card.voiceText||'';
      // Highlight search term
      if(isSearching){
        var idx=t.toLowerCase().indexOf(searchTerm);
        if(idx>=0){
          t=t.substring(0,idx)+'<mark style="background:#fff3cd;color:#856404;padding:0 2px;border-radius:2px;">'+t.substring(idx,idx+searchTerm.length)+'</mark>'+t.substring(idx+searchTerm.length);
        }
      }
      html+='<div class="card-item"><span class="card-item-content">'+t+'</span></div>';
    });
    html+='</div></div></div>';
  });
  
  list.innerHTML=html;
  empty.style.display='none';
}

function toggleDefaultCommonGroup(gid){
  defaultCommonCollapsedGroups[gid]=defaultCommonCollapsedGroups[gid]===true?false:true;
  saveDefaultCommonSettings();
  renderDefaultCommonCardList();
}

function toggleDefaultCommonGroupDisable(gid){
  defaultCommonDisabledGroups[gid]=!defaultCommonDisabledGroups[gid];
  saveDefaultCommonSettings();
  renderDefaultCommonCardList();
}

// Get all enabled default common cards for a contact, applying per-category probability
function getDefaultCommonCardsForContact(contactId, force, cat){
  // force=true 时忽略开关（用于"无字卡时兜底"场景）
  // cat 指定只取某一分类（'main'/'kaomoji'/'emoji'/'touch'），用于弹窗选择后的定向回复
  if(!force){
    if(!defaultCommonEnabled)return [];
    if(!defaultCommonAllContacts)return [];
  }
  // ★ 整体出现概率：默认字卡整体按概率触发（0-100，默认30）。
  // 非定向时，若整体概率未命中，则本次不返回任何默认字卡（默认字卡是"附带"内容）
  if(!force&&!cat){
    var overallProb=defaultCommonOverallProb!=null?defaultCommonOverallProb:30;
    if(Math.random()*100>=overallProb)return [];
  }
  var allCards=[];
  
  // Map UI categories to internal categories
  var catProbMap={main:['custom'],kaomoji:['kaomoji'],emoji:['emojis'],touch:['touch']};
  
  // 如果指定了 cat，只处理该分类；否则按概率处理所有分类
  // ★ 修复：非定向抽取时排除 touch（拍一拍）——拍一拍内容不应作为普通文字发出，
  // 它只在用户通过拍一拍概率触发 contactPerformTouch 时使用（独立逻辑）
  var catKeys=cat?[cat]:['main','kaomoji','emoji'];
  
  if(!cat&&catKeys.length>1){
    // ★ 分类改为"占比"：按四个分类的概率值加权随机选一个分类（不是各自独立判断）
    // 整体出现概率已由 defaultCommonOverallProb 控制，这里只决定"命中后偏向哪类"
    var weighted=catKeys.map(function(k){return {cat:k,prob:defaultCommonProbs[k]!=null?defaultCommonProbs[k]:30};});
    var totalW=0;
    weighted.forEach(function(w){totalW+=Math.max(0,w.prob);});
    if(totalW>0){
      var roll=Math.random()*totalW;
      var acc=0,chosen=catKeys[0];
      for(var wi=0;wi<weighted.length;wi++){
        acc+=Math.max(0,weighted[wi].prob);
        if(roll<acc){chosen=weighted[wi].cat;break;}
      }
      catKeys=[chosen];
    }
  }
  
  catKeys.forEach(function(uiCat){
    if(cat){
      // 定向分类：不使用概率，全量返回该分类字卡
    }
    
    var internalCats=catProbMap[uiCat];
    _defaultCommonCards.forEach(function(card){
      if(!card)return;
      if(card.type&&card.type!=='public')return;
      if(internalCats.indexOf(card.category)===-1)return;
      
      var gid=card.groupId||'default_'+card.category;
      if(defaultCommonDisabledGroups[gid])return;
      
      var displayText=card.content||card.text||card.voiceText||'';
      if(displayText)allCards.push(displayText);
    });
  });
  
  return allCards;
}

// 获取默认通用字卡中的【拍一拍】内容（供 genReply/contactPerformTouch 使用）
function getDefaultTouchCards(){
  try{
    var cards=[];
    if(Array.isArray(_defaultCommonCards)){
      _defaultCommonCards.forEach(function(c){
        if(!c||c.category!=='touch'||!c.content)return;
        if(c.type&&c.type!=='public')return;
        var gid=c.groupId||'default_'+c.category;
        if(defaultCommonDisabledGroups&&defaultCommonDisabledGroups[gid])return;
        cards.push(c.content);
      });
    }
    return cards;
  }catch(e){return [];}
}

// Initialize default common category tab clicks
document.addEventListener('click',function(e){
  var target=e.target;
  if(!target)return;
  // Check if click is on a category tab button inside default-common-cat-tabs
  if(target.id==='default-common-cat-tabs'||target.closest('#default-common-cat-tabs')){
    var tab=target.closest('.card-category-tab');
    if(tab&&tab.dataset.dcCat!==undefined){
      console.log('切换默认通用字卡分类: '+tab.dataset.dcCat);
      document.querySelectorAll('#default-common-cat-tabs .card-category-tab').forEach(function(t){t.classList.remove('sel')});
      tab.classList.add('sel');
      defaultCommonCurrentCat=tab.dataset.dcCat;
      // Update probability slider for new category
      var catNames={main:'主字卡',kaomoji:'颜文字',emoji:'Emoji',touch:'拍一拍'};
      var currentProb=defaultCommonProbs[defaultCommonCurrentCat]||30;
      var probLabel=$('dc-prob-label');
      if(probLabel)probLabel.textContent=catNames[defaultCommonCurrentCat]+'概率：';
      var probText=$('dc-prob-text-main');
      if(probText){
        probText.textContent=currentProb+'%';
        probText.title=catNames[defaultCommonCurrentCat]+'触发概率';
      }
      var probSlider=$('dc-prob-slider-main');
      if(probSlider){
        probSlider.value=currentProb;
        probSlider.oninput=function(){updateDefaultCommonProb(defaultCommonCurrentCat,this.value)};
      }
      // Update global probability display
      var globalText=$('default-common-prob-text');
      if(globalText)globalText.textContent=currentProb+'%';
      var globalSlider=$('default-common-prob-slider');
      if(globalSlider)globalSlider.value=currentProb;
      // Update fold-all button
      updateFoldAllButton();
      renderDefaultCommonCardList();
      e.stopPropagation();
      e.preventDefault();
    }
  }
},true);

// Load settings on init
// 一次性迁移：将旧的 enabled=true 重置为 false（修复默认通用字卡没有默认关闭的问题）
(function(){
  var migrated=ls('ml2_default_common_migrated_v2');
  if(!migrated){
    var saved=ls('ml2_default_common_settings');
    if(saved&&saved.enabled===true){
      saved.enabled=false;
      ls('ml2_default_common_settings',saved);
    }
    ls('ml2_default_common_migrated_v2',true);
  }
})();
loadDefaultCommonSettings();

async function loadGlobalCards(){
  var c=null;
  var lsData=null;
  
  // 1. Try localforage first
  if(window.localforage){
    try{c=await window.localforage.getItem('ml2_global_cards');}catch(e){}
  }
  
  // 2. Fallback to localStorage via ls()
  if(!c||!Array.isArray(c)||c.length===0){
    lsData=ls('ml2_global_cards');
  }
  
  // 3. If still empty, try direct localStorage
  if((!c||!Array.isArray(c)||c.length===0)&&(!lsData||!Array.isArray(lsData)||lsData.length===0)){
    try{
      var direct=safeGetItem('ml2_global_cards');
      if(direct){
        var parsed=JSON.parse(direct);
        if(Array.isArray(parsed)&&parsed.length>0){
          lsData=parsed;
        }
      }
    }catch(e){}
  }
  
  // 4. Also try ml2_lf_ml2_global_cards (localforage backup in localStorage)
  if((!c||!Array.isArray(c)||c.length===0)&&(!lsData||!Array.isArray(lsData)||lsData.length===0)){
    try{
      var backup=safeGetItem('ml2_lf_ml2_global_cards');
      if(backup){
        var parsed2=JSON.parse(backup);
        if(Array.isArray(parsed2)&&parsed2.length>0){
          lsData=parsed2;
        }
      }
    }catch(e){}
  }
  
  // 加载硬编码默认通用字卡到独立变量
  if(typeof DEFAULT_COMMON_CARDS!=='undefined'&&DEFAULT_COMMON_CARDS.length>0){
    _defaultCommonCards=DEFAULT_COMMON_CARDS.slice();
    console.log('使用硬编码默认通用字卡: '+_defaultCommonCards.length+' 张');
  }
  
  // globalCards 只从存储中加载（用户添加的公用/专享字卡）
  if(c&&Array.isArray(c)&&c.length>0){
    globalCards=c;
    memoryCache['ml2_global_cards']=c;
  }else if(lsData&&Array.isArray(lsData)&&lsData.length>0){
    globalCards=lsData;
    memoryCache['ml2_global_cards']=lsData;
  }
  
  // 过滤掉与默认通用字卡内容重复的字卡，避免在公用字卡页面显示重复
  if(_defaultCommonCards.length>0&&globalCards.length>0){
    var dcContents=new Set(_defaultCommonCards.map(function(c){return c.content;}));
    var originalCount=globalCards.length;
    globalCards=globalCards.filter(function(card){
      if(!card)return false;
      // 只过滤公用字卡（type: 'public'），保留专享字卡
      if(card.type==='public'||!card.type){
        var content=card.content||card.text||'';
        return !dcContents.has(content);
      }
      return true;
    });
    var removedCount=originalCount-globalCards.length;
    if(removedCount>0){
      console.log('已过滤掉 '+removedCount+' 张与默认通用字卡重复的字卡');
      // 同时清理 cardGroups 中已无对应字卡的空分组（避免默认通用字卡的分组混入公用字卡）
      if(typeof cardGroups!=='undefined'&&Array.isArray(cardGroups)&&cardGroups.length>0){
        var dcGroupNames=new Set((_defaultCommonGroups||[]).map(function(g){return g.name}));
        var originalGroupCount=cardGroups.length;
        cardGroups=cardGroups.filter(function(g){
          if(!g||!g.id||!g.name)return false;
          // 只清理公用类型(type='public'或为空)的空分组
          var gType=g.type||'public';
          if(gType!=='public')return true;
          // 检查该分组是否还有对应的公用字卡
          var hasCards=globalCards.some(function(c){
            return c&&c.groupId===g.id&&(c.type==='public'||!c.type);
          });
          if(hasCards)return true;
          // 如果是空分组且名称与默认通用字卡分组相同，则清理
          if(dcGroupNames.has(g.name))return false;
          // 其他空分组保留（用户手动创建的）
          return true;
        });
        var removedGroupCount=originalGroupCount-cardGroups.length;
        if(removedGroupCount>0){
          console.log('已清理 '+removedGroupCount+' 个与默认通用字卡重复的空分组');
          saveCardGroups();
        }
      }
      // 保存过滤后的结果到内存缓存
      memoryCache['ml2_global_cards']=globalCards;
      // 异步保存到存储
      saveGlobalCardsDebounced();
    }
    console.log('字卡数据统计: 默认通用字卡 '+_defaultCommonCards.length+' 张, 用户公用/专享字卡 '+globalCards.length+' 张');
  }

  var migratedCards=[];
  if(contacts&&contacts.length){
    contacts.forEach(function(contact){
      var oldCards=cards(contact.id);
      if(oldCards&&oldCards.cards&&oldCards.cards.length){
        oldCards.cards.forEach(function(cardContent){
          if(typeof cardContent==='string'&&cardContent.trim()){
            var existing=globalCards.find(function(gc){return gc.content===cardContent&&gc.type==='private'&&gc.contactId===contact.id});
            if(!existing){
              migratedCards.push({
                id:'c_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
                content:cardContent,
                type:'private',
                category:'custom',
                groupId:'default_custom',
                contactId:contact.id
              });
            }
          }
        });
      }
    });
  }
  
  
  
  var hasMissingGroupName=false;
  globalCards.forEach(function(card){
    if(!card.groupName){
      card.groupName='默认分组';
      hasMissingGroupName=true;
    }
  });
  if(hasMissingGroupName){
    await saveGlobalCardsDebounced();
  }
  
  // 加载硬编码默认通用分组到独立变量
  if(typeof DEFAULT_COMMON_GROUPS!=='undefined'&&DEFAULT_COMMON_GROUPS.length>0){
    _defaultCommonGroups=DEFAULT_COMMON_GROUPS.slice();
    console.log('使用硬编码默认通用分组: '+_defaultCommonGroups.length+' 个');
  }
  
  // cardGroups 只从存储中加载（用户添加的分组）
  var g=null;
  var storedGroups=null;
  if(window.localforage){
    try{
      var lfData=await window.localforage.getItem('ml2_card_groups');
      if(lfData&&Array.isArray(lfData)&&lfData.length>0){
        storedGroups=lfData;
      }
    }catch(e){}
  }
  if(!storedGroups||!Array.isArray(storedGroups)||storedGroups.length===0){
    storedGroups=ls('ml2_card_groups');
  }
  
  if(storedGroups&&Array.isArray(storedGroups)){
    cardGroups=storedGroups;
  }else{
    cardGroups=[{id:'default',name:'默认分组',category:'custom'}];
  }
  
  // 过滤和修复分组数据
  var originalLength=cardGroups.length;
  var categoryAdded=false;
  cardGroups=cardGroups.filter(function(g){
    if(!g||!g.id||!g.name)return false;
    if(g.name.length>30)return false;
    // 不再过滤g_def_开头的分组，因为用户导入的字卡可能也使用这些分组
    if(!g.category){g.category='custom';categoryAdded=true;}
    if(!g.type){
      var personalCardsWithGroup=globalCards.filter(function(c){return c.groupId===g.id&&c.type==='personal'});
      var privateCardsWithGroup=globalCards.filter(function(c){return c.groupId===g.id&&c.type==='private'});
      if(personalCardsWithGroup.length>0){
        g.type='personal';
      }else if(privateCardsWithGroup.length>0){
        g.type='private';
        if(privateCardsWithGroup[0].contactId){
          g.contactId=privateCardsWithGroup[0].contactId;
        }
      }else{
        g.type='public';
      }
      categoryAdded=true;
    }
    if(g.type==='private'&&!g.contactId){
      var contactCards=globalCards.filter(function(c){return c.groupId===g.id&&c.type==='private'});
      if(contactCards.length>0&&contactCards[0].contactId){
        g.contactId=contactCards[0].contactId;
        categoryAdded=true;
      }
    }
    return true;
  });
  
  if(cardGroups.length!==originalLength||categoryAdded){
    saveCardGroups();
  }

  // 清理与默认通用字卡分组同名且无对应字卡的公用空分组
  if(_defaultCommonGroups&&_defaultCommonGroups.length>0&&cardGroups.length>0){
    var dcGroupNames=new Set(_defaultCommonGroups.map(function(g){return g.name}));
    var beforeCleanCount=cardGroups.length;
    cardGroups=cardGroups.filter(function(g){
      if(!g||!g.id||!g.name)return false;
      var gType=g.type||'public';
      if(gType!=='public')return true;
      // 检查是否有对应的公用字卡
      var hasCards=globalCards.some(function(c){
        return c&&c.groupId===g.id&&(c.type==='public'||!c.type);
      });
      if(hasCards)return true;
      // 空分组且名称与默认通用字卡分组相同，则清理
      if(dcGroupNames.has(g.name))return false;
      return true;
    });
    if(cardGroups.length!==beforeCleanCount){
      console.log('loadCardGroups: 已清理 '+(beforeCleanCount-cardGroups.length)+' 个默认通用字卡空分组');
      saveCardGroups();
    }
  }

  if(!cardGroups.length){
    cardGroups=[{id:'default',name:'默认分组',category:'custom'}];
    saveCardGroups();
  }
  
  var migrated=false;
  globalCards.forEach(function(card){
    if(card.groupId==='default'){
      card.groupId='default_'+(card.category||'custom');
      migrated=true;
    }
  });
  
  if(migrated){
    await saveGlobalCardsDebounced();
  }
  
  var cleanedGroups=false;
  var groupMap={};
  cardGroups=cardGroups.filter(function(g){
    var key=g.name+'_'+g.category+'_'+g.type+'_'+(g.contactId||'');
    if(groupMap[key]){
      if(g.id.startsWith('default_')){
        globalCards.forEach(function(card){
          if(card.groupId===groupMap[key].id){
            card.groupId=g.id;
          }
        });
        cleanedGroups=true;
        return true;
      }
      return false;
    }
    groupMap[key]=g;
    return true;
  });
  
  if(cleanedGroups){
    saveCardGroups();
    await saveGlobalCardsDebounced();
  }
  
  if(typeof renderCardList==='function')renderCardList();
  
  requestAnimationFrame(function(){
    loadCardImagesAsync();
  });
}

async function loadCardImagesAsync(){
  var loadPromises=[];
  for(var i=0;i<globalCards.length;i++){
    var card=globalCards[i];
    if(card&&card.content&&card.content.startsWith('ml2_card_img_')){
      loadPromises.push((function(c,key){
        return new Promise(async function(resolve){
          var imgData=null;
          if(window.localforage){
            try{imgData=await window.localforage.getItem(key);}catch(e){}
          }
          if(!imgData){
            try{imgData=safeGetItem(key);}catch(e){}
          }
          if(imgData){
            c.content=imgData;
            memoryCache['_img_'+key]=imgData;
          }
          resolve();
        });
      })(card,card.content));
    }
  }
  if(loadPromises.length>0){
    await Promise.allSettled(loadPromises);
  }
}

async function saveGlobalCards(){
  try{
    var cardsToSave=[];
    var savePromises=[];
    for(var i=0;i<globalCards.length;i++){
      var card=globalCards[i];
      if(card.content&&(card.content.startsWith('data:image/')||card.content.startsWith('data:audio/'))){
        var imgKey='ml2_card_img_'+card.id;
        if(window.localforage){
          savePromises.push(window.localforage.setItem(imgKey,card.content).catch(function(e){console.warn('saveGlobalCards: setItem failed',imgKey,e);}));
        }
        memoryCache['_img_'+imgKey]=card.content;
        cardsToSave.push(Object.assign({},card,{content:imgKey}));
      }else{
        cardsToSave.push(card);
      }
    }
    ls('ml2_global_cards',cardsToSave);
    // 立即刷新 localStorage 写入，避免数据延迟
    if(Storage.flushLSWrites)Storage.flushLSWrites();
    if(window.localforage){
      savePromises.push(window.localforage.setItem('ml2_global_cards', cardsToSave).catch(function(){}));
    }
    if(savePromises.length>0)await Promise.all(savePromises);
    return true;
  }catch(e){
    console.error('Failed to save cards:',e);
    return false;
  }
}

// 防抖版本的 saveGlobalCards，避免频繁写入
var _saveGlobalCardsTimer=null;
var _saveGlobalCardsPending=false;
var _saveGlobalCardsResolve=null;
function saveGlobalCardsDebounced(){
  if(_saveGlobalCardsPending){
    return new Promise(function(resolve){
      var check=setInterval(function(){
        if(!_saveGlobalCardsPending){
          clearInterval(check);
          resolve();
        }
      },100);
    });
  }
  _saveGlobalCardsPending=true;
  if(_saveGlobalCardsTimer)clearTimeout(_saveGlobalCardsTimer);
  return new Promise(function(resolve){
    _saveGlobalCardsResolve=resolve;
    _saveGlobalCardsTimer=setTimeout(function(){
      _saveGlobalCardsPending=false;
      var r=_saveGlobalCardsResolve;
      _saveGlobalCardsResolve=null;
      saveGlobalCards().then(function(){
        if(r)r();
      }).catch(function(){
        if(r)r();
      });
    },500);
  });
}
async function saveC(){
  // ★ 修复：头像(base64)剥离单独存 localStorage，防止 contacts 超50KB走异步队列导致刷新丢头像
  // 联系人数组本体只保留头像占位（avatar 保留给运行时，但持久化时单独存）
  var _avatarBackup={};
  try{
    contacts.forEach(function(c){
      if(c&&c.avatar&&typeof c.avatar==='string'&&c.avatar.length>500){
        _avatarBackup[c.id]=c.avatar;
        try{localStorage.setItem('ml2_contact_avatar_'+c.id, c.avatar);}catch(e){
          // 超限时移除旧值重试（单头像最大）
          try{localStorage.removeItem('ml2_contact_avatar_'+c.id);}catch(e2){}
        }
        if(window.localforage){
          try{window.localforage.setItem('ml2_contact_avatar_'+c.id, c.avatar).catch(function(){});}catch(e3){}
        }
      }
    });
  }catch(e){console.warn('saveC avatar split failed:',e);}
  ls(LC, contacts);
  if(window.localforage){
    try{await window.localforage.setItem(LC, contacts);}catch(e){console.warn('saveC localforage failed:',e);}
  }
}

function saveCardGroups(){
  cardGroups=cardGroups.filter(function(g,i,self){
    if(!g||!g.id||!g.name)return false;
    return self.findIndex(function(h){
      return h.name===g.name&&h.category===g.category&&h.type===g.type&&h.contactId===g.contactId;
    })===i;
  });
  var saved=ls('ml2_card_groups',cardGroups);
  if(!saved){
    console.error('Failed to save card groups');
  }
  if(window.localforage){
    try{window.localforage.setItem('ml2_card_groups',cardGroups)}catch(e){}
  }
  return saved;
}

var _cardCategories=[
  {key:'custom',label:'主字卡',icon:'📝'},
  {key:'kaomoji',label:'颜文字',icon:'😊'},
  {key:'emojis',label:'Emoji',icon:'📖'},
  {key:'stickers',label:'图片表情',icon:'🖼️'},
  {key:'touch',label:'拍一拍',icon:'👋'},
  {key:'voices',label:'语音',icon:'🎵'}
];

var _cardTypes=[
  {key:'all',label:'全部字卡',desc:'包含公用和专享'},
  {key:'public',label:'公用字卡',desc:'所有联系人共享'},
  {key:'private',label:'专享字卡',desc:'绑定特定联系人'}
];

function openExportCardsDialog(){
  var selectedType='all';
  var selectedGroups={};
  
  loadGlobalCards();
  
  var typeContainer=$('export-types');
  typeContainer.innerHTML='';
  _cardTypes.forEach(function(t){
    var isSelected=t.key===selectedType;
    var label=document.createElement('label');
    label.style.cssText='display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:12px;cursor:pointer;transition:all 0.25s ease;border:2px solid '+(isSelected?'var(--accent)':'var(--border)')+';background:'+(isSelected?'linear-gradient(135deg,rgba(var(--accent-rgb),0.12),rgba(var(--accent-rgb),0.05))':'var(--c2)')+';'+(isSelected?'box-shadow:0 2px 10px rgba(var(--accent-rgb),0.2);':'')+'transform:'+(isSelected?'scale(1.01)':'scale(1)')+';';
    label.innerHTML='<div style="width:20px;height:20px;border-radius:50%;border:2px solid '+(isSelected?'var(--accent)':'var(--txt3)')+';display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.2s;">'+(isSelected?'<div style="width:10px;height:10px;border-radius:50%;background:var(--accent);"></div>':'')+'</div><div style="flex:1;"><div style="font-size:14px;font-weight:'+(isSelected?'600':'500')+';color:'+(isSelected?'var(--accent)':'var(--txt)')+';">'+t.label+'</div><div style="font-size:12px;color:var(--txt3);margin-top:2px;">'+t.desc+'</div></div>';
    label.onclick=function(){
      selectedType=t.key;
      updateExportTypeUI();
      rebuildGroupList();
      updateExportPreview();
    };
    typeContainer.appendChild(label);
  });
  
  function updateExportTypeUI(){
    var typeLabels=typeContainer.querySelectorAll('label');
    typeLabels.forEach(function(label,idx){
      var t=_cardTypes[idx];
      var isSelected=t.key===selectedType;
      label.style.cssText='display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:12px;cursor:pointer;transition:all 0.25s ease;border:2px solid '+(isSelected?'var(--accent)':'var(--border)')+';background:'+(isSelected?'linear-gradient(135deg,rgba(var(--accent-rgb),0.12),rgba(var(--accent-rgb),0.05))':'var(--c2)')+';'+(isSelected?'box-shadow:0 2px 10px rgba(var(--accent-rgb),0.2);':'')+'transform:'+(isSelected?'scale(1.01)':'scale(1)')+';';
      label.innerHTML='<div style="width:20px;height:20px;border-radius:50%;border:2px solid '+(isSelected?'var(--accent)':'var(--txt3)')+';display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.2s;">'+(isSelected?'<div style="width:10px;height:10px;border-radius:50%;background:var(--accent);"></div>':'')+'</div><div style="flex:1;"><div style="font-size:14px;font-weight:'+(isSelected?'600':'500')+';color:'+(isSelected?'var(--accent)':'var(--txt)')+';">'+t.label+'</div><div style="font-size:12px;color:var(--txt3);margin-top:2px;">'+t.desc+'</div></div>';
    });
  };
  
  function rebuildGroupList(){
    var groupsSection=$('export-groups-section');
    var groupsContainer=$('export-groups');
    groupsContainer.innerHTML='';
    
    var filteredGroups=cardGroups.filter(function(g){
      if(selectedType==='public'&&(g.type==='private'||g.type==='personal'))return false;
      if(selectedType==='private'&&g.type==='public')return false;
      return true;
    });
    
    if(filteredGroups.length===0){
      groupsSection.style.display='none';
      return;
    }
    
    groupsSection.style.display='block';
    
    var categoriesMap={};
    _cardCategories.forEach(function(c){
      categoriesMap[c.key]={label:c.label,icon:c.icon,groups:[]};
    });
    
    filteredGroups.forEach(function(g){
      var cat=g.category||'custom';
      if(!categoriesMap[cat])categoriesMap[cat]={label:cat,icon:'📝',groups:[]};
      categoriesMap[cat].groups.push(g);
    });
    
    var hasAnyGroup=false;
    _cardCategories.forEach(function(cat){
      var catData=categoriesMap[cat.key];
      if(!catData||catData.groups.length===0)return;
      hasAnyGroup=true;
      
      var totalCards=0;
      catData.groups.forEach(function(g){
        totalCards+=globalCards.filter(function(c){return c.groupId===g.id;}).length;
      });
      
      var sectionDiv=document.createElement('div');
      sectionDiv.style.cssText='margin-bottom:12px;border:1px solid var(--border);border-radius:10px;overflow:hidden;';
      
      var headerDiv=document.createElement('div');
      headerDiv.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--c2);cursor:pointer;user-select:none;';
      headerDiv.innerHTML='<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:16px;">'+catData.icon+'</span><span style="font-size:13px;font-weight:600;color:var(--txt);">'+catData.label+'</span><span style="font-size:11px;color:var(--txt3);">('+catData.groups.length+'组 · '+totalCards+'张)</span></div><div style="display:flex;align-items:center;gap:6px;"><span class="cat-check" style="font-size:11px;color:var(--accent);cursor:pointer;padding:2px 6px;border-radius:4px;background:rgba(var(--accent-rgb),0.1);">全选</span><span class="cat-arrow" style="font-size:10px;color:var(--txt3);transition:transform 0.2s;">▶</span></div>';
      
      var bodyDiv=document.createElement('div');
      bodyDiv.style.cssText='padding:8px 12px;background:var(--c1);display:none;flex-wrap:wrap;gap:6px;';
      
      catData.groups.forEach(function(g){
        var cnt=globalCards.filter(function(c){return c.groupId===g.id;}).length;
        var isSelected=selectedGroups[g.id]!==false;
        selectedGroups[g.id]=isSelected;
        var chip=document.createElement('div');
        chip.style.cssText='padding:6px 12px;border-radius:14px;font-size:12px;cursor:pointer;transition:all 0.2s ease;border:1.5px solid '+(isSelected?'var(--accent)':'var(--border)')+';background:'+(isSelected?'linear-gradient(135deg,rgba(var(--accent-rgb),0.15),rgba(var(--accent-rgb),0.08))':'var(--c2)')+';color:'+(isSelected?'var(--accent)':'var(--txt3)')+';display:flex;align-items:center;gap:3px;font-weight:'+(isSelected?'500':'normal')+';';
        chip.innerHTML=(isSelected?'✓ ':'')+g.name+' ('+cnt+')';
        chip.dataset.gid=g.id;
        chip.onclick=function(){
          var gid=this.dataset.gid;
          if(selectedGroups[gid]){
            selectedGroups[gid]=false;
            this.style.borderColor='var(--border)';
            this.style.background='var(--c2)';
            this.style.color='var(--txt3)';
            this.style.fontWeight='normal';
            this.innerHTML=g.name+' ('+cnt+')';
          }else{
            selectedGroups[gid]=true;
            this.style.borderColor='var(--accent)';
            this.style.background='linear-gradient(135deg,rgba(var(--accent-rgb),0.15),rgba(var(--accent-rgb),0.08))';
            this.style.color='var(--accent)';
            this.style.fontWeight='500';
            this.innerHTML='✓ '+g.name+' ('+cnt+')';
          }
          updateExportPreview();
        };
        bodyDiv.appendChild(chip);
      });
      
      var arrow=headerDiv.querySelector('.cat-arrow');
      headerDiv.querySelector('.cat-check').onclick=function(e){
        e.stopPropagation();
        var allSelected=catData.groups.every(function(g){return selectedGroups[g.id]!==false;});
        catData.groups.forEach(function(g){
          selectedGroups[g.id]=!allSelected;
        });
        rebuildGroupList();
        updateExportPreview();
      };
      headerDiv.onclick=function(){
        if(bodyDiv.style.display==='none'){
          bodyDiv.style.display='flex';
          arrow.textContent='▼';
        }else{
          bodyDiv.style.display='none';
          arrow.textContent='▶';
        }
      };
      
      sectionDiv.appendChild(headerDiv);
      sectionDiv.appendChild(bodyDiv);
      groupsContainer.appendChild(sectionDiv);
    });
    
    if(!hasAnyGroup){
      groupsSection.style.display='none';
    }
  }
  
  function updateExportPreview(){
    var typeVal=selectedType;
    var selectedGroupIds=Object.keys(selectedGroups).filter(function(k){return selectedGroups[k];});
    var count=globalCards.filter(function(c){
      if(typeVal==='public'&&(c.type==='private'||c.type==='personal'))return false;
      if(typeVal==='private'&&c.type==='public')return false;
      if(selectedGroupIds.length>0){
        if(!c.groupId||!selectedGroupIds.includes(c.groupId))return false;
      }
      return true;
    }).length;
    $('export-preview-info').textContent='将导出 '+count+' 张字卡';
    if(count===0){
      $('export-cards-confirm').disabled=true;
      $('export-cards-confirm').style.opacity='0.5';
    }else{
      $('export-cards-confirm').disabled=false;
      $('export-cards-confirm').style.opacity='1';
    }
  }
  
  $('export-cards-confirm').onclick=async function(){
    var typeVal=selectedType;
    var selectedGroupIds=Object.keys(selectedGroups).filter(function(k){return selectedGroups[k];});
    hideOv('ov-export-cards');
    await exportCardsJSON({categories:_cardCategories.map(function(c){return c.key;}),cardType:typeVal,groupIds:selectedGroupIds});
  };
  
  rebuildGroupList();
  updateExportPreview();
  showOv('ov-export-cards');
}

var _importFileData=null;
function openImportCardsDialog(){
  _importFileData=null;
  var selectedCats={};
  _cardCategories.forEach(function(c){selectedCats[c.key]=true;});
  var selectedType='all';

  var container=$('import-categories');
  container.innerHTML='';
  _cardCategories.forEach(function(cat){
    var chip=document.createElement('div');
    chip.className='import-cat-chip selected';
    chip.style.cssText='padding:8px 14px;border-radius:20px;font-size:13px;cursor:pointer;transition:all 0.2s;border:1.5px solid var(--accent);background:rgba(var(--accent-rgb),0.1);color:var(--accent);display:flex;align-items:center;gap:4px;';
    chip.innerHTML=cat.icon+' '+cat.label;
    chip.dataset.cat=cat.key;
    chip.onclick=function(){
      var key=this.dataset.cat;
      if(selectedCats[key]){
        selectedCats[key]=false;
        this.style.borderColor='var(--border)';
        this.style.background='var(--c2)';
        this.style.color='var(--txt3)';
      }else{
        selectedCats[key]=true;
        this.style.borderColor='var(--accent)';
        this.style.background='rgba(var(--accent-rgb),0.1)';
        this.style.color='var(--accent)';
      }
    };
    container.appendChild(chip);
  });
  
  var typeContainer=$('import-types');
  typeContainer.innerHTML='';
  _cardTypes.forEach(function(t){
    var isSelected=t.key===selectedType;
    var label=document.createElement('label');
    label.style.cssText='display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:12px;cursor:pointer;transition:all 0.25s ease;border:2px solid '+(isSelected?'var(--accent)':'var(--border)')+';background:'+(isSelected?'linear-gradient(135deg,rgba(var(--accent-rgb),0.12),rgba(var(--accent-rgb),0.05))':'var(--c2)')+';'+(isSelected?'box-shadow:0 2px 10px rgba(var(--accent-rgb),0.2);':'')+'transform:'+(isSelected?'scale(1.01)':'scale(1)')+';';
    label.innerHTML='<div style="width:20px;height:20px;border-radius:50%;border:2px solid '+(isSelected?'var(--accent)':'var(--txt3)')+';display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.2s;">'+(isSelected?'<div style="width:10px;height:10px;border-radius:50%;background:var(--accent);"></div>':'')+'</div><div style="flex:1;"><div style="font-size:14px;font-weight:'+(isSelected?'600':'500')+';color:'+(isSelected?'var(--accent)':'var(--txt)')+';">'+t.label+'</div><div style="font-size:12px;color:var(--txt3);margin-top:2px;">'+t.desc+'</div></div>';
    label.onclick=function(){
      selectedType=t.key;
      updateImportTypeUI();
    };
    typeContainer.appendChild(label);
  });
  
  function updateImportTypeUI(){
    var typeLabels=typeContainer.querySelectorAll('label');
    typeLabels.forEach(function(label,idx){
      var t=_cardTypes[idx];
      var isSelected=t.key===selectedType;
      label.style.cssText='display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:12px;cursor:pointer;transition:all 0.25s ease;border:2px solid '+(isSelected?'var(--accent)':'var(--border)')+';background:'+(isSelected?'linear-gradient(135deg,rgba(var(--accent-rgb),0.12),rgba(var(--accent-rgb),0.05))':'var(--c2)')+';'+(isSelected?'box-shadow:0 2px 10px rgba(var(--accent-rgb),0.2);':'')+'transform:'+(isSelected?'scale(1.01)':'scale(1)')+';';
      label.innerHTML='<div style="width:20px;height:20px;border-radius:50%;border:2px solid '+(isSelected?'var(--accent)':'var(--txt3)')+';display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.2s;">'+(isSelected?'<div style="width:10px;height:10px;border-radius:50%;background:var(--accent);"></div>':'')+'</div><div style="flex:1;"><div style="font-size:14px;font-weight:'+(isSelected?'600':'500')+';color:'+(isSelected?'var(--accent)':'var(--txt)')+';">'+t.label+'</div><div style="font-size:12px;color:var(--txt3);margin-top:2px;">'+t.desc+'</div></div>';
    });
  };
  
  $('import-cards-confirm').textContent='选择JSON文件';
  $('import-cards-confirm').disabled=false;
  $('import-cards-confirm').style.opacity='1';
  
  var fileInput=$('import-cards-file');
  fileInput.value='';
  
  var onFileSelect=async function(e){
    var file=e.target.files[0];
    if(!file)return;
    
    try{
      var reader=new FileReader();
      reader.onload=async function(evt){
        try{
          var rawData=JSON.parse(evt.target.result);
          
          var catList=Object.keys(selectedCats).filter(function(k){return selectedCats[k]});
          var typeVal=selectedType;
          var overwrite=$('import-mode-replace')&&$('import-mode-replace').checked;
          
          hideOv('ov-import-cards');
          await importCardsJSON(rawData,{categories:catList,cardType:typeVal,overwrite:overwrite});
        }catch(err){
          toast('导入失败，无效的JSON文件');
          console.error(err);
        }
      };
      reader.readAsText(file);
    }catch(err){
      toast('读取文件失败');
      console.error(err);
    }
  };
  
  fileInput.onchange=onFileSelect;
  $('import-cards-confirm').onclick=function(){
    var catList=Object.keys(selectedCats).filter(function(k){return selectedCats[k];});
    if(catList.length===0){
      toast('请至少选择一个分类');
      return;
    }
    fileInput.click();
  };
  
  showOv('ov-import-cards');
}

async function exportCardsJSON(options){
  var opts=options||{categories:_cardCategories.map(function(c){return c.key}),cardType:'all'};
  toast('正在准备导出数据...');
  await loadGlobalCards();
  try{await loadCardImagesAsync()}catch(e){console.error('loadCardImagesAsync error:',e)}
  
  var exportData={
    version:'1.4',
    exportTime:new Date().toISOString(),
    globalCards:[],
    cardGroups:[],
    images:{},
    voices:{}
  };
  
  var imageLoadPromises=[];
  var cardsToExport=[];
  
  var filteredCards=globalCards.filter(function(c){
    if(!opts.categories.includes(c.category))return false;
    if(opts.cardType==='public'&&(c.type==='private'||c.type==='personal'))return false;
    if(opts.cardType==='private'&&c.type==='public')return false;
    if(opts.groupIds&&opts.groupIds.length>0){
      if(!c.groupId||!opts.groupIds.includes(c.groupId))return false;
    }
    return true;
  });
  
  var totalCards=filteredCards.length;
  
  for(var i=0;i<totalCards;i++){
    var card=filteredCards[i];
    var cardCopy={
      id:card.id,
      content:card.content,
      text:card.text||'',
      type:card.type||'public',
      category:card.category||'custom',
      groupId:card.groupId||'',
      groupName:card.groupName||'',
      contactId:card.contactId||null,
      voiceText:card.voiceText||'',
      duration:card.duration||0
    };
    
    if(card.content&&card.content.startsWith('data:image/')){
      exportData.images[card.id]=card.content;
      cardCopy.content='__img__'+card.id;
      cardCopy.text='';
      cardsToExport.push(cardCopy);
    }else if(card.content&&card.content.startsWith('ml2_card_img_')){
      imageLoadPromises.push((function(cardRef,copyRef){
        return async function(){
          var imgData=null;
          if(window.localforage){
            try{imgData=await window.localforage.getItem(cardRef.content)}catch(e){}
          }
          if(imgData){
            exportData.images[cardRef.content]=imgData;
            copyRef.content=cardRef.content;
          }
        };
      })(card,cardCopy));
      cardsToExport.push(cardCopy);
    }else if(card.content&&card.content.startsWith('data:audio/')){
      exportData.voices[card.id]=card.content;
      cardCopy.content='__voice__'+card.id;
      cardCopy.text='';
      cardsToExport.push(cardCopy);
    }else if(card.category==='voices'){
      exportData.voices[card.id]=card.content;
      cardsToExport.push(cardCopy);
    }else{
      cardsToExport.push(cardCopy);
    }
    
    if(i>0&&i%200===0){
      await new Promise(function(r){setTimeout(r,0)});
      toast('正在导出... '+(i+1)+'/'+totalCards);
    }
  }
  
  if(imageLoadPromises.length>0){
    await Promise.allSettled(imageLoadPromises);
  }
  
  exportData.globalCards=cardsToExport;
  exportData.cardGroups=cardGroups.filter(function(g){
    return cardsToExport.some(function(c){return c.groupId===g.id;});
  }).map(function(g){
    return {
      id:g.id,
      name:g.name,
      category:g.category,
      type:g.type,
      contactId:g.contactId||null,
      disabled:g.disabled||false,
      disabledContacts:g.disabledContacts||[]
    };
  });
  
  exportData.cardPrivateContacts=cardPrivateContacts.map(function(pc){
    return {id:pc.id,name:pc.name,bindContactId:pc.bindContactId||null};
  });
  
  if(opts.categories.includes('touch')){
    exportData.touchCardsPublic=ls('ml2_touch_cards_public')||[];
    exportData.touchCardsPrivate=ls('ml2_touch_cards_private')||{};
    exportData.touchGroups=ls('ml2_touch_groups')||{public:[],private:{}};
    exportData.touchGroupCards=ls('ml2_touch_group_cards')||{};
  }
  
  if(opts.categories.includes('voices')){
    exportData.navCardsPublic=[];
    try{var ncpRaw=safeGetItem('ml2_lf_ml2_nav_cards_public');if(ncpRaw)exportData.navCardsPublic=JSON.parse(ncpRaw);}catch(e){}
    exportData.navCardsPrivate={};
    for(var i=0;i<contacts.length;i++){
      var ncId=contacts[i].id;
      try{var nprRaw=safeGetItem('ml2_lf_ml2_nav_cards_private_'+ncId);if(nprRaw)exportData.navCardsPrivate[ncId]=JSON.parse(nprRaw);}catch(e){}
    }
    exportData.navCardGroups=navCardGroups||{};
    exportData.navDisplayStates=navDisplayStates||{};
  }
  
  exportData.contacts=contacts.map(function(c){
    return {id:c.id,name:c.name,avatar:c.avatar||''};
  });
  
  var jsonStr=JSON.stringify(exportData);
  var blob=new Blob([jsonStr],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;
  a.download='星言字卡数据_'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('字卡数据已导出');
  try{await loadCardImagesAsync()}catch(e){}
  renderCardList();
}

function normalizeImportData(data){

  // === milk 格式自动适配 ===
  if(data._groupExport===true||(data.customReplyGroups&&Array.isArray(data.customReplyGroups))){
    var ts=Date.now();
    function randSuf(){return Math.random().toString(36).slice(2,6);}
    var groups=[];
    var cards=[];
    var groupIdMap={};
    var groupedContents={};
    if(data.customReplyGroups&&Array.isArray(data.customReplyGroups)){
      for(var gi=0;gi<data.customReplyGroups.length;gi++){
        var g=data.customReplyGroups[gi];
        var gid='g_'+ts+'_'+randSuf();
        groupIdMap[g.id]=gid;
        groups.push({id:gid,name:g.name||'未命名分组',category:'custom',type:'public',contactId:null,disabled:g.disabled||false,disabledContacts:[]});
        if(g.items&&Array.isArray(g.items)){
          for(var ii=0;ii<g.items.length;ii++){
            var item=g.items[ii];
            if(typeof item==='string'){
              if(!groupedContents[item])groupedContents[item]=[];
              groupedContents[item].push(gid);
            }
            cards.push({
              id:'c_'+ts+'_'+randSuf(),
              content:typeof item==='string'?item:String(item),
              text:'',
              type:'public',
              category:'custom',
              groupId:gid,
              groupName:g.name||'未命名分组',
              contactId:null,
              voiceText:'',
              duration:0
            });
          }
        }
      }
    }
    var ungrouped=[];
    if(data.customReplies&&Array.isArray(data.customReplies)){
      for(var ri=0;ri<data.customReplies.length;ri++){
        var r=data.customReplies[ri];
        if(typeof r==='string'&&!groupedContents[r]){
          ungrouped.push(r);
        }
      }
    }
    if(ungrouped.length>0){
      var dgid='g_'+ts+'_'+randSuf();
      groups.push({id:dgid,name:'未分组',category:'custom',type:'public',contactId:null,disabled:false,disabledContacts:[]});
      for(var ui=0;ui<ungrouped.length;ui++){
        var dup=false;
        for(var ci=0;ci<cards.length;ci++){if(cards[ci].content===ungrouped[ui]){dup=true;break;}}
        if(!dup){
          cards.push({
            id:'c_'+ts+'_'+randSuf(),
            content:ungrouped[ui],
            text:'',
            type:'public',
            category:'custom',
            groupId:dgid,
            groupName:'未分组',
            contactId:null,
            voiceText:'',
            duration:0
          });
        }
      }
    }
    data={version:'1.4',exportTime:new Date().toISOString(),globalCards:cards,cardGroups:groups,_fromMilk:true,images:data.images||{},voices:data.voices||{},cardPrivateContacts:[],touchCardsPublic:[],touchCardsPrivate:{},touchGroups:{public:[],private:{}},touchGroupCards:{},navCardsPublic:[],navCardsPrivate:{},navCardGroups:{},navDisplayStates:{}};
  }
  // === milk 表情包自动适配 ===
  if(data.type==='sticker-export'||(data.stickerLibrary&&Array.isArray(data.stickerLibrary))){
    var sTs=Date.now();
    function sRand(){return Math.random().toString(36).slice(2,6);}
    var sCards=[];
    var sGroups=[];
    var sgid='g_'+sTs+'_'+sRand();
    sGroups.push({id:sgid,name:'默认分组',category:'custom',type:'public',contactId:null,disabled:false,disabledContacts:[]});
    var allStickers=(data.stickerLibrary||[]).concat(data.myStickerLibrary||[]);
    for(var si=0;si<allStickers.length;si++){
      sCards.push({id:'c_'+sTs+'_'+sRand(),content:allStickers[si],text:'',type:'public',category:'stickers',groupId:sgid,groupName:'默认分组',contactId:null,voiceText:'',duration:0});
    }
    data={version:'1.4',exportTime:new Date().toISOString(),globalCards:sCards,cardGroups:sGroups,_fromMilk:true,images:data.images||{},voices:data.voices||{},cardPrivateContacts:[],touchCardsPublic:[],touchCardsPrivate:{},touchGroups:{public:[],private:{}},touchGroupCards:{},navCardsPublic:[],navCardsPrivate:{},navCardGroups:{},navDisplayStates:{}};
  }
  var result={
    version:data.version||'1.0',
    exportTime:data.exportTime||new Date().toISOString(),
    _fromMilk:data._fromMilk||false,
    globalCards:[],
    cardGroups:[],
    images:data.images||{},
    voices:data.voices||{},
    cardPrivateContacts:data.cardPrivateContacts||[],
    touchCardsPublic:data.touchCardsPublic||[],
    touchCardsPrivate:data.touchCardsPrivate||{},
    touchGroups:data.touchGroups||{public:[],private:{}},
    touchGroupCards:data.touchGroupCards||{},
    navCardsPublic:data.navCardsPublic||[],
    navCardsPrivate:data.navCardsPrivate||{},
    navCardGroups:data.navCardGroups||{},
    navDisplayStates:data.navDisplayStates||{}
  };
  
  if(data.globalCards&&Array.isArray(data.globalCards)){
    result.globalCards=data.globalCards.map(function(card){
      var normalized={
        id:card.id||'c_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
        content:card.content||card.text||'',
        type:card.type||'public',
        category:card.category||'custom',
        groupId:card.groupId||card.group||'',
        groupName:card.groupName||'',
        contactId:card.contactId||null,
        voiceText:card.voiceText||'',
        duration:card.duration||0,
        text:card.text||card.content||''
      };
      return normalized;
    });
  }
  
  if(data.cardGroups&&Array.isArray(data.cardGroups)){
    result.cardGroups=data.cardGroups.map(function(group){
      return {
        id:group.id||'g_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
        name:group.name||'未命名分组',
        category:group.category||'custom',
        type:group.type||'public',
        contactId:group.contactId||null,
        disabled:group.disabled||false,
        disabledContacts:group.disabledContacts||[]
      };
    });
  }
  
  return result;
}

async function importCardsJSON(rawData,options){
  var opts=options||{categories:_cardCategories.map(function(c){return c.key}),cardType:'all',overwrite:true};
  
  var importData=normalizeImportData(rawData);
  
  // === milk 导入覆盖分类/类型 ===
  if(importData._fromMilk){
    if(opts.categories&&opts.categories.length===1){
      var targetCat=opts.categories[0];
      importData.globalCards.forEach(function(card){card.category=targetCat;});
      if(importData.cardGroups){
        importData.cardGroups.forEach(function(g){g.category=targetCat;});
      }
    }
    if(opts.cardType&&opts.cardType!=='all'){
      importData.globalCards.forEach(function(card){card.type=opts.cardType;});
      if(importData.cardGroups){
        importData.cardGroups.forEach(function(g){g.type=opts.cardType;});
      }
    }
  }
  
  if(!importData.globalCards||!Array.isArray(importData.globalCards)){
    toast('无效的字卡数据');
    return;
  }
  
  if(opts.overwrite){
    if(!confirm('导入字卡将覆盖所选分类的字卡数据，确定继续？')){
      return;
    }
  }else{
    if(!confirm('导入字卡将合并到现有数据中，确定继续？')){
      return;
    }
  }
  
  var filteredCards=importData.globalCards.filter(function(card){
    if(!opts.categories.includes(card.category))return false;
    if(opts.cardType==='public'&&card.type==='private')return false;
    if(opts.cardType==='private'&&card.type!=='private')return false;
    return true;
  });
  
  // ★ 公用字卡自动去重：
  // overwrite=true（覆盖导入）：仅去除导入文件内部的重复公用字卡
  // overwrite=false（合并导入）：与现有库中已有公用字卡按内容去重 + 文件内部去重
  var dupCount=0;
  var existingPublicContent=new Set();
  if(!opts.overwrite){
    globalCards.forEach(function(ec){
      if(ec.type==='public'||!ec.type){
        existingPublicContent.add((ec.content||'').trim());
      }
    });
  }
  var seenContent=new Set();
  filteredCards=filteredCards.filter(function(card){
    if(card.type==='private'||card.type==='personal')return true;
    var key=(card.content||'').trim();
    if(existingPublicContent.has(key)||seenContent.has(key)){
      dupCount++;
      return false;
    }
    seenContent.add(key);
    return true;
  });
  if(dupCount>0){
    toast('已自动去重 '+dupCount+' 张重复公用字卡');
  }
  
  if(opts.overwrite){
    globalCards=globalCards.filter(function(c){
      if(!opts.categories.includes(c.category))return true;
      if(opts.cardType==='all')return false;
      if(opts.cardType==='public'&&c.type!=='private')return false;
      if(opts.cardType==='private'&&c.type==='private')return false;
      return true;
    });
  }
  
  var savePromises=[];
  
  for(var i=0;i<filteredCards.length;i++){
    var card=filteredCards[i];
    var cardCopy=Object.assign({},card);
    
    if(card.content&&card.content.startsWith('__img__')){
      var imgRefId=card.content.substring(7);
      if(importData.images&&importData.images[imgRefId]){
        var imgKey='ml2_card_img_'+card.id;
        var imgData=importData.images[imgRefId];
        if(window.localforage){
          savePromises.push(window.localforage.setItem(imgKey,imgData));
        }
        cardCopy.content=imgData;
        globalCards.push(cardCopy);
      }else{
        globalCards.push(cardCopy);
      }
    }else if(card.content&&card.content.startsWith('__voice__')){
      var voiceRefId=card.content.substring(9);
      if(importData.voices&&importData.voices[voiceRefId]){
        cardCopy.content=importData.voices[voiceRefId];
        globalCards.push(cardCopy);
      }else{
        globalCards.push(cardCopy);
      }
    }else if(card.content&&card.content.startsWith('data:image/')){
      var imgKey='ml2_card_img_'+card.id;
      if(window.localforage){
        savePromises.push(window.localforage.setItem(imgKey,card.content));
      }
      cardCopy.content=card.content;
      globalCards.push(cardCopy);
    }else if(card.category==='voices'&&importData.voices&&importData.voices[card.id]){
      cardCopy.content=importData.voices[card.id];
      globalCards.push(cardCopy);
    }else if(card.content&&card.content.startsWith('ml2_card_img_')&&importData.images&&importData.images[card.content]){
      var storedImgKey='ml2_card_img_'+card.id;
      var imgData=importData.images[card.content];
      if(window.localforage){
        savePromises.push(window.localforage.setItem(storedImgKey,imgData));
      }
      cardCopy.content=imgData;
      globalCards.push(cardCopy);
    }else{
      globalCards.push(cardCopy);
    }
  }
  
  if(savePromises.length>0){
    await Promise.allSettled(savePromises);
  }
  
  if(importData.cardGroups&&Array.isArray(importData.cardGroups)){
    var newGroups=importData.cardGroups.filter(function(g){
      return filteredCards.some(function(c){return c.groupId===g.id;});
    });
    if(opts.overwrite){
      var newGroupIds=newGroups.map(function(g){return g.id;});
      cardGroups=cardGroups.filter(function(g){return !newGroupIds.includes(g.id);});
    }
    cardGroups=cardGroups.concat(newGroups);
  }
  
  if(opts.categories.includes('touch')){
    if(importData.touchCardsPublic&&Array.isArray(importData.touchCardsPublic)){
      ls('ml2_touch_cards_public',importData.touchCardsPublic);
    }
    if(importData.touchCardsPrivate&&typeof importData.touchCardsPrivate==='object'){
      ls('ml2_touch_cards_private',importData.touchCardsPrivate);
    }
    if(importData.touchGroups&&typeof importData.touchGroups==='object'){
      ls('ml2_touch_groups',importData.touchGroups);
    }
    if(importData.touchGroupCards&&typeof importData.touchGroupCards==='object'){
      ls('ml2_touch_group_cards',importData.touchGroupCards);
    }
  }
  
  if(opts.categories.includes('voices')){
    if(importData.navCardsPublic&&Array.isArray(importData.navCardsPublic)){
      ls('ml2_nav_cards_public',importData.navCardsPublic);
      if(window.localforage){window.localforage.setItem('ml2_nav_cards_public',JSON.stringify(importData.navCardsPublic)).catch(function(){});}
    }
    if(importData.navCardsPrivate&&typeof importData.navCardsPrivate==='object'){
      var privKeys=Object.keys(importData.navCardsPrivate);
      for(var pk=0;pk<privKeys.length;pk++){
        var pnk=privKeys[pk];
        var pnv=importData.navCardsPrivate[pnk];
        if(pnv&&Array.isArray(pnv)){
          var navPrivKey='ml2_nav_cards_private_'+pnk;
          ls(navPrivKey,pnv);
          if(window.localforage){window.localforage.setItem(navPrivKey,JSON.stringify(pnv)).catch(function(){});}
        }
      }
    }
    if(importData.navCardGroups&&typeof importData.navCardGroups==='object'){
      if(importData.navCardGroups.public&&Array.isArray(importData.navCardGroups.public)){
        importData.navCardGroups.public.forEach(function(g){
          if(g&&!navCardGroups.public.includes(g)){
            navCardGroups.public.push(g);
          }
        });
      }
      if(importData.navCardGroups.private&&typeof importData.navCardGroups.private==='object'){
        var privKeys=Object.keys(importData.navCardGroups.private);
        for(var pk=0;pk<privKeys.length;pk++){
          var pnk=privKeys[pk];
          var pnv=importData.navCardGroups.private[pnk];
          if(pnv&&Array.isArray(pnv)){
            if(!navCardGroups.private[pnk])navCardGroups.private[pnk]=[];
            pnv.forEach(function(g){
              if(g&&!navCardGroups.private[pnk].includes(g)){
                navCardGroups.private[pnk].push(g);
              }
            });
          }
        }
      }
      saveNavCardGroups();
    }
    if(importData.navDisplayStates&&typeof importData.navDisplayStates==='object'){
      navDisplayStates=importData.navDisplayStates;
      ls('ml2_nav_display_states',navDisplayStates);
      if(window.localforage){window.localforage.setItem('ml2_nav_display_states',navDisplayStates).catch(function(){});}
    }
  }
  
  if(importData.cardPrivateContacts&&Array.isArray(importData.cardPrivateContacts)){
    cardPrivateContacts=importData.cardPrivateContacts.map(function(pc){
      return {id:pc.id,name:pc.name,bindContactId:pc.bindContactId||null};
    });
    saveCardPrivateContacts();
  }
  
  await saveGlobalCardsDebounced();
  saveCardGroups();
  // ★ 修复：导入的图片已在上面的 savePromises 写进 IndexedDB 且内容已在内存，
  // 不需要再同步 loadCardImagesAsync（避免大量图片重新读取导致导入后卡顿），改为后台延迟加载
  setTimeout(function(){
    try{loadCardImagesAsync().then(function(){try{renderCardList();}catch(e){}}).catch(function(e){console.warn('bg loadCardImagesAsync failed:',e);});}catch(e){}
  },300);
  renderCardGroups();
  renderCardList();
  toast('字卡数据已导入');
}

async function openCardSettings(){
  // 确保 globalCards 已加载，避免打开后显示0字卡
  if(!globalCards||globalCards.length===0){
    try{await loadGlobalCards();}catch(e){}
  }
  // ★ 修复：确保 cardPrivateContacts 从 IndexedDB 恢复完成，避免专享字卡绑定丢失/误判
  if(!_cardPrivateContactsReady){
    try{await loadCardPrivateContacts();}catch(e){}
  }
  
  // 自动选择第一个有字卡的分类/类型，避免打开后显示0字卡
  var prefTypes=['public','private'];
  var allCats=[];
  globalCards.forEach(function(c){
    if(c&&c.category&&allCats.indexOf(c.category)<0)allCats.push(c.category);
  });
  var foundType=null,foundCat=null;
  for(var ti=0;ti<prefTypes.length&&!foundType;ti++){
    for(var ci=0;ci<allCats.length;ci++){
      var cnt=globalCards.filter(function(c){return c&&c.category===allCats[ci]&&(c.type===prefTypes[ti]||(!c.type&&prefTypes[ti]==='public'));}).length;
      if(cnt>0){foundType=prefTypes[ti];foundCat=allCats[ci];break;}
    }
  }
  if(foundType){currentCardType=foundType;currentCardCategory=foundCat;}
  else{currentCardType='public';currentCardCategory='custom';}

  // 若是私有字卡，自动选中第一个有字卡的联系人
  if(currentCardType==='private'){
    var pcWithCards=cardPrivateContacts.filter(function(pc){
      return globalCards.some(function(c){return c.type==='private'&&c.contactId===pc.id});
    });
    if(pcWithCards.length){
      selectedPrivateContact=pcWithCards[0].id;
    }else if(cardPrivateContacts.length){
      selectedPrivateContact=cardPrivateContacts[0].id;
    }
  }

  document.querySelectorAll('.card-type-tab').forEach(function(t){t.classList.toggle('sel',t.dataset.type===currentCardType)});
  if(currentCardType==='private'){
    $('private-contact-sel').style.display='block';
    renderPrivateContacts();
  }else{
    $('private-contact-sel').style.display='none';
    selectedPrivateContact=null;
  }
  
  // Handle default_common type
  if(currentCardType==='default_common'){
    renderDefaultCommonCards();
    showPg('pg-cards');
    return;
  }
  
  // Restore regular card UI when not default_common
  var dcSettings=$('default-common-settings'); if(dcSettings)dcSettings.style.display='none';
  var dcCatTabs=$('default-common-category-tabs'); if(dcCatTabs)dcCatTabs.style.display='none';
  var dcArea=$('default-common-cards-area'); if(dcArea)dcArea.style.display='none';
  var cardList=$('card-list'); if(cardList)cardList.style.display='block';
  var cardToolbar=document.querySelector('.card-toolbar'); if(cardToolbar)cardToolbar.style.display='flex';
  var batchCardText=$('batch-card-text'); if(batchCardText)batchCardText.style.display='block';
  var cardSearch=$('card-search-input'); if(cardSearch)cardSearch.parentElement.style.display='block';
  
  document.querySelectorAll('.card-category-tab').forEach(function(t){t.classList.remove('sel')});
  var activeTab=document.querySelector('.card-category-tab[data-category="'+currentCardCategory+'"]');
  if(activeTab)activeTab.classList.add('sel');
  
  renderCardGroups();
  renderPrivateContacts();
  renderCardList();
  var categoryTabs=$('card-category-tabs');
  if(categoryTabs){
    categoryTabs.style.display=currentCardType==='personal'?'none':'flex';
  }
  showPg('pg-cards');
}

if($('close-card'))$('close-card').addEventListener('click',function(){showPg('pg-list');renderChatList()});



document.querySelectorAll('.card-type-tab').forEach(function(tab){
  tab.addEventListener('click',function(){
    document.querySelectorAll('.card-type-tab').forEach(function(t){t.classList.remove('sel')});
    this.classList.add('sel');
    currentCardType=this.dataset.type;
    if(currentCardType==='private'){
      $('private-contact-sel').style.display='block';
      if(!selectedPrivateContact&&cardPrivateContacts.length>0){
        selectedPrivateContact=cardPrivateContacts[0].id;
      }
    }else{
      $('private-contact-sel').style.display='none';
      selectedPrivateContact=null;
    }
    
    if(currentCardType==='personal'){
      currentCardCategory='stickers';
      document.querySelectorAll('.card-category-tab').forEach(function(t){t.classList.remove('sel')});
      document.querySelector('.card-category-tab[data-category="stickers"]').classList.add('sel');
    }
    
    // Handle default_common type
    if(currentCardType==='default_common'){
      if(!globalCards||globalCards.length===0){
        (async function(){
          try{await loadGlobalCards();}catch(e){}
          renderDefaultCommonCards();
        })();
      }else{
        renderDefaultCommonCards();
      }
      return;
    }
    
    // Restore regular card UI when not default_common
    var dcSettings=$('default-common-settings'); if(dcSettings)dcSettings.style.display='none';
    var dcCatTabs=$('default-common-category-tabs'); if(dcCatTabs)dcCatTabs.style.display='none';
    var dcArea=$('default-common-cards-area'); if(dcArea)dcArea.style.display='none';
    var cardList=$('card-list'); if(cardList)cardList.style.display='block';
    var cardToolbar=document.querySelector('.card-toolbar'); if(cardToolbar)cardToolbar.style.display='flex';
    var batchCardText=$('batch-card-text'); if(batchCardText)batchCardText.style.display='block';
    var cardSearch=$('card-search-input'); if(cardSearch)cardSearch.parentElement.style.display='block';
    
    renderPrivateContacts();
    renderCardGroups();
    renderCardList();
    
    var categoryTabs=$('card-category-tabs');
    if(categoryTabs){
      categoryTabs.style.display=currentCardType==='personal'?'none':'flex';
    }
    var batchCardText=$('batch-card-text');
    if(batchCardText){
      batchCardText.style.display=currentCardCategory==='custom'||currentCardCategory==='kaomoji'||currentCardCategory==='emojis'?'block':'none';
    }
    var batchCardSticker=$('batch-card-sticker');
    if(batchCardSticker){
      batchCardSticker.style.display=currentCardCategory==='stickers'?'block':'none';
    }
    var batchCardImage=$('batch-card-image');
    if(batchCardImage){
      batchCardImage.style.display=currentCardCategory==='image'?'block':'none';
    }
    $('batch-card-voice').style.display=currentCardCategory==='voices'?'block':'none';
    $('batch-card-touch').style.display=currentCardCategory==='touch'?'block':'none';
  });
});



document.querySelectorAll('.card-category-tab').forEach(function(tab){
  tab.addEventListener('click',function(){
    // Skip default common category tabs (handled separately)
    if(this.dataset.dcCat)return;
    document.querySelectorAll('.card-category-tab').forEach(function(t){t.classList.remove('sel')});
    this.classList.add('sel');
    currentCardCategory=this.dataset.category;
    currentCardGroup='all';
    renderCardGroups();
    renderCardList();
    
    if($('batch-card-text'))$('batch-card-text').style.display=currentCardCategory==='custom'||currentCardCategory==='kaomoji'||currentCardCategory==='emojis'?'block':'none';
    if($('batch-card-sticker'))$('batch-card-sticker').style.display=currentCardCategory==='stickers'?'block':'none';
    if($('batch-card-image'))$('batch-card-image').style.display=currentCardCategory==='image'?'block':'none';
    if($('batch-card-voice'))$('batch-card-voice').style.display=currentCardCategory==='voices'?'block':'none';
    if($('batch-card-touch'))$('batch-card-touch').style.display=currentCardCategory==='touch'?'block':'none';
    if($('batch-card-nav'))$('batch-card-nav').style.display=currentCardCategory==='nav'?'block':'none';
  });
});

function renderPrivateContacts(){
  var sel=$('private-contact-list');
  if(!sel)return;
  
  var html='';
  
  // 自动检测未绑定的专享字卡并创建联系人
  // ★ 修复：cardPrivateContacts 未从 IndexedDB 恢复完成前禁止自动检测，
  // 避免把已绑定字卡误判为未绑定、用 pc_id 当名字创建假联系人并覆盖真实数据
  var unboundCards=[];
  if(_cardPrivateContactsReady||cardPrivateContacts.length>0){
    unboundCards=globalCards.filter(function(c){return c.type==='private'&&c.contactId&&!cardPrivateContacts.some(function(pc){return pc.id===c.contactId})});
  }
  var unboundContactIds=[];
  unboundCards.forEach(function(c){if(unboundContactIds.indexOf(c.contactId)===-1)unboundContactIds.push(c.contactId)});
  
  if(unboundContactIds.length>0){
    unboundContactIds.forEach(function(cid){
      var count=unboundCards.filter(function(c){return c.contactId===cid}).length;
      var displayName=cid.length>15?cid.substring(0,12)+'...':cid;
      var newPc={id:cid,name:displayName.replace(/^c_/,''),bindContactId:null};
      cardPrivateContacts.push(newPc);
    });
    saveCardPrivateContacts();
  }
  
  // 顶部提示条
  html+='<div style="font-size:11px;color:var(--txt4);padding:8px 12px;background:var(--c1);border-radius:10px;margin-bottom:12px;line-height:1.5;display:flex;align-items:center;gap:6px;">';
  html+='<span style="font-size:14px;">💡</span>';
  html+='<span>先新建字卡联系人，再绑定到聊天联系人，即可使用专享字卡</span>';
  html+='</div>';
  
  if(cardPrivateContacts.length===0){
    html+='<div style="text-align:center;padding:40px 20px;color:var(--txt4);font-size:13px;display:flex;flex-direction:column;align-items:center;gap:10px;">';
    html+='<span style="font-size:32px;opacity:0.5;">📭</span>';
    html+='<span>暂无字卡联系人</span>';
    html+='<span style="font-size:11px;color:var(--txt4);">点击下方按钮新建</span>';
    html+='</div>';
  }else{
    html+='<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;">';
    cardPrivateContacts.forEach(function(pc,pcIdx){
      var isSelected=selectedPrivateContact===pc.id;
      var bindContact=pc.bindContactId?contacts.find(function(c){return c.id===pc.bindContactId}):null;
      
      // 头像渐变颜色
      var avatarColors=['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#98D8C8','#F7DC6F','#BB8FCE','#85C1E9'];
      var colorIdx=pcIdx%avatarColors.length;
      var avatarBg=avatarColors[colorIdx];
      
      html+='<div class="private-contact-row" data-cid="'+pc.id+'" style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;background:'+(isSelected?'var(--c1)':'var(--c1)')+';cursor:pointer;border:1.5px solid '+(isSelected?'var(--accent)':'var(--border)')+';transition:all 0.2s ease;box-shadow:'+(isSelected?'0 2px 8px rgba(0,150,255,0.08)':'none')+';">';
      
      // 头像
      html+='<div style="width:36px;height:36px;border-radius:50%;background:'+avatarBg+';display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;color:#fff;flex-shrink:0;box-shadow:0 2px 6px '+avatarBg+'44;">'+pc.name.charAt(0)+'</div>';
      
      // 名称和状态
      html+='<div style="flex:1;min-width:0;">';
      html+='<div style="display:flex;align-items:center;gap:4px;">';
      html+='<span style="font-size:13px;color:var(--txt);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+pc.name+'</span>';
      html+='<button onclick="event.stopPropagation();renamePrivateContact(\''+pc.id+'\')" style="width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:10px;background:transparent;color:var(--txt4);border:none;border-radius:4px;cursor:pointer;flex-shrink:0;" title="修改昵称">✎</button>';
      html+='</div>';
      if(bindContact){
        html+='<div style="display:flex;align-items:center;gap:4px;margin-top:2px;">';
        html+='<span style="font-size:10px;color:var(--accent);background:rgba(0,150,255,0.08);padding:1px 6px;border-radius:4px;">已绑定 '+bindContact.name+'</span>';
        html+='</div>';
      }else{
        html+='<div style="display:flex;align-items:center;gap:4px;margin-top:2px;">';
        html+='<span style="font-size:10px;color:var(--txt4);">未绑定</span>';
        html+='</div>';
      }
      html+='</div>';
      
      // 操作按钮
      html+='<div style="display:flex;gap:6px;flex-shrink:0;">';
      if(bindContact){
        html+='<button onclick="event.stopPropagation();showBindContactModal(\''+pc.id+'\')" style="padding:4px 10px;font-size:10px;background:rgba(0,150,255,0.08);color:var(--accent);border:1px solid rgba(0,150,255,0.2);border-radius:6px;cursor:pointer;transition:all 0.15s;font-weight:500;" onmouseover="this.style.background=\'rgba(0,150,255,0.15)\'" onmouseout="this.style.background=\'rgba(0,150,255,0.08)\'">换绑</button>';
        html+='<button onclick="event.stopPropagation();unbindPrivateContact(\''+pc.id+'\')" style="padding:4px 10px;font-size:10px;background:rgba(255,77,79,0.06);color:#ff4d4f;border:1px solid rgba(255,77,79,0.2);border-radius:6px;cursor:pointer;transition:all 0.15s;font-weight:500;" onmouseover="this.style.background=\'rgba(255,77,79,0.12)\'" onmouseout="this.style.background=\'rgba(255,77,79,0.06)\'">解绑</button>';
      }else{
        html+='<button onclick="event.stopPropagation();showBindContactModal(\''+pc.id+'\')" style="padding:4px 12px;font-size:10px;background:var(--accent);color:#fff;border:none;border-radius:6px;cursor:pointer;transition:all 0.15s;font-weight:500;" onmouseover="this.style.opacity=\'0.85\'" onmouseout="this.style.opacity=\'1\'">+ 绑定</button>';
      }
      html+='<button onclick="event.stopPropagation();deletePrivateContact(\''+pc.id+'\')" style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:10px;background:transparent;color:var(--txt4);border:none;border-radius:6px;cursor:pointer;transition:all 0.15s;" onmouseover="this.style.background=\'rgba(255,77,79,0.08)\';this.style.color=\'#ff4d4f\'" onmouseout="this.style.background=\'transparent\';this.style.color=\'var(--txt4)\'">✕</button>';
      html+='</div>';
      
      html+='</div>';
    });
    html+='</div>';
  }
  
  html+='<button id="add-private-contact-btn" style="width:100%;padding:8px 0;border-radius:10px;border:1.5px dashed var(--border);color:var(--txt2);cursor:pointer;font-size:12px;background:var(--c1);transition:all 0.15s;font-weight:500;" onmouseover="this.style.borderColor=\'var(--accent)\';this.style.color=\'var(--accent)\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.color=\'var(--txt2)\'">+ 新建字卡联系人</button>';
  
  sel.innerHTML=html;
  
  sel.querySelector('#add-private-contact-btn').addEventListener('click',function(){
    customPrompt('请输入字卡联系人昵称：','').then(function(name){
      if(!name)return;
      name=name.trim();
      if(!name){toast('请输入昵称');return}
      var newPc={id:'pc_'+Date.now(),name:name,bindContactId:null};
      cardPrivateContacts.push(newPc);
      saveCardPrivateContacts();
      selectedPrivateContact=newPc.id;
      renderPrivateContacts();
      renderCardGroups();
      renderCardList();
      toast('已添加字卡联系人「'+name+'」');
    });
  });
  
  sel.querySelectorAll('.private-contact-row').forEach(function(row){
    row.addEventListener('click',function(){
      var cid=this.dataset.cid;
      sel.querySelectorAll('.private-contact-row').forEach(function(x){
        x.classList.remove('sel');
        x.style.borderColor='var(--border)';
        x.style.boxShadow='none';
      });
      this.classList.add('sel');
      this.style.borderColor='var(--accent)';
      this.style.boxShadow='0 2px 8px rgba(0,150,255,0.08)';
      selectedPrivateContact=cid;
      currentCardGroup='all';
      renderCardGroups();
      renderCardList();
    });
  });
}

function deletePrivateContact(pcId){
  if(!confirm('确定删除字卡联系人「'+((cardPrivateContacts.find(function(p){return p.id===pcId})||{}).name||'')+'」吗？\n字卡内容不会被删除。'))return;
  cardPrivateContacts=cardPrivateContacts.filter(function(p){return p.id!==pcId});
  saveCardPrivateContacts();
  if(selectedPrivateContact===pcId){
    selectedPrivateContact=cardPrivateContacts.length>0?cardPrivateContacts[0].id:null;
  }
  renderPrivateContacts();
  renderCardGroups();
  renderCardList();
  renderNavCardContactSelect();
  toast('已删除字卡联系人');
}

function renamePrivateContact(pcId){
  var pc=cardPrivateContacts.find(function(p){return p.id===pcId});
  if(!pc)return;
  var name=prompt('请输入新的字卡联系人昵称：',pc.name);
  if(!name)return;
  name=name.trim();
  if(!name){toast('请输入昵称');return}
  pc.name=name;
  saveCardPrivateContacts();
  renderPrivateContacts();
  renderCardGroups();
  renderNavCardContactSelect();
  toast('已修改昵称为「'+name+'」');
}

function showBindContactModal(pcId){
  var modal=document.createElement('div');
  modal.className='overlay';
  modal.style.display='flex';
  modal.style.alignItems='center';
  modal.style.justifyContent='center';
  modal.style.zIndex='10000';
  
  var modalContent=document.createElement('div');
  modalContent.style.width='85%';
  modalContent.style.maxWidth='360px';
  modalContent.style.background='white';
  modalContent.style.borderRadius='20px';
  modalContent.style.overflow='hidden';
  modalContent.style.boxShadow='0 20px 60px rgba(0,0,0,0.15)';
  
  var header=document.createElement('div');
  header.style.padding='16px 20px';
  header.style.borderBottom='1px solid var(--border)';
  header.style.display='flex';
  header.style.justifyContent='space-between';
  header.style.alignItems='center';
  header.innerHTML='<div style="font-size:16px;font-weight:600;color:var(--txt);">绑定聊天联系人</div><button onclick="this.closest(\'.overlay\').remove()" style="width:32px;height:32px;border:none;background:none;font-size:18px;color:var(--txt3);cursor:pointer;border-radius:50%;display:flex;align-items:center;justify-content:center;">×</button>';
  
  var body=document.createElement('div');
  body.style.padding='16px';
  body.style.maxHeight='55vh';
  body.style.overflowY='auto';
  
  var hint=document.createElement('div');
  hint.style.fontSize='13px';
  hint.style.color='var(--txt3)';
  hint.style.marginBottom='12px';
  hint.style.padding='10px 12px';
  hint.style.background='var(--c1)';
  hint.style.borderRadius='10px';
  hint.textContent='选择一个聊天联系人进行绑定';
  
  // 搜索框
  var searchInput=document.createElement('input');
  searchInput.type='text';
  searchInput.placeholder='搜索联系人...';
  searchInput.style.cssText='width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:10px;background:var(--c1);font-size:13px;color:var(--txt);outline:none;box-sizing:border-box;margin-bottom:12px;';
  searchInput.oninput=function(){renderContactList(this.value)};
  
  var list=document.createElement('div');
  list.style.display='flex';
  list.style.flexDirection='column';
  list.style.gap='6px';
  list.id='bind-contact-list-items';
  
  function renderContactList(filter){
    list.innerHTML='';
    var filtered=filter?contacts.filter(function(c){return c.id!=='fh'&&c.name.toLowerCase().includes(filter.toLowerCase())}):contacts.filter(function(c){return c.id!=='fh'});
    if(filtered.length===0){
      var empty=document.createElement('div');
      empty.style.cssText='text-align:center;padding:20px;color:var(--txt4);font-size:12px;';
      empty.textContent='无匹配联系人';
      list.appendChild(empty);
      return;
    }
    filtered.forEach(function(c){
      var avatar=c.avatar||c.name.charAt(0)||'?';
      var hasImg=c.avatar&&c.avatar.startsWith('data:');
      
      var item=document.createElement('div');
      item.className='bind-friend-item';
      item.dataset.contactId=c.id;
      item.dataset.pcId=pcId;
      item.style.display='flex';
      item.style.alignItems='center';
      item.style.gap='12px';
      item.style.padding='10px 14px';
      item.style.borderRadius='12px';
      item.style.background='var(--c1)';
      item.style.cursor='pointer';
      item.style.transition='all 0.15s';
      item.style.border='1px solid var(--border)';
      item.onmouseover=function(){this.style.background='var(--c2)';this.style.borderColor='var(--accent)';};
      item.onmouseout=function(){this.style.background='var(--c1)';this.style.borderColor='var(--border)';};
      
      var avatarDiv=document.createElement('div');
      avatarDiv.style.width='36px';
      avatarDiv.style.height='36px';
      avatarDiv.style.borderRadius='50%';
      avatarDiv.style.background='var(--c3)';
      avatarDiv.style.display='flex';
      avatarDiv.style.alignItems='center';
      avatarDiv.style.justifyContent='center';
      avatarDiv.style.fontSize='14px';
      avatarDiv.style.color='var(--txt2)';
      avatarDiv.style.overflow='hidden';
      avatarDiv.style.flexShrink='0';
      
      if(hasImg){
        avatarDiv.innerHTML='<img src="'+c.avatar+'" style="display:block;width:100%;height:100%;object-fit:cover;">';
      }else{
        avatarDiv.textContent=avatar;
      }
      
      var nameDiv=document.createElement('div');
      nameDiv.style.flex='1';
      nameDiv.style.fontSize='13px';
      nameDiv.style.color='var(--txt)';
      nameDiv.style.fontWeight='500';
      nameDiv.textContent=c.name;
      
      var arrow=document.createElement('div');
      arrow.style.fontSize='12px';
      arrow.style.color='var(--txt4)';
      arrow.style.marginLeft='auto';
      arrow.textContent='→';
      
      item.appendChild(avatarDiv);
      item.appendChild(nameDiv);
      item.appendChild(arrow);
      list.appendChild(item);
      
      item.addEventListener('click',function(){
        var contactId=this.dataset.contactId;
        var privateContactId=this.dataset.pcId;
        
        var pc=cardPrivateContacts.find(function(p){return p.id===privateContactId});
        if(pc){
          pc.bindContactId=contactId;
          saveCardPrivateContacts();
        }
        
        modal.remove();
        renderPrivateContacts();
        renderNavCardContactSelect();
        toast('绑定成功');
      });
    });
  }
  
  renderContactList('');
  
  body.appendChild(hint);
  body.appendChild(searchInput);
  body.appendChild(list);
  modalContent.appendChild(header);
  modalContent.appendChild(body);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  modal.addEventListener('click',function(e){
    if(e.target===modal)modal.remove();
  });
}

function showPrivateContactManageModal(){
  // 打开字卡库并切换到专享字卡页
  showPg('pg-cards');
  document.querySelectorAll('.card-type-tab').forEach(function(t){
    t.classList.remove('sel');
    if(t.dataset.type==='private')t.classList.add('sel');
  });
  currentCardType='private';
  $('private-contact-sel').style.display='block';
  if(!selectedPrivateContact&&cardPrivateContacts.length>0){
    selectedPrivateContact=cardPrivateContacts[0].id;
  }
  renderPrivateContacts();
  renderCardGroups();
  renderCardList();
  var categoryTabs=$('card-category-tabs');
  if(categoryTabs)categoryTabs.style.display='flex';
  toast('请在字卡库中管理字卡联系人');
}

function unbindPrivateContact(pcId){
  var pc=cardPrivateContacts.find(function(p){return p.id===pcId});
  if(pc){
    pc.bindContactId=null;
    saveCardPrivateContacts();
    renderPrivateContacts();
    renderNavCardContactSelect();
    toast('已解除绑定');
  }
}

function addPrivateContactFromModal(){
  var name=prompt('请输入字卡联系人昵称：');
  if(!name)return;
  name=name.trim();
  if(!name){toast('请输入昵称');return}
  var newPc={id:'pc_'+Date.now(),name:name,bindContactId:null};
  cardPrivateContacts.push(newPc);
  saveCardPrivateContacts();
  renderPrivateContacts();
  renderNavCardContactSelect();
  toast('已添加字卡联系人「'+name+'」');
}

function showBindUnboundCardsModal(sourceContactId){
  var unboundCards=globalCards.filter(function(c){return c.type==='private'&&c.contactId===sourceContactId});
  
  var modalContent='<div style="padding:16px;">';
  modalContent+='<div style="font-size:16px;font-weight:600;color:#333;margin-bottom:8px;">绑定字卡联系人</div>';
  modalContent+='<div style="font-size:13px;color:#666;margin-bottom:16px;">将 '+unboundCards.length+' 张专享字卡绑定到现有联系人</div>';
  
  modalContent+='<div style="font-size:13px;color:#666;margin-bottom:8px;">选择联系人：</div>';
  modalContent+='<div class="contact-sel2" id="bind-contact-list" style="margin-bottom:16px;"></div>';
  
  modalContent+='</div>';
  
  modalContent+='<div class="modal-footer" style="padding:16px;border-top:1px solid var(--border);display:flex;gap:10px;">';
  modalContent+='<button class="btn btn-cancel" style="flex:1;" onclick="hideOv(\'ov-bind-cards\')">取消</button>';
  modalContent+='<button class="btn" style="flex:1;" onclick="bindUnboundCards(\''+sourceContactId+'\')">确认绑定</button>';
  modalContent+='</div>';
  
  var ov=document.createElement('div');
  ov.className='overlay';
  ov.id='ov-bind-cards';
  ov.innerHTML='<div class="modal" style="width:100%;max-width:400px;">'+modalContent+'</div>';
  document.body.appendChild(ov);
  
  var bindList=$('bind-contact-list');
  if(bindList){
    bindList.innerHTML=contacts.map(function(c){
      return'<div class="chip'+(selectedBindContact===c.id?' sel':'')+'" data-cid="'+c.id+'">'+c.name+'</div>';
    }).join('');
    
    bindList.querySelectorAll('.chip').forEach(function(ch){
      ch.addEventListener('click',function(){
        bindList.querySelectorAll('.chip').forEach(function(x){x.classList.remove('sel')});
        this.classList.add('sel');
        selectedBindContact=this.dataset.cid;
      });
    });
  }
  
  ov.addEventListener('click',function(e){
    if(e.target===ov)hideOv('ov-bind-cards');
  });
}

var selectedBindContact=null;

function bindUnboundCards(sourceContactId){
  if(!selectedBindContact){
    toast('请先选择要绑定的联系人');
    return;
  }
  
  globalCards.forEach(function(card){
    if(card.type==='private'&&card.contactId===sourceContactId){
      card.contactId=selectedBindContact;
    }
  });
  
  cardGroups.forEach(function(g){
    if(g.type==='private'&&g.contactId===sourceContactId){
      g.contactId=selectedBindContact;
    }
  });
  
  saveGlobalCardsDebounced();
  saveCardGroups();
  
  hideOv('ov-bind-cards');
  selectedBindContact=null;
  renderPrivateContacts();
  renderCardGroups();
  renderCardList();
  toast('字卡绑定成功');
}

function renderCardGroups(){
  var sel=$('group-select');
  if(!sel)return;
  
  var validGroups;
  
  if(currentCardCategory==='touch'){
    var touchGroups=getTouchGroups(currentCardType);
    if(!Array.isArray(touchGroups))touchGroups=['默认'];
    validGroups=touchGroups.map(function(groupName){
      return{
        id:'default_touch'+(currentCardType==='private'?'_'+selectedPrivateContact:'')+'_'+groupName,
        name:groupName,
        category:'touch',
        type:currentCardType,
        contactId:currentCardType==='private'?selectedPrivateContact:null
      };
    });
  }else{
    validGroups=(cardGroups||[]).filter(function(g){
      if(!g||!g.id||!g.name)return false;
      if(g.name.length>30)return false;
      var groupType=g.type||'public';
      if(groupType!==currentCardType)return false;
      if(g.category!==currentCardCategory)return false;
      if(currentCardType==='private'&&g.contactId!==selectedPrivateContact)return false;
      return true;
    });
    
    var defaultId='default_'+currentCardCategory+(currentCardType==='private'?'_'+selectedPrivateContact:'');
    var hasDefault=validGroups.some(function(g){return g.id===defaultId});
    var hasCardsWithoutGroup=globalCards.some(function(c){
      return c&&c.category===currentCardCategory&&c.type===currentCardType&&(!c.groupId||c.groupId===defaultId)&&(currentCardType!=='private'||c.contactId===selectedPrivateContact);
    });
    
    if(!hasDefault&&hasCardsWithoutGroup){
      var existingDefault=cardGroups.find(function(g){
        return g.name==='默认分组'&&g.category===currentCardCategory&&g.type===currentCardType&&(!g.contactId||g.contactId===selectedPrivateContact);
      });
      if(existingDefault){
        existingDefault.id=defaultId;
        existingDefault.contactId=currentCardType==='private'?selectedPrivateContact:null;
        saveCardGroups();
        validGroups.unshift(existingDefault);
      }else{
        var newDefault={id:defaultId,name:'默认分组',category:currentCardCategory,type:currentCardType,contactId:currentCardType==='private'?selectedPrivateContact:null};
        validGroups.unshift(newDefault);
        cardGroups.push(newDefault);
        saveCardGroups();
      }
    }
  }
  
  sel.innerHTML='<option value="all">全部分组</option>'+
    validGroups.map(function(g){return'<option value="'+g.id+'">'+g.name+'</option>'}).join('');
  sel.value=currentCardGroup;
}

if($('group-select'))$('group-select').addEventListener('change',function(){
  currentCardGroup=this.value;
  renderCardList();
});

var cardSearchTimer=null;
if($('card-search-input')){$('card-search-input').addEventListener('input',function(){
  if(cardSearchTimer)clearTimeout(cardSearchTimer);
  cardSearchTimer=setTimeout(function(){
    renderCardList();
  },200);
});}

if($('add-group-btn')){$('add-group-btn').addEventListener('click',function(){
  var name=prompt('请输入分组名称：');
  if(!name||!name.trim())return;
  name=name.trim();
  if(name.length>20){toast('分组名称不能超过20个字符');return}
  var isSentence=/[，。！？；：、\.\?!;:]/.test(name);
  if(isSentence&&name.length>6){toast('分组名称不能是句子');return}
  if(currentCardCategory==='touch'){
    var groups=getTouchGroups(currentCardType);
    if(groups.indexOf(name)>=0){toast('分组已存在');return}
    groups.push(name);
    saveTouchGroups(currentCardType,groups);
    renderCardGroups();
    toast('分组已添加');
    return;
  }
  cardGroups.push({id:'g_'+Date.now(),name:name,category:currentCardCategory,type:currentCardType,contactId:currentCardType==='private'?selectedPrivateContact:null});
  saveCardGroups();
  renderCardGroups();
  toast('分组已添加');
});}

if($('export-cards-btn'))$('export-cards-btn').addEventListener('click',openExportCardsDialog);
if($('import-cards-btn'))$('import-cards-btn').addEventListener('click',openImportCardsDialog);

async function deleteCardGroup(gid){
  if(gid.startsWith('default_'))return;
  var groupInfo=cardGroups.find(function(g){return g.id===gid});
  var groupName=groupInfo?.name||'该分组';
  var groupCards=globalCards.filter(function(c){return c.groupId===gid});
  var cardCount=groupCards.length;
  if(!confirm('确定要删除分组"'+groupName+'"吗？分组内的'+cardCount+'张字卡也会被一起删除。'))return;
  
  for(var i=0;i<groupCards.length;i++){
    var card=groupCards[i];
    if(card.content&&card.content.startsWith('data:image/')){
      var imgKey='ml2_card_img_'+card.id;
      if(window.localforage){
        window.localforage.removeItem(imgKey).catch(function(){});
      }
    }
  }
  
  globalCards=globalCards.filter(function(c){return c.groupId!==gid});
  cardGroups=cardGroups.filter(function(g){return g.id!==gid});
  await saveGlobalCardsDebounced();
  saveCardGroups();
  renderCardGroups();
  renderCardList();
  toast('已删除分组"'+groupName+'"及'+cardCount+'张字卡');
}

function renameCardGroup(gid){
  var groupInfo=cardGroups.find(function(g){return g.id===gid});
  if(!groupInfo){
    groupInfo={id:gid,name:'默认分组',category:currentCardCategory,type:currentCardType,contactId:currentCardType==='private'?selectedPrivateContact:null};
    cardGroups.push(groupInfo);
  }
  var newName=prompt('请输入新的分组名称：',groupInfo.name);
  if(!newName||!newName.trim())return;
  if(newName.length>20){toast('分组名称不能超过20个字符');return}
  groupInfo.name=newName.trim();
  saveCardGroups();
  renderCardGroups();
  renderCardList();
  toast('分组已重命名为"'+newName.trim()+'"');
}

function moveGroupUp(gid){
  var validGroups=(cardGroups||[]).filter(function(g){
    if(!g.category||g.category!==currentCardCategory)return false;
    if(!g.type||g.type!==currentCardType)return false;
    if(currentCardType==='private'&&g.contactId!==selectedPrivateContact)return false;
    return true;
  });
  
  var index=validGroups.findIndex(function(g){return g.id===gid});
  if(index>0){
    var temp=validGroups[index];
    validGroups[index]=validGroups[index-1];
    validGroups[index-1]=temp;
    
    var allGroups=[];
    cardGroups.forEach(function(g){
      if(g.category===currentCardCategory&&g.type===currentCardType&&!(currentCardType==='private'&&g.contactId!==selectedPrivateContact)){
        var pos=validGroups.findIndex(function(v){return v.id===g.id});
        if(pos>=0){
          allGroups[pos]=g;
        }
      }
    });
    
    cardGroups=cardGroups.filter(function(g){
      return !(g.category===currentCardCategory&&g.type===currentCardType&&!(currentCardType==='private'&&g.contactId!==selectedPrivateContact));
    });
    
    cardGroups=cardGroups.concat(allGroups.filter(function(g){return g}));
    saveCardGroups();
    renderCardGroups();
    renderCardList();
  }
}

function moveGroupDown(gid){
  var validGroups=(cardGroups||[]).filter(function(g){
    if(!g.category||g.category!==currentCardCategory)return false;
    if(!g.type||g.type!==currentCardType)return false;
    if(currentCardType==='private'&&g.contactId!==selectedPrivateContact)return false;
    return true;
  });
  
  var index=validGroups.findIndex(function(g){return g.id===gid});
  if(index>=0&&index<validGroups.length-1){
    var temp=validGroups[index];
    validGroups[index]=validGroups[index+1];
    validGroups[index+1]=temp;
    
    var allGroups=[];
    cardGroups.forEach(function(g){
      if(g.category===currentCardCategory&&g.type===currentCardType&&!(currentCardType==='private'&&g.contactId!==selectedPrivateContact)){
        var pos=validGroups.findIndex(function(v){return v.id===g.id});
        if(pos>=0){
          allGroups[pos]=g;
        }
      }
    });
    
    cardGroups=cardGroups.filter(function(g){
      return !(g.category===currentCardCategory&&g.type===currentCardType&&!(currentCardType==='private'&&g.contactId!==selectedPrivateContact));
    });
    
    cardGroups=cardGroups.concat(allGroups.filter(function(g){return g}));
    saveCardGroups();
    renderCardGroups();
    renderCardList();
  }
}

var renderCardListPending=false;
function renderCardList(){
  if(renderCardListPending)return;
  renderCardListPending=true;
  requestAnimationFrame(function(){
    renderCardListPending=false;
    _doRenderCardList();
  });
}
function _doRenderCardList(){
  var filtered;
  var searchKeyword=$('card-search-input')?$('card-search-input').value.trim():'';
  
  if(currentCardCategory==='touch'){
    var touchCards=getAllTouchCards(currentCardType,selectedPrivateContact);
    filtered=touchCards.map(function(text,index){
      var groupName='默认';
      if(index>=getTouchCardsPublic().length){
        var groupData=ls('ml2_touch_group_cards')||{};
        var groups=getTouchGroups(currentCardType);
        var remainingIndex=index-getTouchCardsPublic().length;
        var accumulated=0;
        for(var i=0;i<groups.length;i++){
          if(groups[i]==='默认')continue;
          var key=currentCardType+'_'+groups[i]+(selectedPrivateContact?'_'+selectedPrivateContact:'');
          var count=groupData[key]?groupData[key].length:0;
          if(remainingIndex<accumulated+count){
            groupName=groups[i];
            break;
          }
          accumulated+=count;
        }
      }
      return{
        id:'touch_'+currentCardType+'_'+(selectedPrivateContact||'')+'_'+index,
        text:text,
        type:currentCardType,
        category:'touch',
        contactId:currentCardType==='private'?selectedPrivateContact:null,
        groupId:'default_touch'+(currentCardType==='private'?'_'+selectedPrivateContact:'')+'_'+groupName
      };
    }).filter(function(card){
      if(currentCardGroup!=='all'&&card.groupId!==currentCardGroup)return false;
      if(searchKeyword){
        var content=(card.text||'').toLowerCase();
        return content.indexOf(searchKeyword.toLowerCase())>-1;
      }
      return true;
    });
  }else{
    filtered=globalCards.filter(function(card){
      if(!card)return false;
      if(card.type!==currentCardType)return false;
      if(card.category!==currentCardCategory)return false;
      // 不再过滤g_def_开头的字卡，因为用户导入的字卡可能也使用这些分组
      // 默认通用字卡已通过独立的 _defaultCommonCards 变量管理
      if(currentCardType==='private'&&card.contactId!==selectedPrivateContact)return false;
      if(currentCardGroup!=='all'&&card.groupId!==currentCardGroup)return false;
      if(searchKeyword){
        var content=(card.content||card.text||card.voiceText||'').toLowerCase();
        return content.indexOf(searchKeyword.toLowerCase())>-1;
      }
      return true;
    });
  }
  
  $('card-total-count').textContent='共 '+filtered.length+' 张';
  
  if(!filtered.length){
    $('card-list').innerHTML='<div class="empty" style="padding:40px 0">暂无字卡</div>';
    return;
  }
  
  if(searchKeyword){
    var searchStickerHtml='';
    var searchOtherHtml='';
    filtered.forEach(function(card){
      if(card.category==='stickers'){
        searchStickerHtml+=renderCardItem(card);
      }else{
        searchOtherHtml+=renderCardItem(card);
      }
    });
    var searchHtml='';
    if(searchStickerHtml){
      searchHtml+='<div class="card-sticker-grid">'+searchStickerHtml+'</div>';
    }
    searchHtml+=searchOtherHtml;
    $('card-list').innerHTML='<div style="padding:12px;">'+searchHtml+'</div>';
    return;
  }
  
  var grouped={};
  var defaultGroupId='default_'+currentCardCategory+(currentCardType==='private'?'_'+selectedPrivateContact:'');
  filtered.forEach(function(card){
    var gid=card.groupId||defaultGroupId;
    if(!grouped[gid])grouped[gid]=[];
    grouped[gid].push(card);
  });
  
  var groupIds=Object.keys(grouped)||[];
  
  var validGroups=(cardGroups||[]).filter(function(g){
    if(!g||!g.id||!g.name)return false;
    if(g.category!==currentCardCategory)return false;
    if(g.type!==currentCardType)return false;
    if(currentCardType==='private'&&g.contactId!==selectedPrivateContact)return false;
    return true;
  });
  
  var sortedGroupIds=validGroups.map(function(g){return g.id});
  groupIds=groupIds.filter(function(gid){return grouped[gid]&&grouped[gid].length>0});
  groupIds.sort(function(a,b){
    var ai=sortedGroupIds.indexOf(a);
    var bi=sortedGroupIds.indexOf(b);
    if(ai<0)ai=9999;
    if(bi<0)bi=9999;
    return ai-bi;
  });
  
  var html='';
  
  groupIds.forEach(function(gid,index){
    var groupCards=grouped[gid]||[];
    var groupInfo=(cardGroups||[]).find(function(g){return g.id===gid&&g.category===currentCardCategory&&g.type===currentCardType})||{name:'默认分组',category:currentCardCategory,type:currentCardType};
    var isFolded=allGroupsFolded||foldedGroups[gid];
    var foldIcon=isFolded?'▼':'▲';
    
    var deleteBtn=gid.startsWith('default_')?'':'<button class="card-group-delete" style="touch-action:manipulation" onclick="event.stopPropagation();deleteCardGroup(\''+gid+'\').then(function(){renderCardGroups();renderCardList()})">×</button>';
    var renameBtn='<button class="card-group-rename" style="touch-action:manipulation" onclick="event.stopPropagation();renameCardGroup(\''+gid+'\')" title="重命名">✏</button>';
    var moveUpBtn=gid.startsWith('default_')||index===0?'':'<button class="card-group-move-up" style="touch-action:manipulation" onclick="event.stopPropagation();moveGroupUp(\''+gid+'\')" title="上移">↑</button>';
    var moveDownBtn=gid.startsWith('default_')||index===groupIds.length-1?'':'<button class="card-group-move-down" style="touch-action:manipulation" onclick="event.stopPropagation();moveGroupDown(\''+gid+'\')" title="下移">↓</button>';
    var disableBtn='<button class="card-group-disable" onclick="event.stopPropagation();toggleGroupDisable(\''+gid+'\')" title="'+(groupInfo.disabled?'启用分组':'禁用分组')+'" style="color:'+(groupInfo.disabled?'var(--danger)':'var(--success)')+'"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">'+(groupInfo.disabled?'<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>':'<circle cx="12" cy="12" r="10"/><polyline points="16 11 10 17 8 15"/>')+'</svg></button>';
    var contactFilterBtn=(groupInfo.type==='public'&&!groupInfo.disabled)?'<button class="card-group-contact-filter" onclick="event.stopPropagation();showGroupContactFilter(\''+gid+'\')" title="选择禁用联系人"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></button>':'';
    html+='<div class="card-group'+(groupInfo.disabled?' disabled':'')+'">'+
      '<div class="card-group-header" data-gid="'+gid+'" onclick="toggleGroup(\''+gid+'\')">'+
        '<span class="card-group-icon">'+(groupInfo.disabled?'📁':'📁')+'</span>'+
        '<span class="card-group-name">'+(groupInfo.disabled?'<span style="color:var(--txt4);text-decoration:line-through">':'')+groupInfo.name+(groupInfo.disabled?'</span>':'')+'</span>'+
        '<span class="card-group-badge">'+groupCards.length+' 张</span>'+
        disableBtn+
        contactFilterBtn+
        renameBtn+
        moveUpBtn+
        moveDownBtn+
        deleteBtn+
        '<span class="card-group-arrow">'+foldIcon+'</span>'+
      '</div>'+
      '<div class="card-group-content'+(isFolded?' folded':'')+'" id="group-'+gid+'"></div></div>';
  });
  
  $('card-list').innerHTML=html;
  
  groupIds.forEach(function(gid){
    var isFolded=allGroupsFolded||foldedGroups[gid];
    if(!isFolded){
      renderGroupCards(gid,grouped[gid]||[]);
    }
  });
}

function renderGroupCards(gid,cards){
  var container=$('group-'+gid);
  if(!container)return;
  if(!cards||!Array.isArray(cards))return;
  
  var stickerCards=[];
  var otherCards=[];
  cards.forEach(function(card){
    if(card.category==='stickers'){
      stickerCards.push(card);
    }else{
      otherCards.push(card);
    }
  });
  
  var html='';
  if(stickerCards.length>0){
    html+='<div class="card-sticker-grid">';
    stickerCards.forEach(function(card){
      html+=renderCardItem(card);
    });
    html+='</div>';
  }
  otherCards.forEach(function(card){
    html+=renderCardItem(card);
  });
  container.innerHTML=html;
}

function renderCardItem(card){
  if(!card)return '';
  var isSelected=batchSelectedCards.indexOf(card.id)>=0;
  var selClass=isSelected?' batch-selected':'';
  if(card.category==='stickers'||card.category==='image'){
    var imgSrc=card.content;
    if(imgSrc&&!imgSrc.startsWith('data:image/')){
      imgSrc='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"%3E%3Crect fill="%23eee" width="80" height="80" rx="8"/%3E%3Ctext fill="%23999" font-size="12" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E图片加载失败%3C/text%3E%3C/svg%3E';
    }
    var isImg=card.category==='image';
    return '<div class="card-sticker-item'+selClass+'" data-id="'+card.id+'" onclick="sendCardMsg(\''+card.id+'\')">'+
      '<input type="checkbox" class="batch-select-checkbox" style="position:absolute;top:2px;left:2px;z-index:2;width:16px;height:16px;" onclick="event.stopPropagation();toggleBatchSelect(\''+card.id+'\')"'+(isSelected?' checked':'')+'>'+
      '<img src="'+imgSrc+'" style="width:100%;height:100%;border-radius:4px;">'+
      '<button class="card-del" style="touch-action:manipulation" onclick="event.stopPropagation();deleteCard(\''+card.id+'\').then(function(){renderCardList()})">×</button></div>';
  }else if(card.category==='voices'){
    return '<div class="card-item'+selClass+'" data-id="'+card.id+'" onclick="sendCardMsg(\''+card.id+'\')">'+
      '<input type="checkbox" class="batch-select-checkbox" onclick="event.stopPropagation();toggleBatchSelect(\''+card.id+'\')"'+(isSelected?' checked':'')+'>'+
      '<button class="card-voice-play" data-cid="'+card.id+'" onclick="event.stopPropagation();playVoiceCard(\''+card.id+'\')" title="播放/暂停"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg></button>'+
      '<span class="card-voice" onclick="event.stopPropagation();playVoiceCard(\''+card.id+'\')" style="cursor:pointer;">'+card.voiceText+'</span>'+
      '<button class="card-edit" onclick="event.stopPropagation();editVoiceCardText(\''+card.id+'\')" title="编辑文字">✏</button>'+
      '<button class="card-del" style="touch-action:manipulation" onclick="event.stopPropagation();deleteCard(\''+card.id+'\').then(function(){renderCardList()})">×</button></div>';
  }else if(card.category==='touch'){
    return '<div class="card-item'+selClass+'" data-id="'+card.id+'" onclick="sendCardMsg(\''+card.id+'\')">'+
      '<input type="checkbox" class="batch-select-checkbox" onclick="event.stopPropagation();toggleBatchSelect(\''+card.id+'\')"'+(isSelected?' checked':'')+'>'+
      '<span class="ctt">👆 '+(card.text||card.content)+'</span>'+
      '<button class="card-edit" onclick="event.stopPropagation();editCardText(\''+card.id+'\')" title="编辑文字">✏</button>'+
      '<button class="card-del" style="touch-action:manipulation" onclick="event.stopPropagation();deleteCard(\''+card.id+'\').then(function(){renderCardList()})">×</button></div>';
  }else{
    return '<div class="card-item'+selClass+'" data-id="'+card.id+'" onclick="sendCardMsg(\''+card.id+'\')">'+
      '<input type="checkbox" class="batch-select-checkbox" onclick="event.stopPropagation();toggleBatchSelect(\''+card.id+'\')"'+(isSelected?' checked':'')+'>'+
      '<span class="ctt">'+card.content.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</span>'+
      '<button class="card-edit" onclick="event.stopPropagation();editCardText(\''+card.id+'\')" title="编辑文字">✏</button>'+
      '<button class="card-del" style="touch-action:manipulation" onclick="event.stopPropagation();deleteCard(\''+card.id+'\').then(function(){renderCardList()})">×</button></div>';
  }
}

var currentVoiceAudio=null;
var currentVoiceCardId=null;
function playVoiceCard(cardId){
  var card=globalCards.find(function(c){return c.id===cardId});
  if(!card||!card.content)return;
  
  // If same card is playing, toggle pause
  if(currentVoiceCardId===cardId&&currentVoiceAudio){
    if(currentVoiceAudio.paused){
      currentVoiceAudio.play();
    }else{
      currentVoiceAudio.pause();
    }
    updateVoiceCardUI(cardId);
    return;
  }
  
  // Stop previous audio
  if(currentVoiceAudio){
    currentVoiceAudio.pause();
    currentVoiceAudio=null;
    if(currentVoiceCardId)updateVoiceCardUI(currentVoiceCardId);
  }
  
  try{
    var audio=new Audio(card.content);
    currentVoiceAudio=audio;
    currentVoiceCardId=cardId;
    audio.play();
    updateVoiceCardUI(cardId);
    audio.onended=function(){
      currentVoiceAudio=null;
      currentVoiceCardId=null;
      updateVoiceCardUI(cardId);
    };
    audio.onerror=function(){
      currentVoiceAudio=null;
      currentVoiceCardId=null;
      updateVoiceCardUI(cardId);
      toast('播放失败');
    };
  }catch(e){
    currentVoiceAudio=null;
    currentVoiceCardId=null;
    toast('播放失败');
  }
}

function updateVoiceCardUI(cardId){
  var btns=document.querySelectorAll('.card-voice-play[data-cid="'+cardId+'"]');
  btns.forEach(function(btn){
    var isPlaying=currentVoiceCardId===cardId&&currentVoiceAudio&&!currentVoiceAudio.paused;
    btn.innerHTML=isPlaying?
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>':
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    btn.style.background=isPlaying?'rgba(21,114,247,0.15)':'rgba(100,100,100,.1)';
    btn.style.color=isPlaying?'var(--accent)':'var(--txt2)';
  });
}

function editVoiceCardText(cardId){
  var card=globalCards.find(function(c){return c.id===cardId});
  if(!card)return;
  var newText=prompt('请输入语音文字：',card.voiceText||'');
  if(newText!==null){
    card.voiceText=newText.trim();
    saveGlobalCardsDebounced();
    renderCardList();
  }
}

function editCardText(cardId){
  if(cardId.startsWith('touch_')){
    return;
  }
  var card=globalCards.find(function(c){return c.id===cardId});
  if(!card)return;
  var newText=prompt('请输入字卡内容：',card.content||'');
  if(newText!==null){
    card.content=newText.trim();
    saveGlobalCardsDebounced();
    renderCardList();
  }
}

function toggleGroupDisable(gid){
  var group=cardGroups.find(function(g){return g.id===gid});
  if(!group)return;
  group.disabled=!group.disabled;
  saveCardGroups();
  renderCardList();
}

function showGroupContactFilter(gid){
  var group=cardGroups.find(function(g){return g.id===gid});
  if(!group||group.type!=='public')return;
  if(!group.disabledContacts)group.disabledContacts=[];
  
  var html='<div style="padding:12px;">';
  html+='<div style="font-size:14px;font-weight:600;margin-bottom:12px;color:var(--txt);">选择禁用该分组的联系人</div>';
  
  contacts.forEach(function(c){
    var isDisabled=group.disabledContacts.indexOf(c.id)>=0;
    html+='<div style="display:flex;align-items:center;gap:12px;padding:10px;background:var(--c2);border-radius:8px;margin-bottom:8px;">';
    html+='<div style="width:32px;height:32px;border-radius:6px;background:var(--c3);display:flex;align-items:center;justify-content:center;overflow:hidden;">'+(c.avatar?'<img src="'+c.avatar.replace(/"/g,'&quot;')+'" style="display:block;width:100%;height:100%;object-fit:cover;">':'✦')+'</div>';
    html+='<div style="flex:1;font-size:13px;color:var(--txt);">'+c.name+'</div>';
    html+='<button onclick="toggleGroupContactDisable(\''+gid+'\',\''+c.id+'\')" style="padding:6px 12px;border-radius:6px;font-size:12px;'+(isDisabled?'background:var(--accent);color:white;':'background:var(--c1);color:var(--txt2);border:1px solid var(--border);')+'">'+(isDisabled?'已禁用':'启用')+'</button>';
    html+='</div>';
  });
  
  html+='<button onclick="hideOv(\'ov-group-contact-filter\')" style="width:100%;padding:12px;border:none;background:var(--accent);color:white;border-radius:8px;font-size:14px;margin-top:12px;">确定</button>';
  html+='</div>';
  
  $('group-contact-filter-content').innerHTML=html;
  showOv('ov-group-contact-filter');
}

function toggleGroupContactDisable(gid,contactId){
  var group=cardGroups.find(function(g){return g.id===gid});
  if(!group)return;
  if(!group.disabledContacts)group.disabledContacts=[];
  var index=group.disabledContacts.indexOf(contactId);
  if(index>=0){
    group.disabledContacts.splice(index,1);
  }else{
    group.disabledContacts.push(contactId);
  }
  saveCardGroups();
  showGroupContactFilter(gid);
}

function toggleGroup(gid){
  foldedGroups[gid]=!foldedGroups[gid];
  var el=$('group-'+gid);
  if(el){
    el.classList.toggle('folded');
  }
  var header=document.querySelector('.card-group-header[data-gid="'+gid+'"] .card-group-arrow');
  if(header){
    header.textContent=foldedGroups[gid]?'▼':'▲';
  }
  
  if(!foldedGroups[gid]){
    var searchKeyword=$('card-search-input')?$('card-search-input').value.trim():'';
    if(!searchKeyword){
      var filtered=globalCards.filter(function(card){
        if(!card)return false;
        if(card.type!==currentCardType)return false;
        if(card.category!==currentCardCategory)return false;
        if(currentCardType==='private'&&card.contactId!==selectedPrivateContact)return false;
        if(card.groupId!==gid)return false;
        return true;
      });
      renderGroupCards(gid,filtered);
    }else{
      renderCardList();
    }
  }
}

function toggleAllFold(){
  allGroupsFolded=!allGroupsFolded;
  foldedGroups={};
  renderCardList();
  $('toggle-fold-btn').textContent=allGroupsFolded?'展开全部':'折叠全部';
}

async function deleteCard(id){
  if(id.startsWith('touch_')){
    var parts=id.split('_');
    var type=parts[1];
    var contactId=type==='private'?parts[2]:null;
    var index=parseInt(parts[parts.length-1]);
    
    var touchCards=type==='public'?getTouchCardsPublic():getTouchCardsPrivate(contactId);
    touchCards.splice(index,1);
    
    if(type==='public'){
      saveTouchCardsPublic(touchCards);
    }else{
      saveTouchCardsPrivate(touchCards,contactId);
    }
    
    renderCardList();
    return;
  }
  
  var card=globalCards.find(function(c){return c.id===id});
  if(card&&card.content&&card.content.startsWith('data:image/')){
    var imgKey='ml2_card_img_'+card.id;
    if(window.localforage){
      window.localforage.removeItem(imgKey).catch(function(){});
    }
  }
  globalCards=globalCards.filter(function(c){return c.id!==id});
  renderCardList();
  saveGlobalCardsDebounced();
}


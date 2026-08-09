// ========== DIVINATION ==========
var dc=null,dm='mixed',dcCount=9,drawn=[],drawnDone=false,renderDone=false;
var modeLabels={
  mixed:['回复','回复','回复','回复','回复','心情','心情','心情','秘密'],
  tarot:{1:['运势'],3:['过去','现在','未来'],7:['启示','过去','现在','未来','核心','阻碍','根源']},
  lenormand:{1:['回复'],3:['回复1','回复2','回复3'],7:['回复1','回复2','回复3','回复4','回复5','回复6','回复7']}
};
var modeDesc={
  mixed:'混合模式：回复(雷诺曼1~5张) + 情绪(塔罗3张) + 秘密(塔罗1~3张)',
  tarot:'塔罗牌模式：使用78张塔罗牌进行占卜',
  lenormand:'雷诺曼模式：使用36张雷诺曼牌进行占卜'
};

var divineMode='modal';
function renderDContacts(){
  ['divine-contacts','divine-contacts-full'].forEach(function(id){
    var sel=$(id);if(!sel)return;
    var html='<div class="chip'+(!dc?' sel':'')+'" data-cid="">不选对象</div>';
    divineTargets.forEach(function(t){
      var isSelected=dc==='target_'+t.id;
      html+='<div class="chip'+(isSelected?' sel':'')+'" data-cid="target_'+t.id+'" style="position:relative;">'+t.name+'<span class="chip-delete" data-target-id="'+t.id+'">×</span></div>';
    });
    contacts.forEach(function(c){
      var isSelected=dc===c.id;
      html+='<div class="chip'+(isSelected?' sel':'')+'" data-cid="'+c.id+'">'+c.name+'</div>';
    });
    html+='<div class="chip add-target" data-action="add">+ 添加对象</div>';
    sel.innerHTML=html;
    
    sel.querySelectorAll('.chip[data-cid]').forEach(function(ch){ch.addEventListener('click',function(e){
      if(e.target.classList.contains('chip-delete'))return;
      sel.querySelectorAll('.chip').forEach(function(x){x.classList.remove('sel')});
      this.classList.add('sel');
      dc=this.dataset.cid||null;
    })});
    
    sel.querySelectorAll('.chip-delete').forEach(function(delBtn){delBtn.addEventListener('click',function(e){
      e.stopPropagation();
      var targetId=parseInt(this.dataset.targetId);
      if(confirm('确定删除这个占卜对象吗？')){
        divineTargets=divineTargets.filter(function(t){return t.id!==targetId});
        saveDivineTargets();
        if(dc==='target_'+targetId){
          dc=null;
        }
        renderDContacts();
      }
    })});
    
    sel.querySelectorAll('.chip[data-action="add"]').forEach(function(ch){ch.addEventListener('click',function(){
      var name=prompt('请输入占卜对象名称：');
      if(name&&name.trim()){
        divineTargets.push({id:Date.now(),name:name.trim()});
        saveDivineTargets();
        renderDContacts();
      }
    })});
  });
}

['mode-sel','mode-sel-full'].forEach(function(id){
  document.querySelectorAll('#'+id+' .mode-chip').forEach(function(o){o.addEventListener('click',function(){
    document.querySelectorAll('#'+id+' .mode-chip').forEach(function(d){d.classList.remove('sel')});this.classList.add('sel');dm=this.dataset.mode;
    var desc=$(id.replace('mode-sel','mode-desc'));if(desc)desc.textContent=modeDesc[dm];
    
    var countLabel=$(id.replace('mode-sel','count-label')),countSel=$(id.replace('mode-sel','count-sel'));
    if(dm==='mixed'){
      dcCount=9;
      if(countLabel)countLabel.style.display='none';
      if(countSel)countSel.style.display='none';
    }else{
      dcCount=1;
      if(countLabel)countLabel.style.display='block';
      if(countSel)countSel.style.display='flex';
      countSel.querySelectorAll('.count-chip').forEach(function(c){c.classList.toggle('sel',c.dataset.count==='1')});
    }
    resetDivine(true);
  })});
});

['count-sel','count-sel-full'].forEach(function(id){
  document.querySelectorAll('#'+id+' .count-chip').forEach(function(o){o.addEventListener('click',function(){
    document.querySelectorAll('#'+id+' .count-chip').forEach(function(c){c.classList.remove('sel')});this.classList.add('sel');dcCount=parseInt(this.dataset.count);
    resetDivine(true);
  })});
});

function resetDivine(keepQuestion){
  var q1=$('divine-question')? $('divine-question').value : '';
  var q2=$('divine-question-full')? $('divine-question-full').value : '';
  drawn=[];drawnDone=false;renderDone=false;
  $('card-stage').innerHTML='';$('result-area').innerHTML='';$('draw-btn').disabled=false;$('draw-btn').textContent='抽'+dcCount+'张';$('copy-divine-result').style.display='none';
  $('card-stage-full').innerHTML='';$('result-area-full').innerHTML='';$('draw-btn-full').disabled=false;$('draw-btn-full').textContent='抽'+dcCount+'张';$('copy-divine-result-full').style.display='none';
  currentDivineText='';
  if(!keepQuestion){$('divine-question').value='';$('divine-question-full').value='';}
  else{$('divine-question').value=q1;$('divine-question-full').value=q2;}
}

function shuf(a){var b=a.slice();for(var i=b.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=b[i];b[i]=b[j];b[j]=t}return b}

function getDivineIds(){
  return divineMode==='modal'?{stage:'card-stage',result:'result-area',btn:'draw-btn',question:'divine-question',copy:'copy-divine-result'}:
    {stage:'card-stage-full',result:'result-area-full',btn:'draw-btn-full',question:'divine-question-full',copy:'copy-divine-result-full'};
}

function drawCards(){
  if(drawnDone)return;
  drawnDone=true;
  var ids=getDivineIds();
  $(ids.btn).disabled=false;$(ids.btn).textContent='重新抽牌';
  var stage=$(ids.stage),labels=modeLabels[dm];stage.innerHTML='';
  stage.className='card-stage';
  stage.style.display='block';
  
  if(dm==='mixed'){
    stage.classList.add('mixed-layout');
    var leno=shuf(LENORMAND_CARDS.slice()).slice(0,5);
    var tarot=shuf(TAROT_CARDS.slice()).slice(0,4);
    drawn=[
      {card:leno[0],type:'reply',rev:false},
      {card:leno[1],type:'reply',rev:false},
      {card:leno[2],type:'reply',rev:false},
      {card:leno[3],type:'reply',rev:false},
      {card:leno[4],type:'reply',rev:false},
      {card:tarot[0],type:'mood',rev:Math.random()>.5},
      {card:tarot[1],type:'mood',rev:Math.random()>.5},
      {card:tarot[2],type:'mood',rev:Math.random()>.5},
      {card:tarot[3],type:'secret',rev:Math.random()>.5}
    ];
    
    var rows=[[], [], []];
    drawn.forEach(function(item,i){
      if(i<5)rows[0].push(item);
      else if(i<8)rows[1].push(item);
      else rows[2].push(item);
    });
    
    rows.forEach(function(row, rowIdx){
      if(row.length===0)return;
      var rowEl=document.createElement('div');
      rowEl.style.display='flex';
      rowEl.style.gap='8px';
      rowEl.style.justifyContent='center';
      rowEl.style.marginBottom='40px';
      
      row.forEach(function(item,i){
        var card=item.card,isL=!!card.symbol,sym=isL?card.symbol:'',rev=item.rev,type=item.type;
        var slot=document.createElement('div');slot.className='card-slot';
        var frontClass=rev?' rev':(type==='reply'?' reply':(type==='mood'?' mood':(type==='secret'?' secret':'')));
        var tagText=rev?'逆位':(type==='reply'?'回复':(type==='mood'?'心情':(type==='secret'?'秘密':'')));
        var globalIdx=rowIdx===0?i:(rowIdx===1?5+i:(rowIdx===2?8+i:0));
        slot.innerHTML=(labels[globalIdx]?'<div class="slot-label">'+labels[globalIdx]+'</div>':'')+
          '<div class="card-inner">'+
            '<div class="card-face card-back"><span class="moon">✦</span></div>'+
            '<div class="card-face card-front'+frontClass+'">'+
              (sym?'<div class="cf-sym">'+sym+'</div>':'')+
              '<div class="cf-name">'+card.name+'</div>'+
              '<div class="cf-en">'+(card.en||'')+'</div>'+
              '<div class="cf-tag">'+tagText+'</div>'+
            '</div>'+
          '</div>';
        slot.addEventListener('click',function(){
          this.classList.toggle('flipped');
          setTimeout(function(){
            if(document.querySelectorAll('#'+ids.stage+' .card-slot.flipped').length===drawn.length&&!renderDone){renderDone=true;renderResults()}
          },700);
        });
        rowEl.appendChild(slot);
      });
      stage.appendChild(rowEl);
    });
  }else{
    var cardsData,modeLabelsList=labels[dcCount]||labels[7];
    if(dm==='tarot'){
      cardsData=shuf(TAROT_CARDS.slice()).slice(0,dcCount);
      drawn=cardsData.map(function(c,i){return{card:c,type:'tarot',rev:Math.random()>.5}});
    }else{
      cardsData=shuf(LENORMAND_CARDS.slice()).slice(0,dcCount);
      drawn=cardsData.map(function(c,i){return{card:c,type:'lenormand',rev:false}});
    }
    
    drawn.forEach(function(item,i){
      var card=item.card,isL=!!card.symbol,sym=isL?card.symbol:'',rev=item.rev,type=item.type;
      var slot=document.createElement('div');slot.className='card-slot';
      var frontClass=rev?' rev':'';
      var tagText=rev?'逆位':'';
      slot.innerHTML=(modeLabelsList[i]?'<div class="slot-label">'+modeLabelsList[i]+'</div>':'')+
        '<div class="card-inner">'+
          '<div class="card-face card-back"><span class="moon">✦</span></div>'+
          '<div class="card-face card-front'+frontClass+'">'+
            (sym?'<div class="cf-sym">'+sym+'</div>':'')+
            '<div class="cf-name">'+card.name+'</div>'+
            '<div class="cf-en">'+(card.en||'')+'</div>'+
            (tagText?'<div class="cf-tag">'+tagText+'</div>':'')+
          '</div>'+
        '</div>';
      slot.addEventListener('click',function(){
      this.classList.toggle('flipped');
      setTimeout(function(){
        if(document.querySelectorAll('#'+ids.stage+' .card-slot.flipped').length===drawn.length&&!renderDone){renderDone=true;renderResults()}
      },700);
    });
    stage.appendChild(slot);
  });
}
}

var currentDivineText='';
function renderResults(saveHistory){
  var ids=getDivineIds();
  var area=$(ids.result);area.innerHTML='';
  area.style.display='block';
  
  var cname='对方';
  if(dc){
    if(dc.startsWith('target_')){
      var targetId=parseInt(dc.replace('target_',''));
      var target=divineTargets.find(function(t){return t.id===targetId});
      if(target)cname=target.name;
    }else{
      var c=contacts.find(function(x){return x.id===dc});
      if(c)cname=c.name;
    }
  }
  var question=$(ids.question).value.trim()||'无';
  
  currentDivineText='🔮 占卜结果\n';
  currentDivineText+='────────────\n';
  currentDivineText+='占卜对象：'+cname+'\n';
  currentDivineText+='占卜问题：'+question+'\n';
  currentDivineText+='────────────\n\n';
  
  var copyBtn=document.createElement('button');
  copyBtn.className='btn-secondary';
  copyBtn.innerHTML='📋 复制占卜结果';
  copyBtn.style.width='100%';
  copyBtn.style.padding='10px';
  copyBtn.style.marginBottom='12px';
  copyBtn.addEventListener('click',copyDivineResult);
  area.appendChild(copyBtn);
  
  if(dm==='mixed'){
    var replies=drawn.filter(function(x){return x.type==='reply'});
    var moods=drawn.filter(function(x){return x.type==='mood'});
    var secrets=drawn.filter(function(x){return x.type==='secret'});
    
    if(replies.length){
      var rg=document.createElement('div');rg.className='result-group';
      rg.innerHTML='<div class="result-group-title reply">💬 回复牌</div>';
      currentDivineText+='💬 回复牌\n';
      replies.forEach(function(item,i){renderResultCard(item,i,rg);addCardToText(item)});
      area.appendChild(rg);
      currentDivineText+='\n';
    }
    
    if(moods.length){
      var mg=document.createElement('div');mg.className='result-group';
      mg.innerHTML='<div class="result-group-title mood">🌙 心情牌</div>';
      currentDivineText+='🌙 心情牌\n';
      moods.forEach(function(item,i){renderResultCard(item,i,mg);addCardToText(item)});
      area.appendChild(mg);
      currentDivineText+='\n';
    }
    
    if(secrets.length){
      var sg=document.createElement('div');sg.className='result-group';
      sg.innerHTML='<div class="result-group-title secret">🔮 秘密</div>';
      currentDivineText+='🔮 秘密\n';
      secrets.forEach(function(item,i){renderResultCard(item,i,sg);addCardToText(item)});
      area.appendChild(sg);
      currentDivineText+='\n';
    }
  }else{
    drawn.forEach(function(item,i){renderResultCard(item,i,area);addCardToText(item)});
  }
  
  $(ids.copy).style.display='none';
  if(saveHistory!==false){
    saveDivineHistory();
  }
}

function addCardToText(item){
  var card=item.card,rev=item.rev;
  var name=card.name,en=card.en||'';
  currentDivineText+='【'+name+'】'+(rev?'逆位':'')+'\n';
  currentDivineText+='\n';
}

function copyDivineResult(){
  if(!currentDivineText)return;
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(currentDivineText).then(function(){
      toast('已复制到剪贴板');
    }).catch(function(){
      fallbackCopy(currentDivineText);
    });
  }else{
    fallbackCopy(currentDivineText);
  }
}
function fallbackCopy(text){
  var textarea=document.createElement('textarea');
  textarea.value=text;
  textarea.style.position='fixed';
  textarea.style.left='-9999px';
  textarea.style.top='-9999px';
  textarea.style.width='1px';
  textarea.style.height='1px';
  document.body.appendChild(textarea);
  textarea.select();
  try{
    var successful=document.execCommand('copy');
    if(successful){
      toast('已复制到剪贴板');
    }else{
      toast('复制失败');
    }
  }catch(e){
    toast('复制失败');
  }
  document.body.removeChild(textarea);
}

var divineHistory=[];
function saveDivineHistory(){
  if(!drawn||drawn.length===0)return;
  
  var c=null,cname='对方';
  if(dc){
    if(dc.startsWith('target_')){
      var targetId=parseInt(dc.replace('target_',''));
      var target=divineTargets.find(function(t){return t.id===targetId});
      if(target){cname=target.name;}
    }else{
      c=contacts.find(function(x){return x.id===dc});
      if(c){cname=c.name;}
    }
  }
  
  var question=$(getDivineIds().question).value.trim()||'无';
  var now=Date.now();
  var nowStr=new Date().toLocaleString();
  
  var existing=divineHistory.find(function(h){
    return h.contactId===dc&&h.question===question&&h.time===nowStr;
  });
  if(existing)return;
  
  var historyItem={
    id:now,
    time:nowStr,
    contactId:dc,
    contactName:cname,
    question:question,
    mode:dm,
    count:dcCount,
    drawn:JSON.parse(JSON.stringify(drawn)),
    text:currentDivineText
  };
  
  if(!divineHistory||!Array.isArray(divineHistory)){
    divineHistory=[];
  }
  
  divineHistory.unshift(historyItem);
  _persistDivineHistory();
}

function loadDivineHistory(){
  var data=null;
  
  try{
    var lsKey='ml2_lf_ml2_divine_history';
    var lsRaw=localStorage.getItem(lsKey);
    if(lsRaw){
      data=JSON.parse(lsRaw);
    }
  }catch(e){}
  
  if(!data||!Array.isArray(data)){
    try{
      var directRaw=localStorage.getItem('ml2_divine_history');
      if(directRaw){
        data=JSON.parse(directRaw);
      }
    }catch(e){}
  }
  
  if(!data||!Array.isArray(data)){
    data=ls('ml2_divine_history');
  }
  
  if(data&&Array.isArray(data)){
    divineHistory=data;
  }else{
    divineHistory=[];
  }
  
  // 异步从localforage加载
  if(window.localforage&&(!data||!Array.isArray(data)||data.length===0)){
    window.localforage.getItem('ml2_divine_history').then(function(dbVal){
      if(dbVal&&Array.isArray(dbVal)&&dbVal.length>0){
        divineHistory=dbVal;
        // 如果梦角主页正在显示，触发重新渲染
        if(currentProfileContactId){
          try{renderContactDivineHistory(currentProfileContactId);}catch(e){}
        }
      }
    }).catch(function(){});
  }
}

function showDivineHistory(){
  var list=$('divine-history-list');
  list.innerHTML='';
  
  if(divineHistory.length===0){
    list.innerHTML='<div class="empty" style="text-align:center;padding:40px;color:var(--txt3)">暂无占卜记录</div>';
    showOv('ov-divine-history');
    return;
  }
  
  divineHistory.forEach(function(item){
    var el=document.createElement('div');
    el.className='result-card';
    el.style.marginBottom='12px';
    el.style.cursor='pointer';
    el.style.transition='all .2s';
    el.style.border='1px solid var(--border)';
    el.addEventListener('click',function(){restoreDivineResult(item)});
    el.innerHTML='<div style="padding:12px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><span style="font-weight:600">'+item.question+'</span><span style="font-size:11px;color:var(--txt3)">'+item.time+'</span></div><div style="font-size:12px;color:var(--txt2);margin-bottom:4px">对象：'+item.contactName+' | 模式：'+(item.mode==='mixed'?'混合模式':item.mode==='tarot'?'塔罗牌':'雷诺曼')+' | '+item.drawn.length+'张牌</div><div style="font-size:11px;color:var(--txt3)">点击查看详情</div></div>';
    list.appendChild(el);
  });
  
  showOv('ov-divine-history');
}

function restoreDivineResult(item){
  hideOv('ov-divine-history');
  dc=item.contactId;
  dm=item.mode;
  dcCount=item.count;
  drawn=item.drawn;
  currentDivineText=item.text;
  
  renderDContacts();
  
  var ids=getDivineIds();
  $(ids.question).value=item.question;
  
  var stage=$(ids.stage);
  stage.innerHTML='';
  stage.className='card-stage';
  
  if(dm==='mixed'){
    stage.classList.add('mixed-layout');
    var rows=[[], [], [], []];
    drawn.forEach(function(cardItem,i){
      if(i<3)rows[0].push(cardItem);
      else if(i<5)rows[1].push(cardItem);
      else if(i<8)rows[2].push(cardItem);
      else rows[3].push(cardItem);
    });
    
    rows.forEach(function(row, rowIdx){
      if(row.length===0)return;
      var rowEl=document.createElement('div');
      rowEl.style.display='flex';
      rowEl.style.gap='8px';
      rowEl.style.justifyContent='center';
      rowEl.style.marginBottom='40px';
      
      row.forEach(function(cardItem,i){
        var card=cardItem.card,isL=!!card.symbol,sym=isL?card.symbol:'',rev=cardItem.rev,type=cardItem.type;
        var slot=document.createElement('div');slot.className='card-slot flipped';
        var frontClass=rev?' rev':(type==='reply'?' reply':(type==='mood'?' mood':(type==='secret'?' secret':'')));
        var tagText=rev?'逆位':(type==='reply'?'回复':(type==='mood'?'心情':(type==='secret'?'秘密':'')));
        slot.innerHTML='<div class="card-inner" style="transform:rotateY(180deg)">'+
          '<div class="card-face card-back"><span class="moon">✦</span></div>'+
          '<div class="card-face card-front'+frontClass+'">'+
            (sym?'<div class="cf-sym">'+sym+'</div>':'')+
            '<div class="cf-name">'+card.name+'</div>'+
            '<div class="cf-en">'+(card.en||'')+'</div>'+
            '<div class="cf-tag">'+tagText+'</div>'+
          '</div>'+
        '</div>';
        rowEl.appendChild(slot);
      });
      stage.appendChild(rowEl);
    });
  }else{
    drawn.forEach(function(cardItem,i){
      var card=cardItem.card,isL=!!card.symbol,sym=isL?card.symbol:'',rev=cardItem.rev,type=cardItem.type;
      var slot=document.createElement('div');slot.className='card-slot flipped';
      var frontClass=rev?' rev':'';
      var tagText=rev?'逆位':'';
      slot.innerHTML='<div class="card-inner" style="transform:rotateY(180deg)">'+
        '<div class="card-face card-back"><span class="moon">✦</span></div>'+
        '<div class="card-face card-front'+frontClass+'">'+
          (sym?'<div class="cf-sym">'+sym+'</div>':'')+
          '<div class="cf-name">'+card.name+'</div>'+
          '<div class="cf-en">'+(card.en||'')+'</div>'+
          (tagText?'<div class="cf-tag">'+tagText+'</div>':'')+
        '</div>'+
      '</div>';
      stage.appendChild(slot);
    });
  }
  
  $(ids.btn).disabled=false;
  $(ids.btn).textContent='重新抽牌';
  drawnDone=true;
  renderResults(false);
}

function renderResultCard(item,i,container){
  var card=item.card,isL=!!card.symbol,sym=isL?card.symbol:'',rev=item.rev,type=item.type;
  var name=card.name,en=card.en||'';
  var headClass=rev?' rev':(type==='reply'?' reply':(type==='mood'?' mood':(type==='secret'?' secret':(type==='tarot'?' tarot':''))));
  var isLenormand=(type==='reply'||type==='lenormand');
  var posText=isLenormand?'':(rev?'逆位':'正位');
  var d=document.createElement('div');d.className='result-card';d.style.animationDelay=(i*.08)+'s';
  d.innerHTML='<div class="rc-head'+headClass+'"><div class="rch-av">'+(sym||'✦')+'</div><div class="rch-info"><div class="rch-name">'+name+'</div><div class="rch-en">'+en+'</div></div><div class="rch-rev"'+(isLenormand?' style="display:none"':'')+'>'+posText+'</div></div>';
  container.appendChild(d);
}
function handleDrawClick(isFull){
  if(isFull)divineMode='full';
  if(drawnDone){resetDivine()}else{drawCards()}
}
function bindDrawBtn(){
  var isTouchDevice='ontouchstart' in window;
  var btn=$('draw-btn');
  if(btn){
    if(isTouchDevice){
      btn.addEventListener('touchstart',function(e){e.preventDefault();handleDrawClick(false);haptic('light')},{passive:false});
    }else{
      btn.onclick=function(){handleDrawClick(false)};
    }
  }
  var btnFull=$('draw-btn-full');
  if(btnFull){
    if(isTouchDevice){
      btnFull.addEventListener('touchstart',function(e){e.preventDefault();handleDrawClick(true);haptic('light')},{passive:false});
    }else{
      btnFull.onclick=function(){handleDrawClick(true)};
    }
  }
}
bindDrawBtn();

// 根据联系人ID获取可用的字卡（公用字卡+已绑定的专享字卡）
function getContactCards(contactId){
  var userCards=globalCards.filter(function(card){
    if(!card)return false;
    if(card.category==='stickers'||card.category==='voices')return false;
    if(card.type==='public')return true;
    if(card.type==='private'){
      if(card.contactId===contactId)return true;
      // 检查专享字卡是否已绑定到此联系人
      if(cardPrivateContacts.some(function(pc){return pc.id===card.contactId&&pc.bindContactId===contactId}))return true;
    }
    return false;
  });
  
  // 构建可用字卡池
  var availableCards = userCards.slice();
  
  // 将默认通用字卡添加到池中（各分类独立概率已在getDefaultCommonCardsForContact中处理）
  if(defaultCommonEnabled&&defaultCommonAllContacts&&defaultCommonUseMoments){
    var dcCards=getDefaultCommonCardsForContact(contactId);
    if(dcCards.length>0){
      dcCards.forEach(function(text){
        availableCards.push({content:text,category:'custom',type:'default_common',groupId:null});
      });
    }
  }
  
  return availableCards;
}

// ---------- Moments ----------
var momentsPosts=[],momentsMembers=[],momentsSettings={
  contacts:{},
  likeProbability:60,likeSpeedMin:1,likeSpeedMax:60,
  commentProbability:70,commentSpeedMin:1,commentSpeedMax:60,
  replyProbability:60,replySpeedMin:1,replySpeedMax:60,
  friendPostProbability:40,friendPostIntervalMin:1,friendPostIntervalMax:720,
  maxCardsPerComment:5,imageProbability:50,maxImagesPerComment:3,
  cardProbability:80,
  friendLikeFriendProbability:40,friendCommentFriendProbability:25,
  friendCommentFriendSpeedMin:10,friendCommentFriendSpeedMax:60,
  friendCommentFriendCardProbability:50,friendCommentFriendMaxCards:3,
  friendCommentFriendImageProbability:10,friendReplyFriendProbability:15,
  friendReplyFriendSpeedMin:5,friendReplyFriendSpeedMax:30,
  friendCommentKaomojiProb:5,friendCommentEmojiProb:5,friendCommentStickerProb:5,
  friendReplyKaomojiProb:5,friendReplyEmojiProb:5,friendReplyStickerProb:5,
  friendPostKaomojiProb:10,friendPostEmojiProb:10,friendPostStickerProb:30,friendPostImageProb:30,
  // 好友发帖字卡设置
  minCardsPerPost:4,maxCardsPerPost:15,
  useMainCards:true,useKaomojiCards:true,useEmojiCards:true,useImageCards:true
};
async function loadMomentsData(){
  // ★ 修复：localStorage 优先（同步、最新），IndexedDB 只补缺失不覆盖，避免旧快照覆盖新数据导致刷新丢朋友圈
  var savedPosts=ls('ml2_moments_posts');
  var savedMembers=ls('ml2_moments_members');
  var savedSettings=ls('ml2_moments_settings');
  try{
    // ★ Bug4修复：不能经 lsGetWithDB 读（memoryCache 已有 localStorage 小快照会短路返回），
    // 直接从 IndexedDB 强制读取再与 localStorage 合并，防止 iOS 刷新后丢朋友圈
    var dbPosts=null;
    if(window.localforage){try{dbPosts=await window.localforage.getItem('ml2_moments_posts');}catch(e){}}
    if((!savedPosts||!Array.isArray(savedPosts)||savedPosts.length===0)&&dbPosts&&Array.isArray(dbPosts))savedPosts=dbPosts;
    else if(savedPosts&&Array.isArray(savedPosts)&&dbPosts&&Array.isArray(dbPosts)&&dbPosts.length>savedPosts.length){
      // IndexedDB 有更多时按 id 去重合并，保留 localStorage 已有的
      var _seenP={};savedPosts.forEach(function(p){if(p&&p.id)_seenP[p.id]=true;});
      dbPosts.forEach(function(p){if(p&&p.id&&!_seenP[p.id]){_seenP[p.id]=true;savedPosts.push(p);}});
    }
    var dbMembers=null;
    if(window.localforage){try{dbMembers=await window.localforage.getItem('ml2_moments_members');}catch(e){}}
    if((!savedMembers||!Array.isArray(savedMembers)||savedMembers.length===0)&&dbMembers&&Array.isArray(dbMembers))savedMembers=dbMembers;
    else if(savedMembers&&Array.isArray(savedMembers)&&dbMembers&&Array.isArray(dbMembers)&&dbMembers.length>savedMembers.length){
      var _seenM={};savedMembers.forEach(function(p){if(p&&p.id)_seenM[p.id]=true;});
      dbMembers.forEach(function(p){if(p&&p.id&&!_seenM[p.id]){_seenM[p.id]=true;savedMembers.push(p);}});
    }
    var dbSettings=null;
    if(window.localforage){try{dbSettings=await window.localforage.getItem('ml2_moments_settings');}catch(e){}}
    if((!savedSettings||typeof savedSettings!=='object')&&dbSettings&&typeof dbSettings==='object')savedSettings=dbSettings;
  }catch(e){}
  if(savedPosts&&Array.isArray(savedPosts))momentsPosts=savedPosts;
  if(savedSettings&&typeof savedSettings==='object')Object.assign(momentsSettings,savedSettings);
  if(!momentsSettings.contacts)momentsSettings.contacts={};
  
  var newMembers=[];
  var seen={};
  
  contacts.forEach(function(c){
    if(c.id==='fh')return;
    seen[c.id]=true;
    var existing=savedMembers&&savedMembers.find(function(m){return m.contactId===c.id||m.id===c.id});
    if(existing){
      newMembers.push({
        id:c.id,
        nickname:existing.nickname||c.name,
        avatar:existing.avatar||c.momentsAvatar||c.avatar,
        enabled:existing.enabled!==false,
        sessionId:existing.sessionId||'',
        contactId:c.id
      });
    }else{
      newMembers.push({id:c.id,nickname:c.name,avatar:c.momentsAvatar||c.avatar,enabled:true,sessionId:'',contactId:c.id});
    }
  });
  
  momentsMembers=newMembers;
  
  // 过滤掉已不存在联系人的朋友圈动态（仅在contacts已加载时过滤）
  if(contacts&&contacts.length>0){
    var validIds={'self':true,'me':true};
    contacts.forEach(function(c){if(c.id!=='fh')validIds[c.id]=true});
    var beforeFilter=momentsPosts.length;
    momentsPosts=momentsPosts.filter(function(post){
      return validIds[post.authorId]===true;
    });
    
    // 同时清理评论中引用已删除联系人的内容（保留评论本身，但清理无效点赞）
    momentsPosts.forEach(function(post){
      if(post.likes&&Array.isArray(post.likes)){
        post.likes=post.likes.filter(function(lid){return validIds[lid]===true});
      }
    });
    
    // 仅在确实过滤掉内容时才保存
    if(momentsPosts.length!==beforeFilter){
      saveMomentsData();
    }
  }
  
  renderMoments();
  setTimeout(scheduleFriendMoments,5000);
}
function saveMomentsData(){
  ls('ml2_moments_posts',momentsPosts);
  ls('ml2_moments_members',momentsMembers);
  ls('ml2_moments_settings',momentsSettings);
  if(window.localforage){
    window.localforage.setItem('ml2_moments_posts',momentsPosts).catch(function(){});
    window.localforage.setItem('ml2_moments_members',momentsMembers).catch(function(){});
    window.localforage.setItem('ml2_moments_settings',momentsSettings).catch(function(){});
  }
}

async function loadLettersFromIndexedDB(){
  try{
    // 修复：直接从 IndexedDB（localforage）读取，绕过 memoryCache 空值污染
    // 原实现先查 memoryCache，如果 restoreFromDB 先写入了空数组就会永远读不到 IndexedDB 真实数据
    var savedLetters=null;
    if(window.localforage){
      try{
        savedLetters=await window.localforage.getItem(LL);
        if(typeof savedLetters==='string'){
          try{savedLetters=JSON.parse(savedLetters);}catch(e){savedLetters=null;}
        }
      }catch(e){
        console.warn('[loadLetters] localforage read failed:',e);
        savedLetters=null;
      }
    }
    // 同时尝试 lsGetWithDB 作为兜底（localStorage备份路径）
    if((!savedLetters||!Array.isArray(savedLetters)||savedLetters.length===0)){
      try{
        var backupLetters=await lsGetWithDB(LL);
        if(backupLetters&&Array.isArray(backupLetters)&&backupLetters.length>0){
          savedLetters=backupLetters;
        }
      }catch(e){}
    }
    // 合并去重：以 IndexedDB 数据为主，与当前内存中的信件合并（按 id 去重），
    // 防止任何一边的数据被覆盖丢失
    var currentLetters=ls(LL)||[];
    var mergedLetters=[];
    var seenIds={};
    // 先加入 IndexedDB 中的信件（优先长期存储的数据）
    if(savedLetters&&Array.isArray(savedLetters)){
      savedLetters.forEach(function(l){
        if(l&&l.id&&!seenIds[l.id]){seenIds[l.id]=true;mergedLetters.push(l);}
      });
    }
    // 再加入当前内存中有但 IndexedDB 中没有的信件
    if(currentLetters&&Array.isArray(currentLetters)){
      currentLetters.forEach(function(l){
        if(l&&l.id&&!seenIds[l.id]){seenIds[l.id]=true;mergedLetters.push(l);}
      });
    }
    // 按时间倒序排列（最新信件在前）
    mergedLetters.sort(function(a,b){return (b.tm||0)-(a.tm||0);});
    // 只有合并后有数据才写入；如果两边都为空则不做任何事，避免覆盖
    if(mergedLetters.length>0){
      ls(LL,mergedLetters);
      // 同时确保写回 IndexedDB，修复可能存在的数据不一致
      if(window.localforage){
        try{window.localforage.setItem(LL,mergedLetters).catch(function(){});}catch(e){}
      }
      renderLetters();
      if(currentProfileContactId){
        try{renderContactLetterHistory(currentProfileContactId);}catch(e){}
      }
      updateBadges();
      console.log('[loadLettersFromIndexedDB] loaded '+mergedLetters.length+' letters');
    }
  }catch(e){
    console.error('loadLettersFromIndexedDB error:',e);
  }
}
var _momentsMemberCache={};
var _momentsMemberCacheKey='';
function _buildMomentsMemberCache(){
  _momentsMemberCache={};
  _momentsMemberCacheKey='';
  if(!momentsMembers)return;
  momentsMembers.forEach(function(m){
    var boundContact=m.contactId?contacts.find(function(c){return c.id===m.contactId}):null;
    var nickname=m.nickname||(boundContact?boundContact.name:'好友');
    var avatar=m.avatar||(boundContact?(boundContact.avatarLibOriginal||boundContact.avatar):'');
    _momentsMemberCache[m.id]={id:m.id,nickname:nickname,avatar:avatar,enabled:m.enabled,contactId:m.contactId};
  });
  // 同时缓存 contacts 中的联系人（用于直接 id 查找）
  contacts.forEach(function(c){
    if(c.id==='fh')return;
    if(!_momentsMemberCache[c.id]){
      _momentsMemberCache[c.id]={id:c.id,nickname:c.name,avatar:c.avatar,enabled:true};
    }
  });
  _momentsMemberCache['self']={nickname:me.name||'我',avatar:me.avatar||''};
  _momentsMemberCacheKey=momentsMembers.length+'_'+contacts.length+'_'+(me.name||'')+'_'+(me.avatar||'');
}
function getMomentsMember(mid){
  if(mid==='self')return{nickname:me.name||'我',avatar:me.avatar||''};
  // 检查缓存是否需要重建（数据变化时）
  var curKey=momentsMembers.length+'_'+contacts.length+'_'+(me.name||'')+'_'+(me.avatar||'');
  if(_momentsMemberCacheKey!==curKey){_buildMomentsMemberCache()}
  if(_momentsMemberCache[mid])return _momentsMemberCache[mid];
  // 兜底：直接查 contacts
  var contact=contacts.find(function(c){return c.id===mid});
  if(contact)return{id:contact.id,nickname:contact.name,avatar:contact.avatar,enabled:true};
  return{nickname:'好友',avatar:''}
}
function formatMomentsTime(t){var d=new Date(t);return(d.getMonth()+1)+'/'+d.getDate()+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)+':'+('0'+d.getSeconds()).slice(-2)}
function getRandomDelay(minS,maxS){return(Math.random()*(maxS-minS)+minS)*1000}
function maybeGenMoments(){
  var savedPosts=ls('ml2_moments_posts');
  if(savedPosts&&savedPosts.length>0)return;
  if(momentsPosts&&momentsPosts.length)return;
  momentsMembers.forEach(function(m){if(!m.enabled)return;for(var i=0;i<1+Math.floor(Math.random()*2);i++){
    var cardId=m.contactId||m.id;
    var contactCards=getContactCards(cardId).filter(function(c){return c.category==='custom'});
    if(contactCards.length===0)return;
    var content=contactCards[Math.floor(Math.random()*contactCards.length)].content;
    momentsPosts.push({
      id:'m_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
      authorId:m.id,
      content:content,
      images:[],
      timestamp:Date.now()-Math.random()*6048e5,
      likes:[],
      comments:[]
    })
  }});
  saveMomentsData();renderMoments();
}
var lastFriendPostTime={};
var _momentsSchedulerStarted=false;
function scheduleFriendMoments(){
  // 防止多个定时器链叠加：loadMomentsData 和初始化脚本都可能调用本函数，
  // 如果已有一个递归调度链在运行，就不再启动新的，避免每分钟触发频率成倍增加
  if(_momentsSchedulerStarted)return;
  _momentsSchedulerStarted=true;
  _doScheduleFriendMoments();
}
function _doScheduleFriendMoments(){
  contacts.forEach(function(c){
    if(c.id==='fh')return;

    var publishProb=momentsSettings.friendPostProbability;
    if(Math.random()*100>=publishProb)return;

    var minInterval=momentsSettings.friendPostIntervalMin*60*1000;
    var maxInterval=momentsSettings.friendPostIntervalMax*60*1000;
    // 发布后冷却时间（分钟转毫秒）
    var cooldownMs=(momentsSettings.friendPostCooldownMin||30)*60*1000;
    // 每日发布上限
    var dailyMax=momentsSettings.friendPostDailyMax||5;

    var lastTime=lastFriendPostTime[c.id]||0;
    var now=Date.now();
    var timeSinceLast=now-lastTime;

    // 检查冷却：发布后 cooldownMs 内不能再次触发
    if(timeSinceLast<cooldownMs){
      return;
    }
    // 检查最短发布间隔
    if(timeSinceLast<minInterval){
      return;
    }
    // 检查今日发布上限：统计今天 0 点起该联系人已发布的帖子数
    var todayStart=new Date();
    todayStart.setHours(0,0,0,0);
    var todayCount=momentsPosts.filter(function(p){
      return p.authorId===c.id&&p.timestamp>=todayStart.getTime();
    }).length;
    if(todayCount>=dailyMax){
      return;
    }

    var randomDelay=Math.random()*(maxInterval-minInterval);

    setTimeout(function(){
      var currentTime=Date.now();
      var elapsed=currentTime-lastTime;

      // 回调内再次校验冷却（延迟期间可能已被其他触发占用）
      if(elapsed<cooldownMs){
        return;
      }
      if(elapsed<minInterval){
        return;
      }
      // 回调内再次校验今日上限
      var todayStart2=new Date();
      todayStart2.setHours(0,0,0,0);
      var todayCount2=momentsPosts.filter(function(p){
        return p.authorId===c.id&&p.timestamp>=todayStart2.getTime();
      }).length;
      if(todayCount2>=dailyMax){
        return;
      }

      lastFriendPostTime[c.id]=currentTime;
      
      var member=momentsMembers.find(function(m){return m.id===c.id});
      var cardId=member&&member.contactId?member.contactId:c.id;
      var allCards=getContactCards(cardId);
      
      // 根据设置独立概率抽取各类字卡
      var s=momentsSettings;
      var textCards=allCards.filter(function(c){return c.category==='custom'});
      var kaomojiCards=allCards.filter(function(c){return c.category==='kaomoji'});
      var emojiCards=allCards.filter(function(c){return c.category==='emojis'});
      var stickerCards=allCards.filter(function(c){return c.category==='stickers'});
      
      var selectedCards=[];
      // 主字卡（按设置抽取多条，放在同一条朋友圈里，空格分隔）
      if(textCards.length>0){
        var minCards=momentsSettings.minCardsPerPost||1;
        var maxCards=momentsSettings.maxCardsPerPost||10;
        if(minCards>maxCards){var t=minCards;minCards=maxCards;maxCards=t;}
        var cardCount=minCards+Math.floor(Math.random()*(maxCards-minCards+1));
        if(cardCount>textCards.length)cardCount=textCards.length;
        // 不重复抽取
        var pool=textCards.slice();
        for(var ci=0;ci<cardCount&&pool.length>0;ci++){
          var idx=Math.floor(Math.random()*pool.length);
          selectedCards.push(pool[idx]);
          pool.splice(idx,1);
        }
      }
      // 颜文字
      if(kaomojiCards.length>0&&Math.random()*100<(s.friendPostKaomojiProb||5)){
        var kc=kaomojiCards[Math.floor(Math.random()*kaomojiCards.length)];
        selectedCards.push(kc);
      }
      // emoji
      if(emojiCards.length>0&&Math.random()*100<(s.friendPostEmojiProb||5)){
        var ec=emojiCards[Math.floor(Math.random()*emojiCards.length)];
        selectedCards.push(ec);
      }
      // 图片表情
      if(stickerCards.length>0&&Math.random()*100<(s.friendPostStickerProb||5)){
        var sc=stickerCards[Math.floor(Math.random()*stickerCards.length)];
        selectedCards.push(sc);
      }
      // 图片（额外再抽一张图片表情作为配图）
      if(stickerCards.length>0&&Math.random()*100<(s.friendPostImageProb||30)){
        var sc2=stickerCards[Math.floor(Math.random()*stickerCards.length)];
        selectedCards.push(sc2);
      }
      if(selectedCards.length===0)return;
      
      var contentParts=[];
      var postImages=[];
      selectedCards.forEach(function(sc){
        if(sc.category==='stickers'){
          // 图片表情：作为图片添加到帖子
          var imgSrc=sc.content||'';
          if(imgSrc&&imgSrc.startsWith('ml2_card_img_')){
            var cached=memoryCache['_img_'+imgSrc];
            if(cached)imgSrc=cached;
          }
          postImages.push(imgSrc);
        }else{
          // 主字卡/颜文字/emoji：空格分隔
          contentParts.push(sc.content);
        }
      });
      var content=contentParts.join(' ');
      
      var postId='m_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
      momentsPosts.unshift({
        id:postId,
        authorId:c.id,
        content:content,
        images:postImages,
        timestamp:Date.now(),
        likes:[],
        comments:[]
      });
      saveMomentsData();
      addMomentsNotification('post',postId,c.id,content);
      
      // 在联系人聊天中显示朋友圈通知
      var contactMsgs=msgs(c.id);
      contactMsgs.push({
        id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),
        s:OTHER,
        t:(c.name||c.nickname||'联系人')+'发布了一条朋友圈',
        ts:new Date(),
        read:(c.id===window.currentCid),
        isSystem:true
      });
      savemsgs(c.id,contactMsgs);
      if(c.id===window.currentCid){renderMsgs();}
      renderChatList();
      if(document.getElementById('pg-moments').classList.contains('active')){
        renderMoments();
      }
    },randomDelay);
  });

  setTimeout(_doScheduleFriendMoments,momentsSettings.friendPostIntervalMin*60*1000);
}
function renderMoments(){
  var mb=$('moments-back-btn');if(mb)mb.style.display='none';
  var mt=$('moments-title');if(mt)mt.textContent='朋友圈';
  
  var coverNameEl=$('moments-cover-name');
  if(coverNameEl)coverNameEl.textContent=me.name||'我';
  
  var avEl=$('moments-cover-av');
  if(avEl){
    if(me.avatar){
      avEl.innerHTML='<img src="'+me.avatar+'" style="width:100%;height:100%;object-fit:cover;">';
    }else{
      avEl.innerHTML=(me.name||'我').charAt(0);
    }
  }
  
  var coverEl=$('moments-cover');
  if(coverEl&&me.momentsCover){
    coverEl.style.backgroundImage='url('+me.momentsCover+')';
    coverEl.style.backgroundSize='cover';
    coverEl.style.backgroundPosition='center';
  }
  
  var savedInput=null;
  var existingInput=document.querySelector('.moments-comment-input-area');
  if(existingInput){
    var parentId=existingInput.parentElement?existingInput.parentElement.id:null;
    if(parentId&&parentId.startsWith('reply-area-')){
      var commentId=parentId.replace('reply-area-','');
      var input=existingInput.querySelector('input');
      savedInput={commentId:commentId,value:input?input.value:''};
    }
  }
  
  var postsEl=$('moments-posts');
  if(!postsEl){
    var scrollEl=$('moments-scroll');
    if(!scrollEl)return;
    postsEl=document.createElement('div');
    postsEl.id='moments-posts';
    scrollEl.appendChild(postsEl);
  }
  if(!momentsPosts||!momentsPosts.length){postsEl.innerHTML='<div class="empty">暂无动态</div>';return}
  // 性能优化：先显示加载占位，异步构建HTML避免阻塞按钮点击
  postsEl.innerHTML='<div class="empty" id="moments-loading">加载中…</div>';
  var _postsSnapshot=momentsPosts.slice().sort(function(a,b){return b.timestamp-a.timestamp});
  var _savedInput=savedInput;
  setTimeout(function(){
    _renderMomentsList(postsEl,_postsSnapshot,_savedInput);
  },0);
}

// 实际构建朋友圈列表HTML（异步调用，避免阻塞UI）
function _renderMomentsList(postsEl,postsList,savedInput){
  postsEl.innerHTML=postsList.map(function(post){
    var member=getMomentsMember(post.authorId);
    var likesHtml=post.likes&&post.likes.length>0?'<div class="moments-likes" style="display:flex;align-items:center;gap:6px;color:var(--accent);font-size:13px;padding:6px 12px;background:rgba(0,0,0,0.03);border-radius:8px;margin-top:8px;">'+post.likes.map(function(lid){var lm=getMomentsMember(lid);return lm.nickname}).join('、')+' 赞了这条动态</div>':'';
    var commentsHtml='';
    var hasComments=post.comments&&post.comments.length>0;
    if(hasComments){
      commentsHtml='<div style="border-top:1px solid var(--border);margin-top:4px;">'+
        '<button style="width:100%;padding:8px 0;border:none;background:none;color:var(--txt3);font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;" onclick="toggleMomentsPostComments(\''+post.id+'\')">'+
        (momentsCommentsExpanded?'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg> 收起评论':'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg> 查看全部 '+post.comments.length+' 条评论')+
        '</button>'+
        '<div class="moments-comments" id="moments-comments-'+post.id+'" style="display:'+(momentsCommentsExpanded?'block':'none')+';margin-top:4px;">'+post.comments.map(function(c){
          var cm=getMomentsMember(c.authorId);
          var commentImageHtml=c.image?'<img src="'+c.image+'" style="max-width:100px;max-height:100px;border-radius:6px;object-fit:cover;display:block;margin-top:4px;">':'';
          var contentHtml=c.content?(c.content.startsWith('data:image')?'<img src="'+c.content+'" style="max-width:100px;max-height:100px;border-radius:6px;object-fit:cover;">':renderMomentsContent(c.content)):'';
          var repliesHtml=c.replies&&c.replies.length>0?'<div class="moments-replies" style="margin-top:4px;padding-left:20px;">'+c.replies.map(function(r){var rm=getMomentsMember(r.authorId);var replyImageHtml=r.image?'<img src="'+r.image+'" style="max-width:60px;max-height:60px;border-radius:4px;object-fit:cover;display:block;margin-top:2px;">':'';var replyContent=r.content?(r.content.startsWith('data:image')?'<img src="'+r.content+'" style="max-width:60px;max-height:60px;border-radius:4px;object-fit:cover;">':renderMomentsContent(r.content)):'';return'<div class="moments-reply" style="font-size:13px;padding:4px 0;"><span style="color:var(--accent);font-weight:500;">'+rm.nickname+'</span>: '+replyContent+replyImageHtml+'</div>'}).join('')+'</div>':'';
          return'<div class="moments-comment" data-cid="'+c.id+'" style="padding:10px 0;border-bottom:1px solid var(--border);last-child{border-bottom:none;}display:block;"><div style="display:flex;gap:10px;cursor:pointer;" onclick="showMomentsReplyInput(\''+post.id+'\',\''+c.id+'\',\''+cm.nickname+'\')"><div class="moments-comment-av" style="width:32px;height:32px;border-radius:0;background:var(--c3);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;">'+(cm.avatar?'<img src="'+cm.avatar+'" style="width:100%;height:100%;border-radius:0;object-fit:cover;">':'✦')+'</div><div style="flex:1;min-width:0;"><div style="display:flex;align-items:center;gap:8px;"><span style="font-size:14px;color:var(--accent);font-weight:500;">'+cm.nickname+'</span><span style="font-size:12px;color:var(--txt3);">'+formatMomentsTime(c.timestamp)+'</span></div><div style="font-size:14px;color:var(--txt);margin-top:4px;line-height:1.5;">'+contentHtml+'</div>'+repliesHtml+'</div></div>'+'<div class="moments-comment-reply-area" id="reply-area-'+c.id+'" style="width:100%;clear:both;margin-top:8px;padding-left:42px;"></div></div>';
        }).join('')+'</div></div>';
    }
    var imagesHtml='';
    if(post.images&&post.images.length>0){
      var gridSize=post.images.length===1?'calc(65% - 2px)':(post.images.length===2||post.images.length===4)?'calc(50% - 2px)':'calc(33.33% - 3px)';
      imagesHtml='<div class="mo-images" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;">'+post.images.map(function(img,idx){return'<img src="'+img+'" data-idx="'+idx+'" data-post="'+post.id+'" style="width:'+gridSize+';aspect-ratio:1;border-radius:8px;object-fit:cover;cursor:pointer;" onclick="openMomentsImagePreview(\''+post.id+'\','+idx+')">'}).join('')+'</div>';
    }
    
    var contentHtml=post.content;
    if(post.remindIds&&post.remindIds.length>0){
      post.remindIds.forEach(function(rid){
        var rm=getMomentsMember(rid);
        if(rm&&rm.nickname){
          var atTag='@'+rm.nickname;
          if(contentHtml.indexOf(atTag)===-1){
            contentHtml=contentHtml+' <span style="color:#1890ff;font-weight:500;">'+atTag+'</span>';
          }else{
            contentHtml=contentHtml.replace(new RegExp('@'+rm.nickname.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'),'<span style="color:#1890ff;font-weight:500;">@'+rm.nickname+'</span>');
          }
        }
      });
    }
    
    var metaHtml='';
    if(post.location){
      metaHtml+='<div class="mo-location" style="font-size:12px;color:var(--txt3);margin-top:4px;">📍 '+post.location+'</div>';
    }
    if(post.remindIds&&post.remindIds.length>0){
      var remindNames=post.remindIds.map(function(rid){var m=getMomentsMember(rid);return m?'@'+m.nickname:'@某人'}).join(' ');
      metaHtml+='<div class="mo-remind" style="font-size:12px;color:#1890ff;margin-top:2px;">💡 已提醒 '+remindNames+' 回复（对方100%会回复）</div>';
    }
    if(post.visibility==='selected'&&post.visSelectedIds&&post.visSelectedIds.length>0){
      var visNames=post.visSelectedIds.map(function(rid){var m=getMomentsMember(rid);return m?m.nickname:'某人'}).join('、');
      metaHtml+='<div class="mo-visibility" style="font-size:11px;color:var(--txt3);margin-top:2px;">🔒 仅 '+visNames+' 可见（只有这些人可以点赞和回复）</div>';
    } else if(post.visibility==='public'){
      metaHtml+='<div class="mo-visibility" style="font-size:11px;color:var(--txt3);margin-top:2px;">🌐 所有联系人可见</div>';
    }
    
    var likedBySelf=post.likes&&post.likes.indexOf('self')>=0;
    var likeIcon=likedBySelf?'<span style="color:#ff4d4f;">♥</span>':'<span>♡</span>';
    var likeText=likedBySelf?'<span style="color:#ff4d4f;">已赞</span>':'<span>点赞</span>';
    
    return'<div class="moment" data-mid="'+post.id+'" style="background:#fff;border-radius:12px;padding:12px;margin-bottom:8px;box-shadow:0 1px 3px rgba(0,0,0,0.05);position:relative;"><div class="mo-head" style="display:flex;align-items:center;gap:10px;margin-bottom:10px;"><div class="mo-av" style="width:40px;height:40px;border-radius:0;background:var(--c3);display:flex;align-items:center;justify-content:center;overflow:hidden;">'+(member.avatar?'<img src="'+member.avatar+'" style="display:block;width:100%;height:100%;object-fit:cover;">':'✦')+'</div><div><div class="mo-name" style="font-weight:500;color:var(--txt);font-size:15px;">'+member.nickname+'</div><div class="mo-time" style="font-size:12px;color:var(--txt3);margin-top:2px;">'+formatMomentsTime(post.timestamp)+'</div></div></div>'+(post.authorId==='self'?'<div style="position:absolute;top:10px;right:10px;display:flex;gap:4px;"><button onclick="editMoment(\''+post.id+'\')" style="width:24px;height:24px;border:none;background:none;color:var(--txt3);font-size:12px;cursor:pointer;opacity:0.35;display:flex;align-items:center;justify-content:center;border-radius:50%;" title="编辑">✎</button><button onclick="deleteMoment(\''+post.id+'\')" style="width:24px;height:24px;border:none;background:none;color:var(--txt3);font-size:12px;cursor:pointer;opacity:0.35;display:flex;align-items:center;justify-content:center;border-radius:50%;" title="删除">✕</button></div>':(post.authorId&&post.authorId!=='me'?'<div style="position:absolute;top:10px;right:10px;display:flex;gap:4px;"><button onclick="deleteMoment(\''+post.id+'\')" style="width:24px;height:24px;border:none;background:none;color:var(--txt3);font-size:12px;cursor:pointer;opacity:0.35;display:flex;align-items:center;justify-content:center;border-radius:50%;" title="删除">✕</button></div>':''))+'<div class="mo-body" style="font-size:14px;color:var(--txt);line-height:1.6;">'+contentHtml+'</div>'+(post.aiLoading?'<div style="margin-top:8px;padding:8px 10px;border-radius:10px;background:rgba(0,0,0,0.05);border:1px dashed var(--border);font-size:12px;color:var(--txt2);"><span style="display:inline-block;animation:aiPulse 1s ease-in-out infinite;">📜 TA正在解读...</span></div>':(post.aiError?'<div style="margin-top:8px;padding:8px 10px;border-radius:10px;background:rgba(0,0,0,0.05);border:1px dashed var(--border);font-size:12px;color:#ff4d4f;">📜 解读失败：'+String(post.aiError).replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div>':(post.aiInterpret?'<div onclick="toggleMomentAI(\''+post.id+'\')" style="margin-top:8px;padding:8px 10px;border-radius:10px;background:rgba(0,0,0,0.05);border:1px dashed var(--border);cursor:pointer;font-size:12px;color:var(--accent);user-select:none;-webkit-user-select:none;"><span id="m-ai-t-'+post.id+'">📜 收起解读</span></div><div id="m-ai-'+post.id+'" style="display:block;margin-top:6px;padding:10px 12px;border-radius:10px;background:rgba(0,0,0,0.04);font-size:13px;color:var(--txt);line-height:1.7;word-break:break-all;">'+String(post.aiInterpret).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>')+'</div>':'')))+metaHtml+imagesHtml+likesHtml+commentsHtml+'<div class="mo-footer" style="display:flex;justify-content:center;gap:40px;margin-top:12px;padding-top:10px;border-top:1px solid var(--bg3);"><div class="mo-action '+(likedBySelf?'mo-like liked':'')+'" data-action="like" style="display:flex;align-items:center;gap:6px;color:'+(likedBySelf?'#ff4d4f':'var(--txt3)')+';font-size:14px;cursor:pointer;transition:color 0.2s;" onclick="toggleLike(\''+post.id+'\')">'+likeIcon+likeText+'</div><div class="mo-action" data-action="comment" style="display:flex;align-items:center;gap:6px;color:var(--txt3);font-size:14px;cursor:pointer;transition:color 0.2s;" onclick="showMomentsCommentInput(\''+post.id+'\')"><span>💬</span><span>评论</span></div><div class="mo-action" style="display:flex;align-items:center;gap:6px;color:var(--txt3);font-size:14px;cursor:pointer;transition:color 0.2s;" onclick="aiInterpretMoment(\''+post.id+'\')"><span>📜</span><span>解读</span></div></div></div>';
  }).join('');
  
  if(savedInput){
    setTimeout(function(){
      var replyArea=document.getElementById('reply-area-'+savedInput.commentId);
      if(replyArea){
        var post=null;
        var comment=null;
        if(!momentsPosts||!momentsPosts.length)return;
        for(var i=0;i<momentsPosts.length;i++){
          var p=momentsPosts[i];
          for(var j=0;j<p.comments.length;j++){
            if(p.comments[j].id===savedInput.commentId){
              post=p;
              comment=p.comments[j];
              break;
            }
          }
          if(comment)break;
        }
        if(post&&comment){
          var cm=getMomentsMember(comment.authorId);
          showMomentsReplyInput(post.id,comment.id,cm.nickname);
          var newInput=document.querySelector('.moments-comment-input-area input');
          if(newInput){
            newInput.value=savedInput.value;
            newInput.focus();
          }
        }
      }
    },50);
  }
}

function toggleMomentsPostComments(postId){
  var el=document.getElementById('moments-comments-'+postId);
  if(el){
    el.style.display=el.style.display==='none'?'block':'none';
  }
}
function toggleLike(mid){
  var post=momentsPosts.find(function(p){return p.id===mid});if(!post)return;
  var idx=post.likes.indexOf('self');
  if(idx===-1){post.likes.push('self');toast('已点赞')}else{post.likes.splice(idx,1);toast('已取消点赞')}
  saveMomentsData();refreshMomentsView();
}
function isLikedBySelf(post){return post.likes&&post.likes.indexOf('self')>=0}
// ★ AI 解读朋友圈动态：结果保留在动态下方（不弹窗），存到动态数据重新打开仍在
function toggleMomentAI(postId){
  var _body=document.getElementById('m-ai-'+postId);
  var _tog=document.getElementById('m-ai-t-'+postId);
  if(_body&&_tog){
    var _open=_body.style.display!=='none';
    _body.style.display=_open?'none':'block';
    _tog.textContent=_open?'📜 查看解读':'📜 收起解读';
  }
}
function aiInterpretMoment(postId){
  var post=null;
  var all=(typeof momentsPosts!=='undefined'&&momentsPosts)?momentsPosts:[];
  for(var i=0;i<all.length;i++){if(all[i].id===postId){post=all[i];break;}}
  if(!post){toast('动态不存在');return;}
  var s=(typeof getApiSettings==='function')?getApiSettings():{enabled:false,apiKey:''};
  if(!s.enabled||!s.apiKey){
    var r=confirm('还没有接入 AI 接口，无法解读。\n\n请在 底部导航「设置」→「API 接口」中：\n1. 打开「启用 AI 解读」开关\n2. 填入 API 地址和 Key（如 DeepSeek）\n3. 保存后即可使用\n\n现在去配置吗？');
    if(r&&typeof openApiSettings==='function')openApiSettings();
    return;
  }
  var text=post.content||post.text||'';
  if(!text){toast('动态内容为空');return;}
  // 标记解读中，保存并重渲染朋友圈
  post.aiLoading=true;post.aiInterpret='';post.aiError='';
  saveMomentsData();
  renderMoments();
  var ownerId=(post.authorId&&post.authorId!=='self')?post.authorId:null;
  var genderText=getContactGender(ownerId)==='girl'?'女朋友':'男朋友';
  var personaText='';
  var contactPersona=getContactPersona(ownerId);
  if(contactPersona)personaText='\n【TA的完整人设】'+contactPersona;
  var systemPrompt='你是用户当前联系人的梦角TA——用户另一个世界的恋人（'+genderText+'）。不同联系人是不同的人、不同的梦角，你的人设和语气只属于当前联系人。\n'+
  AI_BASE_SETTING+personaText+'\n'+
  '【解读要求】用 100~200 字解读这段内容：字面意思 → 你真正想说的话 → 此刻的感受 → 给用户的一句话回应。用第二人称"你"对用户说话，第一人称"我"=你。';
  var userPrompt='这是TA的一条朋友圈动态：「'+text+'」。请以TA的身份解读它想传达的意思。';
  fetch(s.baseUrl.replace(/\/+$/,'')+'/chat/completions',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+s.apiKey},
    body:JSON.stringify({model:s.model,messages:[{role:'system',content:systemPrompt},{role:'user',content:userPrompt}],max_tokens:500})
  }).then(function(res){
    if(!res.ok){throw new Error('HTTP '+res.status);}
    return res.json();
  }).then(function(data){
    var text2=(data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||'';
    if(!text2){throw new Error('返回为空');}
    var all2=(typeof momentsPosts!=='undefined'&&momentsPosts)?momentsPosts:[];
    for(var i2=0;i2<all2.length;i2++){if(all2[i2].id===postId){all2[i2].aiInterpret=text2;all2[i2].aiLoading=false;all2[i2].aiError='';break;}}
    saveMomentsData();
    renderMoments();
  }).catch(function(e){
    console.warn('AI moment interpret failed:',e);
    var all3=(typeof momentsPosts!=='undefined'&&momentsPosts)?momentsPosts:[];
    for(var i3=0;i3<all3.length;i3++){if(all3[i3].id===postId){all3[i3].aiLoading=false;all3[i3].aiError=String(e.message||e);all3[i3].aiInterpret='';break;}}
    saveMomentsData();
    renderMoments();
    toast('AI 解读失败，请检查 API 配置');
  });
}
// ★ AI 解读朋友圈评论（梦角评论）
function aiInterpretMomentComment(postId,commentId){
  var post=null;
  var all=(typeof momentsPosts!=='undefined'&&momentsPosts)?momentsPosts:[];
  for(var i=0;i<all.length;i++){if(all[i].id===postId){post=all[i];break;}}
  if(!post){toast('动态不存在');return;}
  var comment=null;
  if(post.comments&&Array.isArray(post.comments)){
    for(var j=0;j<post.comments.length;j++){if(post.comments[j].id===commentId){comment=post.comments[j];break;}}
  }
  if(!comment){toast('评论不存在');return;}
  var text=comment.content||comment.text||'';
  if(!text||text.startsWith('data:image')){toast('评论内容为空');return;}
  // 绑定该动态所属联系人（作者）的人设
  var ownerId=(post.authorId&&post.authorId!=='self'&&post.authorId!=='me')?post.authorId:null;
  if(typeof aiInterpretText==='function'){
    aiInterpretText('梦角在朋友圈的一条评论：「'+text+'」','AI 解读评论',ownerId);
  }else{
    toast('AI 功能未加载');
  }
}
// ★ 评论区「解读」按钮：渲染后 DOM 统一追加（不依赖字符串拼接，杜绝布局破坏）
function attachMomentsInterpretBtns(root){
  if(!root)root=document;
  var rows=root.querySelectorAll?root.querySelectorAll('.moments-comment'):[];
  for(var i=0;i<rows.length;i++){
    var row=rows[i];
    if(row._aiAttached)continue;
    row._aiAttached=true;
    var cid=row.getAttribute('data-cid');
    if(!cid||cid==='self'||cid==='me')continue;
    if(row.querySelector&&row.querySelector('img'))continue; // 图片评论不加
    var wrap=row.closest?row.closest('.moments-comments'):null;
    if(!wrap)continue;
    var pid=wrap.id?wrap.id.replace('moments-comments-',''):'';
    if(!pid)continue;
    var _pid=pid,_cid=cid;
    var btn=document.createElement('div');
    btn.style.cssText='display:block;white-space:nowrap;margin:6px 0 0 42px;padding:3px 10px;border-radius:8px;background:rgba(0,0,0,0.05);border:1px solid var(--border);font-size:11px;color:var(--accent);cursor:pointer;text-align:center;';
    btn.textContent='📜 解读这条评论';
    btn.onclick=function(e){e.stopPropagation();aiInterpretMomentComment(_pid,_cid);};
    row.appendChild(btn);
  }
}
function initMomentsInterpretObserver(){
  if(window._momentsObsInit)return;
  window._momentsObsInit=true;
  var target=document.body||document.documentElement;
  if(!target)return;
  try{
    new MutationObserver(function(){attachMomentsInterpretBtns(document);}).observe(target,{childList:true,subtree:true});
    attachMomentsInterpretBtns(document);
  }catch(e){}
}
try{initMomentsInterpretObserver();}catch(e){}
function showMomentsCommentInput(postId){
  var existingInput=document.querySelector('.moments-comment-input-area');
  if(existingInput)existingInput.remove();
  
  var postEl=document.querySelector('.moment[data-mid="'+postId+'"]');
  if(!postEl)return;
  
  var inputArea=document.createElement('div');
  inputArea.className='moments-comment-input-area';
  inputArea.style.cssText='margin-top:8px;display:flex;align-items:center;gap:6px;padding:6px 8px;background:var(--bg2);border-radius:20px;';
  var me=getMomentsMember('self')||{nickname:'我',avatar:''};
  inputArea.innerHTML='<div class="moments-comment-av" style="width:24px;height:24px;border-radius:0;">'+(me.avatar?'<img src="'+me.avatar+'" style="width:100%;height:100%;object-fit:cover;border-radius:0;">':'✦')+'</div>'+'<button class="moments-emoji-btn" style="width:32px;height:32px;border:none;background:transparent;border-radius:50%;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;color:var(--txt3);flex-shrink:0;" title="选择表情">😊</button>'+'<button class="moments-img-btn" style="width:32px;height:32px;border:none;background:transparent;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;color:var(--txt3);flex-shrink:0;" title="发送图片">🖼️</button>'+'<input type="file" class="moments-img-input" accept="image/*" style="display:none;">'+'<input type="text" placeholder="写评论..." style="flex:1;padding:6px 10px;border:none;border-radius:16px;background:transparent;color:var(--txt);font-size:13px;outline:none;">'+'<button class="moments-send-btn" style="padding:6px 16px;border:none;border-radius:16px;background:var(--accent);color:white;font-size:13px;cursor:pointer;flex-shrink:0;">发送</button>';
  
  var input=inputArea.querySelector('input[type="text"]');
  var sendBtn=inputArea.querySelector('.moments-send-btn');
  var emojiBtn=inputArea.querySelector('.moments-emoji-btn');
  var imgBtn=inputArea.querySelector('.moments-img-btn');
  var imgInput=inputArea.querySelector('.moments-img-input');
  var pendingImg='';
  
  var insertEmoji=function(emoji){
    var start=input.selectionStart||input.value.length;
    var end=input.selectionEnd||input.value.length;
    input.value=input.value.slice(0,start)+emoji+input.value.slice(end);
    input.selectionStart=input.selectionEnd=start+emoji.length;
    input.focus();
  };
  
  emojiBtn.addEventListener('click',function(e){
    e.preventDefault();
    e.stopPropagation();
    showMomentsEmojiPicker(input);
  });
  emojiBtn.addEventListener('touchend',function(e){
    e.preventDefault();
    e.stopPropagation();
    showMomentsEmojiPicker(input);
  });
  
  // ★ 新增：评论图片上传
  var triggerImgPick=function(e){
    e.preventDefault();
    e.stopPropagation();
    imgInput.click();
  };
  imgBtn.addEventListener('click',triggerImgPick);
  imgBtn.addEventListener('touchend',triggerImgPick);
  imgInput.addEventListener('change',function(){
    var file=this.files&&this.files[0];
    if(!file)return;
    var reader=new FileReader();
    reader.onload=function(ev){
      pendingImg=ev.target.result;
      if(pendingImg){
        input.placeholder='已选图片，可继续输入文字…';
      }
      input.focus();
    };
    reader.readAsDataURL(file);
    this.value='';
  });
  
  var closeInput=function(){
    inputArea.remove();
    document.removeEventListener('click',closeInputHandler);
  };
  
  var closeInputHandler=function(e){
    var ovEmoji=$('ov-emoji');
    if(!inputArea.contains(e.target)&&!e.target.classList.contains('mo-action')&&!e.target.closest('.mo-action')&&!(ovEmoji&&ovEmoji.contains(e.target))){
      closeInput();
    }
  };
  
  sendBtn.addEventListener('click',function(){
    var val=input.value.trim();
    if(!val&&!pendingImg)return;
    addComment(postId,'self',val,pendingImg||'');
    closeInput();
  });
  
  input.addEventListener('keypress',function(e){
    if(e.key==='Enter'){
      var val=input.value.trim();
      if(val||pendingImg){
        addComment(postId,'self',val,pendingImg||'');
        closeInput();
      }
    }
  });
  
  postEl.appendChild(inputArea);
  input.focus();
  
  setTimeout(function(){
    document.addEventListener('click',closeInputHandler);
  },100);
}

function renderMomentsContent(text){
  if(!text)return '';
  var html=text.replace(/\[表情:[^\]]+\]/g,function(match){
    var cardId=match.replace(/^\[表情:/,'').replace(/\]$/,'');
    var card=globalCards.find(function(c){return (c.id===cardId||c.name===cardId)&&c.category==='stickers'});
    if(card&&card.content&&(card.content.startsWith('http')||card.content.startsWith('data:'))){
      return '<img src="'+card.content+'" style="max-width:80px;max-height:80px;border-radius:6px;object-fit:contain;display:inline-block;vertical-align:middle;">';
    }
    return '<span style="display:inline-block;padding:2px 6px;background:#f0f0f0;border-radius:4px;font-size:12px;color:#666;">'+match+'</span>';
  });
  return html;
}

var momentsInputForEmoji=null;
function showMomentsEmojiPicker(input){
  momentsInputForEmoji=input;
  showOv('ov-emoji');
  var tab=document.querySelector('.emoji-tab.sel');
  if(tab){renderEmojiPanel(tab.dataset.tab)}
}
function showMomentsReplyInput(postId,commentId,nickname){
  var existingInput=document.querySelector('.moments-comment-input-area');
  if(existingInput)existingInput.remove();
  
  var replyArea=document.getElementById('reply-area-'+commentId);
  if(!replyArea)return;
  
  var inputArea=document.createElement('div');
  inputArea.className='moments-comment-input-area';
  inputArea.style.cssText='width:100%;max-width:100%;box-sizing:border-box;min-width:0;display:flex;align-items:center;gap:6px;padding:6px;background:var(--bg2);border-radius:16px;overflow:hidden;';
  var me=getMomentsMember('self')||{nickname:'我',avatar:''};
  inputArea.innerHTML='<div class="moments-comment-av" style="width:22px;height:22px;border-radius:0;">'+(me.avatar?'<img src="'+me.avatar+'" style="width:100%;height:100%;object-fit:cover;border-radius:0;">':'✦')+'</div>'+'<button class="moments-emoji-btn" style="width:28px;height:28px;border:none;background:transparent;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;color:var(--txt3);flex-shrink:0;" title="选择表情">😊</button>'+'<button class="moments-img-btn" style="width:28px;height:28px;border:none;background:transparent;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;color:var(--txt3);flex-shrink:0;" title="发送图片">🖼️</button>'+'<input type="file" class="moments-img-input" accept="image/*" style="display:none;">'+'<input type="text" placeholder="回复 '+nickname+'..." style="flex:1;padding:4px 10px;border:none;border-radius:12px;background:transparent;color:var(--txt);font-size:12px;outline:none;">'+'<button class="moments-send-btn" style="padding:4px 12px;border:none;border-radius:12px;background:var(--accent);color:white;font-size:12px;cursor:pointer;flex-shrink:0;">发送</button>';
  
  var input=inputArea.querySelector('input[type="text"]');
  var sendBtn=inputArea.querySelector('.moments-send-btn');
  var emojiBtn=inputArea.querySelector('.moments-emoji-btn');
  var imgBtn=inputArea.querySelector('.moments-img-btn');
  var imgInput=inputArea.querySelector('.moments-img-input');
  var pendingImg='';
  
  emojiBtn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();showMomentsEmojiPicker(input);});
  emojiBtn.addEventListener('touchend',function(e){e.preventDefault();e.stopPropagation();showMomentsEmojiPicker(input);});
  var triggerImgPick2=function(e){e.preventDefault();e.stopPropagation();imgInput.click();};
  imgBtn.addEventListener('click',triggerImgPick2);
  imgBtn.addEventListener('touchend',triggerImgPick2);
  imgInput.addEventListener('change',function(){
    var file=this.files&&this.files[0];
    if(!file)return;
    var reader=new FileReader();
    reader.onload=function(ev){
      pendingImg=ev.target.result;
      if(pendingImg)input.placeholder='已选图片，可继续输入…';
      input.focus();
    };
    reader.readAsDataURL(file);
    this.value='';
  });
  
  var closeInput=function(){
    inputArea.remove();
    document.removeEventListener('click',closeInputHandler);
  };
  
  var closeInputHandler=function(e){
    var ovEmoji=$('ov-emoji');
    if(!inputArea.contains(e.target)&&!e.target.closest('.moments-comment')&&!e.target.classList.contains('mo-action')&&!e.target.closest('.mo-action')&&!(ovEmoji&&ovEmoji.contains(e.target))){
      closeInput();
    }
  };
  
  var handleReply=function(val,img){
    var post=momentsPosts.find(function(p){return p.id===postId});
    if(post){
      var comment=post.comments.find(function(c){return c.id===commentId});
      if(comment){
        var replyId='r_'+Date.now();
        var replyObj={id:replyId,authorId:'self',content:val,timestamp:Date.now()};
        if(img)replyObj.image=img;
        comment.replies.push(replyObj);
        saveMomentsData();
        
        if(comment.authorId!=='self'){
          var isReminded=(post.remindIds&&post.remindIds.indexOf(comment.authorId)>=0);
          var replyProb=isReminded?100:(momentsSettings.replyProbability||15);
          if(Math.random()*100<replyProb){
            var replyDelay=getRandomDelay(momentsSettings.replySpeedMin||5,momentsSettings.replySpeedMax||30);
            setTimeout(function(){
              var cardId=comment.authorId;
              var ca=getContactCards(cardId).filter(function(card){return card.category==='custom'});
              var replyContent='';
              if(!ca.length){
                var defaultReplies=['哈哈','不错','👍','有意思','😊'];
                replyContent=defaultReplies[Math.floor(Math.random()*defaultReplies.length)];
              }else{
                var rc=ca[Math.floor(Math.random()*ca.length)];
                replyContent=rc.content;
              }
              var postObj=momentsPosts.find(function(p){return p.id===postId});
              if(postObj){
                var commentObj=postObj.comments.find(function(c){return c.id===commentId});
                if(commentObj){
                  commentObj.replies.push({id:'r_'+Date.now(),authorId:comment.authorId,content:replyContent,timestamp:Date.now()});
                  saveMomentsData();refreshMomentsView();
                }
              }
            },replyDelay);
          }
        }
      }
    }
    input.value='';
    closeInput();
    renderMoments();
  };
  
  sendBtn.addEventListener('click',function(){
    var val=input.value.trim();
    if(!val)return;
    handleReply(val,pendingImg);
  });
  sendBtn.addEventListener('touchend',function(e){
    e.preventDefault();
    var val=input.value.trim();
    if(!val&&!pendingImg)return;
    handleReply(val,pendingImg);
  });
  
  input.addEventListener('keypress',function(e){
    if(e.key==='Enter'){
      var val=input.value.trim();
      if(val||pendingImg){
        handleReply(val,pendingImg);
      }
    }
  });
  
  replyArea.appendChild(inputArea);
  input.focus();
  
  setTimeout(function(){
    document.addEventListener('click',closeInputHandler);
  },100);
}
function refreshMomentsView(){
  if(currentMomentsContactId&&currentMomentsContactId!=='me'){
    switchToContactMoments(currentMomentsContactId);
  }else{
    renderMoments();
  }
}
function addComment(mid,authorId,content,image){
  var post=momentsPosts.find(function(p){return p.id===mid});if(!post)return;
  var commentId='c_'+Date.now();
  var commentObj={id:commentId,authorId:authorId,content:content,timestamp:Date.now(),replies:[]};
  if(image){commentObj.image=image;}
  post.comments.push(commentObj);
  saveMomentsData();refreshMomentsView();
  if(post.authorId==='self'&&authorId!=='self'){
    addMomentsNotification('comment',post.id,authorId,content);
  }
  
  if(post.authorId!=='self'&&authorId==='self'){
    var replyProb=momentsSettings.replyProbability||15;
    if(Math.random()*100<replyProb){
      var replyDelay=getRandomDelay(momentsSettings.replySpeedMin||5,momentsSettings.replySpeedMax||30);
      setTimeout(function(){
        try{
        var cardId=post.authorId;
        // ★ 修复：authorId 可能是脏数据（如旧的评论/动态 id），通过朋友圈成员信息找回真实联系人
        if(cardId&&(cardId.indexOf('c_')===0||cardId.indexOf('m_')===0)){
          try{
            var _mem=getMomentsMember(cardId);
            if(_mem&&(_mem.contactId||_mem.bindContactId))cardId=_mem.contactId||_mem.bindContactId;
          }catch(e){}
        }
        console.log('[moments] 梦角回复评论触发 cardId=',cardId,'replyProb=',replyProb);
        var allCards=getContactCards(cardId);
        var s=momentsSettings;
        var textCards=allCards.filter(function(c){return c.category==='custom'});
        var kaomojiCards=allCards.filter(function(c){return c.category==='kaomoji'});
        var emojiCards=allCards.filter(function(c){return c.category==='emojis'});
        var stickerCards=allCards.filter(function(c){return c.category==='stickers'});
        var parts=[];
        var replyImage='';
        if(textCards.length>0){
          var tc=textCards[Math.floor(Math.random()*textCards.length)];
          parts.push(tc.content);
        }
        if(kaomojiCards.length>0&&Math.random()*100<(s.friendReplyKaomojiProb||5)){
          var kc=kaomojiCards[Math.floor(Math.random()*kaomojiCards.length)];
          parts.push(kc.content);
        }
        if(emojiCards.length>0&&Math.random()*100<(s.friendReplyEmojiProb||5)){
          var ec=emojiCards[Math.floor(Math.random()*emojiCards.length)];
          parts.push(ec.content);
        }
        if(stickerCards.length>0&&Math.random()*100<(s.friendReplyStickerProb||5)){
          var sc=stickerCards[Math.floor(Math.random()*stickerCards.length)];
          replyImage=sc.content||'';
        }
        if(parts.length===0&&!replyImage){
          var defaultReplies=['哈哈','不错','👍','有意思','😊'];
          var replyContent=defaultReplies[Math.floor(Math.random()*defaultReplies.length)];
          var postObj=momentsPosts.find(function(p){return p.id===mid});
          if(postObj){
            var commentObj2=postObj.comments.find(function(c){return c.id===commentId});
            if(commentObj2){
              commentObj2.replies.push({id:'r_'+Date.now(),authorId:post.authorId,content:replyContent,timestamp:Date.now()});
              saveMomentsData();refreshMomentsView();
            }
          }
          return;
        }
        var replyObj={id:'r_'+Date.now(),authorId:post.authorId,content:parts.join(' '),timestamp:Date.now()};
        if(replyImage){replyObj.image=replyImage;}
        var postObj=momentsPosts.find(function(p){return p.id===mid});
        if(postObj){
          var commentObj2=postObj.comments.find(function(c){return c.id===commentId});
          if(commentObj2){
            commentObj2.replies.push(replyObj);
            saveMomentsData();refreshMomentsView();
          }
        }
        }catch(err){console.error('[moments] 梦角回复评论失败:',err);}
      },replyDelay);
    }
  }
}
function triggerMomentsInteractions(postId){
  var post=momentsPosts.find(function(p){return p.id===postId});if(!post)return;
  var visibleIds={};
  if(post.visibility==='selected'){
    (post.visSelectedIds||[]).forEach(function(id){visibleIds[id]=true});
  }
  var remindedIds={};
  if(post.remindIds){post.remindIds.forEach(function(id){remindedIds[id]=true});}
  var isReminded=function(memberId){
    if(post.remindIds&&post.remindIds.indexOf(memberId)>=0)return true;
    var cm=momentsMembers.find(function(m){return m.id===memberId});
    if(cm&&cm.contactId&&post.remindIds&&post.remindIds.indexOf(cm.contactId)>=0)return true;
    return false;
  };
  var canInteract=function(memberId){
    if(post.visibility==='selected'){
      if(visibleIds[memberId])return true;
      if(remindedIds[memberId])return true;
      var cm=momentsMembers.find(function(m){return m.id===memberId});
      if(cm&&cm.contactId&&visibleIds[cm.contactId])return true;
      if(cm&&cm.contactId&&remindedIds[cm.contactId])return true;
      return false;
    }
    return true;
  };
  var mlProb=momentsSettings.likeProbability||50;
  var mlMin=momentsSettings.likeSpeedMin||5;
  var mlMax=momentsSettings.likeSpeedMax||30;
  var mcProb=momentsSettings.commentProbability||30;
  var mcMin=momentsSettings.commentSpeedMin||10;
  var mcMax=momentsSettings.commentSpeedMax||60;
  var rpMin=momentsSettings.replySpeedMin||5;
  var rpMax=momentsSettings.replySpeedMax||30;
  
  var enabledMembers=momentsMembers.filter(function(m){return m.enabled&&canInteract(m.id)});
  enabledMembers.forEach(function(member){
    var isTagged=isReminded(member.id);
    var likeDelay=getRandomDelay(mlMin,mlMax);
    var commentDelay=likeDelay+getRandomDelay(mcMin,mcMax);
    var replyDelay=likeDelay+getRandomDelay(rpMin,rpMax);
    
    if(isTagged){
      setTimeout(function(){
        var p=momentsPosts.find(function(x){return x.id===postId});if(!p)return;
        var cid=member.contactId||member.id;
        var ca=getContactCards(cid).filter(function(card){return card.category==='custom'});
        var reply='';
        if(ca.length){
          reply=ca[Math.floor(Math.random()*ca.length)].content;
        }else{
          var defaultReplies=['收到啦~','好的好的','我看到了！','嗯嗯嗯','❤️','这条动态我看到啦','记住啦！'];
          reply=defaultReplies[Math.floor(Math.random()*defaultReplies.length)];
        }
        addComment(postId,member.id,reply);
      },replyDelay);
    }
    
    setTimeout(function(){
      var p=momentsPosts.find(function(x){return x.id===postId});if(!p)return;
      if(p.likes.indexOf(member.id)===-1){
        if(isTagged||Math.random()<mlProb/100){
          p.likes.push(member.id);
          saveMomentsData();refreshMomentsView();
          addMomentsNotification('like',postId,member.id,'');
        }
      }
    },likeDelay);
    
    setTimeout(function(){
      var p=momentsPosts.find(function(x){return x.id===postId});if(!p)return;
      if(isTagged||Math.random()<mcProb/100){
        var cid=member.contactId||member.id;
        var ca=getContactCards(cid).filter(function(card){return card.category==='custom'});
        if(!ca.length){
          var defaultComments=['不错哦','👍','哈哈','有意思','😊','支持'];
          addComment(postId,member.id,defaultComments[Math.floor(Math.random()*defaultComments.length)]);
          return;
        }
        var rc=ca[Math.floor(Math.random()*ca.length)];
        addComment(postId,member.id,rc.content);
      }
    },commentDelay);
  });
}
function postMoments(content){
  momentsPosts.unshift({id:'m_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),authorId:'self',content:content,images:[],timestamp:Date.now(),likes:[],comments:[]});
  saveMomentsData();renderMoments();toast('发布成功');
  setTimeout(function(){triggerMomentsInteractions(momentsPosts[0].id)},1000);
}
function deleteMoment(mid){
  if(!confirm('确定删除这条动态？'))return;
  momentsPosts=momentsPosts.filter(function(p){return p.id!==mid});
  saveMomentsData();renderMoments();toast('已删除');
}
var editingMomentId=null;
function editMoment(mid){
  var post=momentsPosts.find(function(p){return p.id===mid});
  if(!post)return;
  editingMomentId=mid;
  $('moments-input').value=post.content;
  momentsImages=post.images?post.images.slice():[];
  renderMomentsImagesPreview();
  var titleEl=document.querySelector('#ov-moments-publish .modal-title');
  if(titleEl)titleEl.textContent='编辑朋友圈';
  var publishBtn=document.querySelector('#ov-moments-publish .btn-primary');
  if(publishBtn)publishBtn.textContent='保存';
  showOv('ov-moments-publish');
}
var mab=$('moments-add-btn');if(mab)mab.addEventListener('click',function(){showOv('ov-moments-publish')});

var momentsImages=[];
if($('moments-image-input'))$('moments-image-input').addEventListener('change',function(e){
  var files=e.target.files;
  if(!files)return;
  for(var i=0;i<files.length;i++){
    var reader=new FileReader();
    reader.onload=function(e){
      momentsImages.push(e.target.result);
      renderMomentsImagesPreview();
    };
    reader.readAsDataURL(files[i]);
  }
  // 清空 input.value，确保下次选择相同文件也能触发 change 事件
  this.value='';
});
function renderMomentsImagesPreview(){
  var el=$('moments-images-preview');
  var imgsHtml=momentsImages.map(function(img,idx){
    return'<div style="width:80px;height:80px;border-radius:8px;overflow:hidden;position:relative;"><img src="'+img+'" style="display:block;width:100%;height:100%;object-fit:cover;"><button style="position:absolute;top:2px;right:2px;width:20px;height:20px;border:none;border-radius:50%;background:rgba(0,0,0,.5);color:#fff;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;" onclick="removeMomentsImage('+idx+')">✕</button></div>';
  }).join('');
  // 保留"+"添加按钮（最多9张图片）
  var addBtn='<label class="moments-publish-add-btn" for="moments-image-input" style="cursor:pointer;margin:0;">+</label>';
  if(momentsImages.length>=9)addBtn='';
  el.innerHTML=imgsHtml+addBtn;
}
function removeMomentsImage(idx){
  momentsImages.splice(idx,1);
  renderMomentsImagesPreview();
}
function openMomentsImagePreview(postId,imgIdx){
  var post=momentsPosts.find(function(p){return p.id===postId});
  if(!post||!post.images||!post.images[imgIdx])return;
  
  var preview=document.createElement('div');
  preview.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;transition:opacity 0.3s;';
  
  var img=document.createElement('img');
  img.src=post.images[imgIdx];
  img.style.cssText='max-width:95%;max-height:95%;object-fit:contain;border-radius:8px;transition:transform 0.3s;';
  
  var closeBtn=document.createElement('button');
  closeBtn.innerHTML='✕';
  closeBtn.style.cssText='position:absolute;top:20px;right:20px;width:40px;height:40px;border:none;border-radius:50%;background:rgba(255,255,255,0.2);color:white;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.2s;';
  closeBtn.onclick=function(){preview.remove()};
  
  preview.onclick=function(e){
    if(e.target===preview)preview.remove();
  };
  
  preview.appendChild(img);
  preview.appendChild(closeBtn);
  document.body.appendChild(preview);
}
function publishMomentsPost(){
  var input=$('moments-input');
  var content=input.value.trim();
  if(!content&&momentsImages.length===0){
    toast('请输入内容或选择图片');
    return;
  }
  if(editingMomentId){
    var post=momentsPosts.find(function(p){return p.id===editingMomentId});
    if(post){
      post.content=content;
      post.images=momentsImages.slice();
      post.timestamp=Date.now();
    }
    editingMomentId=null;
    saveMomentsData();
    renderMoments();
    input.value='';
    momentsImages=[];
    renderMomentsImagesPreview();
    hideOv('ov-moments-publish');
    toast('已保存');
    var titleEl=document.querySelector('#ov-moments-publish .modal-title');
    if(titleEl)titleEl.textContent='发布朋友圈';
    var publishBtn=document.querySelector('#ov-moments-publish .btn-primary');
    if(publishBtn)publishBtn.textContent='发布';
    return;
  }
  momentsPosts.unshift({
    id:'m_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
    authorId:'self',
    content:content,
    images:momentsImages.slice(),
    timestamp:Date.now(),
    likes:[],
    comments:[],
    location:momentsLocationData,
    remindIds:momentsRemindIds.slice(),
    visibility:momentsVisibility,
    visSelectedIds:momentsVisSelectedIds.slice()
  });
  saveMomentsData();
  renderMoments();
  input.value='';
  momentsImages=[];
  renderMomentsImagesPreview();
  hideOv('ov-moments-publish');
  toast('发布成功');
  setTimeout(function(){triggerMomentsInteractions(momentsPosts[0].id)},1000);
}

function changeMomentsAvatar(event){
  if(event)event.stopPropagation();
  var input=$('moments-avatar-input');
  if(input)input.click();
}

function changeMomentsCover(event){
  if(event)event.stopPropagation();
  var input=$('moments-cover-input');
  if(input)input.click();
}
// 移动端touchend兼容 - 只在点击封面空白区域时触发
var momentsCoverEl=$('moments-cover');
if(momentsCoverEl){
  momentsCoverEl.addEventListener('touchend',function(e){
    var target=e.target;
    // 如果点击的是按钮、头像或其他交互元素，不触发封面更换
    if(!target)return;
    // 检查是否点击在按钮上
    if(target.tagName==='BUTTON'||target.closest('button'))return;
    // 检查是否点击在头像上
    if(target.id==='moments-cover-av'||target.closest('#moments-cover-av'))return;
    // 检查是否点击在SVG图标上
    if(target.tagName==='SVG'||target.tagName==='PATH'||target.closest('svg'))return;
    // 检查是否点击在返回按钮或信息区
    if(target.id==='moments-cover-name'||target.closest('.moments-cover-info'))return;
    if(target.closest('.btn-nav'))return;
    // 只有点击真正的封面空白才触发
    e.preventDefault();
    e.stopPropagation();
    var input=$('moments-cover-input');
    if(input)input.click();
  });
}

function handleCoverInput(file,isAvatar){
  if(!file)return;
  var reader=new FileReader();
  reader.onload=function(e){
    var dataUrl=e.target.result;
    var targetContactId=currentMomentsContactId||'me';
    if(targetContactId!=='me'){
      var targetContact=contacts.find(function(c){return c.id===targetContactId});
      if(targetContact){
        if(isAvatar){
          targetContact.avatar=dataUrl;
          var avEl=$('moments-cover-av');
          if(avEl){avEl.innerHTML='<img src="'+dataUrl+'" style="width:100%;height:100%;object-fit:cover;">';}
          toast('头像已更新');
        }else{
          targetContact.momentsCover=dataUrl;
          var coverEl=$('moments-cover');
          if(coverEl){coverEl.style.backgroundImage='url('+dataUrl+')';coverEl.style.backgroundSize='cover';coverEl.style.backgroundPosition='center';}
          toast('封面已更新');
        }
        saveC();
        return;
      }
    }
    if(isAvatar){
      me.avatar=dataUrl;
      saveP();
      if(window.localforage){
        try{window.localforage.setItem(LP+'_avatar',dataUrl);}catch(e){}
      }
      try{localStorage.setItem(LP+'_avatar',dataUrl);}catch(e){}
      var avEl=$('moments-cover-av');
      if(avEl){
        avEl.innerHTML='<img src="'+dataUrl+'" style="width:100%;height:100%;object-fit:cover;">';
      }
      toast('头像已更新');
    }else{
      me.momentsCover=dataUrl;
      saveP();
      if(window.localforage){
        try{window.localforage.setItem(LP+'_cover',dataUrl);}catch(e){}
      }
      try{localStorage.setItem(LP+'_cover',dataUrl);}catch(e){}
      var coverEl=$('moments-cover');
      if(coverEl){
        coverEl.style.backgroundImage='url('+dataUrl+')';
        coverEl.style.backgroundSize='cover';
        coverEl.style.backgroundPosition='center';
      }
      toast('封面已更新');
    }
  };
  reader.readAsDataURL(file);
}

var momentsNotifications=[];
var momentsCommentsExpanded=true;

function loadMomentsNotifications(){
  var saved=ls('ml2_moments_notifications');
  if(saved&&Array.isArray(saved)){
    momentsNotifications=saved;
    updateMomentsNotificationsBadge();
  }else if(window.localforage){
    window.localforage.getItem('ml2_moments_notifications').then(function(dbVal){
      if(dbVal&&Array.isArray(dbVal)){
        momentsNotifications=dbVal;
        updateMomentsNotificationsBadge();
      }
    }).catch(function(){});
  }
}

function saveMomentsNotifications(){
  ls('ml2_moments_notifications',momentsNotifications);
  if(window.localforage){
    window.localforage.setItem('ml2_moments_notifications',momentsNotifications).catch(function(){});
  }
  updateMomentsNotificationsBadge();
}

function addMomentsNotification(type,postId,authorId,content){
  var member=getMomentsMember(authorId);
  var post=momentsPosts.find(function(p){return p.id===postId});
  var timeStr=formatMomentsTime(Date.now());
  var notification={
    id:'n_'+Date.now(),
    type:type,
    postId:postId,
    authorId:authorId,
    content:content,
    timestamp:Date.now(),
    read:false,
    authorName:member.nickname,
    authorAvatar:member.avatar,
    postContent:post?post.content.substring(0,30)+(post.content.length>30?'...':''):''
  };
  momentsNotifications.unshift(notification);
  saveMomentsNotifications();
}

function updateMomentsNotificationsBadge(){
  var badge=$('moments-notifications-badge');
  var unread=momentsNotifications.filter(function(n){return !n.read}).length;
  if(badge){
    if(unread>0){
      badge.style.display='flex';
      badge.textContent=unread;
    }else{
      badge.style.display='none';
    }
  }
}

function showMomentsNotifications(){
  var list=$('moments-notifications-list');
  if(!list)return;
  
  // 重新加载通知，确保显示最新数据
  loadMomentsNotifications();
  
  momentsNotifications.forEach(function(n){n.read=true});
  saveMomentsNotifications();
  
  if(momentsNotifications.length===0){
    list.innerHTML='<div style="text-align:center;padding:40px;color:var(--txt3);"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--txt3)" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg><div style="margin-top:12px;">暂无动态提醒</div></div>';
  }else{
    list.innerHTML=momentsNotifications.map(function(n){
      var typeIcon=n.type==='like'?'❤️':n.type==='comment'?'💬':'🔔';
      var typeText=n.type==='like'?'赞了你的动态':n.type==='comment'?'评论了你的动态':'发布了新动态';
      var displayContent=n.type==='comment'&&n.content?(n.content.startsWith('data:image')?'[图片]':n.content):n.postContent;
      return'<div style="display:flex;gap:10px;padding:12px;background:var(--c2);border-radius:12px;cursor:pointer;transition:background 0.2s;" onclick="jumpToMomentsPost(\''+n.postId+'\')"><div style="width:36px;height:36px;border-radius:50%;background:var(--c3);display:flex;align-items:center;justify-content:center;flex-shrink:0;">'+(n.authorAvatar?'<img src="'+n.authorAvatar+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">':'✦')+'</div><div style="flex:1;"><div style="font-size:13px;color:var(--txt);"><span style="color:var(--accent);font-weight:500;">'+n.authorName+'</span> '+typeText+'</div><div style="font-size:12px;color:var(--txt3);margin-top:2px;">'+displayContent+'</div><div style="font-size:11px;color:var(--txt3);margin-top:4px;">'+formatMomentsTime(n.timestamp)+'</div></div><div style="font-size:18px;">'+typeIcon+'</div></div>';
    }).join('');
  }
  
  showOv('ov-moments-notifications');
}

function jumpToMomentsPost(postId){
  hideOv('ov-moments-notifications');
  renderMoments();
  setTimeout(function(){
    var postEl=document.querySelector('.moment[data-mid="'+postId+'"]');
    if(postEl){
      postEl.scrollIntoView({behavior:'smooth',block:'center'});
      postEl.style.background='rgba(0,0,0,0.05)';
      setTimeout(function(){postEl.style.background='transparent'},2000);
    }
  },100);
}

function toggleAllMomentsComments(){
  momentsCommentsExpanded=!momentsCommentsExpanded;
  renderMoments();
  var btn=$('moments-toggle-comments-btn');
  if(btn){
    var icon=momentsCommentsExpanded?'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>':'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
    btn.innerHTML=icon;
  }
}

function updateMomentsSetting(key,value){
  momentsSettings[key]=parseInt(value);
}

function saveMomentsSettings(){
  var s=ls('ml2_moments_settings');
  if(!s||typeof s!=='object')s={};
  if(!s.contacts)s.contacts={};
  var contactSelect=$('moments-contact-select');
  var contactId=contactSelect?contactSelect.value:null;
  
  var vals={};
  vals.likeProbability=parseInt($('moments-like-prob-val').value);
  vals.likeSpeedMin=parseInt($('moments-like-speed-min-val').value);
  vals.likeSpeedMax=parseInt($('moments-like-speed-max-val').value);
  vals.commentProbability=parseInt($('moments-comment-prob-val').value);
  vals.commentSpeedMin=parseInt($('moments-comment-speed-min-val').value);
  vals.commentSpeedMax=parseInt($('moments-comment-speed-max-val').value);
  vals.replyProbability=parseInt($('moments-reply-prob-val').value);
  vals.replySpeedMin=parseInt($('moments-reply-speed-min-val').value);
  vals.replySpeedMax=parseInt($('moments-reply-speed-max-val').value);
  vals.cardProbability=parseInt($('moments-card-prob-val').value);
  vals.maxCardsPerComment=parseInt($('moments-max-cards-val').value);
  vals.imageProbability=parseInt($('moments-image-prob-val').value);
  vals.friendPostProbability=parseInt($('moments-friend-post-prob-val').value);
  vals.friendPostDailyMax=parseInt($('moments-friend-post-daily-max-val').value)||5;
  vals.friendPostCooldownMin=parseInt($('moments-friend-post-cooldown-val').value)||30;
  vals.friendPostIntervalMin=parseInt($('moments-min-interval-val').value);
  vals.friendPostIntervalMax=parseInt($('moments-max-interval-val').value);
  vals.friendLikeFriendProbability=parseInt($('moments-friend-like-friend-prob-val').value);
  vals.friendCommentFriendProbability=parseInt($('moments-friend-comment-friend-prob-val').value);
  vals.minCardsPerPost=parseInt($('moments-min-cards-post-val').value)||1;
  vals.maxCardsPerPost=parseInt($('moments-max-cards-post-val').value)||10;
  vals.friendPostKaomojiProb=parseInt($('moments-friend-post-kaomoji-prob-val').value);
  vals.friendPostEmojiProb=parseInt($('moments-friend-post-emoji-prob-val').value);
  vals.friendPostStickerProb=parseInt($('moments-friend-post-sticker-prob-val').value);
  vals.friendPostImageProb=parseInt($('moments-friend-post-image-prob-val').value);
  vals.friendCommentKaomojiProb=parseInt($('moments-friend-comment-kaomoji-prob-val').value);
  vals.friendCommentEmojiProb=parseInt($('moments-friend-comment-emoji-prob-val').value);
  vals.friendCommentStickerProb=parseInt($('moments-friend-comment-sticker-prob-val').value);

  if(contactId){
    s.contacts[contactId]=vals;
  }else{
    Object.assign(s,vals);
  }

  Object.assign(momentsSettings,vals);
  ls('ml2_moments_settings',s);
  if(window.localforage){
    window.localforage.setItem('ml2_moments_settings',s).catch(function(){});
  }
}

function showMomentsSettings(){
  var select=$('moments-contact-select');
  if(select){
    var contacts=ls('ml2_c')||[];
    var html='<option value="">全部联系人（默认）</option>';
    contacts.forEach(function(c){
      if(c.id==='fh')return;
      html+='<option value="'+c.id+'">'+(c.name||c.id)+'</option>';
    });
    select.innerHTML=html;
    select.onchange=function(){syncMomentsUI();};
  }
  
  syncMomentsUI();
  showOv('ov-moments-settings');
}

function syncMomentsUI(){
  var s=ls('ml2_moments_settings')||{};
  var contactSelect=$('moments-contact-select');
  var contactId=contactSelect?contactSelect.value:null;
  var settings=Object.assign({},momentsSettings);
  
  // 合并全局保存的设置（未选中联系人时）
  if(!contactId){
    Object.keys(momentsSettings).forEach(function(key){
      if(key!=='contacts'&&s[key]!==undefined){
        settings[key]=s[key];
      }
    });
  }
  
  if(contactId&&s.contacts&&s.contacts[contactId]){
    Object.assign(settings,s.contacts[contactId]);
  }
  
  $('moments-like-prob-val').value=settings.likeProbability;
  $('moments-like-speed-min-val').value=settings.likeSpeedMin;
  $('moments-like-speed-max-val').value=settings.likeSpeedMax;
  
  $('moments-comment-prob-val').value=settings.commentProbability;
  $('moments-comment-speed-min-val').value=settings.commentSpeedMin;
  $('moments-comment-speed-max-val').value=settings.commentSpeedMax;
  
  $('moments-reply-prob-val').value=settings.replyProbability;
  $('moments-reply-speed-min-val').value=settings.replySpeedMin;
  $('moments-reply-speed-max-val').value=settings.replySpeedMax;
  
  $('moments-card-prob-val').value=settings.cardProbability;
  $('moments-max-cards-val').value=settings.maxCardsPerComment;
  $('moments-image-prob-val').value=settings.imageProbability;
  
  $('moments-friend-post-prob-val').value=settings.friendPostProbability;
  $('moments-friend-post-daily-max-val').value=settings.friendPostDailyMax||5;
  $('moments-friend-post-cooldown-val').value=settings.friendPostCooldownMin||30;
  $('moments-min-interval-val').value=settings.friendPostIntervalMin;
  $('moments-max-interval-val').value=settings.friendPostIntervalMax;
  
  $('moments-friend-like-friend-prob-val').value=settings.friendLikeFriendProbability;
  $('moments-friend-comment-friend-prob-val').value=settings.friendCommentFriendProbability;
  
  $('moments-min-cards-post-val').value=settings.minCardsPerPost;
  $('moments-max-cards-post-val').value=settings.maxCardsPerPost;
  
  $('moments-friend-post-kaomoji-prob-val').value=settings.friendPostKaomojiProb||10;
  $('moments-friend-post-emoji-prob-val').value=settings.friendPostEmojiProb||10;
  $('moments-friend-post-sticker-prob-val').value=settings.friendPostStickerProb||30;
  $('moments-friend-post-image-prob-val').value=settings.friendPostImageProb||30;
  $('moments-friend-comment-kaomoji-prob-val').value=settings.friendCommentKaomojiProb||5;
  $('moments-friend-comment-emoji-prob-val').value=settings.friendCommentEmojiProb||5;
  $('moments-friend-comment-sticker-prob-val').value=settings.friendCommentStickerProb||5;
}

function applyMomentsToAllContacts(){
  var contactSelect=$('moments-contact-select');
  var contactId=contactSelect?contactSelect.value:null;
  if(!confirm('确定将当前设置应用到所有联系人吗？'))return;
  var s=ls('ml2_moments_settings');
  if(!s||typeof s!=='object')s={};
  if(!s.contacts)s.contacts={};
  var vals={};
  vals.likeProbability=parseInt($('moments-like-prob-val').value);
  vals.likeSpeedMin=parseInt($('moments-like-speed-min-val').value);
  vals.likeSpeedMax=parseInt($('moments-like-speed-max-val').value);
  vals.commentProbability=parseInt($('moments-comment-prob-val').value);
  vals.commentSpeedMin=parseInt($('moments-comment-speed-min-val').value);
  vals.commentSpeedMax=parseInt($('moments-comment-speed-max-val').value);
  vals.replyProbability=parseInt($('moments-reply-prob-val').value);
  vals.replySpeedMin=parseInt($('moments-reply-speed-min-val').value);
  vals.replySpeedMax=parseInt($('moments-reply-speed-max-val').value);
  vals.cardProbability=parseInt($('moments-card-prob-val').value);
  vals.maxCardsPerComment=parseInt($('moments-max-cards-val').value);
  vals.imageProbability=parseInt($('moments-image-prob-val').value);
  vals.friendPostProbability=parseInt($('moments-friend-post-prob-val').value);
  vals.friendPostDailyMax=parseInt($('moments-friend-post-daily-max-val').value)||5;
  vals.friendPostCooldownMin=parseInt($('moments-friend-post-cooldown-val').value)||30;
  vals.friendPostIntervalMin=parseInt($('moments-min-interval-val').value);
  vals.friendPostIntervalMax=parseInt($('moments-max-interval-val').value);
  vals.friendLikeFriendProbability=parseInt($('moments-friend-like-friend-prob-val').value);
  vals.friendCommentFriendProbability=parseInt($('moments-friend-comment-friend-prob-val').value);
  vals.minCardsPerPost=parseInt($('moments-min-cards-post-val').value)||1;
  vals.maxCardsPerPost=parseInt($('moments-max-cards-post-val').value)||10;
  vals.friendPostKaomojiProb=parseInt($('moments-friend-post-kaomoji-prob-val').value);
  vals.friendPostEmojiProb=parseInt($('moments-friend-post-emoji-prob-val').value);
  vals.friendPostStickerProb=parseInt($('moments-friend-post-sticker-prob-val').value);
  vals.friendPostImageProb=parseInt($('moments-friend-post-image-prob-val').value);
  vals.friendCommentKaomojiProb=parseInt($('moments-friend-comment-kaimoji-prob-val').value);
  vals.friendCommentEmojiProb=parseInt($('moments-friend-comment-emoji-prob-val').value);
  vals.friendCommentStickerProb=parseInt($('moments-friend-comment-sticker-prob-val').value);
  var contacts=ls('ml2_c')||[];
  contacts.forEach(function(c){
    if(c.id==='fh'||c.id===contactId)return;
    s.contacts[c.id]=JSON.parse(JSON.stringify(vals));
  });
  Object.assign(momentsSettings,vals);
  ls('ml2_moments_settings',s);
  saveMomentsData();
  toast('已应用到所有联系人');
}

function showMomentsFriendsList(){
  var list=$('moments-friends-list');
  if(!list)return;
  
  var myPosts=momentsPosts.filter(function(p){return p.authorId==='me'||p.authorId==='self'});
  var myAvatar=me.avatar||'';
  var myNickname=me.name||'我';
  
  var html='<div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--c2);border-radius:12px;cursor:pointer;transition:background 0.2s;" onclick="showMemberMoments(\'me\')"><div style="width:40px;height:40px;border-radius:8px;background:var(--c3);display:flex;align-items:center;justify-content:center;overflow:hidden;">'+(myAvatar?'<img src="'+myAvatar+'" style="display:block;width:100%;height:100%;object-fit:cover;">':'✦')+'</div><div style="flex:1;"><div style="font-size:14px;color:var(--txt);font-weight:500;">'+myNickname+'</div><div style="font-size:12px;color:var(--txt3);">'+myPosts.length+' 条动态 · 我</div></div><div style="display:flex;align-items:center;gap:4px;"><button style="width:32px;height:32px;border:none;border-radius:50%;background:none;color:var(--txt3);cursor:pointer;display:flex;align-items:center;justify-content:center;" onclick="event.stopPropagation();editMomentsMember(\'me\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7.5"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--txt3)" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></div></div>';
  
  html+=momentsMembers.map(function(m){
    var memberPosts=momentsPosts.filter(function(p){return p.authorId===m.id});
    var boundContact=m.contactId?contacts.find(function(c){return c.id===m.contactId}):null;
    return'<div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--c2);border-radius:12px;cursor:pointer;transition:background 0.2s;" onclick="showMemberMoments(\''+m.id+'\')"><div style="width:40px;height:40px;border-radius:8px;background:var(--c3);display:flex;align-items:center;justify-content:center;overflow:hidden;">'+(m.avatar?'<img src="'+m.avatar+'" style="display:block;width:100%;height:100%;object-fit:cover;">':'✦')+'</div><div style="flex:1;"><div style="font-size:14px;color:var(--txt);font-weight:500;">'+m.nickname+'</div><div style="font-size:12px;color:var(--txt3);">'+memberPosts.length+' 条动态'+(boundContact?' · 已绑定':'')+'</div></div><div style="display:flex;align-items:center;gap:4px;"><button style="width:32px;height:32px;border:none;border-radius:50%;background:none;color:var(--txt3);cursor:pointer;display:flex;align-items:center;justify-content:center;" onclick="event.stopPropagation();editMomentsMember(\''+m.id+'\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7.5"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--txt3)" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></div></div>';
  }).join('');
  
  list.innerHTML=html;
  
  showOv('ov-moments-friends');
}

var editingMemberId=null;
var editingMemberAvatar=null;

function editMomentsMember(memberId){
  editingMemberId=memberId;
  editingMemberAvatar=null;
  
  var isMe=memberId==='me';
  var member;
  
  if(isMe){
    member={id:'me',nickname:me.name||'我',avatar:me.avatar||'',contactId:null};
  }else{
    member=momentsMembers.find(function(m){return m.id===memberId});
    if(!member)return;
  }
  
  $('moments-member-nickname-input').value=member.nickname||'';
  editingMemberAvatar=member.avatar||'';
  
  var avatarPreview=$('moments-member-avatar-preview');
  if(member.avatar){
    avatarPreview.innerHTML='<img src="'+member.avatar+'" style="display:block;width:100%;height:100%;object-fit:cover;">';
  }else{
    avatarPreview.innerHTML='✦';
  }
  
  var select=$('moments-member-contact-select');
  select.innerHTML='<option value="">不绑定</option>';
  if(!isMe){
    contacts.forEach(function(c){
      if(c.id==='fh')return;
      var selected=c.id===member.contactId?'selected':'';
      select.innerHTML+='<option value="'+c.id+'" '+selected+'>'+c.name+'</option>';
    });
  }
  $('moments-member-contact-section').style.display=isMe?'none':'block';
  
  $('moments-edit-member-title').textContent=isMe?'编辑我':'编辑好友';
  
  showOv('ov-moments-edit-member');
}

function saveMomentsMemberEdit(){
  if(!editingMemberId)return;
  
  if(editingMemberId==='me'){
    me.name=$('moments-member-nickname-input').value.trim()||me.name||'我';
    if(editingMemberAvatar)me.avatar=editingMemberAvatar;
    saveP();
  }else{
    var member=momentsMembers.find(function(m){return m.id===editingMemberId});
    if(!member)return;
    
    member.nickname=$('moments-member-nickname-input').value.trim()||member.nickname;
    if(editingMemberAvatar)member.avatar=editingMemberAvatar;
    member.contactId=$('moments-member-contact-select').value||null;
    
    saveMomentsData();
  }
  
  showMomentsFriendsList();
  hideOv('ov-moments-edit-member');
  toast('保存成功');
}

function viewMemberMomentsFromEdit(){
  if(!editingMemberId)return;
  hideOv('ov-moments-edit-member');
  hideOv('ov-moments-friends');
  showMemberMoments(editingMemberId);
}

if($('moments-member-avatar-input'))$('moments-member-avatar-input').addEventListener('change',function(e){
  var f=e.target.files[0];
  if(!f)return;
  compressImage(f,100,0.7,function(res){
    editingMemberAvatar=res;
    $('moments-member-avatar-preview').innerHTML='<img src="'+res+'" style="display:block;width:100%;height:100%;object-fit:cover;">';
  });
  e.target.value='';
});

function showMemberMoments(memberId){
  var isMe=memberId==='me'||memberId==='self';
  if(isMe){
    currentMomentsContactId='me';
    renderMoments();
    return;
  }
  switchToContactMoments(memberId);
}

function toggleMomentsMember(memberId){
  var member=momentsMembers.find(function(m){return m.id===memberId});
  if(member){
    member.enabled=!member.enabled;
    saveMomentsData();
    showMomentsFriendsList();
  }
}

function triggerFriendMomentsInteractions(){
  var enabledMembers=momentsMembers.filter(function(m){return m.enabled});
  enabledMembers.forEach(function(member){
    momentsPosts.forEach(function(post){
      if(post.authorId===member.id)return;
      if(Math.random()<momentsSettings.friendLikeFriendProbability/100){
        if(post.likes.indexOf(member.id)===-1){
          post.likes.push(member.id);
          if(post.authorId==='self'){
            addMomentsNotification('like',post.id,member.id,'');
          }
        }
      }
      if(Math.random()<momentsSettings.friendCommentFriendProbability/100){
        setTimeout(function(){
          var cardId=member.contactId||member.id;
          var allCards=getContactCards(cardId);
          var s=momentsSettings;
          // 独立概率抽取各类字卡
          var textCards=allCards.filter(function(c){return c.category==='custom'});
          var kaomojiCards=allCards.filter(function(c){return c.category==='kaomoji'});
          var emojiCards=allCards.filter(function(c){return c.category==='emojis'});
          var stickerCards=allCards.filter(function(c){return c.category==='stickers'});
          var parts=[];
          var commentImage='';
          // 主字卡（始终抽取一条）
          if(textCards.length>0){
            var tc=textCards[Math.floor(Math.random()*textCards.length)];
            parts.push(tc.content);
          }
          // 颜文字
          if(kaomojiCards.length>0&&Math.random()*100<(s.friendCommentKaomojiProb||5)){
            var kc=kaomojiCards[Math.floor(Math.random()*kaomojiCards.length)];
            parts.push(kc.content);
          }
          // emoji
          if(emojiCards.length>0&&Math.random()*100<(s.friendCommentEmojiProb||5)){
            var ec=emojiCards[Math.floor(Math.random()*emojiCards.length)];
            parts.push(ec.content);
          }
          // 图片表情
          if(stickerCards.length>0&&Math.random()*100<(s.friendCommentStickerProb||5)){
            var sc=stickerCards[Math.floor(Math.random()*stickerCards.length)];
            commentImage=sc.content||'';
          }
          if(parts.length===0&&!commentImage)return;
          addComment(post.id,member.id,parts.join(' '),commentImage);
        },getRandomDelay(momentsSettings.friendCommentFriendSpeedMin,momentsSettings.friendCommentFriendSpeedMax));
      }
    });
  });
  saveMomentsData();
  renderMoments();
}

if($('moments-friends-btn'))$('moments-friends-btn').addEventListener('click',function(){showMomentsFriendsList()});
if($('moments-notifications-btn'))$('moments-notifications-btn').addEventListener('click',function(){showMomentsNotifications()});
if($('moments-toggle-comments-btn'))$('moments-toggle-comments-btn').addEventListener('click',function(){toggleAllMomentsComments()});

['ov-moments-settings','ov-moments-friends','ov-moments-notifications','ov-moments-edit-member'].forEach(function(id){
  var el=$(id);
  if(el){
    el.addEventListener('click',function(e){
      if(e.target===this)hideOv(id);
    });
  }
});

var currentMomentsContactId='me';

function backFromMoments(){
  if(currentMomentsContactId!=='me'){
    currentMomentsContactId='me';
    renderMoments();
  }else{
    showPg('pg-list');
  }
}

function openMomentsPublish(){
  hideOv('ov-moments-friends');
  hideOv('ov-moments-notifications');
  hideOv('ov-moments-settings');
  showOv('ov-moments-publish');
  momentsLocationData='';
  momentsRemindIds=[];
  momentsVisibility='public';
  momentsVisSelectedIds=[];
  updateMomentsPublishUI();
}

var momentsLocationData='';
var momentsRemindIds=[];
var momentsVisibility='public';
var momentsVisSelectedIds=[];

function updateMomentsPublishUI(){
  var locDisplay=$('moments-location-display');
  if(locDisplay){locDisplay.textContent=momentsLocationData||'';}
  var remindDisplay=$('moments-remind-display');
  if(remindDisplay){remindDisplay.textContent=momentsRemindIds.length>0?'已选'+momentsRemindIds.length+'人 >':'>';}
  var visDisplay=$('moments-visibility-display');
  if(visDisplay){
    if(momentsVisibility==='public'){visDisplay.textContent='公开 >';}
    else{
      var cnt=momentsVisSelectedIds.length;
      visDisplay.textContent=cnt>0?'指定 '+cnt+' 人 >':'指定联系人 >';
    }
  }
}

function openMomentsLocation(){
  var input=$('moments-location-input');
  if(input)input.value=momentsLocationData;
  showOv('ov-moments-location');
}
function saveMomentsLocation(){
  var input=$('moments-location-input');
  momentsLocationData=input?input.value.trim():'';
  hideOv('ov-moments-location');
  updateMomentsPublishUI();
}

function openMomentsRemind(){
  var list=$('moments-remind-list');
  if(!list)return;
  var html='';
  contacts.filter(function(c){return c.id!=='me'}).forEach(function(c){
    var checked=momentsRemindIds.indexOf(c.id)>=0;
    html+='<div class="moments-remind-item" data-cid="'+c.id+'" style="display:flex;align-items:center;padding:12px;border-bottom:1px solid var(--border-light);cursor:pointer;" onclick="toggleMomentsRemind(\''+c.id+'\')">';
    html+='<div style="width:36px;height:36px;border-radius:50%;background:var(--c3);display:flex;align-items:center;justify-content:center;margin-right:12px;overflow:hidden;">';
    if(c.avatar){html+='<img src="'+c.avatar+'" style="width:100%;height:100%;object-fit:cover;">';}
    else{html+='<span style="font-size:16px;color:var(--txt2);">'+(c.name?' '+c.name[0]:'?')+'</span>';}
    html+='</div>';
    html+='<div style="flex:1;font-size:15px;color:var(--txt);">'+(c.name||'未知')+'</div>';
    html+='<div style="width:22px;height:22px;border-radius:50%;border:2px solid '+(checked?'var(--accent)':'var(--border)')+';display:flex;align-items:center;justify-content:center;">'+(checked?'<span style="color:#fff;font-size:12px;">✓</span>':'')+'</div>';
    html+='</div>';
  });
  list.innerHTML=html;
  showOv('ov-moments-remind');
}
function toggleMomentsRemind(cid){
  var idx=momentsRemindIds.indexOf(cid);
  if(idx>=0){momentsRemindIds.splice(idx,1);}
  else{momentsRemindIds.push(cid);}
  openMomentsRemind();
}
function saveMomentsRemind(){
  hideOv('ov-moments-remind');
  updateMomentsPublishUI();
}

function setMomentsVisibility(type){
  momentsVisibility=type;
  updateMomentsVisibilityUI();
}
function updateMomentsVisibilityUI(){
  var pub=$('vis-check-public');
  var sel=$('vis-check-selected');
  var pubOpt=$('moments-vis-public');
  var selOpt=$('moments-vis-selected');
  if(pub){pub.innerHTML=momentsVisibility==='public'?'<span style="color:#fff;font-size:12px;">✓</span>':'';pub.style.background=momentsVisibility==='public'?'var(--accent)':'transparent';}
  if(sel){sel.innerHTML=momentsVisibility==='selected'?'<span style="color:#fff;font-size:12px;">✓</span>':'';sel.style.background=momentsVisibility==='selected'?'var(--accent)':'transparent';}
  if(pubOpt){pubOpt.style.borderColor=momentsVisibility==='public'?'var(--accent)':'var(--border)';}
  if(selOpt){selOpt.style.borderColor=momentsVisibility==='selected'?'var(--accent)':'var(--border)';}
  var contactList=$('moments-vis-contact-list');
  if(contactList){
    if(momentsVisibility==='selected'){
      contactList.style.display='block';
      var html='';
      contacts.filter(function(c){return c.id!=='me'}).forEach(function(c){
        var checked=momentsVisSelectedIds.indexOf(c.id)>=0;
        html+='<div class="moments-vis-contact-item" data-cid="'+c.id+'" style="display:flex;align-items:center;padding:10px 12px;border-bottom:1px solid var(--border-light);cursor:pointer;" onclick="toggleMomentsVisContact(\''+c.id+'\')">';
        html+='<div style="width:32px;height:32px;border-radius:50%;background:var(--c3);display:flex;align-items:center;justify-content:center;margin-right:10px;overflow:hidden;">';
        if(c.avatar){html+='<img src="'+c.avatar+'" style="width:100%;height:100%;object-fit:cover;">';}
        else{html+='<span style="font-size:14px;color:var(--txt2);">'+(c.name?' '+c.name[0]:'?')+'</span>';}
        html+='</div>';
        html+='<div style="flex:1;font-size:14px;color:var(--txt);">'+(c.name||'未知')+'</div>';
        html+='<div style="width:20px;height:20px;border-radius:50%;border:2px solid '+(checked?'var(--accent)':'var(--border)')+';display:flex;align-items:center;justify-content:center;">'+(checked?'<span style="color:#fff;font-size:10px;">✓</span>':'')+'</div>';
        html+='</div>';
      });
      contactList.innerHTML=html;
    }else{
      contactList.style.display='none';
    }
  }
}
function toggleMomentsVisContact(cid){
  var idx=momentsVisSelectedIds.indexOf(cid);
  if(idx>=0){momentsVisSelectedIds.splice(idx,1);}
  else{momentsVisSelectedIds.push(cid);}
  updateMomentsVisibilityUI();
}
function openMomentsVisibility(){
  updateMomentsVisibilityUI();
  showOv('ov-moments-visibility');
}
function saveMomentsVisibility(){
  hideOv('ov-moments-visibility');
  updateMomentsPublishUI();
}

function switchToContactMoments(contactId){
  var contact=contacts.find(function(c){return c.id===contactId;});
  if(!contact){toast('联系人不存在');return;}
  currentMomentsContactId=contactId;
  var mt=$('moments-title');
  var mb=$('moments-back-btn');
  if(mt)mt.textContent=contact.name||contactId;
  if(mb)mb.style.display='flex';
  var coverNameEl=$('moments-cover-name');
  if(coverNameEl)coverNameEl.textContent=contact.name||contactId;
  var avEl=$('moments-cover-av');
  if(avEl){
    if(contact.avatar){
      avEl.innerHTML='<img src="'+contact.avatar+'" style="width:100%;height:100%;object-fit:cover;">';
    }else{
      avEl.innerHTML=(contact.name||contactId).charAt(0);
    }
  }
  var coverEl=$('moments-cover');
  if(coverEl){
    if(contact.momentsCover){
      coverEl.style.backgroundImage='url('+contact.momentsCover+')';
      coverEl.style.backgroundSize='cover';
      coverEl.style.backgroundPosition='center';
    }else{
      coverEl.style.backgroundImage='linear-gradient(170deg,'+(contact.color||'#3A3A4A')+' 0%,#5A5A6A 40%,#7A7A8A 100%)';
    }
  }
  var postsEl=$('moments-posts');
  if(!postsEl){
    var scrollEl=$('moments-scroll');
    if(!scrollEl)return;
    postsEl=document.createElement('div');
    postsEl.id='moments-posts';
    scrollEl.appendChild(postsEl);
  }
  var contactPosts=momentsPosts.filter(function(p){return p.authorId===contactId;}).sort(function(a,b){return b.timestamp-a.timestamp;});
  if(!contactPosts.length){
    postsEl.innerHTML='<div class="empty" style="text-align:center;padding:40px;color:var(--txt3);font-size:14px;"><div style="font-size:48px;margin-bottom:12px;">📭</div><div>'+(contact.name||contactId)+' 暂无动态</div></div>';
  }else{
    postsEl.innerHTML=contactPosts.map(function(post){
      var member=getMomentsMember(post.authorId);
      if(!member)member={nickname:contact.name||contactId,avatar:contact.avatar};
      return renderMomentsPost(post,member);
    }).join('');
  }
}

function renderMomentsPost(post,member){
  var likesHtml=post.likes&&post.likes.length>0?'<div class="moments-likes" style="display:flex;align-items:center;gap:6px;color:var(--accent);font-size:13px;padding:6px 12px;background:rgba(0,0,0,0.03);border-radius:8px;margin-top:8px;">'+post.likes.map(function(lid){var lm=getMomentsMember(lid);return lm?lm.nickname:'某人'}).join('、')+' 赞了这条动态</div>':'';
  var commentsHtml='';
  var hasComments=post.comments&&post.comments.length>0;
  if(hasComments){
    commentsHtml='<div style="border-top:1px solid var(--border);margin-top:4px;">'+
      '<button style="width:100%;padding:8px 0;border:none;background:none;color:var(--txt3);font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;" onclick="toggleMomentsPostComments(\''+post.id+'\')">'+
      (momentsCommentsExpanded?'收起评论':'查看全部 '+post.comments.length+' 条评论')+
      '</button>'+
      '<div class="moments-comments" id="moments-comments-'+post.id+'" style="display:'+(momentsCommentsExpanded?'block':'none')+';margin-top:4px;">'+post.comments.map(function(c){
        var cm=getMomentsMember(c.authorId);
        if(!cm)cm={nickname:'某人',avatar:''};
        var contentHtml=c.content.startsWith('data:image')?'<img src="'+c.content+'" style="max-width:100px;max-height:100px;border-radius:6px;object-fit:cover;">':c.content;
        var repliesHtml=c.replies&&c.replies.length>0?'<div class="moments-replies" style="margin-top:4px;padding-left:20px;">'+c.replies.map(function(r){var rm=getMomentsMember(r.authorId);if(!rm)rm={nickname:'某人'};var replyContent=r.content.startsWith('data:image')?'<img src="'+r.content+'" style="max-width:60px;max-height:60px;border-radius:4px;object-fit:cover;">':r.content;return'<div class="moments-reply" style="font-size:13px;padding:4px 0;"><span style="color:var(--accent);font-weight:500;">'+rm.nickname+'</span>: '+replyContent+'</div>'}).join('')+'</div>':'';
        return'<div class="moments-comment" data-cid="'+c.id+'" style="padding:10px 0;border-bottom:1px solid var(--border);display:block;"><div style="display:flex;gap:10px;cursor:pointer;" onclick="showMomentsReplyInput(\''+post.id+'\',\''+c.id+'\',\''+cm.nickname+'\')"><div class="moments-comment-av">'+(cm.avatar?'<img src="'+cm.avatar+'" style="width:100%;height:100%;object-fit:cover;">':'✦')+'</div><div style="flex:1;min-width:0;"><div style="display:flex;align-items:center;gap:8px;"><span style="font-size:14px;color:var(--accent);font-weight:500;">'+cm.nickname+'</span><span style="font-size:12px;color:var(--txt3);">'+formatMomentsTime(c.timestamp)+'</span></div><div style="font-size:14px;color:var(--txt);margin-top:4px;line-height:1.5;">'+contentHtml+'</div>'+repliesHtml+'</div></div>'+'<div class="moments-comment-reply-area" id="reply-area-'+c.id+'" style="width:100%;clear:both;margin-top:8px;padding-left:42px;"></div></div>';
      }).join('')+'</div></div>';
  }
  var imagesHtml='';
  if(post.images&&post.images.length>0){
    var gridSize=post.images.length===1?'calc(65% - 2px)':(post.images.length===2||post.images.length===4)?'calc(50% - 2px)':'calc(33.33% - 3px)';
    imagesHtml='<div class="mo-images" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;">'+post.images.map(function(img,idx){return'<img src="'+img+'" data-idx="'+idx+'" data-post="'+post.id+'" style="width:'+gridSize+';aspect-ratio:1;border-radius:8px;object-fit:cover;cursor:pointer;" onclick="openMomentsImagePreview(\''+post.id+'\','+idx+')">'}).join('')+'</div>';
  }
  var isSelfPost=post.authorId==='self'||post.authorId==='me';
  // 操作按钮：自己发的朋友圈可编辑+删除；梦角发的朋友圈可删除（不能编辑）
  var postActionsHtml='';
  if(isSelfPost){
    postActionsHtml='<div style="position:absolute;top:10px;right:10px;display:flex;gap:4px;"><button onclick="editMoment(\''+post.id+'\')" style="width:24px;height:24px;border:none;background:none;color:var(--txt3);font-size:12px;cursor:pointer;opacity:0.35;display:flex;align-items:center;justify-content:center;border-radius:50%;" title="编辑">✎</button><button onclick="deleteMoment(\''+post.id+'\')" style="width:24px;height:24px;border:none;background:none;color:var(--txt3);font-size:12px;cursor:pointer;opacity:0.35;display:flex;align-items:center;justify-content:center;border-radius:50%;" title="删除">✕</button></div>';
  }else{
    postActionsHtml='<div style="position:absolute;top:10px;right:10px;display:flex;gap:4px;"><button onclick="deleteMoment(\''+post.id+'\')" style="width:24px;height:24px;border:none;background:none;color:var(--txt3);font-size:12px;cursor:pointer;opacity:0.35;display:flex;align-items:center;justify-content:center;border-radius:50%;" title="删除">✕</button></div>';
  }
  var extraInfoHtml='';
  if(post.location){
    extraInfoHtml+='<div style="font-size:12px;color:var(--txt3);margin-top:6px;display:flex;align-items:center;gap:4px;">📍 '+post.location+'</div>';
  }
  if(post.remindIds&&post.remindIds.length>0){
    var remindNames=post.remindIds.map(function(rid){var m=getMomentsMember(rid);return m?'@'+m.nickname:''}).filter(Boolean).join(' ');
    if(remindNames){
      extraInfoHtml+='<div style="font-size:12px;color:#1890ff;margin-top:4px;">'+remindNames+' 特别关注</div>';
    }
  }
  var visText='';
  if(post.visibility==='selected'&&post.visSelectedIds&&post.visSelectedIds.length>0){
    visText='仅'+post.visSelectedIds.length+'位联系人可见';
  }else{
    visText='公开';
  }
  extraInfoHtml+='<div style="font-size:11px;color:var(--txt4);margin-top:4px;">👁 '+visText+'</div>';
  return'<div class="moment" data-mid="'+post.id+'" style="background:#fff;border-radius:12px;padding:12px;margin-bottom:8px;box-shadow:0 1px 3px rgba(0,0,0,0.05);position:relative;"><div class="mo-head" style="display:flex;align-items:center;gap:10px;margin-bottom:10px;"><div class="mo-av" style="width:40px;height:40px;border-radius:0;background:var(--c3);display:flex;align-items:center;justify-content:center;overflow:hidden;">'+(member.avatar?'<img src="'+member.avatar+'" style="display:block;width:100%;height:100%;object-fit:cover;">':'✦')+'</div><div><div class="mo-name" style="font-weight:500;color:var(--txt);font-size:15px;">'+member.nickname+'</div><div class="mo-time" style="font-size:12px;color:var(--txt3);margin-top:2px;">'+formatMomentsTime(post.timestamp)+'</div></div></div>'+postActionsHtml+'<div class="mo-body" style="font-size:14px;color:var(--txt);line-height:1.6;">'+post.content+'</div>'+(post.aiLoading?'<div style="margin-top:8px;padding:8px 10px;border-radius:10px;background:rgba(0,0,0,0.05);border:1px dashed var(--border);font-size:12px;color:var(--txt2);"><span style="display:inline-block;animation:aiPulse 1s ease-in-out infinite;">📜 TA正在解读...</span></div>':(post.aiError?'<div style="margin-top:8px;padding:8px 10px;border-radius:10px;background:rgba(0,0,0,0.05);border:1px dashed var(--border);font-size:12px;color:#ff4d4f;">📜 解读失败：'+String(post.aiError).replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div>':(post.aiInterpret?'<div onclick="toggleMomentAI(\''+post.id+'\')" style="margin-top:8px;padding:8px 10px;border-radius:10px;background:rgba(0,0,0,0.05);border:1px dashed var(--border);cursor:pointer;font-size:12px;color:var(--accent);user-select:none;-webkit-user-select:none;"><span id="m-ai-t-'+post.id+'">📜 收起解读</span></div><div id="m-ai-'+post.id+'" style="display:block;margin-top:6px;padding:10px 12px;border-radius:10px;background:rgba(0,0,0,0.04);font-size:13px;color:var(--txt);line-height:1.7;word-break:break-all;">'+String(post.aiInterpret).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>')+'</div>':'')))+imagesHtml+extraInfoHtml+likesHtml+commentsHtml+'<div class="mo-footer" style="display:flex;justify-content:center;gap:40px;margin-top:12px;padding-top:10px;border-top:1px solid var(--bg3);"><div class="mo-action" data-action="like" style="display:flex;align-items:center;gap:6px;color:var(--txt3);font-size:14px;cursor:pointer;" onclick="toggleLike(\''+post.id+'\')"><span>♡</span><span>点赞</span></div><div class="mo-action" data-action="comment" style="display:flex;align-items:center;gap:6px;color:var(--txt3);font-size:14px;cursor:pointer;" onclick="showMomentsCommentInput(\''+post.id+'\')"><span>💬</span><span>评论</span></div><div class="mo-action" style="display:flex;align-items:center;gap:6px;color:var(--txt3);font-size:14px;cursor:pointer;transition:color 0.2s;" onclick="aiInterpretMoment(\''+post.id+'\')"><span>📜</span><span>解读</span></div></div></div>';
}

// ---------- Message Board ----------

var boardMessages=[];
var boardSelectedTarget='__ALL__';
var boardFilterMode='all';
var boardFilterTarget='';
function loadBoardData(){
  var saved=ls('ml2_board_messages');
  if(saved&&Array.isArray(saved))boardMessages=saved;
}
function saveBoardData(){ls('ml2_board_messages',boardMessages)}

function getBoardTargets(){
  var targets=[{id:'__ALL__',name:'全部联系人'}];
  contacts.forEach(function(c){
    targets.push({id:c.id,name:c.name});
  });
  return targets;
}

function renderBoardTargets(){
  var el=$('board-target-group');if(!el)return;
  var targets=getBoardTargets();
  el.innerHTML='';
  targets.forEach(function(t){
    var btn=document.createElement('button');
    btn.className='board-target-btn';
    btn.textContent=t.name;
    btn.dataset.target=t.id;
    if(t.id===boardSelectedTarget){
      btn.classList.add(t.id==='__ALL__'?'active-all':'active');
    }
    btn.addEventListener('click',function(){
      var isCapture=!!(window._tsM||0);
      if(isCapture){window._tsM=false;return;}
      boardSelectedTarget=t.id;
      renderBoardTargets();
    });
    btn.addEventListener('touchend',function(e){
      if(window._tsM){window._tsM=false;return;}
      e.preventDefault();
      boardSelectedTarget=t.id;
      renderBoardTargets();
    });
    el.appendChild(btn);
  });
}

function renderBoardFilterTargets(){
  var el=$('board-filter-target-select');if(!el)return;
  el.innerHTML='';
  contacts.forEach(function(c){
    var btn=document.createElement('button');
    btn.className='board-filter-target-btn';
    btn.textContent=c.name;
    btn.dataset.target=c.id;
    if(c.id===boardFilterTarget)btn.classList.add('active');
    btn.addEventListener('click',function(){
      boardFilterTarget=c.id;
      renderBoardFilterTargets();
      renderBoardMessages();
    });
    btn.addEventListener('touchend',function(e){
      e.preventDefault();
      boardFilterTarget=c.id;
      renderBoardFilterTargets();
      renderBoardMessages();
    });
    el.appendChild(btn);
  });
  if(boardFilterMode==='target'){
    el.classList.add('show');
  }else{
    el.classList.remove('show');
  }
}

function getFilteredBoardMessages(){
  if(boardFilterMode==='all')return boardMessages;
  if(boardFilterMode==='allTarget')return boardMessages.filter(function(m){return !m.target||m.target==='__ALL__'});
  if(boardFilterMode==='target')return boardMessages.filter(function(m){return m.target===boardFilterTarget});
  return boardMessages;
}

function renderBoardMessages(){
  var el=$('board-message-list');if(!el)return;
  var countEl=$('board-count-label');
  var filtered=getFilteredBoardMessages();
  if(countEl)countEl.textContent='共 '+filtered.length+' 条';
  if(!filtered.length){
    el.innerHTML='<div class="board-empty-state"><span class="empty-icon">🕊️</span><p>还没有留言，写下第一份心意吧～</p></div>';
    return;
  }
  var sorted=filtered.slice().sort(function(a,b){return b.timestamp-a.timestamp});
  el.innerHTML='';
  sorted.forEach(function(msg){
    var isAll=!msg.target||msg.target==='__ALL__';
    var targetName='全部联系人';
    if(!isAll){
      var ct=contacts.find(function(c){return c.id===msg.target});
      targetName=ct?ct.name:(msg.target||'未知');
    }
    var d=new Date(msg.timestamp);
    var pad=function(n){return String(n).padStart(2,'0')};
    var timeStr=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+pad(d.getHours())+':'+pad(d.getMinutes());
    var div=document.createElement('div');
    div.className='board-message-item';
    var tagClass=isAll?'board-message-tag tag-all':'board-message-tag';
    var tagText=isAll?'📌 全部联系人':'🎯 '+targetName;
    div.innerHTML='<div class="board-message-header"><span class="'+tagClass+'">'+tagText+'</span><span class="board-message-time">'+timeStr+'</span></div><div class="board-message-content">'+escapeHtml(msg.content)+'</div><div style="display:flex;justify-content:flex-end;margin-top:8px;"><button class="board-message-delete" onclick="deleteBoardMessage(\''+msg.id+'\')" title="删除">✕</button></div>';
    el.appendChild(div);
  });
}

function renderBoard(){
  renderBoardTargets();
  renderBoardFilterTargets();
  renderBoardMessages();
}

function postBoardMessage(){
  var input=$('board-input');
  var content=input.value.trim();
  if(!content){
    toast('请写下你想说的话');
    input.focus();
    return;
  }
  if(content.length>500){
    toast('内容不能超过500个字');
    return;
  }
  boardMessages.unshift({
    id:'b_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
    target:boardSelectedTarget,
    content:content,
    timestamp:Date.now()
  });
  saveBoardData();
  input.value='';
  renderBoard();
  toast('留言已发布');
}

function deleteBoardMessage(id){
  boardMessages=boardMessages.filter(function(m){return m.id!==id});
  saveBoardData();
  renderBoard();
  toast('已删除');
}

// Board filter & publish event bindings
(function initBoardEvents(){
  var filterGroup=$('board-filter-group');
  if(filterGroup){
    filterGroup.addEventListener('click',function(e){
      var btn=e.target.closest('.board-filter-btn');
      if(!btn)return;
      var mode=btn.dataset.filter;
      if(mode===boardFilterMode)return;
      boardFilterMode=mode;
      if(mode==='target'&&!boardFilterTarget){
        boardFilterTarget=contacts.length?contacts[0].id:'';
      }
      var btns=filterGroup.querySelectorAll('.board-filter-btn');
      btns.forEach(function(b){b.classList.toggle('active',b.dataset.filter===boardFilterMode)});
      renderBoardFilterTargets();
      renderBoardMessages();
    });
    filterGroup.addEventListener('touchend',function(e){
      var btn=e.target.closest('.board-filter-btn');
      if(!btn)return;
      e.preventDefault();
      var mode=btn.dataset.filter;
      if(mode===boardFilterMode)return;
      boardFilterMode=mode;
      if(mode==='target'&&!boardFilterTarget){
        boardFilterTarget=contacts.length?contacts[0].id:'';
      }
      var btns=filterGroup.querySelectorAll('.board-filter-btn');
      btns.forEach(function(b){b.classList.toggle('active',b.dataset.filter===boardFilterMode)});
      renderBoardFilterTargets();
      renderBoardMessages();
    });
  }
  var publishBtn=$('board-publish-btn');
  if(publishBtn){
    publishBtn.addEventListener('click',function(){
      if(window._tsM){window._tsM=false;return;}
      postBoardMessage();
    });
    publishBtn.addEventListener('touchend',function(e){
      if(window._tsM){window._tsM=false;return;}
      e.preventDefault();
      postBoardMessage();
    });
  }
  var boardInputEl=$('board-input');
  if(boardInputEl){
    boardInputEl.addEventListener('keydown',function(e){
      if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){
        e.preventDefault();
        postBoardMessage();
      }
    });
  }
})();


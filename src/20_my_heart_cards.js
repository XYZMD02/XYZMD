// ========== 心意字卡系统 v2 ==========
// 默认心意字卡（含强度等级：Lv1轻微/Lv2普通/Lv3深层）
var _defaultHeartCards=[
  {group:'陪伴与守护',emoji:'🤍',cards:[
    {content:'陪伴',level:2,rarity:'normal'},{content:'陪着你',level:1,rarity:'normal'},{content:'我在这里',level:1,rarity:'normal'},{content:'安静陪你',level:1,rarity:'normal'},{content:'想和你一起',level:1,rarity:'normal'},{content:'不用一个人',level:1,rarity:'normal'},{content:'待在你身边',level:1,rarity:'normal'},{content:'不会离开',level:2,rarity:'rare'},{content:'想陪你走下去',level:3,rarity:'special'},{content:'想和你待一会',level:1,rarity:'rare'}
  ]},
  {group:'分享与交流',emoji:'💬',cards:[
    {content:'分享',level:1,rarity:'normal'},{content:'想告诉你',level:1,rarity:'normal'},{content:'想和你聊聊',level:1,rarity:'normal'},{content:'想让你知道',level:1,rarity:'normal'},{content:'想听你的想法',level:1,rarity:'normal'},{content:'想看看你的反应',level:1,rarity:'normal'},{content:'想把这个分享给你',level:2,rarity:'rare'},{content:'想和你交换想法',level:2,rarity:'rare'}
  ]},
  {group:'关心与照顾',emoji:'🌱',cards:[
    {content:'关心',level:1,rarity:'normal'},{content:'想照顾你',level:2,rarity:'rare'},{content:'希望你好好的',level:2,rarity:'rare'},{content:'记得休息',level:1,rarity:'normal'},{content:'不要太累',level:1,rarity:'normal'},{content:'想确认你没事',level:2,rarity:'rare'},{content:'希望你开心',level:1,rarity:'normal'},{content:'想让你轻松一点',level:1,rarity:'normal'}
  ]},
  {group:'思念与靠近',emoji:'🌙',cards:[
    {content:'想念',level:2,rarity:'rare'},{content:'想到你',level:1,rarity:'normal'},{content:'想靠近一点',level:2,rarity:'rare'},{content:'想见你',level:2,rarity:'rare'},{content:'想和你在一起',level:2,rarity:'rare'},{content:'想听你说话',level:1,rarity:'normal'},{content:'想知道你在做什么',level:1,rarity:'normal'},{content:'舍不得离开',level:3,rarity:'special'}
  ]},
  {group:'理解与回应',emoji:'🔔',cards:[
    {content:'回应',level:1,rarity:'normal'},{content:'我听到了',level:1,rarity:'normal'},{content:'我明白',level:2,rarity:'rare'},{content:'我知道',level:1,rarity:'normal'},{content:'我记住了',level:2,rarity:'rare'},{content:'我理解',level:2,rarity:'rare'},{content:'收到你的话',level:1,rarity:'normal'},{content:'想回应你',level:2,rarity:'rare'}
  ]},
  {group:'鼓励与支持',emoji:'✨',cards:[
    {content:'支持',level:1,rarity:'normal'},{content:'相信你',level:2,rarity:'rare'},{content:'陪你努力',level:2,rarity:'rare'},{content:'为你加油',level:1,rarity:'normal'},{content:'认可你',level:1,rarity:'normal'},{content:'为你感到骄傲',level:3,rarity:'special'},{content:'希望你坚持',level:1,rarity:'normal'},{content:'我支持你的选择',level:2,rarity:'rare'}
  ]},
  {group:'邀请与互动',emoji:'🎁',cards:[
    {content:'邀请',level:1,rarity:'normal'},{content:'想和你一起',level:2,rarity:'rare'},{content:'想听你说',level:1,rarity:'normal'},{content:'想和你讨论',level:1,rarity:'normal'},{content:'等你加入',level:2,rarity:'rare'},{content:'想一起分享',level:1,rarity:'normal'},{content:'想和你做同一件事',level:2,rarity:'rare'}
  ]},
  {group:'记录与珍惜',emoji:'📖',cards:[
    {content:'记录',level:1,rarity:'normal'},{content:'想记住',level:1,rarity:'normal'},{content:'保存这一刻',level:1,rarity:'normal'},{content:'珍惜现在',level:1,rarity:'normal'},{content:'留下回忆',level:1,rarity:'normal'},{content:'这个瞬间很重要',level:2,rarity:'rare'},{content:'想收藏这份感觉',level:2,rarity:'rare'}
  ]},
  {group:'特殊表达',emoji:'🌟',cards:[
    {content:'想被理解',level:1,rarity:'normal'},{content:'想被看见',level:1,rarity:'normal'},{content:'有话想说',level:1,rarity:'normal'},{content:'不知道怎么表达',level:1,rarity:'normal'},{content:'藏着一点心事',level:2,rarity:'rare'},{content:'想确认你的心意',level:2,rarity:'rare'},{content:'舍不得表达',level:2,rarity:'rare'}
  ]}
];

// 特殊稀有心意池（独立5%触发）
var _specialHeartCards=[
  {group:'珍惜',emoji:'🌟',cards:[
    {content:'想记住这个瞬间',level:3},{content:'这个时刻很特别',level:3},{content:'想保存这份感觉',level:3},{content:'不想忘记',level:3}
  ]},
  {group:'连接',emoji:'🔗',cards:[
    {content:'想一直保持联系',level:3},{content:'想继续陪你交流',level:3},{content:'想知道你的消息',level:3},{content:'想和你一直说话',level:3}
  ]},
  {group:'信任',emoji:'🤍',cards:[
    {content:'愿意告诉你',level:3},{content:'相信你',level:3},{content:'可以放心交给你',level:3},{content:'接受你的样子',level:3}
  ]},
  {group:'默契',emoji:'🌌',cards:[
    {content:'你懂我的',level:3},{content:'不用说太多',level:3},{content:'我们之间有默契',level:3},{content:'这个感觉只有你懂',level:3}
  ]}
];

// 强度等级概率（普通聊天 / 特殊留言）
var _heartLevelWeights={
  normal:{1:80,2:18,3:2},
  special:{1:30,2:50,3:20}
};

// 等级概率（普通/稀有/特殊）
var _rarityWeights={normal:80,rare:15,special:5};
var _rarityWeightsImportant={normal:50,rare:35,special:15};

// 特殊字卡冷却 {contactId: {content: lastTime}}
var _specialCardCooldown={};
var _specialCardCooldownMs=86400000; // 24h
var _specialCardRecentLimit=20; // 最近20条不重复

// 心意冷却历史 {contactId: [{content, group, time}]}
var _heartCardHistory={};
var _heartCardLastSpecialTime={}; // {contactId: timestamp} 特殊心意24h限制

// 通用心意池（没有情绪字卡时使用）
var _generalHeartPool=[
  {group:'陪伴与守护',weight:25},
  {group:'分享与交流',weight:20},
  {group:'关心与照顾',weight:15},
  {group:'思念与靠近',weight:12},
  {group:'理解与回应',weight:10},
  {group:'鼓励与支持',weight:8},
  {group:'邀请与互动',weight:5},
  {group:'记录与珍惜',weight:3},
  {group:'特殊表达',weight:2}
];

// 情绪→心意关联池映射
var _emotionToHeartMapping={
  '喜悦与正向':[
    {group:'分享与交流',weight:35},{group:'陪伴与守护',weight:25},{group:'邀请与互动',weight:20},{group:'记录与珍惜',weight:15},{group:'思念与靠近',weight:5}
  ],
  '亲近与爱意':[
    {group:'思念与靠近',weight:35},{group:'陪伴与守护',weight:30},{group:'记录与珍惜',weight:15},{group:'理解与回应',weight:10},{group:'特殊表达',weight:10}
  ],
  '悲伤与低落':[
    {group:'陪伴与守护',weight:40},{group:'关心与照顾',weight:30},{group:'理解与回应',weight:20},{group:'特殊表达',weight:10}
  ],
  '不安与恐惧':[
    {group:'陪伴与守护',weight:40},{group:'关心与照顾',weight:30},{group:'理解与回应',weight:20},{group:'特殊表达',weight:10}
  ],
  '害羞与社交情绪':[
    {group:'思念与靠近',weight:35},{group:'理解与回应',weight:30},{group:'邀请与互动',weight:20},{group:'分享与交流',weight:15}
  ],
  '思考与复杂情绪':[
    {group:'理解与回应',weight:40},{group:'记录与珍惜',weight:25},{group:'陪伴与守护',weight:20},{group:'特殊表达',weight:15}
  ],
  '克制与隐藏':[
    {group:'特殊表达',weight:35},{group:'思念与靠近',weight:30},{group:'陪伴与守护',weight:25},{group:'理解与回应',weight:10}
  ],
  '中性与日常':[
    {group:'分享与交流',weight:35},{group:'陪伴与守护',weight:25},{group:'记录与珍惜',weight:20},{group:'邀请与互动',weight:20}
  ],
  '愤怒与不满':[
    {group:'陪伴与守护',weight:30},{group:'理解与回应',weight:30},{group:'关心与照顾',weight:20},{group:'特殊表达',weight:20}
  ],
  '自我情绪':[
    {group:'理解与回应',weight:30},{group:'记录与珍惜',weight:30},{group:'陪伴与守护',weight:20},{group:'特殊表达',weight:20}
  ],
  '特殊表达情绪':[
    {group:'特殊表达',weight:50},{group:'理解与回应',weight:30},{group:'陪伴与守护',weight:20}
  ]
};

var _heartToIntentMapping={
  '陪伴与守护':[
    {group:'靠近',weight:40},{group:'回应',weight:30},{group:'倾听',weight:20},{group:'安慰',weight:10}
  ],
  '分享与交流':[
    {group:'分享',weight:50},{group:'回应',weight:25},{group:'倾听',weight:15},{group:'了解',weight:10}
  ],
  '关心与照顾':[
    {group:'安慰',weight:40},{group:'靠近',weight:30},{group:'回应',weight:20},{group:'倾听',weight:10}
  ],
  '思念与靠近':[
    {group:'靠近',weight:50},{group:'表达',weight:25},{group:'回应',weight:15},{group:'倾听',weight:10}
  ],
  '理解与回应':[
    {group:'回应',weight:50},{group:'倾听',weight:25},{group:'了解',weight:15},{group:'靠近',weight:10}
  ],
  '鼓励与支持':[
    {group:'安慰',weight:35},{group:'表达',weight:30},{group:'靠近',weight:20},{group:'回应',weight:15}
  ],
  '邀请与互动':[
    {group:'分享',weight:40},{group:'了解',weight:30},{group:'倾听',weight:20},{group:'靠近',weight:10}
  ],
  '记录与珍惜':[
    {group:'表达',weight:40},{group:'靠近',weight:30},{group:'回应',weight:20},{group:'分享',weight:10}
  ],
  '特殊表达':[
    {group:'表达',weight:40},{group:'整理',weight:25},{group:'回应',weight:20},{group:'靠近',weight:15}
  ]
};

var _heartCardsVersion='v2';

// ========== 交流意图字卡系统 ==========
var _defaultIntentCards=[
  {group:'回应',emoji:'🤍',weight:25,cards:[{content:'回应你',rarity:'normal'},{content:'听到了',rarity:'normal'},{content:'收到',rarity:'normal'},{content:'我在听',rarity:'normal'},{content:'想回答你',rarity:'rare'},{content:'认真听你说',rarity:'rare'},{content:'想回应你',rarity:'rare'}]},
  {group:'分享',emoji:'💬',weight:20,cards:[{content:'想分享',rarity:'normal'},{content:'想告诉你',rarity:'normal'},{content:'想聊聊',rarity:'normal'},{content:'有事情想说',rarity:'rare'},{content:'想让你知道',rarity:'rare'},{content:'想和你说说',rarity:'rare'}]},
  {group:'倾听',emoji:'👂',weight:15,cards:[{content:'想听你说',rarity:'normal'},{content:'等待你的回应',rarity:'rare'},{content:'想知道你的想法',rarity:'rare'},{content:'想听听你的意见',rarity:'rare'},{content:'想看看你的反应',rarity:'rare'}]},
  {group:'靠近',emoji:'🌙',weight:15,cards:[{content:'想靠近',rarity:'normal'},{content:'想陪着你',rarity:'normal'},{content:'想和你待一会',rarity:'rare'},{content:'想一起聊聊',rarity:'rare'},{content:'想留在这里',rarity:'rare'}]},
  {group:'了解',emoji:'🔍',weight:10,cards:[{content:'想问问你',rarity:'normal'},{content:'想了解',rarity:'normal'},{content:'有点好奇',rarity:'rare'},{content:'想知道更多',rarity:'rare'},{content:'想认识你',rarity:'rare'}]},
  {group:'安慰',emoji:'🌱',weight:8,cards:[{content:'想安慰你',rarity:'normal'},{content:'想陪陪你',rarity:'normal'},{content:'希望你好一点',rarity:'rare'},{content:'想让你安心',rarity:'rare'},{content:'想照顾你',rarity:'rare'}]},
  {group:'表达',emoji:'🌟',weight:5,cards:[{content:'想表达',rarity:'normal'},{content:'有话想说',rarity:'normal'},{content:'想让你懂',rarity:'rare'},{content:'希望你理解',rarity:'rare'},{content:'想告诉你一些事',rarity:'rare'}]},
  {group:'整理',emoji:'🌫',weight:2,cards:[{content:'正在想',rarity:'normal'},{content:'想一想',rarity:'normal'},{content:'不知道怎么说',rarity:'rare'},{content:'慢慢整理',rarity:'rare'},{content:'还在思考',rarity:'rare'}]}
];
var _intentCardsVersion='v1';

// 字卡类型开关设置（情绪/心意/交流意图）
var _cardTypeSettings={mood:true,heart:true,intent:true};

// ─── 心意字卡存储 ───
async function loadHeartCards(){
  try{
    var data=null;
    if(window.localforage){data=await window.localforage.getItem('ml2_heart_cards');}
    if(!data){var lsData=safeGetItem('ml2_lf_ml2_heart_cards');if(lsData)try{data=JSON.parse(lsData);}catch(e){}}
    if(!data||!Array.isArray(data)){data=[];}
    return data;
  }catch(e){return [];}
}

async function saveHeartCards(cards){
  try{ls('ml2_heart_cards',cards);if(window.localforage){await window.localforage.setItem('ml2_heart_cards',cards);}}catch(e){}
}

// ─── 自定义心意字卡存储 ───
async function loadCustomHeartCards(){
  try{
    var data=null;
    if(window.localforage){data=await window.localforage.getItem('ml2_custom_heart_cards');}
    if(!data){var lsData=safeGetItem('ml2_lf_ml2_custom_heart_cards');if(lsData)try{data=JSON.parse(lsData);}catch(e){}}
    if(!data||!Array.isArray(data)){data=[];}
    return data;
  }catch(e){return [];}
}

async function saveCustomHeartCards(cards){
  try{ls('ml2_custom_heart_cards',cards);if(window.localforage){await window.localforage.setItem('ml2_custom_heart_cards',cards);}}catch(e){}
}

// ─── 心意冷却历史存储 ───
async function loadHeartCardHistory(){
  try{
    var data=null;
    if(window.localforage){data=await window.localforage.getItem('ml2_heart_card_history');}
    if(!data){var lsData=safeGetItem('ml2_lf_ml2_heart_card_history');if(lsData)try{data=JSON.parse(lsData);}catch(e){}}
    if(!data||typeof data!=='object'){data={};}
    _heartCardHistory=data.history||{};
    _heartCardLastSpecialTime=data.lastSpecialTime||{};
    // 清理超过24h的历史
    var now=Date.now();
    Object.keys(_heartCardHistory).forEach(function(k){
      _heartCardHistory[k]=_heartCardHistory[k].filter(function(h){return now-h.time<86400000;});
    });
  }catch(e){_heartCardHistory={};_heartCardLastSpecialTime={};}
}

async function saveHeartCardHistory(){
  try{
    var data={history:_heartCardHistory,lastSpecialTime:_heartCardLastSpecialTime};
    ls('ml2_heart_card_history',data);
    if(window.localforage){await window.localforage.setItem('ml2_heart_card_history',data);}
  }catch(e){}
}

function recordHeartCardHistory(contactId, card){
  if(!_heartCardHistory[contactId])_heartCardHistory[contactId]=[];
  _heartCardHistory[contactId].push({content:card.content,group:card.group,time:Date.now()});
  // 只保留最近20条
  if(_heartCardHistory[contactId].length>20)_heartCardHistory[contactId]=_heartCardHistory[contactId].slice(-20);
  saveHeartCardHistory();
}

// ─── 种子数据 ───
async function seedDefaultHeartCards(){
  try{
    var savedVersion=safeGetItem('ml2_heart_cards_version');
    if(savedVersion!==_heartCardsVersion){
      var newCards=[];
      _defaultHeartCards.forEach(function(g){
        g.cards.forEach(function(card){
          newCards.push({content:card.content,group:g.group,emoji:g.emoji,level:card.level,rarity:card.rarity});
        });
      });
      // 也加入特殊心意池的字卡
      _specialHeartCards.forEach(function(g){
        g.cards.forEach(function(card){
          newCards.push({content:card.content,group:g.group,emoji:g.emoji,level:card.level,isSpecial:true});
        });
      });
      await saveHeartCards(newCards);
      safeSetItem('ml2_heart_cards_version',_heartCardsVersion);
      return newCards;
    }
    var existing=await loadHeartCards();
    var added=0;
    // 检查并补充默认字卡
    _defaultHeartCards.forEach(function(g){
      g.cards.forEach(function(card){
        var exists=existing.some(function(c){return c.content===card.content&&c.group===g.group});
        if(!exists){
          existing.push({content:card.content,group:g.group,emoji:g.emoji,level:card.level,rarity:card.rarity});
          added++;
        }
      });
    });
    // 检查并补充特殊心意字卡
    _specialHeartCards.forEach(function(g){
      g.cards.forEach(function(card){
        var exists=existing.some(function(c){return c.content===card.content&&c.group===g.group});
        if(!exists){
          existing.push({content:card.content,group:g.group,emoji:g.emoji,level:card.level,isSpecial:true});
          added++;
        }
      });
    });
    if(added>0){await saveHeartCards(existing);}
    return existing;
  }catch(e){return [];}
}

// ─── 获取某联系人的聊天次数（用于特殊心意解锁判断）───
function getContactChatCount(targetId){
  if(!targetId)return 0;
  var messages=msgs(targetId);
  if(!messages)return 0;
  return messages.filter(function(m){return m.s===OTHER;}).length;
}

// ─── 核心抽取函数 ───
// isSpecialMessage: 是否为特殊留言场景
async function getRandomHeartCard(targetId, moodCard, isSpecialMessage){
  if(!isCardTypeEnabled('heart'))return null;
  // 60%概率不显示心意字卡
  if(Math.random()*100>40)return null;
  
  await loadHeartCardHistory();
  var cards=await loadHeartCards();
  if(!cards||cards.length===0){
    cards=await seedDefaultHeartCards();
    if(!cards||cards.length===0)return null;
  }
  
  // ── 第一步：判断是否触发特殊稀有心意 ──
  // 条件：聊天次数>=20 且 24h内未触发过 且 5%概率
  var chatCount=getContactChatCount(targetId);
  var lastSpecialTime=_heartCardLastSpecialTime[targetId]||0;
  var canTriggerSpecial=chatCount>=20&&(Date.now()-lastSpecialTime>86400000);
  var isSpecial=false;
  if(canTriggerSpecial&&Math.random()*100<5){
    isSpecial=true;
    _heartCardLastSpecialTime[targetId]=Date.now();
    // 从特殊心意池中随机抽取
    var allSpecialCards=[];
    _specialHeartCards.forEach(function(g){
      g.cards.forEach(function(card){
        allSpecialCards.push({content:card.content,group:g.group,emoji:g.emoji,level:card.level,isSpecial:true});
      });
    });
    if(allSpecialCards.length>0){
      // 冷却检查
      var filteredSpecial=applyCooldownFilter(targetId, allSpecialCards);
      if(filteredSpecial.length===0)filteredSpecial=allSpecialCards;
      var picked=filteredSpecial[Math.floor(Math.random()*filteredSpecial.length)];
      recordHeartCardHistory(targetId, picked);
      return picked;
    }
  }
  
  // ── 第二步：确定心意池 ──
  var pool=null;
  if(moodCard&&moodCard.group){
    pool=_emotionToHeartMapping[moodCard.group];
  }
  if(!pool){pool=_generalHeartPool;}
  
  // ── 第三步：应用冷却机制调整权重 ──
  var adjustedPool=applyCooldownToPool(targetId, pool);
  
  // ── 第四步：加权随机抽取心意分类 ──
  var totalWeight=0;
  adjustedPool.forEach(function(p){totalWeight+=p.weight;});
  if(totalWeight<=0)return null;
  var rand=Math.random()*totalWeight;
  var cumulative=0;
  var selectedGroup=null;
  for(var i=0;i<adjustedPool.length;i++){
    cumulative+=adjustedPool[i].weight;
    if(rand<=cumulative){selectedGroup=adjustedPool[i].group;break;}
  }
  if(!selectedGroup)return null;
  
  // ── 第五步：分类内按强度等级抽取 ──
  var groupCards=cards.filter(function(c){return c.group===selectedGroup&&!c.isSpecial;});
  // 合并自定义心意
  var customCards=await loadCustomHeartCards();
  var customGroupCards=customCards.filter(function(c){return c.group===selectedGroup});
  // 自定义心意使用用户设定的权重
  customGroupCards.forEach(function(c){c._weight=c.weight!==undefined?c.weight:0.5;});
  groupCards.forEach(function(c){c._weight=1;});
  var allGroupCards=groupCards.concat(customGroupCards);
  if(allGroupCards.length===0)return null;
  
  // 应用冷却：排除5次内重复的具体字卡
  var cooledCards=applyCooldownFilter(targetId, allGroupCards);
  if(cooledCards.length===0)cooledCards=allGroupCards;
  
  // 按强度等级加权抽取
  var levelWeights=isSpecialMessage?_heartLevelWeights.special:_heartLevelWeights.normal;
  
  // 稀有度加权过滤
  var rarityRoll=Math.random()*100;
  var rarityCumulative=0;
  var selectedRarity='normal';
  for(var rarity in _rarityWeights){
    if(!_rarityWeights.hasOwnProperty(rarity))continue;
    rarityCumulative+=_rarityWeights[rarity];
    if(rarityRoll<=rarityCumulative){selectedRarity=rarity;break;}
  }
  var rarityCards=cooledCards.filter(function(c){return c.rarity===selectedRarity;});
  if(rarityCards.length===0)rarityCards=cooledCards;
  
  var picked=weightedLevelPick(rarityCards, levelWeights);
  if(!picked)return null;
  
  // 特殊卡冷却追踪
  if(picked.rarity==='special'){
    if(!_specialCardCooldown[targetId])_specialCardCooldown[targetId]={};
    _specialCardCooldown[targetId][picked.content]=Date.now();
  }
  
  recordHeartCardHistory(targetId, picked);
  return picked;
}

// ─── 冷却辅助函数 ───
function applyCooldownToPool(targetId, pool){
  var history=_heartCardHistory[targetId]||[];
  var recent=history.slice(-3);
  var adjusted=pool.map(function(p){
    var count=recent.filter(function(h){return h.group===p.group}).length;
    if(count>0){return {group:p.group,weight:p.weight*0.5};}
    return {group:p.group,weight:p.weight};
  });
  return adjusted;
}

function applyCooldownFilter(targetId, cards){
  var history=_heartCardHistory[targetId]||[];
  var recent5=history.slice(-5);
  var recentContents=recent5.map(function(h){return h.content;});
  return cards.filter(function(c){return recentContents.indexOf(c.content)===-1;});
}

// ─── 特殊卡冷却检查 ───
function isSpecialCardOnCooldown(targetId, content){
  if(!targetId||!content)return false;
  var cooldowns=_specialCardCooldown[targetId];
  if(!cooldowns)return false;
  var lastTime=cooldowns[content];
  if(!lastTime)return false;
  return (Date.now()-lastTime)<_specialCardCooldownMs;
}

// ─── 强度加权抽取 ───
function weightedLevelPick(cards, levelWeights){
  // 按level分组计算权重
  var totalWeight=0;
  var weightedCards=cards.map(function(c){
    var level=c.level||1;
    var baseWeight=levelWeights[level]||levelWeights[1];
    var customWeight=c._weight!==undefined?c._weight:1;
    var w=baseWeight*customWeight;
    totalWeight+=w;
    return {card:c,weight:w};
  });
  if(totalWeight<=0)return cards[Math.floor(Math.random()*cards.length)];
  var rand=Math.random()*totalWeight;
  var cumulative=0;
  for(var i=0;i<weightedCards.length;i++){
    cumulative+=weightedCards[i].weight;
    if(rand<=cumulative)return weightedCards[i].card;
  }
  return cards[cards.length-1];
}

async function loadMoodCards(){
  try{
    var data=null;
    if(window.localforage){
      data=await window.localforage.getItem('ml2_mood_cards');
    }
    if(!data){
      var lsData=safeGetItem('ml2_lf_ml2_mood_cards');
      if(lsData)try{data=JSON.parse(lsData);}catch(e){}
    }
    if(!data||!Array.isArray(data)){
      data=[];
    }
    return data;
  }catch(e){
    console.warn('loadMoodCards failed:',e);
    return [];
  }
}

async function saveMoodCards(cards){
  try{
    ls('ml2_mood_cards',cards);
    if(window.localforage){
      await window.localforage.setItem('ml2_mood_cards',cards);
    }
    console.log('[moodCards] saved',cards.length,'cards');
  }catch(e){
    console.warn('saveMoodCards failed:',e);
  }
}

async function seedDefaultMoodCards(){
  try{
    var savedVersion=safeGetItem('ml2_mood_cards_version');
    if(savedVersion!==_moodCardsVersion){
      var newCards=[];
      _defaultMoodCards.forEach(function(g){
        g.cards.forEach(function(card){
          newCards.push({content:card.content,group:g.group,rarity:card.rarity});
        });
      });
      await saveMoodCards(newCards);
      safeSetItem('ml2_mood_cards_version',_moodCardsVersion);
      console.log('[moodCards] seeded default:',newCards.length,'cards');
      return newCards;
    }
    var existing=await loadMoodCards();
    var added=0;
    _defaultMoodCards.forEach(function(g){
      g.cards.forEach(function(card){
        var exists=existing.some(function(c){return c.content===card.content&&c.group===g.group});
        if(!exists){
          existing.push({content:card.content,group:g.group,rarity:card.rarity});
          added++;
        }
      });
    });
    if(added>0){
      await saveMoodCards(existing);
      console.log('[moodCards] added missing:',added,'cards');
    }
    return existing;
  }catch(e){
    console.warn('seedDefaultMoodCards failed:',e);
    return [];
  }
}

async function getRandomMoodCard(targetId, isSpecialMessage){
  if(!isCardTypeEnabled('mood'))return null;
  if(targetId){
    if(moodCardContactSettings[targetId]===false)return null;
  }
  var prob=70;
  if(!isSpecialMessage){
    if(emotionStreak>=4)prob=20;
    else if(emotionStreak>=3)prob=30;
    else if(emotionStreak>=2)prob=45;
    else if(emotionStreak>=1)prob=60;
  }
  if(Math.random()*100>prob)return null;
  var cards=await loadMoodCards();
  if(!cards||cards.length===0){
    cards=await seedDefaultMoodCards();
    if(!cards||cards.length===0)return null;
  }
  var totalWeight=0;
  _defaultMoodCards.forEach(function(g){totalWeight+=g.weight;});
  var rand=Math.random()*totalWeight;
  var cumulative=0;
  var selectedGroup=null;
  for(var i=0;i<_defaultMoodCards.length;i++){
    cumulative+=_defaultMoodCards[i].weight;
    if(rand<=cumulative){
      selectedGroup=_defaultMoodCards[i].group;
      break;
    }
  }
  if(!selectedGroup)return null;
  var groupCards=cards.filter(function(c){return c.group===selectedGroup});
  if(groupCards.length===0)return null;
  // 稀有度加权选择
  var rarityRoll=Math.random()*100;
  var rarityCumulative=0;
  var selectedRarity='normal';
  for(var rarity in _rarityWeights){
    if(!_rarityWeights.hasOwnProperty(rarity))continue;
    rarityCumulative+=_rarityWeights[rarity];
    if(rarityRoll<=rarityCumulative){selectedRarity=rarity;break;}
  }
  var rarityCards=groupCards.filter(function(c){return c.rarity===selectedRarity;});
  if(rarityCards.length===0)rarityCards=groupCards;
  return rarityCards[Math.floor(Math.random()*rarityCards.length)];
}

// ─── 字卡类型开关检查 ───
function isCardTypeEnabled(type){
  return _cardTypeSettings[type]!==false;
}

async function toggleCardType(type){
  _cardTypeSettings[type]=!_cardTypeSettings[type];
  try{
    await window.localforage.setItem('ml2_card_type_settings',JSON.stringify(_cardTypeSettings));
    toast((_cardTypeSettings[type]?'已开启':'已关闭')+({mood:'情绪字卡',heart:'心意字卡',intent:'交流意图字卡'}[type]||type));
  }catch(e){
    toast('保存失败');
  }
  renderCardTypeSwitches();
}

async function loadCardTypeSettings(){
  try{
    var saved=await window.localforage.getItem('ml2_card_type_settings');
    if(saved)_cardTypeSettings=JSON.parse(saved);
  }catch(e){
    _cardTypeSettings={mood:true,heart:true,intent:true};
  }
}

function renderCardTypeSwitches(){
  var container=$('card-type-switches');
  if(!container)return;
  var types=[
    {key:'mood',label:'💭 情绪字卡'},
    {key:'heart',label:'❤️ 心意字卡'},
    {key:'intent',label:'💬 交流意图字卡'}
  ];
  var html='';
  types.forEach(function(t){
    var isOn=_cardTypeSettings[t.key]!==false;
    html+='<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--c2);border-radius:10px;margin-bottom:8px;">';
    html+='<span style="font-size:13px;color:var(--txt);">'+t.label+'</span>';
    html+='<button onclick="toggleCardType(\''+t.key+'\')" class="toggle-btn '+(isOn?'toggle-on':'toggle-off')+'" style="width:40px;height:22px;border-radius:11px;border:none;cursor:pointer;position:relative;flex-shrink:0;">';
    html+='<span style="position:absolute;top:2px;width:18px;height:18px;border-radius:50%;background:white;box-shadow:0 1px 2px rgba(0,0,0,0.2);transition:left 0.2s;left:'+(isOn?'20px':'2px')+';"></span>';
    html+='</button>';
    html+='</div>';
  });
  container.innerHTML=html;
}

// ─── 交流意图字卡存储 ───
async function loadIntentCards(){
  try{
    var data=null;
    if(window.localforage){data=await window.localforage.getItem('ml2_intent_cards');}
    if(!data){var lsData=safeGetItem('ml2_lf_ml2_intent_cards');if(lsData)try{data=JSON.parse(lsData);}catch(e){}}
    if(!data||!Array.isArray(data)){data=[];}
    return data;
  }catch(e){return [];}
}

async function saveIntentCards(cards){
  try{
    ls('ml2_intent_cards',cards);
    if(window.localforage){await window.localforage.setItem('ml2_intent_cards',cards);}
  }catch(e){}
}

async function seedDefaultIntentCards(){
  try{
    var savedVersion=safeGetItem('ml2_intent_cards_version');
    if(savedVersion!==_intentCardsVersion){
      var newCards=[];
      _defaultIntentCards.forEach(function(g){
        g.cards.forEach(function(card){
          newCards.push({content:card.content,group:g.group,emoji:g.emoji,rarity:card.rarity});
        });
      });
      await saveIntentCards(newCards);
      safeSetItem('ml2_intent_cards_version',_intentCardsVersion);
      return newCards;
    }
    var existing=await loadIntentCards();
    var added=0;
    _defaultIntentCards.forEach(function(g){
      g.cards.forEach(function(card){
        var exists=existing.some(function(c){return c.content===card.content&&c.group===g.group});
        if(!exists){existing.push({content:card.content,group:g.group,emoji:g.emoji,rarity:card.rarity});added++;}
      });
    });
    if(added>0){await saveIntentCards(existing);}
    return existing;
  }catch(e){return [];}
}

async function getRandomIntentCard(targetId, heartCard){
  if(!isCardTypeEnabled('intent'))return null;
  // 20%概率显示交流意图
  if(Math.random()*100>20)return null;
  var cards=await loadIntentCards();
  if(!cards||cards.length===0){
    cards=await seedDefaultIntentCards();
    if(!cards||cards.length===0)return null;
  }
  var totalWeight=0;
  var pool=_defaultIntentCards;
  // 如果提供了心意字卡，使用心意→意图映射
  if(heartCard&&heartCard.group){
    var mappedPool=_heartToIntentMapping[heartCard.group];
    if(mappedPool&&mappedPool.length>0){
      pool=mappedPool;
    }
  }
  pool.forEach(function(g){totalWeight+=g.weight;});
  var rand=Math.random()*totalWeight;
  var cumulative=0;
  var selectedGroup=null;
  for(var i=0;i<pool.length;i++){
    cumulative+=pool[i].weight;
    if(rand<=cumulative){selectedGroup=pool[i].group;break;}
  }
  if(!selectedGroup)return null;
  var groupCards=cards.filter(function(c){return c.group===selectedGroup});
  if(groupCards.length===0)return null;
  // 稀有度加权选择
  var rarityRoll=Math.random()*100;
  var rarityCumulative=0;
  var selectedRarity='normal';
  for(var rarity in _rarityWeights){
    if(!_rarityWeights.hasOwnProperty(rarity))continue;
    rarityCumulative+=_rarityWeights[rarity];
    if(rarityRoll<=rarityCumulative){selectedRarity=rarity;break;}
  }
  var rarityCards=groupCards.filter(function(c){return c.rarity===selectedRarity;});
  if(rarityCards.length===0)rarityCards=groupCards;
  // 特殊卡冷却检查
  if(selectedRarity==='special'&&targetId){
    var cooledCards=rarityCards.filter(function(c){
      return !isSpecialCardOnCooldown(targetId, c.content);
    });
    if(cooledCards.length>0)rarityCards=cooledCards;
  }
  var picked=rarityCards[Math.floor(Math.random()*rarityCards.length)];
  // 特殊卡冷却追踪
  if(picked&&picked.rarity==='special'&&targetId){
    if(!_specialCardCooldown[targetId])_specialCardCooldown[targetId]={};
    _specialCardCooldown[targetId][picked.content]=Date.now();
  }
  return picked;
}

async function openMoodCardsSettings(){
  await seedDefaultMoodCards();
  await seedDefaultHeartCards();
  await seedDefaultIntentCards();
  await loadHeartCardHistory();
  await loadMoodCardContactSettings();
  await loadCardTypeSettings();
  showPg('pg-mood-cards-settings');
  switchMoodCardCategory('mood');
  renderMoodCardContactList();
  renderCardTypeSwitches();
}

var moodCardFoldedGroups={};
var currentMoodCardCategory='mood';

function switchMoodCardCategory(cat){
  currentMoodCardCategory=cat;
  // Update tab buttons
  var tabs=document.querySelectorAll('#mood-card-category-tabs .card-type-tab');
  tabs.forEach(function(t){t.classList.remove('sel');});
  var activeTab=document.getElementById('mood-cat-tab-'+cat);
  if(activeTab)activeTab.classList.add('sel');
  // Update info text
  var infoTitle=document.querySelector('#pg-mood-cards-settings [style*="font-weight:600"]');
  if(infoTitle){
    if(cat==='heart'){
      infoTitle.innerHTML='❤️ 聊天心意字卡库';
      var infoDesc=infoTitle.parentElement.querySelector('[style*="font-size:12px"]');
      if(infoDesc)infoDesc.textContent='聊天消息附带心意标签，表达TA想传递的方向。每条消息有40%概率附带一张心意字卡。';
    }else if(cat==='intent'){
      infoTitle.innerHTML='💬 聊天交流意图字卡库';
      var infoDesc=infoTitle.parentElement.querySelector('[style*="font-size:12px"]');
      if(infoDesc)infoDesc.textContent='聊天消息附带交流意图标签，表示TA这次想进行怎样的交流。每条消息有20%概率附带一张交流意图字卡。';
    }else{
      infoTitle.innerHTML='💡 聊天情绪字卡库';
      var infoDesc=infoTitle.parentElement.querySelector('[style*="font-size:12px"]');
      if(infoDesc)infoDesc.textContent='聊天消息附带情感标签，让对话更生动自然。每条消息有70%概率附带一张情绪字卡。';
    }
  }
  // Show/hide contact toggle (only for mood cards)
  var contactSection=document.querySelector('#pg-mood-cards-settings [style*="联系人开关"]');
  if(contactSection){
    contactSection.parentElement.style.display=(cat==='heart'||cat==='intent')?'none':'';
  }
  // Show/hide custom heart card section (only for heart)
  var customSection=$('custom-heart-cards-section');
  if(customSection){
    customSection.style.display=cat==='heart'?'block':'none';
    if(cat==='heart')renderCustomHeartCards();
  }
  renderMoodCardsList();
}

var moodCardContactSettings={};

async function loadMoodCardContactSettings(){
  try{
    var saved=await window.localforage.getItem('ml2_mood_card_contact_settings');
    if(saved)moodCardContactSettings=JSON.parse(saved);
  }catch(e){
    moodCardContactSettings={};
  }
}

async function saveMoodCardContactSettings(){
  try{
    await window.localforage.setItem('ml2_mood_card_contact_settings',JSON.stringify(moodCardContactSettings));
  }catch(e){
    console.warn('saveMoodCardContactSettings failed:',e);
  }
}

async function toggleMoodCardForContact(contactId){
  if(moodCardContactSettings[contactId]===undefined){
    moodCardContactSettings[contactId]=true;
  }else{
    moodCardContactSettings[contactId]=!moodCardContactSettings[contactId];
  }
  try{
    await saveMoodCardContactSettings();
    var isEnabled=moodCardContactSettings[contactId];
    toast(isEnabled?'已开启情绪字卡':'已关闭情绪字卡');
  }catch(e){
    toast('保存失败');
    console.warn('toggleMoodCardForContact failed:',e);
  }
  renderMoodCardContactList();
}

function renderMoodCardContactList(){
  var list=$('mood-card-contact-list');
  if(!list)return;
  
  var html='';
  contacts.forEach(function(c){
    var isEnabled=moodCardContactSettings[c.id]===undefined||moodCardContactSettings[c.id]===true;
    var toggleClass=isEnabled?'toggle-on':'toggle-off';
    html+='<div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:var(--c1);border-radius:8px;border:1px solid var(--border);">';
    html+='<span style="font-size:12px;color:var(--txt);max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+c.name+'</span>';
    html+='<button onclick="toggleMoodCardForContact(\''+c.id+'\')" class="toggle-btn '+toggleClass+'" style="width:36px;height:20px;border-radius:10px;border:none;cursor:pointer;position:relative;">';
    html+='<span style="position:absolute;top:2px;width:16px;height:16px;border-radius:50%;background:white;box-shadow:0 1px 2px rgba(0,0,0,0.2);transition:left 0.2s;left:'+(isEnabled?'18px':'2px')+';"></span>';
    html+='</button>';
    html+='</div>';
  });
  
  if(contacts.length===0){
    html='<div style="text-align:center;color:var(--txt3);font-size:12px;padding:10px;">暂无联系人</div>';
  }
  
  list.innerHTML=html;
}

var moodCardRenderTimeout=null;

async function renderMoodCardsList(filterGroup){
  if(moodCardRenderTimeout)clearTimeout(moodCardRenderTimeout);
  moodCardRenderTimeout=setTimeout(function(){
    _renderMoodCardsList(filterGroup);
  },30);
}

async function _renderMoodCardsList(filterGroup){
  var isHeart=currentMoodCardCategory==='heart';
  var isIntent=currentMoodCardCategory==='intent';
  var cards=isHeart?await loadHeartCards():(isIntent?await loadIntentCards():await loadMoodCards());
  var defaultGroups=isHeart?_defaultHeartCards:(isIntent?_defaultIntentCards:_defaultMoodCards);
  var filterSel=$('mood-card-group-filter');
  var list=$('mood-card-list');
  var empty=$('mood-card-empty');
  if(!list||!empty)return;
  
  var groups={};
  cards.forEach(function(c){
    if(!groups[c.group])groups[c.group]=[];
    groups[c.group].push(c);
  });
  
  defaultGroups.forEach(function(g){
    if(!groups[g.group])groups[g.group]=[];
  });
  
  var groupNames=Object.keys(groups);
  groupNames.sort(function(a,b){
    var idxA=defaultGroups.findIndex(function(g){return g.group===a});
    var idxB=defaultGroups.findIndex(function(g){return g.group===b});
    return (idxA>=0?idxA:999)-(idxB>=0?idxB:999);
  });
  
  if(filterSel){
    var currentVal=filterSel.value;
    var optHtml='<option value="all">全部分组</option>';
    groupNames.forEach(function(name){
      optHtml+='<option value="'+name.replace(/"/g,'&quot;')+'">'+name+'</option>';
    });
    filterSel.innerHTML=optHtml;
    if(groupNames.indexOf(currentVal)>=0)filterSel.value=currentVal;
  }
  
  if(cards.length===0){
    list.innerHTML='';
    empty.style.display='block';
    return;
  }
  empty.style.display='none';
  
  var html='';
  groupNames.forEach(function(groupName){
    var groupCards=groups[groupName];
    var currentFilter=filterSel?filterSel.value:'all';
    if(currentFilter!=='all'&&currentFilter!==groupName)return;
    if(groupCards.length===0)return;
    
    var isFolded=moodCardFoldedGroups[groupName]||false;
    var foldIcon=isFolded?'▼':'▲';
    
    html+='<div class="card-group" id="mood-group-'+groupName.replace(/\s/g,'_')+'" onclick="toggleMoodCardGroup(\''+groupName+'\')">';
    html+='<div class="card-group-header" style="touch-action:manipulation;">';
    html+='<span class="card-group-name">'+groupName+'</span>';
    html+='<span class="card-group-count">'+groupCards.length+'</span>';
    html+='<span class="card-group-arrow">'+foldIcon+'</span>';
    html+='</div>';
    
    if(!isFolded){
      html+='<div class="card-group-content">';
      groupCards.forEach(function(card,idx){
        var levelBadge='';
        if(isHeart&&card.level){
          var levelLabels={1:'Lv1',2:'Lv2',3:'Lv3'};
          var levelColors={1:'#9c8b7b',2:'#6b5d4f',3:'#c4a45a'};
          levelBadge='<span style="font-size:9px;color:'+levelColors[card.level]+';background:rgba(0,0,0,0.04);padding:1px 5px;border-radius:4px;margin-left:4px;flex-shrink:0;">'+levelLabels[card.level]+'</span>';
        }
        var specialBadge=card.isSpecial?'<span style="font-size:9px;color:#c4a45a;background:rgba(196,164,90,0.1);padding:1px 5px;border-radius:4px;margin-left:4px;flex-shrink:0;">稀有</span>':'';
        html+='<div class="card-item"><span class="card-content">'+(card.content||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</span>'+levelBadge+specialBadge+'<button class="card-delete-btn" style="touch-action:manipulation" onclick="event.stopPropagation();deleteMoodCard(\''+groupName+'\','+idx+')">×</button></div>';
      });
      html+='</div>';
    }else{
      html+='<div class="card-group-content folded"></div>';
    }
    html+='</div>';
  });
  
  list.innerHTML=html;
}

function toggleMoodCardGroup(groupName){
  moodCardFoldedGroups[groupName]=!moodCardFoldedGroups[groupName];
  renderMoodCardsList();
}

function toggleMoodCardGroups(forceFolded){
  var isHeart=currentMoodCardCategory==='heart';
  var isIntent=currentMoodCardCategory==='intent';
  var defaultGroups=isHeart?_defaultHeartCards:(isIntent?_defaultIntentCards:_defaultMoodCards);
  defaultGroups.forEach(function(g){
    moodCardFoldedGroups[g.group]=forceFolded;
  });
  renderMoodCardsList();
}

async function deleteMoodCard(groupName,idx){
  var isHeart=currentMoodCardCategory==='heart';
  var isIntent=currentMoodCardCategory==='intent';
  var cards=isHeart?await loadHeartCards():(isIntent?await loadIntentCards():await loadMoodCards());
  var groupCards=cards.filter(function(c){return c.group===groupName});
  if(idx<0||idx>=groupCards.length)return;
  var toDelete=groupCards[idx];
  cards=cards.filter(function(c){return !(c.content===toDelete.content&&c.group===toDelete.group)});
  if(isHeart){await saveHeartCards(cards);}else if(isIntent){await saveIntentCards(cards);}else{await saveMoodCards(cards);}
  toast('已删除字卡');
  renderMoodCardsList();
}

async function importMoodCards(){
  var isHeart=currentMoodCardCategory==='heart';
  var isIntent=currentMoodCardCategory==='intent';
  var input=$('mood-card-batch-input');
  var text=input.value.trim();
  if(!text){toast('请输入字卡内容');return;}
  var cards=isHeart?await loadHeartCards():(isIntent?await loadIntentCards():await loadMoodCards());
  var lines=text.split(/[\r\n]+/);
  var currentGroup='自定义';
  var added=0;
  lines.forEach(function(line){
    line=line.trim();
    if(!line)return;
    if(line.startsWith('【')&&line.endsWith('】')){
      currentGroup=line.substring(1,line.length-1);
      return;
    }
    var exists=cards.some(function(c){return c.content===line&&c.group===currentGroup});
    if(!exists){
      var newCard={content:line,group:currentGroup};
      if(isHeart)newCard.level=1;
      cards.push(newCard);
      added++;
    }
  });
  if(isHeart){await saveHeartCards(cards);}else if(isIntent){await saveIntentCards(cards);}else{await saveMoodCards(cards);}
  input.value='';
  toast('已导入 '+added+' 张字卡');
  renderMoodCardsList();
}

async function dedupMoodCards(){
  var isHeart=currentMoodCardCategory==='heart';
  var isIntent=currentMoodCardCategory==='intent';
  var cards=isHeart?await loadHeartCards():(isIntent?await loadIntentCards():await loadMoodCards());
  var seen={};
  var unique=[];
  var removed=0;
  cards.forEach(function(c){
    var key=c.group+'||'+c.content;
    if(seen[key]){removed++;return;}
    seen[key]=true;
    unique.push(c);
  });
  if(isHeart){await saveHeartCards(unique);}else if(isIntent){await saveIntentCards(unique);}else{await saveMoodCards(unique);}
  toast('已清除 '+removed+' 条重复字卡');
  renderMoodCardsList();
}

async function resetMoodCards(){
  var isHeart=currentMoodCardCategory==='heart';
  var isIntent=currentMoodCardCategory==='intent';
  if(!confirm('确定要恢复默认字卡吗？当前字卡将被覆盖。'))return;
  var newCards=[];
  if(isHeart){
    var defaultSource=_defaultHeartCards;
    defaultSource.forEach(function(g){
      g.cards.forEach(function(card){
        newCards.push({content:card.content,group:g.group,emoji:g.emoji,level:card.level,rarity:card.rarity});
      });
    });
    // 也加入特殊心意字卡
    _specialHeartCards.forEach(function(g){
      g.cards.forEach(function(card){
        newCards.push({content:card.content,group:g.group,emoji:g.emoji,level:card.level,isSpecial:true});
      });
    });
    await saveHeartCards(newCards);
    safeSetItem('ml2_heart_cards_version',_heartCardsVersion);
  }else if(isIntent){
    _defaultIntentCards.forEach(function(g){
      g.cards.forEach(function(card){
        newCards.push({content:card.content,group:g.group,emoji:g.emoji,rarity:card.rarity});
      });
    });
    await saveIntentCards(newCards);
    safeSetItem('ml2_intent_cards_version',_intentCardsVersion);
  }else{
    _defaultMoodCards.forEach(function(g){
      g.cards.forEach(function(card){
        newCards.push({content:card.content,group:g.group,rarity:card.rarity});
      });
    });
    await saveMoodCards(newCards);
    safeSetItem('ml2_mood_cards_version',_moodCardsVersion);
  }
  toast('已重置为默认字卡');
  renderMoodCardsList();
}

if($('mood-cards-back'))$('mood-cards-back').addEventListener('click',function(){showPg('pg-my')});
if($('mood-card-import-btn'))$('mood-card-import-btn').addEventListener('click',importMoodCards);
if($('mood-card-dedup-btn'))$('mood-card-dedup-btn').addEventListener('click',dedupMoodCards);
if($('mood-card-reset-btn'))$('mood-card-reset-btn').addEventListener('click',resetMoodCards);
if($('mood-card-help-btn'))$('mood-card-help-btn').addEventListener('click',function(){
  var modal=$('mood-card-help-modal');
  if(modal)modal.style.display='flex';
});

function closeMoodCardHelp(){
  var modal=$('mood-card-help-modal');
  if(modal)modal.style.display='none';
}

if($('mood-card-group-filter'))$('mood-card-group-filter').addEventListener('change',function(){
  renderMoodCardsList();
});

if($('mood-card-collapse-btn'))$('mood-card-collapse-btn').addEventListener('click',function(){
  toggleMoodCardGroups(true);
});

// 心意字卡分类切换事件
if($('mood-cat-tab-mood'))$('mood-cat-tab-mood').addEventListener('click',function(){switchMoodCardCategory('mood')});
if($('mood-cat-tab-heart'))$('mood-cat-tab-heart').addEventListener('click',function(){switchMoodCardCategory('heart')});
if($('mood-cat-tab-intent'))$('mood-cat-tab-intent').addEventListener('click',function(){switchMoodCardCategory('intent')});

// ─── 自定义心意字卡管理 ───
async function renderCustomHeartCards(){
  var list=$('custom-heart-card-list');
  var empty=$('custom-heart-card-empty');
  if(!list||!empty)return;
  var cards=await loadCustomHeartCards();
  if(cards.length===0){
    list.innerHTML='';
    empty.style.display='block';
    return;
  }
  empty.style.display='none';
  var html='';
  var levelLabels={1:'Lv1 轻微',2:'Lv2 普通',3:'Lv3 深层'};
  var weightLabels={0.25:'低',0.5:'普通',1:'高'};
  cards.forEach(function(card,idx){
    html+='<div class="card-item" style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--c2);border-radius:8px;margin-bottom:6px;border:2px solid transparent;">';
    html+='<span style="font-size:16px;">'+(card.icon||'❤️')+'</span>';
    html+='<div style="flex:1;min-width:0;">';
    html+='<div style="font-size:13px;color:var(--txt);">'+card.content+'</div>';
    html+='<div style="font-size:10px;color:var(--txt3);">'+(card.name||'')+' · '+card.group+' · '+levelLabels[card.level||1]+' · '+weightLabels[card.weight!==undefined?card.weight:0.5]+'</div>';
    html+='</div>';
    html+='<button class="card-delete-btn" style="touch-action:manipulation" onclick="event.stopPropagation();deleteCustomHeartCard('+idx+')">×</button>';
    html+='</div>';
  });
  list.innerHTML=html;
}

async function deleteCustomHeartCard(idx){
  var cards=await loadCustomHeartCards();
  if(idx<0||idx>=cards.length)return;
  cards.splice(idx,1);
  await saveCustomHeartCards(cards);
  toast('已删除自定义心意');
  renderCustomHeartCards();
}

async function addCustomHeartCard(){
  var name=$('custom-heart-name').value.trim();
  var icon=$('custom-heart-icon').value.trim();
  var content=$('custom-heart-content').value.trim();
  var group=$('custom-heart-group').value;
  var level=parseInt($('custom-heart-level').value)||1;
  var weight=parseFloat($('custom-heart-weight').value)||0.5;
  if(!content){toast('请输入内容');return;}
  var cards=await loadCustomHeartCards();
  cards.push({name:name||content,icon:icon||'❤️',content:content,group:group,level:level,weight:weight});
  await saveCustomHeartCards(cards);
  toast('已添加自定义心意');
  // 清空表单
  $('custom-heart-name').value='';
  $('custom-heart-icon').value='';
  $('custom-heart-content').value='';
  closeAddCustomHeartModal();
  renderCustomHeartCards();
}

function openAddCustomHeartModal(){
  var modal=$('add-custom-heart-modal');
  if(modal)modal.style.display='flex';
}
function closeAddCustomHeartModal(){
  var modal=$('add-custom-heart-modal');
  if(modal)modal.style.display='none';
}

// 事件绑定
if($('add-custom-heart-btn'))$('add-custom-heart-btn').addEventListener('click',openAddCustomHeartModal);
if($('add-custom-heart-close'))$('add-custom-heart-close').addEventListener('click',closeAddCustomHeartModal);
if($('add-custom-heart-modal'))$('add-custom-heart-modal').addEventListener('click',function(e){
  if(e.target===$('add-custom-heart-modal'))closeAddCustomHeartModal();
});
if($('add-custom-heart-confirm'))$('add-custom-heart-confirm').addEventListener('click',addCustomHeartCard);

async function seedDefaultNavCards(){
  try{
    var savedVersion=safeGetItem('ml2_nav_cards_version');
    if(savedVersion!==_navCardsVersion){
      safeRemoveItem('ml2_nav_cards_public');
      safeRemoveItem('ml2_lf_ml2_nav_cards_public');
      if(window.localforage){try{await window.localforage.removeItem('ml2_nav_cards_public');}catch(e){}}
      safeSetItem('ml2_nav_cards_version',_navCardsVersion);
      console.log('[navCards] version changed from',savedVersion,'to',_navCardsVersion,'- resetting cards');
    }
    var existing=await getNavCards('public',null);
    var removed=0;
    var beforeLen=existing.length;
    existing=existing.filter(function(c){
      var shouldRemove=_oldDefaultNavCardsToRemove.some(function(r){return r.content===c.content&&r.category===c.category});
      if(shouldRemove)removed++;
      return !shouldRemove;
    });
    var added=0;
    _defaultNavCards.forEach(function(dc){
      var exists=existing.some(function(c){return c.content===dc.content&&c.category===dc.category});
      if(!exists){
        existing.push({content:dc.content,group:dc.group||'默认',category:dc.category});
        added++;
      }
    });
    if(removed>0||added>0){
      await saveNavCards(existing,'public',null);
      console.log('[navCards] seeded:',added,'added,',removed,'removed');
    }
  }catch(e){console.warn('seedDefaultNavCards failed:',e);}
}

async function resetNavCardsToDefault(){
  try{
    safeRemoveItem('ml2_nav_cards_public');
    safeRemoveItem('ml2_lf_ml2_nav_cards_public');
    if(window.localforage){
      try{await window.localforage.removeItem('ml2_nav_cards_public');}catch(e){}
    }
    var newCards=_defaultNavCards.map(function(dc){return {content:dc.content,group:dc.group||'默认',category:dc.category}});
    await saveNavCards(newCards,'public',null);
    console.log('[navCards] reset to default:',newCards.length,'cards');
    toast('已重置为默认字卡');
    if(typeof renderNavCards==='function')renderNavCards();
  }catch(e){console.warn('resetNavCardsToDefault failed:',e);}
}

async function getNavCards(type,contactId){
  var key='ml2_nav_cards_'+type;
  if(type==='private'&&contactId){
    key+='_'+contactId;
  }
  var result=[];
  // 直接从 localStorage 读（绕过 Storage 缓存，避免 restoreFromDB 空数据污染）
  var directRaw=safeGetItem(key);
  if(directRaw){
    try{var dp=JSON.parse(directRaw);if(dp&&Array.isArray(dp))result=dp;}catch(e){}
  }
  var lfPrefix=safeGetItem('ml2_lf_'+key);
  if(lfPrefix){
    try{var lp=JSON.parse(lfPrefix);if(lp&&Array.isArray(lp)&&lp.length>result.length)result=lp;}catch(e){}
  }
  // 再用 ls (Storage 缓存) 作为补充——只在上面都没数据时
  if(result.length===0){
    var lsData=ls(key);
    if(lsData&&Array.isArray(lsData)&&lsData.length>0){result=lsData;}
  }
  // 最后用 IndexedDB 兜底（直接检查 window.localforage，不依赖 isLFAvailable()，
  // 避免初始化阶段 _lfReady 未就绪时跳过 IndexedDB 读取导致数据丢失）
  if(result.length===0&&window.localforage){
    try{
      var stored=await window.localforage.getItem(key);
      if(stored){
        if(typeof stored==='string'){
          try{var parsed=JSON.parse(stored);if(parsed&&Array.isArray(parsed)&&parsed.length>0)result=parsed;}catch(e){}
        }else if(stored&&Array.isArray(stored)&&stored.length>0){
          result=stored;
        }
      }
    }catch(e){}
  }
  console.log('[navCards] get',key,'found',result.length,'cards');
  return result;
}

async function saveNavCards(cards,type,contactId){
  var key='ml2_nav_cards_'+type;
  if(type==='private'&&contactId){
    key+='_'+contactId;
  }
  ls(key,cards);
  if(window.localforage){
    try{await window.localforage.setItem(key,cards);}catch(e){console.warn('[navCards] save to IndexedDB failed:',e);}
  }
  console.log('[navCards] saved',key,cards.length,'cards');
  resetNavDisplayTimers();
  await checkNavDisplay();
}

function getNavCardGroups(type){
  if(type==='public'){
    return navCardGroups.public||['默认'];
  }else if(type==='private'){
    if(navCardCurrentContact && navCardGroups.private[navCardCurrentContact]){
      return navCardGroups.private[navCardCurrentContact];
    }
    return ['默认'];
  }
  return ['默认'];
}

function addNavCardGroup(name){
  var groups=getNavCardGroups(navCardCurrentType);
  if(!groups.includes(name)){
    groups.push(name);
    if(navCardCurrentType==='public'){
      navCardGroups.public=groups;
    }else if(navCardCurrentContact){
      navCardGroups.private[navCardCurrentContact]=groups;
    }
    saveNavCardGroups();
    renderNavCardGroupTags();
    renderNavCards();
  }
}

async function deleteNavCardGroup(name){
  if(name==='默认')return;
  var groups=getNavCardGroups(navCardCurrentType);
  var idx=groups.indexOf(name);
  if(idx>-1){
    groups.splice(idx,1);
    if(navCardCurrentType==='public'){
      navCardGroups.public=groups;
    }else if(navCardCurrentContact){
      navCardGroups.private[navCardCurrentContact]=groups;
    }
    saveNavCardGroups();
    
    var cards=await getNavCards(navCardCurrentType,navCardCurrentContact);
    cards=cards.filter(function(c){return c.group!==name});
    await saveNavCards(cards,navCardCurrentType,navCardCurrentContact);
    
    if(navCardCurrentGroup===name){
      navCardCurrentGroup='all';
    }
    renderNavCardGroupTags();
    renderNavCards();
  }
}

function showAddNavGroupModal(){
  var name=prompt('请输入分组名称：');
  if(name&&name.trim()){
    addNavCardGroup(name.trim());
  }
}

function renderNavCardTypeTabs(){
  var tabs=document.querySelectorAll('#nav-card-type-tabs .card-type-tab');
  tabs.forEach(function(tab){
    if(tab.dataset.type===navCardCurrentType){
      tab.classList.add('sel');
    }else{
      tab.classList.remove('sel');
    }
    tab.onclick=function(){
      navCardCurrentType=this.dataset.type;
      navCardCurrentContact=null;
      navCardCurrentCategory='all';
      navCardCurrentGroup='all';
      renderNavCardTypeTabs();
      renderNavCardCategoryTabs();
      renderNavCardContactSelect();
      renderNavCardGroupTags();
      renderNavCards();
    };
  });
}

function renderNavCardContactSelect(){
  var wrap=$('nav-card-contact-select-wrap');
  var tags=$('nav-card-contact-tags');

  if(navCardCurrentType==='private'){
    wrap.style.display='block';
    var html='';

    // 自动检测未绑定的专享字卡并创建联系人（与聊天字卡库一致）
    // ★ 修复：cardPrivateContacts 未从 IndexedDB 恢复完成前禁止自动检测，避免误判覆盖真实绑定
    var unboundNavCards=[];
    if(_cardPrivateContactsReady||cardPrivateContacts.length>0){
      unboundNavCards=globalCards.filter(function(c){return c.type==='private'&&c.contactId&&!cardPrivateContacts.some(function(pc){return pc.id===c.contactId})});
    }
    if(unboundNavCards.length>0){
      var unboundIds=[];
      unboundNavCards.forEach(function(c){if(unboundIds.indexOf(c.contactId)===-1)unboundIds.push(c.contactId)});
      unboundIds.forEach(function(cid){
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
        var isSelected=navCardCurrentContact===pc.id;
        var bindContact=pc.bindContactId?contacts.find(function(c){return c.id===pc.bindContactId}):null;

        // 头像渐变颜色
        var avatarColors=['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#98D8C8','#F7DC6F','#BB8FCE','#85C1E9'];
        var colorIdx=pcIdx%avatarColors.length;
        var avatarBg=avatarColors[colorIdx];

        html+='<div class="private-contact-row" data-cid="'+pc.id+'" style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;background:var(--c1);cursor:pointer;border:1.5px solid '+(isSelected?'var(--accent)':'var(--border)')+';transition:all 0.2s ease;box-shadow:'+(isSelected?'0 2px 8px rgba(0,150,255,0.08)':'none')+';">';

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
          html+='<button onclick="event.stopPropagation();showBindContactModal(\''+pc.id+'\')" style="padding:4px 10px;font-size:10px;background:rgba(0,150,255,0.08);color:var(--accent);border:1px solid rgba(0,150,255,0.2);border-radius:6px;cursor:pointer;transition:all 0.15s;font-weight:500;">换绑</button>';
          html+='<button onclick="event.stopPropagation();unbindPrivateContact(\''+pc.id+'\')" style="padding:4px 10px;font-size:10px;background:rgba(255,77,79,0.06);color:#ff4d4f;border:1px solid rgba(255,77,79,0.2);border-radius:6px;cursor:pointer;transition:all 0.15s;font-weight:500;">解绑</button>';
        }else{
          html+='<button onclick="event.stopPropagation();showBindContactModal(\''+pc.id+'\')" style="padding:4px 12px;font-size:10px;background:var(--accent);color:#fff;border:none;border-radius:6px;cursor:pointer;transition:all 0.15s;font-weight:500;">+ 绑定</button>';
        }
        html+='<button onclick="event.stopPropagation();deletePrivateContact(\''+pc.id+'\')" style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:10px;background:transparent;color:var(--txt4);border:none;border-radius:6px;cursor:pointer;transition:all 0.15s;">✕</button>';
        html+='</div>';

        html+='</div>';
      });
      html+='</div>';
    }

    html+='<button id="add-nav-private-contact-btn" style="width:100%;padding:10px 0;border-radius:10px;border:1.5px dashed var(--border);color:var(--txt2);cursor:pointer;font-size:13px;background:var(--c1);transition:all 0.15s;font-weight:500;">+ 新建字卡联系人</button>';

    tags.innerHTML=html;

    tags.querySelector('#add-nav-private-contact-btn').addEventListener('click',function(){
      customPrompt('请输入字卡联系人昵称：','').then(function(name){
        if(!name)return;
        name=name.trim();
        if(!name){toast('请输入昵称');return}
        var newPc={id:'pc_'+Date.now(),name:name,bindContactId:null};
        cardPrivateContacts.push(newPc);
        saveCardPrivateContacts();
        navCardCurrentContact=newPc.id;
        renderNavCardContactSelect();
        renderNavCardGroupTags();
        renderNavCards();
        toast('已添加字卡联系人「'+name+'」');
      });
    });

    tags.querySelectorAll('.private-contact-row').forEach(function(row){
      row.addEventListener('click',function(){
        var cid=this.dataset.cid;
        tags.querySelectorAll('.private-contact-row').forEach(function(x){
          x.style.borderColor='var(--border)';
          x.style.boxShadow='none';
        });
        this.style.borderColor='var(--accent)';
        this.style.boxShadow='0 2px 8px rgba(0,150,255,0.08)';
        navCardCurrentContact=cid;
        navCardCurrentGroup='all';
        renderNavCardGroupTags();
        renderNavCards();
      });
    });
  }else{
    wrap.style.display='none';
  }
}

function selectNavCardContact(contactId){
  navCardCurrentContact=navCardCurrentContact===contactId?null:contactId;
  renderNavCardContactSelect();
  renderNavCardGroupTags();
  renderNavCards();
}

function renderNavCardCategoryTabs(){
  var tabs=document.querySelectorAll('#nav-card-category-tabs .card-category-tab');
  tabs.forEach(function(tab){
    if(tab.dataset.category===navCardCurrentCategory){
      tab.classList.add('sel');
    }else{
      tab.classList.remove('sel');
    }
    tab.onclick=function(){
      navCardCurrentCategory=this.dataset.category;
      navCardCurrentGroup='all';
      renderNavCardCategoryTabs();
      renderNavCardGroupTags();
      renderNavCards();
    };
  });
}

function renderNavCardGroupTags(){
  var tags=$('nav-card-group-tags');
  var groups=getNavCardGroups(navCardCurrentType);
  if(tags){
    tags.innerHTML=groups.map(function(g){
      return '<div style="display:flex;align-items:center;gap:4px;"><button class="card-tag'+(navCardCurrentGroup===g?' sel':'')+'" onclick="selectNavCardGroup(\''+g+'\')">'+g+'</button><button class="btn-nav" style="font-size:12px;" onclick="deleteNavCardGroup(\''+g+'\')">×</button></div>';
    }).join('');
  }
  
  var filter=$('nav-card-group-filter');
  if(filter){
    var options=['all'].concat(groups);
    filter.innerHTML=options.map(function(g){
      return '<option value="'+g+'"'+(navCardCurrentGroup===g?' selected':'')+'>'+(g==='all'?'全部分组':g)+'</option>';
    }).join('');
  }
}

function selectNavCardGroup(group){
  navCardCurrentGroup=group;
  renderNavCardGroupTags();
  renderNavCards();
}

function toggleNavCardGroupCollapse(group){
  if(navCardCollapsedGroups[group]){
    delete navCardCollapsedGroups[group];
  }else{
    navCardCollapsedGroups[group]=true;
  }
  renderNavCards();
}

function collapseAllNavCardGroups(){
  var groups=getNavCardGroups(navCardCurrentType);
  groups.forEach(function(g){
    navCardCollapsedGroups[g]=true;
  });
  renderNavCards();
}

function expandAllNavCardGroups(){
  navCardCollapsedGroups={};
  renderNavCards();
}

async function renderNavCards(){
  var cards=await getNavCards(navCardCurrentType,navCardCurrentContact);
  
  if(navCardCurrentCategory!=='all'){
    cards=cards.filter(function(c){return c.category&&c.category===navCardCurrentCategory});
  }
  
  if(navCardCurrentGroup!=='all'){
    cards=cards.filter(function(c){return c.group&&c.group===navCardCurrentGroup});
  }
  
  if(navCardCurrentType==='private'&&navCardCurrentContact){
    var publicCards=await getNavCards('public',null);
    cards=cards.filter(function(c){
      return !publicCards.some(function(pc){return pc.content===c.content&&pc.group===c.group&&pc.category===c.category});
    });
  }
  
  var searchKeyword=$('nav-card-search-input')?$('nav-card-search-input').value.trim():'';
  if(searchKeyword){
    cards=cards.filter(function(c){
      return c.content&&c.content.toLowerCase().indexOf(searchKeyword.toLowerCase())>-1;
    });
  }
  
  var list=$('nav-card-list');
  var empty=$('nav-card-empty');
  
  list.innerHTML='';
  if(cards.length===0){
    empty.style.display='block';
    return;
  }
  empty.style.display='none';
  
  var grouped={};
  cards.forEach(function(c){
    var group=c.group||'默认';
    if(!grouped[group])grouped[group]=[];
    grouped[group].push(c);
  });
  
  var groups=Object.keys(grouped);
  groups.forEach(function(group){
    
    var groupCards=grouped[group];
    var isCollapsed=navCardCollapsedGroups[group];
    
    var groupEl=document.createElement('div');
    groupEl.className='card-group';
    groupEl.innerHTML='<div class="card-group-header" onclick="toggleNavCardGroupCollapse(\''+group+'\')"><span class="card-group-name">📁 '+group+'</span><span class="card-group-count">'+groupCards.length+' 张</span><span class="card-group-actions"><button class="btn-nav" style="font-size:14px;" onclick="event.stopPropagation();moveNavCardGroupUp(\''+group+'\')">↑</button><button class="btn-nav" style="font-size:14px;" onclick="event.stopPropagation();moveNavCardGroupDown(\''+group+'\')">↓</button><span class="card-group-arrow">'+(isCollapsed?'▶':'▼')+'</span></span></div>';
    
    if(!isCollapsed){
      var cardsEl=document.createElement('div');
      cardsEl.className='card-group-items';
      groupCards.forEach(function(card,idx){
        var el=document.createElement('div');
        var cardId=(card.id||('nav_'+card.group+'_'+card.content+'_'+idx));
        var isSelected=navBatchSelectedCards.indexOf(cardId)>=0;
        el.className='card-item'+(isSelected?' selected':'');
        el.setAttribute('data-id',cardId);
        el.setAttribute('data-idx',idx);
        el.setAttribute('data-group',group);
        el.onclick=function(e){
          if(e.target.closest('button'))return;
          toggleNavBatchCard(cardId);
        };
        var categoryIcon='📝';
        switch(card.category){
          case 'weather':categoryIcon='☀️';break;
          case 'time':categoryIcon='⏰';break;
          case 'status':categoryIcon='💬';break;
          case 'idle':categoryIcon='🌙';break;
          case 'mood':categoryIcon='😊';break;
        }
        el.innerHTML='<span class="card-check">'+(isSelected?'✓':'')+'</span><span class="card-content">'+categoryIcon+' '+card.content+'</span><div class="card-actions"><button class="btn-nav" style="touch-action:manipulation" onclick="event.stopPropagation();editNavCard(\''+group+'\','+idx+')">✏️</button><button class="btn-nav" style="touch-action:manipulation" onclick="event.stopPropagation();deleteNavCard(\''+group+'\','+idx+')">🗑️</button></div>';
        cardsEl.appendChild(el);
      });
      groupEl.appendChild(cardsEl);
    }
    
    list.appendChild(groupEl);
  });
  
  updateNavBatchSelectionUI();
}

function selectAllNavBatchCards(){
  var allCards=[];
  var containers=document.querySelectorAll('#nav-card-list .card-item');
  containers.forEach(function(el){
    var cid=el.getAttribute('data-id');
    if(cid)allCards.push(cid);
  });
  
  if(navBatchSelectedCards.length===allCards.length&&allCards.length>0){
    navBatchSelectedCards=[];
  }else{
    navBatchSelectedCards=allCards.slice();
  }
  
  var selectAllBtn=$('nav-batch-select-all-btn');
  if(selectAllBtn)selectAllBtn.textContent=navBatchSelectedCards.length===allCards.length&&allCards.length>0?'取消全选':'全选';
  
  updateNavBatchSelectionUI();
  renderNavCards();
}

async function moveNavBatchCardsToGroup(){
  var groupSelect=$('nav-batch-move-group-select');
  if(!groupSelect)return;
  var targetGroup=groupSelect.value;
  if(!targetGroup){
    toast('请选择目标分组');
    return;
  }
  if(navBatchSelectedCards.length===0){
    toast('请先选择字卡');
    return;
  }
  
  if(!confirm('确定将 '+navBatchSelectedCards.length+' 张字卡移动到分组"'+targetGroup+'"吗？'))return;
  
  var cards=await getNavCards(navCardCurrentType,navCardCurrentContact);
  var moveCount=0;
  
  var selectedMap={};
  navBatchSelectedCards.forEach(function(cardId){
    var parts=cardId.split('_');
    var idx=parseInt(parts[parts.length-1]);
    var group=parts[parts.length-2];
    var content=parts.slice(1,parts.length-2).join('_');
    if(!selectedMap[group])selectedMap[group]=[];
    selectedMap[group].push({content:content,idx:idx});
  });
  
  cards.forEach(function(card){
    var group=card.group||'默认';
    if(selectedMap[group]){
      selectedMap[group].forEach(function(s){
        if(card.content===s.content){
          card.group=targetGroup;
          moveCount++;
        }
      });
    }
  });
  
  await saveNavCards(cards,navCardCurrentType,navCardCurrentContact);
  navBatchSelectedCards=[];
  updateNavBatchSelectionUI();
  renderNavCards();
  toast('已移动 '+moveCount+' 张字卡');
}

async function deleteNavBatchCards(){
  if(navBatchSelectedCards.length===0){
    toast('请先选择字卡');
    return;
  }
  if(!confirm('确定要删除选中的 '+navBatchSelectedCards.length+' 张字卡吗？此操作不可撤销。'))return;
  
  var cards=await getNavCards(navCardCurrentType,navCardCurrentContact);
  var deleteCount=0;
  
  var selectedMap={};
  navBatchSelectedCards.forEach(function(cardId){
    var parts=cardId.split('_');
    var idx=parseInt(parts[parts.length-1]);
    var group=parts[parts.length-2];
    var content=parts.slice(1,parts.length-2).join('_');
    if(!selectedMap[group])selectedMap[group]=[];
    selectedMap[group].push({content:content,idx:idx});
  });
  
  cards=cards.filter(function(card){
    var group=card.group||'默认';
    if(selectedMap[group]){
      var matches=selectedMap[group].some(function(s){
        return card.content===s.content;
      });
      if(matches)deleteCount++;
      return !matches;
    }
    return true;
  });
  
  await saveNavCards(cards,navCardCurrentType,navCardCurrentContact);
  navBatchSelectedCards=[];
  updateNavBatchSelectionUI();
  renderNavCards();
  toast('已删除 '+deleteCount+' 张字卡');
}

function updateNavBatchSelectionUI(){
  var bar=$('nav-batch-ops-bar');
  var countEl=$('nav-batch-selected-count');
  var groupSelect=$('nav-batch-move-group-select');
  
  if(navBatchSelectedCards.length>0){
    bar.style.display='block';
    countEl.textContent='已选 '+navBatchSelectedCards.length+' 张';
    
    var groups=getNavCardGroups(navCardCurrentType);
    groupSelect.innerHTML='<option value="">移动到分组...</option>'+groups.map(function(g){
      return '<option value="'+g+'">'+g+'</option>';
    }).join('');
  }else{
    bar.style.display='none';
  }
}

function toggleNavBatchCard(cardId){
  var idx=navBatchSelectedCards.indexOf(cardId);
  if(idx>=0){
    navBatchSelectedCards.splice(idx,1);
  }else{
    navBatchSelectedCards.push(cardId);
  }
  
  var selectAllBtn=$('nav-batch-select-all-btn');
  if(selectAllBtn){
    var allCards=[];
    var containers=document.querySelectorAll('#nav-card-list .card-item');
    containers.forEach(function(el){
      var cid=el.getAttribute('data-id');
      if(cid)allCards.push(cid);
    });
    selectAllBtn.textContent=navBatchSelectedCards.length===allCards.length&&allCards.length>0?'取消全选':'全选';
  }
  
  updateNavBatchSelectionUI();
  renderNavCards();
}

async function addNavCard(){
  var content=prompt('请输入顶部栏字卡内容：');
  if(!content||!content.trim())return;

  var category=navCardCurrentCategory;
  if(category==='all'||!category){
    // 当未选择具体分类时,要求用户选择
    var pick=prompt('请选择字卡分类(填数字):\n1.天气  2.时间  3.对方状态  4.空闲状态  5.心情状态  6.其他','1');
    var map={'1':'weather','2':'time','3':'status','4':'idle','5':'mood','6':'other'};
    category=map[pick];
    if(!category){toast('已取消添加');return;}
  }

  var cards=await getNavCards(navCardCurrentType,navCardCurrentContact);
  cards.push({
    content:content.trim(),
    group:navCardCurrentGroup==='all'?'默认':navCardCurrentGroup,
    category:category
  });
  await saveNavCards(cards,navCardCurrentType,navCardCurrentContact);
  renderNavCards();
  toast('字卡已添加');
}

async function editNavCard(group,index){
  var cards=await getNavCards(navCardCurrentType,navCardCurrentContact);
  var groupCards=cards.filter(function(c){return c.group===group});
  if(groupCards[index]){
    var newContent=prompt('编辑字卡内容：',groupCards[index].content);
    if(newContent!==null){
      groupCards[index].content=newContent.trim();
      var allCards=[];
      var allGroups=cards.map(function(c){return c.group||'默认'}).filter(function(v,i,a){return a.indexOf(v)===i});
      allGroups.forEach(function(g){
        if(g===group){
          allCards=allCards.concat(groupCards);
        }else{
          allCards=allCards.concat(cards.filter(function(c){return(c.group||'默认')===g}));
        }
      });
      await saveNavCards(allCards,navCardCurrentType,navCardCurrentContact);
      renderNavCards();
    }
  }
}

async function deleteNavCard(group,index){
  var cards=await getNavCards(navCardCurrentType,navCardCurrentContact);
  var groupCards=cards.filter(function(c){return c.group===group});
  if(groupCards[index]){
    groupCards.splice(index,1);
    var allCards=[];
    var allGroups=cards.map(function(c){return c.group||'默认'}).filter(function(v,i,a){return a.indexOf(v)===i});
    allGroups.forEach(function(g){
      if(g===group){
        allCards=allCards.concat(groupCards);
      }else{
        allCards=allCards.concat(cards.filter(function(c){return(c.group||'默认')===g}));
      }
    });
    await saveNavCards(allCards,navCardCurrentType,navCardCurrentContact);
    renderNavCards();
  }
}

async function moveNavCardUp(group,index){
  if(index===0)return;
  var cards=await getNavCards(navCardCurrentType,navCardCurrentContact);
  var groupCards=cards.filter(function(c){return c.group===group});
  var temp=groupCards[index];
  groupCards[index]=groupCards[index-1];
  groupCards[index-1]=temp;
  var allCards=[];
  var allGroups=cards.map(function(c){return c.group||'默认'}).filter(function(v,i,a){return a.indexOf(v)===i});
  allGroups.forEach(function(g){
    if(g===group){
      allCards=allCards.concat(groupCards);
    }else{
      allCards=allCards.concat(cards.filter(function(c){return(c.group||'默认')===g}));
    }
  });
  await saveNavCards(allCards,navCardCurrentType,navCardCurrentContact);
  renderNavCards();
}

async function moveNavCardDown(group,index){
  var cards=await getNavCards(navCardCurrentType,navCardCurrentContact);
  var groupCards=cards.filter(function(c){return c.group===group});
  if(index===groupCards.length-1)return;
  var temp=groupCards[index];
  groupCards[index]=groupCards[index+1];
  groupCards[index+1]=temp;
  var allCards=[];
  var allGroups=cards.map(function(c){return c.group||'默认'}).filter(function(v,i,a){return a.indexOf(v)===i});
  allGroups.forEach(function(g){
    if(g===group){
      allCards=allCards.concat(groupCards);
    }else{
      allCards=allCards.concat(cards.filter(function(c){return(c.group||'默认')===g}));
    }
  });
  await saveNavCards(allCards,navCardCurrentType,navCardCurrentContact);
  renderNavCards();
}

function moveNavCardGroupUp(group){
  var groups=getNavCardGroups(navCardCurrentType);
  var idx=groups.indexOf(group);
  if(idx<=0)return;
  var temp=groups[idx];
  groups[idx]=groups[idx-1];
  groups[idx-1]=temp;
  if(navCardCurrentType==='public'){
    navCardGroups.public=groups;
  }else if(navCardCurrentContact){
    navCardGroups.private[navCardCurrentContact]=groups;
  }
  saveNavCardGroups();
  renderNavCards();
}

function moveNavCardGroupDown(group){
  var groups=getNavCardGroups(navCardCurrentType);
  var idx=groups.indexOf(group);
  if(idx===groups.length-1)return;
  var temp=groups[idx];
  groups[idx]=groups[idx+1];
  groups[idx+1]=temp;
  if(navCardCurrentType==='public'){
    navCardGroups.public=groups;
  }else if(navCardCurrentContact){
    navCardGroups.private[navCardCurrentContact]=groups;
  }
  saveNavCardGroups();
  renderNavCards();
}

async function exportNavCards(){
  var cards=await getNavCards(navCardCurrentType,navCardCurrentContact);
  var exportData={
    version:'1.0',
    exportTime:new Date().toISOString(),
    type:navCardCurrentType,
    contactId:navCardCurrentContact,
    groups:getNavCardGroups(navCardCurrentType),
    cards:cards
  };
  
  var jsonStr=JSON.stringify(exportData,null,2);
  var blob=new Blob([jsonStr],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;
  a.download='星言顶部栏字卡_'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('顶部栏字卡已导出');
}

async function importNavCardsFromText(){
  var text=$('nav-card-batch-input').value.trim();
  if(!text){
    toast('请输入字卡内容');
    return;
  }
  
  var category=navCardCurrentCategory;
  if(category==='all'||!category){
    var pick=prompt('请选择字卡分类(填数字):\n1.天气  2.时间  3.对方状态  4.空闲状态  5.心情状态  6.其他','1');
    var map={'1':'weather','2':'time','3':'status','4':'idle','5':'mood','6':'other'};
    category=map[pick];
    if(!category){toast('已取消导入');return;}
  }
  
  var lines=text.split('\n').filter(function(line){return line.trim()});
  var cards=await getNavCards(navCardCurrentType,navCardCurrentContact);
  var added=0;
  
  lines.forEach(function(line){
    var trimmed=line.trim();
    var exists=cards.some(function(c){return c.content===trimmed&&c.category===category});
    if(!exists){
      cards.push({
        content:trimmed,
        group:navCardCurrentGroup==='all'?'默认':navCardCurrentGroup,
        category:category
      });
      added++;
    }
  });
  
  await saveNavCards(cards,navCardCurrentType,navCardCurrentContact);
  renderNavCards();
  $('nav-card-batch-input').value='';
  toast('成功导入 '+added+' 张字卡');
}

async function clearNavCards(){
  if(!confirm('确定清空当前顶部栏字卡？'))return;
  await saveNavCards([],navCardCurrentType,navCardCurrentContact);
  renderNavCards();
  toast('顶部栏字卡已清空');
}

async function dedupNavCards(){
  var cards=await getNavCards(navCardCurrentType,navCardCurrentContact);
  var seen={};
  var unique=cards.filter(function(c){
    if(seen[c.content])return false;
    seen[c.content]=true;
    return true;
  });
  var removed=cards.length-unique.length;
  await saveNavCards(unique,navCardCurrentType,navCardCurrentContact);
  renderNavCards();
  toast('已清除 '+removed+' 张重复字卡');
}

var navCardFileInput=document.createElement('input');
navCardFileInput.type='file';
navCardFileInput.id='nav-card-file-input';
navCardFileInput.accept='.json';
navCardFileInput.style.display='none';
document.body.appendChild(navCardFileInput);

navCardFileInput.addEventListener('change',function(e){
  var file=e.target.files[0];
  if(!file)return;
  
  var reader=new FileReader();
  reader.onload=async function(evt){
    try{
      var importData=JSON.parse(evt.target.result);
      if(!importData.cards||!Array.isArray(importData.cards)){
        toast('无效的字卡数据');
        return;
      }
      
      var cards=await getNavCards(navCardCurrentType,navCardCurrentContact);
      var added=0;
      var skipped=0;
      
      importData.cards.forEach(function(card){
        if(card.content&&!cards.some(function(c){return c.content===card.content&&c.category===card.category})){
          cards.push({
            content:card.content,
            group:card.group||'默认',
            category:card.category||navCardCurrentCategory==='all'?'other':navCardCurrentCategory
          });
          added++;
        }else{skipped++;}
      });
      
      // 导入后全局去重
      if(added>0||skipped>0){
        var seen={};
        var unique=cards.filter(function(c){
          var key=c.content+'|||'+c.category;
          if(seen[key])return false;
          seen[key]=true;
          return true;
        });
        var deduped=cards.length-unique.length;
        cards=unique;
        if(deduped>0)skipped+=deduped;
      }
      
      if(importData.groups&&Array.isArray(importData.groups)){
        importData.groups.forEach(function(g){
          if(g!=='默认')addNavCardGroup(g);
        });
      }
      
      await saveNavCards(cards,navCardCurrentType,navCardCurrentContact);
      renderNavCards();
      var msg='成功导入 '+added+' 张字卡';
      if(skipped>0)msg+='，跳过 '+skipped+' 张重复';
      toast(msg);
    }catch(err){
      console.error('Import error:',err);
      toast('导入失败，无效的JSON文件');
    }
  };
  reader.readAsText(file);
  e.target.value='';
});

if($('topbar-settings-back'))$('topbar-settings-back').addEventListener('click',function(){
  showPg('pg-my');
});

if($('nav-card-group-filter'))$('nav-card-group-filter').addEventListener('change',function(){
  navCardCurrentGroup=this.value;
  renderNavCardGroupTags();
  renderNavCards();
});

var navCardSearchTimer=null;
if($('nav-card-search-input'))$('nav-card-search-input').addEventListener('input',function(){
  if(navCardSearchTimer)clearTimeout(navCardSearchTimer);
  navCardSearchTimer=setTimeout(function(){
    renderNavCards();
  },200);
});

if($('collapse-nav-cards-btn'))$('collapse-nav-cards-btn').addEventListener('click',function(){
  if(this.textContent==='折叠全部'){
    collapseAllNavCardGroups();
    this.textContent='展开全部';
  }else{
    expandAllNavCardGroups();
    this.textContent='折叠全部';
  }
});

$('reset-nav-cards-btn').addEventListener('click',async function(){
  await seedDefaultNavCards();
  renderNavCards();
  toast('已恢复默认字卡');
});

$('nav-card-dedup-btn').addEventListener('click',async function(){
  var cards=await getNavCards(navCardCurrentType,navCardCurrentContact);
  if(navCardCurrentCategory!=='all'){
    cards=cards.filter(function(c){return c.category&&c.category===navCardCurrentCategory});
  }
  
  var seen={};
  var duplicateCount=0;
  
  var unique=cards.filter(function(c){
    var key=c.content.trim();
    if(seen[key]){
      duplicateCount++;
      return false;
    }
    seen[key]=true;
    return true;
  });
  
  if(duplicateCount>0){
    await saveNavCards(unique,navCardCurrentType,navCardCurrentContact);
    renderNavCards();
    toast('已清除 '+duplicateCount+' 张重复字卡');
  }else{
    toast('没有重复字卡');
  }
});

showPgCallbacks['pg-contact-topbar-settings']=async function(){
  await loadNavCardGroups();
  await seedDefaultNavCards();
  // ★ 修复：确保 cardPrivateContacts 从 IndexedDB 恢复完成，避免专享字卡绑定丢失/误判
  if(!_cardPrivateContactsReady){
    try{await loadCardPrivateContacts();}catch(e){}
  }
  renderNavCardTypeTabs();
  renderNavCardContactSelect();
  renderNavCardCategoryTabs();
  renderNavCardGroupTags();
  renderNavCards();
};

async function exportData(){
  // ★ 导出进度条（★ 修复：标题用"导出数据中..."，不再误显示"导入数据中"）
  var progress=showImportProgress('导出数据中...');
  progress('正在准备导出...',5);
  try{
  // 确保 globalCards 已加载，避免导出数据缺失字卡库内容
  await loadGlobalCards();
  progress('正在收集聊天记录...',20);
  var messages={};
  var msgImgData={};
  if(window.localforage){
    try{
      var keys=await window.localforage.keys();
      for(var i=0;i<keys.length;i++){
        var k=keys[i];
        if(k.startsWith(LM)||k.startsWith(LMNI)){
          try{
            var msgsData=null;
            try{msgsData=await window.localforage.getItem(k);}catch(e){}
            if(typeof msgsData==='string'){
              msgsData=JSON.parse(msgsData);
            }
            for(var j=0;j<msgsData.length;j++){
              var msg=msgsData[j];
              if(msg.img&&msg.img.startsWith('ml2_msg_img_')&&!msgImgData[msg.img]){
                var imgData=null;
                try{imgData=await window.localforage.getItem(msg.img);}catch(e){}
                if(imgData){
                  msgImgData[msg.img]=imgData;
                  msg.img=imgData;
                }
              }
            }
            messages[k]=msgsData;
          }catch(e){}
        }
      }
    }catch(e){}
  }
  
  if(contacts&&contacts.length){
    for(var i=0;i<contacts.length;i++){
      var contactId=contacts[i].id;
      var msgKey=LM+contactId;
      if(!messages[msgKey]){
        var m=msgs(contactId);
        if(m&&m.length){
          for(var j=0;j<m.length;j++){
            var msg=m[j];
            if(msg.img&&msg.img.startsWith('ml2_msg_img_')&&!msgImgData[msg.img]){
              var imgData=null;
              if(window.localforage){
                try{imgData=await window.localforage.getItem(msg.img);}catch(e){}
              }
              if(imgData){
                msgImgData[msg.img]=imgData;
                msg.img=imgData;
              }
            }
          }
          messages[msgKey]=m;
        }
      }
    }
  }
  
  var chatBgData={};
  for(var i=0;i<contacts.length;i++){
    var c=contacts[i];
    if(c.chatSettings&&c.chatSettings.chatBgKeys){
      for(var j=0;j<c.chatSettings.chatBgKeys.length;j++){
        var bgKey=c.chatSettings.chatBgKeys[j];
        if(!chatBgData[bgKey]){
          var bg=null;
          if(bgKey.startsWith('data:')){
            bg=bgKey;
          }else{
            if(window.localforage){
              try{bg=await window.localforage.getItem(bgKey);}catch(e){}
            }
          }
          if(bg){
            chatBgData[bgKey]=bg;
          }
        }
      }
    }
  }
  
  loadCustomCardGroups();
  var nonInstantMessages={};
  if(window.localforage){
    try{
      var niKeys=await window.localforage.keys();
      for(var i=0;i<niKeys.length;i++){
        var nk=niKeys[i];
        if(nk.startsWith('star_noninstant_')){
          try{
            var niData=await window.localforage.getItem(nk);
            nonInstantMessages[nk]=niData;
          }catch(e){}
        }
      }
    }catch(e){}
  }
  progress('正在收集字卡与图片...',40);
  
  var cardImages={};
  var exportedCards=[];
  for(var i=0;i<globalCards.length;i++){
    var card=globalCards[i];
    var cardCopy=Object.assign({},card);
    if(card.content&&card.content.startsWith('ml2_card_img_')){
      var imgData=null;
      if(window.localforage){
        try{imgData=await window.localforage.getItem(card.content);}catch(e){}
      }
      if(imgData){
        cardImages[card.content]=imgData;
        // 保留引用键，避免图片数据重复存储
        cardCopy.content=card.content;
      }
    }
    exportedCards.push(cardCopy);
  }
  
  var navDisplayStatesData=ls('ml2_nav_display_states')||navDisplayStates;
  
  // 导出顶部栏字卡数据（直接用safeGetItem避免Storage.get的双前缀问题）
  var navCardsPublic=[];
  try{
    var rawNavPub=safeGetItem('ml2_lf_ml2_nav_cards_public');
    if(rawNavPub)navCardsPublic=JSON.parse(rawNavPub);
  }catch(e){navCardsPublic=[];}
  if(!Array.isArray(navCardsPublic))navCardsPublic=[];
  
  var navCardsPrivate={};
  for(var i=0;i<contacts.length;i++){
    var ncid=contacts[i].id;
    var navKey='ml2_lf_ml2_nav_cards_private_'+ncid;
    try{
      var rawNavPriv=safeGetItem(navKey);
      if(rawNavPriv){
        var privNav=JSON.parse(rawNavPriv);
        if(privNav&&Array.isArray(privNav))navCardsPrivate[ncid]=privNav;
      }
    }catch(e){}
  }
  
  // 导出联系人的timeline样式和纪念日
  var contactTimelines={};
  var contactAnniversariesExport={};
  for(var i=0;i<contacts.length;i++){
    var tcid=contacts[i].id;
    var tl=ls('ml2_timeline_'+tcid);
    if(tl)contactTimelines[tcid]=tl;
    var ann=ls('ml2_contact_anniversaries_'+tcid);
    if(ann)contactAnniversariesExport[tcid]=ann;
  }
  
  // 导出朋友圈通知
  var momentsNotifications=ls('ml2_moments_notifications')||[];
  
  // 导出联系人头像库图片数据
  var avatarLibImages={};
  for(var i=0;i<contacts.length;i++){
    var ct=contacts[i];
    if(ct.avatarLib&&ct.avatarLib.avatarKeys&&ct.avatarLib.avatarKeys.length>0){
      avatarLibImages[ct.id]={};
      for(var j=0;j<ct.avatarLib.avatarKeys.length;j++){
        var avKey=ct.avatarLib.avatarKeys[j];
        if(window.localforage){
          try{
            var avData=await window.localforage.getItem(avKey);
            if(avData)avatarLibImages[ct.id][avKey]=avData;
          }catch(e){}
        }
      }
    }
  }
  
  // 导出头像更换记录图片数据
  var avatarHistoryImages={};
  for(var i=0;i<contacts.length;i++){
    var ct=contacts[i];
    if(ct.avatarChangeHistory&&ct.avatarChangeHistory.length>0){
      avatarHistoryImages[ct.id]={};
      for(var j=0;j<ct.avatarChangeHistory.length;j++){
        var hist=ct.avatarChangeHistory[j];
        if(hist.isRef&&hist.avatar&&hist.avatar.startsWith('ml2_avh_')){
          if(window.localforage){
            try{
              var avhData=await window.localforage.getItem(hist.avatar);
              if(avhData)avatarHistoryImages[ct.id][hist.avatar]=avhData;
            }catch(e){}
          }
        }
      }
    }
  }
  
  // 导出语音数据
  var voicesData={};
  for(var i=0;i<globalCards.length;i++){
    var card=globalCards[i];
    if(card.category==='voices'&&card.content&&!card.content.startsWith('data:')){
      var voiceKey=card.content;
      if(!voicesData[voiceKey]){
        if(window.localforage){
          try{
            var voiceData=await window.localforage.getItem(voiceKey);
            if(voiceData)voicesData[voiceKey]=voiceData;
          }catch(e){}
        }
      }
    }
  }
  progress('正在打包数据...',70);
  
  var data={
    version:'1.3',
    exportTime:new Date().toISOString(),
    me:me,
    contacts:contacts,
    globalCards:exportedCards,
    cardGroups:cardGroups,
    customCardGroups:customCardGroups,
    cardImages:cardImages,
    avatarLibImages:avatarLibImages,
    avatarHistoryImages:avatarHistoryImages,
    voicesData:voicesData,
    cardPrivateContacts:cardPrivateContacts,
    navCardGroups:navCardGroups,
    navCardsPublic:navCardsPublic,
    navCardsPrivate:navCardsPrivate,
    contactTimelines:contactTimelines,
    contactAnniversaries:contactAnniversariesExport,
    momentsNotifications:momentsNotifications,
    speedSettings:ls('ml2_speed')||{},
    momentsPosts:ls('ml2_moments_posts')||[],
    momentsMembers:ls('ml2_moments_members')||[],
    momentsSettings:ls('ml2_moments_settings')||{},
    decisionHistory:ls('ml2_decision_history')||[],
    groupDecisionHistory:ls('ml2_group_decision_history')||[],
    groupDecisionMembers:ls('ml2_group_decision_members')||[],
    appSettings:ls('ml2_settings')||{},
    divineHistory:ls('ml2_divine_history')||[],
    boardMessages:ls('ml2_board_messages')||boardMessages||[],
    touchCardsPublic:ls('ml2_touch_cards_public')||[],
    touchCardsPrivate:ls('ml2_touch_cards_private')||{},
    touchGroups:ls('ml2_touch_groups')||{public:['默认'],private:['默认']},
    touchGroupCards:ls('ml2_touch_group_cards')||{},
    letters:ls(LL)||[],
    nonInstantMessages:nonInstantMessages,
    callSettings:callSettings,
    callHistory:callHistory,
    surveyRecords:ls('ml2_surveyRecords')||[],
    surveyDuration:ls('ml2_surveyDuration')||'30',
    surveyEarlySubmitProb:ls('ml2_surveyEarlySubmitProb')||'10',
    navDisplayStates:navDisplayStatesData,
    chatBgData:chatBgData,
    messages:messages,
    contactSongs:JSON.parse(JSON.stringify(contactSongs)),
    
    dreamEntries:ls('ml2_dream')||[],
    starCalData:ls('ml2_star_cal')||{},
    periodRecords:ls('ml2_period_records')||[],
    customChatbar:ls('ml2_custom_chatbar')||[],
    customIcons:ls('ml2_custom_icons')||{},
    customContactOrder:ls('ml2_custom_contact_order')||[],
    taFavorites:ls('ml2_ta_favorites')||{},
    taFavoritesSettings:ls('ml2_ta_favorites_settings')||{},
    chatFavorites:ls('ml2_chat_favorites')||{},
    cardUsageStats:ls('ml2_card_usage_stats')||{},
    cardUsageLog:ls('ml2_card_usage_log')||{},
    taHighlightsSelected:ls('ml2_ta_highlights_selected')||{},
    taHighlightsMsg:ls('ml2_ta_highlights_msg')||{},
    taHighlightsSettings:ls('ml2_ta_highlights_settings')||{},
    starMusicLibrary:starMusicLibrary||[],
    starMusicPlaylists:starMusicPlaylists||[],
    starMusicHistory:starMusicHistory||[],
    starMusicSettings:starMusicSettings||{},
    starMusicGlobal:starMusicGlobalSettings||{},
    defaultCommonSettings:ls('ml2_default_common_settings')||{},
    taHighlightsLastCheck:ls('ml2_ta_highlights_last_check')||null,
    taHighlightProbability:ls('ml2_ta_highlight_probability')!==undefined?ls('ml2_ta_highlight_probability'):30,
    taHighlightLastTriggerDate:ls('ml2_ta_highlight_last_trigger_date')||null,
    keepAliveEnabled:ls('keepAliveEnabled'),
    pushNotifyEnabled:ls('pushNotifyEnabled'),
    groups:groups||[],
    customEmojis:ls('ml2_custom_emojis')||[],
    customEmojiGroups:ls('ml2_custom_emoji_groups')||[],
    customReplies:ls('ml2_custom_replies')||{},
    nonInstantSettings:ls('ml2_noninstant_settings')||{},
    contactOrder:ls('ml2_custom_contact_order')||[]
  };
  
  var jsonStr=JSON.stringify(data,null,2);
  progress('正在生成文件...',80);
  
  var blob=new Blob([jsonStr],{type:'application/json;charset=utf-8'});
  var fileName='星言全局数据_'+new Date().toISOString().slice(0,10)+'.json';
  
  // ★ iOS Safari 兼容：优先用 Web Share API 分享/存储文件（iOS 上能"存储到文件"），
  // 因为 iOS Safari 的 <a download> 经常直接打开 Blob 显示 JSON 而不是下载
  var file=new File([blob],fileName,{type:'application/json;charset=utf-8'});
  var shared=false;
  if(navigator.canShare&&navigator.canShare({files:[file]})){
    try{
      await navigator.share({files:[file],title:'星言数据备份',text:'星言数据导出'});
      shared=true; // 用户完成分享（可能选了存储到文件）
    }catch(shareErr){
      // 取消/失败都走 fallback 下载
      console.warn('share failed, fallback to download:',shareErr&&shareErr.name||shareErr);
    }
  }
  if(!shared){
    // 桌面浏览器/Android：<a download> 下载
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;
    a.download=fileName;
    a.rel='noopener';
    a.style.display='none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // iOS Safari：<a download> 不触发时，延迟用 iframe/新窗口打开 Blob，让用户能长按保存
    setTimeout(function(){
      try{
        var navWin=window.open(url,'_blank');
        if(!navWin){
          var ifr=document.createElement('iframe');
          ifr.style.display='none';
          ifr.src=url;
          document.body.appendChild(ifr);
          setTimeout(function(){try{document.body.removeChild(ifr);}catch(e){}},2000);
        }
      }catch(e){console.warn('iOS blob open fallback failed:',e);}
    },500);
    setTimeout(function(){try{URL.revokeObjectURL(url);}catch(e){}},8000);
  }
  // ★ 导出成功反馈
  if(progress&&typeof progress.setSuccess==='function'){
    progress.setSuccess('✅ 导出成功');
  }
  toast('数据已导出');
  try{setTimeout(function(){if(progress&&typeof progress.hide==='function')progress.hide();},1500);}catch(e){}
  }catch(e){
    console.error('exportData error:',e);
    if(progress&&typeof progress.setError==='function')progress.setError('导出失败：'+e.message);
    else toast('导出失败，请重试');
  }
}

// 导出所有联系人和聊天记录
async function exportContactsAndChat(){
  toast('正在导出聊天记录，请稍候...');
  var exportData={
    version:'1.0',
    exportTime:new Date().toISOString(),
    contacts:contacts.map(function(c){
      return {
        id:c.id,
        name:c.name,
        avatar:c.avatar||'',
        isContact:c.isContact||false,
        hideName:c.hideName||false,
        chatSettings:c.chatSettings||{},
        avatarShape:c.avatarShape||'square'
      };
    }),
    messages:{},
    msgImages:{}
  };
  
  // 导出每个联系人的聊天记录
  for(var i=0;i<contacts.length;i++){
    var cid=contacts[i].id;
    var msgs=[];
    if(window.localforage){
      try{
        var stored=await window.localforage.getItem(LM+cid);
        if(stored&&Array.isArray(stored)){
          msgs=stored;
        }
      }catch(e){}
    }
    if(!msgs.length){
      var lsVal=ls(LM+cid);
      if(lsVal&&Array.isArray(lsVal))msgs=lsVal;
    }
    
    // 处理消息中的图片引用，替换为实际数据
    var processedMsgs=[];
    for(var j=0;j<msgs.length;j++){
      var msg=Object.assign({},msgs[j]);
      if(msg.img&&typeof msg.img==='string'&&msg.img.startsWith('ml2_msg_img_')){
        if(!exportData.msgImages[msg.img]){
          if(window.localforage){
            try{
              var imgData=await window.localforage.getItem(msg.img);
              if(imgData)exportData.msgImages[msg.img]=imgData;
            }catch(e){}
          }
        }
      }
      if(msg.originalImg&&typeof msg.originalImg==='string'&&msg.originalImg.startsWith('ml2_msg_img_')){
        if(!exportData.msgImages[msg.originalImg]){
          if(window.localforage){
            try{
              var imgData=await window.localforage.getItem(msg.originalImg);
              if(imgData)exportData.msgImages[msg.originalImg]=imgData;
            }catch(e){}
          }
        }
      }
      if(msg.voice&&typeof msg.voice==='string'&&msg.voice.startsWith('ml2_msg_voice_')){
        if(!exportData.msgImages[msg.voice]){
          if(window.localforage){
            try{
              var voiceData=await window.localforage.getItem(msg.voice);
              if(voiceData)exportData.msgImages[msg.voice]=voiceData;
            }catch(e){}
          }
        }
      }
      processedMsgs.push(msg);
    }
    if(processedMsgs.length>0){
      exportData.messages[cid]=processedMsgs;
    }
  }
  
  var jsonStr=JSON.stringify(exportData);
  var blob=new Blob([jsonStr],{type:'application/json;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;
  a.download='星言联系人聊天记录_'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('聊天记录已导出（'+contacts.length+'个联系人）');
}

// 导入联系人和聊天记录
async function importContactsAndChat(){
  var input=$('import-contacts-chat-input');
  var handleFileSelect=async function(e){
    var file=e.target.files[0];
    if(!file)return;
    input.removeEventListener('change',handleFileSelect);
    
    var reader=new FileReader();
    reader.onload=async function(evt){
      try{
        var importData=JSON.parse(evt.target.result);
        if(!importData.contacts||!Array.isArray(importData.contacts)){
          toast('无效的导入数据');
          input.value='';
          return;
        }
        
        if(!await customConfirm('确定导入聊天记录？现有联系人不会被删除，已有的联系人会保留，新联系人会被添加，同名联系人会被覆盖。')){
          input.value='';
          return;
        }
        
        toast('正在导入联系人+聊天记录，请稍候...');
        
        // 导入消息图片
        if(importData.msgImages&&typeof importData.msgImages==='object'){
          var imgKeys=Object.keys(importData.msgImages);
          for(var i=0;i<imgKeys.length;i++){
            var imgk=imgKeys[i];
            if(window.localforage){
              await localforage.setItem(imgk,importData.msgImages[imgk]);
            }
            memoryCache[imgk]=importData.msgImages[imgk];
          }
        }
        
        // 导入联系人
        var importedCount=0;
        var updatedCount=0;
        for(var i=0;i<importData.contacts.length;i++){
          var ic=importData.contacts[i];
          var existingIdx=contacts.findIndex(function(c){return c.id===ic.id});
          if(existingIdx>=0){
            // 更新已有联系人（保留已有的聊天设置和头像等）
            var existing=contacts[existingIdx];
            if(ic.chatSettings)existing.chatSettings=ic.chatSettings;
            if(ic.avatarShape)existing.avatarShape=ic.avatarShape;
            updatedCount++;
          }else{
            contacts.push({
              id:ic.id,
              name:ic.name||'联系人_'+ic.id,
              avatar:ic.avatar||'',
              isContact:ic.isContact!==false,
              hideName:ic.hideName||false,
              chatSettings:ic.chatSettings||{},
              avatarShape:ic.avatarShape||'square'
            });
            importedCount++;
          }
        }
        saveC();
        
        // 导入聊天记录
        var msgCount=0;
        if(importData.messages&&typeof importData.messages==='object'){
          var msgKeys=Object.keys(importData.messages);
          for(var j=0;j<msgKeys.length;j++){
            var mk=msgKeys[j];
            var msgs=importData.messages[mk];
            if(msgs&&Array.isArray(msgs)){
              // 处理消息中的图片引用
              for(var k=0;k<msgs.length;k++){
                var msg=msgs[k];
                if(msg.img&&typeof msg.img==='string'&&msg.img.startsWith('ml2_msg_img_')){
                  if(importData.msgImages&&importData.msgImages[msg.img]){
                    msg.img=importData.msgImages[msg.img];
                  }
                }
                if(msg.originalImg&&typeof msg.originalImg==='string'&&msg.originalImg.startsWith('ml2_msg_img_')){
                  if(importData.msgImages&&importData.msgImages[msg.originalImg]){
                    msg.originalImg=importData.msgImages[msg.originalImg];
                  }
                }
                if(msg.voice&&typeof msg.voice==='string'&&msg.voice.startsWith('ml2_msg_voice_')){
                  if(importData.msgImages&&importData.msgImages[msg.voice]){
                    msg.voice=importData.msgImages[msg.voice];
                  }
                }
              }
              ls(LM+mk,msgs);
              if(window.localforage){
                await localforage.setItem(LM+mk,msgs);
              }
              memoryCache[LM+mk]=msgs;
              msgCount+=msgs.length;
            }
          }
        }
        
        renderChatList();
        toast('已导入 '+importedCount+' 个新联系人，更新 '+updatedCount+' 个联系人，'+msgCount+' 条聊天记录');
      }catch(err){
        console.error('Import contacts+chat error:',err);
        toast('导入失败，无效的JSON文件');
      }
      input.value='';
    };
    reader.readAsText(file);
  };
  
  input.addEventListener('change',handleFileSelect);
  input.click();
}

async function exportSingleContactChat(contactId){
  var contact=contacts.find(function(c){return c.id===contactId});
  if(!contact){
    toast('找不到联系人');
    return;
  }
  
  toast('正在导出聊天记录，请稍候...');
  
  var msgs=[];
  if(window.localforage){
    try{
      var stored=await window.localforage.getItem(LM+contactId);
      if(stored&&Array.isArray(stored))msgs=stored;
    }catch(e){}
  }
  if(!msgs.length){
    var lsVal=ls(LM+contactId);
    if(lsVal&&Array.isArray(lsVal))msgs=lsVal;
  }
  
  var exportData={
    version:'1.0',
    exportTime:new Date().toISOString(),
    contactId:contactId,
    contactName:contact.name,
    messages:msgs,
    msgImages:{}
  };
  
  for(var i=0;i<msgs.length;i++){
    var msg=msgs[i];
    if(msg.img&&typeof msg.img==='string'&&msg.img.startsWith('ml2_msg_img_')){
      if(!exportData.msgImages[msg.img]&&window.localforage){
        try{
          var imgData=await window.localforage.getItem(msg.img);
          if(imgData)exportData.msgImages[msg.img]=imgData;
        }catch(e){}
      }
    }
    if(msg.voice&&typeof msg.voice==='string'&&msg.voice.startsWith('ml2_msg_voice_')){
      if(!exportData.msgImages[msg.voice]&&window.localforage){
        try{
          var voiceData=await window.localforage.getItem(msg.voice);
          if(voiceData)exportData.msgImages[msg.voice]=voiceData;
        }catch(e){}
      }
    }
  }
  
  var jsonStr=JSON.stringify(exportData);
  var blob=new Blob([jsonStr],{type:'application/json;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;
  a.download='星言 '+contact.name+'聊天数据_'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('聊天记录已导出（'+msgs.length+'条消息）');
}

async function importSingleContactChat(contactId){
  var contact=contacts.find(function(c){return c.id===contactId});
  if(!contact){
    toast('找不到联系人');
    return;
  }
  
  var input=document.createElement('input');
  input.type='file';
  input.accept='.json';
  input.style.display='none';
  
  var handleFileSelect=async function(e){
    var file=e.target.files[0];
    if(!file)return;
    input.removeEventListener('change',handleFileSelect);
    
    var reader=new FileReader();
    reader.onload=async function(evt){
      try{
        var importData=JSON.parse(evt.target.result);
        if(!importData.messages||!Array.isArray(importData.messages)){
          toast('无效的聊天记录数据');
          return;
        }
        
        if(!await customConfirm('确定导入聊天记录？将覆盖当前联系人的所有聊天记录。')){
          return;
        }
        
        toast('正在导入聊天记录，请稍候...');
        
        if(importData.msgImages&&typeof importData.msgImages==='object'){
          var imgKeys=Object.keys(importData.msgImages);
          for(var i=0;i<imgKeys.length;i++){
            var imgk=imgKeys[i];
            if(window.localforage){
              await localforage.setItem(imgk,importData.msgImages[imgk]);
            }
            memoryCache[imgk]=importData.msgImages[imgk];
          }
        }
        
        var msgs=importData.messages;
        for(var j=0;j<msgs.length;j++){
          var msg=msgs[j];
          if(msg.img&&typeof msg.img==='string'&&msg.img.startsWith('ml2_msg_img_')){
            if(importData.msgImages&&importData.msgImages[msg.img]){
              msg.img=importData.msgImages[msg.img];
            }
          }
          if(msg.voice&&typeof msg.voice==='string'&&msg.voice.startsWith('ml2_msg_voice_')){
            if(importData.msgImages&&importData.msgImages[msg.voice]){
              msg.voice=importData.msgImages[msg.voice];
            }
          }
        }
        
        ls(LM+contactId,msgs);
        if(window.localforage){
          await localforage.setItem(LM+contactId,msgs);
        }
        memoryCache[LM+contactId]=msgs;
        
        renderChatList();
        if(cid===contactId){
          renderMsgs();
        }
        
        toast('已导入 '+msgs.length+' 条聊天记录');
      }catch(err){
        console.error('Import chat error:',err);
        toast('导入失败，无效的JSON文件');
      }
    };
    reader.readAsText(file);
  };
  
  input.addEventListener('change',handleFileSelect);
  document.body.appendChild(input);
  input.click();
  setTimeout(function(){input.remove()},10000);
}

function openImportPaste(){
  var overlay=document.createElement('div');
  overlay.className='overlay';
  overlay.id='ov-import-paste';
  overlay.innerHTML='<div class="import-paste-panel"><div class="import-paste-header"><span class="import-paste-title">粘贴数据导入</span><button class="btn-close" onclick="hideOv(\'ov-import-paste\')">×</button></div><textarea class="import-paste-area" id="import-paste-inp" placeholder="粘贴导出的JSON数据..."></textarea><div class="import-paste-actions"><button class="btn" id="btn-import-paste">导入数据</button></div></div>';
  document.body.appendChild(overlay);
  overlay.style.display='flex';
  
  $('btn-import-paste').addEventListener('click',async function(){
    var text=$('import-paste-inp').value.trim();
    if(!text){
      toast('请输入数据');
      return;
    }
    try{
      var data=JSON.parse(text);
      if(!data||!data.contacts||!Array.isArray(data.contacts)){
        console.error('Import validation failed:',data);
        toast('无效的数据');
        return;
      }
      if(!await customConfirm('确定导入数据？将覆盖当前所有数据，且无法恢复。')){
        return;
      }
      await doImportData(data);
      hideOv('ov-import-paste');
      toast('数据导入成功');
      setTimeout(function(){location.reload()},500);
    }catch(e){
      console.error('Import error:',e);
      toast('数据格式错误');
    }
  });
}

$('import-data-input').addEventListener('change',function(e){
  var file=e.target.files[0];
  if(!file)return;
  handleImportFile(file);
});

// ★ iOS Safari 兼容：统一的文件导入处理（供动态 file input 和原隐藏 input 共用）
function handleImportFile(file){
  if(!file)return;
  var progress=null;
  var reader=new FileReader();
  reader.onload=async function(event){
    try{
      var text=event.target.result;
      var data=JSON.parse(text);
      if(!data||!data.contacts||!Array.isArray(data.contacts)){
        console.error('File import validation failed:',data);
        toast('无效的数据文件，请确认是星言导出的 JSON');
        return;
      }
      
      // ★ 修复：先确认再显示进度遮罩（避免进度遮罩 z-index 挡住确认弹窗，导致点击无效）
      if(!await customConfirm('确定导入数据？将覆盖当前所有数据，且无法恢复。')){
        return;
      }
      if(!progress)progress=showImportProgress();
      progress('正在解析数据...',30);
      progress('正在导入数据，请稍候...',50);
      await doImportData(data, progress);
      // 强制刷新页面，确保所有数据生效（doImportData 内已显示成功）
      setTimeout(function(){window.location.href=window.location.href.split('?')[0]+'?t='+Date.now()},800);
    }catch(e){
      console.error('File import error:',e);
      if(progress&&typeof progress.setError==='function')progress.setError('数据格式错误：'+e.message);
      else toast('数据格式错误');
    }
  };
  reader.onerror=function(e){
    console.error('File read error:',e);
    if(progress&&typeof progress.setError==='function')progress.setError('读取文件失败，请重试');
    else toast('读取文件失败');
  };
  reader.readAsText(file,'UTF-8');
}

// 导入/导出进度遮罩（★ 修复：支持自定义标题，导出时不再显示"导入数据中"）
function showImportProgress(customTitle){
  var ov=document.createElement('div');
  ov.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;';
  var box=document.createElement('div');
  box.style.cssText='background:#fff;border-radius:12px;padding:24px 32px;width:80%;max-width:300px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.3);';
  var title=document.createElement('div');
  title.textContent=customTitle||'导入数据中...';
  title.style.cssText='font-size:16px;font-weight:bold;color:#333;margin-bottom:16px;';
  var barBg=document.createElement('div');
  barBg.style.cssText='width:100%;height:8px;background:#eee;border-radius:4px;overflow:hidden;margin-bottom:8px;';
  var bar=document.createElement('div');
  bar.style.cssText='width:0%;height:100%;background:linear-gradient(90deg,#4CAF50,#8BC34A);border-radius:4px;transition:width 0.3s;';
  barBg.appendChild(bar);
  var label=document.createElement('div');
  label.textContent='正在准备...';
  label.style.cssText='font-size:13px;color:#888;margin-bottom:4px;';
  var pct=document.createElement('div');
  pct.textContent='0%';
  pct.style.cssText='font-size:12px;color:#aaa;';
  box.appendChild(title);
  box.appendChild(barBg);
  box.appendChild(label);
  box.appendChild(pct);
  ov.appendChild(box);
  document.body.appendChild(ov);
  var cb=function(msg,percent){
    if(percent===undefined)percent=0;
    var p=Math.min(100,Math.max(0,percent));
    bar.style.width=p+'%';
    pct.textContent=p+'%';
    if(msg)label.textContent=msg;
  };
  // ★ 成功/失败状态：变绿/变红 + 打勾/叉
  cb.setSuccess=function(successTitle){
    title.textContent=(successTitle||'✅ 导入成功');
    title.style.color='#2e7d32';
    bar.style.background='linear-gradient(90deg,#2e7d32,#66bb6a)';
    label.textContent='数据已完整导入';
    label.style.color='#2e7d32';
    pct.textContent='100%';
  };
  cb.setError=function(errMsg){
    title.textContent='❌ 导入失败';
    title.style.color='#c62828';
    bar.style.background='linear-gradient(90deg,#c62828,#e57373)';
    label.textContent=errMsg||'请检查文件后重试';
    label.style.color='#c62828';
  };
  cb.hide=function(){try{document.body.removeChild(ov);}catch(e){}};
  return cb;
}

async function doImportData(data, importProgress){
  // ★ 修复：接收外部传入的进度条（handleImportFile 已创建），避免多层遮罩叠加挡住确认弹窗/按钮
  importProgress = importProgress || showImportProgress();
  var updateProgress=function(msg,pct){
    if(importProgress)importProgress(msg,pct);
  };
  updateProgress('正在导入联系人...',5);
  if(data.me)me=data.me;
  if(data.contacts)contacts=data.contacts;
  if(data.cardGroups)cardGroups=data.cardGroups;
  if(data.customCardGroups)customCardGroups=data.customCardGroups;
  
  // 导入卡牌图片数据（从cardImages映射恢复）
  updateProgress('正在导入图片...',10);
  if(data.cardImages&&typeof data.cardImages==='object'){
    var imgKeys=Object.keys(data.cardImages);
    for(var i=0;i<imgKeys.length;i++){
      var imgk=imgKeys[i];
      if(window.localforage){
        try{await localforage.setItem(imgk,data.cardImages[imgk]);}catch(e){console.warn('doImportData: cardImages setItem failed',imgk,e);}
      }
      memoryCache[imgk]=data.cardImages[imgk];
    }
  }
  
  // 导入联系人头像库图片数据
  if(data.avatarLibImages&&typeof data.avatarLibImages==='object'){
    var avLibCids=Object.keys(data.avatarLibImages);
    for(var i=0;i<avLibCids.length;i++){
      var avCid=avLibCids[i];
      var avImgs=data.avatarLibImages[avCid];
      if(avImgs&&typeof avImgs==='object'){
        var avKeys=Object.keys(avImgs);
        for(var j=0;j<avKeys.length;j++){
          var avk=avKeys[j];
          if(window.localforage){
            try{await localforage.setItem(avk,avImgs[avk]);}catch(e){console.warn('doImportData: avatarLibImages setItem failed',avk,e);}
          }
          memoryCache[avk]=avImgs[avk];
        }
      }
    }
  }
  
  // 导入头像更换记录图片数据
  if(data.avatarHistoryImages&&typeof data.avatarHistoryImages==='object'){
    var avhCids=Object.keys(data.avatarHistoryImages);
    for(var i=0;i<avhCids.length;i++){
      var avhCid=avhCids[i];
      var avhImgs=data.avatarHistoryImages[avhCid];
      if(avhImgs&&typeof avhImgs==='object'){
        var avhKeys=Object.keys(avhImgs);
        for(var j=0;j<avhKeys.length;j++){
          var avhk=avhKeys[j];
          if(window.localforage){
            try{await localforage.setItem(avhk,avhImgs[avhk]);}catch(e){console.warn('doImportData: avatarHistoryImages setItem failed',avhk,e);}
          }
          memoryCache[avhk]=avhImgs[avhk];
        }
      }
    }
  }
  
  updateProgress('正在导入语音数据...',15);
  if(data.voicesData&&typeof data.voicesData==='object'){
    var voiceKeys=Object.keys(data.voicesData);
    for(var i=0;i<voiceKeys.length;i++){
      var vk=voiceKeys[i];
      if(window.localforage){
        try{await localforage.setItem(vk,data.voicesData[vk]);}catch(e){console.warn('doImportData: voicesData setItem failed',vk,e);}
      }
      memoryCache[vk]=data.voicesData[vk];
    }
  }
  
  updateProgress('正在导入字卡...',20);
  if(data.globalCards&&Array.isArray(data.globalCards)){
    globalCards=[];
    var fullCards=[];
    for(var i=0;i<data.globalCards.length;i++){
      var card=data.globalCards[i];
      var cardCopy=Object.assign({},card);
      fullCards.push(Object.assign({},card));
      if(card.content&&card.content.startsWith('data:image/')){
        var imgKey='ml2_card_img_'+card.id;
        if(window.localforage){
          try{await localforage.setItem(imgKey,card.content);}catch(e){console.warn('doImportData: globalCard img setItem failed',imgKey,e);}
        }
        cardCopy.content=imgKey;
      }
      globalCards.push(cardCopy);
      if(i>0&&i%100===0){
        await new Promise(function(r){setTimeout(r,50)});
      }
    }
  }
  
  saveP();
  await saveC(); // ★ 修复：等待联系人写入 IndexedDB 完成，避免导入后立即刷新时数据未落库
  if(customCardGroups){
    ls('ml2_custom_card_groups',customCardGroups);
  }
  ls('ml2_global_cards',globalCards);
  if(window.localforage){
    await localforage.setItem('ml2_global_cards',JSON.stringify(globalCards)).catch(function(e){console.warn('doImportData: global_cards save failed',e);});
  }
  saveCardGroups();
  
  updateProgress('正在导入设置...',30);
  if(data.speedSettings)ls('ml2_speed',data.speedSettings);
  if(data.momentsPosts)ls('ml2_moments_posts',data.momentsPosts);
  if(data.momentsMembers)ls('ml2_moments_members',data.momentsMembers);
  if(data.momentsSettings)ls('ml2_moments_settings',data.momentsSettings);
  if(data.decisionHistory)ls('ml2_decision_history',data.decisionHistory);
  if(data.groupDecisionHistory)ls('ml2_group_decision_history',data.groupDecisionHistory);
  if(data.groupDecisionMembers)ls('ml2_group_decision_members',data.groupDecisionMembers);
  if(data.appSettings)ls('ml2_settings',data.appSettings);
  if(data.divineHistory){
    divineHistory=data.divineHistory;
    try{
      var _dserialized=JSON.stringify(divineHistory);
      localStorage.setItem('ml2_lf_ml2_divine_history',_dserialized);
      localStorage.setItem('ml2_divine_history',_dserialized);
      if(window.localforage){
        window.localforage.setItem('ml2_divine_history',divineHistory).catch(function(){});
      }
    }catch(e){}
  }
  if(data.boardMessages)ls('ml2_board_messages',data.boardMessages);
  
  
  if(data.touchCardsPublic)ls('ml2_touch_cards_public',data.touchCardsPublic);
  if(data.touchCardsPrivate)ls('ml2_touch_cards_private',data.touchCardsPrivate);
  if(data.touchGroups)ls('ml2_touch_groups',data.touchGroups);
  if(data.touchGroupCards)ls('ml2_touch_group_cards',data.touchGroupCards);
  if(data.letters)ls(LL,data.letters);
  if(data.cardPrivateContacts&&Array.isArray(data.cardPrivateContacts)){
    cardPrivateContacts=data.cardPrivateContacts.map(function(pc){
      return {id:pc.id,name:pc.name,bindContactId:pc.bindContactId||null};
    });
    saveCardPrivateContacts();
  }
  if(data.navDisplayStates)ls('ml2_nav_display_states',data.navDisplayStates);
  if(data.navCardGroups){navCardGroups=data.navCardGroups;window.localforage&&window.localforage.setItem('ml2_nav_card_groups',JSON.stringify(navCardGroups)).catch(function(){});}
  
  // 导入顶部栏字卡（公用）
  if(data.navCardsPublic&&Array.isArray(data.navCardsPublic)){
    safeSetItem('ml2_lf_ml2_nav_cards_public',data.navCardsPublic);
    if(window.localforage){
      await localforage.setItem('ml2_nav_cards_public',JSON.stringify(data.navCardsPublic)).catch(function(e){console.warn('doImportData: nav_cards_public save failed',e);});
    }
  }
  // 导入顶部栏字卡（专享）
  if(data.navCardsPrivate&&typeof data.navCardsPrivate==='object'){
    var privNavKeys=Object.keys(data.navCardsPrivate);
    for(var i=0;i<privNavKeys.length;i++){
      var pnk=privNavKeys[i];
      var pnv=data.navCardsPrivate[pnk];
      if(pnv&&Array.isArray(pnv)){
        var navPrivKey='ml2_nav_cards_private_'+pnk;
        ls(navPrivKey,pnv);
        if(window.localforage){
          await localforage.setItem(navPrivKey,JSON.stringify(pnv)).catch(function(e){console.warn('doImportData: nav_private save failed',navPrivKey,e);});
        }
      }
    }
  }
  
  if(data.callSettings){callSettings=data.callSettings;ls('ml2_call_settings',callSettings);}
  if(data.callHistory){callHistory=data.callHistory;ls('ml2_call_history',callHistory);}
  if(data.surveyRecords)ls('ml2_surveyRecords',data.surveyRecords);
  if(data.surveyDuration)ls('ml2_surveyDuration',data.surveyDuration);
  if(data.surveyEarlySubmitProb)ls('ml2_surveyEarlySubmitProb',data.surveyEarlySubmitProb);
  
  updateProgress('正在导入非即时消息...',40);
  if(data.nonInstantMessages&&typeof data.nonInstantMessages==='object'){
    var niKeys=Object.keys(data.nonInstantMessages);
    for(var i=0;i<niKeys.length;i++){
      var niKey=niKeys[i];
      ls(niKey,data.nonInstantMessages[niKey]);
      if(i>0&&i%50===0){
        await new Promise(function(r){setTimeout(r,50)});
      }
    }
  }
  
  updateProgress('正在导入聊天背景...',50);
  if(data.chatBgData&&typeof data.chatBgData==='object'){
    var bgKeys=Object.keys(data.chatBgData);
    for(var i=0;i<bgKeys.length;i++){
      var bgKey=bgKeys[i];
      var bgData=data.chatBgData[bgKey];
      if(window.localforage){
        try{await window.localforage.setItem(bgKey,bgData);}catch(e){console.warn('doImportData: chatBg setItem failed',bgKey,e);}
      }
      memoryCache[bgKey]=bgData;
      if(i>0&&i%50===0){
        await new Promise(function(r){setTimeout(r,50)});
      }
    }
  }
  
  updateProgress('正在导入聊天记录...',60);
  if(data.messages&&typeof data.messages==='object'){
    var msgKeys=Object.keys(data.messages);
    // ★ 修复：图片 base64 并行批量写入（不逐张 await），避免 iOS Safari 上大量 IndexedDB 串行写入卡死/超时
    for(var i=0;i<msgKeys.length;i++){
      var msgKey=msgKeys[i];
      var msgsData=data.messages[msgKey];
      var imgPromises=[];
      for(var j=0;j<msgsData.length;j++){
        var msg=msgsData[j];
        if(msg.img&&msg.img.length>1024&&msg.img.startsWith('data:image/')){
          var imgKey='ml2_msg_img_'+msg.id;
          if(window.localforage){
            imgPromises.push(localforage.setItem(imgKey,msg.img).catch(function(e){console.warn('doImportData: msg img setItem failed',e);}));
          }
          msg.img=imgKey;
        }
      }
      // 并行写该联系人的所有图片，不阻塞
      if(imgPromises.length>0){
        await Promise.allSettled(imgPromises);
      }
      // ★ 追加模式：与现有聊天记录合并（按时间排序、按 id 去重），保留几天前的历史记录
      try{
        var existingMsgs=ls(msgKey);
        if(existingMsgs&&Array.isArray(existingMsgs)&&existingMsgs.length>0){
          var seenIds={};
          existingMsgs.forEach(function(em){if(em&&em.id)seenIds[em.id]=true;});
          msgsData.forEach(function(nm){
            if(nm&&nm.id&&!seenIds[nm.id]){
              seenIds[nm.id]=true;
              existingMsgs.push(nm);
            }
          });
          // 按时间排序（无 ts 的排最后）
          existingMsgs.sort(function(a,b){
            var at=a&&a.ts?(a.ts instanceof Date?a.ts.getTime():new Date(a.ts).getTime()):0;
            var bt=b&&b.ts?(b.ts instanceof Date?b.ts.getTime():new Date(b.ts).getTime()):0;
            return at-bt;
          });
          msgsData=existingMsgs;
        }
      }catch(e){console.warn('doImportData: msgs merge failed',e);}
      ls(msgKey,msgsData);
      if(window.localforage){
        await localforage.setItem(msgKey,msgsData).catch(function(e){console.warn('doImportData: msgs save failed',msgKey,e);});
      }
      if(i>0&&i%10===0){
        await new Promise(function(r){setTimeout(r,20)});
      }
    }
  }
  
  updateProgress('正在导入其他数据...',75);
  if(data.contactSongs&&typeof data.contactSongs==='object'){
    contactSongs=data.contactSongs;
    var songKeys=Object.keys(data.contactSongs);
    for(var i=0;i<songKeys.length;i++){
      var songKey=songKeys[i];
      ls('ml2_contact_songs_'+songKey,data.contactSongs[songKey]);
    }
  }
  
  // 导入timeline样式
  if(data.contactTimelines&&typeof data.contactTimelines==='object'){
    var tlKeys=Object.keys(data.contactTimelines);
    for(var i=0;i<tlKeys.length;i++){
      ls('ml2_timeline_'+tlKeys[i],data.contactTimelines[tlKeys[i]]);
    }
  }
  
  // 导入纪念日
  if(data.contactAnniversaries&&typeof data.contactAnniversaries==='object'){
    var annKeys=Object.keys(data.contactAnniversaries);
    for(var i=0;i<annKeys.length;i++){
      ls('ml2_contact_anniversaries_'+annKeys[i],data.contactAnniversaries[annKeys[i]]);
    }
    contactAnniversaries=data.contactAnniversaries;
  }
  
  // 导入朋友圈通知
  if(data.momentsNotifications)ls('ml2_moments_notifications',data.momentsNotifications);
  
  
  if(data.dreamEntries)ls('ml2_dream',data.dreamEntries);
  if(data.starCalData)ls('ml2_star_cal',data.starCalData);
  if(data.periodRecords)ls('ml2_period_records',data.periodRecords);
  if(data.customChatbar)ls('ml2_custom_chatbar',data.customChatbar);
  if(data.customIcons)ls('ml2_custom_icons',data.customIcons);
  if(data.customContactOrder)ls('ml2_custom_contact_order',data.customContactOrder);
  if(data.taFavorites)ls('ml2_ta_favorites',data.taFavorites);
  if(data.taFavoritesSettings)ls('ml2_ta_favorites_settings',data.taFavoritesSettings);
  if(data.chatFavorites)ls('ml2_chat_favorites',data.chatFavorites);
  if(data.cardUsageStats)ls('ml2_card_usage_stats',data.cardUsageStats);
  if(data.cardUsageLog)ls('ml2_card_usage_log',data.cardUsageLog);
  if(data.taHighlightsSelected)ls('ml2_ta_highlights_selected',data.taHighlightsSelected);
  if(data.taHighlightsMsg)ls('ml2_ta_highlights_msg',data.taHighlightsMsg);
  if(data.taHighlightsSettings)ls('ml2_ta_highlights_settings',data.taHighlightsSettings);
  if(data.starMusicLibrary){ls('ml2_star_music_library',data.starMusicLibrary);starMusicLibrary=data.starMusicLibrary;}
  if(data.starMusicPlaylists){ls('ml2_star_music_playlists',data.starMusicPlaylists);starMusicPlaylists=data.starMusicPlaylists;}
  if(data.starMusicHistory){ls('ml2_star_music_history',data.starMusicHistory);starMusicHistory=data.starMusicHistory;}
  if(data.starMusicSettings){ls('ml2_star_music_settings',data.starMusicSettings);starMusicSettings=data.starMusicSettings;}
  if(data.starMusicGlobal){ls('ml2_star_music_global',data.starMusicGlobal);starMusicGlobalSettings=data.starMusicGlobal;STAR_MUSIC_REQUEST_PROB=starMusicGlobalSettings.requestProb||5;STAR_MUSIC_COOLDOWN_MS=starMusicGlobalSettings.cooldownMs||3600000;}
  if(data.defaultCommonSettings){ls('ml2_default_common_settings',data.defaultCommonSettings);loadDefaultCommonSettings();}
  if(data.taHighlightsLastCheck!==undefined)ls('ml2_ta_highlights_last_check',data.taHighlightsLastCheck);
  if(data.taHighlightProbability!==undefined)ls('ml2_ta_highlight_probability',data.taHighlightProbability);
  if(data.taHighlightLastTriggerDate!==undefined)ls('ml2_ta_highlight_last_trigger_date',data.taHighlightLastTriggerDate);
  if(data.keepAliveEnabled!==undefined)ls('keepAliveEnabled',data.keepAliveEnabled);
  if(data.pushNotifyEnabled!==undefined)ls('pushNotifyEnabled',data.pushNotifyEnabled);
  if(data.groups){groups=data.groups;if(window.localforage){localforage.setItem('ml2_groups',data.groups).catch(function(){});}}
  if(data.customEmojis)ls('ml2_custom_emojis',data.customEmojis);
  if(data.customEmojiGroups)ls('ml2_custom_emoji_groups',data.customEmojiGroups);
  if(data.customReplies)ls('ml2_custom_replies',data.customReplies);
  if(data.nonInstantSettings)ls('ml2_noninstant_settings',data.nonInstantSettings);
  
  updateProgress('正在保存到本地数据库...',85);
  if(window.localforage){
    var savePromises=[];
    savePromises.push(localforage.setItem(LC,contacts));
    if(data.speedSettings)savePromises.push(localforage.setItem('ml2_speed',data.speedSettings));
    if(data.momentsPosts)savePromises.push(localforage.setItem('ml2_moments_posts',data.momentsPosts));
    if(data.momentsMembers)savePromises.push(localforage.setItem('ml2_moments_members',data.momentsMembers));
    if(data.momentsSettings)savePromises.push(localforage.setItem('ml2_moments_settings',data.momentsSettings));
    if(data.decisionHistory)savePromises.push(localforage.setItem('ml2_decision_history',data.decisionHistory));
    if(data.groupDecisionHistory)savePromises.push(localforage.setItem('ml2_group_decision_history',data.groupDecisionHistory));
    if(data.groupDecisionMembers)savePromises.push(localforage.setItem('ml2_group_decision_members',data.groupDecisionMembers));
    if(data.appSettings)savePromises.push(localforage.setItem('ml2_settings',data.appSettings));
    if(data.divineHistory)savePromises.push(localforage.setItem('ml2_divine_history',data.divineHistory));
    if(data.boardMessages)savePromises.push(localforage.setItem('ml2_board_messages',data.boardMessages));
    
    
    if(data.touchCardsPublic)savePromises.push(localforage.setItem('ml2_touch_cards_public',data.touchCardsPublic));
    if(data.touchCardsPrivate)savePromises.push(localforage.setItem('ml2_touch_cards_private',data.touchCardsPrivate));
    if(data.touchGroups)savePromises.push(localforage.setItem('ml2_touch_groups',data.touchGroups));
    if(data.touchGroupCards)savePromises.push(localforage.setItem('ml2_touch_group_cards',data.touchGroupCards));
    if(data.letters)savePromises.push(localforage.setItem(LL,data.letters));
    if(data.navDisplayStates)savePromises.push(localforage.setItem('ml2_nav_display_states',data.navDisplayStates));
    if(data.navCardGroups)savePromises.push(localforage.setItem('ml2_nav_card_groups',JSON.stringify(data.navCardGroups)));
    if(data.callSettings)savePromises.push(localforage.setItem('ml2_call_settings',data.callSettings));
    if(data.callHistory)savePromises.push(localforage.setItem('ml2_call_history',data.callHistory));
    if(data.surveyRecords)savePromises.push(localforage.setItem('ml2_surveyRecords',data.surveyRecords));
    if(data.surveyDuration)savePromises.push(localforage.setItem('ml2_surveyDuration',data.surveyDuration));
    if(data.surveyEarlySubmitProb)savePromises.push(localforage.setItem('ml2_surveyEarlySubmitProb',data.surveyEarlySubmitProb));
    if(data.nonInstantMessages&&typeof data.nonInstantMessages==='object'){
      var niKeys2=Object.keys(data.nonInstantMessages);
      for(var i=0;i<niKeys2.length;i++){
        var niKey=niKeys2[i];
        savePromises.push(localforage.setItem(niKey,data.nonInstantMessages[niKey]));
      }
    }
    if(data.chatBgData&&typeof data.chatBgData==='object'){
      var bgKeys2=Object.keys(data.chatBgData);
      for(var i=0;i<bgKeys2.length;i++){
        var bgKey=bgKeys2[i];
        savePromises.push(localforage.setItem(bgKey,data.chatBgData[bgKey]));
      }
    }
    if(data.contactSongs&&typeof data.contactSongs==='object'){
      var songKeys2=Object.keys(data.contactSongs);
      for(var i=0;i<songKeys2.length;i++){
        var songKey=songKeys2[i];
        savePromises.push(localforage.setItem('ml2_contact_songs_'+songKey,data.contactSongs[songKey]));
      }
    }
    if(data.messages&&typeof data.messages==='object'){
      var msgKeys2=Object.keys(data.messages);
      for(var i=0;i<msgKeys2.length;i++){
        var msgKey=msgKeys2[i];
        savePromises.push(localforage.setItem(msgKey,data.messages[msgKey]));
      }
    }
    
    if(data.dreamEntries)savePromises.push(localforage.setItem('ml2_dream',data.dreamEntries));
    if(data.starCalData)savePromises.push(localforage.setItem('ml2_star_cal',data.starCalData));
    if(data.periodRecords)savePromises.push(localforage.setItem('ml2_period_records',data.periodRecords));
    if(data.customChatbar)savePromises.push(localforage.setItem('ml2_custom_chatbar',data.customChatbar));
    if(data.customIcons)savePromises.push(localforage.setItem('ml2_custom_icons',data.customIcons));
    if(data.customContactOrder)savePromises.push(localforage.setItem('ml2_custom_contact_order',data.customContactOrder));
    if(data.taFavorites)savePromises.push(localforage.setItem('ml2_ta_favorites',data.taFavorites));
    if(data.taFavoritesSettings)savePromises.push(localforage.setItem('ml2_ta_favorites_settings',data.taFavoritesSettings));
    if(data.chatFavorites)savePromises.push(localforage.setItem('ml2_chat_favorites',data.chatFavorites));
    if(data.cardUsageStats)savePromises.push(localforage.setItem('ml2_card_usage_stats',data.cardUsageStats));
    if(data.cardUsageLog)savePromises.push(localforage.setItem('ml2_card_usage_log',data.cardUsageLog));
    if(data.taHighlightsSelected)savePromises.push(localforage.setItem('ml2_ta_highlights_selected',data.taHighlightsSelected));
    if(data.taHighlightsMsg)savePromises.push(localforage.setItem('ml2_ta_highlights_msg',data.taHighlightsMsg));
    if(data.taHighlightsSettings)savePromises.push(localforage.setItem('ml2_ta_highlights_settings',data.taHighlightsSettings));
    if(data.starMusicLibrary)savePromises.push(localforage.setItem('ml2_star_music_library',data.starMusicLibrary));
    if(data.starMusicPlaylists)savePromises.push(localforage.setItem('ml2_star_music_playlists',data.starMusicPlaylists));
    if(data.starMusicHistory)savePromises.push(localforage.setItem('ml2_star_music_history',data.starMusicHistory));
    if(data.starMusicSettings)savePromises.push(localforage.setItem('ml2_star_music_settings',data.starMusicSettings));
    if(data.starMusicGlobal)savePromises.push(localforage.setItem('ml2_star_music_global',data.starMusicGlobal));
    if(data.defaultCommonSettings)savePromises.push(localforage.setItem('ml2_default_common_settings',data.defaultCommonSettings));
    if(data.taHighlightsLastCheck!==undefined)savePromises.push(localforage.setItem('ml2_ta_highlights_last_check',data.taHighlightsLastCheck));
    if(data.taHighlightProbability!==undefined)savePromises.push(localforage.setItem('ml2_ta_highlight_probability',data.taHighlightProbability));
    if(data.taHighlightLastTriggerDate!==undefined)savePromises.push(localforage.setItem('ml2_ta_highlight_last_trigger_date',data.taHighlightLastTriggerDate));
    if(data.momentsNotifications)savePromises.push(localforage.setItem('ml2_moments_notifications',data.momentsNotifications));
    if(data.contactTimelines&&typeof data.contactTimelines==='object'){
      var tlKeys3=Object.keys(data.contactTimelines);
      for(var i=0;i<tlKeys3.length;i++){
        savePromises.push(localforage.setItem('ml2_timeline_'+tlKeys3[i],data.contactTimelines[tlKeys3[i]]));
      }
    }
    if(data.contactAnniversaries&&typeof data.contactAnniversaries==='object'){
      var annKeys3=Object.keys(data.contactAnniversaries);
      for(var i=0;i<annKeys3.length;i++){
        savePromises.push(localforage.setItem('ml2_contact_anniversaries_'+annKeys3[i],data.contactAnniversaries[annKeys3[i]]));
      }
    }
    if(data.contactOrder&&Array.isArray(data.contactOrder))savePromises.push(localforage.setItem('ml2_custom_contact_order',data.contactOrder));
    if(data.keepAliveEnabled!==undefined)savePromises.push(localforage.setItem('keepAliveEnabled',data.keepAliveEnabled));
    if(data.pushNotifyEnabled!==undefined)savePromises.push(localforage.setItem('pushNotifyEnabled',data.pushNotifyEnabled));
    if(data.groups)savePromises.push(localforage.setItem('ml2_groups',data.groups));
    if(data.customEmojis)savePromises.push(localforage.setItem('ml2_custom_emojis',data.customEmojis));
    if(data.customEmojiGroups)savePromises.push(localforage.setItem('ml2_custom_emoji_groups',data.customEmojiGroups));
    if(data.customReplies)savePromises.push(localforage.setItem('ml2_custom_replies',data.customReplies));
    if(data.nonInstantSettings)savePromises.push(localforage.setItem('ml2_noninstant_settings',data.nonInstantSettings));
    
    for(var i=0;i<savePromises.length;i+=20){
      var batch=savePromises.slice(i,Math.min(i+20,savePromises.length));
      await Promise.allSettled(batch);
      await new Promise(function(r){setTimeout(r,50)});
    }
  }
  
  updateProgress('✅ 导入成功！即将刷新...',100);
  try{
    if(importProgress&&typeof importProgress.setSuccess==='function')importProgress.setSuccess();
  }catch(e){}
  await new Promise(function(r){setTimeout(r,600)});
}


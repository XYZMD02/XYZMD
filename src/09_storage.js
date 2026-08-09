// ========== localStorage 安全封装（兜底方案）==========
function safeGetItem(key) {
  try { return localStorage.getItem(key); }
  catch(e) { console.warn('safeGetItem failed:', key, e); return null; }
}
function safeSetItem(key, value) {
  try {
    if (typeof value === 'object') { value = JSON.stringify(value); }
    localStorage.setItem(key, value);
    return true;
  } catch(e) {
    console.warn('safeSetItem failed (likely quota exceeded):', key, e);
    return false;
  }
}
function safeRemoveItem(key) {
  try { localStorage.removeItem(key); return true; }
  catch(e) { console.warn('safeRemoveItem failed:', key, e); return false; }
}

// 全局桥接函数 - 供 Storage 模块外部使用
function isLFAvailable() {
  return typeof Storage !== 'undefined' && Storage.isLFAvailable ? Storage.isLFAvailable() : (window.localforage ? true : false);
}

// 获取 localStorage 已用空间估算（字符数约等于字节数）
function getLocalStorageUsage() {
  var total = 0;
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      total += k.length + (localStorage.getItem(k)||'').length;
    }
  } catch(e) {}
  return total;
}

// 获取 IndexedDB 用量估算（需 localforage 就绪）
var _idbUsageEstimate = null;
var _idbUsageLastCheck = 0;
function getIDBUsageEstimate(callback) {
  var now = Date.now();
  if (_idbUsageEstimate !== null && (now - _idbUsageLastCheck) < 30000) {
    callback(_idbUsageEstimate);
    return;
  }
  if (navigator.storage && navigator.storage.estimate) {
    navigator.storage.estimate().then(function(est) {
      _idbUsageEstimate = est;
      _idbUsageLastCheck = now;
      callback(est);
    }).catch(function() {
      callback(null);
    });
  } else {
    callback(null);
  }
}

var Storage = (function(){
  var cache = {};
  var writeQueue = {};
  var writeTimer = null;
  var processing = false;
  var stats = {reads:0, writes:0, hits:0, misses:0, errors:0};
  var _lfReady = false;
  var _lfFailed = false;
  var lsWriteQueue = {};
  var lsWriteTimer = null;
  
  function markReady(){ _lfReady = true; _lfFailed = false; setTimeout(function(){ restoreFromDB(); }, 300); 
    // 存储健康检测：确认实际使用的 driver 是否为 IndexedDB
    setTimeout(function(){
      try{
        if(window.localforage && window.localforage.driver){
          var drv = window.localforage.driver();
          console.log('[Storage] actual driver:', drv);
          // localforage: INDEXEDDB='asyncStorage' WEBSQL='webSQLStorage' LOCALSTORAGE='localStorageWrapper'
          if(drv === 'localStorageWrapper'){
            try{ if(typeof toast==='function') toast('⚠️ 当前环境 IndexedDB 不可用，数据暂存 localStorage（5MB 上限），建议用服务器/网站方式打开，避免聊天记录丢失'); }catch(e){}
          }
        }
      }catch(e){}
    }, 1500);
  }
  function markFailed(){ _lfFailed = true; _lfReady = false; console.warn('Storage: localforage unavailable, using localStorage fallback'); 
    setTimeout(function(){
      try{ if(typeof toast==='function') toast('⚠️ 本地数据库加载失败，数据只能临时存 localStorage，请勿清除浏览器数据'); }catch(e){}
    }, 1200);
  }
  function isLFAvailable(){ return window.localforage && _lfReady && !_lfFailed; }
  
  function isProtectedKey(key){
    return key.startsWith('ml2_c') || 
           key.startsWith('ml2_p') || 
           key.startsWith('ml2_groups') || 
           key.startsWith('ml2_m_') || 
           key.startsWith('ml2_msg_') || 
           key.startsWith('ml2_noninstant_msg_') ||
           key.startsWith('ml2_card') || 
           key.startsWith('ml2_global_cards') ||
           key.startsWith('ml2_touch') ||
           key.startsWith('ml2_moments') ||
           key.startsWith('ml2_letters') ||
           key.startsWith('ml2_survey') ||
           key.startsWith('ml2_board') ||
           key.startsWith('ml2_decision') ||
           key.startsWith('ml2_call') ||
           key.startsWith('ml2_speed') ||
           key.startsWith('ml2_nav') ||
           key.startsWith('ml2_divine') ||
           key.startsWith('ml2_timeline') ||
           key.startsWith('ml2_dream') ||
           key.startsWith('ml2_star_cal') ||
           key.startsWith('ml2_period') ||
           key.startsWith('ml2_custom') ||
           key.startsWith('ml2_giftbox') ||
           key.startsWith('ml2_gift_daily') ||
           key.startsWith('ml2_custom_gifts') ||
           key.startsWith('ml2_avatar_lib_') ||
           key.startsWith('ml2_avh_') ||
           key.startsWith('ml2_hide_bottom_nav') ||
           key.startsWith('ml2_input_bar_hidden');
  }
  
  function cleanupStorage(){
    flushLSWrites();
  }

  function flushLSWrites(){
    var keys = Object.keys(lsWriteQueue);
    if(keys.length === 0) return;
    for(var i = 0; i < keys.length; i++){
      try { localStorage.setItem('ml2_lf_' + keys[i], lsWriteQueue[keys[i]]); } catch(e) {
        // localStorage 满了——★ 修复：降级分片写入，避免丢失（完整数据在 IndexedDB 里但刷新竞态可能丢）
        console.warn('flushLSWrites: localStorage full for', keys[i], ', sharding');
        try{
          if(typeof _saveToLocalStorageSharded==='function'){
            _saveToLocalStorageSharded(keys[i], lsWriteQueue[keys[i]]);
          }
        }catch(e2){}
      }
    }
    lsWriteQueue = {};
    if(lsWriteTimer){ clearTimeout(lsWriteTimer); lsWriteTimer = null; }
  }

  function scheduleLSFlush(){
    if(lsWriteTimer) return;
    lsWriteTimer = setTimeout(flushLSWrites, 16);
  }
  
  function flushWrites(){
    if(processing || Object.keys(writeQueue).length === 0)return;
    processing = true;
    
    var queue = writeQueue;
    writeQueue = {};
    
    // 优先写入 IndexedDB（直接检查 window.localforage，不依赖 isLFAvailable()），
    // 失败时回退到 localStorage，确保数据不丢失
    for(var k in queue){
      if(queue.hasOwnProperty(k)){
        if(window.localforage){
          window.localforage.setItem(k, queue[k]).catch(function(e){});
        }
        stats.writes++;
      }
    }
    
    processing = false;
    
    if(Object.keys(writeQueue).length > 0){
      setTimeout(flushWrites, 100);
    }
  }
  
  function scheduleFlush(){
    if(writeTimer)clearTimeout(writeTimer);
    writeTimer = setTimeout(flushWrites, 50);
  }
  
  function set(k, v){
    cache[k] = v;
    writeQueue[k] = v;
    scheduleFlush();
    var isLargeDataKey=k.startsWith('ml2_card_img_')||k.startsWith('ml2_msg_img_')||k.startsWith('ml2_msg_voice_')||k.startsWith('ml2_avh_')||k.startsWith('ml2_avatar_lib_');
    // ===== 双写：localStorage 同步可靠（防页面突然关闭丢数据）+ IndexedDB 异步补充（大容量）=====
    if(!isLargeDataKey){
      var serialized = (typeof v === 'object') ? JSON.stringify(v) : v;
      var lsKey = 'ml2_lf_' + k;
      if(serialized.length < 50000){
        try{
          localStorage.setItem(lsKey, serialized);
        }catch(e){
          console.warn('Storage: localStorage full for', k, 'data is in IndexedDB');
          // ★ 修复：localStorage 满时降级分片（OPPO/iOS 等 IndexedDB 不可用或慢时保住数据）
          try{
            if(typeof _saveToLocalStorageSharded==='function'){
              _saveToLocalStorageSharded(k,serialized);
            }
          }catch(e3){}
          if(!window.localforage){
            try{ if(typeof toast==='function') toast('⚠️ 本地存储空间不足，部分数据未能保存'); }catch(e2){}
          }
        }
      }else{
        lsWriteQueue[k] = serialized;
        scheduleLSFlush();
      }
    }
    return true;
  }
  
  // 尝试压缩数据（使用简单的字符串压缩）
  function _tryCompressData(str){
    if(!str || str.length < 100) return null;
    // 对于大数据，使用lz-string压缩（如果可用）
    if(window.LZString){
      try{
        return window.LZString.compress(str);
      }catch(e){}
    }
    return null;
  }
  
  // 分片保存到localStorage（当数据超过5MB限制时）
  // ★ 约定：key 传不带 ml2_lf_ 前缀的原始 key，内部统一加前缀
  function _saveToLocalStorageSharded(key, data){
    var baseKey='ml2_lf_'+key;
    try{
      // 清除旧的分片
      for(var i=0; i<100; i++){
        var oldKey = baseKey + '_shard_' + i;
        if(localStorage.getItem(oldKey) !== null){
          localStorage.removeItem(oldKey);
        }else{
          break;
        }
      }
      
      // 尝试直接保存完整数据
      localStorage.setItem(baseKey, data);
      return;
    }catch(e){
      // 数据太大，需要分片
    }
    
    // 分片保存（每片约2MB）
    var CHUNK_SIZE = 2 * 1024 * 1024;
    var chunks = [];
    for(var i=0; i<data.length; i+=CHUNK_SIZE){
      chunks.push(data.substring(i, i+CHUNK_SIZE));
    }
    
    try{
      // ★ 修复：compressed 改 false（chunks 是未压缩的 substring，避免读端 LZString.decompress 解坏数据）
      localStorage.setItem(baseKey + '_meta', JSON.stringify({chunks: chunks.length, compressed: false}));
      for(var j=0; j<chunks.length; j++){
        localStorage.setItem(baseKey + '_shard_' + j, chunks[j]);
      }
    }catch(e2){
      console.warn('Storage: sharded save failed:', key, e2);
    }
  }
  
  // 为备份创建精简版本（只保留基本字段）
  function _simplifyDataForBackup(key, data){
    if(!Array.isArray(data)) return null;
    
    if(key === 'ml2_c'){
      // 联系人：只保留id和name
      return data.map(function(c){
        return {id: c.id, name: c.name};
      });
    }
    if(key === 'ml2_groups'){
      // 群组：只保留id、name和成员ID
      return data.map(function(g){
        return {id: g.id, name: g.name, memberIds: g.memberIds};
      });
    }
    return null;
  }
  
  function get(k){
    stats.reads++;
    if(cache.hasOwnProperty(k)){
      stats.hits++;
      return cache[k];
    }
    
    stats.misses++;
    var lsVal = safeGetItem('ml2_lf_'+k);
    // ★ 修复：分片读取不依赖主键（分片场景主键必然为空），meta 存在即读分片
    var metaKey = 'ml2_lf_' + k + '_meta';
    var shardMeta = safeGetItem(metaKey);
    if(shardMeta){
      try{
        var meta = JSON.parse(shardMeta);
        if(meta && meta.chunks){
          var reconstructed = '';
          for(var i=0; i<meta.chunks; i++){
            var chunk = safeGetItem('ml2_lf_' + k + '_shard_' + i);
            if(chunk !== null){
              reconstructed += chunk;
            }
          }
          if(meta.compressed && window.LZString){
            reconstructed = window.LZString.decompress(reconstructed);
          }
          if(reconstructed){
            try{ var parsed = JSON.parse(reconstructed); cache[k] = parsed; return parsed; }
            catch(e){ cache[k] = reconstructed; return reconstructed; }
          }
        }
      }catch(e){
        console.warn('Storage: sharded read failed:', k, e);
      }
    }
    if(lsVal !== null){
      // 检查是否是压缩数据（以特定前缀开头）
      if(lsVal && lsVal.startsWith && (lsVal.startsWith('Ŵ') || lsVal.startsWith('x\x9c'))){
        if(window.LZString){
          try{
            var decompressed = window.LZString.decompress(lsVal);
            if(decompressed){
              try{ var parsed2 = JSON.parse(decompressed); cache[k] = parsed2; return parsed2; }
              catch(e2){ cache[k] = decompressed; return decompressed; }
            }
          }catch(e3){}
        }
      }
      
      try{ var parsed = JSON.parse(lsVal); cache[k] = parsed; return parsed; }
      catch(e){ cache[k] = lsVal; return lsVal; }
    }
    
    // 尝试从备份键恢复
    var backupVal = safeGetItem('ml2_lf_' + k + '_backup');
    if(backupVal !== null){
      try{ var parsedBackup = JSON.parse(backupVal); cache[k] = parsedBackup; return parsedBackup; }
      catch(e){}
    }
    
    var directVal = safeGetItem(k);
    if(directVal !== null){
      try{ var parsed = JSON.parse(directVal); cache[k] = parsed; return parsed; }
      catch(e){ cache[k] = directVal; return directVal; }
    }
    
    return null;
  }
  
  async function getAsync(k){
    stats.reads++;
    if(cache.hasOwnProperty(k)){
      stats.hits++;
      return cache[k];
    }
    
    stats.misses++;
    if(window.localforage){
      try{
        var val=await window.localforage.getItem(k);
        if(val!==null&&val!==undefined){
          cache[k]=val;
          return val;
        }
      }catch(e){stats.errors++;}
    }
    var lsVal = safeGetItem('ml2_lf_'+k);
    if(lsVal !== null){
      try{ var parsed = JSON.parse(lsVal); cache[k] = parsed; return parsed; }
      catch(e){ cache[k] = lsVal; return lsVal; }
    }
    return null;
  }
  
  function remove(k){
    delete cache[k];
    delete writeQueue[k];
    if(window.localforage){
      window.localforage.removeItem(k).catch(function(){});
    }
    safeRemoveItem('ml2_lf_'+k);
  }
  
  function clearAll(){
    cache = {};
    writeQueue = {};
    if(window.localforage){
      window.localforage.clear().catch(function(){});
    }
    try {
      var keysToRemove = [];
      for (var i = 0; i < localStorage.length; i++) {
        var lk = localStorage.key(i);
        if (lk && lk.indexOf('ml2_lf_') === 0) {
          keysToRemove.push(lk);
        }
      }
      for (var j = 0; j < keysToRemove.length; j++) {
        safeRemoveItem(keysToRemove[j]);
      }
    } catch(e) {}
  }
  
  function getStats(){
    return JSON.parse(JSON.stringify(stats));
  }
  
  async function restoreFromDB(){
    try{
      var loaded = 0;
      
      if(window.localforage){
        var keys=await window.localforage.keys();
        // ★ 性能修复：跳过图片/语音缓存键（ml2_msg_voice_*/ml2_card_img_voice_*/ml2_msg_img_*等），
        // 它们是渲染时的临时缓存，不需要在启动时逐个恢复解析（数据在 IndexedDB，用时再读）
        // 这能大幅减少启动时的 JSON.parse 次数，避免开屏卡顿
        var filteredKeys=keys.filter(function(k){
          if(!isProtectedKey(k))return false;
          if(k.indexOf('_voice_')>=0||k.indexOf('_img_')>=0||k.indexOf('_orig')>=0||k.indexOf('avatar_lib_')>=0||k.indexOf('_avh_')>=0||k.indexOf('_shard_')>=0||k.indexOf('_meta')>=0)return false;
          return true;
        });
        for(var i=0;i<filteredKeys.length;i++){
          var k=filteredKeys[i];
          var needsLoad=!cache.hasOwnProperty(k);
          var cachedBeforeReload=needsLoad?null:cache[k]; // Bug1修复：保存重载前的缓存，用于后续合并
          if(!needsLoad){
            // 检查缓存是否为空或无效数据
            var cached=cache[k];
            if(cached===null||cached===undefined)needsLoad=true;
            else if(Array.isArray(cached)&&cached.length===0)needsLoad=true;
            else if(Array.isArray(cached)&&k.indexOf(LM)===0)needsLoad=true; // Bug1修复：消息key即使有数据也从IndexedDB重载，防止初始化竞态污染
            else if(!Array.isArray(cached)&&typeof cached==='object'&&cached!==null&&Object.keys(cached).length===0)needsLoad=true;
          }
          if(needsLoad){
            // 先查 localStorage 有没有该键的 ml2_lf_ 备份数据
            var lsBackup=safeGetItem('ml2_lf_'+k);
            var loadedFromLS=false;
            var lsParsed=null;
            var lsIsValidArray=false;
            if(lsBackup!==null){
              try{
                lsParsed=JSON.parse(lsBackup);
                lsIsValidArray=Array.isArray(lsParsed)&&lsParsed.length>0;
                var lsIsValidObject=!Array.isArray(lsParsed)&&lsParsed!==null&&typeof lsParsed==='object'&&Object.keys(lsParsed).length>0;
                var lsIsValidPrimitive=!Array.isArray(lsParsed)&&lsParsed!==null&&typeof lsParsed!=='object';
                // 修复：对于数组类型（特别是信件ml2_letters），不立即使用localStorage备份，
                // 而是先从IndexedDB读取，再比较两者数据量，选择更完整的或合并去重
                if(k===LL){
                  // 信件数据特殊处理：先跳过，读完IndexedDB再合并
                  loadedFromLS=false;
                }else if(lsIsValidArray&&(k.indexOf(LM)===0||k===LC||k==='ml2_moments_posts'||k==='ml2_moments_members')){
                  // ★ Bug4修复：消息/联系人/朋友圈不直接用 localStorage 快照（可能只有少量/旧数据），
                  // 强制读 IndexedDB 后合并取最完整，防止刷新后丢聊天记录/朋友圈/头像
                  loadedFromLS=false;
                }else if(lsIsValidArray){
                  cache[k]=lsParsed;loaded++;loadedFromLS=true;
                }else if(lsIsValidObject||lsIsValidPrimitive){
                  cache[k]=lsParsed;loaded++;loadedFromLS=true;
                }
                // 注意：如果 localStorage 备份是空数组[]、空对象{}、null，则不使用，继续读 IndexedDB
                // 之前的 catch 分支会把原始字符串存入缓存，这可能导致数组解析错误，已移除
              }catch(e){
                // 修复：解析失败时不要把原始字符串写入缓存（尤其是数组类型），
                // 继续尝试从 IndexedDB 读取，避免污染数据
                console.warn('[restoreFromDB] localStorage backup parse failed for key:',k);
                // ★ 清理损坏的 localStorage 键（语音/图片缓存等），释放空间、避免开屏卡顿
                // 完整数据在 IndexedDB（ml2_msg_voice_*/ml2_card_img_voice_* 是临时缓存），删除不影响主数据
                try{
                  safeRemoveItem('ml2_lf_'+k);
                  // 同时删除可能的直存键和分片键
                  safeRemoveItem(k);
                  for(var si=0;si<100;si++){
                    var sk='ml2_lf_'+k+'_shard_'+si;
                    if(localStorage.getItem(sk)!==null)safeRemoveItem(sk);else break;
                  }
                  safeRemoveItem('ml2_lf_'+k+'_meta');
                  console.warn('[restoreFromDB] removed corrupt localStorage key:',k);
                }catch(ce){console.warn('failed to remove corrupt key:',k,ce);}
              }
            }
            if(!loadedFromLS){
              var val=await window.localforage.getItem(k);
              if(val!==null&&val!==undefined){
                var isEmptyArray=Array.isArray(val)&&val.length===0;
                var isEmptyObject=!Array.isArray(val)&&val!==null&&typeof val==='object'&&Object.keys(val).length===0;
                if(!isEmptyArray&&!isEmptyObject){
                  if(k===LL&&lsIsValidArray){
                    // 信件特殊处理：合并 localStorage 备份和 IndexedDB 中的数据，按 id 去重
                    var merged=[];
                    var seen={};
                    (val||[]).forEach(function(x){if(x&&x.id&&!seen[x.id]){seen[x.id]=true;merged.push(x);}});
                    (lsParsed||[]).forEach(function(x){if(x&&x.id&&!seen[x.id]){seen[x.id]=true;merged.push(x);}});
                    merged.sort(function(a,b){return (b.tm||0)-(a.tm||0);});
                    cache[k]=merged;loaded++;loadedFromLS=true;
                    try{safeSetItem('ml2_lf_'+k,JSON.stringify(merged));}catch(e){}
                  }else if(k.indexOf(LM)===0 && (lsParsed||(cachedBeforeReload&&Array.isArray(cachedBeforeReload)&&cachedBeforeReload.length>0))){
                    // Bug1+Bug4修复：消息key合并 IndexedDB + localStorage 备份 + 缓存，按 id 去重，取最完整数据
                    var msgMerged=[];
                    var msgSeen={};
                    (val||[]).forEach(function(x){if(x&&x.id&&!msgSeen[x.id]){msgSeen[x.id]=true;msgMerged.push(x);}});
                    (lsParsed||[]).forEach(function(x){if(x&&x.id&&!msgSeen[x.id]){msgSeen[x.id]=true;msgMerged.push(x);}});
                    (cachedBeforeReload||[]).forEach(function(x){if(x&&x.id&&!msgSeen[x.id]){msgSeen[x.id]=true;msgMerged.push(x);}});
                    cache[k]=msgMerged;loaded++;
                    try{safeSetItem('ml2_lf_'+k,JSON.stringify(msgMerged));}catch(e){}
                  }else if(k===LC&&lsParsed){
                    // ★ 修复：联系人数据（含头像）合并 IndexedDB + localStorage，按 id 去重取最完整，
                    // 防止 OPPO/Edge 上旧 localStorage 快照遮蔽 IndexedDB 新上传的头像
                    var conMerged=[];
                    var conSeen={};
                    (val||[]).forEach(function(x){if(x&&x.id&&!conSeen[x.id]){conSeen[x.id]=true;conMerged.push(x);}});
                    (lsParsed||[]).forEach(function(x){if(x&&x.id&&!conSeen[x.id]){conSeen[x.id]=true;conMerged.push(x);}});
                    cache[k]=conMerged;loaded++;
                    try{safeSetItem('ml2_lf_'+k,JSON.stringify(conMerged));}catch(e){}
                  }else if(k==='ml2_moments_posts'&&lsParsed){
                    // ★ Bug4修复：朋友圈同样合并 IndexedDB + localStorage，按 id 去重取最完整
                    var momMerged=[];
                    var momSeen={};
                    (val||[]).forEach(function(x){if(x&&x.id&&!momSeen[x.id]){momSeen[x.id]=true;momMerged.push(x);}});
                    (lsParsed||[]).forEach(function(x){if(x&&x.id&&!momSeen[x.id]){momSeen[x.id]=true;momMerged.push(x);}});
                    cache[k]=momMerged;loaded++;
                    try{safeSetItem('ml2_lf_'+k,JSON.stringify(momMerged));}catch(e){}
                  }else{
                    cache[k]=val;
                    loaded++;
                    // 同步到 localStorage 作为备份
                    try{safeSetItem('ml2_lf_'+k,typeof val==='string'?val:JSON.stringify(val));}catch(e){}
                  }
                }else if(k===LL&&lsIsValidArray){
                  // IndexedDB 是空的，但 localStorage 备份有数据，就用 localStorage 的
                  cache[k]=lsParsed;loaded++;loadedFromLS=true;
                }
              }else if(k===LL&&lsIsValidArray){
                // IndexedDB 读不到数据，用 localStorage 备份
                cache[k]=lsParsed;loaded++;loadedFromLS=true;
              }
            }
          }
        }
      }
      
      try{
        for(var j=0;j<localStorage.length;j++){
          var lsKey=localStorage.key(j);
          // ★ 性能修复：跳过图片/语音缓存键，避免启动时解析大量 base64 导致卡顿
          if(lsKey&&(lsKey.indexOf('_voice_')>=0||lsKey.indexOf('_img_')>=0||lsKey.indexOf('_orig')>=0||lsKey.indexOf('_avh_')>=0||lsKey.indexOf('_shard_')>=0||lsKey.indexOf('_meta')>=0))continue;
          if(lsKey&&lsKey.startsWith('ml2_')&&!lsKey.startsWith('ml2_lf_')&&!cache.hasOwnProperty(lsKey)){
            var lsVal=safeGetItem(lsKey);
            if(lsVal!==null){
              try{
                var parsed=JSON.parse(lsVal);
                // 跳过空数组和空对象，避免污染缓存导致真实数据无法加载
                var isEmptyArr=Array.isArray(parsed)&&parsed.length===0;
                var isEmptyObj=!Array.isArray(parsed)&&parsed!==null&&typeof parsed==='object'&&Object.keys(parsed).length===0;
                if(!isEmptyArr&&!isEmptyObj){
                  cache[lsKey]=parsed;loaded++;
                }
              }
              catch(e){
                // 解析失败不要写入缓存，尤其是数组类型的键
                if(typeof lsVal==='string'&&!lsVal.startsWith('[')&&!lsVal.startsWith('{')){
                  cache[lsKey]=lsVal;loaded++;
                }
              }
            }
          }
        }
        // 第二遍：主动检查 localStorage ml2_lf_ 键，用真实数据覆盖空缓存
        for(var j2=0;j2<localStorage.length;j2++){
          var _k=localStorage.key(j2);
          // ★ 性能修复：跳过图片/语音缓存键
          if(_k&&(_k.indexOf('_voice_')>=0||_k.indexOf('_img_')>=0||_k.indexOf('_orig')>=0||_k.indexOf('_avh_')>=0||_k.indexOf('_shard_')>=0||_k.indexOf('_meta')>=0))continue;
          if(_k&&_k.startsWith('ml2_lf_ml2_')){
            var origKey=_k.substring(7);
            if(cache.hasOwnProperty(origKey)){
              var cachedData=cache[origKey];
              // 如果缓存中是空数组或空对象，用 localStorage 的真实数据覆盖
              var cachedEmptyArr=Array.isArray(cachedData)&&cachedData.length===0;
              var cachedEmptyObj=!Array.isArray(cachedData)&&cachedData!==null&&typeof cachedData==='object'&&Object.keys(cachedData).length===0;
              if(cachedEmptyArr||cachedEmptyObj){
                var _v=safeGetItem(_k);
                if(_v){
                  try{
                    var _p=JSON.parse(_v);
                    var pIsArrNonEmpty=Array.isArray(_p)&&_p.length>0;
                    var pIsObjNonEmpty=!Array.isArray(_p)&&_p!==null&&typeof _p==='object'&&Object.keys(_p).length>0;
                    if(pIsArrNonEmpty||pIsObjNonEmpty){cache[origKey]=_p;loaded++;}
                  }catch(e2){}
                }
              }else if(origKey===LL&&Array.isArray(cachedData)){
                // 信件额外兜底：合并 localStorage 备份中缓存中没有的信件
                var _vv=safeGetItem(_k);
                if(_vv){
                  try{
                    var _pp=JSON.parse(_vv);
                    if(Array.isArray(_pp)&&_pp.length>cachedData.length){
                      var _seen={};
                      cachedData.forEach(function(x){if(x&&x.id)_seen[x.id]=true;});
                      var _added=0;
                      _pp.forEach(function(x){
                        if(x&&x.id&&!_seen[x.id]){_seen[x.id]=true;cachedData.push(x);_added++;}
                      });
                      if(_added>0){
                        cachedData.sort(function(a,b){return (b.tm||0)-(a.tm||0);});
                        cache[origKey]=cachedData;loaded++;
                      }
                    }
                  }catch(e3){}
                }
              }else if(origKey.startsWith('ml2_m_')&&Array.isArray(cachedData)){
                // ★ 修复：聊天记录——localStorage 为最新，按 id 合并 IndexedDB 中没有的消息
                var _mv=safeGetItem(_k);
                if(_mv){
                  try{
                    var _mp=JSON.parse(_mv);
                    if(Array.isArray(_mp)&&_mp.length>0){
                      var _mseen={};
                      cachedData.forEach(function(x){if(x&&x.id)_mseen[x.id]=true;});
                      var _madded=0;
                      _mp.forEach(function(x){
                        if(x&&x.id&&!_mseen[x.id]){_mseen[x.id]=true;cachedData.push(x);_madded++;}
                      });
                      if(_madded>0){
                        cachedData.sort(function(a,b){return (b.tm||0)-(a.tm||0);});
                        cache[origKey]=cachedData;loaded++;
                      }
                    }
                  }catch(e4){}
                }
              }else if(origKey==='ml2_moments_posts'&&Array.isArray(cachedData)){
                // ★ 修复：朋友圈——localStorage 为最新，合并 IndexedDB 中没有的
                var _mv2=safeGetItem(_k);
                if(_mv2){
                  try{
                    var _mp2=JSON.parse(_mv2);
                    if(Array.isArray(_mp2)&&_mp2.length>0){
                      var _mseen2={};
                      cachedData.forEach(function(x){if(x&&x.id)_mseen2[x.id]=true;});
                      var _madded2=0;
                      _mp2.forEach(function(x){
                        if(x&&x.id&&!_mseen2[x.id]){_mseen2[x.id]=true;cachedData.push(x);_madded2++;}
                      });
                      if(_madded2>0){
                        cachedData.sort(function(a,b){return (b.timestamp||b.tm||0)-(a.timestamp||a.tm||0);});
                        cache[origKey]=cachedData;loaded++;
                      }
                    }
                  }catch(e5){}
                }
              }
            }
          }
        }
      }catch(e){console.warn('restoreFromDB localStorage failed:',e);}
      
      if(loaded>0)console.log('restoreFromDB: loaded '+loaded+' keys');
      // ★ 一次性清理：删除 localStorage 中历史遗留的语音/图片缓存键（完整数据在 IndexedDB）
      // 这些键（ml2_msg_voice_*/ml2_msg_img_*/ml2_card_img_voice_* 等）是渲染临时缓存，
      // 之前被错误写入 localStorage 导致 5MB 爆满、开屏卡顿。IndexedDB 里才是完整数据。
      try{
        var _cleanRemoved=0;
        for(var ci=0;ci<localStorage.length;ci++){
          var ck=localStorage.key(ci);
          if(!ck)continue;
          var isCacheKey=ck.indexOf('_voice_')>=0||ck.indexOf('_img_')>=0||ck.indexOf('_orig')>=0||ck.indexOf('_avh_')>=0;
          // ★ 修复：ml2_avh_* 是用户上传的头像历史（IndexedDB 不可用时降级存 localStorage），
          // 不能删——删了联系人头像引用会失效。仅清理 ml2_msg_/ml2_card_ 的临时图片/语音缓存
          var isAvatarHistory=ck.indexOf('ml2_avh_')===0;
          if(isCacheKey&&!isAvatarHistory&&(ck.indexOf('ml2_')===0||ck.indexOf('ml2_lf_')===0)){
            try{
              localStorage.removeItem(ck);
              _cleanRemoved++;
            }catch(ce2){}
          }
        }
        if(_cleanRemoved>0)console.warn('[restoreFromDB] cleaned '+_cleanRemoved+' cached image/voice keys from localStorage');
      }catch(ce3){console.warn('cleanup cache keys failed:',ce3);}
    }catch(e){
      console.warn('restoreFromDB failed:',e);
    }
  }
  
  function init(){
    // 诊断：启动时记录关键存储状态
    setTimeout(function(){
      var diag={};
      ['ml2_c','ml2_nav_cards_public','ml2_global_cards','ml2_moments_posts','ml2_call_settings'].forEach(function(k){
        var ls=!!safeGetItem('ml2_lf_'+k);
        var dr=!!safeGetItem(k);
        var ch=cache.hasOwnProperty(k);
        diag[k]={localStorage:ls,direct:dr,cache:ch};
      });
      console.log('[Storage] init diagnostics:',JSON.stringify(diag));
    },1000);
    
    try{
      if(window.localforage){
        window.localforage.getItem('ml2_storage_stats').then(function(val){
          if(val)try{stats=JSON.parse(val)}catch(e){}
        }).catch(function(){});
      }
    }catch(e){}
    

    
    setTimeout(function(){
      restoreFromDB();
    }, 500);
    
    setInterval(function(){
      try{
      if(window.localforage){
        window.localforage.setItem('ml2_storage_stats', JSON.stringify(stats)).catch(function(){});
      }
      }catch(e){console.warn('storage stats sync error:',e);}
    }, 60000);
  }
  
  return{
    set: set,
    get: get,
    getAsync: getAsync,
    remove: remove,
    clearAll: clearAll,
    init: init,
    getStats: getStats,
    cache: cache,
    flushWrites: flushWrites,
    flushLSWrites: flushLSWrites,
    markReady: markReady,
    markFailed: markFailed,
    isLFAvailable: isLFAvailable
  };
})();

Storage.init();
loadCardPrivateContacts();
setTimeout(function(){seedDefaultNavCards().catch(function(e){console.warn('seedDefaultNavCards delayed failed:',e);});}, 1500);

setTimeout(function(){
  if(!window.html2canvas){
    var script=document.createElement('script');
    script.src='https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
    script.async=true;
    script.defer=true;
    document.head.appendChild(script);
  }
}, 3000);

window.addEventListener('beforeunload', function(){
  // === 关键修复：页面关闭前同步保存所有数据 ===
  // 1. 先刷新 lsWriteQueue 中的数据
  if(Storage.flushLSWrites) Storage.flushLSWrites();
  // 2. 遍历内存缓存，确保所有数据都写入 localStorage
  try{
    if(Storage.cache){
      for(var key in Storage.cache){
        if(Storage.cache.hasOwnProperty(key)){
          var val = Storage.cache[key];
          // 跳过大数据键
          if(key.startsWith('ml2_card_img_') || key.startsWith('ml2_msg_img_') || key.startsWith('ml2_msg_voice_') || key.startsWith('ml2_avh_') || key.startsWith('ml2_avatar_lib_')) continue;
          try{
            var strVal = (typeof val === 'object') ? JSON.stringify(val) : String(val);
            localStorage.setItem('ml2_lf_' + key, strVal);
          }catch(e){}
        }
      }
    }
  }catch(e){}
  // 3. 刷新 IndexedDB 写入
  if(Storage.flushWrites) Storage.flushWrites();
});
// ★ 修复：OPPO 等安卓浏览器后台/切走时可能不触发 beforeunload，补 pagehide + visibilitychange 同步保存
function _flushAllDataSync(){
  try{
    if(Storage.flushLSWrites) Storage.flushLSWrites();
    if(Storage.cache){
      for(var _k in Storage.cache){
        if(Storage.cache.hasOwnProperty(_k)){
          var _v=Storage.cache[_k];
          if(_k.startsWith('ml2_card_img_')||_k.startsWith('ml2_msg_img_')||_k.startsWith('ml2_msg_voice_')||_k.startsWith('ml2_avh_')||_k.startsWith('ml2_avatar_lib_'))continue;
          try{
            var _sv=(typeof _v==='object')?JSON.stringify(_v):String(_v);
            localStorage.setItem('ml2_lf_'+_k,_sv);
          }catch(e){}
        }
      }
    }
    if(Storage.flushWrites) Storage.flushWrites();
  }catch(e){}
}
window.addEventListener('pagehide',_flushAllDataSync);
document.addEventListener('visibilitychange',function(){
  if(document.visibilityState==='hidden')_flushAllDataSync();
});

var memoryCache = Storage.cache;
var saveTimeout = null;

function ls(k, v){
  if(v !== undefined){
    return Storage.set(k, v);
  }
  return Storage.get(k);
}

async function lsGetWithDB(k){
  if(memoryCache.hasOwnProperty(k)){
    return memoryCache[k];
  }
  
  if(window.localforage){
    try{
      var dbVal=await window.localforage.getItem(k);
      if(dbVal!==null&&dbVal!==undefined){
        if(typeof dbVal==='string'){
          try{
            dbVal=JSON.parse(dbVal);
          }catch(e){}
        }
        memoryCache[k]=dbVal;
        return dbVal;
      }
    }catch(e){}
  }
  return null;
}

function throttledSaveData() {
    if (contacts.length > 0 && window.localforage) {
        window.localforage.setItem(LC, contacts).catch(function(){});
    }
    if (me && Object.keys(me).length > 0 && window.localforage) {
        window.localforage.setItem(LP, me).catch(function(){});
    }
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(function() {
        if (contacts.length > 0) {
            ls(LC, contacts);
        }
        if (me && Object.keys(me).length > 0) {
            ls(LP, me);
        }
        if (divineTargets && divineTargets.length > 0) ls('divine_targets', divineTargets);
        if (taHighlightProbability !== undefined) ls('ml2_ta_highlight_probability', taHighlightProbability);
        if (taHighlightLastTriggerDate !== undefined) ls('ml2_ta_highlight_last_trigger_date', taHighlightLastTriggerDate);
    }, 500);
}

function saveWithDB(k, v) {
    return new Promise(function(resolve) {
        var result = ls(k, v);
        resolve(result);
    });
}

function loadWithDB(k) {
    return new Promise(function(resolve) {
        var val = ls(k);
        resolve(val);
    });
}

function lsGet(k) {
    var val = ls(k);
    if (val !== null) return val;
    return null;
}

function lsSet(k, v) {
    return ls(k, v);
}


var loadingContacts=false;
async function migrateFromOldApp(){
  var migrated=ls('ml2_migrated_from_old');
  if(migrated)return;
  
  try{
    var oldContacts=[];
    
    if(window.localforage){
      try{
        var sessionList=await window.localforage.getItem('CHAT_APP_V3_sessionList');
        if(sessionList&&Array.isArray(sessionList)){
          sessionList.forEach(function(session){
            if(session.id&&session.name){
              oldContacts.push({
                id:session.id,
                name:session.name,
                avatar:'',
                myAvatar:'',
                wxid:'',
                lastMsg:'',
                lastMsgTime:0,
                unread:0,
                chatSettings:getDefaultChatSettings(),
                speedSettings:{},
                letterSettings:{},
                cardSettings:{},
                callSettings:{},
                touchSettings:{},
                navStatus:'',
                createdAt:Date.now(),
                updatedAt:Date.now()
              });
            }
          });
        }
        
        for(var i=0;i<oldContacts.length;i++){
          var c=oldContacts[i];
          try{
            var avatar=await window.localforage.getItem('CHAT_APP_V3_'+c.id+'_partnerAvatar');
            if(avatar&&avatar.startsWith('data:')){
              c.avatar=avatar;
            }
          }catch(e){}
          
          try{
            var myAvatar=await window.localforage.getItem('CHAT_APP_V3_'+c.id+'_myAvatar');
            if(myAvatar&&myAvatar.startsWith('data:')){
              c.myAvatar=myAvatar;
            }
          }catch(e){}
          
          try{
            var msgs=await window.localforage.getItem('CHAT_APP_V3_'+c.id+'_chatMessages');
            if(msgs&&Array.isArray(msgs)){
              var newMsgs=msgs.map(function(m){
                return {
                  id:'msg_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),
                  t:m.content||m.text||'',
                  s:m.sender==='user'?SELF:OTHER,
                  d:new Date(m.timestamp||Date.now()).getTime(),
                  read:true,
                  liked:m.liked||false,
                  img:m.imageUrl||m.image||'',
                  voice:m.voiceUrl||'',
                  voiceDuration:m.voiceDuration||0,
                  quoteId:m.quoteId||null,
                  quoteText:m.quoteText||'',
                  sticker:m.sticker||'',
                  card:m.card||'',
                  retracted:m.retracted||false,
                  system:m.type==='system'||false,
                  proactive:m.proactive||false,
                  readIgnored:m.readIgnored||false
                };
              });
              msgs(c.id,newMsgs);
            }
          }catch(e){}
          
          try{
            var moments=await window.localforage.getItem('CHAT_APP_V3_'+c.id+'_moments');
            if(moments&&Array.isArray(moments)){
              moments.forEach(function(m){
                if(!momentsPosts.some(function(mp){return mp.id===m.id})){
                  momentsPosts.push({
                    id:m.id||'m_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
                    authorId:c.id,
                    content:m.content||'',
                    images:m.images||[],
                    likes:[],
                    comments:[],
                    timestamp:m.timestamp||Date.now(),
                    location:m.location||''
                  });
                }
              });
            }
          }catch(e){}
        }
      }catch(e){
        console.error('Migration from localforage failed:',e);
      }
    }
    
    if(oldContacts.length>0){
      var existingContacts=ls(LC)||[];
      if(!Array.isArray(existingContacts))existingContacts=[];
      
      oldContacts.forEach(function(newC){
        var exists=existingContacts.some(function(c){return c.id===newC.id});
        if(!exists){
          existingContacts.push(newC);
        }
      });
      
      ls(LC,existingContacts);
      ls('ml2_migrated_from_old',true);
      ls('ml2_moments_posts',momentsPosts);
      toast('已迁移 '+oldContacts.length+' 个联系人和数据');
    }
  }catch(e){
    console.error('Migration error:',e);
  }
}

async function loadC(){
  if(loadingContacts)return;
  loadingContacts=true;
  try{
    await migrateFromOldApp();
    
    var localStorageData=null;
    
    // ★ 修复：优先从 localStorage 读取（保存是同步成功的，最可靠）
    // 原实现先读 IndexedDB：若 IndexedDB 是旧数据（异步写入失败/延迟），会覆盖 localStorage 里新保存的联系人
    var lsCache=ls(LC);
    if(lsCache&&Array.isArray(lsCache)&&lsCache.length>0){
      localStorageData=lsCache;
    }
    if(!localStorageData||!Array.isArray(localStorageData)||localStorageData.length===0){
      var lsFallback=safeGetItem('ml2_lf_'+LC);
      if(lsFallback){
        try{localStorageData=JSON.parse(lsFallback)}catch(e){localStorageData=lsFallback}
      }
    }
    if(!localStorageData||!Array.isArray(localStorageData)||localStorageData.length===0){
      var directLS=safeGetItem(LC);
      if(directLS){
        try{localStorageData=JSON.parse(directLS)}catch(e){localStorageData=directLS}
      }
    }
    
    // IndexedDB 作为补充：localStorage 为主（最新），IndexedDB 只补充 localStorage 没有的联系人，绝不覆盖
    if(window.localforage){
      try{
        var lfVal=await window.localforage.getItem(LC);
        if(lfVal!==null&&lfVal!==undefined){
          var lfData=null;
          if(typeof lfVal==='string'){
            try{lfData=JSON.parse(lfVal)}catch(e){lfData=null}
          }else{
            lfData=lfVal;
          }
          if(Array.isArray(lfData)&&lfData.length>0){
            if(!localStorageData||!Array.isArray(localStorageData)||localStorageData.length===0){
              localStorageData=lfData;
            }else{
              var lsIds={};
              localStorageData.forEach(function(c){if(c&&c.id)lsIds[c.id]=true;});
              lfData.forEach(function(c){
                if(c&&c.id&&!lsIds[c.id]){
                  localStorageData.push(c);
                }
              });
            }
          }
        }
      }catch(e){console.warn('loadC localforage failed:',e);}
    }
    
    if(localStorageData&&Array.isArray(localStorageData)){
      contacts=localStorageData;
      memoryCache[LC]=localStorageData;
    }else{
      contacts=[];
    }
    // ★ 修复：合并单独存储的头像（saveC 时剥离的大 base64），刷新后头像不丢失
    try{
      contacts.forEach(function(c){
        if(c&&c.id){
          var _av=null;
          try{_av=localStorage.getItem('ml2_contact_avatar_'+c.id);}catch(e){}
          if(_av&&(!c.avatar||c.avatar.length<500)){
            c.avatar=_av;
          }
        }
      });
    }catch(e){console.warn('loadC avatar merge failed:',e);}
  }catch(e){
    console.error('Failed to load contacts:',e);
    contacts=[];
  }
  
  var seen={};
  contacts=contacts.filter(function(c){
    if(!c||!c.name||!c.id||seen[c.id])return false;
    seen[c.id]=true;
    return true;
  });
  
  try{
    await resolveContactAvatars();
  }catch(e){
    console.error('resolveContactAvatars failed:',e);
  }
  loadingContacts=false;
}
async function resolveContactAvatars(){
  // 优化：并行处理所有联系人头像（原来串行for循环，N个联系人=N次串行await）
  var tasks=[];
  for(var i=0;i<contacts.length;i++){
    (function(c){
      tasks.push((async function(){
        // 处理联系人头像
        if(c.avatar){
          if(c.avatar.startsWith('data:image/')){
            // 已经是base64格式，直接使用
            // 同时保存一份到localforage作为备份
            if(window.localforage){
              var avatarKey='ml2_avatar_'+c.id;
              try{await window.localforage.setItem(avatarKey,c.avatar);}catch(e){}
            }
          }else if(c.avatar.startsWith('ml2_avatar_')){
            // 是引用ID，从localforage或localStorage读取
            var imgData=null;
            if(window.localforage){
              try{imgData=await window.localforage.getItem(c.avatar);}catch(e){}
            }
            // 如果localforage读取失败，尝试从localStorage读取
            if(!imgData){
              try{imgData=localStorage.getItem(c.avatar);}catch(e){}
            }
            if(imgData){
              c.avatar=imgData;
              // 更新联系人数据（非阻塞）
              saveC();
            }else{
              console.warn('resolveContactAvatars: avatar not found for', c.id);
            }
          }
        }
        // 处理我的头像
        if(c.myAvatar){
          if(c.myAvatar.startsWith('data:image/')){
            if(window.localforage){
              var myAvatarKey='ml2_myavatar_'+c.id;
              try{await window.localforage.setItem(myAvatarKey,c.myAvatar);}catch(e){}
            }
          }else if(c.myAvatar.startsWith('ml2_myavatar_')){
            var myImgData=null;
            if(window.localforage){
              try{myImgData=await window.localforage.getItem(c.myAvatar);}catch(e){}
            }
            if(!myImgData){
              try{myImgData=localStorage.getItem(c.myAvatar);}catch(e){}
            }
            if(myImgData){
              c.myAvatar=myImgData;
              saveC();
            }
          }
        }
      })());
    })(contacts[i]);
  }
  // 并行执行所有头像解析任务
  await Promise.all(tasks);
}
function loadDivineTargets(){
  try{
    var saved=ls('divine_targets');
    if(saved&&Array.isArray(saved)){
      divineTargets=saved;
    }else{
      divineTargets=[];
    }
  }catch(e){
    console.error('Failed to load divine targets:',e);
    divineTargets=[];
  }
}
async function loadGroups(){
  try{
    var saved=ls('ml2_groups');
    if(saved&&Array.isArray(saved)){
      groups=saved;
    }else{
      groups=[];
    }
  }catch(e){
    console.error('Failed to load groups:',e);
    groups=[];
  }
}
function saveDivineTargets(){ls('divine_targets',divineTargets)}
function loadP(){me=ls(LP)||{name:'我',avatar:'',wxid:'',momentsCover:''};_loadMyImagesSync()}
async function loadPAsync(){
  me=ls(LP)||{name:'我',avatar:'',wxid:'',momentsCover:''};
  if(window.localforage&&(!me||Object.keys(me).length<=1)){
    try{
      var dbMe=await window.localforage.getItem(LP);
      if(dbMe&&typeof dbMe==='object'&&dbMe.name){
        me=dbMe;
        ls(LP,me);
      }
    }catch(e){}
  }
  if(!me||Object.keys(me).length<=1){
    var lsFallback=safeGetItem('ml2_lf_'+LP);
    if(lsFallback){
      try{me=JSON.parse(lsFallback)}catch(e){me=lsFallback}
    }
  }
  await _loadMyImagesAsync();
}
async function saveP(){
  var data={};
  for(var k in me){
    if(me.hasOwnProperty(k)&&k!=='avatar'&&k!=='momentsCover'){
      data[k]=me[k];
    }
  }
  ls(LP,data);
  // === 关键修复：头像/封面完整数据写入，绝不精简 ===
  // 1. 同步写入 localStorage
  // 2. 如果 localStorage 满了，跳过——完整数据在 IndexedDB
  if(me.avatar){
    try{localStorage.setItem(LP+'_avatar', me.avatar);}catch(e){
      console.warn('saveP: localStorage full for avatar, full data is in IndexedDB');
    }
    try{localStorage.setItem('ml2_lf_'+LP+'_avatar', me.avatar);}catch(e){}
  }else{
    try{localStorage.removeItem(LP+'_avatar');}catch(e){}
    try{localStorage.removeItem('ml2_lf_'+LP+'_avatar');}catch(e){}
  }
  if(me.momentsCover){
    try{localStorage.setItem(LP+'_cover', me.momentsCover);}catch(e){
      console.warn('saveP: localStorage full for cover, full data is in IndexedDB');
    }
    try{localStorage.setItem('ml2_lf_'+LP+'_cover', me.momentsCover);}catch(e){}
  }else{
    try{localStorage.removeItem(LP+'_cover');}catch(e){}
    try{localStorage.removeItem('ml2_lf_'+LP+'_cover');}catch(e){}
  }
  if(window.localforage){
    try{await window.localforage.setItem(LP,data);}catch(e){console.warn('saveP localforage failed:',e);}
    try{
      if(me.avatar){await window.localforage.setItem(LP+'_avatar', me.avatar);}
      else{await window.localforage.removeItem(LP+'_avatar');}
      if(me.momentsCover){await window.localforage.setItem(LP+'_cover', me.momentsCover);}
      else{await window.localforage.removeItem(LP+'_cover');}
    }catch(e){console.warn('saveP image failed:',e);}
  }
}
function _loadMyImagesSync(){
  try{
    var av=localStorage.getItem('ml2_lf_'+LP+'_avatar')||localStorage.getItem(LP+'_avatar');
    if(av)me.avatar=av;
    var cv=localStorage.getItem('ml2_lf_'+LP+'_cover')||localStorage.getItem(LP+'_cover');
    if(cv)me.momentsCover=cv;
  }catch(e){}
}
async function _loadMyImagesAsync(){
  if(!window.localforage)return;
  try{
    var av=await window.localforage.getItem(LP+'_avatar');
    if(av){me.avatar=av;try{localStorage.setItem(LP+'_avatar',av);}catch(e){}}
    var cv=await window.localforage.getItem(LP+'_cover');
    if(cv){me.momentsCover=cv;try{localStorage.setItem(LP+'_cover',cv);}catch(e){}}
  }catch(e){}
}
async function msgsAsync(id){
  var key=LM+id;
  var cached=memoryCache[key];
  if(cached && Array.isArray(cached) && cached.length > 0){
    return cached;
  }
  
  var lsVal=null;
  var m=[];
  
  if(window.localforage){
    try{
      var dbVal=await window.localforage.getItem(key);
      if(dbVal&&Array.isArray(dbVal)){
        m=dbVal;
      }
    }catch(e){console.warn('localforage load failed:',e);}
  }
  
  if(!m||!Array.isArray(m)){
    m=[];
  }
  
  for(var i=0;i<m.length;i++){
    var x=m[i];
    if(!(x.ts instanceof Date)){
      x.ts=new Date(x.ts);
    }
    if(x.read===undefined){
      x.read=true;
    }
    if(x.img&&typeof x.img==='string'&&x.img.startsWith('ml2_msg_img_')){
      var imgCached=memoryCache['_img_'+x.img];
      if(imgCached){
        x.img=imgCached;
      }else if(window.localforage){
        try{
          var imgData=await window.localforage.getItem(x.img);
          if(imgData){
            memoryCache['_img_'+x.img]=imgData;
            x.img=imgData;
          }
        }catch(e){}
      }
    }
    if(x.originalImg&&typeof x.originalImg==='string'&&x.originalImg.startsWith('ml2_msg_img_')){
      var cachedOrig=memoryCache['_img_'+x.originalImg];
      if(cachedOrig){
        x.originalImg=cachedOrig;
      }else if(window.localforage){
        try{
          var origData=await window.localforage.getItem(x.originalImg);
          if(origData){
            memoryCache['_img_'+x.originalImg]=origData;
            x.originalImg=origData;
          }
        }catch(e){}
      }
    }
    if(x.voice&&typeof x.voice==='string'&&x.voice.startsWith('ml2_msg_voice_')){
      var cachedVoice=memoryCache['_img_'+x.voice];
      if(cachedVoice){
        x.voice=cachedVoice;
      }else if(window.localforage){
        try{
          var voiceData=await window.localforage.getItem(x.voice);
          if(voiceData){
            memoryCache['_img_'+x.voice]=voiceData;
            x.voice=voiceData;
          }
        }catch(e){}
      }
    }
  }
  memoryCache[key]=m;
  return m;
}

function msgs(id){
  var key=LM+id;
  var cached=memoryCache[key];
  if(cached && Array.isArray(cached) && cached.length > 0){
    return cached;
  }
  var lsVal=ls(key);
  var m=lsVal||[];
  if(!m||!m.length){
    try{var localStored=safeGetItem('ml2_lf_'+key);if(localStored)m=JSON.parse(localStored);}catch(e){}
  }
  // ★ 修复：分片读取无条件执行（分片场景主键可能残留旧值），meta 存在即用分片数据
  try{
    var _meta=safeGetItem('ml2_lf_'+key+'_meta');
    if(_meta){
      var _metaObj=JSON.parse(_meta);
      if(_metaObj&&_metaObj.chunks){
        var _rec='';
        for(var _ci=0;_ci<_metaObj.chunks;_ci++){
          var _ch=safeGetItem('ml2_lf_'+key+'_shard_'+_ci);
          if(_ch!==null)_rec+=_ch;
        }
        if(_metaObj.compressed&&window.LZString)_rec=window.LZString.decompress(_rec);
        if(_rec){
          var _parsed=JSON.parse(_rec);
          if(Array.isArray(_parsed)&&_parsed.length>0)m=_parsed;
        }
      }
    }
  }catch(e){}
  if(!m||!m.length){
    try{var directStored=safeGetItem(key);if(directStored)m=JSON.parse(directStored);}catch(e){}
  }
  // 如果localStorage中没有数据，尝试从localforage异步加载
  if((!m||!m.length) && window.localforage){
    // 标记该 key 正在从 IndexedDB 加载，防止 savemsgs 在数据返回前用少量消息覆盖
    _msgLoadingKeys[key]=true;
    window.localforage.getItem(key).then(function(dbVal){
      _msgLoadingKeys[key]=false;
      if(dbVal && Array.isArray(dbVal) && dbVal.length > 0){
        // 关键修复：合并 memoryCache 中可能已存在的新消息，避免覆盖
        var existingCache=memoryCache[key];
        if(existingCache&&Array.isArray(existingCache)&&existingCache.length>0){
          var existingIds={};
          dbVal.forEach(function(x){if(x&&x.id)existingIds[x.id]=true;});
          var newMsgs=existingCache.filter(function(x){return x&&x.id&&!existingIds[x.id];});
          if(newMsgs.length>0){
            dbVal=dbVal.concat(newMsgs);
          }
        }
        dbVal.forEach(function(x){
          if(!(x.ts instanceof Date))x.ts=new Date(x.ts);
          if(x.read===undefined)x.read=true;
        });
        memoryCache[key]=dbVal;
        // 保存回 localStorage，确保后续同步读取可用
        ls(key,dbVal);
        // 更新联系人列表
        try{renderChatList();}catch(e){}
        // 如果正在查看该会话，重新渲染
        if(cid===id){
          try{renderMsgs();}catch(e){}
        }
      }
    }).catch(function(){_msgLoadingKeys[key]=false;});
  }

  m.forEach(function(x){
    if(!(x.ts instanceof Date)){
      x.ts=new Date(x.ts);
    }
    if(x.read===undefined){
      x.read=true;
    }
    if(x.img&&typeof x.img==='string'&&x.img.startsWith('ml2_msg_img_')){
      var imgCached=memoryCache['_img_'+x.img];
      if(imgCached){
        x.img=imgCached;
      }else{
        var lsImg=safeGetItem(x.img);
        if(lsImg){
          memoryCache['_img_'+x.img]=lsImg;
          x.img=lsImg;
        }
      }
    }
    if(x.originalImg&&typeof x.originalImg==='string'&&x.originalImg.startsWith('ml2_msg_img_')){
      var cachedOrig=memoryCache['_img_'+x.originalImg];
      if(cachedOrig){
        x.originalImg=cachedOrig;
      }else{
        var lsOrig=safeGetItem(x.originalImg);
        if(lsOrig){
          memoryCache['_img_'+x.originalImg]=lsOrig;
          x.originalImg=lsOrig;
        }
      }
    }
    if(x.voice&&typeof x.voice==='string'&&x.voice.startsWith('ml2_msg_voice_')){
      var cachedVoice=memoryCache['_img_'+x.voice];
      if(cachedVoice){
        x.voice=cachedVoice;
      }else{
        var lsVoice=safeGetItem(x.voice);
        if(lsVoice){
          memoryCache['_img_'+x.voice]=lsVoice;
          x.voice=lsVoice;
        }
      }
    }
    // Resolve legacy image-in-text keys
    if(x.t&&typeof x.t==='string'&&x.t.startsWith('ml2_msg_img_')){
      var tCached=memoryCache['_img_'+x.t];
      if(tCached){
        x.t=tCached;
      }else{
        var lsT=safeGetItem(x.t);
        if(lsT){
          memoryCache['_img_'+x.t]=lsT;
          x.t=lsT;
        }
      }
    }
    if(x.imgs&&Array.isArray(x.imgs)){
      x.imgs=x.imgs.map(function(im){
        if(im&&typeof im==='string'&&im.startsWith('ml2_msg_img_')){
          var imCached=memoryCache['_img_'+im];
          if(imCached)return imCached;
          var lsIm=safeGetItem(im);
          if(lsIm){memoryCache['_img_'+im]=lsIm;return lsIm;}
          return im;
        }
        return im;
      });
    }
  });
  
  // Batch resolve any remaining image/voice keys from localforage
  if(window.localforage){
    var _pendingKeys=[];
    m.forEach(function(x){
      ['img','originalImg','voice','t'].forEach(function(f){
        var v=x[f];
        if(v&&typeof v==='string'&&v.startsWith('ml2_msg_')){
          if(!memoryCache['_img_'+v]&&!safeGetItem(v)){
            _pendingKeys.push({key:v,msg:x,field:f});
          }
        }
      });
      if(x.imgs&&Array.isArray(x.imgs)){
        x.imgs.forEach(function(im){
          if(im&&typeof im==='string'&&im.startsWith('ml2_msg_')&&!memoryCache['_img_'+im]&&!safeGetItem(im)){
            _pendingKeys.push({key:im,msg:x,field:'_imgs_'});
          }
        });
      }
    });
    if(_pendingKeys.length>0){
      var _uniqueKeys=[];
      var _seen={};
      _pendingKeys.forEach(function(p){
        if(!_seen[p.key]){_seen[p.key]=true;_uniqueKeys.push(p.key);}
      });
      Promise.all(_uniqueKeys.map(function(k){
        return window.localforage.getItem(k).then(function(d){
          if(d){memoryCache['_img_'+k]=d;}
          return null;
        }).catch(function(){return null;});
      })).then(function(){
        if(cid===id){try{renderMsgs(msgs(cid));}catch(e){}}
      });
    }
  }
  
  memoryCache[key]=m;
  return m;
}

async function preloadMsgImages(){
  if(!window.localforage)return;
  var keys=[];
  try{
    var allKeys=await window.localforage.keys();
    for(var i=0;i<allKeys.length;i++){
      var k=allKeys[i];
      if(k&&k.indexOf(LM)===0)keys.push(k);
    }
  }catch(e){
    return;
  }
  var refKeys=[];
  if(window.localforage){
    var promises=keys.map(function(k){
      return window.localforage.getItem(k).then(function(raw){
        if(!raw)return;
        var msgs=raw;
        if(typeof raw==='string'){
          try{msgs=JSON.parse(raw)}catch(e){return;}
        }
        if(!Array.isArray(msgs))return;
        for(var mi=0;mi<msgs.length;mi++){
          var img=msgs[mi].img;
          if(img&&typeof img==='string'&&img.startsWith('ml2_msg_img_')){
            if(refKeys.indexOf(img)<0)refKeys.push(img);
          }
          var origImg=msgs[mi].originalImg;
          if(origImg&&typeof origImg==='string'&&origImg.startsWith('ml2_msg_img_')){
            if(refKeys.indexOf(origImg)<0)refKeys.push(origImg);
          }
        }
      }).catch(function(){});
    });
    await Promise.all(promises);
  }
  if(refKeys.length){
    var promises=refKeys.map(function(k){
      return window.localforage.getItem(k).then(function(d){
        if(d){
          memoryCache['_img_'+k]=d;
        }else{
          // 兜底:尝试从localStorage读取
          try{
            var raw=safeGetItem(k);
            if(!raw)raw=safeGetItem('ml2_lf_'+k);
            if(raw)memoryCache['_img_'+k]=raw;
          }catch(e){}
        }
      }).catch(function(){});
    });
    await Promise.all(promises);
  }
}

async function migrateMsgsImages(){
  if(!window.localforage)return;
  var migrated=ls('ml2_msg_migrated');
  if(migrated)return;
  var count=0;
  var keys=[];
  if(window.localforage){
    var dbKeys=await window.localforage.keys();
    for(var i=0;i<dbKeys.length;i++){
      var k=dbKeys[i];
      if(k&&k.indexOf(LM)===0)keys.push(k);
    }
    for(var j=0;j<keys.length;j++){
      var k=keys[j];
      try{
        var raw=await window.localforage.getItem(k);
        if(!raw)continue;
        var msgs=raw;
        if(typeof raw==='string'){
          try{msgs=JSON.parse(raw)}catch(e){continue;}
        }
        if(!Array.isArray(msgs))continue;
        var changed=false;
        for(var mi=0;mi<msgs.length;mi++){
          var msg=msgs[mi];
          if(msg.img&&msg.img.length>1024&&msg.img.startsWith('data:image/')){
            var imgKey='ml2_msg_img_'+msg.id;
            await window.localforage.setItem(imgKey,msg.img);
            msg.img=imgKey;
            changed=true;
            count++;
          }
        }
        if(changed){
          ls(k,msgs);
        }
      }catch(e){}
    }
  }

  ls('ml2_msg_migrated',true);
}

async function migrateOrigImgs(){
  if(!window.localforage)return;
  var migrated=ls('ml2_orig_migrated');
  if(migrated)return;
  var count=0;
  var keys=[];
  if(window.localforage){
    var dbKeys=await window.localforage.keys();
    for(var i=0;i<dbKeys.length;i++){
      var k=dbKeys[i];
      if(k&&k.indexOf(LM)===0)keys.push(k);
    }
    for(var j=0;j<keys.length;j++){
      var k=keys[j];
      try{
        var raw=await window.localforage.getItem(k);
        if(!raw)continue;
        var msgs=raw;
        if(typeof raw==='string'){
          try{msgs=JSON.parse(raw)}catch(e){continue;}
        }
        if(!Array.isArray(msgs))continue;
        var changed=false;
        for(var mi=0;mi<msgs.length;mi++){
          var msg=msgs[mi];
          if(msg.originalImg&&msg.originalImg.length>1024&&msg.originalImg.startsWith('data:image/')){
            var imgKey='ml2_msg_img_'+msg.id+'_orig';
            await window.localforage.setItem(imgKey,msg.originalImg);
            msg.originalImg=imgKey;
            changed=true;
            count++;
          }
        }
        if(changed){
          ls(k,msgs);
        }
      }catch(e){}
    }
  }

  ls('ml2_orig_migrated',true);
}




var _saveMsgTimers={};
var _msgLoadingKeys={}; // 标记哪些 key 正在从 IndexedDB 异步加载，防止加载期间被少量消息覆盖
function savemsgs(id,m){
  if(!m||!Array.isArray(m)){
    console.error('savemsgs: invalid data, not an array');
    return;
  }

  var MAX_MSG_PER_CONTACT=999999;
  if(m.length>MAX_MSG_PER_CONTACT){
    m=m.slice(m.length-MAX_MSG_PER_CONTACT);
  }

  var key=LM+id;

  // 关键修复：如果该 key 正在从 IndexedDB 异步加载，延迟保存，避免少量新消息覆盖大量历史数据
  if(_msgLoadingKeys[key]){
    // 将新消息先存入 memoryCache（追加模式），等加载完成后由 msgs() 的合并逻辑处理
    var pendingCache=memoryCache[key];
    if(pendingCache&&Array.isArray(pendingCache)){
      var pendingIds={};
      pendingCache.forEach(function(x){if(x&&x.id)pendingIds[x.id]=true;});
      m.forEach(function(x){if(x&&x.id&&!pendingIds[x.id]){pendingCache.push(x);}});
      memoryCache[key]=pendingCache;
    }else{
      memoryCache[key]=m.slice();
    }
    // 延迟重试保存（等 IndexedDB 加载完成）
    setTimeout(function(){
      _msgLoadingKeys[key]=false;
      savemsgs(id,memoryCache[key]||m);
    },300);
    return;
  }

  // 修复：数据保护机制 - 防止数据未加载时用少量自动消息覆盖大量现有聊天记录
  // 如果 memoryCache 没有数据，先从 localStorage 同步加载
  var existingCache=memoryCache[key];
  if(!existingCache||!Array.isArray(existingCache)||existingCache.length===0){
    try{
      var lsExisting=safeGetItem('ml2_lf_'+key);
      if(lsExisting){
        var parsed=JSON.parse(lsExisting);
        if(Array.isArray(parsed)&&parsed.length>0){
          // 恢复日期对象
          parsed.forEach(function(x){
            if(x&&!(x.ts instanceof Date)){try{x.ts=new Date(x.ts);}catch(e){}}
          });
          existingCache=parsed;
          memoryCache[key]=parsed;
        }
      }
    }catch(e){}
  }
  // 如果现有数据远大于新数据（>5条 vs <=2条），且新数据都是自动/系统消息，说明数据未加载
  if(existingCache&&Array.isArray(existingCache)&&existingCache.length>5
     &&m.length<=2
     &&m.every(function(x){return x.isAuto||x.isGift||x.isCall||x.isInitiative||x.isSystem||x.isTAHighlight;})){
    console.warn('savemsgs: suspicious overwrite BLOCKED for',id,'existing:',existingCache.length,'new:',m.length);
    // 把新消息追加到现有缓存，而不是替换
    existingCache.push.apply(existingCache,m);
    m=existingCache;
  }

  var imgStore={};
  var data=m.map(function(x){
    var img=x.img,origImg=x.originalImg,voice=x.voice,t=x.t;
    if(img&&img.length>1024&&img.startsWith('data:image/')){
      var imgKey='ml2_msg_img_'+x.id;
      imgStore[imgKey]=img;
      img=imgKey;
    }
    if(origImg&&origImg.length>1024&&origImg.startsWith('data:image/')){
      var origImgKey='ml2_msg_img_'+x.id+'_orig';
      imgStore[origImgKey]=origImg;
      origImg=origImgKey;
    }
    if(voice&&voice.length>1024&&voice.startsWith('data:audio/')){
      var voiceKey='ml2_msg_voice_'+x.id;
      imgStore[voiceKey]=voice;
      voice=voiceKey;
    }
    // Handle legacy: large data URL stored in text field (image cards sent as text)
    if(t&&typeof t==='string'&&t.length>1024&&t.startsWith('data:image/')){
      var tImgKey='ml2_msg_img_'+x.id+'_t';
      imgStore[tImgKey]=t;
      t=tImgKey;
    }
    var imgs=x.imgs;
    if(imgs&&Array.isArray(imgs)&&imgs.length>0){
      imgs=imgs.map(function(im,idx){
        if(im&&im.length>1024&&im.startsWith('data:image/')){
          var imKey='ml2_msg_img_'+x.id+'_'+idx;
          imgStore[imKey]=im;
          return imKey;
        }
        return im;
      });
    }
    return{id:x.id,s:x.s,t:t,img:img,imgs:imgs,voice:voice,voiceText:x.voiceText,ts:x.ts instanceof Date?x.ts.toISOString():x.ts,pc:x.pc,isAuto:x.isAuto,isInitiative:x.isInitiative,quote:x.quote,liked:x.liked,retracted:x.retracted,originalContent:x.originalContent,originalImg:origImg,readIgnored:x.readIgnored,isSticker:x.isSticker,isVoice:x.isVoice,isTouch:x.isTouch,touchAction:x.touchAction,touchTarget:x.touchTarget,read:x.read,senderName:x.senderName,senderId:x.senderId,isGroup:x.isGroup,isCall:x.isCall,callStatus:x.callStatus,callDuration:x.callDuration,callMessage:x.callMessage,isSystem:x.isSystem,isAvatarChange:x.isAvatarChange,moodCard:x.moodCard,heartCard:x.heartCard,intentCard:x.intentCard,isRedpacket:x.isRedpacket,redpacketAmount:x.redpacketAmount,redpacketGreeting:x.redpacketGreeting,redpacketStatus:x.redpacketStatus,redpacketDirection:x.redpacketDirection,redpacketRpId:x.redpacketRpId,redpacketOpened:x.redpacketOpened,isRedpacketCollected:x.isRedpacketCollected,redpacketCollectedAmount:x.redpacketCollectedAmount,redpacketCollectedText:x.redpacketCollectedText,isGift:x.isGift,giftIcon:x.giftIcon,giftName:x.giftName,giftMsg:x.giftMsg,isGiftFromTA:x.isGiftFromTA,isGiftReply:x.isGiftReply,isTAHighlight:x.isTAHighlight};
  });

  if(_saveMsgTimers[id]){
    clearTimeout(_saveMsgTimers[id]);
  }

  // === 双写：localStorage 同步可靠 + IndexedDB 异步补充 ===
  // localStorage 写满是正常现象（数据在 IndexedDB 里有完整备份），但不静默
  var serializedData=JSON.stringify(data);
  var lsKey='ml2_lf_'+key;
  try{
    localStorage.setItem(lsKey, serializedData);
  }catch(e){
    // ★ 修复：localStorage 满时降级为分片写入（OPPO 等浏览器 file:// 下 IndexedDB 不可用时也能保住数据）
    console.warn('savemsgs: localStorage full, fallback to sharded write',key);
    var _shardedTried=false;
    try{
      if(typeof _saveToLocalStorageSharded==='function'){
        // ★ 传原始 key（内部统一加 ml2_lf_ 前缀），避免双前缀
        _saveToLocalStorageSharded(key,serializedData);
        _shardedTried=true;
      }
    }catch(e2){}
    if(!_shardedTried&&!window.localforage){
      try{ if(typeof toast==='function') toast('⚠️ 本地存储空间不足，聊天记录可能无法完整保存'); }catch(e3){}
    }
  }

  // 同步缓存图片/语音数据到 memoryCache（确保渲染时可用）
  Object.keys(imgStore).forEach(function(k){
    memoryCache['_img_'+k]=imgStore[k];
  });

  // 内存缓存保留原始数据 m（含 data URL），而非序列化后的 data（含 key 引用）
  // 这样 msgs() 直接返回带 data URL 的消息，渲染时图片/红包字段均完整
  memoryCache[key]=m;

  // 优化：标记该 key 为脏数据，供 syncAllDataToDB 增量同步使用
  if(typeof markSyncDirty==='function')markSyncDirty(key);

  // 完整数据异步保存到 IndexedDB（包括大图/语音）
  _saveMsgTimers[id]=setTimeout(function(){
    if(window.localforage){
      // 修复：保存前先检查 IndexedDB 是否有更多数据，防止数据未加载时少量消息覆盖大量历史记录
      window.localforage.getItem(key).then(function(existingDB){
        var finalData=data;
        if(existingDB&&Array.isArray(existingDB)&&existingDB.length>data.length+3){
          // IndexedDB 有更多数据，合并：保留 DB 数据 + 追加新消息（按 ID 去重）
          var existingIds={};
          var mergedArr=[];
          existingDB.forEach(function(x){
            if(x&&x.id){
              existingIds[x.id]=true;
              if(!(x.ts instanceof Date)){try{x.ts=new Date(x.ts);}catch(e){}}
              mergedArr.push(x);
            }
          });
          // 追加新数据中不存在于 DB 的消息
          var _mRef=memoryCache[key];
          if(_mRef&&Array.isArray(_mRef)){
            _mRef.forEach(function(x){
              if(x&&x.id&&!existingIds[x.id]){
                existingIds[x.id]=true;
                mergedArr.push(x);
              }
            });
          }
          // 序列化合并后的数据
          finalData=mergedArr.map(function(x){
            var _img=x.img,_origImg=x.originalImg,_voice=x.voice,_t=x.t;
            if(_img&&_img.length>1024&&_img.startsWith('data:image/')){var _ik='ml2_msg_img_'+x.id;imgStore[_ik]=_img;_img=_ik;}
            if(_origImg&&_origImg.length>1024&&_origImg.startsWith('data:image/')){var _ok='ml2_msg_img_'+x.id+'_orig';imgStore[_ok]=_origImg;_origImg=_ok;}
            if(_voice&&_voice.length>1024&&_voice.startsWith('data:audio/')){var _vk='ml2_msg_voice_'+x.id;imgStore[_vk]=_voice;_voice=_vk;}
            if(_t&&typeof _t==='string'&&_t.length>1024&&_t.startsWith('data:image/')){var _tk='ml2_msg_img_'+x.id+'_t';imgStore[_tk]=_t;_t=_tk;}
            return{id:x.id,s:x.s,t:_t,img:_img,voice:_voice,voiceText:x.voiceText,ts:x.ts instanceof Date?x.ts.toISOString():x.ts,pc:x.pc,isAuto:x.isAuto,isInitiative:x.isInitiative,quote:x.quote,liked:x.liked,retracted:x.retracted,originalContent:x.originalContent,originalImg:_origImg,readIgnored:x.readIgnored,isSticker:x.isSticker,isVoice:x.isVoice,isTouch:x.isTouch,touchAction:x.touchAction,touchTarget:x.touchTarget,read:x.read,senderName:x.senderName,senderId:x.senderId,isGroup:x.isGroup,isCall:x.isCall,callStatus:x.callStatus,callDuration:x.callDuration,callMessage:x.callMessage,isSystem:x.isSystem,isAvatarChange:x.isAvatarChange,moodCard:x.moodCard,heartCard:x.heartCard,intentCard:x.intentCard,isRedpacket:x.isRedpacket,redpacketAmount:x.redpacketAmount,redpacketGreeting:x.redpacketGreeting,redpacketStatus:x.redpacketStatus,redpacketDirection:x.redpacketDirection,redpacketRpId:x.redpacketRpId,redpacketOpened:x.redpacketOpened,isRedpacketCollected:x.isRedpacketCollected,redpacketCollectedAmount:x.redpacketCollectedAmount,redpacketCollectedText:x.redpacketCollectedText,isGift:x.isGift,giftIcon:x.giftIcon,giftName:x.giftName,giftMsg:x.giftMsg,isGiftFromTA:x.isGiftFromTA,isGiftReply:x.isGiftReply,isTAHighlight:x.isTAHighlight};
          });
          // 更新 memoryCache 为合并后的完整数据
          memoryCache[key]=mergedArr;
          // ★ Bug4修复：IndexedDB 合并出更完整数据后，必须同步回写 localStorage，
          // 否则刷新后 restoreFromDB 用落后的 localStorage 快照遮蔽 IndexedDB 完整历史
          try{safeSetItem('ml2_lf_'+key,JSON.stringify(mergedArr));}catch(e){}
          // 如果正在查看该会话，重新渲染
          if(cid===id){try{renderMsgs();}catch(e){}}
        }
        // 保存最终数据到 IndexedDB
        window.localforage.setItem(key,finalData).catch(function(e){if(!window._idbWarnedOnce){window._idbWarnedOnce=true;console.error('localforage save failed (IndexedDB 不可用，数据已存 localStorage):',e);}});
        // 保存大图/语音到 IndexedDB
        Object.keys(imgStore).forEach(function(k){
          window.localforage.setItem(k,imgStore[k]).catch(function(e){if(!window._idbWarnedOnce){window._idbWarnedOnce=true;console.error('localforage save img failed (IndexedDB 不可用，数据已存 localStorage):',e);}});
        });
      }).catch(function(){
        // Bug2修复：读取失败时不能直接用 data 覆盖——先从 memoryCache/localStorage 兜底，选最完整的数据源
        var fallbackFromCache = memoryCache[key];
        var fallbackFromLS = null;
        try {
          var lsRaw = safeGetItem('ml2_lf_'+key);
          if (lsRaw) fallbackFromLS = JSON.parse(lsRaw);
        } catch(e) {}
        var bestData = data;
        if (Array.isArray(fallbackFromCache) && fallbackFromCache.length > bestData.length) bestData = fallbackFromCache;
        if (Array.isArray(fallbackFromLS) && fallbackFromLS.length > bestData.length) bestData = fallbackFromLS;
        window.localforage.setItem(key,bestData).catch(function(e){if(!window._idbWarnedOnce){window._idbWarnedOnce=true;console.error('localforage save failed (IndexedDB 不可用，数据已存 localStorage):',e);}});
        Object.keys(imgStore).forEach(function(k){
          window.localforage.setItem(k,imgStore[k]).catch(function(e){if(!window._idbWarnedOnce){window._idbWarnedOnce=true;console.error('localforage save img failed (IndexedDB 不可用，数据已存 localStorage):',e);}});
        });
      });
    }
  },30);
}
function cards(id){var c=ls(LD+id);if(!c)return{cards:DEF_CARDS.slice(),set:{pe:true,pp:.5,pmin:2,pmax:5,dmin:3,dmax:7}};c.set=Object.assign({},DEF_SET,c.set||{});return c}
function savecd(id,b,s){ls(LD+id,{cards:b,set:s})}
function getTouchCards(contactId){var publicCards=getTouchCardsPublic();var groupData=ls('ml2_touch_group_cards')||{};var groups=getTouchGroups('public');groups.forEach(function(g){if(g!=='默认'){publicCards=publicCards.concat(groupData['public_'+g]||[])}});if(contactId){var privateCards=getTouchCardsPrivate(contactId);var privateGroups=getTouchGroups('private');privateGroups.forEach(function(g){if(g!=='默认'){privateCards=privateCards.concat(groupData['private_'+g+'_'+contactId]||[])}});return publicCards.concat(privateCards)}return publicCards}
function getTouchCardsPublic(){return ls('ml2_touch_cards_public')||DEF_TOUCH_CARDS_PUBLIC}
function saveTouchCardsPublic(cards){ls('ml2_touch_cards_public',cards)}


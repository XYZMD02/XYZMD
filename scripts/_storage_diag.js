
// ==== 星言存储诊断（复制到浏览器控制台运行）====
console.log('1. 当前 URL:', location.href);
console.log('2. protocol:', location.protocol);
console.log('3. localforage driver:', window.localforage ? (window.localforage.driver() || '(null)') : '(无 localforage)');
var totalBytes = 0;
var keys = [];
for (var i=0;i<localStorage.length;i++){var k=localStorage.key(i);keys.push(k);totalBytes += k.length + (localStorage.getItem(k)||'').length;}
console.log('4. localStorage 键数量:', localStorage.length, '总字节:', totalBytes, '(约', (totalBytes/1024/1024).toFixed(2), 'MB)');
console.log('5. ml2_lf_ml2_c 键:', localStorage.getItem('ml2_lf_ml2_c') ? '存在, 长度'+localStorage.getItem('ml2_lf_ml2_c').length : '不存在');
if(window.localforage){
  window.localforage.getItem('ml2_c').then(function(v){
    console.log('6. IndexedDB ml2_c:', v ? ('存在, '+ (Array.isArray(v)?v.length+' 个联系人' : '类型'+typeof v)) : '不存在');
    if(Array.isArray(v))console.log('   联系人列表:', v.map(function(c){return c.name}).join(', '));
  }).catch(function(e){console.log('6. IndexedDB 读取失败:', e);});
} else {
  console.log('6. 无 localforage');
}
console.log('7. localStorage 中 ml2_lf_ml2_c 内容(前200字):', localStorage.getItem('ml2_lf_ml2_c') ? localStorage.getItem('ml2_lf_ml2_c').substring(0,200) : '(无)');

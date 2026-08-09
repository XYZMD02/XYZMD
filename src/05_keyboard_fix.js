<script>
(function(){
  var lastHeight=window.innerHeight;
  // 键盘弹出时动态绑定 touchmove preventDefault，键盘收起时解绑
  // 避免全局 passive:false touchmove 监听器阻塞日常滚动
  var _kbTouchMoveHandler=null;
  function _bindKbTouchMove(){
    if(_kbTouchMoveHandler)return;
    _kbTouchMoveHandler=function(e){e.preventDefault();};
    document.addEventListener('touchmove',_kbTouchMoveHandler,{passive:false});
  }
  function _unbindKbTouchMove(){
    if(_kbTouchMoveHandler){
      document.removeEventListener('touchmove',_kbTouchMoveHandler);
      _kbTouchMoveHandler=null;
    }
  }
  function updateAppHeight(){
    var h;
    if(window.visualViewport){
      h=window.visualViewport.height;
    }else{
      h=window.innerHeight;
    }
    document.documentElement.style.setProperty('--app-height',h+'px');
    // 检测键盘是否可见（可视视口高度变化超过50px说明键盘弹出）
    var isKeyboardVisible=window.visualViewport&&(window.innerHeight-window.visualViewport.height)>50;
    // ★ 修复：页面加载早期（body 未解析完）document.body 可能为 null
    if(!document.body)return;
    if(isKeyboardVisible){
      document.body.classList.add('keyboard-visible');
      // 强制body高度为可视视口高度
      document.body.style.height=h+'px';
      document.documentElement.style.height=h+'px';
      // 防止页面滚动到顶部
      window.scrollTo(0,0);
      // 键盘弹出时才绑定 touchmove preventDefault
      _bindKbTouchMove();
    }else{
      document.body.classList.remove('keyboard-visible');
      document.body.style.height='';
      document.documentElement.style.height='';
      // 键盘收起时解绑，恢复日常滚动性能
      _unbindKbTouchMove();
    }
    lastHeight=h;
  }
  
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize',function(){
      updateAppHeight();
      // 延迟再次更新，确保iOS完成布局
      setTimeout(updateAppHeight,100);
      setTimeout(updateAppHeight,300);
    });
    window.visualViewport.addEventListener('scroll',function(){
      // 键盘弹出时，防止页面被推上去
      if(document.body.classList.contains('keyboard-visible')){
        window.scrollTo(0,0);
      }
    });
  }
  
  // 监听focus/blur事件来检测键盘
  document.addEventListener('focusin',function(e){
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'){
      setTimeout(updateAppHeight,50);
      // ★ iOS 兼容：弹窗（overlay）内输入框聚焦时，键盘弹出后主动滚到可视区，
      // 避免弹窗收缩后输入框被键盘遮挡或滚出视野
      var _inOverlay=e.target.closest&&e.target.closest('.overlay');
      if(_inOverlay&&/iPhone|iPad|iPod/i.test(navigator.userAgent)){
        setTimeout(function(){
          try{
            var _r=e.target.getBoundingClientRect();
            var _vh=window.visualViewport?window.visualViewport.height:window.innerHeight;
            // 输入框底边超出可视区时，滚动容器让输入框可见
            if(_r.bottom>_vh-20||_r.top<0){
              var _sc=e.target.closest('.modal-body,.sb');
              if(_sc&&_sc.scrollTo){
                var _delta=Math.max(0,_r.bottom-_vh+20);
                _sc.scrollTo({top:_sc.scrollTop+_delta,behavior:'smooth'});
              }
            }
          }catch(err){}
        },300);
      }
    }
  });
  
  document.addEventListener('focusout',function(e){
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'){
      setTimeout(updateAppHeight,100);
    }
  });
  
  // 修复：移除全局 passive:false touchmove 监听器
  // 原代码每次 touchmove 都阻塞浏览器滚动，即使键盘不可见，严重拖慢手机端滚动性能
  // 改为在 updateAppHeight 中动态绑定/解绑，仅键盘弹出时才阻止滚动

  updateAppHeight();
  // 首次加载后延迟更新
  setTimeout(updateAppHeight,300);
})();
</script>

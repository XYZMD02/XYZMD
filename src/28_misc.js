<script>
// 情绪分组权重弹窗关闭按钮事件
if($('mood-card-help-close'))$('mood-card-help-close').addEventListener('click',closeMoodCardHelp);
if($('mood-card-help-modal'))$('mood-card-help-modal').addEventListener('click',function(e){
  if(e.target===$('mood-card-help-modal'))closeMoodCardHelp();
});

// ===== 生理周期功能 =====
(function() {
  'use strict';

  var PERIOD_STORAGE_KEY = 'ml2_period_records';
  var PERIOD_LF_KEY = 'ml2_period_records_lf';

  function pGetRecords() {
    try {
      var raw = ls(PERIOD_STORAGE_KEY);
      if (!raw) {
        try {
          var lfVal = safeGetItem(PERIOD_LF_KEY);
          if(lfVal) raw = lfVal;
        } catch(e) {}
      }
      if (!raw) return [];
      if (!Array.isArray(raw)) return [];
      return raw.filter(function(r) { return r && r.start; }).map(function(r) {
        if (!r.details) r.details = {};
        return r;
      }).sort(function(a, b) { return new Date(a.start) - new Date(b.start); });
    } catch (e) { return []; }
  }

  function pSaveRecords(records) {
    try {
      ls(PERIOD_STORAGE_KEY, records);
      return true;
    }
    catch (e) { return false; }
  }

  function pFmtYMD(d) {
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  function pFmtDisplay(d) {
    return d.getFullYear() + '年' + (d.getMonth()+1) + '月' + d.getDate() + '日';
  }
  function pTodayStr() { return pFmtYMD(new Date()); }
  function pTodayDate() { var d = new Date(); d.setHours(0,0,0,0); return d; }
  function pDaysBetween(a, b) {
    var da = new Date(a), db = new Date(b);
    da.setHours(0,0,0,0); db.setHours(0,0,0,0);
    return Math.round((da - db) / 86400000);
  }
  function pAddDays(d, n) { var nd = new Date(d); nd.setDate(nd.getDate()+n); return nd; }

  function pGetDayDetail(dateStr, records) {
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      var start = r.start;
      var end = r.end || r.start;
      if (dateStr >= start && dateStr <= end) {
        return (r.details && r.details[dateStr]) ? r.details[dateStr] : { amount: '中', pain: '无' };
      }
    }
    return null;
  }

  function pSetDayDetail(dateStr, amount, pain, records) {
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      if (dateStr >= r.start && dateStr <= (r.end || r.start)) {
        if (!r.details) r.details = {};
        r.details[dateStr] = { amount: amount, pain: pain };
        return pSaveRecords(records);
      }
    }
    return false;
  }

  function pIsPeriodDay(dateStr, records) {
    return records.some(function(r) { return dateStr >= r.start && dateStr <= (r.end || r.start); });
  }

  function pGetPeriodDaysForMonth(year, month, records) {
    var s = new Set();
    var first = new Date(year, month, 1);
    var last = new Date(year, month+1, 0);
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      var rs = new Date(r.start), re = new Date(r.end || r.start);
      var cur = rs < first ? new Date(first) : new Date(rs);
      var end = re > last ? new Date(last) : new Date(re);
      while (cur <= end) { s.add(pFmtYMD(cur)); cur.setDate(cur.getDate()+1); }
    }
    return s;
  }

  function pGetDetailDaysForMonth(year, month, records) {
    var s = new Set();
    var first = new Date(year, month, 1);
    var last = new Date(year, month+1, 0);
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      if (!r.details) continue;
      var keys = Object.keys(r.details);
      for (var j = 0; j < keys.length; j++) {
        var d = keys[j];
        var dt = new Date(d);
        if (dt >= first && dt <= last) s.add(d);
      }
    }
    return s;
  }

  function pCalcCycles(records) {
    var cycles = [];
    for (var i = 1; i < records.length; i++) {
      var d = pDaysBetween(records[i].start, records[i-1].start);
      if (d >= 21 && d <= 45) cycles.push(d);
    }
    return cycles;
  }

  function pAvgCycle(records) {
    var cycles = pCalcCycles(records);
    if (!cycles.length) return null;
    var recent = cycles.slice(-3);
    return Math.round(recent.reduce(function(a,b){return a+b},0) / recent.length);
  }

  function pAvgDuration(records) {
    if (!records.length) return null;
    var durs = records.map(function(r) { return pDaysBetween(r.end || r.start, r.start) + 1; });
    return Math.round(durs.reduce(function(a,b){return a+b},0) / durs.length);
  }

  function pAvgDetails(records) {
    var am = { '少':1, '中':2, '多':3 };
    var pm = { '无':0, '轻':1, '中':2, '重':3 };
    var av = [], pv = [];
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      if (!r.details) continue;
      var keys = Object.keys(r.details);
      for (var j = 0; j < keys.length; j++) {
        var dt = r.details[keys[j]];
        if (dt.amount) av.push(am[dt.amount]||2);
        if (dt.pain) pv.push(pm[dt.pain]||0);
      }
    }
    var ra = { 1:'少', 2:'中', 3:'多' };
    var rp = { 0:'无', 1:'轻', 2:'中', 3:'重' };
    return {
      amount: av.length ? ra[Math.round(av.reduce(function(a,b){return a+b},0)/av.length)] : null,
      pain: pv.length ? rp[Math.round(pv.reduce(function(a,b){return a+b},0)/pv.length)] : null
    };
  }

  function pPredictNext(records) {
    if (!records.length) return null;
    var avg = pAvgCycle(records);
    if (!avg) avg = 28;
    if (avg < 21 || avg > 45) avg = 28;
    var lastStart = new Date(records[records.length-1].start);
    lastStart.setHours(0,0,0,0);
    var nextTs = lastStart.getTime() + avg * 86400000;
    var next = new Date(nextTs);
    var today = pTodayDate();
    if (next.getTime() <= today.getTime()) {
      nextTs += avg * 86400000;
      next = new Date(nextTs);
    }
    return next;
  }

  var pToastTimer = null;
  function pShowToast(msg) {
    var el = document.getElementById('periodToast');
    if (!el) return;
    if (pToastTimer) { clearTimeout(pToastTimer); pToastTimer = null; }
    el.textContent = msg;
    el.className = 'period-toast';
    void el.offsetWidth;
    el.classList.add('show');
    pToastTimer = setTimeout(function() { el.classList.remove('show'); pToastTimer = null; }, 2200);
  }

  var pCurrentYear = new Date().getFullYear();
  var pCurrentMonth = new Date().getMonth();
  var pModalTargetDate = null;

  function pRenderAll() {
    var records = pGetRecords();
    pRenderCalendar(records);
    pRenderHistory(records);
    pRenderStats(records);
    pRenderStatus(records);
    pUpdateFormHint();
  }

  function pRenderCalendar(records) {
    var grid = document.getElementById('periodCalendarGrid');
    var label = document.getElementById('periodMonthLabel');
    if (!grid || !label) return;
    var first = new Date(pCurrentYear, pCurrentMonth, 1);
    var daysInMonth = new Date(pCurrentYear, pCurrentMonth+1, 0).getDate();
    var startWd = first.getDay();
    var periodSet = pGetPeriodDaysForMonth(pCurrentYear, pCurrentMonth, records);
    var detailSet = pGetDetailDaysForMonth(pCurrentYear, pCurrentMonth, records);
    var today = pTodayStr();

    var wds = ['日','一','二','三','四','五','六'];
    var h = '';
    for (var w = 0; w < wds.length; w++) h += '<div class="period-wd">'+wds[w]+'</div>';

    for (var i = 0; i < startWd; i++) {
      var d = new Date(pCurrentYear, pCurrentMonth, 1 - startWd + i);
      h += '<div class="period-day other">'+d.getDate()+'</div>';
    }

    for (var d = 1; d <= daysInMonth; d++) {
      var dateStr = pFmtYMD(new Date(pCurrentYear, pCurrentMonth, d));
      var isToday = dateStr === today;
      var isPeriod = periodSet.has(dateStr);
      var hasDetail = detailSet.has(dateStr);

      var cls = 'period-day';
      if (isPeriod) cls += ' period';
      if (isToday) cls += ' today';

      h += '<button class="'+cls+'" data-date="'+dateStr+'">'+d+'<span class="period-detail-dot'+(hasDetail?' show':'')+'"></span></button>';
    }

    var total = startWd + daysInMonth;
    var rem = (7 - (total % 7)) % 7;
    for (var i = 1; i <= rem; i++) {
      var d = new Date(pCurrentYear, pCurrentMonth+1, i);
      h += '<div class="period-day other">'+d.getDate()+'</div>';
    }

    grid.innerHTML = h;
    label.textContent = pCurrentYear + '年' + (pCurrentMonth+1) + '月';

    var dayEls = grid.querySelectorAll('.period-day[data-date]');
    for (var i = 0; i < dayEls.length; i++) {
      dayEls[i].addEventListener('click', function() {
        pOpenDetailModal(this.dataset.date);
      });
    }
  }

  function pRenderHistory(records) {
    var badge = document.getElementById('periodHistoryBadge');
    var list = document.getElementById('periodHistoryList');
    if (!badge || !list) return;
    badge.textContent = records.length + ' 条';
    if (!records.length) {
      list.innerHTML = '<div class="period-empty-state"><span class="period-icon">📭</span><div class="period-text">还没有记录</div><div class="period-sub">快开始记录你的经期吧</div></div>';
      return;
    }
    var rev = [].concat(records).reverse();
    var h = '';
    for (var i = 0; i < rev.length; i++) {
      var r = rev[i];
      var idx = records.length - 1 - i;
      var startDisp = pFmtDisplay(new Date(r.start));
      var endDisp = r.end ? pFmtDisplay(new Date(r.end)) : '单日';
      var cycleText = i < rev.length-1 ? pDaysBetween(r.start, rev[i+1].start)+'天' : '--';
      var detailCount = r.details ? Object.keys(r.details).length : 0;
      var avgAmount = '--', avgPain = '--';
      if (r.details) {
        var am = { '少':1, '中':2, '多':3 };
        var pm = { '无':0, '轻':1, '中':2, '重':3 };
        var av = [], pv = [];
        var keys = Object.keys(r.details);
        for (var k = 0; k < keys.length; k++) {
          var dt = r.details[keys[k]];
          if (dt.amount) av.push(am[dt.amount]||2);
          if (dt.pain) pv.push(pm[dt.pain]||0);
        }
        var ra = { 1:'少', 2:'中', 3:'多' };
        var rp = { 0:'无', 1:'轻', 2:'中', 3:'重' };
        if (av.length) avgAmount = ra[Math.round(av.reduce(function(a,b){return a+b},0)/av.length)];
        if (pv.length) avgPain = rp[Math.round(pv.reduce(function(a,b){return a+b},0)/pv.length)];
      }
      h += '<div class="period-history-item">'+
        '<div class="period-info">'+
          '<div class="period-dates">'+startDisp+' <span class="period-arrow">→</span> '+endDisp+'</div>'+
          '<div class="period-meta"><span class="period-tag">周期 '+cycleText+'</span><span>📋 '+detailCount+' 天详情</span><span style="margin-left:4px;">🩸 '+avgAmount+'</span><span style="margin-left:4px;">😣 '+avgPain+'</span></div>'+
        '</div>'+
        '<div class="period-actions">'+
          '<button class="edit" data-idx="'+idx+'">✏️</button>'+
          '<button class="del" data-idx="'+idx+'">🗑</button>'+
        '</div>'+
      '</div>';
    }
    list.innerHTML = h;

    var delBtns = list.querySelectorAll('.del');
    for (var i = 0; i < delBtns.length; i++) {
      delBtns[i].addEventListener('click', function(e) {
        e.stopPropagation();
        var idx = +this.dataset.idx;
        if (isNaN(idx)) return;
        if (!confirm('确定删除此记录吗？')) return;
        var records = pGetRecords();
        if (idx >= 0 && idx < records.length) {
          records.splice(idx, 1);
          pSaveRecords(records);
          pShowToast('已删除');
          pRenderAll();
        }
      });
    }
    var editBtns = list.querySelectorAll('.edit');
    for (var i = 0; i < editBtns.length; i++) {
      editBtns[i].addEventListener('click', function(e) {
        e.stopPropagation();
        var idx = +this.dataset.idx;
        if (isNaN(idx)) return;
        var records = pGetRecords();
        if (idx >= 0 && idx < records.length) {
          var r = records[idx];
          var sd = document.getElementById('periodStartDate');
          var ed = document.getElementById('periodEndDate');
          var addSec = document.getElementById('periodAddSection');
          if (sd) sd.value = r.start;
          if (ed) ed.value = r.end || '';
          records.splice(idx, 1);
          pSaveRecords(records);
          if (addSec) addSec.style.display = 'block';
          pRenderAll();
          pShowToast('已加载到表单，修改后保存');
          if (sd) sd.focus();
        }
      });
    }
  }

  function pRenderStats(records) {
    var ac = pAvgCycle(records);
    var ad = pAvgDuration(records);
    var det = pAvgDetails(records);
    var elCycle = document.getElementById('periodStatCycle');
    var elDuration = document.getElementById('periodStatDuration');
    var elAmount = document.getElementById('periodStatAmount');
    var elPain = document.getElementById('periodStatPain');
    // 只有一条记录时使用默认28天周期
    if (ac === null && records.length >= 1) ac = 28;
    if (elCycle) elCycle.innerHTML = ac !== null ? ac + ' <span class="period-unit">天</span>' : '-- <span class="period-unit">天</span>';
    if (elDuration) elDuration.innerHTML = ad !== null ? ad + ' <span class="period-unit">天</span>' : '-- <span class="period-unit">天</span>';
    if (elAmount) elAmount.textContent = det.amount || '--';
    if (elPain) elPain.textContent = det.pain || '--';
  }

  function pRenderStatus(records) {
    var today = pTodayStr();
    var todayO = pTodayDate();
    var inPeriod = pIsPeriodDay(today, records);
    var elDate = document.getElementById('periodTodayDate');
    var elLabel2 = document.getElementById('periodStatusLabel2');
    var elNextDays = document.getElementById('periodNextDays');
    var elNextInfo = document.getElementById('periodNextInfo');
    var elPredDate = document.getElementById('periodPredDate');
    var elPredLabel = document.getElementById('periodPredLabel');
    var elDot = document.getElementById('periodStatusDot');
    var elLabel = document.getElementById('periodStatusLabel');

    if (elDate) elDate.textContent = pFmtDisplay(todayO);

    if (inPeriod) {
      var dayCount = 1;
      var recs = pGetRecords();
      for (var i = 0; i < recs.length; i++) {
        var r = recs[i];
        var s = new Date(r.start), e = new Date(r.end || r.start);
        if (todayO >= s && todayO <= e) { dayCount = pDaysBetween(today, r.start) + 1; break; }
      }
      if (elLabel2) elLabel2.textContent = '经期第 ' + dayCount + ' 天';
      if (elDot) elDot.className = 'period-dot on';
      if (elLabel) elLabel.textContent = '经期中';
      var next = pPredictNext(records);
      if (next) {
        var days = pDaysBetween(next, todayO);
        if (elPredLabel) elPredLabel.textContent = '下次预测';
        if (elNextDays) elNextDays.textContent = days > 0 ? days : '0';
        if (elPredDate) elPredDate.textContent = '预计 ' + pFmtDisplay(next);
        if (elNextInfo) elNextInfo.style.display = 'block';
      } else {
        if (elPredLabel) elPredLabel.textContent = '预测下次';
        if (elNextDays) elNextDays.textContent = '--';
        if (elPredDate) elPredDate.textContent = '';
        if (elNextInfo) elNextInfo.style.display = 'block';
      }
    } else {
      var next = pPredictNext(records);
      if (next) {
        var days = pDaysBetween(next, todayO);
        if (days > 0) {
          if (elLabel2) elLabel2.textContent = '距离下次经期';
          if (elPredLabel) elPredLabel.textContent = '预测下次';
          if (elNextDays) elNextDays.textContent = days;
          if (elPredDate) elPredDate.textContent = '预计 ' + pFmtDisplay(next);
          if (elNextInfo) elNextInfo.style.display = 'block';
          if (elDot) elDot.className = 'period-dot';
          if (elLabel) elLabel.textContent = '正常';
        } else if (days === 0) {
          if (elLabel2) elLabel2.textContent = '预计今天开始';
          if (elPredLabel) elPredLabel.textContent = '预测下次';
          if (elNextDays) elNextDays.textContent = '0';
          if (elPredDate) elPredDate.textContent = '就是今天';
          if (elNextInfo) elNextInfo.style.display = 'block';
          if (elDot) elDot.className = 'period-dot on';
          if (elLabel) elLabel.textContent = '预测';
        } else {
          if (elLabel2) elLabel2.textContent = '已延迟 ' + Math.abs(days) + ' 天';
          if (elPredLabel) elPredLabel.textContent = '已延迟';
          if (elNextDays) elNextDays.textContent = Math.abs(days);
          if (elPredDate) elPredDate.textContent = '原预计 ' + pFmtDisplay(next);
          if (elNextInfo) elNextInfo.style.display = 'block';
          if (elDot) elDot.className = 'period-dot';
          if (elLabel) elLabel.textContent = '延迟';
        }
      } else {
        if (elLabel2) elLabel2.textContent = '暂无预测';
        if (elPredLabel) elPredLabel.textContent = '预测下次';
        if (elNextDays) elNextDays.textContent = '--';
        if (elPredDate) elPredDate.textContent = '';
        if (elNextInfo) elNextInfo.style.display = 'block';
        if (elDot) elDot.className = 'period-dot';
        if (elLabel) elLabel.textContent = '无记录';
      }
    }
    if (!records.length) {
      if (elLabel2) elLabel2.textContent = '添加第一条记录';
      if (elPredLabel) elPredLabel.textContent = '预测下次';
      if (elNextDays) elNextDays.textContent = '--';
      if (elPredDate) elPredDate.textContent = '';
      if (elDot) elDot.className = 'period-dot';
      if (elLabel) elLabel.textContent = '无记录';
    }
  }

  function pUpdateFormHint() {
    var sd = document.getElementById('periodStartDate');
    var ed = document.getElementById('periodEndDate');
    var hint = document.getElementById('periodFormHint');
    var saveBtn = document.getElementById('periodSaveBtn');
    if (!hint || !saveBtn || !sd) return;
    var s = sd.value, e = ed ? ed.value : '';
    if (s && e && e < s) {
      hint.textContent = '结束日期不能早于开始日期';
      hint.style.color = '#c06060';
      saveBtn.disabled = true;
    } else if (s) {
      hint.textContent = e ? pFmtDisplay(new Date(s)) + ' → ' + pFmtDisplay(new Date(e)) : pFmtDisplay(new Date(s)) + ' (单日)';
      hint.style.color = 'var(--period-text-mid)';
      saveBtn.disabled = false;
    } else {
      hint.textContent = '结束日期留空则只记录单日';
      hint.style.color = 'var(--period-text-sub)';
      saveBtn.disabled = true;
    }
  }

  function pOpenDetailModal(dateStr) {
    var records = pGetRecords();
    var detail = pGetDayDetail(dateStr, records);
    var today = pTodayStr();
    
    if (!detail) {
      if (dateStr === today) {
        var startInp = document.getElementById('periodStartDate');
        var addSec = document.getElementById('periodAddSection');
        if (startInp) startInp.value = dateStr;
        if (addSec) addSec.style.display = 'block';
        pShowToast('今日还没有记录，在下方添加');
        if (startInp) startInp.focus();
      } else {
        pShowToast('该日期不在经期记录中，请在下方添加记录');
      }
      return;
    }
    pModalTargetDate = dateStr;
    var sub = document.getElementById('periodModalSub');
    var amt = document.getElementById('periodModalAmount');
    var pain = document.getElementById('periodModalPain');
    var overlay = document.getElementById('periodModalOverlay');
    if (sub) sub.textContent = pFmtDisplay(new Date(dateStr));
    if (amt) amt.value = detail.amount || '中';
    if (pain) pain.value = detail.pain || '无';
    if (overlay) overlay.classList.add('open');
  }

  function pCloseModal() {
    var overlay = document.getElementById('periodModalOverlay');
    if (overlay) overlay.classList.remove('open');
    pModalTargetDate = null;
  }

  function pSaveModalDetail() {
    if (!pModalTargetDate) return;
    var amt = document.getElementById('periodModalAmount');
    var pain = document.getElementById('periodModalPain');
    var amount = amt ? amt.value : '中';
    var painVal = pain ? pain.value : '无';
    var records = pGetRecords();
    if (pSetDayDetail(pModalTargetDate, amount, painVal, records)) {
      pShowToast('详情已保存');
      pCloseModal();
      pRenderAll();
    } else {
      pShowToast('保存失败');
    }
  }

  function pAddRecord(start, end) {
    if (!start) return { ok: false, msg: '请选择开始日期' };
    end = end || '';
    if (end && end < start) return { ok: false, msg: '结束日期不能早于开始日期' };
    var records = pGetRecords();
    var startMatch = records.some(function(r) { return r.start === start; });
    if (startMatch) {
      return { ok: false, msg: '该日期已有记录' };
    }
    records.push({ start: start, end: end, details: {} });
    return pSaveRecords(records) ? { ok: true, msg: '记录保存成功' } : { ok: false, msg: '保存失败' };
  }

  function pHandleSave() {
    var sd = document.getElementById('periodStartDate');
    var ed = document.getElementById('periodEndDate');
    if (!sd) return;
    var s = sd.value, e = ed ? ed.value : '';
    if (!s) { pShowToast('请选择开始日期'); return; }
    if (e && e < s) { pShowToast('结束日期不能早于开始日期'); return; }
    var r = pAddRecord(s, e);
    if (r.ok) {
      pShowToast(r.msg);
      sd.value = pFmtYMD(pAddDays(new Date(s), 1));
      if (ed) ed.value = '';
      pRenderAll();
    } else { pShowToast(r.msg); }
  }

  function pHandleQuickToday() {
    var today = pTodayStr();
    var records = pGetRecords();
    var inRange = records.some(function(r) { return today >= r.start && today <= (r.end||r.start); });
    if (!inRange) {
      var r = pAddRecord(today, '');
      if (!r.ok) { pShowToast(r.msg); return; }
      pShowToast('已创建今日记录');
      pRenderAll();
      setTimeout(function() { pOpenDetailModal(today); }, 300);
    } else {
      pOpenDetailModal(today);
    }
  }

  function pGoToToday() {
    var now = new Date();
    pCurrentYear = now.getFullYear();
    pCurrentMonth = now.getMonth();
    pRenderAll();
  }

  window.renderPeriod = function() {
    pCurrentYear = new Date().getFullYear();
    pCurrentMonth = new Date().getMonth();
    var sd = document.getElementById('periodStartDate');
    var ed = document.getElementById('periodEndDate');
    if (sd) sd.value = pTodayStr();
    if (ed) ed.value = '';
    pRenderAll();
  };

  function pInit() {
    var sd = document.getElementById('periodStartDate');
    var ed = document.getElementById('periodEndDate');
    if (sd) sd.value = pTodayStr();
    if (ed) ed.value = '';

    var prevBtn = document.getElementById('periodPrevBtn');
    var nextBtn = document.getElementById('periodNextBtn');
    var todayBtn = document.getElementById('periodTodayBtn');
    var saveBtn = document.getElementById('periodSaveBtn');
    var quickTodayBtn = document.getElementById('periodQuickTodayBtn');
    var toggleAddBtn = document.getElementById('periodToggleAddBtn');
    var addSection = document.getElementById('periodAddSection');
    var modalCancel = document.getElementById('periodModalCancel');
    var modalConfirm = document.getElementById('periodModalConfirm');
    var modalOverlay = document.getElementById('periodModalOverlay');

    if (prevBtn) prevBtn.addEventListener('click', function() {
      pCurrentMonth--;
      if (pCurrentMonth < 0) { pCurrentMonth = 11; pCurrentYear--; }
      pRenderAll();
    });
    if (nextBtn) nextBtn.addEventListener('click', function() {
      pCurrentMonth++;
      if (pCurrentMonth > 11) { pCurrentMonth = 0; pCurrentYear++; }
      pRenderAll();
    });
    if (todayBtn) todayBtn.addEventListener('click', pGoToToday);

    if (sd) {
      sd.addEventListener('change', pUpdateFormHint);
      sd.addEventListener('input', pUpdateFormHint);
    }
    if (ed) {
      ed.addEventListener('change', pUpdateFormHint);
      ed.addEventListener('input', pUpdateFormHint);
    }

    if (saveBtn) saveBtn.addEventListener('click', pHandleSave);
    if (quickTodayBtn) quickTodayBtn.addEventListener('click', pHandleQuickToday);

    if (toggleAddBtn && addSection) {
      toggleAddBtn.addEventListener('click', function() {
        var visible = addSection.style.display === 'block';
        addSection.style.display = visible ? 'none' : 'block';
        toggleAddBtn.textContent = visible ? '＋ 添加区间' : '－ 收起';
        if (!visible && sd) sd.focus();
      });
    }

    if (modalCancel) modalCancel.addEventListener('click', pCloseModal);
    if (modalConfirm) modalConfirm.addEventListener('click', pSaveModalDetail);
    if (modalOverlay) {
      modalOverlay.addEventListener('click', function(e) {
        if (e.target === this) pCloseModal();
      });
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') pCloseModal();
      if (e.key === 'Enter' && (e.target === sd || e.target === ed)) pHandleSave();
    });
  }

  pInit();
})();

function escapeHtml(text) {
  if (!text) return '';
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* ===== Update Notice System ===== */
var UPDATE_NOTICES = [
  {
    version: '1.7.2',
    date: '2026-08-08',
    title: '星言 1.7.2',
    summary: 'AI 解读接入、TA与你的距离 / TA的触碰、消息回复拟真化、多项稳定性修复',
    content: '<h4>🌙 0808 星言 1.7.2 版本更新公告</h4><h4>✨ 新增：AI 解读（API 接口）</h4><p>底部导航「设置」→「API 接口」可接入 AI 大模型（支持 DeepSeek / 通义 / GLM / OpenAI 等）。</p><p>接入后：聊天中长按字卡消息 → 📜 解读这条字卡想表达的意思；朋友圈动态、信箱的信也能一键解读。</p><p>每个联系人是独立的梦角：可分别设置 TA 是男朋友/女朋友、各自的完整人设（性格/背景/称呼/说话习惯），解读时按该梦角自己的设定来，不会混淆。</p><p>占卜抽牌后新增「AI 解读」，可按你设定的占卜师指令解读牌面。所有配置仅保存在本机，不会上传任何服务器。</p><h4>✨ 新增：TA与你的距离 / TA的触碰（梦角）</h4><p>梦角分类新增两个存在感功能：</p><p>📍 TA与你的距离：TA在哪里、离你多近（贴近/很近/近/稍远/远 + 方向 + 连接状态），有持续状态与变化记录。</p><p>💫 TA的触碰：TA对你做了什么（牵手/拥抱/摸头等 14 个部位动作），有动作持续与记录，可点击查看完整信息。</p><p>两个功能采用「持续存在感」机制：打开不一定刷新——TA可能还在做上一个动作，状态有持续时间，记录点击可看完整。</p><h4>🎙️ 新增：梦角语音（MiniMax 音色）</h4><p>在「设置」→「API 接口」→「梦角语音」中，可上传一段参考音频（mp3 / m4a / wav，10秒~5分钟，建议 30秒~1分钟更省钱）复刻梦角专属音色。每个梦角独立设置（开关 / Key / 音色）。</p><p>聊天中梦角发的文字消息旁会出现 ▶ 按钮，用梦角的专属声音读出来；已生成的语音会缓存，重复播放不重复扣费。</p><p>音色 ID 可手动填写或复制，已复刻的音色永久有效、不必重复复刻。</p><p>注意：<strong>星言网站本身完全免费，不收取任何费用</strong>；MiniMax / AI 接口产生的费用由第三方服务商（MiniMax、DeepSeek 等）直接向你收取，与星言无关。复刻按音频时长、播放按字符计费，请量入为出。</p><h4>🛠️ 其他新增</h4><p>更多功能 → 消息工具：新增「🎤 发送语音」（录制后作为语音消息发送，持久保存）与「🔗 发送链接」（小红书 / B站 / QQ音乐 / 网易云等链接以卡片显示，点击打开）。</p><p>语音消息长按菜单新增「🗣️ 语音转文字」（浏览器自带识别，免费）。</p><h4>🔧 修复与优化</h4><p>修复：联系人多条回复文字/图片/语音重复发送（现仅表情包允许小概率连发）</p><p>修复：主动发送多条消息也去重，间隔拟真化</p><p>修复：表情包与图片大小混淆（表情包小图、图片大图）</p><p>修复：回复设置「已读不回概率」调 0 仍触发；「应用到全部联系人」误报未选择</p><p>修复：iOS/安卓刷新后偶发丢失聊天记录、朋友圈、头像（双端合并取最完整）</p><p>修复：纯表情/emoji 消息不再误显示语音播放按钮</p><p>回复/主动发送间隔拟真：短消息快回、长消息打字久、偶发停顿或快速连发</p><p>开屏右上角新增「最新版本部署时间」，方便确认是否为最新版本</p>'
  },
  {
    version: '1.7.1',
    date: '2026-08-06',
    title: '星言 1.7.1',
    summary: '稳定版收官：全面 Bug 修复、数据安全加固、群聊即将解散说明',
    content: '<h4>🌙 0806 星言 1.7 版本更新公告</h4><p>星言字卡 0701 开搓，0717 发布，0803 结束公测。功能非常多非常复杂，一个月内做了很多次调试，花了很多时间。现在网站基本上没什么大问题了，有也是小问题，或者别的设备没人反馈我也不知道。</p><h4>📢 关于群聊</h4><p>接下来考虑这个月过段时间<strong>解散群聊</strong>，星言不再开公开群。</p><p>解散后可能开一个<strong>常见问题解答反馈楼</strong>，同样可以反馈问题。</p><p>注意：其他项目后续可能还是会开群的，星言也可能开私人群（具体看情况）。</p><p>如果有什么问题，<strong>最好是尽快反馈</strong>。后续按我自己的设备发现有问题我还是会修，但其他设备没有反馈，有没有问题我依旧不知道。</p><p>后续计划可能去搓新网站了。</p><h4>🌐 关于开源</h4><p>星言源码已在 GitHub 公开：<strong>https://github.com/ling233330-star/star033</strong></p><p>开源即代表接受「使用许可」的全部条款（允许自用 / 禁止商用 / 禁止冒名 / 禁止二次公开发布），详情见应用内「使用须知 → 使用许可」。</p><h4>🔧 本次更新内容</h4><h4>聊天</h4><p>修复：联系人回复/主动发送消息条数（最少~最多区间）设置无效，始终只发 1 条的问题</p><p>修复：多条消息一次性弹出，改为逐条延迟发送（间隔 1~3 秒），更真实</p><p>修复：切页面/点其他按钮打断联系人回复、正在输入状态、无已读不回标识的问题</p><p>修复：切换聊天日期无法跳转位置（现在能真正滚动到对应日期）</p><p>修复：消息只显示最近 80 条、上划无法加载更早消息（新增触顶加载）</p><p>修复：iOS 图片/表情显示为 url、http 图片加载失败无兜底</p><p>修复：引用文字消息显示成情绪字卡</p><p>修复：输入法在点其他按钮后错误重开</p><h4>主动发消息</h4><p>改为精确间隔触发：按你设置的最短~最长随机间隔到点才发，不再固定轮询、不再延迟送达</p><p>主动发送消息条数改为最少/最多区间（1~20 条随机）</p><h4>数据安全</h4><p>修复：刷新后偶发丢失聊天记录/朋友圈（localStorage 优先 + IndexedDB 合并补缺）</p><p>修复：OPPO/iOS 浏览器切后台丢数据（自动保存加固）</p><p>本地存储满时自动分片保存，不再静默丢失</p><h4>字卡库</h4><p>导入数据新增「追加/替换」选择，追加时重复字卡自动去重</p><p>导入聊天记录支持追加合并（几天前的记录也能拼回来）</p><p>新增「清空全部公用字卡」「清空全部专享字卡」按钮</p><p>分组名不再截断，完整显示</p><h4>朋友圈</h4><p>评论支持上传图片发送</p><p>评论表情包草稿不再显示 url</p><h4>调查问卷</h4><p>修复自动答题死循环卡死</p><p>新增「未作答概率」设置</p><p>实时显示梦角已提交的答案</p><p>提交后聊天插入系统消息</p><h4>夜间模式</h4><p>颜色全面优化：不再死黑，柔和深蓝灰，气泡/输入栏/弹窗/日历全部适配</p><p>修复开屏、表情分组、使用说明分类等文字看不见的问题</p><h4>更多功能分类</h4><p>重新分类：消息工具 / 聊天互动 / 更多 / 梦角 / 字卡库 / 设置</p><p>设置中新增「安装到桌面」（PWA 安装）</p><p>导出进度条文案修正</p><p>发送按钮颜色修正</p><p>回复设置移除重复的免打扰入口</p><p>修复部分按钮在 Via 浏览器双触发/无响应</p><p style="color:#999;font-size:12px;">【感谢这一路的陪伴，星言以后应该不会做什么大的变动了】</p>'
  },
  {
    version: '1.6',
    date: '2026-08-03',
    title: '星言 1.6',
    summary: '图文消息、礼物盒、梦角日历心情留言、默认字卡库扩充、问题修复',
    content: '<h4>🌙 0803 星言 1.6 版本更新公告</h4><p>公测阶段结束，感谢大家的反馈和陪伴。本次更新内容如下。</p><h4>聊天</h4><p>新增图文消息：文字和图片可以一起发送，会保存为聊天记录。</p><p>新增红包和自定义拍一拍里可以使用字卡库给梦角设定的拍一拍。</p><h4>梦角互动</h4><p>新增礼物盒：可以互相赠送礼物，附带留言和时间，作为聊天记录保存。</p><h4>梦角日历</h4><p>梦角每日心情和留言。</p><h4>字卡</h4><p>默认通用字卡库扩充，增加更多日常表达（默认关闭，可设定开启）。</p><h4>其他</h4><p>页面布局、功能体验优化，部分问题修复。</p><p style="color:#999;font-size:12px;">【星言以后应该不会做什么大的变动了】</p>'
  },
  {
    version: '1.5',
    date: '2026-07-28',
    title: '星言 1.5',
    summary: '新增心意/交流意图字卡、朋友圈表情包回复、自定义图标、存储空间、快捷切换联系人、信箱分类查看等',
    content: '<h4>🌙 0728 星言 1.5 版本更新公告</h4><h4>1. 情绪字卡新增【心意】与【交流意图】</h4><p>情绪系统新增两个表达维度：</p><p>❤️ 心意字卡</p><p>💬 交流意图字卡</p><p>可在【情绪系统设置】中选择开启或关闭。</p><h4>2. 朋友圈新增表情包回复评论</h4><p>朋友圈评论现在支持使用表情包进行回复。</p><p>同时对朋友圈整体布局进行了微调，优化浏览体验。</p><h4>3. 聊天输入栏透明效果调整</h4><p>聊天输入栏所在区域调整为半透明效果。</p><p>开启背景图片后，可以更好地显示聊天背景。</p><h4>4. 聊天输入栏【更多功能】分类调整</h4><p>重新整理更多功能中的分类布局，使功能查找更加方便。</p><h4>5. 联系人编辑页面新增【清空聊天记录】</h4><p>进入：</p><p>顶部栏左上角三个点 → 编辑联系人</p><p>新增：</p><p>【清空聊天记录】</p><p>可快速删除当前联系人的聊天内容。</p><h4>6. 信箱新增发送内容控制</h4><p>新增信箱回复设置：</p><p>可选择关闭联系人写信时是否使用：</p><p>颜文字</p><p>Emoji</p><p>图片表情</p><p>设置位置：</p><p>【回复设置】→【信箱设置】</p><h4>7. 新增【自定义图标】功能</h4><p>设置中新增：</p><p>【自定义图标】</p><p>支持上传图片，自定义功能按钮图标。</p><p>（该功能目前暂未进行完整测试）</p><h4>8. 新增【存储空间】查看功能</h4><p>设置 → 存储空间</p><p>现在可以查看星言当前占用的本地存储情况。</p><p>因为有些功能没做完，目前部分分类暂未完善，后续会继续补充。</p><p style="font-weight:600;">⚠️ 注意：星言数据保存在手机本地，但浏览器本地存储并不是永久保存。</p><p>以下情况可能导致数据丢失：</p><p>清理浏览器数据</p><p>系统清理缓存</p><p>浏览器限制或自动清理</p><p>建议定期使用【数据导出】功能进行备份。</p><h4>9. 聊天顶部栏新增快捷切换联系人</h4><p>聊天页面顶部栏右侧新增快捷切换联系人按钮。</p><p>无需返回主页即可快速切换聊天对象。</p><h4>10. 梦角主页专属信箱新增分类查看</h4><p>专属信箱新增分类：</p><p>全部</p><p>对方来信</p><p>对方回信</p><p>寄出的信</p><p>方便查看不同类型的信件。</p><h4>11. 朋友圈默认概率优化调整</h4><p>调整了朋友圈内容出现概率。</p><p>如果不符合个人使用习惯，可以前往：</p><p>【回复设置】→【朋友圈设置】</p><p>自行调整</p><h4>12. 编辑联系人页面的显示设置进行了调整优化</h4><p>本次更新对部分显示设置进行了细节调整，优化页面布局与使用体验。</p><p>具体内容可点击顶部栏左上角「三个点」打开设置页面，下滑查看相关选项。</p><h4>13. 问题优化</h4><p>根据小红书群内反馈，对部分问题进行了调整和优化。</p><p>由于缺少反馈的bug相关设备型号进行测试，目前无法确认所有问题是否已完全修复。（我只有自己的手机型号，得使用者自己验证）</p><p>如果后续使用过程中仍遇到相关问题，欢迎继续反馈，并提供具体情况（设备型号、浏览器、操作步骤等），方便进一步排查。</p>'
  },
  {
    version: '1.46',
    date: '2026-07-24',
    title: '星言字卡',
    summary: 'Bug修复、开屏公告优化、占卜功能优化、决策功能优化、聊天字卡库优化（导入/导出JSON）',
    content: '<h4>1. Bug 修复，细节优化</h4><p>修复了一些使用群内反馈的问题，提升使用稳定性。优化部分细节，提升整体使用体验。由于我没有相关设备进行测试是否已修复问题，需要自己实际使用验证。</p><h4>2. 开屏公告与使用须知优化</h4><p>重新调整并完善了开屏公告和使用须知内容。</p><h4>3. 占卜功能优化</h4><p>占卜抽牌中的混合模式新增<strong>【自由抽牌】</strong>功能。</p><p>用户可以根据自己的需求选择抽牌方式，增加占卜体验的自由度。</p><h4>4. 决策功能优化</h4><p><strong>【帮我决定】</strong>和<strong>【多人决定】</strong>功能新增使用<strong>【自定义选项】</strong>问问题时，保留了已输入的文字选项内容。</p><h4>5. 聊天字卡库优化</h4><p>新增<strong>【导入 JSON】</strong>和<strong>【导出 JSON】</strong>功能。</p><p>导入与导出时新增字卡分类选择，可根据需求勾选需要导入或导出的字卡分类。</p><h4>6. 聊天字卡库优化</h4><p>新增<strong>【导入 JSON】</strong>功能，支持适配 milk 字卡 JSON 格式。</p><p>导入 JSON 时新增字卡类型与分类选择。</p><p>可选择导入：</p><p><br></p><p>主字卡类型：</p><p>公用字卡</p><p>专享字卡</p><p><br></p><p>字卡分类：</p><p>主字卡</p><p>颜文字</p><p>emoji</p><p>图片表情</p><p>拍一拍</p><p>语音</p><p>导入时请根据 JSON 内容选择对应的字卡类型和分类位置，避免全选导致字卡导入错误。</p>'
  },
  {
    version: '1.45',
    date: '2026-07-23',
    title: '星言字卡',
    summary: 'Bug修复、新增更新公告、使用须知、留言板更新、让对方继续说、输入栏收纳',
    content: '<h4>1. Bug 修复</h4><p>修复了一些群内反馈的问题。</p><p>由于我没有相关设备进行测试，部分修复效果需要大家实际使用验证。</p><p>如果遇到新的问题，欢迎继续反馈。</p><h4>2. 新增更新公告</h4><p>设置中新增<strong>【更新公告】</strong>页面。</p><p>可以查看星言历次版本更新内容。</p><h4>3. 新增使用须知</h4><p>设置中新增<strong>【使用须知】</strong>页面。</p><p>包含：</p><ul><li>Bug反馈方式</li><li>网站说明</li><li>版本说明</li><li>使用相关注意事项</li></ul><h4>4. 我的留言板更新</h4><p>更多功能中的<strong>【我的留言板】</strong>已更新新版。</p><p>该功能为单向留言功能，不设置互动功能。</p><p>可用于记录想留下的话。</p><h4>5. 新增「让对方继续说」功能</h4><p>聊天输入栏右侧新增功能按钮。</p><p>点击后可触发联系人立即回复一条消息。</p><p>该按钮支持收纳，不需要时可以隐藏。</p><h4>6. 新增聊天输入栏收纳功能</h4><p>取消勾选显示的功能按钮后，会自动从聊天输入栏隐藏。</p><p>隐藏后的按钮会移动至底部左侧<strong>【更多功能】</strong>中的<strong>【收纳按钮】</strong>区域。</p><p>发送消息按钮不会被收纳。</p><h4>7. 其他优化</h4><p>修复了一些我自己在使用过程中发现的问题。</p><p>部分优化内容不单独列出。</p>'
  },
  {
    version: '1.4',
    date: '2026-07-22',
    title: '星言字卡',
    summary: '顶部栏字卡优化、新增聊天情绪系统、占卜功能修复、新增生理周期记录、底部聊天栏批量发送模式',
    content: '<h4>1. 顶部栏字卡优化</h4><p><strong>顶部栏「心情」</strong>用于表示梦角当前整体心情。</p><p>顶部栏五处字卡共同组成梦角当前状态，表达的是「TA现在如何与你交流」。</p><ul><li>💬 对方状态：TA如何回应你</li><li>☁️ 天气：世界是什么样</li><li>🕰 时间：现在是什么时候</li><li>🌙 心情状态：TA感觉怎么样</li><li>💤 空闲状态：TA正在做什么、有没有空</li></ul><p>默认分组新增了一批公用字卡（由 AI 辅助创作，并非复制其他老师分享的字卡内容）。</p><p>所有默认字卡均可根据个人使用习惯自由添加、修改或删除。</p><h4>2. 新增「聊天情绪系统」</h4><p>新增独立的聊天情绪系统。</p><p>聊天情绪字卡表示的是梦角发送这一句话时所流露出的情绪，并非梦角当前整体心情。</p><p>开启该功能后，梦角发送聊天消息时，将有概率随机附带一张聊天情绪字卡，用于补充当前消息的情绪与语气，让有限的字卡表达更加自然、丰富。</p><p>字卡库内置默认情绪字卡（由 AI 辅助创作，并非复制其他老师分享的字卡内容），也支持自由添加、修改和删除。</p><p>该功能可在字卡库中自由开启或关闭。</p><p style="font-size:12px;color:#999;">【灵感来源，其实好久以前刷的有老师提过情绪字卡类似的功能不过不知道是谁，只是有点印象，然后昨天晚上刷的了@心汋是颗彩虹多宝糖 老师的帖子的网站聊天也有情绪字卡，感觉很有意思，今天就搓了这个功能】</p><h4>3. 占卜功能修复</h4><p>占卜功能页面已修复，现在可以正常使用。</p><h4>4. Bug 修复</h4><p>修复了一些已知问题，优化了部分使用体验。</p><h4>5. 新增生理周期记录</h4><p>新增生理周期记录功能，可用于记录和查看个人生理周期信息。</p><h4>6. 新增了批量发送消息的功能</h4><p>该功能可在左上角三个点里自由开启或关闭。</p><p style="font-size:12px;color:#999;">【群友想要，参考milk字卡搓的，总之是感谢milk老师】</p>'
  },
  {
    version: '1.35',
    date: '2026-07-21',
    title: '星言字卡',
    summary: '联系人头像库更新、用户头像功能更新、梦角主页功能更新、占卜功能页面优化',
    content: '<h4>1. 联系人头像库更新</h4><p>顶部栏左上角「三个点」菜单新增<strong>【联系人头像库】</strong>。</p><p>开启后，梦角可主动随机更新头像。</p><p>非梦角主动更换头像使用时，也可以直接在头像库中选择并保存头像进行更新。</p><h4>2. 用户头像功能更新</h4><p>顶部栏左上角「三个点」菜单新增<strong>头像管理</strong>。</p><p>支持上传多个个人头像，并可自由切换使用。</p><h4>3. 梦角主页功能</h4><p>点击顶部栏联系人头像，可打开<strong>【梦角主页】</strong>窗口。</p><p><strong>【梦角主页】新增：</strong></p><ul><li>梦角主动更换头像历史记录查看</li><li>底部聊天栏左侧「更多功能」中新增<strong>【梦角主页】</strong>快捷入口</li></ul><h4>4. 占卜功能页面更新</h4><p>底部聊天栏左侧「更多功能」中的占卜功能已优化：</p><ul><li>页面调整为全屏显示</li><li>抽牌方式优化，支持从牌堆中抽取卡牌</li><li>抽取后的牌面展示优化，替换原有 emoji，改为塔罗牌和雷诺曼牌面图片显示</li></ul>'
  },
  {
    version: '1.3',
    date: '2026-07-20',
    title: '星言字卡',
    summary: '聊天功能新增快捷入口、通话页面优化、新增简约模式、Bug修复',
    content: '<h4>1. 聊天功能新增快捷入口</h4><p>聊天输入栏左侧「更多功能」中新增：</p><ul><li>🍅 番茄钟快捷按钮</li><li>👋 拍一拍快捷按钮</li></ul><h4>2. 通话页面优化</h4><p>通话半框页面右上角新增<strong>【上传背景图片】</strong>按钮。</p><p>可自定义通话背景，提升页面个性化体验。</p><h4>3. 新增简约模式</h4><p>左上角「三个点」菜单中新增<strong>【简约模式】</strong>。</p><p>开启后可隐藏头像，界面风格类似番茄钟陪伴模式页面。</p><h4>4. Bug 修复</h4><p>修复了使用过程中发现的部分问题，提升稳定性。</p><h4>🍅 番茄钟陪伴模式说明</h4><p>番茄钟陪伴模式支持：</p><ul><li>上传背景图片，自定义陪伴页面外观</li><li>在设置中选择联系人回复方式：使用聊天字卡库回复 / 使用番茄钟独立字卡库回复</li></ul><p>两种模式可以自由调整，根据自己的需求设置即可。</p><p>陪伴模式右上角的 ☁️ 按钮：点击后可切换已有联系人的陪伴窗口。</p>'
  },
  {
    version: '1.2',
    date: '2026-07-19',
    title: '星言字卡',
    summary: '修复Bug、拍一拍功能、联系人个人面板、快速切换联系人、隐藏底部栏、字卡库等',
    content: '<h4>更新内容</h4><h4>1. 修复问题</h4><p>修复了一些使用过程中发现的 Bug。优化部分功能体验。</p><h4>2. 拍一拍功能</h4><p>在聊天界面点击联系人头像，即可使用<strong>【拍一拍】</strong>功能。</p><h4>3. 联系人个人面板</h4><p>点击聊天顶部栏的联系人头像，即可进入<strong>【联系人个人面板】</strong>。</p><p>目前仍在设计中，后续可能会增加更多内容和功能。</p><h4>4. 快速切换联系人</h4><p>顶部栏的「< >」按钮可用于快速切换联系人。</p><p>切换顺序可在左上角「三个点」菜单中的相关设置进行调整。</p><h4>5. 隐藏底部栏</h4><p>支持隐藏底部导航栏。可在左上角「三个点」菜单中的相关设置进行调整。</p><h4>6. 字卡库</h4><p>聊天、信箱、朋友圈、调查问卷使用的字卡均在此管理。包含：公用字卡、专享字卡。</p><h4>7. 顶部栏字卡设置</h4><p>可更换联系人顶部栏显示的 5 项字卡。</p><p>显示位置：联系人昵称下方：对方状态、第二排：天气｜心情状态、第三排：时间｜空闲状态。</p><h4>8. 更多功能入口</h4><p>底部聊天栏表情包左侧的「三个点」中包含其他小功能。</p><h4>9. 回复时间设置</h4><p>梦角聊天、信箱、朋友圈的回复时长相关设置位于：设置 → 回复设置。已显示不同回复时间概率，可根据个人使用习惯进行调整。</p>'
  },
  {
    version: '1.1',
    date: '2026-07-18',
    title: '星言字卡',
    summary: '新增更多隐藏功能、Bug修复',
    content: '<h4>1. 新增更多隐藏功能</h4><p>左上角「三个点」菜单中新增<strong>【更多隐藏功能】</strong>。</p><p>现在可以自由控制界面显示内容：</p><ul><li>聊天顶部栏昵称隐藏/显示</li><li>拍一拍双方昵称隐藏/显示</li><li>底部导航栏隐藏/显示</li><li>其他界面元素隐藏设置</li></ul><p>开启后可查看全部隐藏选项，根据个人喜好调整界面。</p><h4>2. Bug 修复</h4><p>修复了一些使用过程中发现的问题。优化部分功能稳定性。</p><h4>3. 当前测试情况</h4><p>目前已在电脑浏览器测试，基础功能运行正常。后续会继续通过自己的手机使用体验进行测试和修复。如果使用过程中发现任何问题，欢迎反馈。</p>'
  },
  {
    version: '1.0',
    date: '2026-07-17',
    title: '星言字卡',
    summary: '测试发布，包含拍一拍、联系人面板、快捷切换、底部栏隐藏、字卡库等基础功能',
    content: '<h4>当前功能介绍</h4><p>目前开始均为测试版本，功能可能会根据后续使用体验进行调整或修改。</p><h4>1. 拍一拍功能</h4><p>在聊天页面点击联系人头像，即可对联系人使用<strong>【拍一拍】</strong>功能。</p><h4>2. 联系人个人面板</h4><p>点击聊天顶部栏的联系人头像，可打开联系人个人面板。</p><h4>3. 快捷切换联系人</h4><p>顶部栏的「<>」按钮用于快捷切换联系人。切换顺序可在顶部栏左上角「三个点」菜单中进行设置。</p><h4>4. 底部导航栏隐藏</h4><p>支持隐藏底部导航栏。可在顶部栏左上角「三个点」菜单中进行设置。</p><h4>5. 字卡库</h4><p>字卡库入口位于设置中。包含：公用字卡库、专享字卡库。后续会继续根据实际使用体验进行优化和调整。</p>'
  }
];

var CURRENT_VERSION = '1.7.2';
var DEPLOY_TIME = '2026-08-08 23:26';

function compareVersions(v1, v2) {
  var parts1 = v1.split('.').map(Number);
  var parts2 = v2.split('.').map(Number);
  var len = Math.max(parts1.length, parts2.length);
  for (var i = 0; i < len; i++) {
    var p1 = parts1[i] || 0;
    var p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

function getLastReadVersion() {
  try {
    return localStorage.getItem('star_last_read_version') || '0.0';
  } catch(e) {
    return '0.0';
  }
}

function setLastReadVersion(version) {
  try {
    localStorage.setItem('star_last_read_version', version);
  } catch(e) {}
}

function showUpdateNotice(notice) {
  var overlay = document.getElementById('update-notice-overlay');
  if (!overlay) return;
  
  document.getElementById('update-notice-title').innerHTML = '✨ ' + notice.title;
  document.getElementById('update-notice-version').textContent = '版本 ' + notice.version;
  document.getElementById('update-notice-date').textContent = notice.date + ' · 部署 ' + (typeof DEPLOY_TIME!=='undefined'?DEPLOY_TIME:'-');
  var deployEl=document.getElementById('update-notice-deploy');
  if(deployEl)deployEl.textContent='部署 '+(typeof DEPLOY_TIME!=='undefined'?DEPLOY_TIME:'');
  document.getElementById('update-notice-body').innerHTML = notice.content;
  
  overlay.classList.add('show');
}

function closeUpdateNotice() {
  var overlay = document.getElementById('update-notice-overlay');
  if (overlay) {
    overlay.classList.remove('show');
  }
  setLastReadVersion(CURRENT_VERSION);
}

function checkUpdateNotice() {
  var lastRead = getLastReadVersion();
  var latestNotice = UPDATE_NOTICES[0];
  
  if (!latestNotice) return;
  
  if (compareVersions(latestNotice.version, lastRead) > 0) {
    showUpdateNotice(latestNotice);
  }
}

function renderUpdateHistory() {
  var list = document.getElementById('update-history-list');
  if (!list) return;
  
  var html = '';
  UPDATE_NOTICES.forEach(function(notice, index) {
    html += '<div class="update-history-item' + (index === 0 ? ' expanded' : '') + '" data-version="' + notice.version + '">' +
      '<div class="update-history-header" onclick="toggleUpdateHistory(this)">' +
        '<div class="update-history-info">' +
          '<div class="update-history-title">✨ ' + notice.title + '<span class="update-history-version">' + notice.version + '</span></div>' +
          '<div class="update-history-date">' + notice.date + '</div>' +
          '<div class="update-history-summary">' + notice.summary + '</div>' +
        '</div>' +
        '<div class="update-history-arrow">▼</div>' +
      '</div>' +
      '<div class="update-history-content">' +
        '<div class="update-history-content-inner">' + notice.content + '</div>' +
      '</div>' +
    '</div>';
  });
  
  list.innerHTML = html;
}

function toggleUpdateHistory(header) {
  var item = header.parentElement;
  item.classList.toggle('expanded');
}

function bindUpdateNoticeEvents() {
  var btn = document.getElementById('update-history-btn');
  if (btn) {
    btn.addEventListener('click', function() {
      showPg('pg-update-history');
    });
  }
  
  var usageBtn = document.getElementById('usage-notice-btn');
  if (usageBtn) {
    usageBtn.addEventListener('click', function() {
      showPg('pg-usage-notice');
    });
  }
  
  var overlay = document.getElementById('update-notice-overlay');
  if (overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        closeUpdateNotice();
      }
    });
  }
  
  showPgCallbacks['pg-update-history'] = function() {
    renderUpdateHistory();
  };
  
}

function initUpdateNotice() {
  bindUpdateNoticeEvents();
  // ★ 修复：每个版本首次打开自动弹更新公告（按版本号比较，读过则不再弹）
  setTimeout(function(){
    try{ checkUpdateNotice(); }catch(e){ console.warn('auto notice fail:',e); }
  },800);
}

// 从开屏点击"使用须知"按钮：关闭开屏并进入使用须知页面
function showUsageNoticeFromSplash() {
  // #region debug-point B:splash-function
  console.log('[DEBUG] showUsageNoticeFromSplash called');
  // #endregion
  try{
    var ann = document.getElementById('announcement-screen');
    if (ann) {
      // #region debug-point B1:hide-announcement
      console.log('[DEBUG] hiding announcement screen');
      // #endregion
      ann.style.opacity = '0';
      ann.style.pointerEvents = 'none';
      setTimeout(function() {
        ann.style.display = 'none';
      }, 500);
    }
    var phone = document.querySelector('.phone');
    if (phone) {
      // #region debug-point B2:show-phone
      console.log('[DEBUG] showing phone');
      // #endregion
      phone.style.display = 'flex';
      phone.style.opacity = '1';
    }
    // 修复：先切换到使用须知页面，再显示 phone，避免用户看到短暂的聊天列表
    try{
      // #region debug-point B3:show-pg
      console.log('[DEBUG] showing pg-usage-notice');
      // #endregion
      showPg('pg-usage-notice');
      // #region debug-point B4:render-chatlist
      console.log('[DEBUG] rendering chat list');
      // #endregion
      renderChatList();
      // 首次强制模式：隐藏顶部返回栏和底部导航栏，显示开始按钮
      var seen = getNoticeSeen();
      // #region debug-point B5:check-notice-seen
      console.log('[DEBUG] getNoticeSeen:', seen);
      // #endregion
      if (!seen) {
        var nav = document.getElementById('usage-notice-nav');
        if (nav) nav.style.display = 'none';
        var tabs = document.getElementById('usage-notice-tabs');
        if (tabs) tabs.style.display = 'none';
        var startBtn = document.getElementById('usage-notice-start-btn');
        if (startBtn) startBtn.style.display = 'block';
      } else {
        // 非首次：确保导航栏和标签栏正常显示，隐藏强制按钮
        var startBtn = document.getElementById('usage-notice-start-btn');
        if (startBtn) startBtn.style.display = 'none';
      }
    }catch(e){
      console.error('showUsageNoticeFromSplash inner error:',e);
    }
  }catch(e){
    console.error('showUsageNoticeFromSplash error:',e);
    var phone = document.querySelector('.phone');
    if(phone){phone.style.display='flex';phone.style.opacity='1';}
    var ann = document.getElementById('announcement-screen');
    if(ann){ann.style.display='none';ann.style.pointerEvents='none';}
    try{showPg('pg-list');renderChatList();}catch(e2){}
  }
}

window.showUpdateNoticeManual = function() {
  var latestNotice = UPDATE_NOTICES[0];
  if (latestNotice) {
    showUpdateNotice(latestNotice);
  }
};

window.resetUpdateNoticeRead = function() {
  setLastReadVersion('0.0');
  toast('已重置阅读记录，刷新页面后将重新显示公告');
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUpdateNotice);
} else {
  initUpdateNotice();
}
</script>



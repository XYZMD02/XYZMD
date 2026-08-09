# -*- coding: utf-8 -*-
import io

with io.open('app/src/26_avatar_lib_rest.js', encoding='utf-8') as f:
    src = f.read()

old_start = 'function batchAddQuestions(){\n    var batchInput=document.getElementById(\'survey-batch-input\');'
new_start = '''function batchAddQuestions(){
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
      var hasOptions=entry.opts.length>0;'''

# 替换从 batchAddQuestions 开头到 hasOptions 定义
old_anchor = "function batchAddQuestions(){\n    var batchInput=document.getElementById('survey-batch-input');"
idx = src.find(old_anchor)
if idx < 0:
    print('FAIL: 未找到 batchAddQuestions 开头')
    raise SystemExit(1)

# 找到 "var hasOptions=" 的位置（在 batchAddQuestions 内）
has_opts_idx = src.find('var hasOptions=', idx)
if has_opts_idx < 0:
    print('FAIL: 未找到 var hasOptions=')
    raise SystemExit(1)

new_code = new_start
src = src[:idx] + new_code + src[has_opts_idx:]

# 现在修复 hasOptions 后面的选项渲染：optionsMap 引用要改成 entry.opts
# 找到 optionsMap[qTrim] 引用并替换
old_ref1 = "optionsMap[qTrim].map(function(opt,i){"
new_ref1 = "entry.opts.map(function(opt,i){"
src = src.replace(old_ref1, new_ref1)
old_ref2 = "optionsMap[qTrim]&&optionsMap[qTrim].length>0;"
src = src.replace(old_ref2, "entry.opts.length>0;")

with io.open('app/src/26_avatar_lib_rest.js', 'w', encoding='utf-8') as f:
    f.write(src)
print('替换完成')

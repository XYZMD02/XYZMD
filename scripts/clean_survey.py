# -*- coding: utf-8 -*-
import io, re

with io.open('app/src/26_avatar_lib_rest.js', encoding='utf-8') as f:
    src = f.read()

# 1) 清理 showSurveyTab('create') 里的旧 typeSelects 绑定
old1 = """var typeSelects=document.querySelectorAll('.survey-question-type');   typeSelects.forEach(function(typeSelect){     var item=typeSelect.closest('.survey-question-item');     var optionsContainer=item.querySelector('.survey-options-container');     typeSelect.onchange=function(){       optionsContainer.style.display"""
if old1 in src:
    # 找到该块完整结束（匹配到下一个 ' 或函数）
    start = src.find(old1)
    # 向前找 "      var typeSelects"
    start2 = src.rfind("var typeSelects", 0, start)
    # 向后找该 forEach 结束（'  });' 或换行后的 '});'）
    end_marker = "typeSelect.onchange=function(){       optionsContainer.style.display"
    # 简化：删除从 start2 到最近的 '  });\n' 或 '    });'
    seg_end = src.find('    });', start2)
    if seg_end > 0:
        seg_end += len('    });')
        src = src[:start2] + src[seg_end:]
        print('已删除旧 typeSelects 绑定块')

# 2) 清理 batchAddQuestions 里的旧 survey-question-type 引用（newItem.querySelector）
# 找到 batchAddQuestions 中剩余的旧绑定
i = src.find('function batchAddQuestions')
j = src.find('function addSurveyOption', i)
if j > 0:
    seg = src[i:j]
    # 删除 "var typeSelect=newItem.querySelector('.survey-question-type');" 及其后的 onchange 块
    seg = re.sub(r"\s*var typeSelect=newItem\.querySelector\('\.survey-question-type'\);\s*var optionsContainer=newItem\.querySelector\('\.survey-options-container'\);\s*if\(typeSelect&&optionsContainer\)\{\s*typeSelect\.onchange=function\(\)\{\s*optionsContainer\.style\.display=this\.value==='options'\?'block':'none';\s*\};\s*\}", '', seg)
    # 删除 typeSelect.onchange 简单版本
    seg = re.sub(r"\s*var typeSelect=newItem\.querySelector\('\.survey-question-type'\);\s*var optionsContainer=newItem\.querySelector\('\.survey-options-container'\);\s*if\(typeSelect&&optionsContainer\)\{[^}]*\}", '', seg)
    src = src[:i] + seg + src[j:]
    print('已清理 batchAddQuestions 旧绑定')

# 3) 删除旧内联 HTML（含 survey-question-type select 和 options-container 的旧问题模板）
# 在 batchAddQuestions 的 entries.forEach 里有旧 optionsHtml？检查
# 也删除 addSurveyQuestion 里的旧 typeSelect 绑定
k = src.find('function addSurveyQuestion')
m = src.find('function deleteSurveyQuestion', k)
if m > 0:
    seg2 = src[k:m]
    seg2 = re.sub(r"\s*var typeSelect=newItem\.querySelector\('\.survey-question-type'\);\s*typeSelect\.addEventListener\('change',function\(\)\{[^}]*\}[^}]*\}[^}]*\}[^}]*\}", '', seg2)
    src = src[:k] + seg2 + src[m:]
    print('已清理 addSurveyQuestion 旧绑定')

with io.open('app/src/26_avatar_lib_rest.js', 'w', encoding='utf-8') as f:
    f.write(src)
print('完成')

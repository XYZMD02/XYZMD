# -*- coding: utf-8 -*-
import io, re

with io.open('app/src/26_avatar_lib_rest.js', encoding='utf-8') as f:
    src = f.read()

# 1) 清理 2690 附近的 typeSelects 初始化绑定块
m = re.search(r"var typeSelects=document\.querySelectorAll\('\.survey-question-type'\);", src)
if m:
    start = m.start()
    # 找到块结束：'  });' 之后的换行（包含 optionsContainer 逻辑）
    # 从 start 找 "typeSelect.onchange" 后到最近的 '    });'
    seg = src[start:]
    # 找到这个 forEach 的结束：匹配 "typeSelect.onchange=function(){       optionsContainer.style.display=this.value==='options'?'block':'none';     };     });"
    end_marker = "});"
    # 定位 typeSelect.onchange 附近
    oc = seg.find("typeSelect.onchange")
    if oc > 0:
        # 找 oc 之后的第一个 "});"（onchange 结束 + forEach 结束 在附近）
        end1 = seg.find("});", oc)
        end2 = seg.find("});", end1+2)
        end = end2 + 3 if end2 > 0 else end1 + 3
        src = src[:start] + src[start+end:]
        print('1) 清理 typeSelects 初始化块 done')

# 2) 清理 batchAddQuestions 里 2918 的旧 HTML + 2922 typeSelect 绑定
# 用正则删除：newItem.innerHTML='...survey-question-type...'; 整行 + 后续 typeSelect 块
m2 = re.search(r"newItem\.innerHTML='<div style=\"display:flex;flex-direction:column;gap:8px;\"><div style=\"display:flex;align-items:center;gap:10px;\"><span style=\"font-size:12px;color:var\(--txt2\);padding-top:8px;\">'\+(index\+1)\+'\.</span>.*?survey-options-container.*?</div></div>';", src, re.S)
if m2:
    start2 = m2.start()
    end2 = m2.end()
    # 找到该语句后的 typeSelect 绑定块
    after = src[end2:]
    ts = after.find("var typeSelect=newItem.querySelector('.survey-question-type');")
    if ts >= 0:
        te = after.find("});", ts)
        te2 = after.find("});", te+2)
        end_block = te2 + 3 if te2 > 0 else te + 3
        src = src[:start2] + src[end2:end2] + after[end_block:]
        print('2) 清理 batchAddQuestions 旧HTML+typeSelect done')
    else:
        src = src[:start2] + src[end2:]
        print('2) 清理 batchAddQuestions 旧HTML done (无typeSelect)')

# 3) 清理 resetSurvey 里 3473 的旧 HTML
m3 = re.search(r"questionsList\.innerHTML='<div class=\"survey-question-item\" data-index=\"0\">.*?survey-options-container.*?</div></div>';", src, re.S)
if m3:
    # 替换为新的简单结构
    new_html = "questionsList.innerHTML='<div class=\"survey-question-item\" data-index=\"0\"><div style=\"display:flex;flex-direction:column;gap:8px;\"><div style=\"display:flex;align-items:center;gap:10px;\"><span style=\"font-size:12px;color:var(--txt2);padding-top:8px;\">1.</span><input type=\"text\" class=\"survey-question-input\" placeholder=\"输入问题内容\" style=\"flex:1;padding:10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);font-size:14px;color:var(--txt);outline:none;box-sizing:border-box;\"><button class=\"survey-delete-question-btn\" onclick=\"SurveyApp.deleteSurveyQuestion(this)\" style=\"padding:6px 10px;border:none;border-radius:6px;background:#ff4d4f;color:#fff;font-size:12px;cursor:pointer;white-space:nowrap;\">删除</button></div><div style=\"display:flex;align-items:center;gap:8px;padding-left:22px;\"><span style=\"font-size:11px;color:var(--txt3);flex-shrink:0;\">答案</span><input type=\"text\" class=\"survey-option-input survey-answer-input\" placeholder=\"答案选项，用逗号分隔（不填则字卡回复）\" style=\"flex:1;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--c1);font-size:12px;color:var(--txt);outline:none;box-sizing:border-box;\"></div></div></div>';"
    src = src[:m3.start()] + new_html + src[m3.end():]
    print('3) 清理 resetSurvey 旧HTML done')

with io.open('app/src/26_avatar_lib_rest.js', 'w', encoding='utf-8') as f:
    f.write(src)
print('完成')

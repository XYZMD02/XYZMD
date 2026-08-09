# -*- coding: utf-8 -*-
import re, io

with io.open('app/index.html', encoding='utf-8') as f:
    html = f.read()

for kw in ['addSelectedCard', 'selectSurveyOption', 'survey-card-area', 'survey-option']:
    print(kw, ':', html.count(kw))

print('--- 答题界面字卡/选项点击绑定 ---')
# 找 renderCurrentQuestion 里选项渲染的 onclick
i = html.find('function renderCurrentQuestion')
seg = html[i:i+6000]
for m in re.finditer(r'onclick="[^"]{0,80}', seg):
    print('onclick:', m.group(0))

# -*- coding: utf-8 -*-
import re, sys
sys.stdout.reconfigure(encoding='utf-8')
s6 = open('app/src/06_body_skeleton.html', encoding='utf-8').read()
# 开屏相关
for k in ['splash', '开屏', 'ov-splash', 'logo', 'start', 'welcome', 'id="splash"']:
    idx = s6.find(k)
    if idx >= 0:
        print('06', k, ':', idx)
# 找右上角可能的位置：开屏顶部
i = s6.find('splash')
if i >= 0:
    print('--- 06 splash 上下文 ---')
    print(s6[max(0,i-200):i+1500])

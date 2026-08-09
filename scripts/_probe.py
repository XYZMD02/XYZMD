# -*- coding: utf-8 -*-
import re, sys
sys.stdout.reconfigure(encoding='utf-8')
s = open('app/src/06_body_skeleton.html', encoding='utf-8').read()
i = s.find('id="ov-beautify"')
# beautify 弹窗结束位置：找下一个 overlay 或文件的 30_tail 之前，取 ov-call 之前最近
j = s.find('id="ov-call"', i+10)
if j < 0: j = min(len(s), i+30000)
print('beautify 弹窗范围:', i, j, '长度', j-i)
seg = s[i:j]
for m in re.finditer(r'<textarea[^>]*id="([^"]+)"', seg):
    print('textarea id:', m.group(1))
print('custom-css-input 出现次数:', seg.count('custom-css-input'))

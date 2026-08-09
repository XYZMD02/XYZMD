# -*- coding: utf-8 -*-
import re, sys
sys.stdout.reconfigure(encoding='utf-8')
s = open('app/index.html', encoding='utf-8', errors='replace').read()
# 检查 aiBtn 显示逻辑是否在产物中完整
i = s.find('function showMsgActionMenu')
seg = s[i:i+6000]
for k in ["var aiBtn=$('msg-action-ai')", "aiBtn.style.display='flex'", "apiSet.enabled?'flex':'none'", "if(aiBtn)" ]:
    print(k, ':', seg.count(k))
# 检查 aiBtn.onclick 是否存在
j = s.find('aiBtn.onclick')
print('aiBtn.onclick 位置:', j)
print(s[j:j+200] if j>=0 else '不存在')

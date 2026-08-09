# -*- coding: utf-8 -*-
import re, io

with io.open('app/index.html', encoding='utf-8') as f:
    html = f.read()

scripts = re.findall(r'<script[^>]*>([\s\S]*?)</script>', html)
js = scripts[7]
lines = js.split('\n')

balance = 0
for i, ln in enumerate(lines):
    # 忽略字符串/注释里的大括号（粗略：只数非引号内的）
    balance += ln.count('{') - ln.count('}')
    if balance < -1:
        # 找首次明显失衡
        print('首次失衡行(主JS块):', i+1, 'balance:', balance)
        print('上下文:')
        for j in range(max(0,i-3), min(len(lines), i+4)):
            print('  ', j+1, ':', lines[j][:100])
        break
else:
    print('未找到明显失衡，最终 balance:', balance)

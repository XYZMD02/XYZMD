# -*- coding: utf-8 -*-
import re, io

with io.open('app/index.html', encoding='utf-8') as f:
    html = f.read()

scripts = re.findall(r'<script[^>]*>([\s\S]*?)</script>', html)
js = scripts[7]
lines = js.split('\n')

# 用栈找未匹配的 {
stack = []
for i, ln in enumerate(lines):
    # 粗略去字符串
    stripped = re.sub(r"'[^']*'", "''", ln)
    stripped = re.sub(r'"[^"]*"', '""', stripped)
    for ch in stripped:
        if ch == '{':
            stack.append((i+1, ln[:80]))
        elif ch == '}':
            if stack:
                stack.pop()

print('未闭合的 { 数量:', len(stack))
for item in stack[-10:]:
    print('  行', item[0], ':', item[1])

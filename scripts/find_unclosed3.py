# -*- coding: utf-8 -*-
import re, io

with io.open('app/index.html', encoding='utf-8') as f:
    html = f.read()

scripts = re.findall(r'<script[^>]*>([\s\S]*?)</script>', html)
js = scripts[7]
lines = js.split('\n')

# 逐行扫描（去掉字符串/注释粗略）
stack = []
for ln_no, ln in enumerate(lines):
    cleaned = re.sub(r"//[^\"]*$", '', ln)
    cleaned = re.sub(r"'[^']*'", "''", cleaned)
    cleaned = re.sub(r'"[^"]*"', '""', cleaned)
    cleaned = re.sub(r'`[^`]*`', '``', cleaned)
    cleaned = re.sub(r'/[^/\n]*/[gimsuy]*', '', cleaned)
    for ch in cleaned:
        if ch == '{':
            stack.append(ln_no+1)
        elif ch == '}':
            if stack:
                stack.pop()

print('未闭合 { 总数:', len(stack))
for ln in stack[-6:]:
    print('  行', ln, ':', lines[ln-1][:90])

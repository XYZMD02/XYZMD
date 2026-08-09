# -*- coding: utf-8 -*-
import re, sys
sys.stdout.reconfigure(encoding='utf-8')
html = open('app/index.html', encoding='utf-8', errors='replace').read()
pat = re.compile(r'<script(?![^>]*src=)[^>]*>([\s\S]*?)</script>')
ms = list(pat.finditer(html))
code = ms[7].group(1)
lines = code.split('\n')
# 10540-10595 行的每行深度变化（从 10540 开始，前面深度记为 0 相对）
start = sum(len(l)+1 for l in lines[:10540])
depth = 0
in_str = None
i = start
n = len(code)
prev = 10540
out = []
while i < n:
    ch = code[i]
    if in_str:
        if ch == '\\': i += 2; continue
        if ch == in_str: in_str = None
        i += 1; continue
    if ch == '"' or ch == "'" or ch == '`': in_str = ch; i += 1; continue
    if ch == '{': depth += 1
    elif ch == '}': depth -= 1
    row = code[:i].count('\n') + 1
    if row != prev:
        prev = row
        if 10540 <= row <= 10595:
            out.append((row, depth, lines[row-1][:80]))
    i += 1
for r, d, t in out:
    print(r, '深度', d, ':', t)

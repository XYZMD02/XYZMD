# -*- coding: utf-8 -*-
import re, io

with io.open('app/index.html', encoding='utf-8') as f:
    html = f.read()

scripts = re.findall(r'<script[^>]*>([\s\S]*?)</script>', html)
js = scripts[7]
lines = js.split('\n')

# 逐字符扫描，忽略字符串和注释
stack = []
in_str = None
in_line_comment = False
in_block_comment = False
i = 0
total = len(js)

# 简化：逐行处理，去掉行注释和字符串内容
for ln_no, ln in enumerate(lines):
    # 去掉行注释（// 到行尾，但不在字符串里）——粗略处理
    cleaned = ln
    # 去掉单行 // 注释
    cleaned = re.sub(r"//[^\"]*$", '', cleaned)
    # 去掉字符串内容
    cleaned = re.sub(r"'[^']*'", "''", cleaned)
    cleaned = re.sub(r'"[^"]*"', '""', cleaned)
    # 去掉模板字符串（粗略）
    cleaned = re.sub(r'`[^`]*`', '``', cleaned)
    # 去掉正则字面量（粗略：/.../ 含转义）
    cleaned = re.sub(r'/[^/\n]*/[gimsuy]*', '', cleaned)
    
    for ch in cleaned:
        if ch == '{':
            stack.append(ln_no+1)
        elif ch == '}':
            if stack:
                stack.pop()

print('未闭合 { 总数:', len(stack))
for ln in stack[-8:]:
    print('  行', ln, ':', lines[ln-1][:90])

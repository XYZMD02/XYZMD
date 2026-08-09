# -*- coding: utf-8 -*-
import re, io

with io.open('app/src/06_body_skeleton.html', encoding='utf-8') as f:
    lines = f.readlines()

start = None
end = None
for i, ln in enumerate(lines):
    if 'id="pg-usage-notice"' in ln:
        start = i
    if start is not None and 'id="usage-notice-start-btn"' in ln:
        end = i
        break

if start and end:
    chunk = ''.join(lines[start:end])
    text = re.sub(r'<[^>]+>', '\n', chunk)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = text.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&#10;', '\n').replace('&#39;', "'").replace('&quot;', '"')
    with io.open('scripts/_usage_notice_text.txt', 'w', encoding='utf-8') as out:
        out.write(text.strip())
    print('已提取到 scripts/_usage_notice_text.txt')
else:
    print('未找到范围', start, end)

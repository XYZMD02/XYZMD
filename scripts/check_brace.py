# -*- coding: utf-8 -*-
import re, io

with io.open('app/index.html', encoding='utf-8') as f:
    html = f.read()

scripts = re.findall(r'<script[^>]*>([\s\S]*?)</script>', html)
print('script 块数:', len(scripts))
for i, js in enumerate(scripts):
    if len(js) < 100:
        continue
    o = js.count('{')
    c = js.count('}')
    if o != c:
        print('块', i, ': { =', o, ', } =', c, ', 差 =', c-o)

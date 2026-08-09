# -*- coding: utf-8 -*-
import os, shutil, sys, hashlib
sys.stdout.reconfigure(encoding='utf-8')
src = 'app'
dst = r'C:\Users\Administrator\Desktop\star-root'
if os.path.exists(dst):
    shutil.rmtree(dst)
os.makedirs(dst)
for item in os.listdir(src):
    s = os.path.join(src, item)
    d = os.path.join(dst, item)
    shutil.copytree(s, d) if os.path.isdir(s) else shutil.copy2(s, d)
for d in ['scripts', 'docs']:
    shutil.copytree(d, os.path.join(dst, d))
for f in ['AGENTS.md', 'README.md', '.gitignore', 'LICENSE']:
    if os.path.exists(f):
        shutil.copy2(f, os.path.join(dst, f))
def md5(p):
    return hashlib.md5(open(p, 'rb').read()).hexdigest()
m1 = md5('app/index.html')
m2 = md5(os.path.join(dst, 'index.html'))
print('md5 一致:', m1 == m2, m1[:10], m2[:10])

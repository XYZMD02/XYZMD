# -*- coding: utf-8 -*-
"""
构建：按文件名顺序拼接 app/src/ 下的片段，生成 app/index.html。
用法: python scripts/build.py
"""
import os, sys, hashlib

SRC_DIR = os.path.join('app', 'src')
OUT = os.path.join('app', 'index.html')

def main():
    parts = []
    for name in sorted(os.listdir(SRC_DIR)):
        p = os.path.join(SRC_DIR, name)
        if os.path.isfile(p):
            with open(p, 'r', encoding='utf-8', newline='') as f:
                content = f.read().lstrip('\ufeff')
                parts.append(content)
    content = ''.join(parts)
    with open(OUT, 'w', encoding='utf-8', newline='') as f:
        f.write(content)
    print(f'已生成 {OUT}: {len(content.splitlines())} 行, {len(content)} 字符')
    print(f'片段数: {len(parts)}')

    # 若存在拆前备份，做一致性校验
    bk = os.path.join('backup', 'index_拆前备份.html')
    if os.path.isfile(bk):
        with open(bk, 'r', encoding='utf-8', newline='') as f:
            orig = f.read()
        if orig == content:
            print('✓ 与备份 index_拆前备份.html 逐字节一致')
        else:
            print('✗ 与备份不一致！请检查 src/ 片段是否被修改')
            for i, (a, b) in enumerate(zip(orig, content)):
                if a != b:
                    print(f'首个差异位置: 字符 #{i}')
                    print('备份:', repr(orig[max(0,i-60):i+60]))
                    print('生成:', repr(content[max(0,i-60):i+60]))
                    sys.exit(1)
                    break

if __name__ == '__main__':
    main()

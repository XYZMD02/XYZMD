import os

src_dir = os.path.join(os.path.dirname(__file__), '..', 'app', 'src')
bom_files = []

for name in sorted(os.listdir(src_dir)):
    p = os.path.join(src_dir, name)
    if os.path.isfile(p) and (name.endswith('.html') or name.endswith('.js')):
        with open(p, 'rb') as f:
            header = f.read(3)
        if header == b'\xef\xbb\xbf':
            bom_files.append(name)
            print(f'BOM: {name}')

if bom_files:
    print(f'\n共 {len(bom_files)} 个文件含 BOM')
else:
    print('无 BOM 文件')
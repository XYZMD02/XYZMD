# -*- coding: utf-8 -*-
import re, io

with io.open('app/index.html', encoding='utf-8') as f:
    html = f.read()

# 数 _DCCT 文本里的内容行数（主字卡）
i = html.find('var _DCCT')
seg = html[i:i+300000]
groups = re.findall(r'【[^】]+】', seg)
print('主字卡分组数(【】标题):', len(groups))
lines = [l for l in seg.split('\n') if l.strip() and not l.strip().startswith('【') and 'var _DCCT' not in l and '`;' not in l and 'var DEFAULT_COMMON' not in l]
print('主字卡内容行数:', len(lines))

# 数 emoji 数组总项数
emoji_matches = re.findall(r"items:\[(.*?)\]", seg)
total_emoji = 0
for m in emoji_matches:
    items = [x for x in re.split(r"','", m) if x.strip()]
    total_emoji += len(items)
print('emoji+kaomoji 总项数:', total_emoji)

print('通用默认字卡总量(主字卡+emoji+kaomoji):', len(lines) + total_emoji)

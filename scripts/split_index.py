# -*- coding: utf-8 -*-
"""
拆分 app/index.html 为 app/src/ 下的片段文件（纯物理切分，内容零修改）。
切分点行号 = 每个片段的起始行（1-based）。片段内容 = [start, next_start-1]。
"""
import os, io, sys

SRC = os.path.join('app', 'index.html')
DST_DIR = os.path.join('app', 'src')
os.makedirs(DST_DIR, exist_ok=True)

# 片段起始行（1-based，含），最后一项是哨兵（总行数+1）
CUTS = [
    1,       # 01 head + 工具函数
    183,     # 02 <style> CSS
    2955,    # 03 head meta（manifest link 等）
    2960,    # 04 Base64 塔罗/雷诺曼图片数据
    3091,    # 05 键盘修复脚本
    3174,    # 06 </head> + <body> + HTML 骨架（含内联 script）
    7848,    # 07 主 JS 开头（<script> + onerror + Card Data + State）
    8059,    # 08 默认字卡数据（275 组）
    13834,   # 09 localStorage 封装 + Storage 模块
    15475,   # 10 Nav + Time + Chat List
    16080,   # 11 Chat（聊天核心）
    18813,   # 12 批量发送模式
    19848,   # 13 Date Search + Contact Switcher + Non-Instant
    21580,   # 14 Emoji + Add Contact + Edit + Touch
    22988,   # 15 Red Packet + Overlays + Card Settings
    23686,   # 16 默认通用字卡 + milk 自动回复
    26488,   # 17 Batch Card + Upload + Speed + Toast
    28299,   # 18 DIVINATION + Moments
    30907,   # 19 Message Board + Letters + 信箱头像
    31786,   # 20 My page + 心意字卡 v2 + 交流意图
    35055,   # 21 Auto Send + Init + Settings + Decision + Sound
    36127,   # 22 星言日历 + Diary + Favorites + Highlights
    37900,   # 23 Pomodoro + Custom Chatbar + Icons + Storage Space
    40216,   # 24 使用说明 + 礼物盒 + TA 送礼
    41745,   # 25 Per-Contact + Bottom Nav + Copy + Favorite + Order
    42797,   # 26 随机头像库 + 剩余主 JS（含 </script>）
    48890,   # 27 PWA 注册
    50596,   # 28 情绪分组权重等杂项
    51530,   # 29 使用须知
    51649,   # 30 结尾 </body></html>
    51728,   # 哨兵
]

with open(SRC, 'r', encoding='utf-8', newline='') as f:
    lines = f.readlines()

n = len(lines)
assert CUTS[-1] == n + 1, f'哨兵行号 {CUTS[-1]} != 总行数+1 ({n+1})'

names = [
    '01_head_tools.html',
    '02_style.html',
    '03_head_meta.html',
    '04_card_images.js',
    '05_keyboard_fix.js',
    '06_body_skeleton.html',
    '07_main_js_start.html',
    '08_default_cards_data.js',
    '09_storage.js',
    '10_nav_chatlist.js',
    '11_chat.js',
    '12_batch_send.js',
    '13_search_switcher.js',
    '14_emoji_contacts.js',
    '15_redpacket_overlays.js',
    '16_default_common_cards.js',
    '17_upload_speed_toast.js',
    '18_divination_moments.js',
    '19_board_letters.js',
    '20_my_heart_cards.js',
    '21_autosend_settings.js',
    '22_calendar_diary.js',
    '23_pomodoro_icons.js',
    '24_usage_giftbox.js',
    '25_contact_custom.js',
    '26_avatar_lib_rest.js',
    '27_pwa.js',
    '28_misc.js',
    '29_usage_notice.js',
    '30_tail.html',
]
assert len(names) == len(CUTS) - 1

total_written = 0
for i in range(len(CUTS) - 1):
    start = CUTS[i] - 1      # 转 0-based
    end = CUTS[i + 1] - 1    # 下一片段起始（0-based，不含）
    chunk = lines[start:end]
    path = os.path.join(DST_DIR, names[i])
    with open(path, 'w', encoding='utf-8', newline='') as f:
        f.writelines(chunk)
    total_written += len(chunk)
    print(f'{names[i]:<28} 行 {CUTS[i]:>6}-{CUTS[i+1]-1:>6}  {len(chunk):>6} 行')

print(f'\n片段文件数: {len(names)}')
print(f'片段总行数: {total_written}  原始总行数: {n}  {"[OK] 一致" if total_written == n else "[FAIL] 不一致!"}')

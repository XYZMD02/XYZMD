# 星言

# 📌 使用声明

**本仓库代码仅供学习参考与个人私有部署使用。**

允许：
- ✅ 允许：个人私有部署（仅限自己使用）
- ✅ 允许：本地运行、学习研究

禁止：
- ❌ 禁止：删除或篡改原作者署名（星言 / 小红书言序 1842523578）
- ❌ 禁止：将本代码用于任何商业用途（包括但不限于企业内外部部署、对外提供服务、盈利性项目等）
- ❌ 禁止：将本仓库代码（含修改版本）二次公开发布至任何平台，包括但不限于小红书、抖音、B站、公众号、代码托管平台等

**本仓库采用 CC BY-NC-ND 4.0 许可证。**
违反必究，不接受任何"未看到声明"为由的免责。

## 目录说明

```
004/
├── app/                     # ★ 正式发布目录
│   ├── index.html           #   构建产物：由 src/ 合并生成（发送/部署用这个）
│   ├── src/                 #   源码片段（30 个，按功能拆分，勿直接改 index.html）
│   ├── sw.js                #   Service Worker（与 index.html 同目录，相对路径引用）
│   ├── manifest.json        #   PWA 清单
│   ├── icon-192.png         #   图标
│   ├── icon-512.png
│   └── apple-touch-icon.png
├── scripts/                 # 构建工具
│   ├── split_index.py       #   一次性：把 index.html 拆成 src/ 片段（已执行）
│   └── build.py             #   构建：把 src/ 按序拼回 app/index.html
├── backup/                  # 历史版本备份（index_拆前备份.html 为拆分前原始文件）
├── docs/                    # 文档与数据源（字卡 txt、使用说明）
├── archive/scripts/         # 一次性调试脚本归档（确认无用后可整体删除）
├── .reasonix/  .vscode/  reasonix.toml   # 配置（勿动）
└── README.md
```

## 开发流程（重要）

**以后改功能只改 `app/src/`，改完运行构建，再发送 `app/index.html`：**

```
python scripts\build.py
```

构建会自动做一致性校验：`src/` 合并结果必须与拆分前备份逐字节一致才算正常；
若片段被改动，产物会与备份不同（这是预期的正常差异），但**请不要删掉备份**，它用于每次校验。

### src/ 片段索引（按功能找文件）

| 片段 | 内容 |
|---|---|
| 01_head_tools.html | `<head>` 开头 + 性能工具函数 |
| 02_style.html | 全部 CSS 样式 |
| 03_head_meta.html | manifest link 等 meta |
| 04_card_images.js | **塔罗/雷诺曼牌 Base64 图片数据（2.2MB，纯数据）** |
| 05_keyboard_fix.js | 键盘弹出/收起修复 |
| 06_body_skeleton.html | `<body>` 全部 HTML 骨架 + 开屏 |
| 07_main_js_start.html | 主 JS 开头：onerror + Card Data + State |
| 08_default_cards_data.js | 默认通用字卡数据（275 组） |
| 09_storage.js | localStorage 安全封装 + Storage 模块 |
| 10_nav_chatlist.js | Nav + Time + Chat List |
| 11_chat.js | 聊天核心（消息发送/渲染/保存） |
| 12_batch_send.js | 批量发送模式 |
| 13_search_switcher.js | 日期搜索 + 联系人切换 + 非即时聊天 |
| 14_emoji_contacts.js | Emoji 面板 + 添加/编辑联系人 + 拍一拍 |
| 15_redpacket_overlays.js | 红包 + 弹窗 + 字卡设置入口 |
| 16_default_common_cards.js | 默认通用字卡逻辑 + milk 自动回复 |
| 17_upload_speed_toast.js | 贴纸/语音/图片上传 + 语速 + Toast |
| 18_divination_moments.js | 占卜 + 朋友圈 |
| 19_board_letters.js | 留言板 + 信箱 + 信箱头像 |
| 20_my_heart_cards.js | 我的页 + 心意字卡 v2 + 交流意图字卡 |
| 21_autosend_settings.js | 自动发送 + 初始化 + 设置 + 决策 + 音效 |
| 22_calendar_diary.js | 星言日历 + 日记 + 收藏 + 聊天重点 |
| 23_pomodoro_icons.js | 番茄钟 + 自定义输入栏 + 图标 + 存储空间 |
| 24_usage_giftbox.js | 使用说明 + 礼物盒 + TA 主动送礼 |
| 25_contact_custom.js | 联系人输入栏 + 底部导航 + 复制/收藏 + 排序 |
| 26_avatar_lib_rest.js | 随机头像库 + 其余主 JS |
| 27_pwa.js | PWA Service Worker 注册与更新 |
| 28_misc.js | 情绪分组权重等杂项 |
| 29_usage_notice.js | 首次访问使用须知 |
| 30_tail.html | 结尾 `</body></html>` |

## 使用注意

- **正式文件在 `app/`**：`sw.js`、`manifest.json`、图标必须与 `index.html` 同目录（sw.js 用相对路径 `./index.html`）。
- **更新流程**：改 `app/src/` → `python scripts\build.py` → 发送 `app/index.html`。若开了 Service Worker 缓存，需刷新一次等待 SW 更新（或改 `sw.js` 中 `CACHE_NAME` 版本号）。
- **聊天记录不存文件里**：数据在浏览器本地（IndexedDB + localStorage），按"协议+域名+端口"隔离。换浏览器/换打开方式/换设备会看不到旧数据，更新前建议先"导出数据"备份。
- **archive/scripts/** 是历史遗留的一次性调试脚本，与正式功能无关，可随时删除以节省空间。

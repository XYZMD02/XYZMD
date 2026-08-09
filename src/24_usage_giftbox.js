// ==================== 使用说明 ====================
var _usageGuideData=[
  {id:'about',title:'关于字卡',icon:'✦',blocks:[
    {sub:null,lines:[
      '星言使用字卡作为交流记录的载体。',
      '目前梦角只能从你保存的字卡库中选择字卡发送，因此字卡无法完全覆盖所有想表达的内容。',
      '随机机制、已有字卡数量以及文字本身的限制，都可能造成表达上的偏差。',
      '有些字卡更接近原本想表达的意思，有些只是当下能传递出的接近内容。',
      '字卡记录的是这一刻留下的话。',
      '文字有限，但你对这些文字的理解、记忆与联结，才是交流的一部分。'
    ]}
  ]},
  {id:'startup',title:'开屏与初见',icon:'🌟',blocks:[
    {sub:'开屏加载动画',lines:[
      '进入星言时，会先看到一颗星✦轻轻脉冲，下面跟着三个小点跳动，作为数据缓冲。',
      '（加载缓冲防止手机端开屏卡顿。）'
    ]},
    {sub:'星言前言 / 公告',lines:[
      '首次打开会看到星言的概念卡片：字卡传讯、字有尽言无穷、星言只是工具。',
      '读完之后，请先点底部的「请先阅读使用须知」。'
    ]},
    {sub:'使用须知',lines:[
      '第一次使用需要阅读使用须知。',
      '之后可在「设置 → 使用须知」随时回顾。'
    ]},
    {sub:'更新公告',lines:[
      '版本有更新时可以查看「设置 → 更新公告」。'
    ]}
  ]},
  {id:'nav',title:'底部导航',icon:'🧭',blocks:[
    {sub:null,lines:[
      '底部导航栏默认四项，可在设置里调整顺序与显隐：',
      '💬 聊天 —— 所有会话列表，进入对话',
      '📸 朋友圈 —— 动态流，发表与互动',
      '✨ 更多功能 —— 11 个二级功能聚合入口',
      '⚙️ 设置 —— 全局设置与数据管理'
    ]}
  ]},
  {id:'chat',title:'聊天',icon:'💬',blocks:[
    {sub:'顶部状态栏',lines:[
      '进入对话后，顶部会显示梦角此刻的：天气、心情、时间、空闲状态、对方正在做什么。',
      '这些由「顶部栏字卡库」随机驱动，是TA在你身边留下的气息。',
      '顶部还有：⋮菜单、头像昵称、上一个/下一个/切换联系人按钮。'
    ]},
    {sub:'发消息',lines:[
      '底部输入栏从左到右：⋮ 更多功能 | 😄 表情 | 文字输入框 | 🖼 图片 | ☰ 批量 | … 让TA继续说 | ➤ 发送',
      '支持文字、图片、表情包、语音一起发出。',
      '可以引用某条消息回复，也可以长按消息进行：↩回复 ✏️编辑 ⤺撤回 📋复制 🗑删除'
    ]},
    {sub:'聊天「更多」面板',lines:[
      '点输入栏左边的 ⋮ ，打开可自定义的功能面板。',
      '默认有：图片、聊天字卡库、信箱、梦角主页。',
      '你可以在「联系人编辑」里把它换成 28+ 种功能：拍一拍、红包、帮我决定、多人决定、占卜、通话、调查问卷、星音陪伴、信箱、留言板、经期、番茄钟、情绪系统、日记、梦角主页、TA收藏夹、TA重点、聊天统计、星言日历……等等。'
    ]},
    {sub:'气泡美化',lines:[
      '在「联系人编辑 → 美化聊天页面」里，有 4 个标签：',
      '🎨 主题配色：我方/对方气泡的文字色、背景色、引用强调色、发送按钮色',
      '🖼 背景字体：聊天背景图、字体',
      '💬 气泡样式：圆角、样式',
      '⚙️ 其他设置',
      '每个联系人可单独美化，也可以应用为全局。'
    ]},
    {sub:'悬浮音乐小框',lines:[
      '如果在星音陪伴里开了悬浮小框，聊天时左上角会出现一个迷你播放器，一边聊天，一边有歌陪着。'
    ]},
    {sub:'长截图 / 收藏 / 复制',lines:[
      '顶部 ⋮ 菜单或聊天更多面板里可进入：',
      '长截图模式：把一段对话保存成图片',
      '收藏消息：把TA说的话收进收藏夹',
      '复制消息：批量复制选中的话'
    ]}
  ]},
  {id:'cards',title:'字卡系统',icon:'📖',blocks:[
    {sub:'字卡设置主页（设置 → 聊天字卡库）',lines:[
      '顶部三个大标签：',
      '📖 公用字卡 —— 所有联系人共享',
      '🔒 专享字卡 —— 指定联系人专属',
      '🌐 默认通用字卡 —— 全局兜底（默认关闭，需手动开启）'
    ]},
    {sub:'字卡分类（公用/专享）',lines:[
      '主字卡 —— TA说的话',
      '颜文字 —— (´• ω •`)',
      'Emoji —— 🌙✨💌',
      '表情包 —— 图片表情',
      '图片 —— 单图',
      '拍一拍 —— 拍一拍动作',
      '语音 —— TA的声音'
    ]},
    {sub:'默认通用字卡',lines:[
      '这是一个全局兜底字卡库，默认是关闭的。',
      '开启后可选择使用场景（可多选）：聊天使用、写信使用、朋友圈使用、星言日历留言。',
      '它内部又分四类：主字卡、颜文字、Emoji、拍一拍，每一类可单独设置触发概率（0–100%）。',
      '当某个联系人没有专享字卡、公用字卡也不够时，默认通用字卡会补上来。'
    ]},
    {sub:'字卡分组与导入导出',lines:[
      '新建分组：把字卡按主题分组（如「日常」「夜晚」「想念」）',
      '导出 JSON：备份某一类字卡',
      '导入 JSON：从备份恢复',
      '批量导入：从 TXT 文件批量导入，格式：用【】标识分组，字卡内容一行一个'
    ]},
    {sub:'顶部栏字卡库（设置 → 联系人顶部栏字卡库）',lines:[
      '专门给顶部状态栏用的字卡，分类：天气 / 时间 / 对方状态 / 空闲状态 / 心情状态',
      '有自己的公用/专享、分组、导入导出。'
    ]},
    {sub:'聊天情绪系统（设置 → 聊天情绪系统）',lines:[
      '三类情绪字卡，让TA的回应更有温度：',
      '💭 情绪字卡 —— TA此刻的情绪',
      '❤️ 心意字卡 —— TA对你的心意',
      '💬 交流意图字卡 —— TA想表达的交流意图',
      '可自定义心意字卡，分类包括：陪伴与守护 / 分享与交流 / 关心与照顾 / 思念与靠近 / 理解与回应 / 鼓励与支持 / 邀请与互动',
      '引用这些字卡时，会显示对应的符号：💭 情绪 ❤️ 心意 💬 意图'
    ]},
    {sub:'拍一拍字卡（设置 → 拍一拍设置）',lines:[
      '专门的拍一拍动作字卡库，公用/专享、分组、批量导入。'
    ]},
    {sub:'自定义字卡（设置 → 自定义字卡设置）',lines:[
      '额外的自定义字卡，公用/专享、分组、批量导入。'
    ]},
    {sub:'番茄钟独立字卡',lines:[
      '番茄钟陪伴模式下TA用的字卡，单独管理。'
    ]}
  ]},
  {id:'reply',title:'回复设置',icon:'⚙️',blocks:[
    {sub:'聊天行为概率',lines:[
      'TA回应时会随机出现这些行为，可调概率：已读不回 / 表情包 / 图片 / 语音 / 引用 / 撤回 / 拍一拍 / Emoji / 颜文字'
    ]},
    {sub:'回复消息条数',lines:[
      '最少条数 / 最多条数'
    ]},
    {sub:'回复速度',lines:[
      '最短等待 / 最长等待（TA回你的快慢，由这里控制。）'
    ]},
    {sub:'多字卡设置',lines:[
      '开启后TA一次会连发多条字卡：开启开关 / 触发概率 / 最少条数 / 最多条数'
    ]},
    {sub:'主动发消息',lines:[
      'TA有时候会主动找你说话：开启开关 / 触发概率 / 最短等待（默认5秒）/ 最长等待（默认10分钟）/ 条数',
      '即使100%概率，也会有随机延迟，TA不是立刻就到，但TA会来。'
    ]},
    {sub:'免打扰模式',lines:[
      '开启后，TA会安静一些，主动消息频率降低。'
    ]},
    {sub:'消息标识',lines:[
      '星星标识：给TA的话标记一颗星⭐'
    ]},
    {sub:'回车键发送',lines:[
      '可开关回车直接发送。'
    ]},
    {sub:'应用所有联系人',lines:[
      '一键把当前设置同步给所有联系人。',
      '优先级：联系人独立设置 → 群成员设置 → 全局设置 → 默认值。'
    ]}
  ]},
  {id:'profile',title:'梦角主页',icon:'🏠',blocks:[
    {sub:'今日区块',lines:[
      '🌙 今日心情 —— TA今天的心情与emoji',
      '📍 TA正在做 —— TA此刻在做什么',
      '💌 TA留言 —— TA留给你的话',
      '实时状态 —— 天气/时间/空闲/心情/对方状态',
      '（今日心情和留言每天生成一次，不能刷新，是这一天TA留下的样子。）'
    ]},
    {sub:'主动更换头像记录',lines:['TA自己换头像的时刻，都会被记下来']},
    {sub:'纪念日',lines:['新增你们的重要日子，梦角主页会为你守护']},
    {sub:'推歌记录',lines:['TA推给你的歌，或你推给TA的歌，可以手动录入']},
    {sub:'红包记录',lines:['']},
    {sub:'通话记录',lines:['和TA的通话记录']},
    {sub:'占卜记录',lines:['关于TA的占卜记录，可查看和手动录入。']},
    {sub:'专属信箱',lines:[
      '这个联系人专属的信件，4个标签：全部 / 对方来信 / 对方回信 / 寄出的信',
      '可导入、导出、写信。'
    ]}
  ]},
  {id:'contacts',title:'联系人管理',icon:'👥',blocks:[
    {sub:'联系人列表（💬 聊天页）',lines:['顶部 + 按钮添加联系人（头像+昵称）。']},
    {sub:'联系人编辑',lines:[
      '点联系人进入对话 → 顶部 ⋮ → 联系人编辑，分区：',
      '基本信息：头像、昵称',
      '随机头像库：开启后，聊天/信箱/朋友圈里TA的头像会随机更换',
      '我的信息：本聊天专用的我的昵称、我的多头像',
      '头像形状：方形/圆形',
      '显示设置：隐藏顶部栏信息、隐藏系统小字昵称、隐藏双方头像、隐藏底部导航栏、输入栏功能收纳',
      '功能设置：自定义聊天栏更多功能、自定义顶部栏切换顺序、美化聊天、音效设置、导出/导入聊天记录',
      '危险操作：清空聊天记录、删除联系人'
    ]},
    {sub:'群聊',lines:[
      '创建群聊：联系人列表 → + → 创建群聊',
      '群聊设置：群头像、群名、成员管理、美化、群聊回复设置、删除',
      '群拍一拍：可选择拍谁'
    ]},
    {sub:'信箱头像设置',lines:['为每个联系人设置独立的信箱头像。']},
    {sub:'联系人音效设置',lines:['每个联系人可单独设置音效。']}
  ]},
  {id:'moments',title:'朋友圈',icon:'📸',blocks:[
    {sub:'主页',lines:[
      '封面可更换',
      '三个圆形按钮：发表 / 成员 / 通知',
      '通知按钮带数字徽章，提醒你TA的互动'
    ]},
    {sub:'发表朋友圈',lines:[
      '输入文字、添加图片',
      '所在位置',
      '提醒谁看（被@的联系人100%会回复）',
      '谁可以看（公开 / 指定联系人）'
    ]},
    {sub:'朋友圈设置',lines:[
      '按顺序分区，每一项都可调概率：',
      '1. 联系人选择',
      '2. 互动设置：点赞概率/速度、首次评论概率/速度、回复概率/速度',
      '3. 回复内容设置：多字卡概率/最多条数、图片表情概率',
      '4. 好友发朋友圈设置：概率/间隔/字卡条数',
      '5. 好友发布朋友圈内容：颜文字/emoji/图片表情/图片概率',
      '6. 好友互动好友朋友圈：点赞/评论概率、评论回复内容概率'
    ]},
    {sub:'成员管理',lines:['朋友圈里有哪些好友，可添加/编辑。通知页显示所有互动记录。']}
  ]},
  {id:'calendar',title:'星言日历',icon:'⭐',blocks:[
    {sub:'主页',lines:[
      '顶部选择联系人',
      '月份切换',
      '心情日历网格：每一天显示一个心情emoji',
      '点击某天，下方显示那天的详情：TA的心情、TA正在做、TA的留言'
    ]},
    {sub:'开屏卡片',lines:[
      '每日首次进入联系人面板时，会弹出一张今日心情与TA留言的卡片，像TA递过来的一张小纸条。'
    ]}
  ]},
  {id:'letters',title:'信件',icon:'✉️',blocks:[
    {sub:'信箱主页（更多功能 → 信箱）',lines:[
      '顶部：返回 / 信箱头像设置 / 写信',
      '联系人筛选',
      '三个标签：对方来信 / 对方回信 / 寄出的信'
    ]},
    {sub:'写信',lines:['选择收件人，写下正文，封·寄出。信件会出现在对应的标签里。']},
    {sub:'信件详情',lines:['点开一封信，可查看完整内容。']},
    {sub:'信箱设置',lines:[
      '最多字卡条数',
      '主动写信概率/时间',
      '回信概率/时间',
      '写信内容类型（颜文字/Emoji/图片表情）'
    ]},
    {sub:'联系人专属信箱',lines:['梦角主页里有这个联系人专属的信箱，可导入/导出/写信。']}
  ]},
  {id:'divine',title:'占卜',icon:'🔮',blocks:[
    {sub:'半屏占卜（聊天页内）',lines:[
      '在聊天更多面板里调起，不离开对话。',
      '选择占卜对象',
      '输入问题',
      '牌组模式：混合 / 塔罗 / 雷诺曼',
      '抽牌数量：1 / 3 / 7 张',
      '抽牌、查看结果、复制结果',
      '底部操作：↺重新抽 / 继续→ / 📋复制结果 / 📜历史记录 / 💬发送至聊天',
      '（半屏占卜的记录会自动同步到主占卜历史。）'
    ]},
    {sub:'全屏占卜（更多功能 → 占卜）',lines:['功能同半屏，全屏体验。']},
    {sub:'占卜记录管理',lines:[
      '新增记录 / 编辑记录 / 导入记录 / 历史记录',
      '梦角主页里也能新增/导入关于TA的占卜记录。'
    ]}
  ]},
  {id:'music',title:'星音陪伴',icon:'🎵',blocks:[
    {sub:'主页（更多功能 → 星音陪伴）',lines:[
      '四个标签：',
      '🎧 我的音乐库 —— 上传音乐、链接添加',
      '📂 歌单 —— 新建歌单、分类管理',
      '🎵 星音记录 —— 和TA一起听过的歌',
      '⚙️ 梦角权限 —— 每个梦角的星音权限'
    ]},
    {sub:'添加歌曲',lines:[
      '上传本地音乐文件',
      '添加链接音乐（网易云 ID 自动识别歌名歌手）',
      '添加自定义歌曲（歌名 + 歌手 + mp3直链）',
      '批量导入：模式一网易云ID批量导入；模式二格式导入，支持字段：歌曲名称/歌手/音乐直链URL，支持中英文冒号、等号分隔，多条用空行隔开',
      '（歌曲数据会同时保存到本地和IndexedDB，重新进入不会消失。）'
    ]},
    {sub:'播放器',lines:[
      '底部播放器栏：模式切换、上一首、播放/暂停、下一首',
      '悬浮小框：聊天时左上角显示，可开关'
    ]},
    {sub:'编辑歌曲',lines:['歌名、歌手、标签、所属歌单。']},
    {sub:'音乐请求',lines:['TA想和你一起听——会按概率触发。']},
    {sub:'说明与设置',lines:['音乐请求触发概率 / 冷却时间 / 悬浮小框开关']}
  ]},
  {id:'emoji',title:'表情包管理',icon:'😄',blocks:[
    {sub:'三个标签',lines:[
      '公用表情包 —— 所有联系人共享',
      '专享表情包 —— 指定联系人专属',
      '我的表情包 —— 你自己的表情'
    ]},
    {sub:'我的表情包页面',lines:[
      '分组标签在左侧，操作按钮在右侧，工具栏含相机、加号、文件夹、列表图标。',
      '可新建分组、批量管理。'
    ]}
  ]},
  {id:'tools',title:'互动小工具',icon:'🎁',blocks:[
    {sub:'拍一拍',lines:['聊天里拍一拍TA，自定义拍一拍内容。有公用/专享拍一拍字卡库。群聊里可以选择拍谁。']},
    {sub:'红包',lines:[
      '给TA发红包：金额、祝福语',
      '快捷金额：52 / 520 / 1314',
      '红包余额管理：每个联系人的余额'
    ]},
    {sub:'通话',lines:[
      '发起通话：语音/视频',
      '通话设置：来电概率、接听概率、忙线概率、拒接概率、挂断概率',
      '可上传通话背景',
      '最小化通话'
    ]},
    {sub:'帮我决定',lines:['是/否/半对，或自定义选项。有历史记录，可发送到聊天。（功能借鉴 @FelixFelicis 老师的字卡）']},
    {sub:'多人决定',lines:['群成员一起参与的决定，有历史记录。（功能借鉴 @FelixFelicis 老师的字卡）']},
    {sub:'礼物盒',lines:[
      '记录你和梦角之间互相赠送心意的小功能，不是商城或购买系统。',
      '入口：聊天更多面板「互动」分类中的 🎁 礼物盒，或梦角主页。',
      '半屏模式：在聊天中打开只显示当前梦角的礼物；全屏模式：从更多功能进入可切换联系人。',
      '礼物盒主页有三个标签：全部 / 我送给TA / TA送给我。',
      '送礼流程：点击「🎁 送给TA」→ 选择分类 → 选择礼物 → 写附言 → 确认送出。',
      '礼物分类：日常陪伴 / 温暖陪伴 / 花草自然 / 书信记录 / 音乐光影（自定义礼物可新建分类）。',
      '送出后会在聊天中生成一条礼物消息，TA也会在几秒后回应对应的字卡。',
      'TA主动送礼：每个联系人每天独立判定，互不影响。',
      'TA送礼概率：普通礼物20%/天（平均约5天收到一次），特别礼物5%/天（平均约20天收到一次），每天最多各1个。',
      'TA送礼留言：50%概率使用默认留言，50%概率使用4~10个字卡组合（每个字卡中间空一格）。',
      '纪念礼物：条件触发，首次互动、7天、30天、100天各一次，不受每日限制。'
    ]}
  ]},
  {id:'favorites',title:'收藏与重点',icon:'⭐',blocks:[
    {sub:'TA的收藏夹',lines:[
      '梦角收藏的他喜欢的话。',
      '即时收藏概率：TA看到某条消息后立刻收藏的概率'
    ]},
    {sub:'TA想说点重点（更多功能 → TA想说点重点）',lines:[
      '梦角标记的重要消息，"召唤划重点"。',
      '每日随机触发概率 / 每日划重点概率 / 选择消息数量 / 留言概率 / 留言字卡数量'
    ]}
  ]},
  {id:'more',title:'更多功能',icon:'✨',blocks:[
    {sub:'非即时传讯',lines:[
      '发消息，对方24小时内随机时间回复。',
      '独立聊天界面，每个联系人可单独设置回复时间。',
      '像真正的信件一样，有等待，有意外，有恰好。'
    ]},
    {sub:'调查问卷',lines:[
      '创建问卷：标题、选联系人、问题列表',
      '问题类型：文字回复 / 选项回复',
      '批量添加问题',
      '问卷进行：倒计时、进度',
      '问卷记录与详情（详情里会显示所有你输入的选项，不只是选中的）'
    ]},
    {sub:'聊天统计',lines:[
      '三个子页：🌙 相处记录（相处天数、记录卡片）/ 💬 聊天记录 / ✨ 星言表达',
      '也有半屏版，在聊天里直接看。'
    ]},
    {sub:'我的留言板',lines:[
      '"留给TA的话"：发布留言（选对谁说、写内容）',
      '留言簿（筛选全部 / 给全部联系人 / 指定联系人）'
    ]},
    {sub:'我的日记',lines:[
      '统计工具栏、日期筛选、搜索',
      '新建日记：日期、心情、天气、标题、内容',
      '心情日历用莫兰迪色系，温柔不刺眼'
    ]},
    {sub:'生理周期',lines:[
      '状态卡、月份日历',
      '记录今天、添加区间',
      '图例说明'
    ]}
  ]},
  {id:'pomodoro',title:'番茄钟',icon:'🍅',blocks:[
    {sub:'半框模式',lines:[
      '倒计时',
      '时间预设：15 / 25 / 30 / 45 / 60 分钟（或自己设定时间）',
      '工作/休息切换',
      '开始 / 重置 / 完成',
      '陪伴模式入口'
    ]},
    {sub:'全屏陪伴模式',lines:['专注时TA在旁边陪你，可以聊天。有独立的番茄钟字卡。']},
    {sub:'番茄钟设置（6个标签）',lines:[
      '⏱ 时间 / 🔔 提醒 / 🔊 声音',
      '💬 陪伴 / 🎨 美化 / 🔒 专注'
    ]},
    {sub:'打卡记录',lines:['记录列表与统计（日/周/月）。']}
  ]},
  {id:'appearance',title:'外观与美化',icon:'🎨',blocks:[
    {sub:'气泡美化（每个联系人可单独设置）',lines:[
      '主题配色：我方/对方气泡文字色、背景色、引用强调色、发送按钮色',
      '背景字体：聊天背景图、字体',
      '气泡样式：圆角等',
      '其他设置'
    ]},
    {sub:'自定义图标（设置 → 自定义图标）',lines:['上传图片替换功能图标，可导出/导入图标数据。']},
    {sub:'底部导航栏',lines:['显隐与排序：设置里调整。联系人编辑里可隐藏底部导航栏。']},
    {sub:'开屏加载动画',lines:['✦脉冲 + 三点跳动，作为数据缓冲。']}
  ]},
  {id:'data',title:'数据与存储',icon:'💾',blocks:[
    {sub:null,lines:[
      '所有数据都存在你本地的浏览器里（IndexedDB 为主，localStorage 辅助），不会上传到任何服务器。'
    ]},
    {sub:'导入数据（设置 → 📥 导入数据）',lines:['从 JSON 文件恢复全部数据。']},
    {sub:'导出数据（设置 → 📤 导出数据）',lines:['备份全部数据为 JSON。（建议定期导出，留存你们的所有记录。）']},
    {sub:'清除数据（设置 → 🗑️ 清除数据）',lines:['']},
    {sub:'存储空间（设置 → 💾 存储空间）',lines:[
      '总览：已用空间、浏览器配额、使用率',
      '存储明细：聊天记录、联系人、字卡库、朋友圈、信件、礼物盒、占卜、星言日历、星音陪伴、通话、红包、帮我决定、调查问卷、留言板、梦境日记、番茄钟、收藏与高亮、个性化、设置、其他',
      '操作：刷新统计、申请更多存储空间、释放错误加载的内存'
    ]},
    {sub:'全局数据同步',lines:[
      '所有数据会自动同步到 IndexedDB，包括：联系人、消息、字卡、信件、朋友圈、占卜、日历、音乐、收藏、自定义回复、浮窗音乐、消息统计、决策记录、问卷、重要日期、心情日记、红包、语音等。'
    ]}
  ]},
  {id:'settings',title:'其他设置',icon:'⚙️',blocks:[
    {sub:'回复设置（设置 → 💬 回复设置）',lines:['四项：聊天 / 朋友圈 / 信箱 / 非即时传讯']},
    {sub:'免打扰模式（设置 → 🌙 免打扰模式）',lines:['开启后主动消息频率降低、禁止主动来电。']},
    {sub:'通话设置（设置 → 📞 通话设置）',lines:['全局通话概率。']},
    {sub:'后台保活（设置 → 🔋 后台保活）',lines:['让星言在后台保持运行。']},
    {sub:'后台消息弹窗（设置 → 🔔 后台消息弹窗）',lines:['后台时TA主动找你，会弹窗提醒。']},
    {sub:'全屏模式（设置 → 🖥️ 全屏模式）',lines:['电脑和平板会出现按钮。']},
    {sub:'更新公告 / 使用须知',lines:['']}
  ]},
  {id:'tips',title:'小提示',icon:'💡',blocks:[
    {sub:null,lines:[
      '字卡来自你保存的字卡库。由于字卡数量和文字限制，部分表达可能无法完全对应想传达的内容。',
      '字卡会受到随机机制影响，出现不完全贴合的情况属于正常现象。',
      '记得定期导出数据，保存你留下的聊天记录。',
      '顶部栏的天气、心情、状态等内容，用于记录当下氛围与交流痕迹。',
      '字有尽，言无穷。字卡记录的是文字，而文字之外的理解与记忆，由你保存。'
    ]}
  ]}
];

var _usageGuideActiveIdx=0;
function renderUsageGuideTabs(){
  var container=$('usage-guide-tabs');
  if(!container)return;
  container.innerHTML='';
  _usageGuideData.forEach(function(section,idx){
    var tab=document.createElement('div');
    tab.style.cssText='flex-shrink:0;padding:8px 14px;font-size:13px;cursor:pointer;white-space:nowrap;border-bottom:2px solid transparent;transition:all .15s;color:'+(idx===_usageGuideActiveIdx?'var(--accent)':'var(--txt3)')+';font-weight:'+(idx===_usageGuideActiveIdx?'600':'400')+';border-bottom-color:'+(idx===_usageGuideActiveIdx?'var(--accent)':'transparent')+';';
    tab.textContent=section.icon+' '+section.title;
    tab.addEventListener('click',function(){
      _usageGuideActiveIdx=idx;
      renderUsageGuideTabs();
      renderUsageGuideContent();
      var c=$('usage-guide-content');
      if(c)c.scrollTop=0;
      // 滚动tab到可见区域
      try{tab.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});}catch(e){}
    });
    container.appendChild(tab);
  });
}
function renderUsageGuideContent(){
  var container=$('usage-guide-content');
  if(!container)return;
  var section=_usageGuideData[_usageGuideActiveIdx];
  if(!section)return;
  var html='';
  html+='<div style="font-size:17px;font-weight:700;color:var(--txt);margin-bottom:16px;">'+section.icon+' '+section.title+'</div>';
  section.blocks.forEach(function(block){
    if(block.sub){
      html+='<div style="font-size:14px;font-weight:600;color:var(--txt);margin:16px 0 8px;padding-left:10px;border-left:3px solid var(--c2);">'+block.sub+'</div>';
    }
    if(block.lines&&block.lines.length){
      block.lines.forEach(function(line){
        if(line===''){
          html+='<div style="height:6px;"></div>';
        }else{
          html+='<div style="font-size:14px;color:var(--txt2);line-height:1.7;margin-bottom:4px;">'+line+'</div>';
        }
      });
    }
  });
  html+='<div style="height:24px;"></div>';
  html+='<div style="display:flex;justify-content:space-between;gap:8px;">';
  if(_usageGuideActiveIdx>0){
    html+='<button type="button" id="guide-prev-btn" style="flex:1;padding:10px;background:var(--c2);color:var(--txt);border:1px solid var(--border);border-radius:10px;font-size:13px;cursor:pointer;">← '+_usageGuideData[_usageGuideActiveIdx-1].title+'</button>';
  }else{
    html+='<div style="flex:1;"></div>';
  }
  if(_usageGuideActiveIdx<_usageGuideData.length-1){
    html+='<button type="button" id="guide-next-btn" style="flex:1;padding:10px;background:var(--c2);color:var(--txt);border:1px solid var(--border);border-radius:10px;font-size:13px;cursor:pointer;">'+_usageGuideData[_usageGuideActiveIdx+1].title+' →</button>';
  }else{
    html+='<div style="flex:1;"></div>';
  }
  html+='</div>';
  container.innerHTML=html;
  var prevBtn=$('guide-prev-btn');
  var nextBtn=$('guide-next-btn');
  if(prevBtn)prevBtn.addEventListener('click',function(){_usageGuideActiveIdx--;renderUsageGuideTabs();renderUsageGuideContent();if($('usage-guide-content'))$('usage-guide-content').scrollTop=0;});
  if(nextBtn)nextBtn.addEventListener('click',function(){_usageGuideActiveIdx++;renderUsageGuideTabs();renderUsageGuideContent();if($('usage-guide-content'))$('usage-guide-content').scrollTop=0;});
}
if($('usage-guide-btn'))$('usage-guide-btn').addEventListener('click',function(){showPg('pg-usage-guide');renderUsageGuideTabs();renderUsageGuideContent();});
if($('usage-guide-back'))$('usage-guide-back').addEventListener('click',function(){showPg('pg-my')});

// ==================== 礼物盒 ====================
var GIFT_DATA=[
  {cat:'日常陪伴',gifts:[
    {n:'☕ 热茶',d:'一杯温热的茶，希望TA忙碌时也能停下来休息。'},
    {n:'🍵 热可可',d:'甜甜又温暖的饮品，适合放松的时候享用。'},
    {n:'🍵 抹茶点心',d:'安静的一份茶点，适合慢慢享受。'},
    {n:'🍵 保温杯',d:'装着温度的小杯子，让TA随时都能感受到温暖。'},
    {n:'🍵 茶杯',d:'一个专属于TA的杯子，装下每天的小小温暖。'},
    {n:'🥛 牛奶',d:'一杯温暖的牛奶，陪TA度过一个安静的夜晚。'},
    {n:'🍪 小饼干',d:'一份简单的小零食，分享一点甜甜的心情。'},
    {n:'🍰 小蛋糕',d:'一份小小的甜点，为普通的一天增加一点快乐。'},
    {n:'🍫 巧克力',d:'甜甜的味道，希望TA今天心情好一点。'},
    {n:'🍬 糖果',d:'一颗小小的糖果，藏着一点想念。'},
    {n:'🍩 甜甜圈',d:'一份轻松的小点心，带来一点开心。'},
    {n:'🍮 布丁',d:'软软的小甜点，分享一点小快乐。'},
    {n:'🍧 冰淇淋',d:'凉凉的甜味，陪TA度过悠闲时光。'},
    {n:'🥪 三明治',d:'一份简单的食物，希望TA记得按时吃饭。'},
    {n:'🥣 早餐',d:'准备好的一顿早餐，提醒TA照顾自己。'},
    {n:'🍱 便当',d:'一份提前准备好的饭，藏着细心的关照。'},
    {n:'🥐 面包',d:'刚出炉的小面包，带来简单的满足感。'},
    {n:'🍎 苹果',d:'一份新鲜的水果，把简单的关心送给TA。'},
    {n:'🍓 草莓',d:'酸甜的小水果，分享一点轻松的快乐。'},
    {n:'🍓 水果篮',d:'一篮新鲜的水果，分享一份健康和关心。'},
    {n:'🍯 蜂蜜',d:'一点甜甜的蜂蜜，希望TA的日子也甜一点。'},
    {n:'🍵 茶点',d:'搭配茶水的小点心，适合一起度过悠闲时间。'},
    {n:'🧃 果汁',d:'一杯清爽的饮料，带来一点轻松。'},
    {n:'🍲 热汤',d:'一碗温暖的汤，希望TA感觉被照顾。'},
    {n:'🍵 点心盒',d:'装着各种喜欢的小点心，留给特别的时候。'}
  ]},
  {cat:'温暖陪伴',gifts:[
    {n:'🧸 抱枕',d:'柔软的抱枕，希望TA需要的时候能有依靠。'},
    {n:'🧸 小玩偶',d:'一个柔软的小伙伴，陪TA待在身边。'},
    {n:'🧸 毛绒毯',d:'更柔软的陪伴，适合休息的时候。'},
    {n:'🧦 毛绒袜',d:'柔软的小袜子，让休息的时候更舒服。'},
    {n:'🧣 围巾',d:'一条温暖的围巾，希望TA不要着凉。'},
    {n:'🧵 手织围巾',d:'亲手准备的温暖，希望TA感受到心意。'},
    {n:'🧤 手套',d:'天气冷的时候，给TA一点温暖。'},
    {n:'🧦 暖宝宝',d:'小小的热量，陪TA度过寒冷的时候。'},
    {n:'🛌 小毯子',d:'柔软的小毯子，适合疲惫时好好休息。'},
    {n:'🕯️ 小蜡烛',d:'一点柔和的灯光，陪TA度过安静时间。'},
    {n:'🕯️ 小夜灯',d:'夜晚亮起的一点光，陪TA度过安静的时刻。'},
    {n:'🧺 小篮子',d:'装满一些小东西，像准备好的惊喜。'},
    {n:'🧺 野餐篮',d:'准备一次轻松的分享时光。'},
    {n:'🌂 雨伞',d:'下雨的时候，希望能替TA挡住一点风雨。'},
    {n:'☂️ 雨伞',d:'在下雨的时候，为TA挡住一点风雨。'},
    {n:'🧼 香皂',d:'淡淡的香气，让日常多一点舒服。'},
    {n:'🧴 护手霜',d:'希望TA的双手也能被好好照顾。'},
    {n:'🫧 香薰',d:'淡淡的香气，让周围变得安静下来。'},
    {n:'🌿 香囊',d:'装着喜欢的气味，陪伴在身边。'},
    {n:'🧸 定制玩偶',d:'按照TA的特点制作的小伙伴，只属于TA。'},
    {n:'🧸 抱枕',d:'柔软的陪伴，适合休息的时候依靠。'}
  ]},
  {cat:'花草自然',gifts:[
    {n:'🌸 小花',d:'一朵随手摘下的小花，只是想送给TA。'},
    {n:'🌸 花束',d:'一束花，不需要理由，只是想把美好送给TA。'},
    {n:'💐 花冠',d:'一份特别的装饰，把温柔送给TA。'},
    {n:'🌹 一朵玫瑰',d:'一朵特别的花，表达藏在心里的喜欢。'},
    {n:'🌹 永生花',d:'不会凋谢的花，代表想长久保存的心意。'},
    {n:'🌺 干花标本',d:'把花盛开的瞬间保存下来，让美好不会消失。'},
    {n:'🌼 雏菊',d:'一朵小小的花，代表简单而真诚的心意。'},
    {n:'🌻 向日葵',d:'明亮的花朵，希望TA每天都有好心情。'},
    {n:'🌷 郁金香',d:'一束温柔的花，表达珍惜和喜欢。'},
    {n:'🌱 小盆栽',d:'一株慢慢成长的植物，陪伴TA度过每一天。'},
    {n:'🌳 小树苗',d:'一株慢慢成长的植物，象征长久的陪伴。'},
    {n:'🍀 幸运草',d:'一份小小的祝福，希望好运一直陪着TA。'},
    {n:'🪷 莲花灯',d:'安静柔和的光，陪伴平静的时刻。'},
    {n:'🍁 书签花',d:'夹在书里的小花，把某个瞬间保存下来。'},
    {n:'🍂 秋日书签',d:'收藏一片季节的记忆，记录某个时间。'}
  ]},
  {cat:'书信记录',gifts:[
    {n:'📝 今日纸条',d:'写下一句话，让TA在某个时刻看到。'},
    {n:'📝 便签纸',d:'写下一句简单的话，放在TA能看到的地方。'},
    {n:'✉️ 手写信',d:'认真写下的话语，把想说的心意保存下来。'},
    {n:'📜 羊皮卷',d:'一封特别收藏的信，记录不会忘记的话。'},
    {n:'🎫 约定卡',d:'保存一个想一起完成的小约定。'},
    {n:'📅 纪念日卡片',d:'记录一个特别的日期。'},
    {n:'🌙 晚安卡',d:'把一句晚安留给TA。'},
    {n:'☀️ 早安卡',d:'开启一天的第一句话。'},
    {n:'📖 书',d:'一本想分享给TA看的故事。'},
    {n:'📔 日记本',d:'记录未来的故事，等待慢慢填满。'},
    {n:'📒 笔记本',d:'一本空白的本子，等待写下新的故事。'},
    {n:'📎 书签',d:'夹在书里的小记号，留下阅读的痕迹。'},
    {n:'🔖 书签',d:'夹在书里的小记号，留下共同喜欢的片段。'},
    {n:'🖋️ 钢笔',d:'用来记录重要的话，也记录未来的故事。'},
    {n:'🪶 羽毛笔',d:'记录想说的话，也记录重要的回忆。'},
    {n:'📒 笔记本',d:'一本空白的本子，等待写下新的故事。'},
    {n:'📚 故事书',d:'写下属于你们的故事。'}
  ]},
  {cat:'音乐光影',gifts:[
    {n:'🎵 歌曲',d:'一首想让TA听见的歌。'},
    {n:'🎶 专属歌单',d:'收集想分享给TA的音乐。'},
    {n:'🎼 八音盒',d:'一段特别的旋律，每次响起都会想起这份心意。'},
    {n:'🎵 音乐盒',d:'一段旋律，把想传达的情绪送给TA。'},
    {n:'🎧 耳机',d:'分享一首喜欢的歌，也分享此刻的心情。'},
    {n:'🔔 风铃',d:'风吹响的时候，提醒TA有人想念。'},
    {n:'🎐 和风铃',d:'安静的声音，陪伴平静的日子。'},
    {n:'🔔 小铃铛',d:'一个小小的声音，提醒TA有人牵挂。'},
    {n:'🌙 月光石',d:'收藏一束温柔的月光，代表安静的陪伴。'},
    {n:'🌙 月亮挂饰',d:'一份来自夜晚的陪伴，陪TA看见温柔的光。'},
    {n:'⭐ 星星瓶',d:'收集闪亮的星光，保存你们之间的回忆。'},
    {n:'🌌 星空投影灯',d:'把一片星空带到身边，陪TA度过夜晚。'},
    {n:'🌌 星空灯',d:'把一片星空带到身边，陪伴安静的夜晚。'},
    {n:'🌠 流星瓶',d:'收藏一个愿望，希望它慢慢实现。'},
    {n:'❄️ 雪花球',d:'里面收藏一场不会融化的小雪。'},
    {n:'🔮 水晶球',d:'收藏一个小小的愿望和期待。'},
    {n:'🌈 彩虹石',d:'代表雨后出现的希望和美好。'}
  ]}
];
var GIFT_RESPONSE_CARDS=[
  '我收到了。','谢谢你还记得。','这个我会保存。','你的心意我感受到了。',
  '……谢谢你。','我很喜欢。','收到的，放心吧。','这个礼物，我会记住的。'
];
var GIFT_RESPONSE_MAP={
  '☕ 热茶':'你总是在注意这些小事。',
  '✉️ 手写信':'我认真看完了。',
  '🧸 小玩偶':'它很像你给我的陪伴。',
  '🌹 永生花':'不会凋谢的，对吧。',
  '🌙 月光石':'安静的陪伴，我知道的。',
  '🎵 歌曲':'这首我一直记着。',
  '🍫 巧克力':'甜甜的，谢谢你。',
  '📖 书':'我会慢慢看完的。',
  '🌸 小花':'随手摘的也好看。'
};
var giftBoxData={};
var giftBoxTab='all';
var giftBoxContactId='';
var giftSendSelectedCat=0;
var giftSendSelectedGift=null;
var customGifts=[];
var _customGiftCatIdx=-1;
var _customGiftImageData=''; // 临时存储上传的图片 data URL
function loadGiftBoxData(){var s=ls('ml2_giftbox');if(s&&typeof s==='object')giftBoxData=s;}
function saveGiftBoxData(){ls('ml2_giftbox',giftBoxData);}
function getGifts(contactId){if(!giftBoxData[contactId])giftBoxData[contactId]=[];return giftBoxData[contactId];}
loadGiftBoxData();

// 渲染礼物图标（支持 emoji 和图片）
function renderGiftIcon(icon,size){
  if(!icon)icon='🎁';
  if(typeof icon==='string'&&icon.indexOf('data:image/')===0){
    var s=size||40;
    return '<img src="'+icon.replace(/"/g,'&quot;')+'" style="width:'+s+'px;height:'+s+'px;object-fit:contain;border-radius:6px;display:block;">';
  }
  return icon;
}
// 从礼物数据提取图标和名称（兼容图片图标）
function parseGiftIconName(gift){
  if(!gift)return{icon:'🎁',name:'礼物'};
  // 新格式：有 iconType 字段
  if(gift.iconType==='image'&&gift.img){
    return{icon:gift.img,name:gift.name||'礼物'};
  }
  if(gift.iconType==='emoji'&&gift.emoji){
    return{icon:gift.emoji,name:gift.name||'礼物'};
  }
  // 旧格式：从 n 字段解析
  if(gift.n){
    var icon=gift.n.split(' ')[0];
    var name=gift.n.split(' ').slice(1).join(' ')||gift.n;
    return{icon:icon,name:name};
  }
  // 已发送礼物记录：有 icon 和 name 字段
  if(gift.icon&&gift.name){
    return{icon:gift.icon,name:gift.name};
  }
  return{icon:'🎁',name:gift.name||'礼物'};
}

// 自定义礼物管理
function loadCustomGifts(){
  var s=ls('ml2_custom_gifts');
  if(s&&Array.isArray(s))customGifts=s;
  mergeCustomGiftsToGIFT_DATA();
}
function saveCustomGiftsData(){
  ls('ml2_custom_gifts',customGifts);
  if(window.localforage){window.localforage.setItem('ml2_custom_gifts',customGifts).catch(function(){})}
  mergeCustomGiftsToGIFT_DATA();
}
function mergeCustomGiftsToGIFT_DATA(){
  // 移除所有旧的自定义分类
  GIFT_DATA=GIFT_DATA.filter(function(cat){return !cat._isCustom});
  _customGiftCatIdx=-1;
  // 清理普通礼物池中的旧自定义礼物
  GIFT_NORMAL_POOL=GIFT_NORMAL_POOL.filter(function(p){return !p._customId});
  if(customGifts.length===0)return;
  // 按 category 分组（保留首次出现顺序）
  var groups={};
  var order=[];
  customGifts.forEach(function(g){
    var catName=g.category||'自定义礼物';
    if(!groups[catName]){groups[catName]=[];order.push(catName);}
    groups[catName].push(g);
  });
  // 为每个分组创建分类（若匹配内置分类名则合并进内置分类，否则新建自定义分类）
  order.forEach(function(catName){
    // ★ 支持加进内置分类：匹配 GIFT_DATA 中非自定义分类
    var builtinCat=GIFT_DATA.find(function(c){return !c._isCustom&&c.cat===catName});
    var giftObjs=groups[catName].map(function(g){
      var n=g.iconType==='image'?(g.emoji||'🎁'+' '+g.name):(g.emoji+' '+g.name);
      return {n:n,d:g.d,_customId:g.id,iconType:g.iconType,emoji:g.emoji,img:g.img,name:g.name,category:catName};
    });
    if(builtinCat){
      // 合并进内置分类（保留原礼物 + 追加自定义礼物）
      if(!builtinCat.gifts)builtinCat.gifts=[];
      builtinCat.gifts=builtinCat.gifts.concat(giftObjs);
    }else{
      var cat={cat:catName,_isCustom:true,gifts:giftObjs};
      GIFT_DATA.push(cat);
    }
    // 加入普通礼物池，让联系人也能使用自定义礼物
    groups[catName].forEach(function(g){
      var n=g.iconType==='image'?(g.emoji||'🎁'+' '+g.name):(g.emoji+' '+g.name);
      GIFT_NORMAL_POOL.push({n:n,d:g.d,cat:catName,iconType:g.iconType,emoji:g.emoji,img:g.img,name:g.name,_customId:g.id});
    });
  });
}
var _selectedCustomGiftCat=''; // 当前选中的已有分类
function showAddCustomGiftOverlay(){
  if($('custom-gift-emoji'))$('custom-gift-emoji').value='';
  if($('custom-gift-name'))$('custom-gift-name').value='';
  if($('custom-gift-desc'))$('custom-gift-desc').value='';
  if($('custom-gift-category'))$('custom-gift-category').value='';
  _selectedCustomGiftCat='';
  // 渲染已有分类 chips
  renderCustomGiftCatChips();
  // 填充已有自定义分类建议
  var dl=$('custom-gift-category-list');
  if(dl){
    var cats=customGifts.map(function(g){return g.category||'自定义礼物'});
    var uniq={};cats.forEach(function(c){uniq[c]=1});
    dl.innerHTML=Object.keys(uniq).map(function(c){return '<option value="'+c.replace(/"/g,'&quot;')+'">'}).join('');
  }
  _customGiftImageData='';
  // 重置为 emoji 模式
  var emojiRadio=document.querySelector('input[name="custom-gift-icon-type"][value="emoji"]');
  if(emojiRadio)emojiRadio.checked=true;
  toggleCustomGiftIconType();
  // 重置图片预览
  var preview=$('custom-gift-image-preview');
  if(preview){preview.innerHTML='点击选择图片';preview.style.fontSize='12px';preview.style.color='var(--txt3)';}
  showOv('ov-gift-add');
}
// 渲染已有分类 chips（点选归类）
function renderCustomGiftCatChips(){
  var wrap=$('custom-gift-cat-chips');
  if(!wrap)return;
  // ★ 数据源：GIFT_DATA 内置分类 + 自定义分类（用户可以把自定义礼物加进内置分类如"日常陪伴"）
  var cats={};
  (GIFT_DATA||[]).forEach(function(cat){
    if(cat.cat&&!cat._isCustom)cats[cat.cat]=1; // 内置分类
  });
  (GIFT_DATA||[]).forEach(function(cat){
    if(cat._isCustom&&cat.cat)cats[cat.cat]=1;  // 已有自定义分类
  });
  customGifts.forEach(function(g){cats[g.category||'自定义礼物']=1});
  var keys=Object.keys(cats);
  wrap.innerHTML='';
  if(keys.length===0){
    wrap.style.display='none';
    return;
  }
  // 加个小标题，让用户知道可以点选已有分类
  var tip=document.createElement('div');
  tip.textContent='选择已有分类（点击选中）：';
  tip.style.cssText='width:100%;font-size:11px;color:var(--txt3);';
  wrap.appendChild(tip);
  wrap.style.display='flex';
  keys.forEach(function(c){
    var chip=document.createElement('div');
    chip.textContent=c;
    chip.setAttribute('data-cat',c);
    chip.style.cssText='padding:6px 14px;border-radius:16px;font-size:13px;cursor:pointer;border:1px solid var(--border);background:var(--c2);color:var(--txt);';
    chip.addEventListener('click',function(){
      _selectedCustomGiftCat=c;
      // 高亮选中，取消其他
      wrap.querySelectorAll('[data-cat]').forEach(function(el){
        if(el.getAttribute('data-cat')===c){
          el.style.borderColor='var(--accent)';el.style.background='var(--accent)';el.style.color='#fff';
        }else{
          el.style.borderColor='var(--border)';el.style.background='var(--c2)';el.style.color='var(--txt)';
        }
      });
      // 清空新建输入框，避免冲突
      if($('custom-gift-category'))$('custom-gift-category').value='';
    });
    wrap.appendChild(chip);
  });
}
// 切换图标类型（emoji/图片）
function toggleCustomGiftIconType(){
  var imageRadio=document.querySelector('input[name="custom-gift-icon-type"][value="image"]');
  var emojiInput=$('custom-gift-emoji');
  var imageWrap=$('custom-gift-image-wrap');
  if(!imageRadio||!emojiInput||!imageWrap)return;
  if(imageRadio.checked){
    emojiInput.style.display='none';
    imageWrap.style.display='block';
  }else{
    emojiInput.style.display='block';
    imageWrap.style.display='none';
  }
}
// 处理图片上传
function handleCustomGiftImageUpload(file){
  if(!file){return;}
  if(file.size>2*1024*1024){toast('图片不能超过2MB');return;}
  var reader=new FileReader();
  reader.onload=function(e){
    _customGiftImageData=e.target.result;
    var preview=$('custom-gift-image-preview');
    if(preview){
      preview.innerHTML='<img src="'+_customGiftImageData.replace(/"/g,'&quot;')+'" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">';
      preview.style.fontSize='';
      preview.style.color='';
    }
  };
  reader.readAsDataURL(file);
}
function saveCustomGift(){
  var iconTypeEl=document.querySelector('input[name="custom-gift-icon-type"]:checked');
  var iconType=iconTypeEl?iconTypeEl.value:'emoji';
  var emoji=($('custom-gift-emoji')?$('custom-gift-emoji').value.trim():'');
  var name=($('custom-gift-name')?$('custom-gift-name').value.trim():'');
  var desc=($('custom-gift-desc')?$('custom-gift-desc').value.trim():'');
  var category=_selectedCustomGiftCat; // 优先：点击选中的已有分类
  if(!category)category=($('custom-gift-category')?$('custom-gift-category').value.trim():'');
  if(!category)category='自定义礼物';
  if(iconType==='emoji'){
    if(!emoji){toast('请输入礼物Emoji');return;}
  }else{
    if(!_customGiftImageData){toast('请选择礼物图片');return;}
  }
  if(!name){toast('请输入礼物名称');return;}
  if(!desc){desc='一份特别的礼物。';}
  // 检查是否已存在（按名称+分类）
  var exists=customGifts.some(function(g){return g.name===name&&((g.category||'自定义礼物')===category)});
  if(exists){toast('该分类下已有同名礼物');return;}
  var gift={
    id:'cg_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),
    iconType:iconType,
    emoji:iconType==='emoji'?emoji:'',
    img:iconType==='image'?_customGiftImageData:'',
    name:name,
    d:desc,
    category:category
  };
  customGifts.push(gift);
  saveCustomGiftsData();
  _customGiftImageData='';
  hideOv('ov-gift-add');
  toast('✨ 自定义礼物已添加');
  // 刷新礼物选择页，跳转到新礼物所在分类
  var newCatIdx=GIFT_DATA.findIndex(function(c){return c._isCustom&&c.cat===category});
  if(newCatIdx>=0){
    giftSendSelectedCat=newCatIdx;
    renderGiftCategoryTabs();
    renderGiftGrid();
  }
}
function deleteCustomGift(giftId){
  customGifts=customGifts.filter(function(g){return g.id!==giftId});
  saveCustomGiftsData();
  toast('已删除自定义礼物');
  renderGiftCategoryTabs();
  renderGiftGrid();
}

function showGiftBox(contactId){
  giftBoxContactId=contactId||'';
  giftBoxTab='all';
  if(contactId){
    // 从聊天或梦角主页进入 → 半屏overlay
    window._giftboxReturnProfile=true;
    var c=contacts.find(function(x){return x.id===contactId});
    var infoEl=$('giftbox-ov-info');
    if(infoEl&&c){
      var gifts=getGifts(contactId);
      var sent=gifts.filter(function(g){return g.dir==='sent';}).length;
      var received=gifts.filter(function(g){return g.dir==='received';}).length;
      infoEl.innerHTML='<span style="display:inline-flex;align-items:center;gap:6px;">'+
        (c.avatar?'<img src="'+c.avatar.replace(/"/g,'&quot;')+'" style="width:20px;height:20px;border-radius:4px;object-fit:cover;">':'')+
        '<span style="font-weight:600;color:var(--txt);">'+c.name+'</span>'+
        '<span style="color:var(--txt3);">·</span>'+
        '<span style="color:var(--txt3);">送出 '+sent+' · 收到 '+received+'</span></span>';
    }
    renderGiftBoxTabs();
    renderGiftBoxList();
    showOv('ov-giftbox');
  }else{
    // 从更多功能页进入 → 全屏页面（带联系人选择）
    window._giftboxReturnProfile=false;
    showPg('pg-giftbox');
    renderGiftBoxContactBar();
    renderGiftBoxFullTabs();
    renderGiftBoxFullList();
  }
}
function renderGiftBoxContactBar(){
  var bar=$('giftbox-contact-bar');
  if(!bar)return;
  var html='';
  // All contacts option
  html+='<div class="gift-cat-tab'+(!giftBoxContactId?' sel':'')+'" data-cid="" style="flex-shrink:0;padding:5px 12px;font-size:12px;">全部</div>';
  contacts.forEach(function(c){
    html+='<div class="gift-cat-tab'+(giftBoxContactId===c.id?' sel':'')+'" data-cid="'+c.id+'" style="flex-shrink:0;padding:5px 12px;font-size:12px;display:flex;align-items:center;gap:4px;">';
    if(c.avatar)html+='<img src="'+c.avatar.replace(/"/g,'&quot;')+'" style="width:18px;height:18px;border-radius:4px;object-fit:cover;">';
    html+='<span>'+c.name+'</span>';
    html+='</div>';
  });
  bar.innerHTML=html;
  bar.querySelectorAll('.gift-cat-tab').forEach(function(tab){
    tab.addEventListener('click',function(){
      giftBoxContactId=tab.dataset.cid||'';
      renderGiftBoxContactBar();
      renderGiftBoxFullList();
    });
  });
}
function renderGiftBoxTabs(){
  document.querySelectorAll('.giftbox-tab-btn').forEach(function(btn){
    var isActive=btn.dataset.tab===giftBoxTab;
    btn.classList.toggle('sel',isActive);
  });
}
function renderGiftBoxFullTabs(){
  document.querySelectorAll('.giftbox-tab-btn-full').forEach(function(btn){
    var isActive=btn.dataset.tab===giftBoxTab;
    btn.classList.toggle('sel',isActive);
  });
}
function _buildGiftListHTML(allGifts,showContactName){
  if(allGifts.length===0){
    return '<div style="text-align:center;padding:40px 20px;color:var(--txt3);font-size:14px;">还没有礼物记录。<br>点击底部「🎁 送给TA」开始送出第一份礼物。</div>';
  }
  var html='';
  allGifts.forEach(function(g){
    var c=contacts.find(function(x){return x.id===g.cid});
    var cName=c?c.name:'未知';
    var d=new Date(g.ts);
    var dateStr=(d.getMonth()+1)+'月'+d.getDate()+'日 '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
    var dirText=g.dir==='sent'?'送出':'收到';
    var dirClass=g.dir==='sent'?'gift-dir-sent':'gift-dir-received';
    html+='<div class="gift-record-card" data-gid="'+g.id+'">';
    html+='<div class="gift-record-icon">'+renderGiftIcon(g.icon,40)+'</div>';
    html+='<div class="gift-record-info">';
    html+='<div class="gift-record-name">'+g.name+'</div>';
    if(g.msg)html+='<div class="gift-record-msg">'+g.msg+'</div>';
    if(showContactName)html+='<div class="gift-record-time">'+cName+' · '+dateStr+'</div>';
    else html+='<div class="gift-record-time">'+dateStr+'</div>';
    html+='</div>';
    html+='<span class="gift-record-direction '+dirClass+'">'+dirText+'</span>';
    html+='</div>';
  });
  return html;
}
function _bindGiftCardClicks(container,allGifts){
  container.querySelectorAll('.gift-record-card').forEach(function(card){
    card.addEventListener('click',function(){
      var gid=card.dataset.gid;
      var gift=allGifts.find(function(g){return g.id===gid;});
      if(gift)showGiftView(gift);
    });
  });
}
function renderGiftBoxList(){
  // 半屏overlay的列表
  var list=$('giftbox-list');
  if(!list)return;
  var allGifts=getGifts(giftBoxContactId).slice();
  if(giftBoxTab!=='all'){
    allGifts=allGifts.filter(function(g){return g.dir===giftBoxTab;});
  }
  allGifts.sort(function(a,b){return b.ts-a.ts;});
  list.innerHTML=_buildGiftListHTML(allGifts,false);
  _bindGiftCardClicks(list,allGifts);
}
function renderGiftBoxFullList(){
  // 全屏页面的列表
  var list=$('giftbox-full-list');
  if(!list)return;
  var allGifts=[];
  if(giftBoxContactId){
    allGifts=getGifts(giftBoxContactId).slice();
  }else{
    for(var cid in giftBoxData){
      if(giftBoxData.hasOwnProperty(cid)){
        giftBoxData[cid].forEach(function(g){allGifts.push(g);});
      }
    }
  }
  if(giftBoxTab!=='all'){
    allGifts=allGifts.filter(function(g){return g.dir===giftBoxTab;});
  }
  allGifts.sort(function(a,b){return b.ts-a.ts;});
  list.innerHTML=_buildGiftListHTML(allGifts,!giftBoxContactId);
  _bindGiftCardClicks(list,allGifts);
}
function showGiftView(gift){
  var c=contacts.find(function(x){return x.id===gift.cid});
  var cName=c?c.name:'未知';
  var d=new Date(gift.ts);
  var dateStr=d.getFullYear()+'年'+(d.getMonth()+1)+'月'+d.getDate()+'日';
  var dirText=getGiftDirText(gift.dir!=='sent',gift.cid);
  var html='';
  html+='<div style="text-align:center;margin-bottom:20px;">';
  if(gift.icon&&gift.icon.indexOf('data:image/')===0){
    html+='<div style="display:inline-block;width:100px;height:100px;background:var(--c2);border-radius:24px;display:flex;align-items:center;justify-content:center;overflow:hidden;"><img src="'+gift.icon.replace(/"/g,'&quot;')+'" style="width:80px;height:80px;object-fit:contain;border-radius:12px;"></div>';
  }else{
    html+='<div style="font-size:56px;display:inline-block;width:100px;height:100px;line-height:100px;background:var(--c2);border-radius:24px;">'+renderGiftIcon(gift.icon,56)+'</div>';
  }
  html+='</div>';
  html+='<div style="font-size:18px;font-weight:700;text-align:center;margin-bottom:8px;color:var(--txt);">'+gift.name+'</div>';
  html+='<div style="font-size:13px;color:var(--txt2);text-align:center;margin-bottom:6px;">'+(gift.desc||'')+'</div>';
  html+='<div style="font-size:12px;color:var(--txt3);text-align:center;margin-bottom:20px;">'+(gift.categoryName||'')+'</div>';
  html+='<div style="background:var(--c2);border-radius:12px;padding:14px;margin-bottom:12px;">';
  html+='<div style="font-size:12px;color:var(--txt3);margin-bottom:4px;">'+dirText+'</div>';
  html+='<div style="font-size:13px;color:var(--txt2);">'+cName+' · '+dateStr+'</div>';
  html+='</div>';
  if(gift.msg){
    html+='<div style="background:var(--c2);border-radius:12px;padding:14px;">';
    html+='<div style="font-size:12px;color:var(--txt3);margin-bottom:6px;">附言</div>';
    html+='<div style="font-size:14px;color:var(--txt);line-height:1.6;">'+gift.msg+'</div>';
    html+='</div>';
  }
  $('gift-view-content').innerHTML=html;
  showOv('ov-gift-view');
}
function showGiftSendOverlay(){
  if(!giftBoxContactId){
    // 全屏页面模式：没有选中联系人时默认选第一个
    if(contacts.length>0){
      giftBoxContactId=contacts[0].id;
      renderGiftBoxContactBar();
      renderGiftBoxFullList();
    }else{toast('请先添加联系人');return;}
  }
  var c=contacts.find(function(x){return x.id===giftBoxContactId});
  if(!c){toast('请选择联系人');return;}
  var info=$('gift-send-contact-info');
  if(info){
    var isOverlay=window._giftboxReturnProfile;
    if(isOverlay){
      // 半屏模式：不可切换联系人，只显示名字
      info.innerHTML='送给：<span style="font-weight:600;color:var(--txt);">'+c.name+'</span>';
    }else{
      // 全屏模式：显示联系人选择下拉
      var html='送给：<select id="gift-contact-select" style="margin-left:6px;padding:4px 8px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:var(--c1);color:var(--txt);">';
      contacts.forEach(function(ct){
        html+='<option value="'+ct.id+'"'+(ct.id===giftBoxContactId?' selected':'')+'>'+ct.name+'</option>';
      });
      html+='</select>';
      info.innerHTML=html;
      var sel=$('gift-contact-select');
      if(sel)sel.addEventListener('change',function(){
        giftBoxContactId=sel.value;
        renderGiftBoxContactBar();
        renderGiftBoxFullList();
      });
    }
  }
  giftSendSelectedCat=0;
  giftSendSelectedGift=null;
  renderGiftCategoryTabs();
  renderGiftGrid();
  if($('gift-message-input'))$('gift-message-input').value='';
  showOv('ov-gift-send');
}
function renderGiftCategoryTabs(){
  var container=$('gift-category-tabs');
  if(!container)return;
  container.innerHTML='';
  GIFT_DATA.forEach(function(cat,idx){
    var tab=document.createElement('div');
    tab.className='gift-cat-tab'+(idx===giftSendSelectedCat?' sel':'');
    tab.textContent=cat.cat;
    tab.addEventListener('click',function(){
      giftSendSelectedCat=idx;
      giftSendSelectedGift=null;
      renderGiftCategoryTabs();
      renderGiftGrid();
    });
    container.appendChild(tab);
  });
  // 始终显示"+"按钮，方便添加自定义礼物
  var addBtn=document.createElement('div');
  addBtn.className='gift-cat-tab';
  addBtn.textContent='➕';
  addBtn.style.cssText='flex-shrink:0;width:32px;text-align:center;';
  addBtn.title='添加自定义礼物';
  addBtn.addEventListener('click',function(){showAddCustomGiftOverlay();});
  container.appendChild(addBtn);
}
function renderGiftGrid(){
  var grid=$('gift-grid');
  if(!grid)return;
  var cat=GIFT_DATA[giftSendSelectedCat];
  if(!cat){grid.innerHTML='';return;}
  var html='';
  cat.gifts.forEach(function(gift,idx){
    var parsed=parseGiftIconName(gift);
    var sel=giftSendSelectedGift&&giftSendSelectedGift.n===gift.n;
    html+='<div class="gift-item-card'+(sel?' selected':'')+'" data-idx="'+idx+'">';
    html+='<div class="gift-item-icon">'+renderGiftIcon(parsed.icon,32)+'</div>';
    html+='<div class="gift-item-name">'+parsed.name+'</div>';
    html+='</div>';
  });
  // 始终在礼物网格末尾显示"添加自定义礼物"按钮（不再只在自定义分类时显示，避免看不见）
  html+='<div class="gift-item-card" id="gift-add-custom-btn" style="border:2px dashed var(--border);background:var(--c2);">';
  html+='<div class="gift-item-icon" style="font-size:24px;">➕</div>';
  html+='<div class="gift-item-name" style="color:var(--txt3);">添加自定义礼物</div>';
  html+='</div>';
  grid.innerHTML=html;
  grid.querySelectorAll('.gift-item-card').forEach(function(card){
    card.addEventListener('click',function(){
      if(card.id==='gift-add-custom-btn'){
        showAddCustomGiftOverlay();
        return;
      }
      var idx=parseInt(card.dataset.idx);
      var g=cat.gifts[idx];
      showGiftDetail(g,cat.cat);
    });
  });
}
function showGiftDetail(gift,catName){
  var parsed=parseGiftIconName(gift);
  var iconEl=$('gift-detail-icon');
  if(iconEl){
    if(parsed.icon&&parsed.icon.indexOf('data:image/')===0){
      iconEl.innerHTML='<img src="'+parsed.icon.replace(/"/g,'&quot;')+'" style="width:80px;height:80px;object-fit:contain;border-radius:12px;">';
      iconEl.style.fontSize='';
    }else{
      iconEl.textContent=parsed.icon;
      iconEl.style.fontSize='56px';
    }
  }
  if($('gift-detail-name'))$('gift-detail-name').textContent=parsed.name;
  if($('gift-detail-desc'))$('gift-detail-desc').textContent=gift.d;
  if($('gift-detail-category'))$('gift-detail-category').textContent=catName;
  if($('gift-message-input'))$('gift-message-input').value='';
  giftSendSelectedGift={n:gift.n,icon:parsed.icon,name:parsed.name,desc:gift.d,categoryName:catName};
  // 自定义礼物显示删除按钮
  var delBtn=$('gift-delete-custom-btn');
  if(delBtn){
    if(gift._customId){
      delBtn.style.display='block';
      delBtn.onclick=function(){deleteCustomGift(gift._customId);hideOv('ov-gift-detail');};
    }else{
      delBtn.style.display='none';
      delBtn.onclick=null;
    }
  }
  hideOv('ov-gift-send');
  showOv('ov-gift-detail');
}
function sendGift(){
  if(!giftSendSelectedGift){toast('请先选择礼物');return;}
  if(!giftBoxContactId){toast('请选择联系人');return;}
  var msg=($('gift-message-input')?$('gift-message-input').value.trim():'');
  var gift={
    id:'gift_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),
    cid:giftBoxContactId,
    dir:'sent',
    icon:giftSendSelectedGift.icon,
    name:giftSendSelectedGift.name,
    desc:giftSendSelectedGift.desc,
    categoryName:giftSendSelectedGift.categoryName,
    msg:msg,
    ts:Date.now()
  };
  var gifts=getGifts(giftBoxContactId);
  gifts.push(gift);
  saveGiftBoxData();
  // 添加聊天消息
  try{
    var m=msgs(giftBoxContactId);
    m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),s:SELF,t:'',ts:new Date(),pc:false,isGift:true,giftIcon:gift.icon,giftName:gift.name,giftMsg:msg,read:true,senderName:'我',senderId:me.id});
    savemsgs(giftBoxContactId,m);
    if(cid===giftBoxContactId)renderMsgs(m);
    renderChatList();
  }catch(e){console.warn('gift msg err:',e);}
  hideOv('ov-gift-detail');
  toast('🎁 已送给TA');
  // 刷新对应的列表
  if(window._giftboxReturnProfile){
    // 半屏模式：刷新overlay列表 + 标题统计
    var c2=contacts.find(function(x){return x.id===giftBoxContactId});
    var infoEl=$('giftbox-ov-info');
    if(infoEl&&c2){
      var allG=getGifts(giftBoxContactId);
      var sent2=allG.filter(function(g){return g.dir==='sent';}).length;
      var received2=allG.filter(function(g){return g.dir==='received';}).length;
      infoEl.innerHTML='<span style="display:inline-flex;align-items:center;gap:6px;">'+
        (c2.avatar?'<img src="'+c2.avatar.replace(/"/g,'&quot;')+'" style="width:20px;height:20px;border-radius:4px;object-fit:cover;">':'')+
        '<span style="font-weight:600;color:var(--txt);">'+c2.name+'</span>'+
        '<span style="color:var(--txt3);">·</span>'+
        '<span style="color:var(--txt3);">送出 '+sent2+' · 收到 '+received2+'</span></span>';
    }
    renderGiftBoxList();
  }else{
    // 全屏模式
    renderGiftBoxContactBar();
    renderGiftBoxFullList();
  }
  // 触发TA回应
  setTimeout(function(){simulateGiftReply(giftBoxContactId,gift);},(2+Math.random()*4)*1000);
}
function simulateGiftReply(contactId,gift){
  try{
    // 选择回应字卡
    var responseText=GIFT_RESPONSE_MAP[gift.name];
    if(!responseText){
      // 如果礼物名匹配，用对应回应；否则随机
      responseText=GIFT_RESPONSE_CARDS[Math.floor(Math.random()*GIFT_RESPONSE_CARDS.length)];
    }
    // 也有概率加上一条随机字卡
    if(Math.random()<0.3){
      var extra=GIFT_RESPONSE_CARDS[Math.floor(Math.random()*GIFT_RESPONSE_CARDS.length)];
      if(extra!==responseText)responseText=responseText+' '+extra;
    }
    var m=msgs(contactId);
    m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),s:OTHER,t:responseText,ts:new Date(),pc:false,isGift:true,giftIcon:'🎁',giftName:'收到礼物',isGiftReply:true,read:false,senderName:contacts.find(function(x){return x.id===contactId})?contacts.find(function(x){return x.id===contactId}).name:'',senderId:contactId});
    savemsgs(contactId,m);
    if(cid===contactId)renderMsgs(m);
    renderChatList();
    playSound('receive',contactId);
  }catch(e){console.warn('gift reply err:',e);}
}
function renderContactProfileGiftSummary(contactId){
  var el=$('contact-profile-giftbox-summary');
  if(!el)return;
  var gifts=getGifts(contactId);
  var sent=gifts.filter(function(g){return g.dir==='sent';}).length;
  var received=gifts.filter(function(g){return g.dir==='received';}).length;
  el.innerHTML='<div style="flex:1;background:var(--c2);border-radius:10px;padding:8px 12px;text-align:center;"><div style="font-size:18px;font-weight:700;color:var(--txt);">'+sent+'</div><div style="font-size:11px;color:var(--txt3);">送出</div></div><div style="flex:1;background:var(--c2);border-radius:10px;padding:8px 12px;text-align:center;"><div style="font-size:18px;font-weight:700;color:var(--txt);">'+received+'</div><div style="font-size:11px;color:var(--txt3);">收到</div></div>';
}

// ==================== TA主动送礼系统 ====================
var GIFT_NORMAL_POOL=[
  {n:'☕ 热茶',d:'一杯温热的茶，希望TA忙碌时也能停下来休息。',cat:'日常陪伴'},
  {n:'🍪 小饼干',d:'一份简单的小零食，分享一点甜甜的心情。',cat:'日常陪伴'},
  {n:'🍰 小蛋糕',d:'一份小小的甜点，为普通的一天增加一点快乐。',cat:'日常陪伴'},
  {n:'🌸 小花',d:'一朵随手摘下的小花，只是想送给TA。',cat:'花草自然'},
  {n:'🥛 牛奶',d:'一杯温暖的牛奶，陪TA度过一个安静的夜晚。',cat:'日常陪伴'},
  {n:'📖 书',d:'一本想分享给TA看的故事。',cat:'书信记录'},
  {n:'📝 便签纸',d:'写下一句简单的话，放在TA能看到的地方。',cat:'书信记录'}
];
var GIFT_SPECIAL_POOL=[
  {n:'✉️ 手写信',d:'认真写下的话语，把想说的心意保存下来。',cat:'书信记录'},
  {n:'🎵 音乐盒',d:'一段旋律，把想传达的情绪送给TA。',cat:'音乐光影'},
  {n:'🌹 永生花',d:'不会凋谢的花，代表想长久保存的心意。',cat:'花草自然'},
  {n:'⭐ 星星瓶',d:'收集闪亮的星光，保存你们之间的回忆。',cat:'音乐光影'}
];
var GIFT_MEMORIAL_TRIGGERS=[
  {type:'first',threshold:1,n:'🎁 小纪念品',d:'第一次互动的纪念，一切的开始。',cat:'日常陪伴'},
  {type:'days',threshold:7,n:'✉️ 特别信件',d:'陪伴7天的纪念，写给TA的特别的话。',cat:'书信记录'},
  {type:'days',threshold:30,n:'🌙 月光石',d:'收藏一束温柔的月光，代表安静的陪伴。',cat:'音乐光影'},
  {type:'days',threshold:100,n:'🗝️ 回忆钥匙',d:'打开某段回忆的小钥匙，保存重要的故事。',cat:'书信记录'}
];
var GIFT_RECEIVE_MSGS={
  '☕ 热茶':'希望你忙碌的时候也能停下来休息。',
  '🍪 小饼干':'看到这个的时候想到了你。',
  '🍰 小蛋糕':'今天也想给你一点甜的。',
  '🌸 小花':'随手摘的，但觉得你会喜欢。',
  '🥛 牛奶':'希望你今晚能睡个好觉。',
  '📖 书':'这个故事，我觉得你会喜欢。',
  '📝 便签纸':'写了一句话，留在你能看到的地方。',
  '✉️ 手写信':'认真写下来的，你慢慢看。',
  '🎵 音乐盒':'这首旋律，希望你听到的时候会想到我。',
  '🌹 永生花':'不会凋谢的，像我想留下的心意。',
  '⭐ 星星瓶':'收集了一些星星，送给你的。',
  '🎁 小纪念品':'这是我们的开始。',
  '✉️ 特别信件':'有些话，写在这里了。',
  '🌙 月光石':'安静的月光，陪你。',
  '🗝️ 回忆钥匙':'这些回忆，我帮你保存着。'
};
// 联系人送礼留言字卡池（用于字卡组合留言，每个字卡中间空一格）
var GIFT_TA_MSG_CARDS=[
  '想起了你','今天也在','留给你','想分享','记得收下',
  '希望你喜欢','随手准备的','看到就想到你','送给你的','小小的礼物',
  '愿你开心','替我陪你','一点心意','不用客气','收下吧',
  '给你的','特意留的','属于你的','希望你在','想你的时候',
  '刚好的心意','留给以后的','想到你就留了','一直记着','不打扰你',
  '小小的纪念','愿你安好','都在这里面了','你慢慢看','不说也没关系'
];
// 生成联系人字卡组合留言：4-10个字卡，每个中间空一格，不重复
function generateTAGiftCardMsg(){
  var count=4+Math.floor(Math.random()*7); // 4~10个
  var pool=GIFT_TA_MSG_CARDS.slice();
  var picked=[];
  for(var i=0;i<count&&pool.length>0;i++){
    var idx=Math.floor(Math.random()*pool.length);
    picked.push(pool[idx]);
    pool.splice(idx,1); // 不重复
  }
  return picked.join(' ');
}
// 获取礼物卡片方向文本（根据是否隐藏昵称显示双方昵称或TA）
function getGiftDirText(isFromTA,contactId){
  var myName=(me&&me.name)?me.name:'我';
  var c=contacts.find(function(x){return x.id===contactId;});
  var taName=c?c.name:'TA';
  // 检查是否开启隐藏聊天内系统小字的双方昵称
  var hideNames=false;
  if(contactId){
    if(_globalHideTouchNames[contactId]===true)hideNames=true;
    else if(getHideTouchNames(contactId)===true)hideNames=true;
    else if(c&&c.hideTouchNames)hideNames=true;
  }
  if(hideNames){
    return isFromTA?'💌 TA送给你':'🎁 你送给TA';
  }
  // 转义昵称中的特殊字符
  var myEscaped=myName.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  var taEscaped=taName.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return isFromTA?'💌 '+taEscaped+'送给'+myEscaped:'🎁 '+myEscaped+'送给'+taEscaped;
}
function getGiftDailyState(){
  // 修复：多重读取保障，防止 localStorage 被清理后 state 丢失导致重复送礼物
  var s=ls('ml2_gift_daily');
  if(!s||typeof s!=='object'){
    // localStorage 没有数据，尝试从 IndexedDB 读取
    if(window.localforage){
      try{
        var dbVal;
        var done=false;
        window.localforage.getItem('ml2_gift_daily').then(function(v){
          dbVal=v;done=true;
        }).catch(function(){done=true;});
        // 同步等待（最多100ms）—— localforage IndexedDB 读取通常很快
        var _wait=Date.now();
        while(!done&&(Date.now()-_wait)<100){}
        if(dbVal&&typeof dbVal==='object'){s=dbVal;ls('ml2_gift_daily',s);}
      }catch(e){}
    }
  }
  if(!s||typeof s!=='object')s={};
  return s;
}
function saveGiftDailyState(s){
  // 修复：多重写入保障，确保 state 不丢失
  ls('ml2_gift_daily',s);
  // 同步写 localStorage 作为备份
  try{localStorage.setItem('ml2_lf_ml2_gift_daily',JSON.stringify(s));}catch(e){}
  // 异步写 IndexedDB
  if(window.localforage){
    window.localforage.setItem('ml2_gift_daily',s).catch(function(){});
  }
}
function checkDailyGifts(){
  // 兼容旧调用，不再做每日检查，礼物改为回复后按概率触发（和红包一致）
  return;
}
// 礼物配置：和红包机制一致，回复后按概率触发
var GIFT_CONFIG={
  triggerRate:0.04,          // 每次回复后触发送礼物的概率（和红包 systemTriggerRate 一致）
  dailyLimit:5,              // 每日上限（和红包 systemDailyLimit 一致）
  triggerDelayMin:800,       // 触发延迟最小值 ms
  triggerDelayMax:2000       // 触发延迟最大值 ms
};
// 合并所有礼物到一个池子，完全随机选取
function getAllGiftPool(){
  return GIFT_NORMAL_POOL.concat(GIFT_SPECIAL_POOL).concat(GIFT_MEMORIAL_TRIGGERS.map(function(t){return{n:t.n,d:t.d,cat:t.cat};}));
}
// 回复完成后触发：按概率随机送礼物（和 trySystemAutoSend 机制一致）
function trySystemAutoGift(contactId){
  if(!contactId)return;
  var today=getTodayStr();
  var state=getGiftDailyState();
  var cState=state[contactId]||{};
  // 初始化/跨日重置计数
  if(cState.date!==today){
    cState.date=today;
    cState.count=0;
  }
  if(cState.count>=GIFT_CONFIG.dailyLimit)return;
  if(Math.random()>=GIFT_CONFIG.triggerRate)return;
  cState.count++;
  state[contactId]=cState;
  saveGiftDailyState(state);
  var pool=getAllGiftPool();
  var gift=pool[Math.floor(Math.random()*pool.length)];
  sendTAGift(contactId,gift,'random');
}
function sendTAGift(contactId,giftData,giftType){
  var parsed=parseGiftIconName(giftData);
  var icon=parsed.icon;
  var name=parsed.name;
  // 两种留言概率触发：50%默认留言，50%字卡组合留言（4-10个字卡，每个中间空一格）
  var msg;
  if(Math.random()<0.5){
    msg=GIFT_RECEIVE_MSGS[giftData.n]||'送给你的。';
  }else{
    msg=generateTAGiftCardMsg();
  }
  // 随机延迟2-8秒
  var delay=(2+Math.random()*6)*1000;
  setTimeout(function(){
    try{
      var c=contacts.find(function(x){return x.id===contactId});
      var gift={
        id:'gift_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),
        cid:contactId,
        dir:'received',
        icon:icon,
        name:name,
        desc:giftData.d,
        categoryName:giftData.cat,
        msg:msg,
        giftType:giftType,
        ts:Date.now()
      };
      var gifts=getGifts(contactId);
      gifts.push(gift);
      saveGiftBoxData();
      // 添加聊天消息
      var m=msgs(contactId);
      // 修复：如果消息数据未加载（空数组），跳过推送聊天消息，避免覆盖原有聊天记录
      if(!m||m.length===0){
        console.warn('sendTAGift: msgs empty for',contactId,', skip chat msg push to avoid overwriting');
        return;
      }
      m.push({id:'m_'+Date.now()+'_'+Math.random().toString(36).substr(2,9),s:OTHER,t:'',ts:new Date(),pc:false,isGift:true,giftIcon:icon,giftName:name,giftMsg:msg,isGiftFromTA:true,read:false,senderName:c?c.name:'',senderId:contactId});
      savemsgs(contactId,m);
      if(cid===contactId)renderMsgs(m);
      renderChatList();
      playSound('receive',contactId);
    }catch(e){console.warn('TA gift send err:',e);}
  },delay);
}
function openGiftChatDetail(msgId){
  try{
    var m=msgs(cid);
    var msg=m.find(function(x){return x.id===msgId;});
    if(!msg||!msg.isGift)return;
    var isFromTA=msg.isGiftFromTA===true;
    var c=contacts.find(function(x){return x.id===cid});
    var cName=c?c.name:'未知';
    var dirText=getGiftDirText(isFromTA,msg.senderId||cid);
    var senderText=isFromTA?cName:'你';
    var d=new Date(msg.ts);
    var dateStr=d.getFullYear()+'年'+(d.getMonth()+1)+'月'+d.getDate()+'日';
    var html='';
    html+='<div style="text-align:center;margin-bottom:20px;">';
    html+='<div style="font-size:56px;display:inline-block;width:100px;height:100px;line-height:100px;background:var(--c2);border-radius:24px;display:flex;align-items:center;justify-content:center;overflow:hidden;">'+renderGiftIcon(msg.giftIcon||'🎁',56)+'</div>';
    html+='</div>';
    html+='<div style="font-size:18px;font-weight:700;text-align:center;margin-bottom:8px;color:var(--txt);">'+(msg.giftName||'礼物')+'</div>';
    html+='<div style="font-size:12px;color:var(--txt3);text-align:center;margin-bottom:20px;">'+dirText+' · '+dateStr+'</div>';
    html+='<div style="background:var(--c2);border-radius:12px;padding:14px;margin-bottom:12px;">';
    html+='<div style="font-size:12px;color:var(--txt3);margin-bottom:4px;">赠送者</div>';
    html+='<div style="font-size:14px;color:var(--txt);">'+senderText+'</div>';
    html+='</div>';
    if(msg.giftMsg){
      html+='<div style="background:var(--c2);border-radius:12px;padding:14px;margin-bottom:16px;">';
      html+='<div style="font-size:12px;color:var(--txt3);margin-bottom:6px;">附言</div>';
      html+='<div style="font-size:14px;color:var(--txt);line-height:1.6;">'+msg.giftMsg+'</div>';
      html+='</div>';
    }
    $('gift-view-content').innerHTML=html;
    showOv('ov-gift-view');
  }catch(e){console.warn('openGiftChatDetail err:',e);}
}
// Event bindings
if($('giftbox-back'))$('giftbox-back').addEventListener('click',function(){
  // 如果是从梦角主页进来的，回梦角主页；否则回更多功能页
  if(window._giftboxReturnProfile&&currentProfileContactId){
    showContactProfile(currentProfileContactId);
  }else{
    showPg('pg-more');
  }
});
if($('giftbox-send-btn'))$('giftbox-send-btn').addEventListener('click',function(){showGiftSendOverlay()});
if($('gift-send-confirm-btn'))$('gift-send-confirm-btn').addEventListener('click',function(){sendGift()});
if($('custom-gift-save-btn'))$('custom-gift-save-btn').addEventListener('click',function(){saveCustomGift()});
// 新建分类按钮：把输入框的值设为新分类，并取消已有分类选中
if($('custom-gift-new-cat-btn'))$('custom-gift-new-cat-btn').addEventListener('click',function(){
  var v=$('custom-gift-category')?$('custom-gift-category').value.trim():'';
  if(!v){toast('请先输入新分类名称');return;}
  _selectedCustomGiftCat=''; // 用新建分类，清除已有分类选中
  var wrap=$('custom-gift-cat-chips');
  if(wrap){
    wrap.querySelectorAll('[data-cat]').forEach(function(el){
      el.style.borderColor='var(--border)';el.style.background='var(--c2)';el.style.color='var(--txt)';
    });
  }
  toast('将新建分类「'+v+'」');
});
// 新建输入框聚焦时清除已有分类选中
if($('custom-gift-category'))$('custom-gift-category').addEventListener('input',function(){
  if(this.value.trim()){
    _selectedCustomGiftCat='';
    var wrap=$('custom-gift-cat-chips');
    if(wrap){
      wrap.querySelectorAll('[data-cat]').forEach(function(el){
        el.style.borderColor='var(--border)';el.style.background='var(--c2)';el.style.color='var(--txt)';
      });
    }
  }
});
document.querySelectorAll('.giftbox-tab-btn').forEach(function(btn){
  btn.addEventListener('click',function(){
    giftBoxTab=btn.dataset.tab;
    renderGiftBoxTabs();
    renderGiftBoxList();
  });
});
document.querySelectorAll('.giftbox-tab-btn-full').forEach(function(btn){
  btn.addEventListener('click',function(){
    giftBoxTab=btn.dataset.tab;
    renderGiftBoxFullTabs();
    renderGiftBoxFullList();
  });
});

function requestMoreStorage(){
  try{
    toast('正在申请更多存储空间...');
    if(navigator.storage&&navigator.storage.requestQuota){
      navigator.storage.requestQuota(500*1024*1024).then(function(granted){
        if(granted>0){
          toast('✓ 成功申请到 '+Math.round(granted/1024/1024)+'MB 存储空间');
          refreshStorageStats();
        }else{
          toast('申请被浏览器拒绝');
        }
      }).catch(function(e){
        console.warn('requestQuota failed:',e);
        toast('浏览器不支持申请配额，但你仍可正常使用IndexedDB存储');
        refreshStorageStats();
      });
    }else{
      if(window.localforage){
        toast('正在尝试自动扩展存储空间...');
        window.localforage.setItem('_quota_request_',{t:Date.now()}).then(function(){
          window.localforage.removeItem('_quota_request_');
          refreshStorageStats();
          toast('✓ 存储空间已就绪');
        }).catch(function(){
          refreshStorageStats();
          toast('你的浏览器已自动分配足够空间，无需额外申请');
        });
      }else{
        toast('你的浏览器支持自动配额管理，无需手动申请');
      }
    }
  }catch(err){
    console.error('requestMoreStorage error:',err);
    toast('操作出错：'+(err.message||'未知错误'));
  }
}

function releaseErrorMemory(){
  toast('正在清理错误加载的内存...');

  var releasedCount=0;

  try{
    // 1. 停止并清理星音播放器
    if(typeof starMusicAudio!=='undefined'&&starMusicAudio){
      try{
        starMusicAudio.pause();
        starMusicAudio.onended=null;
        starMusicAudio.onerror=null;
        starMusicAudio.removeAttribute('src');
        starMusicAudio.load();
        starMusicAudio=null;
        releasedCount++;
      }catch(e){}
    }
    if(typeof starMusicProgressInterval!=='undefined'&&starMusicProgressInterval){
      clearInterval(starMusicProgressInterval);
      starMusicProgressInterval=null;
    }

    // 2. 清理内存缓存中过大的头像/图片数据（不使用 JSON.stringify 避免阻塞）
    var cache=Storage.cache||memoryCache||{};
    var keysToClean=[];
    for(var key in cache){
      if(cache.hasOwnProperty(key)){
        if(key.indexOf('_img_')===0||key.indexOf('ml2_avh_')===0||key.indexOf('ml2_avatar_lib_')===0){
          var val=cache[key];
          // 快速判断：字符串看 length，对象看是否为 ArrayBuffer 或有 byteLength
          var isLarge=false;
          if(typeof val==='string'&&val.length>25000){isLarge=true;}
          else if(val&&val.byteLength&&val.byteLength>50000){isLarge=true;}
          else if(val&&val.length&&val.length>25000){isLarge=true;}
          if(isLarge)keysToClean.push(key);
        }
      }
    }
    keysToClean.forEach(function(k){
      try{delete cache[k];releasedCount++;}catch(e){}
    });

    // 3. 清理未使用的Blob URL
    if(window.revokeObjectURL&&window._blobUrls){
      try{
        window._blobUrls.forEach(function(url){
          try{window.revokeObjectURL(url);}catch(e){}
        });
        window._blobUrls=[];
      }catch(e){}
    }

    // 4. 清理未使用的Audio元素（仅查找正在播放的，避免全量遍历）
    try{
      var audios=document.querySelectorAll('audio');
      for(var ai=0;ai<audios.length;ai++){
        var a=audios[ai];
        if(!a.paused&&!a.dataset.keep){
          try{a.pause();a.removeAttribute('src');a.load();}catch(e){}
        }
      }
    }catch(e){}

    // 5. 强制GC
    try{
      if(window.gc){try{window.gc();}catch(e){}}
    }catch(e){}
  }catch(err){
    console.error('releaseErrorMemory error:',err);
  }

  setTimeout(function(){
    refreshStorageStats();
    toast('清理完成，释放了 '+releasedCount+' 项缓存');
  },200);
}

// ★ 清理孤儿图片/语音数据：扫描 IndexedDB 中所有 ml2_msg_img_*/ml2_msg_voice_*，
// 检查对应消息是否还存在（引用），不存在的删除——解决旧版清空聊天/删联系人后数据残留导致存储膨胀
function cleanupOrphanMedia(){
  return new Promise(function(resolve){
    var result={checked:0,removed:0,freed:0};
    try{
      if(!window.localforage){
        toast('当前环境无 IndexedDB，无法清理');
        resolve(result);
        return;
      }
      window.localforage.keys().then(function(keys){
        // 1) 先收集所有消息 key（ml2_m_*）并读取其中的图片/语音引用
        var msgKeys=keys.filter(function(k){return k&&k.indexOf('ml2_m_')===0});
        var usedRefs={};
        var refKeys=keys.filter(function(k){return k&&(k.indexOf('ml2_msg_img_')===0||k.indexOf('ml2_msg_voice_')===0)});
        var allRefs={};
        refKeys.forEach(function(k){allRefs[k]=true;});
        
        var done=0;
        function checkDone(){
          done++;
          if(done<msgKeys.length)return;
          // 2) 找出没有被任何消息引用的图片/语音键
          var orphanKeys=Object.keys(allRefs).filter(function(k){return !usedRefs[k]});
          result.checked=Object.keys(allRefs).length;
          if(orphanKeys.length===0){
            result.removed=0;
            toast('没有发现孤儿图片/语音数据');
            resolve(result);
            return;
          }
          // 3) 删除孤儿数据
          var freedBytes=0;
          var delPromises=orphanKeys.map(function(k){
            return window.localforage.getItem(k).then(function(val){
              if(typeof val==='string')freedBytes+=val.length;
              else if(val&&val.byteLength)freedBytes+=val.byteLength;
              return window.localforage.removeItem(k);
            }).catch(function(){});
          });
          Promise.all(delPromises).then(function(){
            result.removed=orphanKeys.length;
            result.freed=freedBytes;
            try{
              var el=$('storage-release-result');
              if(el){
                el.style.display='block';
                el.textContent='已清理 '+orphanKeys.length+' 个孤儿图片/语音，释放约 '+(freedBytes/1048576).toFixed(1)+' MB';
              }
            }catch(e){}
            toast('清理完成：删除 '+orphanKeys.length+' 个孤儿数据，释放约 '+(freedBytes/1048576).toFixed(1)+' MB');
            try{refreshStorageStats();}catch(e){}
            resolve(result);
          });
        }
        // 读取每条消息，收集引用的图片/语音键
        msgKeys.forEach(function(mk){
          window.localforage.getItem(mk).then(function(msgs){
            try{
              if(Array.isArray(msgs)){
                msgs.forEach(function(msg){
                  if(!msg)return;
                  ['img','originalImg','t'].forEach(function(f){
                    if(msg[f]&&typeof msg[f]==='string'&&allRefs[msg[f]])usedRefs[msg[f]]=true;
                  });
                  if(msg.imgs&&Array.isArray(msg.imgs)){
                    msg.imgs.forEach(function(im){if(im&&typeof im==='string'&&allRefs[im])usedRefs[im]=true;});
                  }
                  if(msg.voice&&typeof msg.voice==='string'&&allRefs[msg.voice])usedRefs[msg.voice]=true;
                });
              }
            }catch(e){}
            checkDone();
          }).catch(function(){checkDone();});
        });
        if(msgKeys.length===0){
          // 没有消息，所有图片/语音都是孤儿
          var orphanKeys2=refKeys;
          result.checked=refKeys.length;
          if(orphanKeys2.length===0){
            toast('没有发现孤儿图片/语音数据');
            resolve(result);
            return;
          }
          var freedBytes2=0;
          var delPromises2=orphanKeys2.map(function(k){
            return window.localforage.getItem(k).then(function(val){
              if(typeof val==='string')freedBytes2+=val.length;
              else if(val&&val.byteLength)freedBytes2+=val.byteLength;
              return window.localforage.removeItem(k);
            }).catch(function(){});
          });
          Promise.all(delPromises2).then(function(){
            result.removed=orphanKeys2.length;
            result.freed=freedBytes2;
            toast('清理完成：删除 '+orphanKeys2.length+' 个孤儿数据，释放约 '+(freedBytes2/1048576).toFixed(1)+' MB');
            try{refreshStorageStats();}catch(e){}
            resolve(result);
          });
        }
      }).catch(function(e){
        console.error('cleanupOrphanMedia keys failed:',e);
        toast('扫描存储失败');
        resolve(result);
      });
    }catch(e){
      console.error('cleanupOrphanMedia error:',e);
      toast('清理失败');
      resolve(result);
    }
  });
}


/**
 * 音乐伴侣 · 后端服务（零依赖 Node.js）
 *
 * 功能：
 *   1. 网易云 API 代理（搜索/详情/播放地址/歌词/歌单）
 *   2. 字卡库（签名/评论/拒绝理由 随机抽取）
 *   3. 静态文件服务（同源访问）
 *
 * 启动： node server.js
 */

const http = require('http');
const https = require('https');
const tls = require('tls');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

/* ============ 字卡库 ============ */
const WORD_CARDS = {
  // 伴侣签名（随机选取，用于伴侣主页展示）
  signatures: [
    '想被阳光晒透，连同心事一起晾干。',
    '今天是个好天气，适合想念你。',
    '雨天也是一种告白方式。',
    '把耳机分你一半，这是我能想到的最浪漫的事。',
    '所有未说出口的话，都藏在歌单里了。',
    '在音乐里等一个共振的灵魂。',
    '我们听的不是歌，是彼此的心跳。',
    '愿你拥有晴天，也拥有为你撑伞的人。',
    '总有一首歌，让我想起你。',
    'Drizzle therapy — 听雨也是一种治愈。',
    '把想念调成单曲循环。',
    '你是我耳机里永远播放的那首。',
    '春天来了，该听一些温柔的歌了。',
    '深夜的歌单，是写给一个人的情书。',
    '有些歌只敢在夜里听，像有些话只敢在心里说。',
    '我们的频率，藏在同一首歌里。',
    '雨声、歌声明明都是噪音，偏偏让人觉得安心。',
    '如果思念有声音，那一定是这首歌。',
    '用一首歌的时间，假装你在我身边。',
    'Chrysalism — 暴风雨天躲在室内的安心感，就是你给我的。',
  ],

  // 歌曲评论（随机选取，用于模拟伴侣对歌曲的评论）
  comments: [
    '这首歌让我想起你笑的样子。',
    '旋律一响，心跳就漏了半拍。',
    '你听过吗？我觉得你会喜欢。',
    '深夜单曲循环中，想你。',
    '歌词写的好像我们。',
    '听着这首歌，突然很想见你。',
    '把这首歌放进我们的歌单吧。',
    '副歌部分太好听了，像你说话的语气。',
    '雨天和这首歌更配哦。',
    '我又听了一遍，又想了你一遍。',
    '这首歌的间奏，藏着没说出口的话。',
    '如果歌会说话，它一定在说喜欢你。',
    '耳机分你一半，世界安静一半。',
    '有些旋律是解药，你是其中一首。',
    '听到这首歌的时候，你在做什么呢？',
    '想和你一起听这首歌，从天亮到天黑。',
    '这首歌适合两个人一起沉默。',
    '我把所有温柔都存进了这首歌里。',
    '又到了听这首歌的季节了。',
    '这首歌的歌名，就是我想对你说的。',
  ],

  // 拒绝理由（陪伴模式邀请被拒绝时的随机回复）
  rejections: [
    '现在有点忙，晚点一起听好不好？',
    '我想一个人安静一会儿，抱歉。',
    '今天有点累了，明天吧。',
    '此刻的心情不太适合听歌，抱歉。',
    '等我把手头的事忙完就来找你。',
    '不是不想陪你，是现在状态不太好。',
    '给我一点时间调整，好吗？',
    '今天想听点别的，下次陪你听这首。',
    '抱歉，我现在更需要安静。',
    '晚一点好吗？我想先发会儿呆。',
  ],

  // 接受回复（陪伴模式邀请被接受时的随机回复）
  acceptances: [
    '好啊，一起听吧！',
    '来啦来啦，正好也想听歌。',
    '你选的歌我都喜欢。',
    '好巧，我也正想找人一起听。',
    '等我戴上耳机，马上来。',
    '当然好啦，你放的我都听。',
    '来吧，今天的BGM交给你了。',
    '一起听歌的时光，最珍贵了。',
    '我准备好了，开始吧。',
    '你总是知道什么时候该找我。',
  ],
};

function randomCard(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ============ 系统代理检测 ============ */
const PROXY = process.env.https_proxy || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.HTTP_PROXY || '';

/* ============ Cookie ============ */
let COOKIE = process.env.COOKIE || '';
const cookieFile = path.join(__dirname, 'cookie.txt');
try {
  if (!COOKIE && fs.existsSync(cookieFile)) {
    COOKIE = fs.readFileSync(cookieFile, 'utf8').trim();
  }
} catch (e) {}

/* ============ TLS 连接（支持代理隧道）============ */
function createConnection(targetHost, targetPort) {
  return new Promise((resolve, reject) => {
    if (!PROXY) {
      const socket = tls.connect({ host: targetHost, port: targetPort, servername: targetHost }, () => resolve(socket));
      socket.on('error', reject);
      socket.setTimeout(10000, () => { socket.destroy(new Error('connect timeout')); });
      return;
    }
    const proxy = new URL(PROXY);
    const tunnelReq = http.request({
      host: proxy.hostname, port: proxy.port || 80,
      method: 'CONNECT', path: `${targetHost}:${targetPort}`,
      headers: { 'Host': `${targetHost}:${targetPort}` },
    });
    tunnelReq.on('connect', (res, socket) => {
      if (res.statusCode !== 200) { reject(new Error('proxy tunnel failed: ' + res.statusCode)); return; }
      const tlsSocket = tls.connect({ socket, servername: targetHost }, () => resolve(tlsSocket));
      tlsSocket.on('error', reject);
      tlsSocket.setTimeout(10000, () => { tlsSocket.destroy(new Error('tls timeout')); });
    });
    tunnelReq.on('error', reject);
    tunnelReq.setTimeout(10000, () => { tunnelReq.destroy(new Error('proxy timeout')); });
    tunnelReq.end();
  });
}

/* ============ HTTPS 请求 ============ */
function fetchJSON(targetUrl) {
  return new Promise(async (resolve, reject) => {
    const u = new URL(targetUrl);
    const reqHeaders = {
      'Host': u.host,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://music.163.com',
      'Accept': 'application/json, text/plain, */*',
    };
    if (COOKIE) reqHeaders['Cookie'] = COOKIE;
    let socket;
    try { socket = await createConnection(u.hostname, 443); } catch (e) { reject(e); return; }
    const reqLines = [`GET ${u.pathname}${u.search} HTTP/1.1`, ...Object.entries(reqHeaders).map(([k,v])=>`${k}: ${v}`), 'Connection: close', '', ''];
    socket.write(reqLines.join('\r\n'));
    let raw = '';
    socket.on('data', c => raw += c);
    socket.on('end', () => {
      const idx = raw.indexOf('\r\n\r\n');
      if (idx < 0) { reject(new Error('bad response')); return; }
      let bodyStr = raw.substring(idx + 4);
      if (/transfer-encoding:\s*chunked/i.test(raw.substring(0, idx))) bodyStr = dechunk(bodyStr);
      try { resolve({ data: JSON.parse(bodyStr) }); } catch(e) { resolve({ data: bodyStr }); }
    });
    socket.on('error', reject);
    socket.setTimeout(12000, () => { socket.destroy(); reject(new Error('timeout')); });
  });
}

/* 带cookie捕获的GET请求（用于扫码登录） */
function fetchJSONWithCookie(targetUrl) {
  return new Promise(async (resolve, reject) => {
    const u = new URL(targetUrl);
    const reqHeaders = {
      'Host': u.host,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://music.163.com',
      'Accept': 'application/json, text/plain, */*',
      'Cookie': 'os=pc; osver=Microsoft-Windows-10-Professional-build-19045-SP0; appver=2.0.7.191208; channel=netease; __remember_me=true',
    };
    if (COOKIE) reqHeaders['Cookie'] += '; ' + COOKIE;
    let socket;
    try { socket = await createConnection(u.hostname, 443); } catch (e) { reject(e); return; }
    const reqLines = [`GET ${u.pathname}${u.search} HTTP/1.1`, ...Object.entries(reqHeaders).map(([k,v])=>`${k}: ${v}`), 'Connection: close', '', ''];
    socket.write(reqLines.join('\r\n'));
    let raw = '';
    socket.on('data', c => raw += c);
    socket.on('end', () => {
      const idx = raw.indexOf('\r\n\r\n');
      if (idx < 0) { reject(new Error('bad response')); return; }
      const headerStr = raw.substring(0, idx);
      let bodyStr = raw.substring(idx + 4);
      if (/transfer-encoding:\s*chunked/i.test(headerStr)) bodyStr = dechunk(bodyStr);
      // 提取 Set-Cookie
      const cookies = [];
      headerStr.split('\r\n').forEach(line => {
        const m = line.match(/^set-cookie:\s*(.+?)(?:;|$)/i);
        if (m) cookies.push(m[1].trim());
      });
      try { resolve({ data: JSON.parse(bodyStr), cookies }); } catch(e) { resolve({ data: bodyStr, cookies }); }
    });
    socket.on('error', reject);
    socket.setTimeout(12000, () => { socket.destroy(); reject(new Error('timeout')); });
  });
}

function dechunk(str) {
  let result = '', i = 0;
  while (i < str.length) {
    const crlf = str.indexOf('\r\n', i);
    if (crlf < 0) break;
    const size = parseInt(str.substring(i, crlf), 16);
    if (isNaN(size) || size === 0) break;
    result += str.substring(crlf + 2, crlf + 2 + size);
    i = crlf + 2 + size + 2;
  }
  return result;
}

function resolveOuterUrl(songId) {
  return new Promise(async (resolve) => {
    const reqPath = `/song/media/outer/url?id=${songId}.mp3`;
    const reqHeaders = { 'Host': 'music.163.com', 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://music.163.com' };
    if (COOKIE) reqHeaders['Cookie'] = COOKIE;
    let socket;
    try { socket = await createConnection('music.163.com', 443); } catch(e) { resolve(null); return; }
    socket.write([`GET ${reqPath} HTTP/1.1`, ...Object.entries(reqHeaders).map(([k,v])=>`${k}: ${v}`), 'Connection: close', '', ''].join('\r\n'));
    let headerStr = '';
    socket.on('data', chunk => {
      headerStr += chunk.toString();
      if (headerStr.indexOf('\r\n\r\n') >= 0 || headerStr.length > 4096) {
        const lines = headerStr.split('\r\n');
        const sc = parseInt(lines[0].split(' ')[1] || '0');
        const loc = lines.find(l => /^location:/i.test(l));
        if (sc >= 300 && sc < 400 && loc) {
          const u = loc.split(': ').slice(1).join(': ').trim();
          if (u.includes('/404')) resolve(null); else resolve(u);
        } else if (sc === 200) resolve(`https://music.163.com${reqPath}`);
        else resolve(null);
        socket.destroy();
      }
    });
    socket.on('error', () => resolve(null));
    socket.on('end', () => resolve(null));
    socket.setTimeout(8000, () => { socket.destroy(); resolve(null); });
  });
}

/* POST请求获取播放URL（enhance/player/url需要POST） */
function fetchSongUrlPost(songId, br = 320000) {
  return new Promise(async (resolve) => {
    const reqHeaders = {
      'Host': 'music.163.com',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://music.163.com',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(`ids=[${songId}]&br=${br}`),
    };
    if (COOKIE) reqHeaders['Cookie'] = COOKIE;
    let socket;
    try { socket = await createConnection('music.163.com', 443); } catch(e) { const u = await resolveOuterUrl(songId); resolve(u); return; }
    const body = `ids=[${songId}]&br=${br}`;
    socket.write([`POST /api/song/enhance/player/url HTTP/1.1`, ...Object.entries(reqHeaders).map(([k,v])=>`${k}: ${v}`), 'Connection: close', '', body].join('\r\n'));
    let raw = '';
    socket.on('data', c => raw += c);
    socket.on('end', async () => {
      const idx = raw.indexOf('\r\n\r\n');
      if (idx < 0) { const u = await resolveOuterUrl(songId); resolve(u); return; }
      let bodyStr = raw.substring(idx + 4);
      if (/transfer-encoding:\s*chunked/i.test(raw.substring(0, idx))) bodyStr = dechunk(bodyStr);
      try {
        const data = JSON.parse(bodyStr);
        const url = data?.data?.[0]?.url;
        if (url) resolve(url); else { const u = await resolveOuterUrl(songId); resolve(u); }
      } catch(e) { const u = await resolveOuterUrl(songId); resolve(u); }
    });
    socket.on('error', async () => { const u = await resolveOuterUrl(songId); resolve(u); });
    socket.setTimeout(10000, () => { socket.destroy(); resolve(null); });
  });
}

async function fetchSongUrl(songId, br = 320000) {
  return await fetchSongUrlPost(songId, br);
}

/* ============ CORS + 静态文件 ============ */
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const MIME = { '.html':'text/html;charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.gif':'image/gif', '.svg':'image/svg+xml', '.ico':'image/x-icon', '.mp3':'audio/mpeg', '.woff':'font/woff', '.woff2':'font/woff2', '.ttf':'font/ttf', '.eot':'application/vnd.ms-fontobject', '.otf':'font/otf', '.webp':'image/webp' };
function serveStatic(req, res) {
  let pathname = decodeURIComponent(url.parse(req.url).pathname);
  if (pathname === '/') pathname = '/index.html';
  const fp = path.join(__dirname, pathname);
  if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(fp).pipe(res);
    return true;
  }
  return false;
}

function readBody(req) {
  return new Promise(resolve => { let d=''; req.on('data',c=>d+=c); req.on('end',()=>{ try{resolve(JSON.parse(d))}catch(e){resolve({})} }); });
}

function sendJSON(res, obj, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

/* 批量获取歌曲封面 */
async function fetchSongPicUrls(songIds) {
  if (!songIds.length) return {};
  try {
    const r = await fetchJSON(`https://music.163.com/api/song/detail?ids=[${songIds.join(',')}]`);
    const map = {};
    (r.data?.songs || []).forEach(s => {
      const a = s.album || s.al || {};
      map[s.id] = a.picUrl || '';
    });
    return map;
  } catch (e) { return {}; }
}

/* ============ 路由 ============ */
const server = http.createServer(async (req, res) => {
  setCORS(res);
  const parsed = url.parse(req.url, true);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  const p = parsed.pathname;

  // 静态文件
  if (!p.startsWith('/api/') && p !== '/health') {
    if (serveStatic(req, res)) return;
  }

  // 健康检查
  if (p === '/health') return sendJSON(res, { ok: true, cookie: !!COOKIE, port: PORT, proxy: !!PROXY });

  /* —— 字卡库 —— */
  if (p === '/api/cards/signature') return sendJSON(res, { text: randomCard(WORD_CARDS.signatures) });
  if (p === '/api/cards/comment') return sendJSON(res, { text: randomCard(WORD_CARDS.comments) });
  if (p === '/api/cards/rejection') return sendJSON(res, { text: randomCard(WORD_CARDS.rejections) });
  if (p === '/api/cards/acceptance') return sendJSON(res, { text: randomCard(WORD_CARDS.acceptances) });
  if (p === '/api/cards/batch') {
    const body = await readBody(req);
    const types = body.types || ['signatures','comments','rejections','acceptances'];
    const result = {};
    types.forEach(t => { if (WORD_CARDS[t]) result[t] = randomCard(WORD_CARDS[t]); });
    return sendJSON(res, result);
  }

  /* —— 网易云搜索 —— */
  if (p === '/api/search') {
    let keywords, limit;
    if (req.method === 'POST') {
      const body = await readBody(req);
      keywords = body.keywords || ''; limit = body.limit || 20;
    } else {
      keywords = parsed.query.keywords || ''; limit = parsed.query.limit || 20;
    }
    if (!keywords) return sendJSON(res, { error: '缺少 keywords' }, 400);
    try {
      const r = await fetchJSON(`https://music.163.com/api/search/get?s=${encodeURIComponent(keywords)}&type=1&limit=${limit}&offset=0`);
      const list = r.data?.result?.songs || [];
      return sendJSON(res, { songs: list.map(s => ({ id:s.id, name:s.name, artist:(s.artists||[]).map(a=>a.name).join('/'), album:(s.album||{}).name||'', duration:s.duration, picUrl:(s.album||{}).picUrl||'' })) });
    } catch(e) { return sendJSON(res, { error: '搜索失败：'+(e.message||'') }, 502); }
  }

  /* —— 歌曲详情 —— */
  if (p === '/api/song/detail') {
    const id = parsed.query.id;
    if (!id) return sendJSON(res, { error: '缺少 id' }, 400);
    try {
      const r = await fetchJSON(`https://music.163.com/api/song/detail/?ids=${encodeURIComponent('['+id+']')}`);
      const s = r.data?.songs?.[0];
      if (!s) return sendJSON(res, { error: '未找到' }, 404);
      return sendJSON(res, { detail: { id:s.id, name:s.name, artist:(s.artists||[]).map(a=>a.name).join('/'), album:(s.album||{}).name||'', picUrl:(s.album||{}).picUrl||'', duration:s.duration } });
    } catch(e) { return sendJSON(res, { error: '获取详情失败' }, 502); }
  }

  /* —— 播放地址 —— */
  if (p === '/api/song/url') {
    const id = parsed.query.id; if (!id) return sendJSON(res, { error: '缺少 id' }, 400);
    try {
      const u = await fetchSongUrl(id, parsed.query.br || 320000);
      if (u) return sendJSON(res, { url: u, id });
      return sendJSON(res, { url: null, id, error: '版权曲，可设置 Cookie 后重试' });
    } catch(e) { return sendJSON(res, { error: '解析失败' }, 502); }
  }

  /* —— 歌词 —— */
  if (p === '/api/lyric') {
    const id = parsed.query.id; if (!id) return sendJSON(res, { error: '缺少 id' }, 400);
    try {
      const r = await fetchJSON(`https://music.163.com/api/song/lyric?id=${id}&lv=1&kv=1&tv=-1`);
      return sendJSON(res, { lrc: r.data?.lrc?.lyric || '', tlyric: r.data?.tlyric?.lyric || '' });
    } catch(e) { return sendJSON(res, { error: '获取歌词失败' }, 502); }
  }

  /* —— 歌单详情 —— */
  if (p === '/api/playlist/detail') {
    const id = parsed.query.id; if (!id) return sendJSON(res, { error: '缺少 id' }, 400);
    try {
      const r = await fetchJSON(`https://music.163.com/api/playlist/detail?id=${id}`);
      const pl = r.data?.result;
      if (!pl) return sendJSON(res, { error: '未找到歌单' }, 404);
      return sendJSON(res, { name:pl.name, creator:(pl.creator||{}).nickname||'', songs:(pl.tracks||[]).map(s=>({ id:s.id, name:s.name, artist:(s.ar||s.artists||[]).map(a=>a.name).join('/'), album:((s.al||s.album||{}).name)||'', duration:s.dt||s.duration })) });
    } catch(e) { return sendJSON(res, { error: '获取歌单失败' }, 502); }
  }

  /* —— 日推（模拟：搜索多个不同关键词返回多样歌曲）—— */
  if (p === '/api/daily') {
    const pools = [
      '晴天 周杰伦','遇见 孙燕姿','慢慢喜欢你','起风了','你的答案','爱人错过',
      '想见你想见你想见你','某种老朋友','海阔天空 Beyond','红豆 王菲',
      '平凡之路 朴树','南山南 马頔','成都 赵雷','理想三旬 陈鸿宇',
      '夜曲 周杰伦','小幸运 田馥甄','后来 刘若英','那些年 胡夏',
      '岁月神偷 金玟岐','漂洋过海来看你 李宗盛','匆匆那年 王菲',
      '追光者 岑宁儿','晴天 周杰伦','七里香 周杰伦','稻香 周杰伦',
      '告白气球 周杰伦','体面 于文文','消愁 毛不易','像鱼 王贰浪',
      '孤勇者 陈奕迅','好久不见 陈奕迅','富士山下 陈奕迅',
    ];
    // 随机打乱，选3个不同关键词，每个搜2首
    const shuffled = pools.sort(() => Math.random() - 0.5);
    const keywords = shuffled.slice(0, 3);
    try {
      const allSongs = [];
      for (const kw of keywords) {
        const r = await fetchJSON(`https://music.163.com/api/search/get?s=${encodeURIComponent(kw)}&type=1&limit=2&offset=0`);
        const list = r.data?.result?.songs || [];
        allSongs.push(...list);
      }
      // 去重（按歌曲ID）
      const seen = new Set();
      const unique = allSongs.filter(s => { if (seen.has(s.id)) return false; seen.add(s.id); return true; });
      // 取前8首
      const songs = unique.slice(0, 8);
      const picMap = await fetchSongPicUrls(songs.map(s => s.id));
      return sendJSON(res, { songs: songs.map(s => ({ id:s.id, name:s.name, artist:(s.artists||[]).map(a=>a.name).join('/'), album:(s.album||{}).name||'', duration:s.duration, picUrl:picMap[s.id]||'' })) });
    } catch(e) { return sendJSON(res, { songs: [] }); }
  }

  /* —— 推荐歌曲（与日推不同关键词）—— */
  if (p === '/api/recommend') {
    const pools = [
      '光年之外 邓紫棋','说好不哭 周杰伦','年少有为 李荣浩','不将就 李荣浩',
      '演员 薛之谦','认真的雪 薛之谦','绅士 薛之谦','像风一样 自由',
      '蓝莲花 许巍','故乡 许巍','曾经的你 许巍','飞得更高 汪峰',
      '春天里 汪峰','怒放的生命 汪峰','倒带 蔡依林','爱情36计 蔡依林',
      '日不落 蔡依林','说散就散 袁娅维','绿色 陈雪凝','你的酒馆对我打了烊 陈雪凝',
      '下山 霍尊','左手指月 萨顶顶','大鱼 周深','达拉崩吧 周深',
      '漠河舞厅 柳爽','安和桥 宋冬野','董小姐 宋冬野','斑马斑马 宋冬野',
      '白鸽 伍佰','挪威的森林 伍佰','突然的自我 伍佰',
    ];
    const shuffled = pools.sort(() => Math.random() - 0.5);
    const keywords = shuffled.slice(0, 3);
    try {
      const allSongs = [];
      for (const kw of keywords) {
        const r = await fetchJSON(`https://music.163.com/api/search/get?s=${encodeURIComponent(kw)}&type=1&limit=3&offset=0`);
        const list = r.data?.result?.songs || [];
        allSongs.push(...list);
      }
      const seen = new Set();
      const unique = allSongs.filter(s => { if (seen.has(s.id)) return false; seen.add(s.id); return true; });
      const songs = unique.slice(0, 8);
      const picMap = await fetchSongPicUrls(songs.map(s => s.id));
      return sendJSON(res, { songs: songs.map(s => ({ id:s.id, name:s.name, artist:(s.artists||[]).map(a=>a.name).join('/'), album:(s.album||{}).name||'', duration:s.duration, picUrl:picMap[s.id]||'' })) });
    } catch(e) { return sendJSON(res, { songs: [] }); }
  }

  /* —— 扫码登录：获取二维码key —— */
  if (p === '/api/qr/key') {
    try {
      const r = await fetchJSON('https://music.163.com/api/login/qrcode/unikey?type=1');
      const unikey = r.data?.unikey;
      if (!unikey) return sendJSON(res, { error: '获取二维码key失败' }, 502);
      const qrUrl = `https://music.163.com/login?codekey=${unikey}`;
      return sendJSON(res, { key: unikey, qrUrl });
    } catch(e) { return sendJSON(res, { error: '获取二维码key失败: ' + e.message }, 502); }
  }

  /* —— 二维码图片代理（用第三方API生成） —— */
  if (p === '/api/qr/img') {
    const text = parsed.query.text; if (!text) return sendJSON(res, { error: '缺少 text' }, 400);
    try {
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
      const u2 = new URL(qrApiUrl);
      const socket = await createConnection(u2.hostname, 443);
      const reqLines = [`GET ${u2.pathname}${u2.search} HTTP/1.1`, `Host: ${u2.host}`, 'User-Agent: Mozilla/5.0', 'Connection: close', '', ''];
      socket.write(reqLines.join('\r\n'));
      let raw = Buffer.alloc(0);
      socket.on('data', c => { raw = Buffer.concat([raw, c]); });
      socket.on('end', () => {
        const idx = raw.indexOf('\r\n\r\n');
        if (idx < 0) { res.writeHead(502); res.end(); return; }
        const headerStr = raw.slice(0, idx).toString();
        const body = raw.slice(idx + 4);
        const ct = headerStr.match(/content-type:\s*(.+)/i);
        if (ct) res.setHeader('Content-Type', ct[1].trim());
        res.setHeader('Cache-Control', 'public, max-age=60');
        res.writeHead(200);
        res.end(body);
      });
      socket.on('error', () => { res.writeHead(502); res.end(); });
      socket.setTimeout(8000, () => { socket.destroy(); res.writeHead(504); res.end(); });
    } catch(e) { sendJSON(res, { error: '生成二维码失败' }, 502); }
  }

  /* —— 扫码登录：检查扫码状态 —— */
  if (p === '/api/qr/check') {
    const key = parsed.query.key; if (!key) return sendJSON(res, { error: '缺少 key' }, 400);
    try {
      const r = await fetchJSONWithCookie(`https://music.163.com/api/login/qrcode/client/login?type=1&key=${encodeURIComponent(key)}`);
      const code = r.data?.code;
      // 800=过期, 801=等待扫码, 802=待确认, 803=登录成功
      if (code === 803 && r.cookies && r.cookies.length > 0) {
        // 登录成功，保存cookie
        const newCookie = r.cookies.join('; ');
        COOKIE = newCookie;
        try { fs.writeFileSync(cookieFile, newCookie); } catch(e) {}
        // 获取用户信息
        let nickname = '';
        try {
          const acc = await fetchJSON('https://music.163.com/api/nuser/account');
          nickname = acc.data?.account?.nickname || '';
        } catch(e) {}
        return sendJSON(res, { code: 803, message: '登录成功', nickname });
      }
      return sendJSON(res, { code, message: code === 800 ? '二维码已过期' : code === 801 ? '等待扫码' : '已扫码，待确认' });
    } catch(e) { return sendJSON(res, { code: 800, message: '检查失败' }); }
  }

  /* —— 扫码登录：获取登录状态cookie —— */
  if (p === '/api/qr/cookie') {
    try {
      const r = await fetchJSON('https://music.163.com/api/nuser/account');
      const account = r.data?.account;
      if (account) {
        return sendJSON(res, { loggedIn: true, nickname: account.nickname || '', userId: account.id });
      }
      return sendJSON(res, { loggedIn: false });
    } catch(e) { return sendJSON(res, { loggedIn: false }); }
  }

  sendJSON(res, { error: '未知接口：' + p }, 404);
});

server.listen(PORT, () => {
  console.log(`\n  ♪ 音乐伴侣 · 后端已启动`);
  console.log(`  地址: http://localhost:${PORT}`);
  console.log(`  代理: ${PROXY ? '走系统代理' : '直连'} | Cookie: ${COOKIE ? '已加载' : '未设置'}\n`);
});

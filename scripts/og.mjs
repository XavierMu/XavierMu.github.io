/**
 * 生成 OG 分享图（1200×630）。
 *
 * 默认图给首页/列表页用，文章图带标题，让分享卡片有具体信息。
 * 用 Playwright 渲染 HTML 后截图，无需额外依赖。
 *
 * 用法：node scripts/og.mjs  （构建前运行，输出到 public/og/）
 */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const OUT = join(ROOT, 'public', 'og');
const BLOG = join(ROOT, 'src', 'content', 'blog');

mkdirSync(OUT, { recursive: true });

/** 从文章 md 里取 title / description */
function readFrontmatter(file) {
  const text = readFileSync(file, 'utf8');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fm = m ? m[1] : '';
  const get = (k) => {
    const r = fm.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'));
    if (!r) return '';
    return r[1].trim().replace(/^["']|["']$/g, '');
  };
  return { title: get('title'), description: get('description') };
}

const TITLE_PX = 1000; // 1200 - 88*2 的可用宽度，再留一点余量
const ASCII_RE = /[\x00-\xff]/;
const BREAK_PUNCT = '，。：；、—？！';
/** 估算字符串宽度（单位 em）：ASCII 约 0.55，中文按 1 */
const emOf = (s) => [...s].reduce((w, c) => w + (ASCII_RE.test(c) ? 0.55 : 1), 0);

/**
 * 分享图标题排版：优先单行（自动缩字号），放不下再在标点处断成两行。
 * 之前按固定 16 字折行，会和单行 70px 的预算打架——15 个字就溢出，
 * 于是浏览器自己乱断，出现「……以守望先锋 / 为例」这种孤字行。
 */
function layoutTitle(title) {
  const total = emOf(title);
  const oneLine = Math.min(70, Math.floor(TITLE_PX / total));
  if (oneLine >= 48) return { lines: [title], size: oneLine };

  let best = null;
  for (let i = 0; i < title.length - 1; i++) {
    if (!BREAK_PUNCT.includes(title[i])) continue;
    let cut = i + 1;
    // 连续标点一起留在上一行，别让「：」跑到下一行行首
    while (cut < title.length && BREAK_PUNCT.includes(title[cut])) cut++;
    const a = title.slice(0, cut);
    const b = title.slice(cut);
    if (!b.trim()) continue;
    const size = Math.min(64, Math.floor(TITLE_PX / Math.max(emOf(a), emOf(b))));
    if (size < 40) continue;
    const score = Math.abs(emOf(a) - emOf(b));
    if (!best || score < best.score) best = { lines: [a, b], size, score };
  }
  if (best) return best;

  return { lines: wrapTitle(title, 15), size: 52 };
}

/** 按字符数粗略折行，最多 3 行（给没有合适标点的长标题兜底） */
function wrapTitle(title, maxPerLine = 16) {
  if (title.length <= maxPerLine) return [title];

  const lines = [];
  let rest = title;
  while (rest.length > 0 && lines.length < 3) {
    if (rest.length <= maxPerLine) {
      lines.push(rest);
      break;
    }
    // 优先在标点处断行；断点取标点之后，避免标点落到下一行行首
    let cut = maxPerLine;
    const punct = ['，', '。', '：', '；', '、', ' ', '—'];
    for (let i = maxPerLine; i > maxPerLine - 8 && i > 0; i--) {
      if (punct.includes(rest[i])) {
        cut = i + 1;
        break;
      }
    }
    // 避免把左括号留在行尾（左括号后应跟内容）
    if ('（【「《'.includes(rest[cut - 1])) {
      cut = Math.max(1, cut - 1);
    }
    // 避免右括号落到行首：把它拽回上一行
    if (cut < rest.length && '）」』》'.includes(rest[cut])) {
      cut += 1;
    }
    lines.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  if (rest.length > 0 && lines.length === 3) {
    lines[2] = lines[2].slice(0, maxPerLine - 1) + '…';
  }
  return lines;
}

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** 文章图模板 */
function articleHtml({ title, description }) {
  const { lines, size } = layoutTitle(title);
  const titleHtml = lines.map((l) => esc(l)).join('<br />');

  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1200px;height:630px}
body{background:#fdfdfc;color:#1a1a1a;font-family:"Noto Serif SC","Songti SC","SimSun",Georgia,serif;
  display:flex;flex-direction:column;justify-content:space-between;padding:76px 88px;position:relative}
.rule{position:absolute;top:0;left:88px;right:88px;height:1px;background:#e5e4e2}
.brand{font-size:28px;font-weight:600;letter-spacing:.02em}
.main{flex:1;display:flex;flex-direction:column;justify-content:center;gap:24px}
.title{font-size:${size}px;font-weight:600;line-height:1.28;letter-spacing:.01em}
.desc{font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif;font-size:24px;color:#6b6b6b;line-height:1.5;max-width:960px}
.footer{display:flex;justify-content:space-between;align-items:baseline;
  font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif;font-size:20px;color:#9e9e9e}
.url{font-family:"Cascadia Code",Consolas,monospace;font-size:19px}
</style></head>
<body>
  <div class="rule"></div>
  <div class="brand">慕</div>
  <div class="main">
    <div class="title">${titleHtml}</div>
    <div class="desc">${esc(description)}</div>
  </div>
  <div class="footer"><span class="url">xaviermu.github.io</span><span>${lines.length > 1 ? '' : '文章'}</span></div>
</body></html>`;
}

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();

async function shoot(html, outPath) {
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(150);
  await page.screenshot({ path: outPath, type: 'png' });
}

// 1. 默认图
const defaultTpl = readFileSync(join(ROOT, 'scripts', 'og-template.html'), 'utf8');
await shoot(defaultTpl, join(OUT, 'default.png'));
console.log('OK  default.png');

// 2. 每篇文章
const dirs = readdirSync(BLOG).filter((d) => {
  const p = join(BLOG, d);
  return existsSync(join(p, 'index.md')) || existsSync(join(p, 'index.mdx'));
});

for (const d of dirs) {
  const md = existsSync(join(BLOG, d, 'index.md'))
    ? join(BLOG, d, 'index.md')
    : join(BLOG, d, 'index.mdx');
  const { title, description } = readFrontmatter(md);
  if (!title) continue;
  await shoot(articleHtml({ title, description }), join(OUT, `${d}.png`));
  console.log(`OK  ${d}.png  (${title})`);
}

await browser.close();
console.log(`\n完成：${dirs.length + 1} 张，输出到 public/og/`);

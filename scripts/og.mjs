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
 * 于是浏览器自己乱断，出现「……：以某三个字 / 为例」这种孤字行。
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

/** 文章图模板：与站点同一套视觉语言（网格底、紧排无衬线大标题、等宽 kicker） */
function articleHtml({ title, description }) {
  const { lines, size } = layoutTitle(title);
  const titleHtml = lines.map((l) => esc(l)).join('<br />');

  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1200px;height:630px}
body{background:#fff;color:#0a0a0a;overflow:hidden;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif}
.grid{position:absolute;inset:0;
  background-image:linear-gradient(to right,rgba(10,10,10,.06) 1px,transparent 1px),
    linear-gradient(to bottom,rgba(10,10,10,.06) 1px,transparent 1px);
  background-size:64px 64px;
  -webkit-mask-image:radial-gradient(115% 85% at 30% 0%,#000 15%,transparent 74%);
  mask-image:radial-gradient(115% 85% at 30% 0%,#000 15%,transparent 74%)}
.inner{position:relative;display:flex;flex-direction:column;justify-content:space-between;
  height:100%;padding:72px 80px}
.top{display:flex;align-items:center;gap:12px;font-size:26px;font-weight:660;letter-spacing:-.01em}
.mark{width:14px;height:14px;border-radius:3px;background:#0a0a0a}
.main{display:flex;flex-direction:column;gap:22px}
.kicker{font-family:ui-monospace,"Cascadia Mono",Consolas,monospace;font-size:16px;
  font-weight:600;letter-spacing:.08em;color:#737373}
.title{font-size:${size}px;font-weight:660;line-height:1.16;letter-spacing:-.022em;max-width:960px}
.desc{font-size:25px;color:#525252;line-height:1.5;max-width:900px}
.footer{display:flex;justify-content:space-between;align-items:baseline;
  font-size:20px;color:#737373;padding-top:26px;border-top:1px solid #e5e5e5}
.url{font-family:ui-monospace,"Cascadia Mono",Consolas,monospace;font-size:18px}
</style></head>
<body>
  <div class="grid"></div>
  <div class="inner">
    <div class="top"><span class="mark"></span><span>慕</span></div>
    <div class="main">
      <div class="kicker">ARTICLE</div>
      <div class="title">${titleHtml}</div>
      <div class="desc">${esc(description)}</div>
    </div>
    <div class="footer"><span class="url">xaviermu.github.io</span><span>记录折腾电脑和手机的过程</span></div>
  </div>
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

// 1. 默认图：一张没有具体文章的站点名片
const defaultTpl = readFileSync(join(ROOT, 'scripts', 'og-template.html'), 'utf8')
  .replace('{{KICKER}}', 'SITE')
  .replace('{{TITLE}}', esc('记录折腾电脑和手机的过程'))
  .replace('{{DESC}}', esc('教程、实验与踩坑记录。'));
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

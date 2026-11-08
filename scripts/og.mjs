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

/** 按字符数粗略折行，中文 16 字/行，最多 3 行 */
function wrapTitle(title) {
  const maxPerLine = 16;
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
  const lines = wrapTitle(title);
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
.title{font-size:${lines.length >= 3 ? 58 : lines.length === 2 ? 64 : 70}px;font-weight:600;line-height:1.28;letter-spacing:.01em}
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

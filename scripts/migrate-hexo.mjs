/**
 * Hexo -> Astro 内容集合迁移
 *
 * 转换内容：
 *  1. frontmatter：categories/tags/toc -> Astro schema 字段，pubDate 取自 db.json
 *  2. {% img /image/xxx "说明" %} -> ![说明](./assets/xxx)  (Astro 会自动优化)
 *  3. <!-- more --> 删除
 *  4. 图片文件复制到 src/content/blog/<slug>/assets/
 *
 * 用法: node scripts/migrate-hexo.mjs
 */
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
  existsSync,
  rmSync,
} from 'node:fs';
import { dirname, basename, join } from 'node:path';

const HEXO = 'E:/Projects/Hexo-Blog';
const HEXO_POSTS = `${HEXO}/source/_posts`;
const HEXO_IMG = `${HEXO}/source/image`;
const DEST = 'E:/Projects/Blog/src/content/blog';

// 要迁移的文章：文件 -> 目标 slug
const PICK = [
  { file: 'TVBox类软件使用教程（手机端）——以OK影视为例.md', slug: 'tvbox-tutorial' },
  { file: 'Clash-Verge使用教程.md', slug: 'clash-verge-tutorial' },
  { file: 'Windows系统安装教程.md', slug: 'windows-install-tutorial' },
];

// ---------- 从 db.json 取日期 ----------
const db = JSON.parse(readFileSync(`${HEXO}/db.json`, 'utf8'));
const dbPosts = Object.values(db.models.Post);
const dateByTitle = new Map(
  dbPosts.map((p) => [p.title.trim(), p.date])
);

// ---------- 工具 ----------
function parseFrontmatter(text) {
  const m = text.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/);
  if (!m) return { fm: '', body: text };
  return { fm: m[1], body: text.slice(m[0].length) };
}

function fmValue(fm, key) {
  const m = fm.match(new RegExp(`^${key}:[ \\t]*(.*)$`, 'm'));
  return m ? m[1].trim() : '';
}

function parseList(fm, key) {
  const inline = fm.match(new RegExp(`^${key}:[ \\t]*\\[(.+?)\\]`, 'm'));
  if (inline) {
    return inline[1]
      .split(',')
      .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  }
  const block = fm.match(
    new RegExp(`^${key}:[ \\t]*\\r?\\n((?:[ \\t]*-[ \\t]*.+\\r?\\n?)+)`, 'm')
  );
  if (block) {
    return block[1]
      .split(/\r?\n/)
      .map((s) => s.replace(/^[ \t]*-[ \t]*/, '').trim())
      .filter(Boolean);
  }
  return [];
}

/** db.json 是 UTC，转成文章语义上的本地日期 */
function toLocalDate(iso) {
  const d = new Date(iso);
  // 加 8 小时得到北京时间语义的日期
  const local = new Date(d.getTime() + 8 * 3600 * 1000);
  return local.toISOString().slice(0, 10);
}

// ---------- 主流程 ----------
let totalImages = 0;
const report = [];

for (const { file, slug } of PICK) {
  const srcPath = join(HEXO_POSTS, file);
  if (!existsSync(srcPath)) {
    console.error(`缺失源文件: ${file}`);
    continue;
  }

  const raw = readFileSync(srcPath, 'utf8');
  const { fm, body } = parseFrontmatter(raw);

  const title = fmValue(fm, 'title').replace(/^['"]|['"]$/g, '');
  const categories = parseList(fm, 'categories');
  const tags = parseList(fm, 'tags');

  const isoDate = dateByTitle.get(title.trim());
  if (!isoDate) {
    console.warn(`  ! ${file} 未在 db.json 找到日期，跳过`);
    continue;
  }
  const pubDate = toLocalDate(isoDate);

  const descMatch = body.match(/^([\s\S]*?)(?:\n<!--\s*more\s*-->)/);
  let description = '';
  if (descMatch) {
    description = descMatch[1]
      .replace(/^#+\s*/gm, '')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\{%[^%]*%\}/g, '')
      .replace(/\*\*/g, '')
      .replace(/[*_`>]/g, '')
      .replace(/^\s*[-+]\s+/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  if (!description) description = `${title} —— 一篇迁移自旧站的教程。`;
  // 在句子边界截断，避免半句
  if (description.length > 100) {
    const cut = description.slice(0, 100);
    const lastStop = Math.max(
      cut.lastIndexOf('。'),
      cut.lastIndexOf('；'),
      cut.lastIndexOf('！'),
      cut.lastIndexOf('？')
    );
    description = lastStop > 40 ? cut.slice(0, lastStop + 1) : cut.replace(/[，、]$/, '') + '…';
  }

  // ---- 目录与图片 ----
  const outDir = join(DEST, slug);
  const assetDir = join(outDir, 'assets');
  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
  mkdirSync(assetDir, { recursive: true });

  let images = 0;
  const missing = [];

  // 替换 {% img ... %} 与裸 /image/ 引用
  let newBody = body;

  // 1) {% img /image/xxx "alt" %}
  newBody = newBody.replace(
    /\{%\s*img\s+([^\s%]+)\s*(?:"([^"]*)")?\s*%\}/g,
    (_m, url, alt = '') => {
      const rel = url.replace(/^\/?image\//, '');
      const srcFile = join(HEXO_IMG, rel);
      if (!existsSync(srcFile)) {
        missing.push(url);
        return `> 图片缺失：${url}`;
      }
      const name = basename(rel);
      const destFile = join(assetDir, name);
      if (!existsSync(destFile)) {
        copyFileSync(srcFile, destFile);
        images++;
      }
      const altText = (alt || name.replace(/\.[^.]+$/, '')).replace(/[\[\]]/g, '');
      return `![${altText}](./assets/${encodeURI(name)})`;
    }
  );

  // 2) 剩余的裸 /image/ 路径（可能出现在链接里）
  newBody = newBody.replace(/\/image\/([^\s)"'<>]+)/g, (m, rel) => {
    const srcFile = join(HEXO_IMG, rel);
    if (!existsSync(srcFile)) {
      missing.push(m);
      return m;
    }
    const name = basename(rel);
    const destFile = join(assetDir, name);
    if (!existsSync(destFile)) {
      copyFileSync(srcFile, destFile);
      images++;
    }
    return `./assets/${encodeURI(name)}`;
  });

  // 3) 删除 more 注释
  newBody = newBody.replace(/\n?<!--\s*more\s*-->\n?/g, '\n');

  // 4) 旧站绝对链接 -> 站内相对链接
  const LINK_MAP = {
    'Clash-Verge使用教程': '/blog/clash-verge-tutorial',
    'Windows系统安装教程': '/blog/windows-install-tutorial',
    'TVBox类软件使用教程（手机端）——以OK影视为例': '/blog/tvbox-tutorial',
  };
  newBody = newBody.replace(
    /https?:\/\/womuule\.github\.io\/\d{4}\/\d{2}\/\d{2}\/([^)\s]+?)\/?\)/g,
    (m, encoded) => {
      let decoded = encoded;
      try {
        decoded = decodeURIComponent(encoded);
      } catch {}
      const target = LINK_MAP[decoded];
      return target ? `${target})` : m;
    }
  );

  // ---- 生成 frontmatter ----
  const allTags = [...new Set([...categories, ...tags])].filter(Boolean);
  const tagStr = allTags.map((t) => JSON.stringify(t)).join(', ');

  const fmOut = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(description)}`,
    `pubDate: ${pubDate}`,
    `tags: [${tagStr}]`,
    '---',
    '',
  ].join('\n');

  writeFileSync(join(outDir, 'index.md'), fmOut + newBody.trimStart(), 'utf8');

  totalImages += images;
  report.push({ title, slug, pubDate, images, missing: missing.length });
  console.log(
    `OK  ${pubDate}  ${slug.padEnd(26)} 图片 ${String(images).padStart(2)}  ${title}`
  );
  if (missing.length) console.warn(`    缺失图片: ${missing.join(', ')}`);
}

console.log(`\n完成：${report.length} 篇，复制图片 ${totalImages} 张`);

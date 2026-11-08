import { readFileSync, readdirSync, statSync } from 'node:fs';

const HEXO = 'E:/Projects/Hexo-Blog';
const SRC = `${HEXO}/source/_posts`;

const db = JSON.parse(readFileSync(`${HEXO}/db.json`, 'utf8'));
const posts = Object.values(db.models.Post);
const byTitle = new Map(posts.map((p) => [p.title.trim(), p]));

const files = readdirSync(SRC).filter((f) => f.endsWith('.md'));

const rows = [];
for (const f of files) {
  const text = readFileSync(`${SRC}/${f}`, 'utf8');
  const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fm = fmMatch ? fmMatch[1] : '';
  const titleMatch = fm.match(/^title:\s*(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim().replace(/^['"]|['"]$/g, '') : f;

  const cats = [...fm.matchAll(/^-\s*(.+)$/gm)].map((m) => m[1].trim());
  const tagMatch = fm.match(/^tags:\s*\[(.+)\]$/m);
  const tags = tagMatch
    ? tagMatch[1].split(',').map((s) => s.trim())
    : [...fm.matchAll(/^tags:[ \t]*\r?\n((?:[ \t]*-[ \t]*.+\r?\n?)+)/gm)]
        .flatMap((m) => m[1].split(/\r?\n/).map((s) => s.replace(/^[ \t]*-[ \t]*/, '').trim()))
        .filter(Boolean);

  const meta = byTitle.get(title.trim());
  const date = meta ? meta.date.slice(0, 10) : '?';

  const imgs = new Set();
  for (const m of text.matchAll(/\/image\/[^\s)"']+/g)) imgs.add(m[0]);
  for (const m of text.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
    const u = m[1].trim();
    if (u.startsWith('/image/')) imgs.add(u);
  }

  const chars = text.length;
  rows.push({ file: f, title: title.trim(), date, cat: cats[0] ?? '', tags: tags.join('/'), imgs: imgs.size, chars });
}

rows.sort((a, b) => a.date.localeCompare(b.date));

let i = 0;
console.log('序号 | 日期       | 分类 | 标签                     | 图 | 字数 | 标题');
console.log('-'.repeat(110));
for (const r of rows) {
  i++;
  console.log(
    `${String(i).padStart(3)}  | ${r.date} | ${(r.cat || '-').padEnd(4)} | ${r.tags.padEnd(24)} | ${String(r.imgs).padStart(2)} | ${String(r.chars).padStart(4)} | ${r.title}`
  );
}
console.log(`\n共 ${rows.length} 篇`);

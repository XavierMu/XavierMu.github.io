import { chromium } from 'playwright';

const BASE = 'http://localhost:4322';
const browser = await chromium.launch();
const results = [];
const check = (name, ok, detail = '') =>
  results.push({ name, ok, detail });

// ---------- 桌面：主题切换 ----------
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.goto(BASE + '/', { waitUntil: 'networkidle' });

const initial = await page.evaluate(() => document.documentElement.dataset.theme);
check('初始主题已设置', ['light', 'dark'].includes(initial), initial);

const bgBefore = await page.evaluate(() =>
  getComputedStyle(document.body).backgroundColor
);

await page.click('#theme-toggle');
await page.waitForTimeout(300);
const after = await page.evaluate(() => document.documentElement.dataset.theme);
const bgAfter = await page.evaluate(() =>
  getComputedStyle(document.body).backgroundColor
);
check('点击后主题翻转', initial !== after, `${initial} -> ${after}`);
check('背景色随之改变', bgBefore !== bgAfter, `${bgBefore} -> ${bgAfter}`);

const stored = await page.evaluate(() => localStorage.getItem('theme'));
check('主题写入 localStorage', stored === after, String(stored));

// 刷新后保持
await page.reload({ waitUntil: 'networkidle' });
const persisted = await page.evaluate(() => document.documentElement.dataset.theme);
check('刷新后主题保持', persisted === after, `${after} -> ${persisted}`);

// ---------- 导航与链接完整性 ----------
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
const links = await page.$$eval('a[href^="/"]', (as) =>
  [...new Set(as.map((a) => a.getAttribute('href')))]
);
const broken = [];
for (const href of links) {
  const res = await page.request.get(BASE + href);
  if (res.status() >= 400) broken.push(`${href} -> ${res.status()}`);
}
check('站内链接无死链', broken.length === 0, broken.join(', ') || `${links.length} 个链接`);

// ---------- 单 h1 / 语义 ----------
for (const p of ['/', '/blog', '/about', '/blog/sdust-webvpn-guide']) {
  await page.goto(BASE + p, { waitUntil: 'networkidle' });
  const h1 = await page.$$eval('h1', (els) => els.length);
  const lang = await page.getAttribute('html', 'lang');
  check(`${p} 有且仅有一个 h1`, h1 === 1, `h1=${h1}`);
  check(`${p} lang 属性正确`, lang === 'zh-CN', String(lang));
}

// ---------- 正文 Markdown 残留 ----------
// 中文紧贴 ** 时 CommonMark 可能不认emphasis，会在页面上露出字面 **，构建不报错
const residual = [];
for (const p of [
  '/blog/sdust-webvpn-guide',
  '/blog/tvbox-tutorial',
  '/blog/clash-verge-tutorial',
  '/blog/windows-install-tutorial',
]) {
  await page.goto(BASE + p, { waitUntil: 'networkidle' });
  const text = await page.evaluate(
    () => document.querySelector('.prose')?.innerText ?? ''
  );
  const hits = ['**', '{%', '<!--', '](http'].filter((m) => text.includes(m));
  if (hits.length) residual.push(`${p}: ${hits.join(' ')}`);
}
check('正文无 Markdown 残留', residual.length === 0, residual.join('; ') || 'ok');

// ---------- 键盘可达性 ----------
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.keyboard.press('Tab');
const firstFocus = await page.evaluate(() => {
  const el = document.activeElement;
  return el ? `${el.tagName}:${el.textContent?.trim().slice(0, 20)}` : 'none';
});
check('Tab 能聚焦到首个元素', firstFocus !== 'none', firstFocus);

const outline = await page.evaluate(() => {
  const el = document.activeElement;
  return el ? getComputedStyle(el).outlineWidth : 'none';
});
check('焦点有可见轮廓', outline !== '0px' && outline !== 'none', outline);

// ---------- 移动端无横向滚动 ----------
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mpage = await mctx.newPage();
for (const p of ['/', '/blog', '/about', '/projects', '/tags', '/archive', '/search', '/blog/tvbox-tutorial']) {
  await mpage.goto(BASE + p, { waitUntil: 'networkidle' });
  const overflow = await mpage.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1
  );
  check(`${p} 移动端无横向溢出`, !overflow, overflow ? '有溢出' : 'ok');
}

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log('\n===== 结果 =====');
for (const r of results) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}  ${r.detail}`);
}
console.log(`\n通过 ${results.length - failed.length}/${results.length}`);
if (failed.length) process.exitCode = 1;




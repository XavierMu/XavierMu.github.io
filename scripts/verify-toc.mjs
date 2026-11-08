import { chromium } from 'playwright';

const BASE = 'http://localhost:4322';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const url = `${BASE}/blog/clash-verge-tutorial`;
await page.goto(url, { waitUntil: 'networkidle' });

const results = [];
const ok = (n, c, d = '') => {
  if (!c) results.push(`${n} ${d}`);
  console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`);
};

// 1. 目录存在且可见
const tocVisible = await page.isVisible('.toc');
ok('目录在大屏可见', tocVisible);

// 2. 条目数
const count = await page.$$eval('[data-toc-target]', (a) => a.length);
ok('目录条目数 = h2 数 8', count === 8, `实际 ${count}`);

// 3. 初始状态有一个 active
const initActive = await page.$$eval('.toc-link.is-active', (a) => a.map((x) => x.dataset.tocTarget));
ok('初始有高亮项', initActive.length >= 1, `[${initActive.join(',')}]`);

// 4. 点击目录跳到锚点（用 evaluate 避免中文选择器转义问题）
const target = await page.$eval('[data-toc-target]', (a) => a.dataset.tocTarget);
await page.evaluate((t) => {
  const link = document.querySelector(`[data-toc-target="${t}"]`);
  link?.click();
}, target);
await page.waitForTimeout(900);
const scrolled = await page.evaluate(() => window.scrollY);
ok('点击目录后页面滚动', scrolled > 100, `scrollY=${scrolled}`);

// 5. 滚动到不同位置，高亮应变化
const activeAt = async (y) => {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(700);
  return page.$$eval('.toc-link.is-active', (a) => a.map((x) => x.dataset.tocTarget));
};

const top = await activeAt(0);
const mid = await activeAt(2500);
const bottom = await activeAt(99999);

console.log(`  顶部高亮: ${top.join(',') || '(无)'}`);
console.log(`  中部高亮: ${mid.join(',') || '(无)'}`);
console.log(`  底部高亮: ${bottom.join(',') || '(无)'}`);

ok('滚动后高亮发生变化', JSON.stringify(top) !== JSON.stringify(mid));
ok('始终最多一个高亮', top.length <= 1 && mid.length <= 1 && bottom.length <= 1);

// 6. 锚点目标存在
const missing = await page.evaluate(() => {
  return [...document.querySelectorAll('[data-toc-target]')]
    .map((a) => a.dataset.tocTarget)
    .filter((id) => !document.getElementById(id));
});
ok('所有锚点目标存在', missing.length === 0, missing.join(','));

// 7. 窄屏隐藏
await page.setViewportSize({ width: 1100, height: 900 });
await page.waitForTimeout(400);
const hiddenToc = await page.isVisible('.toc');
ok('窄屏(<1280)目录隐藏', !hiddenToc);

await browser.close();
console.log(`\n${results.length === 0 ? '全部通过' : results.length + ' 项失败'}`);
process.exitCode = results.length ? 1 : 0;

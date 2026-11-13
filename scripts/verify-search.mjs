/**
 * 搜索模态框验证。
 *
 * 依赖：`pnpm preview` 已在 4322 端口运行（Pagefind 索引来自 dist/，dev 模式下没有）。
 * 用法：node scripts/verify-search.mjs
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:4322';
const browser = await chromium.launch();
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`);
};

const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();

const isOpen = () => page.evaluate(() => document.getElementById('search-modal')?.open === true);
const activeIndex = () =>
  page.$$eval('.search-modal__result', (els) => els.findIndex((e) => e.classList.contains('is-active')));

// ---------- 唤起 ----------
await page.goto(BASE + '/blog', { waitUntil: 'networkidle' });
check('初始关闭', !(await isOpen()));

await page.keyboard.press('/');
await page.waitForTimeout(500);
check('按 / 打开', await isOpen());

const focusedId = await page.evaluate(() => document.activeElement?.id);
check('输入框自动聚焦', focusedId === 'search-modal-input', String(focusedId));

// ---------- 搜索与渲染 ----------
await page.fill('#search-modal-input', 'Windows');
await page.waitForTimeout(1800);

const count = await page.$$eval('.search-modal__result', (els) => els.length);
check('能搜到结果', count > 0, `${count} 条`);

const countText = (await page.textContent('#search-modal-count')) ?? '';
check('结果计数正确', /找到 \d+ 条结果/.test(countText), countText);

const marks = await page.$$eval('.search-modal__result-excerpt mark', (els) => els.length);
check('摘要高亮命中词', marks > 0, `${marks} 处`);

/*
 * 结果节点是 innerHTML 注入的，Astro 的 scoped 样式加不上，
 * 必须靠 :global。这里断言标题确实是块级——如果退回 inline，两者会挤成一行。
 */
const titleDisplay = await page.$eval('.search-modal__result-title', (el) => getComputedStyle(el).display);
check('结果标题为块级（scoped 泄漏检查）', titleDisplay === 'block', titleDisplay);

// ---------- 键盘导航 ----------
check('默认选中第一条', (await activeIndex()) === 0);

await page.keyboard.press('ArrowDown');
await page.waitForTimeout(150);
check('下键移到第二条', (await activeIndex()) === 1);

await page.keyboard.press('ArrowDown');
await page.keyboard.press('ArrowUp');
await page.waitForTimeout(150);
check('上下键往返正确', (await activeIndex()) === 1);

// ---------- Enter 跳转 ----------
const target = await page.$eval(
  '.search-modal__result.is-active .search-modal__result-link',
  (a) => a.getAttribute('href')
);
await page.keyboard.press('Enter');
await page.waitForTimeout(1400);
check('Enter 打开选中项', page.url().includes(target.replace(/\/$/, '')), page.url());

// ---------- 关闭与重置 ----------
await page.keyboard.press('/');
await page.waitForTimeout(400);
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
check('Esc 关闭', !(await isOpen()));

await page.keyboard.press('/');
await page.waitForTimeout(400);
check('重开后输入框清空', (await page.inputValue('#search-modal-input')) === '');
const hintVisible = await page.evaluate(() => {
  const h = document.getElementById('search-modal-hint');
  return h ? !h.hidden : false;
});
check('重开后显示快捷键提示', hintVisible);

// ---------- Ctrl+K ----------
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
await page.keyboard.press('Control+k');
await page.waitForTimeout(400);
check('Ctrl+K 打开', await isOpen());

// ---------- 无结果 ----------
await page.fill('#search-modal-input', 'zzzz不存在的词zzzz');
await page.waitForTimeout(1600);
const emptyShown = await page.evaluate(() => {
  const e = document.getElementById('search-modal-empty');
  return e ? !e.hidden && (e.textContent || '').length > 0 : false;
});
check('无结果给提示', emptyShown);

// ---------- 点背景关闭 ----------
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
await page.keyboard.press('/');
await page.waitForTimeout(400);
await page.mouse.click(20, 20);
await page.waitForTimeout(400);
check('点背景关闭', !(await isOpen()));

// ---------- 输入框内按 / 不触发 ----------
await page.keyboard.press('/');
await page.waitForTimeout(400);
await page.type('#search-modal-input', '/');
check('输入框内按 / 正常输入', (await page.inputValue('#search-modal-input')) === '/');

// ---------- 降级页仍可用 ----------
await page.goto(BASE + '/search', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const fallback = await page.evaluate(() => !!document.querySelector('.pagefind-ui__search-input'));
check('/search 降级页可用', fallback);

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n通过 ${results.length - failed.length}/${results.length}`);
process.exitCode = failed.length ? 1 : 0;

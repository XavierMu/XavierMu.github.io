import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:4322';
const OUT = '.tmp/shots';
mkdirSync(OUT, { recursive: true });

const targets = [
  { path: '/', name: 'home', full: false },
  { path: '/', name: 'home-full', full: true },
  { path: '/blog', name: 'blog' },
  { path: '/blog/raft-log-replication', name: 'post' },
  { path: '/projects', name: 'projects' },
  { path: '/projects/mini-kv', name: 'project-detail' },
  { path: '/about', name: 'about' },
];

const browser = await chromium.launch();

for (const theme of ['light', 'dark']) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: theme,
  });
  const page = await context.newPage();

  for (const t of targets) {
    await page.goto(BASE + t.path, { waitUntil: 'networkidle' });
    // 强制主题，避免依赖系统偏好
    await page.evaluate((th) => {
      document.documentElement.dataset.theme = th;
    }, theme);
    await page.waitForTimeout(250);
    const file = `${OUT}/${theme}-${t.name}.png`;
    await page.screenshot({ path: file, fullPage: t.full === true });
    console.log('saved', file);
  }

  // 移动端
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.evaluate((th) => {
    document.documentElement.dataset.theme = th;
  }, theme);
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}/${theme}-home-mobile.png`, fullPage: false });
  console.log('saved', `${OUT}/${theme}-home-mobile.png`);

  await context.close();
}

await browser.close();
console.log('done');

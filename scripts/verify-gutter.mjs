import { chromium } from 'playwright';

const B = 'http://localhost:4322';
const b = await chromium.launch();

// 强制经典滚动条（非 overlay），这样 clientWidth 会变小
const CLASSIC_SCROLLBAR = `
  ::-webkit-scrollbar { width: 17px; }
  ::-webkit-scrollbar-track { background: #eee; }
  ::-webkit-scrollbar-thumb { background: #999; }
`;

const PAGES = [
  ['首页(长)', '/'],
  ['文章列表(短)', '/blog'],
  ['归档(短)', '/archive'],
  ['文章详情(长)', '/blog/tvbox-tutorial'],
  ['关于(短)', '/about'],
];

for (const mode of ['修复前(无 gutter)', '修复后(有 gutter)']) {
  console.log(`\n========== ${mode} ==========`);
  const positions = [];

  for (const [label, path] of PAGES) {
    const c = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await c.newPage();
    await p.goto(B + path, { waitUntil: 'networkidle' });

    // 强制经典滚动条
    await p.addStyleTag({ content: CLASSIC_SCROLLBAR });

    if (mode === '修复前(无 gutter)') {
      await p.addStyleTag({ content: 'html { scrollbar-gutter: auto !important; }' });
    }

    await p.waitForTimeout(300);

    const d = await p.evaluate(() => {
      const doc = document.documentElement;
      return {
        logo: Math.round(document.querySelector('.brand').getBoundingClientRect().left),
        h1: Math.round(document.querySelector('.site-main h1').getBoundingClientRect().left),
        clientW: doc.clientWidth,
        gutter: window.innerWidth - doc.clientWidth,
        hasScroll: doc.scrollHeight > doc.clientHeight,
      };
    });

    positions.push({ label, ...d });
    console.log(
      `  ${label.padEnd(14)} logo左=${String(d.logo).padStart(4)}  H1左=${String(d.h1).padStart(4)}  滚动条=${d.gutter}px  可用宽=${d.clientW}`
    );
    await c.close();
  }

  const logos = positions.map((x) => x.logo);
  const spread = Math.max(...logos) - Math.min(...logos);
  console.log(`  → 偏移范围: ${spread}px ${spread === 0 ? '✓ 完全对齐' : '✗ 存在错位'}`);
}

await b.close();

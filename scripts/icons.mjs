/**
 * 从 favicon.svg 生成 favicon.ico 与 apple-touch-icon.png。
 * 用法：node scripts/icons.mjs
 */
import { chromium } from 'playwright';
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const svg = readFileSync(join(ROOT, 'public', 'favicon.svg'), 'utf8');

const browser = await chromium.launch();

// 用 Playwright 把 SVG 渲染成位图
async function renderPng(size, outPath, padding = 0) {
  const ctx = await browser.newContext({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  const inner = padding > 0 ? size * (1 - padding * 2) : size;
  await page.setContent(
    `<html><body style="margin:0;width:${size}px;height:${size}px;display:grid;place-items:center;background:transparent">
      <div style="width:${inner}px;height:${inner}px">${svg}</div>
    </body></html>`,
    { waitUntil: 'load' }
  );
  await page.waitForTimeout(120);
  await page.screenshot({ path: outPath, omitBackground: true });
  await ctx.close();
}

// apple-touch-icon：180×180，留边距（iOS 会自己加圆角）
await renderPng(180, join(ROOT, 'public', 'apple-touch-icon.png'), 0.1);
console.log('OK  apple-touch-icon.png (180×180)');

// favicon.ico：用 32×32 PNG 包装成 ICO（PNG-in-ICO，现代浏览器均支持）
const png32Path = join(ROOT, '.tmp', 'icon32.png');
await renderPng(32, png32Path);

const png = readFileSync(png32Path);
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: 1 = icon
header.writeUInt16LE(1, 4); // count

const entry = Buffer.alloc(16);
entry.writeUInt8(32, 0); // width
entry.writeUInt8(32, 1); // height
entry.writeUInt8(0, 2); // color palette
entry.writeUInt8(0, 3); // reserved
entry.writeUInt16LE(1, 4); // color planes
entry.writeUInt16LE(32, 6); // bits per pixel
entry.writeUInt32LE(png.length, 8); // size
entry.writeUInt32LE(22, 12); // offset (6 + 16)

writeFileSync(join(ROOT, 'public', 'favicon.ico'), Buffer.concat([header, entry, png]));
console.log('OK  favicon.ico (32×32)');

await browser.close();

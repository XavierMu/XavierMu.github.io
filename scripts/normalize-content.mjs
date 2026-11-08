/**
 * 迁移后规范化：把 Hexo 时代的内容整理成 Astro 内容集合的写作规范。
 *
 * 处理项：
 *  1. 标题层级：补齐跳跃（#### 起步 -> ## 起步），并整体下移一级
 *  2. 标题内加粗：## **xxx** -> ## xxx
 *  3. 图片文件名：中文/括号 -> 语义化 ASCII 名；保留 alt
 *  4. 中英文之间补空格
 *  5. 正文开头空行、连续空行压缩
 */
import { readFileSync, writeFileSync, renameSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'E:/Projects/Blog/src/content/blog';
const SLUGS = ['tvbox-tutorial', 'clash-verge-tutorial', 'windows-install-tutorial'];

// 中文图名 -> 语义化名字（按文章）
const RENAME = {
  'windows-install-tutorial': {
    'ITELLYOU官网系统选择.png': 'itellyou-iso-select.png',
    '微peu启动首页选择u盘.png': 'wepe-boot-menu.png',
    '微pe立即安装.png': 'wepe-install-now.png',
    '微pe等待安装完成.png': 'wepe-installing.png',
    '微pe安装完成.png': 'wepe-install-done.png',
    '语言选择.png': 'win-setup-language.png',
    '键盘输入法选择.png': 'win-setup-keyboard.png',
    '输入密钥.png': 'win-setup-product-key.png',
    '选择安装位置.png': 'win-setup-partition.png',
    '等待安装完成2.png': 'win-installing.png',
    'pe内setup安装.png': 'pe-run-setup.png',
    '安装版本选择.png': 'dism-deploy-version.png',
    '等待安装完成.png': 'dism-deploy-progress.png',
    '等待系统安装完成.png': 'win-setup-finishing.png',
    '首次启动.png': 'win-first-boot.png',
  },
  'clash-verge-tutorial': {
    'clash1.png': 'clash-config-proxy.png',
    'clash2.png': 'clash-proxy-mode.png',
    'clash3.png': 'clash-select-node.png',
    'clash4.png': 'clash-enable-proxy.png',
    'clash5.png': 'clash-subscription.png',
  },
  'tvbox-tutorial': {
    '首页1.jpeg': 'tvbox-home.jpeg',
    '直播.jpg': 'tvbox-live.jpg',
    '设置（已导入源）.jpg': 'tvbox-settings.jpg',
    '导入源.jpg': 'tvbox-import-source.jpg',
    '首页推荐源设置.jpg': 'tvbox-source-pan.jpg',
    '首页推荐源设置2.jpg': 'tvbox-source-parse.jpg',
    '首页推荐源设置3.jpg': 'tvbox-source-other.jpg',
    '网盘配置1.jpeg': 'tvbox-pan-login.jpeg',
    '网盘配置2.jpeg': 'tvbox-pan-method.jpeg',
    '播放1.jpeg': 'tvbox-player.jpeg',
  },
};

/** 中英文之间补空格（带保护规则，避免拆分专有名词） */
function cjkSpacing(text) {
  // 保护：先把不该被拆分的专有名词替换成占位符
  const PROTECT = [
    '微PE', '微pe', '微peu', 'PE工具箱', 'TVBox', 'OK影视', 'Dism++',
    'Clash Verge', 'ClashVerge', 'Surfboard', 'Magisk', 'LSPosed',
    'SimpleHook', 'Stable Diffusion', 'StableDiffusion', 'ComfyUI',
    'Windows', 'Linux', 'macOS', 'Android', 'Rufus', 'ITELLYOU',
    'JSON', 'CCTV', 'BIOS', 'UEFI', 'ISO', 'PE', 'U',
  ];
  const store = [];
  let guarded = text;
  PROTECT.forEach((word, i) => {
    const token = `\u0000P${i}\u0000`;
    const re = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    guarded = guarded.replace(re, () => {
      store.push(word);
      return `\u0000P${store.length - 1}\u0000`;
    });
  });

  const result = guarded
    .split(/\r?\n/)
    .map((line) => {
      if (/^\s*```/.test(line) || /^\s*\|?[\s:|-]+\|?\s*$/.test(line)) return line;
      let out = line;
      out = out.replace(/([\u4e00-\u9fa5])([A-Za-z0-9])/g, '$1 $2');
      out = out.replace(/([A-Za-z0-9])([\u4e00-\u9fa5])/g, '$1 $2');
      // 还原标点前后不该有的空格
      out = out.replace(/([\u4e00-\u9fa5]) ([，。！？；：、）】」』%])/g, '$1$2');
      out = out.replace(/([（【「『]) ([\u4e00-\u9fa5])/g, '$1$2');
      out = out.replace(/\] \(/g, '](');
      out = out.replace(/! \(/g, '!(');
      return out;
    })
    .join('\n');

  // 还原占位符
  return result.replace(/\u0000P(\d+)\u0000/g, (_m, i) => store[Number(i)]);
}

/** 标题内加粗 -> 纯文本 */
function stripBoldInHeadings(body) {
  return body
    .split(/\r?\n/)
    .map((line) => {
      const m = line.match(/^(#{1,6}\s+)(.*)$/);
      if (!m) return line;
      let text = m[2].trim();
      // 去掉包裹整体或局部的 **
      text = text.replace(/\*\*(.+?)\*\*/g, '$1');
      return m[1] + text;
    })
    .join('\n');
}

/** 标题层级：找最小层级，若 > 2 则整体上移到 2 */
function normalizeHeadingLevels(body) {
  const lines = body.split(/\r?\n/);
  const levels = [];
  for (const l of lines) {
    const m = l.match(/^(#{1,6})\s+\S/);
    if (m) levels.push(m[1].length);
  }
  if (!levels.length) return body;
  const min = Math.min(...levels);
  if (min <= 2) return body;
  const shift = min - 2;
  return lines
    .map((l) => {
      const m = l.match(/^(#{1,6})(\s+)(.*)$/);
      if (!m) return l;
      const nv = Math.max(2, m[1].length - shift);
      return '#'.repeat(Math.min(6, nv)) + m[2] + m[3];
    })
    .join('\n');
}

/** alt 文本规范化：不加多余空格，只做去噪 */
function cleanAlt(alt) {
  return alt
    .replace(/\s+/g, ' ')
    .replace(/([\u4e00-\u9fa5])\s+([\u4e00-\u9fa5])/g, '$1$2')
    .trim();
}

/** 重写图片引用：解码 -> 重命名文件 -> 写入 ASCII 路径 */
function rewriteImages(body, slug) {
  const dir = join(DIR, slug, 'assets');
  const map = RENAME[slug] ?? {};
  let renamed = 0;
  const missing = [];

  const out = body.replace(
    /!\[([^\]]*)\]\(\.\/assets\/([^)]+)\)/g,
    (_m, alt, encoded) => {
      let name = encoded;
      try {
        name = decodeURIComponent(encoded);
      } catch {}
      const target = map[name] ?? name;
      const srcPath = join(dir, name);
      const dstPath = join(dir, target);

      if (existsSync(srcPath) && name !== target) {
        if (!existsSync(dstPath)) renameSync(srcPath, dstPath);
        renamed++;
      } else if (!existsSync(srcPath) && !existsSync(dstPath)) {
        missing.push(name);
      }
      const altText = cleanAlt(alt) || target.replace(/\.[^.]+$/, '');
      return `![${altText}](./assets/${target})`;
    }
  );

  return { body: out, renamed, missing };
}

// ---------------- 主流程 ----------------
for (const slug of SLUGS) {
  const file = join(DIR, slug, 'index.md');
  let text = readFileSync(file, 'utf8');
  const fmMatch = text.match(/^(---\r?\n[\s\S]*?\r?\n---\r?\n)([\s\S]*)$/);
  if (!fmMatch) {
    console.warn(`跳过 ${slug}：未找到 frontmatter`);
    continue;
  }
  const [, fm, rawBody] = fmMatch;
  let body = rawBody;

  // 0. 规范化 frontmatter：description 与 title 的中英文空格
  const fixProse = (s) => {
    let d = s
      .replace(/([\u4e00-\u9fa5])([A-Za-z0-9])/g, '$1 $2')
      .replace(/([A-Za-z0-9])([\u4e00-\u9fa5])/g, '$1 $2');
    // 专有名词还原（不拆品牌）
    const KEEP = ['微PE', '微pe', 'TVBox', 'OK影视', 'Clash Verge', 'Dism++',
      'Windows', 'macOS', 'Linux', 'Android', 'Stable Diffusion', 'ComfyUI'];
    for (const k of KEEP) {
      const cjk = k.match(/^[\u4e00-\u9fa5]+/)?.[0];
      const ascii = k.match(/[A-Za-z][A-Za-z0-9+ ]*/)?.[0];
      if (cjk && ascii) {
        d = d.split(`${cjk} ${ascii.trim()}`).join(k);
      }
    }
    // 中文之间的多余空格
    d = d.replace(/([\u4e00-\u9fa5]) ([\u4e00-\u9fa5])/g, '$1$2');
    // 「中文 + 的/了/和/与…」之间的空格
    d = d.replace(/([\u4e00-\u9fa5]) (的|了|在|和|与|及|或|是|为|把|被|从|对)(?=[\u4e00-\u9fa5，。、）])/g, '$1$2');
    // 「内核 的」这类
    d = d.replace(/([A-Za-z\u4e00-\u9fa5]) 的(?=[\u4e00-\u9fa5])/g, '$1的');
    return d.trim();
  };

  const fmFixed = fm
    .replace(/^description:\s*"(.+)"$/m, (_m, desc) =>
      `description: ${JSON.stringify(fixProse(desc))}`)
    .replace(/^title:\s*"(.+)"$/m, (_m, t) =>
      `title: ${JSON.stringify(fixProse(t))}`);

  // 1. 中英文空格（在改写图片前做，避免影响路径）
  const beforeSpace = body;
  // 只对非图片/链接行处理空格，图片行单独处理
  body = body
    .split(/\r?\n/)
    .map((line) => {
      if (/!\[[^\]]*\]\([^)]*\)/.test(line)) {
        // 图片行的 alt 不做中英文加空格（截图说明是原文，不应改动）
        return line;
      }
      return cjkSpacing(line);
    })
    .join('\n');

  // 2. 标题加粗
  body = stripBoldInHeadings(body);

  // 3. 标题层级
  body = normalizeHeadingLevels(body);

  // 4. 图片重命名
  const imgResult = rewriteImages(body, slug);
  body = imgResult.body;

  // 4.5 加粗与中英文之间的空格：把行拆成「粗体段 / 普通段」后重建
  body = body
    .split(/\r?\n/)
    .map((line) => {
      if (/^\s*```/.test(line)) return line;

      // 拆分为 token：{bold:true/false, text}
      const tokens = [];
      const re = /\*\*([^*\n]+?)\*\*/g;
      let last = 0;
      let m;
      while ((m = re.exec(line)) !== null) {
        if (m.index > last) tokens.push({ bold: false, text: line.slice(last, m.index) });
        tokens.push({ bold: true, text: m[1].trim() });
        last = m.index + m[0].length;
      }
      if (last < line.length) tokens.push({ bold: false, text: line.slice(last) });
      if (tokens.length === 0) return line;

      // 重建：在中文与「粗体」交界处插入空格
      let out = '';
      const isCJK = (ch) => /[\u4e00-\u9fa5]/.test(ch);
      const needSpace = (a, b) => {
        if (!a || !b) return false;
        const l = a[a.length - 1];
        const r = b[0];
        if (/\s/.test(l) || /\s/.test(r)) return false;
        if (/[，。！？；：、）」』】》]/.test(r)) return false;
        if (/[（【「『《]/.test(l)) return false;
        return (isCJK(l) && /[A-Za-z0-9]/.test(r)) || (/[A-Za-z0-9]/.test(l) && isCJK(r));
      };

      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        const seg = t.bold ? `**${t.text}**` : t.text;
        const prevRaw = i > 0 ? tokens[i - 1] : null;
        const prevText = prevRaw ? (prevRaw.bold ? prevRaw.text : prevRaw.text) : '';

        if (needSpace(prevText, t.text)) out = out.replace(/\s*$/, '') + ' ';
        out += seg;
      }
      out = out.replace(/ {2,}/g, ' ');
      return out;
    })
    .join('\n');

  // 4.6 独立成行的加粗短句 -> 标题（层级跟随上一个小节标题 +1）
  {
    const lines = body.split(/\r?\n/);
    let lastLevel = 2;
    const out = [];
    for (const line of lines) {
      const hm = line.match(/^(#{1,6})\s+\S/);
      if (hm) {
        lastLevel = hm[1].length;
        out.push(line);
        continue;
      }
      const bm = line.match(/^\*\*([^*\n]{2,20})\*\*[ \t]*$/);
      if (bm) {
        const text = bm[1].trim();
        if (!/[，。！？；：、]/.test(text)) {
          const lvl = Math.min(6, lastLevel + 1);
          out.push('#'.repeat(lvl) + ' ' + text);
          continue;
        }
      }
      out.push(line);
    }
    body = out.join('\n');
  }

  // 5. 空行整理：去掉 frontmatter 后的多余空行，压缩连续空行
  body = body.replace(/^\s*\n+/, '');
  body = body.replace(/\n{3,}/g, '\n\n');
  body = body.replace(/\s+$/, '\n');

  writeFileSync(file, fmFixed + body, 'utf8');
  console.log(
    `OK  ${slug.padEnd(26)} 重命名图片 ${imgResult.renamed}` +
      (imgResult.missing.length ? `  缺失: ${imgResult.missing.join(', ')}` : '')
  );
}

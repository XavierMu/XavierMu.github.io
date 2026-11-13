/**
 * 从内容派生色调。
 *
 * 列表与卡片需要一点颜色来区分条目，但博客没有配图，也不该为每篇文章画一张。
 * 这里用「字符串 → 色调」的确定性映射：同样的输入永远得到同样的颜色，
 * 于是每篇文章、每个项目都有自己稳定的标识，刷新页面也不会变。
 *
 * 优先级：所属系列 > 首个标签 > slug。
 * 同一系列的文章会拿到同一个色，视觉上自然成组。
 */
import type { SeriesTone } from '../data/series';
import { getSeriesDef } from '../data/series';

const TONES: SeriesTone[] = ['blue', 'green', 'violet', 'amber', 'rose'];

/** FNV-1a，32 位。够稳定、够快，不需要引入库 */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export interface Visual {
  tone: SeriesTone;
}

/**
 * 取一条内容的色调。
 * @param seriesId 文章 frontmatter 的 series 字段
 * @param fallback 没有系列时用来算色的字符串（通常是首个标签或 slug）
 */
export function visualFor(seriesId?: string, fallback = ''): Visual {
  const def = getSeriesDef(seriesId);

  // 属于系列：完全跟随系列，保证同组一致
  if (def) return { tone: def.tone };

  const h = hash(fallback || 'default');
  return { tone: TONES[h % TONES.length] };
}

/** 文章：有系列用系列色，否则用首个标签 */
export function visualForPost(post: {
  data: { series?: string; tags: string[] };
  id: string;
}): Visual {
  const key = post.data.tags[0] ?? post.id;
  return visualFor(post.data.series, key);
}

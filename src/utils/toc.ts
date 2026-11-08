/**
 * 从渲染后的 HTML 中提取标题，用于生成目录。
 */

export interface TocItem {
  id: string;
  text: string;
}

/**
 * 提取指定级别的标题。
 * 只依赖 id 属性和文本，不关心其余标签。
 */
export function extractHeadings(html: string, level = 2): TocItem[] {
  const re = new RegExp(`<h${level}\\b([^>]*)>([\\s\\S]*?)</h${level}>`, 'gi');
  const items: TocItem[] = [];

  for (const m of html.matchAll(re)) {
    const attrs = m[1];
    const inner = m[2];

    const idMatch = attrs.match(/\bid="([^"]*)"/);
    if (!idMatch) continue;

    // 去掉标签、解码常见实体，得到纯文本
    const text = inner
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .trim();

    if (!text) continue;
    items.push({ id: idMatch[1], text });
  }

  return items;
}

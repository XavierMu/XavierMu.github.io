import type { CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

/** 取全部非草稿文章，按发布日期倒序（归档、标签页的时间线视角） */
export async function getSortedPosts(
  getCollection: (name: 'blog', filter?: (p: Post) => boolean) => Promise<Post[]>
): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/**
 * 列表排序与展示用的时间。
 * 旧文重写后发布日期仍是旧的，只改 updatedDate，所以「最近」要看更新日期。
 */
export function effectiveDate(post: Post): Date {
  return post.data.updatedDate ?? post.data.pubDate;
}

/**
 * 按「最近更新」倒序。
 * 同一天更新的按发布日期从早到晚排，这样系列文章（前一章发布时间更早）
 * 在列表里仍然是前置在前，不会因为更新时间相同被打乱。
 */
export function sortByRecentlyUpdated(posts: Post[]): Post[] {
  return [...posts].sort(
    (a, b) =>
      effectiveDate(b).valueOf() - effectiveDate(a).valueOf() ||
      a.data.pubDate.valueOf() - b.data.pubDate.valueOf()
  );
}

/** 标签 -> 文章数，按数量倒序 */
export function countTags(posts: Post[]): Array<[string, number]> {
  const map = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      map.set(tag, (map.get(tag) ?? 0) + 1);
    }
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh'));
}

/** 按年份分组，年份倒序 */
export function groupByYear(posts: Post[]): Array<[number, Post[]]> {
  const map = new Map<number, Post[]>();
  for (const post of posts) {
    const y = post.data.pubDate.getFullYear();
    if (!map.has(y)) map.set(y, []);
    map.get(y)!.push(post);
  }
  return [...map.entries()].sort((a, b) => b[0] - a[0]);
}

/** 按年月分组，用于归档页 */
export function groupByMonth(posts: Post[]): Array<[number, Array<[number, Post[]]>]> {
  const byYear = groupByYear(posts);
  return byYear.map(([year, list]) => {
    const months = new Map<number, Post[]>();
    for (const post of list) {
      const m = post.data.pubDate.getMonth();
      if (!months.has(m)) months.set(m, []);
      months.get(m)!.push(post);
    }
    return [year, [...months.entries()].sort((a, b) => b[0] - a[0])];
  });
}

/** 中文阅读时间估算：按 400 字/分钟，最少 1 分钟 */
export function readingTime(text: string): number {
  // 统计中日韩字符 + 英文单词
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) ?? []).length;
  const words = (text.match(/[A-Za-z0-9]+/g) ?? []).length;
  const minutes = Math.ceil(cjk / 400 + words / 200);
  return Math.max(1, minutes);
}

/**
 * 从集合条目的原始正文估算阅读时间。
 * body 在 glob loader 下可用；拿不到时回退到摘要长度。
 */
export function entryReadingTime(entry: { body?: string; data: { description: string } }): number {
  const text = entry.body ?? entry.data.description;
  return readingTime(text);
}

import type { CollectionEntry } from 'astro:content';
import type { SeriesDef } from '../data/series';

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

/* ==========================================================================
   系列（Series）
   ========================================================================== */

/** 一个系列及其按序排好的文章 */
export interface SeriesGroup {
  def: SeriesDef;
  posts: Post[];
  /** 系列总阅读时长（分钟） */
  minutes: number;
  /** 最近一次更新的日期 */
  updated: Date;
}

/**
 * 把文章按 series 归组。
 *
 * 排序规则：seriesOrder 优先，缺失的排到末尾再按发布日期。
 * 完全不参与 series 的文章不会被这里收进去——它们是独立文章，不属于任何系列。
 */
export function groupBySeries(posts: Post[], defs: SeriesDef[]): SeriesGroup[] {
  const buckets = new Map<string, Post[]>();

  for (const post of posts) {
    const id = post.data.series;
    if (!id) continue;
    if (!buckets.has(id)) buckets.set(id, []);
    buckets.get(id)!.push(post);
  }

  const groups: SeriesGroup[] = [];

  for (const def of defs) {
    const list = buckets.get(def.id);
    if (!list || list.length === 0) continue;

    list.sort(
      (a, b) =>
        (a.data.seriesOrder ?? Number.MAX_SAFE_INTEGER) -
          (b.data.seriesOrder ?? Number.MAX_SAFE_INTEGER) ||
        a.data.pubDate.valueOf() - b.data.pubDate.valueOf()
    );

    groups.push({
      def,
      posts: list,
      minutes: list.reduce((n, p) => n + entryReadingTime(p), 0),
      updated: list.reduce<Date>(
        (latest, p) => (effectiveDate(p) > latest ? effectiveDate(p) : latest),
        new Date(0)
      ),
    });
  }

  // 最近更新的系列排前面，让首页/列表页有新鲜度
  return groups.sort((a, b) => b.updated.valueOf() - a.updated.valueOf());
}

/**
 * 找出某篇文章在系列中的位置。
 * 返回 null 表示这篇文章不属于任何系列，调用方据此不渲染章节导航。
 */
export function locateInSeries(
  post: Post,
  allPosts: Post[],
  defs: SeriesDef[]
): { def: SeriesDef; posts: Post[]; index: number; prev: Post | null; next: Post | null } | null {
  const id = post.data.series;
  const def = id ? defs.find((d) => d.id === id) : undefined;
  if (!def) return null;

  const group = groupBySeries(allPosts, [def])[0];
  if (!group) return null;

  const index = group.posts.findIndex((p) => p.id === post.id);
  if (index < 0) return null;

  return {
    def,
    posts: group.posts,
    index,
    prev: index > 0 ? group.posts[index - 1] : null,
    next: index < group.posts.length - 1 ? group.posts[index + 1] : null,
  };
}

/** 文章 slug（去掉扩展名），多处复用 */
export function slugOf(id: string): string {
  return id.replace(/\.(md|mdx)$/, '');
}


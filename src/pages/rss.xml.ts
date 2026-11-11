import type { APIContext } from 'astro';
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { site } from '../data/site';
import { effectiveDate, sortByRecentlyUpdated } from '../utils/posts';

export async function GET(context: APIContext) {
  // 与站点列表同一口径：旧文重写也算「新」，按最近更新倒序
  const posts = sortByRecentlyUpdated(await getCollection('blog', ({ data }) => !data.draft));

  return rss({
    title: site.title,
    description: site.description,
    site: context.site ?? site.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      // RSS 没有单独的「更新于」字段，这里报的是站点上显示的那个日期：
      // 改过的旧文是更新日期，没改过的还是首次发布日期。
      pubDate: effectiveDate(post),
      link: `/blog/${post.id.replace(/\.(md|mdx)$/, '')}/`,
      categories: post.data.tags,
    })),
    customData: `<language>${site.lang}</language>`,
  });
}

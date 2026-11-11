/**
 * 站点全局配置
 * 改这里即可完成大部分个性化，无需动组件代码。
 */

export interface SocialLink {
  label: string;
  icon: 'github' | 'email' | 'rss' | 'scholar' | 'link';
  href: string;
}

export interface NavItem {
  label: string;
  href: string;
}

export const site = {
  title: '慕',
  description: '一个用来存放笔记与作品的地方。',
  author: '慕',
  /** 部署地址：这是站点根地址，决定 canonical / RSS / sitemap 的链接 */
  url: 'https://xaviermu.github.io',
  lang: 'zh-CN',

  hero: {
    title: '慕',
    // 以下两项为可选：留空字符串即不渲染
    subtitle: '',
    focus: '',
    intro: '记录读过的书、写过的代码，和想清楚的事。',
  },

  social: [
    { label: 'GitHub', icon: 'github', href: 'https://github.com/XavierMu' },
    { label: 'RSS', icon: 'rss', href: '/rss.xml' },
  ] as SocialLink[],

  nav: [
    { label: '文章', href: '/blog' },
    { label: '归档', href: '/archive' },
    { label: '标签', href: '/tags' },
    { label: '项目', href: '/projects' },
    { label: '关于', href: '/about' },
    { label: '搜索', href: '/search' },
  ] as NavItem[],

  home: {
    showRecentPosts: true,
    recentPostsCount: 5,
    showFeaturedProjects: true,
  },
} as const;

/**
 * 界面文案。
 *
 * 只收两类：**会变的**（页面 title/description，影响 SEO）和**会被复用的**
 * （归档的月份名、首页区块标题）。像「← 返回文章列表」这种绑死在单一语境的文案
 * 留在组件里就地可读，抽出来反而要在两个文件之间跳。
 */
export const copy = {
  home: {
    recentPosts: '最近文章',
    projects: '项目',
    overview: '站点概览',
    stats: { posts: '文章', tags: '标签', minutes: '分钟', reading: '阅读', since: '始于' },
    all: '全部',
  },

  blog: {
    title: '文章',
    description: '技术文章、论文笔记与工程实践。',
    count: (n: number) => `共 ${n} 篇`,
    empty: '还没有文章。',
  },

  archive: {
    title: '归档',
    description: '全部文章按时间归档。',
    count: (n: number) => `共 ${n} 篇`,
    empty: '还没有文章。',
    aside: { years: '每年', tags: '标签', stats: '统计' },
    statLabels: { posts: '文章', tags: '标签' },
    /** 一月 … 十二月，归档页按月分组用 */
    months: [
      '一月', '二月', '三月', '四月', '五月', '六月',
      '七月', '八月', '九月', '十月', '十一月', '十二月',
    ],
  },

  tags: {
    title: '标签',
    description: '全部文章标签，按文章数量排序。',
    count: (n: number) => `共 ${n} 个`,
    empty: '还没有标签。',
    aside: { top: '最多使用', recent: '最近新增', note: '说明' },
    note: '标签字号随文章数量缩放，用得越多的标签字号越大。',
  },

  projects: {
    title: '项目',
    description: '做过的项目：解决的问题、采用的技术与结果。',
    count: (n: number) => `共 ${n} 个`,
    empty: '还没有项目。',
    aside: { stack: '技术栈', status: '状态', years: '年份' },
  },

  tagPage: {
    title: (tag: string) => `标签：${tag}`,
    description: (tag: string) => `标签「${tag}」下的全部文章。`,
    count: (n: number) => `共 ${n} 篇`,
  },

  search: {
    title: '搜索',
    description: '站内全文搜索。',
    hint: '支持中文分词，输入关键词即可。',
  },

  about: {
    title: '关于',
    fallbackDescription: (author: string) => `关于 ${author}，以及这个站点写了些什么。`,
    aside: { contact: '联系', site: '本站' },
  },

  notFound: {
    title: '404 · 页面不存在',
    description: '你要找的页面不存在。',
    heading: '页面不存在',
    body: '链接可能已失效，或者这个页面还没写。',
    links: { home: '首页', posts: '全部文章', archive: '归档', tags: '标签', latest: '最近一篇' },
    recentTitle: '也许你想看',
  },
};

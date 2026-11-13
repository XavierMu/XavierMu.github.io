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
  description: '记录折腾电脑和手机的过程，偶尔写点论文和实验。',
  author: '慕',
  /** 部署地址：这是站点根地址，决定 canonical / RSS / sitemap 的链接 */
  url: 'https://xaviermu.github.io',
  lang: 'zh-CN',

  hero: {
    title: '慕',
    /** 首屏标题上方的状态标签文字 */
    badge: '记录中 · 持续更新',
    // 以下两项为可选：留空字符串即不渲染
    subtitle: '',
    focus: '',
    intro: '哈基咪南北绿多，阿西噶阿西，阿西哈雅酷奶，哈基米哈基。哈基米曼波曼波，吗吉利哇呀曼波，阿西噶哈雅酷奶农，哦吗吉利曼波。',
  },

  social: [
    { label: 'GitHub', icon: 'github', href: 'https://github.com/XavierMu' },
    { label: 'RSS', icon: 'rss', href: '/rss.xml' },
  ] as SocialLink[],

  nav: [
    { label: '文章', href: '/blog' },
    { label: '系列', href: '/series' },
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
 *
 * `kicker` 是每个页面标题上方的等宽小标签，纯装饰性质，不参与 SEO。
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
    kicker: 'ARTICLES',
    description: '折腾电脑和手机的记录，偶尔也有论文和实验笔记。',
    count: (n: number) => `共 ${n} 篇`,
    empty: '还没有文章。',
  },

  archive: {
    title: '归档',
    kicker: 'ARCHIVE',
    description: '全部文章，按时间排列。',
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
    kicker: 'TAGS',
    description: '全部标签，按文章数量排序。',
    count: (n: number) => `共 ${n} 个`,
    empty: '还没有标签。',
    aside: { top: '最多使用', recent: '最近新增', note: '说明' },
    note: '色条长度表示该标签下的文章数量。',
  },

  projects: {
    title: '项目',
    kicker: 'PROJECTS',
    description: '自己写的一些小工具。',
    count: (n: number) => `共 ${n} 个`,
    empty: '还没有项目。',
    aside: { stack: '技术栈', status: '状态', years: '年份' },
  },

  series: {
    title: '系列',
    kicker: 'SERIES',
    description: '把相关的文章按一条主线串起来。从第一篇读到最后，比东看一篇西看一篇省事。',
    empty: '还没有系列。',
    count: (n: number) => `${n} 个系列`,
    /** 文章页左栏里「本系列」的标题 */
    inSeries: '本系列',
    chapter: (i: number, total: number) => `第 ${i} / ${total} 章`,
  },

  tagPage: {
    title: (tag: string) => `标签：${tag}`,
    kicker: 'TAG',
    description: (tag: string) => `标签「${tag}」下的全部文章。`,
    count: (n: number) => `共 ${n} 篇`,
  },

  search: {
    title: '搜索',
    kicker: 'SEARCH',
    description: '站内搜索。',
    hint: '输入关键词搜索，支持中文。',
  },

  about: {
    title: '关于',
    kicker: 'ABOUT',
    fallbackDescription: (author: string) => `${author}：记录折腾电脑和手机的过程。`,
    aside: { contact: '联系', site: '本站' },
  },

  notFound: {
    title: '404 · 页面不存在',
    description: '页面不存在。',
    heading: '页面不存在',
    body: '链接可能已失效，或者这个页面还没写。',
    links: { home: '首页', posts: '全部文章', archive: '归档', tags: '标签', latest: '最近一篇' },
    recentTitle: '最近的文章',
  },
};

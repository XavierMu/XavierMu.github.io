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
  /** 次要项：窄屏时隐藏，避免导航拥挤 */
  secondary?: boolean;
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
    { label: '归档', href: '/archive', secondary: true },
    { label: '标签', href: '/tags', secondary: true },
    { label: '项目', href: '/projects' },
    { label: '关于', href: '/about' },
    { label: '搜索', href: '/search', secondary: true },
  ] as NavItem[],

  home: {
    showRecentPosts: true,
    recentPostsCount: 5,
    showFeaturedProjects: true,
  },
} as const;

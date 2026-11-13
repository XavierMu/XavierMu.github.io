/**
 * 系列（Series）定义。
 *
 * 一篇文章归属于哪个系列，写在文章的 frontmatter 里（`series` + `seriesOrder`）；
 * 系列本身的标题、简介、配色写在这里。两处分离的原因是：
 *   - 加一篇新文章只需改文章自己，不用回头动这个文件；
 *   - 但系列的「人话名字」和视觉标识不属于任何单篇文章。
 *
 * 系列在页面上承担三件事：
 *   1. /series 列表页成组展示；
 *   2. 系列详情页列出全部章节；
 *   3. 文章详情页左栏显示「你在第几章」，可以跳上下一章。
 */

export type SeriesTone = 'blue' | 'green' | 'violet' | 'amber' | 'rose';

export interface SeriesDef {
  /** 与文章 frontmatter 的 series 字段一致 */
  id: string;
  title: string;
  /** 一句话说明这个系列解决什么问题 */
  description: string;
  /** 强调色，取值对应 tokens.css 里的 --tone-* */
  tone: SeriesTone;
  /** 短标签，等宽大写，用在卡片与左栏 */
  code: string;
}

export const seriesDefs: SeriesDef[] = [
  {
    id: 'install',
    title: '装机一条龙',
    description: '从下载官方镜像到第一次进桌面，再到 PE、Ventoy 与手机当启动盘——把装系统这件事拆成能照着做的四步。',
    tone: 'blue',
    code: 'SETUP',
  },
  {
    id: 'android-root',
    title: '安卓搞机',
    description: '解锁 Bootloader、拿 root、装 LSPosed。三个层层递进的权限层级，讲清每一层的坎在哪。',
    tone: 'green',
    code: 'ROOT',
  },
  {
    id: 'network',
    title: '网络代理',
    description: '科学上网与校园网 WebVPN 是两套东西，但都要管住系统代理这个开关。',
    tone: 'violet',
    code: 'NET',
  },
];

/** id -> 定义，便于 O(1) 查询 */
export const seriesById = new Map(seriesDefs.map((s) => [s.id, s]));

/** 取系列定义；文章里写了未知 id 时返回 undefined，由调用方决定降级方式 */
export function getSeriesDef(id: string | undefined): SeriesDef | undefined {
  return id ? seriesById.get(id) : undefined;
}

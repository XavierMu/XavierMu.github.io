import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * 内容集合定义。
 * 字段由 schema 强制校验：写错字段或类型，构建时直接报错。
 */

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(120, '摘要控制在 120 字以内，列表页更好看'),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    /**
     * 所属系列（对应 src/data/series.ts 里的 id）。
     * 同一系列的文章会在详情页左侧生成章节导航，并在 /series 下成组展示。
     * 不填即独立文章。
     */
    series: z.string().optional(),
    /** 在系列内的顺序，从 1 开始；同系列内必须唯一，由 series 校验兜底 */
    seriesOrder: z.number().int().positive().optional(),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(160),
    /** 项目主要开发年份 */
    year: z.number().int().min(2000).max(2100),
    /** 你的角色，如「独立开发」 */
    role: z.string(),
    /** 状态：维护中 / 已完成 / 归档 */
    status: z.string().default('维护中'),
    stack: z.array(z.string()).default([]),
    repo: z.string().url().optional(),
    /** 演示或下载地址 */
    demo: z.string().url().optional(),
    /** 关联的使用教程（指向 blog 集合的条目 id） */
    guide: reference('blog').optional(),
    /** 是否显示在首页 */
    featured: z.boolean().default(false),
    /** 排序，越小越靠前 */
    order: z.number().default(99),
    draft: z.boolean().default(false),
  }),
});

/**
 * 单页正文（目前只有「关于」）。
 * 放进集合是为了和文章共用一套 .prose 排版，改文案不用碰模板。
 */
const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(160),
    updatedDate: z.coerce.date().optional(),
  }),
});

export const collections = { blog, projects, pages };

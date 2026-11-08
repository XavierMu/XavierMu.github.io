import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * 内容集合定义。
 * 字段由 schema 强制校验：写错字段或类型，构建时直接报错。
 *
 * 项目集合暂时移除（免得生成空页面）。
 * 以后要加项目时：
 *  1. 在此重新定义 projects 集合
 *  2. 恢复 src/pages/projects/ 下的两个路由
 *  3. 在 src/data/site.ts 的 nav 里加回「项目」
 */

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(120, '摘要控制在 120 字以内，列表页更好看'),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// 記事は src/content/articles/<言語>/<記事ID>.md。日本語と英語で同じIDのファイルを置く。
const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['frontend', 'backend', 'infra', 'practice', 'cs', 'ai']),
    tags: z.array(z.string()),
    minutes: z.number(),
    type: z.string(),
    level: z.string().optional(),
    takeaway: z.string().optional(),
    order: z.number(),
    sources: z.array(z.object({ title: z.string(), url: z.string().url() })).default([])
  })
});

export const collections = { articles };

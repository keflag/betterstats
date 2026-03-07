/**
 * @fileName validators.ts
 * @description 输入验证工具 - 使用 zod 进行严格的类型验证防止注入攻击
 * @author keflag
 * @createDate 2026-03-07
 * @lastUpdateDate 2026-03-07
 * @version 1.0.0
 */

import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
});

export const idSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const stringSchema = z.object({
  name: z.string().min(1).max(255).regex(/^[\w\s\u4e00-\u9fa5-]+$/),
});

export type PaginationParams = z.infer<typeof paginationSchema>;
export type IdParams = z.infer<typeof idSchema>;

export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      throw new Error(`验证失败：${messages.join(', ')}`);
    }
    throw error;
  }
};

export const sanitizeString = (input: string): string => {
  return input.replace(/[<>\"'&]/g, '');
};

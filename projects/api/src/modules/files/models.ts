import { z } from 'zod';

export type ImageDetail = z.infer<typeof ImageSchema>;
export const ImageSchema = z.object({
    url: z.string(),
    width: z.number(),
    height: z.number(),
});

export type SizedImage = z.infer<typeof SizedImage>;
export const SizedImage = z.object({
    small: ImageSchema,
    medium: ImageSchema,
    large: ImageSchema,
});

export type FileType = 'image' | 'file';
export type ImageSize = keyof SizedImage;

export type FileMeta = Partial<{
    userId: string;
    originalUrl: string;
    originalPath: string;
    originalName: string;
    width: number;
    height: number;
}>;

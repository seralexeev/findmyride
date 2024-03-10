import z from 'zod';

export type FileMeta = Partial<{
    userId: string;
    originalUrl: string;
    originalPath: string;
    originalName: string;
}>;

export type FileSchema = z.infer<typeof FileSchema>;
export const FileSchema = z.object({
    id: z.string(),
    url: z.string(),
    width: z.number().nullable(),
    height: z.number().nullable(),
    blurhash: z.string().nullable(),
});

export type ImageSchema = z.infer<typeof FileSchema>;
export const ImageSchema = z.object({
    id: z.string(),
    url: z.string(),
    width: z.number(),
    height: z.number(),
    blurhash: z.string(),
});

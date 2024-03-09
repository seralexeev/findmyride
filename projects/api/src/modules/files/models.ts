import z from 'zod';

export type FileMeta = Partial<{
    userId: string;
    originalUrl: string;
    originalPath: string;
    originalName: string;
}>;

export type ImageSchema = z.infer<typeof ImageSchema>;
export const ImageSchema = z.object({
    url: z.string(),
    width: z.number(),
    height: z.number(),
    blurhash: z.string().nullable(),
});

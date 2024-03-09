import z from 'zod';

export type TokenPayload = z.infer<typeof TokenPayload>;
export const TokenPayload = z.object({
    sub: z.string(),
    exp: z.number(),
    aud: z.string(),
    tokenId: z.string(),
    sessionId: z.string(),
});

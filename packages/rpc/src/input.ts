import z from 'zod';

export type FileInput = {
    // This is a hack to make it work with the Jsonify type.
    // I'm not sure how to fix it properly.
    buffer: Buffer & string;
    mimetype: string;
    originalname: string;
};

export interface File extends Blob {
    readonly lastModified: number;
    readonly name: string;
}

export const fileInput = z.custom<FileInput>((x: any) => {
    if (typeof x !== 'object' || x === null) {
        return false;
    }

    if (typeof x.mimetype !== 'string' || typeof x.originalname !== 'string') {
        return false;
    }

    if (!Buffer.isBuffer(x.buffer)) {
        return false;
    }

    return true;
}) as any as z.ZodType<FileInput, z.ZodTypeDef, File | FormData>;

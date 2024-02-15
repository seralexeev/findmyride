import mime from 'mime-types';

export const imageMimeTypes = new Set([
    'image/gif',
    'image/jpeg',
    'image/pjpeg',
    'image/png',
    'image/svg',
    'image/tiff',
    'image/webp',
]);

export const isImage = (mimeType?: string | null) => mimeType && imageMimeTypes.has(mimeType);
export const contentType = mime.contentType;
export const extension = mime.extension;

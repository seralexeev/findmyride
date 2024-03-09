export const imageMimeTypes = new Set([
    'image/gif',
    'image/jpg',
    'image/jpeg',
    'image/pjpeg',
    'image/png',
    'image/svg',
    'image/tiff',
    'image/webp',
]);

export const isImage = (mimeType?: string | null) => mimeType && imageMimeTypes.has(mimeType);

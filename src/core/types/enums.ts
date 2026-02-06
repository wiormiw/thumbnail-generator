const thumbnailStatuses = ['pending', 'processing', 'completed', 'failed'] as const;
type ThumbnailStatus = (typeof thumbnailStatuses)[number];

const thumbnailFormats = ['png', 'jpg', 'webp'] as const;
type ThumbnailFormat = (typeof thumbnailFormats)[number];

export { thumbnailStatuses, thumbnailFormats, type ThumbnailStatus, type ThumbnailFormat };

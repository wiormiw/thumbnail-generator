// Enum-like patterns using object const + union
// This provides better type safety and autocompletion compared to plain enums

const thumbnailStatuses = ['pending', 'processing', 'completed', 'failed'] as const;
type ThumbnailStatus = (typeof thumbnailStatuses)[number];

const thumbnailFormats = ['png', 'jpg', 'webp'] as const;
type ThumbnailFormat = (typeof thumbnailFormats)[number];

export { thumbnailStatuses, thumbnailFormats, type ThumbnailStatus, type ThumbnailFormat };

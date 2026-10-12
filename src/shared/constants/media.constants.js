
export const MEDIA_CONFIG = {
  image: {
    maxSize: 10 * 1024 * 1024,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
    ],
  },

  video: {
    maxSize: 100 * 1024 * 1024,
    allowedMimeTypes: [
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ],
  },
};

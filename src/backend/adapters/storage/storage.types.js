/**
 * @typedef {object} NormalizedStorageObject
 * @property {string} storage_provider
 * @property {string} storage_key
 * @property {string|null} [provider_asset_id]
 * @property {string} url
 * @property {string} resource_type
 * @property {string} format
 * @property {number} size_bytes
 * @property {number|null} [width]
 * @property {number|null} [height]
 */

/**
 * Storage provider contract used by MediaService.
 *
 * @typedef {object} StorageProvider
 * @property {(buffer: Buffer, options?: object) => Promise<NormalizedStorageObject>} [upload]
 *   Optional; used by Cloudinary multipart path only.
 * @property {(url: string, options?: object) => Promise<NormalizedStorageObject>} [uploadFromUrl]
 * @property {(storageKey: string, resourceType?: string) => Promise<{ result: string }>} delete
 * @property {(storageKey: string, resourceType: string) => string|null} getThumbnailUrl
 */

export {};

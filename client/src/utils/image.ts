const API_URL = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL as string).replace(/\/+$/, '').replace(/\/api$/, '')
  : '';

/**
 * Normalizes an image URL for display:
 * - If the URL starts with '/uploads', prefixes it with the backend origin.
 * - Otherwise returns the URL as is (e.g. Cloudinary https://..., /images/..., data:...).
 */
export function assetUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('/uploads')) {
    return `${API_URL}${url}`;
  }
  return url;
}

export default assetUrl;

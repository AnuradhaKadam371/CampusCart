/**
 * getImageUrl — resolves any image value to a displayable URL.
 * Handles: Cloudinary URLs, plain https URLs, objects ({url, secure_url…}),
 * and falls back to a nice SVG placeholder.
 */
export function getImageUrl(img, { placeholderSize = 600 } = {}) {
  const ph = Math.round(placeholderSize * 0.66);
  const placeholder =
    `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' ` +
    `width='${placeholderSize}' height='${ph}' viewBox='0 0 ${placeholderSize} ${ph}'%3E` +
    `%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E` +
    `%3Ctext x='50%25' y='50%25' font-size='16' fill='%2394a3b8' ` +
    `text-anchor='middle' font-family='sans-serif' dy='.35em'%3ENo Image%3C/text%3E%3C/svg%3E`;

  if (!img) return placeholder;

  // Object shape — Cloudinary returns {secure_url, url, …}
  if (typeof img === 'object' && img !== null) {
    const candidate =
      img.secure_url ||
      img.url ||
      img.imageUrl ||
      img.src ||
      img.path ||
      img.publicUrl ||
      null;
    if (typeof candidate === 'string' && candidate.length > 0) {
      return getImageUrl(candidate, { placeholderSize });
    }
    return placeholder;
  }

  if (typeof img !== 'string' || img.trim() === '') return placeholder;

  const trimmed = img.trim();

  // Full Cloudinary / CDN URL — return as-is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // data: URI — return as-is (blob preview, base64)
  if (trimmed.startsWith('data:')) return trimmed;

  // Old local upload path like "uploads/abc.jpg" — show placeholder
  // (local filesystem paths are not accessible in production)
  return placeholder;
}
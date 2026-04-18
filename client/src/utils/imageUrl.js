const BASE_URL = import.meta.env.VITE_API_URL || "https://campuscart-436h.onrender.com";

export function getImageUrl(img, { placeholderSize = 600 } = {}) {
  if (!img) return `https://via.placeholder.com/${placeholderSize}`;
  if (typeof img !== "string") return `https://via.placeholder.com/${placeholderSize}`;

  if (img.startsWith("http://") || img.startsWith("https://")) return img;

  // If backend ever stores 'uploads/filename'
  if (img.startsWith("uploads/")) {
    return `${BASE_URL}/${img}`;
  }

  // Normal case: DB stores filename only
  return `${BASE_URL}/uploads/${img}`;
}


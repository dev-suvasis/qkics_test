// src/components/utils/mediaUrl.js
//
// The backend returns media files as relative paths: /media/profiles/abc.jpg
// In development, Vite proxies /media/ → backend so they just work.
// In production (Vercel), there is no proxy — relative paths go nowhere.
//
// This utility prepends the backend base URL when the path is relative,
// leaving absolute URLs (starting with http/https) untouched.

const MEDIA_BASE = import.meta.env.VITE_API_URL || "";

/**
 * Resolves a media file path from the backend into a usable <img> src.
 * @param {string|null|undefined} path  - The value from the API (e.g. "/media/profiles/abc.jpg")
 * @returns {string|null}               - Fully-qualified URL, or null if no path
 */
export const resolveMedia = (path) => {
  if (!path) return null;
  // Already absolute — don't touch it
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  // Relative path — prepend the backend origin
  return `${MEDIA_BASE}${path}`;
};

/**
 * Returns a resolved profile picture URL, falling back to ui-avatars.com.
 * @param {string|null|undefined} profilePicture - Raw profile_picture from API
 * @param {string} username                       - Username for the fallback avatar
 * @returns {string}
 */
export const resolveAvatar = (profilePicture, username) => {
  const resolved = resolveMedia(profilePicture);
  if (resolved) return resolved;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(username || "U")}&background=random`;
};
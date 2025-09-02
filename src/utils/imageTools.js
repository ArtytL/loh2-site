// src/utils/imageTools.js
export const NO_IMAGE = "/no-image.svg";

export function toImageURL(cover) {
  if (!cover) return NO_IMAGE;
  if (/^https?:\/\//i.test(cover)) return cover;
  let c = String(cover)
    .replace(/^\/?public\//i, "")
    .replace(/^src\//i, "")
    .replace(/^\/+/, "");
  if (/^covers\//i.test(c)) c = `${c}`;
  return `/${c}`;
}

// src/utils/imageTools.js
export const NO_IMAGE = "/no-image.png";

export function toImageURL(cover) {
  if (!cover) return NO_IMAGE;
  // ถ้าเป็น URL เต็มอยู่แล้ว (http/https) ก็ใช้ตามนั้น
  if (/^https?:\/\//i.test(cover)) return cover;
  // ถ้าเป็นแค่ชื่อไฟล์ ให้ชี้ไปที่ public/covers
  const filename = String(cover).replace(/^\/?covers\//i, "");
  return `/covers/${filename}`;
}

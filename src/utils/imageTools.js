// src/utils/imageTools.js

// รูป fallback (ต้องมีไฟล์นี้ใน /public)
export const NO_IMAGE = "/no-image.svg";

/**
 * แปลงค่าจากช่อง "ปก (URL)" ให้กลายเป็น URL ที่เว็บโหลดได้จริง
 * รองรับ:
 *  - ชื่อไฟล์อย่างเดียว:            "unleash-3.jpg"
 *  - พาธใต้ public/covers:          "covers/unleash-3.jpg"
 *  - พาธที่เผลอใส่ public/src มา:  "public/covers/a.jpg", "src/public/covers/a.jpg"
 *  - ลิงก์เต็ม http(s):             "https://.../a.jpg" (ปล่อยผ่าน)
 */
export function toImageURL(cover) {
  if (!cover) return NO_IMAGE;

  const raw = String(cover).trim();

  // ถ้าเป็นลิงก์ http(s) อยู่แล้ว ใช้ได้เลย
  if (/^https?:\/\/?/i.test(raw)) return raw; // ✅ แค่สองขีด // ก็พอ

  // เริ่ม normalize
  let c = raw;

  // ตัดโดเมน (ถ้าเผลอวางมาบางส่วน)
  c = c.replace(/^https?:\/\/[^/]+/i, "");
  // ตัด / นำหน้า
  c = c.replace(/^\/+/, "");

  // ถ้าในพาธมี "public/" ให้ตัดตั้งแต่ตรงนั้นไปข้างหน้า
  {
    const i = c.toLowerCase().lastIndexOf("public/");
    if (i !== -1) c = c.slice(i + "public/".length);
  }

  // ถ้ามี "src/" ก็ทำแบบเดียวกัน
  {
    const i = c.toLowerCase().lastIndexOf("src/");
    if (i !== -1) c = c.slice(i + "src/".length);
  }

  // ตัด / นำหน้าอีกรอบเผื่อ
  c = c.replace(/^\/+/, "");

  // ถ้าไม่ได้ขึ้นต้นด้วย covers/ ให้โยนเข้า covers/ อัตโนมัติ
  if (!/^covers\//i.test(c)) c = `covers/${c}`;

  // public เสิร์ฟจากรากเว็บเสมอ
  return `/${c}`;
}

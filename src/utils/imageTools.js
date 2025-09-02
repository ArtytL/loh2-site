// src/utils/imageTools.js
export const NO_IMAGE = "/no-image.svg"; // หรือรูป placeholder ของคุณใน /public

// แปลงค่า cover ที่กรอกมา → เป็น URL ที่เว็บโหลดได้จริง
export function toImageURL(cover) {
  if (!cover) return NO_IMAGE;

  // ถ้าเป็นลิงก์ http(s) อยู่แล้วก็ใช้ได้เลย (เช่น รูปจาก Google Drive ที่เปิดสาธารณะ)
  if (/^https?:\/\//i.test(cover)) return cover;

  // ตัดโดเมน/โฟลเดอร์เกิน ๆ ที่ชอบใส่มา
  // เช่น "https://xxx/app/public/covers/a.jpg", "public/covers/a.jpg", "src/public/covers/a.jpg"
  let c = String(cover)
    .replace(/^https?:\/\/[^/]+/i, "") // ตัดโดเมน
    .replace(/^\/?public\//i, "")      // ตัด public/
    .replace(/^\/?src\//i, "")         // กันพิมพ์ src/ มา
    .replace(/^\/+/, "");              // ตัด / นำหน้า

  // ถ้าพิมพ์มาแค่ชื่อไฟล์ ให้พาไปโฟลเดอร์ covers อัตโนมัติ
  if (!/^covers\//i.test(c)) c = `covers/${c}`;

  // รูปใต้ public เสิร์ฟจากรากเว็บเสมอ
  return `/${c}`;
}

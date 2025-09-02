// src/utils/imageTools.js

// SVG "No Image" ขนาดย่อม แบบ data URI (ไม่ต้องมีไฟล์เพิ่ม)
export const NO_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1200">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
            fill="#9ca3af" font-family="sans-serif" font-size="64">
        No Image
      </text>
    </svg>`
  );

/**
 * เพื่อให้กรอกหลังบ้านได้ง่าย:
 * - ถ้าใส่ URL (เริ่มด้วย http://, https://, //) => ใช้เลย
 * - ถ้าอัปไฟล์เข้า repo ไว้ที่ public/covers/… => กรอก "covers/ชื่อไฟล์.jpg" หรือ "/covers/ชื่อไฟล์.jpg"
 * - ถ้าพิมพ์หลงเป็น "/public/covers/..." => จะถูกแก้ให้เป็น "/covers/..."
 */
export function toImageURL(cover) {
  if (!cover) return NO_IMAGE;

  const v = String(cover).trim();

  // เป็น URL ภายนอกอยู่แล้ว
  if (/^(https?:)?\/\//i.test(v)) return v;

  // เผื่อกรอกมาผิดเป็น "/public/covers/xxx"
  if (v.startsWith("/public/covers/")) return v.replace("/public", "");

  // กรณีกรอก "public/covers/xxx"
  if (v.startsWith("public/covers/")) return `/${v.replace("public/", "")}`;

  // กรณีกรอก "/covers/xxx"
  if (v.startsWith("/covers/")) return v;

  // กรณีกรอก "covers/xxx"
  if (v.startsWith("covers/")) return `/${v}`;

  // อย่างอื่น ๆ ให้คืนค่าตามเดิม (แต่อาจกลายเป็น broken)
  return v;
}

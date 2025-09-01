// src/utils/imageTools.js
export const NO_IMAGE =
  "https://fakeimg.pl/800x600/?text=No%20Image&font=noto";

// แปลงลิงก์ Google Drive/Photos ให้เป็นลิงก์รูปภาพจริงที่ <img> โหลดได้
export function toImageURL(input) {
  try {
    if (!input || typeof input !== "string") return NO_IMAGE;
    let url = input.trim();

    // เคส Google Drive แบบ /file/d/{id}/view...
    const m1 = url.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
    if (m1) {
      const id = m1[1];
      // ใช้ endpoint uc?export=view
      return `https://drive.google.com/uc?export=view&id=${id}`;
    }

    // เคสมีพารามิเตอร์ ?id={id}
    if (/^https?:\/\//i.test(url)) {
      const u = new URL(url);
      const id = u.searchParams.get("id");
      if (id) return `https://drive.google.com/uc?export=view&id=${id}`;
    }

    // เคส Google Photos / lh3.googleusercontent.com => ใช้ได้เลย
    if (/lh3\.googleusercontent\.com/i.test(url)) return url;

    // ถ้าเป็นไฟล์รูปตรง ๆ ก็คืนค่า (ตัด query ทิ้งเพื่อกัน 302 แปลก ๆ)
    if (/\.(png|jpe?g|gif|webp|avif|bmp|svg)(\?.*)?$/i.test(url)) {
      return url.split("?")[0];
    }

    // อย่างอื่นคืนค่าตามเดิม (หรือจะ NO_IMAGE ก็ได้)
    return url;
  } catch (e) {
    return NO_IMAGE;
  }
}

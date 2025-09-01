// src/utils/imageTools.js
// แปลงลิงก์ Google Drive -> ลิงก์รูปโดยตรง (เอาไว้ใช้กับ <img>)
export function toImageURL(u = "") {
  try {
    if (!u) return u;

    // รูปแบบ: https://drive.google.com/file/d/<ID>/view?usp=drive_link
    const byPath = u.match(/\/d\/([a-zA-Z0-9_-]{10,})\//);
    if (byPath?.[1]) {
      return `https://drive.google.com/uc?export=view&id=${byPath[1]}`;
    }

    // รูปแบบ: https://drive.google.com/open?id=<ID> หรือ ...?id=<ID>
    const url = new URL(u);
    if (url.hostname.includes("drive.google.com")) {
      const id = url.searchParams.get("id");
      if (id) return `https://drive.google.com/uc?export=view&id=${id}`;
    }

    // ไม่ใช่ลิงก์ Drive ก็ส่งกลับตามเดิม
    return u;
  } catch {
    return u;
  }
}

// URL รูปสำรอง (เวลาโหลดรูปไม่ได้)
export const NO_IMAGE = "https://placehold.co/800x600?text=No+Image";

// Normalize สินค้า 1 ชิ้น (ให้ cover/images กลายเป็นลิงก์รูปที่ใช้ได้)
export function normalizeProductImages(p) {
  if (!p) return p;
  return {
    ...p,
    cover: toImageURL(p.cover),
    images: Array.isArray(p.images) ? p.images.map(toImageURL) : [],
  };
}

// Normalize ลิสต์สินค้า
export function normalizeProducts(list = []) {
  return list.map(normalizeProductImages);
}

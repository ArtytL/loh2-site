// src/utils/imageTools.js
export const NO_IMAGE =
  "https://fakeimg.pl/800x450/?text=No%20Image&font=arial";

export function toImageURL(input = "") {
  if (!input) return NO_IMAGE;

  try {
    const u = new URL(input);

    // --- Google Drive: file/d/<id>/view? ---
    if (u.hostname.includes("drive.google.com")) {
      const m = input.match(/\/d\/([^/]+)/); // ดึง <FILE_ID>
      if (m) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
    }

    // Googleusercontent (ลิงก์รูปตรง ๆ จากกูเกิล)
    if (u.hostname.includes("googleusercontent.com")) {
      return input;
    }

    // เผื่อมีลิงก์จากแหล่งอื่นที่ปกติ (imgur, cloudinary ฯลฯ)
    return input;
  } catch {
    return NO_IMAGE;
  }
}

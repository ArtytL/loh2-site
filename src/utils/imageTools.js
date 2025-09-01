// src/utils/imageTools.js
export const NO_IMAGE =
  "https://fakeimg.pl/800x450/?text=No%20Image&font=arial";

// แปลงลิงก์ Google Drive (แบบ file/d/<ID>/view) ให้กลายเป็นลิงก์รูปโดยตรง
export function toImageURL(input = "") {
  if (!input) return NO_IMAGE;

  try {
    const u = new URL(input);

    // ลิงก์ Google Drive
    if (u.hostname.includes("drive.google.com")) {
      const m = input.match(/\/d\/([^/]+)/); // ดึง <FILE_ID>
      if (m) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
    }

    // ลิงก์รูปตรงจาก Google (googleusercontent)
    if (u.hostname.includes("googleusercontent.com")) {
      return input;
    }

    // ลิงก์จากที่อื่น (imgur, cloudinary ฯลฯ) ใช้ได้เลย
    return input;
  } catch {
    return NO_IMAGE;
  }
}

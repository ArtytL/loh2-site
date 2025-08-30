// api/repair-products.js
import jwt from "jsonwebtoken";
import { kvGet, kvSet } from "./_utils/kv.js";

export const config = { runtime: "nodejs" };

function verify(req) {
  const h = req.headers.authorization || "";
  const m = h.match(/^Bearer (.+)$/i);
  if (!m) return null;
  try {
    return jwt.verify(m[1], process.env.ADMIN_JWT_SECRET);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }
  const admin = verify(req);
  if (!admin) return res.status(401).json({ ok: false, error: "Unauthorized" });

  try {
    // ดึงรายการปัจจุบัน (รองรับได้ทั้ง {value:'...'} หรือ string หรือ array)
    let items = await kvGet("products");
    if (items?.value) items = JSON.parse(items.value || "[]");
    else if (typeof items === "string") items = JSON.parse(items || "[]");
    else if (!Array.isArray(items)) items = [];

    let changed = 0;

    // หาเลข running id ล่าสุดของ P####
    let maxSeq = 0;
    for (const p of items) {
      const m = String(p.id || "").match(/^P(\d+)/);
      if (m) maxSeq = Math.max(maxSeq, Number(m[1]));
    }

    const normalize = (p) => {
      const before = JSON.stringify(p);

      // บังคับชนิดข้อมูลสำคัญ
      p.id = p.id || `P${String(++maxSeq).padStart(4, "0")}`;
      p.title = (p.title && String(p.title).trim()) || p.id;
      p.type = p.type === "Blu-ray" || p.type === "DVD" ? p.type : "DVD";
      p.price = Number(p.price) || 0;
      p.qty = Number(p.qty) || 0;

      // images รองรับทั้ง string/array -> เก็บเป็น array, ตัดค่าว่าง, จำกัด 5 รูป
      if (typeof p.images === "string") p.images = [p.images];
      if (!Array.isArray(p.images)) p.images = [];
      p.images = p.images.filter(Boolean).slice(0, 5);

      // cover ถ้าไม่มีให้ใช้ images[0]
      if (!p.cover && p.images[0]) p.cover = p.images[0];

      // youtube ให้เป็น string เสมอ
      p.youtube = p.youtube ? String(p.youtube).trim() : "";

      // updatedAt
      p.updatedAt = Date.now();

      if (JSON.stringify(p) !== before) changed++;
      return p;
    };

    items = items.map(normalize);

    // เซฟกลับ
    await kvSet("products", JSON.stringify(items));
    await kvSet("product:seq", maxSeq);

    return res.json({ ok: true, count: items.length, changed });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}

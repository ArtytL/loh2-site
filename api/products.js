// api/products.js
import jwt from "jsonwebtoken";
import { kvGet, kvSet } from "./_utils/kv.js";

export const config = { runtime: "nodejs" };

// ตรวจสอบ token จากเฮดเดอร์ Authorization: Bearer <token>
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

// helper: โหลดรายการสินค้าแบบทนทานต่อหลายรูปแบบข้อมูลใน KV
async function loadItems() {
  const raw = await kvGet("products");
  let items = [];

  if (!raw) return items;

  // กรณี Upstash คืน { value: ... }
  if (Object.prototype.hasOwnProperty.call(raw, "value")) {
    const v = raw.value;
    if (typeof v === "string") items = JSON.parse(v || "[]");
    else if (Array.isArray(v)) items = v;
    else if (typeof v === "object" && v) items = v.items || [];
    return items;
  }

  // กรณีเป็นสตริง JSON ตรง ๆ
  if (typeof raw === "string") return JSON.parse(raw || "[]");

  // กรณีเป็นอาร์เรย์อยู่แล้ว
  if (Array.isArray(raw)) return raw;

  // กรณีเป็นอ็อบเจกต์อื่น ๆ
  if (typeof raw === "object" && raw) return raw.items || [];

  return items;
}

// helper: บันทึกรายการสินค้า (ต้อง stringify เสมอ)
async function saveItems(items) {
  await kvSet("products", JSON.stringify(items || []));
}

export default async function handler(req, res) {
  try {
    // ------------------------
    // GET : ดึงรายการสินค้า
    // ------------------------
    if (req.method === "GET") {
      const items = await loadItems();
      return res.json({ ok: true, items });
    }

    // ตั้งแต่ตรงนี้ไป ต้องเป็น admin เท่านั้น
    const admin = verify(req);
    if (!admin) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    // body อาจเป็นสตริงหรืออ็อบเจกต์ ขึ้นกับแพลตฟอร์ม
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

    let items = await loadItems();

    // ------------------------
    // POST : เพิ่มสินค้าใหม่
    // ------------------------
    if (req.method === "POST") {
      // รันเลขลำดับ (ถ้ามี)
      let seq = (await kvGet("product:seq")) || 0;
      seq += 1;
      await kvSet("product:seq", seq);

      const now = new Date().toISOString();
      const {
        title = "",
        type = "DVD", // "DVD" | "Blu-ray"
        price = 0,
        qty = 0,
        detail = "",
        youtube = "",
        images = [], // array รูปภาพ
      } = body;

      const idPrefix = type === "Blu-ray" ? "BR" : "DVD";
      const id = `${idPrefix}-${String(seq).padStart(3, "0")}`;

      const product = {
        id,
        title,
        type,
        price: Number(price) || 0,
        qty: Number(qty) || 0,
        cover: images?.[0] || "", // ปกใช้รูปแรก
        images: Array.isArray(images) ? images : [],
        youtube,
        detail,
        createdAt: now,
        updatedAt: now,
      };

      items.push(product);
      await saveItems(items);
      return res.json({ ok: true, item: product, items });
    }

    // ------------------------
    // PUT : แก้ไขสินค้า
    // ------------------------
    if (req.method === "PUT") {
      const { id, ...changes } = body || {};
      const idx = items.findIndex((x) => x.id === id);
      if (idx === -1)
        return res.status(404).json({ ok: false, error: "Not found" });

      const updated = {
        ...items[idx],
        ...changes,
        updatedAt: new Date().toISOString(),
      };
      // ทำความสะอาดค่าที่ต้องเป็นตัวเลข/อาร์เรย์
      if ("price" in updated) updated.price = Number(updated.price) || 0;
      if ("qty" in updated) updated.qty = Number(updated.qty) || 0;
      if ("images" in updated && !Array.isArray(updated.images))
        updated.images = [];

      items[idx] = updated;
      await saveItems(items);
      return res.json({ ok: true, item: updated, items });
    }

    // ------------------------
    // DELETE : ลบสินค้า
    // ------------------------
    if (req.method === "DELETE") {
      const { id } = body || {};
      const next = items.filter((x) => x.id !== id);
      await saveItems(next);
      return res.json({ ok: true, items: next });
    }

    // method ไม่รองรับ
    return res
      .status(405)
      .json({ ok: false, error: "Method Not Allowed" });

  } catch (e) {
    // กัน JSON parse พังหรือ error อื่นๆ
    return res
      .status(500)
      .json({ ok: false, error: String(e && e.message ? e.message : e) });
  }
}

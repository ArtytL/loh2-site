// api/products.js
import jwt from "jsonwebtoken";
import { kvGet, kvSet } from "./_utils/kv.js";

export const config = { runtime: "nodejs" };

// ตรวจ token จาก Authorization: Bearer <token>
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

// อ่านสินค้าแบบทนทานต่อหลายรูปแบบข้อมูล
async function loadItems() {
  const raw = await kvGet("products");
  let items = [];

  if (!raw) return items;

  if (typeof raw === "string") {
    try {
      items = JSON.parse(raw || "[]");
    } catch {
      items = [];
    }
  } else if (Array.isArray(raw)) {
    items = raw;
  } else if (typeof raw === "object" && raw) {
    // เผื่อกรณี { value: '...'}
    const v = raw.value;
    if (typeof v === "string") {
      try {
        items = JSON.parse(v || "[]");
      } catch {
        items = [];
      }
    } else if (Array.isArray(v)) {
      items = v;
    }
  }
  return Array.isArray(items) ? items : [];
}

async function saveItems(items) {
  await kvSet("products", JSON.stringify(items || []));
}

export default async function handler(req, res) {
  try {
    // GET: ดึงรายการ
    if (req.method === "GET") {
      const items = await loadItems();
      return res.json({ ok: true, items });
    }

    // ต้องเป็น admin
    const admin = verify(req);
    if (!admin) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    let items = await loadItems();

    // POST: เพิ่มสินค้า
    if (req.method === "POST") {
      let seq = Number((await kvGet("product:seq")) || 0) + 1;
      await kvSet("product:seq", String(seq));

      const now = new Date().toISOString();
      const {
        title = "",
        type = "DVD",
        price = 0,
        qty = 0,
        detail = "",
        youtube = "",
        images = [],
      } = body;

      const idPrefix = type === "Blu-ray" ? "BR" : "DVD";
      const id = `${idPrefix}-${String(seq).padStart(3, "0")}`;

      const product = {
        id,
        title,
        type,
        price: Number(price) || 0,
        qty: Number(qty) || 0,
        cover: Array.isArray(images) && images[0] ? images[0] : "",
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

    // PUT: แก้ไข
    if (req.method === "PUT") {
      const { id, ...changes } = body || {};
      const idx = items.findIndex((x) => x.id === id);
      if (idx === -1) return res.status(404).json({ ok: false, error: "Not found" });

      const updated = {
        ...items[idx],
        ...changes,
        price: Number(changes.price ?? items[idx].price) || 0,
        qty: Number(changes.qty ?? items[idx].qty) || 0,
        images: Array.isArray(changes.images) ? changes.images : items[idx].images,
        updatedAt: new Date().toISOString(),
      };

      items[idx] = updated;
      await saveItems(items);
      return res.json({ ok: true, item: updated, items });
    }

    // DELETE: ลบ
    if (req.method === "DELETE") {
      const { id } = body || {};
      const next = items.filter((x) => x.id !== id);
      await saveItems(next);
      return res.json({ ok: true, items: next });
    }

    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e && e.message ? e.message : e) });
  }
}

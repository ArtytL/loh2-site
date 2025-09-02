// api/products.js
import jwt from "jsonwebtoken";
import { kvGet, kvSet } from "./_utils/kv.js";

export const config = { runtime: "nodejs" };

// ---- verify admin (เหมือนที่คุณใช้อยู่) ----
function verify(req) {
  try {
    const h = req.headers.authorization || "";
    const m = h.match(/^Bearer (.+)$/i);
    if (!m) return null;
    return jwt.verify(m[1], process.env.ADMIN_JWT_SECRET);
  } catch {
    return null;
  }
}

async function readItems() {
  const raw = await kvGet("products");
  let items = [];
  const v = raw?.value ?? raw; // รองรับทั้ง object.value และ string
  if (v) {
    items = typeof v === "string" ? JSON.parse(v) : v;
  }
  if (!Array.isArray(items)) items = [];
  // de-dup ด้วย id (ตัวท้ายสุดเป็นของจริง)
  const map = new Map();
  for (const it of items) map.set(it.id, it);
  return [...map.values()];
}

async function writeItems(items) {
  await kvSet("products", items);
}

async function nextId() {
  const raw = await kvGet("product:seq");
  const seq = Number(raw?.value ?? raw ?? 0) + 1;
  await kvSet("product:seq", seq);
  return `P${String(seq).padStart(4, "0")}`;
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const items = await readItems();
      return res.json({ ok: true, items });
    }

    const admin = verify(req);
    if (!admin) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    let items = await readItems();

    if (req.method === "POST" || req.method === "PUT") {
      const it = body.product || body;
      if (!it || !it.title) return res.status(400).json({ ok: false, error: "Missing product" });

      if (!it.id) it.id = await nextId();            // เพิ่มใหม่
      items = items.filter(x => x.id !== it.id);     // upsert: ล้างตัวเก่า
      items.push(it);
      await writeItems(items);
      return res.json({ ok: true, product: it, items });
    }

    if (req.method === "DELETE") {
      const id = body.id || req.query.id;
      if (!id) return res.status(400).json({ ok: false, error: "Missing id" });
      const before = items.length;
      items = items.filter(x => x.id !== id);
      if (items.length !== before) await writeItems(items);
      return res.json({ ok: true, deleted: items.length !== before, items });
    }

    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}

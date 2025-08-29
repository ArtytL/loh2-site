// api/products.js
import jwt from "jsonwebtoken";
import { kvGet, kvSet } from "./_utils/kv.js";

export const config = { runtime: "nodejs20.x" };

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
  try {
    // GET รายการสินค้า
    if (req.method === "GET") {
      const items = (await kvGet("products")) || [];
      return res.json({ ok: true, items });
    }

    // ต้องเป็นแอดมินสำหรับ POST/PUT/DELETE
    const admin = verify(req);
    if (!admin) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const body = JSON.parse(req.body || "{}");
    let items = (await kvGet("products")) || [];

    if (req.method === "POST") {
      // เพิ่มสินค้าใหม่
      let seq = (await kvGet("product:seq")) || 0;
      seq += 1;
      const id = "P" + String(seq).padStart(4, "0");
      const now = Date.now();
      const product = {
        id,
        title: body.title?.trim() || "",
        type: body.type === "Blu-ray" ? "Blu-ray" : "DVD",
        price: Number(body.price) || 0,
        qty: Number(body.qty) || 0,
        desc: body.desc || "",
        youtube: body.youtube || "",
        images: Array.isArray(body.images) ? body.images.slice(0, 5) : [],
        createdAt: now,
        updatedAt: now,
      };
      items.push(product);
      await kvSet("products", items);
      await kvSet("product:seq", seq);
      return res.json({ ok: true, item: product });
    }

    if (req.method === "PUT") {
      // แก้ไขสินค้า
      const idx = items.findIndex((x) => x.id === body.id);
      if (idx < 0) return res.status(404).json({ ok: false, error: "Not found" });
      const p = items[idx];
      items[idx] = {
        ...p,
        title: body.title ?? p.title,
        type: body.type ?? p.type,
        price: body.price != null ? Number(body.price) : p.price,
        qty: body.qty != null ? Number(body.qty) : p.qty,
        desc: body.desc ?? p.desc,
        youtube: body.youtube ?? p.youtube,
        images: Array.isArray(body.images) ? body.images.slice(0, 5) : p.images,
        updatedAt: Date.now(),
      };
      await kvSet("products", items);
      return res.json({ ok: true, item: items[idx] });
    }

    if (req.method === "DELETE") {
      // ลบสินค้า
      const id = body.id;
      const next = items.filter((x) => x.id !== id);
      if (next.length === items.length) {
        return res.status(404).json({ ok: false, error: "Not found" });
      }
      await kvSet("products", next);
      return res.json({ ok: true });
    }

    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}

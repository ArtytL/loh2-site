// api/products.js
import jwt from "jsonwebtoken";
import { kvGet, kvSet } from "./_utils/kv.js";

export const config = { runtime: "nodejs" };

// ---------- helpers ----------
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
    // ---------- GET: list products ----------
    if (req.method === "GET") {
      // อาจเป็น { value: "..." } หรือ string/null
      const raw = await kvGet("products");
      let items = [];

      if (raw?.value) {
        // เคส Upstash KV แบบ { value: "..." }
        items = JSON.parse(raw.value || "[]");
      } else if (typeof raw === "string") {
        // เคสเป็น string ตรง ๆ
        items = JSON.parse(raw || "[]");
      } else if (Array.isArray(raw)) {
        // เคสเป็น array อยู่แล้ว
        items = raw;
      } else {
        items = [];
      }

      return res.json({ ok: true, items });
    }

    // ---------- ต้องเป็นแอดมิน สำหรับ POST / PUT / DELETE ----------
    const admin = verify(req);
    if (!admin) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const body = JSON.parse(req.body || "{}");
    let items = (await kvGet("products")) || [];
    if (items?.value) {
      items = JSON.parse(items.value || "[]");
    } else if (typeof items === "string") {
      items = JSON.parse(items || "[]");
    } else if (!Array.isArray(items)) {
      items = [];
    }

    // ---------- POST: create ----------
    if (req.method === "POST") {
      let seq = (await kvGet("product:seq")) || 0;
      seq += 1;
      const id = "P" + String(seq).padStart(4, "0");
      const now = Date.now();

      const product = {
        id,
        title: body.title || "",
        type: body.type || "DVD",
        price: Number(body.price) || 0,
        qty: Number(body.qty) || 0,
        cover: body.cover || "",
        images: Array.isArray(body.images) ? body.images : [],
        youtube: body.youtube || "",
        detail: body.detail || "",
        createdAt: now,
        updatedAt: now,
      };

      // ถ้ายังไม่มี title (กันอินพุตว่าง)
      if (!product.title) product.title = id;

      items.push(product);
      await kvSet("products", JSON.stringify(items));
      await kvSet("product:seq", seq);
      return res.json({ ok: true, item: product });
    }

    // ---------- PUT: update ----------
    if (req.method === "PUT") {
      const { id } = body;
      const i = items.findIndex((x) => x.id === id);
      if (i === -1) {
        return res.status(404).json({ ok: false, error: "Not found" });
      }
      items[i] = { ...items[i], ...body, updatedAt: Date.now() };
      await kvSet("products", JSON.stringify(items));
      return res.json({ ok: true, item: items[i] });
    }

    // ---------- DELETE: remove ----------
    if (req.method === "DELETE") {
      const { id } = body;
      const next = items.filter((x) => x.id !== id);
      await kvSet("products", JSON.stringify(next));
      return res.json({ ok: true });
    }

    // ---------- method อื่น ----------
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}

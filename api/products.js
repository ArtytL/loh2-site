// api/products.js
import jwt from "jsonwebtoken";
import { kvGet, kvSet } from "./_utils/kv.js";

export const config = { runtime: "nodejs" };

// ---------- helpers ----------
function ok(res, data) {
  return res.status(200).json({ ok: true, ...data });
}
function err(res, code = 400, msg = "Bad Request") {
  return res.status(code).json({ ok: false, error: msg });
}
function readBody(req) {
  try {
    if (!req.body) return {};
    if (typeof req.body === "string") return JSON.parse(req.body || "{}");
    return req.body;
  } catch {
    return {};
  }
}
function verify(req) {
  const h = req.headers.authorization || req.headers.Authorization;
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  try {
    return jwt.verify(m[1], process.env.ADMIN_JWT_SECRET);
  } catch {
    return null;
  }
}

async function load() {
  let raw = await kvGet("products");
  if (!raw) return [];
  // รองรับได้ทุกฟอร์แมตที่เคยเซฟไว้
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && "value" in raw) {
    try {
      return JSON.parse(raw.value);
    } catch {
      return [];
    }
  }
  return [];
}

async function save(items) {
  // บังคับเซฟเป็น string ให้สม่ำเสมอ
  await kvSet("products", JSON.stringify(items));
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const items = await load();
      return ok(res, { items });
    }

    // จากนี้ต้องเป็น admin เท่านั้น
    const admin = verify(req);
    if (!admin) return err(res, 401, "Unauthorized");

    const url = new URL(req.url, `https://${req.headers.host}`);
    const body = readBody(req);
    const id =
      body.id || url.searchParams.get("id") || url.searchParams.get("productId");

    let items = await load();

    if (req.method === "POST") {
      // gen id
      const seq = Number((await kvGet("product:seq")) || 0) + 1;
      await kvSet("product:seq", seq);
      const newId = "P" + String(seq).padStart(4, "0");

      const images =
        body.images !== undefined
          ? Array.isArray(body.images)
            ? body.images.filter(Boolean)
            : body.images
            ? [body.images]
            : []
          : [];

      const product = {
        id: newId,
        title: (body.title || "").trim() || `สินค้า ${newId}`,
        type: body.type || "DVD",
        price: Number(body.price || 0),
        qty: Number(body.qty || 0),
        cover: body.cover || images[0] || "",
        images,
        youtube: body.youtube || "",
        detail: body.detail || "",
        createdAt: Date.now(),
      };

      items.push(product);
      await save(items);
      return ok(res, { item: product });
    }

    if (req.method === "PUT") {
      if (!id) return err(res, 400, "Missing id");
      const idx = items.findIndex((it) => it.id === id);
      if (idx === -1) return err(res, 404, "Not found");

      const p = items[idx];
      const images =
        body.images !== undefined
          ? Array.isArray(body.images)
            ? body.images.filter(Boolean)
            : body.images
            ? [body.images]
            : []
          : p.images;

      const updated = {
        ...p,
        title:
          body.title !== undefined
            ? String(body.title).trim() || p.title
            : p.title,
        type: body.type ?? p.type,
        price: body.price !== undefined ? Number(body.price) : p.price,
        qty: body.qty !== undefined ? Number(body.qty) : p.qty,
        cover: body.cover ?? p.cover,
        images,
        youtube: body.youtube ?? p.youtube,
        detail: body.detail ?? p.detail,
        updatedAt: Date.now(),
      };

      items[idx] = updated;
      await save(items);
      return ok(res, { item: updated });
    }

    if (req.method === "DELETE") {
      if (!id) return err(res, 400, "Missing id");
      const before = items.length;
      items = items.filter((it) => it.id !== id);
      if (items.length === before) return err(res, 404, "Not found");
      await save(items);
      return ok(res, { deleted: id });
    }

    return err(res, 405, "Method Not Allowed");
  } catch (e) {
    return err(res, 500, String(e?.message || e));
  }
}

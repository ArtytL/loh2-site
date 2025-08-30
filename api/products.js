// api/products.js
import jwt from "jsonwebtoken";
import { kvGet, kvSet } from "./_utils/kv.js";
export const config = { runtime: "nodejs" };

// ---------- helpers ----------
function verify(req) {
  const m = (req.headers.authorization || "").match(/^Bearer (.+)$/i);
  if (!m) return null;
  try { return jwt.verify(m[1], process.env.ADMIN_JWT_SECRET); }
  catch { return null; }
}

// อ่าน products จาก KV ให้ได้เป็น array เสมอ (KV อาจเก็บเป็น string หรือ {value:'...'})
async function readProducts() {
  let data = await kvGet("products");
  try {
    // กรณี KV คืน { value: '...' }
    if (data && typeof data === "object" && "value" in data) {
      const raw = data.value;
      data = typeof raw === "string" ? JSON.parse(raw || "[]") : Array.isArray(raw) ? raw : [];
    }
    // กรณี KV คืนเป็น string ตรง ๆ
    else if (typeof data === "string") {
      data = JSON.parse(data || "[]");
    }
  } catch { data = []; }
  if (!Array.isArray(data)) data = [];
  return data;
}

async function writeProducts(items) {
  await kvSet("products", JSON.stringify(items || []));
}

function pad(n, w = 4) {
  return String(n).padStart(w, "0");
}

// เคลียร์/บังคับฟิลด์ให้ครบ
function normalizeOne(p = {}) {
  const title = (p.title ?? p.name ?? "").toString().trim();
  const type  = (p.type ?? p.category ?? "DVD").toString().trim();
  const price = Number(p.price ?? 0) || 0;
  const qty   = Number(p.qty ?? 0) || 0;

  let images = [];
  if (Array.isArray(p.images)) images = p.images.filter(Boolean);
  else images = [p.image1, p.image2, p.image3, p.image4, p.image5].filter(Boolean);

  const cover   = images[0] ?? p.cover ?? "";
  const youtube = (p.youtube ?? p.youtubeUrl ?? "").toString();
  const detail  = (p.detail ?? p.description ?? "").toString();

  return { ...p, title, type, price, qty, images, cover, youtube, detail };
}

function readBody(req) {
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body || "{}"); } catch { return {}; }
  }
  return req.body || {};
}

// ---------- handler ----------
export default async function handler(req, res) {
  try {
    // GET: ทุกคนใช้ได้
    if (req.method === "GET") {
      const items = await readProducts();
      return res.json({ ok: true, items });
    }

    // POST/PUT/DELETE: ต้องเป็น admin เท่านั้น
    const admin = verify(req);
    if (!admin) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const items = await readProducts();

    if (req.method === "POST") {
      const data = readBody(req);
      // gen running id
      let seq = Number(await kvGet("product:seq")) || 0;
      seq += 1;
      await kvSet("product:seq", String(seq));

      const id = (data.type === "BD" || data.type === "Blu-ray" || data.type === "BLU-RAY")
        ? `BR-${pad(seq)}` : `DVD-${pad(seq)}`;

      const product = normalizeOne({ id, ...data });
      items.unshift(product);
      await writeProducts(items);
      return res.json({ ok: true, product });
    }

    if (req.method === "PUT") {
      const data = readBody(req);
      const { id } = data || {};
      if (!id) return res.status(400).json({ ok: false, error: "Missing id" });

      const idx = items.findIndex(p => p.id === id);
      if (idx === -1) return res.status(404).json({ ok: false, error: "Not found" });

      items[idx] = normalizeOne({ ...items[idx], ...data });
      await writeProducts(items);
      return res.json({ ok: true, product: items[idx] });
    }

    if (req.method === "DELETE") {
      const data = readBody(req);
      const { id } = data || {};
      if (!id) return res.status(400).json({ ok: false, error: "Missing id" });

      const next = items.filter(p => p.id !== id);
      await writeProducts(next);
      return res.json({ ok: true, removed: id, count: next.length });
    }

    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  } catch (e
::contentReference[oaicite:0]{index=0}

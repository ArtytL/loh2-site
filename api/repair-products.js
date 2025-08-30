// api/repair-products.js
import jwt from "jsonwebtoken";
import { kvGet, kvSet } from "./_utils/kv.js";
export const config = { runtime: "nodejs" };

function verify(req) {
  const m = (req.headers.authorization || "").match(/^Bearer (.+)$/i);
  if (!m) return null;
  try { return jwt.verify(m[1], process.env.ADMIN_JWT_SECRET); } catch { return null; }
}

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

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok:false, error:"Method Not Allowed" });
    }
    const admin = verify(req);
    if (!admin) return res.status(401).json({ ok:false, error:"Unauthorized" });

    let items = await kvGet("products");
    try {
      if (typeof items === "string") items = JSON.parse(items || "[]");
      if (items?.value) {
        items = typeof items.value === "string" ? JSON.parse(items.value || "[]") : items.value;
      }
    } catch { items = []; }
    if (!Array.isArray(items)) items = [];

    const fixed = items.map(normalizeOne).filter(x => x.id && x.title);
    await kvSet("products", JSON.stringify(fixed));
    return res.json({ ok:true, count: fixed.length });
  } catch (e) {
    return res.status(500).json({ ok:false, error: String(e && e.message ? e.message : e) });
  }
}

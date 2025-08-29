// api/orders.js
// api/orders.js
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
    // ลูกค้า (Checkout.jsx) เรียก POST มาเก็บออเดอร์ไว้แล้ว — ใช้ต่อได้
    if (req.method === "POST") {
      const order = JSON.parse(req.body || "{}");
      const list = (await kvGet("orders")) || [];
      list.push(order);
      await kvSet("orders", list);
      return res.json({ ok: true });
    }

    if (req.method === "GET") {
      // ดูรายการออเดอร์ (แอดมิน)
      const admin = verify(req);
      if (!admin) return res.status(401).json({ ok: false, error: "Unauthorized" });
      const list = (await kvGet("orders")) || [];
      return res.json({ ok: true, items: list });
    }

    if (req.method === "PATCH") {
      // อัปเดตสถานะ (แอดมิน)
      const admin = verify(req);
      if (!admin) return res.status(401).json({ ok: false, error: "Unauthorized" });

      const { orderId, paid, shipped } = JSON.parse(req.body || "{}");
      const list = (await kvGet("orders")) || [];
      const idx = list.findIndex((x) => x.orderId === orderId);
      if (idx < 0) return res.status(404).json({ ok: false, error: "Not found" });

      list[idx] = {
        ...list[idx],
        paid: paid ?? list[idx].paid,
        shipped: shipped ?? list[idx].shipped,
        updatedAt: Date.now(),
      };
      await kvSet("orders", list);
      return res.json({ ok: true, item: list[idx] });
    }

    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}


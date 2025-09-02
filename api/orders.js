// /api/orders.js
import { kvGet, kvSet } from "./_utils/kv.js";

export const config = { runtime: "nodejs" };

// ปลอดภัย: ฝั่งลูกค้า POST ได้ ไม่ต้อง auth
export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      // คืนรายการออเดอร์ทั้งหมด
      const raw = await kvGet("orders");
      const list = normalizeList(raw);
      return res.json({ ok: true, items: list });
    }

    if (req.method === "POST") {
      // รับออเดอร์จากฟอร์มลูกค้า
      const body = await readJson(req);
      // body ควรมี: name, email, phone, address, note, cart[], shipping, total
      const order = {
        id: "O" + Date.now(),
        ...body,
        createdAt: new Date().toISOString(),
      };

      let list = normalizeList(await kvGet("orders"));
      list.unshift(order);

      // เก็บแบบ string เสมอ ป้องกัน type เพี้ยน
      await kvSet("orders", JSON.stringify(list));
      return res.json({ ok: true, id: order.id });
    }

    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}

// ---------- helpers ----------
function normalizeList(raw) {
  // raw อาจเป็น {value: ...} หรือ string หรือ array
  let val = raw?.value ?? raw ?? [];
  if (typeof val === "string") {
    try { val = JSON.parse(val); } catch { val = []; }
  }
  if (!Array.isArray(val)) val = [];
  return val;
}

async function readJson(req) {
  // รองรับทั้ง application/json และ text/plain ที่เป็น JSON
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const text = Buffer.concat(chunks).toString("utf8") || "{}";
  try { return JSON.parse(text); } catch { return {}; }
}

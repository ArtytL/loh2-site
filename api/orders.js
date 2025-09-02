// /api/orders.js
import { kvGet, kvSet } from "./_utils/kv.js";
export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const raw = await kvGet("orders");
      const list = normalizeList(raw);
      return res.json({ ok: true, items: list });
    }

    if (req.method === "POST") {
      const body = await readJson(req);
      const order = { id: "O" + Date.now(), ...body, createdAt: new Date().toISOString() };
      let list = normalizeList(await kvGet("orders"));
      list.unshift(order);
      await kvSet("orders", JSON.stringify(list));
      return res.json({ ok: true, id: order.id });
    }

    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}

function normalizeList(raw) {
  let val = raw?.value ?? raw ?? [];
  if (typeof val === "string") { try { val = JSON.parse(val); } catch { val = []; } }
  if (!Array.isArray(val)) val = [];
  return val;
}

async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const text = Buffer.concat(chunks).toString("utf8") || "{}";
  try { return JSON.parse(text); } catch { return {}; }
}

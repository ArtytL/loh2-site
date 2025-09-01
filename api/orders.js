// api/orders.js
import { kvGet, kvSet } from "./_utils/kv.js";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method Not Allowed" });
    }

    // ---- parse body อย่างปลอดภัย ----
    let data = req.body;
    if (!data) {
      // กรณีบาง runtime ไม่เติม req.body ให้ อ่านสตรีมเอง
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const raw = Buffer.concat(chunks).toString();
      data = raw ? JSON.parse(raw) : {};
    } else if (typeof data === "string") {
      data = JSON.parse(data);
    }
    // ตอนนี้ data เป็น object แล้ว
    const { name, email, phone, address, note, cart, shipping, total } = data;

    // ---- เขียนออเดอร์ลง KV ----
    let seq = (await kvGet("order:seq")) || 0;
    seq += 1;
    const id = "L" + String(seq).padStart(4, "0");

    const order = {
      id, name, email, phone, address, note,
      cart, shipping, total,
      paid: false, shipped: false,
      createdAt: new Date().toISOString(),
    };

    const orders = (await kvGet("orders")) || [];
    orders.unshift(order);
    await kvSet([
      ["orders", orders],
      ["order:seq", seq],
    ]);

    return res.json({ ok: true, id });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}

// api/orders.js
import { kvGet, kvSet } from "./_utils/kv.js";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method Not Allowed" });
    }

    // รองรับทั้งกรณี body เป็น string และเป็น object
    const raw = req.body;
    const body =
      typeof raw === "string" ? JSON.parse(raw || "{}") : (raw || {});

    // ดึงฟิลด์จาก body (มีค่าเริ่มต้นกันพัง)
    const {
      name = "",
      email = "",
      phone = "",
      address = "",
      note = "",
      cart = [],
      shipping = 0,
      total = 0,
    } = body;

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ ok: false, error: "EMPTY_CART" });
    }

    // รันเลขออเดอร์ L0001, L0002, ...
    let seq = (await kvGet("order:seq")) || 0;
    seq = Number(seq) || 0;
    seq += 1;
    const id = `L${String(seq).padStart(4, "0")}`;

    const order = {
      id,
      name,
      email,
      phone,
      address,
      note,
      cart,
      shipping: Number(shipping) || 0,
      total: Number(total) || 0,
      createdAt: Date.now(),
      paid: false,
      shipped: false,
    };

    // เก็บลง KV (เก็บทั้งรายการทั้งหมด และเลขล่าสุด)
    const orders = (await kvGet("orders")) || [];
    orders.push(order);
    await kvSet([
      ["orders", orders],
      ["order:seq", seq],
    ]);

    return res.json({ ok: true, order });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}

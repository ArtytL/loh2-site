// /api/orders.js

// ใช้ Node runtime (ไม่ใช่ Edge) เพื่อให้ใช้ fetch/stream และ library ต่าง ๆ ได้ครบ
export const config = { runtime: "nodejs" };

/**
 * ช่วยอ่าน body ให้ครอบคลุมหลายกรณี:
 * - ถ้า Vercel parse ให้แล้ว (object) ก็คืนเลย
 * - ถ้าเป็น string (เช่นส่ง text/plain มา) จะลอง JSON.parse
 * - ถ้ายังไม่ได้ก็อ่าน raw stream แล้วพยายาม parse อีกรอบ
 */
async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      // ถ้า parse ไม่ได้ก็ขอลองอ่านจาก stream
    }
  }

  // อ่าน raw จาก stream กรณี body ยังว่าง
  const chunks = [];
  for await (const ch of req) chunks.push(Buffer.from(ch));
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    // ถ้าเป็น form-urlencoded หรืออื่น ๆ ก็คืนเป็น string ไป
    return { _raw: raw };
  }
}

/** สร้างข้อความอีเมล/สรุปให้อ่านง่าย */
function buildSummary(data) {
  const {
    name = "",
    email = "",
    phone = "",
    address = "",
    note = "",
    cart = [],
    shipping = 0,
    total = 0,
  } = data || {};

  const lines = [];
  lines.push("📦 คำสั่งซื้อใหม่");
  lines.push("────────────────────");
  lines.push(`ลูกค้า: ${name || "-"}`);
  lines.push(`อีเมล: ${email || "-"}`);
  lines.push(`โทร: ${phone || "-"}`);
  lines.push(`ที่อยู่จัดส่ง: ${address || "-"}`);
  if (note) lines.push(`หมายเหตุ: ${note}`);
  lines.push("");
  lines.push("รายการสินค้า:");
  lines.push("--------------------");

  let subtotal = 0;
  for (const item of cart || []) {
    const id = item.id || "-";
    const title = item.title || "-";
    const type = item.type || "-";
    const qty = Number(item.qty || 0);
    const price = Number(item.price || 0);
    const sum = qty * price;
    subtotal += sum;
    lines.push(`• [${id}] ${title} (${type}) x ${qty} = ${sum} บาท`);
  }

  lines.push("--------------------");
  lines.push(`รวมสินค้า: ${subtotal} บาท`);
  lines.push(`ค่าส่ง: ${Number(shipping || 0)} บาท`);
  lines.push(`รวมสุทธิ: ${Number(total || subtotal + Number(shipping || 0))} บาท`);

  return lines.join("\n");
}

export default async function handler(req, res) {
  // ตั้ง CORS ให้ทุกโดเมน (ถ้าจะล็อคโดเมน เปลี่ยน * เป็นโดเมนของคุณ)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // รองรับ preflight
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method Not Allowed" });
    return;
  }

  try {
    const data = await readBody(req);

    // ตรวจสอบข้อมูลขั้นต่ำที่จำเป็น
    if (!data || !Array.isArray(data.cart) || (data.cart || []).length === 0) {
      res.status(400).json({ ok: false, error: "Invalid payload: cart is empty" });
      return;
    }

    // สร้างสรุป
    const message = buildSummary(data);

    // ==== ส่งต่อไปยัง webhook / email API ถ้ามีตั้งค่าใน ENV ====
    // เลือกใช้ ORDER_WEBHOOK_URL ก่อน ถ้าไม่มีค่อยใช้ EMAIL_API_URL
    const forwardUrl =
      process.env.ORDER_WEBHOOK_URL || process.env.EMAIL_API_URL || null;

    if (forwardUrl) {
      const r = await fetch(forwardUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ส่งทั้ง raw data และ summary เผื่อปลายทางจะจัดรูปแบบเอง
        body: JSON.stringify({ ...data, summary: message }),
      });

      // ไม่ต้อง fail ถ้าปลายทางตอบ non-2xx — แต่ log ไว้ช่วย debug
      if (!r.ok) {
        const text = await r.text().catch(() => "");
        console.warn("Forward failed:", r.status, text);
      }
    } else {
      console.log("No ORDER_WEBHOOK_URL/EMAIL_API_URL set — skip forwarding.");
      console.log("Order summary:\n" + message);
    }

    // ตอบกลับสำเร็จให้หน้าเว็บ
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("orders error:", err);
    res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}

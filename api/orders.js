// /api/orders.js
import { kvGet, kvSet } from "./_utils/kv.js";

export const config = { runtime: "nodejs" };

// ===== Mail providers (เลือกจาก ENV โดยอัตโนมัติ) =====
let useResend = false;
let Resend = null;
let resend = null;
try {
  if (process.env.RESEND_API_KEY) {
    // ใช้ Resend ถ้ามี API key
    Resend = (await import("resend")).Resend;
    resend = new Resend(process.env.RESEND_API_KEY);
    useResend = true;
  }
} catch (e) {
  // ไม่เป็นไร ถ้าไม่ได้ใช้ Resend
}

let nodemailer = null;
if (!useResend) {
  try {
    nodemailer = (await import("nodemailer")).default;
  } catch (e) {
    // ถ้าไม่มี nodemailer และก็ไม่ได้ใช้ Resend => จะส่งเมลไม่ได้
  }
}

// ===== helpers =====
function asArray(x) {
  if (!x) return [];
  if (Array.isArray(x)) return x;
  // kv อาจเก็บเป็น { value: '...' } / string
  if (typeof x === "object" && "value" in x) {
    const v = x.value;
    if (Array.isArray(v)) return v;
    if (typeof v === "string") {
      try { return JSON.parse(v); } catch {}
    }
    return v ? [v] : [];
  }
  if (typeof x === "string") {
    try { return JSON.parse(x); } catch {}
  }
  return [];
}

function money(n) { return Number(n || 0); }

function htmlOrder({ orderId, name, email, phone, address, note, items, shipping, total }) {
  const rows = items.map((it) => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #eee">${it.id}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee">${it.title}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee">${it.type}</td>
      <td style="padding:6px 8px;text-align:right;border-bottom:1px solid #eee">${it.qty}</td>
      <td style="padding:6px 8px;text-align:right;border-bottom:1px solid #eee">${money(it.price)}</td>
    </tr>
  `).join("");

  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5">
    <h2>คำสั่งซื้อ #${orderId}</h2>
    <h3>รายการสินค้า</h3>
    <table style="border-collapse:collapse;width:100%;max-width:640px">
      <thead>
        <tr>
          <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #000">รหัส</th>
          <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #000">ชื่อ</th>
          <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #000">ประเภท</th>
          <th style="text-align:right;padding:6px 8px;border-bottom:2px solid #000">จำนวน</th>
          <th style="text-align:right;padding:6px 8px;border-bottom:2px solid #000">ราคา</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="4" style="padding:6px 8px;text-align:right">ค่าส่ง</td>
          <td style="padding:6px 8px;text-align:right">${money(shipping)}</td>
        </tr>
        <tr>
          <td colspan="4" style="padding:6px 8px;text-align:right"><strong>รวมสุทธิ</strong></td>
          <td style="padding:6px 8px;text-align:right"><strong>${money(total)}</strong></td>
        </tr>
      </tfoot>
    </table>

    <h3 style="margin-top:24px">ข้อมูลผู้สั่ง</h3>
    <p>
      ชื่อ: ${name || "-"}<br/>
      อีเมล: ${email || "-"}<br/>
      เบอร์: ${phone || "-"}<br/>
      ที่อยู่: ${address || "-"}<br/>
      หมายเหตุ: ${note || "-"}
    </p>
  </div>
  `;
}

async function sendMail({ subject, html, toCustomer, toAdmin }) {
  // คืนรายละเอียด provider + error/id เพื่อ debug
  const res = { provider: null, ok: false, id: null, error: null };

  // 1) Resend
  if (useResend && resend) {
    res.provider = "resend";
    try {
      const from = process.env.RESEND_FROM || "Loh2 DVD <onboarding@resend.dev>";
      const to = [toAdmin].filter(Boolean);
      if (toCustomer) to.push(toCustomer);

      const r = await resend.emails.send({
        from,
        to,
        subject,
        html,
      });

      res.ok = true;
      res.id = r?.id || null;
      return res;
    } catch (e) {
      res.error = e?.message || String(e);
      return res;
    }
  }

  // 2) SMTP (Nodemailer)
  if (nodemailer) {
    res.provider = "smtp";
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465, // true if 465
        auth: process.env.SMTP_USER ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        } : undefined,
      });

      const from = process.env.MAIL_FROM || "Loh2 DVD <no-reply@localhost>";
      const to = [toAdmin].filter(Boolean);
      if (toCustomer) to.push(toCustomer);

      const info = await transporter.sendMail({ from, to, subject, html });
      res.ok = true;
      res.id = info?.messageId || null;
      return res;
    } catch (e) {
      res.error = e?.message || String(e);
      return res;
    }
  }

  // 3) ไม่มี provider
  res.provider = "none";
  res.error = "No mail provider configured. Set RESEND_API_KEY or SMTP_* envs.";
  return res;
}

// ===== handler =====
export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const raw = await kvGet("orders");
      const orders = asArray(raw);
      return res.status(200).json({ ok: true, orders });
    }

    if (req.method === "POST") {
      // รับข้อมูลจากหน้าแจ้งโอน
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

      const {
        name = "",
        email = "",
        phone = "",
        address = "",
        note = "",
        cart = [],
        shipping = 50,
      } = body;

      const items = Array.isArray(cart) ? cart : [];
      const subtotal = items.reduce((s, it) => s + money(it.price) * money(it.qty), 0);
      const total = subtotal + money(shipping);
      const time = new Date().toISOString().replace("T", " ").slice(0, 19);

      // โหลด orders เดิม
      const raw = await kvGet("orders");
      let orders = asArray(raw);

      const orderId = `O${Date.now()}`;
      const order = {
        id: orderId,
        time,
        name,
        email,
        phone,
        address,
        note,
        items,
        shipping: money(shipping),
        total,
      };

      // ใส่ไว้หัวรายการ
      if (!Array.isArray(orders)) orders = [];
      orders.unshift(order);

      // บันทึกกลับ
      await kvSet("orders", orders);

      // ส่งเมล (ถึงลูกค้า และสำเนาถึงร้าน)
      const subject = `คำสั่งซื้อ #${orderId} รวม ${money(total)} บาท`;
      const html = htmlOrder({ orderId, name, email, phone, address, note, items, shipping, total });

      const toAdmin = process.env.MAIL_TO || process.env.ADMIN_EMAIL || email; // เผื่อไม่มีตั้งค่า
      const mailResult = await sendMail({
        subject,
        html,
        toCustomer: email || null,
        toAdmin,
      });

      // log ไว้ดูใน Vercel → Functions → Logs
      console.log("[orders] created:", orderId, "mail:", mailResult);

      return res.status(200).json({
        ok: true,
        orderId,
        total,
        mail: mailResult, // ดูว่า provider ใด / ok หรือไม่ / error อะไร
      });
    }

    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  } catch (e) {
    console.error("[orders] error:", e);
    return res.status(500).json({ ok: false, error: String(e) });
  }
}

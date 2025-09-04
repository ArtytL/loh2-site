// /src/api/orders.js
// ส่งคำสั่งซื้อ + ส่งอีเมลด้วย Resend
import { Resend } from "resend";

export const config = { runtime: "nodejs" };

// สร้างอินสแตนซ์ Resend จาก ENV
const resend = new Resend(process.env.RESEND_API_KEY);

// สร้าง HTML อย่างง่ายสำหรับอีเมล
function orderHtml({ name, email, phone, address, note, cart, total, shipping }) {
  const rows = cart
    .map(
      (it) =>
        `<tr>
           <td>${it.title} (${it.type || "-"})</td>
           <td align="right">${it.qty}</td>
           <td align="right">${Number(it.price || 0).toLocaleString()}</td>
           <td align="right">${(Number(it.qty) * Number(it.price || 0)).toLocaleString()}</td>
         </tr>`
    )
    .join("");

  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6">
    <h2>ยืนยันคำสั่งซื้อ</h2>
    <p><b>ผู้สั่งซื้อ:</b> ${name}</p>
    <p><b>อีเมล:</b> ${email}</p>
    <p><b>โทร:</b> ${phone || "-"}</p>
    <p><b>ที่อยู่:</b> ${address || "-"}</p>
    <p><b>หมายเหตุ:</b> ${note || "-"}</p>
    <table width="100%" cellspacing="0" cellpadding="6" border="1" style="border-collapse:collapse;border:1px solid #ddd">
      <thead>
        <tr style="background:#f6f6f6">
          <th align="left">รายการ</th>
          <th align="right">จำนวน</th>
          <th align="right">ราคา</th>
          <th align="right">รวม</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="3" align="right"><b>ค่าส่ง</b></td>
          <td align="right">${Number(shipping || 0).toLocaleString()}</td>
        </tr>
        <tr>
          <td colspan="3" align="right"><b>รวมสุทธิ</b></td>
          <td align="right"><b>${Number(total || 0).toLocaleString()}</b></td>
        </tr>
      </tfoot>
    </table>
    <p>ขอบคุณที่สั่งซื้อครับ</p>
  </div>`;
}

export default async function handler(req, res) {
  // CORS + Preflight
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  // อ่าน body JSON ให้ได้เสมอ (ทั้งกรณีเป็น string หรือ object)
  let body = {};
  try {
    if (typeof req.body === "string") {
      body = JSON.parse(req.body || "{}");
    } else {
      body = req.body || {};
    }
  } catch (e) {
    return res.status(400).json({ ok: false, error: "Bad JSON" });
  }

  const { name, email, phone, address, note, cart, shipping = 50 } = body || {};

  // ตรวจฟิลด์จำเป็น
  if (!name || !email || !Array.isArray(cart) || cart.length === 0) {
    return res
      .status(400)
      .json({ ok: false, error: "Missing fields: name, email, cart are required" });
  }

  // คำนวณรวม
  const total =
    cart.reduce(
      (s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0),
      0
    ) + Number(shipping || 0);

  // เตรียมข้อมูลเมล
  const html = orderHtml({
    name,
    email,
    phone,
    address,
    note,
    cart,
    total,
    shipping,
  });

  // ===== ตั้งค่าผู้ส่ง/ผู้รับ =====
  // FROM: ถ้าคุณยังไม่ได้ verify domain ใน Resend ให้ใช้ fallback นี้ไปก่อน
  const FROM = process.env.RESEND_FROM || "onboarding@resend.dev";
  // ร้านจะได้รับสำเนาด้วย (ถ้าตั้งไว้)
  const SHOP = process.env.ORDER_RECEIVER || "";

  try {
    // ส่งถึงลูกค้า
    await resend.emails.send({
      from: FROM,                         // ต้องเป็นอีเมลบนโดเมนที่ verify แล้ว ถ้าไม่มีก็ใช้ onboarding@resend.dev
      to: email,
      subject: "ยืนยันคำสั่งซื้อ | โล๊ะมือสอง",
      html,
    });

    // ส่งสำเนาถึงร้าน (ถ้าตั้งค่า)
    if (SHOP) {
      await resend.emails.send({
        from: FROM,
        to: SHOP,
        subject: `มีออเดอร์ใหม่จาก ${name}`,
        html,
      });
    }

    return res.status(200).json({ ok: true, message: "Mail sent" });
  } catch (err) {
    // แนบรายละเอียดเบื้องต้นเพื่อช่วยไล่ปัญหา
    const msg =
      err?.message ||
      err?.response?.data?.message ||
      "Send email failed";

    // ถ้าเป็น Forbidden (403) ให้บอกสาเหตุที่พบบ่อย
    const hint =
      (err?.statusCode === 403 || String(err?.status).startsWith("403")) ?
      "Resend 403: ตรวจสอบ RESEND_API_KEY และโดเมนของ FROM ต้อง Verified หรือใช้ onboarding@resend.dev ชั่วคราว" :
      null;

    return res.status(500).json({
      ok: false,
      error: `Resend error: ${msg}`,
      hint,
    });
  }
}

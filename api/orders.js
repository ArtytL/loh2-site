// api/orders.js
// Serverless Function ส่งอีเมลยืนยันคำสั่งซื้อด้วย Resend
// วางไฟล์นี้ทับทั้งไฟล์ในโฟลเดอร์ /api ของโปรเจกต์

import { Resend } from 'resend';

export const config = { runtime: 'nodejs' };

const resend = new Resend(process.env.RESEND_API_KEY);

// ใช้ sender ชั่วคราวของ Resend เพื่อเลี่ยง 403 (ยังไม่ได้ verify domain)
const FROM = 'Orders <onboarding@resend.dev>';

// ---------- helper ----------
function json(res, data, status = 200) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(status).end(JSON.stringify(data));
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (m) => (
    { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]
  ));
}

// ---------- handler ----------
export default async function handler(req, res) {
  // CORS (เผื่อเรียกจากโดเมนอื่น)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    return json(res, { ok: false, error: 'Method Not Allowed' }, 405);
  }

  // รับ body เป็น JSON
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return json(res, { ok: false, error: 'Invalid JSON body' }, 400);
  }

  const { name, email, phone, address, note, cart } = body || {};
  if (!email || !cart) {
    return json(res, { ok: false, error: 'Missing email or cart' }, 400);
  }

  // รองรับได้ทั้ง cart เป็นอาเรย์ หรือมี field items
  const items = Array.isArray(cart) ? cart : (cart.items || []);
  const shipping = Number(cart.shipping ?? 50);

  let subtotal = 0;
  const rows = items.map((it, i) => {
    const qty = Number(it.qty || 1);
    const price = Number(it.price || 0);
    const line = qty * price;
    subtotal += line;
    return `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(it.id || '')} ${escapeHtml(it.title || '')}</td>
        <td align="right">${qty}</td>
        <td align="right">${price}</td>
        <td align="right">${line}</td>
      </tr>`;
  }).join('');

  const total = subtotal + shipping;

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial">
      <h2>คำสั่งซื้อใหม่</h2>
      <p>
        <b>ชื่อ:</b> ${escapeHtml(name || '')}<br/>
        <b>อีเมล:</b> ${escapeHtml(email || '')}<br/>
        <b>โทร:</b> ${escapeHtml(phone || '')}<br/>
        <b>ที่อยู่:</b> ${escapeHtml(address || '')}<br/>
        <b>หมายเหตุ:</b> ${escapeHtml(note || '')}
      </p>
      <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;min-width:560px">
        <thead>
          <tr>
            <th>#</th><th>สินค้า</th><th>จำนวน</th><th>ราคา</th><th>รวม</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr><td colspan="4" align="right"><b>ค่าส่ง</b></td><td align="right">${shipping}</td></tr>
          <tr><td colspan="4" align="right"><b>ยอดรวม</b></td><td align="right"><b>${total}</b></td></tr>
        </tfoot>
      </table>
    </div>
  `;

  try {
    // ส่งถึงลูกค้า และถ้าอยากให้ร้านได้ซ้ำ ให้ตั้ง ENV: ORDER_NOTIFY_TO
    await resend.emails.send({
      from: FROM,
      to: [email],
      bcc: process.env.ORDER_NOTIFY_TO ? [process.env.ORDER_NOTIFY_TO] : undefined,
      subject: `ยืนยันคำสั่งซื้อ – ยอดรวม ${total} บาท`,
      html,
    });

    return json(res, { ok: true, total });
  } catch (err) {
    // ถ้าเจอ 403 มักเกิดจาก from ไม่ผ่าน verify → ใช้ onboarding@resend.dev ตามที่ตั้งไว้ด้านบน
    return json(res, {
      ok: false,
      error: `Resend error: ${err?.message || 'unknown'}`,
    }, 500);
  }
}

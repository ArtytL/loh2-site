// /api/orders.js
// API ส่งอีเมลยืนยันคำสั่งซื้อด้วย Resend (REST) และตอบกลับเป็น JSON เสมอ

export const config = { runtime: 'edge' }; // ทำงานบน Edge, ไม่ต้องติดตั้งแพ็กเกจเพิ่ม

function headers() {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: headers() });
}
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (m) => (
    { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]
  ));
}

export default async function handler(req) {
  // CORS preflight
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: headers() });
  if (req.method !== 'POST') return json({ ok:false, error:'Method Not Allowed' }, 405);

  // รับ body (ต้องส่งแบบ JSON)
  let body;
  try {
    body = await req.json();
  } catch {
    const raw = await req.text();
    return json({ ok:false, error:'Invalid JSON body', raw }, 400);
  }

  const { name, email, phone, address, note, cart } = body || {};
  if (!email || !cart) return json({ ok:false, error:'Missing email or cart' }, 400);

  const items = Array.isArray(cart) ? cart : (cart.items || []);
  const shipping = Number(cart.shipping ?? 50);

  let subtotal = 0;
  const rows = items.map((it, i) => {
    const qty   = Number(it.qty || 1);
    const price = Number(it.price || 0);
    const line  = qty * price;
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

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return json({ ok:false, error:'RESEND_API_KEY is not set' }, 500);

  // ใช้ sender ชั่วคราวของ Resend เพื่อเลี่ยง 403 หากยังไม่ verify domain
  const payload = {
    from: 'Orders <onboarding@resend.dev>',
    to: [email],
    bcc: process.env.ORDER_NOTIFY_TO ? [process.env.ORDER_NOTIFY_TO] : undefined,
    subject: `ยืนยันคำสั่งซื้อ – ยอดรวม ${total} บาท`,
    html,
  };

  // เรียก REST API ของ Resend โดยตรง
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  // พยายาม parse เป็น JSON; ถ้าไม่ได้ก็ส่งข้อความดิบกลับ
  const text = await r.text();
  let data = null;
  try { data = JSON.parse(text); } catch { /* not json */ }

  if (!r.ok) {
    return json({
      ok: false,
      status: r.status,
      error: data?.message || data?.error || text || `Resend HTTP ${r.status}`,
    }, 502);
  }

  return json({ ok: true, total, id: data?.id || null });
}

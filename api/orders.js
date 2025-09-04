// /api/orders.js  (โฟลเดอร์รากของโปรเจ็กต์)
// ไม่ต้องใช้ Resend SDK เพื่อเลี่ยงปัญหา import — เรียก REST API ตรง ๆ แทน
export const config = { runtime: "nodejs", regions: ["sin1"] };

function sendJson(res, status, data) {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Only POST is allowed." });
  }

  // parse body (รองรับทั้งที่มาเป็น string และ object)
  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return sendJson(res, 400, { error: "Invalid JSON body." });
  }

  const {
    name,
    email,
    phone,
    address,
    note = "",
    cart,          // array ของสินค้า [{id,title,qty,price}, ...]
    shipping = 50, // ถ้าไม่มีจะ default 50
    total,         // ถ้ามีก็ใช้, ถ้าไม่มีก็จะคำนวณให้
  } = body || {};

  if (!name || !email || !Array.isArray(cart) || cart.length === 0) {
    return sendJson(res, 400, {
      error: "Missing fields: name, email, cart are required",
    });
  }

  const itemsHtml = cart
    .map(
      (it) => `<tr>
        <td>${it.id ?? ""}</td>
        <td>${it.title ?? it.name ?? ""}</td>
        <td style="text-align:right">${it.qty ?? 1}</td>
        <td style="text-align:right">${it.price ?? 0}</td>
      </tr>`
    )
    .join("");

  const computedTotal =
    total ??
    cart.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0) + (shipping || 0);

  const html = `
    <h2>คำสั่งซื้อใหม่</h2>
    <p>
      <b>ชื่อลูกค้า:</b> ${name}<br/>
      <b>อีเมล:</b> ${email}<br/>
      <b>โทร:</b> ${phone ?? ""}<br/>
      <b>ที่อยู่:</b> ${address ?? ""}<br/>
      <b>หมายเหตุ:</b> ${note || "-"}
    </p>
    <table border="1" cellspacing="0" cellpadding="6">
      <thead><tr><th>รหัส</th><th>สินค้า</th><th>จำนวน</th><th>ราคา</th></tr></thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <p>
      <b>ค่าส่ง:</b> ${shipping || 0} บาท<br/>
      <b>ยอดรวม:</b> ${computedTotal} บาท
    </p>
  `;

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return sendJson(res, 500, { error: "Missing RESEND_API_KEY" });
  }

  const from = process.env.RESEND_FROM || "onboarding@resend.dev";
  const to = [email];
  if (process.env.ORDER_RECEIVER) to.push(process.env.ORDER_RECEIVER);

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: `คำสั่งซื้อใหม่จาก ${name}`,
        html,
      }),
    });

    const json = await r.json();
    if (!r.ok) {
      // ส่ง error กลับให้เห็นชัด ๆ (ช่วยดีบัก 403/401/422 ได้)
      return sendJson(res, 502, {
        error: `Resend error ${r.status}`,
        details: json,
      });
    }

    return sendJson(res, 200, { ok: true, id: json.id || null });
  } catch (err) {
    return sendJson(res, 502, {
      error: "Email send failed",
      details: String(err),
    });
  }
}

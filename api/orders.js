// /api/orders.js

export const config = { runtime: "nodejs" };

// ---------- Utils ----------
const json = (res, status, data) => {
  res.status(status).setHeader("Content-Type", "application/json").end(JSON.stringify(data));
};

const allowCors = (req, res) => {
  // ถ้าจะล็อก domain ให้แทน "*" เป็นโดเมนโปรดักชันของคุณ
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

// ---------- Email helper (Resend) ----------
async function sendResendEmail({ subject, to, html, from }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY");

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: from || process.env.MAIL_FROM || "onboarding@resend.dev",
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.message || "Resend send failed");
  return data;
}

function formatMoney(n) {
  return Number(n || 0).toLocaleString("th-TH");
}

function buildEmailHTML(order) {
  const { name, email, phone, address, note, cart = [], shipping = 0, total = 0 } = order;
  const rows = cart
    .map(
      (p) => `
      <tr>
        <td>${p.id || ""}</td>
        <td>${p.title || "-"}</td>
        <td style="text-align:center">${p.qty || 1}</td>
        <td style="text-align:right">${formatMoney(p.price || 0)}</td>
      </tr>`
    )
    .join("");

  return `
  <div style="font-family:system-ui,Segoe UI,TH Sarabun New,Arial,sans-serif;line-height:1.6">
    <h2 style="margin:0 0 12px">${process.env.SITE_NAME || "Order"}</h2>
    <p><b>ชื่อลูกค้า:</b> ${name || "-"}<br/>
       <b>อีเมล:</b> ${email || "-"}<br/>
       <b>โทร:</b> ${phone || "-"}<br/>
       <b>ที่อยู่จัดส่ง:</b> ${address || "-"}</p>

    <table width="100%" cellspacing="0" cellpadding="8" style="border-collapse:collapse">
      <thead>
        <tr style="background:#f5f5f5">
          <th align="left">รหัส</th><th align="left">ชื่อ</th>
          <th align="center">จำนวน</th><th align="right">ราคา</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="4" align="center">- ไม่มีสินค้า -</td></tr>`}</tbody>
      <tfoot>
        <tr><td colspan="3" align="right"><b>ค่าส่ง</b></td><td align="right">${formatMoney(shipping)}</td></tr>
        <tr><td colspan="3" align="right"><b>รวมสุทธิ</b></td><td align="right"><b>${formatMoney(total)}</b></td></tr>
      </tfoot>
    </table>

    ${note ? `<p><b>หมายเหตุ:</b> ${note}</p>` : ""}
    <p style="color:#888;font-size:12px">อีเมลนี้เป็นการยืนยันรับคำสั่งซื้ออัตโนมัติ</p>
  </div>`;
}

// ---------- Handler ----------
export default async function handler(req, res) {
  allowCors(req, res);

  // preflight
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    return json(res, 405, { ok: false, error: "Method Not Allowed" });
  }

  try {
    const order = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    // validate ข้อมูลขั้นต่ำ
    const required = ["name", "email", "phone", "address", "cart", "total"];
    for (const f of required) {
      if (order[f] === undefined || order[f] === null || order[f] === "") {
        return json(res, 400, { ok: false, error: `missing: ${f}` });
      }
    }

    // สร้าง HTML อีเมลครั้งเดียว ใช้ร่วมกันทั้ง "ถึงร้าน" และ "ถึงลูกค้า"
    const html = buildEmailHTML(order);
    const shopTo = process.env.MAIL_TO || process.env.MAIL_FROM || "onboarding@resend.dev";
    const from = process.env.MAIL_FROM || "onboarding@resend.dev";
    const shopSubject = `🧾 ออเดอร์ใหม่จาก ${process.env.SITE_NAME || "ร้าน"} — รวม ${formatMoney(order.total)} บาท`;
    const userSubject = `ยืนยันคำสั่งซื้อ — ${process.env.SITE_NAME || "ร้าน"} (รวม ${formatMoney(order.total)} บาท)`;

    // ส่งอีเมล 2 ฝั่งพร้อมกัน
    await Promise.all([
      sendResendEmail({ subject: shopSubject, to: shopTo, html, from }),
      sendResendEmail({ subject: userSubject, to: order.email, html, from }),
    ]);

    return json(res, 200, { ok: true });
  } catch (err) {
    console.error("ORDER ERROR:", err);
    return json(res, 500, { ok: false, error: String(err.message || err) });
  }
}

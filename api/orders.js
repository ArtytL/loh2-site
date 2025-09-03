// /api/orders.js  — ใช้ Edge runtime จะอ่าน body เป็น JSON ได้ง่าย
export const config = { runtime: "edge" };

// CORS helper (กัน preflight และช่วยทดสอบข้ามโดเมนได้ง่าย)
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders(),
    },
  });
}

export default async function handler(req) {
  // รองรับ OPTIONS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (req.method !== "POST") {
    return json({ ok: false, error: "Method Not Allowed" }, 405);
  }

  // อ่าน body -> JSON อย่างปลอดภัย
  let payload;
  try {
    payload = await req.json();
  } catch (e) {
    const raw = await req.text(); // เผื่อโดนส่งมาเป็น text/HTML
    return json(
      { ok: false, error: "Invalid JSON body", raw: raw?.slice(0, 200) },
      400
    );
  }

  const { name, email, phone, address, note, cart, total } = payload || {};
  if (!name || !email || !Array.isArray(cart) || cart.length === 0) {
    return json(
      { ok: false, error: "Missing fields: name, email, cart are required" },
      400
    );
  }

  // ===== ส่งอีเมลด้วย Resend (ถ้าตั้งค่า RESEND_API_KEY แล้ว) =====
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
      // ยังไม่มี key ก็รับออร์เดอร์ได้ แต่แจ้งว่าไม่ได้ส่งอีเมล
      return json({
        ok: true,
        info: "Order received. (Email not sent: missing RESEND_API_KEY)",
      });
    }

    const html = renderHtml({ name, email, phone, address, note, cart, total });

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Orders <orders@your-domain.example>", // แก้โดเมนให้ถูกของคุณ
        to: [email, "store@example.com"],            // ผู้รับ (ลูกค้า + ร้าน)
        subject: `Order from ${name} (${cart.length} items)`,
        html,
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      return json(
        { ok: false, error: `Resend error ${resp.status}`, detail: t?.slice(0, 300) },
        502
      );
    }

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
}

// ผลิต HTML สำหรับอีเมลแบบง่าย ๆ
function renderHtml({ name, email, phone, address, note, cart, total }) {
  const rows = cart
    .map(
      (p) =>
        `<tr><td>${escapeHtml(p.id)}</td><td>${escapeHtml(
          p.title || ""
        )}</td><td>${p.qty}</td><td>${p.price}</td></tr>`
    )
    .join("");

  return `
    <h2>New Order</h2>
    <p><b>Name:</b> ${escapeHtml(name)}</p>
    <p><b>Email:</b> ${escapeHtml(email)}</p>
    <p><b>Phone:</b> ${escapeHtml(phone || "")}</p>
    <p><b>Address:</b> ${escapeHtml(address || "")}</p>
    <p><b>Note:</b> ${escapeHtml(note || "")}</p>

    <table border="1" cellpadding="6" cellspacing="0">
      <thead><tr><th>Code</th><th>Title</th><th>Qty</th><th>Price</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <p><b>Total:</b> ${total}</p>
  `;
}

function escapeHtml(s = "") {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

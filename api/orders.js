// /api/orders.js  (วางทับไฟล์เดิมได้เลย)

// ---------------- CORS helper ----------------
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

// ---------------- Utilities ------------------
function formatTHB(n) {
  const x = Number(n || 0);
  return x.toLocaleString("th-TH") + " บาท";
}

function cartToText(cart) {
  if (!cart || !Array.isArray(cart.items)) return "(ไม่มีรายการสินค้า)";
  const lines = cart.items.map(
    (it, i) => `${i + 1}. ${it.title || it.name || "-"} (${it.type || "-"}) x${it.qty || 1} = ${formatTHB((it.qty || 1) * (it.price || 0))}`
  );
  lines.push(`ค่าส่ง: ${formatTHB(cart.shipping || 0)}`);
  lines.push(`รวมสุทธิ: ${formatTHB(cart.total || 0)}`);
  return lines.join("\n");
}

function cartToHTML(cart) {
  if (!cart || !Array.isArray(cart.items)) return "<p>(ไม่มีรายการสินค้า)</p>";
  const rows = cart.items
    .map(
      (it, i) => `
      <tr>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:center;">${i + 1}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;">${(it.title || it.name || "-")
        .toString()
        .replace(/</g,"&lt;")}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:center;">${(it.type || "-")}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:center;">${it.qty || 1}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:right;">${formatTHB(it.price || 0)}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:right;">${formatTHB((it.qty || 1) * (it.price || 0))}</td>
      </tr>`
    )
    .join("");
  return `
    <table style="border-collapse:collapse;border:1px solid #ddd;width:100%;max-width:640px">
      <thead>
        <tr style="background:#fafafa">
          <th style="padding:6px 8px;border:1px solid #ddd;">#</th>
          <th style="padding:6px 8px;border:1px solid #ddd;">สินค้า</th>
          <th style="padding:6px 8px;border:1px solid #ddd;">ประเภท</th>
          <th style="padding:6px 8px;border:1px solid #ddd;">จำนวน</th>
          <th style="padding:6px 8px;border:1px solid #ddd;">ราคา/ชิ้น</th>
          <th style="padding:6px 8px;border:1px solid #ddd;">รวม</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="5" style="padding:6px 8px;border:1px solid #ddd;text-align:right;">ค่าส่ง</td>
          <td style="padding:6px 8px;border:1px solid #ddd;text-align:right;">${formatTHB(cart.shipping || 0)}</td>
        </tr>
        <tr>
          <td colspan="5" style="padding:6px 8px;border:1px solid #ddd;text-align:right;"><b>รวมสุทธิ</b></td>
          <td style="padding:6px 8px;border:1px solid #ddd;text-align:right;"><b>${formatTHB(cart.total || 0)}</b></td>
        </tr>
      </tfoot>
    </table>
  `;
}

// ---------------- Main handler ----------------
export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  setCors(res);

  // 1) Handle preflight
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  // 2) Only POST
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method Not Allowed" });
    return;
  }

  // 3) Read JSON safely (แก้ปัญหา Unexpected token)
  let dataText = "";
  try {
    dataText = await new Promise((resolve, reject) => {
      let buf = "";
      req.setEncoding("utf8");
      req.on("data", (c) => (buf += c));
      req.on("end", () => resolve(buf));
      req.on("error", reject);
    });
  } catch (e) {
    res.status(400).json({ ok: false, error: "อ่านข้อมูลจากคำขอไม่สำเร็จ", details: String(e?.message || e) });
    return;
  }

  let payload;
  try {
    payload = dataText ? JSON.parse(dataText) : {};
  } catch (e) {
    res.status(400).json({
      ok: false,
      error: "รูปแบบ JSON ไม่ถูกต้อง",
      details: String(e?.message || e),
      got: dataText?.slice(0, 120) || "",
    });
    return;
  }

  // 4) Validate required fields
  const { name, email, phone, address, note, cart } = payload || {};
  if (!name || !email || !cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    res.status(400).json({
      ok: false,
      error: "ข้อมูลไม่ครบ",
      details: "ต้องมี name, email และ cart.items อย่างน้อย 1 รายการ",
    });
    return;
  }

  // ---------------- Resend config ----------------
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    res.status(500).json({
      ok: false,
      error: "ยังไม่ได้ตั้งค่า RESEND_API_KEY ใน Environment Variables",
    });
    return;
  }

  // โหมดทดสอบ (sandbox): ส่งหาเมลของคุณเท่านั้น (ตามกฎ Resend)
  // ตั้งค่าที่ Vercel: RESEND_TEST_TO = อีเมลเจ้าของบัญชี Resend (เช่น art…@gmail.com)
  const TEST_TO = process.env.RESEND_TEST_TO || ""; // แนะนำให้ใส่เมลตัวเอง
  const ORDER_RECEIVER = process.env.ORDER_RECEIVER || ""; // เมลร้าน สำหรับ production
  const SITE_NAME = process.env.SITE_NAME || "คำสั่งซื้อใหม่";
  const sandbox = !process.env.RESEND_FROM; // ถ้าไม่มี from (โดเมนยังไม่ verify) ถือว่า sandbox

  // ค่า from:
  const from = sandbox
    ? "onboarding@resend.dev"
    : process.env.RESEND_FROM; // เช่น orders@yourdomain.com (ต้อง verify domain แล้ว)

  // รายชื่อผู้รับ (to)
  let to = [];
  if (sandbox) {
    // Sandbox ส่งได้เฉพาะเมลเจ้าของบัญชีเท่านั้น
    to = [TEST_TO || email]; // ถ้าไม่ได้ตั้ง RESEND_TEST_TO จะ fallback เป็น email ลูกค้า (ซึ่งถ้าไม่ใช่ของเจ้าของบัญชีจะโดน 403)
  } else {
    // Production: ส่งถึงลูกค้า และสำเนาถึงร้าน (ถ้าตั้งไว้)
    to = [email];
    if (ORDER_RECEIVER) to.push(ORDER_RECEIVER);
  }

  // ---------------- Compose message ----------------
  const subject = `[${SITE_NAME}] คำสั่งซื้อใหม่จาก ${name}`;
  const text = [
    `${SITE_NAME}`,
    `ชื่อ: ${name}`,
    `อีเมล: ${email}`,
    `โทร: ${phone || "-"}`,
    `ที่อยู่: ${address || "-"}`,
    `หมายเหตุ: ${note || "-"}`,
    ``,
    `รายการสินค้า:`,
    cartToText(cart),
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#111">
      <h2 style="margin:0 0 8px">${SITE_NAME}</h2>
      <p style="margin:0 0 12px">มีคำสั่งซื้อใหม่จากลูกค้า</p>
      <div style="margin:8px 0 14px;padding:10px;border:1px dashed #ccc;border-radius:8px;background:#fafafa">
        <div><b>ชื่อ</b>: ${name}</div>
        <div><b>อีเมล</b>: ${email}</div>
        <div><b>โทร</b>: ${phone || "-"}</div>
        <div><b>ที่อยู่</b>: ${(address || "-").toString().replace(/</g,"&lt;")}</div>
        <div><b>หมายเหตุ</b>: ${(note || "-").toString().replace(/</g,"&lt;")}</div>
      </div>
      ${cartToHTML(cart)}
      <p style="margin-top:14px;color:#555;font-size:12px">อีเมลนี้ถูกส่งโดย Resend</p>
    </div>
  `;

  // ---------------- Call Resend ----------------
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
        subject,
        html,
        text,
      }),
    });

    const out = await r.json().catch(() => ({}));

    if (!r.ok) {
      // ส่งถึงผู้อื่นใน sandbox จะโดน 403 ตรงนี้
      return res.status(r.status).json({
        ok: false,
        error: `Resend error ${r.status}`,
        details: out,
        hint: sandbox
          ? "คุณอยู่ในโหมดทดสอบ (Sandbox): โปรดตั้งค่า RESEND_TEST_TO เป็นอีเมลของเจ้าของบัญชี Resend และลองใหม่"
          : "ตรวจสอบค่า RESEND_FROM (ต้องเป็นอีเมลในโดเมนที่ verify แล้ว) และ ORDER_RECEIVER (ถ้าใส่)",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "ส่งอีเมลคำสั่งซื้อเรียบร้อย",
      id: out?.id || null,
      mode: sandbox ? "sandbox" : "production",
      to,
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: "เกิดข้อผิดพลาดระหว่างเรียก Resend",
      details: String(e?.message || e),
    });
  }
}

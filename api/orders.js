// /api/orders.js
export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method Not Allowed" });
    return;
  }

  // 1) อ่าน body: รองรับทั้ง application/json และ text/plain
  let payload = null;
  try {
    if (req.headers["content-type"]?.includes("application/json")) {
      payload = req.body;
    } else {
      const raw = await readRawBody(req);
      payload = JSON.parse(raw || "{}");
    }
  } catch (e) {
    res.status(400).json({ ok: false, error: "Invalid JSON body" });
    return;
  }

  // 2) ตรวจข้อมูลขั้นต่ำ
  const { name, email, phone, address, note, cart, shipping, total } = payload || {};
  if (!Array.isArray(cart) || cart.length === 0) {
    res.status(400).json({ ok: false, error: "Cart is empty" });
    return;
  }

  // 3) gen หมายเลขสั่งซื้อ
  const orderId = "O" + Date.now().toString(36).toUpperCase();

  // 4) บันทึกออเดอร์ (optional; ถ้ามี kvSet)
  try {
    const { kvSet } = await import("./_utils/kv.js").catch(() => ({ kvSet: null }));
    if (kvSet) {
      const ordersKey = "orders";
      const record = {
        id: orderId,
        at: Date.now(),
        name, email, phone, address, note,
        cart, shipping, total
      };
      // เก็บแบบ array append (อ่านค่าเดิม -> push -> เซฟคืน)
      let current = [];
      try {
        const { kvGet } = await import("./_utils/kv.js");
        const raw = await kvGet(ordersKey);
        current = (raw?.value && JSON.parse(raw.value)) || Array.isArray(raw) ? raw : [];
      } catch {}
      current.push(record);
      await kvSet(ordersKey, JSON.stringify(current));
    }
  } catch (e) {
    // ไม่ critical, แต่อยากรู้ใน log
    console.error("KV save error:", e?.message || e);
  }

  // 5) สร้าง HTML เมล
  const rows = cart.map(
    (p) => `
      <tr>
        <td>${escapeHtml(p.id || "-")}</td>
        <td>${escapeHtml(p.title || "-")}</td>
        <td>${escapeHtml(p.type || "-")}</td>
        <td style="text-align:right">${Number(p.qty || 0)}</td>
        <td style="text-align:right">${Number(p.price || 0).toLocaleString()}</td>
      </tr>`
  ).join("");

  const totalRow = `
    <tr>
      <td colspan="4" style="text-align:right"><b>ค่าส่ง</b></td>
      <td style="text-align:right">${Number(shipping || 0).toLocaleString()}</td>
    </tr>
    <tr>
      <td colspan="4" style="text-align:right"><b>รวมสุทธิ</b></td>
      <td style="text-align:right"><b>${Number(total || 0).toLocaleString()}</b></td>
    </tr>
  `;

  const html = `
    <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Ubuntu,'Helvetica Neue',Arial;">
      <h2>ออเดอร์ใหม่ #${orderId}</h2>
      <p><b>ชื่อ</b> ${escapeHtml(name || "-")}<br/>
         <b>อีเมล</b> ${escapeHtml(email || "-")}<br/>
         <b>โทร</b> ${escapeHtml(phone || "-")}<br/>
         <b>ที่อยู่</b> ${escapeHtml(address || "-")}<br/>
         <b>หมายเหตุ</b> ${escapeHtml(note || "-")}
      </p>
      <table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse;width:100%">
        <thead>
          <tr style="background:#f5f5f5">
            <th align="left">รหัส</th>
            <th align="left">ชื่อ</th>
            <th align="left">ประเภท</th>
            <th align="right">จำนวน</th>
            <th align="right">ราคา</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          ${totalRow}
        </tbody>
      </table>
      <p style="color:#666;margin-top:16px">ส่งจากระบบออเดอร์ loh2-site</p>
    </div>
  `;

  const text = [
    `ออเดอร์ใหม่ #${orderId}`,
    `ชื่อ: ${name || "-"}`,
    `อีเมล: ${email || "-"}`,
    `โทร: ${phone || "-"}`,
    `ที่อยู่: ${address || "-"}`,
    `หมายเหตุ: ${note || "-"}`,
    "",
    "รายการสินค้า:",
    ...cart.map((p) => `- ${p.id || ""} ${p.title || ""} x${p.qty || 0} ราคา ${p.price || 0}`),
    "",
    `ค่าส่ง: ${shipping || 0}`,
    `รวมสุทธิ: ${total || 0}`,
  ].join("\n");

  // 6) ส่งอีเมลด้วย Resend (ง่ายและชัวร์)
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const toAdmin = (process.env.ORDER_MAIL_TO || "").split(",").map(s => s.trim()).filter(Boolean);
    if (toAdmin.length === 0) {
      throw new Error("ORDER_MAIL_TO is empty");
    }

    // ใช้ sender ที่ส่งได้แน่ ถ้ายังไม่ verify domain แนะนำใช้ค่า default ของ Resend
    const from = process.env.ORDER_MAIL_FROM || "onboarding@resend.dev";

    const recipients = [...toAdmin];
    if (email) recipients.push(email); // ส่งให้ลูกค้าด้วย

    const subject = `ออเดอร์ใหม่ #${orderId} • รวม ${Number(total || 0).toLocaleString()} บาท`;

    const result = await resend.emails.send({
      from,
      to: recipients,
      subject,
      html,
      text
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      res.status(500).json({ ok: false, error: "Email send failed", detail: result.error });
      return;
    }

    res.status(200).json({ ok: true, id: orderId, mailId: result?.data?.id || null });

  } catch (e) {
    console.error("Send mail error:", e?.message || e);
    res.status(500).json({ ok: false, error: e?.message || "Send mail failed" });
  }
}

// ========= utils =========
function readRawBody(req) {
  return new Promise((resolve, reject) => {
    try {
      let data = "";
      req.setEncoding("utf8");
      req.on("data", (c) => (data += c));
      req.on("end", () => resolve(data));
    } catch (e) {
      reject(e);
    }
  });
}

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

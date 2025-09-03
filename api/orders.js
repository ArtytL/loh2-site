// /api/orders.js

export const config = { runtime: "nodejs" };

function setCORS(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

async function readRaw(req) {
  return await new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  setCORS(res);

  // 1) preflight
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  // 2) parse body ให้ทนทาน
  let body = {};
  try {
    if (req.headers["content-type"]?.includes("application/json")) {
      body = req.body ?? {};
      if (!Object.keys(body || {}).length) {
        const raw = await readRaw(req);
        body = raw ? JSON.parse(raw) : {};
      }
    } else {
      const raw = await readRaw(req);
      try {
        body = JSON.parse(raw);
      } catch {
        body = Object.fromEntries(new URLSearchParams(raw)); // text/plain / form
      }
    }
  } catch (err) {
    console.error("parse-error", err);
    return res.status(400).json({ ok: false, error: "Invalid body" });
  }

  // 3) โหมดทดสอบ (skip ส่งอีเมล) -> ตอบกลับเลย
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.searchParams.get("echo") === "1") {
    console.log("orders.echo", body);
    return res.status(200).json({ ok: true, echo: true, body });
  }

  // 4) ตรวจฟิลด์ขั้นต่ำ
  if (!body?.email || !Array.isArray(body?.cart)) {
    console.warn("orders.invalid", body);
    return res.status(400).json({ ok: false, error: "Missing email/cart" });
  }

  // log ให้เห็นใน Vercel Logs ชัดๆ
  console.log("orders.new", {
    name: body.name,
    email: body.email,
    total: body.total,
    items: body.cart?.length,
  });

  // 5) ส่งต่อไปปลายทาง (ถ้าตั้ง ENV ไว้) — ไม่ตั้งก็ยังตอบ 200 ได้
  let mailed = false;
  let mailError = null;

  try {
    if (process.env.ORDER_WEBHOOK_URL) {
      const r = await fetch(process.env.ORDER_WEBHOOK_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      mailed = r.ok;
      if (!mailed) mailError = `webhook status ${r.status}`;
    }
    // ตัวอย่างต่อ Resend ก็ทำได้ (ถ้าจะใช้จริงค่อยใส่โค้ด+ENV ตามบริการนั้น)
    // else if (process.env.RESEND_API_KEY && process.env.ORDER_RECIPIENT) { ... }
  } catch (e) {
    mailError = e?.message || String(e);
  }

  // 6) ตอบกลับเสมอเป็น 200 (เพื่อยืนยันเส้นทางก่อน)
  return res.status(200).json({
    ok: true,
    mailed,
    ...(mailError ? { mailError } : {}),
  });
}

// /api/orders.js
export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method Not Allowed" });
    }

    // ✅ รองรับทั้งกรณีที่เป็น string และ object
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : (req.body || {});

    const { name, email, phone, address, cart, shipping, total, note } = body;

    // ✅ ตรวจสอบข้อมูลพื้นฐาน
    if (!name || !phone || !address || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Bad payload: ต้องมี name/phone/address และ cart (array) อย่างน้อย 1 รายการ",
      });
    }

    // TODO: ตรงนี้คุณคงมีโค้ดส่งอีเมล/บันทึกออเดอร์อยู่แล้ว
    // ใส่ต่อจากนี้ได้ตามเดิม เช่น nodemailer ฯลฯ
    // await sendOrderEmail({ name, email, phone, address, cart, shipping, total, note });

    return res.status(200).json({
      ok: true,
      received: { items: cart.length, total },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}

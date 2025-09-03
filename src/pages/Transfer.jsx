// ด้านบนไฟล์
import { useState } from "react";

// ภายใน component หน้าแจ้งโอน/ชำระเงิน
const [form, setForm] = useState({
  name: "", email: "", phone: "", address: "", note: ""
});
const [busy, setBusy] = useState(false);
const [msg, setMsg] = useState("");

async function handleSubmit(e) {
  e?.preventDefault?.();
  setBusy(true); setMsg("");

  try {
    // 1) ดึงตะกร้าจาก localStorage (หรือถ้าใช้ context/store ของคุณ ให้ดึงจากตรงนั้นแทน)
    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    cart = cart.map(p => ({
      id: p.id,
      title: p.title,
      type: p.type || p.category || "",
      qty: Number(p.qty || 1),
      price: Number(p.price || 0),
    }));

    if (!cart.length) throw new Error("ตะกร้าว่าง");

    // 2) คำนวณยอด
    const shipping = 50;
    const subtotal = cart.reduce((s, p) => s + p.price * p.qty, 0);
    const total = subtotal + shipping;

    // 3) ยิงไป API ของเรา (same-origin)
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, cart, shipping, total }),
    });

    // 4) เช็คผลแบบชัวร์ (ต้องเป็น JSON และมี ok:true)
    let data;
    try { data = await res.json(); } 
    catch { throw new Error("คำตอบจากเซิร์ฟเวอร์ไม่ใช่ JSON (อาจโดน Security Checkpoint)"); }

    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || "ส่งคำสั่งซื้อไม่สำเร็จ");
    }

    setMsg("✅ ส่งคำสั่งซื้อเรียบร้อย! เช็กอีเมลได้เลย");
    // ถ้าจะเคลียร์ตะกร้า:
    // localStorage.removeItem("cart");
  } catch (err) {
    console.error(err);
    setMsg("❌ " + err.message);
  } finally {
    setBusy(false);
  }
}

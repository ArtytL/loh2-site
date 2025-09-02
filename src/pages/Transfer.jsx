// ตัวอย่างแก้ส่วนสำคัญในหน้าแจ้งโอน/ชำระเงิน (Transfer.jsx)
import React, { useMemo, useState } from "react";

export default function Transfer() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // ดึงตะกร้าจาก localStorage
  const cart = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("cart") || "[]"); }
    catch { return []; }
  }, []);

  const shipping = cart.length > 0 ? 50 : 0;
  const itemsTotal = cart.reduce((s, x) => s + Number(x.price || 0) * Number(x.qty || 1), 0);
  const total = itemsTotal + shipping;

  async function submit(e) {
    e.preventDefault();
    if (!cart.length) {
      alert("ยังไม่มีสินค้าในตะกร้า");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name, email, phone, address, note,
        cart, shipping, total,
      };
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || "ส่งคำสั่งซื้อไม่สำเร็จ");

      // ล้างตะกร้า แล้วพากลับหน้าแรก
      localStorage.removeItem("cart");
      alert("ส่งคำสั่งซื้อเรียบร้อย! เลขออเดอร์: " + data.id);
      window.location.href = "/#/"; // กลับหน้าหลัก
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit}>
      {/* ตารางสรุปยอด (ใช้ cart, itemsTotal, shipping, total แสดงผล) */}
      {/* ฟอร์มกรอกข้อมูล name / email / phone / address / note */}
      <button disabled={saving} type="submit" className="btn-primary">
        {saving ? "กำลังส่ง..." : "ส่งคำสั่งซื้อ"}
      </button>
    </form>
  );
}

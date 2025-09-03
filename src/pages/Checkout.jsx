// src/pages/Transfer.jsx
import React, { useEffect, useMemo, useState } from "react";

// helper: โหลดตะกร้าจาก localStorage
function loadCart() {
  try {
    const raw = localStorage.getItem("cart");
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export default function Transfer() {
  const [cart, setCart] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    note: "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setCart(loadCart());
  }, []);

  const shipping = 50;
  const subtotal = useMemo(
    () => cart.reduce((s, p) => s + Number(p.price || 0) * Number(p.qty || 1), 0),
    [cart]
  );
  const total = subtotal + shipping;

  async function handleSubmit(e) {
    e?.preventDefault?.();
    setBusy(true);
    setMsg("");

    try {
      if (!cart.length) throw new Error("ตะกร้าว่าง – กรุณาเลือกสินค้าก่อน");

      // map ตะกร้าให้สะอาด
      const cleanCart = cart.map((p) => ({
        id: p.id,
        title: p.title,
        type: p.type || p.category || "",
        qty: Number(p.qty || 1),
        price: Number(p.price || 0),
      }));

      // ยิงไป API เดิม (same-origin)
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          cart: cleanCart,
          shipping,
          total,
        }),
      });

      // ต้อง parse เป็น JSON และมี ok:true เท่านั้นถึงถือว่าสำเร็จ
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("คำตอบจากเซิร์ฟเวอร์ไม่ใช่ JSON (อาจเจอ Security Checkpoint)");
      }
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "ส่งคำสั่งซื้อไม่สำเร็จ");
      }

      setMsg("✅ ส่งคำสั่งซื้อสำเร็จ! กรุณาเช็กอีเมล (ของร้านและของลูกค้า)");
      // จะลบตะกร้าหลังส่งก็ได้:
      // localStorage.removeItem("cart");
      // setCart([]);
    } catch (err) {
      console.error(err);
      setMsg("❌ " + (err?.message || "เกิดข้อผิดพลาด"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">สรุปยอด / แจ้งโอน</h1>

      {/* สรุปรายการสินค้า */}
      <div className="border rounded-lg p-4 mb-6">
        {cart.length === 0 ? (
          <p className="text-sm text-gray-500">ตะกร้ายังว่างอยู่</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">สินค้า</th>
                  <th className="text-right py-2">จำนวน</th>
                  <th className="text-right py-2">ราคา</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((p, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2">{p.title}</td>
                    <td className="py-2 text-right">{p.qty || 1}</td>
                    <td className="py-2 text-right">
                      {(Number(p.price || 0) * Number(p.qty || 1)).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="py-2 text-right" colSpan={2}>
                    ค่าส่ง
                  </td>
                  <td className="py-2 text-right">{shipping.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="py-2 text-right font-semibold" colSpan={2}>
                    รวมสุทธิ
                  </td>
                  <td className="py-2 text-right font-semibold">
                    {total.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </>
        )}
      </div>

      {/* ฟอร์มข้อมูลลูกค้า + onSubmit ผูกตรงนี้! */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="ชื่อ-นามสกุล"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="อีเมล"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="เบอร์โทร"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            required
          />
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="ที่อยู่จัดส่ง (บ้าน/แขวง/เขต/จังหวัด/รหัสไปรษณีย์)"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            required
          />
        </div>
        <textarea
          className="border rounded px-3 py
::contentReference[oaicite:0]{index=0}

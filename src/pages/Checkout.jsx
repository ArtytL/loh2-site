// src/pages/Checkout.jsx
import React, { useEffect, useState } from "react";

export default function Checkout() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    note: "",
  });
  const [cart, setCart] = useState([]);

  useEffect(() => {
    // อ่านตะกร้าจาก localStorage
    try {
      const c = JSON.parse(localStorage.getItem("cart") || "[]");
      setCart(c);
    } catch (e) {
      setCart([]);
    }
  }, []);

  const total = cart.reduce((s, i) => s + Number(i.price || 0) * Number(i.qty || 0), 0);
  const shipping = cart.length ? 50 : 0;
  const grand = total + shipping;

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submit(e) {
    e.preventDefault();

    const payload = {
      ...form,
      cart,
      shipping,
      total: grand,
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "text/plain" }, // ตรงกับฝั่ง server
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.ok) {
        alert("ส่งคำสั่งซื้อเรียบร้อย");
      } else {
        alert("ส่งคำสั่งซื้อไม่สำเร็จ");
      }
    } catch (err) {
      console.error(err);
      alert("ส่งคำสั่งซื้อไม่สำเร็จ");
    }
  }

  return (
    <div className="container-max mx-auto px-4 py-8">
      <h1 className="h1 mb-6">แจ้งโอน</h1>

      {/* สรุปรายการ */}
      <div className="mb-8">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b">
              <th className="py-2">ชื่อ</th>
              <th className="py-2">ประเภท</th>
              <th className="py-2 text-right">จำนวน</th>
              <th className="py-2 text-right">ราคา</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((p) => (
              <tr className="border-b" key={`${p.id}-${p.type || ""}`}>
                <td className="py-2">{p.title}</td>
                <td className="py-2">{p.type}</td>
                <td className="py-2 text-right">{p.qty}</td>
                <td className="py-2 text-right">{(Number(p.price) * Number(p.qty)).toLocaleString()}</td>
              </tr>
            ))}
            <tr>
              <td className="py-2" colSpan={3}>
                รวมสินค้า
              </td>
              <td className="py-2 text-right">{total.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="py-2" colSpan={3}>
                ค่าส่ง
              </td>
              <td className="py-2 text-right">{shipping.toLocaleString()}</td>
            </tr>
            <tr className="font-semibold">
              <td className="py-2" colSpan={3}>
                รวมสุทธิ
              </td>
              <td className="py-2 text-right">{grand.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ฟอร์มลูกค้า */}
      <form onSubmit={submit} className="space-y-3">
        <input
          name="name"
          value={form.name}
          onChange={onChange}
          placeholder="ชื่อ-นามสกุล"
          className="w-full border rounded px-3 py-2"
          required
        />
        <input
          name="email"
          value={form.email}
          onChange={onChange}
          placeholder="อีเมล"
          className="w-full border rounded px-3 py-2"
          type="email"
          required
        />
        <input
          name="phone"
          value={form.phone}
          onChange={onChange}
          placeholder="เบอร์โทร"
          className="w-full border rounded px-3 py-2"
          required
        />
        <textarea
          name="address"
          value={form.address}
          onChange={onChange}
          placeholder="ที่อยู่จัดส่ง"
          className="w-full border rounded px-3 py-2"
          rows={3}
          required
        />
        <input
          name="note"
          value={form.note}
          onChange={onChange}
          placeholder="หมายเหตุ (ถ้ามี)"
          className="w-full border rounded px-3 py-2"
        />
        <button type="submit" className="btn-primary w-full">
          ส่งคำสั่งซื้อ
        </button>
      </form>
    </div>
  );
}

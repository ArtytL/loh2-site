// src/pages/Checkout.jsx
// ฟอร์มเช็คเอาต์: ส่ง JSON ไปยัง /api/orders และแสดงผลลัพธ์

import React, { useState } from "react";
import * as cart from "../lib/cart.js"; // ปรับ path ถ้า lib อยู่ที่อื่น

export default function Checkout() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    note: "",
  });
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  // ดึงรายการในตะกร้า + ยอดรวม
  const items =
    typeof cart.getItems === "function"
      ? cart.getItems()
      : typeof cart.items === "function"
      ? cart.items()
      : Array.isArray(cart.items)
      ? cart.items
      : [];

  const count =
    typeof cart.getCount === "function" ? cart.getCount() : items.length;

  const subtotal = items.reduce(
    (sum, it) => sum + Number(it.price || 0) * Number(it.qty || 1),
    0
  );
  const shipping = 50; // ปรับตามจริง
  const total = subtotal + shipping;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setSending(true);
    try {
      // เตรียม payload เป็น JSON
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        note: form.note,
        cart: {
          items: items,
          shipping: shipping,
        },
      };

      // เรียก API /api/orders — ตรงนี้คือ “ฝั่งหน้าเว็บ”
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // พยายามอ่านเป็น JSON เสมอ (ถ้าไม่ใช่ JSON จะโยน error พร้อมข้อความดิบ)
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || "Server did not return JSON");
      }

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      // สำเร็จ
      setMessage(`ส่งคำสั่งซื้อสำเร็จ! เลขที่อีเมล: ${data.id || "-"}`);
      // ล้างตะกร้า (ถ้ามีฟังก์ชัน)
      if (typeof cart.clear === "function") cart.clear();
      else if (typeof cart.reset === "function") cart.reset();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">ชำระเงิน / แจ้งโอน</h1>

      {/* สรุปรายการสั้น ๆ */}
      <div className="mb-6 p-4 rounded border">
        <div className="flex justify-between text-sm">
          <div>จำนวนสินค้า</div>
          <div>{count} ชิ้น</div>
        </div>
        <div className="flex justify-between text-sm">
          <div>ค่าสินค้า</div>
          <div>{subtotal} บาท</div>
        </div>
        <div className="flex justify-between text-sm">
          <div>ค่าส่ง</div>
          <div>{shipping} บาท</div>
        </div>
        <div className="flex justify-between font-bold text-lg mt-2">
          <div>รวมสุทธิ</div>
          <div>{total} บาท</div>
        </div>
      </div>

      {/* ฟอร์มข้อมูลผู้รับ */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">ชื่อ-นามสกุล</label>
          <input
            className="w-full border rounded px-3 py-2"
            name="name"
            value={form.name}
            onChange={onChange}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">อีเมล</label>
          <input
            className="w-full border rounded px-3 py-2"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">เบอร์โทร</label>
          <input
            className="w-full border rounded px-3 py-2"
            name="phone"
            value={form.phone}
            onChange={onChange}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">ที่อยู่จัดส่ง</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            name="address"
            rows={3}
            value={form.address}
            onChange={onChange}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">หมายเหตุ (ถ้ามี)</label>
          <input
            className="w-full border rounded px-3 py-2"
            name="note"
            value={form.note}
            onChange={onChange}
            placeholder="ระบุเวลาจัดส่ง ฯลฯ"
          />
        </div>

        {/* แสดงข้อความผลลัพธ์ */}
        {message && (
          <div
            className={`mt-3 text-sm ${
              message.startsWith("Error:") ? "text-red-600" : "text-green-700"
            }`}
          >
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={sending}
          className="mt-4 inline-flex items-center justify-center px-5 py-2.5 rounded bg-black text-white hover:opacity-90 disabled:opacity-50"
        >
          {sending ? "กำลังส่ง..." : "ส่งคำสั่งซื้อ"}
        </button>
      </form>
    </div>
  );
}

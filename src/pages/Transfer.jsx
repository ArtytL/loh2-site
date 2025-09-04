// src/pages/Checkout.jsx
// ฟอร์มเช็คเอาต์/แจ้งโอน: UI เรียบร้อย + ส่ง JSON ที่ถูกต้องไป /api/orders

import React, { useMemo, useState } from "react";
import * as cart from "../lib/cart.js"; // ปรับ path ถ้าต่างออกไป

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

  // --- ดึงรายการจากตะกร้า (รองรับได้หลายแบบของ lib/cart.js) ---
  const items = useMemo(() => {
    try {
      if (typeof cart.getItems === "function") return cart.getItems();
      if (typeof cart.items === "function") return cart.items();
      if (Array.isArray(cart.items)) return cart.items;
      return [];
    } catch {
      return [];
    }
  }, []);

  const count = useMemo(() => {
    if (typeof cart.getCount === "function") return cart.getCount();
    return items.length;
  }, [items]);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + Number(it.price || 0) * Number(it.qty || 1), 0),
    [items]
  );

  const shipping = 50; // แก้ตามจริง
  const total = subtotal + shipping;

  const setF = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validate = () => {
    if (!form.name.trim()) return "กรุณากรอก ชื่อ-นามสกุล";
    if (!form.email.trim()) return "กรุณากรอก อีเมล";
    if (items.length === 0) return "ตะกร้าว่าง (ยังไม่มีสินค้าที่จะสั่งซื้อ)";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const v = validate();
    if (v) {
      setMessage(`Error: ${v}`);
      return;
    }

    setSending(true);
    try {
      // สร้าง payload ให้ backend ตามที่ต้องการ: name, email, cart (จำเป็น)
      const cartPayload = items.map((it) => ({
        id: it.id,
        title: it.title,
        type: it.type,
        qty: Number(it.qty || 1),
        price: Number(it.price || 0),
      }));

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        note: form.note.trim(),
        cart: {
          items: cartPayload,
          shipping: Number(shipping),
        },
        total: Number(total),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

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

      setMessage(`ส่งคำสั่งซื้อสำเร็จ! เลขอ้างอิง: ${data.id || "-"}`);

      // ล้างตะกร้าเมื่อสำเร็จ (รองรับหลายรูปแบบ)
      if (typeof cart.clear === "function") cart.clear();
      else if (typeof cart.reset === "function") cart.reset();
      // ถ้าต้องการ redirect ก็ทำตรงนี้ได้
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* หัวเรื่อง */}
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          ชำระเงิน / แจ้งโอน
        </h1>
      </header>

      {/* สองคอลัมน์: สรุปรายการ / ฟอร์มผู้รับ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* กล่องสรุปรายการ */}
        <section className="rounded-2xl border p-5">
          <h2 className="text-xl font-semibold mb-4">สรุปรายการ</h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>จำนวนสินค้า</span>
              <span>{count} ชิ้น</span>
            </div>
            <div className="flex justify-between">
              <span>ค่าสินค้า</span>
              <span>{subtotal} บาท</span>
            </div>
            <div className="flex justify-between">
              <span>ค่าส่ง</span>
              <span>{shipping} บาท</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
              <span>รวมสุทธิ</span>
              <span>{total} บาท</span>
            </div>
          </div>

          {/* ถ้าอยากโชว์รายการย่อย */}
          {items.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold mb-2">รายการในตะกร้า</h3>
              <ul className="space-y-1 text-sm">
                {items.map((it, i) => (
                  <li key={i} className="flex justify-between">
                    <span>
                      {it.title} ({it.type}) × {it.qty}
                    </span>
                    <span>{Number(it.price) * Number(it.qty || 1)} ฿</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* ฟอร์มผู้รับ/ที่อยู่ */}
        <section className="rounded-2xl border p-5">
          <h2 className="text-xl font-semibold mb-4">ข้อมูลผู้รับ</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">ชื่อ-นามสกุล</label>
              <input
                name="name"
                value={form.name}
                onChange={setF}
                required
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-black/50"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">อีเมล</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={setF}
                required
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-black/50"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">เบอร์โทร</label>
              <input
                name="phone"
                value={form.phone}
                onChange={setF}
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-black/50"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">ที่อยู่จัดส่ง</label>
              <textarea
                name="address"
                rows={3}
                value={form.address}
                onChange={setF}
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-black/50"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">หมายเหตุ (ถ้ามี)</label>
              <input
                name="note"
                value={form.note}
                onChange={setF}
                placeholder="ระบุเวลาจัดส่ง ฯลฯ"
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-black/50"
              />
            </div>

            {/* แจ้งผล */}
            {message && (
              <div
                className={`text-sm ${
                  message.startsWith("Error:") ? "text-red-600" : "text-green-700"
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-2.5 text-white font-medium hover:opacity-90 disabled:opacity-50"
            >
              {sending ? "กำลังส่ง..." : "ส่งคำสั่งซื้อ"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

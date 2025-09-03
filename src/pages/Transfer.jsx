// src/pages/Transfer.jsx
import React, { useEffect, useMemo, useState } from "react";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  } catch {
    return [];
  }
}
function setCart(items) {
  localStorage.setItem("cart", JSON.stringify(items || []));
  window.dispatchEvent(new CustomEvent("cart:changed"));
}

export default function Transfer() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    note: "",
  });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setItems(getCart());
  }, []);

  const shipping = 50;
  const subtotal = useMemo(
    () => items.reduce((s, it) => s + (it.qty || 0) * (it.price || 0), 0),
    [items]
  );
  const total = subtotal + shipping;

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError("");

    try {
      const payload = {
        ...form,
        cart: items.map((i) => ({
          id: i.id,
          title: i.title,
          type: i.type,
          qty: i.qty,
          price: i.price,
        })),
        shipping,
        total,
      };

      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then((r) => r.json());

      if (!r.ok) throw new Error(r.error || "ส่งคำสั่งซื้อไม่สำเร็จ");
      setDone(true);
      setCart([]); // เคลียร์ตะกร้า
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <main className="container-max mx-auto px-4 py-8">
        <h1 className="h1 mb-6">ส่งคำสั่งซื้อแล้ว</h1>
        <p>ขอบคุณครับ เราได้รับคำสั่งซื้อเรียบร้อยแล้ว กรุณาตรวจสอบอีเมลของคุณ</p>
      </main>
    );
  }

  return (
    <main className="container-max mx-auto px-4 py-8">
      <h1 className="h1 mb-6">แจ้งโอน</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* สรุปรายการ */}
        <section>
          <h2 className="text-xl font-bold mb-3">สรุปรายการ</h2>
          {items.length === 0 ? (
            <p>ตะกร้าของคุณยังว่างอยู่</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">สินค้า</th>
                  <th className="text-right py-2">จำนวน</th>
                  <th className="text-right py-2">ราคา</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-b">
                    <td className="py-2">{it.title}</td>
                    <td className="text-right py-2">{it.qty}</td>
                    <td className="text-right py-2">
                      {Number(it.price * it.qty).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="py-2">ค่าส่ง</td>
                  <td />
                  <td className="text-right py-2">{shipping.toLocaleString()}</td>
                </tr>
                <tr className="font-semibold">
                  <td className="py-2">รวมสุทธิ</td>
                  <td />
                  <td className="text-right py-2">{total.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </section>

        {/* ฟอร์มข้อมูลผู้รับ */}
        <section>
          <h2 className="text-xl font-bold mb-3">ข้อมูลผู้รับ</h2>

          <form onSubmit={onSubmit} className="space-y-3">
            <input
              className="w-full border rounded px-3 py-2"
              name="name"
              placeholder="ชื่อ-นามสกุล"
              value={form.name}
              onChange={onChange}
              required
            />
            <input
              className="w-full border rounded px-3 py-2"
              name="email"
              type="email"
              placeholder="อีเมล"
              value={form.email}
              onChange={onChange}
              required
            />
            <input
              className="w-full border rounded px-3 py-2"
              name="phone"
              placeholder="เบอร์โทร"
              value={form.phone}
              onChange={onChange}
            />
            <textarea
              className="w-full border rounded px-3 py-2"
              name="address"
              rows={3}
              placeholder="ที่อยู่จัดส่ง"
              value={form.address}
              onChange={onChange}
              required
            />
            <input
              className="w-full border rounded px-3 py-2"
              name="note"
              placeholder="หมายเหตุ (ถ้ามี)"
              value={form.note}
              onChange={onChange}
            />

            {error && (
              <p className="text-red-600 text-sm">Error: {error}</p>
            )}

            <button
              className="btn-primary w-full"
              type="submit"
              disabled={sending || items.length === 0}
            >
              {sending ? "กำลังส่ง..." : "ส่งคำสั่งซื้อ"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

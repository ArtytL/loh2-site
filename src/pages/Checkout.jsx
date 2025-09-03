// src/pages/Checkout.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  } catch {
    return [];
  }
}
function saveCart(items) {
  localStorage.setItem("cart", JSON.stringify(items || []));
  // แจ้ง header ให้รีเฟรชตัวเลขตะกร้า
  window.dispatchEvent(new CustomEvent("cart:changed"));
}

export default function Checkout() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(loadCart());
  }, []);

  const shipping = items.length > 0 ? 50 : 0;
  const subtotal = useMemo(
    () => items.reduce((s, it) => s + (it.qty || 0) * (it.price || 0), 0),
    [items]
  );
  const total = subtotal + shipping;

  const inc = (id) =>
    setItems((prev) => {
      const next = prev.map((i) =>
        i.id === id ? { ...i, qty: (i.qty || 1) + 1 } : i
      );
      saveCart(next);
      return next;
    });

  const dec = (id) =>
    setItems((prev) => {
      const next = prev.map((i) =>
        i.id === id ? { ...i, qty: Math.max(1, (i.qty || 1) - 1) } : i
      );
      saveCart(next);
      return next;
    });

  const removeItem = (id) =>
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      saveCart(next);
      return next;
    });

  return (
    <main className="container-max mx-auto px-4 py-8">
      <header className="flex items-center justify-between mb-6">
        <h1 className="h1">ตะกร้าสินค้า</h1>
        <Link to="/transfer" className="btn-primary">
          ชำระเงิน
        </Link>
      </header>

      {items.length === 0 ? (
        <p>ยังไม่มีสินค้าในตะกร้า</p>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* รายการสินค้า */}
          <section className="lg:col-span-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">สินค้า</th>
                  <th className="text-right py-2">ราคา</th>
                  <th className="text-center py-2">จำนวน</th>
                  <th className="text-right py-2">รวม</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-b">
                    <td className="py-2">{i.title}</td>
                    <td className="text-right py-2">
                      {Number(i.price).toLocaleString()}
                    </td>
                    <td className="text-center py-2">
                      <div className="inline-flex items-center gap-2">
                        <button
                          className="px-2 border rounded"
                          onClick={() => dec(i.id)}
                        >
                          -
                        </button>
                        <span>{i.qty}</span>
                        <button
                          className="px-2 border rounded"
                          onClick={() => inc(i.id)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="text-right py-2">
                      {Number((i.qty || 0) * (i.price || 0)).toLocaleString()}
                    </td>
                    <td className="text-right py-2">
                      <button
                        className="text-red-600"
                        onClick={() => removeItem(i.id)}
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* สรุปคำสั่งซื้อ */}
          <aside className="border rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-3">สรุปคำสั่งซื้อ</h2>
            <div className="flex justify-between py-1">
              <span>รวมสินค้า</span>
              <span>{subtotal.toLocaleString()} ฿</span>
            </div>
            <div className="flex justify-between py-1">
              <span>ค่าส่ง</span>
              <span>{shipping.toLocaleString()} ฿</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between py-1 font-bold">
              <span>รวมสุทธิ</span>
              <span>{total.toLocaleString()} ฿</span>
            </div>
            <Link
              to="/transfer"
              className="btn-primary w-full mt-4 block text-center"
            >
              ไปหน้าแจ้งโอน
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}

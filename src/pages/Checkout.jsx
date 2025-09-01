// src/pages/Checkout.jsx
import React, { useEffect, useMemo, useState } from "react";

/** ตั้งค่าเริ่มต้น */
const SHIPPING = Number(import.meta.env.VITE_SHIPPING_FEE ?? 50);

/** helper แปลงราคา */
const fmt = (n) =>
  (Number(n) || 0).toLocaleString("th-TH", { maximumFractionDigits: 0 });

/** อ่าน/เขียนตะกร้าจาก localStorage (รองรับทั้ง CART และ cart) */
function readCart() {
  try {
    const str =
      localStorage.getItem("CART") ?? localStorage.getItem("cart") ?? "[]";
    return JSON.parse(str) || [];
  } catch {
    return [];
  }
}
function writeCart(items) {
  const str = JSON.stringify(items || []);
  localStorage.setItem("CART", str);
  localStorage.setItem("cart", str); // เขียนซ้ำให้ทั้งสอง key
}

export default function Checkout() {
  const [cart, setCart] = useState(() => readCart());

  // ฟอร์มลูกค้า
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    note: "",
  });

  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");

  /** ยอดรวมสินค้า */
  const itemsTotal = useMemo(
    () => cart.reduce((s, it) => s + Number(it.price || 0) * Number(it.qty || 1), 0),
    [cart]
  );
  const grandTotal = itemsTotal + SHIPPING;

  useEffect(() => {
    // sync ตะกร้ากลับ localStorage ทุกครั้งที่มีการแก้ไข
    writeCart(cart);
  }, [cart]);

  /** ลบสินค้า 1 รายการ */
  const removeItem = (id) => {
    setCart((list) => list.filter((it) => it.id !== id));
  };

  /** เปลี่ยนจำนวน */
  const changeQty = (id, qty) => {
    setCart((list) =>
      list.map((it) => (it.id === id ? { ...it, qty: Math.max(1, Number(qty) || 1) } : it))
    );
  };

  /** onChange ฟอร์ม */
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  /** ส่งออเดอร์ไป API (JSON) */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!cart.length) {
      setMsg("ตะกร้าว่าง");
      return;
    }
    if (!form.name || !form.email || !form.phone || !form.address) {
      setMsg("กรอกข้อมูลให้ครบก่อนส่ง");
      return;
    }

    try {
      setSending(true);

      // เตรียม payload
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        note: form.note,
        cart,               // [{ id, title, type, qty, price, ... }]
        shipping: SHIPPING, // ค่าส่ง
        total: grandTotal,  // ยอดรวมสุทธิ
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // รองรับ error ที่ไม่ใช่ JSON ด้วย
      let data = null;
      try {
        data = await res.json();
      } catch {
        throw new Error("เซิร์ฟเวอร์ตอบกลับไม่ใช่ JSON");
      }

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "ส่งคำสั่งซื้อไม่สำเร็จ");
      }

      // สำเร็จ
      setMsg(`✅ ส่งคำสั่งซื้อเรียบร้อย! เลขที่ออเดอร์: ${data.id ?? "-"}`);
      setCart([]);           // ล้างตะกร้า
      writeCart([]);         // sync localStorage
    } catch (err) {
      setMsg(`❌ ${String(err.message || err)}`);
    } finally {
      setSending(false);
    }
  };

  /** UI */
  return (
    <section style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <h1>เช็คเอาต์</h1>

      {/* ตารางสินค้าในตะกร้า */}
      <div style={{ overflowX: "auto", margin: "16px 0 24px" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #eee",
          }}
        >
          <thead>
            <tr style={{ background: "#f6f6f6" }}>
              <th style={th}>รหัส</th>
              <th style={th}>ชื่อ</th>
              <th style={th}>ประเภท</th>
              <th style={th}>จำนวน</th>
              <th style={th}>ราคา</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {cart.map((it) => (
              <tr key={it.id}>
                <td style={td}>{it.id}</td>
                <td style={td}>{it.title || "-"}</td>
                <td style={td}>{it.type || "-"}</td>
                <td style={td}>
                  <input
                    type="number"
                    min={1}
                    value={Number(it.qty || 1)}
                    onChange={(e) => changeQty(it.id, e.target.value)}
                    style={{ width: 64, textAlign: "right" }}
                  />
                </td>
                <td style={{ ...td, textAlign: "right" }}>
                  {fmt((it.qty || 1) * (it.price || 0))}
                </td>
                <td style={{ ...td, textAlign: "right" }}>
                  <button onClick={() => removeItem(it.id)}>ลบ</button>
                </td>
              </tr>
            ))}

            {/* รวมสินค้า */}
            <tr>
              <td style={td} colSpan={4}>
                รวมสินค้า
              </td>
              <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>
                {fmt(itemsTotal)}
              </td>
              <td style={td}></td>
            </tr>

            {/* ค่าส่ง */}
            <tr>
              <td style={td} colSpan={4}>
                ค่าส่ง
              </td>
              <td style={{ ...td, textAlign: "right" }}>{fmt(SHIPPING)}</td>
              <td style={td}></td>
            </tr>

            {/* รวมสุทธิ */}
            <tr>
              <td style={{ ...td, fontWeight: 700 }} colSpan={4}>
                รวมสุทธิ
              </td>
              <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>
                {fmt(grandTotal)}
              </td>
              <td style={td}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ฟอร์มลูกค้า */}
      <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
        <div style={row}>
          <label style={label}>ชื่อ-นามสกุล</label>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            required
            style={input}
          />
        </div>

        <div style={row}>
          <label style={label}>อีเมล</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            required
            style={input}
          />
        </div>

        <div style={row}>
          <label style={label}>เบอร์โทร</label>
          <input
            name="phone"
            value={form.phone}
            onChange={onChange}
            required
            style={input}
          />
        </div>

        <div style={row}>
          <label style={label}>ที่อยู่จัดส่ง</label>
          <textarea
            rows={3}
            name="address"
            value={form.address}
            onChange={onChange}
            required
            style={{ ...input, height: 96 }}
          />
        </div>

        <div style={row}>
          <label style={label}>หมายเหตุ (ถ้ามี)</label>
          <input
            name="note"
            value={form.note}
            onChange={onChange}
            style={input}
          />
        </div>

        <button
          type="submit"
          disabled={sending || !cart.length}
          style={{
            width: "100%",
            padding: 14,
            background: "#111",
            color: "#fff",
            borderRadius: 10,
            border: "1px solid #111",
            cursor: sending ? "not-allowed" : "pointer",
          }}
        >
          {sending ? "กำลังส่งสั่งซื้อ..." : "ส่งสั่งซื้อ"}
        </button>

        {msg && (
          <p style={{ marginTop: 12, color: msg.startsWith("✅") ? "green" : "#c00" }}>
            {msg}
          </p>
        )}
      </form>
    </section>
  );
}

/** สไตล์เล็กน้อย */
const th = {
  padding: "12px 10px",
  borderBottom: "1px solid #eee",
  textAlign: "left",
};
const td = {
  padding: "10px",
  borderBottom: "1px solid #f0f0f0",
};
const row = { marginBottom: 12 };
const label = { display: "block", marginBottom: 6, fontWeight: 600 };
const input = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #ddd",
  borderRadius: 8,
  outline: "none",
};

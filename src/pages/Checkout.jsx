// src/pages/Checkout.jsx
import { useState, useMemo } from "react";

const API_URL = import.meta.env.VITE_API_URL;
const SEND_URL  = `${API_URL.replace(/\/$/, '')}/send-order`;
const SHIPPING = Number(import.meta.env.VITE_SHIPPING_FEE || 50);

// utils
const fmt = (n) =>
  (Number(n) || 0).toLocaleString("th-TH", { maximumFractionDigits: 0 }) + " บาท";
const getCart = () => {
  try {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  } catch {
    return [];
  }
};
const saveCart = (c) => localStorage.setItem("cart", JSON.stringify(c));

export default function Checkout() {
  const [cart, setCart] = useState(getCart());
  const [form, setForm] = useState({
    orderId: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    note: "",
  });
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");

  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 1), 0),
    [cart]
  );
  const grand = subtotal + SHIPPING;

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  function inc(idx, d = 1) {
    const next = [...cart];
    next[idx].qty = Math.max(1, (Number(next[idx].qty) || 1) + d);
    setCart(next);
    saveCart(next);
  }
  function removeItem(idx) {
    const next = cart.filter((_, i) => i !== idx);
    setCart(next);
    saveCart(next);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    if (cart.length === 0) {
      setMsg("ตะกร้ายังว่าง");
      return;
    }
    if (!form.name || !form.email || !form.phone || !form.address) {
      setMsg("กรอกข้อมูลให้ครบก่อนน้า");
      return;
    }
    try {
      setSending(true);
      const orderId = form.orderId || `INV-${Date.now()}`;
      // ส่งเฉพาะ "ค่าสินค้า" ให้ API (ค่าส่ง API จะบวกเอง)
      const payload = {
        orderId,
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        note: form.note,
        cart,
        total: subtotal,
      };
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "ส่งออเดอร์ไม่สำเร็จ");

      // เคลียร์ตะกร้า แล้วพาไปหน้าแจ้งโอน พร้อมพรีฟิลข้อมูล
      localStorage.removeItem("cart");
      setCart([]);

      const params = new URLSearchParams({
        orderId,
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        amount: String(grand), // ยอดที่ลูกค้าต้องโอน = สินค้า + ค่าส่ง
      });
      window.location.hash = `#/transfer?${params.toString()}`;
    } catch (err) {
      setMsg(err.message || String(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <section style={{ maxWidth: 980, margin: "0 auto" }}>
      <h1>เช็คเอาต์</h1>

      {/* ตะกร้า */}
      {cart.length === 0 ? (
        <p style={{ color: "#888" }}>ตะกร้ายังว่าง</p>
      ) : (
        <div style={{ ...card, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>สรุปรายการ</h3>
          {cart.map((it, idx) => {
            const line = (Number(it.price) || 0) * (Number(it.qty) || 1);
            return (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto auto",
                  gap: 12,
                  alignItems: "center",
                  borderBottom: "1px solid #eee",
                  padding: "8px 0",
                }}
              >
                <div>{it.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button onClick={() => inc(idx, -1)} style={chip}>-</button>
                  <span>{it.qty}</span>
                  <button onClick={() => inc(idx, +1)} style={chip}>+</button>
                </div>
                <div style={{ textAlign: "right" }}>{fmt(it.price)}</div>
                <div style={{ textAlign: "right", minWidth: 90 }}>{fmt(line)}</div>
                <button onClick={() => removeItem(idx)} style={linkBtn}>ลบ</button>
              </div>
            );
          })}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <div>ค่าสินค้ารวม</div>
            <div>{fmt(subtotal)}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>ค่าส่ง</div>
            <div>{fmt(SHIPPING)}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
            <div>ยอดชำระ</div>
            <div>{fmt(grand)}</div>
          </div>
        </div>
      )}

      {/* ฟอร์มผู้สั่งซื้อ */}
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>หมายเลขออเดอร์ (เว้นว่างได้)
          <input name="orderId" value={form.orderId} onChange={onChange} style={input} />
        </label>
        <label>ชื่อ-นามสกุล*
          <input name="name" required value={form.name} onChange={onChange} style={input} />
        </label>
        <label>อีเมล*
          <input name="email" type="email" required value={form.email} onChange={onChange} style={input} />
        </label>
        <label>เบอร์โทร*
          <input name="phone" required value={form.phone} onChange={onChange} style={input} />
        </label>
        <label>ที่อยู่จัดส่ง*
          <textarea name="address" rows={3} required value={form.address} onChange={onChange} style={textarea} />
        </label>
        <label>หมายเหตุ (ถ้ามี)
          <input name="note" value={form.note} onChange={onChange} style={input} />
        </label>

        <button disabled={sending || cart.length === 0} style={btn}>
          {sending ? "กำลังสั่งซื้อ..." : "ยืนยันสั่งซื้อ"}
        </button>
        {msg && <p style={{ color: "#c00", margin: 0 }}>{msg}</p>}
      </form>
    </section>
  );
}

/* styles */
const card = { border: "1px solid #eee", borderRadius: 12, padding: 16, background: "#fff" };
const input = { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8 };
const textarea = { ...input, minHeight: 96 };
const btn = { padding: "12px 14px", borderRadius: 8, background: "#111", color: "#fff", border: 0, cursor: "pointer" };
const chip = { padding: "2px 8px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer" };
const linkBtn = { padding: "4px 10px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer" };

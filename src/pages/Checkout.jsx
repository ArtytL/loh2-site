// src/pages/Checkout.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const CART_KEY = "CART"; // [{id,title,price,qty,type,cover}]

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export default function Checkout() {
  const nav = useNavigate();
  const [cart, setCart] = useState(loadCart());
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  // โหลดตะกร้าเสมอ (กรณีเข้าหน้าตรง)
  useEffect(() => {
    setCart(loadCart());
  }, []);

  // บันทึกลง localStorage ทุกครั้งที่แก้ตะกร้า
  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  const shipping = useMemo(() => (cart.length ? 50 : 0), [cart.length]);
  const subTotal = useMemo(
    () => cart.reduce((s, it) => s + Number(it.price || 0) * Number(it.qty || 0), 0),
    [cart]
  );
  const grandTotal = subTotal + shipping;

  const updateQty = (idx, next) => {
    const v = Math.max(1, Number(next || 1));
    setCart((old) => {
      const cp = [...old];
      cp[idx] = { ...cp[idx], qty: v };
      return cp;
    });
  };

  const inc = (idx) => updateQty(idx, Number(cart[idx].qty || 1) + 1);
  const dec = (idx) => updateQty(idx, Number(cart[idx].qty || 1) - 1);

  const removeItem = (idx) => {
    setCart((old) => old.filter((_, i) => i !== idx));
  };

  const clearAll = () => {
    setCart([]);
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!cart.length) return setMsg("ยังไม่มีสินค้าในตะกร้า");
    if (!name.trim() || !phone.trim() || !address.trim())
      return setMsg("กรุณากรอก ชื่อ-เบอร์โทร-ที่อยู่ ให้ครบถ้วน");

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      note: note.trim(),
      cart: cart.map((c) => ({
        id: c.id,
        title: c.title,
        type: c.type,
        qty: Number(c.qty || 0),
        price: Number(c.price || 0),
        cover: c.cover || "",
      })),
      shipping,
      total: grandTotal,
    };

    setSubmitting(true);
    try {
      // ลองแบบ JSON ก่อน
      let r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let d;
      try {
        d = await r.json();
      } catch {
        d = { ok: r.ok };
      }

      // ถ้าไม่ผ่านเพราะ parser ของฝั่งเซิร์ฟเวอร์ ลองแบบ text/plain
      if (!d?.ok) {
        r = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify(payload),
        });
        try {
          d = await r.json();
        } catch {
          d = { ok: r.ok };
        }
      }

      if (!d?.ok) {
        return setMsg(d?.error || "ส่งคำสั่งซื้อไม่สำเร็จ");
      }

      // สำเร็จ
      setMsg("ส่งคำสั่งซื้อเรียบร้อย ขอบคุณครับ");
      clearAll();
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setNote("");
      // ไปหน้าหลักหรืออยู่หน้าปัจจุบันก็ได้
      // nav("/"); // ถ้าต้องการกลับหน้าหลักอัตโนมัติ
    } catch (err) {
      setMsg(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-max" style={{ padding: "16px 12px 40px" }}>
      {/* header ย่อ */}
      <div className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand">โล๊ะมือสอง</Link>
          <div className="nav-right">
            <Link to="/" className="nav-link">หน้าหลัก</Link>
            <Link to="/checkout" className="btn-pay">ชำระเงิน</Link>
            <Link to="/checkout" className="cart-link">
              ตะกร้า <span className="cart-badge">{cart.length}</span>
            </Link>
          </div>
        </div>
      </div>

      <h1 className="h1" style={{ marginTop: 24 }}>แจ้งโอน</h1>

      {/* ตารางสินค้า */}
      <div style={{ marginTop: 16, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fafafa" }}>
              <th style={th}>รหัส</th>
              <th style={th}>ชื่อ</th>
              <th style={th}>ประเภท</th>
              <th style={th}>จำนวน</th>
              <th style={th}>ราคา</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {cart.map((it, idx) => (
              <tr key={`${it.id}-${idx}`} style={{ borderTop: "1px solid #eee" }}>
                <td style={td}>{it.id}</td>
                <td style={td}>{it.title}</td>
                <td style={td}>{it.type}</td>
                <td style={td}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <button type="button" onClick={() => dec(idx)} aria-label="ลด">−</button>
                    <input
                      type="number"
                      value={it.qty}
                      min={1}
                      onChange={(e) => updateQty(idx, e.target.value)}
                      style={{ width: 70, padding: 6 }}
                    />
                    <button type="button" onClick={() => inc(idx)} aria-label="เพิ่ม">+</button>
                  </div>
                </td>
                <td style={td}>{Number(it.price || 0) * Number(it.qty || 0)}</td>
                <td style={{ ...td, textAlign: "right" }}>
                  <button type="button" onClick={() => removeItem(idx)}>ลบ</button>
                </td>
              </tr>
            ))}

            <tr style={{ borderTop: "1px solid #eee" }}>
              <td style={td}></td>
              <td style={td}>รวมสินค้า</td>
              <td style={td}></td>
              <td style={td}></td>
              <td style={td}>{subTotal}</td>
              <td style={td}></td>
            </tr>
            <tr style={{ borderTop: "1px solid #eee" }}>
              <td style={td}></td>
              <td style={td}>ค่าส่ง</td>
              <td style={td}></td>
              <td style={td}></td>
              <td style={td}>{shipping}</td>
              <td style={td}></td>
            </tr>
            <tr style={{ borderTop: "1px solid #eee", background: "#fafafa" }}>
              <td style={td}></td>
              <td style={{ ...td, fontWeight: 700 }}>รวมสุทธิ</td>
              <td style={td}></td>
              <td style={td}></td>
              <td style={{ ...td, fontWeight: 700 }}>{grandTotal}</td>
              <td style={td}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ฟอร์มผู้ซื้อ */}
      <form onSubmit={submitOrder} style={{ marginTop: 24, display: "grid", gap: 12 }}>
        <Input label="ชื่อ-นามสกุล" value={name} onChange={setName} />
        <Input label="อีเมล" value={email} onChange={setEmail} />
        <Input label="เบอร์โทร" value={phone} onChange={setPhone} />
        <TextArea label="ที่อยู่จัดส่ง" value={address} onChange={setAddress} rows={3} />
        <Input label="หมายเหตุ (ถ้ามี)" value={note} onChange={setNote} placeholder="ระบุเวลาจัดส่ง ฯลฯ" />

        {msg && <div style={{ color: msg.startsWith("ส่งคำสั่งซื้อเรียบร้อย") ? "green" : "crimson" }}>{msg}</div>}

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "16px 18px",
            background: "#111",
            color: "#fff",
            border: 0,
            borderRadius: 10,
            marginTop: 4,
          }}
        >
          {submitting ? "กำลังส่งคำสั่งซื้อ..." : "ส่งสั่งซื้อ"}
        </button>
      </form>
    </div>
  );
}

function Input({ label, value, onChange, placeholder }) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || ""}
        style={{ padding: 10, border: "1px solid #e2e2e2", borderRadius: 8 }}
      />
    </label>
  );
}

function TextArea({ label, value, onChange, rows = 4 }) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span>{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: 10, border: "1px solid #e2e2e2", borderRadius: 8 }}
      />
    </label>
  );
}

const th = { textAlign: "left", padding: "10px 8px" };
const td = { padding: "10px 8px" };

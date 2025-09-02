// src/pages/Checkout.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const CANDIDATE_KEYS = ["CART", "cart", "cartItems", "SHOP_CART"];
const SHIPPING_FLAT = 50;

/* ---------- cart utils (ทนทานกับรูปแบบเดิม ๆ) ---------- */
function coerceItem(x) {
  if (!x || typeof x !== "object") return null;
  const id = x.id ?? x.code ?? x.sku ?? "";
  const title = x.title ?? x.name ?? "";
  const type = x.type ?? x.category ?? "DVD";
  const qty = Number(x.qty ?? x.amount ?? 1) || 1;
  const price = Number(x.price ?? x.unitPrice ?? 0) || 0;
  const cover = x.cover ?? x.image ?? x.img ?? "";
  if (!id || !title) return null;
  return { id, title, type, qty, price, cover };
}

function normalizeCart(src) {
  // array ตรง ๆ
  if (Array.isArray(src)) {
    const items = src.map(coerceItem).filter(Boolean);
    return items;
  }
  // รูปแบบ { items: [...] }
  if (src && Array.isArray(src.items)) {
    const items = src.items.map(coerceItem).filter(Boolean);
    return items;
  }
  return [];
}

function parseJSON(s) {
  try {
    return JSON.parse(s);
  } catch {
    try {
      // บางกรณี string ซ้อน string
      return JSON.parse(String(s || ""));
    } catch {
      return null;
    }
  }
}

function loadFromStorage(storage) {
  for (const k of CANDIDATE_KEYS) {
    const raw = storage.getItem(k);
    if (!raw) continue;
    const val = parseJSON(raw);
    const items = normalizeCart(val);
    if (items.length) return items;
  }
  return [];
}

function loadCartResilient() {
  // 1) localStorage
  let items = loadFromStorage(window.localStorage);
  if (items.length) return items;
  // 2) sessionStorage
  items = loadFromStorage(window.sessionStorage);
  if (items.length) return items;
  return [];
}

function saveCart(items) {
  try {
    localStorage.setItem("CART", JSON.stringify(items));
  } catch {}
}

/* ---------- UI ---------- */
const th = { textAlign: "left", padding: "10px 8px", whiteSpace: "nowrap" };
const td = { padding: "10px 8px", verticalAlign: "middle" };
const btn = {
  padding: "10px 18px",
  background: "#111",
  color: "#fff",
  border: 0,
  borderRadius: 10,
  cursor: "pointer",
};

export default function Checkout() {
  const [cart, setCart] = useState(() => loadCartResilient());
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");

  // เผื่อเข้าหน้านี้โดยยังไม่ได้รีเฟรช
  useEffect(() => {
    setCart(loadCartResilient());
  }, []);

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  const subTotal = useMemo(
    () => cart.reduce((s, it) => s + Number(it.price || 0) * Number(it.qty || 0), 0),
    [cart]
  );
  const shipping = useMemo(() => (cart.length ? SHIPPING_FLAT : 0), [cart.length]);
  const total = subTotal + shipping;

  const setQty = (i, v) => {
    const n = Math.max(1, Number(v || 1));
    setCart((old) => {
      const c = [...old];
      c[i] = { ...c[i], qty: n };
      return c;
    });
  };
  const inc = (i) => setQty(i, (Number(cart[i].qty || 1) + 1));
  const dec = (i) => setQty(i, (Number(cart[i].qty || 1) - 1));
  const remove = (i) => setCart((old) => old.filter((_, idx) => idx !== i));
  const clear = () => setCart([]);

  const submit = async (e) => {
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
        id: c.id, title: c.title, type: c.type,
        qty: Number(c.qty || 0), price: Number(c.price || 0), cover: c.cover || ""
      })),
      shipping,
      total,
    };

    setSending(true);
    try {
      // 1) JSON ก่อน
      let r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let d;
      try { d = await r.json(); } catch { d = { ok: r.ok }; }

      // 2) fallback text/plain
      if (!d?.ok) {
        r = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify(payload),
        });
        try { d = await r.json(); } catch { d = { ok: r.ok }; }
      }

      if (!d?.ok) return setMsg(d?.error || "ส่งคำสั่งซื้อไม่สำเร็จ");

      setMsg("ส่งคำสั่งซื้อเรียบร้อย ขอบคุณครับ");
      clear();
      setName(""); setEmail(""); setPhone(""); setAddress(""); setNote("");
    } catch (err) {
      setMsg(String(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container-max" style={{ padding: "12px 12px 40px" }}>
      {/* ใช้ header หลักของเว็บเดิม — ที่นี่ไม่วาดหัวใหม่ จึงไม่ซ้อน */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <h1 className="h1" style={{ margin: 0 }}>แจ้งโอน</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link to="/" className="nav-link">หน้าหลัก</Link>
          <Link to="/checkout" className="btn-pay">ชำระเงิน</Link>
          <Link to="/checkout" className="cart-link">
            ตะกร้า <span className="cart-badge">{cart.length}</span>
          </Link>
        </div>
      </div>

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
            {cart.map((it, i) => (
              <tr key={`${it.id}-${i}`} style={{ borderTop: "1px solid #eee" }}>
                <td style={td}>{it.id}</td>
                <td style={td}>{it.title}</td>
                <td style={td}>{it.type}</td>
                <td style={td}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <button type="button" onClick={() => dec(i)} aria-label="ลด">−</button>
                    <input
                      type="number"
                      min={1}
                      value={it.qty}
                      onChange={(e) => setQty(i, e.target.value)}
                      style={{ width: 70, padding: 6 }}
                    />
                    <button type="button" onClick={() => inc(i)} aria-label="เพิ่ม">+</button>
                  </div>
                </td>
                <td style={td}>{Number(it.price || 0) * Number(it.qty || 0)}</td>
                <td style={{ ...td, textAlign: "right" }}>
                  <button type="button" onClick={() => remove(i)}>ลบ</button>
                </td>
              </tr>
            ))}

            <tr style={{ borderTop: "1px solid #eee" }}>
              <td style={td}></td><td style={td}>รวมสินค้า</td>
              <td style={td}></td><td style={td}></td>
              <td style={td}>{subTotal}</td><td style={td}></td>
            </tr>
            <tr style={{ borderTop: "1px solid #eee" }}>
              <td style={td}></td><td style={td}>ค่าส่ง</td>
              <td style={td}></td><td style={td}></td>
              <td style={td}>{shipping}</td><td style={td}></td>
            </tr>
            <tr style={{ borderTop: "1px solid #eee", background: "#fafafa" }}>
              <td style={td}></td>
              <td style={{ ...td, fontWeight: 700 }}>รวมสุทธิ</td>
              <td style={td}></td><td style={td}></td>
              <td style={{ ...td, fontWeight: 700 }}>{total}</td>
              <td style={td}></td>
            </tr>
          </tbody>
        </table>
      </div>

      <form onSubmit={submit} style={{ marginTop: 24, display: "grid", gap: 12 }}>
        <Field label="ชื่อ-นามสกุล" value={name} onChange={setName} />
        <Field label="อีเมล" value={email} onChange={setEmail} />
        <Field label="เบอร์โทร" value={phone} onChange={setPhone} />
        <Area  label="ที่อยู่จัดส่ง" value={address} onChange={setAddress} rows={3} />
        <Field label="หมายเหตุ (ถ้ามี)" value={note} onChange={setNote} placeholder="ระบุเวลาจัดส่ง ฯลฯ" />

        {msg && (
          <div style={{ color: msg.startsWith("ส่งคำสั่งซื้อเรียบร้อย") ? "green" : "crimson" }}>
            {msg}
          </div>
        )}

        <button type="submit" disabled={sending} style={btn}>
          {sending ? "กำลังส่งคำสั่งซื้อ..." : "ส่งสั่งซื้อ"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
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

function Area({ label, value, onChange, rows = 4 }) {
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

// src/pages/Catalog.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const PRODUCTS = [
  { id: "dvd-a", title: "DVD ตัวอย่าง A", price: 150 },
  { id: "dvd-b", title: "DVD ตัวอย่าง B", price: 120 },
  { id: "dvd-c", title: "DVD ตัวอย่าง C", price: 90  },
];

export default function Catalog() {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setCartCount(getCart().reduce((s, i) => s + (+i.qty || 1), 0));
  }, []);

  function addToCart(p) {
    const cart = getCart();
    const i = cart.findIndex((x) => x.id === p.id);
    if (i >= 0) cart[i].qty = (+cart[i].qty || 1) + 1;
    else cart.push({ id: p.id, title: p.title, price: p.price, qty: 1 });
    saveCart(cart);
    setCartCount(cart.reduce((s, i) => s + (+i.qty || 1), 0));
  }

  return (
    <section style={{ maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1>รายการสินค้า</h1>
        <Link to="/checkout" style={linkBtn}>ไปเช็คเอาต์ ({cartCount})</Link>
      </div>

      <div style={grid}>
        {PRODUCTS.map((p) => (
          <div key={p.id} style={card}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{p.title}</div>
            <div style={{ color: "#333", marginBottom: 10 }}>{fmt(p.price)}</div>
            <button onClick={() => addToCart(p)} style={btn}>ใส่ตะกร้า</button>
          </div>
        ))}
      </div>
    </section>
  );
}

/* helpers */
const fmt = (n) => (Number(n) || 0).toLocaleString("th-TH", { maximumFractionDigits: 0 }) + " บาท";
const getCart = () => { try { return JSON.parse(localStorage.getItem("cart") || "[]"); } catch { return []; } };
const saveCart = (c) => localStorage.setItem("cart", JSON.stringify(c));

/* styles */
const grid   = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 };
const card   = { border: "1px solid #eee", borderRadius: 12, padding: 16, background: "#fff" };
const btn    = { padding: "10px 12px", borderRadius: 8, background: "#111", color: "#fff", border: 0, cursor: "pointer" };
const linkBtn= { ...btn, textDecoration: "none", display: "inline-block" };

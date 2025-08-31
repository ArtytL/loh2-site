// src/pages/Catalog.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = import.meta.env?.VITE_API_URL || "/api";

export default function Catalog() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/products`);
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "โหลดสินค้าไม่สำเร็จ");
        const arr = Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.items?.value)
          ? data.items.value
          : Array.isArray(data.value)
          ? data.value
          : [];
        setItems(arr);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  function addToCart(p) {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const found = cart.find(x => x.id === p.id);
    if (found) found.qty = (found.qty || 0) + 1;
    else cart.push({ id: p.id, title: p.title, price: p.price, qty: 1 });
    localStorage.setItem("cart", JSON.stringify(cart));
    alert("ใส่ตะกร้าแล้ว");
  }

  return (
    <div style={{ maxWidth: 980, margin: "24px auto", padding: 16 }}>
      <h1>รายการสินค้า</h1>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))" }}>
        {items.map(p => (
          <div key={p.id} style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
            <Link to={`/product/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <img
                src={p.cover || (p.images && p.images[0]) || "https://picsum.photos/seed/cover/600/360"}
                alt={p.title}
                style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8 }}
              />
              <h3 style={{ margin: "12px 0 4px" }}>{p.title || "(ไม่มีชื่อ)"}</h3>
              <div style={{ color: "#666", marginBottom: 8 }}>{p.price} บาท</div>
            </Link>
            <button onClick={() => addToCart(p)}>ใส่ตะกร้า</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// src/pages/Catalog.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toImageURL, NO_IMAGE } from "../utils/imageTools";

export default function Catalog() {
  // ✅ ประกาศ state ให้ชัดเจน
  const [items, setItems] = useState([]);

  useEffect(() => {
    let alive = true;

    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        // รองรับหลายทรงที่ API อาจส่งมา
        const arr =
          Array.isArray(d?.items) ? d.items :
          Array.isArray(d?.value) ? d.value :
          [];
        setItems(arr);
      })
      .catch(() => {
        if (alive) setItems([]);
      });

    return () => { alive = false; };
  }, []);

  return (
    <div className="app">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
        รายการสินค้า
      </h1>

      <div className="grid">
        {items.map((p) => (
          <Link to={`/product/${p.id}`} className="card" key={p.id || p._id}>
            <div className="cover-box">
              <img
                src={toImageURL(p.cover)}
                alt={p.title || ""}
                loading="lazy"
                onError={(e) => { e.currentTarget.src = NO_IMAGE; }}
              />
            </div>

            <div style={{ padding: 16 }}>
              <strong style={{ display: "block" }}>{p.title}</strong>
              <div>{p.type}</div>
              <div>{p.price} บาท</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

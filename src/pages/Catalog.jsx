// src/pages/Catalog.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toImageURL, NO_IMAGE } from "../utils/imageTools.js";
// นำเข้าเป็นเนมสเปซ เพื่อเรียก cart.addToCart(...) ได้
import * as cart from "../lib/cart.js";

export default function Catalog() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <div key={p.id} className="card">
          {/* ลิงก์ไปหน้ารายละเอียดสินค้า */}
          <Link to={`/product/${p.id}`}>
            <img
              src={toImageURL(p.cover)}
              alt={p.title}
              onError={(e) => {
                e.currentTarget.src = NO_IMAGE;
              }}
              style={{
                width: "100%",
                height: 220,
                objectFit: "cover",
                borderRadius: 12,
              }}
            />
          </Link>

          <div className="p-3">
            <h2 className="h1">{p.title}</h2>
            <div className="meta-line">{p.type}</div>
            <div className="price-xl">{p.price} บาท</div>

            {/* ปุ่มใส่ตะกร้า */}
            <button
              className="btn-primary mt-2"
              onClick={() => cart.addToCart(p, 1)}
            >
              ใส่ตะกร้า
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// src/pages/Catalog.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toImageURL, NO_IMAGE } from "../utils/imageTools.js";
import * as cart from "../lib/cart.js";

export default function Catalog() {
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(cart.getCount()); // จำนวนในตะกร้าปัจจุบัน

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]));
  }, []);

  function handleAdd(p) {
    cart.addToCart(p, 1);          // เพิ่มสินค้า
    setCount(cart.getCount());     // อัปเดต badge จำนวน
  }

  return (
    <div className="container-max">
      <div className="flex justify-between items-center mb-4">
        <h1 className="h1">รายการสินค้า</h1>
        <Link to="/checkout" className="btn-pay">
          ตะกร้า <span className="ml-1">({count})</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {items.map((p) => (
          <div key={p.id} className="card">
            <Link to={`/product/${p.id}`} className="cover-box">
              <img
                src={toImageURL(p.cover) || NO_IMAGE}
                alt={p.title}
                onError={(e) => { e.currentTarget.src = NO_IMAGE; }}
              />
            </Link>

            <div className="p-3">
              <h2 className="h1 text-base">{p.title}</h2>
              <div className="meta-line">{p.type}</div>
              <div className="price-xl">{p.price} บาท</div>

              <button
                className="btn-primary mt-2"
                onClick={() => handleAdd(p)}
              >
                ใส่ตะกร้า
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

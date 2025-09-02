// src/pages/Catalog.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toImageURL, NO_IMAGE } from "../utils/imageTools.js";
import { addToCart } from "../lib/cart.js";

export default function Catalog() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then(r => r.json())
      .then(d => setItems(d.items || []))
      .catch(() => setItems([]));
  }, []);

  return (
    <>
      <h1 className="h1">รายการสินค้า</h1>
      <div className="grid">
        {items.map(p => (
          <div key={p.id} className="card">
            <Link to={`/product/${p.id}`} className="cover-box">
              <img
                src={toImageURL(p.cover) || NO_IMAGE}
                alt={p.title}
                onError={e => { e.currentTarget.src = NO_IMAGE; }}
              />
            </Link>
            <div className="p-3">
              <div className="p-3">
                <div className="p-3">
                  <strong>{p.title}</strong>
                </div>
                <div>{p.type}</div>
                <div className="price-xl">{p.price} บาท</div>
                <button className="btn-primary" onClick={() => addToCart(p, 1)}>
                  ใส่ตะกร้า
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// src/pages/Catalog.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toImageURL, NO_IMAGE } from "../utils/imageTools";

export default function Catalog() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="grid">
      {items.map((p) => (
        <div key={p.id} className="card">
          <Link to={`/product/${p.id}`}>
            <img
              src={toImageURL(p.cover)}
              alt={p.title}
              style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 12 }}
              onError={(e) => {
                e.currentTarget.src = NO_IMAGE;
              }}
            />
          </Link>

          <div className="p-3">
            <strong>{p.title}</strong>
            <div>{p.type}</div>
            <div>{p.price} บาท</div>
          </div>
        </div>
      ))}
    </div>
  );
}

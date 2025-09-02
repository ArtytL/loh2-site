// src/pages/Catalog.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toImageURL, NO_IMAGE } from "../utils/imageTools";

export default function Catalog() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then(r => r.json())
      .then(d => setItems(d.items || []))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="catalog-grid">
      {items.map(p => (
        <Link key={p.id} to={`/product/${p.id}`} className="card">
          <div className="cover-box">
            <img
              src={toImageURL(p.cover)}
              alt={p.title}
              onError={e => (e.currentTarget.src = NO_IMAGE)}
              loading="lazy"
            />
          </div>

          <div className="p-2">
            <div className="title">{p.title || "-"}</div>
            <div className="muted">{p.type || ""}</div>
            <div className="price">{Number(p.price || 0).toLocaleString()} บาท</div>
          </div>
        </Link>
      ))}
    </div>
  );
}

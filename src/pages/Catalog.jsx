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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <Link key={p.id} to={`/product/${p.id}`} className="card block">
          <figure className="cover-box">
            <img
              src={toImageURL(p.cover)}
              alt={p.title}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = NO_IMAGE;
              }}
            />
          </figure>

          <div className="p-3">
            <strong>{p.title}</strong>
            <div>{p.type}</div>
            <div>{p.price} บาท</div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// src/pages/Product.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toImageURL, NO_IMAGE } from "../utils/imageTools.js";
import { addToCart } from "../lib/cart.js";

export default function Product() {
  const { id } = useParams();
  const [p, setP] = useState(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        const item =
          (d.items || []).find((x) => String(x.id) === String(id)) || null;
        setP(item);
      })
      .catch(() => setP(null));
  }, [id]);

  if (!p) return <p>กำลังโหลด...</p>;

  return (
    <div className="product">
      <div className="grid grid-cols-2 gap-6">
        <div className="cover-box">
          <img
            src={toImageURL(p.cover) || NO_IMAGE}
            alt={p.title}
            onError={(e) => {
              e.currentTarget.src = NO_IMAGE;
            }}
          />
        </div>

        <div>
          <h1 className="h1">{p.title}</h1>
          <div className="meta-line">{p.type}</div>
          <div className="price-xl">{p.price} บาท</div>

          <button
            className="btn-primary"
            onClick={() => addToCart(p, 1)}
            style={{ marginTop: 8 }}
          >
            ใส่ตะกร้า
          </button>

          <p className="desc" style={{ marginTop: 16 }}>
            {p.detail}
          </p>
        </div>
      </div>
    </div>
  );
}

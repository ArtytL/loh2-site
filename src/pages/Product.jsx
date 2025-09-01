// src/pages/Product.jsx
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toImageURL, NO_IMAGE } from "../utils/imageTools";

export default function Product() {
  const { id } = useParams();
  const [item, setItem] = useState(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        const it = (d.items || []).find((x) => String(x.id) === String(id));
        setItem(it || null);
      })
      .catch(() => setItem(null));
  }, [id]);

  if (!item) return <div style={{ padding: 24 }}>ไม่พบสินค้า</div>;

  const images = Array.isArray(item.images) ? item.images : [];

  return (
    <div style={{ padding: 24, maxWidth: 1024, margin: "0 auto" }}>
      <Link to="/catalog">← กลับไปหน้ารายการ</Link>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 16 }}>
        <img
          src={toImageURL(item.cover)}
          alt={item.title}
          style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 12 }}
          onError={(e) => {
            e.currentTarget.src = NO_IMAGE;
          }}
        />

        <div>
          <h1 style={{ marginTop: 0 }}>{item.title}</h1>
          <div>{item.type}</div>
          <div style={{ fontSize: 20, fontWeight: 600, margin: "8px 0 16px" }}>{item.price} บาท</div>

          <div
            dangerouslySetInnerHTML={{
              __html: String(item.detail || "").replace(/\n/g, "<br/>"),
            }}
          />

          <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
            {images.slice(0, 5).map((u, i) => (
              <img
                key={i}
                src={toImageURL(u)}
                alt=""
                style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8 }}
                onError={(e) => {
                  e.currentTarget.src = NO_IMAGE;
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// src/pages/Catalog.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

/** รูป No Image แบบ data URL (ไม่พึ่งพาไฟล์ภายนอก) */
const NO_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
     <rect width="100%" height="100%" fill="#e9ecef"/>
     <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
           fill="#9aa1a9"
           font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
           font-size="48">No Image</text>
   </svg>`
)}`;

/** แปลง URL ปกให้แสดงได้ แนบ fallback */
function toImageURL(u) {
  if (!u) return NO_IMAGE;
  const s = String(u).trim();

  // ถ้าเป็น http/https อยู่แล้ว
  if (/^https?:\/\//i.test(s)) return s;

  // ถ้าเป็น protocol-relative (//)
  if (/^\/\//.test(s)) return "https:" + s;

  // รองรับลิงก์ Google Drive แบบ /file/d/<fileId>/...
  const g = s.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  if (g) {
    const id = g[1];
    // ใช้ Googleusercontent แทนเพื่อให้เบราว์เซอร์โหลดรูปได้
    return `https://lh3.googleusercontent.com/d/${id}=s1200`;
  }

  return s || NO_IMAGE;
}

export default function Catalog() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        // รองรับหลายรูปแบบที่เคยเจอ: { items: [...] } หรือ { value: '...' } หรือ { value: [...] }
        let list = [];
        if (Array.isArray(d?.items)) list = d.items;
        else if (d?.value) {
          if (typeof d.value === "string") {
            try {
              list = JSON.parse(d.value);
            } catch {
              list = [];
            }
          } else if (Array.isArray(d.value)) {
            list = d.value;
          }
        }
        setItems(list || []);
      })
      .catch(() => setItems([]));
  }, []);

  return (
    <div
      className="grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: 16,
      }}
    >
      {items.map((p) => (
        <div
          key={p.id}
          className="card"
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            overflow: "hidden",
            background: "#fff",
          }}
        >
          <Link to={`/product/${p.id}`}>
            <img
              src={toImageURL(p.cover)}
              alt={p.title}
              style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }}
              onError={(e) => {
                e.currentTarget.src = NO_IMAGE;
              }}
            />
          </Link>

          <div className="p-3" style={{ padding: 16 }}>
            <strong>{p.title}</strong>
            <div>{p.type}</div>
            <div>{p.price} บาท</div>
          </div>
        </div>
      ))}
    </div>
  );
}

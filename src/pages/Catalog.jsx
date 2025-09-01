// src/pages/Catalog.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const PLACEHOLDER = "https://placehold.co/400x300?text=No+Image";

/** แปลงลิงก์รูปให้เป็นรูปที่ <img> เปิดได้ (รองรับ Google Drive) */
function toImageURL(url) {
  if (!url) return null;
  const u = String(url).trim();

  // data url / blob / รูปเว็บปกติ — ใช้ได้เลย
  if (u.startsWith("data:image") || u.startsWith("blob:") || /^https?:\/\//i.test(u) && !u.includes("drive.google.com")) {
    return u;
  }

  // Google Drive
  if (u.includes("drive.google.com")) {
    // รูปแบบ /file/d/<id>/
    let m = u.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!m) {
      // รูปแบบ ?id=<id>
      m = u.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    }
    if (m) {
      const id = m[1];
      return `https://drive.google.com/uc?export=view&id=${id}`;
    }
  }
  return u;
}

export default function Catalog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/products");
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) throw new Error(data?.error || "Load products failed");
        setItems(data.items || []);
      } catch (e) {
        setErr(String(e.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div style={{ padding: 16 }}>กำลังโหลด...</div>;
  if (err) return <div style={{ padding: 16, color: "#c00" }}>เกิดข้อผิดพลาด: {err}</div>;
  if (!items.length) return <div style={{ padding: 16 }}>ยังไม่มีสินค้า</div>;

  return (
    <section style={{ maxWidth: 980, margin: "24px auto", padding: 16 }}>
      <h1>รายการสินค้า</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {items.map((it) => {
          const cover = toImageURL(it.cover || (it.images?.[0])) || PLACEHOLDER;
          return (
            <Link
              key={it.id}
              to={`/product/${encodeURIComponent(it.id)}`}
              style={{
                display: "block",
                border: "1px solid #eee",
                borderRadius: 12,
                background: "#fff",
                textDecoration: "none",
                color: "inherit",
                overflow: "hidden",
              }}
            >
              <div style={{ aspectRatio: "4 / 3", background: "#f8f8f8" }}>
                <img
                  src={cover}
                  alt={it.title || it.id}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                />
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{it.title || it.id}</div>
                <div style={{ opacity: 0.7, marginBottom: 8 }}>{it.type || "-"}</div>
                <div style={{ fontWeight: 700 }}>{Number(it.price || 0).toLocaleString("th-TH")} บาท</div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

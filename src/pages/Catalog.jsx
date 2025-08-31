// src/pages/Catalog.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Catalog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        const data = await res.json();

        // รองรับหลายรูปแบบผลลัพธ์ (ของใหม่/ของเก่า)
        let arr = [];
        if (Array.isArray(data?.items)) arr = data.items;
        else if (Array.isArray(data?.value)) arr = data.value;
        else if (typeof data?.value === "string") {
          try { arr = JSON.parse(data.value); } catch {}
        } else if (data?.items?.value && typeof data.items.value === "string") {
          try { arr = JSON.parse(data.items.value); } catch {}
        }

        setItems(arr || []);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <main>
        <h1>รายการสินค้า</h1>
        <p>กำลังโหลด…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <h1>รายการสินค้า</h1>
        <p style={{ color: "#c00" }}>ผิดพลาด: {error}</p>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main>
        <h1>รายการสินค้า</h1>
        <p>ยังไม่มีสินค้า</p>
      </main>
    );
  }

  return (
    <main>
      <h1>รายการสินค้า</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {items.map((p) => (
          <article
            key={p.id}
            style={{
              border: "1px solid #eee",
              padding: 16,
              borderRadius: 12,
              background: "#fff",
            }}
          >
            { (p.cover || p.images?.[0]) ? (
              <img
                src={p.cover || p.images?.[0]}
                alt={p.title || p.id}
                style={{
                  width: "100%",
                  height: 180,
                  objectFit: "cover",
                  borderRadius: 8,
                }}
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            ) : null }

            <h3 style={{ margin: "12px 0 4px" }}>{p.title || "(ไม่มีชื่อ)"}</h3>
            <div style={{ opacity: 0.7, marginBottom: 8 }}>{p.type || "-"}</div>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>
              {Number(p.price || 0).toLocaleString("th-TH")} บาท
            </div>

            {/* ปุ่มไปเช็คเอาต์ (แก้ต่อให้เชื่อมกับระบบตะกร้าของคุณได้) */}
            <Link
              to="/checkout"
              state={{ add: { id: p.id, title: p.title, price: p.price, type: p.type, qty: 1 } }}
              style={{
                display: "inline-block",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #111",
                textDecoration: "none",
              }}
            >
              ใส่ตะกร้า
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}

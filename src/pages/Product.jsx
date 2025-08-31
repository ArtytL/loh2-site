// src/pages/Product.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API = "/api";

export default function Product() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [hero, setHero] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/products`);
        const data = await res.json();
        const arr = Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.items?.value) ? data.items.value
          : Array.isArray(data.value) ? data.value : [];
        const found = arr.find(x => x.id === id);
        setItem(found || null);
        const first = found?.cover || found?.images?.[0] || "";
        setHero(first);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [id]);

  if (!item) return <div style={{ maxWidth: 980, margin: "24px auto", padding: 16 }}>ไม่พบสินค้า</div>;

  const thumbs = [item.cover, ...(item.images || [])].filter(Boolean).slice(0, 4);

  return (
    <div style={{ maxWidth: 980, margin: "24px auto", padding: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <img
            src={hero || thumbs[0] || "https://picsum.photos/seed/hero/800/600"}
            style={{ width: "100%", borderRadius: 12 }}
          />
          {thumbs.length > 1 && (
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {thumbs.map((u, i) => (
                <img
                  key={i}
                  src={u}
                  onClick={() => setHero(u)}
                  style={{
                    width: 80, height: 80, objectFit: "cover",
                    border: u === hero ? "2px solid #000" : "1px solid #eee",
                    borderRadius: 8, cursor: "pointer"
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 style={{ margin: "0 0 8px" }}>{item.title || "(ไม่มีชื่อ)"}</h2>
          <div style={{ color: "#666", marginBottom: 12 }}>{item.type} • คงเหลือ {item.qty}</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>{item.price} บาท</div>
          <p style={{ whiteSpace: "pre-wrap" }}>{item.detail || "-"}</p>

          {item.youtube && (
            <div style={{ marginTop: 16 }}>
              <iframe
                width="100%" height="315"
                src={item.youtube.replace("watch?v=", "embed/")}
                title="YouTube"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ border: 0, borderRadius: 8 }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

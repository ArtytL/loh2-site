// src/pages/Product.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

const PLACEHOLDER = "https://placehold.co/800x600?text=No+Image";

function toImageURL(url) {
  if (!url) return null;
  const u = String(url).trim();
  if (u.startsWith("data:image") || u.startsWith("blob:") || (/^https?:\/\//i.test(u) && !u.includes("drive.google.com"))) {
    return u;
  }
  if (u.includes("drive.google.com")) {
    let m = u.match(/\/d\/([a-zA-Z0-9_-]+)/) || u.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
  }
  return u;
}

function readCart() {
  try {
    const str = localStorage.getItem("CART") ?? localStorage.getItem("cart") ?? "[]";
    return JSON.parse(str) || [];
  } catch {
    return [];
  }
}
function writeCart(items) {
  const s = JSON.stringify(items || []);
  localStorage.setItem("CART", s);
  localStorage.setItem("cart", s);
}

export default function Product() {
  const { id } = useParams();
  const nav = useNavigate();
  const [item, setItem] = useState(null);
  const [img, setImg] = useState("");
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) throw new Error(data?.error || "Load products failed");
        const found = (data.items || []).find((x) => String(x.id) === String(id));
        if (!found) throw new Error("ไม่พบสินค้า");
        setItem(found);
        const first = toImageURL(found.cover || found.images?.[0]) || PLACEHOLDER;
        setImg(first);
      } catch (e) {
        setErr(String(e.message || e));
      }
    })();
  }, [id]);

  const thumbs = useMemo(() => {
    const arr = [];
    if (!item) return arr;
    const imgCandidates = [item.cover, ...(item.images || [])].filter(Boolean);
    for (const u of imgCandidates) {
      const t = toImageURL(u);
      if (t && !arr.includes(t)) arr.push(t);
      if (arr.length >= 4) break;
    }
    if (!arr.length) arr.push(PLACEHOLDER);
    return arr;
  }, [item]);

  const addToCart = () => {
    if (!item) return;
    const cart = readCart();
    const exist = cart.find((x) => x.id === item.id);
    const n = Math.max(1, Number(qty) || 1);
    if (exist) {
      exist.qty = Number(exist.qty || 1) + n;
    } else {
      cart.push({
        id: item.id,
        title: item.title,
        type: item.type,
        price: Number(item.price || 0),
        qty: n,
      });
    }
    writeCart(cart);
    nav("/checkout");
  };

  if (err) return <div style={{ padding: 16, color: "#c00" }}>{err}</div>;
  if (!item) return <div style={{ padding: 16 }}>กำลังโหลด...</div>;

  return (
    <section style={{ maxWidth: 980, margin: "24px auto", padding: 16 }}>
      <Link to="/catalog" style={{ textDecoration: "none" }}>← กลับไปหน้ารายการ</Link>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24, marginTop: 16 }}>
        {/* รูปใหญ่ + แถบ thumbnail */}
        <div>
          <div style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden", background: "#f8f8f8" }}>
            <img
              src={img}
              alt={item.title}
              style={{ width: "100%", height: 420, objectFit: "cover", display: "block" }}
              onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
            />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {thumbs.map((t) => (
              <button
                key={t}
                onClick={() => setImg(t)}
                style={{ border: "1px solid #eee", width: 90, height: 70, padding: 0, borderRadius: 8, overflow: "hidden", background: "#fff", cursor: "pointer" }}
              >
                <img src={t} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </button>
            ))}
          </div>
        </div>

        {/* ข้อมูลสินค้า */}
        <div>
          <h2 style={{ margin: "0 0 8px" }}>{item.title}</h2>
          <div style={{ opacity: 0.7, marginBottom: 8 }}>{item.type || "-"}</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
            {Number(item.price || 0).toLocaleString("th-TH")} บาท
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
            <label>จำนวน</label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              style={{ width: 90, padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
            />
            <button
              onClick={addToCart}
              style={{ padding: "10px 16px", borderRadius: 10, background: "#111", color: "#fff", border: "1px solid #111" }}
            >
              ใส่ตะกร้า
            </button>
          </div>

          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, borderTop: "1px solid #eee", paddingTop: 12 }}>
            {item.detail || "-"}
          </div>

          {item.youtube && (
            <div style={{ marginTop: 16 }}>
              <iframe
                title="youtube"
                width="100%"
                height="315"
                src={toYoutubeEmbed(item.youtube)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ border: 0, borderRadius: 12 }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** แปลง youtube url เป็น embed */
function toYoutubeEmbed(u) {
  try {
    const url = new URL(u);
    // รองรับทั้ง ?v= และ youtu.be/<id>
    const v = url.searchParams.get("v") || url.pathname.split("/").filter(Boolean).pop();
    return `https://www.youtube.com/embed/${v}`;
  } catch {
    return u;
  }
}

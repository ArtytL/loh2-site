// src/pages/Product.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toImageURL, NO_IMAGE } from "../utils/imageTools";

// แปลง URL YouTube ให้เป็น embed เสมอ
function toYoutubeEmbed(url) {
  if (!url) return null;
  try {
    if (/\/embed\//.test(url)) return url; // เป็น embed อยู่แล้ว

    if (/youtube\.com\/watch/.test(url)) {
      const u = new URL(url);
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (/youtu\.be\//.test(url)) {
      const id = url.split("youtu.be/")[1].split(/[?&]/)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (/youtube\.com\/shorts\//.test(url)) {
      const id = url.split("/shorts/")[1].split(/[?&]/)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch {}
  return null;
}

export default function Product() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [main, setMain] = useState(null);
  const [thumbs, setThumbs] = useState([]);
  const [qty, setQty] = useState(1);

  // โหลดสินค้า
  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d?.items)
          ? d.items
          : Array.isArray(d?.items?.value)
          ? d.items.value
          : [];

        const p = list.find((x) => String(x.id) === String(id));
        if (!p) return;

        setItem(p);

        const cover = toImageURL(p.cover);
        let imgs = [];
        if (Array.isArray(p.images)) imgs = p.images;
        else if (typeof p.images === "string")
          imgs = p.images.split(",").map((s) => s.trim()).filter(Boolean);

        const urls = [cover, ...imgs.map(toImageURL)].filter(Boolean);
        setMain(urls[0] || cover || NO_IMAGE);
        setThumbs(urls.length ? urls : [cover || NO_IMAGE]);
      })
      .catch(console.error);
  }, [id]);

  const yt = useMemo(() => toYoutubeEmbed(item?.youtube), [item?.youtube]);

  // เพิ่มลงตะกร้า
  const addToCart = () => {
    if (!item) return;
    const n = Math.max(1, parseInt(qty || 1, 10));
    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem("cart") || "[]");
    } catch {}
    const i = cart.findIndex((x) => x.id === item.id);
    if (i >= 0) cart[i].qty += n;
    else cart.push({ id: item.id, title: item.title, type: item.type, price: item.price, qty: n });
    localStorage.setItem("cart", JSON.stringify(cart));
    alert("เพิ่มลงตะกร้าแล้ว");
  };

  if (!item) return <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">กำลังโหลด…</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
      <Link to="/catalog" className="text-blue-600 hover:underline">&larr; กลับไปรายการ</Link>

      {/* โครงหน้า: เหมือนอีคอมเมิร์ซ — รูปซ้าย/รายละเอียดขวา */}
      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(320px,560px),1fr]">
        {/* ซ้าย: รูปใหญ่ + thumbnails (คงสัดส่วน 2:3) */}
        <div className="lg:sticky lg:top-8 self-start">
          <div className="cover-box bg-gray-100 rounded-2xl border shadow-sm">
            <img
              src={main || NO_IMAGE}
              alt={item.title}
              onError={(e) => (e.currentTarget.src = NO_IMAGE)}
            />
          </div>

          {/* แถว thumbnails — อยู่ใต้รูปใหญ่ (ตามที่ขอ) */}
          {!!thumbs.length && (
            <div className="mt-4 grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {thumbs.map((u, i) => (
                <button
                  key={i}
                  className={`cover-box rounded-xl overflow-hidden border transition ${
                    u === main ? "ring-2 ring-indigo-500" : "hover:shadow"
                  }`}
                  onClick={() => setMain(u)}
                  title="ดูภาพนี้"
                >
                  <img src={u} alt="" onError={(e) => (e.currentTarget.src = NO_IMAGE)} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ขวา: ชื่อ/ราคา/จำนวน/ปุ่ม + รายละเอียด + YouTube */}
        <div>
          {/* หัวเรื่อง */}
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">{item.title}</h1>
          <div className="text-gray-500 mt-1">{item.type}</div>

          {/* กล่อง CTA: ราคา / จำนวน / ปุ่มใส่ตะกร้า */}
          <div className="mt-5 p-5 rounded-2xl border bg-amber-50/50">
            <div className="flex flex-wrap items-center gap-5">
              <div className="text-4xl sm:text-5xl font-extrabold text-rose-600">
                {Number(item.price).toLocaleString()} <span className="text-2xl sm:text-3xl">บาท</span>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">จำนวน</label>
                <input
                  type="number"
                  min="1"
                  className="w-24 h-12 border rounded-xl px-3 text-lg text-center"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                />
              </div>

              <button
                onClick={addToCart}
                className="h-12 px-10 rounded-2xl bg-black text-white text-lg font-semibold shadow-md hover:shadow-lg active:scale-[0.99] transition"
              >
                ใส่ตะกร้า
              </button>
            </div>
          </div>

          {/* รายละเอียด เน้นอ่านง่าย */}
          {item.detail && (
            <article className="mt-6 leading-7 text-[15px] whitespace-pre-line">
              {item.detail}
            </article>
          )}

          {/* YouTube ใหญ่ขึ้น (เต็มความกว้างคอลัมน์) */}
          {yt && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-3">ตัวอย่างจาก YouTube</h2>
              <div className="relative w-full overflow-hidden rounded-2xl shadow-sm" style={{ paddingTop: "56.25%" }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={yt}
                  title="video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// src/pages/Product.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toImageURL } from "../utils/imageTools";

// แปลงลิงก์ YouTube ทุกรูปแบบให้เป็นแบบ embed
function toYoutubeEmbed(url) {
  if (!url) return null;
  try {
    // อยู่รูปแบบ embed แล้ว
    if (/\/embed\//.test(url)) return url;

    // watch?v=xxxx
    if (/youtube\.com\/watch/.test(url)) {
      const u = new URL(url);
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    // youtu.be/xxxx
    if (/youtu\.be\//.test(url)) {
      const id = url.split("youtu.be/")[1].split(/[?&]/)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    // shorts/xxxx
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
        setMain(urls[0] || cover);
        setThumbs(urls);
      })
      .catch(console.error);
  }, [id]);

  const yt = useMemo(() => toYoutubeEmbed(item?.youtube), [item?.youtube]);

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

  if (!item) return <div className="p-6">กำลังโหลด...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <Link to="/catalog" className="text-blue-600">
        &larr; กลับไปรายการ
      </Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(280px,420px),1fr] mt-4">
        {/* ซ้าย: รูปใหญ่ + thumbnails */}
        <div>
          <div className="cover-box bg-gray-100 rounded-xl shadow-sm">
            {main && <img src={main} alt={item.title} />}
          </div>

          {thumbs.length > 1 && (
            <div className="mt-4 grid grid-cols-5 sm:grid-cols-6 gap-2">
              {thumbs.map((u, i) => (
                <button
                  key={i}
                  className={`cover-box rounded-lg overflow-hidden border transition ${
                    u === main ? "ring-2 ring-indigo-500" : "hover:shadow"
                  }`}
                  onClick={() => setMain(u)}
                  title="ดูภาพนี้"
                >
                  <img src={u} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ขวา: รายละเอียด + กลุ่ม ราคา/จำนวน/ปุ่ม */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">{item.title}</h1>
          <div className="text-gray-600 mt-1">{item.type}</div>

          {/* กลุ่ม ราคา / จำนวน / ปุ่ม */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="text-3xl sm:text-4xl font-bold text-rose-600">
              {Number(item.price).toLocaleString()} บาท
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
              className="h-12 px-8 rounded-2xl bg-black text-white text-lg font-semibold shadow-md hover:shadow-lg active:scale-[0.99] transition"
            >
              ใส่ตะกร้า
            </button>
          </div>

          {/* รายละเอียด */}
          {item.detail && (
            <article className="mt-6 whitespace-pre-line leading-7 text-[15px]">
              {item.detail}
            </article>
          )}

          {/* YouTube (responsive 16:9) */}
          {yt && (
            <div className="mt-8">
              <div className="relative w-full overflow-hidden rounded-xl shadow-sm" style={{ paddingTop: "56.25%" }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={yt}
                  title="trailer"
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

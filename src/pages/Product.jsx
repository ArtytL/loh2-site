// src/pages/Product.jsx
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toImageURL } from "../utils/imageTools";

export default function Product() {
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [main, setMain] = useState(null);
  const [thumbs, setThumbs] = useState([]);
  const [qty, setQty] = useState(1);

  // โหลดสินค้า + เตรียมรูป
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

  const addToCart = () => {
    if (!item) return;
    const n = Math.max(1, parseInt(qty || 1, 10));

    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem("cart") || "[]");
    } catch {}

    const idx = cart.findIndex((x) => x.id === item.id);
    if (idx >= 0) cart[idx].qty += n;
    else cart.push({ id: item.id, title: item.title, type: item.type, price: item.price, qty: n });

    localStorage.setItem("cart", JSON.stringify(cart));
    alert("เพิ่มลงตะกร้าแล้ว");
  };

  if (!item) return <div className="p-6">กำลังโหลด...</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <Link to="/catalog" className="text-blue-600">
        &larr; กลับไปรายการ
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
        {/* ซ้าย: รูปใหญ่ + thumbnails ใต้รูป */}
        <div>
          <div className="cover-box bg-gray-100 rounded-xl">
            {main && <img src={main} alt={item.title} />}
          </div>

          {thumbs.length > 1 && (
            <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 gap-2">
              {thumbs.map((u, i) => (
                <button
                  key={i}
                  className={`cover-box rounded-lg overflow-hidden border ${
                    u === main ? "ring-2 ring-indigo-500" : ""
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

        {/* ขวา: ข้อมูล + ปุ่มใส่ตะกร้า */}
        <div>
          <h1 className="text-3xl font-semibold mb-1">{item.title}</h1>
          <div className="text-gray-600">{item.type}</div>
          <div className="text-2xl font-bold my-4">{item.price} บาท</div>

          <div className="flex items-center gap-3 mb-6">
            <input
              type="number"
              min="1"
              className="w-20 border rounded px-2 py-1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
            <button
              onClick={addToCart}
              className="px-5 py-2 rounded-xl bg-black text-white"
            >
              ใส่ตะกร้า
            </button>
          </div>

          {item.detail && (
            <div className="whitespace-pre-line leading-7">{item.detail}</div>
          )}

          {item.youtube && (
            <div className="mt-6">
              <iframe
                className="w-full rounded-xl"
                height="360"
                src={item.youtube.replace("watch?v=", "embed/")}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="trailer"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

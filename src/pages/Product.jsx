// src/pages/Product.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toImageURL, NO_IMAGE } from "../utils/imageTools";

/* แปลง YouTube เป็น embed เสมอ */
function toYoutubeEmbed(url) {
  if (!url) return null;
  try {
    if (/\/embed\//.test(url)) return url;
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

  /* โหลดสินค้า */
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

  /* ตะกร้า */
  const addToCart = () => {
    if (!item) return;
    const n = Math.max(1, parseInt(qty || 1, 10));
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem("cart") || "[]"); } catch {}
    const i = cart.findIndex((x) => x.id === item.id);
    if (i >= 0) cart[i].qty += n;
    else cart.push({ id: item.id, title: item.title, type: item.type, price: item.price, qty: n });
    localStorage.setItem("cart", JSON.stringify(cart));
    alert("เพิ่มลงตะกร้าแล้ว");
  };

  if (!item) return <div className="container-max py-10">กำลังโหลด…</div>;

  return (
    <div className="container-max py-10">
      <Link to="/catalog" className="text-gray-500 hover:text-gray-900 hover:underline">
        &larr; หน้าหลัก
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(320px,560px),1fr]">
        {/* ซ้าย: รูปหลัก + แถว thumbnails อยู่ใต้ภาพ */}
        <div className="lg:sticky lg:top-8 self-start">
          <div className="cover-box border rounded-2xl shadow-sm">
            <img src={main || NO_IMAGE} alt={item.title}
                 onError={(e) => (e.currentTarget.src = NO_IMAGE)} />
          </div>

          {!!thumbs.length && (
            <div className="mt-4 grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {thumbs.map((u, i) => (
                <button
                  key={i}
                  className={`cover-box rounded-xl overflow-hidden border transition ${
                    u === main ? "ring-2 ring-gray-900" : "hover:shadow"
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

        {/* ขวา: จัดเลย์เอาต์ให้ใกล้เคียงตัวอย่าง */}
        <div className="space-y-6">
          {/* หัวเรื่อง/จำนวน/ราคา/ปุ่ม */}
          <header className="text-center lg:text-left space-y-3">
            <h1 className="h1">{item.title}</h1>
            <div className="meta-line">
              จำนวน{" "}
              <input
                type="number"
                min="1"
                className="inline-block w-[72px] h-10 text-center border rounded-xl mx-1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />{" "}
              แผ่น
            </div>
            <div className="price-xl">
              ราคา <span className="text-5xl sm:text-6xl font-extrabold">
                {Number(item.price).toLocaleString()}
              </span>{" "}
              บาท
            </div>
            <div className="pt-1">
              <button className="btn-primary" onClick={addToCart}>ใส่ตะกร้า</button>
            </div>
          </header>

          {/* รายละเอียด */}
          {item.detail && (
            <article className="desc">{item.detail}</article>
          )}

          {/* YouTube ใหญ่ขึ้น (16:9) */}
          {yt && (
            <section>
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
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

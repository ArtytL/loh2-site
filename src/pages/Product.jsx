// src/pages/Product.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toImageURL, NO_IMAGE } from "../utils/imageTools";
import { useCart } from "../context/CartContext";

export default function Product() {
  const { id } = useParams();
  const { add } = useCart();
  const [item, setItem] = useState(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    fetch("/api/products")
      .then(r => r.json())
      .then(d => {
        const found = (d.items || []).find(x => x.id === id);
        setItem(found || null);
      })
      .catch(() => setItem(null));
  }, [id]);

  if (!item) return <p style={{ padding: 16 }}>กำลังโหลดสินค้า...</p>;

  const handleAdd = () => {
    add(
      {
        id: item.id,
        title: item.title,
        price: Number(item.price || 0),
        cover: item.cover,
        type: item.type,
      },
      Number(qty || 1)
    );
  };

  return (
    <div className="product-page">
      <div className="product-left">
        <div className="cover-box big">
          <img
            src={toImageURL(item.cover)}
            alt={item.title}
            onError={e => (e.currentTarget.src = NO_IMAGE)}
          />
        </div>

        {/* แกลลอรี่ภาพย่อย ถ้ามี */}
        {Array.isArray(item.images) && item.images.length > 0 && (
          <div className="thumb-row">
            {item.images.map((src, i) => (
              <button
                key={i}
                className="thumb"
                onClick={() => {
                  const img = document.querySelector(".cover-box.big img");
                  if (img) img.src = toImageURL(src);
                }}
              >
                <img
                  src={toImageURL(src)}
                  alt={`thumb-${i}`}
                  onError={e => (e.currentTarget.src = NO_IMAGE)}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="product-right">
        <h1 className="product-title">{item.title}</h1>

        <div className="price-line">
          <div className="price">{Number(item.price || 0).toLocaleString()} บาท</div>
          <div className="qty">
            <input
              type="number"
              min="1"
              value={qty}
              onChange={e => setQty(e.target.value)}
            />
            <button className="btn-primary" onClick={handleAdd}>
              ใส่ตะกร้า
            </button>
          </div>
        </div>

        {item.detail && <div className="product-detail" dangerouslySetInnerHTML={{ __html: item.detail.replace(/\n/g, "<br/>") }} />}

        {/* วิดีโอถ้ามี */}
        {item.youtube && (
          <div className="video-wrap">
            <iframe
              width="560"
              height="315"
              src={item.youtube.replace("watch?v=", "embed/")}
              title="YouTube video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        )}
      </div>
    </div>
  );
}

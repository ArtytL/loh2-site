// ...imports เดิม
import { toImageURL, NO_IMAGE } from "../utils/imageTools";

export default function Catalog() {
  // ...useEffect + state เดิม

  return (
    <div className="app">
      <h1 style={{fontSize: 24, fontWeight: 700, marginBottom: 16}}>รายการสินค้า</h1>

      <div className="grid">
        {items.map(p => (
          <a href={`#/product/${p.id}`} className="card" key={p.id}>
            <div className="cover-box">
              <img
                src={toImageURL(p.cover)}
                alt={p.title || ""}
                loading="lazy"
                onError={(e) => { e.currentTarget.src = NO_IMAGE; }}
              />
            </div>

            <div style={{padding: 16}}>
              <strong style={{display:'block'}}>{p.title}</strong>
              <div>{p.type}</div>
              <div>{p.price} บาท</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

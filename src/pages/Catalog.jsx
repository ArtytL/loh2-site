import React from "react";
import { toImageURL, NO_IMAGE } from "../utils/imageTools.js";
import { cart } from "../lib/cart.js";

export default function Catalog(){
  const [items, setItems] = React.useState([]);

  React.useEffect(()=>{
    fetch("/api/products")
      .then(r=>r.json())
      .then(d=> setItems(d.items || []))
      .catch(e=>{
        console.error(e);
        setItems([]);
      });
  },[]);

  return (
    <>
      <h1 style={{margin:"10px 0 18px"}}>รายการสินค้า</h1>
      <div className="grid">
        {items.map(p=>(
          <div key={p.id} className="card">
            <div className="cover-box">
              <img
                src={toImageURL(p.cover)}
                alt={p.title||p.id}
                onError={e=> e.currentTarget.src = NO_IMAGE}
              />
            </div>
            <div className="p-12">
              <div style={{fontWeight:700}}>{p.title}</div>
              <div className="meta">{p.type}</div>
              <div className="price">{p.price} บาท</div>
              <div style={{marginTop:10}}>
                <button
                  className="btn-primary"
                  onClick={()=> cart.add({
                    id: p.id,
                    title: p.title,
                    type: p.type,
                    price: Number(p.price||0)
                  }, 1)}
                >
                  ใส่ตะกร้า
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

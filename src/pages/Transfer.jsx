import React from "react";
import { cart } from "../lib/cart.js";

export default function Transfer(){
  const [list, setList] = React.useState(cart.list());
  const [name,setName] = React.useState("");
  const [email,setEmail] = React.useState("");
  const [phone,setPhone] = React.useState("");
  const [addr,setAddr] = React.useState("");
  const [note,setNote] = React.useState("");

  React.useEffect(()=>{
    const h = ()=> setList(cart.list());
    window.addEventListener("cart:change", h);
    return ()=> window.removeEventListener("cart:change", h);
  },[]);

  const subTotal = list.reduce((s,it)=> s+it.price*it.qty, 0);
  const shipping = list.length ? 50 : 0;
  const grand = subTotal + shipping;

  const plus = id => cart.setQty(id, (list.find(x=>x.id===id)?.qty||0)+1);
  const minus = id => cart.setQty(id, (list.find(x=>x.id===id)?.qty||0)-1);

  async function submit(){
    if(!list.length){ alert("ยังไม่มีสินค้าในตะกร้า"); return; }
    if(!name || !email || !phone || !addr){ alert("กรอกข้อมูลให้ครบ"); return; }

    const payload = {
      name,email,phone,address:addr,note,
      cart:list.map(x=>({id:x.id,title:x.title,type:x.type,price:x.price,qty:x.qty}))
    };
    try{
      const r = await fetch("/api/orders",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(payload)
      });
      const d = await r.json();
      if(d.ok){
        cart.clear();
        alert("ส่งคำสั่งซื้อเรียบร้อย ขอบคุณครับ!");
      }else{
        alert("ส่งคำสั่งซื้อไม่สำเร็จ: "+(d.error||""));
      }
    }catch(e){
      console.error(e);
      alert("ส่งคำสั่งซื้อไม่สำเร็จ");
    }
  }

  return (
    <>
      <h1 style={{margin:"10px 0 18px"}}>แจ้งโอน</h1>

      <table className="table">
        <thead>
          <tr><th>รหัส</th><th>ชื่อ</th><th>ประเภท</th><th>จำนวน</th><th>ราคา</th><th></th></tr>
        </thead>
        <tbody>
          {list.map(it=>(
            <tr key={it.id}>
              <td>{it.id}</td>
              <td>{it.title}</td>
              <td>{it.type}</td>
              <td style={{whiteSpace:"nowrap"}}>
                <button className="btn" onClick={()=> minus(it.id)}>-</button>
                <span style={{padding:"0 10px"}}>{it.qty}</span>
                <button className="btn" onClick={()=> plus(it.id)}>+</button>
              </td>
              <td>{it.price*it.qty}</td>
              <td><button className="btn" onClick={()=> cart.remove(it.id)}>ลบ</button></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td colSpan="4">รวมสินค้า</td><td>{subTotal}</td><td/></tr>
          <tr><td colSpan="4">ค่าส่ง</td><td>{shipping}</td><td/></tr>
          <tr><td colSpan="4">รวมสุทธิ</td><td>{grand}</td><td/></tr>
        </tfoot>
      </table>

      <div style={{marginTop:20,display:"grid",gap:12}}>
        <input className="input" placeholder="ชื่อ-นามสกุล" value={name} onChange={e=>setName(e.target.value)} />
        <input className="input" placeholder="อีเมล" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="input" placeholder="เบอร์โทร" value={phone} onChange={e=>setPhone(e.target.value)} />
        <textarea className="input" placeholder="ที่อยู่จัดส่ง" rows={3} value={addr} onChange={e=>setAddr(e.target.value)} />
        <input className="input" placeholder="หมายเหตุ (ถ้ามี)" value={note} onChange={e=>setNote(e.target.value)} />
        <button className="btn-primary" onClick={submit}>ส่งคำสั่งซื้อ</button>
      </div>
    </>
  );
}

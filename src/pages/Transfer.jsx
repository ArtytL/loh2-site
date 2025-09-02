// src/pages/Transfer.jsx
import React, { useEffect, useState } from "react";
import { totals, inc, remove, clearCart, totalQty } from "../lib/cart.js";

export default function Transfer() {
  const [snap, setSnap] = useState(totals());
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onChange = () => setSnap(totals());
    window.addEventListener("cart:changed", onChange);
    window.addEventListener("storage", onChange);
    onChange();
    return () => {
      window.removeEventListener("cart:changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  useEffect(() => {
    const el = document.getElementById("cart-count-badge");
    if (el) el.textContent = totalQty();
  }, [snap]);

  async function submit(e) {
    e.preventDefault();
    if (!snap.items.length) return alert("ยังไม่มีสินค้าในตะกร้า");
    setSaving(true);
    try {
      const payload = {
        name, email, phone, address, note,
        cart: snap.items.map(x => ({ id: x.id, title: x.title, type: x.type, price: x.price, qty: x.qty })),
        shipping: snap.shipping,
        total: snap.grand,
      };
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || "ส่งคำสั่งซื้อไม่สำเร็จ");
      clearCart();
      alert("ส่งคำสั่งซื้อเรียบร้อย! เลขออเดอร์: " + data.id);
      window.location.hash = "#/";
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <h1 className="h1">แจ้งโอน</h1>

      <table className="table">
        <thead>
          <tr>
            <th>รหัส</th><th>ชื่อ</th><th>ประเภท</th>
            <th style={{textAlign:"center"}}>จำนวน</th>
            <th style={{textAlign:"right"}}>ราคา</th><th />
          </tr>
        </thead>
        <tbody>
          {snap.items.map(it => (
            <tr key={it.id}>
              <td>{it.id}</td>
              <td>{it.title}</td>
              <td>{it.type}</td>
              <td style={{textAlign:"center"}}>
                <button type="button" onClick={() => inc(it.id, -1)}>-</button>
                &nbsp;{it.qty}&nbsp;
                <button type="button" onClick={() => inc(it.id, +1)}>+</button>
              </td>
              <td style={{textAlign:"right"}}>{Number(it.price) * Number(it.qty)}</td>
              <td><button type="button" onClick={() => remove(it.id)}>ลบ</button></td>
            </tr>
          ))}
          <tr><td colSpan={4}>รวมสินค้า</td><td style={{textAlign:"right"}}>{snap.itemsTotal}</td><td /></tr>
          <tr><td colSpan={4}>ค่าส่ง</td><td style={{textAlign:"right"}}>{snap.shipping}</td><td /></tr>
          <tr><td colSpan={4}><strong>รวมสุทธิ</strong></td><td style={{textAlign:"right"}}><strong>{snap.grand}</strong></td><td /></tr>
        </tbody>
      </table>

      <div className="form">
        <input placeholder="ชื่อ-นามสกุล" value={name} onChange={e=>setName(e.target.value)} />
        <input placeholder="อีเมล" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="เบอร์โทร" value={phone} onChange={e=>setPhone(e.target.value)} />
        <textarea placeholder="ที่อยู่จัดส่ง" value={address} onChange={e=>setAddress(e.target.value)} />
        <input placeholder="หมายเหตุ (ถ้ามี)" value={note} onChange={e=>setNote(e.target.value)} />
      </div>

      <button className="btn-primary" disabled={saving} type="submit">
        {saving ? "กำลังส่ง..." : "ส่งสั่งซื้อ"}
      </button>
    </form>
  );
}

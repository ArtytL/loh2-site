// src/pages/Checkout.jsx
import React, { useState } from "react";
import * as cart from "../lib/cart.js";

export default function Checkout() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");

  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const items = cart.getItems();
  const total = cart.getTotal();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setDone(false);
    setSending(true);

    try {
      const payload = {
        name,
        email,
        phone,
        address,
        note,
        cart: items,
        total,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const text = await res.text();
        throw new Error(
          `Server returned non-JSON (${res.status}). ${text.slice(0, 160)}`
        );
      }

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      cart.clear();
      setDone(true);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="container-max">
      <h1 className="h1">แจ้งโอน</h1>

      {items.length === 0 ? (
        <p>ตะกร้าว่าง</p>
      ) : (
        <table className="w-full mb-6">
          <thead>
            <tr>
              <th className="text-left">รหัส</th>
              <th className="text-left">ชื่อ</th>
              <th className="text-right">จำนวน</th>
              <th className="text-right">ราคา</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td>{it.id}</td>
                <td>{it.title}</td>
                <td className="text-right">{it.qty}</td>
                <td className="text-right">{it.price}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="text-right font-semibold">
                รวมสุทธิ
              </td>
              <td className="text-right font-semibold">{total}</td>
            </tr>
          </tfoot>
        </table>
      )}

      <form onSubmit={onSubmit} className="max-w-md space-y-3">
        <input
          className="input"
          placeholder="ชื่อ-นามสกุล"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="input"
          placeholder="อีเมล"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="input"
          placeholder="เบอร์โทร"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <textarea
          className="input"
          placeholder="ที่อยู่จัดส่ง"
          rows={3}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <input
          className="input"
          placeholder="หมายเหตุ (ถ้ามี)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {error && (
          <div className="text-red-600 text-sm whitespace-pre-wrap">
            {error}
          </div>
        )}
        {done && <div className="text-green-700">ส่งคำสั่งซื้อเรียบร้อย</div>}

        <button className="btn-primary" disabled={sending || items.length === 0}>
          {sending ? "กำลังส่ง..." : "ส่งคำสั่งซื้อ"}
        </button>
      </form>
    </div>
  );
}

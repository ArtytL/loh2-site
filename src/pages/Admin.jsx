// src/pages/Admin.jsx
import React, { useEffect, useState } from "react";

const EMPTY = { id: "", title: "", type: "DVD", qty: 1, price: 0, cover: "", images: [], youtube: "", detail: "" };
const TOKEN_KEY = "token"; // สมมุติคุณเก็บ JWT เดิมไว้ใน localStorage

export default function Admin() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const token = (typeof window !== "undefined" && localStorage.getItem(TOKEN_KEY)) || "";

  function authHeaders() {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  useEffect(() => { reload(); }, []);

  async function reload() {
    const r = await fetch("/api/products");
    const d = await r.json();
    const map = new Map();
    for (const it of d.items || []) map.set(it.id, it);
    setItems([...map.values()]);
  }

  function edit(p) {
    setForm({ ...p });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "qty" || name === "price" ? Number(value) : value }));
  }

  async function onSave(e) {
    e.preventDefault();              // กัน submit ซ้อน
    if (busy) return;
    setBusy(true);
    try {
      const isUpdate = !!form.id;
      const r = await fetch("/api/products", {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!d.ok) return alert(d.error || "บันทึกไม่สำเร็จ");

      const saved = d.product || form;
      // upsert ใน state ทันที (optimistic)
      setItems((list) => {
        const next = list.filter((x) => x.id !== saved.id);
        next.push(saved);
        return next;
      });
      if (!isUpdate) setForm(EMPTY); // เพิ่มใหม่เสร็จค่อยเคลียร์ฟอร์ม
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id) {
    // optimistic update: ตัดออกก่อน ลด INP
    setItems((list) => list.filter((x) => x.id !== id));
    try {
      await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ id }),
      });
    } catch {
      // ถ้าพลาดให้รีโหลดกลับ
      reload();
    }
  }

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
      <h2>แก้ไขสินค้า</h2>

      <form onSubmit={onSave}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 3fr", gap: 8, maxWidth: 740 }}>
          <label>รหัส (เว้นว่างถ้าเพิ่มใหม่)</label>
          <input name="id" value={form.id || ""} onChange={onChange} />

          <label>ชื่อเรื่อง</label>
          <input name="title" value={form.title || ""} onChange={onChange} required />

          <label>ประเภท</label>
          <select name="type" value={form.type} onChange={onChange}>
            <option value="DVD">DVD</option>
            <option value="VCD">VCD</option>
          </select>

          <label>จำนวน</label>
          <input type="number" name="qty" value={form.qty || 0} onChange={onChange} min={0} />

          <label>ราคา (บาท)</label>
          <input type="number" name="price" value={form.price || 0} onChange={onChange} min={0} />

          <label>ปก (URL)</label>
          <input name="cover" value={form.cover || ""} onChange={onChange} placeholder="/public/covers/xxx.jpg" />

          <label>รายละเอียด</label>
          <textarea name="detail" rows={5} value={form.detail || ""} onChange={onChange} />
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button type="submit" disabled={busy}>{busy ? "กำลังบันทึก..." : "บันทึก"}</button>
          <button type="button" onClick={() => setForm(EMPTY)}>เริ่มใหม่</button>
        </div>
      </form>

      <hr style={{ margin: "24px 0" }} />

      <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead style={{ background: "#f5f5f5" }}>
          <tr>
            <th align="left">รหัส</th>
            <th align="left">ชื่อ</th>
            <th align="left">ประเภท</th>
            <th align="right">จำนวน</th>
            <th align="right">ราคา</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id} style={{ borderTop: "1px solid #eee" }}>
              <td>{p.id}</td>
              <td><a href={`#/product/${p.id}`}>{p.title}</a></td>
              <td>{p.type}</td>
              <td align="right">{p.qty}</td>
              <td align="right">{p.price}</td>
              <td align="right" style={{ whiteSpace: "nowrap" }}>
                <button type="button" onClick={() => edit(p)}>แก้ไข</button>
                <button type="button" onClick={() => onDelete(p.id)} style={{ marginLeft: 8 }}>ลบ</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

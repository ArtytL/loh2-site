// src/pages/Admin.jsx
import React, { useEffect, useState } from "react";

// เก็บ token ไว้ใน localStorage ชื่อ ADMIN_TOKEN
const getToken = () => localStorage.getItem("ADMIN_TOKEN") || "";
const setToken = (t) => localStorage.setItem("ADMIN_TOKEN", t);
const clearToken = () => localStorage.removeItem("ADMIN_TOKEN");

export default function Admin() {
  const [token, setTok] = useState(getToken());
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  // ฟอร์มล็อกอิน
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ฟอร์มสินค้า
  const emptyForm = {
    id: "",            // ถ้าใส่แสดงว่าแก้ไข (PUT) ถ้าว่างคือเพิ่มใหม่ (POST)
    title: "",
    type: "DVD",
    qty: 1,
    price: 0,
    cover: "",         // ปกหลัก
    image2: "",        // รูปเพิ่ม #2
    image3: "",        // รูปเพิ่ม #3
    image4: "",        // รูปเพิ่ม #4
    youtube: "",       // URL YouTube
    detail: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // ------------------ utils ------------------
  const authHeaders = () =>
    token
      ? { Authorization: `Bearer ${token}` }
      : {};

  const loadItems = async () => {
    try {
      const r = await fetch("/api/products");
      const d = await r.json();
      if (d.ok) setItems(d.items || []);
    } catch (e) {
      console.error(e);
    }
  };

  const logout = () => {
    clearToken();
    setTok("");
    setItems([]);
    setForm(emptyForm);
  };

  // ------------------ effects ------------------
  useEffect(() => {
    loadItems();
  }, []);

  // ------------------ actions ------------------
  const doLogin = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const r = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!d.ok) return setErr(d.error || "ล็อกอินไม่สำเร็จ");
      setToken(d.token);
      setTok(d.token);
      setEmail("");
      setPassword("");
    } catch (e) {
      setErr(String(e));
    }
  };

  const startNew = () => {
    setForm(emptyForm);
  };

  const onEdit = (p) => {
    // map ค่าจากสินค้าเดิมลงฟอร์ม รวมรูป images (ถ้ามี)
    const [i2, i3, i4] = Array.isArray(p.images) ? p.images.slice(0, 3) : [];
    setForm({
      id: p.id || "",
      title: p.title || "",
      type: p.type || "DVD",
      qty: Number(p.qty ?? 1),
      price: Number(p.price ?? 0),
      cover: p.cover || "",
      image2: i2 || "",
      image3: i3 || "",
      image4: i4 || "",
      youtube: p.youtube || "",
      detail: p.detail || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id) => {
    if (!token) return alert("กรุณาเข้าสู่ระบบ");
    if (!confirm(`ลบสินค้า ${id}?`)) return;
    try {
      const r = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        headers: { ...authHeaders() },
      });
      const d = await r.json();
      if (!d.ok) return alert(d.error || "ลบไม่สำเร็จ");
      await loadItems();
      if (form.id === id) setForm(emptyForm);
    } catch (e) {
      alert(String(e));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!token) return alert("กรุณาเข้าสู่ระบบ");
    setSaving(true);
    setErr("");

    // รวบรวมรูปเพิ่ม (กรอกช่องไหนไว้บ้าง)
    const images = [form.image2, form.image3, form.image4].filter(
      (s) => s && s.trim().length > 0
    );

    const body = {
      product: {
        id: form.id || undefined, // ให้ API ตัดสินใจเพิ่ม/แก้ไข
        title: form.title.trim(),
        type: form.type,
        qty: Number(form.qty || 0),
        price: Number(form.price || 0),
        cover: form.cover.trim(),   // ใส่ชื่อไฟล์/พาธ ได้ (ฝั่งหน้าบ้านจะแปลงด้วย toImageURL)
        images,
        youtube: form.youtube.trim(),
        detail: form.detail,
      },
    };

    try {
      // ถ้ามี id => PUT (แก้ไข) / ถ้าไม่มี id => POST (เพิ่มใหม่)
      const method = form.id ? "PUT" : "POST";
      const url = form.id ? `/api/products/${form.id}` : "/api/products";

      const r = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!d.ok) {
        setErr(d.error || "บันทึกไม่สำเร็จ");
      } else {
        await loadItems();
        // เคลียร์ฟอร์มหลังบันทึกสำเร็จ
        setForm(emptyForm);
      }
    } catch (e) {
      setErr(String(e));
    } finally {
      setSaving(false);
    }
  };

  // ------------------ render ------------------
  if (!token) {
    return (
      <div style={{ maxWidth: 900, margin: "32px auto" }}>
        <h1>เข้าสู่ระบบผู้ดูแล</h1>
        {err && <p style={{ color: "crimson" }}>{err}</p>}
        <form onSubmit={doLogin} style={{ display: "grid", gap: 12 }}>
          <input
            placeholder="อีเมลผู้ดูแล"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
          />
          <input
            placeholder="รหัสผ่าน"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
          />
          <button
            type="submit"
            style={{
              padding: "12px 16px",
              background: "#111",
              color: "#fff",
              borderRadius: 8,
              border: 0,
            }}
          >
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "24px auto", padding: "0 12px" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <h1 style={{ flex: 1 }}>Admin Panel</h1>
        <button onClick={startNew}>เริ่มใหม่</button>
        <button onClick={logout}>ออกจากระบบ</button>
      </div>

      {err && (
        <div style={{ color: "crimson", margin: "8px 0" }}>Error: {err}</div>
      )}

      <form
        onSubmit={onSubmit}
        style={{
          margin: "16px 0 32px",
          padding: 16,
          border: "1px solid #eee",
          borderRadius: 10,
          display: "grid",
          gap: 12,
        }}
      >
        <div style={{ display: "grid", gap: 8 }}>
          <label>รหัส (ใส่เฉพาะตอนแก้ไข)</label>
          <input
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
            placeholder="ตัวอย่าง: P0007 (ว่างไว้ถ้าเพิ่มสินค้าใหม่)"
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
          />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label>ชื่อเรื่อง</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
          />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label>ประเภท</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
          >
            <option>DVD</option>
            <option>Blu-ray</option>
            <option>VCD</option>
            <option>อื่น ๆ</option>
          </select>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label>จำนวน</label>
          <input
            type="number"
            value={form.qty}
            onChange={(e) =>
              setForm({ ...form, qty: Number(e.target.value || 0) })
            }
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
          />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label>ราคา (บาท)</label>
          <input
            type="number"
            value={form.price}
            onChange={(e) =>
              setForm({ ...form, price: Number(e.target.value || 0) })
            }
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
          />
        </div>

        {/* ภาพหลัก */}
        <div style={{ display: "grid", gap: 8 }}>
          <label>ปก (URL)</label>
          <input
            value={form.cover}
            onChange={(e) => setForm({ ...form, cover: e.target.value })}
            placeholder="เช่น unleash-3.jpg หรือ /covers/unleash-3.jpg หรือ URL เต็ม"
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
          />
        </div>

        {/* รูปเพิ่ม #2-#4 */}
        <div style={{ display: "grid", gap: 8 }}>
          <label>รูปเพิ่ม #2 (URL)</label>
          <input
            value={form.image2}
            onChange={(e) => setForm({ ...form, image2: e.target.value })}
            placeholder="เช่น img-2.jpg หรือ URL เต็ม"
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
          />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label>รูปเพิ่ม #3 (URL)</label>
          <input
            value={form.image3}
            onChange={(e) => setForm({ ...form, image3: e.target.value })}
            placeholder="เช่น img-3.jpg หรือ URL เต็ม"
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
          />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label>รูปเพิ่ม #4 (URL)</label>
          <input
            value={form.image4}
            onChange={(e) => setForm({ ...form, image4: e.target.value })}
            placeholder="เช่น img-4.jpg หรือ URL เต็ม"
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
          />
        </div>

        {/* YouTube */}
        <div style={{ display: "grid", gap: 8 }}>
          <label>YouTube URL (ถ้ามี)</label>
          <input
            value={form.youtube}
            onChange={(e) => setForm({ ...form, youtube: e.target.value })}
            placeholder="เช่น https://www.youtube.com/watch?v=xxxx"
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
          />
        </div>

        {/* รายละเอียด */}
        <div style={{ display: "grid", gap: 8 }}>
          <label>รายละเอียด</label>
          <textarea
            rows={6}
            value={form.detail}
            onChange={(e) => setForm({ ...form, detail: e.target.value })}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "12px 20px",
              background: "#111",
              color: "#fff",
              borderRadius: 10,
              border: 0,
            }}
          >
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          <button type="button" onClick={startNew}>
            เริ่มใหม่
          </button>
        </div>
      </form>

      {/* ตารางรายการ */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          border: "1px solid #eee",
        }}
      >
        <thead>
          <tr style={{ background: "#fafafa" }}>
            <th style={th}>รหัส</th>
            <th style={th}>ชื่อ</th>
            <th style={th}>ประเภท</th>
            <th style={th}>จำนวน</th>
            <th style={th}>ราคา</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id} style={{ borderTop: "1px solid #eee" }}>
              <td style={td}>{p.id}</td>
              <td style={td}>
                <button
                  onClick={() => onEdit(p)}
                  style={{ color: "#0a58ca", textDecoration: "underline" }}
                >
                  {p.title}
                </button>
              </td>
              <td style={td}>{p.type}</td>
              <td style={td}>{p.qty}</td>
              <td style={td}>{p.price}</td>
              <td style={{ ...td, textAlign: "right" }}>
                <button onClick={() => onDelete(p.id)}>ลบ</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th = { textAlign: "left", padding: "10px 8px" };
const td = { padding: "10px 8px" };

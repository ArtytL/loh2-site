// src/pages/Checkout.jsx
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";

function loadCart() {
  try {
    const raw = localStorage.getItem("cart");
    const arr = JSON.parse(raw || "[]");
    if (Array.isArray(arr)) return arr;
    return [];
  } catch {
    return [];
  }
}

function saveCart(arr) {
  localStorage.setItem("cart", JSON.stringify(arr || []));
}

export default function Checkout() {
  const [cart, setCart] = useState(() => loadCart());
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    note: "",
  });

  // ค่าขนส่งจาก ENV (ตั้งใน Vercel เป็น VITE_SHIPPING_FEE) ไม่งั้นใช้ 50
  const SHIPPING = useMemo(() => {
    const v = Number(import.meta.env.VITE_SHIPPING_FEE || 50);
    return Number.isFinite(v) ? v : 50;
  }, []);

  const subtotal = useMemo(() => {
    return (cart || []).reduce((s, p) => {
      const qty = Number(p.qty || 1);
      const price = Number(p.price || 0);
      return s + qty * price;
    }, 0);
  }, [cart]);

  const grand = useMemo(() => subtotal + (cart.length > 0 ? SHIPPING : 0), [subtotal, SHIPPING, cart.length]);

  // sync cart เมื่อ localStorage ถูกอัปเดต (กรณีกดเพิ่ม/ลบจากหน้ารายการแล้วค่อยมาเช็คเอาต์)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "cart") {
        setCart(loadCart());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    if (cart.length === 0) {
      setMsg("ตะกร้าว่าง — กรุณาเลือกสินค้า");
      return;
    }
    if (!form.name || !form.phone || !form.address) {
      setMsg("กรุณากรอก ชื่อ, เบอร์โทร และที่อยู่จัดส่ง ให้ครบถ้วน");
      return;
    }

    setSending(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        note: form.note,
        cart,
        shipping: SHIPPING,
        total: grand,
      };

      const res = await apiFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || `${res.status} ${res.statusText}`);
      }

      setMsg("ส่งคำสั่งซื้อเรียบร้อย ✅ กรุณาตรวจสอบอีเมล/กล่องจดหมาย");
      // เคลียร์ตะกร้า
      setCart([]);
      saveCart([]);
      // เคลียร์ฟอร์ม
      setForm({ name: "", email: "", phone: "", address: "", note: "" });
    } catch (err) {
      setMsg(`ส่งคำสั่งซื้อไม่สำเร็จ: ${String(err)}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ maxWidth: 960, margin: "24px auto", padding: 16 }}>
      <h2>เช็คเอาต์</h2>

      {msg && (
        <p style={{ color: msg.includes("ไม่สำเร็จ") ? "#c00" : "#0a0", marginTop: 8, marginBottom: 16 }}>
          {msg}
        </p>
      )}

      {/* ตารางตะกร้า */}
      <div style={{ marginBottom: 24, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
          <thead>
            <tr style={{ background: "#f7f7f7" }}>
              <th style={th}>รหัส</th>
              <th style={th}>ชื่อ</th>
              <th style={th}>ประเภท</th>
              <th style={{ ...th, textAlign: "right" }}>จำนวน</th>
              <th style={{ ...th, textAlign: "right" }}>ราคา</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((p) => (
              <tr key={p.id} style={{ borderTop: "1px solid #eee" }}>
                <td style={td}>{p.id}</td>
                <td style={td}>{p.title || p.name || "-"}</td>
                <td style={td}>{p.type || "-"}</td>
                <td style={{ ...td, textAlign: "right" }}>{Number(p.qty || 1)}</td>
                <td style={{ ...td, textAlign: "right" }}>
                  {Number(p.price || 0).toLocaleString("th-TH")}
                </td>
              </tr>
            ))}
            <tr style={{ borderTop: "1px solid #eee" }}>
              <td style={td} colSpan={4}>
                รวมค่าสินค้า
              </td>
              <td style={{ ...td, textAlign: "right" }}>{subtotal.toLocaleString("th-TH")}</td>
            </tr>
            <tr>
              <td style={td} colSpan={4}>
                ค่าจัดส่ง
              </td>
              <td style={{ ...td, textAlign: "right" }}>
                {cart.length > 0 ? SHIPPING.toLocaleString("th-TH") : 0}
              </td>
            </tr>
            <tr>
              <td style={{ ...td, fontWeight: 700 }} colSpan={4}>
                ยอดชำระรวม
              </td>
              <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>
                {grand.toLocaleString("th-TH")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ฟอร์มข้อมูลผู้ซื้อ */}
      <form onSubmit={onSubmit} style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
        <h3>ข้อมูลผู้สั่งซื้อ / ที่อยู่จัดส่ง</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>
            ชื่อ-นามสกุล
            <input
              style={input}
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            อีเมล
            <input
              style={input}
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            เบอร์โทร
            <input
              style={input}
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <div />
        </div>

        <label style={{ display: "block", marginTop: 12 }}>
          ที่อยู่จัดส่ง
          <textarea
            style={textarea}
            rows={3}
            required
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </label>

        <label style={{ display: "block", marginTop: 12 }}>
          หมายเหตุ (ถ้ามี)
          <input
            style={input}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </label>

        <button
          type="submit"
          style={btn}
          disabled={sending || cart.length === 0}
          title={cart.length === 0 ? "ไม่มีสินค้าในตะกร้า" : "ส่งคำสั่งซื้อ"}
        >
          {sending ? "กำลังส่งคำสั่งซื้อ..." : "ยืนยันคำสั่งซื้อ"}
        </button>
      </form>
    </div>
  );
}

/* ---------------- styles (inline object) ---------------- */

const th = {
  textAlign: "left",
  padding: 12,
  fontWeight: 700,
  borderBottom: "1px solid #eee",
};

const td = {
  padding: 12,
  verticalAlign: "top",
};

const input = {
  width: "100%",
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: "10px 12px",
  marginTop: 6,
  outline: "none",
};

const textarea = {
  ...input,
  resize: "vertical",
};

const btn = {
  width: "100%",
  marginTop: 16,
  padding: "14px 18px",
  border: "0",
  borderRadius: 12,
  background: "#111",
  color: "#fff",
  cursor: "pointer",
};

// src/pages/Checkout.jsx
import { useMemo, useState, useEffect } from "react";

/* ===== ENV + ENDPOINTS ===== */
const API_URL  = (import.meta.env.VITE_API_URL || "").trim();  // e.g. https://email-five-alpha.vercel.app/api
const SEND_URL = `${API_URL.replace(/\/$/, "")}/send-order`;    // -> https://.../api/send-order
const SHIPPING = Number(import.meta.env.VITE_SHIPPING_FEE || 50);

/* ===== utils ===== */
const fmt = (n) =>
  (Number(n) || 0).toLocaleString("th-TH", { maximumFractionDigits: 0 }) +
  " บาท";

const getCart = () => {
  try {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  } catch {
    return [];
  }
};
const saveCart = (c) => localStorage.setItem("cart", JSON.stringify(c));

/* ===== component ===== */
export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");

  // ฟอร์มข้อมูลผู้ซื้อ
  const [form, setForm] = useState({
    orderId: "", // ถ้าเว้นว่าง ระบบจะ gen ให้ตอนส่ง
    name: "",
    email: "",
    phone: "",
    address: "",
    note: "",
  });

  // โหลดตะกร้าเมื่อเข้าหน้า
  useEffect(() => {
    const c = getCart();
    setCart(c);
  }, []);

  // บันทึกตะกร้าทุกครั้งที่เปลี่ยน
  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 1),
        0
      ),
    [cart]
  );
  const grand = subtotal + SHIPPING;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const setQty = (index, qty) => {
    setCart((c) => {
      const newC = [...c];
      const q = Math.max(1, Number(qty) || 1);
      newC[index] = { ...newC[index], qty: q };
      return newC;
    });
  };

  const removeItem = (index) => {
    setCart((c) => c.filter((_, i) => i !== index));
  };

  const clearMsgLater = () => {
    setTimeout(() => setMsg(""), 4000);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setMsg("");
    if (!cart.length) {
      setMsg("ไม่มีสินค้าในตะกร้า");
      clearMsgLater();
      return;
    }
    if (!form.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setMsg("กรุณากรอกอีเมลให้ถูกต้อง");
      clearMsgLater();
      return;
    }
    if (!form.phone) {
      setMsg("กรุณากรอกเบอร์โทร");
      clearMsgLater();
      return;
    }
    if (!form.address) {
      setMsg("กรุณากรอกที่อยู่จัดส่ง");
      clearMsgLater();
      return;
    }

    const orderId =
      (form.orderId || "").trim() ||
      `L${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${
        Math.random().toString(36).slice(2, 7)
      }`;

    const payload = {
      orderId,
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      note: form.note,
      cart,
      shipping: SHIPPING,
      subtotal,
      grand,
      // เผื่อ backend อยากรู้ referrer
      source: "loh2-site",
    };

    try {
      setSending(true);
      const res = await fetch(SEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json().catch(() => ({}));

      setMsg("ส่งออเดอร์เรียบร้อย 🎉 กรุณาตรวจสอบอีเมลของคุณ");
      // เคลียร์ตะกร้าหลังส่ง (ถ้าอยากเก็บไว้คอมเมนต์บรรทัดข้างล่าง)
      setCart([]);
      saveCart([]);

      // ถ้าอยากเด้งไปหน้าแจ้งโอนทันที ให้เปิดลิงก์นี้:
      // window.location.hash = "#/transfer";
    } catch (err) {
      setMsg(`ส่งออเดอร์ไม่สำเร็จ: ${err.message || "เกิดข้อผิดพลาด"}`);
    } finally {
      setSending(false);
      clearMsgLater();
    }
  };

  return (
    <div style={s.container}>
      <h1 style={{ marginBottom: 8 }}>เช็คเอาต์</h1>
      {!cart.length ? (
        <p style={{ opacity: 0.7 }}>ตะกร้ายังว่าง</p>
      ) : null}

      <div style={s.grid}>
        {/* กล่องรายการสินค้า */}
        <div style={s.card}>
          <h3 style={{ marginTop: 0 }}>รายการสินค้า</h3>
          {!cart.length ? (
            <div style={{ opacity: 0.7 }}>ยังไม่มีสินค้าในตะกร้า</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {cart.map((it, i) => (
                <div key={i} style={s.row}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{it.title || "-"}</div>
                    <div style={{ opacity: 0.7, fontSize: 13 }}>
                      ราคา: {fmt(it.price)}
                    </div>
                  </div>
                  <div>
                    <input
                      type="number"
                      min={1}
                      value={it.qty ?? 1}
                      onChange={(e) => setQty(i, e.target.value)}
                      style={{ ...s.input, width: 90 }}
                    />
                  </div>
                  <div style={{ width: 120, textAlign: "right" }}>
                    {fmt((Number(it.price) || 0) * (Number(it.qty) || 1))}
                  </div>
                  <button style={s.linkBtn} onClick={() => removeItem(i)}>
                    ลบ
                  </button>
                </div>
              ))}

              <div style={s.line} />

              <div style={s.row}>
                <div style={{ flex: 1, opacity: 0.8 }}>ยอดรวมสินค้า</div>
                <div style={{ width: 120, textAlign: "right" }}>
                  {fmt(subtotal)}
                </div>
              </div>
              <div style={s.row}>
                <div style={{ flex: 1, opacity: 0.8 }}>
                  ค่าส่ง{" "}
                  <span style={s.chip}>เหมาจ่าย</span>
                </div>
                <div style={{ width: 120, textAlign: "right" }}>
                  {fmt(SHIPPING)}
                </div>
              </div>

              <div style={s.row}>
                <div style={{ flex: 1, fontWeight: 700 }}>รวมทั้งสิ้น</div>
                <div style={{ width: 120, textAlign: "right", fontWeight: 700 }}>
                  {fmt(grand)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* กล่องฟอร์มผู้สั่งซื้อ */}
        <form style={s.card} onSubmit={handleSubmit}>
          <h3 style={{ marginTop: 0 }}>ข้อมูลผู้ซื้อ</h3>

          <label style={s.label}>หมายเลขออเดอร์ (ปล่อยว่างให้ระบบสร้างอัตโนมัติ)</label>
          <input
            name="orderId"
            value={form.orderId}
            onChange={onChange}
            placeholder="เช่น L2-1725..."
            style={s.input}
          />

          <label style={s.label}>ชื่อ-นามสกุล</label>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            style={s.input}
            placeholder="ชื่อ-นามสกุล"
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={s.label}>อีเมล*</label>
              <input
                required
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                style={s.input}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label style={s.label}>เบอร์โทร*</label>
              <input
                required
                name="phone"
                value={form.phone}
                onChange={onChange}
                style={s.input}
                placeholder="0812345678"
              />
            </div>
          </div>

          <label style={s.label}>ที่อยู่จัดส่ง*</label>
          <textarea
            required
            name="address"
            value={form.address}
            onChange={onChange}
            style={s.textarea}
            placeholder="บ้านเลขที่ / ถนน / แขวง/ตำบล / เขต/อำเภอ / จังหวัด / รหัสไปรษณีย์"
          />

          <label style={s.label}>หมายเหตุ (ถ้ามี)</label>
          <input
            name="note"
            value={form.note}
            onChange={onChange}
            style={s.input}
            placeholder="ระบุรายละเอียดเพิ่มเติม (เช่น ออกใบเสร็จ / จัดส่งช่วงเวลา ฯลฯ)"
          />

          {msg && (
            <div style={{ marginTop: 8, marginBottom: 8, color: "#c00" }}>{msg}</div>
          )}

          <button type="submit" style={s.btn} disabled={sending || !cart.length}>
            {sending ? "กำลังส่ง..." : "ยืนยันสั่งซื้อ"}
          </button>

          <div style={{ marginTop: 12 }}>
            หรือไปที่{" "}
            <a href="#/transfer" style={{ textDecoration: "underline" }}>
              หน้าหน้าแจ้งโอน
            </a>{" "}
            หลังจากชำระเงินแล้ว
          </div>
        </form>
      </div>

      <div style={{ marginTop: 16, fontSize: 12, opacity: 0.6 }}>
        API: {SEND_URL}
      </div>
    </div>
  );
}

/* ===== styles (inline, lightweight) ===== */
const s = {
  container: { maxWidth: 980, margin: "0 auto", padding: 16 },
  grid: {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: 16,
  },
  card: {
    border: "1px solid #eee",
    borderRadius: 12,
    padding: 16,
    background: "#fff",
  },
  label: { display: "block", marginTop: 8, marginBottom: 6, fontSize: 13, opacity: 0.8 },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: 8,
    outline: "none",
  },
  textarea: { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, minHeight: 96, outline: "none" },
  row: { display: "flex", alignItems: "center", gap: 12 },
  line: { height: 1, background: "#eee", margin: "6px 0 10px" },
  btn: {
    padding: "12px 14px",
    borderRadius: 8,
    background: "#111",
    color: "#fff",
    border: 0,
    cursor: "pointer",
    width: "100%",
    marginTop: 8,
  },
  chip: {
    padding: "2px 8px",
    borderRadius: 6,
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "default",
    fontSize: 12,
    marginLeft: 6,
  },
  linkBtn: {
    padding: "4px 10px",
    borderRadius: 6,
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "pointer",
  },
};

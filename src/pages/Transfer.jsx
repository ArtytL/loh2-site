// src/pages/Transfer.jsx
import { useEffect, useState } from "react";

// ===== CONFIG from .env =====
// VITE_API_URL ต้องเป็นแบบมี /api ต่อท้าย เช่น https://email-five-alpha.vercel.app/api
const API_BASE = import.meta.env.VITE_API_URL;
const SEND_URL = `${API_BASE}/send-order`;              // endpoint ที่เราส่งจริง
const SHIP = Number(import.meta.env.VITE_SHIPPING_FEE || 50);

// ===== Utils =====
const fmt = (n) => (Number(n) || 0).toLocaleString("th-TH", { maximumFractionDigits: 0 }) + " บาท";
const isEmail = (s) => typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

// โหลดตะกร้า (จากหน้า checkout) มาดูยอด
function getCart() {
  try {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  } catch {
    return [];
  }
}

export default function Transfer() {
  const [cart, setCart]   = useState([]);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // แบบฟอร์มแจ้งโอน
  const [form, setForm] = useState({
    orderId: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    amount: "",   // ใส่ยอดที่จะโอน (prefill จากรวมสินค้า + ค่าส่ง)
    note: "",
    slipData: "", // base64 ของสลิป (ถ้ามี)
  });

  // ให้หน้าเพจรู้ยอดรวมจากตะกร้าปัจจุบัน
  const subtotal = cart.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 1), 0);
  const grand = subtotal + SHIP;

  useEffect(() => {
    const c = getCart();
    setCart(c);
    setForm((f) => ({ ...f, amount: grand })); // prefill ยอดรวม
    // eslint-disable-next-line
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // แปลงไฟล์แนบเป็น base64 เก็บลง state
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setForm((f) => ({ ...f, slipData: "" }));
      return;
    }
    const b64 = await fileToBase64(file);
    setForm((f) => ({ ...f, slipData: b64 }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setMsg("");
    if (!form.orderId?.trim()) return setErr("กรุณากรอกหมายเลขออเดอร์");
    if (!isEmail(form.email))  return setErr("อีเมลไม่ถูกต้อง");
    if (!form.phone?.trim())   return setErr("กรุณากรอกเบอร์โทร");
    if (!form.address?.trim()) return setErr("กรุณากรอกที่อยู่จัดส่ง");

    setSending(true);
    try {
      // รวม payload ส่งไปที่ /send-order
      const payload = {
        type: "transfer",             // ให้ backend แยกเคสแจ้งโอน (ไม่มีก็ไม่พัง)
        orderId: form.orderId,
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        note: form.note,
        amount: Number(form.amount) || grand,
        shipping: SHIP,
        cart,                         // แนบรายการที่มีใน localStorage ไปด้วย
        slipData: form.slipData,      // แนบสลิป (base64) ถ้ามี
      };

      const res = await fetch(SEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMsg("ส่งข้อมูลแจ้งโอนเรียบร้อยแล้วครับ ✨");
    } catch (e) {
      setErr(e.message || "ส่งข้อมูลไม่สำเร็จ");
    } finally {
      setSending(false);
    }
  };

  // ====== UI ======
  return (
    <div style={st.wrap}>
      <h1 style={{ margin: "0 0 12px 0" }}>หน้าแจ้งโอน</h1>
      <p>ถ้าอยากใช้ฟอร์มเต็มของแจ้งโอน กรอกข้อมูลให้ครบแล้วกด “ส่งแจ้งโอน” ได้เลย</p>

      {/* ข้อมูลบัญชี */}
      <div style={st.card}>
        <div><b>บัญชีสำหรับโอน</b></div>
        <div>ธนาคาร: กรุงเทพ</div>
        <div>เลขบัญชี: 047-007-8908</div>
        <div>ชื่อบัญชี: อาทิตย์ เลิศรักษ์มงคล</div>
        <div>ค่าส่ง: {fmt(SHIP)} (เหมากล่อง)</div>
      </div>

      {/* สรุปรายการสินค้า (ถ้ามีตะกร้า) */}
      {cart.length > 0 && (
        <div style={st.card}>
          <div style={{ marginBottom: 6 }}><b>รายการสินค้า</b></div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {cart.map((it, i) => (
              <li key={i}>
                {it.title} × {it.qty} = {fmt((Number(it.price) || 0) * (Number(it.qty) || 1))}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 8 }}>รวมสินค้า: {fmt(subtotal)}</div>
          <div>ค่าส่ง: {fmt(SHIP)}</div>
          <div><b>รวมทั้งสิ้น: {fmt(grand)}</b></div>
        </div>
      )}

      {/* ฟอร์มแจ้งโอน */}
      <form onSubmit={onSubmit} style={{ marginTop: 12 }}>
        <div><label>หมายเลขออเดอร์*</label></div>
        <input
          name="orderId"
          placeholder="เช่น L2-1725..."
          value={form.orderId}
          onChange={onChange}
          style={st.input}
        />

        <div><label>ชื่อ-นามสกุล*</label></div>
        <input
          name="name"
          value={form.name}
          onChange={onChange}
          style={st.input}
        />

        <div><label>อีเมล*</label></div>
        <input
          name="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={onChange}
          style={st.input}
        />

        <div><label>เบอร์โทร*</label></div>
        <input
          name="phone"
          value={form.phone}
          onChange={onChange}
          style={st.input}
        />

        <div><label>ที่อยู่จัดส่ง*</label></div>
        <textarea
          name="address"
          value={form.address}
          onChange={onChange}
          style={st.textarea}
        />

        <div><label>ยอดที่โอน (บาท)</label></div>
        <input
          name="amount"
          type="number"
          value={form.amount}
          onChange={onChange}
          style={st.input}
        />

        <div><label>หมายเหตุ (ถ้ามี)</label></div>
        <textarea
          name="note"
          value={form.note}
          onChange={onChange}
          style={st.textarea}
        />

        <div><label>แนบสลิป (PNG/JPG/PDF)</label></div>
        <input type="file" accept="image/*,application/pdf" onChange={onFile} style={{ marginBottom: 12 }} />

        <button type="submit" style={st.btn} disabled={sending}>
          {sending ? "กำลังส่งแจ้งโอน..." : "ส่งแจ้งโอน"}
        </button>
      </form>

      {err && <p style={{ color: "#c00" }}>ผิดพลาด: {err}</p>}
      {msg && <p style={{ color: "#0a0" }}>{msg}</p>}

      <hr style={{ margin: "24px 0" }} />
      <p style={{ color: "#666" }}>
        หรือ reply อีเมลยืนยันคำสั่งซื้อพร้อมแนบสลิปก็ได้เช่นกัน
      </p>
    </div>
  );
}

/* ===== styles ===== */
const st = {
  wrap:  { maxWidth: 640, margin: "40px auto", padding: 16, lineHeight: 1.6 },
  input: { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, marginBottom: 10 },
  textarea: { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, minHeight: 96, marginBottom: 10 },
  btn:   { padding: "12px 16px", borderRadius: 8, background: "#111", color: "#fff", border: 0, cursor: "pointer" },
  card:  { border: "1px solid #eee", borderRadius: 12, padding: 16, background: "#fff", marginBottom: 12 },
};

// helper แปลงไฟล์ -> base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

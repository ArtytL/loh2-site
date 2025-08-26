// src/pages/Transfer.jsx
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;
const SHIP = Number(import.meta.env.VITE_SHIPPING_FEE || 50);

// utils
const fmt = (n) =>
  (Number(n) || 0).toLocaleString("th-TH", { maximumFractionDigits: 0 });

const isEmail = (s) =>
  typeof s === "string" &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

export default function Transfer() {
  const [form, setForm] = useState({
    orderId: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    amount: "",
    note: "",
    slipFile: null,
  });
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // Prefill จาก query: #/transfer?orderId=...&name=...&...
  useEffect(() => {
    window.scrollTo(0, 0);
    const q = new URLSearchParams((location.hash.split("?")[1]) || "");
    setForm((f) => ({
      ...f,
      orderId: q.get("orderId") || f.orderId,
      name: q.get("name") || f.name,
      email: q.get("email") || f.email,
      phone: q.get("phone") || f.phone,
      address: q.get("address") || f.address,
      amount: q.get("amount") || f.amount,
    }));
  }, []);

  const onChange = (e) => {
    const { name, value, files } = e.target;
    setForm((f) => ({ ...f, [name]: files ? files[0] : value }));
  };

  async function fileToBase64(file) {
    if (!file) return null;
    const ab = await file.arrayBuffer();
    let bin = "";
    const bytes = new Uint8Array(ab);
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin); // base64 (ไม่ใส่ data:prefix)
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      // validate
      if (!form.name || !form.email || !form.phone || !form.address)
        throw new Error("กรอกข้อมูลให้ครบก่อนน้า");
      if (!isEmail(form.email)) throw new Error("อีเมลไม่ถูกต้อง");
      const amount = Number(form.amount);
      if (!amount || amount < 1) throw new Error("กรอกยอดที่โอนเป็นตัวเลข");

      if (!form.slipFile) throw new Error("แนบสลิปก่อนส่งด้วยน้า");
      const okTypes = ["image/png", "image/jpeg", "application/pdf"];
      if (!okTypes.includes(form.slipFile.type))
        throw new Error("สลิปต้องเป็น PNG / JPG / PDF เท่านั้น");
      const maxSize = 8 * 1024 * 1024; // 8MB
      if (form.slipFile.size > maxSize)
        throw new Error("ไฟล์ใหญ่เกิน 8MB");

      setSending(true);

      // แปลงสลิปเป็น base64
      const slipBase64 = await fileToBase64(form.slipFile);

      // ส่งแจ้งโอน
      // NOTE: ฝั่ง API จะ “บวกค่าส่ง” เองเสมอ
      // ดังนั้นเราส่ง total = amount - SHIP เพื่อให้ (total + shipping) = amount ที่ลูกค้าโอนจริง
      const payload = {
        mode: "transfer",
        orderId: form.orderId || `PAY-${Date.now()}`,
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        note:
          form.note ||
          `ลูกค้าแจ้งโอน ${fmt(amount)} บาท (รวมค่าส่ง ${fmt(SHIP)})`,
        cart: [],
        total: Math.max(amount - SHIP, 0),
        slipBase64,
      };

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "ส่งแจ้งโอนไม่สำเร็จ");
      }

      setMsg("ส่งแจ้งโอนเรียบร้อย ✨ เราจะเช็กแล้วคอนเฟิร์มกลับทางอีเมลครับ/ค่ะ");
      setForm({
        orderId: "",
        name: "",
        email: "",
        phone: "",
        address: "",
        amount: "",
        note: "",
        slipFile: null,
      });
      const f = document.getElementById("slipFile");
      if (f) f.value = "";
    } catch (e2) {
      setErr(e2.message || String(e2));
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={st.wrap}>
      <h1 style={{ marginBottom: 8 }}>หน้าแจ้งโอน</h1>
      <p style={{ color: "#555", marginTop: 0 }}>
        กรอกข้อมูลและแนบสลิป จากนั้นกด <b>“ส่งแจ้งโอน”</b>
      </p>

      {/* ฟอร์มแจ้งโอน */}
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>หมายเลขออเดอร์
          <input
            name="orderId"
            value={form.orderId}
            onChange={onChange}
            placeholder="เช่น L2-1725..."
            style={st.input}
          />
        </label>

        <label>ชื่อ-นามสกุล*
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            required
            style={st.input}
          />
        </label>

        <label>อีเมล*
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            required
            style={st.input}
          />
        </label>

        <label>เบอร์โทร*
          <input
            name="phone"
            value={form.phone}
            onChange={onChange}
            required
            style={st.input}
          />
        </label>

        <label>ที่อยู่จัดส่ง*
          <textarea
            name="address"
            rows={3}
            value={form.address}
            onChange={onChange}
            required
            style={st.textarea}
          />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>ยอดที่โอน (บาท)*
            <input
              name="amount"
              type="number"
              inputMode="numeric"
              value={form.amount}
              onChange={onChange}
              required
              style={st.input}
            />
          </label>
          <label>ค่าส่ง (คงที่)
            <input value={SHIP} disabled style={{ ...st.input, background: "#f7f7f7" }} />
          </label>
        </div>

        <label>หมายเหตุ (ถ้ามี)
          <input
            name="note"
            value={form.note}
            onChange={onChange}
            placeholder="ช่องทาง/เวลาโอน เพิ่มเติม"
            style={st.input}
          />
        </label>

        <label>แนบสลิป (PNG/JPG/PDF)*
          <input
            id="slipFile"
            name="slipFile"
            type="file"
            accept=".png,.jpg,.jpeg,.pdf"
            onChange={onChange}
            required
            style={st.input}
          />
        </label>

        <button disabled={sending} style={st.btn}>
          {sending ? "กำลังส่งแจ้งโอน..." : "ส่งแจ้งโอน"}
        </button>

        {err && <p style={{ margin: 0, color: "#c00" }}>ผิดพลาด: {err}</p>}
        {msg && <p style={{ margin: 0, color: "#0a0" }}>{msg}</p>}
      </form>

      <hr style={{ margin: "24px 0" }} />

      {/* Info โอน */}
      <div style={st.card}>
        <b>บัญชีสำหรับโอน</b>
        <div>ธนาคาร: กรุงเทพ</div>
        <div>เลขบัญชี: 047-007-8908</div>
        <div>ชื่อบัญชี: อาทิตย์ เลิศรักษ์มงคล</div>
        <div>ค่าส่ง: {fmt(SHIP)} บาท (เหมาจ่าย)</div>
      </div>

      <p style={{ color: "#666" }}>
        หรือ reply อีเมลยืนยันคำสั่งซื้อพร้อมแนบสลิปก็ได้เช่นกัน
      </p>
    </div>
  );
}

const st = {
  wrap: { maxWidth: 640, margin: "40px auto", padding: 16, lineHeight: 1.6 },
  input: { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8 },
  textarea: { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8 },
  btn: { padding: "12px 16px", borderRadius: 8, background: "#111", color: "#fff", border: 0, cursor: "pointer" },
  card: { border: "1px solid #eee", borderRadius: 12, padding: 16, background: "#fff" },
};

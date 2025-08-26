// src/pages/Home.jsx
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <section style={{ maxWidth: 980, margin: "0 auto", lineHeight: 1.7 }}>
      <h1 style={{ margin: "0 0 8px" }}>โล๊ะ DVD มือสอง</h1>
      <p style={{ color: "#555", marginTop: 0 }}>
        แผ่นแท้ สภาพดี จัดส่งทุกวัน 🚚 ค่าส่งเหมาจ่าย 50 บาท
      </p>

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>เริ่มช้อป</h3>
        <p>เข้าไปดูรายการทั้งหมด แล้วกด “ใส่ตะกร้า” ได้เลย</p>
        <Link to="/catalog" style={btn}>ดูรายการสินค้า</Link>
      </div>

      <div style={{ ...card, marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>โอนแล้วแจ้งสลิป</h3>
        <p>ถ้าชำระแล้วสามารถแจ้งโอนและแนบสลิปได้ที่นี่</p>
        <Link to="/transfer" style={btn}>ไปหน้าแจ้งโอน</Link>
      </div>
    </section>
  );
}

const card = { border: "1px solid #eee", borderRadius: 12, padding: 16, background: "#fff" };
const btn  = { display: "inline-block", padding: "10px 14px", borderRadius: 8, background: "#111", color: "#fff", textDecoration: "none" };

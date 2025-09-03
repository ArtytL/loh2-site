// src/pages/Checkout.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Checkout() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>ตะกร้าสินค้า (ชั่วคราว)</h1>
      <p>ไฟล์นี้มีไว้ให้บิลด์ผ่าน ก่อนใส่รายละเอียดจริงภายหลัง</p>
      <p>
        <Link to="/">กลับหน้าหลัก</Link> ·{" "}
        <Link to="/transfer">ไปหน้าแจ้งโอน</Link>
      </p>
    </main>
  );
}


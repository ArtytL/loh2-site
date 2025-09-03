// src/pages/Checkout.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Checkout() {
  return (
    <main className="container-max mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">ตะกร้าสินค้า</h1>

      <p className="mb-4">
        หน้านี้เป็น placeholder ชั่วคราวเพื่อให้ระบบบิลด์ผ่าน
        (จะใส่รายละเอียดตะกร้าทีหลัง)
      </p>

      <div className="flex items-center gap-3">
        <Link to="/" className="underline">
          หน้าหลัก
        </Link>
        <Link to="/transfer" className="btn-primary">
          ไปหน้าแจ้งโอน
        </Link>
      </div>
    </main>
  );
}

// src/App.jsx
import React from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";

import Home from "./pages/Home.jsx";
import Catalog from "./pages/Catalog.jsx";
import Checkout from "./pages/Checkout.jsx";
import Admin from "./pages/Admin.jsx";
import Product from "./pages/Product.jsx";
import Transfer from "./pages/Transfer.jsx"; // << สำคัญ

export default function App() {
  return (
    <main>
      {/* ตัวอย่าง header แบบง่าย */}
      <nav className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand">โล๊ะมือสอง</Link>
          <div className="nav-right">
            <Link to="/">หน้าหลัก</Link>
            <Link to="/transfer" className="btn-pay">ชำระเงิน</Link>
          </div>
        </div>
      </nav>

      {/* บล็อก Routes ต้องห่อทุก Route ไว้ข้างใน */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/transfer" element={<Transfer />} /> {/* << Route ใหม่นี่ */}
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}

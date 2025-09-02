// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import { CartProvider } from "./context/CartContext";

// เพจเดิมของคุณ
import Catalog from "./pages/Catalog.jsx";
import Product from "./pages/Product.jsx";
import Checkout from "./pages/Checkout.jsx";
import Admin from "./pages/Admin.jsx";

export default function App() {
  return (
    <CartProvider>
      <Header />

      <main className="container">
        <Routes>
          {/* หน้าแรก = แค็ตตาล็อกสินค้า */}
          <Route path="/" element={<Catalog />} />
          <Route path="/catalog" element={<Catalog />} />

          {/* รายละเอียดสินค้า */}
          <Route path="/product/:id" element={<Product />} />

          {/* ชำระเงิน */}
          <Route path="/checkout" element={<Checkout />} />

          {/* หลังบ้าน (มีอยู่แล้ว) */}
          <Route path="/admin" element={<Admin />} />

          {/* กันหลงทาง */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </CartProvider>
  );
}

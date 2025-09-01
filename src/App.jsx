// src/App.jsx
import { Routes, Route, Link, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Catalog from "./pages/Catalog.jsx";
import Checkout from "./pages/Checkout.jsx";
import Transfer from "./pages/Transfer.jsx";
import Admin from "./pages/Admin.jsx";
// ⬇️ เพิ่ม
import Product from "./pages/Product.jsx";

export default function App() {
  return (
    <main>
      {/* nav ... */}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        {/* ⬇️ เส้นทางใหม่ */}
        <Route path="/product/:id" element={<Product />} />

        <Route path="/checkout" element={<Checkout />} />
        <Route path="/transfer" element={<Transfer />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* footer ... */}
    </main>
  );
}

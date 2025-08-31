// src/App.jsx
import { Routes, Route, Link, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Catalog from "./pages/Catalog.jsx";
import Checkout from "./pages/Checkout.jsx";
import Transfer from "./pages/Transfer.jsx";
import Admin from "./pages/Admin.jsx";

export default function App() {
  return (
    <>
      {/* ตัวอย่างเมนู */}
      <nav style={{ padding: 12 }}>
        <Link to="/">หน้าแรก</Link>{" | "}
        <Link to="/catalog">รายการสินค้า</Link>{" | "}
        <Link to="/transfer">เช็คเอาต์</Link>{" | "}
        <Link to="/admin">เข้าสู่ระบบ</Link>
      </nav>

      {/* เส้นทาง */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/transfer" element={<Transfer />} />
        <Route path="/admin" element={<Admin />} />   {/* << สำคัญ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

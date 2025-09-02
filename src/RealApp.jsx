// src/RealApp.jsx
import React from "react";
import { HashRouter, Routes, Route, Link, Navigate } from "react-router-dom";

// ⚠️ ถ้ายังมีปัญหา ให้เริ่มจากแค่ Catalog ก่อน แล้วค่อยเปิดหน้าอื่นทีละไฟล์
import Catalog from "./pages/Catalog.jsx";
// import Product from "./pages/Product.jsx";
// import Transfer from "./pages/Transfer.jsx";
// import Admin from "./pages/Admin.jsx";

export default function RealApp() {
  return (
    <HashRouter>
      <header style={{borderBottom:"1px solid #eee",padding:"10px 16px",display:"flex",justifyContent:"space-between"}}>
        <Link to="/" style={{textDecoration:"none",fontWeight:700,color:"#111"}}>โล๊ะมือสอง</Link>
        <nav style={{display:"flex",gap:12}}>
          <Link to="/" style={{textDecoration:"none"}}>หน้าหลัก</Link>
          <Link to="/transfer" style={{textDecoration:"none"}}>ชำระเงิน</Link>
        </nav>
      </header>

      <main style={{maxWidth:1100,margin:"20px auto",padding:"0 16px"}}>
        <Routes>
          <Route path="/" element={<Catalog />} />
          {/* เปิดทีละหน้า ถ้ายังขาวให้คอมเมนต์ออกก่อน */}
          {/* <Route path="/product/:id" element={<Product />} /> */}
          {/* <Route path="/transfer" element={<Transfer />} /> */}
          {/* <Route path="/admin" element={<Admin />} /> */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </HashRouter>
  );
}

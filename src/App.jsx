// src/App.jsx
import React from "react";
import { HashRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Catalog from "./pages/Catalog.jsx";
import Product from "./pages/Product.jsx";
import Transfer from "./pages/Transfer.jsx";
import Admin from "./pages/Admin.jsx";
import { totalQty } from "./lib/cart.js";

export default function App() {
  React.useEffect(() => {
    const el = document.getElementById("cart-count-badge");
    if (el) el.textContent = totalQty();
    const onChange = () => { if (el) el.textContent = totalQty(); };
    window.addEventListener("cart:changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("cart:changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return (
    <HashRouter>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/">โล๊ะมือสอง</Link>
          <div className="nav-right">
            <Link className="btn-pay" to="/transfer">ชำระเงิน</Link>
            <Link className="cart-link" to="/transfer">
              ตะกร้า <span id="cart-count-badge" />
            </Link>
          </div>
        </div>
      </header>

      <main className="container-max">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/transfer" element={<Transfer />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </HashRouter>
  );
}

import React from "react";
import { HashRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import Catalog from "./pages/Catalog.jsx";
import Transfer from "./pages/Transfer.jsx";
import { cart } from "./lib/cart.js";

export default function App(){
  const [count, setCount] = React.useState(cart.count());

  React.useEffect(()=>{
    const h = ()=> setCount(cart.count());
    window.addEventListener("cart:change", h);
    return ()=> window.removeEventListener("cart:change", h);
  },[]);

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/">โล๊ะมือสอง</Link>
          <nav className="nav">
            <Link to="/">หน้าหลัก</Link>
            <Link className="btn-pay" to="/transfer">ชำระเงิน</Link>
            <Link className="cart-link" to="/transfer">
              ตะกร้า
              <span className="cart-badge">{count}</span>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Catalog />} />
            <Route path="/transfer" element={<Transfer />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </main>
    </>
  );
}

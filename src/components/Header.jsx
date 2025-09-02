// src/components/Header.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Header() {
  const { count } = useCart();

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="brand">โล๊ะมือสอง</Link>

        <nav className="nav-right">
          <Link to="/" className="nav-link">หน้าหลัก</Link>
          <Link to="/checkout" className="nav-link btn-pay">ชำระเงิน</Link>

          <Link to="/checkout" className="cart-link" aria-label="ตะกร้าสินค้า">
            <span className="cart-text">ตะกร้า</span>
            <span className="badge">{count}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}


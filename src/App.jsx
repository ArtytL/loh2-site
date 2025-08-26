// src/App.jsx
import { Routes, Route, Link, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Catalog from "./pages/Catalog.jsx";
import Checkout from "./pages/Checkout.jsx";
import Transfer from "./pages/Transfer.jsx";
import Admin from "./pages/Admin.jsx";

export default function App() {
  return (
    <div style={s.wrap}>
      <Header />
      <Nav />
      <main style={s.main}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/transfer" element={<Transfer />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
    
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header style={s.header}>
      <div style={s.container}>
        <div style={{ fontWeight: 700 }}>โล๊ะ DVD มือสอง</div>
      </div>
    </header>
  );
}
function Nav() {
  return (
    <nav style={s.nav}>
      <div style={{ ...s.container, display: "flex", gap: 16 }}>
        <Link to="/" style={s.link}>หน้าแรก</Link>
        <Link to="/catalog" style={s.link}>รายการสินค้า</Link>
        <Link to="/checkout" style={s.link}>เช็คเอาต์</Link>
        <Link to="/transfer" style={s.link}>หน้าแจ้งโอน</Link>
      </div>
    </nav>
  );
}
function Footer() {
  return (
    <footer style={s.footer}>
      <div style={s.container}>
        <small style={{ color: "#888" }}>
          © {new Date().getFullYear()} โล๊ะ DVD มือสอง
        </small>
      </div>
    </footer>
  );
}

const s = {
  wrap: { minHeight: "100dvh", display: "flex", flexDirection: "column" },
  container: { maxWidth: 1000, margin: "0 auto", padding: "0 16px" },
  header: { borderBottom: "1px solid #eee", padding: "12px 0", background: "#fff", position: "sticky", top: 0, zIndex: 10 },
  nav: { borderBottom: "1px solid #f0f0f0", background: "#fafafa" },
  link: { padding: "10px 0", display: "inline-block", color: "#111", textDecoration: "none" },
  main: { flex: 1, padding: "24px 16px" },
  footer: { borderTop: "1px solid #eee", padding: "16px 0", background: "#fff" },
};

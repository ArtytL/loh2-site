// src/pages/Admin.jsx
import React, { useEffect, useMemo, useState } from "react";

/** เปลี่ยน BASE ได้ถ้าคุณมี API แยกโดเมน; ถ้าใช้ API บนโดเมนเดียวกัน ปล่อย "" ได้เลย */
const BASE = import.meta.env.VITE_API_URL || ""; // e.g. "" หรือ "https://loh2-site.vercel.app"

function useToken() {
  const [token, setToken] = useState(() => localStorage.getItem("adminToken") || "");
  const save = (t) => {
    setToken(t);
    if (t) localStorage.setItem("adminToken", t);
    else localStorage.removeItem("adminToken");
  };
  return [token, save];
}

async function api(path, { token, ...opts } = {}) {
  const url = `${BASE}${path}`;
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

const s = {
  wrap: { maxWidth: 980, margin: "24px auto", padding: 16 },
  row: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  input: { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8 },
  btn: { padding: "10px 14px", borderRadius: 8, background: "#111", color: "#fff", cursor: "pointer", border: 0 },
  chip: (on) => ({ padding: "8px 12px", borderRadius: 20, border: "1px solid #ddd", background: on ? "#111" : "#fff", color: on ? "#fff" : "#111", cursor: "pointer" }),
  card: { border: "1px solid #eee", borderRadius: 12, padding: 16, background: "#fff" },
  table: { width: "100%", borderCollapse: "collapse" },
  thtd: { borderBottom: "1px solid #eee", padding: "8px 6px", textAlign: "left" },
  danger: { background: "#c62828" },
  ok: { background: "#1b5e20" },
};

export default function Admin() {
  const [token, setToken] = useToken();
  const [tab, setTab] = useState("products"); // "products" | "orders" | "login"
  const [msg, setMsg] = useState("");

  // ----- LOGIN -----
  const [loginForm, setLoginForm] = useState({ email: "artyt.sun@gmail.com", password: "" });
  const onLoginChange = (e) => setLoginForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const doLogin = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const res = await api("/api/admin-login", {
        method: "POST",
        body: JSON.stringify(loginForm),
      });
      if (res.token) {
        setToken(res.token);
        setTab("products");
      } else {
        setMsg("เข้าสู่ระบบไม่สำเร็จ");
      }
    } catch (err) {
      setMsg(err.message);
    }
  };

  const logout = () => {
    setToken("");
    setTab("login");
  };

  // ----- PRODUCTS -----
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [products, setProducts] = useState([]);
  const [pForm, setPForm] = useState({
    name: "",
    price: "",
    qty: "",
    type: "DVD", // DVD | BLU-RAY
    images: "", // กรอกเป็น URL คั่นด้วยบรรทัดใหม่
    youtube: "",
    detail: "",
  });

  const fetchProducts = async () => {
    setLoadingProducts(true);
    setMsg("");
    try {
      const res = await api("/api/products", { token });
      setProducts(res.items || []);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoadingProducts(false);
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const images = pForm.images
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 5);
      const body = {
        name: pForm.name.trim(),
        price: Number(pForm.price) || 0,
        qty: Number(pForm.qty) || 0,
        type: pForm.type,
        images,
        youtube: (pForm.youtube || "").trim(),
        detail: (pForm.detail || "").trim(),
      };
      const res = await api("/api/products", { method: "POST", token, body: JSON.stringify(body) });
      setMsg("เพิ่มสินค้าเรียบร้อย");
      setPForm({ name: "", price: "", qty: "", type: "DVD", images: "", youtube: "", detail: "" });
      await fetchProducts();
    } catch (err) {
      setMsg(err.message);
    }
  };

  const delProduct = async (id) => {
    if (!confirm("ลบสินค้าชิ้นนี้?")) return;
    setMsg("");
    try {
      await api("/api/products", { method: "DELETE", token, body: JSON.stringify({ id }) });
      setMsg("ลบสินค้าแล้ว");
      await fetchProducts();
    } catch (err) {
      setMsg(err.message);
    }
  };

  const updateQty = async (id, qty) => {
    setMsg("");
    try {
      await api("/api/products", { method: "PUT", token, body: JSON.stringify({ id, qty: Number(qty) || 0 }) });
      await fetchProducts();
    } catch (err) {
      setMsg(err.message);
    }
  };

  // ----- ORDERS -----
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    setMsg("");
    try {
      const res = await api("/api/orders", { token });
      setOrders(res.items || []);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoadingOrders(false);
    }
  };

  const toggleOrder = async (id, field, on) => {
    setMsg("");
    try {
      await api("/api/orders", { method: "PUT", token, body: JSON.stringify({ id, [field]: !!on }) });
      await fetchOrders();
    } catch (err) {
      setMsg(err.message);
    }
  };

  const delOrder = async (id) => {
    if (!confirm("ลบออเดอร์นี้?")) return;
    setMsg("");
    try {
      await api("/api/orders", { method: "DELETE", token, body: JSON.stringify({ id }) });
      await fetchOrders();
    } catch (err) {
      setMsg(err.message);
    }
  };

  // first mount: ถ้ายังไม่มี token ให้ไปแท็บ login
  useEffect(() => {
    if (!token) setTab("login");
  }, [token]);

  // auto reload list เมื่อเปลี่ยนแท็บ
  useEffect(() => {
    if (!token) return;
    if (tab === "products") fetchProducts();
    if (tab === "orders") fetchOrders();
  }, [tab, token]);

  return (
    <div style={s.wrap}>
      <header style={{ ...s.row, justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>Admin Panel</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={s.chip(tab === "products")} onClick={() => setTab("products")} disabled={!token}>
            จัดการสินค้า
          </button>
          <button style={s.chip(tab === "orders")} onClick={() => setTab("orders")} disabled={!token}>
            ออเดอร์
          </button>
          {!token ? (
            <button style={s.chip(tab === "login")} onClick={() => setTab("login")}>
              เข้าสู่ระบบ
            </button>
          ) : (
            <button style={s.chip(false)} onClick={logout}>
              ออกจากระบบ
            </button>
          )}
        </div>
      </header>

      {msg && <p style={{ color: "#c00", marginTop: 12 }}>{msg}</p>}

      {/* LOGIN */}
      {tab === "login" && (
        <section style={{ marginTop: 16 }}>
          <div style={s.card}>
            <h3 style={{ marginTop: 0 }}>เข้าสู่ระบบผู้ดูแล</h3>
            <form onSubmit={doLogin} style={{ display: "grid", gap: 10 }}>
              <input name="email" placeholder="อีเมล" value={loginForm.email} onChange={onLoginChange} style={s.input} />
              <input
                name="password"
                placeholder="รหัสผ่าน"
                type="password"
                value={loginForm.password}
                onChange={onLoginChange}
                style={s.input}
              />
              <button style={s.btn}>เข้าสู่ระบบ</button>
            </form>
            <p style={{ color: "#666", marginTop: 12 }}>
              * ใช้ค่าใน Vercel Env: <code>ADMIN_EMAIL</code> และ <code>ADMIN_PASSWORD</code>
            </p>
          </div>
        </section>
      )}

      {/* PRODUCTS */}
      {tab === "products" && token && (
        <section style={{ marginTop: 16 }}>
          <div style={s.card}>
            <h3 style={{ marginTop: 0 }}>เพิ่มสินค้า</h3>
            <form onSubmit={addProduct} style={{ display: "grid", gap: 10 }}>
              <input
                placeholder="ชื่อสินค้า"
                value={pForm.name}
                onChange={(e) => setPForm((v) => ({ ...v, name: e.target.value }))}
                style={s.input}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <input
                  placeholder="ราคา"
                  value={pForm.price}
                  onChange={(e) => setPForm((v) => ({ ...v, price: e.target.value }))}
                  style={s.input}
                />
                <input
                  placeholder="จำนวน (สต็อก)"
                  value={pForm.qty}
                  onChange={(e) => setPForm((v) => ({ ...v, qty: e.target.value }))}
                  style={s.input}
                />
                <select
                  value={pForm.type}
                  onChange={(e) => setPForm((v) => ({ ...v, type: e.target.value }))}
                  style={s.input}
                >
                  <option>DVD</option>
                  <option>BLU-RAY</option>
                </select>
              </div>
              <textarea
                placeholder={"วางรูปภาพสินค้าเป็น URL (สูงสุด 5 รูป)\nคั่นด้วยบรรทัดใหม่"}
                rows={4}
                value={pForm.images}
                onChange={(e) => setPForm((v) => ({ ...v, images: e.target.value }))}
                style={{ ...s.input, minHeight: 96 }}
              />
              <input
                placeholder="YouTube URL (ถ้ามี)"
                value={pForm.youtube}
                onChange={(e) => setPForm((v) => ({ ...v, youtube: e.target.value }))}
                style={s.input}
              />
              <textarea
                placeholder="รายละเอียดสินค้า"
                rows={3}
                value={pForm.detail}
                onChange={(e) => setPForm((v) => ({ ...v, detail: e.target.value }))}
                style={{ ...s.input, minHeight: 80 }}
              />
              <button style={s.btn}>บันทึกสินค้า</button>
            </form>
          </div>

          <div style={{ ...s.card, marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>รายการสินค้า</h3>
            {loadingProducts ? (
              <p>กำลังโหลด…</p>
            ) : products.length === 0 ? (
              <p>ยังไม่มีสินค้า</p>
            ) : (
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.thtd}>ID</th>
                    <th style={s.thtd}>ชื่อ</th>
                    <th style={s.thtd}>ประเภท</th>
                    <th style={s.thtd}>ราคา</th>
                    <th style={s.thtd}>คงเหลือ</th>
                    <th style={s.thtd}></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td style={s.thtd}>{p.id || "-"}</td>
                      <td style={s.thtd}>{p.name}</td>
                      <td style={s.thtd}>{p.type}</td>
                      <td style={s.thtd}>{p.price}</td>
                      <td style={s.thtd}>
                        <input
                          defaultValue={p.qty ?? 0}
                          onBlur={(e) => updateQty(p.id, e.target.value)}
                          style={{ ...s.input, width: 90, padding: "6px 8px" }}
                        />
                      </td>
                      <td style={s.thtd}>
                        <button style={{ ...s.btn, ...s.danger }} onClick={() => delProduct(p.id)}>
                          ลบ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {/* ORDERS */}
      {tab === "orders" && token && (
        <section style={{ marginTop: 16 }}>
          <div style={s.card}>
            <h3 style={{ marginTop: 0 }}>ออเดอร์</h3>
            {loadingOrders ? (
              <p>กำลังโหลด…</p>
            ) : orders.length === 0 ? (
              <p>ยังไม่มีออเดอร์</p>
            ) : (
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.thtd}>เลขที่</th>
                    <th style={s.thtd}>ลูกค้า</th>
                    <th style={s.thtd}>ยอดรวม</th>
                    <th style={s.thtd}>ชำระแล้ว</th>
                    <th style={s.thtd}>จัดส่งแล้ว</th>
                    <th style={s.thtd}></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td style={s.thtd}>{o.id}</td>
                      <td style={s.thtd}>{o.name || o.customer || "-"}</td>
                      <td style={s.thtd}>{o.total ?? 0}</td>
                      <td style={s.thtd}>
                        <input
                          type="checkbox"
                          defaultChecked={!!o.paid}
                          onChange={(e) => toggleOrder(o.id, "paid", e.target.checked)}
                        />
                      </td>
                      <td style={s.thtd}>
                        <input
                          type="checkbox"
                          defaultChecked={!!o.shipped}
                          onChange={(e) => toggleOrder(o.id, "shipped", e.target.checked)}
                        />
                      </td>
                      <td style={s.thtd}>
                        <button style={{ ...s.btn, ...s.danger }} onClick={() => delOrder(o.id)}>
                          ลบ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

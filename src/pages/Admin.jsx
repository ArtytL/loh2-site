import { useEffect, useMemo, useState } from "react";

const BASE = import.meta.env.VITE_API_URL || "";

function getToken() {
  return localStorage.getItem("adminToken") || "";
}
function setToken(t) {
  localStorage.setItem("adminToken", t);
}
function clearToken() {
  localStorage.removeItem("adminToken");
}

async function api(path, { method = "GET", json, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) headers["Authorization"] = `Bearer ${getToken()}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: json ? JSON.stringify(json) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    const e = data?.error || res.statusText;
    throw new Error(e || "Request failed");
  }
  return data;
}

export default function Admin() {
  const [tab, setTab] = useState("products");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const hasToken = useMemo(() => !!getToken(), []);
  useEffect(() => {
    if (!getToken()) setTab("login");
  }, []);

  async function login(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const form = new FormData(e.currentTarget);
      const email = form.get("email");
      const password = form.get("password");
      const r = await api("/api/admin-login", {
        method: "POST",
        json: { email, password },
      });
      setToken(r.token);
      setMsg("ล็อกอินสำเร็จ ✅");
      setTab("products");
    } catch (err) {
      setMsg("ล็อกอินไม่สำเร็จ: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  const [items, setItems] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [pForm, setPForm] = useState({
    name: "",
    type: "DVD",
    price: "",
    qty: "",
    images: "",
    youtube: "",
    detail: "",
  });

  async function loadProducts() {
    setLoadingProducts(true);
    try {
      const r = await api("/api/products");
      setItems(r.items || []);
    } catch (e) {
      setMsg("โหลดสินค้าไม่สำเร็จ: " + e.message);
    } finally {
      setLoadingProducts(false);
    }
  }
  useEffect(() => {
    if (getToken()) loadProducts();
  }, [tab]);

  async function addProduct(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const imgs = (pForm.images || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = {
        name: pForm.name.trim(),
        type: pForm.type,
        price: Number(pForm.price || 0),
        qty: Number(pForm.qty || 0),
        images: imgs.slice(0, 5),
        youtube: pForm.youtube?.trim(),
        detail: pForm.detail?.trim(),
      };
      await api("/api/products", { method: "POST", json: payload, auth: true });
      setMsg("เพิ่มสินค้าเรียบร้อย ✅");
      setPForm({
        name: "",
        type: "DVD",
        price: "",
        qty: "",
        images: "",
        youtube: "",
        detail: "",
      });
      await loadProducts();
    } catch (e) {
      if (String(e).includes("Unauthorized")) setTab("login");
      setMsg("เพิ่มสินค้าไม่สำเร็จ: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateQty(id, delta) {
    setBusy(true);
    setMsg("");
    try {
      const item = items.find((x) => x.id === id);
      if (!item) throw new Error("ไม่พบสินค้า");
      const qty = Math.max(0, Number(item.qty || 0) + delta);
      await api(`/api/products?id=${encodeURIComponent(id)}`, {
        method: "PUT",
        auth: true,
        json: { qty },
      });
      await loadProducts();
    } catch (e) {
      if (String(e).includes("Unauthorized")) setTab("login");
      setMsg("แก้จำนวนไม่สำเร็จ: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeProduct(id) {
    if (!confirm(`ลบสินค้า ${id}?`)) return;
    setBusy(true);
    setMsg("");
    try {
      await api(`/api/products?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        auth: true,
      });
      await loadProducts();
      setMsg("ลบสินค้าแล้ว ✅");
    } catch (e) {
      if (String(e).includes("Unauthorized")) setTab("login");
      setMsg("ลบสินค้าไม่สำเร็จ: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  async function loadOrders() {
    setLoadingOrders(true);
    try {
      const r = await api("/api/orders");
      setOrders(r.items || []);
    } catch (e) {
      setMsg("โหลดออเดอร์ไม่สำเร็จ: " + e.message);
    } finally {
      setLoadingOrders(false);
    }
  }
  useEffect(() => {
    if (tab === "orders" && getToken()) loadOrders();
  }, [tab]);

  async function setOrderFlag(id, patch) {
    setBusy(true);
    setMsg("");
    try {
      await api(`/api/orders?id=${encodeURIComponent(id)}`, {
        method: "PUT",
        auth: true,
        json: patch,
      });
      await loadOrders();
    } catch (e) {
      if (String(e).includes("Unauthorized")) setTab("login");
      setMsg("อัปเดตออเดอร์ไม่สำเร็จ: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeOrder(id) {
    if (!confirm(`ลบออเดอร์ ${id}?`)) return;
    setBusy(true);
    setMsg("");
    try {
      await api(`/api/orders?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        auth: true,
      });
      await loadOrders();
    } catch (e) {
      if (String(e).includes("Unauthorized")) setTab("login");
      setMsg("ลบออเดอร์ไม่สำเร็จ: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  const s = {
    wrap: { maxWidth: 980, margin: "24px auto", padding: 16 },
    tabs: { display: "flex", gap: 8, marginBottom: 16 },
    tab:
      (t) =>
      ({
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid #ddd",
        background: tab === t ? "#111" : "#fff",
        color: tab === t ? "#fff" : "#111",
        cursor: "pointer",
      }),
    row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
    input: {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #ddd",
      borderRadius: 8,
    },
    btn: {
      padding: "10px 14px",
      borderRadius: 8,
      background: "#111",
      color: "#fff",
      border: 0,
      cursor: "pointer",
    },
    danger: {
      padding: "8px 10px",
      borderRadius: 8,
      background: "#c00",
      color: "#fff",
      border: 0,
      cursor: "pointer",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: 12,
    },
    thtd: { borderBottom: "1px solid #eee", padding: "8px 6px", textAlign: "left" },
    badge: (ok) => ({
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 999,
      background: ok ? "#16a34a" : "#e5e7eb",
      color: ok ? "#fff" : "#111",
      marginLeft: 6,
      fontSize: 12,
    }),
    notice: { marginTop: 10, color: "#d00" },
    topbar: { display: "flex", justifyContent: "space-between", marginBottom: 12 },
  };

  return (
    <div style={s.wrap}>
      <div style={s.topbar}>
        <div>
          <strong>Admin</strong>{" "}
          {hasToken || getToken() ? (
            <span style={s.badge(true)}>online</span>
          ) : (
            <span style={s.badge(false)}>offline</span>
          )}
        </div>
        {(hasToken || getToken()) && (
          <button
            style={s.btn}
            onClick={() => {
              clearToken();
              setTab("login");
            }}
          >
            ออกจากระบบ
          </button>
        )}
      </div>

      <div style={s.tabs}>
        <button style={s.tab("products")} onClick={() => setTab("products")}>
          จัดการสินค้า
        </button>
        <button style={s.tab("orders")} onClick={() => setTab("orders")}>
          ออเดอร์
        </button>
        <button style={s.tab("login")} onClick={() => setTab("login")}>
          ล็อกอิน
        </button>
      </div>

      {msg && <div style={s.notice}>{msg}</div>}
      {busy && <p>กำลังทำงาน...</p>}

      {tab === "login" && (
        <form onSubmit={login} style={{ maxWidth: 420 }}>
          <div style={{ marginBottom: 8 }}>
            <label>อีเมล</label>
            <input name="email" required placeholder="admin email" style={s.input} type="email" />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>รหัสผ่าน</label>
            <input
              name="password"
              required
              placeholder="password"
              style={s.input}
              type="password"
              autoComplete="current-password"
            />
          </div>
          <button style={s.btn} disabled={busy}>
            {busy ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      )}

      {tab === "products" && (
        <>
          <h3>เพิ่มสินค้าใหม่</h3>
          <form onSubmit={addProduct} style={{ marginBottom: 20 }}>
            <div style={s.row}>
              <input
                style={s.input}
                placeholder="ชื่อสินค้า"
                value={pForm.name}
                onChange={(e) => setPForm({ ...pForm, name: e.target.value })}
                required
              />
              <select
                style={s.input}
                value={pForm.type}
                onChange={(e) => setPForm({ ...pForm, type: e.target.value })}
              >
                <option>DVD</option>
                <option>BLURAY</option>
              </select>
            </div>
            <div style={s.row}>
              <input
                style={s.input}
                type="number"
                placeholder="ราคา"
                value={pForm.price}
                onChange={(e) => setPForm({ ...pForm, price: e.target.value })}
                required
              />
              <input
                style={s.input}
                type="number"
                placeholder="จำนวน (qty)"
                value={pForm.qty}
                onChange={(e) => setPForm({ ...pForm, qty: e.target.value })}
                required
              />
            </div>
            <textarea
              style={{ ...s.input, minHeight: 90, marginTop: 8 }}
              placeholder={"ใส่ลิงก์รูปภาพ 4–5 รูป (1 บรรทัด/รูป)\nhttps://...\nhttps://...\n..."}
              value={pForm.images}
              onChange={(e) => setPForm({ ...pForm, images: e.target.value })}
            />
            <input
              style={{ ...s.input, marginTop: 8 }}
              placeholder="YouTube URL"
              value={pForm.youtube}
              onChange={(e) => setPForm({ ...pForm, youtube: e.target.value })}
            />
            <textarea
              style={{ ...s.input, minHeight: 80, marginTop: 8 }}
              placeholder="รายละเอียดสินค้า"
              value={pForm.detail}
              onChange={(e) => setPForm({ ...pForm, detail: e.target.value })}
            />
            <div style={{ marginTop: 8 }}>
              <button style={s.btn} disabled={busy}>
                {busy ? "กำลังบันทึก..." : "เพิ่มสินค้า"}
              </button>
            </div>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ margin: 0 }}>รายการสินค้า</h3>
            <button style={s.btn} onClick={loadProducts} disabled={loadingProducts}>
              รีเฟรช
            </button>
          </div>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.thtd}>ID</th>
                <th style={s.thtd}>ชื่อ</th>
                <th style={s.thtd}>ชนิด</th>
                <th style={s.thtd}>ราคา</th>
                <th style={s.thtd}>จำนวน</th>
                <th style={s.thtd}>สถานะ</th>
                <th style={s.thtd}></th>
              </tr>
            </thead>
            <tbody>
              {(items || []).map((p) => (
                <tr key={p.id}>
                  <td style={s.thtd}>{p.id}</td>
                  <td style={s.thtd}>{p.name}</td>
                  <td style={s.thtd}>{p.type || "-"}</td>
                  <td style={s.thtd}>{Number(p.price || 0).toLocaleString()}</td>
                  <td style={s.thtd}>
                    {p.qty}
                    &nbsp;
                    <button onClick={() => updateQty(p.id, +1)} style={s.btn}>
                      +1
                    </button>{" "}
                    <button onClick={() => updateQty(p.id, -1)} style={s.btn}>
                      -1
                    </button>
                  </td>
                  <td style={s.thtd}>
                    {Number(p.qty) > 0 ? (
                      <span style={s.badge(true)}>ขายได้</span>
                    ) : (
                      <span style={s.badge(false)}>Sold out</span>
                    )}
                  </td>
                  <td style={s.thtd}>
                    <button style={s.danger} onClick={() => removeProduct(p.id)}>
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {tab === "orders" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ margin: 0 }}>ออเดอร์</h3>
            <button style={s.btn} onClick={loadOrders} disabled={loadingOrders}>
              รีเฟรช
            </button>
          </div>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.thtd}>เลขที่</th>
                <th style={s.thtd}>ลูกค้า</th>
                <th style={s.thtd}>รวม</th>
                <th style={s.thtd}>ชำระ</th>
                <th style={s.thtd}>จัดส่ง</th>
                <th style={s.thtd}></th>
              </tr>
            </thead>
            <tbody>
              {(orders || []).map((o) => (
                <tr key={o.id}>
                  <td style={s.thtd}>{o.id}</td>
                  <td style={s.thtd}>
                    {o.name}
                    <div style={{ color: "#666", fontSize: 12 }}>
                      {o.email} · {o.phone}
                    </div>
                  </td>
                  <td style={s.thtd}>
                    {Number(o.total || 0).toLocaleString()} บาท
                  </td>
                  <td style={s.thtd}>
                    <label>
                      <input
                        type="checkbox"
                        checked={!!o.paid}
                        onChange={(e) => setOrderFlag(o.id, { paid: e.target.checked })}
                      />{" "}
                      {o.paid ? "ชำระแล้ว" : "ยัง"}
                    </label>
                  </td>
                  <td style={s.thtd}>
                    <label>
                      <input
                        type="checkbox"
                        checked={!!o.shipped}
                        onChange={(e) => setOrderFlag(o.id, { shipped: e.target.checked })}
                      />{" "}
                      {o.shipped ? "จัดส่งแล้ว" : "ยัง"}
                    </label>
                  </td>
                  <td style={s.thtd}>
                    <button style={s.danger} onClick={() => removeOrder(o.id)}>
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

// src/pages/Admin.jsx
import { useEffect, useMemo, useState } from "react";

const API = "/api";

// ---- utils -------------------------------------------------
function toArray(x) {
  if (!x) return [];
  if (Array.isArray(x)) return x;
  if (typeof x === "string") return x.split(",").map(s => s.trim()).filter(Boolean);
  return [];
}

// ---- main component ----------------------------------------
export default function Admin() {
  const [tab, setTab] = useState("products");           // "products" | "orders"
  const [token, setToken] = useState(localStorage.getItem("admintoken") || "");
  const [msg, setMsg] = useState("");

  // products
  const empty = {
    id: "", title: "", type: "DVD", price: 0, qty: 1,
    cover: "", images: [], youtube: "", detail: ""
  };
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const isEditing = useMemo(() => !!form.id, [form.id]);

  // orders (โชว์ไว้ก่อน ยังไม่เชื่อมอีเมล)
  const [orders, setOrders] = useState([]);

  // ---- login ------------------------------------------------
  async function login(email, password) {
    setMsg("");
    try {
      const res = await fetch(`${API}/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("admintoken", data.token);
      setToken(data.token);
      setMsg("เข้าสู่ระบบสำเร็จ");
      await loadProducts();
    } catch (e) {
      setMsg(String(e));
    }
  }

  function logout() {
    localStorage.removeItem("admintoken");
    setToken("");
    setItems([]);
    setMsg("ออกจากระบบแล้ว");
  }

  // ---- products CRUD ---------------------------------------
  async function loadProducts() {
    try {
      const res = await fetch(`${API}/products`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "โหลดสินค้าล้มเหลว");
      // รองรับทั้ง { value: ... } หรือ array ตรงๆ
      const arr = Array.isArray(data.items)
        ? data.items
        : Array.isArray(data.items?.value)
        ? data.items.value
        : Array.isArray(data.value)
        ? data.value
        : [];
      setItems(arr);
    } catch (e) {
      setMsg(String(e));
    }
  }

  async function saveProduct() {
    if (!token) return setMsg("ต้องเข้าสู่ระบบก่อน");
    try {
      const payload = {
        ...form,
        price: Number(form.price) || 0,
        qty: Number(form.qty) || 0,
        images: toArray(form.images),
      };
      const res = await fetch(`${API}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "บันทึกล้มเหลว");
      setMsg("บันทึกสำเร็จ");
      setForm(empty);
      await loadProducts();
    } catch (e) {
      setMsg(String(e));
    }
  }

  async function removeProduct(id) {
    if (!token) return setMsg("ต้องเข้าสู่ระบบก่อน");
    if (!confirm("ลบสินค้านี้?")) return;
    try {
      const res = await fetch(`${API}/products?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "ลบไม่สำเร็จ");
      setMsg("ลบสำเร็จ");
      if (form.id === id) setForm(empty);
      await loadProducts();
    } catch (e) {
      setMsg(String(e));
    }
  }

  // ---- effects ---------------------------------------------
  useEffect(() => {
    if (token) loadProducts();
  }, [token]);

  // ---- login form local state -------------------------------
  const [loginEmail, setLoginEmail] = useState("artyt.sun@gmail.com");
  const [loginPassword, setLoginPassword] = useState("");

  // ---- UI ---------------------------------------------------
  return (
    <div style={{ maxWidth: 980, margin: "24px auto", padding: 16 }}>
      <h1>Admin Panel</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => setTab("products")}>จัดการสินค้า</button>
        <button onClick={() => setTab("orders")}>ออเดอร์</button>
        <div style={{ flex: 1 }} />
        {token ? (
          <button onClick={logout}>ออกจากระบบ</button>
        ) : null}
      </div>

      {!!msg && (
        <div style={{ background: "#fee", border: "1px solid #fbb", padding: 8, marginBottom: 12 }}>
          {msg}
        </div>
      )}

      {!token ? (
        <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
          <h3>เข้าสู่ระบบผู้ดูแล</h3>
          <input
            placeholder="อีเมล"
            value={loginEmail}
            onChange={e => setLoginEmail(e.target.value)}
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
          />
          <input
            placeholder="รหัสผ่าน"
            type="password"
            value={loginPassword}
            onChange={e => setLoginPassword(e.target.value)}
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
          />
          <button onClick={() => login(loginEmail, loginPassword)} style={{ width: "100%", padding: 10 }}>
            เข้าสู่ระบบ
          </button>
          <p style={{ color: "#666" }}>
            * ต้องตั้งค่า ENV บน Vercel: <code>ADMIN_EMAIL</code>, <code>ADMIN_PASSWORD</code>, <code>ADMIN_JWT_SECRET</code>
          </p>
        </div>
      ) : tab === "products" ? (
        <>
          {/* FORM */}
          <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <h3>{isEditing ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div>
                <div>รหัส (auto ตอนเพิ่ม)</div>
                <input value={form.id} readOnly style={{ width: "100%", padding: 8 }} />
              </div>
              <div>
                <div>ชื่อเรื่อง</div>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  style={{ width: "100%", padding: 8 }}
                />
              </div>
              <div>
                <div>ประเภท</div>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  style={{ width: "100%", padding: 8 }}
                >
                  <option>DVD</option>
                  <option>Blu-ray</option>
                </select>
              </div>

              <div>
                <div>ราคา</div>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  style={{ width: "100%", padding: 8 }}
                />
              </div>
              <div>
                <div>จำนวน</div>
                <input
                  type="number"
                  value={form.qty}
                  onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
                  style={{ width: "100%", padding: 8 }}
                />
              </div>
              <div>
                <div>ปก (URL)</div>
                <input
                  value={form.cover}
                  onChange={e => setForm(f => ({ ...f, cover: e.target.value }))}
                  style={{ width: "100%", padding: 8 }}
                />
              </div>

              <div style={{ gridColumn: "1 / span 2" }}>
                <div>รูปเพิ่มเติม (คั่นด้วย , )</div>
                <input
                  value={Array.isArray(form.images) ? form.images.join(", ") : form.images}
                  onChange={e => setForm(f => ({ ...f, images: e.target.value }))}
                  style={{ width: "100%", padding: 8 }}
                />
              </div>
              <div>
                <div>YouTube URL (ถ้ามี)</div>
                <input
                  value={form.youtube}
                  onChange={e => setForm(f => ({ ...f, youtube: e.target.value }))}
                  style={{ width: "100%", padding: 8 }}
                />
              </div>

              <div style={{ gridColumn: "1 / span 3" }}>
                <div>รายละเอียด</div>
                <textarea
                  rows={3}
                  value={form.detail}
                  onChange={e => setForm(f => ({ ...f, detail: e.target.value }))}
                  style={{ width: "100%", padding: 8 }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={saveProduct} style={{ flex: 1, padding: 10 }}>
                {isEditing ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}
              </button>
              {isEditing && (
                <button onClick={() => setForm(empty)} style={{ padding: 10 }}>
                  เริ่มใหม่
                </button>
              )}
            </div>
          </div>

          {/* TABLE */}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f4f4f4" }}>
                <th style={th}>รหัส</th>
                <th style={th}>ชื่อ</th>
                <th style={th}>ประเภท</th>
                <th style={th}>จำนวน</th>
                <th style={th}>ราคา</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={td}>{it.id}</td>
                  <td style={{ ...td, cursor: "pointer", color: "#06c" }}
                      title="แก้ไขรายการนี้"
                      onClick={() => setForm({
                        id: it.id, title: it.title || "", type: it.type || "DVD",
                        price: it.price || 0, qty: it.qty || 0,
                        cover: it.cover || "", images: it.images || [],
                        youtube: it.youtube || "", detail: it.detail || ""
                      })}
                  >
                    {it.title || "(ไม่มีชื่อ)"}
                  </td>
                  <td style={td}>{it.type}</td>
                  <td style={td}>{it.qty}</td>
                  <td style={td}>{it.price}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <button onClick={() => removeProduct(it.id)}>ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <div>ยังไม่เชื่อมออเดอร์ในรอบนี้</div>
      )}
    </div>
  );
}

const th = { textAlign: "left", padding: "8px 10px" };
const td = { padding: "8px 10px", verticalAlign: "top" };

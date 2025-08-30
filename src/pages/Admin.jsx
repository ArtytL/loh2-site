// src/pages/Admin.jsx
import { useEffect, useMemo, useState } from "react";

const API_BASE = "/api"; // ใช้โดเมนเดียวกัน ชัวร์สุด

// แต่งเลข/ราคา
const fmt = (n) =>
  (Number(n) || 0).toLocaleString("th-TH", { maximumFractionDigits: 0 }) + " บาท";

// ปุ่มง่าย ๆ
function Button({ children, onClick, style, disabled, type = "button" }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: "10px 16px",
        borderRadius: 8,
        border: "1px solid #ddd",
        background: "#111",
        color: "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ช่องกรอก
function Input({ label, ...props }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <div style={{ fontSize: 13, marginBottom: 6, color: "#555" }}>{label}</div>
      <input
        {...props}
        style={{
          width: "100%",
          padding: "10px 12px",
          border: "1px solid #ddd",
          borderRadius: 8,
          outline: "none",
        }}
      />
    </label>
  );
}

function Textarea({ label, ...props }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <div style={{ fontSize: 13, marginBottom: 6, color: "#555" }}>{label}</div>
      <textarea
        {...props}
        style={{
          width: "100%",
          minHeight: 100,
          padding: "10px 12px",
          border: "1px solid #ddd",
          borderRadius: 8,
          outline: "none",
          resize: "vertical",
        }}
      />
    </label>
  );
}

// ---------- จัดการสินค้า ----------
function ProductsPanel({ headers }) {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // ฟอร์มเพิ่มสินค้า
  const [form, setForm] = useState({
    name: "",
    type: "DVD", // DVD | Blu-ray
    price: "",
    qty: "",
    images: ["", "", "", "", ""], // สูงสุด 5
    detail: "",
    youtube: "",
  });

  const load = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/products`, { headers });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setItems(data.items || []);
    } catch (e) {
      setMsg(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeImage = (idx, value) => {
    setForm((f) => {
      const next = [...f.images];
      next[idx] = value;
      return { ...f, images: next };
    });
  };

  const onAdd = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        price: Number(form.price || 0),
        qty: Number(form.qty || 0),
        images: form.images.map((s) => s.trim()).filter(Boolean).slice(0, 5),
        detail: form.detail.trim(),
        youtube: form.youtube.trim(),
      };
      if (!payload.name) throw new Error("กรุณาใส่ชื่อสินค้า");
      const res = await fetch(`${API_BASE}/products`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setForm({
        name: "",
        type: "DVD",
        price: "",
        qty: "",
        images: ["", "", "", "", ""],
        detail: "",
        youtube: "",
      });
      await load();
      setMsg("เพิ่มสินค้าเรียบร้อย");
    } catch (e) {
      setMsg(String(e));
    }
  };

  const updateQty = async (id, qty) => {
    setMsg("");
    try {
      const q = Number(qty || 0);
      const res = await fetch(`${API_BASE}/products`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ id, changes: { qty: q } }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      await load();
    } catch (e) {
      setMsg(String(e));
    }
  };

  const onDelete = async (id) => {
    if (!confirm("ลบสินค้านี้?")) return;
    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: "DELETE",
        headers,
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      await load();
    } catch (e) {
      setMsg(String(e));
    }
  };

  return (
    <div>
      <h3 style={{ margin: "16px 0 10px" }}>จัดการสินค้า</h3>
      {msg && <p style={{ color: "#c00" }}>{msg}</p>}

      {/* ฟอร์มเพิ่มสินค้า */}
      <form
        onSubmit={onAdd}
        style={{
          border: "1px solid #eee",
          padding: 16,
          borderRadius: 12,
          marginBottom: 24,
          background: "#fafafa",
        }}
      >
        <h4 style={{ marginTop: 0 }}>เพิ่มสินค้าใหม่</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 180px", gap: 12 }}>
          <Input
            label="ชื่อสินค้า"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <label style={{ display: "block", marginBottom: 12 }}>
            <div style={{ fontSize: 13, marginBottom: 6, color: "#555" }}>หมวด</div>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: 8,
              }}
            >
              <option>DVD</option>
              <option>Blu-ray</option>
            </select>
          </label>
          <Input
            label="ราคา (บาท)"
            type="number"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            required
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 12 }}>
          <Input
            label="จำนวน (ชิ้น)"
            type="number"
            value={form.qty}
            onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
            required
          />
          <Input
            label="YouTube URL (ถ้ามี)"
            value={form.youtube}
            onChange={(e) => setForm((f) => ({ ...f, youtube: e.target.value }))}
            placeholder="https://www.youtube.com/watch?v=xxxx"
          />
        </div>

        <Textarea
          label="รายละเอียด"
          value={form.detail}
          onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))}
        />

        <div style={{ marginTop: 6, marginBottom: 8, color: "#555" }}>
          รูปภาพ (วางลิงก์ได้สูงสุด 5 รูป) — รูปแรกจะเป็นภาพปก
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {form.images.map((val, i) => (
            <Input
              key={i}
              label={`รูปที่ ${i + 1}`}
              value={val}
              onChange={(e) => onChangeImage(i, e.target.value)}
              placeholder="https://..."
            />
          ))}
        </div>

        <div style={{ marginTop: 12 }}>
          <Button type="submit">เพิ่มสินค้า</Button>
        </div>
      </form>

      {/* ตารางสินค้า */}
      <div style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr 120px 120px 160px",
            gap: 8,
            fontWeight: 600,
            padding: "10px 12px",
            background: "#f6f6f6",
          }}
        >
          <div>รหัส</div>
          <div>ชื่อ</div>
          <div>ราคา</div>
          <div>จำนวน</div>
          <div>จัดการ</div>
        </div>

        {loading && <div style={{ padding: 16 }}>กำลังโหลด…</div>}

        {!loading &&
          items.map((it) => (
            <div
              key={it.id}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr 120px 120px 160px",
                gap: 8,
                padding: "10px 12px",
                borderTop: "1px solid #eee",
                alignItems: "center",
              }}
            >
              <div>{it.id}</div>
              <div>
                <div style={{ fontWeight: 600 }}>{it.name}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{it.type}</div>
              </div>
              <div>{fmt(it.price)}</div>
              <div>
                <input
                  type="number"
                  defaultValue={it.qty}
                  min={0}
                  onBlur={(e) => updateQty(it.id, e.target.value)}
                  style={{
                    width: 90,
                    padding: "6px 8px",
                    border: "1px solid #ddd",
                    borderRadius: 6,
                  }}
                />
                {Number(it.qty) === 0 && (
                  <span style={{ marginLeft: 8, color: "#c00", fontSize: 12 }}>Sold out</span>
                )}
              </div>
              <div>
                <Button
                  style={{ background: "#b00020" }}
                  onClick={() => onDelete(it.id)}
                >
                  ลบ
                </Button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

// ---------- ออเดอร์ ----------
function OrdersPanel({ headers }) {
  const [orders, setOrders] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(null); // order to show

  const load = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/orders`, { headers });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setOrders(data.items || []);
    } catch (e) {
      setMsg(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateOrder = async (id, changes) => {
    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ id, changes }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      await load();
    } catch (e) {
      setMsg(String(e));
    }
  };

  const removeOrder = async (id) => {
    if (!confirm("ลบออเดอร์นี้?")) return;
    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: "DELETE",
        headers,
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      await load();
    } catch (e) {
      setMsg(String(e));
    }
  };

  return (
    <div>
      <h3 style={{ margin: "16px 0 10px" }}>ออเดอร์</h3>
      {msg && <p style={{ color: "#c00" }}>{msg}</p>}

      <div style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr 220px 160px 120px",
            gap: 8,
            fontWeight: 600,
            padding: "10px 12px",
            background: "#f6f6f6",
          }}
        >
          <div>เลขที่</div>
          <div>ชื่อลูกค้า</div>
          <div>สถานะ</div>
          <div>ยอดรวม</div>
          <div>จัดการ</div>
        </div>

        {loading && <div style={{ padding: 16 }}>กำลังโหลด…</div>}

        {!loading &&
          orders.map((o) => (
            <div
              key={o.id}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr 220px 160px 120px",
                gap: 8,
                padding: "10px 12px",
                borderTop: "1px solid #eee",
                alignItems: "center",
              }}
            >
              <div>{o.id}</div>
              <div>
                <button
                  onClick={() => setShow(o)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#06c",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {o.name || "-"}
                </button>
                <div style={{ fontSize: 12, color: "#666" }}>{o.phone || ""}</div>
              </div>
              <div style={{ fontSize: 14 }}>
                <label style={{ marginRight: 12 }}>
                  <input
                    type="checkbox"
                    checked={!!o.paid}
                    onChange={(e) => updateOrder(o.id, { paid: e.target.checked })}
                  />{" "}
                  ชำระแล้ว
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={!!o.shipped}
                    onChange={(e) => updateOrder(o.id, { shipped: e.target.checked })}
                  />{" "}
                  จัดส่งแล้ว
                </label>
              </div>
              <div>{fmt(o.total || 0)}</div>
              <div>
                <Button style={{ background: "#b00020" }} onClick={() => removeOrder(o.id)}>
                  ลบ
                </Button>
              </div>
            </div>
          ))}
      </div>

      {/* Modal รายละเอียดออเดอร์ */}
      {show && (
        <div
          onClick={() => setShow(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(720px, 96vw)",
              background: "#fff",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ margin: "6px 0 12px" }}>รายละเอียดออเดอร์ {show.id}</h3>
              <button
                onClick={() => setShow(null)}
                style={{ border: "none", background: "transparent", fontSize: 24, cursor: "pointer" }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>ชื่อ: {show.name}</div>
              <div>โทร: {show.phone}</div>
              <div>อีเมล: {show.email}</div>
              <div>ที่อยู่: {show.address}</div>
              <div>หมายเหตุ: {show.note}</div>
            </div>

            <div style={{ marginTop: 12, borderTop: "1px solid #eee", paddingTop: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>รายการสินค้า</div>
              {(show.items || []).map((it) => (
                <div
                  key={it.id + "-" + it.qty}
                  style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px", gap: 8 }}
                >
                  <div>{it.name}</div>
                  <div>
                    {it.qty} × {fmt(it.price)}
                  </div>
                  <div style={{ textAlign: "right" }}>{fmt((it.qty || 0) * (it.price || 0))}</div>
                </div>
              ))}
              <div style={{ textAlign: "right", marginTop: 8, fontWeight: 700 }}>
                รวมทั้งสิ้น: {fmt(show.total || 0)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- หน้า Admin หลัก ----------
export default function Admin() {
  const [tab, setTab] = useState("products"); // products | orders | login
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem("admin_token") || "");

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  // ฟอร์มล็อกอิน
  const [form, setForm] = useState({ email: "", password: "" });

  const onLogin = async (e) => {
    e.preventDefault();
    setMsg("");
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok || !data.token) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      localStorage.setItem("admin_token", data.token);
      setToken(data.token);
      setForm({ email: "", password: "" });
      setMsg("เข้าสู่ระบบสำเร็จ");
      setTab("products");
    } catch (e) {
      setMsg(String(e));
    } finally {
      setSending(false);
    }
  };

  const onLogout = () => {
    localStorage.removeItem("admin_token");
    setToken("");
    setTab("login");
  };

  // ถ้ายังไม่มี token → หน้า login
  const needLogin = !token;

  return (
    <section style={{ maxWidth: 980, margin: "24px auto", padding: "0 16px" }}>
      <h2 style={{ margin: "8px 0 16px" }}>Admin Panel</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {!needLogin && (
          <>
            <Button
              onClick={() => setTab("products")}
              style={{ background: tab === "products" ? "#111" : "#333" }}
            >
              จัดการสินค้า
            </Button>
            <Button
              onClick={() => setTab("orders")}
              style={{ background: tab === "orders" ? "#111" : "#333" }}
            >
              ออเดอร์
            </Button>
          </>
        )}
        <Button
          onClick={() => (needLogin ? setTab("login") : onLogout())}
          style={{ marginLeft: "auto", background: needLogin ? "#333" : "#b00020" }}
        >
          {needLogin ? "เข้าสู่ระบบ" : "ออกจากระบบ"}
        </Button>
      </div>

      {msg && (
        <div
          style={{
            marginBottom: 12,
            padding: "8px 12px",
            borderRadius: 8,
            background: "#fff4f4",
            color: "#b00020",
            border: "1px solid #f2c0c0",
          }}
        >
          {msg}
        </div>
      )}

      {needLogin || tab === "login" ? (
        <form
          onSubmit={onLogin}
          style={{
            border: "1px solid #eee",
            padding: 16,
            borderRadius: 12,
            background: "#fafafa",
            maxWidth: 560,
          }}
        >
          <h3 style={{ marginTop: 0 }}>เข้าสู่ระบบผู้ดูแล</h3>
          <Input
            label="อีเมล"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
          <Input
            label="รหัสผ่าน"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
          />
          <Button type="submit" disabled={sending}>
            {sending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </Button>
          <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
            * ต้องกำหนดตัวแปรแวดล้อมใน Vercel: <b>ADMIN_EMAIL</b>, <b>ADMIN_PASSWORD</b>
          </div>
        </form>
      ) : tab === "products" ? (
        <ProductsPanel headers={headers} />
      ) : (
        <OrdersPanel headers={headers} />
      )}
    </section>
  );
}

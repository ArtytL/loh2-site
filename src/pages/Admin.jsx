// src/pages/Admin.jsx
import { useEffect, useMemo, useState, useTransition } from "react";

/** ---------- utils ---------- */
const api = async (path, { token, method = "GET", body } = {}) => {
  const headers = { };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  // บางที error ของฟังก์ชันจะส่งมาเป็น text ไม่ใช่ json -> กัน parse พัง
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: text || "Invalid response" };
  }
};

const INIT_FORM = {
  title: "",
  type: "DVD",      // DVD | Blu-ray
  qty: 1,
  price: "",
  youtube: "",
  detail: "",
  imgs: ["", "", "", "", ""], // รับลิงก์ 5 รูป (เอาอันแรกเป็น cover)
};

export default function Admin() {
  const [tab, setTab] = useState("products");
  const [token, setToken] = useState(() => localStorage.getItem("adm_jwt") || "");
  const [email, setEmail] = useState("artyt.sun@gmail.com");
  const [password, setPassword] = useState("");
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState(INIT_FORM);
  const [sending, setSending] = useState(false);
  const [isPending, startTransition] = useTransition();

  /** ---------- login ---------- */
  const onLogin = async (e) => {
    e.preventDefault();
    setMsg("");
    setSending(true);
    try {
      const out = await api("/api/admin-login", {
        method: "POST",
        body: { email, password },
      });
      if (!out?.ok || !out?.token) throw new Error(out?.error || "Login failed");
      localStorage.setItem("adm_jwt", out.token);
      setToken(out.token);
      setMsg("เข้าสู่ระบบสำเร็จ ✅");
    } catch (err) {
      setMsg(String(err));
    } finally {
      setSending(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("adm_jwt");
    setToken("");
    setItems([]);
    setMsg("");
  };

  /** ---------- load products ---------- */
  const load = async () => {
    if (!token) return;
    setMsg("");
    const out = await api("/api/products", { token });
    // กันกรณี API เดิมส่ง { value: '...json...' }
    let list = [];
    if (out?.ok) {
      if (Array.isArray(out.items)) list = out.items;
      else if (out.value) {
        try { list = JSON.parse(out.value); } catch {}
      }
    }
    setItems(list || []);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [token]);

  /** ---------- add product (non-blocking UI) ---------- */
  const onAdd = async (e) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    await new Promise(requestAnimationFrame); // เว้นเฟรม ลด INP

    try {
      const images = form.imgs.filter(Boolean);
      const cover = images[0] || "";

      const payload = {
        title: form.title.trim(),
        type: form.type,
        qty: Number(form.qty || 0),
        price: Number(form.price || 0),
        cover,
        images,
        youtube: form.youtube.trim(),
        detail: form.detail.trim(),
      };

      const out = await api("/api/products", {
        method: "POST",
        token,
        body: payload,
      });
      if (!out?.ok) throw new Error(out?.error || "เพิ่มสินค้าไม่สำเร็จ");

      // ถ้า API ส่ง item กลับมา ให้แทรกเฉพาะชิ้นนั้น เพื่อลดงาน re-render
      if (out.item) {
        startTransition(() => {
          setItems((prev) => [out.item, ...prev]);
        });
      } else {
        // กรณีไม่ส่ง item กลับมา โหลดใหม่ครั้งเดียว
        await load();
      }

      setForm(INIT_FORM);
      setMsg("เพิ่มสินค้าแล้ว ✅");
    } catch (err) {
      setMsg(String(err));
    } finally {
      setSending(false);
    }
  };

  /** ---------- delete product (optimistic) ---------- */
  const onDelete = async (id) => {
    if (!confirm("ลบสินค้านี้?")) return;
    // เอาออกจากจอทันทีแบบ transition (ลด INP)
    startTransition(() => {
      setItems((prev) => prev.filter((x) => x.id !== id));
    });
    // ยิงลบจริง
    const out = await api(`/api/products?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      token,
    });
    if (!out?.ok) {
      setMsg("ลบไม่สำเร็จ: " + (out?.error || ""));
      // จะ rollback ก็ได้โดยเรียก load() อีกครั้ง
    }
  };

  /** ---------- helpers / UI ---------- */
  const total = useMemo(
    () => items.reduce((s, it) => s + Number(it.price || 0), 0),
    [items]
  );

  if (!token) {
    // หน้าเข้าสู่ระบบ
    return (
      <div className="wrap" style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
        <h1>Admin Panel</h1>
        {msg && <p style={{ color: "#c00" }}>{msg}</p>}
        <form onSubmit={onLogin} style={{ display: "grid", gap: 12 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="อีเมล"
            required
            style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="รหัสผ่าน"
            type="password"
            required
            style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
          />
          <button disabled={sending} style={{ padding: 12, borderRadius: 8 }}>
            {sending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    );
  }

  // หน้าแอดมินจัดการสินค้า
  return (
    <div className="wrap" style={{ maxWidth: 1080, margin: "40px auto", padding: 16 }}>
      <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setTab("products")} style={{ padding: "8px 12px" }}>
            จัดการสินค้า
          </button>
          <button onClick={() => setTab("orders")} style={{ padding: "8px 12px" }}>
            ออเดอร์
          </button>
        </div>
        <button onClick={logout} style={{ padding: "8px 12px" }}>ออกจากระบบ</button>
      </div>

      {msg && (
        <p style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "#fee", color: "#c00" }}>
          {msg}
        </p>
      )}

      {tab === "products" && (
        <>
          <h2 style={{ marginTop: 24 }}>เพิ่มสินค้าใหม่</h2>
          <form onSubmit={onAdd} style={{ display: "grid", gap: 10, marginTop: 8 }}>
            <input
              placeholder="ชื่อสินค้า"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
              >
                <option value="DVD">DVD</option>
                <option value="Blu-ray">Blu-ray</option>
              </select>
              <input
                type="number"
                placeholder="จำนวน"
                min="0"
                value={form.qty}
                onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
                style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
              />
              <input
                type="number"
                placeholder="ราคา (บาท)"
                min="0"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
              />
            </div>

            <input
              placeholder="YouTube URL (ถ้ามี)"
              value={form.youtube}
              onChange={(e) => setForm((f) => ({ ...f, youtube: e.target.value }))}
              style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
            />

            <textarea
              rows={3}
              placeholder="รายละเอียด"
              value={form.detail}
              onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))}
              style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {form.imgs.map((v, i) => (
                <input
                  key={i}
                  placeholder={`ลิงก์รูปที่ ${i + 1} (https://...)`}
                  value={v}
                  onChange={(e) =>
                    setForm((f) => {
                      const imgs = f.imgs.slice();
                      imgs[i] = e.target.value;
                      return { ...f, imgs };
                    })
                  }
                  style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
                />
              ))}
            </div>

            <button disabled={sending || isPending} style={{ padding: 12, borderRadius: 8 }}>
              {sending ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </form>

          <h2 style={{ marginTop: 32 }}>
            สินค้าทั้งหมด ({items.length}) — รวม {total.toLocaleString("th-TH")} บาท
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f6f6f6" }}>
                  <th style={th}>รหัส</th>
                  <th style={th}>ชื่อ</th>
                  <th style={th}>ประเภท</th>
                  <th style={th}>จำนวน</th>
                  <th style={th}>ราคา</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} style={{ borderTop: "1px solid #eee" }}>
                    <td style={td}>{it.id}</td>
                    <td style={td}>{it.title || <i style={{ color: "#999" }}>—</i>}</td>
                    <td style={td}>{it.type}</td>
                    <td style={td}>{it.qty}</td>
                    <td style={td}>{Number(it.price || 0).toLocaleString("th-TH")}</td>
                    <td style={{ ...td, textAlign: "right" }}>
                      <button onClick={() => onDelete(it.id)} style={{ padding: "6px 10px" }}>
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td style={{ ...td, textAlign: "center" }} colSpan={6}>
                      ยังไม่มีสินค้า
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "orders" && (
        <div style={{ marginTop: 24, color: "#666" }}>
          (ยังไม่ทำส่วนออเดอร์ในตัวอย่างนี้)
        </div>
      )}
    </div>
  );
}

const th = { textAlign: "left", padding: "10px 8px" };
const td = { padding: "8px" };

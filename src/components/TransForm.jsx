// src/components/TransForm.jsx
import { useState } from "react";
import { sendOrder, fileToDataURL } from "./api"; // ถ้าไฟล์นี้ไม่ได้อยู่ใน /components เปลี่ยนเส้นทางให้ถูก

export default function TransferForm({ items = [], total = 0, onClose }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    bank: "SCB",
    slip: null,
  });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const slipDataURL = await fileToDataURL(form.slip);
      const payload = {
        orderId: "ORD-" + Date.now(),
        items: items.map((it) => ({
          title: it.title,
          price: it.price,
          qty: it.qty || 1,
        })),
        total,
        customer: { name: form.name, phone: form.phone, email: form.email },
        bank: form.bank,
        slipDataURL,
      };

      const r = await sendOrder(payload); // ← ยิงไป Vercel /api/send-order
      setMsg(`✅ ส่งอีเมลแล้ว • messageId: ${r.messageId}`);
    } catch (err) {
      setMsg(`❌ ส่งไม่สำเร็จ • ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label>ชื่อผู้โอน</label>
        <input
          className="border p-2 w-full"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          required
        />
      </div>
      <div>
        <label>เบอร์โทร</label>
        <input
          className="border p-2 w-full"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          required
        />
      </div>
      <div>
        <label>อีเมล</label>
        <input
          className="border p-2 w-full"
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          required
        />
      </div>
      <div>
        <label>ธนาคาร</label>
        <select
          className="border p-2 w-full"
          value={form.bank}
          onChange={(e) => set("bank", e.target.value)}
        >
          <option value="SCB">SCB</option>
          <option value="KBANK">KBANK</option>
          <option value="BBL">BBL</option>
        </select>
      </div>
      <div>
        <label>สลิปโอน (ถ้ามี)</label>
        <input type="file" accept="image/*" onChange={(e) => set("slip", e.target.files?.[0] || null)} />
      </div>

      <button disabled={loading} type="submit" className="bg-black text-white px-4 py-2 rounded">
        {loading ? "กำลังส่ง..." : "ส่ง"}
      </button>

      {onClose && (
        <button type="button" className="ml-2 px-3 py-2" onClick={onClose}>
          ปิด
        </button>
      )}

      {msg && <p className="text-sm mt-2">{msg}</p>}
    </form>
  );
}

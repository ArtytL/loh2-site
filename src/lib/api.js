// src/lib/api.js
export async function sendOrder(payload) {
  const BASE = import.meta.env.VITE_API_URL;   // ต้องเป็น https://email-five-alpha.vercel.app/api
  const url  = `${BASE}/send-order`;           // << จุดสำคัญ!

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

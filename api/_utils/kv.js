// api/_utils/kv.js
// ใช้ REST แบบง่ายของ Upstash: /get /set /del

const API = process.env.KV_REST_API_URL;
const TOKEN = process.env.KV_REST_API_TOKEN;

if (!API || !TOKEN) {
  throw new Error("Missing KV_REST_API_URL or KV_REST_API_TOKEN");
}

const H = { Authorization: `Bearer ${TOKEN}` };

// คืนค่าที่อ่านจาก KV (ปกติ Upstash จะตอบ {result:"..."} หรือ {value:"..."})
export async function kvGet(key) {
  const r = await fetch(`${API}/get/${encodeURIComponent(key)}`, {
    headers: H,
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`KV GET failed: ${r.status}`);
  const data = await r.json();
  return data.result ?? data.value ?? null;
}

// เขียนค่าใส่ KV (value ต้องเป็นสตริง)
export async function kvSet(key, value) {
  const r = await fetch(
    `${API}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`,
    { method: "POST", headers: H }
  );
  if (!r.ok) throw new Error(`KV SET failed: ${r.status}`);
  return r.json();
}

export async function kvDel(key) {
  const r = await fetch(`${API}/del/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: H,
  });
  if (!r.ok) throw new Error(`KV DEL failed: ${r.status}`);
  return r.json();
}

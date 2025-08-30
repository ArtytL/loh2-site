// api/_utils/kv.js
// ต้องมี ENV ใน Vercel: KV_REST_API_URL, KV_REST_API_TOKEN

const URL_BASE = process.env.KV_REST_API_URL;
const TOKEN = process.env.KV_REST_API_TOKEN;

function must() {
  if (!URL_BASE || !TOKEN) {
    throw new Error("Missing KV_REST_API_URL / KV_REST_API_TOKEN");
  }
}

/** อ่านค่า: คืนเป็น string/object หรือ null */
export async function kvGet(key) {
  must();
  const res = await fetch(`${URL_BASE}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.result ?? data.value ?? null;
}

/** เขียนค่า: value รับได้ทั้ง string หรือ object (จะ JSON.stringify ให้) */
export async function kvSet(key, value) {
  must();
  const v = typeof value === "string" ? value : JSON.stringify(value);
  const res = await fetch(
    `${URL_BASE}/set/${encodeURIComponent(key)}/${encodeURIComponent(v)}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}` },
    }
  );
  if (!res.ok) throw new Error(await res.text());
  return true;
}

/** (ออปชัน) เขียนหลายคีย์แบบ batch */
export async function kvSetPairs(pairs = []) {
  must();
  const commands = pairs.map(([k, v]) => [
    "SET",
    k,
    typeof v === "string" ? v : JSON.stringify(v),
  ]);
  const res = await fetch(`${URL_BASE}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

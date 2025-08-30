// api/_utils/kv.js

// อ่านค่า key เดียวจาก Upstash REST KV
export async function kvGet(key) {
  const { KV_REST_API_URL, KV_REST_API_TOKEN } = process.env;
  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
    throw new Error('Missing KV_REST_API_URL or KV_REST_API_TOKEN');
  }

  const res = await fetch(
    `${KV_REST_API_URL}/get/${encodeURIComponent(key)}`,
    { headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` } }
  );

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`KV GET ${key} failed: ${res.status} ${txt}`);
  }

  const data = await res.json().catch(() => ({}));
  let v = data?.result ?? null;

  // แปลง string ที่เป็น JSON ให้กลายเป็น object อัตโนมัติ
  if (typeof v === 'string') {
    try { v = JSON.parse(v); } catch {}
  }
  return v;
}

// เซ็ตค่าหลาย key แบบ pipeline [['key','value'], ...]
export async function kvSet(pairs) {
  const { KV_REST_API_URL, KV_REST_API_TOKEN } = process.env;
  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
    throw new Error('Missing KV_REST_API_URL or KV_REST_API_TOKEN');
  }

  // รองรับทั้งรูปแบบ ['k','v'] เดี่ยว และแบบหลายคู่
  const list = Array.isArray(pairs?.[0]) ? pairs : [pairs];

  const commands = list.map(([k, v]) => [
    'SET',
    String(k),
    typeof v === 'string' ? v : JSON.stringify(v),
  ]);

  const res = await fetch(`${KV_REST_API_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`KV SET failed: ${res.status} ${txt}`);
  }
  return true;
}

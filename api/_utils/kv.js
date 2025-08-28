// api/_utils/kv.js
export async function kvSet(pairs) {
  const { KV_REST_API_URL, KV_REST_API_TOKEN } = process.env;

  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
    throw new Error('Missing KV_REST_API_URL or KV_REST_API_TOKEN');
  }

  // Upstash REST pipeline: [["SET","key","value"], ["SET","key2","value2"], ...]
  const commands = pairs.map(([k, v]) => ['SET', k, typeof v === 'string' ? v : JSON.stringify(v)]);

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
    throw new Error(`Upstash error: ${res.status} ${txt}`);
  }

  return res.json();
}

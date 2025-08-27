export async function kvSet(key, value) {
  const API = process.env.KV_REST_API_URL;
  const TOKEN = process.env.KV_REST_API_TOKEN;
  if (!API || !TOKEN) throw new Error('Missing KV_REST_API_URL or KV_REST_API_TOKEN');

  const resp = await fetch(`${API}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ value: JSON.stringify(value) }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(`KV set fail: ${resp.status} ${JSON.stringify(data)}`);
  return data;
}

// api/seed.js  (โปรเจกต์ loh2-site) — เวอร์ชันจบในไฟล์เดียว

import { kvSet } from './_utils/kv.js';
export const runtime = 'nodejs';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    const SECRET = process.env.ADMIN_JWT_SECRET || '';
    if (SECRET) {
      const auth = req.headers.authorization || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
      if (token !== SECRET) {
        return res.status(401).json({ ok: false, error: 'Unauthorized' });
      }
    }

    const API = process.env.KV_REST_API_URL;
    const TOKEN = process.env.KV_REST_API_TOKEN;
    if (!API || !TOKEN) {
      return res.status(500).json({
        ok: false,
        error: 'Missing KV_REST_API_URL or KV_REST_API_TOKEN',
      });
    }

    const products = [
      {
        id: 'DVD-001',
        title: 'DVD ตัวอย่าง #1',
        type: 'DVD',
        price: 120,
        qty: 10,
        cover: 'https://picsum.photos/seed/dvd1/600/800',
        images: [
          'https://picsum.photos/seed/dvd1a/300/400',
          'https://picsum.photos/seed/dvd1b/300/400',
          'https://picsum.photos/seed/dvd1c/300/400',
          'https://picsum.photos/seed/dvd1d/300/400',
        ],
        youtube: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        detail: 'คำอธิบายสินค้าตัวอย่างแบบสั้น',
      },
      {
        id: 'BR-001',
        title: 'Blu-ray ตัวอย่าง #1',
        type: 'Blu-ray',
        price: 280,
        qty: 5,
        cover: 'https://picsum.photos/seed/br1/600/800',
        images: [
          'https://picsum.photos/seed/br1a/300/400',
          'https://picsum.photos/seed/br1b/300/400',
          'https://picsum.photos/seed/br1c/300/400',
          'https://picsum.photos/seed/br1d/300/400',
        ],
        youtube: 'https://www.youtube.com/watch?v=o-YBDTqX_ZU',
        detail: 'คำอธิบายสินค้าบลูเรย์ตัวอย่าง',
      },
    ];

    // helper เรียก Upstash KV REST ตรง ๆ
    const kvSet = async (key, value) => {
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
    };

    await kvSet('products', products);

    return res.status(200).json({ ok: true, count: products.length });
  } catch (err) {
    console.error('seed error:', err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
}


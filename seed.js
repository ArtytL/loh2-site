// api/seed.js
import { kvSet } from './_utils/kv.js';

// ใช้ Node runtime ให้รองรับ ESM/Fetch/ENV ชัวร์
export const config = { runtime: 'nodejs18.x' };

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    // เช็ค secret (มีแล้วต้องส่งให้ตรง)
    const SECRET = process.env.ADMIN_JWT_SECRET || '';
    if (SECRET) {
      const auth = req.headers.authorization || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
      if (token !== SECRET) {
        return res.status(401).json({ ok: false, error: 'Unauthorized' });
      }
    }

    // เช็ค ENV ของ Upstash ให้ครบ
    const { KV_REST_API_URL, KV_REST_API_TOKEN } = process.env;
    if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
      return res.status(500).json({
        ok: false,
        error: 'Missing Upstash ENV (KV_REST_API_URL / KV_REST_API_TOKEN)',
      });
    }

    // ข้อมูล seed ตัวอย่าง — สั้นๆ เพื่อตรวจว่าบันทึกได้จริง
    const now = Date.now();
    const seedPairs = [
      ['catalog:seedAt', String(now)],
      ['product:demo-1', { sku: 'demo-1', title: 'Demo Disc 1', price: 120, stock: 5, type: 'DVD' }],
      ['product:demo-2', { sku: 'demo-2', title: 'Demo Disc 2', price: 200, stock: 3, type: 'Blu-ray' }],
    ];

    const result = await kvSet(seedPairs);

    return res.status(200).json({ ok: true, wrote: seedPairs.length, result });
  } catch (err) {
    // ให้ log ออกมาใน Vercel Functions เพื่อ debug ได้
    console.error('SEED ERROR:', err);
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}


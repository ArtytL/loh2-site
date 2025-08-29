// api/admin-login.js
import jwt from 'jsonwebtoken';

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
const { email, password } = body;

    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const token = jwt.sign(
      { role: 'admin', email },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({ ok: true, token });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}

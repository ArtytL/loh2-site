// api/orders.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const order = req.body; // front-end ส่ง JSON มา
    console.log('NEW ORDER:', order); // ดูได้ใน Vercel > Logs

    // TODO: ภายหลังค่อยต่อ DB/Upstash หรือส่งต่ออีเมล/Discord ฯลฯ
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}

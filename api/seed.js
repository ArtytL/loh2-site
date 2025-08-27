// /api/seed.js
import { redis } from "./_utils/kv.js";
import { nanoid } from "nanoid";

const samples = Array.from({length:16}).map((_,i)=>({
  id: nanoid(10),
  name: `DVD Example #${i+1}`,
  category: i%2 ? "dvd" : "blu-ray",
  price: 120 + (i*5),
  qty: 3 + (i%5),
  desc: "ตัวอย่างรายละเอียดสินค้า\nภาค/นักแสดง/สภาพสินค้า ฯลฯ",
  images: [
    `https://images.unsplash.com/photo-1517602302552-471fe67acf66?q=80&w=600&auto=format&fit=crop`,
    `https://images.unsplash.com/photo-1529612700005-8fcf4e45f2fd?q=80&w=600&auto=format&fit=crop`,
    `https://images.unsplash.com/photo-1516822003754-cca485356ecb?q=80&w=600&auto=format&fit=crop`,
    `https://images.unsplash.com/photo-1545912452-8aea7e25a3d8?q=80&w=600&auto=format&fit=crop`,
    `https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop`,
  ],
  youtube: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  createdAt: Date.now(), updatedAt: Date.now()
}));

export default async function handler(req,res){
  if (req.method!=="POST") return res.status(405).end();
  for (const p of samples){
    await redis.set(`p:${p.id}`, p);
    await redis.zadd("products", { score: p.createdAt, member: p.id });
  }
  res.json({ok:true, added:samples.length});
}

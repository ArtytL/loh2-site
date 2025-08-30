// … ด้านบนเหมือนเดิม (verify, loadItems, saveItems) …

// ===== เพิ่ม/แก้ไข payload normalizer =====
function normalizeIncoming(body = {}) {
  // รองรับทั้ง title หรือ name
  const title = (body.title ?? body.name ?? "").toString().trim();

  // รวมรูปจาก images[] หรือ image1..image5
  let images = [];
  if (Array.isArray(body.images)) {
    images = body.images.filter(Boolean);
  } else {
    images = [
      body.image1, body.image2, body.image3, body.image4, body.image5
    ].filter(Boolean);
  }

  const type   = (body.type ?? body.category ?? "DVD").toString().trim();
  const price  = Number(body.price ?? 0) || 0;
  const qty    = Number(body.qty   ?? 0) || 0;
  const detail = (body.detail ?? body.description ?? "").toString();
  const youtube = (body.youtube ?? body.youtubeUrl ?? "").toString();

  return { title, type, price, qty, detail, youtube, images };
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const items = await loadItems();
      return res.json({ ok: true, items });
    }

    const admin = verify(req);
    if (!admin) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const rawBody = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    let items = await loadItems();

    if (req.method === "POST") {
      let seq = Number((await kvGet("product:seq")) || 0) + 1;
      await kvSet("product:seq", String(seq));

      const { title, type, price, qty, detail, youtube, images } = normalizeIncoming(rawBody);

      const now = new Date().toISOString();
      const idPrefix = type === "Blu-ray" ? "BR" : "DVD";
      const id = `${idPrefix}-${String(seq).padStart(3, "0")}`;

      const product = {
        id,
        title,
        type,
        price,
        qty,
        cover: images[0] ?? "",
        images,
        youtube,
        detail,
        createdAt: now,
        updatedAt: now,
      };

      items.push(product);
      await saveItems(items);
      return res.json({ ok: true, item: product, items });
    }

    if (req.method === "PUT") {
      const { id, ...changesRaw } = rawBody || {};
      const idx = items.findIndex((x) => x.id === id);
      if (idx === -1) return res.status(404).json({ ok: false, error: "Not found" });

      const normalized = normalizeIncoming(changesRaw);
      const merged = {
        ...items[idx],
        ...normalized,
        price: normalized.price,
        qty: normalized.qty,
        cover: (normalized.images?.[0] ?? items[idx].cover ?? ""),
        updatedAt: new Date().toISOString(),
      };

      items[idx] = merged;
      await saveItems(items);
      return res.json({ ok: true, item: merged, items });
    }

    if (req.method === "DELETE") {
      const { id } = rawBody || {};
      items = items.filter((x) => x.id !== id);
      await saveItems(items);
      return res.json({ ok: true, items });
    }

    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e && e.message ? e.message : e) });
  }
}

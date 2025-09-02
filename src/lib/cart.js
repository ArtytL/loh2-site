const KEY = "cart";

function parse(json, fallback) {
  try { const v = JSON.parse(json); return Array.isArray(v) ? v : fallback; }
  catch { return fallback; }
}

export function readCart() {
  return parse(localStorage.getItem(KEY) || "[]", []);
}

export function writeCart(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart:changed"));
  window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
}

export function addToCart(p, qty = 1) {
  const items = readCart();
  const id = p.id || p.code || p._id;
  if (!id) return;
  const i = items.find(x => x.id === id);
  if (i) i.qty = Math.max(1, Number(i.qty || 1) + Number(qty || 1));
  else items.push({ id, code: p.id || p.code, title: p.title, type: p.type, price: Number(p.price || 0), qty: Number(qty || 1) });
  writeCart(items);
}

export function inc(id, delta = 1) {
  const items = readCart();
  const i = items.find(x => x.id === id);
  if (!i) return;
  i.qty = Math.max(0, Number(i.qty || 0) + Number(delta));
  if (i.qty <= 0) remove(id); else writeCart(items);
}

export function setQty(id, qty) {
  const items = readCart();
  const i = items.find(x => x.id === id);
  if (!i) return;
  i.qty = Number(qty);
  if (i.qty <= 0) remove(id); else writeCart(items);
}

export function remove(id) {
  writeCart(readCart().filter(x => x.id !== id));
}

export function clearCart() { writeCart([]); }

export function totals() {
  const items = readCart();
  const itemsTotal = items.reduce((s, x) => s + Number(x.price || 0) * Number(x.qty || 1), 0);
  const shipping = items.length ? 50 : 0;
  return { items, itemsTotal, shipping, grand: itemsTotal + shipping };
}

export function totalQty() {
  return readCart().reduce((s, x) => s + Number(x.qty || 0), 0);
}

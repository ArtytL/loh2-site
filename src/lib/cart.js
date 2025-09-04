// src/lib/cart.js
// ใช้คีย์เดียวกันทุกหน้าให้ตะกร้าตรงกัน
const KEY = "loh2-cart";

// อ่าน/เขียน localStorage อย่างปลอดภัย
function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
  // ยิง event เผื่อมีหน้าอื่นฟังอยู่ (ไม่จำเป็นแต่ดีต่อการ sync)
  try { window.dispatchEvent(new Event("storage")); } catch {}
}

// === ฟังก์ชันที่ใช้ในทุกหน้า ===
export function addToCart(product, qty = 1) {
  const items = read();
  const i = items.findIndex(x => String(x.id) === String(product.id));
  if (i >= 0) {
    items[i].qty += qty;
  } else {
    items.push({
      id: product.id,
      title: product.title,
      type: product.type,
      price: Number(product.price) || 0,
      cover: product.cover,
      qty: qty
    });
  }
  write(items);
}

export function getItems() {
  return read();
}

export function getCount() {
  return read().reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
}

export function getTotal() {
  return read().reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
}

export function setQty(id, qty) {
  const q = Math.max(0, Number(qty) || 0);
  const items = read().map(it =>
    String(it.id) === String(id) ? { ...it, qty: q } : it
  ).filter(it => it.qty > 0);
  write(items);
}

export function remove(id) {
  const items = read().filter(it => String(it.id) !== String(id));
  write(items);
}

export function clear() {
  write([]);
}

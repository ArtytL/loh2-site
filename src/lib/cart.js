// src/lib/cart.js

const KEY = "cart";

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
  // กระจาย event เผื่อส่วน header ต้องอัปเดต badge ตะกร้า
  window.dispatchEvent(new CustomEvent("cart:change"));
}

// === Named Exports ===
export function getCart() {
  return read();
}

export function setCart(items) {
  write(items);
}

export function getCartCount() {
  return read().reduce((sum, i) => sum + (i.qty || 1), 0);
}

export function addToCart(product, qty = 1) {
  const items = read();
  const idx = items.findIndex((x) => String(x.id) === String(product.id));
  if (idx >= 0) {
    items[idx].qty = (items[idx].qty || 1) + qty;
  } else {
    items.push({
      id: product.id,
      title: product.title,
      type: product.type,
      price: product.price,
      cover: product.cover,
      qty,
    });
  }
  write(items);
}

export function updateQty(id, qty) {
  const items = read();
  const item = items.find((x) => String(x.id) === String(id));
  if (item) {
    item.qty = Math.max(1, qty | 0);
    write(items);
  }
}

export function removeFromCart(id) {
  const items = read().filter((x) => String(x.id) !== String(id));
  write(items);
}

export function clearCart() {
  write([]);
}

export function totals(shipping = 50) {
  const items = read();
  const subtotal = items.reduce((s, i) => s + i.price * (i.qty || 1), 0);
  return { items, shipping, total: subtotal + shipping };
}

// เผื่อใครอยาก import default ก็ได้
export default {
  getCart,
  setCart,
  getCartCount,
  addToCart,
  updateQty,
  removeFromCart,
  clearCart,
  totals,
};

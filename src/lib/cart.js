// src/lib/cart.js

// คีย์สำหรับเก็บใน localStorage
export const CART_KEY = "cart_v1";

// อ่านตะกร้า
export function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// เขียนตะกร้า + broadcast event ให้ badge/ตัวเลขบนหัวอัพเดต
export function setCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  const detail = {
    items,
    count: cartCount(items),
    total: cartTotal(items),
  };
  window.dispatchEvent(new CustomEvent("cart:change", { detail }));
  return items;
}

// จำนวนชิ้นรวม
export function cartCount(items = getCart()) {
  return items.reduce((s, i) => s + (i.qty || 0), 0);
}

// ราคารวม
export function cartTotal(items = getCart()) {
  return items.reduce((s, i) => s + (i.price || 0) * (i.qty || 0), 0);
}

// เพิ่มสินค้าลงตะกร้า
export function addToCart(product, qty = 1) {
  const items = getCart();
  const idx = items.findIndex((i) => String(i.id) === String(product.id));
  if (idx > -1) {
    items[idx].qty += qty;
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
  return setCart(items);
}

// ลบ 1 ชิ้น
export function decFromCart(productId, step = 1) {
  const items = getCart();
  const idx = items.findIndex((i) => String(i.id) === String(productId));
  if (idx > -1) {
    items[idx].qty -= step;
    if (items[idx].qty <= 0) items.splice(idx, 1);
  }
  return setCart(items);
}

// เอาออกทั้งรายการ
export function removeFromCart(productId) {
  const items = getCart().filter((i) => String(i.id) !== String(productId));
  return setCart(items);
}

// เคลียร์ตะกร้า
export function clearCart() {
  return setCart([]);
}

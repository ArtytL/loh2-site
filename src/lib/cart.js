// src/lib/cart.js

const CART_KEY = "cart";

/* ---------- utils ---------- */
function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function pickProduct(p) {
  // เก็บเฉพาะฟิลด์ที่ต้องใช้ในตะกร้า (กัน payload บวม)
  return {
    id: String(p.id),
    title: p.title,
    type: p.type,
    price: Number(p.price || 0),
    cover: p.cover || null,
  };
}

/* ---------- APIs ที่หน้าเว็บใช้เรียก ---------- */

/** เพิ่มสินค้าเข้าตะกร้า */
export function addToCart(product, qty = 1) {
  const items = loadCart();
  const id = String(product.id);
  const i = items.findIndex((it) => String(it.id) === id);

  if (i >= 0) {
    items[i].qty = Number(items[i].qty || 0) + Number(qty || 1);
  } else {
    items.push({ ...pickProduct(product), qty: Number(qty || 1) });
  }

  saveCart(items);
  return items;
}

/** ดึงรายการในตะกร้า */
export function getCart() {
  return loadCart();
}

/** จำนวนชิ้นรวมในตะกร้า */
export function getCount() {
  return loadCart().reduce((n, it) => n + Number(it.qty || 0), 0);
}

/** ยอดรวมราคา (ไม่รวมค่าส่ง) */
export function getTotal() {
  return loadCart().reduce((sum, it) => sum + Number(it.price || 0) * Number(it.qty || 0), 0);
}

/** แก้จำนวนชิ้นของสินค้า */
export function setQty(id, qty) {
  const items = loadCart();
  const i = items.findIndex((it) => String(it.id) === String(id));
  if (i >= 0) {
    const q = Number(qty || 0);
    if (q <= 0) {
      items.splice(i, 1);
    } else {
      items[i].qty = q;
    }
    saveCart(items);
  }
  return items;
}

/** ลบสินค้าออกจากตะกร้า */
export function removeFromCart(id) {
  const items = loadCart().filter((it) => String(it.id) !== String(id));
  saveCart(items);
  return items;
}

/** เคลียร์ตะกร้าทั้งหมด */
export function clearCart() {
  localStorage.removeItem(CART_KEY);
  return [];
}

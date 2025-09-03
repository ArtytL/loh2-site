// src/lib/cart.js

const KEY = "cart";

/** อ่านตะกร้าจาก localStorage */
export function readCart() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** เซฟตะกร้าลง localStorage และ broadcast ให้ UI อื่นๆ รู้ตัว */
function writeCart(cart) {
  localStorage.setItem(KEY, JSON.stringify(cart));
  try {
    // กระตุ้น event ให้ header หรือหน้าที่ subscribe อัปเดต badge จำนวนสินค้า
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
  } catch {/* noop */}
}

/** เพิ่มสินค้าลงตะกร้า (ถ้ามีอยู่แล้วจะบวกจำนวน) */
export function addToCart(product, qty = 1) {
  const cart = readCart();
  const i = cart.findIndex((x) => x.id === product.id);
  if (i > -1) {
    cart[i].qty += qty;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      type: product.type,
      price: Number(product.price || 0),
      cover: product.cover,
      qty: qty,
    });
  }
  writeCart(cart);
  return cart;
}

/** เพิ่มจำนวน 1 ชิ้นตาม id */
export function incQty(id) {
  const cart = readCart();
  const i = cart.findIndex((x) => x.id === id);
  if (i > -1) {
    cart[i].qty += 1;
    writeCart(cart);
  }
  return cart;
}

/** ลดจำนวน 1 ชิ้นตาม id; ถ้าเหลือ 0 จะลบทิ้ง */
export function decQty(id) {
  const cart = readCart();
  const i = cart.findIndex((x) => x.id === id);
  if (i > -1) {
    cart[i].qty -= 1;
    if (cart[i].qty <= 0) cart.splice(i, 1);
    writeCart(cart);
  }
  return cart;
}

/** ลบรายการตาม id ออกจากตะกร้า */
export function removeFromCart(id) {
  const cart = readCart().filter((x) => x.id !== id);
  writeCart(cart);
  return cart;
}

/** ล้างตะกร้า */
export function clearCart() {
  writeCart([]);
  return [];
}

/** นับจำนวนชิ้นทั้งหมดในตะกร้า */
export function countItems() {
  return readCart().reduce((n, x) => n + Number(x.qty || 0), 0);
}

/** คำนวณยอดรวม */
export function getTotals() {
  const cart = readCart();
  const subtotal = cart.reduce(
    (sum, x) => sum + Number(x.price || 0) * Number(x.qty || 0),
    0
  );
  const shipping = cart.length ? 50 : 0; // กำหนดค่าส่งตามที่คุณใช้
  const total = subtotal + shipping;
  return { subtotal, shipping, total };
}

/** export รวมแบบ default เผื่ออยาก import เป็น object */
export default {
  readCart,
  addToCart,
  incQty,
  decQty,
  removeFromCart,
  clearCart,
  countItems,
  getTotals,
};

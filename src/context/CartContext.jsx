// src/context/CartContext.jsx
import React, { createContext, useContext, useMemo, useState, useEffect } from "react";

const CartContext = createContext(null);

function loadCart() {
  try {
    const raw = localStorage.getItem("cart");
    return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveCart(items) {
  localStorage.setItem("cart", JSON.stringify(items));
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => loadCart());

  // sync กับ localStorage เสมอ
  useEffect(() => saveCart(items), [items]);

  const count = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0),
    [items]
  );

  const add = (product, qty = 1) => {
    setItems(prev => {
      const found = prev.find(p => p.id === product.id);
      if (found) {
        return prev.map(p => (p.id === product.id ? { ...p, qty: Number(p.qty) + Number(qty) } : p));
      }
      return [...prev, { ...product, qty: Number(qty) }];
    });
  };

  const removeById = id => setItems(prev => prev.filter(p => p.id !== id));
  const clear = () => setItems([]);

  const value = { items, count, add, removeById, clear, setItems };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}


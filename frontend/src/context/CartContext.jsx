import { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart')) || []; } catch { return []; }
  });

  const save = (items) => {
    setCart(items);
    localStorage.setItem('cart', JSON.stringify(items));
  };

  const addToCart = (product, quantity) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      const updated = existing
        ? prev.map((i) => i.product_id === product.id ? { ...i, quantity: i.quantity + quantity } : i)
        : [...prev, {
            product_id:  product.id,
            name:        product.name,
            sku:         product.sku,
            vendor_id:   product.vendor_id   || null,
            vendor_name: product.vendor_name || null,
            quantity,
          }];
      localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });
  };

  const updateQuantity = (product_id, quantity) => {
    save(cart.map((i) => i.product_id === product_id ? { ...i, quantity } : i));
  };

  const removeFromCart = (product_id) => {
    save(cart.filter((i) => i.product_id !== product_id));
  };

  const clearCart = () => save([]);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);

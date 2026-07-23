import { apiFetch } from '../lib/api';
import React, { createContext, useContext, useState, useEffect } from 'react';

export const AppContext = createContext<any>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState(localStorage.getItem('customer_token') || '');
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState<any[]>((() => { try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch(e) { return []; } })());
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('customer_token', token);
      apiFetch('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (!data.error) setUser(data);
        else {
          localStorage.removeItem('customer_token');
          setToken('');
        }
      })
      .catch((e: any) => {
        if (e.message !== 'Service temporarily unavailable. Please try again later.') {
          console.error(e);
        }
      });
    } else {
      localStorage.removeItem('customer_token');
      setUser(null);
    }
  }, [token]);

  const addToCart = (product: any, quantity = 1, customizations: any = null) => {
    setCart(prev => {
      // If adding item with customizations or if product already exists but with different customizations, treat as separate or same (for simplicity just add as new or update existing if no customizations)
      if (!customizations) {
        const existing = prev.find(i => i.product.id === product.id && !i.customizations);
        if (existing) {
          return prev.map(i => i.product.id === product.id && !i.customizations ? { ...i, quantity: i.quantity + quantity } : i);
        }
      }
      return [...prev, { product, quantity, customizations }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, cartIndex?: number) => {
    if (cartIndex !== undefined) {
      setCart(prev => prev.filter((_, i) => i !== cartIndex));
    } else {
      setCart(prev => prev.filter(i => i.product.id !== productId));
    }
  };

  const updateQuantity = (productId: string, quantity: number, cartIndex?: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, cartIndex);
    } else {
      if (cartIndex !== undefined) {
        setCart(prev => prev.map((item, i) => i === cartIndex ? { ...item, quantity } : item));
      } else {
        setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity } : item));
      }
    }
  };

  const clearCart = () => setCart([]);

  return (
    <AppContext.Provider value={{
      token, setToken, user, setUser,
      cart, addToCart, removeFromCart, updateQuantity, clearCart,
      isCartOpen, setIsCartOpen
    }}>
      {children}
    </AppContext.Provider>
  );
};

import React, { useState, useContext } from 'react';
import { Button } from '@/src/components/ui/button';
import { AppContext } from '../context/AppContext';
import { X, Plus, Minus, CreditCard, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CartDrawer() {
  const { cart, removeFromCart, updateQuantity, isCartOpen, setIsCartOpen, clearCart, user, token } = useContext(AppContext);
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const getImage = (product: any) => product?.images?.[0] || product?.image || '';
  const total = cart.reduce((acc: number, item: any) => acc + (item.product.price * item.quantity), 0);

  const handleCheckout = () => {
    setIsCartOpen(false);
    if (!token && !user) {
      navigate('/login?redirect=checkout');
    } else {
      navigate('/checkout');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 transition-opacity" onClick={() => setIsCartOpen(false)} />
      <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-xl z-50 flex flex-col transform transition-transform duration-300">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">Shopping Cart ({cart.length})</h2>
          <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <p>Your cart is empty.</p>
              <Button variant="link" onClick={() => setIsCartOpen(false)} className="mt-4 text-purple-600">Continue Shopping</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="w-20 h-20 bg-white rounded-md flex-shrink-0 border flex items-center justify-center overflow-hidden">
                                    <>
                      {getImage(item.product) ? <img referrerPolicy="no-referrer" src={getImage(item.product)} alt={item.product.name} className="object-contain w-full h-full" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} /> : null}
                      <div className={`w-full h-full flex items-center justify-center text-gray-400 ${getImage(item.product) ? 'hidden' : ''}`}><svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                    </>
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-sm line-clamp-2">{item.product.name}</h3>
                      {item.customizations && (
                        <p className="text-xs text-purple-600 bg-purple-50 inline-block px-2 py-0.5 mt-1 rounded border border-purple-100">
                          Custom Design applied
                        </p>
                      )}
                      <p className="text-purple-600 font-bold mt-1">₹{item.product.price.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border bg-white rounded-md">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 rounded-none" 
                          onClick={() => {
                             updateQuantity(item.product.id, item.quantity - 1, idx);
                          }}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm px-2 font-medium w-8 text-center">{item.quantity}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 rounded-none" 
                          onClick={() => {
                             updateQuantity(item.product.id, item.quantity + 1, idx);
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeFromCart(item.product.id, idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-gray-600">Subtotal</span>
              <span className="text-xl font-bold font-mono">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <Button className="w-full bg-purple-600 hover:bg-purple-700 py-6 text-lg" onClick={handleCheckout}>
              Proceed to Checkout
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

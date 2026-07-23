import { apiFetch } from '../lib/api';
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/src/components/ui/button';
import { AppContext } from '../context/AppContext';
import { Layout } from '../components/layout/Layout';
import { CheckCircle2, RotateCcw, CreditCard } from 'lucide-react';
import { getFeaturedImage } from '../lib/imageUtils';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", 
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", 
  "Ladakh", "Lakshadweep", "Puducherry"
];

export function Checkout() {
  const { cart, user, token, clearCart } = useContext(AppContext);
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: ''
  });
  
  const [saveAddress, setSaveAddress] = useState(true);
  const [showSavedAddresses, setShowSavedAddresses] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  useEffect(() => {
    if (!token && !user) {
      navigate('/login?redirect=checkout');
    }
    if (cart.length === 0 && !orderComplete) {
      navigate('/');
    }
    if (user?.savedAddresses?.length > 0 && !address.fullName && showSavedAddresses) {
      const savedAddr = user.savedAddresses[0];
      setAddress({
        fullName: savedAddr.fullName || '',
        phone: savedAddr.phone || '',
        street: savedAddr.street || '',
        city: savedAddr.city || '',
        state: savedAddr.state || '',
        zip: savedAddr.zip || ''
      });
      setShowSavedAddresses(false);
    }
  }, [token, user, cart, navigate, orderComplete, address.fullName, showSavedAddresses]);

  const handleChange = (e: any) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleSelectSavedAddress = (savedAddr: any) => {
    setAddress({
      fullName: savedAddr.fullName || '',
      phone: savedAddr.phone || '',
      street: savedAddr.street || '',
      city: savedAddr.city || '',
      state: savedAddr.state || '',
      zip: savedAddr.zip || ''
    });
    setShowSavedAddresses(false);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // validate
    if (!address.fullName.trim() || address.fullName.trim().split(' ').length < 2) {
      setError('Please enter your full name (first and last name).');
      return;
    }
    if (!/^\d{10}$/.test(address.phone)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    if (!address.street.trim()) {
      setError('Please enter your street address.');
      return;
    }
    if (!/^[a-zA-Z\s.-]{2,50}$/.test(address.city)) {
      setError('Please enter a valid city name.');
      return;
    }
    if (!address.state) {
      setError('Please select a valid state.');
      return;
    }
    if (!/^\d{6}$/.test(address.zip)) {
      setError('Please enter a valid 6-digit postal code.');
      return;
    }

    setLoading(true);
    try {
      const items = cart.map((i: any) => ({
        productId: i.product.id,
        name: i.product.name,
        image: getFeaturedImage(i.product) || '',
        quantity: i.quantity,
        price: i.product.price,
        customizations: i.customizations
      }));

      const total = cart.reduce((acc: number, item: any) => acc + (item.product.price * item.quantity), 0);

      // Define the final DB insertion function so we can reuse it
      const finalizeOrder = async (paymentDetails?: { method: string, paymentId: string }) => {
        const res = await apiFetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            items,
            shippingAddress: address,
            paymentDetails
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to place order');

        if (saveAddress && token) {
           try {
             await apiFetch('/api/users/me/addresses', {
               method: 'POST',
               headers: {
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${token}`
               },
               body: JSON.stringify({ address })
             });
           } catch(e) {
             console.error("Failed to save address", e);
           }
        }

        clearCart();
        setOrderComplete(true);
      };

      if (paymentMethod === 'razorpay') {
        // Razorpay flow
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          throw new Error('Razorpay SDK failed to load. Are you online?');
        }

        const configRes = await apiFetch('/api/config/razorpay');
        const configData = await configRes.json();
        if (!configData.keyId) {
          throw new Error('Razorpay is not configured on the server.');
        }

        const orderRes = await apiFetch('/api/create-razorpay-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ amount: total })
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create razorpay order');

        const options = {
          key: configData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "PrintField",
          description: "Order Payment",
          order_id: orderData.id,
          handler: async function (response: any) {
            await finalizeOrder({
              method: 'Razorpay',
              paymentId: response.razorpay_payment_id
            });
            setLoading(false);
          },
          prefill: {
            name: address.fullName,
            contact: address.phone,
            email: user?.email || ""
          },
          theme: {
            color: "#9333ea"
          },
          modal: {
            ondismiss: function() {
              setLoading(false);
            }
          }
        };

        const rp = new window.Razorpay(options);
        rp.open();

      } else {
        // COD flow
        await finalizeOrder({ method: 'COD', paymentId: '' });
        setLoading(false);
      }

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const total = cart.reduce((acc: number, item: any) => acc + (item.product.price * item.quantity), 0);

  if (orderComplete) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <CheckCircle2 className="mx-auto h-24 w-24 text-green-500 mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
          <p className="text-xl text-gray-600 mb-8">
            Thank you for your order, {address.fullName}. Your order will be shipped shortly.
          </p>
          <div className="bg-purple-50 p-6 rounded-xl inline-block text-left border border-purple-100 mb-8">
            <h3 className="font-semibold text-gray-900 mb-2">Payment Method</h3>
            <p className="text-purple-800 font-medium text-lg">Cash on Delivery (COD)</p>
            <p className="text-sm text-gray-600 mt-2">Please keep exactly ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ready at the time of delivery.</p>
          </div>
          <div>
            <Button size="lg" onClick={() => navigate('/')} className="bg-purple-600 hover:bg-purple-700">
              Continue Shopping
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        
        <div className="grid lg:grid-cols-12 gap-12">
          {/* Form */}
          <div className="lg:col-span-7">
            <form onSubmit={handlePlaceOrder} className="space-y-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">1. Shipping Address</h2>
                  {user?.savedAddresses?.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowSavedAddresses(!showSavedAddresses)}
                      className="text-sm text-purple-600 font-medium hover:underline"
                    >
                      {showSavedAddresses ? 'Enter New Address' : 'Use Saved Address'}
                    </button>
                  )}
                </div>

                {showSavedAddresses && user?.savedAddresses?.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500 mb-2">Select a saved address:</p>
                    {user.savedAddresses.map((savedAddr: any) => (
                      <div
                        key={savedAddr.id}
                        className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-purple-600 hover:bg-purple-50 transition-colors"
                        onClick={() => handleSelectSavedAddress(savedAddr)}
                      >
                        <p className="font-medium text-gray-900">{savedAddr.fullName}</p>
                        <p className="text-sm text-gray-600">{savedAddr.street}</p>
                        <p className="text-sm text-gray-600">{savedAddr.city}, {savedAddr.state} {savedAddr.zip}</p>
                        <p className="text-sm text-gray-600">{savedAddr.phone}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input type="text" name="fullName" value={address.fullName} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input type="tel" name="phone" value={address.phone} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                        <input type="text" name="street" value={address.street} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input type="text" name="city" value={address.city} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State / Province</label>
                        <select name="state" value={address.state} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none bg-white">
                          <option value="">Select State</option>
                          {INDIAN_STATES.map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Zip / Postal Code</label>
                        <input type="text" name="zip" value={address.zip} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
                      </div>
                    </div>
                    {user && (
                      <div className="mt-4 flex items-center">
                        <input
                          id="saveAddress"
                          type="checkbox"
                          checked={saveAddress}
                          onChange={(e) => setSaveAddress(e.target.checked)}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-600 border-gray-300 rounded"
                        />
                        <label htmlFor="saveAddress" className="ml-2 block text-sm text-gray-900">
                          Save this address for next time
                        </label>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">2. Payment Options</h2>
                
                <div className="space-y-4">
                  <label className={`block border-2 rounded-lg p-4 cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="payment" 
                        value="cod" 
                        checked={paymentMethod === 'cod'} 
                        onChange={() => setPaymentMethod('cod')}
                        className="h-5 w-5 text-purple-600 focus:ring-purple-600 border-gray-300" 
                      />
                      <span className="font-semibold text-gray-900">Cash on Delivery (COD)</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2 ml-8">Pay with cash when your order is delivered to you.</p>
                  </label>

                  <label className={`block border-2 rounded-lg p-4 cursor-pointer transition-colors ${paymentMethod === 'razorpay' ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="payment" 
                        value="razorpay" 
                        checked={paymentMethod === 'razorpay'} 
                        onChange={() => setPaymentMethod('razorpay')}
                        className="h-5 w-5 text-purple-600 focus:ring-purple-600 border-gray-300" 
                      />
                      <CreditCard className="w-5 h-5 text-gray-600" />
                      <span className="font-semibold text-gray-900">Pay Online (Razorpay)</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2 ml-8">Pay securely via UPI, Cards, NetBanking, or Wallets.</p>
                  </label>
                </div>
              </div>

              {error && <div className="text-red-500 font-medium">{error}</div>}

              <Button type="submit" size="lg" className="w-full text-lg h-14 bg-purple-600 hover:bg-purple-700" disabled={loading}>
                {loading ? 'Processing...' : 'Place Order'}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                {cart.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-16 h-16 bg-white border rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                      {getFeaturedImage(item.product) ? (
                        <img referrerPolicy="no-referrer" src={getFeaturedImage(item.product) || ''} alt={item.product.name} className="w-full h-full object-contain" onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }} />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                          <svg className="w-6 h-6 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900 line-clamp-2">{item.product.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</p>
                    </div>
                    <div className="font-semibold text-gray-900">
                      ₹{(item.product.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200 mt-2">
                  <span>Total</span>
                  <span>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

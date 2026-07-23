import { apiFetch } from '../lib/api';
import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Layout } from '../components/layout/Layout';
import { Package, RotateCcw, Clock, MapPin, ChevronDown, ChevronUp, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';

export function Orders() {
  const { user, token, addToCart, setIsCartOpen } = useContext(AppContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [requestingGst, setRequestingGst] = useState<string | null>(null);
  const [gstRequested, setGstRequested] = useState<string[]>([]);

  useEffect(() => {
    if (!token && !user) {
      navigate('/login?redirect=orders');
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await apiFetch('/api/users/me/orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to get orders');
        setOrders(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchOrders();
    }
  }, [token, user, navigate]);

  const handleGstRequest = async (orderId: string) => {
    if (!token) return;
    setRequestingGst(orderId);
    try {
      const res = await apiFetch(`/api/orders/${orderId}/gst-bill-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setGstRequested(prev => [...prev, orderId]);
        alert(data.message || 'GST Bill Request sent successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to request GST Bill');
      }
    } catch (e: any) {
      alert('Error requesting GST Bill: ' + e.message);
    } finally {
      setRequestingGst(null);
    }
  };

  const handleReorder = (order: any) => {
    if (order.items && order.items.length > 0) {
      order.items.forEach((item: any) => {
        // Re-add to cart
        // We know structure is: productId, quantity, price, customizations
        let customizations = {};
        try {
          if (item.customizations) customizations = ((str) => { try { return JSON.parse(str); } catch(e) { return {}; } })(item.customizations);
        } catch(e) {}
        
        addToCart({
          id: String(item.productId),
          name: item.name || 'Unknown Product',
          price: item.price,
          image: item.image || ''
        }, item.quantity || 1, customizations);
      });
      setIsCartOpen(true);
      navigate('/checkout'); // Direct to checkout to make it fast!
    }
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
          <Package className="mr-3 h-8 w-8 text-purple-600" />
          My Orders
        </h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">When you place an order, it will appear here.</p>
            <Button onClick={() => navigate('/')} className="bg-purple-600 hover:bg-purple-700 rounded-full px-8">
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              let address = null;
              try {
                if (order.shippingAddress) address = ((str) => { try { return JSON.parse(str); } catch(e) { return {}; } })(order.shippingAddress);
              } catch(e) {}

              return (
                <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-left">
                  <div className="bg-gray-50 p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-8 w-full md:w-auto">
                      <div>
                        <p className="text-sm text-gray-500 font-medium">ORDER PLACED</p>
                        <p className="font-medium text-gray-900 flex items-center">
                           <Clock className="w-4 h-4 mr-1 text-gray-400" />
                           {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">TOTAL</p>
                        <p className="font-medium text-gray-900">₹{(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-sm text-gray-500 font-medium">SHIP TO</p>
                        <p className="font-medium text-purple-600 cursor-pointer" title={address?.street + ', ' + address?.city}>{address?.fullName || 'Me'}</p>
                      </div>
                      <div className="ml-auto w-full md:w-auto flex items-center justify-between">
                         <div>
                          <p className="text-sm text-gray-500 font-medium">ORDER #</p>
                          <p className="font-medium text-gray-900">{order.id}</p>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                       <div>
                         <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center">
                           {order.status === 'pending' ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mr-2">Preparing</span> : null}
                           {order.status === 'completed' ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">Delivered</span> : null}
                           {order.status === 'cancelled' ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mr-2">Cancelled</span> : null}
                         </h3>
                         <p className="text-sm text-gray-600">
                           {order.items?.length || 0} items
                         </p>
                       </div>
                       <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                         {gstRequested.includes(order.id) ? (
                            <span className="flex items-center text-sm text-green-600 px-3 py-2 bg-green-50 rounded-md">
                              <CheckCircle2 className="w-4 h-4 mr-2" /> GST Requested
                            </span>
                         ) : (
                           <Button onClick={() => handleGstRequest(order.id)} disabled={requestingGst === order.id} variant="outline" className="flex items-center text-gray-700 border-gray-200 hover:bg-gray-50">
                             <FileText className="w-4 h-4 mr-2" />
                             {requestingGst === order.id ? 'Requesting...' : 'Request GST Bill'}
                           </Button>
                         )}
                         <Button onClick={() => handleReorder(order)} variant="outline" className="flex items-center text-purple-600 border-purple-200 hover:bg-purple-50">
                           <RotateCcw className="w-4 h-4 mr-2" />
                           Reorder
                         </Button>
                       </div>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                      {order.items && order.items.map((item: any, idx: number) => {
                        let displayImage = item.image;
                        if (!displayImage && item.customizations && item.customizations !== '{}') {
                          try {
                            const custs = ((str) => { try { return JSON.parse(str); } catch(e) { return {}; } })(item.customizations);
                            const arr = Array.isArray(custs) ? custs : [custs];
                            displayImage = arr.find((c: any) => c.mediaUrl)?.mediaUrl || '';
                          } catch(e) {}
                        }
                        
                        return (
                        <div key={idx} className="flex items-center gap-4 py-4 border-t border-gray-100 first:border-t-0 first:py-0">
                           <div className="h-20 w-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                             {displayImage ? (
                               <>
    <img referrerPolicy="no-referrer" src={displayImage || ''} alt={item.name || 'Product'} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
    <div className="w-full h-full flex items-center justify-center text-gray-400 hidden"><svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
  </>
                             ) : (
                               <div className="w-full h-full flex items-center justify-center text-gray-400">
                                 <Package className="h-8 w-8" />
                               </div>
                             )}
                           </div>
                           <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{item.name || 'Product'}</h4>
                              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                              {item.customizations && item.customizations !== '{}' && (
                                <p className="text-xs text-gray-400 mt-1 flex flex-wrap gap-1">
                                  {(() => {
                                    try {
                                      const custs = ((str) => { try { return JSON.parse(str); } catch(e) { return {}; } })(item.customizations);
                                      const arr = Array.isArray(custs) ? custs : [custs];
                                      return arr.map((c: any, i: number) => (
                                        <span key={i} className="inline-block bg-gray-100 text-gray-600 rounded px-2 py-0.5 border border-gray-200">
                                          {c.placement || 'Custom'} upload
                                        </span>
                                      ));
                                    } catch (e) {
                                      return <span>Customized</span>;
                                    }
                                  })()}
                                </p>
                              )}
                           </div>
                           <div className="text-right font-medium text-gray-900">
                              ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                           </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

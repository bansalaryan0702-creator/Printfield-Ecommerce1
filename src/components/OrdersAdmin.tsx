import { apiFetch } from '../lib/api';
import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Eye, Download, MapPin, User, Package, DownloadCloud, RefreshCw } from 'lucide-react';
// Removed firebase imports

export function OrdersAdmin({ token, userRole = 'admin' }: { token: string, userRole?: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
          const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    setIsIframe(window.self !== window.top);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [userRole, token]);

  const fetchOrders = async () => {
    try {
      const res = await apiFetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrders(data);
    } catch (e: any) {
      if (e.message !== 'Service temporarily unavailable. Please try again later.') {
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  };

  const openOrder = async (id: string) => {
    try {
      const res = await apiFetch(`/api/admin/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedOrder(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      const res = await apiFetch(`/api/admin/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
        setSelectedOrder((prev: any) => prev?.id === id ? { ...prev, status } : prev);
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to update status');
    }
  };

  const getShippingAddress = (str: string) => {
    try { return ((str) => { try { return JSON.parse(str); } catch(e) { return {}; } })(str); } catch { return {}; }
  };

  const handleDownload = async (url: string, defaultName: string = 'download') => {
    try {
      if (url.includes('drive.google.com')) {
        const u = url + (url.includes('?') ? '&' : '?') + 'export=download';
        window.open(u, '_blank');
        return;
      }
      if (url.includes('firebasestorage.googleapis.com')) {
         window.open(url, '_blank');
         return;
      }
      
      const u = url + (url.includes('?') ? '&' : '?') + 'download=1';
      const response = await fetch(u);
      if (!response.ok) {
        throw new Error('File not found. It may have been cleared during a server restart since it was a legacy local upload.');
      }
      const blob = await response.blob();
      const objUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = objUrl;
      
      let fileName = defaultName;
      const disposition = response.headers.get('content-disposition');
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          fileName = matches[1].replace(/['"]/g, '');
        }
      } else {
        const urlParts = url.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        if (lastPart) {
           fileName = decodeURIComponent(lastPart).split('?')[0];
        }
      }
      
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objUrl), 100);
    } catch (e) {
      console.error(e);
      alert('Failed to download the image. The file may have been lost or removed.');
    }
  };

  if (loading) return <div>Loading orders...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-600" /> All Orders
          </h2>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
              <th className="p-4 font-medium">Order ID</th>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Total</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4 font-mono text-gray-600">{o.id}</td>
                <td className="p-4">
                  <div className="font-medium text-gray-900">{o.customerName}</div>
                  <div className="text-gray-500">{o.customerEmail}</div>
                </td>
                <td className="p-4 text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium uppercase tracking-wide">
                    {o.status}
                  </span>
                </td>
                <td className="p-4 font-medium text-gray-900">₹{o.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="p-4">
                  <Button variant="outline" size="sm" onClick={() => openOrder(o.id)}>
                    View Details
                  </Button>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-gray-900">Order #{selectedOrder.id}</h2>
                {['admin', 'manager'].includes(userRole) ? (
                  <select 
                    value={selectedOrder.status}
                    onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                    className="ml-2 bg-gray-50 border border-gray-200 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold uppercase tracking-wider">
                    {selectedOrder.status}
                  </span>
                )}
              </div>
              <Button variant="ghost" onClick={() => setSelectedOrder(null)}>Close</Button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Customer & Shipping */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /> Customer</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="font-medium text-gray-900">{selectedOrder.customerName}</p>
                    <p className="text-gray-600">{selectedOrder.customerEmail}</p>
                    <p className="text-gray-600 pt-2 border-t mt-2">Payment: <span className="font-semibold text-gray-900">{selectedOrder.paymentMethod}</span></p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /> Shipping Address</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    {(() => {
                      const addr = getShippingAddress(selectedOrder.shippingAddress);
                      return (
                        <>
                          <p className="font-medium text-gray-900">{addr.fullName}</p>
                          <p className="text-gray-600">{addr.phone}</p>
                          <p className="text-gray-600 mt-2">{addr.street}</p>
                          <p className="text-gray-600">{addr.city}, {addr.state} {addr.zip}</p>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-gray-400" /> Products Summary</h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y">
                  {selectedOrder.items.map((item: any, idx: number) => {
                    const customizations = item.customizations ? ((str) => { try { return JSON.parse(str); } catch(e) { return {}; } })(item.customizations) : null;
                    return (
                      <div key={idx} className="p-4 bg-white flex flex-col md:flex-row gap-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border shrink-0">
                          <>
    {item.productImage ? <img referrerPolicy="no-referrer" src={item.productImage || ''} alt={item.productName} className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} /> : null}
    <div className={`w-full h-full flex items-center justify-center text-gray-400 ${item.productImage ? 'hidden' : ''}`}><svg className="w-6 h-6 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
  </>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.productName}</h4>
                          <p className="text-sm text-gray-500 mt-1">Quantity: {item.quantity} × ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          
                          {/* Media Download Section */}
                          {customizations && (
                            <div className="mt-4 p-4 bg-purple-50 border border-purple-100 rounded-lg">
                              <h5 className="font-semibold text-purple-900 mb-2">Customer Uploads</h5>
                              {(Array.isArray(customizations) ? customizations : [customizations]).map((cust, i) => (
                                <div key={i} className="mb-3 last:mb-0">
                                  <p className="text-sm text-purple-800 mb-1">Placement: <span className="font-medium">{cust.placement}</span></p>
                                  {cust.mediaUrl && (
                                    <div className="flex items-center gap-3">
                                      <Button 
                                        size="sm" 
                                        onClick={() => handleDownload(cust.mediaUrl)}
                                        className="bg-white text-purple-700 border border-purple-200 hover:bg-purple-100"
                                      >
                                        <DownloadCloud className="w-4 h-4 mr-2" /> Download Original Media
                                      </Button>
                                      <a href={cust.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-600 hover:text-purple-800 underline">
                                        View Image
                                      </a>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="font-bold text-gray-900">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

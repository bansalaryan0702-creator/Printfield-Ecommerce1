import { apiFetch } from '../lib/api';
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Plus, Trash2, Edit2, FileText, Download, X, Search, CheckCircle, ArrowRight, Save } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export function ProposalsAdmin({ token }: { token: string }) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [editingProfile, setEditingProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  
  // New Proposal form inside Left Pane
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');

  // Profile Form State (Right Pane)
  const [profileForm, setProfileForm] = useState({ companyName: '', contactName: '', email: '', phone: '', notes: '' });

  // Add Products Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'select' | 'review'>('select');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [reviewItems, setReviewItems] = useState<any[]>([]);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProfiles();
    fetchProducts();
  }, []);

  const fetchProfiles = async () => {
    try {
      const res = await apiFetch('/api/profiles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setProfiles(await res.json());
    } catch (e) {}
  };

  const fetchProducts = async () => {
    try {
      const res = await apiFetch('/api/products?limit=1000');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.data || []);
      }
    } catch (e) {}
  };

  const fetchProfileDetails = async (id: string) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/profiles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEditingProfile(data);
        setProfileForm({
          companyName: data.profile.companyName || '',
          contactName: data.profile.contactName || '',
          email: data.profile.email || '',
          phone: data.profile.phone || '',
          notes: data.profile.notes || ''
        });
      }
    } catch (e) {}
    setLoading(false);
  };

  const handleCreateProfile = async () => {
    if (!newCompanyName.trim()) return;
    try {
      const res = await apiFetch('/api/profiles', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ companyName: newCompanyName })
      });
      if (res.ok) {
        const data = await res.json();
        setNewCompanyName('');
        setShowNewModal(false);
        fetchProfiles();
        if (data.id) {
          fetchProfileDetails(data.id);
        }
      } else {
        const err = await res.json();
        alert('Failed to create: ' + (err.error || 'Unknown error'));
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editingProfile) return;
    try {
      const res = await apiFetch(`/api/profiles/${editingProfile.profile.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(profileForm)
      });
      if (res.ok) {
        fetchProfiles(); // Update list
        fetchProfileDetails(editingProfile.profile.id); // Refresh details
        alert('Profile saved!');
      }
    } catch (e) {
      alert('Failed to update profile');
    }
  };

  const handleDeleteProfile = async (id: string) => {
    try {
      const res = await apiFetch(`/api/profiles/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setEditingProfile(null);
        fetchProfiles();
      } else {
        console.error('Failed to delete profile', await res.text());
        alert('Failed to delete profile');
      }
    } catch (e) {}
  };

  // Modal Handlers
  const openAddModal = () => {
    setIsAddModalOpen(true);
    setModalStep('select');
    setSearchQuery('');
    setSelectedProductIds(new Set());
    setReviewItems([]);
  };

  const handleToggleProductSelection = (id: string) => {
    const next = new Set(selectedProductIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedProductIds(next);
  };

  const goToReviewStep = () => {
    if (selectedProductIds.size === 0) return;
    const itemsToReview = Array.from(selectedProductIds).map(id => {
      const p = products.find(prod => prod.id === id);
      return {
        productId: id,
        productName: p.name,
        productImage: p.image_url,
        customPrice: p.price,
        customDescription: p.description || '',
        quantity: 1
      };
    });
    setReviewItems(itemsToReview);
    setModalStep('review');
  };

  const updateReviewItem = (index: number, field: string, value: any) => {
    const next = [...reviewItems];
    next[index] = { ...next[index], [field]: value };
    setReviewItems(next);
  };

  const submitSelectedProducts = async () => {
    if (!editingProfile) return;
    setLoading(true);
    try {
      for (const item of reviewItems) {
        await apiFetch(`/api/profiles/${editingProfile.profile.id}/products`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify(item)
        });
      }
      fetchProfileDetails(editingProfile.profile.id);
      setIsAddModalOpen(false);
    } catch (e) {
      alert('Error adding products');
    }
    setLoading(false);
  };

  const handleUpdateExistingProduct = async (itemId: string, updates: any) => {
    try {
      const res = await apiFetch(`/api/profiles/products/${itemId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(updates)
      });
      if (res.ok && editingProfile) {
        // Optimistic UI update could go here, but refetching is safer for now.
        // We shouldn't aggressively fetch on every keystroke, but the existing input uses onChange without debounce.
        // For existing items in the main view, let's keep it simple.
        fetchProfileDetails(editingProfile.profile.id);
      }
    } catch (e) {}
  };

  const handleDeleteExistingProduct = async (itemId: string) => {
    try {
      const res = await apiFetch(`/api/profiles/products/${encodeURIComponent(itemId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok && editingProfile) {
        fetchProfileDetails(editingProfile.profile.id);
      } else if (!res.ok) {
         console.error('Failed to delete item', await res.text());
      }
    } catch (e) {}
  };

  const generatePDF = async () => {
    if (!printRef.current) return;
    try {
      const element = printRef.current;
      
      // Momentarily bring the wrapper onto screen to allow html2canvas to access it, but keep it hidden visually
      const oldTop = element.parentElement!.style.top;
      element.parentElement!.style.top = '0';
      element.parentElement!.style.zIndex = '-9999';

      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      
      element.parentElement!.style.top = oldTop;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Company_Profile.pdf`);
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF');
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())));

  // UI Components
  return (
    <div className="flex flex-col md:flex-row gap-6 h-full min-h-[80vh]">
      {/* LEFT PANE - PROPOSALS LIST */}
      <div className="w-full md:w-1/3 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 pt-2 pb-2">
          <h2 className="font-bold text-lg">Proposals</h2>
          <Button onClick={() => setShowNewModal(true)} size="sm" variant="default" className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-1" /> New
          </Button>
        </div>
        
        {showNewModal && (
          <div className="mb-4 p-4 border border-purple-200 bg-purple-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-sm text-purple-800">New Proposal</h3>
              <button onClick={() => setShowNewModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <input 
              type="text" 
              placeholder="Company Name" 
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-600 outline-none text-sm mb-2"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter') handleCreateProfile() }}
              autoFocus
            />
            <Button onClick={handleCreateProfile} size="sm" className="w-full bg-purple-600 hover:bg-purple-700">Create</Button>
          </div>
        )}
        
        <div className="space-y-2 flex-1">
          {profiles.map(p => (
            <div 
              key={p.id} 
              onClick={() => fetchProfileDetails(p.id)}
              className={`p-3 rounded-lg border cursor-pointer hover:border-purple-300 transition-colors ${editingProfile?.profile?.id === p.id ? 'border-purple-600 bg-purple-50' : 'border-gray-200'}`}
            >
              <div className="font-semibold">{p.companyName}</div>
              <div className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANE - PROFILE EDITOR */}
      <div className="w-full md:w-2/3 flex flex-col gap-6">
        {editingProfile ? (
          <>
            {/* PROFILE INFO FORM */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Company Profile Details</h2>
                  <div className="text-gray-500 text-sm">Update the basic info for your proposal cover page.</div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleDeleteProfile(editingProfile.profile.id)} size="sm" variant="destructive" className="bg-red-50 text-red-600 hover:bg-red-100 border-none">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-md text-sm" value={profileForm.companyName} onChange={e => setProfileForm({...profileForm, companyName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-md text-sm" value={profileForm.contactName} onChange={e => setProfileForm({...profileForm, contactName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" className="w-full px-3 py-2 border rounded-md text-sm" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" className="w-full px-3 py-2 border rounded-md text-sm" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Header text (Optional)</label>
                  <textarea className="w-full px-3 py-2 border rounded-md text-sm" rows={2} value={profileForm.notes} onChange={e => setProfileForm({...profileForm, notes: e.target.value})} />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={handleUpdateProfile} size="sm" className="bg-gray-800 hover:bg-gray-900 border-none">
                  <Save className="w-4 h-4 mr-2" /> Save Profile Details
                </Button>
              </div>
            </div>

            {/* ADDED PRODUCTS SECTION */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex-1">
              <div className="flex justify-between items-center border-b pb-4 mb-4">
                <div>
                  <h3 className="font-bold text-lg">Proposal Items</h3>
                  <div className="text-gray-500 text-sm">Products featured in this proposal</div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={openAddModal} size="sm" variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">
                    <Plus className="w-4 h-4 mr-2" /> Add Products
                  </Button>
                  <Button onClick={generatePDF} size="sm" variant="default" className="bg-purple-600 hover:bg-purple-700">
                    <Download className="w-4 h-4 mr-2" /> Generate PDF
                  </Button>
                </div>
              </div>

              {editingProfile.items.length === 0 ? (
                 <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                    <CheckCircle className="w-12 h-12 mb-3 text-gray-200" />
                    <p>No products added yet.</p>
                    <Button onClick={openAddModal} variant="link" className="text-purple-600">Browse Catalog</Button>
                 </div>
              ) : (
                <div className="space-y-4">
                  {editingProfile.items.map((item: any) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4 flex gap-4">
                      <img referrerPolicy="no-referrer" src={item.productImage || undefined} className="w-24 h-24 object-cover rounded-md border bg-gray-50" />
                      <div className="flex-1 space-y-3">
                        <div className="font-bold text-gray-800">{item.productName}</div>
                        
                        <textarea 
                          className="w-full text-sm border-gray-300 rounded-md focus:ring-purple-500 p-2 border"
                          rows={2}
                          value={item.customDescription}
                          onBlur={(e) => handleUpdateExistingProduct(item.id, { ...item, customDescription: e.target.value })}
                          onChange={(e) => {
                             // Fast local update, push to server on blur
                             item.customDescription = e.target.value; 
                             setEditingProfile({...editingProfile});
                          }}
                          placeholder="Custom description..."
                        />
                        
                        <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Price:</span>
                            <input 
                              type="number" 
                              className="w-24 text-sm border-gray-300 rounded-md focus:ring-purple-500 p-1 border font-medium"
                              value={item.customPrice}
                              onBlur={(e) => handleUpdateExistingProduct(item.id, { ...item, customPrice: parseFloat(e.target.value) })}
                              onChange={(e) => {
                                 item.customPrice = e.target.value;
                                 setEditingProfile({...editingProfile});
                              }}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Qty:</span>
                            <input 
                              type="number" 
                              className="w-20 text-sm border-gray-300 rounded-md focus:ring-purple-500 p-1 border font-medium"
                              value={item.quantity}
                              onBlur={(e) => handleUpdateExistingProduct(item.id, { ...item, quantity: parseInt(e.target.value) })}
                              onChange={(e) => {
                                 item.quantity = e.target.value;
                                 setEditingProfile({...editingProfile});
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteExistingProduct(item.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded h-fit transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  
                  {/* Total Summary */}
                  <div className="flex justify-end p-4 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-800">
                      Total Estimate: ₹{editingProfile.items.reduce((sum: number, item: any) => sum + ((parseFloat(item.customPrice)||0) * (parseInt(item.quantity)||1)), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl min-h-[400px] flex flex-col items-center justify-center text-gray-400">
            <FileText className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">No Proposal Selected</p>
            <p className="text-sm">Select an existing proposal from the left or create a new one.</p>
          </div>
        )}
      </div>

      {/* --- ADD PRODUCTS MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-bold">
                  {modalStep === 'select' ? 'Select Products for Proposal' : 'Review & Edit Selected Products'}
                </h2>
                <div className="text-sm text-gray-500 mt-1">
                  {modalStep === 'select' 
                    ? 'Search and check the products you want to feature.' 
                    : 'Adjust pricing, descriptions, and quantities before adding.'}
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2"><X className="w-6 h-6" /></button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-white shrink">
              
              {modalStep === 'select' && (
                <div className="space-y-6">
                  {/* Live Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input 
                      type="text" 
                      placeholder="Search website products by name or category..." 
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 text-base rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  {/* Product Grid with Checkboxes */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map(p => {
                      const isSelected = selectedProductIds.has(p.id);
                      return (
                        <div 
                          key={p.id} 
                          onClick={() => handleToggleProductSelection(p.id)}
                          className={`relative border rounded-xl p-3 cursor-pointer transition-all hover:shadow-md
                            ${isSelected ? 'ring-2 ring-purple-600 border-transparent bg-purple-50' : 'border-gray-200 hover:border-purple-300'}
                          `}
                        >
                          <div className={`absolute top-2 right-2 w-6 h-6 rounded border flex items-center justify-center transition-colors z-10
                            ${isSelected ? 'bg-purple-600 border-purple-600' : 'bg-white border-gray-300'}
                          `}>
                            {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                          </div>
                          
                          <img referrerPolicy="no-referrer" src={p.image_url || undefined} alt={p.name} className="w-full h-32 object-contain bg-white rounded flex-shrink-0 mb-3 mix-blend-multiply" />
                          <h4 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">{p.name}</h4>
                          <div className="font-bold text-gray-800 text-sm">₹{parseFloat(p.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                      )
                    })}
                    {filteredProducts.length === 0 && (
                      <div className="col-span-full py-12 text-center text-gray-500">No products found matching "{searchQuery}"</div>
                    )}
                  </div>
                </div>
              )}

              {modalStep === 'review' && (
                <div className="space-y-4">
                  {reviewItems.map((item, idx) => (
                    <div key={item.productId} className="flex flex-col sm:flex-row gap-4 border p-4 rounded-xl bg-gray-50">
                      <img referrerPolicy="no-referrer" src={item.productImage || undefined} className="w-20 h-20 sm:w-32 sm:h-32 object-contain bg-white border rounded shadow-sm mix-blend-multiply" />
                      <div className="flex-1 space-y-3">
                        <div className="font-bold text-lg">{item.productName}</div>
                        
                        <div>
                           <label className="text-xs font-semibold text-gray-600 uppercase">Custom Description</label>
                           <textarea 
                            className="w-full text-sm border-gray-300 rounded p-2 border mt-1"
                            rows={3}
                            value={item.customDescription}
                            onChange={(e) => updateReviewItem(idx, 'customDescription', e.target.value)}
                           />
                        </div>
                        
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <label className="text-xs font-semibold text-gray-600 uppercase">Price (₹)</label>
                            <input 
                              type="number" 
                              className="w-full text-sm border-gray-300 rounded p-2 border mt-1 font-medium"
                              value={item.customPrice}
                              onChange={(e) => updateReviewItem(idx, 'customPrice', e.target.value)}
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-semibold text-gray-600 uppercase">Quantity</label>
                            <input 
                              type="number" 
                              className="w-full text-sm border-gray-300 rounded p-2 border mt-1 font-medium"
                              value={item.quantity}
                              onChange={(e) => updateReviewItem(idx, 'quantity', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center rounded-b-xl">
              <div className="text-gray-500 font-medium">
                {modalStep === 'select' && `${selectedProductIds.size} products selected`}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                
                {modalStep === 'select' ? (
                  <Button 
                    onClick={goToReviewStep} 
                    disabled={selectedProductIds.size === 0}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  >
                    Review & Edit Selected <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={submitSelectedProducts} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
                    {loading ? 'Adding...' : 'Confirm Details & Add to Proposal'}
                  </Button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Hidden printable view (PDF Template) */}
      <div className="absolute top-[-9999px] left-[-9999px] z-[-1]">
        {editingProfile && (
          <div ref={printRef} className="w-[800px] bg-white p-12 text-gray-900 font-sans">
            {/* Header */}
            <div className="border-b-2 border-gray-900 pb-6 mb-8 flex justify-between items-end">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">QUOTATION</h1>
                <p className="text-gray-500 text-lg">Prepared for:</p>
                <p className="font-bold text-xl text-gray-900">{editingProfile.profile.companyName}</p>
                {editingProfile.profile.contactName && <p>{editingProfile.profile.contactName}</p>}
                {editingProfile.profile.phone && <p>{editingProfile.profile.phone}</p>}
                {editingProfile.profile.email && <p>{editingProfile.profile.email}</p>}
              </div>
              <div className="text-right">
                <div className="w-full flex justify-end mb-4">
                   <img referrerPolicy="no-referrer" src="/logo.png" alt="Printfield" className="h-12 w-auto object-contain" />
                </div>
                <p className="font-bold text-gray-900 text-xl">Printfield Systems</p>
                <p className="text-gray-500">sales@printfield.com</p>
                <p className="text-gray-500">No 96, Mini Villa, Opp. Chaitnya Swojas, Borewell Road, Whitefield, Bengaluru Karnataka 560066</p>
              </div>
            </div>

            {/* Notes Section */}
            {editingProfile.profile.notes && (
              <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded text-gray-800 text-sm whitespace-pre-wrap">
                {editingProfile.profile.notes}
              </div>
            )}

            {/* Items */}
            <div className="space-y-6">
              {editingProfile.items.map((item: any) => (
                <div key={item.id} className="flex gap-6 border-b border-gray-200 pb-6">
                  <img referrerPolicy="no-referrer" src={item.productImage || undefined} className="w-32 h-32 object-contain bg-white rounded shadow-sm border border-gray-100 mix-blend-multiply" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900 pr-4">{item.productName}</h3>
                      <div className="text-right min-w-[120px]">
                        <div className="text-sm font-semibold text-gray-500">₹{parseFloat(item.customPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} x {item.quantity}</div>
                        <div className="text-lg font-bold text-purple-700">₹{(parseFloat(item.customPrice) * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                    </div>
                    <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap">{item.customDescription}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Totals */}
            <div className="mt-8 pt-6 flex justify-end">
              <div className="w-64">
                <div className="flex justify-between items-center text-2xl font-bold text-gray-900 border-t-2 border-gray-900 pt-4">
                  <span>Total Due:</span>
                  <span className="text-purple-700">₹{editingProfile.items.reduce((sum: number, item: any) => sum + (parseFloat(item.customPrice) * item.quantity), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="mt-16 text-center text-sm text-gray-400">
              This is a generated quotation proposal. Valid for 30 days from creation.
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
import { apiFetch } from '../lib/api';
import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Layout } from '../components/layout/Layout';
import { User, MapPin, Edit2, Trash2, Plus, Save, X, Palette, Eye, ExternalLink } from 'lucide-react';
import { Button } from '@/src/components/ui/button';

export function Profile() {
  const { user, token, setUser } = useContext(AppContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile Form state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', email: '', password: '' });

  // Address state
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<any>({
    id: '', fullName: '', phone: '', street: '', city: '', state: '', zip: ''
  });

  // Saved Designs state
  const [designs, setDesigns] = useState<any[]>([]);
  const [designsLoading, setDesignsLoading] = useState(false);

  useEffect(() => {
    if (!token && !user) {
      navigate('/login?redirect=profile');
      return;
    }
    if (user) {
      setProfileData({ name: user.name || '', email: user.email || '', password: '' });
      setAddresses(user.savedAddresses || []);
      setDesigns(user.savedDesigns || []);
    }
  }, [token, user, navigate]);

  useEffect(() => {
    if (token) {
      const fetchDesigns = async () => {
        setDesignsLoading(true);
        try {
          const res = await apiFetch('/api/users/me/designs', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setDesigns(data.designs || []);
          }
        } catch (err) {
          console.error("Failed to fetch saved designs:", err);
        } finally {
          setDesignsLoading(false);
        }
      };
      fetchDesigns();
    }
  }, [token]);

  const handleDeleteDesign = async (designId: string) => {
    if (!window.confirm("Are you sure you want to delete this saved design?")) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch(`/api/users/me/designs/${designId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete design');
      setDesigns(data.designs);
      setUser({ ...user, savedDesigns: data.designs });
      setSuccess('Design deleted successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const body: any = { name: profileData.name, email: profileData.email };
      if (profileData.password) {
        body.password = profileData.password;
      }
      const res = await apiFetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      setSuccess('Profile updated successfully');
      setIsEditingProfile(false);
      setUser({ ...user, name: profileData.name, email: profileData.email });
      setProfileData({ ...profileData, password: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch('/api/users/me/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ address: currentAddress })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save address');
      setAddresses(data.addresses);
      setUser({ ...user, savedAddresses: data.addresses });
      setIsEditingAddress(false);
      setSuccess('Address saved successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch(`/api/users/me/addresses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete address');
      setAddresses(data.addresses);
      setUser({ ...user, savedAddresses: data.addresses });
      setSuccess('Address deleted successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openAddressEditor = (address?: any) => {
    if (address) {
      setCurrentAddress(address);
    } else {
      setCurrentAddress({
        id: '', fullName: '', phone: '', street: '', city: '', state: '', zip: ''
      });
    }
    setIsEditingAddress(true);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
          <User className="mr-3 h-8 w-8 text-purple-600" />
          My Profile
        </h1>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}
        {success && <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6">{success}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Profile Details */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                 <User className="w-5 h-5 mr-2 text-gray-500" /> Details
              </h2>
              {!isEditingProfile && (
                <Button variant="ghost" onClick={() => setIsEditingProfile(true)} className="text-purple-600">
                  <Edit2 className="w-4 h-4 mr-2" /> Edit
                </Button>
              )}
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password (leave blank to keep current)</label>
                  <input type="password" value={profileData.password} onChange={e => setProfileData({...profileData, password: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
                </div>
                <div className="flex gap-2 justify-end mt-4">
                  <Button type="button" variant="outline" onClick={() => { setIsEditingProfile(false); setProfileData({ name: user.name || '', email: user.email || '', password: '' }); }} disabled={loading}>Cancel</Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Name</p>
                  <p className="text-lg text-gray-900">{user?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Email</p>
                  <p className="text-lg text-gray-900">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Role</p>
                  <p className="text-lg text-gray-900 capitalize">{user?.role}</p>
                </div>
              </div>
            )}
          </div>

          {/* Addresses */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                 <MapPin className="w-5 h-5 mr-2 text-gray-500" /> Saved Addresses
              </h2>
              {!isEditingAddress && (
                <Button variant="ghost" onClick={() => openAddressEditor()} className="text-purple-600">
                  <Plus className="w-4 h-4 mr-2" /> Add 
                </Button>
              )}
            </div>

            {isEditingAddress ? (
              <form onSubmit={handleSaveAddress} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" value={currentAddress.fullName} onChange={e => setCurrentAddress({...currentAddress, fullName: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" required />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input type="tel" value={currentAddress.phone} onChange={e => setCurrentAddress({...currentAddress, phone: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" required />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                    <input type="text" value={currentAddress.street} onChange={e => setCurrentAddress({...currentAddress, street: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input type="text" value={currentAddress.city} onChange={e => setCurrentAddress({...currentAddress, city: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input type="text" value={currentAddress.state} onChange={e => setCurrentAddress({...currentAddress, state: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" required />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                    <input type="text" value={currentAddress.zip} onChange={e => setCurrentAddress({...currentAddress, zip: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" required />
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsEditingAddress(false)} disabled={loading}>Cancel</Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {addresses.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No addresses saved yet.</p>
                ) : (
                  addresses.map((addr) => (
                    <div key={addr.id} className="p-4 border border-gray-200 rounded-xl relative group hover:border-purple-200 transition-colors">
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openAddressEditor(addr)} className="text-gray-400 hover:text-purple-600 p-1">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteAddress(addr.id)} className="text-gray-400 hover:text-red-600 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="font-medium text-gray-900">{addr.fullName}</p>
                      <p className="text-sm text-gray-600 mt-1">{addr.street}</p>
                      <p className="text-sm text-gray-600">{addr.city}, {addr.state} {addr.zip}</p>
                      <p className="text-sm text-gray-600 mt-1 flex items-center"><User className="w-3 h-3 mr-1 inline"/> {addr.phone}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Saved Designs Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Palette className="w-5 h-5 mr-2 text-purple-600" /> My Saved Designs
            </h2>
            <span className="text-xs text-gray-500 bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-semibold">
              Synced with Google Drive
            </span>
          </div>

          {designsLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : designs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
              <Palette className="w-12 h-12 mx-auto text-gray-300 mb-3 animate-pulse" />
              <p className="text-gray-500 font-medium">No saved designs yet.</p>
              <p className="text-sm text-gray-400 mt-1">Go to any product, click "Design Online", and save your custom design!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {designs.map((design) => (
                <div key={design.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-purple-200 transition-all group flex flex-col justify-between">
                  {/* Design Preview */}
                  <div className="relative aspect-square bg-gray-50 flex items-center justify-center p-6 border-b border-gray-100">
                    {design.mediaUrl ? (
                      <img referrerPolicy="no-referrer" 
                        src={design.mediaUrl || undefined} 
                        alt={design.name} 
                        className="max-h-full max-w-full object-contain drop-shadow-md rounded-lg group-hover:scale-105 transition-transform" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-150 rounded-lg">
                        <Palette className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Badge */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm shadow-sm border border-gray-100 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full text-gray-600">
                      {design.placement || 'design'}
                    </div>

                    {/* Delete */}
                    <button 
                      onClick={() => handleDeleteDesign(design.id)}
                      className="absolute top-3 right-3 bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border border-red-100"
                      title="Delete design"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 truncate" title={design.name}>
                        {design.name || 'Custom Design'}
                      </h3>
                      <p className="text-sm text-purple-600 font-semibold mt-0.5">
                        {design.productName}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-2">
                        Saved: {new Date(design.createdAt || Date.now()).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-5 pt-4 border-t border-gray-100 flex gap-2">
                      <Button
                        onClick={() => navigate(`/product/${design.productId}?driveFileId=${design.driveFileId}&mediaUrl=${encodeURIComponent(design.mediaUrl)}&placement=${design.placement}`)}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs py-2 h-9 flex items-center justify-center gap-1 font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" /> Customize
                      </Button>
                      
                      {design.driveFileId && (
                        <a
                          href={`https://drive.google.com/open?id=${design.driveFileId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 px-2.5 rounded-xl flex items-center justify-center transition-colors"
                          title="Open in Google Drive"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

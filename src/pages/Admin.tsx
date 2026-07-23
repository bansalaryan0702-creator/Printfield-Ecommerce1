import { apiFetch } from '../lib/api';
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { UploadCloud, Plus, Trash2, CheckCircle2, Shield, LogIn, Edit2, X, Wand2, Loader2, FileSpreadsheet, PackageSearch, Eye, EyeOff } from 'lucide-react';
import { ProposalsAdmin } from '../components/ProposalsAdmin';
import { OrdersAdmin } from '../components/OrdersAdmin';
import { getFeaturedImage } from '../lib/imageUtils';
import * as XLSX from 'xlsx';

const FIXED_CATEGORIES = [
  "Business Cards",
  "Custom Apparel",
  "Marketing Materials",
  "Corporate Gifts",
  "Signage & Posters",
  "Packaging"
];

// Remove custom Shield as it's imported from lucide-react
export function Admin() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'rfqs' | 'proposals' | 'orders'>('orders');
  const [productViewMode, setProductViewMode] = useState<'form' | 'list'>('form');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Custom Apparel');
  const [subCategory, setSubCategory] = useState('');
  const [price, setPrice] = useState('');
  const [minQty, setMinQty] = useState('');
  const [qtyMultiple, setQtyMultiple] = useState('');
  const [description, setDescription] = useState('');
  const [cardDescription, setCardDescription] = useState('');
  const [isGeneratingCardDesc, setIsGeneratingCardDesc] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [features, setFeatures] = useState('');
  const [imageUrlsText, setImageUrlsText] = useState('');
  const [isDisabled, setIsDisabled] = useState(false);
  const [isBestseller, setIsBestseller] = useState(false);
  const [inMegaMenu, setInMegaMenu] = useState(false);
  const [badge, setBadge] = useState('');
  
  // List Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Color state
  const [colors, setColors] = useState<{name: string, hex: string, image: string, mockupImage?: string}[]>([]);
  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#000000');
  const [colorImage, setColorImage] = useState('');
  const [colorMockupImage, setColorMockupImage] = useState('');
  const [savedGlobalColors, setSavedGlobalColors] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/colors')
      .then(res => res.json())
      .then(data => {
        if (data.colors) setSavedGlobalColors(data.colors);
      })
      .catch(console.error);
  }, []);

  
  // Variations state
  const [variations, setVariations] = useState<any[]>([]);
  const [variationCat, setVariationCat] = useState('');
  
  // AI Import State
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');

  // Batch Category Import State
  const [batchCategoryUrl, setBatchCategoryUrl] = useState('');
  const [isBatchImporting, setIsBatchImporting] = useState(false);
  const [batchImportLog, setBatchImportLog] = useState<string[]>([]);
  const [batchImportProgress, setBatchImportProgress] = useState({ current: 0, total: 0 });

  // Auth state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const handleIdPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('admin_token', data.token);
        setToken(data.token);
      } else {
        alert(data.error);
      }
    } catch (error: any) {
      console.error(error);
      alert('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if token exists
    const adminToken = localStorage.getItem('admin_token');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // We don't use apiFetch for FormData directly because of Content-Type headers
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        body: formData
      });
      
      const data = await res.json();
      if (res.ok && data.url) {
        setter(data.url);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    }
  };

  const handleMultipleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const adminToken = localStorage.getItem('admin_token');
    let urls = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const formData = new FormData();
        formData.append('file', files[i]);
        
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${adminToken}` },
          body: formData
        });
        
        const data = await res.json();
        if (res.ok && data.url) {
          urls.push(data.url);
        }
      } catch (err) {
        console.error(err);
      }
    }
    
    if (urls.length > 0) {
      setImageUrlsText(prev => prev ? prev + '\n' + urls.join('\n') : urls.join('\n'));
    }
  };

  
  const handleGenerateCardDescription = async () => {
    if (!description || !name) {
      alert("Please enter Product Name and Full Description first.");
      return;
    }
    setIsGeneratingCardDesc(true);
    try {
      const res = await apiFetch('/api/ai/generate-card-description', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, category, description })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate description');
      setCardDescription(data.description);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsGeneratingCardDesc(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
  };

  const decodedToken = token ? (() => { 
    try { 
      const parts = token.split('.');
      if (parts.length === 3) {
        
        let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const pad = b64.length % 4;
        if (pad) {
          b64 += '='.repeat(4 - pad);
        }
        return JSON.parse(atob(b64));

      }
      return null;
    } catch (e) { 
      return null; 
    } 
  })() : null;
  const userRole = decodedToken?.role || 'admin';

  useEffect(() => {
    if (userRole === 'employee' && activeTab !== 'orders') {
      setActiveTab('orders');
    } else if (userRole === 'manager' && activeTab === 'products') {
      setActiveTab('orders');
    }
  }, [userRole, activeTab]);

  const handleAddColor = () => {
    if (colorName && colorHex && colorImage) {
      setColors([...colors, { name: colorName, hex: colorHex, image: colorImage, mockupImage: colorMockupImage }]);
      
      // Save globally
      const newGlobal = [...savedGlobalColors];
      if (!newGlobal.find(c => c.name.toLowerCase() === colorName.toLowerCase())) {
        const updatedGlobal = [...newGlobal, { name: colorName, hex: colorHex, image: colorImage, mockupImage: colorMockupImage }];
        setSavedGlobalColors(updatedGlobal);
        apiFetch('/api/colors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ colors: updatedGlobal })
        }).catch(console.error);
      }
      
      setColorName('');
      setColorHex('#000000');
      setColorImage('');
      setColorMockupImage('');
    } else {
      alert("Please provide name, hex code and image for the color.");
    }
  };
  
  // Ignore old handleAddColor
  const oldHandleAddColor = () => {
    if (colorName && colorHex && colorImage) {
      setColors([...colors, { name: colorName, hex: colorHex, image: colorImage }]);
      setColorName('');
      setColorHex('#000000');
      setColorImage('');
    } else {
      alert("Please provide name, hex code and image for the color.");
    }
  };

  const handleRemoveColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  const handleAddCategory = () => {
    if (variationCat) {
      if (!variations.find(v => v.name.toLowerCase() === variationCat.toLowerCase())) {
        setVariations([...variations, { 
          id: variationCat.toLowerCase().replace(/\s+/g, '-'), 
          name: variationCat, 
          options: [] 
        }]);
      }
      setVariationCat('');
    }
  };

  const [optionInputs, setOptionInputs] = useState<Record<number, {name: string, price: string}>>({});

  const handleUpdateOptionInput = (catIdx: number, field: string, value: string) => {
    setOptionInputs(prev => ({
      ...prev,
      [catIdx]: {
        ...prev[catIdx],
        [field]: value
      }
    }));
  };

  const handleAddOptionToCat = (catIdx: number) => {
    const inputs = optionInputs[catIdx];
    if (inputs && inputs.name && inputs.price) {
      const newVars = [...variations];
      newVars[catIdx].options.push({ name: inputs.name, price: parseFloat(inputs.price) });
      setVariations(newVars);
      setOptionInputs(prev => ({
        ...prev,
        [catIdx]: { name: '', price: '' }
      }));
    } else {
      alert("Please provide option name and price.");
    }
  };

  const handleRemoveCategory = (catIdx: number) => {
    const newVars = [...variations];
    newVars.splice(catIdx, 1);
    setVariations(newVars);
  };


  const handleEditVariationOption = (catIdx: number, optIndex: number, field: 'name' | 'price', value: string) => {
    const newVars = [...variations];
    if (field === 'price') {
      newVars[catIdx].options[optIndex][field] = value ? parseInt(value, 10) : 0;
    } else {
      newVars[catIdx].options[optIndex][field] = value;
    }
    setVariations(newVars);
  };

  const handleRemoveVariationOption = (catIdx: number, optIndex: number) => {
    const newVars = [...variations];
    newVars[catIdx].options.splice(optIndex, 1);
    setVariations(newVars);
  };

  const [aiVariationInput, setAiVariationInput] = useState<Record<number, string>>({});
  const [isProcessingAiVars, setIsProcessingAiVars] = useState<Record<number, boolean>>({});

  const handleNormalizeExistingOptions = (catIdx: number) => {
    const newVars = [...variations];
    const cat = newVars[catIdx];
    if (cat.options.length < 2) {
      alert("Need at least 2 options to normalize prices.");
      return;
    }

    const prices = cat.options.map((opt: any) => opt.price);
    const minPrice = Math.min(...prices);

    if (minPrice === 0) {
      alert("The cheapest option is already 0. No normalization needed.");
      return;
    }

    setPrice(minPrice.toString());

    cat.options = cat.options.map((opt: any) => ({
      ...opt,
      price: opt.price - minPrice
    }));

    setVariations(newVars);
    alert(`Successfully normalized! Set base product price to ₹${minPrice} and adjusted options relative to it.`);
  };

  const handleProcessAiVariations = async (catIdx: number) => {
    const inputText = aiVariationInput[catIdx];
    if (!inputText || !inputText.trim()) {
      alert("Please enter some options and prices (e.g., '2x2 is 1500, 2x3 is 1800')");
      return;
    }

    setIsProcessingAiVars(prev => ({ ...prev, [catIdx]: true }));
    try {
      const res = await apiFetch('/api/ai/normalize-variations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: inputText })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process with AI');

      const parsedOptions = data.options;
      if (!Array.isArray(parsedOptions) || parsedOptions.length === 0) {
        throw new Error("AI could not find any options or prices in your text. Please try with clearer text (e.g. 'Size 2x2 is 1500 and 2x3 is 1800')");
      }

      const minPrice = Math.min(...parsedOptions.map((o: any) => o.fullPrice || 0));

      const newVars = [...variations];
      const normalizedOptions = parsedOptions.map((o: any) => ({
        name: o.name,
        price: (o.fullPrice || 0) - minPrice
      }));

      newVars[catIdx].options = [...newVars[catIdx].options, ...normalizedOptions];
      setVariations(newVars);

      setPrice(minPrice.toString());

      setAiVariationInput(prev => ({ ...prev, [catIdx]: '' }));
      alert(`AI parsed and added ${normalizedOptions.length} options! Set base product price to ₹${minPrice} and made options relative.`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessingAiVars(prev => ({ ...prev, [catIdx]: false }));
    }
  };

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  const fetchProducts = async (currentPage = page, search = searchQuery, categoryFilter = filterCategory) => {
    try {
      const qs = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        includeDisabled: 'true'
      });
      if (search) qs.append('search', search);
      if (categoryFilter && categoryFilter !== 'all') qs.append('category', categoryFilter);

      const res = await apiFetch(`/api/products?${qs.toString()}`);
      if (res.ok) {
        const resData = await res.json();
        setProducts(resData.data || []);
        setTotalPages(resData.totalPages);
        setTotalCount(resData.total);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRfqs = async () => {
    try {
      const res = await apiFetch('/api/rfqs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRfqs(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAIImport = async () => {
    if (!importUrl || !token) return;
    setIsImporting(true);
    setImportError('');
    try {
      const res = await apiFetch('/api/import-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: importUrl })
      });
      
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to import product');
      
      const { data } = resData;
      
      setName(data.name || '');
      setDescription(data.description || '');
      setCardDescription(data.cardDescription || '');
      setPrice(data.price?.toString() || '');
      setMinQty(data.minQty?.toString() || '');
      setQtyMultiple(data.qtyMultiple?.toString() || '');
      if (data.category) {
        setCategory(data.category);
      }
      setSubCategory(data.subCategory || '');
      setImageUrl(data.image || '');
      if (data.images && data.images.length > 0) {
        setImageUrlsText(Array.isArray(data.images) ? data.images.join('\n') : (typeof data.images === 'string' ? data.images : ''));
      } else {
        setImageUrlsText('');
      }
      if (data.features && data.features.length > 0) {
        setFeatures(Array.isArray(data.features) ? data.features.join(', ') : (typeof data.features === 'string' ? data.features : ''));
      } else {
        setFeatures('');
      }
      if (data.colors && data.colors.length > 0) {
        setColors(data.colors.map((c: any) => ({ name: c.name || '', hex: c.hex || '#000000', image: '' })));
      } else {
        setColors([]);
      }
      if (data.variations && data.variations.length > 0) {
        setVariations(data.variations.map((v: any) => ({
          id: v.id || v.name?.toLowerCase().replace(/\s+/g, '-'),
          name: v.name || '',
          options: v.options || []
        })));
      } else {
        setVariations([]);
      }
      
      setImportUrl('');
      // smooth scroll to form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      setImportError(error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleBatchCategoryImport = async () => {
    if (!batchCategoryUrl || !token) return;
    setIsBatchImporting(true);
    setBatchImportLog([]);
    setBatchImportProgress({ current: 0, total: 0 });

    const addLog = (msg: string) => setBatchImportLog(prev => [...prev, msg]);

    try {
      addLog('Fetching category links...');
      const scrapeRes = await apiFetch('/api/scrape-category-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: batchCategoryUrl })
      });
      
      const scrapeData = await scrapeRes.json();
      if (!scrapeRes.ok) throw new Error(scrapeData.error || 'Failed to fetch category links');

      const urls = scrapeData.urls || [];
      addLog(`Found ${urls.length} product links. Starting import...`);
      setBatchImportProgress({ current: 0, total: urls.length });

      for (let i = 0; i < urls.length; i++) {
        const prodUrl = urls[i];
        addLog(`[${i + 1}/${urls.length}] Importing: ${prodUrl}`);
        setBatchImportProgress(prev => ({ ...prev, current: i + 1 }));

        try {
          // Import product logic using our internal endpoint
          const importRes = await apiFetch('/api/import-product', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ url: prodUrl })
          });
          const importData = await importRes.json();
          if (!importRes.ok) {
             addLog(`   -> Error importing: ${importData.error || 'Failed'}`);
             continue;
          }
          
          const data = importData.data;
          
          // Construct product object to save
          const payload = {
            name: data.name || '',
            description: data.description || '',
            card_description: data.cardDescription || '',
            price: parseFloat(data.price || '0'),
            min_qty: parseInt(data.minQty || '1', 10),
            qty_multiple: parseInt(data.qtyMultiple || '1', 10),
            category: data.category || '',
            sub_category: data.subCategory || '',
            image: data.image || '',
            images: data.images || [],
            features: data.features ? (Array.isArray(data.features) ? data.features.join(', ') : data.features) : '',
            colors: data.colors ? data.colors.map((c: any) => ({ name: c.name || '', hex: c.hex || '#000000', image: '' })) : [],
            variations: data.variations ? data.variations.map((v: any) => ({
              id: v.id || v.name?.toLowerCase().replace(/\s+/g, '-'),
              name: v.name || '',
              options: v.options || []
            })) : []
          };

          const saveRes = await apiFetch('/api/products', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });

          if (!saveRes.ok) {
            const saveErr = await saveRes.json();
            addLog(`   -> Error saving: ${saveErr.error || 'Failed'}`);
          } else {
            addLog(`   -> Successfully saved "${payload.name}"!`);
          }
        } catch (err: any) {
           addLog(`   -> Exception importing: ${err.message}`);
        }
      }

      addLog('Batch import completed!');
      fetchProducts(); // Refresh the list
    } catch (err: any) {
      addLog(`Error: ${err.message}`);
    } finally {
      setIsBatchImporting(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setIsImporting(true);
    setImportError('');
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      const res = await apiFetch('/api/products/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ products: json })
      });
      
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to bulk import products');
      
      alert(`Successfully imported ${resData.count} products!`);
      if (activeTab === 'products') {
        fetchProducts(1);
        setPage(1);
      }
    } catch(err: any) {
      setImportError(err.message || 'Error uploading file');
    } finally {
      setIsImporting(false);
      if (e.target) e.target.value = ''; // Reset input
    }
  };

  useEffect(() => {
    if (token) {
      if (activeTab === 'products') {
        fetchProducts(page);
      } else {
        fetchRfqs();
      }
    }
  }, [token, page, activeTab, searchQuery, filterCategory]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      let finalColors = [...colors];
      if (colorName && colorHex) {
        finalColors.push({ name: colorName, hex: colorHex, image: colorImage, mockupImage: colorMockupImage });
        setColors(finalColors);
        setColorName('');
        setColorHex('#000000');
        setColorImage('');
        setColorMockupImage('');
      }
      const formatImageUrl = (url: string) => {
        const driveIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
        if (driveIdMatch && driveIdMatch[1]) {
          return `/api/proxy-image/${driveIdMatch[1]}`;
        }
        return url;
      };

      const images = imageUrlsText.split('\n').map(url => formatImageUrl(url.trim())).filter(Boolean);
      const formattedMainImage = formatImageUrl(imageUrl);
      
      const productData = {
        name,
        category,
        subCategory,
        price: parseFloat(price),
        minQty: minQty ? parseInt(minQty, 10) : undefined,
        qtyMultiple: qtyMultiple ? parseInt(qtyMultiple, 10) : undefined,
        description,
        cardDescription,
        image: formattedMainImage,
        images,
        isDisabled,
        isBestseller,
        inMegaMenu,
        badge,
        colors: finalColors,
        variations
      };

      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Failed to ${editingId ? 'update' : 'add'} product`);
      }
      
      // Reset form
      setName('');
      setCategory('Custom Apparel');
      setSubCategory('');
      setPrice('');
      setMinQty('');
      setQtyMultiple('');
      setDescription('');
      setCardDescription('');
      setImageUrl('');
      setImageUrlsText('');
      setFeatures('');
      setColors([]);
      setVariations([]);
      setIsDisabled(false);
      setIsBestseller(false);
      setInMegaMenu(false);
      setBadge('');
      setEditingId(null);
      setProductViewMode('list');
      setPage(1);
      setSearchQuery('');
      setFilterCategory('all');
      
      fetchProducts(1, '', 'all');
      alert(`Product ${editingId ? 'updated' : 'added'} successfully!`);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleEditProduct = (p: any) => {
    setProductViewMode('form');
    setEditingId(p.id);
    setName(p.name);
    setCategory(p.category || 'Custom Apparel');
    setSubCategory(p.subCategory || '');
    setPrice(p.price?.toString() || '');
    setMinQty(p.minQty?.toString() || '');
    setQtyMultiple(p.qtyMultiple?.toString() || '');
    setDescription(p.description || '');
    setCardDescription(p.cardDescription || '');
    setImageUrl(p.image || '');
    setImageUrlsText(Array.isArray(p.images) ? p.images.join('\n') : (typeof p.images === 'string' ? p.images : ''));
    setFeatures(Array.isArray(p.features) ? p.features.join(', ') : (typeof p.features === 'string' ? p.features : ''));
    setColors(p.colors || []);
    setVariations(p.variations || []);
    setIsDisabled(!!p.isDisabled);
    setIsBestseller(!!p.isBestseller);
    setInMegaMenu(!!p.inMegaMenu);
    setBadge(p.badge || '');
    // smooth scroll to top where form is
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setProductViewMode('list');
    setEditingId(null);
    setName('');
    setCategory('Custom Apparel');
    setSubCategory('');
    setPrice('');
    setMinQty('');
    setQtyMultiple('');
    setDescription('');
    setCardDescription('');
    setImageUrl('');
    setImageUrlsText('');
    setFeatures('');
    setColors([]);
    setVariations([]);
    setIsDisabled(false);
    setIsBestseller(false);
    setInMegaMenu(false);
    setBadge('');
  };

  const handleDeleteProduct = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Bypass window.confirm for iframe environments
    // if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await apiFetch(`/api/products/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchProducts(); // Re-fetch all so that pagination matches
      } else {
        const contentType = res.headers.get ? res.headers.get('content-type') : null;
        if (contentType && contentType.includes('application/json')) {
          const err = await res.json();
          console.error(`Delete response NOT ok (${res.status}): ` + JSON.stringify(err));
        } else {
          const txt = await res.text();
          console.error(`Server returned unexpected page (Status ${res.status}): ` + txt.substring(0, 80));
        }
      }
    } catch (error: any) {
       console.error("Error deleting product: ", error);
    }
  };

  const handleToggleEnableProduct = async (id: string, currentStatus: boolean) => {
    try {
      const res = await apiFetch(`/api/products/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isDisabled: !currentStatus })
      });
      if (res.ok) {
        fetchProducts();
      } else {
        alert("Failed to toggle visibility status");
      }
    } catch (error) {
       console.error(error);
       alert("Error toggling status.");
    }
  };

  if (!token) {
    return (
      <Layout>
        <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl shadow-xl border border-gray-100 text-center">
          <UploadCloud className="h-16 w-16 text-purple-600 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Staff Portal</h1>
          <p className="text-gray-600 mb-8">Sign in to access the staff dashboard.</p>
          
          <form onSubmit={handleIdPasswordLogin} className="space-y-4 mb-6">
            <div>
              <input 
                type="text" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-left"
                placeholder="Email/Username" />

            </div>
            <div>
              <input 
                type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-left"
                placeholder="Password" />

            </div>
            <Button type="submit" className="w-full py-4 text-lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
            <p className="text-gray-600">Overview & Management</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right">
               <p className="text-sm font-medium text-gray-900 capitalize">{userRole}</p>
             </div>
             <Button variant="ghost" onClick={handleSignOut}>Sign Out</Button>
          </div>
        </div>

        <div className="flex gap-4 border-b border-gray-200 mb-8">
          {userRole === 'admin' && (
            <button
              onClick={() => setActiveTab('products')}
              className={`pb-4 px-4 font-medium transition-colors border-b-2 ${
                activeTab === 'products' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Products
            </button>
          )}
          {['admin', 'manager'].includes(userRole) && (
            <>
              <button
                onClick={() => setActiveTab('rfqs')}
                className={`pb-4 px-4 font-medium transition-colors border-b-2 ${
                  activeTab === 'rfqs' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                Bulk Quotation Requests
              </button>
              <button
                onClick={() => setActiveTab('proposals')}
                className={`pb-4 px-4 font-medium transition-colors border-b-2 ${
                  activeTab === 'proposals' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                Proposals & Profiles
              </button>
            </>
          )}
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-4 px-4 font-medium transition-colors border-b-2 ${
              activeTab === 'orders' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Orders
          </button>
        </div>

        {activeTab === 'orders' && <OrdersAdmin token={token} userRole={userRole} />}
        {activeTab === 'proposals' && ['admin', 'manager'].includes(userRole) && <ProposalsAdmin token={token} />}

        {activeTab === 'products' && userRole === 'admin' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {productViewMode === 'form' ? (editingId ? 'Edit Product' : 'Add New Product') : 'Manage Products'}
            </h2>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setProductViewMode('form')}
                className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${
                  productViewMode === 'form' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {editingId ? 'Edit Product Form' : 'Add Product'}
              </button>
              <button
                onClick={() => setProductViewMode('list')}
                className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${
                  productViewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Manage Products
              </button>
            </div>
          </div>
          
          {productViewMode === 'form' && (
          <div className="max-w-4xl mx-auto space-y-6">
            
{/*             AI Auto Import */}
            {!editingId && (
              <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl shadow-sm border border-purple-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Wand2 className="w-24 h-24 text-purple-900" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2 relative z-10">
                  <Wand2 className="h-5 w-5 text-purple-600" />
                  Auto-Import with AI
                </h2>
                <p className="text-sm text-gray-600 mb-4 relative z-10">Paste a link to any product from another website. We'll automatically extract the details, pricing, and images.</p>
                <div className="flex gap-2 isolate relative z-10">
                  <input 
                    type="url" 
                    value={importUrl} 
                    onChange={e => setImportUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white" />

                  <Button onClick={handleAIImport} disabled={isImporting || !importUrl} className="shrink-0 gap-2">
                    {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    Import
                  </Button>
                </div>
                {importError && (
                  <p className="text-red-500 text-xs mt-2 relative z-10">{importError}</p>
                )}
              </div>
            )}

            {!editingId && (
              <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl shadow-sm border border-blue-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Wand2 className="w-24 h-24 text-blue-900" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2 relative z-10">
                  <Wand2 className="h-5 w-5 text-blue-600" />
                  Batch Import Printo Category
                </h2>
                <p className="text-sm text-gray-600 mb-4 relative z-10">Paste a Printo.in category URL (e.g. https://printo.in/categories/signages-and-banners). We will extract all products in it and import them.</p>
                <div className="flex gap-2 isolate relative z-10">
                  <input 
                    type="url" 
                    value={batchCategoryUrl} 
                    onChange={e => setBatchCategoryUrl(e.target.value)}
                    placeholder="https://printo.in/categories/..."
                    disabled={isBatchImporting}
                    className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" />

                  <Button onClick={handleBatchCategoryImport} disabled={isBatchImporting || !batchCategoryUrl} className="shrink-0 gap-2 bg-blue-600 hover:bg-blue-700">
                    {isBatchImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    Batch Import
                  </Button>
                </div>
                {batchImportProgress.total > 0 && (
                  <div className="mt-4 relative z-10">
                    <div className="h-2 w-full bg-blue-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${(batchImportProgress.current / batchImportProgress.total) * 100}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{batchImportProgress.current} of {batchImportProgress.total} products processed</p>
                  </div>
                )}
                {batchImportLog.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-900 rounded-lg max-h-48 overflow-y-auto text-xs font-mono text-gray-300 relative z-10 space-y-1">
                    {batchImportLog.map((log, i) => (
                      <div key={i}>{log}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

{/*             Excel Bulk Upload */}
            {!editingId && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <FileSpreadsheet className="w-24 h-24 text-green-900" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2 relative z-10">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  Bulk Import (Excel/CSV)
                </h2>
                <p className="text-sm text-gray-600 mb-4 relative z-10">Upload an Excel (.xlsx) or CSV file with product data.</p>
                <input 
                  type="file" 
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleBulkImport} />

                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isImporting} 
                  variant="outline"
                  className="w-full gap-2 relative z-10 border-green-200 hover:bg-green-50 text-green-700 hover:text-green-800"
                >
                  {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                  {isImporting ? 'Processing...' : 'Upload File'}
                </Button>
              </div>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                {editingId ? <Edit2 className="h-5 w-5 text-purple-600" /> : <Plus className="h-5 w-5 text-purple-600" />}
                {editingId ? 'Edit Product' : 'Add New Product'}
              </h2>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input 
                    type="text" required value={name} onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="e.g. Premium Cotton T-shirt"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-semibold">Category</label>
                    <select
                      value={FIXED_CATEGORIES.includes(category) ? category : "custom"}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "custom") {
                          setCategory("");
                        } else {
                          setCategory(val);
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white mb-2"
                    >
                      <option value="" disabled>Select a Category</option>
                      {FIXED_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="custom">+ Create Custom Category...</option>
                    </select>

                    {(!FIXED_CATEGORIES.includes(category) || category === "") && (
                      <input 
                        type="text" 
                        required 
                        value={category} 
                        onChange={e => setCategory(e.target.value)}
                        className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="Type new custom category name"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category (Optional)</label>
                    <input 
                      type="text" value={subCategory} onChange={e => setSubCategory(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="e.g. T-Shirts"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input 
                    type="number" required value={price} onChange={e => setPrice(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />

                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Quantity (Optional)</label>
                    <input 
                      type="number" value={minQty} onChange={e => setMinQty(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
                      placeholder="e.g. 50"

                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Qty Multiple (Optional)</label>
                    <input 
                      type="number" value={qtyMultiple} onChange={e => setQtyMultiple(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="e.g. 50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Image URL</label>
                  <div className="flex gap-2">
                    <input 
                      type="url" required value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="https://..."
                    />
                    <label className="cursor-pointer bg-gray-100 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center gap-1">
                      <UploadCloud className="w-4 h-4" /> Upload
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, setImageUrl)} />
                    </label>
                  </div>
                </div>
                
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images (Optional)</label>
                  <p className="text-xs text-gray-500 mb-2">Paste image URLs here, one per line.</p>
                  <div className="flex flex-col gap-2">
                    <textarea 
                      value={imageUrlsText} onChange={e => setImageUrlsText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none min-h-[80px]"
                      placeholder="Enter one URL per line"
                    />
                    <label className="cursor-pointer self-start bg-gray-100 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center gap-1">
                      <UploadCloud className="w-4 h-4" /> Upload Multiple Images
                      <input type="file" multiple className="hidden" accept="image/*" onChange={handleMultipleFileUpload} />
                    </label>
                  </div>

                  {imageUrlsText.trim() && (
                    <div className="mt-2 text-xs text-purple-600 font-medium">
                      {imageUrlsText.split('\n').map(u => u.trim()).filter(Boolean).length} image(s) added
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Card Description (Short)</label>
                    <button 
                      type="button" 
                      onClick={handleGenerateCardDescription} 
                      disabled={isGeneratingCardDesc}
                      className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 bg-purple-50 px-2 py-1 rounded disabled:opacity-50"
                    >
                      <Wand2 className="w-3 h-3" />
                      {isGeneratingCardDesc ? 'Generating...' : 'AI Generate'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">Shown only on product cards in the listing. If empty, the main description is used.</p>
                  <textarea 
                    value={cardDescription} onChange={e => setCardDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none h-16"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
                  <textarea 
                    required value={description} onChange={e => setDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none h-24"
                  />
                </div>
                
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Product Colors (Optional)</label>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text" value={colorName} onChange={e => setColorName(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="Color Name (e.g. Red)"
                      />
                      <input 
                        type="color" value={colorHex} onChange={e => setColorHex(e.target.value)}
                        className="w-full h-8 cursor-pointer rounded border border-gray-300"
                        title="Choose Color"
                      />
                    </div>
                    <div className="flex gap-2 mb-2">
                      <input 
                        type="url" value={colorImage} onChange={e => setColorImage(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="Product Image URL for this color"
                      />
                      <label className="cursor-pointer bg-gray-100 px-2 py-1.5 border border-gray-300 rounded text-sm font-medium hover:bg-gray-200 flex items-center">
                        <UploadCloud className="w-4 h-4" />
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, setColorImage)} />
                      </label>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <input 
                        type="url" value={colorMockupImage} onChange={e => setColorMockupImage(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="Mockup Image URL for this color (Optional)"
                      />
                      <label className="cursor-pointer bg-gray-100 px-2 py-1.5 border border-gray-300 rounded text-sm font-medium hover:bg-gray-200 flex items-center">
                        <UploadCloud className="w-4 h-4" />
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, setColorMockupImage)} />
                      </label>
                    </div>
                    <Button type="button" variant="outline" onClick={handleAddColor} className="w-full text-sm py-1 h-8">
                      <Plus className="h-4 w-4 mr-1" /> Add Color
                    </Button>
                  </div>

                  {colors.length > 0 && (
                    <div className="space-y-2 mt-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Added Colors:</p>
                      {colors.map((c, i) => (
                        <div key={i} className="flex items-center justify-between bg-white p-2 border border-gray-200 rounded-lg text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: c.hex }}></span>
                            <span className="font-medium">{c.name}</span>
                            {c.image && <span className="text-xs text-blue-500 ml-2">Has Image</span>}
                            {c.mockupImage && <span className="text-xs text-green-500 ml-2">Has Mockup</span>}
                          </div>
                          <button type="button" onClick={() => handleRemoveColor(i)} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-4 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Product Variations (Optional)</label>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <input 
                      type="text" value={variationCat} onChange={e => setVariationCat(e.target.value)} 
                      placeholder="New Category Name (e.g. Material)" 
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={handleAddCategory}>
                      <Plus className="w-4 h-4 mr-2" /> Add Category
                    </Button>
                  </div>

                  {variations.length > 0 && (
                    <div className="space-y-4 mt-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Categories & Options:</p>
                      {variations.map((v, catIdx) => (
                        <div key={catIdx} className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                            <h4 className="font-semibold text-gray-900">{v.name}</h4>
                            <button type="button" onClick={() => handleRemoveCategory(catIdx)} className="text-red-500 hover:text-red-700 p-1">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="space-y-2 mb-3">
                            {v.options.map((opt: any, optIdx: number) => (
                              <div key={optIdx} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-gray-50 p-2 rounded text-sm">
                                <input 
                                  type="text" 
                                  value={opt.name} 
                                  onChange={(e) => handleEditVariationOption(catIdx, optIdx, 'name', e.target.value)}
                                  className="flex-1 bg-white border border-gray-200 px-2 py-1 rounded outline-none focus:border-purple-400"
                                  placeholder="Option name"
                                />
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center bg-white border border-gray-200 rounded px-2 focus-within:border-purple-400 overflow-hidden">
                                    <span className="text-gray-500 mr-1">+₹</span>
                                    <input 
                                      type="number" 
                                      value={opt.price === 0 ? '' : opt.price} 
                                      onChange={(e) => handleEditVariationOption(catIdx, optIdx, 'price', e.target.value)}
                                      className="w-20 py-1 outline-none"
                                      placeholder="0"
                                    />
                                  </div>
                                  <button type="button" onClick={() => handleRemoveVariationOption(catIdx, optIdx)} className="text-red-500 hover:text-red-700 p-1 shrink-0">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {v.options.length === 0 && (
                              <p className="text-xs text-gray-400 italic">No options added yet. Add below.</p>
                            )}
                          </div>

                          {/* AI Smart Price Normalizer Helper */}
                          <div className="mb-4 bg-purple-50 p-3 rounded-lg border border-purple-100">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-purple-800 flex items-center gap-1">
                                <Wand2 className="w-3.5 h-3.5" /> AI Smart Price Normalizer
                              </span>
                              {v.options.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleNormalizeExistingOptions(catIdx)}
                                  className="text-[11px] font-medium text-purple-700 bg-white hover:bg-purple-100 px-2 py-1 rounded border border-purple-200 transition"
                                  title="Make the cheapest option +₹0 and adjust others relative to it"
                                >
                                  Normalize Existing Prices
                                </button>
                              )}
                            </div>
                            <p className="text-[11px] text-purple-600 mb-2 leading-relaxed">
                              Paste/type full prices (e.g. <span className="font-semibold font-mono bg-purple-100 px-1 rounded text-purple-800">2x2: 1500, 2x3: 1800</span>), and AI will parse them, make the cheapest option <span className="font-semibold">+₹0</span> (included in base price), calculate differences, and update product price!
                            </p>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="e.g. Size 2x2 is 1500 and 2x3 is 1800"
                                value={aiVariationInput[catIdx] || ''}
                                onChange={(e) => setAiVariationInput(prev => ({ ...prev, [catIdx]: e.target.value }))}
                                className="flex-1 px-3 py-1.5 border border-purple-200 bg-white rounded-lg text-xs focus:ring-2 focus:ring-purple-500 outline-none placeholder-purple-300"
                              />
                              <button
                                type="button"
                                disabled={isProcessingAiVars[catIdx]}
                                onClick={() => handleProcessAiVariations(catIdx)}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-xs transition disabled:opacity-50 flex items-center gap-1 shrink-0 shadow-sm"
                              >
                                {isProcessingAiVars[catIdx] ? 'Adding...' : 'AI Normalize & Add'}
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={optionInputs[catIdx]?.name || ''} 
                              onChange={e => handleUpdateOptionInput(catIdx, 'name', e.target.value)} 
                              placeholder="Option Name (e.g. Glossy)" 
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <input 
                              type="number" 
                              value={optionInputs[catIdx]?.price || ''} 
                              onChange={e => handleUpdateOptionInput(catIdx, 'price', e.target.value)} 
                              placeholder="Additional Price" 
                              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <Button type="button" variant="outline" size="sm" onClick={() => handleAddOptionToCat(catIdx)}>
                              Add
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-4 mt-4 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isDisabled} 
                      onChange={e => setIsDisabled(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Disable product on website</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isBestseller} 
                      onChange={e => setIsBestseller(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Mark as Bestseller</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={inMegaMenu} 
                      onChange={e => setInMegaMenu(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Show in Mega Menu (Navigation dropdown)</span>
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Badge (Optional)</label>
                    <select
                      value={badge}
                      onChange={e => setBadge(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                    >
                      <option value="">No Badge (Default)</option>
                      <option value="Popular">Popular</option>
                      <option value="Recommended">Recommended</option>
                      <option value="NEW">NEW</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button type="submit" className="flex-1 py-3 text-lg">
                    {editingId ? 'Update Product' : 'Add Product'}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={handleCancelEdit} className="py-3 text-lg px-6">
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
          )}

          {productViewMode === 'list' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900 shrink-0">Existing Products ({totalCount})</h2>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <input 
                    type="text" 
                    placeholder="Search products..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none w-full sm:w-64"
                  />

                  <select 
                    value={filterCategory} 
                    onChange={e => setFilterCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none w-full sm:w-auto"
                  >
                    <option value="all">All Categories</option>
                    {FIXED_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    {/* Gather other custom categories that exist in products but are not in FIXED_CATEGORIES */}
                    {Array.from(new Set(products.map(p => p.category).filter(Boolean))).filter(cat => !FIXED_CATEGORIES.includes(cat)).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-4 mb-6">
                {products.map(p => (
                  <div key={p.id} className={`flex gap-4 p-4 border border-gray-100 rounded-xl transition-colors ${p.isDisabled ? 'bg-gray-100 opacity-60' : 'hover:bg-gray-50'}`}>
                    <div className="relative">
                      {getFeaturedImage(p) ? (
                        <img 
                          referrerPolicy="no-referrer" 
                          src={getFeaturedImage(p) || ''} 
                          alt={p.name} 
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200 bg-gray-50"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-20 h-20 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-400 ${getFeaturedImage(p) ? 'hidden' : ''}`}>
                        <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      {p.isDisabled && (
                        <div className="absolute top-1 left-1 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                          DISABLED
                        </div>
                      )}
                      {p.isBestseller && !p.isDisabled && (
                        <div className="absolute top-1 left-1 bg-yellow-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                          BESTSELLER
                        </div>
                      )}
                      {p.inMegaMenu && (
                        <div className="absolute top-6 left-1 bg-purple-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                          MEGA MENU
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-900">{p.name}</h3>
                        <div className="flex gap-2">
                          <button onClick={() => handleToggleEnableProduct(p.id, !!p.isDisabled)} className="text-gray-500 hover:bg-gray-200 p-1.5 rounded-md transition-colors" title={p.isDisabled ? "Enable" : "Disable"}>
                            {p.isDisabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                          <button onClick={() => handleEditProduct(p)} className="text-purple-500 hover:bg-purple-50 p-1.5 rounded-md transition-colors" title="Edit">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={(e) => handleDeleteProduct(p.id, e)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-purple-600 font-medium uppercase tracking-wider">{p.category}{p.subCategory ? ` / ${p.subCategory}` : ''}</p>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{p.description}</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">₹{p.price.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
                {products.length === 0 && (
                  <div className="text-center py-20 text-gray-400">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No products found.</p>
                  </div>
                )}
              </div>
              
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6 pt-6 border-t border-gray-100">
                  <Button 
                    variant="outline" 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <Button 
                    variant="outline" 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
          )}
        </div>
        )}
        
        {activeTab === 'rfqs' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Bulk Quotation Requests</h2>
          {rfqs.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No quotation requests yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Contact</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requirements</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rfqs.map(rfq => (
                    <tr key={rfq.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(rfq.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">{rfq.name}</div>
                        <div className="text-gray-500">{rfq.email}</div>
                        <div className="text-gray-500">{rfq.phone}</div>
                        {rfq.company && <div className="text-gray-400 text-xs mt-1">Company: {rfq.company}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-sm">
                        {rfq.requirements && (
                          <div className="mb-2"><strong>Req:</strong> {rfq.requirements}</div>
                        )}
                        {rfq.description && (
                          <p className="text-gray-600 line-clamp-3">{rfq.description}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}
      </div>
    </Layout>
  );
}

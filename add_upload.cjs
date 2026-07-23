const fs = require('fs');
let adminCode = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

// 1. Add handleImageUpload function
adminCode = adminCode.replace('const handleSignOut = () => {', `const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
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
          'Authorization': \`Bearer \${adminToken}\`
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
          headers: { 'Authorization': \`Bearer \${adminToken}\` },
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
      setImageUrlsText(prev => prev ? prev + '\\n' + urls.join('\\n') : urls.join('\\n'));
    }
  };

  const handleSignOut = () => {`);

// 2. Add file input for Main Image
adminCode = adminCode.replace('<input \n                    type="url" required value={imageUrl} onChange={e => setImageUrl(e.target.value)}', 
`<div className="flex gap-2">
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
                  {/* `);

adminCode = adminCode.replace('placeholder="https://..."\n                  />', 'placeholder="https://..."\n                  /> */}');

// 3. Add file input for Additional Images
adminCode = adminCode.replace('<textarea \n                    value={imageUrlsText} onChange={e => setImageUrlsText(e.target.value)}',
`<div className="flex flex-col gap-2">
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
                  {/* `);

adminCode = adminCode.replace('placeholder="Enter one URL per line"\n                  />', 'placeholder="Enter one URL per line"\n                  /> */}');

// 4. Add file input for Color Image
adminCode = adminCode.replace('<input \n                      type="url" value={colorImage} onChange={e => setColorImage(e.target.value)}',
`<div className="flex gap-2 mb-2">
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
                    {/* `);

adminCode = adminCode.replace('placeholder="Product Image URL for this color"\n                    />', 'placeholder="Product Image URL for this color"\n                    /> */}');

fs.writeFileSync('src/pages/Admin.tsx', adminCode);

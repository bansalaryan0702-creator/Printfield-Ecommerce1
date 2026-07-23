const fs = require('fs');
let code = fs.readFileSync('src/components/DesignEditor.tsx', 'utf8');

// Add state
const stateTarget = `  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});`;
const stateReplacement = `  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});\n  const [uploadedImages, setUploadedImages] = useState<string[]>([]);`;
code = code.replace(stateTarget, stateReplacement);

// Add to handleUploadLocalImage
const uploadTarget = `        const maxDim = 300;`;
const uploadReplacement = `        setUploadedImages(prev => prev.includes(src) ? prev : [...prev, src]);\n        const maxDim = 300;`;
code = code.replace(uploadTarget, uploadReplacement);

// Add helper function to insert uploaded image directly
const helperTarget = `  const handleUploadLocalImage = (e: React.ChangeEvent<HTMLInputElement>) => {`;
const helperReplacement = `  const handleAddImageFromSrc = (src: string) => {
    const img = new Image();
    if (src && !src.startsWith("data:")) img.crossOrigin = "anonymous";
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      const maxDim = 300;
      if (w > h) {
        if (w > maxDim) {
          h = (h * maxDim) / w;
          w = maxDim;
        }
      } else {
        if (h > maxDim) {
          w = (w * maxDim) / h;
          h = maxDim;
        }
      }
      const newLayer: DesignLayer = {
        id: "img-" + Date.now(),
        type: "image",
        name: "Image Layer",
        x: 400,
        y: 400,
        width: w,
        height: h,
        rotation: 0,
        src: src,
        imageElement: img,
        brightness: 100,
        contrast: 100,
        saturate: 100,
        grayscale: 0,
        sepia: 0,
        blur: 0,
        hueRotate: 0
      };
      const updated = [...layers, newLayer];
      setLayers(updated);
      setSelectedLayerId(newLayer.id);
      saveHistoryState(updated);
    };
    img.src = src;
  };

  const handleUploadLocalImage = (e: React.ChangeEvent<HTMLInputElement>) => {`;
code = code.replace(helperTarget, helperReplacement);

// Add UI
const uiTarget = `              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleUploadLocalImage}
                className="hidden"
                accept="image/*"
              />
            </div>
          )}`;
const uiReplacement = `              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleUploadLocalImage}
                className="hidden"
                accept="image/*"
              />
              
              {uploadedImages.length > 0 && (
                <div className="mt-4 border-t border-slate-800 pt-4">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-3">Recently Uploaded</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {uploadedImages.map((src, i) => (
                      <div 
                        key={i} 
                        onClick={() => handleAddImageFromSrc(src)}
                        className="aspect-square bg-slate-950 rounded-lg border border-slate-800 overflow-hidden cursor-pointer hover:border-purple-500 transition-colors"
                      >
                        <img src={src} alt="Uploaded" className="w-full h-full object-contain" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}`;
code = code.replace(uiTarget, uiReplacement);

fs.writeFileSync('src/components/DesignEditor.tsx', code);

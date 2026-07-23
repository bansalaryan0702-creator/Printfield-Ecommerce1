import { ErrorBoundary } from "../components/ErrorBoundary";
import { Shirt3DPreview } from "../components/Shirt3DPreview";
import { Apparel2DMockup } from "../components/Apparel2DMockup";
import { apiFetch, apiClient } from '../lib/api';
import React, { useState, useRef, useEffect, useContext, useMemo } from "react";
import { cleanAndDeduplicateImages, isProductImage } from "@/src/lib/imageUtils";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/src/components/layout/Layout";
import { Product, PopularProducts } from "@/src/data/products";
import { Button } from "@/src/components/ui/button";
import { ProductCard } from "@/src/components/ui/ProductCard";
import {
  ArrowLeft,
  Check,
  Truck,
  Shield,
  UploadCloud,
  ShoppingCart,
  ChevronDown,
  FileText,
  Trash2,
  Sparkles,
  Search,
  Loader2,
  X,
  AlertTriangle,
  CheckCircle,
  Image as ImageIcon,
  Scissors,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useProducts } from "../hooks/useProducts";
import { AppContext } from "../context/AppContext";
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
import { DesignEditor } from "../components/DesignEditor";
import { ShapeCutCanvas } from "../components/ShapeCutCanvas";
import { googleProvider, signInWithGoogle, getGoogleAccessToken } from '../lib/firebase';
import { getColorStyle, isColorCategory } from "@/src/utils/colorUtils";

type PlacementId =
  | "front-full"
  | "front-chest"
  | "back-full"
  | "sleeve-left"
  | "sleeve-right"
  | "front"
  | "back"
  | "generic";

const getOptimizedImage = (url: string | null | undefined, width: number) => {
  if (!url) return url;
  if (url.includes('printo-s3.dietpixels.net') && !url.includes('w=')) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}w=${width}`;
  }
  return url;
};

interface Artwork {
  file: File;
  previewUrl: string;
  scale: number;
  fileName: string;
  isImage?: boolean;
  driveFileId?: string;
  mediaUrl?: string;
  dpi?: number;
  warningLevel?: 'not_printable' | 'poor' | 'fair' | 'good';
}

const APPAREL_PLACEMENTS: Record<
  string,
  { label: string; view: string; baseClass: string }
> = {
  "front-chest": {
    label: "Left Chest Logo",
    view: "front",
    baseClass: "w-[12%] aspect-square -translate-y-[85%] translate-x-[85%]",
  },
  "front-full": {
    label: "Full Chest",
    view: "front",
    baseClass: "w-1/3 aspect-square -translate-y-1/4",
  },
  "back-full": {
    label: "Back Print",
    view: "back",
    baseClass: "w-1/3 aspect-square -translate-y-1/4",
  },
  "sleeve-left": {
    label: "Left Sleeve",
    view: "left",
    baseClass: "w-[14%] aspect-square -translate-y-[10%] translate-x-[110%] skew-y-6 rotate-[-5deg]",
  },
  "sleeve-right": {
    label: "Right Sleeve",
    view: "right",
    baseClass: "w-[14%] aspect-square -translate-y-[10%] -translate-x-[110%] -skew-y-6 rotate-[5deg]",
  },
};

const BUSINESS_CARD_PLACEMENTS: Record<
  string,
  { label: string; view: string; baseClass: string }
> = {
  front: {
    label: "Front Design",
    view: "front",
    baseClass: "w-[80%] max-w-[400px] dynamic-aspect",
  },
  back: {
    label: "Back Design",
    view: "back",
    baseClass: "w-[80%] max-w-[400px] dynamic-aspect",
  },
};

const GENERIC_PLACEMENT = { label: "Front", view: "front", baseClass: "w-2/3 aspect-square" };

export function ProductDetail() {
  const { productId } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [productsLoading, setProductsLoading] = useState(true);

  const { addToCart, token, user } = useContext(AppContext);
  const { products: allProducts } = useProducts();
  const [isAdding, setIsAdding] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    status: "idle" | "uploading" | "complete" | "error";
    percentage: number;
    currentFile: string;
    currentIndex: number;
    totalFiles: number;
  }>({
    status: "idle",
    percentage: 0,
    currentFile: "",
    currentIndex: 0,
    totalFiles: 0,
  });

  const suggestedProducts = useMemo(() => {
    if (!product || !allProducts.length) return [];
    const sameCategory = allProducts.filter(p => p.id !== product.id && p.category === product.category);
    if (sameCategory.length >= 4) return sameCategory.slice(0, 4);
    
    const otherProducts = allProducts.filter(p => p.id !== product.id && !sameCategory.find(s => s.id === p.id));
    return [...sameCategory, ...otherProducts].slice(0, 4);
  }, [allProducts, product]);

  const [previewMode, setPreviewMode] = useState<"gallery" | "artwork" | "3d">("gallery");
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [activePlacement, setActivePlacement] =
    useState<PlacementId>("generic");
  const [artworks, setArtworks] = useState<Record<string, Artwork>>({});
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, any>>({});
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const handleImageLoaded = (imgUrl: string) => {
    if (!imgUrl) return;
    setLoadedImages(prev => ({ ...prev, [imgUrl]: true }));
  };

  const validImages = useMemo(() => {
    if (!product) return [];
    const baseImages = Array.isArray(product.images) ? product.images : [];
    const allImgs = product.image ? [product.image, ...baseImages] : baseImages;
    const cleaned = cleanAndDeduplicateImages(allImgs);
    const available = cleaned.length > 0 ? cleaned : allImgs.filter(Boolean);
    return available.filter(img => typeof img === 'string' && img.trim() !== '' && !brokenImages[img]);
  }, [product, brokenImages]);

  const rawDisplayImage = useMemo(() => {
    if (previewMode === "artwork") {
      if (selectedColor?.mockupImage) return selectedColor.mockupImage;
      if (selectedColor?.image) return selectedColor.image;
      
      const tshirtImg = validImages.find(img => {
        const lower = img.toLowerCase();
        return !lower.includes("chart") && !lower.includes("size") && !lower.includes("guide");
      });
      return tshirtImg || product?.image || validImages[0] || null;
    }
    
    return selectedImage || (selectedColor ? selectedColor.image : (product ? product.image : null));
  }, [previewMode, selectedColor, selectedImage, product, validImages]);

  const displayImage = useMemo(() => {
    if (rawDisplayImage && isProductImage(rawDisplayImage) && !brokenImages[rawDisplayImage]) {
      return rawDisplayImage;
    }
    return validImages[0] || null;
  }, [rawDisplayImage, brokenImages, validImages]);

  const active3DColor = useMemo(() => {
    if (selectedColor) {
      if (selectedColor.hex && typeof selectedColor.hex === 'string') return selectedColor.hex;
      if (selectedColor.name) {
        const style = getColorStyle(selectedColor.name);
        if (style.background) return style.background;
      }
    }
    if (selectedVariations) {
      for (const varVal of Object.values(selectedVariations) as any[]) {
        if (varVal && varVal.name) {
          const style = getColorStyle(varVal.name);
          if (style.background) return style.background;
        }
      }
    }
    return '#ffffff';
  }, [selectedColor, selectedVariations]);

  const hasNoValidProductImage = !displayImage || !!brokenImages[displayImage] || Boolean(product?.isDisabled);

  const handleImageError = (imgUrl: string) => {
    if (!imgUrl) return;
    setBrokenImages(prev => ({ ...prev, [imgUrl]: true }));
    if (selectedImage === imgUrl) {
      setSelectedImage(null);
    }
  };
  
  // Business Card states
  const [cardSides, setCardSides] = useState<"front" | "front-back">("front");
  const [cardQuantity, setCardQuantity] = useState<number>(100);
  
  // Generic Quantity state
  const [baseQuantity, setBaseQuantity] = useState<number>(1);
  const [minDynamicQty, setMinDynamicQty] = useState<number>(1);
  const [minDynamicPages, setMinDynamicPages] = useState<number>(1);
  
  // Brochure states
  const [brochureFold, setBrochureFold] = useState<string>("Tri Fold");
  const [brochureStyle, setBrochureStyle] = useState<string>("A5");
  const [brochureQty, setBrochureQty] = useState<number>(25);

  const [standeeSize, setStandeeSize] = useState<string>("2x5");
  const [standeeQty, setStandeeQty] = useState<number>(1);
  
  const [documentPages, setDocumentPages] = useState<number>(1);

  const [acrylicShape, setAcrylicShape] = useState<string>("Square/Rectangle");

  const [cardShape, setCardShape] = useState<string>("Standard Rectangle");

  const isBrochure = product?.name?.toLowerCase().includes("brochure") || product?.name?.toLowerCase().includes("pamphlet") || product?.name?.toLowerCase().includes("flyer") || (product?.category?.toLowerCase() === "marketing" && !product?.name?.toLowerCase().includes("standee"));
  const isStandee = product?.name?.toLowerCase().includes("standee");
  const isAcrylic = product?.name?.toLowerCase().includes("acrylic");
  const isUnboundDocument = product?.name === 'Unbound Document Printing';
  const isCenterPinBinding = product?.name === 'Center Pin Binding';
  const isDocumentPrinting = isUnboundDocument || isCenterPinBinding;
  // ID cards have the same size and properties as Business Cards in this context
  const isActualBusinessCard = product?.category === "Business Cards";
  const isIdCard = product?.name?.toLowerCase().includes("id card") || product?.category?.toLowerCase().includes("id card") || product?.name?.toLowerCase().includes("badge") || product?.name?.toLowerCase().includes("pvc");
  const isVisitingCard = product?.name?.toLowerCase().includes("visiting") || product?.name?.toLowerCase().includes("business card") || product?.category?.toLowerCase().includes("visiting") || product?.category?.toLowerCase().includes("business card") || product?.name?.toLowerCase().includes("shape cut");
  const isDieCutProduct = Boolean(product?.name?.toLowerCase().includes("die cut") || product?.name?.toLowerCase().includes("shape cut") || product?.category?.toLowerCase().includes("shape cut") || cardShape.includes("Die Cut"));
  const isBusinessCard = isActualBusinessCard || isIdCard || isVisitingCard || isDieCutProduct;

  const pNameLower = product?.name?.toLowerCase() || "";
  const pCatLower = product?.category?.toLowerCase() || "";
  const isCustomShapeCard = Boolean(
    pNameLower.includes("u-shape") ||
    pNameLower.includes("u shape") ||
    pNameLower.includes("arch") ||
    pNameLower.includes("half moon") ||
    pNameLower.includes("leaf") ||
    pNameLower.includes("die cut") ||
    pNameLower.includes("shape cut") ||
    pNameLower.includes("custom shape") ||
    pNameLower.includes("cutout") ||
    pNameLower.includes("single round") ||
    pNameLower.includes("1 round") ||
    pNameLower.includes("2 round") ||
    pNameLower.includes("oval") ||
    pNameLower.includes("circle") ||
    pCatLower.includes("shape cut") ||
    (cardShape && cardShape !== "Standard Rectangle" && cardShape !== "Standard" && cardShape !== "Standard Business Card" && cardShape !== "Square")
  );

  useEffect(() => {
    if (product) {
      const pName = (product.name || "").toLowerCase();
      const pCat = (product.category || "").toLowerCase();
      if (pName.includes("u-shape") || pName.includes("u shape") || pName.includes("arch") || pName.includes("half moon")) {
        setCardShape("U-Shape");
      } else if (pName.includes("leaf")) {
        setCardShape("Leaf Cut");
      } else if (pName.includes("single round") || pName.includes("1 round")) {
        setCardShape("Single Round Corner");
      } else if (pName.includes("round corner") || pName.includes("rounded corner")) {
        setCardShape("Rounded Corners");
      } else if (pName.includes("circle") || pName.includes("round card")) {
        setCardShape("Circle");
      } else if (pName.includes("square")) {
        setCardShape("Square");
      } else if (pName.includes("oval")) {
        setCardShape("Oval Cut");
      } else if (pName.includes("die cut") || pName.includes("shape cut") || pName.includes("custom shape") || pName.includes("cutout") || pCat.includes("shape cut")) {
        setCardShape("Die Cut / Custom Shape");
      }
    }
  }, [product]);
  
  const minQtyDefault = isIdCard ? 1 : 100;
  const qtyMultipleDefault = isIdCard ? 1 : 100;
  
  const brochureQuantities = [25, 50, 100, 200, 500, 1000, 2000, 5000];

  const getActiveVariations = () => {
    if (!product || !Array.isArray(product.variations)) return selectedVariations;
    const isBillBook = product?.name?.toLowerCase().includes("bill book") || product?.category?.toLowerCase().includes("bill book");
    
    let has2Duplicate = false;
    product.variations.forEach((vc: any) => {
       const isPadOrType = vc?.name?.toLowerCase().includes("pad") || vc?.name?.toLowerCase().includes("type") || vc?.name?.toLowerCase().includes("duplicate");
       const sel = selectedVariations[vc.id];
       if (isPadOrType && sel && sel.name) {
          if (sel.name.toLowerCase().includes("+2 duplicate")) {
             has2Duplicate = true;
          }
       }
    });

    const active: Record<string, any> = {};
    product.variations.forEach((vc: any) => {
       const is2ndDuplicateConfig = vc?.name?.toLowerCase().includes("2nd duplicate");
       if (isBillBook && is2ndDuplicateConfig && !has2Duplicate) {
          return; // skip
       }
       if (selectedVariations[vc.id]) {
          active[vc.id] = selectedVariations[vc.id];
       }
    });
    return active;
  };

  const calculatePrice = () => {
    if (!product) return 0;
    
    if (isDocumentPrinting) {
       const activeVars = getActiveVariations();
       const sizeOpt: any = Object.values(activeVars).find((o: any) => o.name === 'A3 ' || o.name === 'A3' || o.name === 'A4 ' || o.name === 'A4');
       const printTypeOpt: any = Object.values(activeVars).find((o: any) => o?.name?.toLowerCase().includes("multi-colour") || o?.name?.toLowerCase().includes("black & white"));

       const isA3 = sizeOpt?.name?.trim() === 'A3';
       const isColour = printTypeOpt?.name?.toLowerCase().includes('multi-colour');
       
       const discountScale = Math.min(Math.floor(documentPages / 5), 6);
       let discountPerPage = 0;
       if (isColour) {
         discountPerPage = discountScale * 2;
       } else {
         discountPerPage = discountScale * 0.5;
       }

       if (isUnboundDocument) {
           let pagePrice = 6;
           if (!isA3 && !isColour) pagePrice = 6;
           if (!isA3 && isColour) pagePrice = 28;
           if (isA3 && !isColour) pagePrice = 10;
           if (isA3 && isColour) pagePrice = 43;

           pagePrice -= discountPerPage;
           return pagePrice * documentPages * baseQuantity;
       } else {
           let basePrice = Number(product.price);
           let pageVariationAddon = 0;
           let copyVariationAddon = 0;

           Object.entries(activeVars).forEach(([categoryId, opt]: [string, any]) => {
              const vc = product.variations.find((v:any) => v.id === categoryId);
              if (vc && vc?.name?.toLowerCase().includes('cover')) {
                 copyVariationAddon += Number(opt.price || 0);
              } else {
                 pageVariationAddon += Number(opt.price || 0);
              }
           });
           
           let pagePrice = (basePrice + pageVariationAddon) / 4;
           pagePrice -= discountPerPage;
           if (pagePrice < 0) pagePrice = 0;

           let actualPages = Math.max(documentPages, 4);

           return (pagePrice * actualPages + copyVariationAddon) * baseQuantity;
       }
    }

    let basePrice = Number(product.price);
    let variationAddon = 0;
    
    Object.values(getActiveVariations()).forEach((opt: any) => {
      if (opt && typeof opt.price !== 'undefined') {
        variationAddon += Number(opt.price);
      }
    });
    
    if (isStandee) {
      if (basePrice > 0) {
         const unitPrice = basePrice / (product.minQty || 1);
         return Math.round((unitPrice + variationAddon) * standeeQty);
      }
      let sizePrice = 1750;
      if (standeeSize === "2.5x6") sizePrice = 1900;
      if (standeeSize === "3x6") sizePrice = 2150;
      if (standeeSize === "4x6") sizePrice = 2950;
      
      let discount = 0;
      if (standeeQty >= 2 && standeeQty <= 5) discount = 0.05;
      else if (standeeQty > 5 && standeeQty <= 10) discount = 0.10;
      else if (standeeQty > 10) discount = 0.15; // > 10 bulk orders
      
      let calculatedPrice = sizePrice * standeeQty * (1 - discount);
      return Math.round(calculatedPrice + variationAddon * standeeQty);
    }

    if (isBrochure) {
      if (basePrice > 0) {
         const multiplier = brochureQty / (product.minQty || 1);
         return Math.round((basePrice + variationAddon) * multiplier);
      }
      
      let foldBase = 385; // A5 Tri/Bi
      if (brochureFold === "Z Fold") foldBase = 370;
      
      // Basic size adjustments
      // A5 and A6 use base pricing.
      if (brochureStyle === "DL") foldBase = 560; // DL specific pricing
      
      const qtySteps = [25, 50, 100, 200, 500, 1000, 2000, 5000];
      const discounts = [0, 0.11, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40];
      let stepIndex = qtySteps.indexOf(brochureQty);
      if (stepIndex === -1) stepIndex = 0;
      
      const setsOf25 = brochureQty / 25;
      const discount = discounts[stepIndex];
      let calculatedPrice = foldBase * setsOf25 * (1 - discount);
      return Math.round(calculatedPrice + variationAddon * setsOf25);
    }
    
    if (isBusinessCard) {
      if (basePrice > 0) {
         const multiplier = cardQuantity / (product.minQty || 1);
         let calcPrice = basePrice * multiplier;
         if (cardSides === "front-back") calcPrice *= 1.2;
         return Math.round(calcPrice + variationAddon * multiplier);
      }

      const setsOf100 = Math.ceil(cardQuantity / 100);
      let calculatedPrice = 150 * setsOf100;
      
      if (cardSides === "front-back") {
        calculatedPrice *= 1.2;
      }
      return calculatedPrice + variationAddon * setsOf100;
    }
    
    const multiplier = baseQuantity / (product.minQty || 1);
    return Math.round((basePrice + variationAddon) * multiplier);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAdding(true);

    try {
      let customizations = null;
      const artworkEntries = Object.entries(artworks);
      const totalFiles = artworkEntries.length;

      if (totalFiles > 0) {
        setUploadProgress({
          status: "uploading",
          percentage: 0,
          currentFile: (artworkEntries[0][1] as any).file.name,
          currentIndex: 0,
          totalFiles,
        });

        const uploadedCustomizations = [];
        let fileIndex = 0;
        for (const [placementId, artwork] of artworkEntries as [
          string,
          any,
        ][]) {
          let mediaUrl = "";

          if (artwork.mediaUrl) {
            // Already hosted online! Just link it.
            mediaUrl = artwork.mediaUrl;
          } else {
            const file = artwork.file;
            const chunkSize = 512 * 1024; // 512KB
            const totalChunks = Math.ceil(file.size / chunkSize);
            const basePercent = (fileIndex / totalFiles) * 100;

            if (totalChunks <= 1) {
               const formData = new FormData();
               formData.append("file", file);
               
               const res = await apiClient.post("/api/upload", formData, {
                 onUploadProgress: (progressEvent) => {
                   const filePercent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size));
                   const overallPercent = Math.min(
                     99,
                     Math.round(basePercent + (filePercent / totalFiles))
                   );
                   setUploadProgress({
                     status: "uploading",
                     percentage: overallPercent,
                     currentFile: file.name,
                     currentIndex: fileIndex,
                     totalFiles,
                   });
                 }
               });
               
               const data = res.data;
               if (res.status !== 200 && res.status !== 201) {
                 throw new Error(data.error || "Failed to upload artwork");
               }
               mediaUrl = data.url;
            } else {
               const uploadId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
               for (let i = 0; i < totalChunks; i++) {
                 const start = i * chunkSize;
                 const end = Math.min(start + chunkSize, file.size);
                 const chunk = file.slice(start, end);
                 const formData = new FormData();
                 formData.append("chunk", chunk);
                 formData.append("uploadId", uploadId);
                 formData.append("chunkIndex", i.toString());
                 formData.append("totalChunks", totalChunks.toString());
                 formData.append("originalName", file.name);

                 const res = await apiClient.post("/api/upload/chunk", formData, {
                   onUploadProgress: (progressEvent) => {
                     const chunkLoadedPercent = progressEvent.loaded / (progressEvent.total || chunk.size);
                     const currentFilePercent = ((i + chunkLoadedPercent) / totalChunks) * 100;
                     const overallPercent = Math.min(
                       99,
                       Math.round(basePercent + (currentFilePercent / totalFiles))
                     );
                     setUploadProgress({
                       status: "uploading",
                       percentage: overallPercent,
                       currentFile: file.name,
                       currentIndex: fileIndex,
                       totalFiles,
                     });
                   }
                 });
                 
                 const data = res.data;
                 if (res.status !== 200 && res.status !== 201) {
                   throw new Error(data.error || "Failed to upload chunk");
                 }
                 if (data.complete) mediaUrl = data.url;
               }
            }
          }

          uploadedCustomizations.push({
            placement: placementId,
            mediaUrl,
            scale: artwork.scale,
            x: artwork.x,
            y: artwork.y,
          });
          
          fileIndex++;
        }

        customizations = uploadedCustomizations;

        // Set to 100% complete
        setUploadProgress({
          status: "complete",
          percentage: 100,
          currentFile: "",
          currentIndex: totalFiles,
          totalFiles,
        });
        
        // Let user see 100% complete for a moment
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      let finalProduct = { ...product, selectedColor };
      finalProduct.price = calculatePrice();
      
      const activeVars = getActiveVariations();
      const variantSuffix = Object.keys(activeVars).length > 0
          ? ` - ${Object.values(activeVars).map((opt: any) => opt.name).filter(Boolean).join(', ')}`
          : '';

      if (isBusinessCard) {
         finalProduct.name = `${product.name} (${cardQuantity} cards)${variantSuffix}`;
      } else if (isBrochure) {
         finalProduct.name = `${product.name} (${brochureQty} brochures, ${brochureStyle}, ${brochureFold})${variantSuffix}`;
      } else if (isStandee) {
         finalProduct.name = `${product.name} (${standeeQty} standees, ${standeeSize} ft)${variantSuffix}`;
      } else if (isAcrylic) {
         const suffixText = baseQuantity > 1 ? ` (${baseQuantity} pcs)` : '';
         finalProduct.name = `${product.name}${suffixText} (Shape: ${acrylicShape})${variantSuffix}`;
      } else if (isDocumentPrinting) {
         finalProduct.name = `${product.name} (${documentPages} Pages, ${baseQuantity} Copies)${variantSuffix}`;
      } else {
         const suffixText = baseQuantity > 1 ? ` (${baseQuantity} pcs)` : '';
         finalProduct.name = `${product.name}${suffixText}${variantSuffix}`;
      }

      addToCart(
        finalProduct,
        1,
        customizations ? JSON.stringify(customizations) : null,
      );
      
      if (totalFiles > 0) {
        setUploadProgress({
          status: "idle",
          percentage: 0,
          currentFile: "",
          currentIndex: 0,
          totalFiles: 0,
        });
      }
    } catch (e: any) {
      setUploadProgress({
        status: "error",
        percentage: 0,
        currentFile: "",
        currentIndex: 0,
        totalFiles: 0,
      });
      alert(e.response?.data?.error || e.message);
    } finally {
      setIsAdding(false);
    }
  };

  const applyProductData = (foundData: Product) => {
    let found = { ...foundData };

    // Inject missing business card variations if they are completely empty
    const isActualBusinessCard = found?.category === "Business Cards";
    const isVisitingCard = found?.name?.toLowerCase().includes("visiting") || found?.name?.toLowerCase().includes("business card") || found?.category?.toLowerCase().includes("visiting") || found?.category?.toLowerCase().includes("business card");
    
    if ((isActualBusinessCard || isVisitingCard) && (!found.variations || found.variations.length === 0)) {
        found.variations = [
            {
                id: "paper-quality",
                name: "Paper Quality",
                options: [
                    { name: "Standard 300 GSM Art Card", price: 0 },
                    { name: "Premium 350 GSM Art Card", price: 100 },
                    { name: "Premium Textured", price: 200 },
                    { name: "Non-Tearable", price: 300 }
                ]
            },
            {
                id: "lamination",
                name: "Lamination",
                options: [
                    { name: "Matte", price: 0 },
                    { name: "Gloss", price: 0 },
                    { name: "Velvet", price: 150 },
                    { name: "None", price: 0 }
                ]
            },
            {
                id: "corners",
                name: "Corners",
                options: [
                    { name: "Standard", price: 0 },
                    { name: "Rounded", price: 50 }
                ]
            }
        ];
    }

    setProduct(found);
    const foundIsId = found?.name?.toLowerCase().includes("id card") || found?.category?.toLowerCase().includes("id card") || found?.name?.toLowerCase().includes("badge") || found?.name?.toLowerCase().includes("pvc");
    setBaseQuantity(found.minQty || 1);
    setCardQuantity(found.minQty || (foundIsId ? 1 : 100));
    setStandeeQty(found.minQty || 1);
    setBrochureQty(found.minQty || 25);
    if (found.category === "Apparel" || found.category === "Clothing & Bags") {
      setActivePlacement("front-full");
    } else if (found.category === "Business Cards" || foundIsId) {
      setActivePlacement("front");
    }
    if (found.colors && found.colors.length > 0) {
      setSelectedColor(found.colors[0]);
    }
    if (found.variations && found.variations.length > 0) {
      const initialSelected: Record<string, any> = {};
      found.variations.forEach((v: any) => {
        if (v.options && v.options.length > 0) {
          initialSelected[v.id] = v.options[0];
        }
      });

      // Apply constraints for Cotton Lanyards initially
      if (found.name === 'Cotton Lanyards (Single color printing)') {
        const lanyardVc = found.variations.find((v: any) => v.name.trim().toLowerCase() === 'lanyard colour');
        const printColourVc = found.variations.find((v: any) => {
          const name = v.name.trim().toLowerCase();
          return name === 'print colour' || name === 'print colors' || name === 'print colours';
        });
        
        if (lanyardVc && printColourVc && initialSelected[lanyardVc.id]) {
          const selectedLanyardColor = initialSelected[lanyardVc.id].name.trim().toLowerCase();
          let allowedPrintColours: string[] = [];
          
          if (selectedLanyardColor === 'black' || selectedLanyardColor === 'royal blue') {
            allowedPrintColours = ['white'];
          } else if (selectedLanyardColor === 'yellow') {
            allowedPrintColours = ['black', 'red'];
          } else if (selectedLanyardColor === 'red') {
            allowedPrintColours = ['white', 'black'];
          }
          
          if (allowedPrintColours.length > 0) {
             const defaultPrintColour = printColourVc.options.find((o: any) => allowedPrintColours.includes(o.name.trim().toLowerCase()));
             if (defaultPrintColour) {
               initialSelected[printColourVc.id] = defaultPrintColour;
             }
          }
        }
      }

      if (found.name === 'Center Pin Binding') {
        setDocumentPages(4);
      } else {
        setDocumentPages(1);
      }

      setSelectedVariations(initialSelected);
    }
    if (found.images && found.images.length > 0) {
      setSelectedImage(found.images[0]);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    async function fetchProduct() {
      if (!productId) return;
      setProductsLoading(true);

      const matchInAllProducts = allProducts && allProducts.find(p => p.id === productId || p.id.toLowerCase() === productId.toLowerCase());

      if (matchInAllProducts && !isCancelled) {
        applyProductData(matchInAllProducts);
        setProductsLoading(false);
      }

      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000));
        const fetchPromise = apiFetch(`/api/products/${productId}`);

        const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

        if (!isCancelled && response && response.ok) {
          const found = await response.json();
          if (found && found.id) {
            applyProductData(found);
          } else {
            setProduct(null);
          }
        } else if (!isCancelled) {
          setProduct(null);
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
        if (!isCancelled && !matchInAllProducts) {
          setProduct(null);
        }
      } finally {
        if (!isCancelled) {
          setProductsLoading(false);
        }
      }

      // Parse query params for pre-loaded designs
      const searchParams = new URLSearchParams(window.location.search);
      const queryDriveFileId = searchParams.get('driveFileId');
      const queryMediaUrl = searchParams.get('mediaUrl');
      const queryPlacement = searchParams.get('placement') as PlacementId || 'generic';

      if (queryDriveFileId && queryMediaUrl && !isCancelled) {
        const initialArtwork: Record<string, Artwork> = {
          [queryPlacement]: {
            file: new File([], `loaded-design-${queryDriveFileId}.png`),
            previewUrl: queryMediaUrl,
            scale: 1,
            fileName: `Saved Design`,
            isImage: true,
            driveFileId: queryDriveFileId,
            mediaUrl: queryMediaUrl
          }
        };
        setArtworks(initialArtwork);
        if (queryPlacement) {
          setActivePlacement(queryPlacement);
        }
        setPreviewMode("artwork");
      }
    }

    fetchProduct();

    return () => {
      isCancelled = true;
    };
  }, [productId, allProducts]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (productsLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-gray-500 font-medium">Loading product details...</p>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertTriangle className="w-12 h-12 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900">Product Not Found</h2>
          <p className="text-gray-500">The product you are looking for does not exist or has been removed.</p>
          <Link to="/" className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 font-medium transition-colors">
            Return Home
          </Link>
        </div>
      </Layout>
    );
  }

  const isApparel = ["Apparel", "Clothing & Bags", "Custom Apparel", "T-Shirts", "Corporate Uniforms"].includes(product.category) || (product.name && product.name.toLowerCase().includes("t-shirt"));

  // Determine current view based on active placement
  const placementConfig = isApparel
    ? APPAREL_PLACEMENTS[activePlacement]
    : isBusinessCard
      ? BUSINESS_CARD_PLACEMENTS[activePlacement]
      : GENERIC_PLACEMENT;
  const currentView = placementConfig?.view || "front";
  const isFlipped = currentView === "back";

  const currentArtwork = artworks[activePlacement];

  const productNameLower = (product.name || "").toLowerCase();
  const productFeaturesLower = Array.isArray(product.features) ? (product.features as any[]).map((f: any) => f?.toLowerCase?.() || "").join(" ") : (typeof (product.features as any) === 'string' ? (product.features as any).toLowerCase() : "");
  const productDescLower = product.description?.toLowerCase() || "";
  const selectedVarValues = Object.values(selectedVariations).map((v: any) => typeof v === 'string' ? v.toLowerCase() : (v?.name || '').toLowerCase()).join(" ");

  const cardShapeLower = cardShape.toLowerCase();

  const hasKeyword = (k: string) => productNameLower.includes(k) || productFeaturesLower.includes(k) || productDescLower.includes(k) || selectedVarValues.includes(k) || cardShapeLower.includes(k);

  const isDieCut = hasKeyword("die cut") || hasKeyword("die-cut") || hasKeyword("shape cut") || hasKeyword("shape-cut") || hasKeyword("custom shape") || hasKeyword("cutout") || hasKeyword("cut out") || hasKeyword("custom cut") || hasKeyword("shoe") || hasKeyword("shaped") || hasKeyword("u-shape") || cardShape === "Die Cut / Custom Shape";
  const isLeaf = hasKeyword("leaf");
  const isCircle = hasKeyword("circle") || hasKeyword("round card");
  const isOval = hasKeyword("oval");
  const isSquare = hasKeyword("square");
  const isHalfMoon = hasKeyword("half moon") || hasKeyword("arch");
  const isSingleRound = hasKeyword("single round") || hasKeyword("1 round");
  const isRoundedCorners = hasKeyword("rounded corner") || hasKeyword("round corner") || hasKeyword("rounded corners");
  const isPortrait = hasKeyword("portrait");

  let productRadiusClass = "rounded-md";
  let businessCardAspect = isPortrait ? "aspect-[1/1.75]" : "aspect-[1.75/1]";

  if (isSquare || isCircle) {
    businessCardAspect = "aspect-square";
  } else if (isOval) {
    businessCardAspect = isPortrait ? "aspect-[1/1.5]" : "aspect-[1.5/1]";
  } else if (isHalfMoon) {
    businessCardAspect = isPortrait ? "aspect-[1/1.2]" : "aspect-[1.2/1]";
  }

  if (isCircle) {
    productRadiusClass = "!rounded-full";
  } else if (isOval) {
    productRadiusClass = "!rounded-[50%]";
  } else if (isLeaf) {
    productRadiusClass = "!rounded-tl-[3.5rem] !rounded-br-[3.5rem] !rounded-tr-md !rounded-bl-md";
  } else if (isHalfMoon) {
    productRadiusClass = "!rounded-t-full !rounded-b-lg";
  } else if (isSingleRound) {
    productRadiusClass = "!rounded-tr-[3.5rem] !rounded-tl-lg !rounded-br-lg !rounded-bl-lg";
  } else if (isRoundedCorners) {
    productRadiusClass = "!rounded-2xl";
  } else if (isDieCut) {
    productRadiusClass = "rounded-2xl";
  }

  const handlePlacementSelect = (id: PlacementId) => {
    setActivePlacement(id);
    setPreviewMode("artwork");
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      let isImage = file.type.startsWith("image/");
      let url = isImage ? URL.createObjectURL(file) : null;
      
      let pageCount = null;
      if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          
          try {
             const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
             const page = await pdf.getPage(1);
             const scale = 300 / 72; // Render at exactly 300 DPI equivalent
             const viewport = page.getViewport({ scale });
             const canvas = document.createElement("canvas");
             canvas.width = viewport.width;
             canvas.height = viewport.height;
             const ctx = canvas.getContext("2d");
             if (ctx) {
               await page.render({ canvasContext: ctx, canvas, viewport }).promise;
               url = canvas.toDataURL("image/png");
               isImage = true; // treat as image for preview and DPI check
             }
          } catch(err) {
             console.error("Failed to generate PDF preview:", err);
          }
          
          const pdfDoc = await PDFDocument.load(arrayBuffer);
          pageCount = pdfDoc.getPageCount();
          
          let pagesVar = product?.variations?.find((v: any) => v.name?.toLowerCase() === 'pages' || v.name?.toLowerCase() === 'no. of pages');
          if (pagesVar) {
             const minQ = Math.max(pageCount, product?.minQty || 1);
             const exactOption = pagesVar.options.find((o: any) => {
               const optNum = Number(o.name.replace(/[^0-9]/g, ''));
               return optNum === minQ;
             });
             const largerOption = pagesVar.options.find((o: any) => {
               const optNum = Number(o.name.replace(/[^0-9]/g, ''));
               return optNum >= minQ;
             });
             const matchingOption = exactOption || largerOption;
             if (matchingOption) {
               setSelectedVariations(prev => ({...prev, [pagesVar.id]: matchingOption}));
             }
          } else {
            if (isDocumentPrinting) {
              const minPg = Math.max(pageCount, product?.minQty || (isCenterPinBinding ? 4 : 1));
              setDocumentPages(minPg);
              setMinDynamicPages(minPg);
            } else {
              const minQ = Math.max(pageCount, product?.minQty || 1);
              setBaseQuantity(Math.max(baseQuantity, minQ));
              setCardQuantity(Math.max(cardQuantity, minQ));
              setBrochureQty(Math.max(brochureQty, minQ));
              setStandeeQty(Math.max(standeeQty, minQ));
              setMinDynamicQty(minQ);
            }
          }
        } catch (pdfErr) {
          console.error("Failed to read PDF page count in browser:", pdfErr);
        }
      }

      setArtworks((prev) => {
        const existing = (prev[activePlacement] as any) || {};
        return {
          ...prev,
          [activePlacement]: {
            ...existing,
            file,
            previewUrl: url || "",
            fileName: file.name,
            isImage,
            scale: existing.scale || 1,
            x: existing.x || 0,
            y: existing.y || 0,
          },
        };
      });

      if (isImage && url) {
        const img = new Image();
        img.onload = () => {
          const getEstimatedDimensionsInches = () => {
            const activeVars = Object.values(getActiveVariations());
            if (product?.name?.toLowerCase().includes("a3") || activeVars.some((v:any) => v.name?.includes("A3"))) return { w: 11.69, h: 16.54 };
            if (product?.name?.toLowerCase().includes("a4") || activeVars.some((v:any) => v.name?.includes("A4"))) return { w: 8.27, h: 11.69 };
            if (product?.name?.toLowerCase().includes("a5") || activeVars.some((v:any) => v.name?.includes("A5"))) return { w: 5.83, h: 8.27 };
            if (isBusinessCard) return { w: 3.5, h: 2 };
            if (isStandee) {
               if (standeeSize === "2.5x6") return { w: 30, h: 72 };
               if (standeeSize === "3x6") return { w: 36, h: 72 };
               if (standeeSize === "4x6") return { w: 48, h: 72 };
               return { w: 24, h: 60 };
            }
            return { w: 8.27, h: 11.69 };
          };
          
          const dim = getEstimatedDimensionsInches();
          const dpiArea = Math.sqrt((img.width * img.height) / (dim.w * dim.h));
          
          let warningLevel: 'not_printable' | 'poor' | 'fair' | 'good' | undefined = undefined;
          if (dpiArea < 150) {
            warningLevel = 'not_printable';
          } else if (dpiArea < 200) {
            warningLevel = 'poor';
          } else if (dpiArea < 290) {
            warningLevel = 'fair';
          } else {
            warningLevel = 'good';
          }
          
          if (warningLevel) {
            setArtworks((prev) => {
               if (!prev[activePlacement]) return prev;
               return {
                 ...prev,
                 [activePlacement]: {
                   ...prev[activePlacement],
                   dpi: dpiArea,
                   warningLevel
                 }
               };
            });
          }
        };
        img.src = url;
        setPreviewMode("artwork");
      }
      setShowCustomizer(false); // Switch away from customizer view if uploading

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeArtwork = () => {
    if (currentArtwork?.previewUrl) {
      URL.revokeObjectURL(currentArtwork.previewUrl);
    }
    setArtworks((prev) => {
      const updated = { ...prev };
      delete updated[activePlacement];
      return updated;
    });
    
    setMinDynamicQty(1);
    setMinDynamicPages(1);
    
    if (product) {
      const isIdCard = product?.name?.toLowerCase().includes("id card") || product?.category?.toLowerCase().includes("id card") || product?.name?.toLowerCase().includes("badge") || product?.name?.toLowerCase().includes("pvc");
      setBaseQuantity(product.minQty || 1);
      setCardQuantity(product.minQty || (isIdCard ? 1 : 100));
      setStandeeQty(product.minQty || 1);
      setBrochureQty(product.minQty || 25);
      
      if (isCenterPinBinding) {
        setDocumentPages(Math.max(4, product.minQty || 4));
      } else {
        setDocumentPages(product.minQty || 1);
      }

      const pagesVar = product?.variations?.find((v: any) => v.name?.toLowerCase() === 'pages' || v.name?.toLowerCase() === 'no. of pages');
      if (pagesVar && pagesVar.options && pagesVar.options.length > 0) {
        setSelectedVariations(prev => ({...prev, [pagesVar.id]: pagesVar.options[0]}));
      }
    }
  };

  const setScale = (scale: number) => {
    setArtworks((prev) => ({
      ...prev,
      [activePlacement]: { ...prev[activePlacement], scale },
    }));
  };

  const handleUpdateArtwork = (placement: string, updates: Partial<Artwork>) => {
    setArtworks((prev) => ({
      ...prev,
      [placement]: { ...prev[placement], ...updates },
    }));
  };

  const handleSaveCustomDesign = async (file: File) => {
    const isImage = file.type.startsWith("image/");
    const localPreviewUrl = isImage ? URL.createObjectURL(file) : null;
    
    // Show a loading/uploading state in uploadProgress so the user has immediate feedback
    setUploadProgress({
      status: "uploading",
      percentage: 20,
      currentFile: "Saving design to Cloud Storage...",
      currentIndex: 0,
      totalFiles: 1,
    });

    try {
      // 1. Upload the canvas design file to the server (which uploads it to Firebase Storage)
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await apiClient.post("/api/upload", formData, {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size));
          setUploadProgress({
            status: "uploading",
            percentage: Math.min(95, 20 + Math.round(percent * 0.6)),
            currentFile: "Uploading design...",
            currentIndex: 0,
            totalFiles: 1,
          });
        }
      });
      
      if (res.status === 200 || res.status === 201) {
        const { url, driveFileId } = res.data;
        
        // 2. Set artworks state with the uploaded remote URL
        setArtworks((prev) => ({
          ...prev,
          [activePlacement]: {
            file,
            previewUrl: localPreviewUrl,
            scale: 1,
            fileName: file.name,
            isImage,
            driveFileId,
            mediaUrl: url
          },
        }));

        // 3. If logged in, save the design to their profile!
        if (token) {
          setUploadProgress(prev => ({ ...prev, currentFile: "Saving to your profile..." }));
          await apiClient.post("/api/users/me/designs", {
            design: {
              name: `Custom ${product.name} Design`,
              productId: product.id,
              productName: product.name,
              productImage: displayImage,
              mediaUrl: url,
              driveFileId,
              placement: activePlacement
            }
          }, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }

        setUploadProgress({
          status: "complete",
          percentage: 100,
          currentFile: "Design saved successfully!",
          currentIndex: 1,
          totalFiles: 1,
        });

        setTimeout(() => {
          setUploadProgress(prev => ({ ...prev, status: "idle" }));
        }, 3000);

      } else {
        throw new Error(res.data.error || "Failed to upload design");
      }
    } catch (err: any) {
      console.error("Failed to automatically upload design:", err);
      // Fallback: save only locally in case of network issue
      setArtworks((prev) => ({
        ...prev,
        [activePlacement]: {
          file,
          previewUrl: localPreviewUrl,
          scale: 1,
          fileName: file.name,
          isImage
        },
      }));
      setUploadProgress({
        status: "error",
        percentage: 100,
        currentFile: err.message || "Failed to save design online. Stored locally.",
        currentIndex: 0,
        totalFiles: 1,
      });
      setTimeout(() => {
        setUploadProgress(prev => ({ ...prev, status: "idle" }));
      }, 5000);
    }

    if (isImage) {
      setPreviewMode("artwork");
    }
    setShowCustomizer(false);
  };

  const activeArtworks = Object.entries(artworks).filter(([id]) => {
    if (isBusinessCard) {
      // If front-only selected, hide back artwork
      if (cardSides === "front" && id === "back") return false;
      const info = BUSINESS_CARD_PLACEMENTS[id];
      if (!info) return false;
      return info.view === currentView;
    }
    if (!isApparel) return true;
    const info = APPAREL_PLACEMENTS[id];
    if (!info) return false;
    return info.view === currentView;
  });

  return (
    <>
      {showCustomizer && (
        <ErrorBoundary><DesignEditor
          product={product}
          activePlacement={activePlacement}
          selectedColor={selectedColor}
          onSave={handleSaveCustomDesign}
          onClose={() => setShowCustomizer(false)}
         /></ErrorBoundary>
      )}
      <Layout>
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 border-b border-gray-100 mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-purple-600 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2"  /> Back
          </Link>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-24 grid md:grid-cols-2 gap-12 lg:gap-20">
          {/* Product Image */}
          <div className="space-y-4">
            <div
              ref={containerRef}
              className="w-full rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 relative min-h-[400px] sm:min-h-[500px]"
            >
              {previewMode === "3d" && isApparel ? (
                <div className="w-full h-[450px] sm:h-[520px] relative">
                  <Shirt3DPreview 
                    color={active3DColor} 
                    artworks={artworks} 
                    activePlacement={activePlacement} 
                    isPolo={hasKeyword("polo")}
                  />
                </div>
              ) : previewMode === "artwork" && isApparel ? (
                <div className="w-full h-[450px] sm:h-[520px] relative flex flex-col gap-4">
                  <Apparel2DMockup
                    color={active3DColor}
                    artworks={artworks}
                    activePlacement={activePlacement}
                    onSelectPlacement={handlePlacementSelect}
                    onUpdateArtwork={handleUpdateArtwork}
                    isPolo={hasKeyword("polo")}
                    currentView={currentView as any}
                    onViewChange={(view) => {
                      if (view === "front") handlePlacementSelect("front-chest");
                      else if (view === "back") handlePlacementSelect("back-full");
                      else if (view === "left") handlePlacementSelect("sleeve-left");
                      else if (view === "right") handlePlacementSelect("sleeve-right");
                    }}
                  />
                </div>
              ) : (
                <div className={`w-full relative transition-transform duration-700 ease-in-out ${
                  currentView === "left" ? "scale-[1.8] origin-[80%_40%]" :
                  currentView === "right" ? "scale-[1.8] origin-[20%_40%]" :
                  currentView === "back" ? "scale-x-[-1]" : ""
                }`}>
                  <div className="w-full relative bg-[#EBEBEB] overflow-hidden flex items-center justify-center min-h-[400px] sm:min-h-[500px]">
                    {/* Simulated Studio Background */}
                    <div className="absolute inset-0 opacity-50 bg-gradient-to-tr from-gray-300 to-gray-100 pointer-events-none"  />
                    
                     {/* Base Transparent Mockup */}
                    {!displayImage || brokenImages[displayImage] ? (
                      <div className="w-full aspect-[4/3] flex flex-col items-center justify-center p-8 bg-gray-50 text-gray-400 relative z-10">
                        <ImageIcon className="w-16 h-16 mb-4 stroke-1 text-gray-300 animate-pulse" />
                        <p className="text-sm font-medium text-gray-500">Preview not available for this product</p>
                        <p className="text-xs text-gray-400 mt-1">Our team is updating the product asset</p>
                      </div>
                    ) : (
                      <>
                        {!loadedImages[displayImage] && (
                          <div className="absolute inset-0 z-20 bg-gray-50 flex flex-col items-center justify-center p-8 text-gray-400">
                            <div className="w-10 h-10 rounded-full border-2 border-purple-200 border-t-purple-600 animate-spin mb-3" />
                            <p className="text-xs font-medium text-gray-500">Loading premium preview...</p>
                          </div>
                        )}
                        <img referrerPolicy="no-referrer"
                          src={getOptimizedImage(displayImage, 1000) || undefined}
                          alt={product.name}
                          onLoad={() => handleImageLoaded(displayImage)}
                          onError={() => handleImageError(displayImage)}
                          className={`w-full h-auto object-contain relative transition-opacity duration-300 z-10 ${
                            loadedImages[displayImage]
                              ? "opacity-100"
                              : "opacity-0 pointer-events-none"
                          } ${currentView === "back" ? "scale-x-[-1]" : ""}`} 
                         />
                      </>
                    )}
                    
                    {/* Direct Live Artwork / Cutout Overlay over Product Image */}
                    {previewMode === "artwork" && activeArtworks.length > 0 && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30">
                        {activeArtworks.map(([id, item]) => {
                          const artwork = item as Artwork;
                          let info;
                          if (isApparel) info = APPAREL_PLACEMENTS[id];
                          else if (isBusinessCard) info = BUSINESS_CARD_PLACEMENTS[id];
                          else info = GENERIC_PLACEMENT;
                          const isActive = id === activePlacement;
                          
                          const unflipClass = currentView === "back" ? "scale-x-[-1]" : "";
                          const useImageMask = isCustomShapeCard && displayImage;

                          return (
                            <motion.div
                              key={id}
                              style={{ scale: artwork.scale }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isApparel || isBusinessCard) handlePlacementSelect(id as PlacementId);
                              }}
                              className={`absolute inset-0 m-auto ${
                                useImageMask
                                  ? "w-full h-full"
                                  : `${info.baseClass.replace('dynamic-aspect', isBusinessCard ? businessCardAspect : '')} ${isBusinessCard ? productRadiusClass + ' bg-white shadow-2xl overflow-hidden' : 'bg-transparent overflow-visible'}`
                              } flex items-center justify-center pointer-events-auto cursor-pointer ${
                                isActive ? "ring-2 ring-purple-500/80 ring-dashed z-20" : "z-10"
                              }`}
                            >
                              {artwork.previewUrl ? (
                                useImageMask ? (
                                  <ShapeCutCanvas
                                    artworkUrl={artwork.previewUrl}
                                    productImageUrl={getOptimizedImage(displayImage, 1000) || displayImage}
                                    productName={product?.name}
                                    cardShape={cardShape}
                                    isBackView={currentView === "back"}
                                    className="w-full h-full"
                                  />
                                ) : (
                                  <img referrerPolicy="no-referrer"
                                    src={artwork.previewUrl || undefined}
                                    alt="Preview"
                                    className={`w-full h-full object-contain ${unflipClass} pointer-events-none ${isBusinessCard ? 'bg-white' : 'bg-transparent'}`}
                                  />
                                )
                              ) : (
                                <div className="flex flex-col items-center justify-center w-full h-full bg-slate-100/90 backdrop-blur rounded-2xl">
                                  <FileText className="w-8 h-8 text-slate-400 mb-1" />
                                  <span className="text-xs text-slate-500 font-medium px-2 text-center line-clamp-1">{artwork.fileName}</span>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* View Mode Toggle Pill */}
              {(isApparel || activeArtworks.length > 0) && (
                <div className="absolute top-3 right-3 z-40 flex items-center bg-white/90 backdrop-blur-md p-1 rounded-full border border-gray-200/80 shadow-md gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewMode("gallery")}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      previewMode === "gallery"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    📷 Photo
                  </button>
                  {isApparel && (
                    <button
                      type="button"
                      onClick={() => setPreviewMode("3d")}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        previewMode === "3d"
                          ? "bg-purple-600 text-white shadow-xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      🧊 3D Live
                    </button>
                  )}
                  {activeArtworks.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPreviewMode("artwork")}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        previewMode === "artwork"
                          ? "bg-purple-600 text-white shadow-xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      ✨ 2D Mockup
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-4">
              {validImages && validImages.length > 0 ? (
                validImages.slice(0, 4).map((img, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSelectedImage(img);
                      setPreviewMode("gallery");
                    }}
                    className={`aspect-square rounded-xl overflow-hidden border-2 cursor-pointer bg-white ${displayImage === img ? "border-purple-600" : "border-gray-200 hover:border-purple-300"}`}
                  >
                    <img referrerPolicy="no-referrer"
                      src={getOptimizedImage(img, 150) || undefined}
                      alt={`${product.name} ${i + 1}`}
                      onError={() => handleImageError(img)}
                      className="w-full h-full object-contain p-2"
                     />
                  </div>
                ))
              ) : (
                <div
                  className={`aspect-square rounded-xl overflow-hidden border-2 border-purple-600 cursor-pointer bg-white flex items-center justify-center`}
                >
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                    <ImageIcon className="w-6 h-6 stroke-1 text-gray-300" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-2 flex items-center gap-3">
              <span className="text-sm font-semibold tracking-wider text-purple-600 uppercase">
                {product.category}
              </span>
              {product.isBestseller && (
                <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded shadow-sm">
                  BESTSELLER
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
              {product.name}
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed mb-6 whitespace-pre-wrap">
              {product.description}
            </p>

            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-sm text-gray-500 font-medium">
                Price
              </span>
              <span className="text-4xl font-bold text-gray-900">
                ₹{calculatePrice().toLocaleString('en-IN')}
              </span>
              <span className="text-sm text-gray-500">
                {isBusinessCard ? `for ${cardQuantity} cards` : isBrochure ? `for ${brochureQty} brochures` : isStandee ? `for ${standeeQty} standees` : isDocumentPrinting ? `for ${documentPages} pages × ${baseQuantity} copies` : `for ${baseQuantity} pcs`}
              </span>
            </div>

            {isBusinessCard && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Quantity {product.minQty ? `(Min: ${product.minQty})` : ''} {product.qtyMultiple ? `(Multiples of ${product.qtyMultiple})` : `(Multiples of ${qtyMultipleDefault})`}
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={Math.max(product.minQty || minQtyDefault, minDynamicQty)}
                    step={product.qtyMultiple || qtyMultipleDefault}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                    value={cardQuantity}
                    onChange={(e) => {
                       const val = Number(e.target.value);
                       setCardQuantity(val);
                    }}
                    onBlur={(e) => {
                       let val = Number(e.target.value);
                       const min = Math.max(product.minQty || minQtyDefault, minDynamicQty);
                       const multiple = product.qtyMultiple || qtyMultipleDefault;
                       if (val < min) val = min;
                       val = Math.round(val / multiple) * multiple;
                       if (val < min) val = val + multiple;
                       setCardQuantity(val);
                    }}
                   />
                  <span className="text-gray-500 font-medium">Cards</span>
                </div>
              </div>
            )}

            {isBusinessCard && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Printing Sides
                </h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    onClick={() => {
                      setCardSides("front");
                      handlePlacementSelect("front" as PlacementId);
                      // remove back artwork when switching to front-only
                      if (artworks["back"]) {
                        const newArtworks = { ...artworks };
                        delete newArtworks["back"];
                        setArtworks(newArtworks);
                      }
                    }}
                    className={`py-3 px-4 rounded-xl border-2 text-center transition-all ${
                      cardSides === "front"
                        ? "border-purple-600 bg-purple-50 text-purple-700 font-bold"
                        : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Front Only
                  </button>
                  <button
                    onClick={() => {
                      setCardSides("front-back");
                    }}
                    className={`py-3 px-4 rounded-xl border-2 text-center transition-all ${
                      cardSides === "front-back"
                        ? "border-purple-600 bg-purple-50 text-purple-700 font-bold"
                        : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Front & Back
                  </button>
                </div>

                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Product View
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handlePlacementSelect("front" as PlacementId)}
                    className={`text-sm py-2 px-3 rounded-lg border text-center transition-all ${
                      activePlacement === "front"
                        ? "border-purple-600 bg-purple-50 text-purple-700 font-medium"
                        : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Front View
                  </button>
                  {cardSides === "front-back" && (
                    <button
                      onClick={() => handlePlacementSelect("back" as PlacementId)}
                      className={`text-sm py-2 px-3 rounded-lg border text-center transition-all ${
                        activePlacement === "back"
                          ? "border-purple-600 bg-purple-50 text-purple-700 font-medium"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Back View
                    </button>
                  )}
                </div>
              </div>
            )}

            {isApparel && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Product View
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(APPAREL_PLACEMENTS).map(([id, info]) => (
                    <button
                      key={id}
                      onClick={() => handlePlacementSelect(id as PlacementId)}
                      className={`text-sm py-2 px-3 rounded-lg border text-center transition-all ${
                        activePlacement === id
                          ? "border-purple-600 bg-purple-50 text-purple-700 font-medium"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {info.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isBrochure && (
              <div className="mb-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Brochure Fold
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {["Bi Fold", "Tri Fold", "Z Fold"].map((f) => {
                      const isDL = brochureStyle === "DL";
                      const disabled = isDL && f !== "Tri Fold";
                      return (
                        <button
                          key={f}
                          disabled={disabled}
                          onClick={() => setBrochureFold(f)}
                          className={`py-3 px-2 rounded-xl border-2 text-center text-sm transition-all ${
                            brochureFold === f
                              ? "border-purple-600 bg-purple-50 text-purple-700 font-bold"
                              : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                          } ${disabled ? "opacity-30 cursor-not-allowed hover:bg-transparent hover:border-gray-200" : ""}`}
                        >
                          {f}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Style / Size
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {["A5", "A6", "DL"].map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setBrochureStyle(s);
                          if (s === "DL") setBrochureFold("Tri Fold");
                        }}
                        className={`py-3 px-2 rounded-xl border-2 text-center text-sm transition-all ${
                          brochureStyle === s
                            ? "border-purple-600 bg-purple-50 text-purple-700 font-bold"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Quantity {product.minQty ? `(Min: ${product.minQty})` : ''} {product.qtyMultiple ? `(Multiples of ${product.qtyMultiple})` : ''}
                  </h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={Math.max(product.minQty || 25, minDynamicQty)}
                      step={product.qtyMultiple || 25}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                      value={brochureQty}
                      onChange={(e) => {
                         const val = Number(e.target.value);
                         setBrochureQty(val);
                      }}
                      onBlur={(e) => {
                         let val = Number(e.target.value);
                         const min = Math.max(product.minQty || 25, minDynamicQty);
                         const multiple = product.qtyMultiple || 25;
                         if (val < min) val = min;
                         val = Math.round(val / multiple) * multiple;
                         if (val < min) val = val + multiple;
                         setBrochureQty(val);
                      }}
                     />
                    <span className="text-gray-500 font-medium">Brochures</span>
                  </div>
                </div>
              </div>
            )}

            {isStandee && (
              <div className="mb-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Size (ft)
                  </h3>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {["2x5", "2.5x6", "3x6", "4x6"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setStandeeSize(s)}
                        className={`py-3 px-2 rounded-xl border-2 text-center text-sm transition-all ${
                          standeeSize === s
                            ? "border-purple-600 bg-purple-50 text-purple-700 font-bold"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Quantity {product.minQty ? `(Min: ${product.minQty})` : ''} {product.qtyMultiple ? `(Multiples of ${product.qtyMultiple})` : ''}
                  </h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={Math.max(product.minQty || 1, minDynamicQty)}
                      step={product.qtyMultiple || 1}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                      value={standeeQty}
                      onChange={(e) => {
                         const val = Number(e.target.value);
                         setStandeeQty(val);
                      }}
                      onBlur={(e) => {
                         let val = Number(e.target.value);
                         const min = Math.max(product.minQty || 1, minDynamicQty);
                         const multiple = product.qtyMultiple || 1;
                         if (val < min) val = min;
                         val = Math.round(val / multiple) * multiple;
                         if (val < min) val = val + multiple;
                         setStandeeQty(val);
                      }}
                     />
                    <span className="text-gray-500 font-medium">Standees</span>
                  </div>
                  {standeeQty > 1 && (
                    <p className="text-sm text-green-600 mt-2 font-medium">
                      {standeeQty >= 2 && standeeQty <= 5 ? "5% Bulk Discount Applied" :
                       standeeQty > 5 && standeeQty <= 10 ? "10% Bulk Discount Applied" :
                       standeeQty > 10 ? "15% High-Volume Discount Applied" : ""}
                    </p>
                  )}
                </div>
              </div>
            )}

            {isAcrylic && (
              <div className="mb-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Shape
                  </h3>
                  <div className="flex flex-col gap-2">
                    {["Square/Rectangle", "Circle/Oval", "Full Arch", "Half Left Arch", "Half Right Arch"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setAcrylicShape(s)}
                        className={`text-left w-full py-4 px-4 rounded-xl border-2 transition-all ${
                          acrylicShape === s
                            ? "border-blue-500 bg-blue-50 text-blue-900 font-medium"
                            : "border-transparent bg-white hover:border-gray-300 text-gray-900 shadow-[0_0_0_1px_rgba(0,0,0,0.1)]"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!isBusinessCard && product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Color:{" "}
                  <span className="text-purple-600 font-medium ml-1">
                    {selectedColor?.name}
                  </span>
                </h3>
                <div className="flex flex-wrap gap-3 items-center">
                  {product.colors.map((color) => {
                    const isSelected = selectedColor?.name === color.name;
                    const { background, borderNeeded } = getColorStyle(color.hex || color.name);
                    const colorLower = color.name.toLowerCase();
                    const isLightColor = borderNeeded || ['yellow', 'cream', 'white', 'gold', 'light', 'beige', 'natural'].some(k => colorLower.includes(k));

                    return (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => {
                          setSelectedColor(color); 
                          if (color.image) { setSelectedImage(color.image); }
                          if (previewMode !== "3d") {
                            setPreviewMode("gallery");
                          }
                        }}
                        className={`group relative flex items-center justify-center w-10 h-10 rounded-full focus:outline-none transition-all ${
                          isSelected
                            ? "ring-2 ring-offset-2 ring-purple-600 scale-110 shadow-md z-10"
                            : "hover:scale-105 hover:shadow-sm opacity-90 hover:opacity-100"
                        }`}
                        aria-label={`Select ${color.name} color`}
                      >
                        <span
                          className={`w-full h-full rounded-full block ${
                            borderNeeded ? "border border-gray-300" : "border border-black/10"
                          }`}
                          style={{ background }}
                        />
                        {isSelected && (
                          <span
                            className={`absolute inset-0 flex items-center justify-center ${
                              isLightColor ? "text-gray-900" : "text-white"
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          </span>
                        )}
                        <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[11px] font-medium px-2 py-0.5 rounded shadow whitespace-nowrap z-30">
                          {color.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {product.variations && product.variations.length > 0 && (
              <div className="mb-8 space-y-5">
                {product.variations.map((variationCategory: any) => {
                  const isBillBook = product?.name?.toLowerCase().includes("bill book") || product?.category?.toLowerCase().includes("bill book");
                  const is2ndDuplicateConfig = variationCategory?.name?.toLowerCase().includes("2nd duplicate");
                  
                  // If it's a bill book and it's 2nd duplicate, check pad type
                  if (isBillBook && is2ndDuplicateConfig) {
                     // Check if pad type is "+2 duplicate"
                     let has2Duplicate = false;
                     product.variations.forEach((vc: any) => {
                        const isPadOrType = vc?.name?.toLowerCase().includes("pad") || vc?.name?.toLowerCase().includes("type") || vc?.name?.toLowerCase().includes("duplicate");
                        const sel = selectedVariations[vc.id];
                        if (isPadOrType && sel && sel.name) {
                           if (sel.name.toLowerCase().includes("+2 duplicate")) {
                              has2Duplicate = true;
                           }
                        }
                     });
                     if (!has2Duplicate) {
                        return null; // hide 2nd duplicate sheet
                     }
                  }

                  let filteredOptions = Array.isArray(variationCategory.options) ? variationCategory.options : [];
                  
                  if (product.name === 'Cotton Lanyards (Single color printing)') {
                    const vcName = variationCategory.name.trim().toLowerCase();
                    if (vcName === 'print colour' || vcName === 'print colors' || vcName === 'print colours') {
                      const lanyardVc = product.variations.find((v: any) => v.name.trim().toLowerCase() === 'lanyard colour');
                      if (lanyardVc) {
                        const selectedLanyardColor = selectedVariations[lanyardVc.id]?.name.trim().toLowerCase() || '';
                        if (selectedLanyardColor === 'black' || selectedLanyardColor === 'royal blue') {
                          filteredOptions = variationCategory.options.filter((o: any) => o.name.trim().toLowerCase() === 'white');
                        } else if (selectedLanyardColor === 'yellow') {
                          filteredOptions = variationCategory.options.filter((o: any) => o.name.trim().toLowerCase() === 'black' || o.name.trim().toLowerCase() === 'red');
                        } else if (selectedLanyardColor === 'red') {
                          filteredOptions = variationCategory.options.filter((o: any) => o.name.trim().toLowerCase() === 'white' || o.name.trim().toLowerCase() === 'black');
                        }
                      }
                    }
                  }

                  const selectedOpt = selectedVariations[variationCategory.id];
                  const isColorVar = isColorCategory(variationCategory.name, filteredOptions);

                  const handleOptSelect = (opt: any) => {
                    if (isColorVar && opt?.name) {
                      const colorStyle = getColorStyle(opt.name);
                      setSelectedColor({
                        name: opt.name,
                        hex: colorStyle.background,
                        image: opt.image || selectedColor?.image
                      });
                    }
                    setSelectedVariations(prev => {
                      const newState = { ...prev, [variationCategory.id]: opt };
                      
                      // Handle Cotton Lanyards dependency check when Lanyard Colour is updated
                      if (product.name === 'Cotton Lanyards (Single color printing)' && variationCategory.name.trim().toLowerCase() === 'lanyard colour') {
                        const selectedLanyardColor = opt.name.trim().toLowerCase();
                        const printColourVc = product.variations.find((v: any) => {
                          const name = v.name.trim().toLowerCase();
                          return name === 'print colour' || name === 'print colors' || name === 'print colours';
                        });
                        if (printColourVc) {
                          let allowedPrintColours: string[] = [];
                          if (selectedLanyardColor === 'black' || selectedLanyardColor === 'royal blue') {
                            allowedPrintColours = ['white'];
                          } else if (selectedLanyardColor === 'yellow') {
                            allowedPrintColours = ['black', 'red'];
                          } else if (selectedLanyardColor === 'red') {
                            allowedPrintColours = ['white', 'black'];
                          }
                          
                          const currentPrintColour = newState[printColourVc.id]?.name.trim().toLowerCase() || '';
                          if (allowedPrintColours.length > 0 && !allowedPrintColours.includes(currentPrintColour)) {
                            const firstAllowed = printColourVc.options.find((o: any) => allowedPrintColours.includes(o.name.trim().toLowerCase()));
                            if (firstAllowed) {
                              newState[printColourVc.id] = firstAllowed;
                            }
                          }
                        }
                      }
                      
                      return newState;
                    });
                  };

                  if (isColorVar) {
                    return (
                      <div key={variationCategory.id} className="mb-5">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2.5">
                          {variationCategory.name}:{" "}
                          <span className="text-purple-600 font-medium ml-1">
                            {selectedOpt?.name || ""}
                          </span>
                        </h3>
                        <div className="flex flex-wrap gap-3 items-center pt-0.5">
                          {filteredOptions.map((opt: any, idx: number) => {
                            const isSelected = selectedOpt?.name === opt.name;
                            const { background, borderNeeded } = getColorStyle(opt.name);
                            const optLower = opt.name.toLowerCase();
                            const isLightColor = borderNeeded || ['yellow', 'cream', 'white', 'gold', 'light', 'beige', 'natural'].some(k => optLower.includes(k));

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleOptSelect(opt)}
                                aria-label={`Select ${opt.name}`}
                                className={`group relative flex items-center justify-center w-10 h-10 rounded-full focus:outline-none transition-all ${
                                  isSelected
                                    ? "ring-2 ring-offset-2 ring-purple-600 scale-110 shadow-md z-10"
                                    : "hover:scale-105 hover:shadow-sm opacity-90 hover:opacity-100"
                                }`}
                              >
                                <span
                                  className={`w-full h-full rounded-full block ${
                                    borderNeeded ? "border border-gray-300" : "border border-black/10"
                                  }`}
                                  style={{ background }}
                                />
                                {isSelected && (
                                  <span
                                    className={`absolute inset-0 flex items-center justify-center ${
                                      isLightColor ? "text-gray-900" : "text-white"
                                    }`}
                                  >
                                    <Check className="w-4 h-4 stroke-[2.5]" />
                                  </span>
                                )}
                                <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[11px] font-medium px-2 py-0.5 rounded shadow whitespace-nowrap z-30">
                                  {opt.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={variationCategory.id}>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">
                        {variationCategory.name}
                      </h3>
                      <div className="relative">
                        <select
                          className="w-full appearance-none bg-white border border-gray-300 hover:border-gray-400 px-4 py-3 pr-8 rounded-xl leading-tight focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                          value={selectedVariations[variationCategory.id]?.name || ""}
                          onChange={(e) => {
                            const opt = variationCategory.options.find((o: any) => o.name === e.target.value);
                            if (opt) {
                              handleOptSelect(opt);
                            }
                          }}
                        >
                          {filteredOptions.map((opt: any, idx: number) => (
                             <option key={idx} value={opt.name}>
                               {opt.name}
                             </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                          <ChevronDown className="h-4 w-4"  />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!isBusinessCard && !isBrochure && !isStandee && (
              <div className="mb-6 space-y-6">
                {isDocumentPrinting && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">No. of Pages</h3>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={Math.max(isCenterPinBinding ? 4 : 1, minDynamicPages)}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                        value={documentPages}
                        onChange={(e) => {
                           setDocumentPages(Number(e.target.value));
                        }}
                        onBlur={(e) => {
                           let val = Number(e.target.value);
                           const minVal = Math.max(isCenterPinBinding ? 4 : 1, minDynamicPages);
                           if (val < minVal) val = minVal;
                           setDocumentPages(val);
                        }}
                       />
                      <span className="text-gray-500 font-medium whitespace-nowrap">Pages</span>
                    </div>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">{isDocumentPrinting ? "No. of Copies" : "Quantity"} {product.minQty ? `(Min: ${product.minQty})` : ''} {product.qtyMultiple ? `(Multiples of ${product.qtyMultiple})` : ''}</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={Math.max(product.minQty || 1, minDynamicQty)}
                      step={product.qtyMultiple || 1}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                      value={baseQuantity}
                      onChange={(e) => {
                         setBaseQuantity(Number(e.target.value));
                      }}
                      onBlur={(e) => {
                         let val = Number(e.target.value);
                         const min = Math.max(product.minQty || 1, minDynamicQty);
                         const multiple = product.qtyMultiple || 1;
                         if (val < min) val = min;
                         val = Math.round(val / multiple) * multiple;
                         if (val < min) val = val + multiple;
                         setBaseQuantity(val);
                      }}
                     />
                    <span className="text-gray-500 font-medium whitespace-nowrap">{isDocumentPrinting ? "Copies" : "Pieces"}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-auto space-y-4 pt-4 border-t border-gray-100">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf,.ai,.psd"
               />
              
              {currentArtwork && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-100 rounded-xl">
                    {currentArtwork.isImage && currentArtwork.previewUrl ? (
                      <img referrerPolicy="no-referrer" src={currentArtwork.previewUrl || undefined} alt="Preview" className="w-10 h-10 object-cover rounded-md bg-white border border-purple-200"  />
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center bg-white border border-purple-200 text-purple-600 rounded-md">
                        <FileText className="w-5 h-5"  />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{currentArtwork.fileName}</p>
                      <p className="text-xs text-gray-500">Uploaded for {activePlacement}</p>
                    </div>
                    <button onClick={removeArtwork} className="p-2 flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-lg border border-transparent hover:border-red-100 shadow-sm hover:shadow">
                      <Trash2 className="w-4 h-4"  />
                    </button>
                  </div>
                  {currentArtwork.warningLevel === 'not_printable' && (
                    <div className="text-xs text-red-700 bg-red-100 p-2 rounded border border-red-300 flex items-start gap-1.5">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span><strong>Not Printable:</strong> This artwork resolution is critically low ({Math.round(currentArtwork.dpi || 0)} DPI, below 150 DPI). It will look very pixelated when printed. We recommend 300 DPI or higher.</span>
                    </div>
                  )}
                  {currentArtwork.warningLevel === 'poor' && (
                    <div className="text-xs text-orange-700 bg-orange-100 p-2 rounded border border-orange-300 flex items-start gap-1.5">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span><strong>Poor Print Quality:</strong> This artwork resolution is low ({Math.round(currentArtwork.dpi || 0)} DPI). It may look blurry when printed. We recommend 300 DPI or higher.</span>
                    </div>
                  )}
                  {currentArtwork.warningLevel === 'fair' && (
                    <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-300 flex items-start gap-1.5">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span><strong>Satisfactory Print Quality:</strong> This artwork ({Math.round(currentArtwork.dpi || 0)} DPI) is acceptable but may not be perfectly crisp. For best results, use 300 DPI.</span>
                    </div>
                  )}
                  {currentArtwork.warningLevel === 'good' && (
                    <div className="text-xs text-green-700 bg-green-50 p-2 rounded border border-green-300 flex items-start gap-1.5">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span><strong>Good Print Quality:</strong> This artwork resolution is great ({Math.round(currentArtwork.dpi || 0)} DPI) for a high-quality print.</span>
                    </div>
                  )}
                </div>
              )}

              {hasNoValidProductImage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
                  <span>This product is currently disabled because preview images are unavailable.</span>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={isAdding || hasNoValidProductImage}
                  className="w-full text-lg h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="mr-2 h-5 w-5"  />
                  {isAdding ? "Adding..." : hasNoValidProductImage ? "Product Disabled" : "Add to Cart"}
                </Button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleUploadClick}
                    disabled={hasNoValidProductImage}
                    className="text-base h-12 rounded-xl border-2 border-gray-200 text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UploadCloud className="mr-2 h-4 w-4 text-gray-500"  />
                    {currentArtwork ? "Change Artwork" : "Upload Artwork"}
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setShowCustomizer(true)}
                    disabled={hasNoValidProductImage}
                    className="text-base h-12 rounded-xl border-2 border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="h-4 w-4 text-purple-600"  />
                    Design Online <span className="text-[10px] bg-purple-600 text-white px-1 py-0.5 rounded uppercase font-bold tracking-wider">Free</span>
                  </Button>
                </div>

                {isBusinessCard &&
                  activePlacement === "back" &&
                  artworks["front"] &&
                  !artworks["back"] && (
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => {
                        setArtworks((prev) => ({
                          ...prev,
                          back: prev["front"],
                        }));
                      }}
                      className="w-full text-base h-12 rounded-xl border-2 border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 shadow-sm transition-all"
                    >
                      Reuse Front Art
                    </Button>
                  )}
              </div>
              <p className="text-sm text-center text-gray-500 font-medium pt-2 flex items-center justify-center gap-2">
                <Shield className="h-4 w-4"  /> 100% Satisfaction Guarantee
              </p>
            </div>
          </div>
        </div>
      </div>

      {suggestedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              You Might Also Like
            </h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Explore other popular items from our collection.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {suggestedProducts.map(product => (
              <ProductCard key={product.id} product={product}  />
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 text-center">
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Delivery & Support
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              We ensure your products arrive on time and looking perfect.
            </p>
          </div>
        <div className="grid sm:grid-cols-3 gap-8 text-center max-w-4xl mx-auto">
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
              <Truck className="h-6 w-6"  />
            </div>
            <h4 className="font-bold text-gray-900">Free Shipping</h4>
            <p className="text-sm text-gray-500">On all orders over ₹499.</p>
          </div>
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6"  />
            </div>
            <h4 className="font-bold text-gray-900">Secure Payment</h4>
            <p className="text-sm text-gray-500">100% secure checkout.</p>
          </div>
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
              <UploadCloud className="h-6 w-6"  />
            </div>
            <h4 className="font-bold text-gray-900">Easy Returns</h4>
            <p className="text-sm text-gray-500">30-day return policy.</p>
          </div>
        </div>
      </div>
      </div>

      {uploadProgress.status !== "idle" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
            {uploadProgress.status === "uploading" && (
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center animate-pulse">
                  <UploadCloud className="w-10 h-10 animate-bounce"  />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-purple-100 border-t-purple-600 animate-spin"  />
              </div>
            )}
            
            {uploadProgress.status === "complete" && (
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <Check className="w-10 h-10"  />
              </div>
            )}

            {uploadProgress.status === "error" && (
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl font-semibold">!</span>
              </div>
            )}

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {uploadProgress.status === "uploading" && "Uploading Artwork..."}
              {uploadProgress.status === "complete" && "Upload Complete!"}
              {uploadProgress.status === "error" && "Upload Failed"}
            </h3>

            {uploadProgress.status === "uploading" && (
              <>
                <p className="text-sm text-gray-500 mb-4 truncate w-full px-4">
                  {uploadProgress.currentFile}
                </p>
                
                <div className="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
                  <div 
                    className="bg-purple-600 h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress.percentage}%` }}
                   />
                </div>
                
                <div className="flex justify-between w-full text-xs font-semibold text-gray-500 px-1">
                  <span>
                    File {uploadProgress.currentIndex + 1} of {uploadProgress.totalFiles}
                  </span>
                  <span className="text-purple-600 font-bold">
                    {uploadProgress.percentage}%
                  </span>
                </div>
              </>
            )}

            {uploadProgress.status === "complete" && (
              <p className="text-sm text-gray-500">
                Your artwork has been uploaded and added to your cart successfully!
              </p>
            )}

            {uploadProgress.status === "error" && (
              <>
                <p className="text-sm text-red-500 mb-6">
                  An error occurred while uploading your artwork. Please try again.
                </p>
                <button
                  onClick={() => setUploadProgress({ status: "idle", percentage: 0, currentFile: "", currentIndex: 0, totalFiles: 0 })}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  Dismiss
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
      </AnimatePresence>
    </Layout>
    </>
  );
}

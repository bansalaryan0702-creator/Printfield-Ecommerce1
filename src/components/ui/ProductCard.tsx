import { Link } from "react-router-dom";
import { Product } from "@/src/data/products";
import { useState, useMemo } from "react";
import { getFeaturedImage } from "@/src/lib/imageUtils";
import { getColorStyle, isColorCategory } from "@/src/utils/colorUtils";

interface ProductCardProps {
  product: Product;
  key?: any;
}

const getOptimizedImage = (url: string | null | undefined, width: number) => {
  if (!url) return null;
  if (url.includes('printo-s3.dietpixels.net') && !url.includes('w=')) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}w=${width}`;
  }
  return url;
};

export function ProductCard({ product }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const rawImage = getFeaturedImage(product);
  const cardImage = getOptimizedImage(rawImage, 400);

  const isProductDisabled = product.isDisabled || !cardImage || imageError;

  // Extract available color options as filled circle previews
  const availableColors = useMemo(() => {
    const list: { name: string; hex?: string }[] = [];
    const seen = new Set<string>();

    if (product.colors && product.colors.length > 0) {
      for (const col of product.colors) {
        if (col.name && !seen.has(col.name.toLowerCase())) {
          seen.add(col.name.toLowerCase());
          list.push({ name: col.name, hex: col.hex });
        }
      }
    }

    if (product.variations && product.variations.length > 0) {
      for (const v of product.variations) {
        const opts = Array.isArray(v.options) ? v.options : [];
        if (isColorCategory(v.name, opts)) {
          for (const opt of opts) {
            const optName = typeof opt === 'string' ? opt : opt?.name;
            if (optName && !seen.has(optName.toLowerCase())) {
              seen.add(optName.toLowerCase());
              list.push({ name: optName });
            }
          }
        }
      }
    }

    return list;
  }, [product]);

  if (isProductDisabled) {
    return null;
  }

  return (
    <Link 
      to={`/product/${product.id}`} 
      className="group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100 relative">
        {product.isBestseller && (
          <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded shadow-sm z-10">
            Bestseller
          </div>
        )}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-20">
            <div className="w-6 h-6 rounded-full border-2 border-purple-100 border-t-purple-600 animate-spin" />
          </div>
        )}
        <img referrerPolicy="no-referrer" 
          src={cardImage} 
          alt={product.name}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`h-full w-full object-contain p-4 bg-white object-center group-hover:scale-105 transition-all duration-500 ${imageLoaded ? "opacity-100" : "opacity-0 absolute inset-0"}`}
        />
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2">
          {product.category}
        </div>
        <h3 className="font-semibold text-gray-900 leading-tight mb-2 group-hover:text-purple-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-1">
          {product.cardDescription || product.description}
        </p>

        {/* Filled Circle Color Options Preview */}
        {availableColors.length > 0 && (
          <div className="flex items-center gap-1.5 mb-4">
            {availableColors.slice(0, 6).map((col, idx) => {
              const { background, borderNeeded } = getColorStyle(col.hex || col.name);
              return (
                <span
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full inline-block flex-shrink-0 transition-transform group-hover:scale-110 ${
                    borderNeeded ? "border border-gray-300" : "border border-black/10 shadow-xs"
                  }`}
                  style={{ background }}
                  title={col.name}
                />
              );
            })}
            {availableColors.length > 6 && (
              <span className="text-[10px] text-gray-400 font-semibold ml-0.5">
                +{availableColors.length - 6}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-medium tracking-wide">STARTING AT</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-900">₹{product.price.toLocaleString('en-IN')}</span>
              {(product.minQty && product.minQty > 1) && (
                <span className="text-xs text-gray-500 font-medium">for {product.minQty} pcs</span>
              )}
            </div>
          </div>
          <span className="bg-purple-50 text-purple-700 hover:bg-purple-100 px-4 py-2 rounded-full text-sm font-medium transition-colors">
            Customize
          </span>
        </div>
      </div>
    </Link>
  );
}

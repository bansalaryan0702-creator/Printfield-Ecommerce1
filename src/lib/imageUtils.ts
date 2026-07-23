export function isProductImage(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const u = url.toLowerCase().trim();
  
  // Exclude banner GIF, loader gifs, and svg icons
  if (
    u.endsWith('.gif') ||
    u.includes('loader.gif')
  ) {
    return false;
  }
  
  // Exclude ONLY very obvious junk, not words that could be product types (like logo, icon, banner, avatar)
  const isGarbage = 
    u.includes('facebook') ||
    u.includes('twitter') ||
    u.includes('instagram') ||
    u.includes('linkedin') ||
    u.includes('youtube') ||
    u.includes('visa') ||
    u.includes('mastercard') ||
    u.includes('amex') ||
    u.includes('trustpilot');
    
  return !isGarbage;
}

export function getImageSignature(url: string): string {
  if (!url) return '';
  let clean = url.split('?')[0].trim();
  try {
    clean = decodeURIComponent(clean);
  } catch (e) {}
  clean = clean.toLowerCase();

  const parts = clean.split('/');
  const filename = parts[parts.length - 1] || '';
  const nameWithoutExt = filename.replace(/\.(jpg|jpeg|png|webp|gif|svg)$/i, '').trim();

  const numbers = clean.match(/\d{6,}/g) || [];
  const slug = nameWithoutExt.replace(/[\s_%+\-]+/g, '-').trim();

  if (numbers.length > 0) {
    return `sig-num-${numbers.sort().join('-')}-${slug}`;
  }

  if (slug && !['1', '2', '3', '4', '5', 'image', 'img', 'photo', 'product'].includes(slug)) {
    return `sig-slug-${slug}`;
  }

  const pathWithoutDomain = parts.slice(3).join('/');
  return `sig-path-${pathWithoutDomain}`;
}

export function cleanAndDeduplicateImages(urls: (string | null | undefined)[]): string[] {
  const seenSignatures = new Set<string>();
  const seenExactUrls = new Set<string>();
  const uniqueUrls: string[] = [];

  for (const rawUrl of urls) {
    if (!rawUrl || typeof rawUrl !== 'string') continue;
    const url = rawUrl.trim();
    if (!url || !isProductImage(url)) continue;

    let exactKey = url.split('?')[0].trim();
    try {
      exactKey = decodeURIComponent(exactKey);
    } catch (e) {}
    exactKey = exactKey.toLowerCase();

    if (seenExactUrls.has(exactKey)) continue;

    const sig = getImageSignature(url);
    if (sig && seenSignatures.has(sig)) continue;

    if (sig) seenSignatures.add(sig);
    seenExactUrls.add(exactKey);
    uniqueUrls.push(url);
  }

  return uniqueUrls;
}

export function getFeaturedImage(product: { image?: string | null; images?: any } | null | undefined): string | null {
  if (!product) return null;

  let gallery: string[] = [];
  if (product.images) {
    if (typeof product.images === 'string') {
      try {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed)) gallery = parsed.filter(img => typeof img === 'string');
      } catch (e) {
        if (product.images.trim()) gallery = [product.images.trim()];
      }
    } else if (Array.isArray(product.images)) {
      gallery = product.images.filter(img => typeof img === 'string');
    }
  }

  const main = product.image && typeof product.image === 'string' ? product.image.trim() : '';

  // Collect all available image URLs for this product
  const allCandidates = [main, ...gallery]
    .map(u => (typeof u === 'string' ? u.trim() : ''))
    .filter(u => u.length > 5 && (u.startsWith('http') || u.startsWith('/')));

  if (allCandidates.length === 0) return null;

  // Filter candidates that pass isProductImage and are not generic unsplash placeholders
  const validCandidates = allCandidates.filter(u => isProductImage(u) && !u.includes('unsplash.com'));

  // 1. If we have valid candidate images
  if (validCandidates.length > 0) {
    // If main image is valid and non-unsplash, use it
    if (main && validCandidates.includes(main)) {
      return main;
    }
    // If main was missing or unsplash, prefer 2nd image (validCandidates[1]) if available, else validCandidates[0]
    if (validCandidates.length > 1 && gallery.includes(validCandidates[1])) {
      return validCandidates[1];
    }
    return validCandidates[0];
  }

  // 2. Fallback: Check if any candidate is a valid image (including valid stock images)
  const anyValid = allCandidates.filter(u => isProductImage(u));
  if (anyValid.length > 0) {
    return anyValid[0];
  }

  // No valid image found for product
  return null;
}


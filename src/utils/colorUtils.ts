import React from 'react';

export interface ColorStyle {
  background: string;
  borderNeeded?: boolean;
}

const COLOR_MAP: Record<string, { bg: string; isGradient?: boolean; borderNeeded?: boolean }> = {
  'black': { bg: '#111827' },
  'black / dark': { bg: '#111827' },
  'black/gold': { bg: 'linear-gradient(135deg, #111827 50%, #EAB308 50%)', isGradient: true },
  'matte black': { bg: '#18181B' },
  'glossy black': { bg: '#09090B' },
  'charcoal': { bg: '#374151' },
  'dark grey': { bg: '#4B5563' },
  'dark gray': { bg: '#4B5563' },
  'grey': { bg: '#6B7280' },
  'gray': { bg: '#6B7280' },
  'melange grey': { bg: '#9CA3AF' },
  'heather grey': { bg: '#9CA3AF' },
  'ash grey': { bg: '#D1D5DB' },
  'light grey': { bg: '#E5E7EB', borderNeeded: true },
  'light gray': { bg: '#E5E7EB', borderNeeded: true },
  'white': { bg: '#FFFFFF', borderNeeded: true },
  'off white': { bg: '#F9FAFB', borderNeeded: true },
  'cream': { bg: '#FEF3C7', borderNeeded: true },
  'beige': { bg: '#E5D0AC', borderNeeded: true },
  'natural': { bg: '#E5D0AC', borderNeeded: true },
  'kraft': { bg: '#C2A682' },
  'kraft paper': { bg: '#C2A682' },
  'royal blue': { bg: '#1E40AF' },
  'navy': { bg: '#1E3A8A' },
  'navy blue': { bg: '#1E3A8A' },
  'dark blue': { bg: '#1E3A8A' },
  'blue': { bg: '#2563EB' },
  'light blue': { bg: '#60A5FA' },
  'sky blue': { bg: '#38BDF8' },
  'cyan': { bg: '#06B6D4' },
  'teal': { bg: '#0D9488' },
  'red': { bg: '#DC2626' },
  'maroon': { bg: '#881337' },
  'burgundy': { bg: '#701A75' },
  'crimson': { bg: '#991B1B' },
  'scarlet': { bg: '#DC2626' },
  'green': { bg: '#16A34A' },
  'bottle green': { bg: '#064E3B' },
  'forest green': { bg: '#064E3B' },
  'dark green': { bg: '#064E3B' },
  'emerald': { bg: '#059669' },
  'olive': { bg: '#4D7C0F' },
  'olive green': { bg: '#4D7C0F' },
  'lime': { bg: '#65A30D' },
  'lime green': { bg: '#65A30D' },
  'yellow': { bg: '#EAB308' },
  'lemon': { bg: '#FACC15' },
  'mustard': { bg: '#CA8A04' },
  'orange': { bg: '#EA580C' },
  'tangerine': { bg: '#F97316' },
  'pink': { bg: '#EC4899' },
  'light pink': { bg: '#F472B6' },
  'hot pink': { bg: '#DB2777' },
  'magenta': { bg: '#C026D3' },
  'purple': { bg: '#9333EA' },
  'violet': { bg: '#7C3AED' },
  'lavender': { bg: '#C084FC' },
  'brown': { bg: '#78350F' },
  'chocolate': { bg: '#451A03' },
  'tan': { bg: '#D97706' },
  'gold': { bg: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #D97706 100%)', isGradient: true },
  'gold foil': { bg: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #D97706 100%)', isGradient: true },
  'silver': { bg: 'linear-gradient(135deg, #9CA3AF 0%, #F3F4F6 50%, #6B7280 100%)', isGradient: true },
  'silver foil': { bg: 'linear-gradient(135deg, #9CA3AF 0%, #F3F4F6 50%, #6B7280 100%)', isGradient: true },
  'copper': { bg: 'linear-gradient(135deg, #B45309 0%, #F59E0B 100%)', isGradient: true },
  'bronze': { bg: 'linear-gradient(135deg, #92400E 0%, #D97706 100%)', isGradient: true },
  'rose gold': { bg: 'linear-gradient(135deg, #FB7185 0%, #FDA4AF 50%, #E11D48 100%)', isGradient: true },
  'spot uv': { bg: 'linear-gradient(135deg, #1E1B4B 0%, #4338CA 100%)', isGradient: true },
  'transparent': { bg: 'repeating-conic-gradient(#E5E7EB 0% 25%, #FFFFFF 0% 50%) 50% / 10px 10px', isGradient: true, borderNeeded: true },
  'clear': { bg: 'repeating-conic-gradient(#E5E7EB 0% 25%, #FFFFFF 0% 50%) 50% / 10px 10px', isGradient: true, borderNeeded: true },
  'multicolor': { bg: 'conic-gradient(#EF4444, #F97316, #EAB308, #10B981, #3B82F6, #8B5CF6, #EF4444)', isGradient: true },
  'multi-color': { bg: 'conic-gradient(#EF4444, #F97316, #EAB308, #10B981, #3B82F6, #8B5CF6, #EF4444)', isGradient: true },
  'full color': { bg: 'conic-gradient(#EF4444, #F97316, #EAB308, #10B981, #3B82F6, #8B5CF6, #EF4444)', isGradient: true },
  'full-color': { bg: 'conic-gradient(#EF4444, #F97316, #EAB308, #10B981, #3B82F6, #8B5CF6, #EF4444)', isGradient: true }
};

export function getColorStyle(colorNameOrHex: string): ColorStyle {
  if (!colorNameOrHex || typeof colorNameOrHex !== 'string') {
    return { background: '#9CA3AF' };
  }

  const trimmed = colorNameOrHex.trim();

  // If hex code or rgb string
  if (trimmed.startsWith('#') || trimmed.startsWith('rgb')) {
    const isWhiteHex = trimmed.toLowerCase() === '#ffffff' || trimmed.toLowerCase() === '#fff';
    return { background: trimmed, borderNeeded: isWhiteHex };
  }

  const name = trimmed.toLowerCase();

  // Direct map match
  if (COLOR_MAP[name]) {
    return {
      background: COLOR_MAP[name].bg,
      borderNeeded: COLOR_MAP[name].borderNeeded
    };
  }

  // Dual color split check like "Black / White" or "Red / Blue"
  if (name.includes('/') || name.includes('&') || name.includes(' and ')) {
    const parts = name.split(/[\/&]|\band\b/).map(p => p.trim());
    if (parts.length === 2) {
      const s1 = getColorStyle(parts[0]);
      const s2 = getColorStyle(parts[1]);
      const bg1 = s1.background;
      const bg2 = s2.background;
      return {
        background: `linear-gradient(135deg, ${bg1} 50%, ${bg2} 50%)`,
        borderNeeded: s1.borderNeeded || s2.borderNeeded
      };
    }
  }

  // Partial keyword matching
  const keys = Object.keys(COLOR_MAP);
  for (const key of keys) {
    if (name.includes(key)) {
      return {
        background: COLOR_MAP[key].bg,
        borderNeeded: COLOR_MAP[key].borderNeeded
      };
    }
  }

  // Substring fallback checks
  if (name.includes('blue')) return { background: '#2563EB' };
  if (name.includes('red')) return { background: '#DC2626' };
  if (name.includes('green')) return { background: '#16A34A' };
  if (name.includes('yellow')) return { background: '#EAB308' };
  if (name.includes('black')) return { background: '#111827' };
  if (name.includes('white')) return { background: '#FFFFFF', borderNeeded: true };
  if (name.includes('pink')) return { background: '#EC4899' };
  if (name.includes('purple')) return { background: '#9333EA' };
  if (name.includes('orange')) return { background: '#EA580C' };
  if (name.includes('grey') || name.includes('gray')) return { background: '#6B7280' };

  // Fallback to a neutral muted gray
  return { background: '#D1D5DB', borderNeeded: true };
}

export function isColorCategory(categoryName: string, options?: any[]): boolean {
  if (!categoryName) return false;
  const name = categoryName.trim().toLowerCase();

  const colorKeywords = [
    'color', 'colour', 'shade', 'ink', 'print color', 'print colour',
    'lanyard colour', 'lanyard color', 'body colour', 'body color',
    'shirt colour', 'shirt color', 'cap colour', 'cap color',
    't-shirt colour', 't-shirt color', 'bag colour', 'bag color',
    'hoodie colour', 'hoodie color', 'cup colour', 'cup color',
    'mug colour', 'mug color', 'base colour', 'base color',
    'bottle colour', 'bottle color', 'strap colour', 'strap color',
    'thread colour', 'thread color', 'grip colour', 'grip color',
    'accent colour', 'accent color', 'cover colour', 'cover color'
  ];

  if (colorKeywords.some(k => name.includes(k))) {
    return true;
  }

  // Check options if available
  if (options && options.length > 0) {
    let matchCount = 0;
    for (const opt of options) {
      const optName = (typeof opt === 'string' ? opt : opt?.name || '').toLowerCase().trim();
      if (!optName) continue;
      if (COLOR_MAP[optName] || ['red', 'blue', 'green', 'black', 'white', 'yellow', 'pink', 'purple', 'grey', 'gray', 'orange', 'navy', 'royal blue', 'gold', 'silver', 'maroon'].some(c => optName.includes(c))) {
        matchCount++;
      }
    }
    if (matchCount / options.length >= 0.5) {
      return true;
    }
  }

  return false;
}

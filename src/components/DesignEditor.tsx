import React, { useState, useRef, useEffect } from 'react';
import { readPsd } from 'ag-psd';
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
import { EraserModal } from './EraserModal';
import { Eraser, 
  Settings, Type, FolderOpen,
  Square, 
  Circle, 
  Sparkles, 
  UploadCloud, 
  RotateCw, 
  Trash2, 
  Layers, 
  Undo2, 
  Redo2, 
  Save, 
  X, 
  Plus, 
  Minus, 
  Download, 
  LayoutTemplate, 
  Palette, 
  Image as ImageIcon, 
  ChevronUp, 
  ChevronDown, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Bold, 
  Italic,
  Star,
  Triangle,
  Smile,
  Heart,
  Flame,
  Award,
  Crown,
  Lock,
  Unlock,
  Check,
  RefreshCw,
  Wand2,
  Brain,
  AlertTriangle,
  Sparkle,
  RotateCcw,
  ChevronsUp, ChevronsDown,
  Crop, Zap, Keyboard, Copy, ImageOff, Maximize, PanelLeft, PanelRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/src/components/ui/button";

// Font families to choose from
const FONTS = [
  // Sans-Serif & Modern
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Space Grotesk", value: "'Space Grotesk', sans-serif" },
  { label: "Roboto", value: "Roboto, sans-serif" },
  { label: "Open Sans", value: "'Open Sans', sans-serif" },
  { label: "Montserrat", value: "Montserrat, sans-serif" },
  { label: "Lato", value: "Lato, sans-serif" },
  { label: "Oswald", value: "Oswald, sans-serif" },
  { label: "Raleway", value: "Raleway, sans-serif" },
  { label: "Ubuntu", value: "Ubuntu, sans-serif" },
  { label: "PT Sans", value: "'PT Sans', sans-serif" },
  { label: "Fira Sans", value: "'Fira Sans', sans-serif" },
  { label: "Quicksand", value: "Quicksand, sans-serif" },
  { label: "Kanit", value: "Kanit, sans-serif" },
  { label: "Dosis", value: "Dosis, sans-serif" },
  { label: "Teko", value: "Teko, sans-serif" },
  { label: "Comfortaa", value: "Comfortaa, cursive" },
  { label: "Source Sans Pro", value: "'Source Sans Pro', sans-serif" },

  // Serif & Classic
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Lora", value: "Lora, serif" },
  { label: "Crimson Text", value: "'Crimson Text', serif" },
  { label: "Bree Serif", value: "'Bree Serif', serif" },
  { label: "Cinzel", value: "Cinzel, serif" },
  { label: "Abril Fatface", value: "'Abril Fatface', serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Slabo 27px", value: "'Slabo 27px', serif" },

  // Display & Decorative
  { label: "Impact", value: "Impact, Charcoal, sans-serif" },
  { label: "Anton", value: "Anton, sans-serif" },
  { label: "Bebas Neue", value: "'Bebas Neue', sans-serif" },
  { label: "Righteous", value: "Righteous, cursive" },
  { label: "Lobster", value: "Lobster, cursive" },
  { label: "Pacifico", value: "Pacifico, cursive" },
  { label: "Caveat", value: "Caveat, cursive" },
  { label: "Dancing Script", value: "'Dancing Script', cursive" },
  { label: "Alfa Slab One", value: "'Alfa Slab One', cursive" },
  { label: "Bangers", value: "Bangers, cursive" },
  { label: "Fredoka One", value: "'Fredoka One', cursive" },
  { label: "Permanent Marker", value: "'Permanent Marker', cursive" },
  { label: "Satisfy", value: "Satisfy, cursive" },
  { label: "Amatic SC", value: "'Amatic SC', cursive" },
  { label: "Great Vibes", value: "'Great Vibes', cursive" },
  { label: "Play", value: "Play, sans-serif" },
  { label: "Shadows Into Light", value: "'Shadows Into Light', cursive" },
  { label: "Acme", value: "Acme, sans-serif" },
  { label: "Carter One", value: "'Carter One', cursive" },
  { label: "Chewy", value: "Chewy, cursive" },
  { label: "Concert One", value: "'Concert One', cursive" },
  { label: "Courgette", value: "Courgette, cursive" },
  { label: "Kalam", value: "Kalam, cursive" },
  { label: "Merienda", value: "Merienda, cursive" },

  // Monospace & System
  { label: "Inconsolata", value: "Inconsolata, monospace" },
  { label: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
  { label: "Arial", value: "Arial, sans-serif" }
];

// Preset background color options
const COLOR_PRESETS = [
  "#ffffff", "#f8fafc", "#f1f5f9", "#e2e8f0", "#cbd5e1", // Whites & grays
  "#09090b", "#18181b", "#27272a", "#3f3f46", "#52525b", // Blacks & darks
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", // Warm
  "#10b981", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", // Cool
  "#ec4899", "#f43f5e", "#ffedd5", "#ecfdf5", "#eff6ff"  // Accent & soft
];

// Sticker options with SVG paths for drawing
const STICKERS = [
  { id: "heart", label: "Heart", icon: Heart, path: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" },
  { id: "star", label: "Star", icon: Star, path: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" },
  { id: "triangle", label: "Triangle", icon: Triangle, path: "M12 2L2 22h20L12 2z" },
  { id: "sparkle", label: "Sparkles", icon: Sparkles, path: "M12 2l2.4 4.8 4.8 2.4-4.8 2.4-2.4 4.8-2.4-4.8-4.8-2.4 4.8-2.4L12 2z" },
  { id: "flame", label: "Flame", icon: Flame, path: "M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" },
  { id: "crown", label: "Crown", icon: Crown, path: "M2 4l3 12h14l3-12-5 4-5-6-5 6-5-4z" },
  { id: "smile", label: "Smile", icon: Smile, path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" }
];

export interface DesignLayer {
  id: string;
  type: "text" | "shape" | "image" | "sticker";
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // in radians
  locked?: boolean;
  upscale?: boolean;
  
  // Customization and FX properties for all/some layers
  opacity?: number; // 0 to 1
  blendMode?: string;
  visible?: boolean;
  flipX?: boolean;
  flipY?: boolean;
  brightness?: number; // percentage, e.g. 100
  contrast?: number; // percentage, e.g. 100
  saturate?: number; // percentage, e.g. 100
  grayscale?: number; // percentage, e.g. 0
  sepia?: number; // percentage, e.g. 0
  blur?: number; // pixels, e.g. 0
  hueRotate?: number; // degrees, e.g. 0
  crop?: { x: number; y: number; width: number; height: number }; // ratio coordinates 0 to 1
  
  // Text specific properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  fontWeight?: string; // "normal" | "bold"
  fontStyle?: string; // "normal" | "italic"
  align?: "left" | "center" | "right";
  letterSpacing?: number;
  lineHeight?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  
  // Shape specific properties
  shapeType?: "rectangle" | "circle" | "triangle" | "line" | "star";
  stroke?: string;
  strokeWidth?: number;
  
  // Image specific properties
  src?: string;
  originalSrc?: string;
  imageElement?: HTMLImageElement;
  
  // Sticker specific properties
  stickerPath?: string;
}

interface DesignTemplate {
  name: string;
  backgroundColor: string;
  layers: Omit<DesignLayer, "imageElement">[];
  preferredWidth?: number;
  preferredHeight?: number;
}

export interface DesignPage {
  id: string;
  backgroundColor: string;
  layers: DesignLayer[];
}

// Category-specific templates for amazing user starts
const TEMPLATES_BY_CATEGORY: Record<string, DesignTemplate[]> = {
  "business-cards": [
    {
      name: "Corporate Minimalist Black",
      backgroundColor: "#0d0e12",
      preferredWidth: 1050,
      preferredHeight: 600,
      layers: [
        { id: "line-accent", type: "shape", name: "Gold Divider", x: 100, y: 300, width: 850, height: 4, rotation: 0, shapeType: "rectangle", fill: "#d4af37" },
        { id: "company-title", type: "text", name: "Company Name", x: 525, y: 150, width: 900, height: 60, rotation: 0, text: "NEXUS ENTERPRISES", fontSize: 44, fontFamily: "'Space Grotesk', sans-serif", fill: "#ffffff", fontWeight: "bold", align: "center" },
        { id: "company-slogan", type: "text", name: "Slogan", x: 525, y: 210, width: 900, height: 30, rotation: 0, text: "Innovating the Future of Print", fontSize: 16, fontFamily: "Inter, sans-serif", fill: "#9ca3af", fontWeight: "normal", align: "center" },
        { id: "name-title", type: "text", name: "Contact Person", x: 525, y: 380, width: 900, height: 40, rotation: 0, text: "ALEXANDER MERCER", fontSize: 26, fontFamily: "'Playfair Display', serif", fill: "#d4af37", fontWeight: "bold", align: "center" },
        { id: "job-title", type: "text", name: "Job Title", x: 525, y: 430, width: 900, height: 35, rotation: 0, text: "Chief Executive Officer", fontSize: 15, fontFamily: "'JetBrains Mono', monospace", fill: "#ffffff", fontWeight: "normal", align: "center" },
        { id: "contact-info", type: "text", name: "Contact Details", x: 525, y: 520, width: 950, height: 80, rotation: 0, text: "✉ hello@nexus-corp.com   |   ☎ +1 (555) 123-4567   |   🌐 www.nexus-corp.com", fontSize: 13, fontFamily: "Inter, sans-serif", fill: "#9ca3af", fontWeight: "normal", align: "center" }
      ]
    },
    {
      name: "Creative Modern Pastel",
      backgroundColor: "#fefeff",
      preferredWidth: 1050,
      preferredHeight: 600,
      layers: [
        { id: "bg-circle", type: "shape", name: "Pastel Circle", x: 850, y: 150, width: 250, height: 250, rotation: 0, shapeType: "circle", fill: "#ebdcfb" },
        { id: "bg-rect", type: "shape", name: "Pastel Rect", x: 120, y: 500, width: 350, height: 120, rotation: 0.15, shapeType: "rectangle", fill: "#d6f2fe" },
        { id: "name-main", type: "text", name: "Creative Name", x: 100, y: 200, width: 500, height: 80, rotation: 0, text: "ZARA FLYNN", fontSize: 54, fontFamily: "'Space Grotesk', sans-serif", fill: "#1e1b4b", fontWeight: "bold", align: "left" },
        { id: "role-main", type: "text", name: "Creative Role", x: 100, y: 270, width: 500, height: 40, rotation: 0, text: "Brand Identity Designer", fontSize: 18, fontFamily: "Inter, sans-serif", fill: "#6366f1", fontWeight: "bold", align: "left" },
        { id: "star-sticker-1", type: "sticker", name: "Brand Accent", x: 440, y: 180, width: 50, height: 50, rotation: 0.2, stickerPath: "M12 2l2.4 4.8 4.8 2.4-4.8 2.4-2.4 4.8-2.4-4.8-4.8-2.4 4.8-2.4L12 2z", fill: "#eab308" },
        { id: "phone-text", type: "text", name: "Phone Info", x: 100, y: 380, width: 400, height: 30, rotation: 0, text: "📱 +91 98765 43210", fontSize: 15, fontFamily: "Inter, sans-serif", fill: "#374151", fontWeight: "normal", align: "left" },
        { id: "email-text", type: "text", name: "Email Info", x: 100, y: 420, width: 400, height: 30, rotation: 0, text: "✉ craft@flynndesigns.co", fontSize: 15, fontFamily: "Inter, sans-serif", fill: "#374151", fontWeight: "normal", align: "left" },
        { id: "web-text", type: "text", name: "Web Info", x: 100, y: 460, width: 400, height: 30, rotation: 0, text: "🌐 www.flynndesigns.co", fontSize: 15, fontFamily: "Inter, sans-serif", fill: "#374151", fontWeight: "normal", align: "left" }
      ]
    },
    {
      name: "Luxury Gold Card",
      backgroundColor: "#1c1917",
      preferredWidth: 1050,
      preferredHeight: 600,
      layers: [
        { id: "gold-border-1", type: "shape", name: "Gold Frame", x: 525, y: 300, width: 1010, height: 560, rotation: 0, shapeType: "rectangle", fill: "transparent", stroke: "#e2b86e", strokeWidth: 3 },
        { id: "gold-line-top", type: "shape", name: "Accent Line", x: 525, y: 120, width: 120, height: 2, rotation: 0, shapeType: "rectangle", fill: "#e2b86e" },
        { id: "lux-title", type: "text", name: "Primary Title", x: 525, y: 220, width: 900, height: 50, rotation: 0, text: "VALENTINO HOMES", fontSize: 34, fontFamily: "'Playfair Display', serif", fill: "#e2b86e", fontWeight: "bold", align: "center" },
        { id: "lux-sub", type: "text", name: "Subtitle", x: 525, y: 280, width: 900, height: 30, rotation: 0, text: "EXCLUSIVE REAL ESTATE & VILLAS", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fill: "#a8a29e", fontWeight: "normal", align: "center" },
        { id: "lux-divider", type: "shape", name: "Middle Dot", x: 525, y: 340, width: 10, height: 10, rotation: 0, shapeType: "circle", fill: "#e2b86e" },
        { id: "lux-address", type: "text", name: "Luxury Details", x: 525, y: 440, width: 900, height: 100, rotation: 0, text: "PARK AVENUE BUILDINGS, NEW YORK\nT: +1 (212) 800-VALENTINO  |  W: VALENTINOHOMES.COM", fontSize: 13, fontFamily: "Inter, sans-serif", fill: "#e7e5e4", fontWeight: "normal", align: "center" }
      ]
    }
  ],
  "posters-flyers": [
    {
      name: "Modern Design Conference",
      backgroundColor: "#4f46e5",
      preferredWidth: 700,
      preferredHeight: 990,
      layers: [
        { id: "post-decor-circle", type: "shape", name: "Art Circle", x: 350, y: 550, width: 500, height: 500, rotation: 0, shapeType: "circle", fill: "#4338ca" },
        { id: "post-decor-rect", type: "shape", name: "Neon Bar", x: 550, y: 700, width: 300, height: 100, rotation: -0.4, shapeType: "rectangle", fill: "#06b6d4" },
        { id: "post-tag", type: "text", name: "Event Category", x: 80, y: 150, width: 540, height: 30, rotation: 0, text: "CREATIVE SUMMIT 2026", fontSize: 14, fontFamily: "'JetBrains Mono', monospace", fill: "#22d3ee", fontWeight: "bold", align: "left" },
        { id: "post-title-1", type: "text", name: "Main Title Top", x: 80, y: 220, width: 540, height: 70, rotation: 0, text: "THE FUTURE", fontSize: 60, fontFamily: "'Space Grotesk', sans-serif", fill: "#ffffff", fontWeight: "bold", align: "left" },
        { id: "post-title-2", type: "text", name: "Main Title Bottom", x: 80, y: 290, width: 540, height: 70, rotation: 0, text: "OF BRANDING", fontSize: 60, fontFamily: "'Space Grotesk', sans-serif", fill: "#ffffff", fontWeight: "bold", align: "left" },
        { id: "post-sticker", type: "sticker", name: "Modern Star", x: 520, y: 220, width: 100, height: 100, rotation: 0.3, stickerPath: "M12 2l2.4 4.8 4.8 2.4-4.8 2.4-2.4 4.8-2.4-4.8-4.8-2.4 4.8-2.4L12 2z", fill: "#facc15" },
        { id: "post-desc", type: "text", name: "Brief Desc", x: 80, y: 410, width: 450, height: 120, rotation: 0, text: "Join 45+ visionary graphic designers, brand experts, and creative directors in a 3-day immersive print workshop in New Delhi.", fontSize: 16, fontFamily: "Inter, sans-serif", fill: "#e0e7ff", fontWeight: "normal", align: "left" },
        { id: "post-date-block", type: "text", name: "Event Coordinates", x: 80, y: 700, width: 540, height: 80, rotation: 0, text: "DATES: OCT 12-14, 2026\nVENUE: PRAGATI MAIDAN EXHIBITION CENTRE", fontSize: 18, fontFamily: "'Space Grotesk', sans-serif", fill: "#ffffff", fontWeight: "bold", align: "left" },
        { id: "post-ticket", type: "text", name: "Footer Note", x: 80, y: 880, width: 540, height: 40, rotation: 0, text: "🎟 REGISTER ONLINE AT BRANDINGSUMMIT.IN — FIRST 200 TICKETS FREE", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fill: "#22d3ee", fontWeight: "bold", align: "left" }
      ]
    },
    {
      name: "Gourmet Bakery Grand Opening",
      backgroundColor: "#fffbeb",
      preferredWidth: 700,
      preferredHeight: 990,
      layers: [
        { id: "bake-border", type: "shape", name: "Scallop Border", x: 350, y: 495, width: 640, height: 930, rotation: 0, shapeType: "rectangle", fill: "transparent", stroke: "#d97706", strokeWidth: 4 },
        { id: "bake-logo", type: "sticker", name: "Wheat Logo", x: 350, y: 180, width: 80, height: 80, rotation: 0, stickerPath: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z", fill: "#b45309" },
        { id: "bake-title-1", type: "text", name: "Bakery Name", x: 350, y: 300, width: 600, height: 50, rotation: 0, text: "ARTISANAL BREADS & CO.", fontSize: 34, fontFamily: "'Playfair Display', serif", fill: "#78350f", fontWeight: "bold", align: "center" },
        { id: "bake-slogan", type: "text", name: "Bake Sub", x: 350, y: 360, width: 600, height: 30, rotation: 0, text: "STREETSIDE CAFE & ORGANIC OVEN", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fill: "#b45309", fontWeight: "normal", align: "center" },
        { id: "bake-highlight", type: "text", name: "Offer Title", x: 350, y: 520, width: 500, height: 50, rotation: 0, text: "GRAND OPENING", fontSize: 40, fontFamily: "'Space Grotesk', sans-serif", fill: "#d97706", fontWeight: "bold", align: "center" },
        { id: "bake-details", type: "text", name: "Offer Sub", x: 350, y: 590, width: 550, height: 80, rotation: 0, text: "JOIN US FOR FRESH CROISSANTS & SOURDOUGH\nGET 50% OFF ON ALL COFFEE & PASTRIES", fontSize: 16, fontFamily: "Inter, sans-serif", fill: "#78350f", fontWeight: "bold", align: "center" },
        { id: "bake-time", type: "text", name: "Opening Date", x: 350, y: 740, width: 600, height: 60, rotation: 0, text: "JULY 25TH, 2026   •   STARTING 7:00 AM\nMETRO CROSSINGS, NEW DELHI", fontSize: 14, fontFamily: "Inter, sans-serif", fill: "#b45309", fontWeight: "normal", align: "center" }
      ]
    }
  ],
  "social-media": [
    {
      name: "Minimalist Quote Post",
      backgroundColor: "#111827",
      preferredWidth: 800,
      preferredHeight: 800,
      layers: [
        { id: "quote-icon", type: "text", name: "Quote Icon", x: 150, y: 220, width: 100, height: 100, rotation: 0, text: "“", fontSize: 140, fontFamily: "'Playfair Display', serif", fill: "#8b5cf6", fontWeight: "bold", align: "left" },
        { id: "quote-text", type: "text", name: "Main Quote", x: 150, y: 350, width: 500, height: 220, rotation: 0, text: "Design is not just what it looks like and feels like. Design is how it works.", fontSize: 34, fontFamily: "'Space Grotesk', sans-serif", fill: "#f9fafb", fontWeight: "bold", align: "left" },
        { id: "quote-author", type: "text", name: "Author", x: 150, y: 580, width: 500, height: 30, rotation: 0, text: "— STEVE JOBS", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fill: "#8b5cf6", fontWeight: "bold", align: "left" }
      ]
    },
    {
      name: "Cyberpunk Tech Sale",
      backgroundColor: "#09090b",
      preferredWidth: 800,
      preferredHeight: 800,
      layers: [
        { id: "grid-bar-1", type: "shape", name: "Cyber Line 1", x: 400, y: 100, width: 700, height: 2, rotation: 0, shapeType: "rectangle", fill: "#3f3f46" },
        { id: "grid-bar-2", type: "shape", name: "Neon Line 2", x: 400, y: 700, width: 700, height: 4, rotation: 0, shapeType: "rectangle", fill: "#f43f5e" },
        { id: "cyber-label", type: "text", name: "System Prefix", x: 100, y: 150, width: 600, height: 30, rotation: 0, text: "SYS_INIT // SYSTEM ALERT", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fill: "#f43f5e", fontWeight: "bold", align: "left" },
        { id: "cyber-title-1", type: "text", name: "Cyber Header", x: 100, y: 280, width: 600, height: 80, rotation: 0, text: "NEO FLASH", fontSize: 64, fontFamily: "'Space Grotesk', sans-serif", fill: "#ffffff", fontWeight: "black", align: "left" },
        { id: "cyber-title-2", type: "text", name: "Cyber Subheader", x: 100, y: 360, width: 600, height: 80, rotation: 0, text: "TECH CLEARANCE", fontSize: 50, fontFamily: "'Space Grotesk', sans-serif", fill: "#a1a1aa", fontWeight: "bold", align: "left" },
        { id: "cyber-discount", type: "text", name: "Promo Metric", x: 580, y: 220, width: 140, height: 140, rotation: 0.15, text: "-70%", fontSize: 44, fontFamily: "'Space Grotesk', sans-serif", fill: "#f43f5e", fontWeight: "black", align: "center" },
        { id: "cyber-footer", type: "text", name: "Details text", x: 100, y: 550, width: 600, height: 80, rotation: 0, text: "UPGRADE CORP UNITS NOW. LIMITED SUPPLY.\nVERIFIED SECURITY KEY: 0x889F-CE44", fontSize: 14, fontFamily: "'JetBrains Mono', monospace", fill: "#ffffff", fontWeight: "normal", align: "left" }
      ]
    }
  ],
  "apparel": [
    {
      name: "Retro Urban Streetwear",
      backgroundColor: "transparent",
      preferredWidth: 800,
      preferredHeight: 800,
      layers: [
        { id: "bg-circle-retro", type: "shape", name: "Sun Accent", x: 400, y: 400, width: 350, height: 350, rotation: 0, shapeType: "circle", fill: "#f97316" },
        { id: "street-text-1", type: "text", name: "Top Text", x: 400, y: 350, width: 700, height: 100, rotation: 0, text: "TOKYO", fontSize: 72, fontFamily: "'Space Grotesk', sans-serif", fill: "#ffffff", fontWeight: "bold", align: "center" },
        { id: "street-text-2", type: "text", name: "Bottom Text", x: 400, y: 450, width: 700, height: 100, rotation: 0, text: "SHIBUYA", fontSize: 72, fontFamily: "'Space Grotesk', sans-serif", fill: "#111827", fontWeight: "bold", align: "center" },
        { id: "sub-coord", type: "text", name: "Coordinate Subtitle", x: 400, y: 530, width: 500, height: 30, rotation: 0, text: "35.6580° N, 139.7016° E — TOKYO URBAN SECTOR", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fill: "#f97316", fontWeight: "bold", align: "center" },
        { id: "star-left", type: "sticker", name: "Left Sparkle", x: 180, y: 380, width: 60, height: 60, rotation: -0.2, stickerPath: "M12 2l2.4 4.8 4.8 2.4-4.8 2.4-2.4 4.8-2.4-4.8-4.8-2.4 4.8-2.4L12 2z", fill: "#fbbf24" },
        { id: "star-right", type: "sticker", name: "Right Sparkle", x: 620, y: 380, width: 60, height: 60, rotation: 0.2, stickerPath: "M12 2l2.4 4.8 4.8 2.4-4.8 2.4-2.4 4.8-2.4-4.8-4.8-2.4 4.8-2.4L12 2z", fill: "#fbbf24" }
      ]
    },
    {
      name: "Athletic Team Varsity",
      backgroundColor: "transparent",
      preferredWidth: 800,
      preferredHeight: 800,
      layers: [
        { id: "athletic-star", type: "sticker", name: "Central Star", x: 400, y: 310, width: 140, height: 140, rotation: 0, stickerPath: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z", fill: "#ef4444" },
        { id: "varsity-text-1", type: "text", name: "Varsity Team", x: 400, y: 480, width: 600, height: 65, rotation: 0, text: "CHAMPIONS", fontSize: 50, fontFamily: "Impact, Charcoal, sans-serif", fill: "#1e3a8a", fontWeight: "bold", align: "center" },
        { id: "varsity-year", type: "text", name: "Establish Year", x: 400, y: 550, width: 400, height: 40, rotation: 0, text: "CLASS OF '26", fontSize: 28, fontFamily: "'Space Grotesk', sans-serif", fill: "#b91c1c", fontWeight: "bold", align: "center" },
        { id: "line-team-top", type: "shape", name: "Top Line", x: 400, y: 420, width: 300, height: 6, rotation: 0, shapeType: "rectangle", fill: "#1e3a8a" },
        { id: "line-team-bottom", type: "shape", name: "Bottom Line", x: 400, y: 590, width: 180, height: 4, rotation: 0, shapeType: "rectangle", fill: "#1e3a8a" }
      ]
    },
    {
      name: "Minimalist Corporate Logo",
      backgroundColor: "transparent",
      preferredWidth: 800,
      preferredHeight: 800,
      layers: [
        { id: "corp-icon", type: "sticker", name: "Award Seal Logo", x: 400, y: 350, width: 100, height: 100, rotation: 0, stickerPath: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z", fill: "#0ea5e9" },
        { id: "corp-main-text", type: "text", name: "Company Name", x: 400, y: 480, width: 600, height: 45, rotation: 0, text: "CORE TECH", fontSize: 32, fontFamily: "'Space Grotesk', sans-serif", fill: "#0f172a", fontWeight: "bold", align: "center" },
        { id: "corp-sub-text", type: "text", name: "Sub-label", x: 400, y: 520, width: 600, height: 25, rotation: 0, text: "MEMBER TEAM", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fill: "#64748b", fontWeight: "normal", align: "center" }
      ]
    }
  ]
};

export function getCSSFilterString(layer: Partial<DesignLayer>) {
  const filterParts: string[] = [];
  if (layer.brightness !== undefined && layer.brightness !== 100) filterParts.push(`brightness(${layer.brightness}%)`);
  if (layer.contrast !== undefined && layer.contrast !== 100) filterParts.push(`contrast(${layer.contrast}%)`);
  if (layer.saturate !== undefined && layer.saturate !== 100) filterParts.push(`saturate(${layer.saturate}%)`);
  if (layer.grayscale !== undefined && layer.grayscale > 0) filterParts.push(`grayscale(${layer.grayscale}%)`);
  if (layer.sepia !== undefined && layer.sepia > 0) filterParts.push(`sepia(${layer.sepia}%)`);
  if (layer.blur !== undefined && layer.blur > 0) filterParts.push(`blur(${layer.blur}px)`);
  if (layer.hueRotate !== undefined && layer.hueRotate !== 0) filterParts.push(`hue-rotate(${layer.hueRotate}deg)`);
  return filterParts.join(" ") || "none";
}

interface DesignEditorProps {
  product: any;
  activePlacement: string;
  selectedColor?: any;
  onSave: (file: File) => void;
  onClose: () => void;
}


export function DesignEditor({ product, activePlacement, selectedColor, onSave, onClose }: DesignEditorProps) { console.log("DesignEditor rendered!", product, activePlacement);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Canvas configuration dimensions (Virtual canvas can be customized by the user!)
  const [virtualWidth, setVirtualWidth] = useState<number>(800);
  const [virtualHeight, setVirtualHeight] = useState<number>(800);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>("all");
  
  const [pages, setPages] = useState<DesignPage[]>([{ id: `page-${Date.now()}`, backgroundColor: "#ffffff", layers: [] }]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  const layers = pages[currentPageIndex]?.layers || [];
  const backgroundColor = pages[currentPageIndex]?.backgroundColor || "#ffffff";

  const setLayers = (newLayers: DesignLayer[] | ((prev: DesignLayer[]) => DesignLayer[])) => {
    setPages(prevPages => {
      const updated = [...prevPages];
      if (!updated[currentPageIndex]) return prevPages;
      const page = updated[currentPageIndex];
      const result = typeof newLayers === 'function' ? newLayers(page.layers) : newLayers;
      updated[currentPageIndex] = { ...page, layers: result };
      return updated;
    });
  };

  const setBackgroundColor = (color: string | ((prev: string) => string)) => {
    setPages(prevPages => {
      const updated = [...prevPages];
      if (!updated[currentPageIndex]) return prevPages;
      const page = updated[currentPageIndex];
      const result = typeof color === 'function' ? color(page.backgroundColor) : color;
      updated[currentPageIndex] = { ...page, backgroundColor: result };
      return updated;
    });
  };

  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [editingTextLayerId, setEditingTextLayerId] = useState<string | null>(null);
  const [replacingImageLayerId, setReplacingImageLayerId] = useState<string | null>(null);
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);
  const [dragStartLayers, setDragStartLayers] = useState<DesignLayer[]>([]);
  
  // Cropper states
  const [croppingLayerId, setCroppingLayerId] = useState<string | null>(null);
  const [cropLeft, setCropLeft] = useState<number>(0);
  const [cropRight, setCropRight] = useState<number>(0);
  const [cropTop, setCropTop] = useState<number>(0);
  const [cropBottom, setCropBottom] = useState<number>(0);
  const [customRatioW, setCustomRatioW] = useState<number>(4);
  const [customRatioH, setCustomRatioH] = useState<number>(3);
  const cropBoxRef = useRef<HTMLDivElement>(null);
  const [activeCropDrag, setActiveCropDrag] = useState<{
    handle: string;
    startX: number;
    startY: number;
    startLeft: number;
    startRight: number;
    startTop: number;
    startBottom: number;
  } | null>(null);

  // Startup canvas selection states
  const [showSizeSelectorModal, setShowSizeSelectorModal] = useState<boolean>(true);
  const [initWidth, setInitWidth] = useState<number>(800);
  const [initHeight, setInitHeight] = useState<number>(800);
  const [customWidthInput, setCustomWidthInput] = useState<string>("800");
  const [customHeightInput, setCustomHeightInput] = useState<string>("800");

  // Canvas Crop states
  const [isCanvasCropping, setIsCanvasCropping] = useState<boolean>(false);
  const [canvasShaveLeft, setCanvasShaveLeft] = useState<number>(0);
  const [canvasShaveRight, setCanvasShaveRight] = useState<number>(0);
  const [canvasShaveTop, setCanvasShaveTop] = useState<number>(0);
  const [canvasShaveBottom, setCanvasShaveBottom] = useState<number>(0);

  const [activeTab, setActiveTab] = useState<"templates" | "text" | "shapes" | "background" | "upload" | "ai" | "settings">("templates");
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(true);

  useEffect(() => {
    if (selectedLayerId) {
      setActiveTab("settings");
      setIsLeftSidebarOpen(true);
    }
  }, [selectedLayerId]);

  const [aiSubTab, setAiSubTab] = useState<"copy" | "palette" | "audit" | "image">("copy");
  
  // AI Image Generator States
  const [aiImagePrompt, setAiImagePrompt] = useState<string>("");
  const [aiImageAspectRatio, setAiImageAspectRatio] = useState<string>("1:1");
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string>("");
  const [aiGeneratingImage, setAiGeneratingImage] = useState<boolean>(false);
  const [aiImageError, setAiImageError] = useState<string>("");
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  
  const [isConverting, setIsConverting] = useState(false);
  const [conversionMessage, setConversionMessage] = useState<string>("");
  const [isEraserOpen, setIsEraserOpen] = useState(false);
  
  // AI Design Assistant States
  const [aiProductType, setAiProductType] = useState<string>(product?.name || "");
  const [aiIndustry, setAiIndustry] = useState<string>("Retail");
  const [aiTone, setAiTone] = useState<string>("Professional");
  const [aiContext, setAiContext] = useState<string>("");
  const [aiGeneratedTexts, setAiGeneratedTexts] = useState<Array<{ label: string, text: string }>>([]);
  const [aiGeneratingTexts, setAiGeneratingTexts] = useState<boolean>(false);

  const [aiVibe, setAiVibe] = useState<string>("");
  const [aiGeneratedPalette, setAiGeneratedPalette] = useState<{
    paletteName: string;
    description: string;
    colors: Array<{ hex: string; name: string; usage: string }>;
  } | null>(null);
  const [aiGeneratingColors, setAiGeneratingColors] = useState<boolean>(false);

  const [aiDesignReview, setAiDesignReview] = useState<{
    overallScore: number;
    critiqueSummary: string;
    issues: Array<{ severity: 'info' | 'warning' | 'error'; category: string; message: string }>;
    suggestions: Array<string>;
  } | null>(null);
  const [aiReviewingDesign, setAiReviewingDesign] = useState<boolean>(false);

  const handleGenerateTexts = async () => {
    setAiGeneratingTexts(true);
    try {
      const response = await fetch("/api/ai/suggest-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType: aiProductType || product?.name || "custom print",
          industry: aiIndustry,
          tone: aiTone,
          description: aiContext,
        })
      });
      if (response.ok) {
        const text = await response.text();
        const data = text ? JSON.parse(text) : {};
        setAiGeneratedTexts(data.suggestions || data);
      } else {
        console.error("Failed to fetch AI texts");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiGeneratingTexts(false);
    }
  };

  const handleGeneratePalette = async () => {
    if (!aiVibe.trim()) return;
    setAiGeneratingColors(true);
    try {
      const response = await fetch("/api/ai/suggest-colors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vibe: aiVibe })
      });
      if (response.ok) {
        const text = await response.text();
        const data = text ? JSON.parse(text) : {};
        setAiGeneratedPalette(data);
      } else {
        console.error("Failed to fetch AI palette");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiGeneratingColors(false);
    }
  };

  const handleReviewDesign = async () => {
    setAiReviewingDesign(true);
    try {
      const response = await fetch("/api/ai/review-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layers,
          backgroundColor,
          productType: product?.name || "custom print",
        })
      });
      if (response.ok) {
        const text = await response.text();
        const data = text ? JSON.parse(text) : {};
        setAiDesignReview(data);
      } else {
        console.error("Failed to review design");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiReviewingDesign(false);
    }
  };

  const handleRemoveBackground = () => {
    if (!selectedLayer || selectedLayer.type !== "image" || !selectedLayer.imageElement) return;
    setIsProcessingImage(true);
    setTimeout(() => {
      setIsProcessingImage(false);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = selectedLayer.imageElement!.width;
      canvas.height = selectedLayer.imageElement!.height;
      ctx.drawImage(selectedLayer.imageElement!, 0, 0);
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // simple chroma key / threshold to remove bright background
          if (r > 240 && g > 240 && b > 240) {
            data[i + 3] = 0;
          }
        }
        ctx.putImageData(imageData, 0, 0);
        const newSrc = canvas.toDataURL("image/png");
        
        const newImg = new Image();
        newImg.crossOrigin = "anonymous";
        newImg.onload = () => {
          const originalSrc = selectedLayer.originalSrc || selectedLayer.src;
          const newLayers = layers.map(l => l.id === selectedLayer.id ? { 
            ...l, 
            src: newSrc, 
            imageElement: newImg,
            originalSrc
          } : l);
          updateSelectedLayerProps({ src: newSrc, imageElement: newImg, originalSrc });
          saveHistoryState(newLayers);
        };
        newImg.src = newSrc;
      } catch (err) {
        console.error("Canvas manipulation failed", err);
      }
    }, 1500);
  };

  const handleUpscaleImage = () => {
    if (!selectedLayer || selectedLayer.type !== "image" || !selectedLayer.imageElement) return;
    setIsProcessingImage(true);
    setTimeout(() => {
      setIsProcessingImage(false);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = selectedLayer.imageElement!.width * 2;
      canvas.height = selectedLayer.imageElement!.height * 2;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(selectedLayer.imageElement!, 0, 0, canvas.width, canvas.height);
      try {
        const newSrc = canvas.toDataURL("image/png");
        const newImg = new Image();
        newImg.crossOrigin = "anonymous";
        newImg.onload = () => {
          const originalSrc = selectedLayer.originalSrc || selectedLayer.src;
          const newLayers = layers.map(l => l.id === selectedLayer.id ? { 
            ...l, 
            src: newSrc, 
            imageElement: newImg,
            originalSrc
          } : l);
          updateSelectedLayerProps({ src: newSrc, imageElement: newImg, originalSrc });
          saveHistoryState(newLayers);
        };
        newImg.src = newSrc;
      } catch (err) {
        console.error("Canvas manipulation failed", err);
      }
    }, 1500);
  };

  const handleUndoImage = () => {
    if (!selectedLayer || selectedLayer.type !== "image" || !selectedLayer.originalSrc) return;
    const oldSrc = selectedLayer.originalSrc;
    const newImg = new Image();
    newImg.crossOrigin = "anonymous";
    newImg.onload = () => {
      const newLayers = layers.map(l => l.id === selectedLayer.id ? { 
        ...l, 
        src: oldSrc, 
        imageElement: newImg,
        originalSrc: undefined
      } : l);
      updateSelectedLayerProps({ src: oldSrc, imageElement: newImg, originalSrc: undefined });
      saveHistoryState(newLayers);
    };
    newImg.src = oldSrc;
  };

  const handleGenerateImage = async () => {
    if (!aiImagePrompt.trim()) return;
    setAiGeneratingImage(true);
    setAiImageError("");
    try {
      const response = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiImagePrompt,
          aspectRatio: aiImageAspectRatio,
        })
      });
      if (response.ok) {
        const text = await response.text();
        const data = text ? JSON.parse(text) : {};
        setAiGeneratedImage(data.imageUrl);
      } else {
        const errText = await response.text();
        const errData = errText ? JSON.parse(errText) : {};
        setAiImageError(errData.error || "Failed to generate image");
      }
    } catch (err: any) {
      setAiImageError(err.message || "Failed to generate image");
    } finally {
      setAiGeneratingImage(false);
    }
  };

  // Custom font size and properties for active layer
  const [textColor, setTextColor] = useState<string>("#000000");
  const [fontSize, setFontSize] = useState<number>(36);
  const [fontFamily, setFontFamily] = useState<string>("Inter, sans-serif");
  const [fontWeight, setFontWeight] = useState<string>("normal");
  const [fontStyle, setFontStyle] = useState<string>("normal");
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("center");
  
  // State for loaded images to avoid flickering and allow fast redrawing
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [clipboardLayer, setClipboardLayer] = useState<DesignLayer | null>(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState<boolean>(false);
  const [snapLines, setSnapLines] = useState<{x?: number, y?: number}>({});

  // History for Undo/Redo
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Drag and transform tracking states
  const [dragMode, setDragMode] = useState<"move" | "resize" | "rotate" | null>(null);
  const [dragStartMouse, setDragStartMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragStartLayer, setDragStartLayer] = useState<DesignLayer | null>(null);
  const [resizeHandleId, setResizeHandleId] = useState<string | null>(null); // "tl", "tr", "bl", "br"
  const [canvasScale, setCanvasScale] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const selectedLayer = layers.find(l => l.id === selectedLayerId);
  const isApparel = product?.category?.toLowerCase() === "apparel" || product?.name?.toLowerCase().includes("t-shirt") || product?.name?.toLowerCase().includes("hoodie");
  const isBusinessCard = product?.category?.toLowerCase() === "business cards" || product?.name?.toLowerCase().includes("visiting") || product?.name?.toLowerCase().includes("business card");

  // Determine templates to offer using our interactive category tab filter
  const availableTemplates = selectedCategoryTab === "all" 
    ? Object.values(TEMPLATES_BY_CATEGORY).flat() 
    : TEMPLATES_BY_CATEGORY[selectedCategoryTab] || [];

  const pagesRef = useRef(pages);
  useEffect(() => { pagesRef.current = pages; }, [pages]);

  // History tracking functions
  const saveHistoryState = (newLayers?: DesignLayer[]) => {
    let currentPages = [...pagesRef.current];
    if (newLayers && currentPages[currentPageIndex]) {
       currentPages[currentPageIndex] = { ...currentPages[currentPageIndex], layers: newLayers };
    }
    const serialized = JSON.stringify(currentPages.map(p => ({
      ...p,
      layers: p.layers.map(l => ({ ...l, imageElement: undefined }))
    })));
    const updatedHistory = history.slice(0, historyIndex + 1);
    const finalHistory = [...updatedHistory, serialized];
    
    // Cap history length to 30
    if (finalHistory.length > 30) {
      finalHistory.shift();
    }
    setHistory(finalHistory);
    setHistoryIndex(finalHistory.length - 1);
  };

  // Handle transparency/background base for apparel vs non-apparel and set canvas dimensions & default layers
  useEffect(() => {
    let initialWidth = 800;
    let initialHeight = 800;

    if (isApparel) {
      // Apparel has custom overlay print, so transparency is ideal
      setBackgroundColor("transparent");
      setSelectedCategoryTab("apparel");
      initialWidth = 800;
      initialHeight = 800;
    } else if (isBusinessCard) {
      setBackgroundColor("#ffffff");
      setSelectedCategoryTab("business-cards");
      initialWidth = 1050;
      initialHeight = 600;
    } else {
      setBackgroundColor("#ffffff");
      setSelectedCategoryTab("all");
      initialWidth = 800;
      initialHeight = 800;
    }

    setVirtualWidth(initialWidth);
    setVirtualHeight(initialHeight);
    setInitWidth(initialWidth);
    setInitHeight(initialHeight);
    setShowSizeSelectorModal(true);
    
    // Add simple default text layers to get them started if no template
    const defaultText: DesignLayer = {
      id: "default-title",
      type: "text",
      name: "Welcome Text",
      x: Math.round(initialWidth / 2),
      y: Math.round(initialHeight / 2),
      width: Math.min(500, initialWidth - 60),
      height: 60,
      rotation: 0,
      text: "Customize Me!",
      fontSize: 48,
      fontFamily: "'Space Grotesk', sans-serif",
      fill: isApparel ? "#111827" : "#8b5cf6",
      fontWeight: "bold",
      align: "center"
    };
    
    setLayers([defaultText]);
    saveHistoryState([defaultText]);
  }, [product]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevPagesData = JSON.parse(history[prevIndex]);
      restorePagesFromData(prevPagesData);
      setHistoryIndex(prevIndex);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextPagesData = JSON.parse(history[nextIndex]);
      restorePagesFromData(nextPagesData);
      setHistoryIndex(nextIndex);
    }
  };

  const restorePagesFromData = (pagesData: any[]) => {
    // If the data is an array of layers (legacy format for first step), convert it
    if (pagesData.length > 0 && pagesData[0].type && ["text", "shape", "image", "sticker"].includes(pagesData[0].type)) {
      const restored = restoreLayersFromData(pagesData);
      setPages([{ id: `page-${Date.now()}`, backgroundColor: "#ffffff", layers: restored }]);
      return;
    }

    const restoredPages = pagesData.map(page => ({
      ...page,
      layers: restoreLayersFromData(page.layers)
    }));
    setPages(restoredPages);
  };

  const restoreLayersFromData = (layersData: any[]) => {
    return layersData.map(data => {
      if (data.type === "image" && data.src) {
        // Restore preloaded image if exists, else trigger load
        const cached = loadedImages[data.src];
        if (cached) {
          return { ...data, imageElement: cached };
        } else {
          const img = new Image();
          if (data.src && !data.src.startsWith("data:")) img.crossOrigin = "anonymous";
          img.onload = () => {
            setLoadedImages(prev => ({ ...prev, [data.src]: img }));
            setPages(currPages => currPages.map(page => ({
               ...page,
               layers: page.layers.map(l => l.id === data.id ? { ...l, imageElement: img } : l)
            })));
          };
          img.src = data.src;
          return { ...data, imageElement: img };
        }
      }
      return data;
    });
  };

  // Sync state values when selected layer changes
  useEffect(() => {
    if (selectedLayer && selectedLayer.type === "text") {
      setTextColor(selectedLayer.fill || "#000000");
      setFontSize(selectedLayer.fontSize || 36);
      setFontFamily(selectedLayer.fontFamily || "Inter, sans-serif");
      setFontWeight(selectedLayer.fontWeight || "normal");
      setFontStyle(selectedLayer.fontStyle || "normal");
      setTextAlign(selectedLayer.align || "center");
    }
  }, [selectedLayerId]);

  // Triggered when editing active layer style
  const updateSelectedLayerProps = (props: Partial<DesignLayer>, saveHistory: boolean = true) => {
    if (!selectedLayerId) return;
    const updated = layers.map(l => {
      if (l.id === selectedLayerId) {
        return { ...l, ...props };
      }
      return l;
    });
    setLayers(updated);
    if (saveHistory) {
      saveHistoryState(updated);
    }
  };

  // Dynamically load fonts used in the design
  useEffect(() => {
    const fontsToLoad = new Set<string>();
    layers.forEach(l => {
      if (l.type === "text" && l.fontFamily) {
        // Extract the main font name (e.g. 'Space Grotesk' from "'Space Grotesk', sans-serif")
        const match = l.fontFamily.match(/^'?([^',]+)'?/);
        if (match && match[1]) {
          const fontName = match[1].trim();
          // Skip standard web fonts
          if (!["Arial", "Helvetica", "Times New Roman", "Courier New", "Verdana", "Georgia", "Impact", "sans-serif", "serif", "monospace"].includes(fontName)) {
            fontsToLoad.add(fontName);
          }
        }
      }
    });

    fontsToLoad.forEach(font => {
      const fontId = `font-${font.replace(/\s+/g, '-')}`;
      if (!document.getElementById(fontId)) {
        const link = document.createElement("link");
        link.id = fontId;
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@400;500;600;700;800;900&display=swap`;
        link.onerror = () => {
          setLayers(curr => curr.map(layer => layer.fontFamily?.includes(font) ? { ...layer, fontFamily: "Inter, sans-serif" } : layer));
          saveHistoryState(layers.map(layer => layer.fontFamily?.includes(font) ? { ...layer, fontFamily: "Inter, sans-serif" } : layer));
        };
        document.head.appendChild(link);
      }
    });
  }, [layers]);

  // Render Loop / Bounding boxes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, virtualWidth, virtualHeight);

    // 1. Draw Background
    if (backgroundColor !== "transparent") {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, virtualWidth, virtualHeight);
    } else {
      // Checkerboard for apparel transparency in workspace view
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, virtualWidth, virtualHeight);
      
      // Gentle gray checker pattern
      ctx.fillStyle = "#f3f4f6";
      const size = 16;
      for (let x = 0; x < virtualWidth; x += size * 2) {
        for (let y = 0; y < virtualHeight; y += size * 2) {
          ctx.fillRect(x, y, size, size);
          ctx.fillRect(x + size, y + size, size, size);
        }
      }
    }

    // 2. Render Layers in Order
    layers.forEach(layer => {
      if (layer.visible === false) return;
      ctx.save();
      
      // Position coordinate represents center of layer for precise rotation matrix
      ctx.translate(layer.x, layer.y);
      ctx.rotate(layer.rotation);

      // Apply universal layer opacity
      if (layer.opacity !== undefined) {
        ctx.globalAlpha = layer.opacity;
      }

      // Apply blend modes if set
      if (layer.blendMode && layer.blendMode !== "normal") {
        const cleanedBlend = layer.blendMode.toLowerCase().replace(/\s+/g, '-');
        const validBlendModes = [
          "multiply", "screen", "overlay", "darken", "lighten",
          "color-dodge", "color-burn", "hard-light", "soft-light",
          "difference", "exclusion", "hue", "saturation", "color", "luminosity"
        ];
        if (validBlendModes.includes(cleanedBlend)) {
          ctx.globalCompositeOperation = cleanedBlend as GlobalCompositeOperation;
        }
      }

      // Apply universal layer effects (shadow)
      if (layer.shadowColor && layer.shadowBlur !== undefined) {
        ctx.shadowColor = layer.shadowColor;
        ctx.shadowBlur = layer.shadowBlur;
        ctx.shadowOffsetX = layer.shadowOffsetX || 0;
        ctx.shadowOffsetY = layer.shadowOffsetY || 0;
      } else {
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      if (layer.type === "text") {
        ctx.font = `${layer.fontStyle || "normal"} ${layer.fontWeight || "normal"} ${layer.fontSize || 36}px ${layer.fontFamily || "Inter, sans-serif"}`;
        ctx.fillStyle = layer.fill || "#000000";
        ctx.textAlign = layer.align || "center";
        ctx.textBaseline = "middle";
        
        if (layer.letterSpacing !== undefined) {
          ctx.letterSpacing = `${layer.letterSpacing}px`;
        }
        
        const textLines = (layer.text || "").split("\n");
        const spacing = (layer.fontSize || 36) * (layer.lineHeight || 1.25);
        const totalHeight = textLines.length * spacing;
        
        textLines.forEach((line, index) => {
          const lineY = -(totalHeight / 2) + (index * spacing) + (spacing / 2);
          ctx.fillText(line, 0, lineY);
          if (layer.stroke && layer.strokeWidth && layer.strokeWidth > 0) {
            ctx.strokeStyle = layer.stroke;
            ctx.lineWidth = layer.strokeWidth;
            ctx.strokeText(line, 0, lineY);
          }
        });
        
      } 
      else if (layer.type === "shape") {
        ctx.fillStyle = layer.fill || "transparent";
        ctx.strokeStyle = layer.stroke || "transparent";
        ctx.lineWidth = layer.strokeWidth || 0;

        const w = layer.width;
        const h = layer.height;

        ctx.beginPath();
        if (layer.shapeType === "rectangle") {
          ctx.rect(-w/2, -h/2, w, h);
        } else if (layer.shapeType === "circle") {
          ctx.arc(0, 0, w/2, 0, Math.PI * 2);
        } else if (layer.shapeType === "triangle") {
          ctx.moveTo(0, -h/2);
          ctx.lineTo(w/2, h/2);
          ctx.lineTo(-w/2, h/2);
          ctx.closePath();
        } else if (layer.shapeType === "star") {
          const spikes = 5;
          const outerRadius = w/2;
          const innerRadius = w/4;
          let rot = Math.PI / 2 * 3;
          let x = 0; let y = 0;
          const step = Math.PI / spikes;
          ctx.moveTo(0, -outerRadius);
          for (let i = 0; i < spikes; i++) {
            x = Math.cos(rot) * outerRadius;
            y = Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            x = Math.cos(rot) * innerRadius;
            y = Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
          }
          ctx.lineTo(0, -outerRadius);
          ctx.closePath();
        } else if (layer.shapeType === "line") {
          ctx.moveTo(-w/2, 0);
          ctx.lineTo(w/2, 0);
        }
        
        if (layer.fill !== "transparent") {
          ctx.fill();
        }
        if (layer.stroke && layer.strokeWidth && layer.strokeWidth > 0) {
          ctx.stroke();
        }
      } 
      else if (layer.type === "image") {
        if (layer.imageElement && layer.imageElement.complete) {
          ctx.save();

          // Apply scale/flipping
          if (layer.flipX || layer.flipY) {
            ctx.scale(layer.flipX ? -1 : 1, layer.flipY ? -1 : 1);
          }

          // Apply image filters
          try {
            ctx.filter = getCSSFilterString(layer);
          } catch (e) {
            console.warn("Canvas filter error", e);
            ctx.filter = "none";
          }

          // Draw cropped or full image
          if (layer.crop) {
            const img = layer.imageElement;
            const nW = img.naturalWidth || img.width || 1;
            const nH = img.naturalHeight || img.height || 1;

            const sx = layer.crop.x * nW;
            const sy = layer.crop.y * nH;
            const sWidth = layer.crop.width * nW;
            const sHeight = layer.crop.height * nH;

            ctx.drawImage(img, sx, sy, sWidth, sHeight, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
          } else {
            ctx.drawImage(layer.imageElement, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
          }

          ctx.restore();
        } else {
          // Placeholder box while image loading
          ctx.strokeStyle = "#a78bfa";
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(-layer.width / 2, -layer.height / 2, layer.width, layer.height);
          ctx.fillStyle = "#f3f4f6";
          ctx.fillRect(-layer.width / 2, -layer.height / 2, layer.width, layer.height);
          ctx.font = "14px Inter";
          ctx.fillStyle = "#6d28d9";
          ctx.textAlign = "center";
          ctx.fillText("Loading image...", 0, 0);
        }
      }
      else if (layer.type === "sticker" && layer.stickerPath) {
        ctx.fillStyle = layer.fill || "#ec4899";
        // Scale and translate path drawing
        ctx.scale(layer.width / 24, layer.height / 24);
        ctx.translate(-12, -12); // Center path defined in 24x24 box
        const path2D = new Path2D(layer.stickerPath);
        ctx.fill(path2D);
      }

      ctx.restore();
    });

    // Draw Snap Lines
    if (snapLines.x !== undefined) {
      ctx.save();
      ctx.strokeStyle = "#a855f7"; // purple-500
      ctx.lineWidth = 1 / (canvasScale * zoomLevel);
      ctx.setLineDash([5 / (canvasScale * zoomLevel), 5 / (canvasScale * zoomLevel)]);
      ctx.beginPath();
      ctx.moveTo(snapLines.x, 0);
      ctx.lineTo(snapLines.x, virtualHeight);
      ctx.stroke();
      ctx.restore();
    }
    if (snapLines.y !== undefined) {
      ctx.save();
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 1 / (canvasScale * zoomLevel);
      ctx.setLineDash([5 / (canvasScale * zoomLevel), 5 / (canvasScale * zoomLevel)]);
      ctx.beginPath();
      ctx.moveTo(0, snapLines.y);
      ctx.lineTo(virtualWidth, snapLines.y);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw Transformation controls around selected layers
    layers.forEach(layer => {
      if (layer.visible === false) return;
      if (selectedLayerIds.includes(layer.id)) {
        ctx.save();
        ctx.translate(layer.x, layer.y);
        ctx.rotate(layer.rotation);
        const w = layer.width;
        const h = layer.height;

        // Dashed boundary
        ctx.strokeStyle = layer.id === selectedLayerId ? "#8b5cf6" : "#c4b5fd";
        ctx.lineWidth = 2 / (canvasScale * zoomLevel);
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(-w/2, -h/2, w, h);

        if (layer.id === selectedLayerId) {
          // Draw active locks indicator
          if (layer.locked) {
            ctx.fillStyle = "#ef4444";
            ctx.fillRect(-12, -12, 24, 24);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.strokeRect(-12, -12, 24, 24);

            // Draw padlock icon placeholder
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 10px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🔒", 0, 0);
          } else {
            // Resizing corner handles (solid circles/squares)
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#8b5cf6";
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            const handleSize = 10 / (canvasScale * zoomLevel);
            const corners = [
              { x: -w/2, y: -h/2 },
              { x: w/2, y: -h/2 },
              { x: -w/2, y: h/2 },
              { x: w/2, y: h/2 },
              { x: 0, y: -h/2 }, // top
              { x: 0, y: h/2 },  // bottom
              { x: -w/2, y: 0 }, // left
              { x: w/2, y: 0 }   // right
            ];
            corners.forEach(corner => {
              ctx.beginPath();
              ctx.rect(corner.x - handleSize/2, corner.y - handleSize/2, handleSize, handleSize);
              ctx.fill();
              ctx.stroke();
            });

            // Rotation control handle on top
            const rotLength = 25 / (canvasScale * zoomLevel);
            ctx.beginPath();
            ctx.moveTo(0, -h/2);
            ctx.lineTo(0, -h/2 - rotLength);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, -h/2 - rotLength, 6 / (canvasScale * zoomLevel), 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        }
        ctx.restore();
      }
    });
  }, [layers, selectedLayerId, selectedLayerIds, backgroundColor, canvasScale, zoomLevel, virtualWidth, virtualHeight]);

  // Handle Resize of workspace wrapper to establish scale factor
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoomLevel(prev => {
          // Increase zoom speed for trackpads and scroll wheels
          const newZoom = prev * Math.exp(-e.deltaY * 0.005);
          return Math.max(0.1, Math.min(newZoom, 10));
        });
      }
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const width = container.clientWidth;
      const height = container.clientHeight;
      const dimension = Math.min(width - 32, height - 32, 850); // limit visual cap
      const scaleX = dimension / virtualWidth;
      const scaleY = dimension / virtualHeight;
      setCanvasScale(Math.min(scaleX, scaleY));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    
    const t1 = setTimeout(handleResize, 50);
    const t2 = setTimeout(handleResize, 150);
    const t3 = setTimeout(handleResize, 350);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [virtualWidth, virtualHeight, isLeftSidebarOpen, isRightSidebarOpen]);

  // Layer Creation helpers
  const handleAddText = (text: string = "New Text", size: number = 36) => {
    const newLayer: DesignLayer = {
      id: "text-" + Date.now(),
      type: "text",
      name: `Text Layer`,
      x: 400,
      y: 400,
      width: 400,
      height: size * 1.5,
      rotation: 0,
      text: text,
      fontSize: size,
      fontFamily: "Inter, sans-serif",
      fill: "#111827",
      fontWeight: "normal",
      align: "center"
    };
    const updated = [...layers, newLayer];
    setLayers(updated);
    setSelectedLayerId(newLayer.id);
    saveHistoryState(updated);
  };

  const handleAddShape = (shapeType: "rectangle" | "circle" | "triangle" | "star") => {
    const newLayer: DesignLayer = {
      id: "shape-" + Date.now(),
      type: "shape",
      name: `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} Shape`,
      x: 400,
      y: 400,
      width: 150,
      height: 150,
      rotation: 0,
      shapeType: shapeType,
      fill: "#6366f1",
      stroke: "transparent",
      strokeWidth: 0
    };
    const updated = [...layers, newLayer];
    setLayers(updated);
    setSelectedLayerId(newLayer.id);
    saveHistoryState(updated);
  };

  const handleAddSticker = (sticker: typeof STICKERS[0]) => {
    const newLayer: DesignLayer = {
      id: "sticker-" + Date.now(),
      type: "sticker",
      name: `${sticker.label} Sticker`,
      x: 400,
      y: 400,
      width: 100,
      height: 100,
      rotation: 0,
      stickerPath: sticker.path,
      fill: "#ec4899"
    };
    const updated = [...layers, newLayer];
    setLayers(updated);
    setSelectedLayerId(newLayer.id);
    saveHistoryState(updated);
  };

  const handleAddImageFromSrc = (src: string) => {
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

  const loadFontViaLink = (fontName: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const fontId = `font-${fontName.toLowerCase().replace(/\s+/g, '-')}`;
      if (document.getElementById(fontId)) {
        resolve(true);
        return;
      }
      const link = document.createElement("link");
      link.id = fontId;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@400;500;600;700;800;900&display=swap`;
      link.onload = () => {
        if ('fonts' in document) {
          document.fonts.load(`16px "${fontName}"`)
            .then(() => resolve(true))
            .catch(() => resolve(true));
        } else {
          resolve(true);
        }
      };
      link.onerror = () => {
        link.remove();
        resolve(false);
      };
      document.head.appendChild(link);
    });
  };

  const resolveAndDownloadFont = async (rawFontName: string): Promise<string> => {
    if (!rawFontName) return "Inter, sans-serif";

    // 1. Sanitize the font name
    let cleaned = rawFontName
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2') // space between camelCase
      .replace(/\s+/g, ' ')
      .trim();

    // Strip weights and common styles/suffixes
    cleaned = cleaned.replace(/\b(Regular|Bold|Italic|Medium|Light|Thin|Black|Book|MT|PS|Pro|Std|OTF|TTF|Condensed|Heavy|SemiBold|ExtraBold|Oblique|Mono|Sans|Serif)\b/gi, '').trim();
    if (!cleaned) cleaned = rawFontName;

    // Try exact/partial match with our pre-defined list first
    const localMatch = FONTS.find(f => 
      f.label.toLowerCase() === cleaned.toLowerCase() || 
      f.label.toLowerCase().includes(cleaned.toLowerCase()) ||
      cleaned.toLowerCase().includes(f.label.toLowerCase())
    );
    if (localMatch) {
      const label = localMatch.label;
      if (!["Arial", "Helvetica", "Times New Roman", "Courier New", "Verdana", "Georgia", "Impact", "sans-serif", "serif", "monospace"].includes(label)) {
        setConversionMessage(`Downloading font: ${label}...`);
        await loadFontViaLink(label);
      }
      return localMatch.value;
    }

    // 2. Try loading the cleaned name directly from Google Fonts
    setConversionMessage(`Searching Google Fonts for: ${cleaned}...`);
    const successCleaned = await loadFontViaLink(cleaned);
    if (successCleaned) {
      return `'${cleaned}', sans-serif`;
    }

    // 3. Try loading the original raw name directly from Google Fonts
    if (cleaned !== rawFontName) {
      setConversionMessage(`Searching Google Fonts for: ${rawFontName}...`);
      const successRaw = await loadFontViaLink(rawFontName);
      if (successRaw) {
        return `'${rawFontName}', sans-serif`;
      }
    }

    // 4. Map to the nearest available font (Fallback logic)
    const lowerRaw = rawFontName.toLowerCase();
    
    if (lowerRaw.includes("mono") || lowerRaw.includes("courier") || lowerRaw.includes("consolas") || lowerRaw.includes("code")) {
      return "'JetBrains Mono', monospace";
    }
    
    if (lowerRaw.includes("serif") || lowerRaw.includes("times") || lowerRaw.includes("georgia") || lowerRaw.includes("garamond") || lowerRaw.includes("playfair") || lowerRaw.includes("lora")) {
      return "'Playfair Display', serif";
    }
    
    if (lowerRaw.includes("script") || lowerRaw.includes("hand") || lowerRaw.includes("brush") || lowerRaw.includes("cursive") || lowerRaw.includes("lobster") || lowerRaw.includes("pacifico") || lowerRaw.includes("caveat") || lowerRaw.includes("dancing")) {
      return "Pacifico, cursive";
    }
    
    if (lowerRaw.includes("display") || lowerRaw.includes("bangers") || lowerRaw.includes("impact") || lowerRaw.includes("bebas") || lowerRaw.includes("anton") || lowerRaw.includes("black")) {
      return "'Bebas Neue', sans-serif";
    }

    return "Inter, sans-serif";
  };

  const handleUploadLocalImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = async (event) => {
      const src = event.target?.result as string;

      if (file.name.match(/\.(psd)$/i)) {
        setIsConverting(true);
        setConversionMessage("Reading PSD structure...");
        try {
          const buffer = await file.arrayBuffer();
          const psd = readPsd(buffer);
          
          let targetVirtualWidth = virtualWidth;
          let targetVirtualHeight = virtualHeight;
          if (showSizeSelectorModal && psd.width && psd.height) {
            targetVirtualWidth = psd.width;
            targetVirtualHeight = psd.height;
            setVirtualWidth(targetVirtualWidth);
            setVirtualHeight(targetVirtualHeight);
            setShowSizeSelectorModal(false);
          }

          const newLayers: DesignLayer[] = [];
          if (psd.children) {
              const offsetX = (targetVirtualWidth - (psd.width || targetVirtualWidth)) / 2;
              const offsetY = (targetVirtualHeight - (psd.height || targetVirtualHeight)) / 2;

              const psdColorToHex = (color: any): string => {
                  if (!color) return "#000000";
                  if (typeof color.r === "number" && typeof color.g === "number" && typeof color.b === "number") {
                      const r = Math.max(0, Math.min(255, Math.round(color.r)));
                      const g = Math.max(0, Math.min(255, Math.round(color.g)));
                      const b = Math.max(0, Math.min(255, Math.round(color.b)));
                      if (typeof color.a === "number") {
                          const a = color.a > 1 ? color.a / 255 : color.a;
                          return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
                      }
                      return "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
                  }
                  if (typeof color.fr === "number" && typeof color.fg === "number" && typeof color.fb === "number") {
                      const r = Math.max(0, Math.min(255, Math.round(color.fr * 255)));
                      const g = Math.max(0, Math.min(255, Math.round(color.fg * 255)));
                      const b = Math.max(0, Math.min(255, Math.round(color.fb * 255)));
                      return "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
                  }
                  if (typeof color.k === "number") {
                      const val = Math.max(0, Math.min(255, Math.round(255 - (color.k * 2.55))));
                      return "#" + [val, val, val].map(x => x.toString(16).padStart(2, '0')).join('');
                  }
                  return "#000000";
              };

              const walk = async (children: any[]) => {
                  for (const l of children) {
                      if (l.children) {
                          await walk(l.children);
                      } else if (l.text) {
                          const w = (l.right !== undefined && l.left !== undefined) ? l.right - l.left : 200;
                          const h = (l.bottom !== undefined && l.top !== undefined) ? l.bottom - l.top : 50;

                          // Extract raw font name
                          let rawFontName = "Inter";
                          if (l.text.style?.font?.name) {
                              rawFontName = l.text.style.font.name;
                          } else if (l.text.styleRuns && l.text.styleRuns.length > 0) {
                              for (const run of l.text.styleRuns) {
                                  if (run.style?.font?.name) {
                                      rawFontName = run.style.font.name;
                                      break;
                                  }
                              }
                          }

                          setConversionMessage(`Identifying PSD font: ${rawFontName}...`);
                          const resolvedFontFamily = await resolveAndDownloadFont(rawFontName);

                          // Style extraction
                          const textStyle = l.text.style || (l.text.styleRuns && l.text.styleRuns.length > 0 ? l.text.styleRuns[0].style : null) || {};
                          const fontSize = textStyle.fontSize || 32;
                          const fill = textStyle.fillColor ? psdColorToHex(textStyle.fillColor) : "#000000";
                          const isBold = textStyle.fauxBold || (textStyle.font?.name && /bold|black|heavy|w[789]00/i.test(textStyle.font.name));
                          const fontWeight = isBold ? "bold" : "normal";
                          const isItalic = textStyle.fauxItalic || (textStyle.font?.name && /italic|oblique/i.test(textStyle.font.name));
                          const fontStyle = isItalic ? "italic" : "normal";
                          
                          const letterSpacing = textStyle.tracking !== undefined ? Math.round((textStyle.tracking / 1000) * fontSize) : 0;
                          let lineHeight = 1.25;
                          if (textStyle.leading !== undefined && fontSize) {
                              lineHeight = Math.round((textStyle.leading / fontSize) * 100) / 100;
                          }

                          // General properties
                          const opacity = l.opacity !== undefined ? (l.opacity > 1 ? l.opacity / 255 : l.opacity) : 1;
                          const visible = l.hidden === true ? false : true;
                          const blendMode = l.blendMode || "normal";

                          // Drop shadow
                          let shadowColor = undefined;
                          let shadowBlur = undefined;
                          let shadowOffsetX = undefined;
                          let shadowOffsetY = undefined;
                          if (l.effects && l.effects.dropShadow && l.effects.dropShadow.length > 0) {
                              const activeShadow = l.effects.dropShadow.find((s: any) => s.enabled !== false);
                              if (activeShadow) {
                                  const dist = typeof activeShadow.distance === "number" ? activeShadow.distance : (activeShadow.distance?.value || 0);
                                  const angleDeg = activeShadow.angle !== undefined ? activeShadow.angle : 120;
                                  const angleRad = (angleDeg * Math.PI) / 180;
                                  shadowOffsetX = Math.round(-dist * Math.cos(angleRad));
                                  shadowOffsetY = Math.round(dist * Math.sin(angleRad));
                                  const sizeVal = typeof activeShadow.size === "number" ? activeShadow.size : (activeShadow.size?.value || 0);
                                  shadowBlur = sizeVal;
                                  shadowColor = activeShadow.color ? psdColorToHex(activeShadow.color) : "rgba(0,0,0,0.5)";
                              }
                          }

                          // Stroke
                          let stroke = undefined;
                          let strokeWidth = undefined;
                          if (l.effects && l.effects.stroke && l.effects.stroke.length > 0) {
                              const activeStroke = l.effects.stroke.find((s: any) => s.enabled !== false);
                              if (activeStroke) {
                                  const sSize = typeof activeStroke.size === "number" ? activeStroke.size : (activeStroke.size?.value || 0);
                                  if (sSize > 0) {
                                      strokeWidth = sSize;
                                      stroke = activeStroke.color ? psdColorToHex(activeStroke.color) : "#000000";
                                  }
                              }
                          }

                          newLayers.push({
                              id: "psd-text-" + Date.now() + "-" + Math.random(),
                              type: "text",
                              name: l.name || "Text",
                              x: (l.left || 0) + w / 2 + offsetX,
                              y: (l.top || 0) + h / 2 + offsetY,
                              width: w,
                              height: h,
                              rotation: 0,
                              text: l.text.text || l.name || "Text",
                              fontSize: fontSize,
                              fontFamily: resolvedFontFamily,
                              fill: fill,
                              fontWeight: fontWeight,
                              fontStyle: fontStyle,
                              letterSpacing: letterSpacing,
                              lineHeight: lineHeight,
                              opacity: opacity,
                              visible: visible,
                              blendMode: blendMode,
                              shadowColor,
                              shadowBlur,
                              shadowOffsetX,
                              shadowOffsetY,
                              stroke,
                              strokeWidth
                          } as DesignLayer);
                      } else if (l.canvas) {
                          const dataUrl = l.canvas.toDataURL();
                          const w = (l.right !== undefined && l.left !== undefined) ? l.right - l.left : l.canvas.width;
                          const h = (l.bottom !== undefined && l.top !== undefined) ? l.bottom - l.top : l.canvas.height;
                          
                          // General properties
                          const opacity = l.opacity !== undefined ? (l.opacity > 1 ? l.opacity / 255 : l.opacity) : 1;
                          const visible = l.hidden === true ? false : true;
                          const blendMode = l.blendMode || "normal";

                          // Drop shadow
                          let shadowColor = undefined;
                          let shadowBlur = undefined;
                          let shadowOffsetX = undefined;
                          let shadowOffsetY = undefined;
                          if (l.effects && l.effects.dropShadow && l.effects.dropShadow.length > 0) {
                              const activeShadow = l.effects.dropShadow.find((s: any) => s.enabled !== false);
                              if (activeShadow) {
                                  const dist = typeof activeShadow.distance === "number" ? activeShadow.distance : (activeShadow.distance?.value || 0);
                                  const angleDeg = activeShadow.angle !== undefined ? activeShadow.angle : 120;
                                  const angleRad = (angleDeg * Math.PI) / 180;
                                  shadowOffsetX = Math.round(-dist * Math.cos(angleRad));
                                  shadowOffsetY = Math.round(dist * Math.sin(angleRad));
                                  const sizeVal = typeof activeShadow.size === "number" ? activeShadow.size : (activeShadow.size?.value || 0);
                                  shadowBlur = sizeVal;
                                  shadowColor = activeShadow.color ? psdColorToHex(activeShadow.color) : "rgba(0,0,0,0.5)";
                              }
                          }

                          // Stroke
                          let stroke = undefined;
                          let strokeWidth = undefined;
                          if (l.effects && l.effects.stroke && l.effects.stroke.length > 0) {
                              const activeStroke = l.effects.stroke.find((s: any) => s.enabled !== false);
                              if (activeStroke) {
                                  const sSize = typeof activeStroke.size === "number" ? activeStroke.size : (activeStroke.size?.value || 0);
                                  if (sSize > 0) {
                                      strokeWidth = sSize;
                                      stroke = activeStroke.color ? psdColorToHex(activeStroke.color) : "#000000";
                                  }
                              }
                          }

                          newLayers.push({
                              id: "psd-layer-" + Date.now() + "-" + Math.random(),
                              type: "image",
                              name: l.name || "Layer",
                              x: (l.left || 0) + w / 2 + offsetX,
                              y: (l.top || 0) + h / 2 + offsetY,
                              width: w,
                              height: h,
                              rotation: 0,
                              src: dataUrl,
                              opacity: opacity,
                              visible: visible,
                              blendMode: blendMode,
                              shadowColor,
                              shadowBlur,
                              shadowOffsetX,
                              shadowOffsetY,
                              stroke,
                              strokeWidth
                          } as DesignLayer);
                      }
                  }
              };
              await walk(psd.children);
          }
          
          if (newLayers.length > 0) {
              setConversionMessage("Opening design workspace...");
              setLayers(prev => {
                  const updated = [...prev, ...newLayers];
                  updated.forEach(l => {
                      if (l.type === "image" && l.src && !l.imageElement) {
                          const img = new Image();
                          img.onload = () => {
                              setLayers(curr => curr.map(cl => cl.id === l.id ? { ...cl, imageElement: img } : cl));
                          };
                          img.src = l.src;
                          l.imageElement = img;
                      }
                  });
                  saveHistoryState(updated);
                  return updated;
              });
          } else if (psd.canvas) {
              setConversionMessage("Rendering canvas fallback...");
              const dataUrl = psd.canvas.toDataURL();
              const img = new Image();
              img.onload = () => {
                  const newLayer = {
                      id: "psd-" + Date.now(),
                      type: "image",
                      name: file.name,
                      x: 400 - img.width / 2,
                      y: 400 - img.height / 2,
                      width: img.width,
                      height: img.height,
                      rotation: 0,
                      src: dataUrl,
                      imageElement: img
                  } as DesignLayer;
                  setLayers(prev => {
                      const updated = [...prev, newLayer];
                      saveHistoryState(updated);
                      return updated;
                  });
              };
              img.src = dataUrl;
          } else {
               alert("No layers found in PSD.");
          }
        } catch (err) {
          console.error(err);
          alert("Failed to parse PSD file.");
        } finally {
          setIsConverting(false);
          setConversionMessage("");
        }
        return;
      }
      if (file.type === "application/pdf" || file.name.match(/\.(pdf)$/i)) {
        setIsConverting(true);
        setConversionMessage("Rendering PDF...");
        try {
          const buffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
          
          if (showSizeSelectorModal) {
            setShowSizeSelectorModal(false);
          }
          
          const newPages: DesignPage[] = [];
          for (let i = 1; i <= pdf.numPages; i++) {
             setConversionMessage(`Rendering PDF page ${i} of ${pdf.numPages}...`);
             const page = await pdf.getPage(i);
             const scale = 2.0; // scale for high res
             const viewport = page.getViewport({ scale });
             
             let targetW = viewport.width / scale;
             let targetH = viewport.height / scale;

             if (i === 1) {
               setVirtualWidth(targetW);
               setVirtualHeight(targetH);
             }

             const canvas = document.createElement("canvas");
             canvas.width = viewport.width;
             canvas.height = viewport.height;
             const ctx = canvas.getContext("2d");
             if (ctx) {
               await page.render({ canvasContext: ctx, canvas, viewport }).promise;
               const dataUrl = canvas.toDataURL("image/png");
               
               const img = new Image();
               const layer = await new Promise<DesignLayer>((resolve) => {
                 img.onload = () => {
                   resolve({
                      id: "pdf-" + Date.now() + "-" + i,
                      type: "image",
                      name: `PDF Page ${i}`,
                      x: targetW / 2,
                      y: targetH / 2,
                      width: targetW,
                      height: targetH,
                      rotation: 0,
                      src: dataUrl,
                      imageElement: img,
                      brightness: 100,
                      contrast: 100,
                      saturate: 100,
                      grayscale: 0,
                      sepia: 0,
                      blur: 0,
                      hueRotate: 0
                   });
                 };
                 img.src = dataUrl;
               });
               
               newPages.push({
                 id: `page-${Date.now()}-${i}`,
                 backgroundColor: "#ffffff",
                 layers: [layer]
               });
             }
          }
          
          if (pdf.numPages === 1 && replacingImageLayerId) {
             setLayers(curr => {
                const updated = curr.map(l => {
                  if (l.id === replacingImageLayerId && l.type === "image") {
                     return { ...l, src: newPages[0].layers[0].src, imageElement: newPages[0].layers[0].imageElement };
                  }
                  return l;
                });
                saveHistoryState(updated);
                return updated;
             });
             setReplacingImageLayerId(null);
          } else {
             if (replacingImageLayerId) setReplacingImageLayerId(null);
             setPages(newPages);
             setCurrentPageIndex(0);
             setTimeout(() => {
                saveHistoryState();
             }, 0);
          }
        } catch (error) {
          console.error(error);
          alert("Failed to read PDF.");
        } finally {
          setIsConverting(false);
          setConversionMessage("");
        }
        return;
      }
      
      if (file.name.match(/\.(ai|eps)$/i)) {
        setIsConverting(true);
        setConversionMessage("Analyzing design with AI...");
        try {
          if (showSizeSelectorModal) {
            setShowSizeSelectorModal(false);
          }
          const res = await fetch('/api/ai/convert-to-layers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileBase64: src, mimeType: file.type })
          });
          const text = await res.text(); const data = text ? JSON.parse(text) : {};
          if (data && data.pages && data.pages.length > 0) {
            setConversionMessage("Identifying design fonts...");
            const newPages: DesignPage[] = await Promise.all(data.pages.map(async (page: any, pageIndex: number) => {
               const aiLayers: DesignLayer[] = await Promise.all((page.layers || []).map(async (l: any, i: number) => {
                if (l.type === "text") {
                  const rawFontName = l.fontFamily || "Inter";
                  setConversionMessage(`Identifying AI font: ${rawFontName}...`);
                  const resolvedFontFamily = await resolveAndDownloadFont(rawFontName);
                  return {
                    id: "ai-text-" + Date.now() + "-" + pageIndex + "-" + i,
                    type: "text",
                    name: l.text?.substring(0, 10) || "AI Text",
                    x: l.x || 400,
                    y: l.y || 400,
                    width: l.width || 300,
                    height: l.height || 50,
                    rotation: l.rotation || 0,
                    text: l.text || "Text",
                    fontSize: l.fontSize || 32,
                    fontFamily: resolvedFontFamily,
                    fill: l.fill || "#000000",
                    fontWeight: l.fontWeight || "normal",
                    align: "center"
                  } as DesignLayer;
                } else {
                  return {
                    id: "ai-shape-" + Date.now() + "-" + pageIndex + "-" + i,
                    type: "shape",
                    name: "AI Shape",
                    x: l.x || 400,
                    y: l.y || 400,
                    width: l.width || 100,
                    height: l.height || 100,
                    rotation: l.rotation || 0,
                    shapeType: l.shapeType || "rectangle",
                    fill: l.fill || "#e2e8f0"
                  } as DesignLayer;
                }
              }));
              return {
                 id: `page-${Date.now()}-${pageIndex}`,
                 backgroundColor: page.backgroundColor || "#ffffff",
                 layers: aiLayers
              } as DesignPage;
            }));
            
            setPages(newPages);
            setCurrentPageIndex(0);
            
            setTimeout(() => {
              saveHistoryState();
            }, 0);
          } else if (data && data.layers) {
            if (data.backgroundColor && data.backgroundColor !== "transparent") {
              setBackgroundColor(data.backgroundColor);
            }
            setConversionMessage("Identifying design fonts...");
            const aiLayers: DesignLayer[] = await Promise.all(data.layers.map(async (l: any, i: number) => {
              if (l.type === "text") {
                const rawFontName = l.fontFamily || "Inter";
                setConversionMessage(`Identifying AI font: ${rawFontName}...`);
                const resolvedFontFamily = await resolveAndDownloadFont(rawFontName);
                return {
                  id: "ai-text-" + Date.now() + "-" + i,
                  type: "text",
                  name: l.text?.substring(0, 10) || "AI Text",
                  x: l.x || 400,
                  y: l.y || 400,
                  width: l.width || 300,
                  height: l.height || 50,
                  rotation: l.rotation || 0,
                  text: l.text || "Text",
                  fontSize: l.fontSize || 32,
                  fontFamily: resolvedFontFamily,
                  fill: l.fill || "#000000",
                  fontWeight: l.fontWeight || "normal",
                  align: "center"
                } as DesignLayer;
              } else {
                return {
                  id: "ai-shape-" + Date.now() + "-" + i,
                  type: "shape",
                  name: "AI Shape",
                  x: l.x || 400,
                  y: l.y || 400,
                  width: l.width || 100,
                  height: l.height || 100,
                  rotation: l.rotation || 0,
                  shapeType: l.shapeType || "rectangle",
                  fill: l.fill || "#e2e8f0"
                } as DesignLayer;
              }
            }));
            const updated = [...layers, ...aiLayers];
            setLayers(updated);
            saveHistoryState(updated);
          }
        } catch (error) {
          console.error(error);
          alert("Failed to auto-convert image.");
        } finally {
          setIsConverting(false);
          setConversionMessage("");
        }
        return; // Done
      }

      // Normal Image Upload
      const img = new Image();
      if (src && !src.startsWith("data:")) img.crossOrigin = "anonymous";
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        setUploadedImages(prev => prev.includes(src) ? prev : [...prev, src]);
        
        let targetX = 400;
        let targetY = 400;

        if (showSizeSelectorModal) {
          setVirtualWidth(w);
          setVirtualHeight(h);
          setShowSizeSelectorModal(false);
          targetX = w / 2;
          targetY = h / 2;
        } else {
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
          targetX = virtualWidth / 2;
          targetY = virtualHeight / 2;
        }

        const newLayer: DesignLayer = {
          id: "image-" + Date.now(),
          type: "image",
          name: `Image (${file.name.slice(0, 10)})`,
          x: targetX,
          y: targetY,
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
        setLoadedImages(prev => ({ ...prev, [src]: img }));
        if (replacingImageLayerId) {
          setLayers(curr => {
            const updated = curr.map(l => {
              if (l.id === replacingImageLayerId && l.type === "image") {
                return {
                  ...l,
                  src: src,
                  imageElement: img,
                  // Optionally reset filters if replacing? We'll keep them.
                };
              }
              return l;
            });
            saveHistoryState(updated);
            return updated;
          });
          setReplacingImageLayerId(null);
        } else {
          const updated = [...layers, newLayer];
          setLayers(updated);
          setSelectedLayerId(newLayer.id);
          saveHistoryState(updated);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectTemplate = (template: DesignTemplate) => {
    setBackgroundColor(template.backgroundColor);
    
    // Auto-scale template canvas boundaries dynamically!
    if (template.preferredWidth) {
      setVirtualWidth(template.preferredWidth);
    } else {
      setVirtualWidth(800);
    }
    if (template.preferredHeight) {
      setVirtualHeight(template.preferredHeight);
    } else {
      setVirtualHeight(800);
    }

    // Clear and restore templates layers
    const restored = restoreLayersFromData(template.layers as any[]);
    setLayers(restored);
    setSelectedLayerId(template.layers[0]?.id || null);
    
    // Wait for setLayers to be queued, but we still pass restored directly to history
    saveHistoryState(restored as any[]);
  };

  // Convert client-relative mouse coords to 800x800 coordinates
  const getMousePosOnVirtualCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * virtualWidth;
    const y = (e.clientY - rect.top) / rect.height * virtualHeight;
    return { x, y };
  };

  // Dragging & Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePosOnVirtualCanvas(e);
    if (editingTextLayerId) {
      setEditingTextLayerId(null);
    }
    
    // Check if clicked handles of selected layer first
    if (selectedLayer && !selectedLayer.locked) {
      const w = selectedLayer.width;
      const h = selectedLayer.height;
      const cos = Math.cos(selectedLayer.rotation);
      const sin = Math.sin(selectedLayer.rotation);

      // Math utility to convert relative rotated positions back to virtual coords
      const toVirtualCoord = (rx: number, ry: number) => {
        return {
          x: selectedLayer.x + (rx * cos - ry * sin),
          y: selectedLayer.y + (rx * sin + ry * cos)
        };
      };

      const handleSize = 16 / (canvasScale * zoomLevel);

      // 1. Check Rotation handle first (top extended)
      const rotLength = 25 / (canvasScale * zoomLevel);
      const rotPos = toVirtualCoord(0, -h/2 - rotLength);
      const distRot = Math.hypot(pos.x - rotPos.x, pos.y - rotPos.y);
      if (distRot < handleSize * 1.5) {
        setDragMode("rotate");
        setDragStartMouse(pos);
        setDragStartLayer({ ...selectedLayer });
        return;
      }

      // 2. Check Corner resize handles
      const corners = [
        { id: "tl", rx: -w/2, ry: -h/2 },
        { id: "tr", rx: w/2, ry: -h/2 },
        { id: "bl", rx: -w/2, ry: h/2 },
        { id: "br", rx: w/2, ry: h/2 },
        { id: "t", rx: 0, ry: -h/2 },
        { id: "b", rx: 0, ry: h/2 },
        { id: "l", rx: -w/2, ry: 0 },
        { id: "r", rx: w/2, ry: 0 }
      ];

      for (const corner of corners) {
        const cornerPos = toVirtualCoord(corner.rx, corner.ry);
        const distCorner = Math.hypot(pos.x - cornerPos.x, pos.y - cornerPos.y);
        if (distCorner < handleSize) {
          setDragMode("resize");
          setResizeHandleId(corner.id);
          setDragStartMouse(pos);
          setDragStartLayer({ ...selectedLayer });
          return;
        }
      }
    }

    // 3. Loop through layers from top to bottom to check inside layer body selection
    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i];
      if (l.visible === false) continue;
      
      // Rotate point back to layer's local coordinate system to check inside bounding box
      const dx = pos.x - l.x;
      const dy = pos.y - l.y;
      const cos = Math.cos(-l.rotation);
      const sin = Math.sin(-l.rotation);
      const lx = dx * cos - dy * sin;
      const ly = dx * sin + dy * cos;

      if (Math.abs(lx) <= l.width / 2 && Math.abs(ly) <= l.height / 2) {
        let newSelectedIds = [...selectedLayerIds];
        if (!selectedLayerIds.includes(l.id)) {
            if (e.shiftKey) {
                newSelectedIds.push(l.id);
                setSelectedLayerIds(newSelectedIds);
                setSelectedLayerId(l.id);
                setActiveTab("settings");
            } else {
                newSelectedIds = [l.id];
                setSelectedLayerIds(newSelectedIds);
                setSelectedLayerId(l.id);
            }
        } else {
            if (e.shiftKey) {
                newSelectedIds = newSelectedIds.filter(id => id !== l.id);
                setSelectedLayerIds(newSelectedIds);
                if (selectedLayerId === l.id) setSelectedLayerId(l.id);
                setActiveTab("settings");
            } else {
                setSelectedLayerId(l.id);
            }
        }

        if (!l.locked) {
          setDragMode("move");
          setDragStartMouse(pos);
          setDragStartLayer({ ...l });
          setDragStartLayers(layers.filter(layer => newSelectedIds.includes(layer.id)));
        }
        return;
      }
    }

    // Clicking empty space deselects layer
    setSelectedLayerId(null);
    setSelectedLayerIds([]);
    setSnapLines({});
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePosOnVirtualCanvas(e);
    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i];
      const dx = pos.x - l.x;
      const dy = pos.y - l.y;
      const cos = Math.cos(-l.rotation);
      const sin = Math.sin(-l.rotation);
      const lx = dx * cos - dy * sin;
      const ly = dx * sin + dy * cos;
      if (Math.abs(lx) <= l.width / 2 && Math.abs(ly) <= l.height / 2) {
        if (!l.locked) {
          if (l.type === "text") {
            setEditingTextLayerId(l.id);
          } else if (l.type === "image") {
            // Trigger file upload and set replacing state
            setReplacingImageLayerId(l.id);
            if (fileInputRef.current) {
              fileInputRef.current.click();
            }
          }
        }
        return;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragMode || !dragStartLayer || !selectedLayerId) return;
    const pos = getMousePosOnVirtualCanvas(e);

    const dx = pos.x - dragStartMouse.x;
    const dy = pos.y - dragStartMouse.y;

    if (dragMode === "move") {
      let primaryNx = dragStartLayer.x + dx;
      let primaryNy = dragStartLayer.y + dy;
      let snapX = undefined;
      let snapY = undefined;

      const centerX = virtualWidth / 2;
      const centerY = virtualHeight / 2;
      const halfW = dragStartLayer.width / 2;
      const halfH = dragStartLayer.height / 2;
      const threshold = 15;

      // X alignment candidates: Center, Left edge, Right edge
      const candidatesX = [
        { val: centerX, line: centerX, diff: Math.abs(primaryNx - centerX) },
        { val: halfW, line: 0, diff: Math.abs((primaryNx - halfW) - 0) },
        { val: virtualWidth - halfW, line: virtualWidth, diff: Math.abs((primaryNx + halfW) - virtualWidth) }
      ];

      let bestX = null;
      for (const cand of candidatesX) {
        if (cand.diff < threshold) {
          if (!bestX || cand.diff < bestX.diff) {
            bestX = cand;
          }
        }
      }

      if (bestX) {
        primaryNx = bestX.val;
        snapX = bestX.line;
      }

      // Y alignment candidates: Center, Top edge, Bottom edge
      const candidatesY = [
        { val: centerY, line: centerY, diff: Math.abs(primaryNy - centerY) },
        { val: halfH, line: 0, diff: Math.abs((primaryNy - halfH) - 0) },
        { val: virtualHeight - halfH, line: virtualHeight, diff: Math.abs((primaryNy + halfH) - virtualHeight) }
      ];

      let bestY = null;
      for (const cand of candidatesY) {
        if (cand.diff < threshold) {
          if (!bestY || cand.diff < bestY.diff) {
            bestY = cand;
          }
        }
      }

      if (bestY) {
        primaryNy = bestY.val;
        snapY = bestY.line;
      }

      setSnapLines({ x: snapX, y: snapY });

      const actualDx = primaryNx - dragStartLayer.x;
      const actualDy = primaryNy - dragStartLayer.y;

      setLayers(curr => curr.map(l => {
        const startL = dragStartLayers.find(dl => dl.id === l.id);
        if (startL) {
          return {
            ...l,
            x: startL.x + actualDx,
            y: startL.y + actualDy
          };
        }
        return l;
      }));
    } 
    else if (dragMode === "resize") {
      // Calculate delta in rotated coordinates
      const cos = Math.cos(-dragStartLayer.rotation);
      const sin = Math.sin(-dragStartLayer.rotation);
      const localDx = dx * cos - dy * sin;
      const localDy = dx * sin + dy * cos;

      setLayers(curr => curr.map(l => {
        if (l.id === selectedLayerId) {
          let nw = dragStartLayer.width;
          let nh = dragStartLayer.height;
          let nx = dragStartLayer.x;
          let ny = dragStartLayer.y;

          // Adjust width & height based on which handle was dragged
          const aspect = dragStartLayer.width / dragStartLayer.height;
          
          if (["br", "tl", "tr", "bl"].includes(resizeHandleId)) {
            // Proportional scaling for corners
            let scale = 1;
            if (resizeHandleId === "br") {
              scale = (dragStartLayer.width + localDx * 2) / dragStartLayer.width;
            } else if (resizeHandleId === "tl") {
              scale = (dragStartLayer.width - localDx * 2) / dragStartLayer.width;
            } else if (resizeHandleId === "tr") {
              scale = (dragStartLayer.width + localDx * 2) / dragStartLayer.width;
            } else if (resizeHandleId === "bl") {
              scale = (dragStartLayer.width - localDx * 2) / dragStartLayer.width;
            }
            scale = Math.max(0.1, scale);
            nw = Math.max(20, dragStartLayer.width * scale);
            nh = nw / aspect;
          } else {
            // Free-form scaling for sides
            if (resizeHandleId === "r") {
              nw = Math.max(20, dragStartLayer.width + localDx * 2);
            } else if (resizeHandleId === "l") {
              nw = Math.max(20, dragStartLayer.width - localDx * 2);
            } else if (resizeHandleId === "b") {
              nh = Math.max(20, dragStartLayer.height + localDy * 2);
            } else if (resizeHandleId === "t") {
              nh = Math.max(20, dragStartLayer.height - localDy * 2);
            }
          }

          // If text, also dynamically scale text size proportionally
          let nFontSize = l.fontSize;
          if (l.type === "text" && l.fontSize) {
            const scaleFactor = nw / dragStartLayer.width;
            nFontSize = Math.max(8, Math.round(dragStartLayer.fontSize! * scaleFactor));
            nh = nFontSize * 1.5 * ((l.text || "").split("\n").length);
          }

          return {
            ...l,
            width: nw,
            height: nh,
            fontSize: nFontSize
          };
        }
        return l;
      }));
    } 
    else if (dragMode === "rotate") {
      // Rotate around the layer center
      const angleNow = Math.atan2(pos.y - dragStartLayer.y, pos.x - dragStartLayer.x);
      const angleStart = Math.atan2(dragStartMouse.y - dragStartLayer.y, dragStartMouse.x - dragStartLayer.x);
      
      setLayers(curr => curr.map(l => {
        if (l.id === selectedLayerId) {
          return {
            ...l,
            rotation: dragStartLayer.rotation + (angleNow - angleStart)
          };
        }
        return l;
      }));
    }
  };

  const handleMouseUp = () => {
    if (dragMode) {
      setDragMode(null);
      setSnapLines({});
      setResizeHandleId(null);
      setDragStartLayer(null);
      saveHistoryState(layers);
    }
  };

  // Keyboard controls for fine moving and deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is editing a text input currently
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      const isModKey = e.ctrlKey || e.metaKey;

      // 1. Global shortcuts (Undo, Redo, Paste) - do not require an active/unlocked selected layer
      if (isModKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        const allIds = layers.map(l => l.id);
        setSelectedLayerIds(allIds);
        if (allIds.length > 0) {
            setSelectedLayerId(allIds[allIds.length - 1]);
        }
        return;
      }
      if (isModKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }

      if (isModKey && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (isModKey && e.key.toLowerCase() === "v") {
        e.preventDefault();
        if (clipboardLayer) {
          const newLayer = { 
            ...clipboardLayer, 
            id: clipboardLayer.type + "-" + Date.now(), 
            x: clipboardLayer.x + 20, 
            y: clipboardLayer.y + 20 
          };
          const updated = [...layers, newLayer];
          setLayers(updated);
          saveHistoryState(updated);
          setSelectedLayerId(newLayer.id);
        }
        return;
      }

      // 2. Layer-specific shortcuts (Copy, Duplicate, Delete, Nudge, Order)
      if (!selectedLayerId) return;

      if (isModKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        if (selectedLayer) {
          setClipboardLayer(selectedLayer);
        }
        return;
      }

      if (isModKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (selectedLayer) {
          const newLayer = { 
            ...selectedLayer, 
            id: selectedLayer.type + "-" + Date.now(), 
            x: selectedLayer.x + 20, 
            y: selectedLayer.y + 20 
          };
          const updated = [...layers, newLayer];
          setLayers(updated);
          saveHistoryState(updated);
          setSelectedLayerId(newLayer.id);
        }
        return;
      }

      // If the selected layer is locked, prevent modification shortcuts (moving, deleting, ordering)
      if (selectedLayer?.locked) return;

      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        const updated = layers.filter(l => !selectedLayerIds.includes(l.id));
        setLayers(updated);
        setSelectedLayerId(null);
        setSelectedLayerIds([]);
        setSnapLines({});
        saveHistoryState(updated);
      } else if (isModKey && e.key === "ArrowUp") {
        e.preventDefault();
        const idx = layers.findIndex(l => l.id === selectedLayerId);
        if (idx < layers.length - 1) {
          const updated = [...layers];
          const temp = updated[idx];
          updated[idx] = updated[idx + 1];
          updated[idx + 1] = temp;
          setLayers(updated);
          saveHistoryState(updated);
        }
      } else if (isModKey && e.key === "ArrowDown") {
        e.preventDefault();
        const idx = layers.findIndex(l => l.id === selectedLayerId);
        if (idx > 0) {
          const updated = [...layers];
          const temp = updated[idx];
          updated[idx] = updated[idx - 1];
          updated[idx - 1] = temp;
          setLayers(updated);
          saveHistoryState(updated);
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const updated = layers.map(l => selectedLayerIds.includes(l.id) ? { ...l, y: l.y - 2 } : l);
        setLayers(updated);
        saveHistoryState(updated);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const updated = layers.map(l => selectedLayerIds.includes(l.id) ? { ...l, y: l.y + 2 } : l);
        setLayers(updated);
        saveHistoryState(updated);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const updated = layers.map(l => selectedLayerIds.includes(l.id) ? { ...l, x: l.x - 2 } : l);
        setLayers(updated);
        saveHistoryState(updated);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const updated = layers.map(l => selectedLayerIds.includes(l.id) ? { ...l, x: l.x + 2 } : l);
        setLayers(updated);
        saveHistoryState(updated);
      } else if (isModKey && e.key === "ArrowUp") {
        e.preventDefault();
        const idx = layers.findIndex(l => l.id === selectedLayerId);
        if (idx < layers.length - 1) {
          const updated = [...layers];
          const temp = updated[idx];
          updated[idx] = updated[idx + 1];
          updated[idx + 1] = temp;
          setLayers(updated);
          saveHistoryState(updated);
        }
      } else if (isModKey && e.key === "ArrowDown") {
        e.preventDefault();
        const idx = layers.findIndex(l => l.id === selectedLayerId);
        if (idx > 0) {
          const updated = [...layers];
          const temp = updated[idx];
          updated[idx] = updated[idx - 1];
          updated[idx - 1] = temp;
          setLayers(updated);
          saveHistoryState(updated);
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const updated = layers.map(l => l.id === selectedLayerId ? { ...l, y: l.y - 2 } : l);
        setLayers(updated);
        saveHistoryState(updated);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const updated = layers.map(l => l.id === selectedLayerId ? { ...l, y: l.y + 2 } : l);
        setLayers(updated);
        saveHistoryState(updated);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const updated = layers.map(l => l.id === selectedLayerId ? { ...l, x: l.x - 2 } : l);
        setLayers(updated);
        saveHistoryState(updated);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const updated = layers.map(l => l.id === selectedLayerId ? { ...l, x: l.x + 2 } : l);
        setLayers(updated);
        saveHistoryState(updated);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedLayerId, layers, selectedLayer, clipboardLayer]);

  // Export and Save Action
  const handleApplyDesign = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Redraw without selection bounding outline
    setSelectedLayerId(null);
    setSnapLines({});
    
    // We must defer slightly to allow state to complete redraw
    setTimeout(() => {
      try {
        canvas.toBlob((blob) => {
          if (!blob) {
            console.error("Canvas export failed: generated blob is null. The canvas might be tainted by cross-origin data.");
            alert("Could not export image. Please try removing external images and try again.");
            return;
          }
          
          // Define file and fire parent callback
          const extension = backgroundColor === "transparent" ? "png" : "jpg";
          const file = new File([blob], `custom-design-${activePlacement}.${extension}`, { 
            type: backgroundColor === "transparent" ? "image/png" : "image/jpeg" 
          });
          
          onSave(file);
        }, backgroundColor === "transparent" ? "image/png" : "image/jpeg", 0.95);
      } catch (e) {
        console.error("Canvas export error:", e);
        alert("Could not export image due to a security restriction. Please try removing external images and try again.");
      }
    }, 100);
  };

  // Re-order layers list helpers
  const handleMoveLayerUp = (id: string) => {
    const index = layers.findIndex(l => l.id === id);
    if (index === -1 || index === layers.length - 1) return;
    
    const updated = [...layers];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    
    setLayers(updated);
    saveHistoryState(updated);
  };

  const handleMoveLayerDown = (id: string) => {
    const index = layers.findIndex(l => l.id === id);
    if (index === -1 || index === 0) return;

    const updated = [...layers];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;

    setLayers(updated);
    saveHistoryState(updated);
  };

  const handleDuplicateLayer = (id: string) => {
    const layerToDup = layers.find(l => l.id === id);
    if (!layerToDup) return;

    const newLayer: DesignLayer = {
      ...layerToDup,
      id: "dup-" + Date.now(),
      name: `${layerToDup.name} (Copy)`,
      x: Math.min(virtualWidth - 50, layerToDup.x + 40),
      y: Math.min(virtualHeight - 50, layerToDup.y + 40),
      locked: false
    };

    const updated = [...layers, newLayer];
    setLayers(updated);
    setSelectedLayerId(newLayer.id);
    saveHistoryState(updated);
  };

  const handleOpenCropper = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || layer.type !== "image") return;
    
    if (layer.crop) {
      setCropLeft(Math.round(layer.crop.x * 100));
      setCropTop(Math.round(layer.crop.y * 100));
      setCropRight(Math.round((1 - layer.crop.x - layer.crop.width) * 100));
      setCropBottom(Math.round((1 - layer.crop.y - layer.crop.height) * 100));
    } else {
      setCropLeft(0);
      setCropRight(0);
      setCropTop(0);
      setCropBottom(0);
    }
    setCroppingLayerId(layerId);
  };

  const handleApplyCrop = () => {
    if (!croppingLayerId) return;
    
    // Prevent invalid zero dimensions
    if (cropLeft + cropRight >= 100 || cropTop + cropBottom >= 100) {
      return;
    }

    const updatedLayers = layers.map(l => {
      if (l.id === croppingLayerId) {
        const cropX = cropLeft / 100;
        const cropY = cropTop / 100;
        const cropWidth = (100 - cropLeft - cropRight) / 100;
        const cropHeight = (100 - cropTop - cropBottom) / 100;

        // Calculate and maintain aspect ratio to prevent distortion
        let updatedWidth = l.width;
        let updatedHeight = l.height;

        if (l.imageElement) {
          const img = l.imageElement;
          const originalAspect = img.naturalWidth / img.naturalHeight;
          const newAspect = originalAspect * (cropWidth / cropHeight);
          
          // Maintain width, adjust height
          updatedHeight = l.width / newAspect;
        }

        return {
          ...l,
          crop: {
            x: cropX,
            y: cropY,
            width: cropWidth,
            height: cropHeight
          },
          height: updatedHeight
        };
      }
      return l;
    });

    setLayers(updatedLayers);
    saveHistoryState(updatedLayers);
    setCroppingLayerId(null);
  };

  const handleCropDragStart = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveCropDrag({
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: cropLeft,
      startRight: cropRight,
      startTop: cropTop,
      startBottom: cropBottom,
    });
  };

  useEffect(() => {
    if (!activeCropDrag) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = cropBoxRef.current?.getBoundingClientRect();
      if (!rect) return;

      const dx = e.clientX - activeCropDrag.startX;
      const dy = e.clientY - activeCropDrag.startY;

      const pctX = (dx / rect.width) * 100;
      const pctY = (dy / rect.height) * 100;

      const h = activeCropDrag.handle;

      if (h.includes("left")) {
        const val = Math.max(0, Math.min(100 - activeCropDrag.startRight - 5, Math.round(activeCropDrag.startLeft + pctX)));
        setCropLeft(val);
      }
      if (h.includes("right")) {
        const val = Math.max(0, Math.min(100 - activeCropDrag.startLeft - 5, Math.round(activeCropDrag.startRight - pctX)));
        setCropRight(val);
      }
      if (h.includes("top")) {
        const val = Math.max(0, Math.min(100 - activeCropDrag.startBottom - 5, Math.round(activeCropDrag.startTop + pctY)));
        setCropTop(val);
      }
      if (h.includes("bottom")) {
        const val = Math.max(0, Math.min(100 - activeCropDrag.startTop - 5, Math.round(activeCropDrag.startBottom - pctY)));
        setCropBottom(val);
      }
    };

    const handleMouseUp = () => {
      setActiveCropDrag(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [activeCropDrag]);

  const handleResetCrop = (layerId: string) => {
    const updatedLayers = layers.map(l => {
      if (l.id === layerId) {
        // Reset height back to the natural aspect ratio of the image based on its width
        let updatedHeight = l.height;
        if (l.imageElement) {
          const aspect = l.imageElement.naturalWidth / l.imageElement.naturalHeight;
          updatedHeight = l.width / aspect;
        }
        return {
          ...l,
          crop: undefined,
          height: updatedHeight
        };
      }
      return l;
    });
    setLayers(updatedLayers);
    saveHistoryState(updatedLayers);
  };

  const handleApplyStartupSize = (w: number, h: number) => {
    setVirtualWidth(w);
    setVirtualHeight(h);
    
    // Reposition default welcomer text to new coordinates
    const updatedLayers = layers.map(layer => {
      if (layer.id === "default-title") {
        return {
          ...layer,
          x: Math.round(w / 2),
          y: Math.round(h / 2),
          width: Math.min(500, w - 60)
        };
      }
      return layer;
    });
    setLayers(updatedLayers);
    saveHistoryState(updatedLayers);
    setShowSizeSelectorModal(false);
  };

  const handleApplyCanvasCrop = () => {
    const shaveLeft = Math.max(0, canvasShaveLeft);
    const shaveRight = Math.max(0, canvasShaveRight);
    const shaveTop = Math.max(0, canvasShaveTop);
    const shaveBottom = Math.max(0, canvasShaveBottom);

    const newWidth = virtualWidth - shaveLeft - shaveRight;
    const newHeight = virtualHeight - shaveTop - shaveBottom;

    if (newWidth < 150 || newHeight < 150) {
      alert("Error: Canvas is too small! Please keep it at least 150x150 pixels.");
      return;
    }

    const updatedLayers = layers.map(l => ({
      ...l,
      x: l.x - shaveLeft,
      y: l.y - shaveTop
    }));

    setVirtualWidth(newWidth);
    setVirtualHeight(newHeight);
    setLayers(updatedLayers);
    saveHistoryState(updatedLayers);

    setCanvasShaveLeft(0);
    setCanvasShaveRight(0);
    setCanvasShaveTop(0);
    setCanvasShaveBottom(0);
    setIsCanvasCropping(false);
  };

  const handleDeleteLayer = (id: string) => {
    const updated = layers.filter(l => l.id !== id);
    setLayers(updated);
    if (selectedLayerId === id) setSelectedLayerId(null);
    setSnapLines({});
    saveHistoryState(updated);
  };

  const handleAlignToPage = (alignment: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
    if (!selectedLayerId) return;
    const l = layers.find(layer => layer.id === selectedLayerId);
    if (!l) return;

    let newX = l.x;
    let newY = l.y;

    if (alignment === "left") newX = l.width / 2;
    if (alignment === "center") newX = virtualWidth / 2;
    if (alignment === "right") newX = virtualWidth - l.width / 2;
    
    if (alignment === "top") newY = l.height / 2;
    if (alignment === "middle") newY = virtualHeight / 2;
    if (alignment === "bottom") newY = virtualHeight - l.height / 2;

    const updated = layers.map(layer => 
      layer.id === selectedLayerId ? { ...layer, x: newX, y: newY } : layer
    );
    setLayers(updated);
    saveHistoryState(updated);
  };

  const handleOrderLayer = (order: "front" | "back" | "up" | "down") => {
    if (!selectedLayerId) return;
    const index = layers.findIndex(l => l.id === selectedLayerId);
    if (index < 0) return;

    let updated = [...layers];
    const layer = updated.splice(index, 1)[0];

    if (order === "front") {
      updated.push(layer);
    } else if (order === "back") {
      updated.unshift(layer);
    } else if (order === "up") {
      updated.splice(Math.min(updated.length, index + 1), 0, layer);
    } else if (order === "down") {
      updated.splice(Math.max(0, index - 1), 0, layer);
    }

    setLayers(updated);
    saveHistoryState(updated);
  };

  const handleTabClick = (tab: "templates" | "text" | "shapes" | "background" | "upload" | "ai" | "settings") => {
    if (activeTab === tab && isLeftSidebarOpen) {
      setIsLeftSidebarOpen(false);
    } else {
      setActiveTab(tab);
      setIsLeftSidebarOpen(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-50 text-slate-900 overflow-hidden">
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleUploadLocalImage}
        className="hidden"
        accept="image/*,application/pdf,.psd,.ai,.eps"
      />
      {isEraserOpen && selectedLayer?.type === "image" && selectedLayer.src && (
        <EraserModal
          src={selectedLayer.src || undefined}
          onClose={() => setIsEraserOpen(false)}
          onSave={(newSrc) => {
            const newImg = new Image();
            newImg.crossOrigin = "anonymous";
            newImg.onload = () => {
              updateSelectedLayerProps({ src: newSrc, imageElement: newImg, originalSrc: selectedLayer.originalSrc || selectedLayer.src });
              setIsEraserOpen(false);
            };
            newImg.src = newSrc;
          }}
        />
      )}
      {/* 1. Header Toolbar */}
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-600 p-2">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900">Design Studio Online</h1>
            <p className="text-[11px] text-slate-500">Customizing {product?.name} ({activePlacement})</p>
          </div>
        </div>

        {/* Dynamic scale selector & action buttons */}
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-1 shrink-0">
            <button 
              disabled={historyIndex <= 0}
              onClick={handleUndo}
              className="p-1.5 hover:bg-slate-200 rounded-md text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              title="Undo (Ctrl+Z / ⌘Z)"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button 
              disabled={historyIndex >= history.length - 1}
              onClick={handleRedo}
              className="p-1.5 hover:bg-slate-200 rounded-md text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              title="Redo (Ctrl+Y / ⌘Y)"
            >
              <Redo2 className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setShowShortcutsHelp(true)}
              className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-md transition-colors border-l border-slate-200 ml-1 pl-2"
              title="Keyboard Shortcuts Guide"
            >
              <Keyboard className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-1 shrink-0 gap-0.5">
            <button 
              onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
              className={`p-1.5 rounded-md transition-colors ${isLeftSidebarOpen ? "bg-purple-100 text-purple-700" : "hover:bg-slate-200 text-slate-600 hover:text-slate-900"}`}
              title="Toggle Left Tool Panel"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              className={`p-1.5 rounded-md transition-colors ${isRightSidebarOpen ? "bg-purple-100 text-purple-700" : "hover:bg-slate-200 text-slate-600 hover:text-slate-900"}`}
              title="Toggle Right Layers Panel"
            >
              <PanelRight className="h-4 w-4" />
            </button>
          </div>

          <Button 
            variant="outline" 
            onClick={() => { setReplacingImageLayerId(null); fileInputRef.current?.click(); }}
            className="h-9 border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-xs px-3"
          >
            <FolderOpen className="mr-1.5 h-4 w-4" /> Open File
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="h-9 border-slate-200 bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-xs px-3"
          >
            <X className="mr-1.5 h-4 w-4" /> Close
          </Button>
          
          <Button 
            onClick={handleApplyDesign}
            className="h-9 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-4 rounded-lg shadow-md transition-all"
          >
            <Save className="mr-1.5 h-4 w-4" /> Apply Design to Product
          </Button>
        </div>
      </header>

      {/* 2. Main Studio Workspace */}
      <div className="flex flex-1 w-full overflow-hidden">
        
        {/* Left Side Tab Icons */}
        <aside className="w-20 bg-slate-100 border-r border-slate-200 flex flex-col items-center py-4 gap-2 shrink-0">
          <button 
            onClick={() => handleTabClick("templates")}
            className={`flex flex-col items-center gap-1 p-2 w-16 rounded-xl transition-all ${activeTab === "templates" && isLeftSidebarOpen ? "bg-purple-50 text-purple-600 border border-purple-200 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"}`}
          >
            <LayoutTemplate className="h-5 w-5" />
            <span className="text-[10px] font-medium">Templates</span>
          </button>

          <button 
            onClick={() => handleTabClick("text")}
            className={`flex flex-col items-center gap-1 p-2 w-16 rounded-xl transition-all ${activeTab === "text" && isLeftSidebarOpen ? "bg-purple-50 text-purple-600 border border-purple-200 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"}`}
          >
            <Type className="h-5 w-5" />
            <span className="text-[10px] font-medium">Text</span>
          </button>

          <button 
            onClick={() => handleTabClick("shapes")}
            className={`flex flex-col items-center gap-1 p-2 w-16 rounded-xl transition-all ${activeTab === "shapes" && isLeftSidebarOpen ? "bg-purple-50 text-purple-600 border border-purple-200 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"}`}
          >
            <Sparkles className="h-5 w-5" />
            <span className="text-[10px] font-medium">Graphics</span>
          </button>

          <button 
            onClick={() => handleTabClick("upload")}
            className={`flex flex-col items-center gap-1 p-2 w-16 rounded-xl transition-all ${activeTab === "upload" && isLeftSidebarOpen ? "bg-purple-50 text-purple-600 border border-purple-200 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"}`}
          >
            <UploadCloud className="h-5 w-5" />
            <span className="text-[10px] font-medium">Uploads</span>
          </button>

          <button 
            onClick={() => handleTabClick("background")}
            className={`flex flex-col items-center gap-1 p-2 w-16 rounded-xl transition-all ${activeTab === "background" && isLeftSidebarOpen ? "bg-purple-50 text-purple-600 border border-purple-200 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"}`}
          >
            <Palette className="h-5 w-5" />
            <span className="text-[10px] font-medium">Canvas</span>
          </button>

          <button 
            onClick={() => handleTabClick("ai")}
            className={`flex flex-col items-center gap-1 p-2 w-16 rounded-xl transition-all relative ${activeTab === "ai" && isLeftSidebarOpen ? "bg-purple-50 text-purple-600 border border-purple-200 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"}`}
          >
            <Wand2 className="h-5 w-5 text-purple-600" />
            <span className="text-[10px] font-medium">AI Magic</span>
            <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[7px] px-1 py-0.5 rounded font-extrabold uppercase scale-95 tracking-wide">AI</span>
          </button>
          <button 
            onClick={() => handleTabClick("settings")}
            className={`flex flex-col items-center gap-1 p-2 w-16 rounded-xl transition-all ${activeTab === "settings" && isLeftSidebarOpen ? "bg-purple-50 text-purple-600 border border-purple-200 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"}`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-[10px] font-medium">Properties</span>
          </button>
        </aside>

        {/* Tab Detail panel drawer style */}
        {isLeftSidebarOpen && (
          <div className="w-80 bg-white border-r border-slate-200 flex flex-col p-5 shrink-0 overflow-y-auto no-scrollbar relative pt-12">
            <button 
              onClick={() => setIsLeftSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors z-20"
              title="Close Panel"
            >
              <X className="h-4 w-4" />
            </button>
            {activeTab === "settings" && (
              <div className="space-y-4">
                {selectedLayer ? (
                  <h3 className="font-bold text-sm tracking-wide text-purple-600 uppercase">Layer Properties</h3>
                ) : (
                  <h3 className="font-bold text-sm tracking-wide text-purple-600 uppercase">Canvas Settings</h3>
                )}

                {!selectedLayer && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500">Select a layer on the canvas to edit its properties, or change canvas settings below.</p>
                    
                    <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Canvas Size (Magic Resize)</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => { setVirtualWidth(1080); setVirtualHeight(1080); }} className="p-2 border border-slate-200 rounded-lg text-xs font-semibold hover:border-purple-500 hover:bg-purple-50 text-slate-700 transition-all text-left">
                          <span className="block text-[10px] text-slate-500 font-normal">Instagram Post</span>
                          1080 x 1080
                        </button>
                        <button onClick={() => { setVirtualWidth(1080); setVirtualHeight(1920); }} className="p-2 border border-slate-200 rounded-lg text-xs font-semibold hover:border-purple-500 hover:bg-purple-50 text-slate-700 transition-all text-left">
                          <span className="block text-[10px] text-slate-500 font-normal">Instagram Story</span>
                          1080 x 1920
                        </button>
                        <button onClick={() => { setVirtualWidth(1920); setVirtualHeight(1080); }} className="p-2 border border-slate-200 rounded-lg text-xs font-semibold hover:border-purple-500 hover:bg-purple-50 text-slate-700 transition-all text-left">
                          <span className="block text-[10px] text-slate-500 font-normal">YouTube Thumb</span>
                          1920 x 1080
                        </button>
                        <button onClick={() => { setVirtualWidth(1200); setVirtualHeight(630); }} className="p-2 border border-slate-200 rounded-lg text-xs font-semibold hover:border-purple-500 hover:bg-purple-50 text-slate-700 transition-all text-left">
                          <span className="block text-[10px] text-slate-500 font-normal">Twitter/Link</span>
                          1200 x 630
                        </button>
                        <button onClick={() => { setVirtualWidth(2480); setVirtualHeight(3508); }} className="p-2 border border-slate-200 rounded-lg text-xs font-semibold hover:border-purple-500 hover:bg-purple-50 text-slate-700 transition-all text-left">
                          <span className="block text-[10px] text-slate-500 font-normal">A4 Print</span>
                          2480 x 3508
                        </button>
                        <button onClick={() => { setVirtualWidth(virtualHeight); setVirtualHeight(virtualWidth); }} className="p-2 border border-purple-200 bg-purple-50 rounded-lg text-[11px] font-semibold hover:bg-purple-100 text-purple-700 transition-all text-center flex items-center justify-center gap-1 col-span-2">
                          <RotateCcw className="w-3 h-3" /> Swap Width & Height
                        </button>
                      </div>
                    </div>
                  </div>
                )}
    
                {selectedLayer && (
                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Layer Blend Mode</label>
                    <select
                      value={selectedLayer.blendMode || "normal"}
                      onChange={(e) => {
                        updateSelectedLayerProps({ blendMode: e.target.value });
                        saveHistoryState(layers.map(l => l.id === selectedLayer.id ? { ...l, blendMode: e.target.value } : l));
                      }}
                      className="w-full bg-white text-slate-800 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-purple-500 transition-colors cursor-pointer"
                    >
                      <option value="normal">Normal</option>
                      <option value="multiply">Multiply (Shadows)</option>
                      <option value="screen">Screen (Highlights)</option>
                      <option value="overlay">Overlay (Contrast)</option>
                      <option value="darken">Darken</option>
                      <option value="lighten">Lighten</option>
                      <option value="color-dodge">Color Dodge</option>
                      <option value="color-burn">Color Burn</option>
                      <option value="hard-light">Hard Light</option>
                      <option value="soft-light">Soft Light</option>
                      <option value="difference">Difference</option>
                      <option value="exclusion">Exclusion</option>
                      <option value="hue">Hue</option>
                      <option value="saturation">Saturation</option>
                      <option value="color">Color</option>
                      <option value="luminosity">Luminosity</option>
                    </select>
                  </div>
                )}

    <div className="space-y-2">
                {/* Active Text Edit Box */}
          {selectedLayer && selectedLayer.type === "text" && (
            <div className="mb-6 space-y-2 border-b border-slate-200 pb-5">
              <h4 className="font-bold text-xs tracking-wider uppercase text-purple-600">Edit Selected Text</h4>
              <textarea
                value={selectedLayer.text || ""}
                onChange={(e) => updateSelectedLayerProps({ text: e.target.value })}
                rows={3}
                className="w-full bg-slate-50 text-slate-800 rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-purple-500 transition-colors placeholder-slate-400 leading-normal"
                placeholder="Type your text content here..."
              />
              
              <div className="pt-3 space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Fine-tune Text</span>
                
                {/* Letter Spacing */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Letter Spacing</span>
                    <span className="text-slate-800 font-semibold">{selectedLayer.letterSpacing || 0}px</span>
                  </div>
                  <input 
                    type="range"
                    min={-10}
                    max={50}
                    value={selectedLayer.letterSpacing || 0}
                    onChange={(e) => updateSelectedLayerProps({ letterSpacing: parseInt(e.target.value) })}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                {/* Line Height */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Line Height</span>
                    <span className="text-slate-800 font-semibold">{selectedLayer.lineHeight || 1.25}x</span>
                  </div>
                  <input 
                    type="range"
                    min={0.5}
                    max={3}
                    step={0.05}
                    value={selectedLayer.lineHeight || 1.25}
                    onChange={(e) => updateSelectedLayerProps({ lineHeight: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                {/* Opacity/Fade */}
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Opacity (Fade)</span>
                    <span className="text-slate-800 font-semibold">{selectedLayer.opacity !== undefined ? Math.round(selectedLayer.opacity * 100) : 100}%</span>
                  </div>
                  <input 
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={selectedLayer.opacity !== undefined ? selectedLayer.opacity : 1}
                    onChange={(e) => updateSelectedLayerProps({ opacity: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
                
                {/* Stroke Settings */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-slate-500">Stroke:</span>
                    <input 
                      type="color"
                      value={selectedLayer.stroke || "#000000"}
                      onChange={(e) => updateSelectedLayerProps({ stroke: e.target.value, strokeWidth: selectedLayer.strokeWidth === undefined ? 2 : selectedLayer.strokeWidth })}
                      className="w-6 h-6 rounded cursor-pointer p-0 border-0 bg-transparent"
                    />
                    <button 
                      onClick={() => updateSelectedLayerProps({ stroke: undefined, strokeWidth: undefined })}
                      className="ml-auto text-[10px] text-slate-400 hover:text-slate-800"
                    >
                      Clear
                    </button>
                  </div>
                  
                  {selectedLayer.stroke && (
                    <div className="space-y-1 bg-slate-50 p-3 rounded border border-slate-200 mt-2">
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Width</span>
                        <span className="text-slate-800 font-semibold">{selectedLayer.strokeWidth || 2}px</span>
                      </div>
                      <input 
                        type="range" min={1} max={50}
                        value={selectedLayer.strokeWidth || 2}
                        onChange={(e) => updateSelectedLayerProps({ strokeWidth: parseInt(e.target.value) })}
                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                  )}
                </div>

                {/* Drop Shadow settings */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-slate-500">Shadow:</span>
                    <input 
                      type="color"
                      value={selectedLayer.shadowColor || "#000000"}
                      onChange={(e) => updateSelectedLayerProps({ shadowColor: e.target.value, shadowBlur: selectedLayer.shadowBlur === undefined ? 5 : selectedLayer.shadowBlur })}
                      className="w-6 h-6 rounded cursor-pointer p-0 border-0 bg-transparent"
                    />
                    <button 
                      onClick={() => updateSelectedLayerProps({ shadowColor: undefined, shadowBlur: undefined })}
                      className="ml-auto text-[10px] text-slate-400 hover:text-slate-800"
                    >
                      Clear
                    </button>
                  </div>
                  
                  {selectedLayer.shadowColor && (
                    <div className="space-y-3 bg-slate-550 bg-slate-50 p-3 rounded border border-slate-200 mt-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Blur</span>
                        </div>
                        <input 
                          type="range"
                          min={0}
                          max={50}
                          value={selectedLayer.shadowBlur || 0}
                          onChange={(e) => updateSelectedLayerProps({ shadowBlur: parseInt(e.target.value) })}
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Offset X</span>
                        </div>
                        <input 
                          type="range"
                          min={-50}
                          max={50}
                          value={selectedLayer.shadowOffsetX || 0}
                          onChange={(e) => updateSelectedLayerProps({ shadowOffsetX: parseInt(e.target.value) })}
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Offset Y</span>
                        </div>
                        <input 
                          type="range"
                          min={-50}
                          max={50}
                          value={selectedLayer.shadowOffsetY || 0}
                          onChange={(e) => updateSelectedLayerProps({ shadowOffsetY: parseInt(e.target.value) })}
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Active Image Customization Panel */}
          {selectedLayer && selectedLayer.type === "image" && (
            <div className="mb-6 space-y-4 border-b border-slate-200 pb-5 text-xs">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xs tracking-wider uppercase text-purple-600">Image Settings</h4>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleOpenCropper(selectedLayer.id)}
                    className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] transition-all"
                  >
                    <Crop className="h-3 w-3" />
                    <span>Crop</span>
                  </button>
                  {selectedLayer.crop && (
                    <button 
                      onClick={() => handleResetCrop(selectedLayer.id)}
                      className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold px-2 py-1 rounded-lg text-[10px]"
                      title="Reset all cropping"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* AI Tools */}
              <div className="space-y-3 bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block flex items-center gap-1.5">
                  <Wand2 className="h-3 w-3" /> AI Image Tools
                </span>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleRemoveBackground}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white border border-purple-200 hover:border-purple-500 hover:shadow-md hover:shadow-purple-500/10 text-purple-700 transition-all text-[10px] font-bold"
                  >
                    <ImageOff className="h-4 w-4" />
                    <span>Remove BG</span>
                  </button>
                  <button
                    onClick={handleUpscaleImage}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white border border-purple-200 hover:border-purple-500 hover:shadow-md hover:shadow-purple-500/10 text-purple-700 transition-all text-[10px] font-bold"
                  >
                    <Maximize className="h-4 w-4" />
                    <span>Upscale HD</span>
                  </button>
                
                  <button
                    onClick={() => setIsEraserOpen(true)}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white border border-purple-200 hover:border-purple-500 hover:shadow-md hover:shadow-purple-500/10 text-purple-700 transition-all text-[10px] font-bold"
                  >
                    <Eraser className="h-4 w-4" />
                    <span>Eraser</span>
                  </button>
                </div>
                
                {selectedLayer.originalSrc && (
                  <button 
                    onClick={handleUndoImage}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-dashed border-slate-300 mt-1"
                  >
                    <Undo2 className="h-3 w-3" />
                    Restore Original
                  </button>
                )}
              </div>

              {/* Flip & Opacity Row */}
              <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[11px] font-medium">Quick Flip:</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => updateSelectedLayerProps({ flipX: !selectedLayer.flipX })}
                      className={`px-2 py-1 rounded border text-[10px] font-bold transition-all ${selectedLayer.flipX ? "bg-purple-600/10 border-purple-500 text-purple-700" : "bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100"}`}
                    >
                      Flip Horiz
                    </button>
                    <button
                      onClick={() => updateSelectedLayerProps({ flipY: !selectedLayer.flipY })}
                      className={`px-2 py-1 rounded border text-[10px] font-bold transition-all ${selectedLayer.flipY ? "bg-purple-600/10 border-purple-500 text-purple-700" : "bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100"}`}
                    >
                      Flip Vert
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Layer Opacity</span>
                    <span className="text-purple-600 font-bold">{Math.round((selectedLayer.opacity !== undefined ? selectedLayer.opacity : 1) * 100)}%</span>
                  </div>
                  <input 
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round((selectedLayer.opacity !== undefined ? selectedLayer.opacity : 1) * 100)}
                    onChange={(e) => updateSelectedLayerProps({ opacity: parseInt(e.target.value) / 100 })}
                    className="w-full accent-purple-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    onMouseUp={() => saveHistoryState(layers)}
                    onTouchEnd={() => saveHistoryState(layers)}
                  />
                </div>
              </div>

              {/* Advanced Layer Actions (Align & Order) */}
              <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="space-y-2">
                  <span className="text-slate-500 text-[11px] font-medium block">Align to Canvas:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button onClick={() => handleAlignToPage("left")} className="px-1 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-[10px] font-semibold text-slate-600 transition-colors">Left</button>
                    <button onClick={() => handleAlignToPage("center")} className="px-1 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-[10px] font-semibold text-slate-600 transition-colors">Center</button>
                    <button onClick={() => handleAlignToPage("right")} className="px-1 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-[10px] font-semibold text-slate-600 transition-colors">Right</button>
                    <button onClick={() => handleAlignToPage("top")} className="px-1 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-[10px] font-semibold text-slate-600 transition-colors">Top</button>
                    <button onClick={() => handleAlignToPage("middle")} className="px-1 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-[10px] font-semibold text-slate-600 transition-colors">Middle</button>
                    <button onClick={() => handleAlignToPage("bottom")} className="px-1 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-[10px] font-semibold text-slate-600 transition-colors">Bottom</button>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <span className="text-slate-500 text-[11px] font-medium block">Layer Order:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button onClick={() => handleOrderLayer("up")} className="flex items-center justify-center gap-1 px-1 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-[10px] font-semibold text-slate-600 transition-colors">
                      <ChevronUp className="w-3 h-3" /> Forward
                    </button>
                    <button onClick={() => handleOrderLayer("down")} className="flex items-center justify-center gap-1 px-1 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-[10px] font-semibold text-slate-600 transition-colors">
                      <ChevronDown className="w-3 h-3" /> Backward
                    </button>
                    <button onClick={() => handleOrderLayer("front")} className="flex items-center justify-center gap-1 px-1 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-[10px] font-semibold text-slate-600 transition-colors col-span-1">
                      <ChevronsUp className="w-3 h-3" /> To Front
                    </button>
                    <button onClick={() => handleOrderLayer("back")} className="flex items-center justify-center gap-1 px-1 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-[10px] font-semibold text-slate-600 transition-colors col-span-1">
                      <ChevronsDown className="w-3 h-3" /> To Back
                    </button>
                  </div>
                </div>
              </div>

                            {selectedLayer.type === "image" && (
              <>
              {/* Filter Presets */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Filter Presets</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button onClick={() => updateSelectedLayerProps({ brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, blur: 0 })} className="px-2 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-[10px] font-semibold text-slate-600 transition-colors">None</button>
                  <button onClick={() => updateSelectedLayerProps({ brightness: 100, contrast: 120, saturate: 100, grayscale: 100, sepia: 0, blur: 0 })} className="px-2 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-[10px] font-semibold text-slate-600 transition-colors">B&W</button>
                  <button onClick={() => updateSelectedLayerProps({ brightness: 90, contrast: 110, saturate: 120, grayscale: 0, sepia: 80, blur: 0 })} className="px-2 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-[10px] font-semibold text-slate-600 transition-colors">Vintage</button>
                  <button onClick={() => updateSelectedLayerProps({ brightness: 110, contrast: 105, saturate: 130, grayscale: 0, sepia: 0, blur: 0 })} className="px-2 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-[10px] font-semibold text-slate-600 transition-colors">Summer</button>
                  <button onClick={() => updateSelectedLayerProps({ brightness: 80, contrast: 150, saturate: 200, grayscale: 0, sepia: 0, blur: 0 })} className="px-2 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-[10px] font-semibold text-slate-600 transition-colors">Cyberpunk</button>
                  <button onClick={() => updateSelectedLayerProps({ brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, blur: 4 })} className="px-2 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-[10px] font-semibold text-slate-600 transition-colors">Blur</button>
                </div>
              </div>

              {/* Image Fine-Tune Filters */}
              <div className="space-y-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Fine-tune Filters</span>
                  <button 
                    onClick={() => updateSelectedLayerProps({ brightness: 100, contrast: 100, saturate: 100, grayscale: 0, blur: 0, sepia: 0, hueRotate: 0 })}
                    className="text-[9px] text-slate-400 hover:text-slate-600 font-semibold"
                  >
                    Reset All
                  </button>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Brightness</span>
                    <span className="text-purple-600 font-bold">{selectedLayer.brightness !== undefined ? selectedLayer.brightness : 100}%</span>
                  </div>
                  <input type="range" min={0} max={200} value={selectedLayer.brightness !== undefined ? selectedLayer.brightness : 100}
                    onChange={(e) => updateSelectedLayerProps({ brightness: parseInt(e.target.value) }, false)}
                    className="w-full accent-purple-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    onMouseUp={() => saveHistoryState(layers)}
                    onTouchEnd={() => saveHistoryState(layers)}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Contrast</span>
                    <span className="text-purple-600 font-bold">{selectedLayer.contrast !== undefined ? selectedLayer.contrast : 100}%</span>
                  </div>
                  <input type="range" min={0} max={200} value={selectedLayer.contrast !== undefined ? selectedLayer.contrast : 100}
                    onChange={(e) => updateSelectedLayerProps({ contrast: parseInt(e.target.value) }, false)}
                    className="w-full accent-purple-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    onMouseUp={() => saveHistoryState(layers)}
                    onTouchEnd={() => saveHistoryState(layers)}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Saturation</span>
                    <span className="text-purple-600 font-bold">{selectedLayer.saturate !== undefined ? selectedLayer.saturate : 100}%</span>
                  </div>
                  <input type="range" min={0} max={200} value={selectedLayer.saturate !== undefined ? selectedLayer.saturate : 100}
                    onChange={(e) => updateSelectedLayerProps({ saturate: parseInt(e.target.value) }, false)}
                    className="w-full accent-purple-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    onMouseUp={() => saveHistoryState(layers)}
                    onTouchEnd={() => saveHistoryState(layers)}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Grayscale</span>
                    <span className="text-purple-600 font-bold">{selectedLayer.grayscale !== undefined ? selectedLayer.grayscale : 0}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={selectedLayer.grayscale !== undefined ? selectedLayer.grayscale : 0}
                    onChange={(e) => updateSelectedLayerProps({ grayscale: parseInt(e.target.value) }, false)}
                    className="w-full accent-purple-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    onMouseUp={() => saveHistoryState(layers)}
                    onTouchEnd={() => saveHistoryState(layers)}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Blur</span>
                    <span className="text-purple-600 font-bold">{selectedLayer.blur !== undefined ? selectedLayer.blur : 0}px</span>
                  </div>
                  <input type="range" min={0} max={20} value={selectedLayer.blur !== undefined ? selectedLayer.blur : 0}
                    onChange={(e) => updateSelectedLayerProps({ blur: parseInt(e.target.value) }, false)}
                    className="w-full accent-purple-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    onMouseUp={() => saveHistoryState(layers)}
                    onTouchEnd={() => saveHistoryState(layers)}
                  />
                </div>
              </div>

              </>
            )}
              {/* Precise Rotation Controls */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Rotation Angle</span>
                  <span className="text-purple-600 font-bold">{Math.round(((selectedLayer.rotation || 0) * 180 / Math.PI + 360) % 360)}°</span>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="range"
                    min={0}
                    max={359}
                    value={Math.round(((selectedLayer.rotation || 0) * 180 / Math.PI + 360) % 360)}
                    onChange={(e) => {
                      const deg = parseInt(e.target.value);
                      updateSelectedLayerProps({ rotation: (deg * Math.PI / 180) });
                    }}
                    className="flex-1 accent-purple-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex gap-1 shrink-0">
                    <button 
                      onClick={() => {
                        const currDeg = (selectedLayer.rotation || 0) * 180 / Math.PI;
                        const newRad = ((currDeg - 90) * Math.PI / 180);
                        updateSelectedLayerProps({ rotation: newRad });
                        saveHistoryState(layers.map(l => l.id === selectedLayer.id ? { ...l, rotation: newRad } : l));
                      }}
                      className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-600"
                      title="Rotate -90°"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </button>
                    <button 
                      onClick={() => {
                        const currDeg = (selectedLayer.rotation || 0) * 180 / Math.PI;
                        const newRad = ((currDeg + 90) * Math.PI / 180);
                        updateSelectedLayerProps({ rotation: newRad });
                        saveHistoryState(layers.map(l => l.id === selectedLayer.id ? { ...l, rotation: newRad } : l));
                      }}
                      className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-600"
                      title="Rotate +90°"
                    >
                      <RotateCw className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>


            </div>
          )}


    </div>
  </div>
)}

{activeTab === "templates" && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm tracking-wide text-purple-600 uppercase">Pre-designed Layouts</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Choose a free premium template. Selecting a layout auto-scales the canvas to its native size.</p>
              
              {/* Filter Pills row */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar border-b border-slate-200">
                {[
                  { id: "all", label: "All" },
                  { id: "business-cards", label: "Cards" },
                  { id: "posters-flyers", label: "Posters" },
                  { id: "social-media", label: "Social" },
                  { id: "apparel", label: "Apparel" }
                ].map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategoryTab(category.id)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all shrink-0 ${selectedCategoryTab === category.id ? "bg-purple-600 text-white shadow" : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"}`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3 pt-2">
                {availableTemplates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectTemplate(template)}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 bg-slate-50/80 hover:border-purple-500 hover:bg-slate-100 transition-all group"
                  >
                    <div className="h-28 rounded-lg mb-2 relative overflow-hidden flex items-center justify-center" style={{ backgroundColor: template.backgroundColor === "transparent" ? "#f1f5f9" : template.backgroundColor }}>
                      {template.backgroundColor === "transparent" && (
                        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] [background-size:16px_16px]" />
                      )}
                      <span className="text-xs font-bold px-3 py-1 rounded bg-black/60 text-white z-10 border border-white/10">{template.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-700 group-hover:text-purple-600">{template.name}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-600 text-white">Free</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "text" && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm tracking-wide text-purple-600 uppercase">Typography Tool</h3>
              <p className="text-xs text-slate-500 mb-6">Click to add premium stylized text headings to your custom canvas layout.</p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => handleAddText("Add a Headline", 48)}
                  className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left font-bold text-lg text-slate-900 flex items-center gap-3 transition-all"
                >
                  <Type className="h-5 w-5 text-purple-600" /> Add a Headline
                </button>

                <button 
                  onClick={() => handleAddText("Add Subtitle Text", 28)}
                  className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left font-medium text-sm text-slate-800 flex items-center gap-3 transition-all"
                >
                  <Type className="h-4 w-4 text-purple-500" /> Add Subtitle
                </button>

                <button 
                  onClick={() => handleAddText("Body text block.", 16)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left text-xs text-slate-600 flex items-center gap-3 transition-all"
                >
                  <Type className="h-3.5 w-3.5 text-slate-400" /> Add Body Text
                </button>
              </div>
            </div>
          )}

          {activeTab === "shapes" && (
            <div className="space-y-5">
              <div>
                <h3 className="font-bold text-sm tracking-wide text-purple-600 uppercase mb-1">Vector Shapes</h3>
                <p className="text-[11px] text-slate-500 mb-3">Add vector accents and lines to design elements.</p>
                
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => handleAddShape("rectangle")}
                    className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
                  >
                    <Square className="h-6 w-6 text-indigo-600 mb-1" />
                    <span className="text-[10px] font-medium">Square</span>
                  </button>
                  <button 
                    onClick={() => handleAddShape("circle")}
                    className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
                  >
                    <Circle className="h-6 w-6 text-indigo-600 mb-1" />
                    <span className="text-[10px] font-medium">Circle</span>
                  </button>
                  <button 
                    onClick={() => handleAddShape("triangle")}
                    className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
                  >
                    <Triangle className="h-6 w-6 text-indigo-600 mb-1" />
                    <span className="text-[10px] font-medium">Triangle</span>
                  </button>
                  <button 
                    onClick={() => handleAddShape("star")}
                    className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
                  >
                    <Star className="h-6 w-6 text-indigo-600 mb-1" />
                    <span className="text-[10px] font-medium">Star</span>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm tracking-wide text-purple-600 uppercase mb-1">Stickers & Stamps</h3>
                <p className="text-[11px] text-slate-500 mb-3">Add free customized icons directly to your prints.</p>
                
                <div className="grid grid-cols-3 gap-2.5">
                  {STICKERS.map(sticker => {
                    const Icon = sticker.icon;
                    return (
                      <button 
                        key={sticker.id}
                        onClick={() => handleAddSticker(sticker)}
                        className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-all hover:scale-105"
                      >
                        <Icon className="h-5 w-5 text-pink-600 mb-1" />
                        <span className="text-[9px] truncate w-full text-center font-medium">{sticker.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "upload" && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm tracking-wide text-purple-600 uppercase">Upload Media</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">Add your personal company logos, graphic badges or photographs.</p>
              
              
              <div 
                onClick={() => { setReplacingImageLayerId(null); fileInputRef.current?.click(); }}
                className="border-2 border-dashed border-slate-300 hover:border-purple-500 hover:bg-purple-50/50 rounded-xl p-6 text-center cursor-pointer transition-all"
              >
                <UploadCloud className="h-8 w-8 text-slate-400 mx-auto mb-2 group-hover:scale-110" />
                <span className="text-xs font-semibold block text-slate-700">{isConverting ? "Converting..." : "Click to Choose File"}</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Supports JPG, PNG, WebP, PDF, PSD, AI</span>
              </div>
              
              {uploadedImages.length > 0 && (
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Recently Uploaded</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {uploadedImages.map((src, i) => (
                      <div 
                        key={i} 
                        onClick={() => handleAddImageFromSrc(src)}
                        className="aspect-square bg-slate-100 rounded-lg border border-slate-200 overflow-hidden cursor-pointer hover:border-purple-500 transition-colors"
                      >
                        <img referrerPolicy="no-referrer" src={src || undefined} alt="Uploaded" className="w-full h-full object-contain" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "background" && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm tracking-wide text-purple-600 uppercase">Canvas Background</h3>
              <p className="text-xs text-slate-500">Set a high contrast solid color or toggle transparency.</p>
              
              <div className="flex gap-2 mb-4">
                <Button 
                  variant="outline"
                  onClick={() => setBackgroundColor("transparent")}
                  className={`flex-1 text-xs border-slate-200 h-9 hover:bg-slate-100 text-slate-700 ${backgroundColor === "transparent" ? "bg-purple-50 border-purple-500 text-purple-700 font-bold" : "bg-transparent"}`}
                >
                  Transparent
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setBackgroundColor("#ffffff")}
                  className={`flex-1 text-xs border-slate-200 h-9 hover:bg-slate-100 text-slate-700 ${backgroundColor === "#ffffff" ? "bg-purple-50 border-purple-500 text-purple-700 font-bold" : "bg-transparent"}`}
                >
                  Solid White
                </Button>
              </div>

              <div className="grid grid-cols-5 gap-2 pt-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setBackgroundColor(color)}
                    className={`w-10 h-10 rounded-lg border transition-all ${backgroundColor === color ? "border-slate-800 scale-110 ring-2 ring-purple-500" : "border-slate-200 hover:scale-105 shadow-sm"}`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>

              <div className="border-t border-slate-200 pt-4 mt-4 space-y-4">
                <div>
                  <h4 className="font-semibold text-xs text-purple-600 uppercase tracking-wider mb-2">Canvas Dimensions</h4>
                  <p className="text-[11px] text-slate-500 mb-3">Pick a preset format or enter custom pixel boundaries.</p>
                </div>

                {/* Preset Buttons Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setVirtualWidth(800);
                      setVirtualHeight(800);
                    }}
                    className={`text-[10px] h-8 justify-start border-slate-200 hover:bg-slate-100 hover:text-slate-900 ${virtualWidth === 800 && virtualHeight === 800 ? "bg-purple-50 border-purple-500 text-purple-700 font-bold" : "text-slate-600 bg-transparent"}`}
                  >
                    🔳 Square (800x800)
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setVirtualWidth(1050);
                      setVirtualHeight(600);
                    }}
                    className={`text-[10px] h-8 justify-start border-slate-200 hover:bg-slate-100 hover:text-slate-900 ${virtualWidth === 1050 && virtualHeight === 600 ? "bg-purple-50 border-purple-500 text-purple-700 font-bold" : "text-slate-600 bg-transparent"}`}
                  >
                    💳 Business Card (1050x600)
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setVirtualWidth(700);
                      setVirtualHeight(990);
                    }}
                    className={`text-[10px] h-8 justify-start border-slate-200 hover:bg-slate-100 hover:text-slate-900 ${virtualWidth === 700 && virtualHeight === 990 ? "bg-purple-50 border-purple-500 text-purple-700 font-bold" : "text-slate-600 bg-transparent"}`}
                  >
                    📄 Flyer/Poster (700x990)
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setVirtualWidth(1200);
                      setVirtualHeight(500);
                    }}
                    className={`text-[10px] h-8 justify-start border-slate-200 hover:bg-slate-100 hover:text-slate-900 ${virtualWidth === 1200 && virtualHeight === 500 ? "bg-purple-50 border-purple-500 text-purple-700 font-bold" : "text-slate-600 bg-transparent"}`}
                  >
                    🌅 Wide Banner (1200x500)
                  </Button>
                </div>

                {/* Custom inputs */}
                <div className="flex gap-3 pt-1">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Width (px)</label>
                    <input 
                      type="number"
                      min={400}
                      max={2400}
                      value={virtualWidth}
                      onChange={(e) => setVirtualWidth(Math.max(400, Math.min(2400, parseInt(e.target.value) || 800)))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Height (px)</label>
                    <input 
                      type="number"
                      min={400}
                      max={2400}
                      value={virtualHeight}
                      onChange={(e) => setVirtualHeight(Math.max(400, Math.min(2400, parseInt(e.target.value) || 800)))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>

                {/* Interactive Canvas Custom Crop Option */}
                <div className="border-t border-slate-200 pt-4 mt-2 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-xs text-purple-600 uppercase tracking-wider">Canvas Custom Crop</h4>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCanvasCropping(!isCanvasCropping);
                        setCanvasShaveLeft(0);
                        setCanvasShaveRight(0);
                        setCanvasShaveTop(0);
                        setCanvasShaveBottom(0);
                      }}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all border ${isCanvasCropping ? "bg-purple-50 border-purple-500 text-purple-700" : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}
                    >
                      {isCanvasCropping ? "Cancel" : "Crop Canvas"}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">Shave off pixels from the outer boundaries of the canvas non-destructively.</p>

                  {isCanvasCropping && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3 mt-2">
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="space-y-1">
                          <span className="text-slate-500 font-medium">Shave Left (px)</span>
                          <input 
                            type="number"
                            min={0}
                            max={Math.max(0, virtualWidth - 150)}
                            value={canvasShaveLeft}
                            onChange={(e) => setCanvasShaveLeft(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full bg-white border border-slate-200 rounded p-1 text-[11px] font-mono text-slate-800 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-500 font-medium">Shave Right (px)</span>
                          <input 
                            type="number"
                            min={0}
                            max={Math.max(0, virtualWidth - 150)}
                            value={canvasShaveRight}
                            onChange={(e) => setCanvasShaveRight(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full bg-white border border-slate-200 rounded p-1 text-[11px] font-mono text-slate-800 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-500 font-medium">Shave Top (px)</span>
                          <input 
                            type="number"
                            min={0}
                            max={Math.max(0, virtualHeight - 150)}
                            value={canvasShaveTop}
                            onChange={(e) => setCanvasShaveTop(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full bg-white border border-slate-200 rounded p-1 text-[11px] font-mono text-slate-800 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-500 font-medium">Shave Bottom (px)</span>
                          <input 
                            type="number"
                            min={0}
                            max={Math.max(0, virtualHeight - 150)}
                            value={canvasShaveBottom}
                            onChange={(e) => setCanvasShaveBottom(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full bg-white border border-slate-200 rounded p-1 text-[11px] font-mono text-slate-800 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="bg-purple-50 border border-purple-100 p-2 rounded text-[10px] text-purple-700 leading-relaxed">
                        <strong>New Size:</strong> {virtualWidth - canvasShaveLeft - canvasShaveRight} × {virtualHeight - canvasShaveTop - canvasShaveBottom} px
                      </div>

                      <button
                        type="button"
                        onClick={handleApplyCanvasCrop}
                        className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition-all shadow"
                      >
                        Apply Canvas Crop
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "ai" && (
            <div className="space-y-5 flex flex-col h-full">
              <div>
                <h3 className="font-bold text-sm tracking-wide text-purple-600 uppercase">AI Design Magic</h3>
                <p className="text-xs text-slate-500 mt-1">Supercharge your branding with custom AI copy, palettes, and layout critiques.</p>
              </div>

              {/* Sub-tab Navigation */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
                <button
                  onClick={() => setAiSubTab("copy")}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[10px] font-semibold transition-all ${aiSubTab === "copy" ? "bg-purple-600 text-white shadow-md" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  <span>Copywriter</span>
                </button>
                <button
                  onClick={() => setAiSubTab("palette")}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[10px] font-semibold transition-all ${aiSubTab === "palette" ? "bg-purple-600 text-white shadow-md" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <Palette className="h-3.5 w-3.5" />
                  <span>Palettes</span>
                </button>
                <button
                  onClick={() => setAiSubTab("audit")}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[10px] font-semibold transition-all ${aiSubTab === "audit" ? "bg-purple-600 text-white shadow-md" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <Brain className="h-3.5 w-3.5" />
                  <span>Audit</span>
                </button>
                <button
                  onClick={() => setAiSubTab("image")}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[10px] font-semibold transition-all ${aiSubTab === "image" ? "bg-purple-600 text-white shadow-md" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>Images</span>
                </button>
              </div>

              {/* Sub-tab Panels */}
              <div className="flex-1 space-y-4">
                {aiSubTab === "image" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Image Description</label>
                      <textarea
                        value={aiImagePrompt}
                        onChange={(e) => setAiImagePrompt(e.target.value)}
                        placeholder="e.g. A serene mountain landscape at sunset..."
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:border-purple-500 min-h-[80px] resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Aspect Ratio</label>
                      <select
                        value={aiImageAspectRatio}
                        onChange={(e) => setAiImageAspectRatio(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:border-purple-500"
                      >
                        <option value="1:1">Square (1:1)</option>
                        <option value="16:9">Widescreen (16:9)</option>
                        <option value="9:16">Portrait (9:16)</option>
                        <option value="4:3">Standard (4:3)</option>
                      </select>
                    </div>

                    <button 
                      onClick={handleGenerateImage}
                      disabled={aiGeneratingImage || !aiImagePrompt.trim()}
                      className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition-all flex justify-center items-center gap-2 active:scale-95 disabled:opacity-70"
                    >
                      {aiGeneratingImage ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4" />
                          <span>Generate Image</span>
                        </>
                      )}
                    </button>

                    {aiImageError && (
                      <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-semibold">
                        {aiImageError}
                      </div>
                    )}

                    {aiGeneratedImage && (
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">Generated Result (Click to add):</span>
                        <button 
                          className="w-full overflow-hidden rounded-lg border border-purple-200 hover:border-purple-500 hover:ring-2 hover:ring-purple-500/20 transition-all group"
                          onClick={() => {
                            const newImg = new Image();
                            newImg.crossOrigin = "anonymous";
                            newImg.onload = () => {
                              const newLayer: DesignLayer = {
                                id: Date.now().toString(),
                                type: "image",
                                name: "Generated Image",
                                x: Math.round(virtualWidth / 2),
                                y: Math.round(virtualHeight / 2),
                                width: Math.min(300, virtualWidth - 40),
                                height: Math.min(300, virtualWidth - 40) * (newImg.height / newImg.width),
                                rotation: 0,
                                src: aiGeneratedImage,
                                imageElement: newImg,
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
                              saveHistoryState(updated);
                              setSelectedLayerId(newLayer.id);
                            };
                            newImg.src = aiGeneratedImage;
                          }}
                        >
                          <img referrerPolicy="no-referrer" src={aiGeneratedImage || undefined} alt="Generated" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {aiSubTab === "copy" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Product Type</label>
                      <input
                        type="text"
                        value={aiProductType}
                        onChange={(e) => setAiProductType(e.target.value)}
                        placeholder="e.g. Premium Business Card"
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Industry</label>
                        <select
                          value={aiIndustry}
                          onChange={(e) => setAiIndustry(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:border-purple-500"
                        >
                          <option value="Bakery & Cafe">Bakery & Cafe</option>
                          <option value="Real Estate">Real Estate</option>
                          <option value="Fitness & Wellness">Fitness & Wellness</option>
                          <option value="Tech Startup">Tech Startup</option>
                          <option value="Corporate Law">Corporate Law</option>
                          <option value="Medical Clinic">Medical Clinic</option>
                          <option value="Creative Agency">Creative Agency</option>
                          <option value="General Retail">General Retail</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tone</label>
                        <select
                          value={aiTone}
                          onChange={(e) => setAiTone(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:border-purple-500"
                        >
                          <option value="Professional & Trustworthy">Professional</option>
                          <option value="Minimalist & Sleek">Minimalist</option>
                          <option value="Bold & Modern">Bold/Modern</option>
                          <option value="Retro & Nostalgic">Retro/Vintage</option>
                          <option value="Playful & Friendly">Playful</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Extra Context (Optional)</label>
                      <textarea
                        value={aiContext}
                        onChange={(e) => setAiContext(e.target.value)}
                        placeholder="e.g. Organic bakery on Delhi High Street"
                        rows={2}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:border-purple-500 resize-none"
                      />
                    </div>

                    <Button
                      onClick={handleGenerateTexts}
                      disabled={aiGeneratingTexts}
                      className="w-full h-10 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2"
                    >
                      {aiGeneratingTexts ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Generating Copy...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4" />
                          <span>Generate Creative Copy</span>
                        </>
                      )}
                    </Button>

                    {aiGeneratedTexts.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">Generated Options (Click to add):</span>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1 no-scrollbar">
                          {aiGeneratedTexts.map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleAddText(item.text, 28)}
                              className="w-full text-left p-3 rounded-lg border border-slate-200 bg-slate-50 hover:border-purple-500/50 hover:bg-slate-100 transition-all flex flex-col gap-1 group"
                            >
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
                              <p className="text-xs text-slate-700 font-medium leading-normal group-hover:text-purple-700 transition-colors">{item.text}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {aiSubTab === "palette" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Palette Vibe / Concept</label>
                      <input
                        type="text"
                        value={aiVibe}
                        onChange={(e) => setAiVibe(e.target.value)}
                        placeholder="e.g. vintage tea room, cozy dark academia, fresh mint tea"
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:border-purple-500"
                      />
                    </div>

                    <Button
                      onClick={handleGeneratePalette}
                      disabled={aiGeneratingColors || !aiVibe.trim()}
                      className="w-full h-10 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2"
                    >
                      {aiGeneratingColors ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Generating Palette...</span>
                        </>
                      ) : (
                        <>
                          <Palette className="h-4 w-4" />
                          <span>Generate Branding Palette</span>
                        </>
                      )}
                    </Button>

                    {aiGeneratedPalette && (
                      <div className="space-y-3 pt-2 border-t border-slate-200">
                        <div>
                          <h4 className="text-xs font-bold text-purple-600">{aiGeneratedPalette.paletteName}</h4>
                          <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">{aiGeneratedPalette.description}</p>
                        </div>

                        <div className="space-y-2">
                          {aiGeneratedPalette.colors.map((color, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 group hover:border-purple-500/30 transition-all">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded border border-slate-300 shadow-sm shrink-0" style={{ backgroundColor: color.hex }} />
                                <div className="text-left">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-800">{color.name}</span>
                                    <span className="text-[9px] font-mono text-slate-400 lowercase">{color.hex}</span>
                                  </div>
                                  <span className="text-[9px] text-slate-500 leading-tight block mt-0.5">{color.usage}</span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1 shrink-0">
                                <button
                                  onClick={() => setBackgroundColor(color.hex)}
                                  className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-200 hover:bg-purple-600 hover:text-white text-slate-700 transition-colors"
                                >
                                  Set BG
                                </button>
                                {selectedLayer && (
                                  <button
                                    onClick={() => updateSelectedLayerProps({ fill: color.hex })}
                                    className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-200 hover:bg-purple-600 hover:text-white text-slate-700 transition-colors"
                                  >
                                    Fill Layer
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {aiSubTab === "audit" && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 leading-relaxed">Runs an automated design audit analyzing layers, margins, spacing, and contrast using pre-press print standards.</p>
                    
                    <Button
                      onClick={handleReviewDesign}
                      disabled={aiReviewingDesign}
                      className="w-full h-10 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2"
                    >
                      {aiReviewingDesign ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Running Pre-Press Audit...</span>
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4" />
                          <span>Run AI Pre-Press Audit</span>
                        </>
                      )}
                    </Button>

                    {aiDesignReview && (
                      <div className="space-y-3.5 pt-2 border-t border-slate-200">
                        {/* Circular/Square Visual Rating Score */}
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg border-2 shadow-inner shrink-0 ${
                            aiDesignReview.overallScore >= 8 ? 'text-emerald-600 border-emerald-500 bg-emerald-500/10' :
                            aiDesignReview.overallScore >= 5 ? 'text-amber-600 border-amber-500 bg-amber-500/10' :
                            'text-rose-600 border-rose-500 bg-rose-500/10'
                          }`}>
                            {aiDesignReview.overallScore}/10
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Design Score</span>
                            <span className="text-xs font-semibold text-slate-800">
                              {aiDesignReview.overallScore >= 8 ? 'Excellent & Print Ready!' :
                               aiDesignReview.overallScore >= 5 ? 'Good (Needs Minor Tweaks)' :
                               'Needs Structural Adjustments'}
                            </span>
                          </div>
                        </div>

                        {/* Designer Callout critique summary */}
                        <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 italic text-xs text-slate-700 leading-relaxed">
                          "{aiDesignReview.critiqueSummary}"
                        </div>

                        {/* Alert list of issues */}
                        {aiDesignReview.issues && aiDesignReview.issues.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Identified Issues ({aiDesignReview.issues.length}):</span>
                            <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
                              {aiDesignReview.issues.map((issue, idx) => (
                                <div key={idx} className="flex gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                                  <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${
                                    issue.severity === 'error' ? 'text-rose-500' :
                                    issue.severity === 'warning' ? 'text-amber-500' :
                                    'text-blue-500'
                                  }`} />
                                  <span className="text-[11px] text-slate-700 leading-normal">{issue.message}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Suggestion List */}
                        {aiDesignReview.suggestions && aiDesignReview.suggestions.length > 0 && (
                          <div className="space-y-1.5 pt-1.5 border-t border-slate-200">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Recommended Fixes:</span>
                            <ul className="space-y-1 pl-4 list-disc text-[11px] text-slate-700 leading-relaxed">
                              {aiDesignReview.suggestions.map((sug, idx) => (
                                <li key={idx} className="marker:text-purple-600">{sug}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}


              </div>
            </div>
          )}
          </div>
        )}

        {/* Workspace Central Viewport containing scaling interactive canvas */}
        <main className="flex-1 bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
          
          {/* Floating Contextual Controls bar based on selected layer */}
          {selectedLayer && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-white/95 backdrop-blur-md border border-slate-200 px-4 py-2 rounded-2xl shadow-xl max-w-[90%] overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold text-purple-600 uppercase border-r border-slate-200 pr-3">{selectedLayer.name}</span>
              
              {selectedLayer.type === "text" && (
                <div className="flex items-center gap-2">
                  {/* Font Family Selection */}
                  <select 
                    value={selectedLayer.fontFamily}
                    onChange={(e) => updateSelectedLayerProps({ fontFamily: e.target.value })}
                    className="bg-slate-50 text-xs border border-slate-200 rounded px-2 py-1 text-slate-800 outline-none focus:border-purple-500 cursor-pointer"
                  >
                    {FONTS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>

                  {/* Font Size controls */}
                  <div className="flex items-center border border-slate-200 rounded bg-slate-50 p-0.5">
                    <button 
                      onClick={() => updateSelectedLayerProps({ fontSize: Math.max(8, (selectedLayer.fontSize || 36) - 4) })}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs px-2 font-semibold min-w-8 text-center text-slate-800">{selectedLayer.fontSize}</span>
                    <button 
                      onClick={() => updateSelectedLayerProps({ fontSize: Math.min(120, (selectedLayer.fontSize || 36) + 4) })}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Alignments */}
                  <div className="flex items-center border border-slate-200 rounded bg-slate-50 p-0.5">
                    <button 
                      onClick={() => updateSelectedLayerProps({ align: "left" })}
                      className={`p-1 rounded ${selectedLayer.align === "left" ? "bg-purple-600 text-white" : "hover:bg-slate-200 text-slate-500 hover:text-slate-800"}`}
                    >
                      <AlignLeft className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => updateSelectedLayerProps({ align: "center" })}
                      className={`p-1 rounded ${selectedLayer.align === "center" ? "bg-purple-600 text-white" : "hover:bg-slate-200 text-slate-500 hover:text-slate-800"}`}
                    >
                      <AlignCenter className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => updateSelectedLayerProps({ align: "right" })}
                      className={`p-1 rounded ${selectedLayer.align === "right" ? "bg-purple-600 text-white" : "hover:bg-slate-200 text-slate-500 hover:text-slate-800"}`}
                    >
                      <AlignRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Weight Toggle */}
                  <button 
                    onClick={() => updateSelectedLayerProps({ fontWeight: selectedLayer.fontWeight === "bold" ? "normal" : "bold" })}
                    className={`p-1.5 rounded border border-slate-200 bg-slate-50 ${selectedLayer.fontWeight === "bold" ? "bg-purple-600 border-purple-500 text-white" : "text-slate-500 hover:bg-slate-200"}`}
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </button>

                  {/* Italic Toggle */}
                  <button 
                    onClick={() => updateSelectedLayerProps({ fontStyle: selectedLayer.fontStyle === "italic" ? "normal" : "italic" })}
                    className={`p-1.5 rounded border border-slate-200 bg-slate-50 ${selectedLayer.fontStyle === "italic" ? "bg-purple-600 border-purple-500 text-white" : "text-slate-500 hover:bg-slate-200"}`}
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Color Customizer for Layers */}
              {(selectedLayer.type === "text" || selectedLayer.type === "shape" || selectedLayer.type === "sticker") && (
                <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                  <span className="text-[10px] text-slate-500 font-medium">Color:</span>
                  <input 
                    type="color"
                    value={selectedLayer.fill === "transparent" ? "#ffffff" : selectedLayer.fill || "#000000"}
                    onChange={(e) => updateSelectedLayerProps({ fill: e.target.value })}
                    className="w-6 h-6 rounded border border-slate-300 bg-transparent cursor-pointer"
                  />
                </div>
              )}

              {/* Generic Layer Actions: Lock / Duplicate / Trash */}
              <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                <button 
                  onClick={() => updateSelectedLayerProps({ locked: !selectedLayer.locked })}
                  className={`p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 ${selectedLayer.locked ? "text-red-500" : ""}`}
                  title={selectedLayer.locked ? "Unlock Layer" : "Lock Layer position"}
                >
                  {selectedLayer.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                </button>
                <button 
                  onClick={() => handleDuplicateLayer(selectedLayer.id)}
                  className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                  title="Duplicate Layer"
                >
                  <Layers className="h-3.5 w-3.5" />
                </button>
                <button 
                  onClick={() => handleDeleteLayer(selectedLayer.id)}
                  className="p-1.5 rounded hover:bg-red-50 text-red-500 hover:text-red-700"
                  title="Delete Layer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Pages Controls Overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center bg-white shadow-lg border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
              disabled={currentPageIndex === 0}
              className="p-2 hover:bg-slate-100 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronUp className="w-4 h-4 -rotate-90" />
            </button>
            <span className="px-3 text-xs font-semibold text-slate-700 select-none min-w-[5rem] text-center">
              Page {currentPageIndex + 1} of {pages.length}
            </span>
            <button
              onClick={() => setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + 1))}
              disabled={currentPageIndex === pages.length - 1}
              className="p-2 hover:bg-slate-100 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button
              onClick={() => {
                const newPages = [...pages];
                newPages.splice(currentPageIndex + 1, 0, { id: `page-${Date.now()}`, backgroundColor: "#ffffff", layers: [] });
                setPages(newPages);
                setCurrentPageIndex(currentPageIndex + 1);
                setTimeout(() => saveHistoryState(), 0);
              }}
              className="p-2 hover:bg-purple-50 hover:text-purple-600 text-slate-700 transition-colors"
              title="Add New Page"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (pages.length <= 1) return;
                const newPages = pages.filter((_, i) => i !== currentPageIndex);
                setPages(newPages);
                setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
                setTimeout(() => saveHistoryState(), 0);
              }}
              disabled={pages.length <= 1}
              className="p-2 hover:bg-red-50 hover:text-red-600 text-slate-700 disabled:opacity-50 transition-colors"
              title="Delete Current Page"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom Controls Overlay */}
          <div className="absolute bottom-4 right-4 z-40 flex items-center bg-white shadow-lg border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.1, prev - 0.1))}
              className="p-2 hover:bg-slate-100 text-slate-700 transition-colors"
              title="Zoom Out"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-semibold text-slate-700 select-none min-w-[3.5rem] text-center" title="Zoom level">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(10, prev + 0.1))}
              className="p-2 hover:bg-slate-100 text-slate-700 transition-colors"
              title="Zoom In"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Canvas Wrapper */}
          <div 
            ref={containerRef}
            className="w-full max-w-[850px] aspect-square flex items-center justify-center bg-white border border-slate-200 rounded-2xl overflow-auto relative shadow-xl"
          >
            {isProcessingImage && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
                  <Sparkles className="h-4 w-4 text-purple-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-100">AI Magic is Processing...</p>
                  <p className="text-[10px] text-purple-400 mt-0.5">Removing backgrounds & upscaling resolutions</p>
                </div>
              </div>
            )}

            {isConverting && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
                  <UploadCloud className="h-4 w-4 text-purple-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-100">Preparing Your File...</p>
                  <p className="text-[10px] text-purple-400 mt-0.5">{conversionMessage || "Identifying design elements & downloading fonts..."}</p>
                </div>
              </div>
            )}

            {/* Real HTML5 Interactive Canvas */}
            <canvas 
              ref={canvasRef}
              width={virtualWidth}
              height={virtualHeight}
              onMouseDown={handleMouseDown}
              onDoubleClick={handleDoubleClick}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="bg-transparent shadow-2xl transition-all cursor-crosshair rounded"
              style={{
                width: `${virtualWidth * canvasScale * zoomLevel}px`,
                height: `${virtualHeight * canvasScale * zoomLevel}px`
              }}
            />
            {editingTextLayerId && layers.find(l => l.id === editingTextLayerId) && (() => {
              const l = layers.find(layer => layer.id === editingTextLayerId)!;
              const finalScale = canvasScale * zoomLevel;
              return (
                <div 
                  className="absolute pointer-events-none"
                  style={{
                    width: `${virtualWidth * finalScale}px`,
                    height: `${virtualHeight * finalScale}px`
                  }}
                >
                  <textarea
                    autoFocus
                    onBlur={() => setEditingTextLayerId(null)}
                    className="absolute bg-transparent outline-none resize-none overflow-hidden m-0 p-0 pointer-events-auto z-50 border border-purple-500 rounded bg-white/10 backdrop-blur-sm shadow-2xl"
                    style={{
                      left: `${(l.x - l.width / 2) * finalScale}px`,
                      top: `${(l.y - l.height / 2) * finalScale}px`,
                      width: `${l.width * finalScale}px`,
                      height: `${l.height * finalScale}px`,
                      transform: `rotate(${l.rotation}rad)`,
                      transformOrigin: 'center',
                      fontSize: `${(l.fontSize || 32) * finalScale}px`,
                      fontFamily: l.fontFamily,
                      fontWeight: l.fontWeight,
                      fontStyle: l.fontStyle,
                      color: l.fill,
                      textAlign: (l.align || "center") as any,
                      lineHeight: 1.2
                    }}
                    value={l.text || ""}
                    onChange={(e) => {
                      setLayers(curr => curr.map(layer => 
                        layer.id === l.id ? { ...layer, text: e.target.value } : layer
                      ));
                    }}
                    
                  />
                </div>
              );
            })()}
          </div>

          {/* Quick instructions / tips */}
          <div className="mt-4 flex gap-4 text-xs text-slate-600 max-w-lg text-center font-medium leading-relaxed bg-white/90 border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
            <p className="text-slate-600">💡 Tip: Use <span className="text-purple-600 font-semibold">Arrow keys</span> for micro pixel positioning. Press <span className="text-purple-600 font-semibold">Delete</span> to remove elements.</p>
          </div>
        </main>

        {/* Right Sidebar - Layers Manager & Quick Text Input */}
        {isRightSidebarOpen && (
          <aside className="w-80 bg-white border-l border-slate-200 flex flex-col p-5 shrink-0 overflow-y-auto no-scrollbar relative pt-12">
            <button 
              onClick={() => setIsRightSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors z-20"
              title="Close Layers Panel"
            >
              <X className="h-4 w-4" />
            </button>
            
            {/* Layers stack list order */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-xs tracking-wider uppercase text-purple-600">Design Layers ({layers.length})</h4>
                <span className="text-[10px] text-slate-400">Top element prints first</span>
              </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {layers.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl text-center text-slate-400 p-4">
                  <Layers className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-xs">Canvas is empty</p>
                  <button 
                    onClick={() => handleAddText("Hello!")}
                    className="text-purple-600 hover:underline text-xs mt-1.5 font-semibold"
                  >
                    Add default layer &rarr;
                  </button>
                </div>
              ) : (
                [...layers].reverse().map((layer, index) => {
                  const actualIndex = layers.length - 1 - index;
                  const isSelected = selectedLayerId === layer.id;
                  
                  return (
                    <div 
                      key={layer.id}
                      onClick={() => setSelectedLayerId(layer.id)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${isSelected ? "bg-purple-50 border-purple-300 text-purple-900 shadow-sm" : "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700"}`}
                    >
                      <div className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center shrink-0">
                        {layer.type === "text" && <Type className="h-3.5 w-3.5 text-slate-500" />}
                        {layer.type === "shape" && <Square className="h-3.5 w-3.5 text-slate-500" />}
                        {layer.type === "sticker" && <Sparkles className="h-3.5 w-3.5 text-slate-500" />}
                        {layer.type === "image" && <ImageIcon className="h-3.5 w-3.5 text-slate-500" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold truncate block leading-normal">{layer.type === "text" ? layer.text?.slice(0, 18) || "Text" : layer.name}</span>
                        <span className="text-[9px] text-slate-400 font-medium capitalize mt-0.5 block">{layer.type} layer</span>
                      </div>

                      {/* Layer order arrangement toggles */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            const updated = layers.map(ly => ly.id === layer.id ? { ...ly, visible: ly.visible === false ? true : false } : ly);
                            setLayers(updated);
                            saveHistoryState(updated);
                          }}
                          className={`p-1 rounded hover:bg-slate-200 transition-colors ${layer.visible === false ? "text-slate-400 hover:text-slate-600" : "text-purple-600 hover:text-purple-800"}`}
                          title={layer.visible === false ? "Show Layer" : "Hide Layer"}
                        >
                          {layer.visible === false ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button 
                          disabled={actualIndex === layers.length - 1}
                          onClick={(e) => { e.stopPropagation(); handleMoveLayerUp(layer.id); }}
                          className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-800 disabled:opacity-20 disabled:hover:bg-transparent"
                          title="Move Up"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          disabled={actualIndex === 0}
                          onClick={(e) => { e.stopPropagation(); handleMoveLayerDown(layer.id); }}
                          className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-800 disabled:opacity-20 disabled:hover:bg-transparent"
                          title="Move Down"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteLayer(layer.id); }}
                          className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 ml-1"
                          title="Delete Layer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      )}
      </div>

      {/* Non-destructive Cropping Modal Backdrop */}
      {croppingLayerId && (() => {
        const cropLayer = layers.find(l => l.id === croppingLayerId);
        if (!cropLayer || cropLayer.type !== "image" || !cropLayer.src) return null;
        
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Crop className="h-4 w-4 text-purple-600" />
                    <span>Crop Image Layer</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Shave off margins non-destructively to crop the layer</p>
                </div>
                <button 
                  onClick={() => setCroppingLayerId(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                
                {/* Left: Interactive Real-time Clip Preview */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Interactive Crop Preview (Drag borders/corners)</span>
                  <div className="relative border border-slate-200 bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center p-4 min-h-[320px] flex-1 select-none">
                    <div className="relative inline-block max-h-[300px] max-w-full select-none" ref={cropBoxRef}>
                      {/* Underlay: Dimmed Image */}
                      <img referrerPolicy="no-referrer" 
                        src={cropLayer.src || undefined} 
                        className="max-h-[300px] max-w-full object-contain opacity-25 select-none pointer-events-none" 
                        style={{
                          filter: getCSSFilterString(cropLayer)
                        }}
                        alt="Original dimmed" 
                      />
                      
                      {/* Interactive Drag Overlay */}
                      <div 
                        className="absolute border-2 border-purple-500 bg-black/10 transition-all duration-75 group"
                        style={{
                          left: `${cropLeft}%`,
                          top: `${cropTop}%`,
                          right: `${cropRight}%`,
                          bottom: `${cropBottom}%`,
                        }}
                      >
                        {/* 3x3 Grid Overlay */}
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                          <div className="border-r border-b border-purple-400/40"></div>
                          <div className="border-r border-b border-purple-400/40"></div>
                          <div className="border-b border-purple-400/40"></div>
                          <div className="border-r border-b border-purple-400/40"></div>
                          <div className="border-r border-b border-purple-400/40"></div>
                          <div className="border-b border-purple-400/40"></div>
                          <div className="border-r border-purple-400/40"></div>
                          <div className="border-r border-purple-400/40"></div>
                          <div></div>
                        </div>

                        {/* Interactive Corner Drag Handles */}
                        {/* Top Left */}
                        <div 
                          onMouseDown={(e) => handleCropDragStart(e, "top-left")}
                          className="absolute -top-1.5 -left-1.5 w-4.5 h-4.5 bg-white border-2 border-purple-600 rounded-full cursor-nwse-resize hover:scale-125 hover:bg-purple-100 shadow transition-all z-20 flex items-center justify-center"
                          title="Drag to crop"
                        />
                        {/* Top Right */}
                        <div 
                          onMouseDown={(e) => handleCropDragStart(e, "top-right")}
                          className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-white border-2 border-purple-600 rounded-full cursor-nesw-resize hover:scale-125 hover:bg-purple-100 shadow transition-all z-20 flex items-center justify-center"
                          title="Drag to crop"
                        />
                        {/* Bottom Left */}
                        <div 
                          onMouseDown={(e) => handleCropDragStart(e, "bottom-left")}
                          className="absolute -bottom-1.5 -left-1.5 w-4.5 h-4.5 bg-white border-2 border-purple-600 rounded-full cursor-nesw-resize hover:scale-125 hover:bg-purple-100 shadow transition-all z-20 flex items-center justify-center"
                          title="Drag to crop"
                        />
                        {/* Bottom Right */}
                        <div 
                          onMouseDown={(e) => handleCropDragStart(e, "bottom-right")}
                          className="absolute -bottom-1.5 -right-1.5 w-4.5 h-4.5 bg-white border-2 border-purple-600 rounded-full cursor-nwse-resize hover:scale-125 hover:bg-purple-100 shadow transition-all z-20 flex items-center justify-center"
                          title="Drag to crop"
                        />

                        {/* Edge Handles */}
                        {/* Top Edge */}
                        <div 
                          onMouseDown={(e) => handleCropDragStart(e, "top")}
                          className="absolute -top-1.5 left-3 right-3 h-3 cursor-ns-resize hover:bg-purple-500/20 active:bg-purple-500/40 z-10"
                          title="Drag edge to crop"
                        />
                        {/* Bottom Edge */}
                        <div 
                          onMouseDown={(e) => handleCropDragStart(e, "bottom")}
                          className="absolute -bottom-1.5 left-3 right-3 h-3 cursor-ns-resize hover:bg-purple-500/20 active:bg-purple-500/40 z-10"
                          title="Drag edge to crop"
                        />
                        {/* Left Edge */}
                        <div 
                          onMouseDown={(e) => handleCropDragStart(e, "left")}
                          className="absolute -left-1.5 top-3 bottom-3 w-3 cursor-ew-resize hover:bg-purple-500/20 active:bg-purple-500/40 z-10"
                          title="Drag edge to crop"
                        />
                        {/* Right Edge */}
                        <div 
                          onMouseDown={(e) => handleCropDragStart(e, "right")}
                          className="absolute -right-1.5 top-3 bottom-3 w-3 cursor-ew-resize hover:bg-purple-500/20 active:bg-purple-500/40 z-10"
                          title="Drag edge to crop"
                        />
                      </div>

                      {/* Overlaid Highlight Crop Image */}
                      <img referrerPolicy="no-referrer" 
                        src={cropLayer.src || undefined} 
                        className="absolute inset-0 max-h-[300px] max-w-full object-contain select-none pointer-events-none" 
                        style={{ 
                          clipPath: `inset(${cropTop}% ${cropRight}% ${cropBottom}% ${cropLeft}%)`,
                          filter: getCSSFilterString(cropLayer)
                        }} 
                        alt="Cropped highlight" 
                      />
                    </div>
                  </div>
                  
                  <div className="text-[10px] text-slate-500 text-center leading-relaxed">
                    Interactive crop box lets you drag any corner or border with your mouse. Sliders on the right are also fully synchronized.
                  </div>
                </div>

                {/* Right: Fine-tune Sliders & Aspect Ratio Presets */}
                <div className="flex flex-col gap-5 justify-between">
                  <div className="space-y-4">
                    {/* Aspect Ratio Presets */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Aspect Ratio Presets</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: "Freeform", action: () => { setCropLeft(0); setCropRight(0); setCropTop(0); setCropBottom(0); } },
                          { label: "Square 1:1", action: () => {
                              const natW = cropLayer.imageElement?.naturalWidth || 800;
                              const natH = cropLayer.imageElement?.naturalHeight || 800;
                              const aspect = natW / natH;
                              if (aspect > 1) {
                                const ratio = 1 / aspect;
                                const shave = Math.round(((1 - ratio) / 2) * 100);
                                setCropLeft(shave); setCropRight(shave); setCropTop(0); setCropBottom(0);
                              } else {
                                const ratio = aspect;
                                const shave = Math.round(((1 - ratio) / 2) * 100);
                                setCropLeft(0); setCropRight(0); setCropTop(shave); setCropBottom(shave);
                              }
                            } 
                          },
                          { label: "Cinema 16:9", action: () => {
                              const natW = cropLayer.imageElement?.naturalWidth || 800;
                              const natH = cropLayer.imageElement?.naturalHeight || 800;
                              const aspect = natW / natH;
                              const target = 16 / 9;
                              if (aspect > target) {
                                const ratio = target / aspect;
                                const shave = Math.round(((1 - ratio) / 2) * 100);
                                setCropLeft(shave); setCropRight(shave); setCropTop(0); setCropBottom(0);
                              } else {
                                const ratio = aspect / target;
                                const shave = Math.round(((1 - ratio) / 2) * 100);
                                setCropLeft(0); setCropRight(0); setCropTop(shave); setCropBottom(shave);
                              }
                            }
                          },
                          { label: "Standard 4:3", action: () => {
                              const natW = cropLayer.imageElement?.naturalWidth || 800;
                              const natH = cropLayer.imageElement?.naturalHeight || 800;
                              const aspect = natW / natH;
                              const target = 4 / 3;
                              if (aspect > target) {
                                const ratio = target / aspect;
                                const shave = Math.round(((1 - ratio) / 2) * 100);
                                setCropLeft(shave); setCropRight(shave); setCropTop(0); setCropBottom(0);
                              } else {
                                const ratio = aspect / target;
                                const shave = Math.round(((1 - ratio) / 2) * 100);
                                setCropLeft(0); setCropRight(0); setCropTop(shave); setCropBottom(shave);
                              }
                            }
                          },
                          { label: "Portrait 2:3", action: () => {
                              const natW = cropLayer.imageElement?.naturalWidth || 800;
                              const natH = cropLayer.imageElement?.naturalHeight || 800;
                              const aspect = natW / natH;
                              const target = 2 / 3;
                              if (aspect > target) {
                                const ratio = target / aspect;
                                const shave = Math.round(((1 - ratio) / 2) * 100);
                                setCropLeft(shave); setCropRight(shave); setCropTop(0); setCropBottom(0);
                              } else {
                                const ratio = aspect / target;
                                const shave = Math.round(((1 - ratio) / 2) * 100);
                                setCropLeft(0); setCropRight(0); setCropTop(shave); setCropBottom(shave);
                              }
                            }
                          }
                        ].map((p, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={p.action}
                            className="bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-600 rounded-lg hover:text-slate-800 transition-all shadow-sm"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Image Crop Ratio Input */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Custom Aspect Ratio Crop</span>
                        <span className="text-[9px] text-purple-600 font-bold">{customRatioW}:{customRatioH}</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="flex-1 flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1">
                          <span className="text-[9px] text-slate-400 font-bold">W</span>
                          <input 
                            type="number" 
                            min={1}
                            value={customRatioW} 
                            onChange={(e) => setCustomRatioW(Math.max(1, parseFloat(e.target.value) || 1))} 
                            className="w-full bg-transparent text-xs font-mono text-slate-800 focus:outline-none"
                          />
                        </div>
                        <span className="text-slate-400 font-bold text-xs">:</span>
                        <div className="flex-1 flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1">
                          <span className="text-[9px] text-slate-400 font-bold">H</span>
                          <input 
                            type="number" 
                            min={1}
                            value={customRatioH} 
                            onChange={(e) => setCustomRatioH(Math.max(1, parseFloat(e.target.value) || 1))} 
                            className="w-full bg-transparent text-xs font-mono text-slate-800 focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const natW = cropLayer.imageElement?.naturalWidth || 800;
                            const natH = cropLayer.imageElement?.naturalHeight || 800;
                            const aspect = natW / natH;
                            const target = customRatioW / customRatioH;
                            if (aspect > target) {
                              const ratio = target / aspect;
                              const shave = Math.round(((1 - ratio) / 2) * 100);
                              setCropLeft(shave); setCropRight(shave); setCropTop(0); setCropBottom(0);
                            } else {
                              const ratio = aspect / target;
                              const shave = Math.round(((1 - ratio) / 2) * 100);
                              setCropLeft(0); setCropRight(0); setCropTop(shave); setCropBottom(shave);
                            }
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-sm"
                        >
                          Apply Ratio
                        </button>
                      </div>
                    </div>

                    {/* Precise margin cropping sliders */}
                    <div className="space-y-3.5 border-t border-slate-200 pt-4">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Shave Crop Margins</span>
                      
                      {/* Left */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Crop Left Margin</span>
                          <span className="text-purple-600 font-bold">{cropLeft}%</span>
                        </div>
                        <input 
                          type="range"
                          min={0}
                          max={Math.max(0, 100 - cropRight - 5)}
                          value={cropLeft}
                          onChange={(e) => setCropLeft(parseInt(e.target.value))}
                          className="w-full accent-purple-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    onMouseUp={() => saveHistoryState(layers)}
                    onTouchEnd={() => saveHistoryState(layers)}
                  />
                      </div>

                      {/* Right */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Crop Right Margin</span>
                          <span className="text-purple-600 font-bold">{cropRight}%</span>
                        </div>
                        <input 
                          type="range"
                          min={0}
                          max={Math.max(0, 100 - cropLeft - 5)}
                          value={cropRight}
                          onChange={(e) => setCropRight(parseInt(e.target.value))}
                          className="w-full accent-purple-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    onMouseUp={() => saveHistoryState(layers)}
                    onTouchEnd={() => saveHistoryState(layers)}
                  />
                      </div>

                      {/* Top */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Crop Top Margin</span>
                          <span className="text-purple-600 font-bold">{cropTop}%</span>
                        </div>
                        <input 
                          type="range"
                          min={0}
                          max={Math.max(0, 100 - cropBottom - 5)}
                          value={cropTop}
                          onChange={(e) => setCropTop(parseInt(e.target.value))}
                          className="w-full accent-purple-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    onMouseUp={() => saveHistoryState(layers)}
                    onTouchEnd={() => saveHistoryState(layers)}
                  />
                      </div>

                      {/* Bottom */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Crop Bottom Margin</span>
                          <span className="text-purple-600 font-bold">{cropBottom}%</span>
                        </div>
                        <input 
                          type="range"
                          min={0}
                          max={Math.max(0, 100 - cropTop - 5)}
                          value={cropBottom}
                          onChange={(e) => setCropBottom(parseInt(e.target.value))}
                          className="w-full accent-purple-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    onMouseUp={() => saveHistoryState(layers)}
                    onTouchEnd={() => saveHistoryState(layers)}
                  />
                      </div>
                    </div>
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="flex items-center gap-2.5 border-t border-slate-200 pt-4 mt-4">
                    <button
                      type="button"
                      onClick={() => setCroppingLayerId(null)}
                      className="flex-1 py-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 text-[11px] font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyCrop}
                      className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold transition-all shadow-lg shadow-purple-900/10"
                    >
                      Apply Crop Selection
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        );
      })()}

      {/* Starting Canvas Size Selection Modal Wizard */}
      {showSizeSelectorModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 text-center">
              <h3 className="font-extrabold text-lg text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center gap-2">
                <Crop className="h-5 w-5 text-purple-600 animate-pulse" />
                <span>Initialize Your Custom Canvas</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Before starting, choose from our optimized layout sizes or specify a fully custom width and height.
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              
              {/* Direct File Open */}
              <div 
                className="bg-purple-50 p-4 rounded-2xl border border-purple-200 space-y-2 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-100 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <FolderOpen className="h-6 w-6 text-purple-600 mb-1" />
                <span className="text-xs font-bold text-purple-700">Open Existing File (Image/PSD)</span>
                <span className="text-[10px] text-purple-500 text-center">Automatically sets canvas size to match your file and loads it into the editor.</span>
              </div>

              {/* Presets Grid */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Recommended Layout Presets</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "🔳 Square Apparel / Social", desc: "Best for T-Shirts, hoodies, and square badges", w: 800, h: 800 },
                    { label: "💳 Business Card", desc: "Standard 3.5\" x 2\" format for landscape printouts", w: 1050, h: 600 },
                    { label: "📄 Flyer & Poster Sheet", desc: "High-resolution portrait sheet for marketing flyers", w: 700, h: 990 },
                    { label: "🌅 Wide Web Banner", desc: "Horizontal ratio for website headers and displays", w: 1200, h: 500 }
                  ].map((preset, idx) => {
                    const isSelected = initWidth === preset.w && initHeight === preset.h;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setInitWidth(preset.w);
                          setInitHeight(preset.h);
                          setCustomWidthInput(preset.w.toString());
                          setCustomHeightInput(preset.h.toString());
                        }}
                        className={`text-left p-3.5 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 flex flex-col justify-between h-28 ${isSelected ? "bg-purple-50 border-purple-500 shadow-md shadow-purple-100" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 hover:border-slate-300"}`}
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-800">{preset.label}</div>
                          <div className="text-[10px] text-slate-500 mt-1 leading-normal line-clamp-2">{preset.desc}</div>
                        </div>
                        <div className="text-[11px] font-mono font-bold text-purple-600 mt-2">
                          {preset.w} × {preset.h} px
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Size Configuration */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Custom Dimensions</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block">Width (Pixels)</label>
                    <input 
                      type="text"
                      value={customWidthInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setCustomWidthInput(val);
                        const parsed = parseInt(val);
                        if (parsed) {
                          setInitWidth(parsed);
                        }
                      }}
                      onBlur={() => {
                        const parsed = Math.max(100, Math.min(4000, parseInt(customWidthInput) || 800));
                        setInitWidth(parsed);
                        setCustomWidthInput(parsed.toString());
                      }}
                      placeholder="e.g. 1259"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block">Height (Pixels)</label>
                    <input 
                      type="text"
                      value={customHeightInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setCustomHeightInput(val);
                        const parsed = parseInt(val);
                        if (parsed) {
                          setInitHeight(parsed);
                        }
                      }}
                      onBlur={() => {
                        const parsed = Math.max(100, Math.min(4000, parseInt(customHeightInput) || 800));
                        setInitHeight(parsed);
                        setCustomHeightInput(parsed.toString());
                      }}
                      placeholder="e.g. 1234"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>
                
                {/* Visual Aspect Ratio Preview Tag */}
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>Selected Size Aspect Ratio:</span>
                  <span className="bg-white px-2 py-0.5 rounded text-purple-600 border border-slate-200 font-mono font-bold">
                    {initHeight > 0 ? (initWidth / initHeight).toFixed(2) : "1.00"}:1
                  </span>
                </div>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  // Skip wizard and use default product sizes
                  setShowSizeSelectorModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 text-xs font-bold transition-all text-center"
              >
                Use Product Default
              </button>
              <button
                type="button"
                onClick={() => {
                  const w = Math.max(100, Math.min(4000, parseInt(customWidthInput) || 800));
                  const h = Math.max(100, Math.min(4000, parseInt(customHeightInput) || 800));
                  handleApplyStartupSize(w, h);
                }}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all text-center shadow-md shadow-purple-100 hover:scale-[1.01]"
              >
                Confirm & Create Canvas
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showShortcutsHelp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[130] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150 text-left">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-purple-600" />
                <span className="font-bold text-sm tracking-tight text-slate-800">Keyboard Shortcuts Guide</span>
              </div>
              <button 
                onClick={() => setShowShortcutsHelp(false)}
                className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh] text-xs">
              {/* Section 1: History & Edit */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Edit & History</h4>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl">
                    <span className="text-slate-700 font-medium">Undo Action</span>
                    <div className="flex gap-1 items-center">
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700 shadow-sm">Ctrl</kbd>
                      <span className="text-slate-400">/</span>
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700 shadow-sm">⌘</kbd>
                      <span className="text-slate-400">+</span>
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700 shadow-sm">Z</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl">
                    <span className="text-slate-700 font-medium">Redo Action</span>
                    <div className="flex gap-1 items-center">
                      <span className="text-slate-400 text-[10px]">Either</span>
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700 shadow-sm">Ctrl</kbd>
                      <span className="text-slate-400">+</span>
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700 shadow-sm">Y</kbd>
                      <span className="text-slate-400 text-[10px] mx-1">or</span>
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700 shadow-sm">⌘</kbd>
                      <span className="text-slate-400">+</span>
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700 shadow-sm">Shift</kbd>
                      <span className="text-slate-400">+</span>
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700 shadow-sm">Z</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl">
                    <span className="text-slate-700 font-medium">Paste Clipboard Layer</span>
                    <div className="flex gap-1 items-center">
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700 shadow-sm">Ctrl</kbd>
                      <span className="text-slate-400">/</span>
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700 shadow-sm">⌘</kbd>
                      <span className="text-slate-400">+</span>
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700 shadow-sm">V</kbd>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Layer Management */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Selected Layer Operations</h4>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl">
                    <span className="text-slate-700 font-medium">Copy Layer</span>
                    <div className="flex gap-1 items-center">
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700 shadow-sm">Ctrl</kbd>
                      <span className="text-slate-400">/</span>
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700 shadow-sm">⌘</kbd>
                      <span className="text-slate-400">+</span>
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700 shadow-sm">C</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl">
                    <span className="text-slate-700 font-medium">Duplicate Layer</span>
                    <div className="flex gap-1 items-center">
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700 shadow-sm">Ctrl</kbd>
                      <span className="text-slate-400">/</span>
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700 shadow-sm">⌘</kbd>
                      <span className="text-slate-400">+</span>
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700 shadow-sm">D</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl">
                    <span className="text-slate-700 font-medium">Bring Forward (Order Up)</span>
                    <div className="flex gap-1 items-center">
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700 shadow-sm">Ctrl</kbd>
                      <span className="text-slate-400">/</span>
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700 shadow-sm">⌘</kbd>
                      <span className="text-slate-400">+</span>
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700 shadow-sm">↑</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl">
                    <span className="text-slate-700 font-medium">Send Backward (Order Down)</span>
                    <div className="flex gap-1 items-center">
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700 shadow-sm">Ctrl</kbd>
                      <span className="text-slate-400">/</span>
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700 shadow-sm">⌘</kbd>
                      <span className="text-slate-400">+</span>
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700 shadow-sm">↓</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl">
                    <span className="text-slate-700 font-medium">Nudge Position (2px)</span>
                    <div className="flex gap-1 font-mono text-[10px]">
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-slate-700 shadow-sm">←</kbd>
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-slate-700 shadow-sm">↑</kbd>
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-slate-700 shadow-sm">↓</kbd>
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-slate-700 shadow-sm">→</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl">
                    <span className="text-slate-700 font-medium">Delete Layer</span>
                    <div className="flex gap-1 items-center">
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700 shadow-sm">Backspace</kbd>
                      <span className="text-slate-400">/</span>
                      <kbd className="bg-white border border-slate-250 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700 shadow-sm">Delete</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 text-center">
              <button
                onClick={() => setShowShortcutsHelp(false)}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-purple-100"
              >
                Got It, Let's Design!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

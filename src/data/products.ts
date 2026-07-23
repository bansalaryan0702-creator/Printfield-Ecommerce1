export interface ProductColor {
  name: string;
  hex: string;
  image: string;
  mockupImage?: string;
}

export interface ProductVariationOption {
  name: string;
  price: number;
}

export interface ProductVariation {
  id: string; // internal id, e.g. lowercased name
  name: string; // e.g. "Materials"
  options: ProductVariationOption[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  price: number;
  isBestseller?: boolean;
  minQty?: number;
  qtyMultiple?: number;
  image: string;
  images?: string[];
  description: string;
  cardDescription?: string;
  isDisabled?: boolean;
  features: string[];
  colors?: ProductColor[];
  variations?: ProductVariation[];
}

export const Categories = [
  { id: "business-cards", name: "Business Stationery", icon: "contact", image: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=600&auto=format&fit=crop" },
  { id: "apparel", name: "Custom Apparel", icon: "shirt", image: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=600&auto=format&fit=crop" },
  { id: "marketing", name: "Marketing Materials", icon: "megaphone", image: "https://images.unsplash.com/photo-1567359781514-3b964e2b04d6?q=80&w=600&auto=format&fit=crop" },
  { id: "gifts", name: "Corporate Gifts", icon: "gift", image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop" },
  { id: "signage", name: "Signage & Posters", icon: "signpost", image: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=600&auto=format&fit=crop" },
  { id: "packaging", name: "Packaging", icon: "package", image: "https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=600&auto=format&fit=crop" },
];

export const PopularProducts: Product[] = [
  {
    id: "standard-visiting-cards",
    name: "Standard Visiting Cards",
    category: "Business Cards",
    price: 199,
    image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop",
    description: "Make a lasting impression with our premium quality standard visiting cards. Available in matte and glossy finishes.",
    features: ["300 GSM Art Card", "Single or Double sided printing", "Matte or Gloss Lamination"]
  },
  {
    id: "custom-tshirts",
    name: "Custom Round Neck T-Shirts",
    category: "Apparel",
    price: 349,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop",
    description: "High-quality cotton t-shirts with vibrant, long-lasting custom prints for your team or event.",
    features: ["100% bio-washed cotton", "DTF and Screen printing options", "Available in 10+ colors"],
    colors: [
      { name: "White", hex: "#FFFFFF", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop" },
      { name: "Black", hex: "#000000", image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800&auto=format&fit=crop" },
      { name: "Navy Blue", hex: "#1E3A8A", image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800&auto=format&fit=crop" },
      { name: "Red", hex: "#EF4444", image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=800&auto=format&fit=crop" }
    ]
  },
  {
    id: "flyers-a5",
    name: "A5 Marketing Flyers",
    category: "Marketing",
    price: 499,
    image: "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?q=80&w=800&auto=format&fit=crop",
    description: "Spread the word effectively with crisp, colorful flyers. Ideal for handouts and newspaper inserts.",
    features: ["130 GSM to 300 GSM options", "Bulk pricing available", "Express delivery"]
  },
  {
    id: "personalized-mugs",
    name: "Personalized Ceramic Mugs",
    category: "Gifts",
    price: 249,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=800&auto=format&fit=crop",
    description: "Custom printed ceramic mugs. Perfect for corporate gifting or personal souvenirs.",
    features: ["330ml capacity", "Microwave safe", "Wrap-around HD print"]
  },
  {
    id: "letterheads",
    name: "Premium Letterheads",
    category: "Marketing",
    price: 899,
    image: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=800&auto=format&fit=crop",
    description: "Professional letterheads on premium textured paper to make your official communication stand out.",
    features: ["100 GSM Alabaster paper", "Laser printer friendly", "Minimum order 100 qty"]
  },
  {
    id: "roll-up-standees",
    name: "Roll-up Standees (6x3 ft)",
    category: "Signage",
    price: 1299,
    image: "https://images.unsplash.com/photo-1497005367839-6e852de72767?q=80&w=800&auto=format&fit=crop",
    description: "Portable, easy to assemble roll-up standees. Essential for trade shows, events, and in-store promotions.",
    features: ["Aluminum base with carry bag", "Tear-resistant flex or star media", "High-resolution eco-solvent print"]
  }
];

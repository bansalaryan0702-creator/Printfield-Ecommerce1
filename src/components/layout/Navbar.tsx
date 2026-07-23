import { apiFetch } from "../../lib/api";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, ShoppingCart, User, Printer, LogOut, ChevronDown, Phone, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useContext, useState, useEffect } from "react";
import { AppContext } from "../../context/AppContext";
import { CartDrawer } from "../../components/CartDrawer";

// Local high quality products list for category dropdowns if database doesn't have them
const LOCAL_PRODUCTS_BY_CATEGORY: Record<string, any[]> = {
  "apparel": [
    {
      id: "custom-tshirts",
      name: "Custom Round Neck T-Shirts",
      price: 349,
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=300&auto=format&fit=crop",
      description: "Premium bio-washed cotton t-shirts with durable custom prints."
    },
    {
      id: "custom-polos",
      name: "Custom Polo T-Shirts",
      price: 499,
      image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=300&auto=format&fit=crop",
      description: "Professional collared polo shirts, perfect for corporate teams."
    },
    {
      id: "custom-hoodies",
      name: "Custom Hoodies & Sweatshirts",
      price: 899,
      image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=300&auto=format&fit=crop",
      description: "Cozy custom hoodies with premium embroidery or print."
    },
    {
      id: "tote-bags",
      name: "Custom Canvas Tote Bags",
      price: 149,
      image: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300&auto=format&fit=crop",
      description: "Eco-friendly branded canvas bags for events and retail."
    }
  ],
  "gifts": [
    {
      id: "personalized-mugs",
      name: "Personalized Ceramic Mugs",
      price: 249,
      image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=300&auto=format&fit=crop",
      description: "Custom printed ceramic mugs. Perfect for corporate gifting."
    },
    {
      id: "custom-bottles",
      name: "Premium Steel Water Bottles",
      price: 449,
      image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=300&auto=format&fit=crop",
      description: "Insulated stainless steel bottles with laser engraved logo."
    },
    {
      id: "custom-keychains",
      name: "Engraved Metal Keychains",
      price: 99,
      image: "https://images.unsplash.com/photo-1582139329536-e7284fece509?q=80&w=300&auto=format&fit=crop",
      description: "Durable metal or leather keychains with custom branding."
    },
    {
      id: "notebooks",
      name: "Custom Executive Notebooks",
      price: 299,
      image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?q=80&w=300&auto=format&fit=crop",
      description: "Premium leatherette notebooks with hard cover and custom page inserts."
    }
  ],
  "signage": [
    {
      id: "roll-up-standees",
      name: "Roll-up Standees (6x3 ft)",
      price: 1299,
      image: "https://images.unsplash.com/photo-1497005367839-6e852de72767?q=80&w=300&auto=format&fit=crop",
      description: "Portable, easy to assemble roll-up display standees."
    },
    {
      id: "vinyl-banners",
      name: "Outdoor Vinyl Banners",
      price: 349,
      image: "https://images.unsplash.com/photo-1563229649-7eaff6322b7a?q=80&w=300&auto=format&fit=crop",
      description: "Heavy-duty waterproof banners with grommets for display."
    },
    {
      id: "promotional-posters",
      name: "HD Wall Posters",
      price: 149,
      image: "https://images.unsplash.com/photo-1580136579312-94651dfd596d?q=80&w=300&auto=format&fit=crop",
      description: "High-resolution printed glossy or matte posters."
    }
  ],
  "packaging": [
    {
      id: "shipping-boxes",
      name: "Custom Corrugated Boxes",
      price: 49,
      image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=300&auto=format&fit=crop",
      description: "Sturdy branded packaging boxes for safe product transit."
    },
    {
      id: "paper-bags",
      name: "Premium Branded Paper Bags",
      price: 29,
      image: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300&auto=format&fit=crop",
      description: "Elegant paper carrying bags with high quality prints."
    }
  ]
};

export function Navbar() {
  const { cart, setIsCartOpen, user, setToken } = useContext(AppContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [dbProducts, setDbProducts] = useState<any[]>([]);

  const searchParamValue = searchParams.get('search') || '';
  useEffect(() => {
    setSearchQuery(searchParamValue);
  }, [searchParamValue]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setShowMobileSearch(false);
    if (searchQuery.trim()) {
      navigate(`/categories?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/categories');
    }
  };

  useEffect(() => {
    apiFetch('/api/products?limit=150')
      .then(res => res.json())
      .then(resData => {
        if (resData && Array.isArray(resData.data)) {
          setDbProducts(resData.data);
        }
      })
      .catch(err => console.error("Error fetching navbar products:", err));
  }, []);

  const handleLogout = () => {
    setToken('');
    navigate('/');
  };

  const getProductsForCategory = (catId: string) => {
    let filtered: any[] = [];
    if (catId === 'business-cards') {
      filtered = dbProducts.filter((p: any) => {
        const cat = (p.category || '').toLowerCase().trim();
        const name = (p.name || '').toLowerCase().trim();
        return cat === 'business cards' || cat === 'business stationery' || cat === 'stationery' ||
               name.includes('visiting card') || name.includes('business card') ||
               name.includes('id card') || name.includes('lanyard') || name.includes('badge') ||
               name.includes('bill book') || name.includes('envelope') || name.includes('letterhead') ||
               name.includes('stamp') || name.includes('notepad') || name.includes('note pad') ||
               name.includes('notebook') || name.includes('wiro') || name.includes('booklet') ||
               name.includes('certificate') || name.includes('calendar') || name.includes('diary');
      });
      if (filtered.length === 0) {
        filtered = [
          { id: 'jkcr3tpxx', name: 'Standard Visiting Cards', price: 199, image: 'https://images.unsplash.com/photo-1589330694165-27a3c3c764ed?q=80&w=300&auto=format&fit=crop', description: 'Premium quality standard visiting cards.' },
          { id: 'njui14k70', name: 'Rounded Corner Visiting Cards', price: 249, image: 'https://images.unsplash.com/photo-1589330694165-27a3c3c764ed?q=80&w=300&auto=format&fit=crop', description: 'Visiting cards with rounded corners.' },
          { id: 'o2w2btqp1', name: 'Non-Tearable Visiting Cards', price: 299, image: 'https://images.unsplash.com/photo-1589330694165-27a3c3c764ed?q=80&w=300&auto=format&fit=crop', description: 'Visiting cards printed on waterproof non-tearable paper.' }
        ];
      }
    } else if (catId === 'apparel') {
      filtered = dbProducts.filter((p: any) => p.category?.toLowerCase().trim() === 'apparel' || p.category?.toLowerCase().trim() === 'custom apparel');
      if (filtered.length === 0) {
        filtered = LOCAL_PRODUCTS_BY_CATEGORY["apparel"] || [];
      }
    } else if (catId === 'marketing') {
      filtered = dbProducts.filter((p: any) => {
        const cat = p.category?.toLowerCase().trim() || '';
        const name = (p.name || '').toLowerCase();
        const isStationeryItem = name.includes('id card') || name.includes('lanyard') || name.includes('badge') ||
                                 name.includes('bill book') || name.includes('envelope') || name.includes('letterhead') ||
                                 name.includes('stamp') || name.includes('notepad') || name.includes('note pad') ||
                                 name.includes('notebook') || name.includes('wiro') || name.includes('booklet') ||
                                 name.includes('certificate') || name.includes('calendar') || name.includes('visiting card');
        return (cat === 'marketing' || cat === 'marketing materials') && !isStationeryItem;
      });
      if (filtered.length === 0) {
        filtered = [
          { id: 'flyers-a5', name: 'A5 Marketing Flyers', price: 499, image: 'https://images.unsplash.com/photo-1557002666-613dcf589254?q=80&w=300&auto=format&fit=crop', description: 'Vibrant promotional flyers.' },
          { id: 'brochures-trifold', name: 'Tri-Fold Pamphlets & Brochures', price: 699, image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=300&auto=format&fit=crop', description: 'Tri-fold marketing brochures.' }
        ];
      }
    } else if (catId === 'gifts') {
      filtered = dbProducts.filter((p: any) => {
        const cat = p.category?.toLowerCase().trim() || '';
        const name = (p.name || '').toLowerCase();
        const isStationeryItem = name.includes('id card') || name.includes('lanyard') || name.includes('badge') ||
                                 name.includes('certificate') || name.includes('calendar') ||
                                 name.includes('notebook') || name.includes('wiro') || name.includes('booklet') ||
                                 name.includes('notepad') || name.includes('note pad') || name.includes('diary');
        return (cat === 'gifts' || cat === 'corporate gifts') && !isStationeryItem;
      });
      if (filtered.length === 0) {
        filtered = LOCAL_PRODUCTS_BY_CATEGORY["gifts"] || [];
      }
    } else if (catId === 'signage') {
      filtered = dbProducts.filter((p: any) => p.category?.toLowerCase().trim() === 'signage' || p.category?.toLowerCase().trim() === 'signage & posters');
      if (filtered.length === 0) {
        filtered = LOCAL_PRODUCTS_BY_CATEGORY["signage"] || [];
      }
    } else if (catId === 'packaging') {
      filtered = dbProducts.filter((p: any) => p.category?.toLowerCase().trim() === 'packaging' || p.category?.toLowerCase().trim() === 'packaging solutions');
      if (filtered.length === 0) {
        filtered = LOCAL_PRODUCTS_BY_CATEGORY["packaging"] || [];
      }
    }
    return filtered;
  };

  const getMarketingSubgroups = () => {
    const products = getProductsForCategory('marketing');
    
    // Filter out business stationery items (ID cards, bill books, letterheads, envelopes, stamps, notepads, visiting cards, booklets, wiro notebooks, certificates, calendars)
    const marketingOnly = products.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      const sub = (p.subCategory || '').toLowerCase();
      return !name.includes('id card') && 
             !name.includes('lanyard') && 
             !name.includes('badge') && 
             !name.includes('pvc') && 
             !name.includes('bill book') && 
             !name.includes('envelope') &&
             !name.includes('letterhead') &&
             !name.includes('notepad') &&
             !name.includes('note pad') &&
             !name.includes('stamp') &&
             !name.includes('visiting card') &&
             !name.includes('booklet') &&
             !name.includes('wiro') &&
             !name.includes('notebook') &&
             !name.includes('diary') &&
             !name.includes('journal') &&
             !name.includes('certificate') &&
             !name.includes('calendar') &&
             !sub.includes('booklet') &&
             !sub.includes('wiro') &&
             !sub.includes('notebook') &&
             !sub.includes('certificate') &&
             !sub.includes('calendar');
    });

    const flyersAndBrochures = marketingOnly.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('flyer') || name.includes('brochure') || name.includes('pamphlet') || name.includes('catalog');
    });
    const defaultFlyers = flyersAndBrochures.length > 0 ? flyersAndBrochures : [
      { id: 'flyers-a5', name: 'A5 Marketing Flyers' },
      { id: 'brochures-trifold', name: 'Tri-Fold Pamphlets & Brochures' },
      { id: 'catalogs', name: 'Product Catalogs & Brochures' },
      { id: 'pamphlets-a4', name: 'A4 Business Flyers' }
    ];

    const stickersAndLabels = marketingOnly.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('sticker') || name.includes('label') || name.includes('decal') || name.includes('seal');
    });
    const defaultStickers = stickersAndLabels.length > 0 ? stickersAndLabels : [
      { id: 'vinyl-stickers', name: 'Custom Vinyl Stickers' },
      { id: 'product-labels', name: 'Roll Product Labels' },
      { id: 'die-cut-stickers', name: 'Die-Cut Logo Stickers' },
      { id: 'packaging-seals', name: 'Branded Packaging Seals' }
    ];

    const promoMedia = marketingOnly.filter((p: any) => {
      return !flyersAndBrochures.includes(p) && !stickersAndLabels.includes(p);
    });
    const defaultPromoMedia = promoMedia.length > 0 ? promoMedia : [
      { id: 'table-tents', name: 'Acrylic Table Tents' },
      { id: 'promo-cards', name: 'Promotional Postcards' },
      { id: 'standees-promo', name: 'Marketing Banner Stands' },
      { id: 'wobblers', name: 'Shelf Wobblers & Hangtags' }
    ];

    return {
      flyersAndBrochures: defaultFlyers.slice(0, 5),
      stickersAndLabels: defaultStickers.slice(0, 5),
      promotionalMedia: defaultPromoMedia.slice(0, 5)
    };
  };

  const getBusinessStationerySubgroups = () => {
    const cardProducts = getProductsForCategory('business-cards');
    const allPool = [...dbProducts, ...cardProducts];

    const uniqueMap = new Map();
    allPool.forEach(p => { if (p.id) uniqueMap.set(p.id, p); });
    const pool = Array.from(uniqueMap.values());

    // 1. Business Cards (Strictly visiting cards / business cards, excluding certificates, id cards, calendars, etc.)
    const businessCards = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      const isCard = name.includes('visiting card') || name.includes('business card') || cat.includes('business card') || name.includes('visiting');
      const isOtherStationery = name.includes('calendar') || name.includes('certificate') || name.includes('id card') ||
                                name.includes('lanyard') || name.includes('badge') || name.includes('bill book') ||
                                name.includes('envelope') || name.includes('letterhead') || name.includes('stamp') ||
                                name.includes('notepad') || name.includes('notebook') || name.includes('wiro') ||
                                name.includes('booklet') || name.includes('diary');
      return isCard && !isOtherStationery;
    });
    const defaultBusinessCards = businessCards;

    // 2. ID Cards & Certificates
    const idAndLanyards = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('id card') || name.includes('lanyard') || name.includes('badge') || name.includes('pvc') || name.includes('certificate') || name.includes('citation');
    });
    const defaultIdAndLanyards = idAndLanyards;

    // 3. Bill Books & Letterheads
    const billBooksAndEnvelopes = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('bill book') || name.includes('envelope') || name.includes('letterhead') || name.includes('stamp');
    });
    const defaultBillBooks = billBooksAndEnvelopes;

    // 4. Notebooks & Calendars
    const notepadsAndOffice = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('notepad') || name.includes('note pad') || name.includes('diary') || name.includes('notebook') || name.includes('wiro') || name.includes('booklet') || name.includes('calendar') || name.includes('folder');
    });
    const defaultNotepads = notepadsAndOffice;

    return {
      businessCards: defaultBusinessCards.slice(0, 5),
      idAndLanyards: defaultIdAndLanyards.slice(0, 5),
      billBooksAndEnvelopes: defaultBillBooks.slice(0, 5),
      notepadsAndOffice: defaultNotepads.slice(0, 5)
    };
  };

  const renderBadge = (p: any) => {
    if (p.badge === 'Recommended' || p.badgeType === 'recommended') {
      return <span className="ml-1.5 shrink-0 px-1.5 py-0.5 text-[9px] font-bold text-white bg-purple-700 rounded uppercase tracking-wider">Recommended</span>;
    }
    if (p.badge === 'Popular' || p.badgeType === 'popular') {
      return <span className="ml-1.5 shrink-0 px-1.5 py-0.5 text-[9px] font-bold text-white bg-purple-700 rounded uppercase tracking-wider">Popular</span>;
    }
    if (p.badge === 'NEW' || p.badgeType === 'new') {
      return <span className="ml-1.5 shrink-0 px-1.5 py-0.5 text-[9px] font-bold text-white bg-purple-700 rounded uppercase tracking-wider">NEW</span>;
    }
    return null;
  };

  const getApparelSubgroups = () => {
    const products = getProductsForCategory('apparel');
    const allApparel = [...dbProducts, ...products];

    // Deduplicate
    const uniqueMap = new Map();
    allApparel.forEach(p => { if (p.id) uniqueMap.set(p.id, p); });
    const pool = Array.from(uniqueMap.values());

    // 1. T-shirts
    const tshirts = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return (name.includes('round neck') || name.includes('t-shirt') || name.includes('tshirt') || name.includes('polo')) &&
             !name.includes('popcorn') && !name.includes('m and s') && !name.includes('snitch');
    });
    const defaultTshirts = tshirts;

    // 2. Branded T-shirts
    const brandedTshirts = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('popcorn') || name.includes('m and s') || name.includes('snitch') || name.includes('signature') || name.includes('branded');
    });
    const defaultBrandedTshirts = brandedTshirts;

    // 3. Sweatshirts & Hoodies
    const hoodies = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('hoodie') || name.includes('sweatshirt') || name.includes('jacket');
    });
    const defaultHoodies = hoodies;

    // 4. Backpacks
    const backpacks = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('bag') || name.includes('backpack') || name.includes('sleeve') || name.includes('supasac');
    });
    const defaultBackpacks = backpacks;

    // 5. Caps
    const caps = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('cap') || name.includes('hat');
    });
    const defaultCaps = caps;

    // 6. Umbrellas & Raincoats
    const umbrellas = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('umbrella') || name.includes('raincoat') || name.includes('rainsuit');
    });
    const defaultUmbrellas = umbrellas;

    return {
      tshirts: defaultTshirts.slice(0, 5),
      brandedTshirts: defaultBrandedTshirts.slice(0, 5),
      hoodies: defaultHoodies.slice(0, 5),
      backpacks: defaultBackpacks.slice(0, 5),
      caps: defaultCaps.slice(0, 5),
      umbrellas: defaultUmbrellas.slice(0, 5)
    };
  };

  const getGiftsSubgroups = () => {
    const products = getProductsForCategory('gifts');
    const allGifts = [...dbProducts, ...products];

    const uniqueMap = new Map();
    allGifts.forEach(p => { if (p.id) uniqueMap.set(p.id, p); });
    const pool = Array.from(uniqueMap.values());

    // 1. Photo Prints
    const photoPrints = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('photo print') || name.includes('polaroid') || name.includes('passport') || name.includes('bulk printing');
    });
    const defaultPhotoPrints = photoPrints;

    // 2. Photo Mugs
    const photoMugs = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('photo mug') || name.includes('magic mug') || name.includes('beer mug') || name.includes('mini mug');
    });
    const defaultPhotoMugs = photoMugs;

    // 3. Invitation Cards
    const invitations = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('invitation');
    });
    const defaultInvitations = invitations;

    // 4. Personalised Gifts
    const personalisedGifts = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('wooden stand') || name.includes('greeting card') || name.includes('fridge magnet') || name.includes('coasters') || name.includes('plaque');
    });
    const defaultPersonalisedGifts = personalisedGifts;

    // 5. Photo Frames
    const photoFrames = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('photo frame') && !name.includes('acrylic');
    });
    const defaultPhotoFrames = photoFrames;

    // 6. Canvas
    const canvas = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('canvas') && !name.includes('photo frame');
    });
    const defaultCanvas = canvas;

    // 7. Acrylic Photo Frames
    const acrylicFrames = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('acrylic');
    });
    const defaultAcrylicFrames = acrylicFrames;

    // 8. Drinkware
    const drinkware = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('sipper') || name.includes('bottle') || name.includes('flask');
    });
    const defaultDrinkware = drinkware;

    return {
      photoPrints: defaultPhotoPrints.slice(0, 5),
      photoMugs: defaultPhotoMugs.slice(0, 5),
      invitations: defaultInvitations.slice(0, 5),
      personalisedGifts: defaultPersonalisedGifts.slice(0, 5),
      photoFrames: defaultPhotoFrames.slice(0, 5),
      canvas: defaultCanvas.slice(0, 5),
      acrylicFrames: defaultAcrylicFrames.slice(0, 5),
      drinkware: defaultDrinkware.slice(0, 5)
    };
  };

  const getSignageSubgroups = () => {
    const products = getProductsForCategory('signage');
    const allSignage = [...dbProducts, ...products];

    const uniqueMap = new Map();
    allSignage.forEach(p => { if (p.id) uniqueMap.set(p.id, p); });
    const pool = Array.from(uniqueMap.values());

    // 1. Standees
    const standees = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('standee');
    });
    const defaultStandees = standees;

    // 2. Sun Board Signs
    const sunboard = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('sunboard') || name.includes('stick on') || name.includes('wall mount') || name.includes('hanging');
    });
    const defaultSunboard = sunboard;

    // 3. Displays
    const displays = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('decal') || name.includes('dangler') || name.includes('selfie frame') || name.includes('tent card');
    });
    const defaultDisplays = displays;

    // 4. Name Plates
    const namePlates = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('name plate') || name.includes('nameplate');
    });
    const defaultNamePlates = namePlates;

    // 5. Banners
    const banners = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('banner') || name.includes('flex');
    });
    const defaultBanners = banners;

    // 6. Custom Signage & Decor
    const decor = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('canvas') || name.includes('bumper') || name.includes('window') || name.includes('plaque') || name.includes('wall frame');
    });
    const defaultDecor = decor;

    return {
      standees: defaultStandees.slice(0, 5),
      sunboard: defaultSunboard.slice(0, 5),
      displays: defaultDisplays.slice(0, 5),
      namePlates: defaultNamePlates.slice(0, 5),
      banners: defaultBanners.slice(0, 5),
      decor: defaultDecor.slice(0, 5)
    };
  };

  const getPackagingSubgroups = () => {
    const products = getProductsForCategory('packaging');
    const allPackaging = [...dbProducts, ...products];

    const uniqueMap = new Map();
    allPackaging.forEach(p => { if (p.id) uniqueMap.set(p.id, p); });
    const pool = Array.from(uniqueMap.values());

    // 1. Packaging Labels
    const labels = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('label') && !name.includes('box');
    });
    const defaultLabels = labels;

    // 2. Stickers
    const stickers = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('sticker') && !name.includes('label');
    });
    const defaultStickers = stickers;

    // 3. Shipping and Flat Mailer Boxes
    const mailerBoxes = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('mailer box') || name.includes('shipping box') || name.includes('carton') || name.includes('gift packaging box');
    });
    const defaultMailerBoxes = mailerBoxes;

    // 4. Hospitality
    const hospitality = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('menu') || name.includes('placemat') || name.includes('tent card') || name.includes('door hanger') || name.includes('coaster');
    });
    const defaultHospitality = hospitality;

    // 5. Tote Bags
    const toteBags = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('tote') || name.includes('bag') && !name.includes('paper') && !name.includes('poly') && !name.includes('laptop');
    });
    const defaultToteBags = toteBags;

    // 6. Packing Tape
    const tape = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('tape') || name.includes('packing tape');
    });
    const defaultTape = tape;

    // 7. Paper Bags
    const paperBags = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('paper bag') || name.includes('retail paper') || name.includes('takeout paper');
    });
    const defaultPaperBags = paperBags;

    // 8. Packaging Add-ons
    const addons = pool.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return name.includes('tissue') || name.includes('wrapping paper') || name.includes('poly bag') || name.includes('sleeves') || name.includes('jute') || name.includes('sticker');
    });
    const defaultAddons = addons;

    return {
      labels: defaultLabels.slice(0, 5),
      stickers: defaultStickers.slice(0, 5),
      mailerBoxes: defaultMailerBoxes.slice(0, 5),
      hospitality: defaultHospitality.slice(0, 5),
      toteBags: defaultToteBags.slice(0, 5),
      tape: defaultTape.slice(0, 5),
      paperBags: defaultPaperBags.slice(0, 5),
      addons: defaultAddons.slice(0, 6)
    };
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
        {showMobileSearch ? (
          <div className="flex h-16 items-center px-4 max-w-7xl mx-auto gap-3">
            <Button variant="ghost" size="icon" onClick={() => setShowMobileSearch(false)} type="button">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
            <form onSubmit={handleSearchSubmit} className="flex-1">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all"
                />
              </div>
            </form>
            <Button variant="ghost" onClick={handleSearchSubmit} className="text-purple-600 font-semibold text-sm">
              Search
            </Button>
          </div>
        ) : (
          <div className="flex h-16 items-center px-4 md:px-6 max-w-7xl mx-auto gap-4">
            {/* Logo & Trust Badges */}
            <div className="flex items-center gap-6 xl:gap-8 mr-2 lg:mr-4 shrink-0">
              <Link to="/" className="flex items-center">
                <img referrerPolicy="no-referrer" src="/logo.png" alt="Printfield" className="h-10 w-auto object-contain" />
              </Link>
              <div className="hidden lg:flex items-center gap-6 border-l border-gray-200 pl-6 xl:pl-8">
                 <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                   <ShieldCheck className="w-4 h-4 text-green-600" />
                   <span className="hidden xl:inline">Premium Quality</span>
                   <span className="inline xl:hidden">Premium</span>
                 </div>
                 <Link to="/contact" className="flex items-center gap-2 text-sm text-gray-600 font-medium hover:text-purple-600 transition-colors">
                   <Phone className="w-4 h-4 text-purple-600" />
                   <span>Support</span>
                 </Link>
              </div>
            </div>

            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center justify-center mx-auto max-w-2xl">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for Business Cards, T-Shirts, Mugs..."
                  className="hidden md:flex w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all"
                />
              </div>
            </form>

            {/* Icons */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowMobileSearch(true)}>
                <Search className="h-5 w-5 text-gray-600" />
              </Button>
              
              {user ? (
                <div className="hidden sm:flex items-center gap-2">
                  <Button variant="ghost" className="text-sm font-medium text-gray-700 capitalize px-2 hover:text-purple-600" onClick={() => navigate('/profile')}>
                     <User className="h-4 w-4 mr-2" />
                     {user.name || user.email.split('@')[0]}
                  </Button>
                  <Button variant="ghost" className="text-sm font-medium text-gray-700 px-2 hover:text-purple-600" onClick={() => navigate('/orders')}>Orders</Button>
                  <Button variant="ghost" size="icon" onClick={handleLogout} title="Sign Out">
                    <LogOut className="h-4 w-4 text-gray-500" />
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" className="hidden sm:flex gap-2" onClick={() => navigate('/login')}>
                  <User className="h-5 w-5 text-gray-600" />
                  <span className="hidden lg:inline text-sm font-medium">Sign In</span>
                </Button>
              )}

              <Button variant="default" className="flex gap-2 bg-purple-600 hover:bg-purple-700 rounded-full px-4" onClick={() => setIsCartOpen(true)}>
                <ShoppingCart className="h-5 w-5" />
                <span className="font-semibold">Cart {cart.length > 0 && `(${cart.length})`}</span>
              </Button>
            </div>
          </div>
        )}

        {/* Categories Nav (Desktop) */}
        <div className="hidden md:flex items-center px-4 md:px-6 max-w-7xl mx-auto bg-white border-t border-gray-100 relative">
          <nav className="flex items-center justify-center gap-8 text-sm font-medium text-gray-600 w-full">
            <div className="group relative">
              <button className="flex items-center gap-1 hover:text-purple-600 py-3 whitespace-nowrap font-semibold text-gray-900 border-b-2 border-transparent hover:border-purple-600 transition-colors">
                All Products <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
              </button>
              
              {/* Mega Menu Dropdown */}
              <div className="absolute top-full left-0 w-[980px] bg-white border border-gray-100 shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-5 mt-1 flex flex-col gap-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-purple-600">Explore All Products & Categories</h4>
                  <Link to="/" className="text-xs font-semibold text-purple-600 hover:underline">View All Catalog &rarr;</Link>
                </div>
                <div className="grid grid-cols-4 gap-x-6 gap-y-5">
                  
                  {/* Column 1: Business Stationery */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Business Stationery</h5>
                    <ul className="space-y-1">
                      <li>
                        <Link to="/category/business-cards" className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                          <span className="truncate">Business Cards</span>
                          <span className="ml-1.5 shrink-0 px-1.5 py-0.5 text-[9px] font-bold text-white bg-purple-700 rounded uppercase tracking-wider">Popular</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/category/business-cards" className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                          <span className="truncate">ID Cards & Lanyards</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/category/business-cards" className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                          <span className="truncate">Letterheads & Envelopes</span>
                          <span className="ml-1.5 shrink-0 px-1.5 py-0.5 text-[9px] font-bold text-white bg-purple-700 rounded uppercase tracking-wider">Recommended</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/category/business-cards" className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                          <span className="truncate">Notebooks & Calendars</span>
                          <span className="ml-1.5 shrink-0 px-1.5 py-0.5 text-[9px] font-bold text-white bg-purple-700 rounded uppercase tracking-wider">NEW</span>
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* Column 2: Corporate Apparel */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Corporate Apparel</h5>
                    <ul className="space-y-1">
                      <li>
                        <Link to="/category/apparel" className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                          <span className="truncate">Round Neck T-Shirts</span>
                          <span className="ml-1.5 shrink-0 px-1.5 py-0.5 text-[9px] font-bold text-white bg-purple-700 rounded uppercase tracking-wider">Popular</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/category/apparel" className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                          <span className="truncate">Polo T-Shirts</span>
                          <span className="ml-1.5 shrink-0 px-1.5 py-0.5 text-[9px] font-bold text-white bg-purple-700 rounded uppercase tracking-wider">Recommended</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/category/apparel" className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                          <span className="truncate">Hoodies & Jackets</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/category/apparel" className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                          <span className="truncate">Caps & Backpacks</span>
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* Column 3: Marketing & Signage */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Marketing & Signage</h5>
                    <ul className="space-y-1">
                      <li>
                        <Link to="/category/marketing" className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                          <span className="truncate">Flyers & Brochures</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/category/marketing" className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                          <span className="truncate">Stickers & Labels</span>
                          <span className="ml-1.5 shrink-0 px-1.5 py-0.5 text-[9px] font-bold text-white bg-purple-700 rounded uppercase tracking-wider">Popular</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/category/signage" className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                          <span className="truncate">Roll-up Standees</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/category/signage" className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                          <span className="truncate">Sun Board & Banners</span>
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* Column 4: Gifts & Packaging */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Gifts & Packaging</h5>
                    <ul className="space-y-1">
                      <li>
                        <Link to="/category/gifts" className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                          <span className="truncate">Photo Mugs & Bottles</span>
                          <span className="ml-1.5 shrink-0 px-1.5 py-0.5 text-[9px] font-bold text-white bg-purple-700 rounded uppercase tracking-wider">Popular</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/category/packaging" className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                          <span className="truncate">Flat Mailer Boxes</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/category/packaging" className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                          <span className="truncate">Paper Bags & Tote Bags</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/category/gifts" className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                          <span className="truncate">Corporate Gift Sets</span>
                          <span className="ml-1.5 shrink-0 px-1.5 py-0.5 text-[9px] font-bold text-white bg-purple-700 rounded uppercase tracking-wider">NEW</span>
                        </Link>
                      </li>
                    </ul>
                  </div>

                </div>
              </div>
            </div>

            {/* Business Stationery Category with 4-Column Sub-Categories Dropdown */}
            <div className="group relative">
              <Link to="/category/business-cards" className="flex items-center gap-1 hover:text-purple-600 py-3 whitespace-nowrap font-medium transition-colors border-b-2 border-transparent hover:border-purple-600">
                Business Stationery <ChevronDown className="h-3.5 w-3.5 text-gray-400 transition-transform group-hover:rotate-180" />
              </Link>
              
              <div className="absolute top-full left-0 w-[740px] bg-white border border-gray-100 shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-5 mt-1 flex flex-col gap-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-purple-600">Business Stationery</h4>
                  <Link to="/category/business-cards" className="text-xs font-semibold text-purple-600 hover:underline">View All Business Stationery &rarr;</Link>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {/* Sub-category 1: Business Cards */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Business Cards</h5>
                    <ul className="space-y-1">
                      {getBusinessStationerySubgroups().businessCards.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Sub-category 2: ID Cards & Certificates */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">ID Cards & Certificates</h5>
                    <ul className="space-y-1">
                      {getBusinessStationerySubgroups().idAndLanyards.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Sub-category 3: Bill Books & Letterheads */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Bill Books & Letterheads</h5>
                    <ul className="space-y-1">
                      {getBusinessStationerySubgroups().billBooksAndEnvelopes.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Sub-category 4: Notebooks & Calendars */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Notebooks & Calendars</h5>
                    <ul className="space-y-1">
                      {getBusinessStationerySubgroups().notepadsAndOffice.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Apparel Category with 6 Sub-Categories Mega Dropdown */}
            <div className="group relative">
              <Link to="/category/apparel" className="flex items-center gap-1 hover:text-purple-600 py-3 whitespace-nowrap font-medium transition-colors border-b-2 border-transparent hover:border-purple-600">
                Corporate Apparel <ChevronDown className="h-3.5 w-3.5 text-gray-400 transition-transform group-hover:rotate-180" />
              </Link>
              
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-[820px] bg-white border border-gray-100 shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-5 mt-1 flex flex-col gap-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-purple-600">Corporate Apparel & Merchandise</h4>
                  <Link to="/category/apparel" className="text-xs font-semibold text-purple-600 hover:underline">View All Apparel &rarr;</Link>
                </div>
                <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                  {/* Sub-category 1: T-shirts */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">T-shirts</h5>
                    <ul className="space-y-1">
                      {getApparelSubgroups().tshirts.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Sub-category 2: Branded T-shirts */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Branded T-shirts</h5>
                    <ul className="space-y-1">
                      {getApparelSubgroups().brandedTshirts.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Sub-category 3: Caps */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Caps</h5>
                    <ul className="space-y-1">
                      {getApparelSubgroups().caps.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Sub-category 4: Sweatshirts & Hoodies */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Sweatshirts & Hoodies</h5>
                    <ul className="space-y-1">
                      {getApparelSubgroups().hoodies.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Sub-category 5: Backpacks */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Backpacks</h5>
                    <ul className="space-y-1">
                      {getApparelSubgroups().backpacks.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Sub-category 6: Umbrellas & Raincoats */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Umbrellas & Raincoats</h5>
                    <ul className="space-y-1">
                      {getApparelSubgroups().umbrellas.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Marketing Materials Mega Dropdown */}
            <div className="group relative">
              <Link to="/category/marketing" className="flex items-center gap-1 hover:text-purple-600 py-3 whitespace-nowrap font-medium transition-colors border-b-2 border-transparent hover:border-purple-600">
                Marketing Materials <ChevronDown className="h-3.5 w-3.5 text-gray-400 transition-transform group-hover:rotate-180" />
              </Link>
              
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-[620px] bg-white border border-gray-100 shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-5 mt-1 flex flex-col gap-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-purple-600">Marketing Materials</h4>
                  <Link to="/category/marketing" className="text-xs font-semibold text-purple-600 hover:underline">View All Marketing Materials &rarr;</Link>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {/* Column 1: Flyers & Brochures */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Flyers & Brochures</h5>
                    <ul className="space-y-1">
                      {getMarketingSubgroups().flyersAndBrochures.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors block font-medium truncate">
                            {p.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 2: Stickers & Custom Labels */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Stickers & Labels</h5>
                    <ul className="space-y-1">
                      {getMarketingSubgroups().stickersAndLabels.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors block font-medium truncate">
                            {p.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 3: Promotional Displays */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Promotional Displays</h5>
                    <ul className="space-y-1">
                      {getMarketingSubgroups().promotionalMedia.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors block font-medium truncate">
                            {p.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Personalised Gifts Category with 8 Sub-Categories Mega Dropdown */}
            <div className="group relative">
              <Link to="/category/gifts" className="flex items-center gap-1 hover:text-purple-600 py-3 whitespace-nowrap font-medium transition-colors border-b-2 border-transparent hover:border-purple-600">
                Personalised Gifts <ChevronDown className="h-3.5 w-3.5 text-gray-400 transition-transform group-hover:rotate-180" />
              </Link>
              
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-[980px] bg-white border border-gray-100 shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-5 mt-1 flex flex-col gap-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-purple-600">Personalised Gifts</h4>
                  <Link to="/category/gifts" className="text-xs font-semibold text-purple-600 hover:underline">View All Gifts &rarr;</Link>
                </div>
                <div className="grid grid-cols-4 gap-x-6 gap-y-5">
                  {/* Column 1: Photo Prints */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Photo Prints</h5>
                    <ul className="space-y-1">
                      {getGiftsSubgroups().photoPrints.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 2: Photo Mugs */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Photo Mugs</h5>
                    <ul className="space-y-1">
                      {getGiftsSubgroups().photoMugs.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 3: Invitation Cards */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Invitation Cards</h5>
                    <ul className="space-y-1">
                      {getGiftsSubgroups().invitations.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 4: Personalised Gifts */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Personalised Gifts</h5>
                    <ul className="space-y-1">
                      {getGiftsSubgroups().personalisedGifts.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Row 2, Column 1: Photo Frames */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Photo Frames</h5>
                    <ul className="space-y-1">
                      {getGiftsSubgroups().photoFrames.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Row 2, Column 2: Canvas */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Canvas</h5>
                    <ul className="space-y-1">
                      {getGiftsSubgroups().canvas.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Row 2, Column 3: Acrylic Photo Frames */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Acrylic Photo Frames</h5>
                    <ul className="space-y-1">
                      {getGiftsSubgroups().acrylicFrames.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Row 2, Column 4: Drinkware */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Drinkware</h5>
                    <ul className="space-y-1">
                      {getGiftsSubgroups().drinkware.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Signage & Posters Category with 6 Sub-Categories Mega Dropdown */}
            <div className="group relative">
              <Link to="/category/signage" className="flex items-center gap-1 hover:text-purple-600 py-3 whitespace-nowrap font-medium transition-colors border-b-2 border-transparent hover:border-purple-600">
                Signage & Posters <ChevronDown className="h-3.5 w-3.5 text-gray-400 transition-transform group-hover:rotate-180" />
              </Link>
              
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-[820px] bg-white border border-gray-100 shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-5 mt-1 flex flex-col gap-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-purple-600">Signage & Displays</h4>
                  <Link to="/category/signage" className="text-xs font-semibold text-purple-600 hover:underline">View All Signage &rarr;</Link>
                </div>
                <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                  {/* Sub-category 1: Standees */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Standees</h5>
                    <ul className="space-y-1">
                      {getSignageSubgroups().standees.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Sub-category 2: Sun Board Signs */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Sun Board Signs</h5>
                    <ul className="space-y-1">
                      {getSignageSubgroups().sunboard.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Sub-category 3: Displays */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Displays</h5>
                    <ul className="space-y-1">
                      {getSignageSubgroups().displays.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Sub-category 4: Name Plates */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Name Plates</h5>
                    <ul className="space-y-1">
                      {getSignageSubgroups().namePlates.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Sub-category 5: Banners */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Banners</h5>
                    <ul className="space-y-1">
                      {getSignageSubgroups().banners.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Sub-category 6: Custom Signage & Decor */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Custom Signage & Decor</h5>
                    <ul className="space-y-1">
                      {getSignageSubgroups().decor.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Packaging Solutions Category with 8 Sub-Categories Mega Dropdown */}
            <div className="group relative">
              <Link to="/category/packaging" className="flex items-center gap-1 hover:text-purple-600 py-3 whitespace-nowrap font-medium transition-colors border-b-2 border-transparent hover:border-purple-600">
                Packaging <ChevronDown className="h-3.5 w-3.5 text-gray-400 transition-transform group-hover:rotate-180" />
              </Link>
              
              <div className="absolute top-full right-0 w-[980px] bg-white border border-gray-100 shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-5 mt-1 flex flex-col gap-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-purple-600">Packaging Solutions</h4>
                  <Link to="/category/packaging" className="text-xs font-semibold text-purple-600 hover:underline">View All Packaging &rarr;</Link>
                </div>
                <div className="grid grid-cols-4 gap-x-6 gap-y-5">
                  {/* Column 1: Packaging Labels */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Packaging Labels</h5>
                    <ul className="space-y-1">
                      {getPackagingSubgroups().labels.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 2: Stickers */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Stickers</h5>
                    <ul className="space-y-1">
                      {getPackagingSubgroups().stickers.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 3: Shipping and Flat Mailer Boxes */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Shipping and Flat Mailer Boxes</h5>
                    <ul className="space-y-1">
                      {getPackagingSubgroups().mailerBoxes.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 4: Hospitality */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Hospitality</h5>
                    <ul className="space-y-1">
                      {getPackagingSubgroups().hospitality.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Row 2, Column 1: Tote Bags */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Tote Bags</h5>
                    <ul className="space-y-1">
                      {getPackagingSubgroups().toteBags.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Row 2, Column 2: Packing Tape */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Packing Tape</h5>
                    <ul className="space-y-1">
                      {getPackagingSubgroups().tape.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Row 2, Column 3: Paper Bags */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Paper Bags</h5>
                    <ul className="space-y-1">
                      {getPackagingSubgroups().paperBags.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Row 2, Column 4: Packaging Add-ons */}
                  <div>
                    <h5 className="font-bold text-gray-900 text-[11px] tracking-wide uppercase border-l-2 border-purple-500 pl-2 mb-2">Packaging Add-ons</h5>
                    <ul className="space-y-1">
                      {getPackagingSubgroups().addons.map((p: any) => (
                        <li key={p.id}>
                          <Link to={`/product/${p.id}`} className="text-xs text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium truncate">
                            <span className="truncate">{p.name}</span>
                            {renderBadge(p)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1"></div>
            
            <Link to="/about" className="hover:text-purple-600 whitespace-nowrap py-3">About Us</Link>
            <Link to="/faq" className="hover:text-purple-600 whitespace-nowrap py-3">FAQ</Link>
            <Link to="/contact" className="hover:text-purple-600 whitespace-nowrap py-3">Contact</Link>
          </nav>
        </div>
      </header>
      <CartDrawer />
    </>
  );
}

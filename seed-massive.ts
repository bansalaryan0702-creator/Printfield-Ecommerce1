import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DB_FILE = path.join(process.cwd(), 'app.db');

const categories = [
  'Business Cards', 'Marketing Materials', 'Signage & Banners', 
  'Stationery', 'Clothing & Bags', 'Promotional Products',
  'Photo Gifts', 'Labels & Stickers'
];

const mockProducts = [
  {
    name: 'Standard Business Cards',
    category: 'Business Cards',
    price: 350,
    image: 'https://images.unsplash.com/photo-1589041127168-9b1915731def?q=80&w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1589041127168-9b1915731def?q=80&w=800&auto=format&fit=crop'],
    description: 'High-quality standard business cards. Perfect for everyday professional networking. Choose from matte or glossy finish.',
    features: ['300 GSM Paper', 'Matte or Glossy Finish', 'Standard 3.5" x 2" size', 'Full color printing']
  },
  {
    name: 'Premium Business Cards',
    category: 'Business Cards',
    price: 750,
    image: 'https://images.unsplash.com/photo-1629851419736-2415da07c4bc?q=80&w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1629851419736-2415da07c4bc?q=80&w=800&auto=format&fit=crop'],
    description: 'Thick, luxurious premium business cards that make a lasting impression. Available in variety of premium textured papers.',
    features: ['350+ GSM Premium Paper', 'Textured finish options', 'Standard 3.5" x 2" size', 'Edge painting available']
  },
  {
    name: 'Custom Printed T-Shirts',
    category: 'Clothing & Bags',
    price: 499,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop'],
    description: 'Comfortable, 100% cotton t-shirts with vibrant, long-lasting print. Ideal for team events, promotions, or casual wear.',
    features: ['100% Cotton', 'Seamless double-needle collar', 'Taped neck and shoulders', 'Vibrant DTG Printing']
  },
  {
    name: 'Corporate Hoodies',
    category: 'Clothing & Bags',
    price: 1299,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop'],
    description: 'Warm and cozy custom hoodies for your corporate team or event. High quality fabric with embroidered or printed logo.',
    features: ['Fleece lined', 'Adjustable hood', 'Kangaroo pocket', 'Embroidery or Print']
  },
  {
    name: 'Printed Ceramic Mugs',
    category: 'Promotional Products',
    price: 299,
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=800&auto=format&fit=crop'],
    description: 'Classic 11oz ceramic mugs with full color wrap-around print. The perfect practical gift for employees and clients.',
    features: ['11oz or 15oz capacity', 'Microwave safe', 'Dishwasher safe', 'Vibrant wrap print']
  },
  {
    name: 'A4 Professional Flyers',
    category: 'Marketing Materials',
    price: 850,
    image: 'https://images.unsplash.com/photo-1621535783307-8e6f1ebd4371?q=80&w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1621535783307-8e6f1ebd4371?q=80&w=800&auto=format&fit=crop'],
    description: 'Spread the word with striking custom flyers. Available in various paper sizes and premium finishes.',
    features: ['Multiple sizes (A4, A5, DL)', '130 GSM to 300 GSM options', 'Single or double sided', 'Gloss or Matte']
  },
  {
    name: 'Tri-Fold Brochures',
    category: 'Marketing Materials',
    price: 1200,
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800&auto=format&fit=crop'],
    description: 'Professional tri-fold brochures to showcase your products and services with maximum impact and readability.',
    features: ['Standard A4 Tri-fold', 'Premium 170 GSM paper', 'Pre-folded delivery', 'Vibrant color reproduction']
  },
  {
    name: 'Custom Vinyl Banners',
    category: 'Signage & Banners',
    price: 899,
    image: 'https://images.unsplash.com/photo-1552318413-5b8a07c3c54d?q=80&w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1552318413-5b8a07c3c54d?q=80&w=800&auto=format&fit=crop'],
    description: 'Durable, weather-resistant vinyl banners. Excellent for both indoor and outdoor events, sales, and promotions.',
    features: ['Weather resistant vinyl', 'Reinforced metal grommets', 'Custom sizing', 'Fade resistant ink']
  },
  {
    name: 'Roll-Up Standees',
    category: 'Signage & Banners',
    price: 2499,
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=800&auto=format&fit=crop'],
    description: 'Portable, professional roll-up standees. Quick to set up, making them perfect for tradeshows and conferences.',
    features: ['Lightweight aluminum base', 'Durable flex material', 'Includes carry bag', 'High resolution print']
  },
  {
    name: 'Executive Letterheads',
    category: 'Stationery',
    price: 650,
    image: 'https://images.unsplash.com/photo-1616628188506-4a18ceb85fb0?q=80&w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1616628188506-4a18ceb85fb0?q=80&w=800&auto=format&fit=crop'],
    description: 'Premium A4 letterheads to ensure your official correspondence always looks sharp and highly professional.',
    features: ['Alabaster or Executive Bond paper', 'Laser printer compatible', 'Standard A4 size', '100 GSM thickness']
  },
  {
    name: 'Branded Notebooks',
    category: 'Stationery',
    price: 350,
    image: 'https://images.unsplash.com/photo-1531346878377-a541e4a0ecce?q=80&w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1531346878377-a541e4a0ecce?q=80&w=800&auto=format&fit=crop'],
    description: 'Customized spiral or hardbound notebooks featuring your company logo and design on the cover.',
    features: ['100 pages', 'Ruled or unruled', 'Softcover or Hardcover options', 'Premium paper quality']
  },
  {
    name: 'Custom Labels on a Roll',
    category: 'Labels & Stickers',
    price: 950,
    image: 'https://images.unsplash.com/photo-1634458851508-3e4b9fb30ca7?q=80&w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1634458851508-3e4b9fb30ca7?q=80&w=800&auto=format&fit=crop'],
    description: 'Durable custom labels and stickers on a roll for easy product packaging, mailing, and general branding needs.',
    features: ['Waterproof options', 'Easy peel and stick', 'Custom shapes and sizes', 'Glossy or Matte finish']
  },
  {
    name: 'Die-Cut Individual Stickers',
    category: 'Labels & Stickers',
    price: 450,
    image: 'https://images.unsplash.com/photo-1550130635-c3fcc401eb12?q=80&w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1550130635-c3fcc401eb12?q=80&w=800&auto=format&fit=crop'],
    description: 'High-quality die-cut stickers precisely cut to the shape of your artwork. Great for promotional giveaways.',
    features: ['Thick, durable vinyl', 'Scratch resistant', 'Weatherproof', 'Custom exact contour cutting']
  },
  {
    name: 'Personalized Photo Calendars',
    category: 'Photo Gifts',
    price: 799,
    image: 'https://images.unsplash.com/photo-1506784926709-22f1ec395907?q=80&w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1506784926709-22f1ec395907?q=80&w=800&auto=format&fit=crop'],
    description: '12-month custom photo desk calendars. Ideal for gifting clients or creating personal keepsakes.',
    features: ['Premium heavy cardstock', 'Wire-O binding', 'Custom dates and photos', 'Compact desk size']
  },
  {
    name: 'Engraved Metal Pens',
    category: 'Promotional Products',
    price: 150,
    image: 'https://images.unsplash.com/photo-1585336261022-680e295cb2e1?q=80&w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1585336261022-680e295cb2e1?q=80&w=800&auto=format&fit=crop'],
    description: 'Sleek, professional metal pens featuring precision laser engraving of your name or company logo.',
    features: ['Premium ink', 'Laser engraved permanent logo', 'Comfortable grip', 'Various colors available']
  }
];

async function seedPrintVista() {
  const db = new Database(DB_FILE);

  console.log('Cleaning existing products for a fresh PrintVista catalog...');
  db.prepare('PRAGMA foreign_keys = OFF').run();
  db.prepare('DELETE FROM products').run();
  db.prepare('PRAGMA foreign_keys = ON').run();

  const stmt = db.prepare('INSERT INTO products (id, name, category, price, image, images, description, features, colors, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  
  console.log(`Inserting ${mockProducts.length} high-quality products...`);
  
  const insertMany = db.transaction(() => {
    for (const p of mockProducts) {
      const id = uuidv4();
      stmt.run(
        id,
        p.name,
        p.category,
        p.price,
        p.image,
        JSON.stringify(p.images || []),
        p.description,
        JSON.stringify(p.features || []),
        JSON.stringify([]), // colors
        Date.now(),
        Date.now()
      );
    }
  });
  
  insertMany();
  
  console.log('✅ PrintVista catalog successfully imported!');
}

seedPrintVista().catch(console.error);

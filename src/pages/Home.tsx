import { Link } from "react-router-dom";
import { Layout } from "@/src/components/layout/Layout";
import { Categories } from "@/src/data/products";
import { ProductCard } from "@/src/components/ui/ProductCard";
import { ArrowRight, Contact, Shirt, Megaphone, Gift, Signpost, Package, Star } from "lucide-react";
import { useProducts } from "../hooks/useProducts";
import { BulkQuotationPopup } from "@/src/components/BulkQuotationPopup";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

const getCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case "contact": return <Contact className="h-8 w-8" />;
    case "shirt": return <Shirt className="h-8 w-8" />;
    case "megaphone": return <Megaphone className="h-8 w-8" />;
    case "gift": return <Gift className="h-8 w-8" />;
    case "signpost": return <Signpost className="h-8 w-8" />;
    case "package": return <Package className="h-8 w-8" />;
    default: return <Package className="h-8 w-8" />;
  }
};

export function Home() {
  const { products, loading } = useProducts(1, 6);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const heroY = useTransform(scrollYProgress, [0, 0.2], ["0%", "50%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <Layout>
      <BulkQuotationPopup />
      <div ref={containerRef} className="bg-[#0a0a0a] text-white min-h-screen selection:bg-purple-500 selection:text-white font-sans overflow-hidden">
        
        {/* HERO SECTION */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          {/* Abstract Background */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] bg-purple-600/15 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] bg-fuchsia-600/10 rounded-full mix-blend-screen filter blur-[80px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          </div>

          <motion.div 
            style={{ y: heroY, opacity: heroOpacity }}
            className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col items-center text-center pt-20"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping absolute"></span>
              <span className="w-2 h-2 rounded-full bg-purple-500 relative"></span>
              <span className="text-sm font-medium tracking-wide uppercase text-gray-300">Premium Print & Packaging</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-[10vw] md:text-[8vw] lg:text-[7rem] font-black tracking-tighter leading-[0.85] uppercase"
            >
              You think it. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-500 to-pink-500 italic pr-4">
                We ink it.
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 text-lg md:text-2xl text-gray-400 max-w-2xl font-light"
            >
              Turn your imagination into tactile reality. Premium printing and custom packaging that commands attention.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mt-12 flex gap-6"
            >
              <Link to="/categories" className="group relative px-8 py-4 bg-white text-black font-bold uppercase tracking-wider rounded-full overflow-hidden">
                <span className="relative z-10 flex items-center gap-2">
                  Explore Catalog <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-purple-400 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out"></div>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* MARQUEE SECTION */}
        <section className="py-10 border-y border-white/10 bg-white/5 overflow-hidden flex whitespace-nowrap">
          <motion.div
            animate={{ x: [0, -1035] }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            className="flex gap-16 items-center text-4xl font-black uppercase tracking-widest text-white/20"
          >
            <span>Bespoke Customization</span>
            <Star className="w-8 h-8 text-purple-500/50" />
            <span>Priority Fulfillment</span>
            <Star className="w-8 h-8 text-fuchsia-500/50" />
            <span>Volume Pricing</span>
            <Star className="w-8 h-8 text-pink-500/50" />
            <span>Premium Finishes</span>
            <Star className="w-8 h-8 text-purple-500/50" />
            <span>Brand Consistency</span>
            <Star className="w-8 h-8 text-fuchsia-500/50" />
            <span>Eco-Friendly</span>
            <Star className="w-8 h-8 text-pink-500/50" />
            <span>Bespoke Customization</span>
          </motion.div>
        </section>

        {/* BENTO GRID CATEGORIES */}
        <section className="py-32 px-6 max-w-7xl mx-auto">
          <div className="mb-20">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-6">Core <br/><span className="text-gray-500">Solutions</span></h2>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-fuchsia-500"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[300px]">
            {Categories.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className={`relative group rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm hover:border-purple-500/50 transition-colors duration-500 ${i === 0 || i === 3 ? 'md:col-span-2' : ''}`}
              >
                <div className="absolute inset-0 z-0">
                  <img referrerPolicy="no-referrer" src={cat.image || undefined} alt={cat.name} className="w-full h-full object-cover opacity-30 group-hover:opacity-40 group-hover:scale-105 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/90"></div>
                </div>
                <Link to={`/category/${cat.id}`} className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-white backdrop-blur-md border border-white/20 group-hover:bg-purple-500 group-hover:border-transparent group-hover:scale-110 transition-all duration-500 shadow-lg">
                    {getCategoryIcon(cat.icon)}
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold tracking-tight mb-2 group-hover:translate-x-2 transition-transform duration-500 drop-shadow-md text-white">{cat.name}</h3>
                    <p className="text-gray-300 group-hover:text-white transition-colors drop-shadow-md">Explore collection &rarr;</p>
                  </div>
                </Link>
                {/* Abstract hover background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-fuchsia-600/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700 mix-blend-overlay"></div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* IMMERSIVE SHOWCASE */}
        <section className="py-32 relative">
          <div className="absolute inset-0 bg-white text-black -skew-y-3 origin-top-left z-0 shadow-[0_0_100px_rgba(255,255,255,0.1)]"></div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
              >
                <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-black leading-none mb-8">
                  Precision for one. <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500">Power for all.</span>
                </h2>
                <p className="text-xl text-gray-700 font-medium leading-relaxed mb-10 max-w-md">
                  We merge artisanal craftsmanship for individual creators with robust infrastructure for growing enterprise teams.
                </p>
                
                <div className="space-y-6">
                  {[
                    { title: "Bespoke Customization", desc: "Premium finishes like foil and spot UV to make your personal projects stand out." },
                    { title: "Enterprise Control", desc: "Brand portals, locked templates, and budget approvals for corporate teams." },
                    { title: "Elastic Volume", desc: "Order 10 or 10,000. Enjoy automated tier discounts as you scale up." }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-start">
                      <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center shrink-0 font-bold">
                        0{idx + 1}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold uppercase tracking-tight text-black">{item.title}</h4>
                        <p className="text-gray-600 mt-1">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="relative h-[600px] rounded-[3rem] overflow-hidden shadow-2xl"
              >
                <img referrerPolicy="no-referrer" 
                  src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1200&auto=format&fit=crop" 
                  alt="Team Collaboration"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent"></div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* BESTSELLERS GALLERY */}
        <section className="py-32 px-6 max-w-7xl mx-auto mt-20">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-6">Trending <br/> <span className="text-gray-500">Now</span></h2>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-fuchsia-500"></div>
            </div>
            <Link to="/categories" className="text-lg font-bold uppercase tracking-widest border-b-2 border-white pb-1 hover:text-purple-400 hover:border-purple-400 transition-colors">
              View All Products &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white/5 animate-pulse rounded-[2rem] h-[500px]"></div>
              ))
            ) : (
              products.slice(0, 3).map((product, i) => (
                <motion.div 
                  key={product.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.7, delay: i * 0.2 }}
                  className="group"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* MASSIVE CTA */}
        <section className="py-40 px-6 relative overflow-hidden border-t border-white/10">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-purple-900/20"></div>
          <div className="max-w-7xl mx-auto text-center relative z-10">
            <motion.h2 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="text-[10vw] md:text-[8rem] font-black uppercase tracking-tighter leading-none mb-10"
            >
              Let's <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500 italic pr-4">Create.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-2xl text-gray-400 max-w-2xl mx-auto mb-16"
            >
              Whether you need a dozen custom gifts or a thousand branded corporate kits, our team is ready to bring your vision to life.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <Link to="/categories" className="inline-flex items-center justify-center gap-4 px-12 py-6 bg-white text-black rounded-full text-xl font-black uppercase tracking-widest hover:scale-105 hover:shadow-[0_0_50px_rgba(255,255,255,0.3)] transition-all duration-300 w-full sm:w-auto">
                Start Browsing
              </Link>
              <Link to="/contact" className="inline-flex items-center justify-center gap-4 px-12 py-6 bg-transparent border-2 border-white/20 text-white rounded-full text-xl font-black uppercase tracking-widest hover:bg-white/10 transition-all duration-300 w-full sm:w-auto">
                Bulk Orders <ArrowRight className="w-6 h-6" />
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

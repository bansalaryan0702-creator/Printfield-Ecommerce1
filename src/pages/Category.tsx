import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Layout } from "@/src/components/layout/Layout";
import { Categories } from "@/src/data/products";
import { ProductCard } from "@/src/components/ui/ProductCard";
import { ArrowLeft } from "lucide-react";
import { useProducts } from "../hooks/useProducts";
import { Button } from '@/src/components/ui/button';

export function CategoryPage() {
  const { categoryId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('newest'); // 'newest', 'price_asc', 'price_desc'
  const [search, setSearch] = useState(urlSearch);
  const [subCategory, setSubCategory] = useState('all');

  // Synchronize URL search parameter with local state
  useEffect(() => {
    setSearch(urlSearch);
    setPage(1);
  }, [urlSearch]);
  
  // Notice we pass subCategory to useProducts
  const { products: displayProducts, loading, pagination, availableSubCategories } = useProducts(page, 20, categoryId, sort, search, subCategory);

  useEffect(() => {
     setSubCategory('all');
     setPage(1);
  }, [categoryId]);
  
  const category = categoryId === "all" || !categoryId 
       ? { name: "All Products", id: "all", image: "https://images.unsplash.com/photo-1563229649-7eaff6322b7a?q=80&w=1600&auto=format&fit=crop" }
       : Categories.find(c => c.id === categoryId) || { name: "Category not found", id: categoryId, image: "" };

  return (
    <Layout>
      {/* Category Header */}
      <div className="relative h-[250px] md:h-[300px] w-full overflow-hidden bg-gray-900 border-b border-gray-200">
        <img referrerPolicy="no-referrer" 
          src={category.image || undefined}
          alt={category.name}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end max-w-7xl mx-auto px-4 md:px-6 pb-10">
          <Link to="/" className="inline-flex items-center text-gray-300 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-2">
            {category.name}
          </h1>
          <p className="text-gray-300 max-w-2xl text-lg">
            High-quality custom {category.name.toLowerCase()} tailored to your specifications.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 flex flex-col md:flex-row gap-8">
        
        {/* Filters Sidebar (Mock) */}
        <div className="w-full md:w-64 shrink-0 space-y-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 tracking-wider text-sm uppercase">Category</h3>
            <ul className="space-y-3">
              <li key="all">
                 <Link onClick={() => setPage(1)} to="/categories" className={`text-sm ${!categoryId || categoryId === 'all' ? 'text-purple-600 font-semibold' : 'text-gray-500 hover:text-gray-900'}`}>All Products</Link>
              </li>
              {Categories.map(cat => (
                <li key={cat.id}>
                  <Link onClick={() => setPage(1)} to={`/category/${cat.id}`} className={`text-sm ${categoryId === cat.id ? 'text-purple-600 font-semibold' : 'text-gray-500 hover:text-gray-900'}`}>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {availableSubCategories && availableSubCategories.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 tracking-wider text-sm uppercase">Sub Category</h3>
              <ul className="space-y-3">
                <li key="all-subs">
                   <button onClick={() => { setSubCategory('all'); setPage(1); }} className={`text-sm ${subCategory === 'all' ? 'text-purple-600 font-semibold' : 'text-gray-500 hover:text-gray-900'} text-left w-full`}>All {category.name}</button>
                </li>
                {availableSubCategories.map(sub => (
                  <li key={sub}>
                    <button onClick={() => { setSubCategory(sub); setPage(1); }} className={`text-sm ${subCategory === sub ? 'text-purple-600 font-semibold' : 'text-gray-500 hover:text-gray-900'} text-left w-full`}>
                      {sub}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-gray-500 bg-white p-4 rounded-xl border border-gray-200 gap-4">
            <span>Showing {pagination.total > 0 ? `${(pagination.page - 1) * pagination.limit + 1} - ${Math.min(pagination.page * pagination.limit, pagination.total)} of ` : ''}{pagination.total || displayProducts.length} products</span>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearch(val);
                  setPage(1);
                  setSearchParams((prev) => {
                    if (val) {
                      prev.set('search', val);
                    } else {
                      prev.delete('search');
                    }
                    return prev;
                  }, { replace: true });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none min-w-[200px]"
              />
              <select 
                className="px-2 py-2 border bg-transparent font-medium border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none w-full sm:w-auto"
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
              >
                <option value="newest">Sort by Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
          
          {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-gray-200 animate-pulse rounded-2xl h-[400px]"></div>
                ))}
            </div>
          ) : (
            <>
              {displayProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayProducts.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-gray-400">
                  <p>No products found in this category.</p>
                </div>
              )}
            </>
          )}
          
          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-12">
              <Button 
                variant="outline" 
                onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 300); }}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {pagination.totalPages}
              </span>
              <Button 
                variant="outline" 
                onClick={() => { setPage(p => Math.min(pagination.totalPages, p + 1)); window.scrollTo(0, 300); }}
                disabled={page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}

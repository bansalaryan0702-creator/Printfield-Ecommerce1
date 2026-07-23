import { apiFetch } from '../lib/api';
import { useState, useEffect } from 'react';
import { Product, PopularProducts, Categories } from '../data/products';
import { getFeaturedImage } from '../lib/imageUtils';

export function useProducts(page = 1, limit = 20, category?: string, sort?: string, search?: string, subCategory?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 20 });
  const [availableSubCategories, setAvailableSubCategories] = useState<string[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        let url = `/api/products?page=${page}&limit=${limit}`;
        if (category && category !== 'all') {
          // Find matching category name from Categories, then PopularProducts if possible, otherwise use as is
          const catObj = Categories.find(c => c.id === category);
          const catName = catObj ? catObj.name : (PopularProducts.find(p => p.category.toLowerCase().replace(/\s+/g, '-') === category)?.category || category);
          url += `&category=${encodeURIComponent(catName)}`;
        }
        if (subCategory && subCategory !== 'all') {
          url += `&subCategory=${encodeURIComponent(subCategory)}`;
        }
        if (sort) {
          url += `&sort=${encodeURIComponent(sort)}`;
        }
        if (search) {
          url += `&search=${encodeURIComponent(search)}`;
        }

        const response = await apiFetch(url);
        if (response.ok) {
          const resData = await response.json();
          const dynamicProducts = (resData.data || []).filter((p: any) => {
            if (p.isDisabled) return false;
            const featImg = getFeaturedImage(p);
            return !!featImg;
          });
          setPagination({
            total: resData.total,
            totalPages: resData.totalPages,
            page: resData.page,
            limit: resData.limit
          });
          
          if (resData.availableSubCategories) setAvailableSubCategories(resData.availableSubCategories);
          
          setProducts(dynamicProducts);
        }
      } catch (error: any) {
        if (error.message !== 'Service temporarily unavailable. Please try again later.') {
          console.error("Error fetching products from API:", error);
        }
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    }

    fetchProducts();
  }, [page, limit, category, sort, search, subCategory]);

  return { products, loading, initialLoading, pagination, availableSubCategories, refetch: () => setLoading(true) };
}

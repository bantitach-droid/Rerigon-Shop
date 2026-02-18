import { useEffect, useState, useCallback } from 'react'
import Navbar from '../components/Navbar'
import CategorySidebar from '../components/CategorySidebar'
import ProductCard from '../components/ProductCard'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../api/axios'
import { FiSearch } from 'react-icons/fi'

export default function Products() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/categories').then((res) => {
      const d = res.data
      setCategories(Array.isArray(d) ? d : (d?.data || []))
    }).catch(() => {})
  }, [])

  const fetchProducts = useCallback(() => {
    setLoading(true)
    const params = { page, limit: 12 }
    if (selectedCategory) params.category_id = selectedCategory
    if (search) params.search = search
    api.get('/products', { params }).then((res) => {
      const d = res.data
      if (Array.isArray(d)) {
        setProducts(d)
        setTotalPages(1)
      } else {
        setProducts(d?.data || d?.items || d?.products || [])
        setTotalPages(d?.total_pages || d?.pages || 1)
      }
    }).catch(() => setProducts([])).finally(() => setLoading(false))
  }, [page, selectedCategory, search])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const handleCategorySelect = (id) => {
    setSelectedCategory(id)
    setPage(1)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', display: 'flex', gap: 24 }}>
        <div style={{ width: 240, flexShrink: 0 }}>
          <CategorySidebar categories={categories} selectedCategory={selectedCategory} onSelect={handleCategorySelect} />
        </div>

        <div style={{ flex: 1 }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <FiSearch size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="ค้นหาสินค้า..."
                style={{
                  width: '100%', padding: '10px 14px 10px 38px', border: '1px solid #e5e7eb',
                  borderRadius: 8, fontSize: 14, outline: 'none',
                }}
              />
            </div>
            <button type="submit" style={{
              background: '#dc2626', color: '#fff', border: 'none',
              borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer',
            }}>ค้นหา</button>
          </form>

          {loading ? (
            <LoadingSpinner />
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>ไม่พบสินค้า</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 32 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '8px 18px', borderRadius: 8, border: '1px solid #e5e7eb',
                  background: page === 1 ? '#f9fafb' : '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer',
                  color: page === 1 ? '#9ca3af' : '#374151', fontWeight: 500,
                }}
              >← ก่อนหน้า</button>
              <span style={{ padding: '8px 16px', fontSize: 14, color: '#6b7280' }}>
                หน้า {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '8px 18px', borderRadius: 8, border: '1px solid #e5e7eb',
                  background: page === totalPages ? '#f9fafb' : '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  color: page === totalPages ? '#9ca3af' : '#374151', fontWeight: 500,
                }}
              >ถัดไป →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

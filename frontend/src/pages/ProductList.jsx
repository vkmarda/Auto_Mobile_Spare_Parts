import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bike, Wrench } from 'lucide-react'
import { getProducts } from '../api/products.api'
import { useCart } from '../context/CartContext'
import { useOrderFlow } from '../context/OrderFlowContext'
import ProductCard from '../components/ProductCard'

function Skeleton() {
  return <div className="rounded-xl h-72 animate-pulse bg-gray-100" />
}

export default function ProductList() {
  const navigate  = useNavigate()
  const { cart }  = useCart()
  const { vehicleType, brand, model, resetFlow } = useOrderFlow()

  const [allProducts, setAllProducts]       = useState([])
  const [categories, setCategories]         = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [searchTerm, setSearchTerm]         = useState('')
  const [loading, setLoading]               = useState(true)

  // Fetch ALL products for the selected brand+model on mount
  useEffect(() => {
    setLoading(true)
    const filters = {}
    if (brand?.name) filters.vehicle_brand = brand.name
    if (model?.name) filters.vehicle_model = model.name
    getProducts({ ...filters, limit: 48 })
      .then(data => {
        const prods = data.products || []
        setAllProducts(prods)
        // Extract unique categories from fetched products
        const seen = new Map()
        prods.forEach(p => {
          if (p.category_id && p.category_name && !seen.has(p.category_id)) {
            seen.set(p.category_id, { id: p.category_id, name: p.category_name })
          }
        })
        setCategories([...seen.values()])
      })
      .catch(err => console.error('fetchProducts error:', err))
      .finally(() => setLoading(false))
  }, [brand?.name, model?.name])

  // Client-side filtering
  const displayedProducts = useMemo(() => {
    let list = allProducts
    if (selectedCategory) {
      list = list.filter(p => p.category_id === selectedCategory)
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      list = list.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.part_name || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [allProducts, selectedCategory, searchTerm])

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  const categoryCount = (catId) =>
    allProducts.filter(p => p.category_id === catId).length

  const selectedCategoryName = categories.find(c => c.id === selectedCategory)?.name

  return (
    <div className="bg-gray-50 min-h-screen pb-24">

      {/* Top bar: back + breadcrumb + change vehicle */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">

          {/* Back button */}
          <button
            onClick={() => navigate('/order/model')}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium flex-shrink-0">
            ← Back
          </button>

          {/* Routable breadcrumb */}
          <div className="flex items-center gap-1 text-sm flex-wrap flex-1 justify-center">
            <Bike size={16} className="text-indigo-500 flex-shrink-0" />
            {vehicleType && (
              <>
                <span
                  onClick={() => { resetFlow(); navigate('/order/vehicle-type') }}
                  className="text-indigo-500 cursor-pointer hover:underline">
                  {vehicleType.name}
                </span>
                <span className="text-gray-300">›</span>
              </>
            )}
            {brand && (
              <>
                <span
                  onClick={() => navigate('/order/brand')}
                  className="text-indigo-500 cursor-pointer hover:underline">
                  {brand.name}
                </span>
                <span className="text-gray-300">›</span>
              </>
            )}
            {model && (
              <>
                <span
                  onClick={() => navigate('/order/model')}
                  className="text-indigo-500 cursor-pointer hover:underline">
                  {model.name}
                </span>
              </>
            )}
            {selectedCategoryName && (
              <>
                <span className="text-gray-300">›</span>
                <span className="text-gray-700 font-medium">{selectedCategoryName}</span>
              </>
            )}
          </div>

          {/* Change vehicle */}
          <button
            onClick={() => { resetFlow(); navigate('/order/vehicle-type') }}
            className="text-xs text-indigo-600 hover:underline font-medium flex-shrink-0">
            Change Vehicle
          </button>
        </div>
      </div>

      {/* Sticky category pill bar */}
      {!loading && categories.length > 0 && (
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm py-3 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  !selectedCategory
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                All Parts ({allProducts.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {cat.name} ({categoryCount(cat.id)})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Search bar */}
        <div className="mb-5">
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search parts by name or SKU…"
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {selectedCategoryName ?? 'All Parts'}
            </h1>
            {!loading && (
              <p className="text-xs text-gray-400 mt-0.5">
                {displayedProducts.length} part{displayedProducts.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="text-center py-20">
            <Wrench size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-500 mb-1">No parts found</p>
            <p className="text-sm text-gray-400 mb-6">
              {searchTerm ? 'Try a different search term' : 'Try a different category'}
            </p>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                Show All Parts
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/order/model')}
            className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
            ← Back
          </button>
          <button
            onClick={() => navigate('/cart')}
            disabled={cartCount === 0}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
            {cartCount > 0 ? (
              <>
                <span className="bg-white text-indigo-600 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center">
                  {cartCount}
                </span>
                View Cart · {cartCount} item{cartCount !== 1 ? 's' : ''}
              </>
            ) : 'View Cart'}
          </button>
        </div>
      </div>
    </div>
  )
}

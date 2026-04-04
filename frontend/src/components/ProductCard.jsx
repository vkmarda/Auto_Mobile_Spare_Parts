import { useState } from 'react'
import { useCart } from '../context/CartContext'

export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const [added, setAdded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [qty, setQty] = useState(1)

  const primaryImage = product.images?.[0]?.image_url ||
                       product.image_url

  const handleQtyChange = (e) => {
    const val = parseInt(e.target.value)
    if (!isNaN(val) && val >= 1) setQty(val)
    else if (e.target.value === '') setQty('')
  }

  const handleQtyBlur = () => {
    if (!qty || qty < 1) setQty(1)
  }

  const handleAddToCart = () => {
    if (!product.id) {
      console.error('Product has no id:', product)
      return
    }
    addToCart({
      product_id: product.id,
      name: product.part_name || product.name,
      sku: product.sku,
      image_url: product.images?.[0]?.image_url || product.image_url,
      quantity: qty || 1,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all overflow-hidden flex flex-col">

      {/* Image */}
      <div className="h-44 bg-gray-50 flex items-center justify-center overflow-hidden">
        {primaryImage && !imgError ? (
          <img
            src={primaryImage}
            alt={product.part_name || product.name}
            className="w-full h-full object-contain p-2"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <span className="text-5xl">🔧</span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">

        {/* Brand badge */}
        {product.brand && (
          <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2 py-0.5 w-fit mb-2">
            {product.brand}
          </span>
        )}

        {/* Product name */}
        <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-1 line-clamp-2 flex-1">
          {product.part_name || product.name}
        </h3>

        {/* Vehicle compatibility */}
        {product.vehicle_brand && (
          <p className="text-xs text-gray-400 mb-1">
            {product.vehicle_brand}
            {product.vehicle_model ? ` · ${product.vehicle_model}` : ''}
          </p>
        )}

        {/* Emission standard */}
        {product.emission_standard && (
          <span className="text-xs bg-green-50 text-green-600 border border-green-100 rounded-full px-2 py-0.5 w-fit mb-3">
            {product.emission_standard}
          </span>
        )}

        {/* Qty + Add to cart */}
        <div className="flex items-center gap-2 mt-auto">
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
            <button
              onClick={() => setQty(q => Math.max(1, (q || 1) - 1))}
              className="w-8 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-lg font-medium">
              −
            </button>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={handleQtyChange}
              onBlur={handleQtyBlur}
              className="w-10 h-9 text-center text-sm font-semibold text-gray-900 border-x border-gray-200 focus:outline-none focus:bg-blue-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={() => setQty(q => (q || 1) + 1)}
              className="w-8 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-lg font-medium">
              +
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              added
                ? 'bg-green-500 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}>
            {added ? '✓ Added' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  )
}

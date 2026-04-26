import { useState } from 'react'
import { Check, Wrench } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { getVendorsByProduct } from '../api/products.api'

function VendorSelectModal({ product, qty, vendors, loading, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Select Vendor</h2>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{product.part_name || product.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-lg leading-none ml-3">✕</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : vendors.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No vendors available</p>
        ) : (
          <div className="space-y-2">
            {vendors.map((v) => (
              <button key={v.vendor_id} onClick={() => onSelect(v)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-left">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-indigo-600">{v.vendor_name.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-sm font-medium text-gray-800">{v.vendor_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const { showToast } = useToast()
  const [added, setAdded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [qty, setQty] = useState(1)
  const [showVendorModal, setShowVendorModal] = useState(false)
  const [vendors, setVendors] = useState([])
  const [vendorsLoading, setVendorsLoading] = useState(false)

  const primaryImage = product.images?.[0]?.image_url || product.image_url

  const handleQtyChange = (e) => {
    const val = parseInt(e.target.value)
    if (!isNaN(val) && val >= 1) setQty(val)
    else if (e.target.value === '') setQty('')
  }

  const handleQtyBlur = () => {
    if (!qty || qty < 1) setQty(1)
  }

  const handleAddToCart = async () => {
    if (!product.id) return
    setVendorsLoading(true)
    setShowVendorModal(true)
    try {
      const data = await getVendorsByProduct(product.id)
      setVendors(data)
    } finally {
      setVendorsLoading(false)
    }
  }

  const handleVendorSelect = (vendor) => {
    addToCart({
      product_id: vendor.product_id,
      name: product.part_name || product.name,
      sku: product.sku,
      image_url: primaryImage,
      quantity: qty || 1,
      vendor_id: vendor.vendor_id,
      vendor_name: vendor.vendor_name,
      brand: product.brand || null,
      vehicle_brand: product.vehicle_brand || null,
      vehicle_model: product.vehicle_model || null,
    })
    setShowVendorModal(false)
    setVendors([])
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
    showToast(`Added to cart — ${vendor.vendor_name}`, 'success', null, 2500)
  }

  return (
    <>
    {showVendorModal && (
      <VendorSelectModal
        product={product}
        qty={qty}
        vendors={vendors}
        loading={vendorsLoading}
        onSelect={handleVendorSelect}
        onClose={() => { setShowVendorModal(false); setVendors([]) }}
      />
    )}
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
          <Wrench size={40} className="text-gray-300" />
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
            {added ? <><Check size={14} strokeWidth={3} className="inline mr-1" />Added</> : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
    </>
  )
}

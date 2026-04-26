import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Search } from 'lucide-react'
import { useOrderFlow } from '../../context/OrderFlowContext'
import { getModels } from '../../api/vehicles.api'
import OrderBreadcrumb from '../../components/OrderBreadcrumb'
import Skeleton from '../../components/Skeleton'

const STEPS = ['Vehicle', 'Brand', 'Model'];

function ProgressBar({ current }) {
  return (
    <div className="flex items-center mb-10">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2
                ${done ? 'bg-blue-600 border-blue-600 text-white' : active ? 'border-blue-600 bg-white text-blue-600' : 'border-gray-200 bg-white text-gray-400'}`}>
                {done ? <Check size={14} strokeWidth={3} /> : step}
              </div>
              <span className={`text-xs mt-1 font-medium whitespace-nowrap ${active ? 'text-blue-600' : done ? 'text-blue-400' : 'text-gray-400'}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 ${done ? 'bg-blue-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ModelStep() {
  const navigate = useNavigate()
  const { brand, vehicleType, setModel } = useOrderFlow()
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!brand) { navigate('/order/brand'); return }
    getModels(brand.name, vehicleType?.name)
      .then(setModels)
      .catch(() => setModels([]))
      .finally(() => setLoading(false))
  }, [brand])

  const handleSelect = (item) => {
    const modelObj = { id: item.model_name, name: item.model_name, slug: item.model_name.toLowerCase().replace(/\s+/g, '-') };
    setModel(modelObj);
    try {
      const saved = JSON.parse(localStorage.getItem('purzaa_saved_vehicles') || '[]');
      const entry = { vehicleType: vehicleType?.name, brandName: brand?.name, modelName: item.model_name };
      const deduped = [entry, ...saved.filter((v) => !(v.brandName === entry.brandName && v.modelName === entry.modelName))].slice(0, 3);
      localStorage.setItem('purzaa_saved_vehicles', JSON.stringify(deduped));
    } catch (_) {}
    navigate('/products');
  }

  const filtered = models.filter(m =>
    m.model_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <ProgressBar current={3} />

        <button onClick={() => navigate('/order/brand')}
          className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm mb-4 transition-colors">
          ← Back
        </button>

        <OrderBreadcrumb currentStep="model" />

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Select your model</h1>
        <p className="text-sm text-gray-400 mb-6">Pick the exact model to find compatible parts</p>

        <input
          type="text"
          placeholder="Search models..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 shadow-sm mb-6"
        />

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3,4,5].map(i => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Search size={36} className="mx-auto mb-3 text-gray-300" />
            <p>{search ? `No models found for "${search}"` : 'No models available'}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
            {filtered.map(m => (
              <button key={m.model_name}
                onClick={() => handleSelect(m)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors">
                <span className="text-sm font-semibold text-gray-900">{m.model_name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{m.product_count} parts available</span>
                  <span className="text-gray-300">›</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

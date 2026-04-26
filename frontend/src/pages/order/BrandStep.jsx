import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { getBrands } from '../../api/vehicles.api';
import { useOrderFlow } from '../../context/OrderFlowContext';
import OrderBreadcrumb from '../../components/OrderBreadcrumb';

const BRAND_COLORS = {
  'honda':         'bg-red-50 border-red-300 text-red-700',
  'yamaha':        'bg-blue-50 border-blue-300 text-blue-700',
  'bajaj':         'bg-indigo-50 border-indigo-300 text-indigo-700',
  'hero':          'bg-green-50 border-green-300 text-green-700',
  'tvs':           'bg-orange-50 border-orange-300 text-orange-700',
  'royal enfield': 'bg-emerald-50 border-emerald-400 text-emerald-800',
  'ktm':           'bg-orange-50 border-orange-400 text-orange-600',
  'suzuki':        'bg-sky-50 border-sky-300 text-sky-700',
};

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

export default function BrandStep() {
  const navigate = useNavigate();
  const { vehicleType, setBrand } = useOrderFlow();
  const [brands, setBrands] = useState([]);
  const [sel, setSel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!vehicleType) { navigate('/order/vehicle-type'); return; }
    getBrands(vehicleType.name).then(setBrands).finally(() => setLoading(false));
  }, [vehicleType]);

  function select(brand) {
    setSel(brand.name);
    setBrand({
      id: brand.name,
      name: brand.name,
      slug: brand.name.toLowerCase().replace(/\s+/g, '-')
    });
    setTimeout(() => navigate('/order/model'), 150);
  }

  const filtered = brands.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <ProgressBar current={2} />

        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate('/order/vehicle-type')}
            className="text-gray-400 hover:text-gray-600 text-sm font-medium flex-shrink-0">← Back</button>
        </div>
        <OrderBreadcrumb currentStep="brand" />

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Select your brand</h1>
        <p className="text-gray-500 text-sm mb-4">Choose the manufacturer of your vehicle</p>

        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search brands…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500" />

        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-xl h-24 animate-pulse border border-gray-200" />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No brands found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map((b) => {
              const colorKey = b.name.toLowerCase();
              const colors = sel === b.name
                ? 'bg-blue-600 border-blue-600 text-white'
                : (BRAND_COLORS[colorKey] || 'bg-gray-50 border-gray-200 text-gray-700');
              return (
                <button key={b.name} onClick={() => select(b)}
                  className={`rounded-xl px-4 py-5 border-2 text-center transition-all hover:scale-105 shadow-sm hover:shadow-md ${colors}`}>
                  <p className="text-lg font-extrabold leading-tight">{b.name}</p>
                  {b.product_count && (
                    <p className="text-xs mt-1 opacity-70">{b.product_count} parts</p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

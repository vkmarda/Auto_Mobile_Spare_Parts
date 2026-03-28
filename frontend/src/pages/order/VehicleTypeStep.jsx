import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVehicleTypes } from '../../api/vehicles.api';
import { useOrderFlow } from '../../context/OrderFlowContext';

const ICONS = { bike: '🏍️', scooter: '🛵' };
const SUBTITLES = { bike: 'Motorcycles & dirt bikes', scooter: 'City & geared scooters' };
const STEPS = ['Vehicle', 'Brand', 'Model', 'Category'];

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
                {done ? '✓' : step}
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

export default function VehicleTypeStep() {
  const navigate = useNavigate();
  const { setVehicleType } = useOrderFlow();
  const [types, setTypes] = useState([]);
  const [sel, setSel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVehicleTypes().then(setTypes).finally(() => setLoading(false));
  }, []);

  function select(type) {
    setSel(type.id);
    setVehicleType(type);
    setTimeout(() => navigate('/order/brand'), 150);
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <ProgressBar current={1} />
        <h1 className="text-2xl font-bold text-gray-900 mb-1">What type of vehicle?</h1>
        <p className="text-gray-500 text-sm mb-8">Select the vehicle category to find the right parts</p>

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-44 animate-pulse border border-gray-200" />)}
          </div>
        ) : types.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No vehicle types found.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {types.map((t) => (
              <button key={t.id} onClick={() => select(t)}
                className={`rounded-2xl p-8 border-2 text-center transition-all hover:scale-105 shadow-sm
                  ${sel === t.id ? 'border-blue-500 bg-blue-50' : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-md'}`}>
                <span className="text-5xl block mb-3">{ICONS[t.slug] || '🏍️'}</span>
                <p className="text-base font-bold text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-400 mt-1">{SUBTITLES[t.slug] || ''}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

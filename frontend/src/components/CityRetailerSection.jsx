import { useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

function RetailerRow({ retailerId, name, orders }) {
  const [open, setOpen] = useState(false);
  const pending    = orders.filter((o) => o.status === 'pending').length;
  const dispatched = orders.filter((o) => o.status === 'dispatched').length;

  return (
    <div className="border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50">
        <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 flex-1 text-left min-w-0">
          <span className={`text-gray-400 text-xs transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}>▾</span>
          <span className="text-sm font-medium text-gray-800 truncate">{name}</span>
          {pending    > 0 && <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full shrink-0">{pending} pending</span>}
          {dispatched > 0 && <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full shrink-0">{dispatched} dispatched</span>}
        </button>
        <Link
          to={`/vendor/retailers/${retailerId}`}
          className="text-xs text-blue-600 hover:underline font-medium shrink-0">
          View in Detail →
        </Link>
      </div>

      {open && (
        <div className="px-4 pb-3 pl-9 space-y-1.5">
          {orders.length === 0 ? (
            <p className="text-xs text-gray-400">No orders.</p>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <span className="font-mono text-xs font-bold text-gray-700 bg-white border border-gray-200 px-2 py-0.5 rounded">{o.order_number}</span>
                <StatusBadge status={o.status} />
                <span className="text-xs text-gray-400">{fmtDate(o.created_at)}</span>
                {parseInt(o.item_count) > 0 && (
                  <span className="text-xs text-gray-500">{o.item_count} item{o.item_count != 1 ? 's' : ''}</span>
                )}
                {o.product_names?.length > 0 && (
                  <span className="text-xs text-gray-400 truncate max-w-[180px]">
                    {o.product_names.slice(0, 2).join(', ')}{o.product_names.length > 2 ? '…' : ''}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function CityRetailerSection({ orders }) {
  const [openCities, setOpenCities] = useState({});

  const byCity = {};
  for (const o of orders) {
    const city = o.retailer_city || 'Unknown City';
    if (!byCity[city]) byCity[city] = { city, state: o.retailer_state, retailers: {} };
    const rid = o.retailer_id;
    if (!rid) continue;
    if (!byCity[city].retailers[rid]) byCity[city].retailers[rid] = { id: rid, name: o.retailer_name, orders: [] };
    byCity[city].retailers[rid].orders.push(o);
  }

  const cityList = Object.values(byCity).sort((a, b) => a.city.localeCompare(b.city));
  if (cityList.length === 0) return null;

  const toggleCity = (city) => setOpenCities((v) => ({ ...v, [city]: !v[city] }));

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Retailers by City</h2>
        <Link to="/vendor/retailers" className="text-xs text-blue-600 hover:underline font-medium">All Retailers →</Link>
      </div>
      <div className="space-y-3">
        {cityList.map(({ city, state, retailers }) => {
          const retailerList = Object.values(retailers).sort((a, b) => a.name.localeCompare(b.name));
          const isOpen = openCities[city];
          return (
            <div key={city} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                onClick={() => toggleCity(city)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{city}</span>
                  {state && <span className="text-xs text-gray-400">{state}</span>}
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                    {retailerList.length} retailer{retailerList.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <span className={`text-gray-400 text-sm transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {isOpen && (
                <div className="border-t border-gray-100">
                  {retailerList.map((r) => (
                    <RetailerRow
                      key={r.id}
                      retailerId={r.id}
                      name={r.name}
                      orders={[...r.orders].sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

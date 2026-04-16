import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VendorOrderCard, { COLS } from './VendorOrderCard';

function Meta({ items }) {
  const visible = items.filter(Boolean);
  return (
    <span className="flex items-center gap-1 flex-wrap">
      {visible.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-300 select-none text-xs">·</span>}
          <span className={`text-xs font-medium ${item.color}`}>{item.label}</span>
        </span>
      ))}
    </span>
  );
}

const daysSince = (ts) => ts ? Math.floor((Date.now() - new Date(ts)) / 86400000) : null;
const fmtDate   = (ts) => new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function PendingActionsByCity({ orders, lastDispatchByCity, onAccept, onReject }) {
  const navigate = useNavigate();
  const [openCities, setOpenCities]       = useState({});
  const [openRetailers, setOpenRetailers] = useState({});

  const relevant = orders.filter((o) => {
    const city = o.retailer_city || 'Unknown City';
    const last = lastDispatchByCity[city];
    return !last || new Date(o.created_at) > new Date(last);
  });

  const byCity = {};
  for (const o of relevant) {
    const city = o.retailer_city || 'Unknown City';
    if (!byCity[city]) byCity[city] = { city, state: o.retailer_state, retailers: {} };
    const rid = o.retailer_id;
    if (!rid) continue;
    if (!byCity[city].retailers[rid]) byCity[city].retailers[rid] = { id: rid, name: o.retailer_name, orders: [] };
    byCity[city].retailers[rid].orders.push(o);
  }

  // Sort by urgency: city with the oldest pending order floats first
  const oldestPendingMs = (retailers) => retailers.reduce((max, r) =>
    r.orders.reduce((m, o) => o.status === 'pending' ? Math.max(m, Date.now() - new Date(o.created_at)) : m, max), -1);

  const cityList = Object.values(byCity).sort((a, b) => {
    const aAge = oldestPendingMs(Object.values(a.retailers));
    const bAge = oldestPendingMs(Object.values(b.retailers));
    if (aAge === -1 && bAge === -1) return a.city.localeCompare(b.city);
    if (aAge === -1) return 1;
    if (bAge === -1) return -1;
    return bAge - aAge;
  });

  if (cityList.length === 0) return (
    <div className="py-8 text-center bg-white rounded-xl border border-gray-200 shadow-sm">
      <p className="text-green-600 font-medium text-sm">No pending actions since last dispatch</p>
    </div>
  );

  const toggleCity     = (city) => setOpenCities(v => ({ ...v, [city]: !v[city] }));
  const toggleRetailer = (key)  => setOpenRetailers(v => ({ ...v, [key]: !v[key] }));

  return (
    <div className="space-y-3">
      {cityList.map(({ city, state, retailers }) => {
        const retailerList  = Object.values(retailers).sort((a, b) => a.name.localeCompare(b.name));
        const orderCount    = retailerList.reduce((s, r) => s + r.orders.length, 0);
        const pendingCount  = retailerList.reduce((s, r) => s + r.orders.filter(o => o.status === 'pending').length, 0);
        const acceptedCount = retailerList.reduce((s, r) => s + r.orders.filter(o => o.status === 'accepted').length, 0);
        const isCityOpen    = !!openCities[city];

        return (
          <div key={city} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <button onClick={() => toggleCity(city)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{city}</span>
                  {/* {state && <span className="text-xs text-gray-400">{state}</span>} */}
                  <div className="mt-0.5">
                  <Meta items={[
                    pendingCount  > 0 && { label: `${pendingCount} pending`,                          color: 'text-amber-600' },
                    acceptedCount > 0 && { label: `${acceptedCount} accepted`,                        color: 'text-sky-600'  },
                    { label: `${orderCount} order${orderCount !== 1 ? 's' : ''}`,                     color: 'text-gray-400'  },
                    { label: `${retailerList.length} retailer${retailerList.length !== 1 ? 's' : ''}`, color: 'text-gray-400' },
                  ]} />
                </div>
                </div>
                
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {lastDispatchByCity[city] ? (() => {
                  const d = daysSince(lastDispatchByCity[city]);
                  return (
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-gray-400">Last dispatch</p>
                      <p className="text-xs font-medium text-gray-600">{fmtDate(lastDispatchByCity[city])}</p>
                      <p className={`text-xs font-semibold ${d >= 7 ? 'text-orange-500' : 'text-gray-400'}`}>{d === 0 ? 'Today' : `${d}d ago`}</p>
                    </div>
                  );
                })() : (
                  <span className="text-xs text-gray-300 hidden sm:block">No dispatch yet</span>
                )}
                {acceptedCount > 0 && (
                  <button onClick={(e) => { e.stopPropagation(); navigate('/vendor/dispatch'); }}
                    className="hidden sm:block text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium whitespace-nowrap">
                    Dispatch →
                  </button>
                )}
                <span className={`text-gray-400 text-sm transition-transform ${isCityOpen ? 'rotate-180' : ''}`}>▾</span>
              </div>
            </button>

            {isCityOpen && (
              <div className="border-t border-gray-100">
                {retailerList.map((r) => {
                  const rKey      = `${city}-${r.id}`;
                  const isROpen   = !!openRetailers[rKey];
                  const rPending  = r.orders.filter(o => o.status === 'pending').length;
                  const rAccepted = r.orders.filter(o => o.status === 'accepted').length;

                  return (
                    <div key={r.id} className="border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                        <button onClick={() => toggleRetailer(rKey)} className="flex items-start gap-2 flex-1 text-left min-w-0">
                          <span className={`text-gray-400 text-xs transition-transform shrink-0 mt-0.5 ${isROpen ? 'rotate-180' : ''}`}>▾</span>
                          <div className="min-w-0">
                            <span className="text-sm font-medium text-gray-800 truncate block">{r.name}</span>
                            <Meta items={[
                              rPending  > 0 && { label: `${rPending} pending`,                              color: 'text-amber-600' },
                              rAccepted > 0 && { label: `${rAccepted} accepted`,                            color: 'text-sky-600'  },
                              { label: `${r.orders.length} order${r.orders.length !== 1 ? 's' : ''}`,       color: 'text-gray-400'  },
                            ]} />
                          </div>
                        </button>
                        <Link to={`/vendor/retailers/${r.id}`}
                          className="text-xs text-blue-600 hover:underline font-medium shrink-0">
                          View →
                        </Link>
                      </div>

                      {isROpen && (
                        <>
                          <div className="hidden md:grid px-4 py-2 gap-x-3 text-xs font-medium text-gray-500"
                            style={{ gridTemplateColumns: COLS }}>
                            <div /><span>Order</span><span>Phone</span><span>Retailer</span>
                            <span>Date</span><span>Units</span><span>Location</span>
                            <span>Status</span><span>Action</span><span />
                          </div>
                          <div className="px-3 py-2 space-y-1.5">
                            {r.orders.map((o) => (
                              <VendorOrderCard key={o.id} order={o} onAccept={onAccept} onReject={onReject} defaultExpanded={false} />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

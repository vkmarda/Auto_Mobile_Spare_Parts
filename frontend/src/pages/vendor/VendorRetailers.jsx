import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getRetailers } from '../../api/vendor.api';

export default function VendorRetailers() {
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [city, setCity]           = useState('');

  useEffect(() => {
    getRetailers().then(setRetailers).finally(() => setLoading(false));
  }, []);

  const cities = useMemo(() => [...new Set(retailers.map((r) => r.city).filter(Boolean))].sort(), [retailers]);

  const filtered = useMemo(() => retailers.filter((r) => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (city && r.city !== city) return false;
    return true;
  }), [retailers, search, city]);

  if (loading) return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-6xl mx-auto space-y-4">
      <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse" />
      {[...Array(6)].map((_, i) => <div key={i} className="bg-gray-100 rounded-xl h-14 animate-pulse" />)}
    </div>
  );

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-6xl mx-auto space-y-6">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Retailers</h1>
            <p className="text-sm text-gray-500 mt-1">View and manage your retail partners</p>
          </div>
          <span className="text-xs text-gray-400 mt-2 shrink-0">{filtered.length} retailer{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name…"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
        />
        <select value={city} onChange={(e) => setCity(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All cities</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {(search || city) && (
          <button onClick={() => { setSearch(''); setCity(''); }}
            className="text-xs text-gray-400 hover:text-red-500 font-medium">Clear</button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-14 text-center">
          <p className="text-3xl mb-3">🏪</p>
          <p className="text-sm font-semibold text-gray-700">No retailers found</p>
          <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[540px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-xs text-gray-500 font-medium">
                  <th className="text-left px-4 py-3">Retailer</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">City</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Mobile</th>
                  <th className="text-left px-4 py-3">Total Orders</th>
                  <th className="text-left px-4 py-3">Pending</th>
                  <th className="text-left px-4 py-3">In Transit</th>
                  <th className="text-right px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{r.name}</p>
                      <p className="text-xs text-gray-400">{r.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">
                      {r.city || '—'}{r.state ? `, ${r.state}` : ''}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">
                      {r.mobile ? <a href={`tel:${r.mobile}`} className="hover:text-blue-600">{r.mobile}</a> : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-700">{r.total_orders}</td>
                    <td className="px-4 py-3">
                      {r.pending_count > 0
                        ? <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">{r.pending_count}</span>
                        : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {r.dispatched_count > 0
                        ? <span className="text-xs bg-violet-100 text-violet-700 font-semibold px-2 py-0.5 rounded-full">{r.dispatched_count}</span>
                        : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/vendor/retailers/${r.id}`}
                        className="text-xs text-blue-600 hover:underline font-medium">View Details</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { getPendingVendors, getAllVendors, approveVendor, getAllRetailers } from '../api/admin.api';

function Badge({ approved }) {
  return approved
    ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Approved</span>
    : <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Pending</span>;
}

export default function AdminPanel() {
  const [tab, setTab] = useState('pending');
  const [pending,   setPending]   = useState([]);
  const [vendors,   setVendors]   = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [approving, setApproving] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, v, r] = await Promise.all([getPendingVendors(), getAllVendors(), getAllRetailers()]);
      setPending(p); setVendors(v); setRetailers(r);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    setApproving(id);
    try {
      await approveVendor(id);
      await load();
    } finally { setApproving(null); }
  };

  const TABS = [
    { id: 'pending',   label: 'Pending Approval', count: pending.length },
    { id: 'vendors',   label: 'All Vendors',       count: vendors.length },
    { id: 'retailers', label: 'All Retailers',     count: retailers.length },
  ];

  const VendorRow = ({ v, showApprove }) => (
    <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
      <td className="px-4 py-3 font-medium text-gray-900">{v.name}</td>
      <td className="px-4 py-3 text-gray-500">{v.email}</td>
      <td className="px-4 py-3 text-gray-500">{v.mobile || '—'}</td>
      <td className="px-4 py-3 text-gray-500">{[v.city, v.state].filter(Boolean).join(', ') || '—'}</td>
      <td className="px-4 py-3 font-mono text-xs text-gray-400">{v.gst_number || '—'}</td>
      <td className="px-4 py-3">
        {showApprove
          ? <button onClick={() => handleApprove(v.id)} disabled={approving === v.id}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
              {approving === v.id ? 'Approving…' : 'Approve'}
            </button>
          : <Badge approved={v.is_approved} />
        }
      </td>
    </tr>
  );

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage vendors and retailers</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
              ${tab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold
                ${t.id === 'pending' ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            {tab === 'pending' && (
              pending.length === 0
                ? <div className="py-16 text-center text-gray-400"><p className="text-3xl mb-2">✅</p><p className="text-sm font-medium">No pending vendor applications</p></div>
                : <table className="w-full text-sm min-w-[600px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>{['Name','Email','Mobile','Location','GST Number','Action'].map((h) => <th key={h} className="px-4 py-3 text-left text-gray-600 font-medium">{h}</th>)}</tr>
                    </thead>
                    <tbody>{pending.map((v) => <VendorRow key={v.id} v={v} showApprove />)}</tbody>
                  </table>
            )}
            {tab === 'vendors' && (
              vendors.length === 0
                ? <div className="py-16 text-center text-gray-400"><p className="text-sm font-medium">No vendors registered yet</p></div>
                : <table className="w-full text-sm min-w-[600px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>{['Name','Email','Mobile','Location','GST Number','Status'].map((h) => <th key={h} className="px-4 py-3 text-left text-gray-600 font-medium">{h}</th>)}</tr>
                    </thead>
                    <tbody>{vendors.map((v) => <VendorRow key={v.id} v={v} showApprove={!v.is_approved} />)}</tbody>
                  </table>
            )}
            {tab === 'retailers' && (
              retailers.length === 0
                ? <div className="py-16 text-center text-gray-400"><p className="text-sm font-medium">No retailers registered yet</p></div>
                : <table className="w-full text-sm min-w-[500px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>{['Name','Email','Mobile','Location','Joined'].map((h) => <th key={h} className="px-4 py-3 text-left text-gray-600 font-medium">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {retailers.map((r) => (
                        <tr key={r.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                          <td className="px-4 py-3 text-gray-500">{r.email}</td>
                          <td className="px-4 py-3 text-gray-500">{r.mobile || '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{[r.city, r.state].filter(Boolean).join(', ') || '—'}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

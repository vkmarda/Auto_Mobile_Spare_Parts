const ICONS = {
  sales: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9h4.5a1.5 1.5 0 010 3H12m0 0h1.5a1.5 1.5 0 010 3H9m3-9v1m0 9v1" />
    </svg>
  ),
  parts: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  qty: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  rate: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  ),
};

function Sparkline({ data }) {
  if (!data || data.length < 2) return null;
  const up  = data[data.length - 1] >= data[0];
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 72, H = 24;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * H}`)
    .join(' ');
  return (
    <svg width={W} height={H} className="overflow-visible">
      <defs>
        <marker id={`arrow-${up ? 'up' : 'dn'}`} markerWidth="6" markerHeight="6"
          refX="3" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill={up ? '#16a34a' : '#dc2626'} />
        </marker>
      </defs>
      <polyline points={pts} fill="none"
        stroke={up ? '#16a34a' : '#dc2626'} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"
        markerEnd={`url(#arrow-${up ? 'up' : 'dn'})`} />
    </svg>
  );
}

export default function StatCard({ title, value, iconType, trend, sparkData, compact }) {
  const up   = trend != null && trend > 0;
  const down = trend != null && trend < 0;

  const bg        = up ? 'bg-green-50 border-green-200' : down ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200';
  const iconColor = up ? 'text-green-600'              : down ? 'text-red-600'             : 'text-gray-500';

  if (compact) {
    return (
      <div className={`rounded-xl shadow-sm border px-3 py-3 ${bg}`}>
        <div className="flex items-center justify-between mb-1.5">
          <span className={`w-3.5 h-3.5 flex-shrink-0 ${iconColor}`}>{ICONS[iconType]}</span>
          {trend != null && (
            <span className={`flex items-center gap-0.5 text-[10px] font-bold ${up ? 'text-green-600' : 'text-red-600'}`}>
              <svg viewBox="0 0 10 12" className="w-2 h-2.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {up ? <path d="M5 11V1M1 5l4-4 4 4" /> : <path d="M5 1v10M1 7l4 4 4-4" />}
              </svg>
              {Math.abs(trend).toFixed(0)}%
            </span>
          )}
        </div>
        <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-[10px] text-gray-500 mt-1 leading-tight">{title}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl shadow-sm border p-5 ${bg}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-4 h-4 flex-shrink-0 ${iconColor}`}>
            {ICONS[iconType]}
          </span>
          <p className="text-sm font-semibold text-gray-600">{title}</p>
        </div>
        {trend != null && (
          <span className={`flex items-center gap-0.5 text-xs font-bold ${up ? 'text-green-600' : 'text-red-600'}`}>
            <svg viewBox="0 0 10 12" className="w-2.5 h-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {up
                ? <path d="M5 11V1M1 5l4-4 4 4" />
                : <path d="M5 1v10M1 7l4 4 4-4" />}
            </svg>
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <p className="text-3xl font-bold text-gray-900 leading-none">{value}</p>
        {sparkData && <Sparkline data={sparkData} />}
      </div>
    </div>
  );
}

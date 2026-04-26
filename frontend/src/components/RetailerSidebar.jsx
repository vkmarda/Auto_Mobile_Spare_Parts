import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Home, Search, Package, ShoppingCart, Wrench } from 'lucide-react';

const NAV = [
  { to: '/retailer',  label: 'Home',      icon: Home,         dot: null },
  { to: '/products',  label: 'Products',  icon: Search,       dot: null },
  { to: '/orders',    label: 'My Orders', icon: Package,      dot: null },
  { to: '/cart',      label: 'Cart',      icon: ShoppingCart, dot: 'cart' },
];

function CollapseIcon({ expanded }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg"
      className={`w-4 h-4 transition-transform duration-200 ${expanded ? '' : 'rotate-180'}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function SidebarInner({ expanded, onToggle, onClose }) {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const cartCount = cart?.length || 0;

  const getBadge = (dot) => {
    if (dot === 'cart' && cartCount > 0) return { count: cartCount, cls: 'bg-indigo-500' };
    return null;
  };

  const isActive = (to) =>
    to === '/retailer' ? pathname === '/retailer' || pathname === '/'
      : pathname.startsWith(to);

  return (
    <div className="flex flex-col h-full select-none">

      {/* Brand row */}
      <div className="flex items-center justify-between h-16 px-3 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-sm">
            <Wrench size={16} />
          </div>
          {expanded && (
            <span className="text-lg font-bold text-white tracking-tight truncate">Purzaa</span>
          )}
        </div>
        <button onClick={onToggle} title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          className="hidden md:flex w-7 h-7 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
          <CollapseIcon expanded={expanded} />
        </button>
        <button onClick={onClose} className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, icon: NavIcon, dot }) => {
          const badge = getBadge(dot);
          const active = isActive(to);
          return (
            <Link key={to} to={to} onClick={onClose} title={!expanded ? label : undefined}
              className={`flex items-center gap-3 rounded-lg transition-colors relative ${
                expanded ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center'
              } ${active
                ? 'bg-indigo-500/20 text-indigo-400 font-semibold'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}>
              {active && expanded && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-400 rounded-r-full" />
              )}
              <NavIcon size={18} className="flex-shrink-0" />
              {expanded && <span className="text-sm flex-1 whitespace-nowrap">{label}</span>}
              {badge && expanded && (
                <span className={`${badge.cls} text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0`}>
                  {badge.count > 9 ? '9+' : badge.count}
                </span>
              )}
              {badge && !expanded && (
                <span className={`${badge.cls} absolute top-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900`} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="border-t border-slate-700 p-2 flex-shrink-0">
        {expanded ? (
          <>
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg">
              <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-indigo-400">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                <p className="text-xs text-indigo-400">Retailer</p>
              </div>
            </div>
            <button onClick={() => { logout(); navigate('/login'); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-indigo-400">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
            <button onClick={() => { logout(); navigate('/login'); }} title="Logout"
              className="w-full flex justify-center py-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RetailerSidebar({ expanded, onToggle, mobileOpen, onMobileClose }) {
  return (
    <>
      <aside className={`hidden md:flex flex-col fixed left-0 top-0 h-screen bg-slate-900 border-r border-slate-700 z-40 transition-all duration-200 ease-in-out overflow-hidden ${expanded ? 'w-60' : 'w-16'}`}>
        <SidebarInner expanded={expanded} onToggle={onToggle} onClose={() => {}} />
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={onMobileClose} />
      )}

      <aside className={`md:hidden fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-700 z-50 transition-transform duration-200 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarInner expanded={true} onToggle={() => {}} onClose={onMobileClose} />
      </aside>
    </>
  );
}

import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useEffect, useState } from 'react';
import { getAllOrders } from '../api/vendor.api';
import { getReturns } from '../api/returns.api';
import { Wrench, LayoutDashboard, Clock, ClipboardList, Truck, RotateCcw, Store, Package, Home, Search } from 'lucide-react';

const roleBadge = {
  retailer: 'bg-blue-50 text-blue-600 border border-blue-200',
  vendor:   'bg-indigo-50 text-indigo-700 border border-indigo-200',
};

const VENDOR_NAV = [
  { to: '/vendor',           label: 'Dashboard', icon: LayoutDashboard, dot: null },
  { to: '/vendor/pending',   label: 'Pending',   icon: Clock,           dot: 'pending' },
  { to: '/vendor/orders',    label: 'All Orders',icon: ClipboardList,   dot: null },
  { to: '/vendor/dispatch',  label: 'Dispatch',  icon: Truck,           dot: 'accepted' },
  { to: '/vendor/returns',   label: 'Returns',   icon: RotateCcw,       dot: 'returns' },
  { to: '/vendor/retailers', label: 'Retailers', icon: Store,           dot: null },
  { to: '/vendor/products',  label: 'Products',  icon: Package,         dot: null },
];

const RETAILER_MOBILE_NAV = [
  { to: '/retailer', label: 'Home',      icon: Home },
  { to: '/products', label: 'Products',  icon: Search },
  { to: '/orders',   label: 'My Orders', icon: Package },
];

export default function Navbar() {
  const { user, logout }  = useAuth();
  const { cart }          = useCart();
  const navigate          = useNavigate();
  const { pathname }      = useLocation();
  const [pendingCount, setPendingCount]   = useState(0);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [returnsCount, setReturnsCount]   = useState(0);
  const [menuOpen, setMenuOpen]           = useState(false);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    if (user?.role === 'vendor') {
      getAllOrders()
        .then((orders) => {
          setPendingCount(orders.filter((o) => o.status === 'pending').length);
          setAcceptedCount(orders.filter((o) => o.status === 'accepted').length);
        })
        .catch(() => {});
      getReturns()
        .then((rets) => setReturnsCount(rets.filter((r) => r.status === 'return_requested').length))
        .catch(() => {});
    }
  }, [pathname, user]);

  if (!user) return null;

  const cartCount = cart?.length || 0;
  const isActive  = (to) => pathname === to;

  const getDot = (dot) => {
    if (dot === 'pending'  && pendingCount  > 0) return { count: pendingCount,  cls: 'bg-red-500' };
    if (dot === 'accepted' && acceptedCount > 0) return { count: acceptedCount, cls: 'bg-sky-500' };
    if (dot === 'returns'  && returnsCount  > 0) return { count: returnsCount,  cls: 'bg-amber-500' };
    return null;
  };

  const navLink = (to, label, dot = null) => {
    const badge = getDot(dot);
    return (
      <Link
        to={to}
        className={`relative flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
          isActive(to)
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        {label}
        {badge && (
          <span className={`w-4 h-4 ${badge.cls} text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none`}>
            {badge.count > 9 ? '9+' : badge.count}
          </span>
        )}
      </Link>
    );
  };

  const mobileLink = (to, label, NavIcon, dot = null) => {
    const badge = getDot(dot);
    return (
      <Link
        key={to}
        to={to}
        className={`flex items-center gap-3 px-4 py-4 text-sm font-medium border-b border-gray-100 last:border-0 transition-colors ${
          isActive(to) ? 'text-indigo-700 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        {isActive(to) && <span className="w-1 h-5 bg-indigo-600 rounded-full flex-shrink-0" />}
        {NavIcon && <NavIcon size={17} className="flex-shrink-0 text-gray-400" />}
        <span className="flex-1">{label}</span>
        {badge && (
          <span className={`w-5 h-5 ${badge.cls} text-white text-xs font-bold rounded-full flex items-center justify-center`}>
            {badge.count}
          </span>
        )}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
            <Wrench size={16} />
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">Purzaa</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {user.role === 'retailer' && (
            <>
              {navLink('/retailer', 'Home')}
              {navLink('/products', 'Products')}
              {navLink('/orders',   'My Orders')}
            </>
          )}
          {user.role === 'vendor' && VENDOR_NAV.map(({ to, label, dot }) => navLink(to, label, dot))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user.role === 'retailer' && (
            <button type="button" onClick={() => navigate('/cart')}
              className="relative p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-9H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          )}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200">
            <span className="text-sm font-medium text-gray-700">{user.name.split(' ')[0]}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleBadge[user.role]}`}>{user.role}</span>
          </div>
          <button type="button" onClick={() => { logout(); navigate('/login'); }}
            className="hidden md:block text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors">
            Logout
          </button>

          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-0 py-1">
            {user.role === 'retailer' && RETAILER_MOBILE_NAV.map(({ to, label, icon }) =>
              mobileLink(to, label, icon)
            )}
            {user.role === 'vendor' && VENDOR_NAV.map(({ to, label, icon, dot }) =>
              mobileLink(to, label, icon, dot)
            )}
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-indigo-700">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-sm font-medium text-gray-700">{user.name}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleBadge[user.role]}`}>{user.role}</span>
            </div>
            <button type="button" onClick={() => { logout(); navigate('/login'); }}
              className="text-sm text-red-500 font-medium hover:text-red-600">
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

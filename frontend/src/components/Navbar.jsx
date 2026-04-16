import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useEffect, useState } from 'react';
import { getAllOrders } from '../api/vendor.api';
import { getReturns } from '../api/returns.api';

const roleBadge = {
  retailer: 'bg-blue-50 text-blue-600 border border-blue-200',
  vendor:   'bg-amber-50 text-amber-700 border border-amber-200',
};

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

  const navLink = (to, label, dot = null) => (
    <Link
      to={to}
      className={`relative flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
        isActive(to)
          ? 'bg-blue-50 text-blue-700'
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {label}
      {dot === 'pending'  && pendingCount  > 0 && (
        <span className="w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
          {pendingCount > 9 ? '9+' : pendingCount}
        </span>
      )}
      {dot === 'accepted' && acceptedCount > 0 && (
        <span className="w-4 h-4 bg-sky-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
          {acceptedCount > 9 ? '9+' : acceptedCount}
        </span>
      )}
      {dot === 'returns'  && returnsCount  > 0 && (
        <span className="w-4 h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
          {returnsCount > 9 ? '9+' : returnsCount}
        </span>
      )}
    </Link>
  );

  const mobileLink = (to, label, dot = null) => (
    <Link
      key={to}
      to={to}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b border-gray-100 last:border-0 transition-colors ${
        isActive(to) ? 'text-blue-700 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      {isActive(to) && <span className="w-1 h-4 bg-blue-600 rounded-full flex-shrink-0" />}
      <span className="flex-1">{label}</span>
      {dot === 'pending'  && pendingCount  > 0 && <span className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">{pendingCount}</span>}
      {dot === 'accepted' && acceptedCount > 0 && <span className="w-5 h-5 bg-sky-500 text-white text-xs font-bold rounded-full flex items-center justify-center">{acceptedCount}</span>}
      {dot === 'returns'  && returnsCount  > 0 && <span className="w-5 h-5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">{returnsCount}</span>}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-base shadow-sm">
            🔧
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
          {user.role === 'vendor' && (
            <>
              {navLink('/vendor',           'Dashboard')}
              {navLink('/vendor/pending',   'Pending',   'pending')}
              {navLink('/vendor/orders',    'Orders')}
              {navLink('/vendor/dispatch',  'Dispatch',  'accepted')}
              {navLink('/vendor/returns',   'Returns',   'returns')}
              {navLink('/vendor/retailers', 'Retailers')}
              {navLink('/vendor/products',  'Products')}
            </>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user.role === 'retailer' && (
            <button type="button" onClick={() => navigate('/cart')}
              className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors">
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
            {user.role === 'retailer' && (
              <>
                {mobileLink('/retailer', 'Home')}
                {mobileLink('/products', 'Products')}
                {mobileLink('/orders',   'My Orders')}
              </>
            )}
            {user.role === 'vendor' && (
              <>
                {mobileLink('/vendor',            'Dashboard · Overview & Stats')}
                {mobileLink('/vendor/pending',    'Pending · Action Required',  'pending')}
                {mobileLink('/vendor/orders',     'All Orders · Full History')}
                {mobileLink('/vendor/dispatch',   'Dispatch · Send Orders',     'accepted')}
                {mobileLink('/vendor/returns',    'Returns',                    'returns')}
                {mobileLink('/vendor/retailers',  'Retailers')}
                {mobileLink('/vendor/products',   'Products')}
              </>
            )}
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-blue-700">{user.name.charAt(0).toUpperCase()}</span>
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

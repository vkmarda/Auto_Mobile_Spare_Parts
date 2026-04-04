import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useEffect, useState } from 'react';
import { getAllOrders } from '../api/vendor.api';
import { getReturns } from '../api/returns.api';

const roleBadge = {
  retailer: 'bg-blue-50 text-blue-600 border border-blue-200',
  vendor:   'bg-amber-50 text-amber-600 border border-amber-200',
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

  const navLink = (to, label, dot = null) => (
    <Link
      to={to}
      className={`relative text-sm font-medium transition-colors ${
        pathname === to ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {label}
      {dot === 'pending'  && pendingCount  > 0 && <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full" />}
      {dot === 'accepted' && acceptedCount > 0 && <span className="absolute -top-1 -right-2 w-2 h-2 bg-blue-500 rounded-full" />}
      {dot === 'returns'  && returnsCount  > 0 && <span className="absolute -top-1 -right-2 w-2 h-2 bg-amber-500 rounded-full" />}
    </Link>
  );

  const mobileLink = (to, label, dot = null) => (
    <Link
      key={to}
      to={to}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b border-gray-100 last:border-0 transition-colors ${
        pathname === to ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      {label}
      {dot === 'pending'  && pendingCount  > 0 && <span className="w-2 h-2 bg-red-500 rounded-full" />}
      {dot === 'accepted' && acceptedCount > 0 && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
      {dot === 'returns'  && returnsCount  > 0 && <span className="w-2 h-2 bg-amber-500 rounded-full" />}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-xl">🔧</span>
          <span className="text-base font-bold text-blue-600">Purzaa</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {user.role === 'retailer' && (
            <>
              {navLink('/retailer', 'Home')}
              {navLink('/products', 'Products')}
              {navLink('/orders', 'My Orders')}
            </>
          )}
          {user.role === 'vendor' && (
            <>
              {navLink('/vendor',           'Home',      'pending')}
              {navLink('/vendor/dispatch',  'Dispatch',  'accepted')}
              {navLink('/vendor/returns',   'Returns',   'returns')}
              {navLink('/vendor/dashboard', 'Dashboard')}
              {navLink('/vendor/products',  'Products')}
            </>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user.role === 'retailer' && (
            <button type="button" onClick={() => navigate('/cart')}
              className="relative text-gray-600 hover:text-blue-600 cursor-pointer transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-9H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          )}
          <span className="hidden sm:block text-sm font-medium text-gray-700">{user.name.split(' ')[0]}</span>
          <span className={`hidden sm:inline text-xs font-medium px-2 py-0.5 rounded-full ${roleBadge[user.role]}`}>{user.role}</span>
          <button type="button" onClick={() => { logout(); navigate('/login'); }}
            className="hidden md:block text-sm text-gray-500 hover:text-red-500 transition-colors cursor-pointer">
            Logout
          </button>

          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
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
                {mobileLink('/orders', 'My Orders')}
              </>
            )}
            {user.role === 'vendor' && (
              <>
                {mobileLink('/vendor',           'Home',      'pending')}
                {mobileLink('/vendor/dispatch',  'Dispatch',  'accepted')}
                {mobileLink('/vendor/returns',   'Returns',   'returns')}
                {mobileLink('/vendor/dashboard', 'Dashboard')}
                {mobileLink('/vendor/products',  'Products')}
              </>
            )}
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">{user.name}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleBadge[user.role]}`}>{user.role}</span>
            </div>
            <button type="button" onClick={() => { logout(); navigate('/login'); }}
              className="text-sm text-red-500 font-medium">
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useEffect, useState } from 'react';
import { getAllOrders } from '../api/vendor.api';

const roleBadge = {
  retailer: 'bg-blue-50 text-blue-600 border border-blue-200',
  vendor: 'bg-amber-50 text-amber-600 border border-amber-200',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (user?.role === 'vendor') {
      getAllOrders()
        .then((orders) => setPendingCount(orders.filter((o) => o.status === 'pending').length))
        .catch(() => {});
    }
  }, [pathname, user]);

  if (!user) return null;

  const cartCount = cart?.length || 0;

  const navLink = (to, label, dot = false) => (
    <Link
      to={to}
      className={`relative text-sm font-medium transition-colors ${
        pathname === to ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {label}
      {dot && pendingCount > 0 && (
        <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full" />
      )}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 sm:px-6 h-14 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xl">🔧</span>
        <span className="text-base font-bold text-blue-600">Purzaa</span>
      </div>

      <div className="hidden md:flex items-center gap-8">
        {user.role === 'retailer' && (
          <>
            {navLink('/', 'Home')}
            {navLink('/products', 'Products')}
            {navLink('/orders', 'My Orders')}
          </>
        )}
        {user.role === 'vendor' && (
          <>
            {navLink('/vendor', 'Home', true)}
            {navLink('/vendor/dashboard', 'Dashboard')}
            {navLink('/vendor/products', 'Products')}
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {user.role === 'retailer' && (
          <button
            type="button"
            onClick={() => navigate('/cart')}
            className="relative text-gray-600 hover:text-blue-600 cursor-pointer transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-9H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        )}

        {user.role === 'retailer' && <div className="w-px h-5 bg-gray-200" />}

        <span className="text-sm font-medium text-gray-700">{user.name}</span>

        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleBadge[user.role]}`}>
          {user.role}
        </span>

        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="text-sm text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

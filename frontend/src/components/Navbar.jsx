import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const roleBadge = { retailer: 'bg-blue-100 text-blue-700', vendor: 'bg-purple-100 text-purple-700' };

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (!user) return null;

  const link = (to, label) => (
    <Link to={to}
      className={`text-sm font-medium px-1 py-0.5 transition-colors ${
        pathname === to ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
      }`}>
      {label}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between">
      {/* Left: logo + nav */}
      <div className="flex items-center gap-8">
        <Link to={user.role === 'vendor' ? '/vendor' : '/products'} className="flex items-center gap-2">
          <span className="text-xl">🔧</span>
          <span className="text-base font-bold text-blue-600">Parts Order</span>
        </Link>
        <div className="flex items-center gap-5">
          {user.role === 'retailer' && (
            <>
              {link('/products', 'Products')}
              <Link to="/cart"
                className={`text-sm font-medium px-1 py-0.5 flex items-center gap-1 transition-colors ${
                  pathname === '/cart' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                }`}>
                Cart
                {cart.length > 0 && (
                  <span className="bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {cart.length}
                  </span>
                )}
              </Link>
              {link('/orders', 'My Orders')}
            </>
          )}
          {user.role === 'vendor' && (
            <>
              {link('/vendor', 'Dashboard')}
              {link('/vendor/products', 'Products')}
            </>
          )}
        </div>
      </div>

      {/* Right: user info + logout */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-700 font-medium hidden sm:block">{user.name}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleBadge[user.role]}`}>
          {user.role}
        </span>
        <button onClick={() => { logout(); navigate('/login'); }}
          className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors">
          Logout
        </button>
      </div>
    </nav>
  );
}

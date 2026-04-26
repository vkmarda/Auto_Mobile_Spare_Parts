import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import RetailerSidebar from './RetailerSidebar';
import { useCart } from '../context/CartContext';
import { Home, Search, Package, ShoppingCart, User, Wrench } from 'lucide-react';

const BOTTOM_NAV = [
  { to: '/retailer', label: 'Home',    icon: Home },
  { to: '/products', label: 'Parts',   icon: Search },
  { to: '/orders',   label: 'Orders',  icon: Package },
  { to: '/cart',     label: 'Cart',    icon: ShoppingCart },
  { to: '/profile',  label: 'Profile', icon: User },
];

export default function RetailerLayout() {
  const [expanded, setExpanded] = useState(() => {
    const saved = localStorage.getItem('retailer_sidebar');
    return saved === null ? true : saved === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const { cart } = useCart();
  const { pathname } = useLocation();

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const showBottomNav = pathname !== '/products';

  const toggle = () => {
    setExpanded((v) => {
      localStorage.setItem('retailer_sidebar', String(!v));
      return !v;
    });
  };

  const isActive = (to) =>
    to === '/retailer'
      ? pathname === '/retailer' || pathname === '/'
      : pathname.startsWith(to);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <RetailerSidebar
        expanded={expanded}
        onToggle={toggle}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className={`flex flex-col flex-1 min-w-0 transition-all duration-200 ease-in-out ${expanded ? 'md:pl-60' : 'md:pl-16'}`}>
        {/* Mobile top bar — logo only, no hamburger */}
        <header className="md:hidden flex items-center h-14 px-4 bg-slate-900 border-b border-slate-700 sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Wrench size={14} />
            </div>
            <span className="text-base font-bold text-white">Purzaa</span>
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto ${showBottomNav ? 'pb-16 md:pb-0' : ''}`}>
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        {showBottomNav && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-30 flex">
            {BOTTOM_NAV.map(({ to, label, icon: NavIcon }) => {
              const active = isActive(to);
              const isCart = to === '/cart';
              return (
                <Link key={to} to={to}
                  className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative transition-colors ${
                    active ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                  }`}>
                  <NavIcon size={20} />
                  <span className="text-[10px] font-medium">{label}</span>
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-indigo-400 rounded-full" />
                  )}
                  {isCart && cartCount > 0 && (
                    <span className="absolute top-1.5 right-[calc(25%-8px)] w-4 h-4 bg-indigo-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import VendorSidebar from './VendorSidebar';
import { Wrench } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { getPendingCount } from '../api/vendor.api';

const POLL_INTERVAL = 30_000;

const ACTION = { label: 'View Pending', to: '/vendor/pending' };

export default function VendorLayout() {
  const [expanded, setExpanded] = useState(() => {
    const saved = localStorage.getItem('vendor_sidebar');
    return saved === null ? true : saved === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user }    = useAuth();
  const showToast   = useToast();
  const prevCount   = useRef(null);

  useEffect(() => {
    if (user?.role !== 'vendor') return;
    let cancelled = false;

    const check = async () => {
      try {
        const count = await getPendingCount();
        if (cancelled) return;
        if (prevCount.current === null) {
          // First load — login-time notification
          if (count > 0) showToast(`You have ${count} pending order${count !== 1 ? 's' : ''}`, 'info', ACTION, 8000);
        } else if (count > prevCount.current) {
          // New order(s) arrived while online
          showToast('New order received', 'info', ACTION);
        }
        prevCount.current = count;
      } catch (_) {}
    };

    check();
    const id = setInterval(check, POLL_INTERVAL);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const toggle = () => {
    setExpanded((v) => {
      localStorage.setItem('vendor_sidebar', String(!v));
      return !v;
    });
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <VendorSidebar
        expanded={expanded}
        onToggle={toggle}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main area — shifts right to make room for sidebar */}
      <div
        className={`flex flex-col flex-1 min-w-0 transition-all duration-200 ease-in-out ${
          expanded ? 'md:pl-60' : 'md:pl-16'
        }`}
      >
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 h-14 px-4 bg-white border-b border-gray-200 sticky top-0 z-30 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Wrench size={14} />
            </div>
            <span className="text-base font-bold text-gray-900">Purzaa</span>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

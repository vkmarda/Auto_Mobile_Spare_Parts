import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProductList from './pages/ProductList';
import Cart from './pages/Cart';
import MyOrders from './pages/MyOrders';
import AdminPanel from './pages/AdminPanel';
import RetailerLanding from './pages/RetailerLanding';
import SearchResults from './pages/SearchResults';
import VehicleTypeStep from './pages/order/VehicleTypeStep';
import BrandStep from './pages/order/BrandStep';
import ModelStep from './pages/order/ModelStep';
import PhotoOrderPage from './pages/order/PhotoOrderPage';
import VendorHome from './pages/vendor/VendorHome';
import VendorDispatch from './pages/vendor/VendorDispatch';
import VendorReturns from './pages/vendor/VendorReturns';
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorProducts from './pages/vendor/VendorProducts';
import VendorOrderDetail from './pages/VendorOrderDetail';
import VendorOrders from './pages/vendor/VendorOrders';

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center p-16 text-center">
      <p className="text-5xl font-bold text-gray-300 mb-4">404</p>
      <p className="text-lg text-gray-600 mb-6">Page not found</p>
      <Link to="/" className="text-sm text-blue-600 hover:underline">← Back to home</Link>
    </div>
  );
}

function RequireAuth({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  const [warming, setWarming] = useState(true);

  useEffect(() => {
    const warmUp = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/health`,
          { signal: AbortSignal.timeout(30000) }
        );
        if (res.ok) setWarming(false);
      } catch (err) {
        setWarming(false);
      }
    };
    warmUp();
    const interval = setInterval(() => {
      fetch(`${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/health`).catch(() => {});
    }, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (warming) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8f9fb', gap: '16px' }}>
        <div style={{ fontSize: '40px' }}>🔧</div>
        <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>Purzaa</div>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>Starting up, please wait...</div>
        <div style={{ width: '200px', height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#1d4ed8', borderRadius: '2px', animation: 'loading 2s ease-in-out infinite' }} />
        </div>
        <style>{`@keyframes loading { 0% { width: 0% } 50% { width: 70% } 100% { width: 100% } }`}</style>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/login"  element={user ? <Navigate to={user.role === 'vendor' ? '/vendor' : user.role === 'admin' ? '/admin' : '/retailer'} replace /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to="/retailer" replace /> : <Signup />} />

          {/* Retailer */}
          <Route path="/retailer"           element={<RequireAuth role="retailer"><RetailerLanding /></RequireAuth>} />
          <Route path="/"                   element={<RequireAuth role="retailer"><RetailerLanding /></RequireAuth>} />
          <Route path="/order/vehicle-type" element={<RequireAuth role="retailer"><VehicleTypeStep /></RequireAuth>} />
          <Route path="/order/brand"        element={<RequireAuth role="retailer"><BrandStep /></RequireAuth>} />
          <Route path="/order/model"        element={<RequireAuth role="retailer"><ModelStep /></RequireAuth>} />
          <Route path="/order/photo"        element={<RequireAuth role="retailer"><PhotoOrderPage /></RequireAuth>} />
          <Route path="/products"           element={<RequireAuth role="retailer"><ProductList /></RequireAuth>} />
          <Route path="/search"             element={<RequireAuth role="retailer"><SearchResults /></RequireAuth>} />
          <Route path="/cart"               element={<RequireAuth role="retailer"><Cart /></RequireAuth>} />
          <Route path="/orders"             element={<RequireAuth role="retailer"><MyOrders /></RequireAuth>} />

          {/* Vendor */}
          <Route path="/vendor"            element={<RequireAuth role="vendor"><VendorHome /></RequireAuth>} />
          <Route path="/vendor/dispatch"   element={<RequireAuth role="vendor"><VendorDispatch /></RequireAuth>} />
          <Route path="/vendor/returns"    element={<RequireAuth role="vendor"><VendorReturns /></RequireAuth>} />
          <Route path="/vendor/dashboard"  element={<RequireAuth role="vendor"><VendorDashboard /></RequireAuth>} />
          <Route path="/vendor/products"   element={<RequireAuth role="vendor"><VendorProducts /></RequireAuth>} />
          <Route path="/vendor/orders"     element={<RequireAuth role="vendor"><VendorOrders /></RequireAuth>} />
          <Route path="/vendor/orders/:id" element={<RequireAuth role="vendor"><VendorOrderDetail /></RequireAuth>} />

          {/* Admin */}
          <Route path="/admin" element={<RequireAuth role="admin"><AdminPanel /></RequireAuth>} />

          <Route path="*" element={user ? <NotFound /> : <Navigate to="/login" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

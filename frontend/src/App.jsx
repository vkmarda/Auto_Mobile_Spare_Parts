import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center p-16 text-center">
      <p className="text-5xl font-bold text-gray-300 mb-4">404</p>
      <p className="text-lg text-gray-600 mb-6">Page not found</p>
      <Link to="/" className="text-sm text-blue-600 hover:underline">← Back to home</Link>
    </div>
  );
}
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import ProductList from './pages/ProductList';
import Cart from './pages/Cart';
import MyOrders from './pages/MyOrders';
import VendorDashboard from './pages/VendorDashboard';
import VendorProducts from './pages/VendorProducts';

function RequireAuth({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to={user.role === 'vendor' ? '/vendor' : '/products'} replace /> : <Login />}
          />
          <Route path="/products" element={<RequireAuth role="retailer"><ProductList /></RequireAuth>} />
          <Route path="/cart"     element={<RequireAuth role="retailer"><Cart /></RequireAuth>} />
          <Route path="/orders"   element={<RequireAuth role="retailer"><MyOrders /></RequireAuth>} />
          <Route path="/vendor"          element={<RequireAuth role="vendor"><VendorDashboard /></RequireAuth>} />
          <Route path="/vendor/products" element={<RequireAuth role="vendor"><VendorProducts /></RequireAuth>} />
          <Route path="*" element={user ? <NotFound /> : <Navigate to="/login" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

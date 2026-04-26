import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/auth.api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { saveAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      saveAuth(data.token, data.user);
      if (data.user.role === 'vendor') navigate('/vendor');
      else if (data.user.role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left hero panel — desktop only */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 flex-col items-center justify-center px-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-amber-500/5 rounded-full translate-x-28 translate-y-28" />
        <div className="absolute top-0 left-0 w-56 h-56 bg-amber-500/5 rounded-full -translate-x-20 -translate-y-20" />
        <div className="relative z-10 text-center max-w-sm">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg mx-auto mb-6">
            🔧
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Purzaa</h1>
          <p className="text-2xl font-bold text-amber-400 mb-4">Parts. Fast. Simple.</p>
          <p className="text-sm text-gray-400 leading-relaxed">
            The B2B platform connecting spare parts retailers with vendors - powering faster fulfillment across India.
          </p>
          <div className="mt-10 flex flex-col gap-3 items-start mx-auto w-fit">
            {['Order tracking & status updates', 'Vendor demand aggregation', 'Returns management'].map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                <span className="w-5 h-5 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 text-xs flex-shrink-0">✓</span>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-sm p-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🔧</span>
            <h1 className="text-xl font-bold text-amber-600">Purzaa</h1>
          </div>
          <p className="text-sm text-gray-500 mb-7">Sign in to your account</p>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="you@example.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors mt-2 flex items-center justify-center gap-2">
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            New to Purzaa?{' '}
            <Link to="/signup" className="text-blue-600 hover:underline font-medium">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

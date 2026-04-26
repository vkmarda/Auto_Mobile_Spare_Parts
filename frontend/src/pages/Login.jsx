import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Wrench } from 'lucide-react';
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

      {/* ── Desktop: Left hero panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 flex-col items-center justify-center px-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-indigo-500/5 rounded-full translate-x-28 translate-y-28" />
        <div className="absolute top-0 left-0 w-56 h-56 bg-indigo-500/5 rounded-full -translate-x-20 -translate-y-20" />
        <div className="relative z-10 text-center max-w-sm">
          <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6">
            <Wrench size={28} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Purzaa</h1>
          <p className="text-2xl font-bold text-indigo-400 mb-4">Parts. Fast. Simple.</p>
          <p className="text-sm text-gray-400 leading-relaxed">
            The B2B platform connecting spare parts retailers with vendors — powering faster fulfillment across India.
          </p>
          <div className="mt-10 flex flex-col gap-3 items-start mx-auto w-fit">
            {['Order tracking & status updates', 'Vendor demand aggregation', 'Returns management'].map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                <span className="w-5 h-5 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 flex-shrink-0"><Check size={11} strokeWidth={3} /></span>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Desktop: Right form panel ── */}
      <div className="hidden lg:flex flex-1 bg-gray-50 items-center justify-center px-4">
        <FormCard email={email} setEmail={setEmail} password={password} setPassword={setPassword}
          error={error} loading={loading} onSubmit={handleSubmit} />
      </div>

      {/* ── Mobile: Full-screen hero + bottom sheet form ── */}
      <div className="lg:hidden relative flex flex-col h-screen w-full bg-slate-900">
        {/* Background accents */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-x-24 -translate-y-24 pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-48 h-48 bg-indigo-500/5 rounded-full translate-x-16 pointer-events-none" />

        {/* Hero — compact, logo + tagline only */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-8 text-center">
          <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg mb-5">
            <Wrench size={28} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Purzaa</h1>
          <p className="text-lg font-bold text-indigo-400">Parts. Fast. Simple.</p>
        </div>

        {/* Soft glow bleed into sheet */}
        <div className="absolute bottom-[44%] left-0 right-0 h-16 bg-gradient-to-b from-transparent to-indigo-950/40 pointer-events-none z-10" />

        {/* Bottom sheet — fixed ~45% height, scrollable */}
        <div className="relative z-20 bg-white rounded-t-3xl px-6 pt-8 pb-10 shadow-2xl overflow-y-auto" style={{ minHeight: '45%' }}>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Sign in</h2>
          <p className="text-sm text-gray-400 mb-6">Welcome back to Purzaa</p>
          <FormFields email={email} setEmail={setEmail} password={password} setPassword={setPassword}
            error={error} loading={loading} onSubmit={handleSubmit} />
        </div>
      </div>

    </div>
  );
}

function FormCard({ email, setEmail, password, setPassword, error, loading, onSubmit }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-sm p-8">
      <div className="flex items-center gap-2 mb-1">
        <Wrench size={20} className="text-indigo-600" />
        <h1 className="text-xl font-bold text-indigo-600">Purzaa</h1>
      </div>
      <p className="text-sm text-gray-500 mb-7">Sign in to your account</p>
      <FormFields email={email} setEmail={setEmail} password={password} setPassword={setPassword}
        error={error} loading={loading} onSubmit={onSubmit} />
    </div>
  );
}

function FormFields({ email, setEmail, password, setPassword, error, loading, onSubmit }) {
  return (
    <>
      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-lg">
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            placeholder="you@example.com"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
            placeholder="••••••••"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors mt-2 flex items-center justify-center gap-2">
          {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-5">
        New to Purzaa?{' '}
        <Link to="/signup" className="text-indigo-600 hover:underline font-medium">Create account</Link>
      </p>
    </>
  );
}

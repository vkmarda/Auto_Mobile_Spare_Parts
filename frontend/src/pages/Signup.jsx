import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/auth.api';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const navigate = useNavigate();
  const { saveAuth } = useAuth();
  const [role, setRole] = useState('retailer');
  const [form, setForm] = useState({ name: '', email: '', password: '', mobile: '', city: '', state: '', gst_number: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await register({ ...form, role });
      if (data.pending) {
        setPending(true);
      } else {
        saveAuth(data.token, data.user);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (pending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-sm p-8 text-center">
          <p className="text-4xl mb-4">⏳</p>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Application Submitted</h2>
          <p className="text-sm text-gray-500 mb-6">Your vendor account is pending admin approval. You will receive a notification once approved.</p>
          <Link to="/login" className="text-sm text-blue-600 hover:underline">← Back to Login</Link>
        </div>
      </div>
    );
  }

  const field = (label, key, type = 'text', required = false, placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}{required && ' *'}</label>
      <input type={type} value={form[key]} onChange={(e) => set(key, e.target.value)} required={required}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-md p-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🔧</span>
          <h1 className="text-xl font-bold text-blue-600">Parts Order</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6">Create your account</p>

        {/* Role tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          {['retailer', 'vendor'].map((r) => (
            <button key={r} type="button" onClick={() => setRole(r)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors capitalize
                ${role === r ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {r === 'retailer' ? '🏪 Retailer' : '🏭 Vendor'}
            </button>
          ))}
        </div>

        {role === 'vendor' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2 rounded-lg mb-5">
            Vendor accounts require admin approval before you can log in.
          </div>
        )}

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-lg">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {field('Full Name', 'name', 'text', true, 'Your name or business name')}
          {field('Email', 'email', 'email', true, 'you@example.com')}
          {field('Password', 'password', 'password', true, '••••••••')}
          {field('Mobile', 'mobile', 'tel', false, '9876543210')}
          <div className="grid grid-cols-2 gap-3">
            {field('City', 'city', 'text', false, 'Mumbai')}
            {field('State', 'state', 'text', false, 'Maharashtra')}
          </div>
          {role === 'vendor' && field('GST Number', 'gst_number', 'text', true, '22AAAAA0000A1Z5')}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors mt-2 flex items-center justify-center gap-2">
            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

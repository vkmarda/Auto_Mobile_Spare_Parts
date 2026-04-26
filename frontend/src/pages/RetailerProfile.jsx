import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RetailerProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-lg mx-auto px-4 py-8">

      {/* Avatar + name */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
          <span className="text-2xl font-bold text-indigo-600">{initials}</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">{user?.name}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>
        <span className="mt-2 text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full px-3 py-0.5 font-medium capitalize">
          {user?.role}
        </span>
      </div>

      {/* Profile details */}
      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 mb-4">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Full name</p>
            <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Email</p>
            <p className="text-sm font-semibold text-gray-800">{user?.email}</p>
          </div>
        </div>
        {user?.mobile && (
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Mobile</p>
              <p className="text-sm font-semibold text-gray-800">{user.mobile}</p>
            </div>
          </div>
        )}
        {user?.city && (
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">City</p>
              <p className="text-sm font-semibold text-gray-800">{user.city}{user.state ? `, ${user.state}` : ''}</p>
            </div>
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 bg-white border border-red-200 text-red-500 hover:bg-red-50 font-semibold py-3.5 rounded-2xl text-sm transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Logout
      </button>
    </div>
  );
}

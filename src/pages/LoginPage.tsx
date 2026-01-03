import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LoginPageProps {
  onLogin: (username: string, password?: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username) {
      setError('Please enter a username or email');
      return;
    }

    setIsLoggingIn(true);
    // Pass password to App for validation against Mock DB
    try {
      await onLogin(username, password);
    } catch (e: any) {
      setError(e.message || 'Login failed');
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-[500px] flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-100">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800 brand-font">Chaldea Security Organization</h2>
        <p className="text-center text-gray-500 mb-6">Enter your credentials to access the Spirit Origin List.</p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username or Email</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Master name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder=""
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => navigate('/servants')}
              className="w-1/2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-1/2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-70"
            >
              {isLoggingIn ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>

        {/* Demo Credentials Hint */}
        <div className="mt-6 bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800">
          <p className="font-bold mb-1">Demo Admin Credentials:</p>
          <div className="flex justify-between">
            <span>Email: <code className="bg-white px-1 rounded border border-blue-200">admin@chaldea.org</code></span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Password: <code className="bg-white px-1 rounded border border-blue-200">admin</code></span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600 mb-2">New to Chaldea?</p>
          <button
            onClick={() => navigate('/register')}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors flex items-center justify-center w-full"
          >
            Create a Master Account
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
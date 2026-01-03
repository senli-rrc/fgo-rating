
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link
              to="/servants"
              className="flex-shrink-0 flex items-center cursor-pointer"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-2">
                F
              </div>
              <span className="font-bold text-xl text-gray-900 brand-font tracking-tight">FGO Rating</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <NavLink
                to="/servants"
                className={({ isActive }) => `${isActive ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full transition-colors`}
              >
                Servant List
              </NavLink>
              <NavLink
                to="/rankings"
                className={({ isActive }) => `${isActive ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full transition-colors`}
              >
                Rankings
              </NavLink>
              <NavLink
                to="/mainquests"
                className={({ isActive }) => `${isActive ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full transition-colors`}
              >
                Main Quests
              </NavLink>
              {user?.role === 'ADMIN' && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) => `${isActive ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full transition-colors`}
                >
                  Admin Panel
                </NavLink>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm flex flex-col items-end">
                    <span className="font-medium text-gray-900">{user.username}</span>
                    <span className="text-xs text-gray-500">{user.role}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="text-gray-500 hover:text-red-600 text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                 <Link
                    to="/login"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                  >
                    Register
                  </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

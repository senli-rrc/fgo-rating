
import React from 'react';
import { User, ViewState } from '../types';

interface NavbarProps {
  user: User | null;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
  currentView: ViewState;
}

const Navbar: React.FC<NavbarProps> = ({ user, onNavigate, onLogout, currentView }) => {
  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div 
              className="flex-shrink-0 flex items-center cursor-pointer" 
              onClick={() => onNavigate(ViewState.HOME)}
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-2">
                F
              </div>
              <span className="font-bold text-xl text-gray-900 brand-font tracking-tight">FGO Rating</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <button
                onClick={() => onNavigate(ViewState.HOME)}
                className={`${currentView === ViewState.HOME ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full transition-colors`}
              >
                Servant List
              </button>
              <button
                onClick={() => onNavigate(ViewState.RANKING)}
                className={`${currentView === ViewState.RANKING ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full transition-colors`}
              >
                Rankings
              </button>
              <button
                onClick={() => onNavigate(ViewState.MAIN_QUESTS)}
                className={`${currentView === ViewState.MAIN_QUESTS ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full transition-colors`}
              >
                Main Quests
              </button>
              {user?.role === 'ADMIN' && (
                <button
                  onClick={() => onNavigate(ViewState.ADMIN)}
                  className={`${currentView === ViewState.ADMIN ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full transition-colors`}
                >
                  Admin Panel
                </button>
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
                 <button
                    onClick={() => onNavigate(ViewState.LOGIN)}
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => onNavigate(ViewState.REGISTER)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                  >
                    Register
                  </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

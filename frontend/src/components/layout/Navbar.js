import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ setSidebarOpen }) {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getRoleColor = (role) => {
    const colors = {
      'project_manager': 'bg-blue-100 text-blue-800',
      'executive': 'bg-purple-100 text-purple-800',
      'team_member': 'bg-green-100 text-green-800',
      'stakeholder': 'bg-yellow-100 text-yellow-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const formatRole = (role) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
      <button
        type="button"
        className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
        onClick={() => setSidebarOpen(true)}
        data-testid="mobile-menu-button"
      >
        <span className="sr-only">Open sidebar</span>
        <svg
          className="h-6 w-6"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      </button>
      
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex items-center">
          <h1 className="text-xl font-semibold text-gray-900" data-testid="app-title">
            ProjectHub PMO
          </h1>
        </div>
        
        <div className="ml-4 flex items-center md:ml-6">
          {/* User menu */}
          <div className="ml-3 relative">
            <div>
              <button
                type="button"
                className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => setShowUserMenu(!showUserMenu)}
                data-testid="user-menu-button"
              >
                <span className="sr-only">Open user menu</span>
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-gray-900">{user?.full_name}</div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user?.role)}`}>
                        {formatRole(user?.role || '')}
                      </span>
                      {user?.department && (
                        <span className="text-xs text-gray-500">• {user.department}</span>
                      )}
                    </div>
                  </div>
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
            </div>
            
            {showUserMenu && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                  <div className="font-medium text-gray-900">{user?.full_name}</div>
                  <div className="text-xs">{user?.email}</div>
                </div>
                
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    // Add profile functionality later
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  data-testid="profile-menu-item"
                >
                  Your Profile
                </button>
                
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    // Add settings functionality later
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  data-testid="settings-menu-item"
                >
                  Settings
                </button>
                
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    data-testid="logout-menu-item"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
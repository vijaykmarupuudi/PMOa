import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
      </svg>
    ),
    roles: ['project_manager', 'executive', 'team_member', 'stakeholder'],
  },
  {
    name: 'Projects',
    href: '/projects',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    roles: ['project_manager', 'executive', 'team_member', 'stakeholder'],
  },
  {
    name: 'Initiation',
    href: '/initiation',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    roles: ['project_manager', 'executive'],
    coming_soon: false,
  },
  {
    name: 'Planning',
    href: '/planning',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    roles: ['project_manager', 'executive', 'team_member'],
    coming_soon: true,
  },
  {
    name: 'Execution',
    href: '/execution',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    roles: ['project_manager', 'team_member', 'stakeholder'],
    coming_soon: true,
  },
  {
    name: 'Monitoring',
    href: '/monitoring',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    roles: ['project_manager', 'executive', 'stakeholder'],
    coming_soon: true,
  },
  {
    name: 'Closure',
    href: '/closure',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    roles: ['project_manager', 'executive'],
    coming_soon: true,
  },
];

const adminNavigation = [
  {
    name: 'Reports',
    href: '/reports',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    roles: ['executive', 'project_manager'],
    coming_soon: true,
  },
];

export default function Sidebar({ open, setOpen }) {
  const { user } = useAuth();
  const location = useLocation();

  const isActiveLink = (href) => {
    return location.pathname === href || (href === '/dashboard' && location.pathname === '/');
  };

  const canAccessMenuItem = (item) => {
    return item.roles.includes(user?.role);
  };

  const renderNavItem = (item) => {
    if (item.coming_soon) {
      return (
        <div
          key={item.name}
          className="group flex items-center px-2 py-2 text-sm font-medium rounded-md relative opacity-60 cursor-not-allowed text-gray-400"
          data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
        >
          <div className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400">
            {item.icon}
          </div>
          {item.name}
          <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Soon
          </span>
        </div>
      );
    }
    
    return (
      <NavLink
        key={item.name}
        to={item.href}
        className={({ isActive }) =>
          `group flex items-center px-2 py-2 text-sm font-medium rounded-md relative transition-colors duration-200 ${
            isActive || isActiveLink(item.href)
              ? 'bg-blue-100 text-blue-900'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`
        }
        data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
      >
        {({ isActive }) => (
          <>
            <div className={`mr-3 flex-shrink-0 h-6 w-6 transition-colors duration-200 ${
              isActive || isActiveLink(item.href) ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
            }`}>
              {item.icon}
            </div>
            {item.name}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 flex z-50 md:hidden">
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75" 
            onClick={() => setOpen(false)}
            aria-hidden="true" 
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setOpen(false)}
                data-testid="close-mobile-menu"
              >
                <span className="sr-only">Close sidebar</span>
                <svg
                  className="h-6 w-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
                <span className="ml-2 text-xl font-semibold text-gray-900">ProjectHub</span>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navigation.filter(canAccessMenuItem).map((item) => 
                  renderMobileNavItem(item)
                )}
                
                {(user?.role === 'executive' || user?.role === 'project_manager') && (
                  <>
                    <div className="pt-4 pb-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Management
                      </p>
                    </div>
                    {adminNavigation.filter(canAccessMenuItem).map((item) =>
                      renderMobileNavItem(item)
                    )}
                  </>
                )}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="ml-2 text-xl font-semibold text-gray-900">ProjectHub</span>
            </div>
            
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.filter(canAccessMenuItem).map(renderNavItem)}
              
              {(user?.role === 'executive' || user?.role === 'project_manager') && (
                <>
                  <div className="pt-6 pb-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
                      Management
                    </p>
                  </div>
                  {adminNavigation.filter(canAccessMenuItem).map(renderNavItem)}
                </>
              )}
            </nav>
          </div>
          
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  {user?.full_name}
                </p>
                <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700 capitalize">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
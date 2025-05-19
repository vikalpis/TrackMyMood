import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  History, 
  LogOut, 
  PlusCircle,
  CloudRain,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { icon: <LayoutDashboard size={20} />, text: 'Dashboard', to: '/dashboard' },
    { icon: <PlusCircle size={20} />, text: 'New Entry', to: '/journal/new' },
    { icon: <History size={20} />, text: 'History', to: '/journal/history' },
  ];

  return (
    <div className="flex h-screen bg-[var(--bg-secondary)] dark-transition">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--bg-primary)] border-r border-[var(--border-color)] hidden md:flex flex-col dark-transition">
        <div className="p-5 border-b border-[var(--border-color)]">
          <div className="flex items-center space-x-2">
            <CloudRain className="h-8 w-8 text-primary-500" />
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">TrackMyMood</h1>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item, index) => (
            <NavLink 
              key={index} 
              to={item.to}
              className={({ isActive }) => 
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-100' 
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                }`
              }
            >
              {item.icon}
              <span>{item.text}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-100 font-medium">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-[var(--text-secondary)] truncate">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-2 text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-all duration-200"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-10 bg-[var(--bg-primary)] border-t border-[var(--border-color)] flex justify-around py-2 md:hidden dark-transition">
        {navItems.map((item, index) => (
          <NavLink 
            key={index} 
            to={item.to}
            className={({ isActive }) => 
              `flex flex-col items-center p-2 ${
                isActive 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-[var(--text-secondary)]'
              }`
            }
          >
            {item.icon}
            <span className="text-xs mt-1">{item.text}</span>
          </NavLink>
        ))}
        <button 
          onClick={toggleTheme}
          className="flex flex-col items-center p-2 text-[var(--text-secondary)]"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-[var(--bg-secondary)] dark-transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
import React from 'react';
import { UserProfile } from '../types';
import { LogOut, Sun, Moon, GraduationCap } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: UserProfile | null;
  onLogout: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, user, onLogout, isDark, toggleTheme, currentPage, setCurrentPage 
}) => {
  const getInitials = (name?: string | null) => {
    const safeName = (name && typeof name === 'string') ? name : '?';
    return safeName.charAt(0).toUpperCase();
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'dark' : ''}`}>
      <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50 transition-colors duration-200 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => setCurrentPage(user ? 'dashboard' : 'landing')}>
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="bg-primary-600 text-white p-2 rounded-lg">
                    <GraduationCap size={24} />
                </div>
                <span className="font-bold text-xl text-primary-600 dark:text-primary-400">Circademic</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
               {user && (
                 <div className="hidden md:flex gap-4 ml-4">
                    <button 
                        onClick={() => setCurrentPage('dashboard')}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === 'dashboard' ? 'text-primary-600 bg-primary-50 dark:bg-gray-700 dark:text-primary-400' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
                    >
                        דאשבורד
                    </button>
                    <button 
                         onClick={() => setCurrentPage('blog')}
                         className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === 'blog' ? 'text-primary-600 bg-primary-50 dark:bg-gray-700 dark:text-primary-400' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
                    >
                        בלוג
                    </button>
                 </div>
               )}

              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 focus:outline-none"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {user ? (
                <div className="flex items-center gap-3">
                  <span className="hidden sm:block text-sm text-gray-700 dark:text-gray-300">
                    היי, {user.displayName || 'סטודנט'}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold">
                    {getInitials(user.displayName)}
                  </div>
                  <button 
                    onClick={onLogout}
                    className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                    title="יציאה"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCurrentPage('login')}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  התחברות
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </main>
      <footer className="bg-gray-800 text-white py-8 mt-auto no-print">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="mb-2">Circademic © 2024 - כל הזכויות שמורות</p>
            <p className="text-gray-400 text-sm">הפלטפורמה המובילה לניהול אקדמי בישראל</p>
        </div>
      </footer>
    </div>
  );
};
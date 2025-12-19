import React from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, icon }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <>
      <nav 
        className="sticky top-0 z-50 backdrop-blur-2xl shadow-sm"
        style={{ 
          background: 'rgba(42, 49, 66, 0.95)',
          borderBottom: '1px solid #3A4154'
        }}
      >
        <div className="container-custom h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: '#F5A623' }}
            >
              {icon}
            </div>
            <div className="hidden sm:block">
              <h2 
                className="text-lg font-bold"
                style={{ color: '#F5A623' }}
              >
                ResolveIt
              </h2>
              <p className="text-xs font-medium" style={{ color: '#9AA1B2' }}>{subtitle}</p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4 flex-1 justify-end">
            <div 
              className="text-right pr-4"
              style={{ borderRight: '1px solid #3A4154' }}
            >
              <p className="text-sm font-semibold" style={{ color: '#E6E8ED' }}>{user?.name}</p>
              <p className="text-xs capitalize" style={{ color: '#9AA1B2' }}>{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors"
              style={{ 
                background: '#3A4154',
                color: '#E6E8ED'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#2A3142'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#3A4154'}
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden px-3 py-2 rounded-lg transition-colors"
            style={{ 
              background: '#3A4154',
              color: '#E6E8ED'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#2A3142'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#3A4154'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div 
            className="md:hidden backdrop-blur-xl animate-slide-in-up"
            style={{ 
              borderTop: '1px solid #3A4154',
              background: 'rgba(42, 49, 66, 0.98)'
            }}
          >
            <div className="container-custom py-4 space-y-4">
              <div 
                className="px-4 py-3 rounded-xl"
                style={{ background: '#3A4154' }}
              >
                <p className="text-sm font-semibold" style={{ color: '#E6E8ED' }}>{user?.name}</p>
                <p className="text-xs" style={{ color: '#9AA1B2' }}>{user?.email}</p>
                <p className="text-xs capitalize mt-1" style={{ color: '#9AA1B2' }}>{user?.role}</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-2 py-2 rounded-lg transition-colors"
                style={{ 
                  background: '#F5A623',
                  color: '#0E1320'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#E69B1F'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#F5A623'}
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};
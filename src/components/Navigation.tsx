
import { Link, useLocation } from 'react-router-dom';
import { Users, UserX, BarChart3, GitCompare, Settings, Camera, CalendarDays } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const Navigation = () => {
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: BarChart3 },
    { path: '/active-users', label: 'Active Users', icon: Users },
    { path: '/expired-users', label: 'Expired Users', icon: UserX },
    { path: '/historical', label: 'Historical', icon: CalendarDays },
    { path: '/compare', label: 'Compare Data', icon: GitCompare },
    { path: '/compare-months', label: 'Compare Months', icon: GitCompare },
    { path: '/snapshots', label: 'Snapshots', icon: Camera },
  ];

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between">
          <div className="flex space-x-8">
            <div className="flex items-center">
              <Link to="/" className="flex items-center py-4 px-2">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <span className="font-semibold text-gray-500 text-lg ml-2">Analytics Dashboard</span>
              </Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`py-4 px-3 text-gray-500 font-medium text-sm border-b-2 border-transparent hover:text-gray-700 transition duration-300 ${
                      isActive ? 'text-blue-600 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Icon className="h-4 w-4" />
                      {label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-gray-700">Welcome, {currentUser?.username}</span>
            {currentUser?.role === 'admin' && (
              <Link
                to="/admin"
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition duration-300 flex items-center gap-1"
              >
                <Settings className="h-4 w-4" />
                Admin
              </Link>
            )}
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

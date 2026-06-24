import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Tag, UtensilsCrossed, Users, BarChart2, Star, Settings, LogOut } from 'lucide-react';

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Tag, label: 'Brand Management', path: '/brands' },
  { icon: UtensilsCrossed, label: 'Restaurants', path: '/restaurants' },
  { icon: Users, label: 'User Management', path: '/users' },
  { icon: BarChart2, label: 'Reports & Analytics', path: '/reports' },
  { icon: Star, label: 'Reviews', path: '/reviews' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  function handleLogout() { localStorage.clear(); navigate('/login'); }
  return (
    <aside className="w-60 bg-[#1e2a3a] flex flex-col flex-shrink-0">
      <div className="p-5 flex items-center gap-2 border-b border-white/10">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold">F</span>
        </div>
        <span className="text-white font-bold text-lg">FoodieGo</span>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map(({ icon: Icon, label, path }) => (
          <button key={path} onClick={() => navigate(path)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${pathname === path ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/10 hover:text-white transition">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}

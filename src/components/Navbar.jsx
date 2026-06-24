import React from 'react';
import { Bell, HelpCircle, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/brands': 'Brand Management',
  '/restaurants': 'Restaurant Management',
  '/users': 'User Management',
};

export default function Navbar() {
  const { pathname } = useLocation();
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 flex-shrink-0">
      <h1 className="text-lg font-semibold text-gray-800 flex-shrink-0">{TITLES[pathname] || 'FoodieGo'}</h1>
      <div className="flex-1 max-w-md mx-auto relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input placeholder="Search..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <button className="relative p-2 text-gray-500 hover:text-gray-700">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
        </button>
        <button className="p-2 text-gray-500 hover:text-gray-700"><HelpCircle className="w-5 h-5" /></button>
        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">A</div>
      </div>
    </header>
  );
}

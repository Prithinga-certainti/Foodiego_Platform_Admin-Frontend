import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BrandManagementPage from './pages/BrandManagementPage';
import RestaurantManagementPage from './pages/RestaurantManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import AppLayout from './components/AppLayout';

function PrivateRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="brands" element={<BrandManagementPage />} />
          <Route path="restaurants" element={<RestaurantManagementPage />} />
          <Route path="users" element={<UserManagementPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

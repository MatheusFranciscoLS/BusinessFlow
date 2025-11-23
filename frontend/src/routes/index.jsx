import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// PÁGINAS
import Login from '../pages/Auth';
import Register from '../pages/Auth/Register';
import ForgotPassword from '../pages/Auth/ForgotPassword';
import ResetPassword from '../pages/Auth/ResetPassword'; // <--- Importação da nova tela

import Layout from '../components/Layout';
import Dashboard from '../pages/Dashboard';
import Customers from '../pages/Customers';
import Services from '../pages/Services';
import Financial from '../pages/Financial';
import Appointments from '../pages/Appointments';

// --- COMPONENTES DE PROTEÇÃO ---

const PrivateRoute = ({ children }) => {
  const { signed, loading } = useAuth();
  if (loading) return <div>Carregando...</div>;
  return signed ? children : <Navigate to="/" />;
};

const PublicRoute = ({ children }) => {
  const { signed } = useAuth();
  return signed ? <Navigate to="/app" /> : children;
};

// --- ROTAS ---

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

        <Routes>
          {/* ================================================== */}
          {/* GRUPO 1: PÁGINAS PÚBLICAS (SEM LAYOUT)             */}
          {/* ================================================== */}
          
          <Route path="/" element={
            <PublicRoute><Login /></PublicRoute>
          } />
          
          <Route path="/register" element={
            <PublicRoute><Register /></PublicRoute>
          } />
          
          <Route path="/forgot-password" element={
            <PublicRoute><ForgotPassword /></PublicRoute>
          } />



          {/* ================================================== */}
          {/* GRUPO 2: PÁGINAS DO SISTEMA (COM LAYOUT / SIDEBAR) */}
          {/* ================================================== */}
          
          <Route path="/app" element={
            <PrivateRoute><Layout /></PrivateRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="clientes" element={<Customers />} />
            <Route path="servicos" element={<Services />} />
            <Route path="financeiro" element={<Financial />} />
            <Route path="agenda" element={<Appointments />} />
          </Route>

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export { AppRoutes };
export default AppRoutes;
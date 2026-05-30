import React, { lazy } from 'react';
// 👇 AQUI ESTAVA O ERRO! Adicionei o 'Navigate' na importação!
import { HashRouter, Routes, Route, Navigate } from "react-router-dom"; 
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// PÁGINAS
import Login from '../pages/Auth';
import Register from '../pages/Auth/Register';
import ForgotPassword from '../pages/Auth/ForgotPassword';
import ResetPassword from '../pages/Auth/ResetPassword';
import Helpdesk from '../pages/Helpdesk';
import Documents from '../pages/Documents';
import Agenda from '../pages/Agenda';
import Layout from '../components/Layout';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const Customers = lazy(() => import('../pages/Customers'));
const Services = lazy(() => import('../pages/Services'));
const Appointments = lazy(() => import('../pages/Appointments'));
const Financial = lazy(() => import('../pages/Financial'));
const Profile = lazy(() => import('../pages/Profile'));

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
    <HashRouter>
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

          <Route path="/reset-password" element={
            <PublicRoute><ResetPassword /></PublicRoute>
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
           <Route path="perfil" element={<Profile />} />
           <Route path="helpdesk" element={<Helpdesk />} />
           <Route path="documentos" element={<Documents />} />
           <Route path="agenda" element={<Agenda />} />
           
          </Route>

        </Routes>
      </AuthProvider>
    </HashRouter>
  );
};

export { AppRoutes };
export default AppRoutes;
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRoutes } from './routes'; 
import GlobalStyles from './styles/global'; // Agora esse arquivo existe!

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <GlobalStyles /> {/* Isso aplica o CSS Reset no projeto todo */}
    <AppRoutes />
  </React.StrictMode>
);
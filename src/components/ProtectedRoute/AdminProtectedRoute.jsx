import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import '../../styles/loading.css';

const AdminProtectedRoute = ({ children }) => {
  const { isAdminAuthenticated, isLoading } = useAdmin();
  const location = useLocation();

  // Mostrar loading enquanto verifica autenticação admin
  if (isLoading) {
    return (
      <div className="loading-container admin-loading">
        <div className="loading-spinner"></div>
        <span className="loading-text">Verificando autenticação admin</span>
      </div>
    );
  }

  // Se não estiver autenticado como admin, redirecionar para login admin
  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Se estiver autenticado como admin, renderizar o componente filho
  return children;
};

export default AdminProtectedRoute;
import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/loading.css';

const ProtectedRoute = ({ children }) => {
  // Align with AuthContext, which exposes `loading` instead of `isLoading`
  const { isAuthenticated, loading: isLoading } = useAuth();
  const location = useLocation();

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="loading-container auth-loading">
        <div className="loading-spinner"></div>
        <span className="loading-text">Verificando autenticação</span>
      </div>
    );
  }

  // Se não estiver autenticado, redirecionar para login
  // Salvar a página atual para redirecionar após login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se estiver autenticado:
  // - quando usado com children, renderiza-os
  // - quando usado como rota pai, renderiza o Outlet para rotas aninhadas
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
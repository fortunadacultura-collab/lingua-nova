import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin deve ser usado dentro de um AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminToken, setAdminToken] = useState(null);

  // Verificar se admin está logado ao inicializar
  useEffect(() => {
    const checkAdminAuth = () => {
      try {
        const token = localStorage.getItem('linguanova_admin_token');
        const expiry = localStorage.getItem('linguanova_admin_expiry');
        
        if (token && expiry) {
          const now = new Date().getTime();
          if (now < parseInt(expiry)) {
            setAdminToken(token);
            setIsAdminAuthenticated(true);
          } else {
            // Token expirado
            localStorage.removeItem('linguanova_admin_token');
            localStorage.removeItem('linguanova_admin_expiry');
          }
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação admin:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAuth();
  }, []);

  const adminLogin = async (credentials) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('http://localhost:5001/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        const token = data.token;
        const expiry = new Date().getTime() + (2 * 60 * 60 * 1000); // 2 horas
        
        localStorage.setItem('linguanova_admin_token', token);
        localStorage.setItem('linguanova_admin_expiry', expiry.toString());
        
        setAdminToken(token);
        setIsAdminAuthenticated(true);
        
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Credenciais inválidas' };
      }
    } catch (error) {
      console.error('Erro no login admin:', error);
      return { success: false, error: 'Erro de conexão' };
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogout = () => {
    localStorage.removeItem('linguanova_admin_token');
    localStorage.removeItem('linguanova_admin_expiry');
    setAdminToken(null);
    setIsAdminAuthenticated(false);
  };

  const resetAdminPassword = async (email) => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao resetar senha admin:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  };

  const getUsers = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  };

  const promoteUser = async (userId) => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/promote-user', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      return { success: response.ok, ...data };
    } catch (error) {
      console.error('Erro ao promover usuário:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  };

  const demoteUser = async (userId) => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/demote-user', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      return { success: response.ok, ...data };
    } catch (error) {
      console.error('Erro ao rebaixar usuário:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  };

  const changeAccessLevel = async (userId, accessLevel) => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/change-access-level', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ userId, accessLevel })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao alterar nível de acesso');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao alterar nível de acesso:', error);
      throw error;
    }
  };

  const getAccessLevels = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/access-levels', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar níveis de acesso');
      }

      const data = await response.json();
      return data.accessLevels;
    } catch (error) {
      console.error('Erro ao buscar níveis de acesso:', error);
      throw error;
    }
  };

  const deleteUser = async (userId, reason) => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ userId, reason })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir usuário');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      throw error;
    }
  };

  const restoreUser = async (userId) => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/restore-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao restaurar usuário');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao restaurar usuário:', error);
      throw error;
    }
  };

  const getDeletedUsers = async (page = 1, limit = 50) => {
    try {
      const response = await fetch(`http://localhost:5001/api/admin/deleted-users?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar usuários deletados');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao buscar usuários deletados:', error);
      throw error;
    }
  };

  const cleanupApkgUploads = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/maintenance/cleanup-apkg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao executar limpeza de uploads');
      }
      return data;
    } catch (error) {
      console.error('Erro ao executar limpeza de uploads .apkg:', error);
      throw error;
    }
  };

  const value = {
    isAdminAuthenticated,
    isLoading,
    adminToken,
    adminLogin,
    adminLogout,
    resetAdminPassword,
    getUsers,
    promoteUser,
    demoteUser,
    changeAccessLevel,
    getAccessLevels,
    deleteUser,
    restoreUser,
    getDeletedUsers,
    cleanupApkgUploads
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export default AdminContext;
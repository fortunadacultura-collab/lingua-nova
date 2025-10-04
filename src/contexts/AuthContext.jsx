import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verificar se há um usuário logado no localStorage ao inicializar
  useEffect(() => {
    const checkAuthState = () => {
      try {
        const savedUser = localStorage.getItem('linguanova_user');
        const savedToken = localStorage.getItem('linguanova_token');
        
        if (savedUser && savedToken) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Erro ao verificar estado de autenticação:', error);
        // Limpar dados corrompidos
        localStorage.removeItem('linguanova_user');
        localStorage.removeItem('linguanova_token');
      } finally {
        setLoading(false);
      }
    };

    checkAuthState();
  }, []);

  // Função de registro
  const register = async (userData) => {
    try {
      setLoading(true);
      
      // Chamada para API de registro
      const response = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: userData.password,
          acceptTerms: userData.acceptTerms || false
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar conta');
      }

      const result = await response.json();
      
      // Salvar dados do usuário e token
      const newUser = {
        id: result.user.id,
        name: `${result.user.firstName} ${result.user.lastName}`,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        email: result.user.email,
        subscription: result.user.subscription || 'free',
        profilePicture: result.user.profilePicture,
        createdAt: result.user.createdAt
      };

      localStorage.setItem('linguanova_user', JSON.stringify(newUser));
      localStorage.setItem('linguanova_token', result.token);
      
      setUser(newUser);
      setIsAuthenticated(true);
      
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Erro no registro:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Função de login
  const login = async (email, password) => {
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao fazer login');
      }

      const result = await response.json();
      
      const userData = {
        id: result.user.id,
        name: `${result.user.firstName} ${result.user.lastName}`,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        email: result.user.email,
        subscription: result.user.subscription || 'free',
        profilePicture: result.user.profilePicture,
        createdAt: result.user.createdAt
      };

      localStorage.setItem('linguanova_user', JSON.stringify(userData));
      localStorage.setItem('linguanova_token', result.token);
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Função de login com redes sociais
  const loginWithSocial = async (socialData) => {
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:5001/api/auth/social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(socialData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro na autenticação social');
      }

      const result = await response.json();
      
      const userData = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        subscription: result.user.subscription || 'free',
        profilePicture: result.user.profilePicture,
        provider: result.user.provider,
        createdAt: result.user.createdAt
      };

      localStorage.setItem('linguanova_user', JSON.stringify(userData));
      localStorage.setItem('linguanova_token', result.token);
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Erro na autenticação social:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Função de logout
  const logout = async () => {
    try {
      // Tentar fazer logout no servidor
      const token = localStorage.getItem('linguanova_token');
      if (token) {
        await fetch('http://localhost:5001/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Erro ao fazer logout no servidor:', error);
    } finally {
      // Limpar dados locais independentemente do resultado da API
      localStorage.removeItem('linguanova_user');
      localStorage.removeItem('linguanova_token');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Função para atualizar dados do usuário
  const updateUser = (newUserData) => {
    const updatedUser = { ...user, ...newUserData };
    localStorage.setItem('linguanova_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  // Função para recarregar dados do usuário do localStorage
  const reloadUserFromStorage = () => {
    try {
      const savedUser = localStorage.getItem('linguanova_user');
      const savedToken = localStorage.getItem('linguanova_token');
      
      if (savedUser && savedToken) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
        console.log('✅ Dados do usuário recarregados do localStorage:', userData);
        return userData;
      }
    } catch (error) {
      console.error('Erro ao recarregar dados do usuário:', error);
    }
    return null;
  };

  // Função para atualizar dados do usuário do servidor
  const refreshUserFromServer = async () => {
    try {
      const token = localStorage.getItem('linguanova_token');
      if (!token) {
        console.error('Token não encontrado para atualizar dados do usuário');
        return null;
      }

      const response = await authenticatedFetch('/api/auth/me');
      
      if (response.ok) {
        const result = await response.json();
        
        const userData = {
          id: result.user.id,
          name: `${result.user.firstName} ${result.user.lastName}`,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          email: result.user.email,
          profilePicture: result.user.profilePicture,
          subscription: result.user.subscription || 'free',
          createdAt: result.user.createdAt
        };
        
        // Atualizar localStorage e estado
        localStorage.setItem('linguanova_user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
        
        console.log('✅ Dados do usuário atualizados do servidor:', userData);
        return userData;
      } else {
        console.error('Erro ao buscar dados do usuário do servidor:', response.status);
      }
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário do servidor:', error);
    }
    return null;
  };

  // Função para verificar se o usuário tem uma assinatura ativa
  const hasActiveSubscription = () => {
    return user?.subscription && user.subscription !== 'free';
  };

  // Função para verificar se o usuário pode acessar conteúdo premium
  const canAccessPremiumContent = () => {
    return hasActiveSubscription();
  };

  // Função para obter o token de autenticação
  const getAuthToken = () => {
    return localStorage.getItem('linguanova_token');
  };

  // Função para fazer requisições autenticadas
  const authenticatedFetch = async (url, options = {}) => {
    const token = getAuthToken();
    
    // Se a URL não começar com http, adicionar o endereço do backend
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
    const fullUrl = url.startsWith('http') ? url : `${apiUrl}${url}`;
    
    // Preparar headers base
    const baseHeaders = {
      'Authorization': `Bearer ${token}`,
    };
    
    // Só adicionar Content-Type se não for FormData (para uploads)
    if (!(options.body instanceof FormData)) {
      baseHeaders['Content-Type'] = 'application/json';
    }
    
    const authOptions = {
      ...options,
      headers: {
        ...baseHeaders,
        ...options.headers,
      },
    };

    const response = await fetch(fullUrl, authOptions);
    
    // Se o token expirou, fazer logout
    if (response.status === 401) {
      await logout();
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    
    return response;
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    register,
    login,
    loginWithSocial,
    logout,
    updateUser,
    reloadUserFromStorage,
    refreshUserFromServer,
    hasActiveSubscription,
    canAccessPremiumContent,
    getAuthToken,
    authenticatedFetch,
    setUser,
    setIsAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
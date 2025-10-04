import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUser, setIsAuthenticated } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('🔄 AuthCallback: Iniciando processamento...');
      
      try {
        console.log('📡 AuthCallback: Fazendo requisição para session-data...');
        
        // Buscar dados da sessão no backend
        const response = await fetch('http://localhost:5001/api/auth/session-data', {
          method: 'GET',
          credentials: 'include', // Importante para incluir cookies de sessão
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('📊 AuthCallback: Response status:', response.status);
        console.log('📊 AuthCallback: Response ok:', response.ok);

        if (response.ok) {
          const authData = await response.json();
          console.log('✅ AuthCallback: Dados recebidos:', authData);
          
          const { token, refreshToken, user } = authData;

          // Armazenar tokens no localStorage
          localStorage.setItem('linguanova_token', token);
          localStorage.setItem('linguanova_refresh_token', refreshToken);

          console.log('💾 AuthCallback: Tokens armazenados no localStorage');

          // Preparar dados do usuário
          const userData = {
            id: user.id,
            name: user.name || `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            subscription: user.subscription || 'free',
            profilePicture: user.profilePicture,
            provider: user.provider,
            createdAt: user.createdAt
          };

          // Armazenar dados do usuário
          localStorage.setItem('linguanova_user', JSON.stringify(userData));

          // Atualizar contexto de autenticação diretamente
          setUser(userData);
          setIsAuthenticated(true);

          console.log('🔐 AuthCallback: Contexto de autenticação atualizado');

          // Redirecionar para a página inicial
          console.log('🔄 AuthCallback: Redirecionando para /');
          navigate('/');
        } else {
          const errorData = await response.text();
          console.error('❌ AuthCallback: Erro ao recuperar dados de autenticação:', response.status, errorData);
          navigate('/login?error=auth_failed');
        }
      } catch (error) {
        console.error('💥 AuthCallback: Erro no callback de autenticação:', error);
        navigate('/login?error=auth_failed');
      }
    };

    handleAuthCallback();
  }, [navigate, setUser, setIsAuthenticated]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column'
    }}>
      <div>Processando autenticação...</div>
      <div style={{ marginTop: '20px' }}>
        <div className="spinner" style={{
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 2s linear infinite'
        }}></div>
      </div>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AuthCallback;
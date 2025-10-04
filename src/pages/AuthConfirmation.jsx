import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLogo } from '../hooks/useImageAsset';
import './AuthConfirmation.css';

const AuthConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setIsAuthenticated } = useAuth();
  const { imageUrl: logoUrl } = useLogo();
  
  const [authData, setAuthData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAuthData = async () => {
      try {
        console.log('🔄 AuthConfirmation: Verificando token temporário...');
        
        // Verificar se há um token temporário na URL
        const urlParams = new URLSearchParams(window.location.search);
        const tempToken = urlParams.get('temp');
        
        if (tempToken) {
          try {
            // Decodificar o token temporário usando atob() (compatível com navegador)
            const decodedString = atob(tempToken);
            const decodedData = JSON.parse(decodedString);
            
            console.log('🔍 AuthConfirmation: Token decodificado:', { 
              hasToken: !!decodedData.token, 
              hasUser: !!decodedData.user, 
              timestamp: decodedData.timestamp 
            });
            
            // Verificar se o token não expirou (5 minutos)
            const tokenAge = Date.now() - decodedData.timestamp;
            if (tokenAge > 5 * 60 * 1000) {
              console.error('❌ AuthConfirmation: Token expirado. Idade:', tokenAge, 'ms');
              throw new Error('Token temporário expirado');
            }
            
            console.log('✅ AuthConfirmation: Token temporário válido');
            setAuthData(decodedData);
            
            // Limpar a URL removendo o parâmetro temp
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
            
          } catch (decodeError) {
            console.error('❌ AuthConfirmation: Erro ao decodificar token:', decodeError);
            console.error('❌ AuthConfirmation: Token recebido:', tempToken);
            setError('Token de autenticação inválido ou expirado');
          }
        } else {
          // Fallback: tentar buscar da sessão (método antigo)
          console.log('🔄 AuthConfirmation: Buscando dados de autenticação da sessão...');
          
          const response = await fetch('http://localhost:5001/api/auth/session-data', {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ AuthConfirmation: Dados recebidos da sessão:', data);
            setAuthData(data);
          } else {
            console.error('❌ AuthConfirmation: Erro ao buscar dados:', response.status);
            setError('Erro ao recuperar dados de autenticação');
          }
        }
      } catch (error) {
        console.error('💥 AuthConfirmation: Erro:', error);
        setError('Erro de conexão');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuthData();
  }, []);

  const handleConfirmLogin = () => {
    if (!authData) return;

    const { token, refreshToken, user } = authData;

    // Armazenar tokens no localStorage
    localStorage.setItem('linguanova_token', token);
    localStorage.setItem('linguanova_refresh_token', refreshToken);

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

    // Atualizar contexto de autenticação
    setUser(userData);
    setIsAuthenticated(true);

    console.log('🔐 AuthConfirmation: Login confirmado, redirecionando...');
    
    // Redirecionar para a página de destino
    const from = location.state?.from?.pathname || '/dialogues';
    navigate(from, { replace: true });
  };

  const handleCancel = () => {
    console.log('❌ AuthConfirmation: Login cancelado');
    navigate('/login', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="auth-confirmation-container">
        <div className="auth-confirmation-card">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Verificando autenticação...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !authData) {
    return (
      <div className="auth-confirmation-container">
        <div className="auth-confirmation-card">
          <div className="error-message">
            <h2>Erro na Autenticação</h2>
            <p>{error || 'Dados de autenticação não encontrados'}</p>
            <button onClick={handleCancel} className="btn-secondary">
              Voltar ao Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { user } = authData;
  const providerName = {
    google: 'Google',
    facebook: 'Facebook',
    github: 'GitHub'
  }[user.provider] || user.provider;

  return (
    <div className="auth-confirmation-container">
      <div className="auth-confirmation-card">
        <div className="logo-container">
          {logoUrl && <img src={logoUrl} alt="LinguaNova" className="logo" />}
        </div>
        
        <div className="confirmation-content">
          <h2>Confirmar Login</h2>
          <p className="confirmation-message">
            Você está prestes a fazer login com sua conta {providerName}:
          </p>
          
          <div className="user-info">
            {user.profilePicture && (
              <img 
                src={user.profilePicture} 
                alt="Profile" 
                className="profile-picture"
              />
            )}
            <div className="user-details">
              <h3>{user.firstName} {user.lastName}</h3>
              <p className="email">{user.email}</p>
              <p className="provider">via {providerName}</p>
            </div>
          </div>
          
          <div className="confirmation-actions">
            <button 
              onClick={handleConfirmLogin}
              className="btn-primary confirm-btn"
            >
              Confirmar e Continuar
            </button>
            <button 
              onClick={handleCancel}
              className="btn-secondary cancel-btn"
            >
              Cancelar
            </button>
          </div>
          
          <div className="security-note">
            <p>
              <small>
                🔒 Seus dados estão seguros. Você pode cancelar a qualquer momento.
              </small>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthConfirmation;
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import { useLogo } from '../hooks/useImageAsset';
import './AdminLogin.css';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('fortunadacultura@gmail.com');
  const [resetMessage, setResetMessage] = useState('');
  
  const { adminLogin, resetAdminPassword } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const { imageUrl: logoUrl } = useLogo();
  
  // Página para redirecionar após login (padrão: /admin/dashboard)
  const from = location.state?.from?.pathname || '/admin/dashboard';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar formulário
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Usuário é obrigatório';
    }
    
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      
      try {
        const result = await adminLogin({
          username: formData.username,
          password: formData.password
        });
        
        if (result.success) {
          navigate(from, { replace: true });
        } else {
          setErrors({ general: result.error || 'Credenciais inválidas.' });
        }
      } catch (error) {
        console.error('Erro ao fazer login admin:', error);
        setErrors({ general: 'Erro ao fazer login. Tente novamente.' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await resetAdminPassword(resetEmail);
      
      if (result.success) {
        setResetMessage('Instruções de reset enviadas para o email.');
      } else {
        setResetMessage('Erro ao enviar reset. Tente novamente.');
      }
    } catch (error) {
      setResetMessage('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-header">
          <div className="logo-section">
            <img src={logoUrl} alt="LinguaNova" className="admin-login-logo" />
            <h1>Admin Login</h1>
          </div>
          <p className="admin-login-subtitle">
            Acesso restrito para administradores
          </p>
        </div>

        {!showResetForm ? (
          <form onSubmit={handleSubmit} className="admin-login-form">
            {errors.general && (
              <div className="error-message general-error">
                {errors.general}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="username">Usuário</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={errors.username ? 'error' : ''}
                placeholder="Digite seu usuário"
                disabled={isLoading}
              />
              {errors.username && (
                <span className="error-message">{errors.username}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">Senha</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={errors.password ? 'error' : ''}
                  placeholder="Digite sua senha"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>

            <button
              type="submit"
              className="admin-login-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>

            <div className="admin-login-footer">
              <button
                type="button"
                className="forgot-password-link"
                onClick={() => setShowResetForm(true)}
                disabled={isLoading}
              >
                Esqueci minha senha
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="admin-reset-form">
            <h2>Reset de Senha</h2>
            
            {resetMessage && (
              <div className={`message ${resetMessage.includes('Erro') ? 'error-message' : 'success-message'}`}>
                {resetMessage}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="resetEmail">Email para Reset</label>
              <input
                type="email"
                id="resetEmail"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="fortunadacultura@gmail.com"
                disabled={isLoading}
                readOnly
              />
            </div>

            <div className="reset-form-buttons">
              <button
                type="submit"
                className="reset-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Enviando...' : 'Enviar Reset'}
              </button>
              
              <button
                type="button"
                className="back-btn"
                onClick={() => {
                  setShowResetForm(false);
                  setResetMessage('');
                }}
                disabled={isLoading}
              >
                Voltar ao Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
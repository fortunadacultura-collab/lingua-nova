import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLogo } from '../hooks/useImageAsset';
import SocialAuthButtons from '../components/Auth/SocialAuthButtons';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, loginWithSocial } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { imageUrl: logoUrl } = useLogo();
  
  // Página para redirecionar após login (padrão: /dialogues)
  const from = location.state?.from?.pathname || '/dialogues';

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
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
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      
      try {
        const result = await login({
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe
        });
        
        if (result.success) {
          navigate(from, { replace: true });
        } else {
          setErrors({ general: result.error || 'Email ou senha incorretos.' });
        }
      } catch (error) {
        console.error('Erro ao fazer login:', error);
        setErrors({ general: 'Erro ao fazer login. Tente novamente.' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSocialAuth = async (provider, userData, error) => {
    if (error) {
      setErrors({ general: error });
      return;
    }
    
    try {
      setIsLoading(true);
      
      const result = await loginWithSocial({
        provider,
        ...userData
      });
      
      if (result.success) {
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Erro na autenticação social:', error);
      setErrors({ general: 'Erro na autenticação. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="logo-section">
            <img src={logoUrl} alt="LinguaNova" className="login-logo" />
            <h1>Entrar</h1>
          </div>
          <p className="login-subtitle">
            Bem-vindo de volta! Continue sua jornada de aprendizado
          </p>
        </div>

        <div className="login-content">
          {/* Botões de autenticação social */}
          <SocialAuthButtons 
            onAuth={handleSocialAuth}
            mode="login"
          />

          <div className="divider">
            <span>ou</span>
          </div>

          {/* Formulário de login */}
          <form onSubmit={handleSubmit} className="login-form">
            {errors.general && (
              <div className="error-banner">
                <span className="error-icon">⚠️</span>
                {errors.general}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={errors.email ? 'error' : ''}
                placeholder="Digite seu email"
                autoComplete="email"
                required
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
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
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                />
                <span className="checkmark"></span>
                <span className="checkbox-text">Lembrar de mim</span>
              </label>
              
              <Link to="/forgot-password" className="forgot-password-link">
                Esqueceu a senha?
              </Link>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="login-submit-btn"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Não tem uma conta?{' '}
              <Link to="/signup" className="link">
                Criar conta gratuita
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Seção de benefícios */}
      <div className="benefits-section">
        <h2>Continue aprendendo com o LinguaNova</h2>
        <div className="benefits-grid">
          <div className="benefit-item">
            <div className="benefit-icon">📈</div>
            <h3>Progresso Contínuo</h3>
            <p>Retome de onde parou e continue evoluindo</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">🎯</div>
            <h3>Metas Personalizadas</h3>
            <p>Defina objetivos e acompanhe seu desenvolvimento</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">🌟</div>
            <h3>Conquistas</h3>
            <p>Desbloqueie medalhas e celebre suas vitórias</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">💬</div>
            <h3>Comunidade Ativa</h3>
            <p>Conecte-se com outros estudantes e pratique</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
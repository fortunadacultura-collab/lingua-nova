import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLogo } from '../hooks/useImageAsset';
import SocialAuthButtons from '../components/Auth/SocialAuthButtons';
import PasswordStrengthIndicator from '../components/Auth/PasswordStrengthIndicator';
import TermsModal from '../components/Legal/TermsModal';
import usePasswordStrength from '../hooks/usePasswordStrength';
import './SignUp.css';

const SignUp = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptPrivacy: false
  });
  const [errors, setErrors] = useState({});
  const { imageUrl: logoUrl } = useLogo();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  
  const { register, loginWithSocial } = useAuth();
  const navigate = useNavigate();
  const { strength, getStrengthText, getStrengthColor, getStrengthPercentage } = usePasswordStrength(formData.password);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar formulário
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Nome é obrigatório';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Sobrenome é obrigatório';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (strength < 3) {
      newErrors.password = 'Senha muito fraca. Use pelo menos 8 caracteres com letras, números e símbolos.';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }
    
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Você deve aceitar os termos de uso';
    }
    
    if (!formData.acceptPrivacy) {
      newErrors.acceptPrivacy = 'Você deve aceitar a política de privacidade';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      
      try {
        const result = await register({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          acceptTerms: formData.acceptTerms
        });
        
        if (result.success) {
          alert('Conta criada com sucesso! Bem-vindo ao LinguaNova!');
          navigate('/');
        } else {
          setErrors({ general: result.error || 'Erro ao criar conta. Tente novamente.' });
        }
      } catch (error) {
        console.error('Erro ao criar conta:', error);
        setErrors({ general: 'Erro ao criar conta. Tente novamente.' });
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
        alert(`Bem-vindo ao LinguaNova, ${result.user.name}!`);
        navigate('/');
      }
    } catch (error) {
      console.error('Erro na autenticação social:', error);
      setErrors({ general: 'Erro na autenticação. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-header">
          <div className="logo-section">
            <img src={logoUrl} alt="LinguaNova" className="signup-logo" />
            <h1>Criar Conta</h1>
          </div>
          <p className="signup-subtitle">
            Junte-se a milhares de pessoas aprendendo idiomas de forma inteligente
          </p>
        </div>

        <div className="signup-content">
          {/* Botões de autenticação social */}
          <SocialAuthButtons 
            onAuth={handleSocialAuth}
            mode="signup"
          />

          <div className="divider">
            <span>ou</span>
          </div>

          {/* Formulário de cadastro */}
          <form onSubmit={handleSubmit} className="signup-form">
            {errors.general && (
              <div className="error-banner">
                <span className="error-icon">⚠️</span>
                {errors.general}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">Nome</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={errors.firstName ? 'error' : ''}
                  placeholder="Digite seu nome"
                  autoComplete="given-name"
                  required
                />
                {errors.firstName && <span className="field-error">{errors.firstName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Sobrenome</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={errors.lastName ? 'error' : ''}
                  placeholder="Digite seu sobrenome"
                  autoComplete="family-name"
                  required
                />
                {errors.lastName && <span className="field-error">{errors.lastName}</span>}
              </div>
            </div>

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
                  placeholder="Crie uma senha segura"
                  autoComplete="new-password"
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
              
              {formData.password && (
                <PasswordStrengthIndicator 
                  password={formData.password}
                  strength={strength}
                />
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar senha</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={errors.confirmPassword ? 'error' : ''}
                placeholder="Digite a senha novamente"
                autoComplete="new-password"
                required
              />
              {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleInputChange}
                  required
                />
                <span className="checkmark"></span>
                <span className="checkbox-text">
                  Eu aceito os{' '}
                  <button 
                    type="button"
                    className="link-button"
                    onClick={() => setShowTermsModal(true)}
                  >
                    Termos de Uso
                  </button>
                </span>
              </label>
              {errors.acceptTerms && <span className="field-error">{errors.acceptTerms}</span>}
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="acceptPrivacy"
                  checked={formData.acceptPrivacy}
                  onChange={handleInputChange}
                  required
                />
                <span className="checkmark"></span>
                <span className="checkbox-text">
                  Eu aceito a{' '}
                  <button 
                    type="button"
                    className="link-button"
                    onClick={() => setShowPrivacyModal(true)}
                  >
                    Política de Privacidade
                  </button>
                </span>
              </label>
              {errors.acceptPrivacy && <span className="field-error">{errors.acceptPrivacy}</span>}
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="signup-submit-btn"
            >
              {isLoading ? 'Criando conta...' : 'Criar conta gratuita'}
            </button>
          </form>

          <div className="signup-footer">
            <p>
              Já tem uma conta?{' '}
              <Link to="/login" className="link">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Seção de benefícios */}
      <div className="benefits-section">
        <h2>Por que escolher o LinguaNova?</h2>
        <div className="benefits-grid">
          <div className="benefit-item">
            <div className="benefit-icon">🎯</div>
            <h3>Aprendizado Personalizado</h3>
            <p>Conteúdo adaptado ao seu nível e ritmo de aprendizado</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">🗣️</div>
            <h3>Diálogos Reais</h3>
            <p>Pratique conversações do dia a dia com situações autênticas</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">📱</div>
            <h3>Acesso Multiplataforma</h3>
            <p>Estude em qualquer lugar, a qualquer hora, em qualquer dispositivo</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">🏆</div>
            <h3>Progresso Gamificado</h3>
            <p>Acompanhe sua evolução com metas e conquistas motivadoras</p>
          </div>
        </div>
      </div>
      
      <TermsModal 
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        type="terms"
      />
      
      <TermsModal 
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        type="privacy"
      />
    </div>
  );
};

export default SignUp;
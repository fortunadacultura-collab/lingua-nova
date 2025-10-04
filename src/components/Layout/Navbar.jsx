import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import LanguageSelector from '../UI/LanguageSelector';
import UserAvatar from '../UI/UserAvatar';
import { useLogo } from '../../hooks/useImageAsset';
import '../../styles/layout.css';

const Navbar = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { isAdminAuthenticated } = useAdmin();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { imageUrl: logoUrl } = useLogo();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="logo">
        <Link to="/">
          <div className="linguanova-logo-container">
            <img 
               src={logoUrl} 
               alt="LinguaNova Logo" 
               className="linguanova-logo"
             />
          </div>
          <span className="logo-text">Lingua Nova</span>
        </Link>
      </div>
      
      <div className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`} id="nav-links">
        <Link 
          to="/" 
          className={isActive('/') ? 'active' : ''}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          {t('navHome', 'Home')}
        </Link>
        
        <Link 
          to="/dialogues" 
          className={isActive('/dialogues') ? 'active' : ''}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          {t('navDialogues', 'Diálogos')}
        </Link>
        
        <Link 
          to="/stories" 
          className={isActive('/stories') ? 'active' : ''}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          {t('navStories', 'Histórias')}
        </Link>
        
        {/* Link único para Flashcards */}
        <Link 
          to="/flashcards" 
          className={location.pathname.startsWith('/flashcards') ? 'active' : ''}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          {t('navFlashcards', 'Flashcards')}
        </Link>
        
        <Link 
          to="/community" 
          className={isActive('/community') ? 'active' : ''}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          {t('navCommunity', 'Comunidade')}
        </Link>
      </div>
      
      <div className="navbar-actions">
        {/* Combo Aprendendo (agora com ícone) */}
        <div className="language-icon-selector">
          <div className="icon-tooltip">
            <i className="fas fa-graduation-cap"></i>
          </div>
          <LanguageSelector type="learning" />
        </div>
        
        {/* Combo Meu Idioma (agora com ícone) */}
        <div className="language-icon-selector">
          <div className="icon-tooltip">
            <i className="fas fa-globe"></i>
          </div>
          <LanguageSelector type="interface" />
        </div>
          
        {/* Renderização condicional baseada no estado de autenticação */}
        {isAuthenticated ? (
          /* Menu do usuário autenticado */
          <div className="user-menu">
            <UserAvatar 
              user={user} 
              size="medium" 
              showName={false}
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="clickable"
              style={{ cursor: 'pointer' }}
            />
            <div className={`user-dropdown ${isUserMenuOpen ? 'show' : ''}`}>
              <div className="user-info">
                <span className="user-name">{user?.name || 'Usuário'}</span>
                <span className="user-email">{user?.email}</span>
              </div>
              <div className="user-dropdown-divider"></div>
              <div className="user-dropdown-item" onClick={() => {
                navigate('/profile');
                setIsUserMenuOpen(false);
              }}>
                <i className="fas fa-user"></i>
                <span>{t('userProfile', 'Meu Perfil')}</span>
              </div>
              <div className="user-dropdown-item" onClick={() => {
                navigate('/profile/settings');
                setIsUserMenuOpen(false);
              }}>
                <i className="fas fa-cog"></i>
                <span>{t('userSettings', 'Configurações')}</span>
              </div>
              {isAdminAuthenticated && (
                <>
                  <div className="user-dropdown-divider"></div>
                  <Link to="/admin/dashboard" className="user-dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                    <i className="fas fa-shield-alt"></i>
                    <span>Admin Dashboard</span>
                  </Link>
                </>
              )}
              <div className="user-dropdown-divider"></div>
              <div className="user-dropdown-item logout" onClick={logout}>
                <i className="fas fa-sign-out-alt"></i>
                <span>{t('logoutButton', 'Sair')}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Botão único de autenticação */
          <div className="auth-buttons single">
            <Link to="/login" className="auth-btn login-btn single" title={t('loginButton', 'Entrar')}>
              <i className="fas fa-sign-in-alt"></i>
              <span>{t('loginButton', 'Entrar')}</span>
            </Link>
          </div>
        )}
      </div>
        
      <button 
        className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`} 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </nav>
  );
};

export default Navbar;
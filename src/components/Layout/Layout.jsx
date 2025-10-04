import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useLanguage } from '../../context/LanguageContext';
import { useLogo } from '../../hooks/useImageAsset';

const Layout = ({ children }) => {
  const { loading } = useLanguage();
  const { imageUrl: logoUrl, isLoading: logoLoading } = useLogo();

  if (loading) {
    return (
      <div className="audio-loading-overlay">
        <div className="audio-loading-content">
          <div className="linguanova-loading-animation">
            <div className="linguanova-logo-container">
              <div className="linguanova-logo">
                <img src={logoUrl} alt="LinguaNova Logo" className="logo-image" />
              </div>
            </div>
            <div className="linguanova-loading-text">
              Carregando LinguaNova...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
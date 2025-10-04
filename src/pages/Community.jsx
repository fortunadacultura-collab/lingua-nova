import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import '../styles/globals.css';
import '../styles/ui.css';

const Community = () => {
  const { t } = useLanguage();
  return (
    <div className="content-container">
      <div className="page-header">
        <h1>
          <i className="fas fa-users"></i>
          {t('navCommunity', 'Comunidade')}
        </h1>
        <p>{t('communitySoon', 'Em breve! Conecte-se com outros aprendizes.')}</p>
      </div>

      <div className="toolbar" style={{ margin: '0 1rem 1rem 1rem' }}>
        <Link to="/dialogues" className="toolbar-btn">
          <i className="fas fa-comments"></i>
          <span>{t('navDialogues', 'Diálogos')}</span>
        </Link>
        <Link to="/stories" className="toolbar-btn">
          <i className="fas fa-book-open"></i>
          <span>{t('navStories', 'Histórias')}</span>
        </Link>
        <Link to="/flashcards" className="toolbar-btn">
          <i className="fas fa-layer-group"></i>
          <span>{t('navFlashcards', 'Flashcards')}</span>
        </Link>
      </div>

      <section className="tab-content">
        <div className="coming-soon">
          <h2>{t('communityWelcome', 'Bem-vindo à Comunidade')}</h2>
          <p>{t('communityDescription', 'Participe de discussões, compartilhe decks e conquistas.')}</p>
        </div>
      </section>
    </div>
  );
};

export default Community;
import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import '../styles/globals.css';
import '../styles/study.css';
import '../styles/ui.css';

const Flashcards = () => {
  const { t } = useLanguage();

  return (
    <div className="content-container study-container">
      <div className="page-title-container">
        <h1 className="page-title">{t('pageTitle_flashcards', 'Flashcards')}</h1>
      </div>

      <nav className="pill-tabs" aria-label="Flashcards sections">
        <NavLink
          to="/flashcards/my-decks"
          className={({ isActive }) => `pill-tab ${isActive ? 'active' : ''}`}
        >
          <i className="fas fa-layer-group"></i>
          <span>{t('navMyDecks', 'Meus Decks')}</span>
        </NavLink>
        <NavLink
          to="/flashcards/new-deck"
          className={({ isActive }) => `pill-tab ${isActive ? 'active' : ''}`}
        >
          <i className="fas fa-plus-circle"></i>
          <span>{t('navNewDeck', 'Novo Deck')}</span>
        </NavLink>
        <NavLink
          to="/flashcards/add-cards"
          className={({ isActive }) => `pill-tab ${isActive ? 'active' : ''}`}
        >
          <i className="fas fa-plus"></i>
          <span>{t('navAddCards', 'Adicionar Cards')}</span>
        </NavLink>
        <NavLink
          to="/flashcards/study"
          className={({ isActive }) => `pill-tab ${isActive ? 'active' : ''}`}
          aria-label={t('navStudy', 'Estudar')}
          title={t('navStudy', 'Estudar')}
        >
          <i className="fas fa-graduation-cap"></i>
          <span>{t('navStudy', 'Estudar')}</span>
        </NavLink>
        <NavLink
          to="/flashcards/import-export"
          className={({ isActive }) => `pill-tab ${isActive ? 'active' : ''}`}
        >
          <i className="fas fa-file-export"></i>
          <span>{t('navImportExport', 'Importar/Exportar')}</span>
        </NavLink>
      </nav>

      <section className="tab-content active">
        <Outlet />
      </section>

      {/* Toolbar removida para evitar duplicação; navegação central via pill-tabs */}

      <div className="metrics-bar">
        <span className="badge soft">{t('decksLabel', 'Decks')}: 0</span>
        <span className="badge soft">{t('cardsLabel', 'Cards')}: 0</span>
        <span className="badge soft">{t('sessionsLabel', 'Sessões')}: 0</span>
      </div>
    </div>
  );
};

export default Flashcards;
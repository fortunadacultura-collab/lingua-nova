import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import '../styles/globals.css';
import '../styles/study.css';
import '../styles/ui.css';

const NewDeck = () => {
  const { t } = useLanguage();

  return (
    <div className="new-deck-page">
      <div className="page-header">
        <h1>
          <i className="fas fa-plus-circle"></i>
          {t('navNewDeck', 'Novo Deck')}
        </h1>
        <p>{t('newDeckPageDesc', 'Crie um novo deck de flashcards')}</p>
      </div>
      
      <div className="content-container">
        <div className="coming-soon">
          <i className="fas fa-tools"></i>
          <h2>{t('comingSoon', 'Em breve!')}</h2>
          <p>{t('newDeckComingSoon', 'Esta página está sendo migrada para React. Em breve você poderá criar novos decks.')}</p>
        </div>
      </div>
    </div>
  );
};

export default NewDeck;
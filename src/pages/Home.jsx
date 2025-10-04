import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import '../styles/home.css';
import DialoguePlayer from '../components/DialoguePlayer';

const Home = () => {
  const { t, appData } = useLanguage();
  const [dialoguesPreview, setDialoguesPreview] = useState([]);
  const [storiesPreview, setStoriesPreview] = useState([]);
  const [flashcardsPreview, setFlashcardsPreview] = useState([]);

  const loadData = () => {
    // Mock data for demonstration
    const mockData = {
      dialogues: [
        { id: 1, title: 'Restaurant Conversation', level: 'Beginner', duration: '5 min' },
        { id: 2, title: 'Job Interview', level: 'Intermediate', duration: '8 min' },
        { id: 3, title: 'Travel Planning', level: 'Advanced', duration: '12 min' }
      ],
      stories: [
        { id: 1, title: 'The Lost Cat', level: 'Beginner', readTime: '3 min' },
        { id: 2, title: 'A Day in Paris', level: 'Intermediate', readTime: '7 min' },
        { id: 3, title: 'The Mystery Novel', level: 'Advanced', readTime: '15 min' }
      ],
      flashcards: [
        { id: 1, name: 'Basic Vocabulary', cards: 50, lastStudied: '2 days ago' },
        { id: 2, name: 'Business Terms', cards: 75, lastStudied: '1 week ago' },
        { id: 3, name: 'Travel Phrases', cards: 30, lastStudied: 'Never' }
      ]
    };
    
    setDialoguesPreview(mockData.dialogues);
    setStoriesPreview(mockData.stories);
    setFlashcardsPreview(mockData.flashcards);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title" data-translate="heroTitle">
          {t('heroTitle', 'Aprenda idiomas de forma natural e divertida')}
        </h1>
        <p className="hero-subtitle" data-translate="heroSubtitle">
          {t('heroSubtitle', 'Domine novos idiomas através de diálogos reais, histórias envolventes e flashcards inteligentes.')}
        </p>
        <div className="hero-cta">
          <button className="cta-button" data-translate="getStarted">
            {t('getStarted', 'Começar Agora')}
          </button>
          <button className="cta-button secondary" data-translate="learnMore">
            {t('learnMore', 'Saiba Mais')}
          </button>
        </div>
      </section>

      {/* Diálogos Section */}
      <section className="dialogues-section">
        <div className="container">
          <div className="feature-content">
            <DialoguePlayer isHomePage={true} />
          </div>
          <div className="feature-image">
            <div className="feature-text-top">
              <h3 className="feature-title" data-translate="featureDialoguesTitle">
                {t('featureDialoguesTitle', 'Diálogos')}
              </h3>
              <p className="feature-subtitle" data-translate="featureDialoguesSubtitle">
                {t('featureDialoguesSubtitle', 'Diálogos divertidos para praticar')}
              </p>
            </div>
            <div className="feature-icon-center">
              <i className="fas fa-comments"></i>
            </div>
            <div className="feature-actions">
              <button 
                className="btn btn-primary feature-btn"
                onClick={() => window.location.href = '/dialogues'}
                data-translate="featureDialoguesBtn"
                aria-label={t('featureDialoguesBtn', 'Mais Diálogos')}
              >
                <span>{t('featureDialoguesBtn', 'Mais Diálogos')}</span>
                <i className="fas fa-arrow-right btn-icon"></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Histórias Section */}
      <section className="stories-section">
        <div className="container">
          <div className="feature-content">
            <h3 data-translate="navStories">{t('navStories', 'Histórias')}</h3>
            <p data-translate="storiesFeatureDesc">{t('storiesFeatureDesc', 'Histórias curtas e envolventes escritas especificamente para o seu nível de aprendizado. Desenvolva vocabulário e compreensão através de narrativas cativantes.')}</p>
            <div className="feature-highlights">
              <div className="highlight-item">
                <i className="fas fa-book"></i>
                <span>Níveis adaptativos</span>
              </div>
              <div className="highlight-item">
                <i className="fas fa-bookmark"></i>
                <span>Marcadores inteligentes</span>
              </div>
              <div className="highlight-item">
                <i className="fas fa-trophy"></i>
                <span>Sistema de conquistas</span>
              </div>
            </div>
            <button className="btn btn-primary feature-btn">Ler Histórias</button>
          </div>
          <div className="feature-image">
            <div className="feature-icon-large">
              <i className="fas fa-book-open"></i>
            </div>
          </div>
        </div>
      </section>

      {/* Flashcards Section */}
      <section className="flashcards-section">
        <div className="container">
          <div className="feature-image">
            <div className="feature-icon-large">
              <i className="fas fa-layer-group"></i>
            </div>
          </div>
          <div className="feature-content">
            <h3 data-translate="navFlashcards">{t('navFlashcards', 'Flashcards')}</h3>
            <p data-translate="flashcardsFeatureDesc">{t('flashcardsFeatureDesc', 'Flashcards inteligentes que se adaptam ao seu ritmo de aprendizado e reforçam o vocabulário. Sistema de repetição espaçada para memorização eficiente.')}</p>
            <div className="feature-highlights">
              <div className="highlight-item">
                <i className="fas fa-brain"></i>
                <span>IA adaptativa</span>
              </div>
              <div className="highlight-item">
                <i className="fas fa-sync-alt"></i>
                <span>Repetição espaçada</span>
              </div>
              <div className="highlight-item">
                <i className="fas fa-mobile-alt"></i>
                <span>Estudo offline</span>
              </div>
            </div>
            <button className="btn btn-primary feature-btn">Criar Flashcards</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
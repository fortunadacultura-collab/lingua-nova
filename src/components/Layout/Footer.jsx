import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Link } from 'react-router-dom';

const Footer = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Lingua Nova</h3>
          <p data-translate="footerDescription">
            {t('footerDescription', 'Aprenda idiomas de forma natural através de diálogos, histórias e flashcards.')}
          </p>
        </div>
        <div className="footer-section">
          <h4 data-translate="footerResources">
            {t('footerResources', 'Recursos')}
          </h4>
          <ul>
            <li>
              <Link to="/dialogues" data-translate="navDialogues">
                {t('navDialogues', 'Diálogos')}
              </Link>
            </li>
            <li>
              <Link to="/stories" data-translate="navStories">
                {t('navStories', 'Histórias')}
              </Link>
            </li>
            <li>
              <Link to="/my-decks" data-translate="navFlashcards">
                {t('navFlashcards', 'Flashcards')}
              </Link>
            </li>
            <li>
              <a href="#" data-translate="navCommunity">
                {t('navCommunity', 'Comunidade')}
              </a>
            </li>
          </ul>
        </div>
        <div className="footer-section">
          <h4 data-translate="footerSupport">
            {t('footerSupport', 'Suporte')}
          </h4>
          <ul>
            <li>
              <a href="#" data-translate="footerHelp">
                {t('footerHelp', 'Ajuda')}
              </a>
            </li>
            <li>
              <a href="#" data-translate="footerContact">
                {t('footerContact', 'Contato')}
              </a>
            </li>
            <li>
              <a href="#" data-translate="footerPricing">
                {t('footerPricing', 'Preços')}
              </a>
            </li>
          </ul>
        </div>
        <div className="footer-section">
          <h4 data-translate="footerLegal">
            {t('footerLegal', 'Legal')}
          </h4>
          <ul>
            <li>
              <a href="#" data-translate="footerTerms">
                {t('footerTerms', 'Termos de Uso')}
              </a>
            </li>
            <li>
              <a href="#" data-translate="footerPrivacy">
                {t('footerPrivacy', 'Privacidade')}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {currentYear} Lingua Nova International. All rights reserved worldwide.</p>
      </div>

      <style>{`
        .footer {
          background: var(--dark);
          color: white;
          padding: 2rem 0 1rem;
          margin-top: auto;
        }

        .footer-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .footer-section h3,
        .footer-section h4 {
          margin-bottom: 1rem;
          color: var(--accent);
        }

        .footer-section ul {
          list-style: none;
          padding: 0;
        }

        .footer-section ul li {
          margin-bottom: 0.5rem;
        }

        .footer-section a {
          color: var(--light);
          text-decoration: none;
          transition: color 0.3s;
        }

        .footer-section a:hover {
          color: var(--accent);
        }

        .footer-bottom {
          text-align: center;
          padding-top: 2rem;
          margin-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </footer>
  );
};

export default Footer;
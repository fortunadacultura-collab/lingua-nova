import { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Hook personalizado para aplicar traduções automáticas aos elementos com data-translate
 * Mantém compatibilidade com o modelo original que usava atributos data-translate
 */
export const useTranslation = () => {
  const { nativeLanguage, appData, t } = useLanguage();
  
  // Return the t function from context
  const translationFunction = t || ((key) => key);

  useEffect(() => {
    // Aplicar traduções aos elementos com data-translate (compatibilidade com modelo original)
    const applyTranslations = () => {
      if (!appData?.translations?.[nativeLanguage]) {
        return;
      }

      const translations = appData.translations[nativeLanguage];
      let elementsTranslated = 0;

      document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[key]) {
          element.textContent = translations[key];
          elementsTranslated++;
        }
      });

      console.log(`✅ [useTranslation] ${elementsTranslated} elementos traduzidos para ${nativeLanguage}`);

      // Atualizar título da página se existir
      const pageTitle = document.querySelector('title');
      if (pageTitle && translations['pageTitle']) {
        const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
        if (translations[`pageTitle_${currentPage}`]) {
          pageTitle.textContent = translations[`pageTitle_${currentPage}`];
        } else if (translations['pageTitle']) {
          pageTitle.textContent = translations['pageTitle'];
        }
      }
    };

    // Aplicar traduções quando o idioma mudar
    applyTranslations();

    // Observar mudanças no DOM para aplicar traduções em novos elementos
    const observer = new MutationObserver((mutations) => {
      let shouldApplyTranslations = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.hasAttribute && node.hasAttribute('data-translate') || 
                  node.querySelector && node.querySelector('[data-translate]')) {
                shouldApplyTranslations = true;
              }
            }
          });
        } else if (mutation.type === 'attributes' && mutation.attributeName === 'data-translate') {
          shouldApplyTranslations = true;
        }
      });
      
      if (shouldApplyTranslations) {
        applyTranslations();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-translate']
    });

    return () => {
      observer.disconnect();
    };
  }, [nativeLanguage, appData]);

  return translationFunction;
};

export default useTranslation;
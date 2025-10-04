import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from 'react';
import imageWatcher from '../utils/imageWatcher';
import logo3 from '../assets/images/logo/logo3.svg';
import logoFallback from '../assets/images/logo/logo.svg';

/**
 * Hook personalizado para gerenciar assets de imagem com cache busting automático
 * Garante que as imagens sejam atualizadas automaticamente quando modificadas
 */
const useImageAsset = (imagePath, options = {}) => {
  const [timestamp, setTimestamp] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const {
    enableCacheBusting = true,
    refreshInterval = 30000, // 30 segundos
    fallbackImage = null
  } = options;

  // Gerar URL com cache busting
  const imageUrl = useMemo(() => {
    if (!imagePath) return fallbackImage;
    
    const baseUrl = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    
    if (enableCacheBusting) {
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}v=${timestamp}`;
    }
    
    return baseUrl;
  }, [imagePath, timestamp, enableCacheBusting, fallbackImage]);

  // Verificar se a imagem existe e foi modificada
  const checkImageUpdate = async () => {
    if (!imagePath) return;
    
    try {
      const response = await fetch(imagePath, { method: 'HEAD' });
      if (response.ok) {
        const lastModified = response.headers.get('Last-Modified');
        if (lastModified) {
          const modifiedTime = new Date(lastModified).getTime();
          if (modifiedTime > timestamp) {
            setTimestamp(modifiedTime);
          }
        }
        setError(null);
      } else {
        throw new Error(`Image not found: ${response.status}`);
      }
    } catch (err) {
      console.warn(`Failed to check image update for ${imagePath}:`, err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Forçar atualização da imagem
  const refreshImage = () => {
    setTimestamp(Date.now());
    setIsLoading(true);
    checkImageUpdate();
  };

  // Verificar atualizações periodicamente
  useEffect(() => {
    if (!enableCacheBusting || !refreshInterval) return;
    
    // Verificação inicial
    checkImageUpdate();
    
    // Configurar file watcher
    const handleImageChange = (changedPath) => {
      if (changedPath === imagePath) {
        console.log(`🔄 Imagem ${imagePath} foi alterada, atualizando...`);
        refreshImage();
      }
    };
    
    imageWatcher.watchImage(imagePath, handleImageChange);
    
    // Verificar atualizações periodicamente como fallback
    const interval = setInterval(checkImageUpdate, refreshInterval);
    
    return () => {
      clearInterval(interval);
      imageWatcher.unwatchImage(imagePath, handleImageChange);
    };
  }, [imagePath, enableCacheBusting, refreshInterval]);

  // Verificar quando a aba volta ao foco (para detectar mudanças externas)
  useEffect(() => {
    const handleFocus = () => {
      if (enableCacheBusting) {
        checkImageUpdate();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [enableCacheBusting]);

  return {
    imageUrl,
    isLoading,
    error,
    refreshImage,
    timestamp
  };
};

export default useImageAsset;

/**
 * Hook específico para o logo da aplicação
 * Pré-configurado com as melhores práticas para o logo3.svg
 */
export const useLogo = (options = {}) => {
  return {
    imageUrl: logo3,
    isLoading: false,
    error: null,
    refreshImage: () => {},
    timestamp: Date.now()
  };
};

/**
 * Hook para imagens de bandeiras
 * Otimizado para as bandeiras dos idiomas usando import dinâmico
 */
export const useFlagImage = (countryCode, options = {}) => {
  const [flagImage, setFlagImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!countryCode) {
      setFlagImage(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Import dinâmico da bandeira
    import(`../assets/images/flags/${countryCode}.svg`)
      .then((module) => {
        setFlagImage(module.default);
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn(`Bandeira não encontrada: ${countryCode}.svg`);
        setError(err);
        setFlagImage(null);
        setIsLoading(false);
      });
  }, [countryCode]);

  return {
    imageUrl: flagImage,
    isLoading,
    error,
    refreshImage: () => {},
    timestamp: Date.now()
  };
};

/**
 * Utilitário para invalidar cache de todas as imagens
 * Útil para forçar atualização global
 */
export const invalidateImageCache = () => {
  // Disparar evento customizado para todos os hooks
  window.dispatchEvent(new CustomEvent('invalidate-image-cache', {
    detail: { timestamp: Date.now() }
  }));
};

/**
 * Provider de contexto para gerenciar estado global de imagens
 * Permite coordenação entre múltiplos hooks
 */

const ImageAssetContext = createContext();

export const ImageAssetProvider = ({ children }) => {
  const [globalTimestamp, setGlobalTimestamp] = useState(Date.now());
  
  const refreshAllImages = () => {
    const newTimestamp = Date.now();
    setGlobalTimestamp(newTimestamp);
    invalidateImageCache();
  };
  
  return (
    <ImageAssetContext.Provider value={{
      globalTimestamp,
      refreshAllImages
    }}>
      {children}
    </ImageAssetContext.Provider>
  );
};

export const useImageAssetContext = () => {
  const context = useContext(ImageAssetContext);
  if (!context) {
    throw new Error('useImageAssetContext must be used within ImageAssetProvider');
  }
  return context;
};
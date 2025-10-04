import React, { useState, useEffect, useCallback } from 'react';
import './UserAvatar.css';
import avatarCache from '../../utils/avatarCache';

const UserAvatar = ({ 
  user, 
  size = 'medium', 
  showName = false, 
  onClick = null,
  className = '',
  style = {},
  onImageLoad,
  onImageError,
  enableCache = true,
  fallbackOptions = {}
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [cachedImageUrl, setCachedImageUrl] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const { name, profilePicture } = user || {};

  // Opções de fallback configuráveis
  const defaultFallbackOptions = {
    showInitials: true,
    showPlaceholder: true,
    customPlaceholder: null,
    retryOnError: true,
    ...fallbackOptions
  };
  const sizeClasses = {
    small: 'user-avatar-small',
    medium: 'user-avatar-medium',
    large: 'user-avatar-large'
  };

  /**
   * Gera iniciais do nome do usuário
   */
  const generateInitials = useCallback((fullName) => {
    if (!fullName || typeof fullName !== 'string') return '?';
    
    const names = fullName.trim().split(' ').filter(n => n.length > 0);
    if (names.length === 0) return '?';
    
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }, []);

  /**
   * Verifica se é URL do Google
   */
  const isGoogleUrl = useCallback((url) => {
    return avatarCache.isGoogleAvatarUrl(url);
  }, []);

  /**
   * Constrói URL da imagem com tratamento especial para diferentes tipos
   */
  const buildImageUrl = useCallback((url) => {
    if (!url) return null;
    
    // URLs do Google não precisam de timestamp
    if (isGoogleUrl(url)) {
      return url;
    }
    
    // URLs locais recebem timestamp para evitar cache
    if (url.startsWith('/') || url.startsWith('./')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}t=${Date.now()}`;
    }
    
    return url;
  }, [isGoogleUrl]);

  /**
   * Carrega imagem com cache e retry
   */
  const loadImageWithCache = useCallback(async () => {
    if (!profilePicture || !enableCache) return;

    try {
      setImageLoading(true);
      const userId = user?.id || user?.email || 'anonymous';
      const cachedUrl = await avatarCache.getCachedImageUrl(profilePicture, userId);
      
      if (cachedUrl && cachedUrl !== profilePicture) {
        setCachedImageUrl(cachedUrl);
      }
    } catch (error) {
      console.warn('Falha no cache do avatar:', error);
    } finally {
      setImageLoading(false);
    }
  }, [profilePicture, enableCache, user]);

  /**
   * Manipula erro de carregamento com retry
   */
  const handleImageError = useCallback((event) => {
    console.error('Erro ao carregar avatar:', {
      src: event.target?.src,
      user: user?.name,
      retryCount,
      profilePicture
    });

    if (defaultFallbackOptions.retryOnError && retryCount < maxRetries) {
      // Tentar novamente após delay
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setImageError(false);
        
        // Forçar reload da imagem
        if (event.target) {
          const currentSrc = event.target.src;
          event.target.src = '';
          setTimeout(() => {
            event.target.src = currentSrc;
          }, 100);
        }
      }, Math.pow(2, retryCount) * 1000); // Delay exponencial
    } else {
      setImageError(true);
    }

    if (onImageError) {
      onImageError(event);
    }
  }, [retryCount, maxRetries, defaultFallbackOptions.retryOnError, onImageError, user, profilePicture]);

  /**
   * Manipula carregamento bem-sucedido
   */
  const handleImageLoad = useCallback((event) => {
    setImageError(false);
    setImageLoading(false);
    setRetryCount(0);

    // Garantir visibilidade da imagem
    if (event.target) {
      event.target.style.opacity = '1';
      event.target.style.visibility = 'visible';
    }

    if (onImageLoad) {
      onImageLoad(event);
    }
  }, [onImageLoad]);

  // Carregar imagem com cache quando profilePicture muda
  useEffect(() => {
    if (profilePicture && enableCache) {
      loadImageWithCache();
    }
  }, [profilePicture, loadImageWithCache, enableCache]);

  // Reset states quando user muda
  useEffect(() => {
    setImageError(false);
    setImageLoading(true);
    setRetryCount(0);
    setCachedImageUrl(null);
  }, [user?.id, user?.email, profilePicture]);

  const avatarClass = `user-avatar ${sizeClasses[size]} ${className}`;

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  // Determinar qual URL usar
  const imageUrl = cachedImageUrl || buildImageUrl(profilePicture);
  
  // Determinar se deve mostrar imagem ou fallback
  const shouldShowImage = imageUrl && !imageError;
  const shouldShowInitials = !shouldShowImage && defaultFallbackOptions.showInitials;
  const shouldShowPlaceholder = !shouldShowImage && !shouldShowInitials && defaultFallbackOptions.showPlaceholder;

  // Classes CSS
  const containerClass = `user-avatar-container user-avatar-${size} ${className}`.trim();
  const avatarClassUpdated = `user-avatar ${imageLoading ? 'loading' : ''}`.trim();
  const initialsClass = `avatar-initials ${!shouldShowInitials ? 'hidden' : ''}`.trim();

  const renderAvatarContent = () => {
    return (
      <>
        {shouldShowImage && (
          <img
            src={imageUrl}
            alt={`Avatar de ${name || user?.name || user?.firstName || 'Usuário'}`}
            className="avatar-image"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              display: 'block !important',
              opacity: '1 !important',
              visibility: 'visible !important'
            }}
          />
        )}
        
        {shouldShowInitials && (
          <span className={`avatar-initials ${sizeClasses[size]} visible`}>
            {generateInitials(name || user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim())}
          </span>
        )}
        
        {shouldShowPlaceholder && (
          <div className={avatarClassUpdated}>
            {defaultFallbackOptions.customPlaceholder || (
              <span className="avatar-placeholder">👤</span>
            )}
          </div>
        )}
        
        {imageLoading && shouldShowImage && (
          <div className="avatar-loading">
            <span>⏳</span>
          </div>
        )}
      </>
    );
  };

  return (
    <div className={containerClass} data-testid="user-avatar-container">
      <div 
        className={avatarClass}
        onClick={handleClick}
        style={{
          cursor: onClick ? 'pointer' : 'default',
          ...style
        }}
        title={user?.name || user?.firstName || 'Usuário'}
      >
        {renderAvatarContent()}
      </div>
      {showName && (
        <span className="user-avatar-name">
          {user?.name || user?.firstName || 'Usuário'}
        </span>
      )}
    </div>
  );
};

export default UserAvatar;
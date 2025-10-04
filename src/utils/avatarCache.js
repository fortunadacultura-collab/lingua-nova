/**
 * Sistema de Cache Robusto para Avatars
 * Previne problemas de carregamento e melhora a performance
 */

class AvatarCache {
  constructor() {
    this.cache = new Map();
    this.loadingPromises = new Map();
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutos
  }

  /**
   * Gera uma chave única para o cache baseada na URL e timestamp
   */
  generateCacheKey(url, userId) {
    return `avatar_${userId}_${btoa(url).replace(/[^a-zA-Z0-9]/g, '')}`;
  }

  /**
   * Verifica se uma URL é do Google OAuth
   */
  isGoogleAvatarUrl(url) {
    return url && (
      url.includes('googleusercontent.com') ||
      url.includes('lh3.googleusercontent.com') ||
      url.includes('lh4.googleusercontent.com') ||
      url.includes('lh5.googleusercontent.com')
    );
  }

  /**
   * Pré-carrega uma imagem e a armazena no cache
   */
  async preloadImage(url, userId) {
    if (!url) return null;

    const cacheKey = this.generateCacheKey(url, userId);
    
    // Verificar se já está no cache e ainda é válido
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.blob;
    }

    // Verificar se já está sendo carregado
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey);
    }

    // Iniciar carregamento
    const loadingPromise = this.loadImageWithRetry(url, cacheKey);
    this.loadingPromises.set(cacheKey, loadingPromise);

    try {
      const result = await loadingPromise;
      this.loadingPromises.delete(cacheKey);
      return result;
    } catch (error) {
      this.loadingPromises.delete(cacheKey);
      console.error(`Falha ao carregar avatar ${url}:`, error);
      return null;
    }
  }

  /**
   * Carrega imagem com sistema de retry
   */
  async loadImageWithRetry(url, cacheKey) {
    const retryCount = this.retryAttempts.get(cacheKey) || 0;

    try {
      const blob = await this.fetchImageBlob(url);
      
      // Armazenar no cache
      this.cache.set(cacheKey, {
        blob,
        timestamp: Date.now(),
        url
      });

      // Resetar contador de retry
      this.retryAttempts.delete(cacheKey);
      
      return blob;
    } catch (error) {
      if (retryCount < this.maxRetries) {
        this.retryAttempts.set(cacheKey, retryCount + 1);
        
        // Delay exponencial para retry
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.loadImageWithRetry(url, cacheKey);
      } else {
        this.retryAttempts.delete(cacheKey);
        throw error;
      }
    }
  }

  /**
   * Faz o fetch da imagem e retorna como blob
   */
  async fetchImageBlob(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit',
        referrerPolicy: 'no-referrer'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // Verificar se é uma imagem válida
      if (!blob.type.startsWith('image/')) {
        throw new Error('Resposta não é uma imagem válida');
      }

      return blob;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Obtém URL do cache ou carrega se necessário
   */
  async getCachedImageUrl(originalUrl, userId) {
    if (!originalUrl) return null;

    try {
      const blob = await this.preloadImage(originalUrl, userId);
      if (blob) {
        return URL.createObjectURL(blob);
      }
    } catch (error) {
      console.warn(`Cache falhou para ${originalUrl}, usando URL original:`, error);
    }

    return originalUrl;
  }

  /**
   * Limpa cache expirado
   */
  cleanExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        // Revogar URL do blob para liberar memória
        if (value.blob) {
          URL.revokeObjectURL(value.blob);
        }
        this.cache.delete(key);
      }
    }
  }

  /**
   * Limpa todo o cache
   */
  clearCache() {
    // Revogar todas as URLs de blob
    for (const [key, value] of this.cache.entries()) {
      if (value.blob) {
        URL.revokeObjectURL(value.blob);
      }
    }
    
    this.cache.clear();
    this.loadingPromises.clear();
    this.retryAttempts.clear();
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      loadingCount: this.loadingPromises.size,
      retryCount: this.retryAttempts.size
    };
  }
}

// Instância singleton
const avatarCache = new AvatarCache();

// Limpeza automática do cache a cada 5 minutos
setInterval(() => {
  avatarCache.cleanExpiredCache();
}, 5 * 60 * 1000);

// Limpeza ao descarregar a página
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    avatarCache.clearCache();
  });
}

export default avatarCache;
/**
 * File Watcher para detectar mudanças em imagens
 * Monitora a pasta de assets e notifica quando imagens são alteradas
 */

class ImageWatcher {
  constructor() {
    this.watchers = new Map();
    this.callbacks = new Set();
    this.isWatching = false;
  }

  /**
   * Inicia o monitoramento de uma imagem específica
   * @param {string} imagePath - Caminho da imagem a ser monitorada
   * @param {Function} callback - Função a ser chamada quando a imagem mudar
   */
  watchImage(imagePath, callback) {
    if (!this.watchers.has(imagePath)) {
      this.watchers.set(imagePath, new Set());
    }
    
    this.watchers.get(imagePath).add(callback);
    this.callbacks.add(callback);
    
    if (!this.isWatching) {
      this.startWatching();
    }
  }

  /**
   * Para de monitorar uma imagem específica
   * @param {string} imagePath - Caminho da imagem
   * @param {Function} callback - Callback a ser removido
   */
  unwatchImage(imagePath, callback) {
    if (this.watchers.has(imagePath)) {
      this.watchers.get(imagePath).delete(callback);
      this.callbacks.delete(callback);
      
      if (this.watchers.get(imagePath).size === 0) {
        this.watchers.delete(imagePath);
      }
    }
    
    if (this.watchers.size === 0) {
      this.stopWatching();
    }
  }

  /**
   * Inicia o monitoramento geral
   */
  startWatching() {
    if (this.isWatching) return;
    
    this.isWatching = true;
    
    // Usar polling para verificar mudanças nas imagens
    this.pollInterval = setInterval(() => {
      this.checkForChanges();
    }, 2000); // Verificar a cada 2 segundos
    
    console.log('🔍 Image watcher iniciado');
  }

  /**
   * Para o monitoramento
   */
  stopWatching() {
    if (!this.isWatching) return;
    
    this.isWatching = false;
    
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    
    console.log('⏹️ Image watcher parado');
  }

  /**
   * Verifica se houve mudanças nas imagens monitoradas
   */
  async checkForChanges() {
    for (const [imagePath, callbacks] of this.watchers) {
      try {
        // Criar uma nova URL com timestamp para forçar reload
        const testUrl = `${imagePath}?t=${Date.now()}`;
        
        // Tentar carregar a imagem para verificar se existe/mudou
        const response = await fetch(testUrl, { 
          method: 'HEAD',
          cache: 'no-cache'
        });
        
        if (response.ok) {
          const lastModified = response.headers.get('last-modified');
          const etag = response.headers.get('etag');
          
          // Verificar se a imagem mudou comparando headers
          const imageKey = `${imagePath}_metadata`;
          const storedMetadata = sessionStorage.getItem(imageKey);
          const currentMetadata = JSON.stringify({ lastModified, etag });
          
          if (storedMetadata && storedMetadata !== currentMetadata) {
            console.log(`🔄 Imagem alterada detectada: ${imagePath}`);
            
            // Notificar todos os callbacks para esta imagem
            callbacks.forEach(callback => {
              try {
                callback(imagePath);
              } catch (error) {
                console.error('Erro ao executar callback do image watcher:', error);
              }
            });
          }
          
          // Atualizar metadata armazenada
          sessionStorage.setItem(imageKey, currentMetadata);
        }
      } catch (error) {
        // Silenciosamente ignorar erros de rede
        // console.warn(`Erro ao verificar imagem ${imagePath}:`, error);
      }
    }
  }

  /**
   * Força a verificação de mudanças em todas as imagens
   */
  forceCheck() {
    this.checkForChanges();
  }

  /**
   * Limpa todos os watchers
   */
  clear() {
    this.stopWatching();
    this.watchers.clear();
    this.callbacks.clear();
  }
}

// Instância singleton
const imageWatcher = new ImageWatcher();

// Limpar watchers quando a página for descarregada
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    imageWatcher.clear();
  });
}

export default imageWatcher;
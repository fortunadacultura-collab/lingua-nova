/**
 * Sistema de Logs Detalhados para Avatars
 * Facilita debug e monitoramento de problemas
 */

class AvatarLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 100;
    this.isDebugMode = process.env.NODE_ENV === 'development';
  }

  /**
   * Adiciona um log com timestamp e contexto
   */
  addLog(level, message, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    };

    this.logs.push(logEntry);

    // Manter apenas os últimos logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Log no console em modo debug
    if (this.isDebugMode) {
      const consoleMethod = this.getConsoleMethod(level);
      consoleMethod(`[Avatar ${level.toUpperCase()}] ${message}`, context);
    }

    // Enviar logs críticos para monitoramento (se configurado)
    if (level === 'error' && this.shouldReportError(context)) {
      this.reportError(logEntry);
    }
  }

  /**
   * Obtém método do console baseado no nível
   */
  getConsoleMethod(level) {
    switch (level) {
      case 'error': return console.error;
      case 'warn': return console.warn;
      case 'info': return console.info;
      case 'debug': return console.debug;
      default: return console.log;
    }
  }

  /**
   * Verifica se deve reportar erro para monitoramento
   */
  shouldReportError(context) {
    // Não reportar erros de desenvolvimento
    if (this.isDebugMode) return false;

    // Não reportar erros muito frequentes do mesmo tipo
    const recentSimilarErrors = this.logs
      .filter(log => 
        log.level === 'error' && 
        Date.now() - new Date(log.timestamp).getTime() < 60000 && // últimos 60s
        log.context.errorType === context.errorType
      );

    return recentSimilarErrors.length < 3;
  }

  /**
   * Reporta erro para sistema de monitoramento
   */
  reportError(logEntry) {
    // Implementar integração com sistema de monitoramento
    // Por exemplo: Sentry, LogRocket, etc.
    console.warn('Erro crítico de avatar reportado:', logEntry);
  }

  /**
   * Logs específicos para diferentes eventos
   */
  logImageLoadStart(url, userId, context = {}) {
    this.addLog('info', 'Iniciando carregamento de avatar', {
      url,
      userId,
      isGoogleUrl: url?.includes('googleusercontent.com'),
      ...context
    });
  }

  logImageLoadSuccess(url, userId, loadTime, context = {}) {
    this.addLog('info', 'Avatar carregado com sucesso', {
      url,
      userId,
      loadTime,
      isGoogleUrl: url?.includes('googleusercontent.com'),
      ...context
    });
  }

  logImageLoadError(url, userId, error, retryCount = 0, context = {}) {
    this.addLog('error', 'Falha ao carregar avatar', {
      url,
      userId,
      error: error.message || error,
      retryCount,
      isGoogleUrl: url?.includes('googleusercontent.com'),
      errorType: 'image_load_failed',
      ...context
    });
  }

  logCacheHit(url, userId, context = {}) {
    this.addLog('debug', 'Cache hit para avatar', {
      url,
      userId,
      ...context
    });
  }

  logCacheMiss(url, userId, context = {}) {
    this.addLog('debug', 'Cache miss para avatar', {
      url,
      userId,
      ...context
    });
  }

  logCacheError(url, userId, error, context = {}) {
    this.addLog('warn', 'Erro no cache de avatar', {
      url,
      userId,
      error: error.message || error,
      errorType: 'cache_error',
      ...context
    });
  }

  logFallbackUsed(userId, fallbackType, reason, context = {}) {
    this.addLog('info', 'Fallback de avatar usado', {
      userId,
      fallbackType,
      reason,
      ...context
    });
  }

  logValidationError(url, userId, validationError, context = {}) {
    this.addLog('warn', 'Erro de validação de avatar', {
      url,
      userId,
      validationError,
      errorType: 'validation_error',
      ...context
    });
  }

  logPerformanceMetric(metric, value, context = {}) {
    this.addLog('debug', `Performance: ${metric}`, {
      metric,
      value,
      unit: 'ms',
      ...context
    });
  }

  /**
   * Obtém estatísticas dos logs
   */
  getStats() {
    const now = Date.now();
    const last24h = this.logs.filter(log => 
      now - new Date(log.timestamp).getTime() < 24 * 60 * 60 * 1000
    );

    const stats = {
      total: this.logs.length,
      last24h: last24h.length,
      byLevel: {},
      errorTypes: {},
      googleUrlErrors: 0,
      localUrlErrors: 0
    };

    // Contar por nível
    this.logs.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      
      if (log.level === 'error') {
        if (log.context.errorType) {
          stats.errorTypes[log.context.errorType] = 
            (stats.errorTypes[log.context.errorType] || 0) + 1;
        }
        
        if (log.context.isGoogleUrl) {
          stats.googleUrlErrors++;
        } else {
          stats.localUrlErrors++;
        }
      }
    });

    return stats;
  }

  /**
   * Exporta logs para análise
   */
  exportLogs(format = 'json') {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    }
    
    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'message', 'url', 'userId', 'error'];
      const rows = this.logs.map(log => [
        log.timestamp,
        log.level,
        log.message,
        log.context.url || '',
        log.context.userId || '',
        log.context.error || ''
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return this.logs;
  }

  /**
   * Limpa logs antigos
   */
  clearOldLogs(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 dias
    const cutoff = Date.now() - maxAge;
    this.logs = this.logs.filter(log => 
      new Date(log.timestamp).getTime() > cutoff
    );
  }

  /**
   * Obtém logs recentes para debug
   */
  getRecentLogs(count = 20) {
    return this.logs.slice(-count);
  }

  /**
   * Obtém logs de erro para análise
   */
  getErrorLogs() {
    return this.logs.filter(log => log.level === 'error');
  }
}

// Instância singleton
const avatarLogger = new AvatarLogger();

// Limpeza automática de logs antigos a cada hora
setInterval(() => {
  avatarLogger.clearOldLogs();
}, 60 * 60 * 1000);

// Expor no window para debug em desenvolvimento
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.avatarLogger = avatarLogger;
}

export default avatarLogger;
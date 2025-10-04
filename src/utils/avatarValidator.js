/**
 * Sistema de Validação para Avatars
 * Valida URLs, formatos e dados de avatar
 */

import avatarLogger from './avatarLogger';

class AvatarValidator {
  constructor() {
    this.allowedDomains = [
      'googleusercontent.com',
      'lh3.googleusercontent.com',
      'lh4.googleusercontent.com',
      'lh5.googleusercontent.com',
      'graph.facebook.com',
      'platform-lookaside.fbsbx.com',
      'avatars.githubusercontent.com',
      'secure.gravatar.com'
    ];

    this.allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.minDimensions = { width: 32, height: 32 };
    this.maxDimensions = { width: 2048, height: 2048 };
  }

  /**
   * Valida URL de avatar
   */
  validateUrl(url, userId = null) {
    const context = { url, userId };

    try {
      // Verificar se URL existe
      if (!url || typeof url !== 'string') {
        avatarLogger.logValidationError(url, userId, 'URL vazia ou inválida', context);
        return { valid: false, error: 'URL vazia ou inválida' };
      }

      // Remover espaços em branco
      url = url.trim();

      // Verificar se é URL válida
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch (error) {
        // Se não é URL absoluta, pode ser relativa
        if (url.startsWith('/') || url.startsWith('./')) {
          return { valid: true, url, type: 'local' };
        }
        
        avatarLogger.logValidationError(url, userId, 'URL malformada', { ...context, error: error.message });
        return { valid: false, error: 'URL malformada' };
      }

      // Verificar protocolo
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        avatarLogger.logValidationError(url, userId, 'Protocolo não permitido', { ...context, protocol: parsedUrl.protocol });
        return { valid: false, error: 'Protocolo não permitido' };
      }

      // Verificar domínio para URLs externas
      const isAllowedDomain = this.allowedDomains.some(domain => 
        parsedUrl.hostname.includes(domain)
      );

      if (!isAllowedDomain && parsedUrl.protocol === 'https:') {
        avatarLogger.logValidationError(url, userId, 'Domínio não permitido', { 
          ...context, 
          hostname: parsedUrl.hostname,
          allowedDomains: this.allowedDomains 
        });
        return { valid: false, error: 'Domínio não permitido' };
      }

      // Verificar extensão de arquivo
      const pathname = parsedUrl.pathname.toLowerCase();
      const hasValidExtension = this.allowedExtensions.some(ext => 
        pathname.endsWith(ext)
      );

      // URLs do Google OAuth podem não ter extensão visível
      const isGoogleUrl = parsedUrl.hostname.includes('googleusercontent.com');
      
      if (!hasValidExtension && !isGoogleUrl && !pathname.includes('/avatar/')) {
        avatarLogger.logValidationError(url, userId, 'Extensão de arquivo não permitida', { 
          ...context, 
          pathname,
          allowedExtensions: this.allowedExtensions 
        });
        return { valid: false, error: 'Extensão de arquivo não permitida' };
      }

      // Determinar tipo de URL
      const type = isGoogleUrl ? 'google' : 
                   parsedUrl.hostname.includes('facebook') ? 'facebook' :
                   parsedUrl.hostname.includes('github') ? 'github' :
                   parsedUrl.hostname.includes('gravatar') ? 'gravatar' :
                   'external';

      return { valid: true, url, type, parsedUrl };

    } catch (error) {
      avatarLogger.logValidationError(url, userId, 'Erro inesperado na validação', { 
        ...context, 
        error: error.message 
      });
      return { valid: false, error: 'Erro inesperado na validação' };
    }
  }

  /**
   * Valida dados do usuário para avatar
   */
  validateUserData(user) {
    const errors = [];
    const warnings = [];

    if (!user) {
      errors.push('Dados do usuário não fornecidos');
      return { valid: false, errors, warnings };
    }

    // Validar nome para iniciais
    if (!user.name && !user.firstName && !user.lastName) {
      warnings.push('Nome do usuário não disponível para gerar iniciais');
    }

    // Validar profilePicture
    if (user.profilePicture) {
      const urlValidation = this.validateUrl(user.profilePicture, user.id || user.email);
      if (!urlValidation.valid) {
        errors.push(`URL do avatar inválida: ${urlValidation.error}`);
      }
    }

    // Validar ID do usuário
    if (!user.id && !user.email) {
      warnings.push('ID do usuário não disponível para cache');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valida imagem carregada
   */
  async validateImage(imageElement, url, userId = null) {
    const context = { url, userId };

    try {
      if (!imageElement || !imageElement.naturalWidth) {
        avatarLogger.logValidationError(url, userId, 'Imagem não carregada ou inválida', context);
        return { valid: false, error: 'Imagem não carregada ou inválida' };
      }

      const { naturalWidth: width, naturalHeight: height } = imageElement;

      // Verificar dimensões mínimas
      if (width < this.minDimensions.width || height < this.minDimensions.height) {
        avatarLogger.logValidationError(url, userId, 'Imagem muito pequena', { 
          ...context, 
          dimensions: { width, height },
          minDimensions: this.minDimensions 
        });
        return { valid: false, error: 'Imagem muito pequena' };
      }

      // Verificar dimensões máximas
      if (width > this.maxDimensions.width || height > this.maxDimensions.height) {
        avatarLogger.logValidationError(url, userId, 'Imagem muito grande', { 
          ...context, 
          dimensions: { width, height },
          maxDimensions: this.maxDimensions 
        });
        return { valid: false, error: 'Imagem muito grande' };
      }

      // Verificar aspect ratio (deve ser aproximadamente quadrada para avatars)
      const aspectRatio = width / height;
      if (aspectRatio < 0.5 || aspectRatio > 2.0) {
        avatarLogger.logValidationError(url, userId, 'Proporção da imagem inadequada', { 
          ...context, 
          dimensions: { width, height },
          aspectRatio 
        });
        return { valid: false, error: 'Proporção da imagem inadequada para avatar' };
      }

      return { 
        valid: true, 
        dimensions: { width, height },
        aspectRatio 
      };

    } catch (error) {
      avatarLogger.logValidationError(url, userId, 'Erro ao validar imagem', { 
        ...context, 
        error: error.message 
      });
      return { valid: false, error: 'Erro ao validar imagem' };
    }
  }

  /**
   * Valida tamanho de arquivo (para uploads)
   */
  validateFileSize(file) {
    if (!file) {
      return { valid: false, error: 'Arquivo não fornecido' };
    }

    if (file.size > this.maxFileSize) {
      return { 
        valid: false, 
        error: `Arquivo muito grande. Máximo: ${this.maxFileSize / 1024 / 1024}MB` 
      };
    }

    return { valid: true };
  }

  /**
   * Valida tipo de arquivo
   */
  validateFileType(file) {
    if (!file) {
      return { valid: false, error: 'Arquivo não fornecido' };
    }

    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ];

    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: `Tipo de arquivo não permitido: ${file.type}` 
      };
    }

    return { valid: true };
  }

  /**
   * Validação completa de arquivo de upload
   */
  validateUploadFile(file) {
    const sizeValidation = this.validateFileSize(file);
    if (!sizeValidation.valid) return sizeValidation;

    const typeValidation = this.validateFileType(file);
    if (!typeValidation.valid) return typeValidation;

    return { valid: true };
  }

  /**
   * Sanitiza URL para uso seguro
   */
  sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return null;

    try {
      // Remover espaços e caracteres especiais
      url = url.trim();
      
      // Remover caracteres perigosos
      url = url.replace(/[<>'"]/g, '');
      
      // Verificar se ainda é uma URL válida após sanitização
      const validation = this.validateUrl(url);
      return validation.valid ? url : null;

    } catch (error) {
      return null;
    }
  }

  /**
   * Gera relatório de validação
   */
  generateValidationReport(url, user, imageElement = null) {
    const report = {
      timestamp: new Date().toISOString(),
      url,
      user: user ? { id: user.id, name: user.name, email: user.email } : null,
      validations: {}
    };

    // Validar URL
    report.validations.url = this.validateUrl(url, user?.id);

    // Validar dados do usuário
    report.validations.user = this.validateUserData(user);

    // Validar imagem se fornecida
    if (imageElement) {
      report.validations.image = this.validateImage(imageElement, url, user?.id);
    }

    // Determinar status geral
    report.valid = Object.values(report.validations).every(v => v.valid);

    return report;
  }
}

// Instância singleton
const avatarValidator = new AvatarValidator();

export default avatarValidator;
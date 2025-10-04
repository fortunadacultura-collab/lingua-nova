import React from 'react';
import './CustomModal.css';

// Contador global para gerenciar múltiplos modais
let activeModalsCount = 0;
let originalBodyOverflow = null;

const CustomModal = ({ isOpen, onClose, title, message, type = 'info', onConfirm, showConfirm = false, showInput = false, inputPlaceholder = '', inputValue = '', onInputChange }) => {
  // Função para garantir cleanup do scroll
  const ensureScrollCleanup = () => {
    activeModalsCount = 0;
    document.body.classList.remove('modal-open');
    if (originalBodyOverflow !== null) {
      document.body.style.overflow = originalBodyOverflow;
      originalBodyOverflow = null;
    }
  };

  // Função para lidar com teclas
  const handleKeyDown = React.useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Garantir cleanup quando modal é fechado - useEffect deve estar sempre no topo
  React.useEffect(() => {
    if (!isOpen && activeModalsCount > 0) {
      ensureScrollCleanup();
    }
  }, [isOpen]);

  // Gerenciar eventos e scroll do body
  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      
      // Incrementar contador de modais ativos
      activeModalsCount++;
      
      // Preservar overflow original e adicionar classe CSS apenas no primeiro modal
      if (activeModalsCount === 1) {
        originalBodyOverflow = document.body.style.overflow || 'auto';
        document.body.classList.add('modal-open');
      }
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        
        // Decrementar contador de modais ativos
        activeModalsCount--;
        
        // Remover classe CSS e restaurar overflow se não houver mais modais ativos
        if (activeModalsCount === 0) {
          document.body.classList.remove('modal-open');
          if (originalBodyOverflow !== null) {
            document.body.style.overflow = originalBodyOverflow;
            originalBodyOverflow = null;
          }
        }
      };
    }
  }, [isOpen, handleKeyDown]);

  // Cleanup de segurança quando o componente é desmontado
  React.useEffect(() => {
    return () => {
      if (activeModalsCount > 0) {
        ensureScrollCleanup();
      }
    };
  }, []);

  if (!isOpen) return null;

  const getTypeConfig = () => {
    const configs = {
      info: {
        icon: 'ℹ',
        color: '#1d4ed8',
        bgColor: '#dbeafe',
        borderColor: '#3b82f6'
      },
      success: {
        icon: '✓',
        color: '#16a34a',
        bgColor: '#dcfce7',
        borderColor: '#22c55e'
      },
      warning: {
        icon: '⚠',
        color: 'var(--warning, #ff6d00)',
        bgColor: 'var(--bg-warning-light, #fef3c7)',
        borderColor: 'var(--warning, #ff6d00)'
      },
      error: {
        icon: '✕',
        color: 'var(--danger, #ff1744)',
        bgColor: 'var(--bg-danger-light, #fee2e2)',
        borderColor: 'var(--danger, #ff1744)'
      }
    };
    
    return configs[type] || configs.info;
  };

  const typeConfig = getTypeConfig();

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="custom-modal-overlay" onClick={handleOverlayClick}>
      <div className="custom-modal">
        <div className="custom-modal-header">
          <div className={`modal-icon ${type}`}>
            {typeConfig.icon}
          </div>
          <div>
            <h3 className={`modal-title ${type}`}>
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="modal-close-button"
            aria-label="Fechar modal"
          >
            ×
          </button>
        </div>
        
        <div className="custom-modal-body">
          {message}
          
          {showInput && (
            <input
              type="text"
              placeholder={inputPlaceholder}
              value={inputValue}
              onChange={(e) => onInputChange && onInputChange(e.target.value)}
              className="modal-input"
            />
          )}
        </div>
        
        <div className="custom-modal-footer">
          {showConfirm ? (
            <>
              <button
                className="modal-button modal-button-secondary"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                className={`modal-button ${type === 'error' ? 'modal-button-danger' : 'modal-button-primary'}`}
                onClick={() => {
                  onConfirm && onConfirm();
                  onClose();
                }}
              >
                Confirmar
              </button>
            </>
          ) : (
            <button
              className={`modal-button ${type === 'success' ? 'modal-button-primary' : 'modal-button-primary'}`}
              onClick={onClose}
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomModal;
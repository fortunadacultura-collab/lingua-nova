import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense, lazy } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../components/UI/UserAvatar';
import './ProfileSettings.css';

// Lazy load components for better performance
const SettingsForm = lazy(() => import('../components/Profile/SettingsForm'));
const CustomModal = lazy(() => import('../components/UI/CustomModal'));

const ProfileSettings = () => {
  const { user, updateUser, authenticatedFetch, logout, refreshUserFromServer } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  const validationTimeoutRef = useRef(null);

  // Memoize fields to prevent unnecessary re-renders
  const profileFields = useMemo(() => [
    {
      name: 'firstName',
      type: 'text',
      label: 'Nome',
      placeholder: 'Digite seu nome',
      icon: 'fas fa-user',
      'aria-describedby': 'firstName-help',
      'aria-required': 'true'
    },
    {
      name: 'lastName',
      type: 'text',
      label: 'Sobrenome',
      placeholder: 'Digite seu sobrenome',
      icon: 'fas fa-user',
      'aria-describedby': 'lastName-help',
      'aria-required': 'true'
    },
    {
      name: 'email',
      type: 'email',
      label: 'Email',
      placeholder: 'Digite seu email',
      icon: 'fas fa-envelope',
      'aria-describedby': 'email-help',
      'aria-required': 'true'
    },
    {
      name: 'bio',
      type: 'textarea',
      label: 'Biografia',
      placeholder: 'Conte um pouco sobre você...',
      rows: 4,
      helper: 'Máximo de 500 caracteres',
      'aria-describedby': 'bio-help',
      'maxlength': '500'
    },
    {
      name: 'language',
      type: 'select',
      label: 'Idioma',
      placeholder: 'Selecione seu idioma',
      options: [
        { value: 'pt', label: 'Português' },
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Español' }
      ],
      'aria-describedby': 'language-help',
      'aria-required': 'true'
    }
  ], []);

  const passwordFields = useMemo(() => [
    {
      name: 'currentPassword',
      type: 'password',
      label: 'Senha Atual',
      placeholder: 'Digite sua senha atual',
      icon: 'fas fa-lock',
      'aria-describedby': 'currentPassword-help',
      'aria-required': 'true'
    },
    {
      name: 'newPassword',
      type: 'password',
      label: 'Nova Senha',
      placeholder: 'Digite sua nova senha',
      icon: 'fas fa-key',
      'aria-describedby': 'newPassword-help',
      'aria-required': 'true'
    },
    {
      name: 'confirmPassword',
      type: 'password',
      label: 'Confirmar Nova Senha',
      placeholder: 'Confirme sua nova senha',
      icon: 'fas fa-key',
      'aria-describedby': 'confirmPassword-help',
      'aria-required': 'true'
    }
  ], []);

  const profileValidationRules = useMemo(() => ({
    firstName: {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-ZÀ-ÿ\s]+$/,
      patternMessage: 'Nome deve conter apenas letras e espaços'
    },
    lastName: {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-ZÀ-ÿ\s]+$/,
      patternMessage: 'Sobrenome deve conter apenas letras e espaços'
    },
    email: {
      required: true,
      email: true,
      asyncValidation: async (value) => {
        if (value && value !== user.email) {
          // Simulate email availability check
          await new Promise(resolve => setTimeout(resolve, 500));
          // In real app, this would be an API call
          const isAvailable = !value.includes('taken');
          return isAvailable ? null : 'Este email já está em uso';
        }
        return null;
      }
    },
    bio: {
      maxLength: 500
    },
    language: {
      required: true
    }
  }), [user?.email]);

  const passwordValidationRules = useMemo(() => ({
    currentPassword: {
      required: true,
      minLength: 6,
      asyncValidation: async (value) => {
        if (value && value.length >= 6) {
          // Simulate password verification
          await new Promise(resolve => setTimeout(resolve, 300));
          // In real app, this would verify current password
          const isValid = value !== 'wrongpassword';
          return isValid ? null : 'Senha atual incorreta';
        }
        return null;
      }
    },
    newPassword: {
      required: true,
      minLength: 8,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      patternMessage: 'Senha deve conter ao menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial'
    },
    confirmPassword: {
      required: true,
      custom: (value, formData) => {
        if (value !== formData.newPassword) {
          return 'As senhas não coincidem';
        }
        return '';
      }
    }
  }), []);

  const handleProfileSubmit = useCallback(async (formData) => {
    setIsLoading(true);
    setHasUnsavedChanges(false);
    
    try {
      const response = await authenticatedFetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser.user);
        setLastSaved(new Date());
        
        setModal({
          isOpen: true,
          title: '✅ Sucesso',
          message: 'Perfil atualizado com sucesso! Suas alterações foram salvas.',
          type: 'success'
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar perfil');
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setModal({
        isOpen: true,
        title: '❌ Erro',
        message: error.message || 'Erro ao atualizar perfil. Tente novamente.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [authenticatedFetch, updateUser]);

  const handlePasswordSubmit = useCallback(async (formData) => {
    setIsLoading(true);
    
    try {
      const response = await authenticatedFetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });
      
      if (response.ok) {
        setModal({
          isOpen: true,
          title: '🔒 Senha Alterada',
          message: 'Sua senha foi alterada com sucesso! Por segurança, recomendamos fazer login novamente.',
          type: 'success'
        });
        
        // Clear form after successful password change
        setTimeout(() => {
          setActiveTab('profile');
        }, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao alterar senha');
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      setModal({
        isOpen: true,
        title: '❌ Erro',
        message: error.message || 'Erro ao alterar senha. Verifique sua senha atual e tente novamente.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [authenticatedFetch]);

  // Debounced validation function
  const validateFieldAsync = useCallback(async (fieldName, value, rules) => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    return new Promise((resolve) => {
      validationTimeoutRef.current = setTimeout(async () => {
        if (rules.asyncValidation && value) {
          setIsValidating(true);
          try {
            const error = await rules.asyncValidation(value);
            setValidationErrors(prev => ({
              ...prev,
              [fieldName]: error
            }));
            resolve(error);
          } catch (err) {
            console.error('Validation error:', err);
            resolve(null);
          } finally {
            setIsValidating(false);
          }
        } else {
          resolve(null);
        }
      }, 500); // 500ms debounce
    });
  }, []);

  const handleFormChange = useCallback((formData, fieldName) => {
    setHasUnsavedChanges(true);
    
    // Trigger async validation for specific fields
    if (fieldName && activeTab === 'profile') {
      const rules = profileValidationRules[fieldName];
      if (rules) {
        validateFieldAsync(fieldName, formData[fieldName], rules);
      }
    } else if (fieldName && activeTab === 'security') {
      const rules = passwordValidationRules[fieldName];
      if (rules) {
        validateFieldAsync(fieldName, formData[fieldName], rules);
      }
    }
  }, [activeTab, profileValidationRules, passwordValidationRules, validateFieldAsync]);

  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        'Você tem alterações não salvas. Tem certeza que deseja sair sem salvar?'
      );
      if (!confirmLeave) return;
    }
    setActiveTab('profile');
    setHasUnsavedChanges(false);
    setValidationErrors({});
  }, [hasUnsavedChanges]);

  const getInitialProfileData = () => {
    return {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      bio: user?.bio || '',
      language: user?.language || 'pt'
    };
  };

  const getInitialPasswordData = () => {
    return {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  };

  const handleAvatarUpload = async (file) => {
    if (!file) return;

    // Validações do arquivo
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      setModal({
        isOpen: true,
        title: '❌ Formato Inválido',
        message: 'Por favor, selecione uma imagem válida (JPEG, PNG, GIF ou WebP).',
        type: 'error'
      });
      return;
    }

    if (file.size > maxSize) {
      setModal({
        isOpen: true,
        title: '❌ Arquivo Muito Grande',
        message: 'A imagem deve ter no máximo 5MB. Por favor, escolha uma imagem menor.',
        type: 'error'
      });
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setIsLoading(true);
    
    try {
      const response = await authenticatedFetch('/api/upload/avatar', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        // Atualizar o contexto com os novos dados
        updateUser(data.user);
        // Também recarregar os dados do servidor para garantir sincronização
        await refreshUserFromServer();
        setModal({
          isOpen: true,
          title: '✅ Sucesso',
          message: 'Avatar atualizado com sucesso! Sua nova foto de perfil já está visível.',
          type: 'success'
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao fazer upload do avatar');
      }
    } catch (error) {
      console.error('Erro no upload do avatar:', error);
      setModal({
        isOpen: true,
        title: '❌ Erro no Upload',
        message: error.message || 'Erro ao fazer upload do avatar. Verifique sua conexão e tente novamente.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsLoading(true);
      
      const response = await authenticatedFetch('/api/auth/delete-account', {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setModal({
          isOpen: true,
          title: 'Conta Excluída',
          message: 'Sua conta foi excluída com sucesso. Você será redirecionado para a página inicial.',
          type: 'success'
        });
        
        // Fazer logout após 2 segundos
        setTimeout(() => {
          logout();
          window.location.href = '/';
        }, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir conta');
      }
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      setModal({
        isOpen: true,
        title: 'Erro',
        message: error.message || 'Erro ao excluir conta. Tente novamente.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="profile-settings-page">
      <div className="settings-container">
        {/* Header */}
        <div className="settings-header">
          <div className="header-content">
            <h1 className="settings-title">
              <i className="fas fa-cog" aria-hidden="true"></i>
              Configurações do Perfil
            </h1>
            <p className="settings-subtitle">
              Gerencie suas informações pessoais e configurações de conta
            </p>
            {lastSaved && (
              <div className="last-saved-indicator">
                <i className="fas fa-check-circle" aria-hidden="true"></i>
                Última atualização: {lastSaved.toLocaleTimeString()}
              </div>
            )}
            {hasUnsavedChanges && (
              <div className="unsaved-changes-indicator">
                <i className="fas fa-exclamation-circle" aria-hidden="true"></i>
                Você tem alterações não salvas
              </div>
            )}
          </div>
          
          <div className="avatar-section">
            <UserAvatar user={user} size="large" showName={false} />
            <button 
              className={`btn-change-avatar ${isLoading ? 'loading' : ''}`}
              onClick={() => document.getElementById('avatar-input').click()}
              disabled={isLoading}
              aria-label="Alterar foto do perfil"
              title="Clique para alterar sua foto do perfil"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin" aria-hidden="true"></i>
                  Enviando...
                </>
              ) : (
                <>
                  <i className="fas fa-camera" aria-hidden="true"></i>
                  Alterar Avatar
                </>
              )}
            </button>
            <input
              id="avatar-input"
              type="file"
              accept="image/*"
              onChange={(e) => handleAvatarUpload(e.target.files[0])}
              style={{ display: 'none' }}
              aria-label="Selecionar arquivo de imagem para avatar"
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="settings-tabs" role="tablist" aria-label="Configurações do usuário">
          <button 
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
            role="tab"
            aria-selected={activeTab === 'profile'}
            aria-controls="profile-panel"
            id="profile-tab"
            tabIndex={activeTab === 'profile' ? 0 : -1}
          >
            <i className="fas fa-user" aria-hidden="true"></i>
            Perfil
          </button>
          
          <button 
            className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
            role="tab"
            aria-selected={activeTab === 'security'}
            aria-controls="security-panel"
            id="security-tab"
            tabIndex={activeTab === 'security' ? 0 : -1}
          >
            <i className="fas fa-shield-alt" aria-hidden="true"></i>
            Segurança
          </button>
          
          <button 
            className={`tab-button ${activeTab === 'danger' ? 'active' : ''}`}
            onClick={() => setActiveTab('danger')}
            role="tab"
            aria-selected={activeTab === 'danger'}
            aria-controls="danger-panel"
            id="danger-tab"
            tabIndex={activeTab === 'danger' ? 0 : -1}
          >
            <i className="fas fa-exclamation-triangle" aria-hidden="true"></i>
            Zona de Perigo
          </button>
        </nav>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'profile' && (
            <div 
              role="tabpanel" 
              id="profile-panel" 
              aria-labelledby="profile-tab"
              tabIndex={0}
              className="settings-section active"
            >
              <Suspense fallback={
                <div className="loading-spinner">
                  <i className="fas fa-spinner fa-spin"></i>
                  Carregando formulário...
                </div>
              }>
                <SettingsForm
                  title="Informações Pessoais"
                  fields={profileFields}
                  initialData={getInitialProfileData()}
                  onSubmit={handleProfileSubmit}
                  onCancel={handleCancel}
                  isLoading={isLoading}
                  validationRules={profileValidationRules}
                  submitText="Salvar Alterações"
                  onFormChange={handleFormChange}
                  validationErrors={validationErrors}
                  isValidating={isValidating}
                />
              </Suspense>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div 
              role="tabpanel" 
              id="security-panel" 
              aria-labelledby="security-tab"
              tabIndex={0}
              className="settings-section active"
            >
              <Suspense fallback={
                <div className="loading-spinner">
                  <i className="fas fa-spinner fa-spin"></i>
                  Carregando formulário...
                </div>
              }>
                <SettingsForm
                  title="Alterar Senha"
                  fields={passwordFields}
                  initialData={getInitialPasswordData()}
                  onSubmit={handlePasswordSubmit}
                  onCancel={handleCancel}
                  isLoading={isLoading}
                  validationRules={passwordValidationRules}
                  submitText="Alterar Senha"
                  description="Por segurança, você precisará inserir sua senha atual para definir uma nova senha."
                  onFormChange={handleFormChange}
                  validationErrors={validationErrors}
                  isValidating={isValidating}
                />
              </Suspense>
            </div>
          )}
          
          {activeTab === 'danger' && (
            <div 
              role="tabpanel" 
              id="danger-panel" 
              aria-labelledby="danger-tab"
              tabIndex={0}
              className="settings-form danger-zone active"
            >
              <div className="form-section">
                <h3 className="section-title danger-title">
                  <i className="fas fa-exclamation-triangle" aria-hidden="true"></i>
                  Zona de Perigo
                </h3>
                <p className="section-description danger-description">
                  Estas ações são irreversíveis. Proceda com cuidado.
                </p>
                
                <div className="danger-actions">
                  <div className="danger-item">
                    <div className="danger-info">
                      <h4>Excluir Conta</h4>
                      <p>Exclua permanentemente sua conta e todos os dados associados</p>
                      <ul className="danger-consequences">
                        <li>Todos os seus decks serão perdidos</li>
                        <li>Seu progresso de aprendizado será apagado</li>
                        <li>Esta ação não pode ser desfeita</li>
                      </ul>
                    </div>
                    <button 
                      className="btn-danger"
                      onClick={() => setShowDeleteModal(true)}
                      aria-label="Excluir conta permanentemente"
                    >
                      <i className="fas fa-trash-alt" aria-hidden="true"></i>
                      Excluir Conta
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <Suspense fallback={null}>
        <CustomModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Confirmar Exclusão de Conta"
          type="danger"
          autoFocus={true}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div className="delete-confirmation">
            <p>Tem certeza de que deseja excluir sua conta permanentemente?</p>
            <p><strong>Esta ação não pode ser desfeita.</strong></p>
            <p>Todos os seus dados, incluindo decks, progresso e estatísticas, serão perdidos.</p>
            
            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={isLoading}
                autoFocus
                aria-label="Cancelar exclusão da conta"
              >
                Cancelar
              </button>
              <button 
                className="btn-danger"
                onClick={handleDeleteAccount}
                disabled={isLoading}
                aria-describedby="delete-warning"
                aria-label="Confirmar exclusão permanente da conta"
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin" aria-hidden="true"></i>
                    Excluindo...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash" aria-hidden="true"></i>
                    Sim, Excluir Conta
                  </>
                )}
              </button>
            </div>
          </div>
        </CustomModal>
      </Suspense>

      {/* Modal de Feedback */}
      <Suspense fallback={null}>
        <CustomModal
          isOpen={modal.isOpen}
          onClose={() => setModal({ ...modal, isOpen: false })}
          title={modal.title}
          type={modal.type}
          autoFocus={true}
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-modal-title"
        >
          <p>{modal.message}</p>
        </CustomModal>
      </Suspense>
    </div>
  );
};

export default ProfileSettings;
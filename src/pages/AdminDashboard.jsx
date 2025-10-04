import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { useLogo } from '../hooks/useImageAsset';
import UserAvatar from '../components/UI/UserAvatar';
import CustomModal from '../components/UI/CustomModal';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [accessLevels, setAccessLevels] = useState([]);
  const [changingAccessLevel, setChangingAccessLevel] = useState(null);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, userId: null, userName: '', reason: '' });
  const { imageUrl: logoUrl } = useLogo();
  

  
  const { getUsers, adminLogout, promoteUser, demoteUser, changeAccessLevel, getAccessLevels, deleteUser, resetAdminPassword, cleanupApkgUploads } = useAdmin();

  useEffect(() => {
    loadUsers();
    loadAccessLevels();
  }, []);

  const loadAccessLevels = async () => {
    try {
      const levels = await getAccessLevels();
      setAccessLevels(levels);
    } catch (error) {
      console.error('Erro ao carregar níveis de acesso:', error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getUsers();
      
      if (response.success) {
        setUsers(response.users || []);
      } else {
        setError(response.message || 'Erro ao carregar usuários');
      }
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      setError('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await adminLogout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleCleanupUploads = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Limpeza de Uploads',
      message: 'Deseja executar a limpeza de uploads órfãos (.apkg)?',
      onConfirm: async () => {
        try {
          const result = await cleanupApkgUploads();
          const removed = Number(result?.totalRemoved || 0);
          const filesRemoved = Number(result?.totalFilesRemoved || 0);
          setModal({
            isOpen: true,
            title: 'Limpeza concluída',
            message: `Removidos ${removed} diretórios e ${filesRemoved} arquivos .apkg órfãos.`,
            type: 'success'
          });
        } catch (error) {
          setModal({
            isOpen: true,
            title: 'Erro',
            message: error?.message || 'Erro ao executar limpeza de uploads',
            type: 'error'
          });
        }
      }
    });
  };

  const handlePromoteUser = async (userId, userName) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Promoção',
      message: `Tem certeza que deseja promover ${userName} a administrador?`,
      onConfirm: async () => {
        try {
          const response = await promoteUser(userId);
          if (response.success) {
            setModal({
              isOpen: true,
              title: 'Sucesso!',
              message: 'Usuário promovido a administrador com sucesso!',
              type: 'success'
            });
            loadUsers(); // Recarregar lista
          } else {
            setModal({
              isOpen: true,
              title: 'Erro',
              message: response.error || 'Erro ao promover usuário',
              type: 'error'
            });
          }
        } catch (error) {
          console.error('Erro ao promover usuário:', error);
          setModal({
            isOpen: true,
            title: 'Erro',
            message: 'Erro interno do servidor',
            type: 'error'
          });
        }
      }
    });
  };

  const handleDeleteUser = async (userId, userName) => {
    setDeleteModal({
      isOpen: true,
      userId,
      userName,
      reason: ''
    });
  };

  const confirmDeleteUser = async () => {
    const { userId, userName, reason } = deleteModal;
    
    if (!reason || reason.trim() === '') {
      setModal({
        isOpen: true,
        title: 'Erro',
        message: 'É necessário informar o motivo da exclusão.',
        type: 'error'
      });
      return;
    }

    try {
      const response = await deleteUser(userId, reason.trim());
      if (response.success) {
        setModal({
          isOpen: true,
          title: 'Sucesso!',
          message: `${userName} foi excluído com sucesso!`,
          type: 'success'
        });
        loadUsers(); // Recarregar a lista
        setDeleteModal({ isOpen: false, userId: null, userName: '', reason: '' });
      } else {
        setModal({
          isOpen: true,
          title: 'Erro',
          message: response.error || 'Erro ao excluir usuário',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      setModal({
        isOpen: true,
        title: 'Erro',
        message: 'Erro ao excluir usuário',
        type: 'error'
      });
    }
  };

  const handleResetPassword = async (userId, userEmail) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Reset de Senha',
      message: `Tem certeza que deseja resetar a senha de ${userEmail}?`,
      onConfirm: async () => {
        try {
          const response = await resetAdminPassword(userEmail);
          if (response.success) {
            setModal({
              isOpen: true,
              title: 'Sucesso!',
              message: `Email de reset de senha enviado para ${userEmail}!`,
              type: 'success'
            });
          } else {
            setModal({
              isOpen: true,
              title: 'Erro',
              message: response.error || 'Erro ao resetar senha',
              type: 'error'
            });
          }
        } catch (error) {
          console.error('Erro ao resetar senha:', error);
          setModal({
            isOpen: true,
            title: 'Erro',
            message: 'Erro ao resetar senha',
            type: 'error'
          });
        }
      }
    });
  };

  const handleDemoteUser = async (userId, userName) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Remoção de Privilégios',
      message: `Tem certeza que deseja remover os privilégios de administrador de ${userName}?`,
      onConfirm: async () => {
        try {
          const response = await demoteUser(userId);
          if (response.success) {
            setModal({
              isOpen: true,
              title: 'Sucesso!',
              message: 'Privilégios de administrador removidos com sucesso!',
              type: 'success'
            });
            loadUsers(); // Recarregar lista
          } else {
            setModal({
              isOpen: true,
              title: 'Erro',
              message: response.error || 'Erro ao remover privilégios',
              type: 'error'
            });
          }
        } catch (error) {
          console.error('Erro ao remover privilégios:', error);
          setModal({
            isOpen: true,
            title: 'Erro',
            message: 'Erro interno do servidor',
            type: 'error'
          });
        }
      }
    });
  };

  const handleChangeAccessLevel = async (userId, newAccessLevel) => {
    try {
      setChangingAccessLevel(userId);
      await changeAccessLevel(userId, newAccessLevel);
      await loadUsers(); // Recarregar a lista
      setModal({
        isOpen: true,
        title: 'Sucesso!',
        message: `Nível de acesso alterado para ${getAccessLevelLabel(newAccessLevel)} com sucesso!`,
        type: 'success'
      });
    } catch (error) {
      console.error('Erro ao alterar nível de acesso:', error);
      setModal({
        isOpen: true,
        title: 'Erro',
        message: 'Erro ao alterar nível de acesso: ' + error.message,
        type: 'error'
      });
    } finally {
      setChangingAccessLevel(null);
    }
  };

  const getAccessLevelLabel = (value) => {
    const level = accessLevels.find(l => l.value === value);
    return level ? level.label : value;
  };

  const getAccessLevelColor = (accessLevel) => {
    switch (accessLevel) {
      case 'super_admin':
        return 'var(--danger, #dc2626)'; // Vermelho
      case 'admin':
        return 'var(--warning, #ea580c)'; // Laranja
      case 'moderator':
        return 'var(--info, #0891b2)'; // Azul
      case 'user':
      default:
        return 'var(--success, #059669)'; // Verde
    }
  };

  const handleViewUser = (userId) => {

    setExpandedUserId(expandedUserId === userId ? null : userId);
  };



  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data inválida';
    }
  };

  const getAuthProvider = (user) => {
    if (user.googleId) return 'Google';
    if (user.facebookId) return 'Facebook';
    if (user.githubId) return 'GitHub';
    return 'Email';
  };

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(term) ||
      user.firstName?.toLowerCase().includes(term) ||
      user.lastName?.toLowerCase().includes(term) ||
      getAuthProvider(user).toLowerCase().includes(term)
    );
  });

  const sortedUsers = filteredUsers.sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const stats = {
    total: users.length,
    verified: users.filter(u => u.isVerified).length,
    google: users.filter(u => u.googleId).length,
    email: users.filter(u => !u.googleId && !u.facebookId && !u.githubId).length
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-title">
            <img src={logoUrl} alt="LinguaNova" className="admin-logo" />
            <h1>Painel Administrativo</h1>
          </div>
          <button 
            onClick={() => window.open('/deleted-users', '_blank')} 
            className="deleted-users-btn"
            style={{
              padding: '12px 24px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginRight: '12px'
            }}
          >
            <i className="fas fa-trash-restore"></i>
            Usuários Deletados
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Sair
          </button>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-controls">
          <div className="search-section">
            <input
              type="text"
              placeholder="Buscar usuários por email, nome ou provedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <button className="action-btn view-btn" onClick={handleCleanupUploads}>
              Limpar uploads órfãos
            </button>
          </div>

          <div className="stats-section">
            <div className="stat-card">
              <h3>Total de Usuários</h3>
              <p className="stat-number">{stats.total}</p>
            </div>
            <div className="stat-card">
              <h3>Verificados</h3>
              <p className="stat-number">{stats.verified}</p>
            </div>
            <div className="stat-card">
              <h3>Login Google</h3>
              <p className="stat-number">{stats.google}</p>
            </div>
            <div className="stat-card">
              <h3>Login Email</h3>
              <p className="stat-number">{stats.email}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <span>{error}</span>
            <button onClick={loadUsers} className="retry-btn">
              Tentar Novamente
            </button>
          </div>
        )}



        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Carregando usuários...</p>
          </div>
        )}

        {!loading && (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Nome</th>
                  <th>Provedor</th>
                  <th>Cadastro</th>
                  <th>Último Login</th>
                  <th>Nível de Acesso</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="no-users">
                      {searchTerm ? 'Nenhum usuário encontrado com os critérios de busca.' : 'Nenhum usuário cadastrado.'}
                    </td>
                  </tr>
                ) : (
                  sortedUsers.map((user) => (
                    <React.Fragment key={user.id}>
                      <tr>
                        <td className="email-cell">
                          <div className="user-info">
                            <UserAvatar 
                              user={user} 
                              size="medium" 
                              showName={false}
                            />
                            <span>{user.email}</span>
                          </div>
                        </td>
                        <td>
                          {user.firstName} {user.lastName}
                        </td>
                        <td>
                          <span className={`provider-badge ${getAuthProvider(user).toLowerCase()}`}>
                            {getAuthProvider(user)}
                          </span>
                        </td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>{formatDate(user.lastLogin)}</td>
                        <td>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            backgroundColor: getAccessLevelColor(user.accessLevel || 'user') + '20',
                            color: getAccessLevelColor(user.accessLevel || 'user'),
                            border: `1px solid ${getAccessLevelColor(user.accessLevel || 'user')}40`
                          }}>
                            {getAccessLevelLabel(user.accessLevel || 'user')}
                          </span>
                        </td>
                        <td>
                          <button 
                            type="button"
                            className="action-btn view-btn"
                            onClick={() => handleViewUser(user.id)}
                            title="Ver detalhes do usuário"
                            style={{
                              marginRight: '5px',
                              backgroundColor: expandedUserId === user.id ? '#dc3545' : '#007bff'
                            }}
                          >
                            {expandedUserId === user.id ? 'Fechar' : 'Detalhes'}
                          </button>
                        </td>
                      </tr>
                      {expandedUserId === user.id && (
                        <tr>
                          <td colSpan={7} style={{
                            backgroundColor: '#f8f9fa',
                            padding: '0',
                            border: '1px solid #dee2e6'
                          }}>
                            <div style={{
                              padding: '24px',
                              maxWidth: '1000px',
                              margin: '0 auto'
                            }}>
                              {/* Cabeçalho do usuário */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                marginBottom: '24px',
                                paddingBottom: '16px',
                                borderBottom: '2px solid #e9ecef'
                              }}>
                                <UserAvatar 
                                  user={user} 
                                  size="large" 
                                  showName={false}
                                />
                                <div>
                                  <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', color: 'var(--text-primary)' }}>
                                    {user.firstName} {user.lastName}
                                  </h3>
                                  <p style={{ margin: '0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                    {user.email}
                                  </p>
                                </div>
                              </div>

                              {/* Informações básicas */}
                              <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ 
                                  margin: '0 0 16px 0', 
                                  fontSize: '16px', 
                                  color: '#495057',
                                  fontWeight: '600'
                                }}>
                                  📋 Informações Básicas
                                </h4>
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                  gap: '16px',
                                  fontSize: '14px'
                                }}>
                                  <div style={{
                                    padding: '12px',
                                    backgroundColor: '#fff',
                                    borderRadius: '8px',
                                    border: '1px solid #e9ecef'
                                  }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>ID</div>
                                    <div style={{ fontWeight: '500' }}>{user.id}</div>
                                  </div>
                                  <div style={{
                                    padding: '12px',
                                    backgroundColor: '#fff',
                                    borderRadius: '8px',
                                    border: '1px solid #e9ecef'
                                  }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Username</div>
                                    <div style={{ fontWeight: '500' }}>{user.username || 'Não informado'}</div>
                                  </div>
                                  <div style={{
                                    padding: '12px',
                                    backgroundColor: '#fff',
                                    borderRadius: '8px',
                                    border: '1px solid #e9ecef'
                                  }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Email</div>
                                    <div style={{ fontWeight: '500' }}>{user.email}</div>
                                  </div>
                                  <div style={{
                                    padding: '12px',
                                    backgroundColor: '#fff',
                                    borderRadius: '8px',
                                    border: '1px solid #e9ecef'
                                  }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Nome Completo</div>
                                    <div style={{ fontWeight: '500' }}>{user.firstName} {user.lastName}</div>
                                  </div>
                                  <div style={{
                                    padding: '12px',
                                    backgroundColor: '#fff',
                                    borderRadius: '8px',
                                    border: '1px solid #e9ecef'
                                  }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Provedor</div>
                                    <div style={{ fontWeight: '500' }}>
                                      <span className={`provider-badge ${getAuthProvider(user).toLowerCase()}`}>
                                        {getAuthProvider(user)}
                                      </span>
                                    </div>
                                  </div>
                                  <div style={{
                                    padding: '12px',
                                    backgroundColor: '#fff',
                                    borderRadius: '8px',
                                    border: '1px solid #e9ecef'
                                  }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Verificado</div>
                                    <div style={{ fontWeight: '500' }}>{user.isVerified ? 'Sim' : 'Não'}</div>
                                  </div>
                                  <div style={{
                                    padding: '12px',
                                    backgroundColor: '#fff',
                                    borderRadius: '8px',
                                    border: '1px solid #e9ecef'
                                  }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Avatar</div>
                                    <div style={{ fontWeight: '500' }}>
                                      <UserAvatar 
                                        user={user} 
                                        size="small" 
                                        showName={false}
                                      />
                                    </div>
                                  </div>
                                  <div style={{
                                    padding: '12px',
                                    backgroundColor: '#fff',
                                    borderRadius: '8px',
                                    border: '1px solid #e9ecef'
                                  }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Data de Criação</div>
                                    <div style={{ fontWeight: '500' }}>{formatDate(user.createdAt)}</div>
                                  </div>
                                  <div style={{
                                    padding: '12px',
                                    backgroundColor: '#fff',
                                    borderRadius: '8px',
                                    border: '1px solid #e9ecef'
                                  }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Último Login</div>
                                    <div style={{ fontWeight: '500' }}>{formatDate(user.lastLogin)}</div>
                                  </div>
                                </div>
                              </div>

                              {/* Seção de Nível de Acesso */}
                              <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ 
                                  margin: '0 0 16px 0', 
                                  fontSize: '16px', 
                                  color: '#495057',
                                  fontWeight: '600'
                                }}>
                                  🔐 Nível de Acesso
                                </h4>
                                <div style={{
                                  padding: '20px',
                                  backgroundColor: '#fff',
                                  borderRadius: '12px',
                                  border: '1px solid #e9ecef'
                                }}>
                                  <div style={{ marginBottom: '16px' }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }}>Nível Atual</div>
                                    <span style={{
                                      padding: '8px 16px',
                                      borderRadius: '20px',
                                      fontSize: '14px',
                                      fontWeight: 'bold',
                                      backgroundColor: getAccessLevelColor(user.accessLevel || 'user') + '20',
                                      color: getAccessLevelColor(user.accessLevel || 'user'),
                                      border: `2px solid ${getAccessLevelColor(user.accessLevel || 'user')}40`
                                    }}>
                                      {getAccessLevelLabel(user.accessLevel || 'user')}
                                    </span>
                                  </div>
                                  <div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }}>Alterar Nível</div>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                      <select 
                                        value={user.accessLevel || 'user'}
                                        onChange={(e) => handleChangeAccessLevel(user.id, e.target.value)}
                                        disabled={changingAccessLevel === user.id}
                                        style={{
                                          padding: '10px 14px',
                                          borderRadius: '8px',
                                          border: '2px solid #e9ecef',
                                          fontSize: '14px',
                                          minWidth: '180px',
                                          backgroundColor: '#fff',
                                          cursor: changingAccessLevel === user.id ? 'not-allowed' : 'pointer'
                                        }}
                                      >
                                        {accessLevels.map(level => (
                                          <option key={level.value} value={level.value}>
                                            {level.label}
                                          </option>
                                        ))}
                                      </select>
                                      {changingAccessLevel === user.id && (
                                        <div style={{ 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          gap: '8px',
                                          color: '#6c757d',
                                          fontSize: '14px'
                                        }}>
                                          <div className="spinner" style={{
                                            width: '16px',
                                            height: '16px',
                                            border: '2px solid #e9ecef',
                                            borderTop: '2px solid #007bff',
                                            borderRadius: '50%',
                                            animation: 'spin 1s linear infinite'
                                          }}></div>
                                          Alterando...
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Seção de Ações Administrativas */}
                              <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ 
                                  margin: '0 0 16px 0', 
                                  fontSize: '16px', 
                                  color: '#495057',
                                  fontWeight: '600'
                                }}>
                                  ⚙️ Ações Administrativas
                                </h4>
                                <div style={{
                                  display: 'flex',
                                  gap: '12px',
                                  flexWrap: 'wrap'
                                }}>
                                  {user.isAdmin ? (
                                    <button 
                                      className="admin-action-btn demote-btn"
                                      onClick={() => handleDemoteUser(user.id, `${user.firstName} ${user.lastName}`)}
                                      title="Remover privilégios de administrador"
                                      style={{
                                        padding: '12px 20px',
                                        backgroundColor: 'var(--danger, #dc3545)',
                                        color: 'var(--text-white, white)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                      }}
                                    >
                                      <i className="fas fa-user-minus"></i>
                                      Remover Admin
                                    </button>
                                  ) : (
                                    <button 
                                      className="admin-action-btn promote-btn"
                                      onClick={() => handlePromoteUser(user.id, `${user.firstName} ${user.lastName}`)}
                                      title="Promover a administrador"
                                      style={{
                                        padding: '12px 20px',
                                        backgroundColor: 'var(--success, #28a745)',
                                        color: 'var(--text-white, white)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                      }}
                                    >
                                      <i className="fas fa-user-shield"></i>
                                      Promover a Admin
                                    </button>
                                  )}
                                  <button 
                                    className="admin-action-btn reset-btn"
                                    onClick={() => handleResetPassword(user.id, user.email)}
                                    title="Resetar senha do usuário"
                                    style={{
                                      padding: '12px 20px',
                                      backgroundColor: 'var(--warning, #ffc107)',
                                      color: 'var(--text-dark, #212529)',
                                      border: 'none',
                                      borderRadius: '8px',
                                      fontSize: '14px',
                                      fontWeight: '500',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px'
                                    }}
                                  >
                                    <i className="fas fa-key"></i>
                                    Resetar Senha
                                  </button>
                                  <button 
                                    className="admin-action-btn delete-btn"
                                    onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                                    title="Excluir usuário (soft delete)"
                                    style={{
                                      padding: '12px 20px',
                                      backgroundColor: 'var(--danger, #dc3545)',
                                      color: 'var(--text-white, white)',
                                      border: 'none',
                                      borderRadius: '8px',
                                      fontSize: '14px',
                                      fontWeight: '500',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px'
                                    }}
                                  >
                                    <i className="fas fa-trash-alt"></i>
                                    Excluir Usuário
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Modal removido - detalhes agora aparecem expandidos na tabela */}
      </main>
      
      {/* Custom Modal */}
      <CustomModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
      
      {/* Confirmation Modal */}
      <CustomModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        title={confirmModal.title}
        message={confirmModal.message}
        type="confirm"
        showConfirm={true}
        onConfirm={confirmModal.onConfirm}
      />

      {/* Delete User Modal */}
      <CustomModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, userId: null, userName: '', reason: '' })}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir ${deleteModal.userName}?`}
        type="delete"
        showConfirm={true}
        showInput={true}
        inputPlaceholder="Digite o motivo da exclusão..."
        inputValue={deleteModal.reason}
        onInputChange={(value) => setDeleteModal(prev => ({ ...prev, reason: value }))}
        onConfirm={confirmDeleteUser}
      />
    </div>
  );
};

export default AdminDashboard;
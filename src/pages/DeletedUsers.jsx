import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import UserAvatar from '../components/UI/UserAvatar';
import './AdminDashboard.css';

const DeletedUsers = () => {
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
  const navigate = useNavigate();

  const { getDeletedUsers, restoreUser } = useAdmin();

  const loadDeletedUsers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDeletedUsers(page, pagination.limit);
      
      if (response.success) {
        setDeletedUsers(response.users);
        setPagination(prev => ({
          ...prev,
          page: response.pagination.page,
          total: response.pagination.total || response.users.length
        }));
      } else {
        setError(response.error || 'Erro ao carregar usuários deletados');
      }
    } catch (error) {
      console.error('Erro ao carregar usuários deletados:', error);
      setError('Erro ao carregar usuários deletados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeletedUsers();
  }, []);

  const handleRestoreUser = async (userId, userName) => {
    if (!window.confirm(`Tem certeza que deseja restaurar ${userName}?`)) {
      return;
    }

    try {
      const response = await restoreUser(userId);
      if (response.success) {
        alert(`${userName} foi restaurado com sucesso!`);
        loadDeletedUsers(pagination.page); // Recarregar a lista
      } else {
        alert(response.error || 'Erro ao restaurar usuário');
      }
    } catch (error) {
      console.error('Erro ao restaurar usuário:', error);
      alert('Erro ao restaurar usuário');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-title-section">
            <h1 className="admin-title">
              <i className="fas fa-trash-restore"></i>
              Usuários Deletados
            </h1>
            <p className="admin-subtitle">
              Gerencie usuários que foram excluídos do sistema
            </p>
          </div>
          <div className="admin-actions">
            <button 
              onClick={() => navigate('/admin/dashboard')} 
              className="back-btn"
              style={{
                padding: '12px 24px',
                backgroundColor: 'var(--secondary, #6c757d)',
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
              <i className="fas fa-arrow-left"></i>
              Voltar
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Carregando usuários deletados...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3>Erro ao carregar dados</h3>
            <p>{error}</p>
            <button onClick={() => loadDeletedUsers()} className="retry-btn">
              <i className="fas fa-redo"></i>
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="users-table-container">
            <div className="table-header">
              <h2>Usuários Deletados ({deletedUsers.length})</h2>
              <button 
                onClick={() => loadDeletedUsers(pagination.page)} 
                className="refresh-btn"
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--primary, #007bff)',
                  color: 'var(--text-white, white)',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <i className="fas fa-sync-alt"></i>
                Atualizar
              </button>
            </div>
            
            {deletedUsers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <i className="fas fa-users-slash"></i>
                </div>
                <h3>Nenhum usuário deletado</h3>
                <p>Não há usuários deletados no momento.</p>
              </div>
            ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Avatar</th>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Nível de Acesso</th>
                    <th>Deletado em</th>
                    <th>Deletado por</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <UserAvatar 
                          user={user} 
                          size="small" 
                          showName={false}
                        />
                      </td>
                      <td>
                        <div className="user-name">
                          <strong>{user.firstName} {user.lastName}</strong>
                          {user.username && (
                            <div className="username">@{user.username}</div>
                          )}
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`access-level-badge ${user.accessLevel}`}>
                          {user.accessLevel === 'admin' ? 'Administrador' : 
                           user.accessLevel === 'super_admin' ? 'Super Admin' : 'Usuário'}
                        </span>
                      </td>
                      <td>{formatDate(user.deletedAt)}</td>
                      <td>
                        <span className="deleted-by">{user.deletedBy}</span>
                      </td>
                      <td>
                        <button 
                          className="admin-action-btn restore-btn"
                          onClick={() => handleRestoreUser(user.id, `${user.firstName} ${user.lastName}`)}
                          title="Restaurar usuário"
                          style={{
                            padding: '8px 16px',
                            backgroundColor: 'var(--success, #28a745)',
                            color: 'var(--text-white, white)',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <i className="fas fa-undo"></i>
                          Restaurar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default DeletedUsers;
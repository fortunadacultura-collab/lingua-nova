import React from 'react';
import UserAvatar from '../UI/UserAvatar';
import './ProfileCard.css';

const ProfileCard = ({ user, showEditButton = false, onEdit }) => {
  if (!user) {
    return (
      <div className="profile-card loading">
        <div className="profile-card-skeleton">
          <div className="skeleton-avatar"></div>
          <div className="skeleton-info">
            <div className="skeleton-line skeleton-name"></div>
            <div className="skeleton-line skeleton-email"></div>
            <div className="skeleton-line skeleton-date"></div>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não disponível';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const getSubscriptionBadge = () => {
    if (user.subscription?.status === 'active') {
      return (
        <div className="subscription-badge premium">
          <i className="fas fa-crown"></i>
          Premium
        </div>
      );
    }
    
    return (
      <div className="subscription-badge free">
        <i className="fas fa-user"></i>
        Gratuito
      </div>
    );
  };

  return (
    <div className="profile-card">
      <div className="profile-card-header">
        <div className="profile-avatar-section">
          <UserAvatar user={user} size="large" showName={false} />
          {getSubscriptionBadge()}
        </div>
        
        <div className="profile-info">
          <h2 className="profile-name">
            {user.firstName} {user.lastName}
            {user.isAdmin && (
              <span className="admin-badge">
                <i className="fas fa-shield-alt"></i>
                Admin
              </span>
            )}
          </h2>
          
          <p className="profile-email">
            <i className="fas fa-envelope"></i>
            {user.email}
          </p>
          
          <p className="profile-join-date">
            <i className="fas fa-calendar-alt"></i>
            Membro desde {formatDate(user.createdAt)}
          </p>
          
          {user.lastLogin && (
            <p className="profile-last-login">
              <i className="fas fa-clock"></i>
              Último acesso: {formatDate(user.lastLogin)}
            </p>
          )}
        </div>
        
        {showEditButton && (
          <div className="profile-actions">
            <button 
              className="btn-edit-profile"
              onClick={onEdit}
              title="Editar perfil"
            >
              <i className="fas fa-edit"></i>
              Editar Perfil
            </button>
          </div>
        )}
      </div>
      
      {user.bio && (
        <div className="profile-bio">
          <h3>Sobre</h3>
          <p>{user.bio}</p>
        </div>
      )}
      
      <div className="profile-stats">
        <div className="stat-item">
          <div className="stat-value">{user.studyStreak || 0}</div>
          <div className="stat-label">Dias de Estudo</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-value">{user.totalPoints || 0}</div>
          <div className="stat-label">Pontos Totais</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-value">{user.completedLessons || 0}</div>
          <div className="stat-label">Lições Concluídas</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-value">{user.createdDecks || 0}</div>
          <div className="stat-label">Decks Criados</div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
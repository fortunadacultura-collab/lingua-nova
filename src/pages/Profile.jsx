import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import ProfileCard from '../components/Profile/ProfileCard';
import './Profile.css';

const Profile = () => {
  const { user, isAuthenticated, refreshUserFromServer } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalStudyTime: 0,
    cardsStudied: 0,
    streakDays: 0,
    completedLessons: 0
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadUserStats();
    }
  }, [isAuthenticated]);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      // Aqui você pode fazer uma chamada para a API para buscar estatísticas do usuário
      // Por enquanto, vamos usar dados mockados
      setStats({
        totalStudyTime: 120, // minutos
        cardsStudied: 245,
        streakDays: 7,
        completedLessons: 12
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatStudyTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getSubscriptionBadge = (subscription) => {
    switch (subscription) {
      case 'premium':
        return { text: 'Premium', class: 'premium' };
      case 'pro':
        return { text: 'Pro', class: 'pro' };
      default:
        return { text: 'Free', class: 'free' };
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="profile-page">
        <div className="profile-error">
          <h2>Acesso Negado</h2>
          <p>Você precisa estar logado para ver seu perfil.</p>
        </div>
      </div>
    );
  }

  const navigate = useNavigate();

  const handleEditProfile = () => {
    navigate('/profile/settings');
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Profile Header */}
        <ProfileCard 
          user={user} 
          showEditButton={true} 
          onEdit={handleEditProfile}
        />

        {/* Estatísticas */}
        <div className="profile-stats">
          <h2>Suas Estatísticas</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-clock"></i>
              </div>
              <div className="stat-content">
                <h3>{formatStudyTime(stats.totalStudyTime)}</h3>
                <p>Tempo de Estudo</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-layer-group"></i>
              </div>
              <div className="stat-content">
                <h3>{stats.cardsStudied}</h3>
                <p>Cards Estudados</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-fire"></i>
              </div>
              <div className="stat-content">
                <h3>{stats.streakDays}</h3>
                <p>Dias Consecutivos</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-graduation-cap"></i>
              </div>
              <div className="stat-content">
                <h3>{stats.completedLessons}</h3>
                <p>Lições Concluídas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Atividade Recente */}
        <div className="profile-activity">
          <h2>Atividade Recente</h2>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">
                <i className="fas fa-book-open"></i>
              </div>
              <div className="activity-content">
                <h4>Estudou Vocabulário Básico</h4>
                <p>Há 2 horas</p>
              </div>
            </div>
            
            <div className="activity-item">
              <div className="activity-icon">
                <i className="fas fa-comments"></i>
              </div>
              <div className="activity-content">
                <h4>Completou Diálogo: No Restaurante</h4>
                <p>Ontem</p>
              </div>
            </div>
            
            <div className="activity-item">
              <div className="activity-icon">
                <i className="fas fa-plus-circle"></i>
              </div>
              <div className="activity-content">
                <h4>Criou novo deck: Verbos Irregulares</h4>
                <p>Há 3 dias</p>
              </div>
            </div>
          </div>
        </div>

        {/* Conquistas */}
        <div className="profile-achievements">
          <h2>Conquistas</h2>
          <div className="achievements-grid">
            <div className="achievement-card earned">
              <div className="achievement-icon">
                <i className="fas fa-star"></i>
              </div>
              <div className="achievement-content">
                <h4>Primeira Lição</h4>
                <p>Complete sua primeira lição</p>
              </div>
            </div>
            
            <div className="achievement-card earned">
              <div className="achievement-icon">
                <i className="fas fa-fire"></i>
              </div>
              <div className="achievement-content">
                <h4>Sequência de 7 Dias</h4>
                <p>Estude por 7 dias consecutivos</p>
              </div>
            </div>
            
            <div className="achievement-card">
              <div className="achievement-icon">
                <i className="fas fa-trophy"></i>
              </div>
              <div className="achievement-content">
                <h4>Mestre das Palavras</h4>
                <p>Estude 500 cards</p>
              </div>
            </div>
            
            <div className="achievement-card">
              <div className="achievement-icon">
                <i className="fas fa-medal"></i>
              </div>
              <div className="achievement-content">
                <h4>Sequência de 30 Dias</h4>
                <p>Estude por 30 dias consecutivos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
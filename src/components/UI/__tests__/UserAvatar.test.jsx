import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserAvatar from '../UserAvatar';

// Mock do contexto de autenticação
const mockUser = {
  name: 'João Silva',
  profilePicture: 'https://lh3.googleusercontent.com/test-avatar.jpg'
};

const mockUserWithoutAvatar = {
  name: 'Maria Santos',
  profilePicture: null
};

describe('UserAvatar Component', () => {
  beforeEach(() => {
    // Limpar console.error para testes limpos
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  test('deve renderizar avatar do Google OAuth corretamente', async () => {
    render(<UserAvatar user={mockUser} size="medium" />);
    
    const avatarImage = screen.getByRole('img');
    expect(avatarImage).toBeInTheDocument();
    expect(avatarImage).toHaveAttribute('src', mockUser.profilePicture);
    expect(avatarImage).toHaveAttribute('crossOrigin', 'anonymous');
    expect(avatarImage).toHaveAttribute('referrerPolicy', 'no-referrer');
  });

  test('deve exibir iniciais quando imagem falha ao carregar', async () => {
    render(<UserAvatar user={mockUser} size="medium" />);
    
    const avatarImage = screen.getByRole('img');
    
    // Simular erro de carregamento
    fireEvent.error(avatarImage);
    
    await waitFor(() => {
      expect(screen.getByText('JS')).toBeInTheDocument();
    });
  });

  test('deve exibir iniciais quando não há profilePicture', () => {
    render(<UserAvatar user={mockUserWithoutAvatar} size="medium" />);
    
    expect(screen.getByText('MS')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  test('deve aplicar classes CSS corretas para diferentes tamanhos', () => {
    const { rerender } = render(<UserAvatar user={mockUser} size="small" />);
    expect(screen.getByTestId('user-avatar-container')).toHaveClass('user-avatar-small');

    rerender(<UserAvatar user={mockUser} size="medium" />);
    expect(screen.getByTestId('user-avatar-container')).toHaveClass('user-avatar-medium');

    rerender(<UserAvatar user={mockUser} size="large" />);
    expect(screen.getByTestId('user-avatar-container')).toHaveClass('user-avatar-large');
  });

  test('deve não adicionar timestamp para URLs do Google', () => {
    render(<UserAvatar user={mockUser} size="medium" />);
    
    const avatarImage = screen.getByRole('img');
    const src = avatarImage.getAttribute('src');
    
    // URLs do Google não devem ter timestamp
    expect(src).toBe(mockUser.profilePicture);
    expect(src).not.toContain('?t=');
  });

  test('deve adicionar timestamp para URLs locais', () => {
    const userWithLocalAvatar = {
      name: 'Test User',
      profilePicture: '/uploads/avatars/test.jpg'
    };

    render(<UserAvatar user={userWithLocalAvatar} size="medium" />);
    
    const avatarImage = screen.getByRole('img');
    const src = avatarImage.getAttribute('src');
    
    // URLs locais devem ter timestamp
    expect(src).toContain('?t=');
  });

  test('deve ter estilos CSS críticos aplicados', () => {
    render(<UserAvatar user={mockUser} size="medium" />);
    
    const avatarImage = screen.getByRole('img');
    const computedStyle = window.getComputedStyle(avatarImage);
    
    // Verificar se os estilos críticos estão aplicados
    expect(avatarImage).toHaveClass('avatar-image');
  });

  test('deve gerar iniciais corretas para nomes complexos', () => {
    const userComplexName = {
      name: 'José da Silva Santos',
      profilePicture: null
    };

    render(<UserAvatar user={userComplexName} size="medium" />);
    expect(screen.getByText('JS')).toBeInTheDocument();
  });

  test('deve lidar com nomes vazios ou inválidos', () => {
    const userEmptyName = {
      name: '',
      profilePicture: null
    };

    render(<UserAvatar user={userEmptyName} size="medium" />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });
});

// Testes específicos para URLs do Google OAuth
describe('UserAvatar - Google OAuth Integration', () => {
  const googleAvatarUrls = [
    'https://lh3.googleusercontent.com/a/test1',
    'https://lh4.googleusercontent.com/a/test2',
    'https://lh5.googleusercontent.com/a/test3'
  ];

  test.each(googleAvatarUrls)('deve carregar corretamente URL do Google: %s', (url) => {
    const user = { name: 'Test User', profilePicture: url };
    render(<UserAvatar user={user} size="medium" />);
    
    const avatarImage = screen.getByRole('img');
    expect(avatarImage).toHaveAttribute('src', url);
    expect(avatarImage).toHaveAttribute('crossOrigin', 'anonymous');
  });

  test('deve detectar URLs do Google corretamente', () => {
    const googleUser = {
      name: 'Google User',
      profilePicture: 'https://lh3.googleusercontent.com/test'
    };

    render(<UserAvatar user={googleUser} size="medium" />);
    
    const avatarImage = screen.getByRole('img');
    const src = avatarImage.getAttribute('src');
    
    // Não deve ter timestamp para URLs do Google
    expect(src).not.toContain('?t=');
    expect(src).toBe(googleUser.profilePicture);
  });
});
import React from 'react';
import './PasswordStrengthIndicator.css';

const PasswordStrengthIndicator = ({ password, strength }) => {
  const getStrengthLabel = (strength) => {
    switch (strength) {
      case 0:
      case 1:
        return 'Muito fraca';
      case 2:
        return 'Fraca';
      case 3:
        return 'Razoável';
      case 4:
        return 'Forte';
      case 5:
      case 6:
        return 'Muito forte';
      default:
        return 'Muito fraca';
    }
  };

  const getStrengthColor = (strength) => {
    switch (strength) {
      case 0:
      case 1:
        return 'var(--danger, #ff5252)'; // Coral Vivo
      case 2:
        return 'var(--hover-secondary, #ff7f2a)'; // Laranja Vibrante
      case 3:
        return 'var(--warning, #ffbf00)'; // Amarelo Solar
      case 4:
        return 'var(--hover-primary, #a6d608)'; // Verde Menta
      case 5:
      case 6:
        return 'var(--success, #79c000)'; // Verde Lima
      default:
        return 'var(--danger, #ff5252)';
    }
  };

  const getRequirements = (password) => {
    return [
      {
        text: 'Pelo menos 8 caracteres',
        met: password.length >= 8
      },
      {
        text: 'Pelo menos uma letra minúscula',
        met: /[a-z]/.test(password)
      },
      {
        text: 'Pelo menos uma letra maiúscula',
        met: /[A-Z]/.test(password)
      },
      {
        text: 'Pelo menos um número',
        met: /[0-9]/.test(password)
      },
      {
        text: 'Pelo menos um caractere especial',
        met: /[^A-Za-z0-9]/.test(password)
      }
    ];
  };

  const requirements = getRequirements(password);
  const strengthPercentage = Math.min((strength / 6) * 100, 100);

  if (!password) {
    return null;
  }

  return (
    <div className="password-strength-indicator">
      <div className="strength-bar-container">
        <div 
          className="strength-bar"
          style={{
            width: `${strengthPercentage}%`,
            backgroundColor: getStrengthColor(strength)
          }}
        ></div>
      </div>
      
      <div className="strength-info">
        <span 
          className="strength-label"
          style={{ color: getStrengthColor(strength) }}
        >
          {getStrengthLabel(strength)}
        </span>
        
        <div className="strength-requirements">
          {requirements.map((req, index) => (
            <div 
              key={index}
              className={`requirement ${req.met ? 'met' : 'unmet'}`}
            >
              <span className="requirement-icon">
                {req.met ? '✓' : '○'}
              </span>
              <span className="requirement-text">{req.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
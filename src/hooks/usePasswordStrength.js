import { useState, useEffect } from 'react';

const usePasswordStrength = (password) => {
  const [strength, setStrength] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!password) {
      setStrength(0);
      setScore(0);
      return;
    }

    const calculateStrength = (pwd) => {
      let score = 0;
      let strength = 0;

      // Critérios de avaliação
      const criteria = {
        length: pwd.length >= 8,
        lowercase: /[a-z]/.test(pwd),
        uppercase: /[A-Z]/.test(pwd),
        numbers: /[0-9]/.test(pwd),
        symbols: /[^A-Za-z0-9]/.test(pwd),
        longLength: pwd.length >= 12,
        veryLongLength: pwd.length >= 16
      };

      // Pontuação base
      if (criteria.length) score += 1;
      if (criteria.lowercase) score += 1;
      if (criteria.uppercase) score += 1;
      if (criteria.numbers) score += 1;
      if (criteria.symbols) score += 1;

      // Bônus por comprimento
      if (criteria.longLength) score += 1;
      if (criteria.veryLongLength) score += 1;

      // Penalidades por padrões comuns
      const commonPatterns = [
        /123456/,
        /abcdef/,
        /qwerty/,
        /password/i,
        /admin/i,
        /login/i,
        /(.)\1{2,}/, // caracteres repetidos
        /^[a-zA-Z]+$/, // apenas letras
        /^[0-9]+$/, // apenas números
      ];

      commonPatterns.forEach(pattern => {
        if (pattern.test(pwd)) {
          score -= 1;
        }
      });

      // Bônus por diversidade
      const uniqueChars = new Set(pwd.toLowerCase()).size;
      if (uniqueChars >= pwd.length * 0.7) {
        score += 1;
      }

      // Bônus por não usar palavras do dicionário (simulado)
      if (pwd.length >= 8 && !/^[a-zA-Z]+$/.test(pwd)) {
        const hasNoCommonWords = ![
          'password', 'admin', 'login', 'user', 'test',
          'welcome', 'hello', 'world', 'computer', 'internet'
        ].some(word => pwd.toLowerCase().includes(word));
        
        if (hasNoCommonWords) {
          score += 1;
        }
      }

      // Normalizar score (0-6)
      score = Math.max(0, Math.min(6, score));

      // Determinar nível de força
      if (score <= 1) {
        strength = 1; // Muito fraca
      } else if (score === 2) {
        strength = 2; // Fraca
      } else if (score === 3) {
        strength = 3; // Razoável
      } else if (score === 4) {
        strength = 4; // Forte
      } else if (score >= 5) {
        strength = 5; // Muito forte
      }

      return { score, strength };
    };

    const result = calculateStrength(password);
    setScore(result.score);
    setStrength(result.strength);
  }, [password]);

  const getStrengthText = () => {
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
        return 'Muito forte';
      default:
        return 'Muito fraca';
    }
  };

  const getStrengthColor = () => {
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
        return 'var(--success, #79c000)'; // Verde Lima
      default:
        return 'var(--danger, #ff5252)';
    }
  };

  const isStrong = () => strength >= 4;
  const isWeak = () => strength <= 2;
  const getPercentage = () => Math.min((strength / 5) * 100, 100);

  return {
    strength,
    score,
    strengthText: getStrengthText(),
    strengthColor: getStrengthColor(),
    percentage: getPercentage(),
    isStrong: isStrong(),
    isWeak: isWeak()
  };
};

export default usePasswordStrength;
import React from 'react';
import './TermsModal.css';

const TermsModal = ({ isOpen, onClose, type = 'terms' }) => {
  if (!isOpen) return null;

  const termsContent = {
    terms: {
      title: 'Termos de Uso',
      content: (
        <div className="terms-content">
          <h3>1. Aceitação dos Termos</h3>
          <p>
            Ao acessar e usar o Lingua Nova, você concorda em cumprir estes Termos de Uso. 
            Se você não concordar com qualquer parte destes termos, não deve usar nosso serviço.
          </p>

          <h3>2. Descrição do Serviço</h3>
          <p>
            O Lingua Nova é uma plataforma de aprendizado de idiomas que oferece diálogos interativos, 
            exercícios e recursos educacionais para ajudar usuários a aprender novos idiomas.
          </p>

          <h3>3. Conta de Usuário</h3>
          <p>
            Para acessar certas funcionalidades, você deve criar uma conta. Você é responsável por:
          </p>
          <ul>
            <li>Manter a confidencialidade de suas credenciais de login</li>
            <li>Todas as atividades que ocorrem em sua conta</li>
            <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
          </ul>

          <h3>4. Uso Aceitável</h3>
          <p>Você concorda em não:</p>
          <ul>
            <li>Usar o serviço para fins ilegais ou não autorizados</li>
            <li>Interferir ou interromper o serviço ou servidores</li>
            <li>Tentar obter acesso não autorizado a qualquer parte do serviço</li>
            <li>Transmitir vírus, malware ou código malicioso</li>
          </ul>

          <h3>5. Conteúdo do Usuário</h3>
          <p>
            Você mantém os direitos sobre o conteúdo que cria, mas nos concede uma licença 
            para usar, modificar e exibir esse conteúdo conforme necessário para fornecer o serviço.
          </p>

          <h3>6. Propriedade Intelectual</h3>
          <p>
            Todo o conteúdo, recursos e funcionalidades do Lingua Nova são propriedade da empresa 
            e são protegidos por leis de direitos autorais, marcas registradas e outras leis de propriedade intelectual.
          </p>

          <h3>7. Limitação de Responsabilidade</h3>
          <p>
            O Lingua Nova é fornecido "como está" sem garantias de qualquer tipo. 
            Não seremos responsáveis por danos indiretos, incidentais ou consequenciais.
          </p>

          <h3>8. Modificações</h3>
          <p>
            Reservamo-nos o direito de modificar estes termos a qualquer momento. 
            As alterações entrarão em vigor imediatamente após a publicação.
          </p>

          <h3>9. Rescisão</h3>
          <p>
            Podemos encerrar ou suspender sua conta a qualquer momento, por qualquer motivo, 
            sem aviso prévio.
          </p>

          <h3>10. Lei Aplicável</h3>
          <p>
            Estes termos são regidos pelas leis do Brasil. Qualquer disputa será resolvida 
            nos tribunais competentes do Brasil.
          </p>

          <p className="last-updated">
            <strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      )
    },
    privacy: {
      title: 'Política de Privacidade',
      content: (
        <div className="terms-content">
          <h3>1. Informações que Coletamos</h3>
          <p>Coletamos as seguintes informações:</p>
          <ul>
            <li><strong>Informações de Conta:</strong> Nome, email, senha (criptografada)</li>
            <li><strong>Informações de Uso:</strong> Progresso de aprendizado, preferências, estatísticas</li>
            <li><strong>Informações Técnicas:</strong> Endereço IP, tipo de navegador, sistema operacional</li>
            <li><strong>Cookies:</strong> Para melhorar a experiência do usuário</li>
          </ul>

          <h3>2. Como Usamos suas Informações</h3>
          <p>Usamos suas informações para:</p>
          <ul>
            <li>Fornecer e melhorar nossos serviços</li>
            <li>Personalizar sua experiência de aprendizado</li>
            <li>Comunicar-nos com você sobre atualizações e novidades</li>
            <li>Analisar o uso da plataforma para melhorias</li>
            <li>Garantir a segurança da plataforma</li>
          </ul>

          <h3>3. Compartilhamento de Informações</h3>
          <p>Não vendemos suas informações pessoais. Podemos compartilhar informações apenas:</p>
          <ul>
            <li>Com seu consentimento explícito</li>
            <li>Para cumprir obrigações legais</li>
            <li>Com provedores de serviços terceirizados (sob acordos de confidencialidade)</li>
            <li>Em caso de fusão, aquisição ou venda de ativos</li>
          </ul>

          <h3>4. Segurança dos Dados</h3>
          <p>
            Implementamos medidas de segurança técnicas e organizacionais para proteger 
            suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição.
          </p>

          <h3>5. Seus Direitos</h3>
          <p>Você tem o direito de:</p>
          <ul>
            <li>Acessar suas informações pessoais</li>
            <li>Corrigir informações incorretas</li>
            <li>Solicitar a exclusão de suas informações</li>
            <li>Portabilidade de dados</li>
            <li>Retirar o consentimento a qualquer momento</li>
          </ul>

          <h3>6. Cookies e Tecnologias Similares</h3>
          <p>
            Usamos cookies para melhorar sua experiência. Você pode controlar o uso de cookies 
            através das configurações do seu navegador.
          </p>

          <h3>7. Retenção de Dados</h3>
          <p>
            Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir 
            os propósitos descritos nesta política ou conforme exigido por lei.
          </p>

          <h3>8. Transferências Internacionais</h3>
          <p>
            Suas informações podem ser transferidas e processadas em países fora do Brasil. 
            Garantimos que essas transferências atendam aos padrões de proteção adequados.
          </p>

          <h3>9. Menores de Idade</h3>
          <p>
            Nosso serviço não é direcionado a menores de 13 anos. Não coletamos intencionalmente 
            informações pessoais de crianças menores de 13 anos.
          </p>

          <h3>10. Alterações nesta Política</h3>
          <p>
            Podemos atualizar esta política periodicamente. Notificaremos sobre alterações 
            significativas por email ou através da plataforma.
          </p>

          <h3>11. Contato</h3>
          <p>
            Para questões sobre esta política de privacidade, entre em contato conosco em: 
            <a href="mailto:privacy@linguanova.com">privacy@linguanova.com</a>
          </p>

          <p className="last-updated">
            <strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      )
    }
  };

  const currentContent = termsContent[type];

  return (
    <div className="terms-modal-overlay" onClick={onClose}>
      <div className="terms-modal" onClick={(e) => e.stopPropagation()}>
        <div className="terms-modal-header">
          <h2>{currentContent.title}</h2>
          <button 
            className="close-btn"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        
        <div className="terms-modal-body">
          {currentContent.content}
        </div>
        
        <div className="terms-modal-footer">
          <button 
            className="accept-btn"
            onClick={onClose}
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
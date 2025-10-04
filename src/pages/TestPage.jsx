import React from 'react';

const TestPage = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Página de Teste</h1>
      <p>Se você consegue ver esta página, o React está funcionando corretamente.</p>
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => alert('Botão funcionando!')}>Testar Interação</button>
      </div>
    </div>
  );
};

export default TestPage;
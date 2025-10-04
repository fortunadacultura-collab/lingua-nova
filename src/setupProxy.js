const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy para assets estáticos
  app.use(
    '/assets',
    createProxyMiddleware({
      target: 'http://localhost:5001',
      changeOrigin: true,
      logLevel: 'debug'
    })
  );
  
  // Proxy para uploads
  app.use(
    '/uploads',
    createProxyMiddleware({
      target: 'http://localhost:5001',
      changeOrigin: true,
      logLevel: 'debug'
    })
  );
  
  // Servir arquivos de áudio diretamente da pasta public local
  const express = require('express');
  const path = require('path');
  app.use('/audio', express.static(path.join(__dirname, '../public/audio')));
  
  // Proxy para arquivos públicos
  app.use(
    '/public',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
      logLevel: 'debug'
    })
  );
  
  // Proxy para API routes
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5001',
      changeOrigin: true,
      logLevel: 'debug'
    })
  );
  
  // Proxy específico para rotas de auth do backend (não incluir /auth/callback)
  app.use(
    ['/auth/google', '/auth/facebook', '/auth/github'],
    createProxyMiddleware({
      target: 'http://localhost:5001',
      changeOrigin: true,
      logLevel: 'debug'
    })
  );
};

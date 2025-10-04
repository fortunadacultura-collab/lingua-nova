import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
import { ImageAssetProvider } from './hooks/useImageAsset';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import AdminProtectedRoute from './components/ProtectedRoute/AdminProtectedRoute';
import Home from './pages/Home';
import Dialogues from './pages/Dialogues';
import Stories from './pages/Stories';
import MyDecks from './pages/MyDecks';
import NewDeck from './pages/NewDeck';
import AddCards from './pages/AddCards';
import Study from './pages/Study';
import EditDeck from './pages/EditDeck';
import Flashcards from './pages/Flashcards';
import ImportExport from './pages/ImportExport';
import LanguageTest from './pages/LanguageTest';
import LanguageSelectorDemo from './components/Demo/LanguageSelectorDemo';
import LanguageAnalysis from './components/Demo/LanguageAnalysis';
import TestPage from './pages/TestPage';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import AuthConfirmation from './pages/AuthConfirmation';
import Profile from './pages/Profile';
import ProfileSettings from './pages/ProfileSettings';
import Community from './pages/Community';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import DeletedUsers from './pages/DeletedUsers';
import './styles/globals.css';
import './styles/layout.css';

function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <LanguageProvider>
          <ImageAssetProvider>
            <Router>
              <Layout>
              <Routes>
              {/* Rotas públicas */}
              <Route path="/" element={<Home />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/auth/confirmation" element={<AuthConfirmation />} />
              <Route path="/community" element={<Community />} />
                
                {/* Rotas admin */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={
                  <AdminProtectedRoute>
                    <AdminDashboard />
                  </AdminProtectedRoute>
                } />
                <Route path="/deleted-users" element={
                  <AdminProtectedRoute>
                    <DeletedUsers />
                  </AdminProtectedRoute>
                } />
              
              {/* Rotas protegidas - requerem autenticação */}
              <Route path="/dialogues" element={
                <ProtectedRoute>
                  <Dialogues />
                </ProtectedRoute>
              } />
              <Route path="/dialogues/:theme" element={
                <ProtectedRoute>
                  <Dialogues />
                </ProtectedRoute>
              } />
              <Route path="/stories" element={
                <ProtectedRoute>
                  <Stories />
                </ProtectedRoute>
              } />
              <Route path="/stories/:storyId" element={
                <ProtectedRoute>
                  <Stories />
                </ProtectedRoute>
              } />
              {/* Menu único de Flashcards com rotas aninhadas (corrigido para usar Outlet do componente pai) */}
              <Route element={<ProtectedRoute />}>
                <Route path="/flashcards/*" element={<Flashcards />}>
                  <Route index element={<MyDecks />} />
                  <Route path="my-decks" element={<MyDecks />} />
                  <Route path="new-deck" element={<NewDeck />} />
                  <Route path="add-cards" element={<AddCards />} />
                  <Route path="edit-deck" element={<EditDeck />} />
                  <Route path="study" element={<Study />} />
                  <Route path="import-export" element={<ImportExport />} />
                </Route>
              </Route>
              <Route path="/my-decks" element={
                <ProtectedRoute>
                  <MyDecks />
                </ProtectedRoute>
              } />
              <Route path="/new-deck" element={
                <ProtectedRoute>
                  <NewDeck />
                </ProtectedRoute>
              } />
              <Route path="/add-cards" element={
                <ProtectedRoute>
                  <AddCards />
                </ProtectedRoute>
              } />
              <Route path="/study" element={
                <ProtectedRoute>
                  <Study />
                </ProtectedRoute>
              } />
              <Route path="/test" element={
                <ProtectedRoute>
                  <LanguageTest />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/profile/settings" element={
                <ProtectedRoute>
                  <ProfileSettings />
                </ProtectedRoute>
              } />
              
              {/* Rotas de demonstração - podem permanecer públicas */}
              <Route path="/demo" element={<LanguageSelectorDemo />} />
              <Route path="/analysis" element={<LanguageAnalysis />} />
              <Route path="/test-page" element={<TestPage />} />
              </Routes>
            </Layout>
          </Router>
        </ImageAssetProvider>
      </LanguageProvider>
    </AdminProvider>
    </AuthProvider>
  );
}

export default App;
/* ==========================================
   Main App Component
   Root component with routing and providers
   ========================================== */

import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/common/Toast';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Loading from './components/common/Loading';

// Page imports
import Articles from './pages/Articles/Articles';
import ArticleDetail from './pages/ArticleDetail/ArticleDetail';
import ArticleEditor from './pages/ArticleEditor/ArticleEditor';
import Login from './pages/Login/Login';
import Profile from './pages/Profile/Profile';
import Tags from './pages/Tags/Tags';
import Favorites from './pages/Favorites/Favorites';
import RecentlyViewed from './pages/RecentlyViewed/RecentlyViewed';

// Import ALL CSS styles
import './styles/variables.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/icons.css';
import './styles/components/buttons.css';
import './styles/components/forms.css';
import './styles/components/cards.css';
import './styles/views/articles.css';
import './styles/views/article-detail.css';
import './styles/views/editor.css';
import './styles/views/tags-manager.css';
import './styles/views/profile.css';
import './styles/views/recently-viewed.css';
import './styles/features/attachments.css';
import './styles/features/ui-controls.css';
import './styles/responsive.css';
import './App.css';

// Protected Route wrapper
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

// App wrapper that uses auth
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Articles />} />
        <Route path="/articles/:id" element={<ArticleDetail />} />
        <Route path="/editor" element={<ArticleEditor />} />
        <Route path="/editor/:id" element={<ArticleEditor />} />
        <Route path="/tags" element={<Tags />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/recently-viewed" element={<RecentlyViewed />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App
function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;

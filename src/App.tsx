/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar, Footer } from './components/Navigation';
import { Home } from './pages/Home';
import { Blogs } from './pages/Blogs';
import { Publications } from './pages/Publications';
import { Gallery } from './pages/Gallery';
import { Contact } from './pages/Contact';
import { ContentDetail } from './pages/ContentDetail';
import { useAuth } from './admin/useAuth';
import { AdminLogin } from './admin/AdminLogin';
import { AdminLayout } from './admin/AdminLayout';
import { AdminDashboard } from './admin/AdminDashboard';
import { ContentList } from './admin/ContentList';
import { ContentEditor } from './admin/ContentEditor';
import { AdminGallery } from './admin/AdminGallery';
import { AdminProfile } from './admin/AdminProfile';

function AdminRoutes() {
  const { isAuthenticated, loading, login, logout, username } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="font-mono text-xs uppercase tracking-widest text-on-surface-variant animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={login} />;
  }

  return (
    <Routes>
      <Route element={<AdminLayout username={username || 'admin'} onLogout={logout} />}>
        <Route index element={<AdminDashboard />} />
        <Route path="publications" element={<ContentList />} />
        <Route path="publications/new" element={<ContentEditor />} />
        <Route path="publications/:id" element={<ContentEditor />} />
        <Route path="blogs" element={<ContentList />} />
        <Route path="blogs/new" element={<ContentEditor />} />
        <Route path="blogs/:id" element={<ContentEditor />} />
        <Route path="gallery" element={<AdminGallery />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>
    </Routes>
  );
}

function AppContent() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin/*" element={<AdminRoutes />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blogs/:id" element={<ContentDetail />} />
          <Route path="/publications" element={<Publications />} />
          <Route path="/publications/:id" element={<ContentDetail />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

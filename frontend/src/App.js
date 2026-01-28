import { useState, useEffect } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import NewDashboard from './pages/NewDashboard';
import AdminPanel from './pages/AdminPanel';
import PayscribePayment from './pages/PayscribePayment';
// import NewAdminPanel from './pages/NewAdminPanel';
import { Toaster } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

// Dynamic SEO Meta Tags Component
function DynamicSEO() {
  useEffect(() => {
    const loadSEO = async () => {
      try {
        const response = await axios.get(`${API}/api/public/branding`);
        const seo = response.data;
        
        // Update document title
        if (seo.seo_site_title) {
          document.title = seo.seo_site_title;
        }
        
        // Update meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && seo.seo_meta_description) {
          metaDesc.setAttribute('content', seo.seo_meta_description);
        }
        
        // Update keywords
        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (seo.seo_keywords) {
          if (!metaKeywords) {
            metaKeywords = document.createElement('meta');
            metaKeywords.name = 'keywords';
            document.head.appendChild(metaKeywords);
          }
          metaKeywords.setAttribute('content', seo.seo_keywords);
        }
        
        // Update author
        let metaAuthor = document.querySelector('meta[name="author"]');
        if (seo.seo_author) {
          if (!metaAuthor) {
            metaAuthor = document.createElement('meta');
            metaAuthor.name = 'author';
            document.head.appendChild(metaAuthor);
          }
          metaAuthor.setAttribute('content', seo.seo_author);
        }
        
        // Update OG tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle && seo.seo_site_title) {
          ogTitle.setAttribute('content', seo.seo_site_title);
        }
        
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc && seo.seo_meta_description) {
          ogDesc.setAttribute('content', seo.seo_meta_description);
        }
        
        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage && seo.seo_og_image) {
          ogImage.setAttribute('content', seo.seo_og_image);
        }
        
        const ogUrl = document.querySelector('meta[property="og:url"]');
        if (ogUrl && seo.seo_canonical_url) {
          ogUrl.setAttribute('content', seo.seo_canonical_url);
        }
        
        // Update Twitter tags
        const twitterTitle = document.querySelector('meta[name="twitter:title"]');
        if (twitterTitle && seo.seo_site_title) {
          twitterTitle.setAttribute('content', seo.seo_site_title);
        }
        
        const twitterDesc = document.querySelector('meta[name="twitter:description"]');
        if (twitterDesc && seo.seo_meta_description) {
          twitterDesc.setAttribute('content', seo.seo_meta_description);
        }
        
        const twitterImage = document.querySelector('meta[name="twitter:image"]');
        if (twitterImage && seo.seo_og_image) {
          twitterImage.setAttribute('content', seo.seo_og_image);
        }
        
        // Update canonical URL
        let canonical = document.querySelector('link[rel="canonical"]');
        if (seo.seo_canonical_url) {
          if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
          }
          canonical.setAttribute('href', seo.seo_canonical_url);
        }
        
      } catch (error) {
        console.log('Failed to load SEO settings:', error);
      }
    };
    
    loadSEO();
  }, []);
  
  return null;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="App">
      <DynamicSEO />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={!user ? <Landing setUser={setUser} /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={user ? <NewDashboard user={user} setUser={setUser} /> : <Navigate to="/" />} />
          <Route path="/admin" element={user?.is_admin ? <AdminPanel user={user} setUser={setUser} /> : <Navigate to="/dashboard" />} />
          <Route path="/payscribe-payment" element={user ? <PayscribePayment /> : <Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;

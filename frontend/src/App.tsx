import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RegisterForm } from './components/auth/RegisterForm';
import { LoginForm } from './components/auth/LoginForm';
import { Editor } from './components/editor/Editor';
import { KeystrokeBatch } from '@shared/types';

function MainContent() {
  const { user, logout } = useAuth();
  const [health, setHealth] = useState<{ status: string; timestamp: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthForm, setShowAuthForm] = useState<'login' | 'register' | null>(null);
  const [showKeystrokeDebugger, setShowKeystrokeDebugger] = useState(false);

  // Handle hash-based navigation for auth forms
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash === 'login' || hash === 'register') {
        setShowAuthForm(hash);
      }
    };

    // Check initial hash
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setHealth(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Health check failed:', err);
        setLoading(false);
      });
  }, []);

  if (showAuthForm === 'register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <RegisterForm />
          <div className="text-center mt-4">
            <button
              onClick={() => {
                setShowAuthForm(null);
                window.location.hash = '';
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showAuthForm === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <LoginForm />
          <div className="text-center mt-4">
            <button
              onClick={() => {
                setShowAuthForm(null);
                window.location.hash = '';
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If user is logged in, show the editor
  if (user) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Signify</h1>
              <div className="flex items-center gap-4">
                <span className="text-gray-600">Welcome, {user.display_name}</span>
                <button
                  onClick={() => setShowKeystrokeDebugger(!showKeystrokeDebugger)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    showKeystrokeDebugger 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {showKeystrokeDebugger ? '🐛 Hide Debug' : '🐛 Show Debug'}
                </button>
                <button
                  onClick={logout}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Editor Interface */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Write Your Human-Verified Content</h2>
                <p className="text-gray-600">
                  Start typing to create content with keystroke verification. Copy/paste is disabled to ensure 100% human authorship.
                </p>
              </div>
              
              <Editor 
                onContentChange={(content, htmlContent) => {
                  // TODO: Save draft with keystroke data in Step 4
                  console.log('Content changed:', { content, htmlContent });
                }}
                onKeystrokeCapture={(events) => {
                  console.log('Keystroke events updated:', events.length);
                }}
                onKeystrokeBatch={(batch: KeystrokeBatch) => {
                  console.log('Keystroke batch received:', batch);
                }}
                showKeystrokeDebugger={showKeystrokeDebugger}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-6xl font-bold text-gray-900">
              Signify
            </h1>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAuthForm('login');
                  window.location.hash = 'login';
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setShowAuthForm('register');
                  window.location.hash = 'register';
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Register
              </button>
            </div>
          </div>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Prove your content is 100% human-written with keystroke verification. 
            Every character typed, every timestamp recorded, completely transparent.
          </p>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">System Status</h2>
            
            {loading ? (
              <div className="text-gray-500">Checking system health...</div>
            ) : health ? (
              <div className="space-y-2">
                <div className="flex justify-center items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-700 font-medium">System Online</span>
                </div>
                <div className="text-sm text-gray-500">
                  Last checked: {new Date(health.timestamp).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-center items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-red-700 font-medium">System Offline</span>
                </div>
                <div className="text-sm text-gray-500">
                  Unable to connect to backend
                </div>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-3">🔒 Keystroke Capture</h3>
              <p className="text-gray-600 text-sm">
                Every keystroke recorded with precise timestamps. No copy/paste allowed.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-3">📝 Immutable Publishing</h3>
              <p className="text-gray-600 text-sm">
                Published content cannot be edited, preserving keystroke integrity.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-3">🔍 Public Verification</h3>
              <p className="text-gray-600 text-sm">
                Complete keystroke timeline publicly viewable for transparency.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}

export default App;
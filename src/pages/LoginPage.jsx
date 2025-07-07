import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiUser, FiLock, FiLogIn } = FiIcons;

const LoginPage = () => {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { themeSettings } = useData();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(nickname, password);
      if (!success) {
        setError('Ongeldige inloggegevens');
      }
      // Login successful, user will be redirected by App component
    } catch (error) {
      setError('Er is een fout opgetreden bij het inloggen');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-color-outer, #8a1708)' }}>
      {/* Left Section - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/40"></div>
        <div className="relative z-10 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {themeSettings?.logoUrl && (
              <img
                src={themeSettings.logoUrl}
                alt="Logo"
                className="h-20 w-auto mx-auto mb-8 filter brightness-0 invert"
              />
            )}
            <h1 className="text-5xl font-bold mb-6">
              {themeSettings?.appName || 'Coaching App'}
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Welkom terug bij jouw persoonlijke coaching journey
            </p>
            <div className="space-y-4 text-lg opacity-80">
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Stel doelen en volg je voortgang</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Werk samen met je coach</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Behaal je persoonlijke doelen</span>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
      </div>

      {/* Right Section - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ backgroundColor: 'var(--bg-color-container, #ffffff)' }}>
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Inloggen
            </h2>
            <p className="text-gray-600">
              Voer je gegevens in om door te gaan
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gebruikersnaam
                </label>
                <div className="relative">
                  <SafeIcon icon={FiUser} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{ backgroundColor: 'var(--input-bg-color, #ffffff)' }}
                    placeholder="Voer je gebruikersnaam in"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wachtwoord
                </label>
                <div className="relative">
                  <SafeIcon icon={FiLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{ backgroundColor: 'var(--input-bg-color, #ffffff)' }}
                    placeholder="Voer je wachtwoord in"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--button-bg-color, #3B82F6)',
                  color: 'var(--button-text-color, #ffffff)'
                }}
                onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = 'var(--button-hover-color, #2563EB)')}
                onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = 'var(--button-bg-color, #3B82F6)')}
              >
                <SafeIcon icon={FiLogIn} />
                {loading ? 'Inloggen...' : 'Inloggen'}
              </motion.button>
            </form>
          </div>

          {/* Mobile Logo */}
          <div className="lg:hidden text-center mt-8">
            {themeSettings?.logoUrl && (
              <img
                src={themeSettings.logoUrl}
                alt="Logo"
                className="h-12 w-auto mx-auto mb-4"
              />
            )}
            <p className="text-gray-600 text-sm">
              {themeSettings?.appName || 'Coaching App'}
            </p>
          </div>

          {/* Demo Info */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 font-medium mb-2">
              Demo Toegang:
            </p>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Administrator: admin / admin123</p>
              <p>• Of gebruik je bestaande Supabase account</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
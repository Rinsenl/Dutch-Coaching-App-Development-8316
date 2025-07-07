import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { QuestLogin } from '@questlabs/react-sdk';
import { questConfig } from '../config/questConfig';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const QuestLoginPage = () => {
  const navigate = useNavigate();
  const { setUser, setIsAuthenticated } = useAuth();
  const { themeSettings } = useData();

  const handleLogin = ({ userId, token, newUser }) => {
    try {
      // Validate input data
      if (!userId || typeof userId !== 'string') {
        console.error('Invalid userId provided to handleLogin');
        return;
      }

      // Store authentication data safely
      try {
        localStorage.setItem('userId', userId);
        localStorage.setItem('questUserId', userId);
        if (token) {
          localStorage.setItem('token', token);
        }
      } catch (storageError) {
        console.error('Error storing auth data:', storageError);
      }
      
      // Create user object for the app
      const userData = {
        id: userId,
        nickname: `quest-${userId.slice(-8)}`,
        voornaam: 'Quest',
        achternaam: 'User',
        emailadres: `user@quest-${userId.slice(-8)}.com`,
        mobiel: '',
        geslacht: '',
        leeftijd: 0,
        geboortedatum: '',
        foto: '',
        role: 'participant',
        isQuestUser: true
      };
      
      // Set authentication state
      setUser(userData);
      setIsAuthenticated(true);
      
      // Store user data safely
      try {
        localStorage.setItem('currentUser', JSON.stringify(userData));
      } catch (storageError) {
        console.error('Error storing user data:', storageError);
      }
      
      // Navigate based on user status
      if (newUser) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error during Quest login:', error);
      // Don't leave the user in a broken state
      navigate('/login');
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

          {/* Quest Login Component */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <QuestLogin
              onSubmit={handleLogin}
              email={true}
              google={false}
              accent={questConfig.PRIMARY_COLOR}
              styling={{
                primaryColor: questConfig.PRIMARY_COLOR,
                borderRadius: '12px',
                fontSize: '16px'
              }}
            />
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
              <p>• Bestaande gebruiker: gebruik je Quest account</p>
              <p>• Nieuwe gebruiker: registreer via Quest Login</p>
              <p>• Fallback: admin / admin123</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default QuestLoginPage;
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { OnBoarding } from '@questlabs/react-sdk';
import { questConfig } from '../config/questConfig';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const QuestOnboardingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { themeSettings } = useData();
  const [answers, setAnswers] = useState({});

  // Safely get user ID and token
  const getUserId = () => {
    try {
      const sources = [
        () => localStorage.getItem('userId'),
        () => localStorage.getItem('questUserId'),
        () => user?.id
      ];

      for (const getSource of sources) {
        try {
          const userId = getSource();
          if (userId && userId !== 'undefined' && userId !== 'null' && userId.trim() !== '') {
            return userId;
          }
        } catch (sourceError) {
          console.warn('Error getting user ID from source:', sourceError);
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting user ID for onboarding:', error);
      return null;
    }
  };

  const getToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (token && token !== 'undefined' && token !== 'null' && token.trim() !== '') {
        return token;
      }
      return questConfig.TOKEN;
    } catch (error) {
      console.error('Error getting token for onboarding:', error);
      return questConfig.TOKEN;
    }
  };

  const userId = getUserId();
  const token = getToken();

  const getAnswers = () => {
    try {
      // Called when onboarding is completed
      console.log('Onboarding completed with answers:', answers);
      
      // Navigate to main dashboard after completion
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      navigate('/dashboard');
    }
  };

  if (!userId || !token) {
    // Redirect to login if no authentication data
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-color-outer, #8a1708)' }}>
      {/* Left Section - Welcome Message */}
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
              Welkom bij {themeSettings?.appName || 'Coaching App'}!
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Laten we je account personaliseren voor de beste ervaring
            </p>
            <div className="space-y-4 text-lg opacity-80">
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Stel je voorkeuren in</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Personaliseer je ervaring</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Begin je coaching journey</span>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
      </div>

      {/* Right Section - Onboarding Form */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ backgroundColor: 'var(--bg-color-container, #ffffff)' }}>
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Account Setup
            </h2>
            <p className="text-gray-600">
              Beantwoord een paar vragen om je ervaring te personaliseren
            </p>
          </div>

          {/* Quest Onboarding Component */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100" style={{ minHeight: '400px' }}>
            <OnBoarding
              userId={userId}
              token={token}
              questId={questConfig.QUEST_ONBOARDING_QUESTID}
              answer={answers}
              setAnswer={setAnswers}
              getAnswers={getAnswers}
              accent={questConfig.PRIMARY_COLOR}
              singleChoose="modal1"
              multiChoice="modal2"
              styling={{
                primaryColor: questConfig.PRIMARY_COLOR,
                borderRadius: '12px',
                fontSize: '16px',
                padding: '24px'
              }}
            >
              <OnBoarding.Header />
              <OnBoarding.Content />
              <OnBoarding.Footer />
            </OnBoarding>
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

          {/* Progress Info */}
          <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800 font-medium mb-2">
              Bijna klaar!
            </p>
            <p className="text-sm text-green-700">
              Na het voltooien van deze setup kun je direct aan de slag met je coaching doelen.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default QuestOnboardingPage;
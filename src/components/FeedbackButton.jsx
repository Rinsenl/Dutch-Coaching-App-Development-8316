import React, { useState } from 'react';
import { FeedbackWorkflow } from '@questlabs/react-sdk';
import { questConfig } from '../config/questConfig';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiMessageCircle, FiChevronLeft, FiChevronRight } = FiIcons;

const FeedbackButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { themeSettings } = useData();

  const handleToggle = () => {
    // Event tracking for feedback button click
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'feedback_button_click', {
        event_category: 'engagement',
        event_label: 'feedback_workflow',
        user_id: user?.id || 'anonymous'
      });
    }
    
    setIsOpen((prev) => !prev);
  };

  const getUserId = () => {
    try {
      // Priority: localStorage userId > current user ID > fallback to config
      const sources = [
        () => localStorage.getItem('userId'),
        () => localStorage.getItem('questUserId'),
        () => user?.id,
        () => questConfig.USER_ID
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

      return questConfig.USER_ID;
    } catch (error) {
      console.error('Error getting user ID for feedback:', error);
      return questConfig.USER_ID;
    }
  };

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        onClick={handleToggle}
        className="fixed top-1/2 -right-10 transform -translate-y-1/2 rotate-[270deg] 
                   flex items-center gap-2 px-4 py-2 text-white rounded-t-md rounded-b-none 
                   shadow-lg hover:shadow-xl transition-all duration-300 z-50 
                   hover:-right-8 group"
        style={{ 
          backgroundColor: themeSettings?.buttonBackgroundColor || questConfig.PRIMARY_COLOR,
          minWidth: '120px'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = themeSettings?.buttonHoverColor || '#2d8f5f';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = themeSettings?.buttonBackgroundColor || questConfig.PRIMARY_COLOR;
        }}
        title="Deel je feedback met ons"
      >
        <div className="w-fit h-fit rotate-90 transition-all duration-300 group-hover:scale-110">
          <SafeIcon 
            icon={isOpen ? FiChevronRight : FiChevronLeft} 
            className="text-lg" 
          />
        </div>
        <span className="text-white text-sm font-medium leading-none">
          Feedback
        </span>
      </button>

      {/* Feedback Workflow Component */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <div className="flex items-center gap-3">
                <SafeIcon icon={FiMessageCircle} className="text-xl text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Deel je feedback
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                title="Sluiten"
              >
                <SafeIcon icon={FiIcons.FiX} className="text-xl" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <FeedbackWorkflow
                uniqueUserId={getUserId()}
                questId={questConfig.QUEST_FEEDBACK_QUESTID}
                isOpen={isOpen}
                accent={themeSettings?.buttonBackgroundColor || questConfig.PRIMARY_COLOR}
                onClose={() => setIsOpen(false)}
                styling={{
                  primaryColor: themeSettings?.buttonBackgroundColor || questConfig.PRIMARY_COLOR,
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <FeedbackWorkflow.ThankYou />
              </FeedbackWorkflow>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackButton;
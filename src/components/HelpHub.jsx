import React from 'react';
import { HelpHub } from '@questlabs/react-sdk';
import { questConfig } from '../config/questConfig';

const AppHelpHub = () => {
  // Get userId from localStorage or use default with proper error handling
  const getUserId = () => {
    try {
      // Try multiple sources for user ID
      const sources = [
        () => localStorage.getItem('userId'),
        () => localStorage.getItem('questUserId'),
        () => {
          const currentUserStr = localStorage.getItem('currentUser');
          if (currentUserStr && currentUserStr !== 'undefined' && currentUserStr !== 'null') {
            const currentUser = JSON.parse(currentUserStr);
            return currentUser?.id;
          }
          return null;
        }
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

      // Fallback to config default
      return questConfig.USER_ID;
    } catch (error) {
      console.error('Error getting user ID for HelpHub:', error);
      return questConfig.USER_ID;
    }
  };

  return (
    <div style={{ zIndex: 9999 }}>
      <HelpHub
        uniqueUserId={getUserId()}
        questId={questConfig.QUEST_HELP_QUESTID}
        accent={questConfig.PRIMARY_COLOR}
        botLogo={{
          logo: 'https://quest-media-storage-bucket.s3.us-east-2.amazonaws.com/1741000949338-Vector%20%282%29.png'
        }}
        style={{
          zIndex: 9999,
          position: 'fixed'
        }}
      />
    </div>
  );
};

export default AppHelpHub;
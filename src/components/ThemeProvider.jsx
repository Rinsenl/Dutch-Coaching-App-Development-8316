import React, { useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const ThemeProvider = ({ children }) => {
  const { themeSettings } = useData();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Apply theme settings to CSS custom properties
    const root = document.documentElement;
    
    // FIXED: Always use global/default theme for login page
    // Only use organization theme when authenticated with organization
    let effectiveTheme;
    
    if (!isAuthenticated || !user) {
      // Use global/default theme for login page
      console.log('🎨 Using global theme for login page');
      effectiveTheme = {
        appName: 'Coaching App',
        logoUrl: '',
        containerMaxWidth: '1290px',
        useMaxWidth: true,
        backgroundColorOuter: '#8a1708',
        backgroundColorContainer: '#f7e6d9',
        backgroundColorCards: '#edede6',
        inputBackgroundColor: '#ffffff',
        buttonBackgroundColor: '#33a370',
        buttonHoverColor: '#8a1708',
        buttonTextColor: '#ffffff',
        headerBackgroundColor: '#edede6',
        primaryIconColor: '#3B82F6',
        secondaryIconColor: '#6B7280'
      };
    } else if (user.role === 'admin') {
      // Admin users always use global theme
      console.log('🎨 Using global theme for admin user');
      effectiveTheme = {
        appName: 'Coaching Platform',
        logoUrl: '',
        containerMaxWidth: '1290px',
        useMaxWidth: true,
        backgroundColorOuter: '#8a1708',
        backgroundColorContainer: '#f7e6d9',
        backgroundColorCards: '#edede6',
        inputBackgroundColor: '#ffffff',
        buttonBackgroundColor: '#33a370',
        buttonHoverColor: '#8a1708',
        buttonTextColor: '#ffffff',
        headerBackgroundColor: '#edede6',
        primaryIconColor: '#3B82F6',
        secondaryIconColor: '#6B7280'
      };
    } else {
      // Use organization theme for authenticated users with organizations
      console.log('🎨 Using organization theme for user:', user.role);
      effectiveTheme = themeSettings;
    }

    // Apply theme to CSS variables
    if (effectiveTheme.containerMaxWidth) {
      root.style.setProperty('--container-max-width', effectiveTheme.containerMaxWidth);
    }
    
    if (effectiveTheme.backgroundColorOuter) {
      root.style.setProperty('--bg-color-outer', effectiveTheme.backgroundColorOuter);
    }
    
    if (effectiveTheme.backgroundColorContainer) {
      root.style.setProperty('--bg-color-container', effectiveTheme.backgroundColorContainer);
    }
    
    if (effectiveTheme.backgroundColorCards) {
      root.style.setProperty('--bg-color-cards', effectiveTheme.backgroundColorCards);
    }
    
    if (effectiveTheme.inputBackgroundColor) {
      root.style.setProperty('--input-bg-color', effectiveTheme.inputBackgroundColor);
    }
    
    if (effectiveTheme.buttonBackgroundColor) {
      root.style.setProperty('--button-bg-color', effectiveTheme.buttonBackgroundColor);
    }
    
    if (effectiveTheme.buttonHoverColor) {
      root.style.setProperty('--button-hover-color', effectiveTheme.buttonHoverColor);
    }
    
    if (effectiveTheme.buttonTextColor) {
      root.style.setProperty('--button-text-color', effectiveTheme.buttonTextColor);
    }
    
    if (effectiveTheme.headerBackgroundColor) {
      root.style.setProperty('--header-bg-color', effectiveTheme.headerBackgroundColor);
    }
    
    if (effectiveTheme.primaryIconColor) {
      root.style.setProperty('--primary-icon-color', effectiveTheme.primaryIconColor);
    }
    
    if (effectiveTheme.secondaryIconColor) {
      root.style.setProperty('--secondary-icon-color', effectiveTheme.secondaryIconColor);
    }

    console.log('🎨 Applied theme:', effectiveTheme);
  }, [themeSettings, isAuthenticated, user]);

  return <>{children}</>;
};

export default ThemeProvider;
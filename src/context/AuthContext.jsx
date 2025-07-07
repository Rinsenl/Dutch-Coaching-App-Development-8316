import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved user session with proper error handling
    const initializeAuth = () => {
      try {
        const savedUser = localStorage.getItem('currentUser');
        
        // Only try to parse if we have a valid string that's not 'undefined' or 'null'
        if (savedUser && savedUser !== 'undefined' && savedUser !== 'null' && savedUser.trim() !== '') {
          try {
            const userData = JSON.parse(savedUser);
            if (userData && typeof userData === 'object' && userData.id) {
              setUser(userData);
              setIsAuthenticated(true);
              // Set userId for Quest components
              localStorage.setItem('userId', userData.id);
            } else {
              // Invalid user data structure
              console.warn('Invalid user data structure, clearing localStorage');
              localStorage.removeItem('currentUser');
              localStorage.removeItem('userId');
            }
          } catch (parseError) {
            console.error('Error parsing saved user data:', parseError);
            // Clear corrupted data
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userId');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear all auth-related localStorage on error
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userId');
        localStorage.removeItem('token');
        localStorage.removeItem('questUserId');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (nickname, password) => {
    try {
      // First check for fallback admin account
      if (nickname === 'admin' && password === 'admin123') {
        const adminUser = {
          id: 'admin-fallback-001',
          nickname: 'admin',
          password: 'admin123',
          voornaam: 'Administrator',
          achternaam: 'System',
          emailadres: 'admin@coaching-app.local',
          mobiel: '',
          geslacht: '',
          leeftijd: 0,
          geboortedatum: '',
          foto: '',
          role: 'admin', // This is now the platform-wide admin
          isQuestUser: false
        };

        setUser(adminUser);
        setIsAuthenticated(true);
        
        // Safely stringify and store user data
        try {
          localStorage.setItem('currentUser', JSON.stringify(adminUser));
          localStorage.setItem('userId', adminUser.id);
        } catch (storageError) {
          console.error('Error storing admin user data:', storageError);
        }
        
        return true;
      }

      // Check for manager login in Supabase organizations_admin table
      try {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations_admin')
          .select('*')
          .eq('manager_email', nickname)
          .eq('manager_password', password)
          .single();

        if (!orgError && orgData) {
          const managerUser = {
            id: `manager-${orgData.id}`,
            nickname: orgData.manager_email,
            password: orgData.manager_password,
            voornaam: orgData.manager_name.split(' ')[0],
            achternaam: orgData.manager_name.split(' ').slice(1).join(' '),
            emailadres: orgData.manager_email,
            mobiel: '',
            geslacht: '',
            leeftijd: 0,
            geboortedatum: '',
            foto: '',
            role: 'manager', // Organization manager
            organizationId: orgData.id, // IMPORTANT: Store organization ID
            organizationName: orgData.name,
            isQuestUser: false
          };

          setUser(managerUser);
          setIsAuthenticated(true);
          
          // Safely stringify and store user data
          try {
            localStorage.setItem('currentUser', JSON.stringify(managerUser));
            localStorage.setItem('userId', managerUser.id);
          } catch (storageError) {
            console.error('Error storing manager user data:', storageError);
          }
          
          return true;
        }
      } catch (managerError) {
        console.log('Manager login check failed:', managerError);
        // Continue to regular user login
      }

      // Query Supabase for user with matching credentials
      const { data: users, error } = await supabase
        .from('users_coaching')
        .select('*')
        .eq('nickname', nickname)
        .eq('password', password);

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      if (users && users.length > 0) {
        const foundUser = {
          id: users[0].id,
          nickname: users[0].nickname,
          password: users[0].password,
          voornaam: users[0].voornaam || '',
          achternaam: users[0].achternaam || '',
          emailadres: users[0].emailadres || '',
          mobiel: users[0].mobiel || '',
          geslacht: users[0].geslacht || '',
          leeftijd: users[0].leeftijd || 0,
          geboortedatum: users[0].geboortedatum || '',
          foto: users[0].foto || '',
          role: users[0].role || 'participant',
          organizationId: users[0].organization_id || null, // IMPORTANT: Store organization ID
          isQuestUser: false
        };

        setUser(foundUser);
        setIsAuthenticated(true);
        
        // Safely stringify and store user data
        try {
          localStorage.setItem('currentUser', JSON.stringify(foundUser));
          localStorage.setItem('userId', foundUser.id);
        } catch (storageError) {
          console.error('Error storing user data:', storageError);
        }
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    
    // Safe localStorage cleanup
    try {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userId');
      localStorage.removeItem('token');
      localStorage.removeItem('questUserId');
    } catch (error) {
      console.error('Error during logout cleanup:', error);
    }
  };

  const value = {
    user,
    setUser,
    isAuthenticated,
    setIsAuthenticated,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
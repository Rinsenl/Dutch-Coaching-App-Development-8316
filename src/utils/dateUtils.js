// Date utilities for age calculation and date formatting

/**
 * Calculate age from birth date
 * @param {string} birthDate - Birth date in YYYY-MM-DD format
 * @returns {number} Age in years
 */
export const calculateAge = (birthDate) => {
  if (!birthDate) return 0;
  
  try {
    const birth = new Date(birthDate);
    const today = new Date();
    
    // Check if birth date is valid
    if (isNaN(birth.getTime())) return 0;
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return Math.max(0, age);
  } catch (error) {
    console.error('Error calculating age:', error);
    return 0;
  }
};

/**
 * Format date for display
 * @param {string} dateString - Date string
 * @returns {string} Formatted date
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleDateString('nl-NL');
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Today's date
 */
export const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Validate birth date (not in future, reasonable age)
 * @param {string} birthDate - Birth date in YYYY-MM-DD format
 * @returns {object} Validation result
 */
export const validateBirthDate = (birthDate) => {
  if (!birthDate) {
    return { isValid: true, message: '' };
  }
  
  try {
    const birth = new Date(birthDate);
    const today = new Date();
    
    if (isNaN(birth.getTime())) {
      return { isValid: false, message: 'Ongeldige geboortedatum' };
    }
    
    if (birth > today) {
      return { isValid: false, message: 'Geboortedatum kan niet in de toekomst zijn' };
    }
    
    const age = calculateAge(birthDate);
    if (age > 120) {
      return { isValid: false, message: 'Geboortedatum is niet realistisch' };
    }
    
    return { isValid: true, message: '' };
  } catch (error) {
    return { isValid: false, message: 'Fout bij validatie geboortedatum' };
  }
};
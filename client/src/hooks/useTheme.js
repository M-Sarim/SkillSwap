import { useContext } from 'react';
import ThemeContext from '../context/ThemeContext';

/**
 * Custom hook to access the theme context
 * @returns {Object} Theme context with theme, toggleTheme, and setThemeMode
 */
const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

export default useTheme;

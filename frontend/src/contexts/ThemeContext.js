import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [primaryColor, setPrimaryColor] = useState('#007bff');

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    const savedPrimaryColor = localStorage.getItem('primaryColor');
    
    if (savedTheme) {
      setTheme(savedTheme);
    }
    
    if (savedPrimaryColor) {
      setPrimaryColor(savedPrimaryColor);
    }
    
    // Apply theme to document
    applyTheme(savedTheme || 'light', savedPrimaryColor || '#007bff');
  }, []);

  const applyTheme = (newTheme, newPrimaryColor) => {
    document.documentElement.setAttribute('data-theme', newTheme);
    document.documentElement.style.setProperty('--primary-color', newPrimaryColor);
    
    // Update Bootstrap CSS variables if needed
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.style.setProperty('--bs-body-bg', '#1a1a1a');
      root.style.setProperty('--bs-body-color', '#ffffff');
      root.style.setProperty('--bs-border-color', '#404040');
    } else {
      root.style.setProperty('--bs-body-bg', '#ffffff');
      root.style.setProperty('--bs-body-color', '#212529');
      root.style.setProperty('--bs-border-color', '#dee2e6');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme, primaryColor);
  };

  const changePrimaryColor = (color) => {
    setPrimaryColor(color);
    localStorage.setItem('primaryColor', color);
    applyTheme(theme, color);
  };

  const value = {
    theme,
    primaryColor,
    toggleTheme,
    changePrimaryColor,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export { ThemeContext };

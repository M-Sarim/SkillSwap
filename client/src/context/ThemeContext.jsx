import { createContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Check if user has a saved theme preference or use system preference
  const getInitialTheme = () => {
    // Check if we're in a browser environment
    if (typeof window !== "undefined") {
      // Check if theme is stored in localStorage
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) {
        return savedTheme;
      }

      // Check if user has system preference for dark mode
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        return "dark";
      }
    }

    // Default to light mode
    return "light";
  };

  // Use a regular value instead of a function to avoid re-computation on every render
  const initialTheme = getInitialTheme();
  const [theme, setTheme] = useState(initialTheme);

  // Apply theme to document element
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== "undefined") {
      const root = window.document.documentElement;

      // Remove previous theme class
      root.classList.remove("light", "dark");

      // Add current theme class
      root.classList.add(theme);

      // Store theme preference in localStorage
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  // Toggle between light and dark mode
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  // Set a specific theme
  const setThemeMode = (mode) => {
    if (mode === "light" || mode === "dark") {
      setTheme(mode);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;

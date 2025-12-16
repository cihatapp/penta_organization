/**
 * Theme Management Module
 * Handles dark/light theme switching with localStorage persistence
 * Default: Dark theme
 */

const ThemeManager = (function() {
  'use strict';

  // Constants
  const STORAGE_KEY = 'penta-theme';
  const THEME_DARK = 'dark';
  const THEME_LIGHT = 'light';
  const DATA_ATTRIBUTE = 'data-theme';

  // DOM Elements
  let toggleButton = null;
  let htmlElement = null;

  // Current theme state
  let currentTheme = THEME_DARK;

  /**
   * Get theme from localStorage
   */
  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      console.warn('localStorage not available:', e);
      return null;
    }
  }

  /**
   * Save theme to localStorage
   */
  function saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      console.warn('Could not save theme to localStorage:', e);
    }
  }

  /**
   * Calculate initial theme based on preference cascade:
   * 1. localStorage value
   * 2. Default (dark)
   */
  function calculateInitialTheme() {
    const storedTheme = getStoredTheme();
    if (storedTheme && (storedTheme === THEME_DARK || storedTheme === THEME_LIGHT)) {
      return storedTheme;
    }
    // Default is dark
    return THEME_DARK;
  }

  /**
   * Apply theme to DOM
   */
  function applyTheme(theme) {
    htmlElement.setAttribute(DATA_ATTRIBUTE, theme);
    currentTheme = theme;
    updateToggleButton();
    updateLogos();
    updateFavicon();
  }

  /**
   * Update favicon based on theme
   */
  function updateFavicon() {
    const favicon = document.querySelector('link[rel="icon"]');
    const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');

    // Dark theme uses light logo, light theme uses dark logo
    const faviconPath = currentTheme === THEME_DARK
      ? './assets/images/logo.png'
      : './assets/images/logo_dark.png';

    if (favicon) {
      favicon.href = faviconPath;
    }
    if (appleTouchIcon) {
      appleTouchIcon.href = faviconPath;
    }
  }

  /**
   * Update toggle button state/icon
   */
  function updateToggleButton() {
    if (!toggleButton) return;

    const isDark = currentTheme === THEME_DARK;
    const sunIcon = toggleButton.querySelector('.icon-sun');
    const moonIcon = toggleButton.querySelector('.icon-moon');

    if (sunIcon && moonIcon) {
      // In dark mode, show sun (to switch to light)
      // In light mode, show moon (to switch to dark)
      sunIcon.style.display = isDark ? 'block' : 'none';
      moonIcon.style.display = isDark ? 'none' : 'block';
    }

    toggleButton.setAttribute('aria-label',
      isDark ? 'Switch to light mode' : 'Switch to dark mode'
    );
  }

  /**
   * Update logo based on theme
   */
  function updateLogos() {
    const logos = document.querySelectorAll('[data-theme-logo]');
    logos.forEach(logo => {
      const darkSrc = logo.dataset.logoDark;
      const lightSrc = logo.dataset.logoLight;
      if (darkSrc && lightSrc) {
        logo.src = currentTheme === THEME_DARK ? darkSrc : lightSrc;
      }
    });
  }

  /**
   * Toggle between themes
   */
  function toggleTheme() {
    const newTheme = currentTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK;
    saveTheme(newTheme);
    applyTheme(newTheme);

    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('themechange', {
      detail: { theme: newTheme }
    }));
  }

  /**
   * Set specific theme
   */
  function setTheme(theme) {
    if (theme !== THEME_DARK && theme !== THEME_LIGHT) {
      console.warn('Invalid theme:', theme);
      return;
    }
    saveTheme(theme);
    applyTheme(theme);

    window.dispatchEvent(new CustomEvent('themechange', {
      detail: { theme }
    }));
  }

  /**
   * Initialize theme manager
   */
  function init() {
    htmlElement = document.documentElement;
    toggleButton = document.querySelector('[data-theme-toggle]');

    // Apply initial theme immediately (prevent flash)
    const initialTheme = calculateInitialTheme();
    applyTheme(initialTheme);

    // Add event listener to toggle button
    if (toggleButton) {
      toggleButton.addEventListener('click', toggleTheme);
    }

    // Listen for system preference changes (optional)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      // Only auto-switch if user hasn't set a preference
      if (!getStoredTheme()) {
        applyTheme(e.matches ? THEME_DARK : THEME_LIGHT);
      }
    });

    console.log('ThemeManager initialized. Current theme:', currentTheme);
  }

  // Public API
  return {
    init,
    toggleTheme,
    setTheme,
    getCurrentTheme: () => currentTheme,
    isDark: () => currentTheme === THEME_DARK,
    isLight: () => currentTheme === THEME_LIGHT
  };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ThemeManager.init);
} else {
  // DOM already loaded
  ThemeManager.init();
}

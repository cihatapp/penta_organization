/**
 * Internationalization (i18n) Module
 * Handles language switching between English and Turkish
 * Default: English
 */

const I18nManager = (function() {
  'use strict';

  // Constants
  const STORAGE_KEY = 'penta-language';
  const DEFAULT_LANG = 'en';
  const SUPPORTED_LANGS = ['en', 'tr'];

  // Translation data cache
  let translations = {};
  let currentLang = DEFAULT_LANG;
  let isLoading = false;

  // DOM Elements
  let toggleButtons = null;

  /**
   * Load translation file
   */
  async function loadTranslations(lang) {
    if (translations[lang]) {
      return translations[lang];
    }

    try {
      const response = await fetch(`./assets/locales/${lang}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load ${lang} translations: ${response.status}`);
      }
      const data = await response.json();
      translations[lang] = data;
      return data;
    } catch (error) {
      console.error('Translation loading error:', error);
      return {};
    }
  }

  /**
   * Get stored language preference
   */
  function getStoredLanguage() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  /**
   * Save language preference
   */
  function saveLanguage(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.warn('Could not save language preference:', e);
    }
  }

  /**
   * Calculate initial language
   */
  function calculateInitialLanguage() {
    const storedLang = getStoredLanguage();
    if (storedLang && SUPPORTED_LANGS.includes(storedLang)) {
      return storedLang;
    }
    // Default to English
    return DEFAULT_LANG;
  }

  /**
   * Get nested translation value by key path (e.g., "nav.home")
   */
  function getTranslation(key, fallback = null) {
    if (!translations[currentLang]) {
      return fallback || key;
    }

    const keys = key.split('.');
    let value = translations[currentLang];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return fallback || key;
      }
    }

    return value || fallback || key;
  }

  /**
   * Translate all elements with data-i18n attribute
   */
  function translatePage() {
    // Translate text content
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.dataset.i18n;
      const translation = getTranslation(key);
      if (translation !== key) {
        element.textContent = translation;
      }
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.dataset.i18nPlaceholder;
      const translation = getTranslation(key);
      if (translation !== key) {
        element.placeholder = translation;
      }
    });

    // Translate aria-labels
    document.querySelectorAll('[data-i18n-aria]').forEach(element => {
      const key = element.dataset.i18nAria;
      const translation = getTranslation(key);
      if (translation !== key) {
        element.setAttribute('aria-label', translation);
      }
    });

    // Translate titles
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.dataset.i18nTitle;
      const translation = getTranslation(key);
      if (translation !== key) {
        element.title = translation;
      }
    });

    // Translate alt text
    document.querySelectorAll('[data-i18n-alt]').forEach(element => {
      const key = element.dataset.i18nAlt;
      const translation = getTranslation(key);
      if (translation !== key) {
        element.alt = translation;
      }
    });

    // Update HTML lang attribute
    document.documentElement.lang = currentLang;
  }

  /**
   * Update toggle button states
   */
  function updateToggleButtons() {
    if (!toggleButtons) return;

    toggleButtons.forEach(btn => {
      const lang = btn.dataset.lang;
      btn.classList.toggle('toggle__btn--active', lang === currentLang);
    });
  }

  /**
   * Switch language
   */
  async function setLanguage(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) {
      console.warn('Unsupported language:', lang);
      return;
    }

    if (isLoading) return;
    isLoading = true;

    try {
      // Load translations if not already loaded
      await loadTranslations(lang);

      currentLang = lang;
      saveLanguage(lang);
      translatePage();
      updateToggleButtons();

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('languagechange', {
        detail: { language: lang }
      }));

      console.log('Language changed to:', lang);
    } catch (error) {
      console.error('Error setting language:', error);
    } finally {
      isLoading = false;
    }
  }

  /**
   * Initialize i18n manager
   */
  async function init() {
    toggleButtons = document.querySelectorAll('[data-lang-toggle]');

    // Calculate and load initial language
    const initialLang = calculateInitialLanguage();

    try {
      await loadTranslations(initialLang);
      currentLang = initialLang;

      // Initial translation
      translatePage();
      updateToggleButtons();

      // Add event listeners to toggle buttons
      toggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const lang = btn.dataset.lang;
          if (lang !== currentLang) {
            setLanguage(lang);
          }
        });
      });

      console.log('I18nManager initialized. Current language:', currentLang);
    } catch (error) {
      console.error('Error initializing I18nManager:', error);
    }
  }

  // Public API
  return {
    init,
    setLanguage,
    getTranslation,
    t: getTranslation, // Shorthand
    getCurrentLanguage: () => currentLang,
    getSupportedLanguages: () => [...SUPPORTED_LANGS],
    isReady: () => Object.keys(translations).length > 0
  };
})();

/**
 * Services Module
 * Handles service card filtering functionality
 */

const ServicesManager = (function() {
  'use strict';

  // DOM Elements
  let filterButtons = null;
  let serviceCards = null;

  // State
  let currentFilter = 'all';

  /**
   * Filter service cards by category
   */
  function filterCards(category) {
    currentFilter = category;

    // Update filter button states
    filterButtons.forEach(btn => {
      const isActive = btn.dataset.filter === category;
      btn.classList.toggle('filter-tab--active', isActive);
      btn.setAttribute('aria-pressed', isActive);
    });

    // Filter and animate cards
    serviceCards.forEach(card => {
      const cardCategory = card.dataset.category;
      const shouldShow = category === 'all' || cardCategory === category;

      if (shouldShow) {
        card.classList.remove('service-card--hidden');
        card.style.display = '';
        // Re-trigger animation
        card.style.animation = 'none';
        card.offsetHeight; // Force reflow
        card.style.animation = '';
      } else {
        card.classList.add('service-card--hidden');
        // Hide after animation completes
        setTimeout(() => {
          if (card.classList.contains('service-card--hidden')) {
            card.style.display = 'none';
          }
        }, 300);
      }
    });

    // Update URL hash for bookmarking
    if (category !== 'all') {
      history.replaceState(null, '', `#${category}`);
    } else {
      history.replaceState(null, '', window.location.pathname);
    }
  }

  /**
   * Handle filter button click
   */
  function handleFilterClick(e) {
    const button = e.target.closest('[data-filter]');
    if (!button) return;

    const category = button.dataset.filter;
    filterCards(category);
  }

  /**
   * Check URL hash and apply filter
   */
  function checkUrlHash() {
    const hash = window.location.hash.slice(1);
    if (hash && filterButtons) {
      const matchingButton = Array.from(filterButtons).find(btn => btn.dataset.filter === hash);
      if (matchingButton) {
        filterCards(hash);
      }
    }
  }

  /**
   * Initialize services module
   */
  function init() {
    // Only run on services page
    const servicesSection = document.querySelector('.services-section');
    if (!servicesSection) return;

    filterButtons = servicesSection.querySelectorAll('[data-filter]');
    serviceCards = servicesSection.querySelectorAll('.service-card');

    if (serviceCards.length === 0) {
      console.log('ServicesManager: No service cards found');
      return;
    }

    // Add click listeners to filter buttons
    filterButtons.forEach(btn => {
      btn.addEventListener('click', handleFilterClick);
      btn.setAttribute('aria-pressed', btn.classList.contains('filter-tab--active'));
    });

    // Check URL hash on load
    checkUrlHash();

    console.log('ServicesManager: Initialized with', serviceCards.length, 'cards');
  }

  // Public API
  return {
    init,
    filterCards
  };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ServicesManager.init);
} else {
  ServicesManager.init();
}

/**
 * Portfolio Module
 * Handles filtering, lightbox, and gallery functionality
 */

const PortfolioManager = (function() {
  'use strict';

  // DOM Elements
  let filterButtons = null;
  let portfolioItems = null;
  let lightbox = null;
  let lightboxImage = null;
  let lightboxTitle = null;
  let lightboxDescription = null;
  let lightboxClose = null;
  let lightboxPrev = null;
  let lightboxNext = null;

  // State
  let currentFilter = 'all';
  let currentIndex = 0;
  let filteredItems = [];
  let isLightboxOpen = false;

  /**
   * Filter portfolio items
   */
  function filterItems(category) {
    currentFilter = category;

    // Update filter button states
    filterButtons.forEach(btn => {
      const isActive = btn.dataset.filter === category;
      btn.classList.toggle('filter-tab--active', isActive);
      btn.setAttribute('aria-pressed', isActive);
    });

    // Filter and animate items
    portfolioItems.forEach(item => {
      const itemCategory = item.dataset.category;
      const shouldShow = category === 'all' || itemCategory === category;

      if (shouldShow) {
        item.classList.remove('portfolio-card--hidden');
        item.style.display = '';
      } else {
        item.classList.add('portfolio-card--hidden');
        // Hide after animation
        setTimeout(() => {
          if (item.classList.contains('portfolio-card--hidden')) {
            item.style.display = 'none';
          }
        }, 300);
      }
    });

    // Update filtered items array for lightbox navigation
    updateFilteredItems();
  }

  /**
   * Update filtered items array
   */
  function updateFilteredItems() {
    filteredItems = Array.from(portfolioItems).filter(item => {
      return currentFilter === 'all' || item.dataset.category === currentFilter;
    });
  }

  /**
   * Open lightbox
   */
  function openLightbox(item) {
    if (!lightbox) return;

    currentIndex = filteredItems.indexOf(item);
    updateLightboxContent(item);

    lightbox.classList.add('lightbox--open');
    isLightboxOpen = true;
    document.body.style.overflow = 'hidden';

    // Focus trap
    lightboxClose.focus();
  }

  /**
   * Close lightbox
   */
  function closeLightbox() {
    if (!lightbox) return;

    lightbox.classList.remove('lightbox--open');
    isLightboxOpen = false;
    document.body.style.overflow = '';

    // Return focus to the item that opened the lightbox
    if (filteredItems[currentIndex]) {
      filteredItems[currentIndex].focus();
    }
  }

  /**
   * Update lightbox content
   */
  function updateLightboxContent(item) {
    const img = item.querySelector('img');
    const title = item.dataset.title || item.querySelector('.portfolio-card__title')?.textContent || '';
    const description = item.dataset.description || '';
    const fullSrc = item.dataset.fullImage || img?.src || '';

    if (lightboxImage) {
      lightboxImage.src = fullSrc;
      lightboxImage.alt = title;
    }

    if (lightboxTitle) {
      lightboxTitle.textContent = title;
    }

    if (lightboxDescription) {
      lightboxDescription.textContent = description;
    }

    // Update navigation buttons visibility
    updateNavButtons();
  }

  /**
   * Navigate lightbox
   */
  function navigateLightbox(direction) {
    currentIndex += direction;

    // Loop around
    if (currentIndex < 0) currentIndex = filteredItems.length - 1;
    if (currentIndex >= filteredItems.length) currentIndex = 0;

    updateLightboxContent(filteredItems[currentIndex]);
  }

  /**
   * Update navigation button states
   */
  function updateNavButtons() {
    if (!lightboxPrev || !lightboxNext) return;

    // Show/hide nav buttons based on item count
    const showNav = filteredItems.length > 1;
    lightboxPrev.style.display = showNav ? '' : 'none';
    lightboxNext.style.display = showNav ? '' : 'none';
  }

  /**
   * Handle keyboard navigation
   */
  function handleKeydown(e) {
    if (!isLightboxOpen) return;

    switch (e.key) {
      case 'Escape':
        closeLightbox();
        break;
      case 'ArrowLeft':
        navigateLightbox(-1);
        break;
      case 'ArrowRight':
        navigateLightbox(1);
        break;
      case 'Tab':
        // Focus trap within lightbox
        trapFocus(e);
        break;
    }
  }

  /**
   * Trap focus within lightbox
   */
  function trapFocus(e) {
    const focusableElements = lightbox.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }

  /**
   * Load more items (placeholder for lazy loading)
   */
  function loadMore() {
    const loadMoreBtn = document.querySelector('[data-load-more]');

    if (loadMoreBtn) {
      loadMoreBtn.textContent = 'Loading...';
      loadMoreBtn.disabled = true;

      // Simulate loading
      setTimeout(() => {
        // In a real implementation, this would fetch more items
        loadMoreBtn.textContent = 'No more items';
        console.log('Load more triggered - implement API call here');
      }, 1000);
    }
  }

  /**
   * Create lightbox element if not exists
   */
  function createLightbox() {
    if (document.querySelector('.lightbox')) return;

    const lightboxHTML = `
      <div class="lightbox" role="dialog" aria-modal="true" aria-label="Image gallery">
        <div class="lightbox__content">
          <button class="lightbox__close" data-lightbox-close aria-label="Close gallery">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          <button class="lightbox__nav lightbox__nav--prev" data-lightbox-prev aria-label="Previous image">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <img class="lightbox__image" src="" alt="">

          <button class="lightbox__nav lightbox__nav--next" data-lightbox-next aria-label="Next image">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          <div class="lightbox__caption">
            <h3 class="lightbox__title"></h3>
            <p class="lightbox__description"></p>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', lightboxHTML);
  }

  /**
   * Initialize portfolio
   */
  function init() {
    filterButtons = document.querySelectorAll('[data-filter]');
    portfolioItems = document.querySelectorAll('.portfolio-card');

    if (portfolioItems.length === 0) {
      console.log('PortfolioManager: No portfolio items found');
      return;
    }

    // Create lightbox if needed
    createLightbox();

    // Get lightbox elements
    lightbox = document.querySelector('.lightbox');
    lightboxImage = document.querySelector('.lightbox__image');
    lightboxTitle = document.querySelector('.lightbox__title');
    lightboxDescription = document.querySelector('.lightbox__description');
    lightboxClose = document.querySelector('[data-lightbox-close]');
    lightboxPrev = document.querySelector('[data-lightbox-prev]');
    lightboxNext = document.querySelector('[data-lightbox-next]');

    // Filter button events
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => filterItems(btn.dataset.filter));
    });

    // Portfolio item click events
    portfolioItems.forEach(item => {
      item.addEventListener('click', () => openLightbox(item));
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(item);
        }
      });
    });

    // Lightbox controls
    if (lightboxClose) {
      lightboxClose.addEventListener('click', closeLightbox);
    }

    if (lightboxPrev) {
      lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
    }

    if (lightboxNext) {
      lightboxNext.addEventListener('click', () => navigateLightbox(1));
    }

    // Close on backdrop click
    if (lightbox) {
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
      });
    }

    // Keyboard navigation
    document.addEventListener('keydown', handleKeydown);

    // Load more button
    const loadMoreBtn = document.querySelector('[data-load-more]');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', loadMore);
    }

    // Initial state
    updateFilteredItems();

    console.log('PortfolioManager initialized');
  }

  // Public API
  return {
    init,
    filterItems,
    openLightbox,
    closeLightbox,
    loadMore
  };
})();

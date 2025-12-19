/**
 * Main Application Entry Point
 * Penta Organization - Event Management Website
 *
 * Initializes all modules and handles global functionality
 */

(function() {
  'use strict';

  /**
   * Service Worker Manager
   * Handles registration and 3D model caching
   */
  const ServiceWorkerManager = {
    registration: null,

    async init() {
      if (!('serviceWorker' in navigator)) {
        console.log('[App] Service Worker not supported');
        return;
      }

      try {
        this.registration = await navigator.serviceWorker.register('./sw.js', {
          scope: './'
        });

        console.log('[App] Service Worker registered successfully');

        // Listen for updates
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration.installing;
          console.log('[App] Service Worker update found');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[App] New Service Worker installed, refresh for updates');
            }
          });
        });

        // Check cache status after registration
        if (this.registration.active) {
          this.checkCacheStatus();
        }

      } catch (error) {
        console.error('[App] Service Worker registration failed:', error);
      }
    },

    async checkCacheStatus() {
      if (!this.registration?.active) return;

      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          console.log('[App] Cache status:', event.data);
          resolve(event.data);
        };

        this.registration.active.postMessage(
          { type: 'CACHE_STATUS' },
          [messageChannel.port2]
        );
      });
    },

    async preloadModels() {
      if (!this.registration?.active) return;

      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          console.log('[App] Models preloaded:', event.data);
          resolve(event.data);
        };

        this.registration.active.postMessage(
          { type: 'PRELOAD_MODELS' },
          [messageChannel.port2]
        );
      });
    }
  };

  /**
   * 3D Model Preloader - Aggressive Loading Strategy
   * Preloads ALL 3D models immediately for instant display
   */
  const ModelPreloader = {
    // ALL models in priority order
    models: [
      './assets/3d/logo_3d_just_icon.glb',  // Critical - every page
      './assets/3d/staff.glb',               // Home + Services
      './assets/3d/corparete_event.glb',     // Home + Services
      './assets/3d/technical.glb',           // Home + Services
      './assets/3d/transfer.glb',            // Home + Services
      './assets/3d/decoration.glb'           // Services only
    ],

    async init() {
      // Start aggressive preloading immediately
      this.preloadAllModels();

      // Also use requestIdleCallback for background loading
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => this.ensureAllCached(), { timeout: 5000 });
      }
    },

    async preloadAllModels() {
      if (!('caches' in window)) return;

      try {
        const cache = await caches.open('penta-3d-models-v1');
        const startTime = performance.now();

        // Load all models in parallel for maximum speed
        const promises = this.models.map(async (model) => {
          const cached = await cache.match(model);
          if (!cached) {
            return this.preloadWithFetch(model, cache);
          }
          return Promise.resolve();
        });

        await Promise.all(promises);

        const loadTime = (performance.now() - startTime).toFixed(0);
        console.log(`[Preloader] All models ready in ${loadTime}ms`);

      } catch (error) {
        console.warn('[Preloader] Parallel load error:', error);
      }
    },

    async preloadWithFetch(url, cache) {
      try {
        // Use high priority for critical models
        const priority = url.includes('logo') ? 'high' : 'auto';
        const response = await fetch(url, { priority });

        if (response.ok) {
          await cache.put(url, response);
          console.log(`[Preloader] Cached: ${url.split('/').pop()}`);
        }
      } catch (error) {
        console.warn(`[Preloader] Failed: ${url.split('/').pop()}`, error);
      }
    },

    async ensureAllCached() {
      // Double-check all models are cached during idle time
      if (!('caches' in window)) return;

      const cache = await caches.open('penta-3d-models-v1');
      for (const model of this.models) {
        const cached = await cache.match(model);
        if (!cached) {
          this.preloadWithFetch(model, cache);
        }
      }
    }
  };

  // Expose for debugging
  window.PentaCache = {
    getStatus: () => ServiceWorkerManager.checkCacheStatus(),
    preloadModels: () => ServiceWorkerManager.preloadModels()
  };

  /**
   * Initialize testimonials carousel
   */
  function initTestimonials() {
    const carousel = document.querySelector('[data-testimonials]');
    if (!carousel) return;

    const slides = carousel.querySelectorAll('.testimonial');
    const dots = carousel.querySelectorAll('.carousel__dot');
    const prevBtn = carousel.querySelector('[data-carousel-prev]');
    const nextBtn = carousel.querySelector('[data-carousel-next]');

    if (slides.length === 0) return;

    let currentSlide = 0;
    let autoplayInterval = null;
    const autoplayDelay = 5000;

    function showSlide(index) {
      // Normalize index
      if (index < 0) index = slides.length - 1;
      if (index >= slides.length) index = 0;

      slides.forEach((slide, i) => {
        slide.classList.toggle('carousel__slide--active', i === index);
        slide.setAttribute('aria-hidden', i !== index);
      });

      dots.forEach((dot, i) => {
        dot.classList.toggle('carousel__dot--active', i === index);
        dot.setAttribute('aria-selected', i === index);
      });

      currentSlide = index;
    }

    function nextSlide() {
      showSlide(currentSlide + 1);
    }

    function prevSlide() {
      showSlide(currentSlide - 1);
    }

    function startAutoplay() {
      stopAutoplay();
      autoplayInterval = setInterval(nextSlide, autoplayDelay);
    }

    function stopAutoplay() {
      if (autoplayInterval) {
        clearInterval(autoplayInterval);
        autoplayInterval = null;
      }
    }

    // Event listeners
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        stopAutoplay();
        prevSlide();
        startAutoplay();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        stopAutoplay();
        nextSlide();
        startAutoplay();
      });
    }

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        stopAutoplay();
        showSlide(i);
        startAutoplay();
      });
    });

    // Pause on hover
    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);

    // Keyboard navigation
    carousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        stopAutoplay();
        prevSlide();
        startAutoplay();
      } else if (e.key === 'ArrowRight') {
        stopAutoplay();
        nextSlide();
        startAutoplay();
      }
    });

    // Touch/swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    carousel.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      stopAutoplay();
    }, { passive: true });

    carousel.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
      startAutoplay();
    }, { passive: true });

    function handleSwipe() {
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          nextSlide();
        } else {
          prevSlide();
        }
      }
    }

    // Initialize
    showSlide(0);
    startAutoplay();
  }

  /**
   * Initialize lazy loading for images
   */
  function initLazyLoading() {
    const lazyImages = document.querySelectorAll('img[data-src]');

    if (lazyImages.length === 0) return;

    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;

            if (img.dataset.srcset) {
              img.srcset = img.dataset.srcset;
            }

            img.removeAttribute('data-src');
            img.removeAttribute('data-srcset');
            img.classList.add('loaded');
            imageObserver.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.1
      });

      lazyImages.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for older browsers
      lazyImages.forEach(img => {
        img.src = img.dataset.src;
        if (img.dataset.srcset) {
          img.srcset = img.dataset.srcset;
        }
        img.removeAttribute('data-src');
        img.removeAttribute('data-srcset');
      });
    }
  }

  /**
   * Initialize accordion components
   */
  function initAccordions() {
    const accordions = document.querySelectorAll('.accordion');

    accordions.forEach(accordion => {
      const items = accordion.querySelectorAll('.accordion__item');

      items.forEach(item => {
        const header = item.querySelector('.accordion__header');
        const content = item.querySelector('.accordion__content');

        if (!header || !content) return;

        header.addEventListener('click', () => {
          const isOpen = item.classList.contains('accordion__item--open');

          // Close all items if single mode
          if (accordion.dataset.single === 'true') {
            items.forEach(otherItem => {
              otherItem.classList.remove('accordion__item--open');
              otherItem.querySelector('.accordion__header')?.setAttribute('aria-expanded', 'false');
            });
          }

          // Toggle current item
          item.classList.toggle('accordion__item--open', !isOpen);
          header.setAttribute('aria-expanded', !isOpen);
        });

        // Set initial ARIA attributes
        header.setAttribute('aria-expanded', item.classList.contains('accordion__item--open'));
      });
    });
  }

  /**
   * Initialize smooth scroll for anchor links
   */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');

        // Skip if just "#" or if it's a tab/accordion control
        if (href === '#' || this.dataset.toggle) return;

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();

          const headerHeight = document.querySelector('.header')?.offsetHeight || 80;
          const targetPosition = target.offsetTop - headerHeight;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });

          // Update URL without jumping
          history.pushState(null, '', href);
        }
      });
    });
  }

  /**
   * Initialize back to top button
   */
  function initBackToTop() {
    const backToTop = document.querySelector('[data-back-to-top]');
    if (!backToTop) return;

    // Show/hide based on scroll position
    window.addEventListener('scroll', () => {
      if (window.scrollY > 500) {
        backToTop.classList.add('back-to-top--visible');
      } else {
        backToTop.classList.remove('back-to-top--visible');
      }
    }, { passive: true });

    // Scroll to top on click
    backToTop.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  /**
   * Initialize current year in footer
   */
  function initCurrentYear() {
    const yearElements = document.querySelectorAll('[data-current-year]');
    const currentYear = new Date().getFullYear();

    yearElements.forEach(el => {
      el.textContent = currentYear;
    });
  }

  /**
   * Main initialization
   */
  async function init() {
    console.log('Initializing Penta Organization website...');

    // Initialize Service Worker for caching (non-blocking)
    ServiceWorkerManager.init();

    // Preload critical 3D models (non-blocking)
    ModelPreloader.init();

    // Theme is auto-initialized in theme.js

    // Initialize navigation
    if (typeof NavigationManager !== 'undefined') {
      NavigationManager.init();
    }

    // Initialize i18n (async)
    if (typeof I18nManager !== 'undefined') {
      await I18nManager.init();
    }

    // Initialize animations
    if (typeof AnimationManager !== 'undefined') {
      AnimationManager.init();
    }

    // Initialize forms
    if (typeof FormsManager !== 'undefined') {
      FormsManager.init();
    }

    // Initialize portfolio (if on portfolio page)
    if (typeof PortfolioManager !== 'undefined' && document.querySelector('.portfolio-card')) {
      PortfolioManager.init();
    }

    // Initialize other components
    initTestimonials();
    initLazyLoading();
    initAccordions();
    initSmoothScroll();
    initBackToTop();
    initCurrentYear();

    console.log('Penta Organization website initialized successfully!');
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

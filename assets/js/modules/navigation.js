/**
 * Navigation Module
 * Handles mobile navigation, scroll behavior, and active states
 */

const NavigationManager = (function() {
  'use strict';

  // DOM Elements
  let header = null;
  let mobileMenuBtn = null;
  let mobileMenu = null;
  let navLinks = null;
  let mobileNavLinks = null;

  // State
  let isMenuOpen = false;
  let lastScrollY = 0;
  let ticking = false;

  /**
   * Toggle mobile menu
   */
  function toggleMobileMenu() {
    isMenuOpen = !isMenuOpen;

    if (mobileMenu) {
      mobileMenu.classList.toggle('nav-mobile--open', isMenuOpen);
    }

    if (mobileMenuBtn) {
      mobileMenuBtn.classList.toggle('hamburger--active', isMenuOpen);
      mobileMenuBtn.setAttribute('aria-expanded', isMenuOpen);
    }

    // Prevent body scroll when menu is open
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
  }

  /**
   * Close mobile menu
   */
  function closeMobileMenu() {
    if (isMenuOpen) {
      isMenuOpen = false;

      if (mobileMenu) {
        mobileMenu.classList.remove('nav-mobile--open');
      }

      if (mobileMenuBtn) {
        mobileMenuBtn.classList.remove('hamburger--active');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      }

      document.body.style.overflow = '';
    }
  }

  /**
   * Handle scroll behavior for header
   */
  function handleScroll() {
    const currentScrollY = window.scrollY;

    // Add/remove scrolled class for header styling
    if (header) {
      header.classList.toggle('header--scrolled', currentScrollY > 50);

      // Optional: Hide/show header on scroll direction
      // Uncomment below for auto-hide behavior
      /*
      if (currentScrollY > lastScrollY && currentScrollY > 200) {
        header.classList.add('header--hidden');
      } else {
        header.classList.remove('header--hidden');
      }
      */
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  /**
   * Throttled scroll handler
   */
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(handleScroll);
      ticking = true;
    }
  }

  /**
   * Update active navigation link based on current page
   */
  function setActiveLink() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';

    const allLinks = [...(navLinks || []), ...(mobileNavLinks || [])];

    allLinks.forEach(link => {
      const href = link.getAttribute('href');
      const linkPage = href.split('/').pop();

      // Check if this link matches current page
      const isActive = linkPage === currentPage ||
        (currentPage === '' && linkPage === 'index.html') ||
        (currentPage === 'index.html' && linkPage === 'index.html');

      link.classList.toggle('nav__link--active', isActive);
      link.classList.toggle('nav-mobile__link--active', isActive);
    });
  }

  /**
   * Smooth scroll to section (for single-page sections)
   */
  function scrollToSection(e) {
    const href = e.currentTarget.getAttribute('href');

    // Only handle hash links on the same page
    if (href && href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);

      if (target) {
        const headerHeight = header ? header.offsetHeight : 80;
        const targetPosition = target.offsetTop - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        closeMobileMenu();

        // Update URL hash without jumping
        history.pushState(null, '', href);
      }
    } else {
      // Regular link - just close mobile menu
      closeMobileMenu();
    }
  }

  /**
   * Initialize navigation
   */
  function init() {
    header = document.querySelector('.header');
    mobileMenuBtn = document.querySelector('[data-mobile-toggle]');
    mobileMenu = document.querySelector('.nav-mobile');
    navLinks = document.querySelectorAll('.nav__link');
    mobileNavLinks = document.querySelectorAll('.nav-mobile__link');

    // Mobile menu toggle
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }

    // Nav link clicks
    const allLinks = [...(navLinks || []), ...(mobileNavLinks || [])];
    allLinks.forEach(link => {
      link.addEventListener('click', scrollToSection);
    });

    // Scroll events (throttled)
    window.addEventListener('scroll', onScroll, { passive: true });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeMobileMenu();
      }
    });

    // Close menu on outside click
    document.addEventListener('click', (e) => {
      if (isMenuOpen &&
          mobileMenu &&
          mobileMenuBtn &&
          !mobileMenu.contains(e.target) &&
          !mobileMenuBtn.contains(e.target)) {
        closeMobileMenu();
      }
    });

    // Close menu on resize (if switching to desktop)
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024 && isMenuOpen) {
        closeMobileMenu();
      }
    });

    // Set active link based on current page
    setActiveLink();

    // Initial scroll state
    handleScroll();

    console.log('NavigationManager initialized');
  }

  // Public API
  return {
    init,
    closeMobileMenu,
    toggleMobileMenu,
    isMenuOpen: () => isMenuOpen
  };
})();

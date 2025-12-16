/**
 * Animations Module
 * Handles scroll animations, counters, and visual effects
 */

const AnimationManager = (function() {
  'use strict';

  // Configuration
  const config = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  // State
  let observer = null;
  let counterObserver = null;

  /**
   * Initialize scroll animations using Intersection Observer
   */
  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-animate]');
    const staggerContainers = document.querySelectorAll('[data-animate-stagger]');

    if (animatedElements.length === 0 && staggerContainers.length === 0) return;

    // Mark elements that will animate (hides them initially)
    animatedElements.forEach(el => el.classList.add('will-animate'));
    staggerContainers.forEach(el => el.classList.add('will-animate'));

    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const delay = element.dataset.animateDelay || 0;

          setTimeout(() => {
            element.classList.add('is-visible');
          }, parseInt(delay));

          // Unobserve after animation
          observer.unobserve(element);
        }
      });
    }, config);

    animatedElements.forEach(el => observer.observe(el));
    staggerContainers.forEach(el => observer.observe(el));
  }

  /**
   * Initialize counter animations
   */
  function initCounters() {
    const counters = document.querySelectorAll('[data-counter]');

    if (counters.length === 0) return;

    counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => counterObserver.observe(counter));
  }

  /**
   * Animate a single counter
   */
  function animateCounter(element) {
    const target = parseInt(element.dataset.counter) || 0;
    const duration = parseInt(element.dataset.counterDuration) || 2000;
    const suffix = element.dataset.counterSuffix || '';
    const prefix = element.dataset.counterPrefix || '';

    let startTime = null;
    const startValue = 0;

    function updateCounter(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(easeOut * (target - startValue) + startValue);

      element.textContent = prefix + currentValue.toLocaleString() + suffix;

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent = prefix + target.toLocaleString() + suffix;
      }
    }

    requestAnimationFrame(updateCounter);
  }

  /**
   * Initialize parallax effects
   */
  function initParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');

    if (parallaxElements.length === 0) return;

    function updateParallax() {
      const scrollY = window.scrollY;

      parallaxElements.forEach(element => {
        const speed = parseFloat(element.dataset.parallax) || 0.5;
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top + scrollY;
        const offset = (scrollY - elementTop) * speed;

        element.style.transform = `translateY(${offset}px)`;
      });
    }

    window.addEventListener('scroll', updateParallax, { passive: true });
    updateParallax();
  }

  /**
   * Add stagger animation to children
   */
  function initStaggerAnimations() {
    const staggerContainers = document.querySelectorAll('[data-stagger]');

    staggerContainers.forEach(container => {
      const children = container.children;
      const delay = parseInt(container.dataset.stagger) || 100;

      Array.from(children).forEach((child, index) => {
        child.style.transitionDelay = `${index * delay}ms`;
      });
    });
  }

  /**
   * Initialize reveal animations for text
   */
  function initTextReveal() {
    const revealElements = document.querySelectorAll('[data-text-reveal]');

    if (revealElements.length === 0) return;

    const textObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('text-revealed');
          textObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    revealElements.forEach(el => textObserver.observe(el));
  }

  /**
   * Initialize hover tilt effect
   */
  function initTiltEffect() {
    const tiltElements = document.querySelectorAll('[data-tilt]');

    tiltElements.forEach(element => {
      element.addEventListener('mousemove', (e) => {
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const maxTilt = parseFloat(element.dataset.tilt) || 10;
        const rotateX = ((y - centerY) / centerY) * -maxTilt;
        const rotateY = ((x - centerX) / centerX) * maxTilt;

        element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });

      element.addEventListener('mouseleave', () => {
        element.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
      });
    });
  }

  /**
   * Initialize magnetic button effect
   */
  function initMagneticButtons() {
    const magneticElements = document.querySelectorAll('[data-magnetic]');

    magneticElements.forEach(element => {
      element.addEventListener('mousemove', (e) => {
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const strength = parseFloat(element.dataset.magnetic) || 0.3;

        element.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });

      element.addEventListener('mouseleave', () => {
        element.style.transform = 'translate(0, 0)';
      });
    });
  }

  /**
   * Initialize all animations
   */
  function init() {
    initScrollAnimations();
    initCounters();
    initParallax();
    initStaggerAnimations();
    initTextReveal();
    initTiltEffect();
    initMagneticButtons();

    console.log('AnimationManager initialized');
  }

  /**
   * Cleanup observers
   */
  function destroy() {
    if (observer) observer.disconnect();
    if (counterObserver) counterObserver.disconnect();
  }

  // Public API
  return {
    init,
    destroy,
    animateCounter
  };
})();

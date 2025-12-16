/**
 * Snow Effect Module
 * Kış temalı kar yağışı efekti
 * Performans optimizasyonlu, tema duyarlı
 */

const SnowEffect = (function() {
  'use strict';

  // Configuration
  const CONFIG = {
    maxSnowflakes: 45,        // Maximum kar tanesi sayısı
    mobileMaxSnowflakes: 20,  // Mobil için azaltılmış
    minSize: 10,              // Minimum boyut (px) - font-size
    maxSize: 24,              // Maximum boyut (px) - font-size
    minDuration: 10,          // Minimum düşme süresi (s)
    maxDuration: 20,          // Maximum düşme süresi (s)
    spawnInterval: 400,       // Yeni kar tanesi oluşturma aralığı (ms)
  };

  // Kar tanesi tipleri
  const SNOWFLAKE_TYPES = ['crystal', 'star', 'flake', 'dot'];

  // Animasyon varyantları
  const ANIMATION_VARIANTS = ['', 'float', 'drift'];

  // State
  let container = null;
  let snowflakes = [];
  let spawnIntervalId = null;
  let isEnabled = true;
  let isPaused = false;

  /**
   * Rastgele sayı üretici
   */
  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  /**
   * Rastgele dizi elemanı seç
   */
  function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Mobil cihaz kontrolü
   */
  function isMobile() {
    return window.innerWidth <= 768;
  }

  /**
   * Maximum kar tanesi sayısını belirle
   */
  function getMaxSnowflakes() {
    return isMobile() ? CONFIG.mobileMaxSnowflakes : CONFIG.maxSnowflakes;
  }

  /**
   * Kar tanesi oluştur
   */
  function createSnowflake() {
    if (!isEnabled || isPaused) return;
    if (snowflakes.length >= getMaxSnowflakes()) return;

    const snowflake = document.createElement('div');

    // Rastgele tip seç
    const type = randomItem(SNOWFLAKE_TYPES);
    const animation = randomItem(ANIMATION_VARIANTS);

    // Class'ları ekle
    let classes = `snowflake snowflake--${type}`;
    if (animation) {
      classes += ` snowflake--${animation}`;
    }
    snowflake.className = classes;

    // Rastgele özellikler
    const size = random(CONFIG.minSize, CONFIG.maxSize);
    const startX = random(0, 100);
    const duration = random(CONFIG.minDuration, CONFIG.maxDuration);
    const delay = random(0, 3);

    // Stiller
    snowflake.style.fontSize = `${size}px`;
    snowflake.style.left = `${startX}%`;
    snowflake.style.animationDuration = `${duration}s`;
    snowflake.style.animationDelay = `${delay}s`;
    snowflake.style.opacity = random(0.5, 1).toFixed(2);

    // Container'a ekle
    container.appendChild(snowflake);
    snowflakes.push(snowflake);

    // Animasyon bitince kaldır
    snowflake.addEventListener('animationend', () => {
      removeSnowflake(snowflake);
    });

    // Güvenlik: belirli süre sonra zorla kaldır
    setTimeout(() => {
      removeSnowflake(snowflake);
    }, (duration + delay + 2) * 1000);
  }

  /**
   * Kar tanesini kaldır
   */
  function removeSnowflake(snowflake) {
    const index = snowflakes.indexOf(snowflake);
    if (index > -1) {
      snowflakes.splice(index, 1);
    }
    if (snowflake.parentNode) {
      snowflake.parentNode.removeChild(snowflake);
    }
  }

  /**
   * Tüm kar tanelerini temizle
   */
  function clearSnowflakes() {
    snowflakes.forEach(sf => {
      if (sf.parentNode) {
        sf.parentNode.removeChild(sf);
      }
    });
    snowflakes = [];
  }

  /**
   * Kar yağışını başlat
   */
  function startSnow() {
    if (spawnIntervalId) return;

    // İlk batch kar taneleri
    const initialCount = Math.floor(getMaxSnowflakes() / 3);
    for (let i = 0; i < initialCount; i++) {
      setTimeout(createSnowflake, i * 150);
    }

    // Sürekli kar tanesi oluştur
    spawnIntervalId = setInterval(createSnowflake, CONFIG.spawnInterval);
  }

  /**
   * Kar yağışını durdur
   */
  function stopSnow() {
    if (spawnIntervalId) {
      clearInterval(spawnIntervalId);
      spawnIntervalId = null;
    }
  }

  /**
   * Kar efektini durakla/devam ettir
   */
  function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
      stopSnow();
    } else {
      startSnow();
    }
    return isPaused;
  }

  /**
   * Kar efektini aç/kapat
   */
  function toggle() {
    isEnabled = !isEnabled;
    if (isEnabled) {
      container.style.display = 'block';
      startSnow();
    } else {
      container.style.display = 'none';
      stopSnow();
      clearSnowflakes();
    }
    return isEnabled;
  }

  /**
   * Reduced motion kontrolü
   */
  function checkReducedMotion() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
      isEnabled = false;
      if (container) {
        container.style.display = 'none';
      }
    }
  }

  /**
   * Resize handler - mobil/desktop geçişlerinde optimize et
   */
  function handleResize() {
    const maxAllowed = getMaxSnowflakes();
    while (snowflakes.length > maxAllowed) {
      const sf = snowflakes.pop();
      if (sf && sf.parentNode) {
        sf.parentNode.removeChild(sf);
      }
    }
  }

  /**
   * Initialize snow effect
   */
  function init() {
    // Reduced motion kontrolü
    checkReducedMotion();
    if (!isEnabled) {
      console.log('SnowEffect: Disabled due to reduced motion preference');
      return;
    }

    // Container oluştur
    container = document.createElement('div');
    container.className = 'snow-container';
    container.setAttribute('aria-hidden', 'true');
    document.body.appendChild(container);

    // Kar yağışını başlat
    startSnow();

    // Resize listener
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 250);
    });

    // Visibility change - tab görünür değilse duraklat
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopSnow();
      } else if (isEnabled && !isPaused) {
        startSnow();
      }
    });

    console.log('SnowEffect initialized. Let it snow!');
  }

  /**
   * Cleanup
   */
  function destroy() {
    stopSnow();
    clearSnowflakes();
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    container = null;
  }

  // Public API
  return {
    init,
    destroy,
    toggle,
    togglePause,
    start: startSnow,
    stop: stopSnow,
    clear: clearSnowflakes,
    isEnabled: () => isEnabled,
    isPaused: () => isPaused
  };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', SnowEffect.init);
} else {
  SnowEffect.init();
}

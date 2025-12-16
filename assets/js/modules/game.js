/**
 * Game Manager Module
 * Penta Organization - Memory Card Matching Game
 *
 * Handles all game logic including:
 * - Card shuffling and rendering
 * - Game state management
 * - Move counting and timer
 * - Win condition detection
 */

const GameManager = (function() {
  'use strict';

  // ===================
  // CARD DATA
  // ===================
  const CARD_PAIRS = [
    { id: 1, emoji: '🎭', name: 'theater' },      // Theater/Performance
    { id: 2, emoji: '🎪', name: 'tent' },         // Circus/Festival
    { id: 3, emoji: '🎵', name: 'music' },        // Concert/Music
    { id: 4, emoji: '💍', name: 'wedding' },      // Wedding
    { id: 5, emoji: '🎤', name: 'microphone' },   // Conference/Speaking
    { id: 6, emoji: '🎨', name: 'art' },          // Art/Decoration
    { id: 7, emoji: '🎬', name: 'film' },         // Production/Film
    { id: 8, emoji: '🎯', name: 'target' }        // Corporate/Goals
  ];

  // ===================
  // STATE
  // ===================
  let cards = [];
  let flippedCards = [];
  let matchedPairs = 0;
  let moves = 0;
  let timerInterval = null;
  let seconds = 0;
  let isLocked = false;
  let gameStarted = false;

  // ===================
  // DOM ELEMENTS
  // ===================
  let boardElement = null;
  let movesElement = null;
  let timeElement = null;
  let matchesElement = null;
  let startButton = null;
  let restartButton = null;
  let modalElement = null;
  let finalMovesElement = null;
  let finalTimeElement = null;
  let playAgainButton = null;
  let modalCloseElement = null;

  // ===================
  // UTILITY FUNCTIONS
  // ===================

  /**
   * Fisher-Yates shuffle algorithm
   * @param {Array} array - Array to shuffle
   * @returns {Array} Shuffled array
   */
  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Format seconds to MM:SS
   * @param {number} totalSeconds
   * @returns {string}
   */
  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * Get translated card label
   * @param {string} cardName
   * @returns {string}
   */
  function getCardLabel(cardName) {
    if (typeof I18nManager !== 'undefined') {
      const translated = I18nManager.t(`game.cards.${cardName}`);
      if (translated && translated !== `game.cards.${cardName}`) {
        return translated;
      }
    }
    // Fallback to capitalized name
    return cardName.charAt(0).toUpperCase() + cardName.slice(1);
  }

  /**
   * Create element with classes
   * @param {string} tag
   * @param {string} className
   * @returns {HTMLElement}
   */
  function createElement(tag, className) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    return el;
  }

  // ===================
  // GAME LOGIC
  // ===================

  /**
   * Create card deck with pairs
   * @returns {Array} Array of card objects
   */
  function createCardDeck() {
    const deck = [];

    // Create two of each card (pairs)
    CARD_PAIRS.forEach((card) => {
      deck.push({
        ...card,
        uniqueId: `card-${card.id}-a-${Date.now()}`
      });
      deck.push({
        ...card,
        uniqueId: `card-${card.id}-b-${Date.now()}`
      });
    });

    return shuffleArray(deck);
  }

  /**
   * Create card HTML element using safe DOM methods
   * @param {Object} card
   * @returns {HTMLElement}
   */
  function createCardElement(card) {
    // Main card container
    const cardEl = createElement('div', 'game-card');
    cardEl.dataset.cardId = card.uniqueId;
    cardEl.dataset.pairId = card.id;
    cardEl.setAttribute('role', 'button');
    cardEl.setAttribute('tabindex', '0');
    cardEl.setAttribute('aria-label', `Card ${card.name}`);

    // Inner container for flip animation
    const inner = createElement('div', 'game-card__inner');

    // Front face (logo)
    const front = createElement('div', 'game-card__front');
    const logoWrapper = createElement('div', 'game-card__logo');
    const logoImg = document.createElement('img');
    logoImg.src = './assets/images/logo.png';
    logoImg.alt = 'Penta';
    logoWrapper.appendChild(logoImg);
    front.appendChild(logoWrapper);

    // Back face (emoji)
    const back = createElement('div', 'game-card__back');
    const emojiSpan = createElement('span', 'game-card__emoji');
    emojiSpan.textContent = card.emoji;
    const labelSpan = createElement('span', 'game-card__label');
    labelSpan.textContent = getCardLabel(card.name);
    back.appendChild(emojiSpan);
    back.appendChild(labelSpan);

    // Assemble card
    inner.appendChild(front);
    inner.appendChild(back);
    cardEl.appendChild(inner);

    return cardEl;
  }

  /**
   * Render cards to the board
   */
  function renderCards() {
    if (!boardElement) return;

    // Clear existing cards
    boardElement.textContent = '';
    boardElement.classList.add('game-board--active');

    // Create and append cards
    cards.forEach((card, index) => {
      const cardEl = createCardElement(card);

      // Add staggered animation
      cardEl.style.animationDelay = `${index * 50}ms`;
      cardEl.classList.add('animate-fade-in');

      boardElement.appendChild(cardEl);
    });
  }

  /**
   * Handle card click/tap
   * @param {Event} event
   */
  function handleCardClick(event) {
    const cardElement = event.target.closest('.game-card');
    if (!cardElement) return;

    // Ignore if game is locked or card is already flipped/matched
    if (isLocked) return;
    if (cardElement.classList.contains('game-card--flipped')) return;
    if (cardElement.classList.contains('game-card--matched')) return;

    // Start timer on first card flip
    if (!gameStarted) {
      startTimer();
      gameStarted = true;
    }

    // Flip the card
    flipCard(cardElement);
  }

  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} event
   */
  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardClick(event);
    }
  }

  /**
   * Flip a card
   * @param {HTMLElement} cardElement
   */
  function flipCard(cardElement) {
    cardElement.classList.add('game-card--flipped');
    cardElement.setAttribute('aria-pressed', 'true');

    const cardId = cardElement.dataset.cardId;
    const pairId = cardElement.dataset.pairId;

    flippedCards.push({
      element: cardElement,
      cardId: cardId,
      pairId: pairId
    });

    // Check for match when 2 cards are flipped
    if (flippedCards.length === 2) {
      moves++;
      updateMovesDisplay();
      checkForMatch();
    }
  }

  /**
   * Check if flipped cards match
   */
  function checkForMatch() {
    isLocked = true;

    const [card1, card2] = flippedCards;
    const isMatch = card1.pairId === card2.pairId;

    if (isMatch) {
      handleMatch(card1.element, card2.element);
    } else {
      handleNoMatch(card1.element, card2.element);
    }
  }

  /**
   * Handle matching cards
   * @param {HTMLElement} card1
   * @param {HTMLElement} card2
   */
  function handleMatch(card1, card2) {
    card1.classList.add('game-card--matched');
    card2.classList.add('game-card--matched');
    card1.setAttribute('aria-disabled', 'true');
    card2.setAttribute('aria-disabled', 'true');

    matchedPairs++;
    updateMatchesDisplay();

    // Reset for next turn
    flippedCards = [];
    isLocked = false;

    // Check for win
    if (matchedPairs === CARD_PAIRS.length) {
      setTimeout(handleWin, 500);
    }
  }

  /**
   * Handle non-matching cards
   * @param {HTMLElement} card1
   * @param {HTMLElement} card2
   */
  function handleNoMatch(card1, card2) {
    // Add wrong animation
    card1.classList.add('game-card--wrong');
    card2.classList.add('game-card--wrong');

    // Flip back after delay
    setTimeout(() => {
      card1.classList.remove('game-card--flipped', 'game-card--wrong');
      card2.classList.remove('game-card--flipped', 'game-card--wrong');
      card1.setAttribute('aria-pressed', 'false');
      card2.setAttribute('aria-pressed', 'false');

      flippedCards = [];
      isLocked = false;
    }, 1000);
  }

  /**
   * Handle game win
   */
  function handleWin() {
    stopTimer();
    showModal();
  }

  // ===================
  // TIMER
  // ===================

  /**
   * Start the game timer
   */
  function startTimer() {
    if (timerInterval) return;

    timerInterval = setInterval(() => {
      seconds++;
      updateTimeDisplay();
    }, 1000);
  }

  /**
   * Stop the game timer
   */
  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  // ===================
  // DISPLAY UPDATES
  // ===================

  /**
   * Update moves display
   */
  function updateMovesDisplay() {
    if (movesElement) {
      movesElement.textContent = moves;
    }
  }

  /**
   * Update time display
   */
  function updateTimeDisplay() {
    if (timeElement) {
      timeElement.textContent = formatTime(seconds);
    }
  }

  /**
   * Update matches display
   */
  function updateMatchesDisplay() {
    if (matchesElement) {
      matchesElement.textContent = `${matchedPairs}/${CARD_PAIRS.length}`;
    }
  }

  // ===================
  // MODAL
  // ===================

  /**
   * Show victory modal
   */
  function showModal() {
    if (!modalElement) return;

    // Update final stats
    if (finalMovesElement) {
      finalMovesElement.textContent = moves;
    }
    if (finalTimeElement) {
      finalTimeElement.textContent = formatTime(seconds);
    }

    // Show modal
    modalElement.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus play again button
    if (playAgainButton) {
      setTimeout(() => playAgainButton.focus(), 100);
    }
  }

  /**
   * Hide victory modal
   */
  function hideModal() {
    if (!modalElement) return;

    modalElement.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // ===================
  // GAME CONTROL
  // ===================

  /**
   * Start a new game
   */
  function startGame() {
    // Reset state
    cards = createCardDeck();
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    seconds = 0;
    isLocked = false;
    gameStarted = false;

    // Stop any existing timer
    stopTimer();

    // Update displays
    updateMovesDisplay();
    updateTimeDisplay();
    updateMatchesDisplay();

    // Render cards
    renderCards();

    // Show restart button, hide start button
    if (startButton) startButton.style.display = 'none';
    if (restartButton) restartButton.style.display = 'inline-flex';

    // Hide modal if open
    hideModal();
  }

  /**
   * Reset the game
   */
  function resetGame() {
    startGame();
  }

  // ===================
  // EVENT BINDING
  // ===================

  /**
   * Bind events to card elements
   */
  function bindCardEvents() {
    if (!boardElement) return;

    // Use event delegation for better performance
    boardElement.addEventListener('click', handleCardClick);
    boardElement.addEventListener('keydown', handleKeyDown);
  }

  /**
   * Cache DOM elements
   */
  function cacheElements() {
    boardElement = document.querySelector('[data-game-board]');
    movesElement = document.querySelector('[data-game-moves]');
    timeElement = document.querySelector('[data-game-time]');
    matchesElement = document.querySelector('[data-game-matches]');
    startButton = document.querySelector('[data-game-start]');
    restartButton = document.querySelector('[data-game-restart]');
    modalElement = document.querySelector('[data-game-modal]');
    finalMovesElement = document.querySelector('[data-game-final-moves]');
    finalTimeElement = document.querySelector('[data-game-final-time]');
    playAgainButton = document.querySelector('[data-game-play-again]');
    modalCloseElement = document.querySelector('[data-game-modal-close]');
  }

  /**
   * Bind control events
   */
  function bindControlEvents() {
    // Start button
    if (startButton) {
      startButton.addEventListener('click', startGame);
    }

    // Restart button
    if (restartButton) {
      restartButton.addEventListener('click', resetGame);
    }

    // Play again button
    if (playAgainButton) {
      playAgainButton.addEventListener('click', () => {
        hideModal();
        startGame();
      });
    }

    // Modal backdrop close
    if (modalCloseElement) {
      modalCloseElement.addEventListener('click', hideModal);
    }

    // ESC key to close modal (stored for cleanup)
    document.addEventListener('keydown', handleEscKey);
  }

  /**
   * Handle ESC key to close modal
   * @param {KeyboardEvent} e
   */
  function handleEscKey(e) {
    if (e.key === 'Escape' && modalElement && modalElement.getAttribute('aria-hidden') === 'false') {
      hideModal();
    }
  }

  // ===================
  // INITIALIZATION
  // ===================

  /**
   * Initialize the game
   */
  function init() {
    // Only initialize if game board exists
    const gameBoard = document.querySelector('[data-game-board]');
    if (!gameBoard) return;

    cacheElements();
    bindControlEvents();
    bindCardEvents();

    console.log('GameManager initialized');
  }

  /**
   * Cleanup
   */
  function destroy() {
    stopTimer();
    if (boardElement) {
      boardElement.removeEventListener('click', handleCardClick);
      boardElement.removeEventListener('keydown', handleKeyDown);
    }
    document.removeEventListener('keydown', handleEscKey);
  }

  // ===================
  // PUBLIC API
  // ===================
  return {
    init,
    destroy,
    startGame,
    resetGame
  };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => GameManager.init());
} else {
  GameManager.init();
}

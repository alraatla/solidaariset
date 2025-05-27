/**
 * Vanilla JS Card Deck for Solidarity Project
 * Features: Card deck shuffling, autoplay, swipe support, keyboard navigation, accessibility
 */

class CardDeck {
  constructor(element) {
    this.carousel = element;
    this.container = this.carousel.querySelector('[data-carousel-track]');
    this.slides = Array.from(this.carousel.querySelectorAll('.slide'));
    this.prevBtn = this.carousel.querySelector('[data-carousel-prev]');
    this.nextBtn = this.carousel.querySelector('[data-carousel-next]');
    this.indicators = this.carousel.querySelector('[data-carousel-indicators]');
    this.dots = Array.from(this.carousel.querySelectorAll('[data-carousel-dot]'));
    
    this.currentSlide = 0;
    this.totalSlides = this.slides.length;
    this.isPlaying = true;
    this.autoplayInterval = null;
    this.autoplayDelay = 4000; // 4 seconds
    this.isAnimating = false;
    
    // Touch/swipe properties
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.isDragging = false;
    
    this.init();
  }
  
  init() {
    if (this.totalSlides === 0) return;
    
    this.setupEventListeners();
    this.updateCardPositions();
    this.updateIndicators();
    this.startAutoplay();
    
    // Set initial ARIA attributes
    this.carousel.setAttribute('aria-live', 'polite');
    this.updateAriaLabels();
  }
  
  setupEventListeners() {
    // Navigation buttons
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.prevSlide());
    }
    
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.nextSlide());
    }
    
    // Dot indicators
    this.dots.forEach((dot, index) => {
      dot.addEventListener('click', () => this.goToSlide(index));
    });
    
    // Keyboard navigation
    this.carousel.addEventListener('keydown', (e) => this.handleKeydown(e));
    
    // Pause on hover/focus
    this.carousel.addEventListener('mouseenter', () => this.pauseAutoplay());
    this.carousel.addEventListener('mouseleave', () => this.resumeAutoplay());
    this.carousel.addEventListener('focusin', () => this.pauseAutoplay());
    this.carousel.addEventListener('focusout', () => this.resumeAutoplay());
    
    // Touch/swipe support
    this.container.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
    this.container.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
    this.container.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
    
    // Mouse drag support (optional enhancement)
    this.container.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.container.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.container.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.container.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
    
    // Prevent context menu on long press
    this.container.addEventListener('contextmenu', (e) => {
      if (this.isDragging) e.preventDefault();
    });
    
    // Handle visibility change (pause when tab is not active)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAutoplay();
      } else {
        this.resumeAutoplay();
      }
    });
  }
  
  // Card deck navigation methods
  nextSlide() {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    
    // Update current slide index
    this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
    
    // Animate and update positions
    this.updateCardPositions();
    this.updateIndicators();
    this.updateAriaLabels();
    
    setTimeout(() => {
      this.isAnimating = false;
    }, 600);
  }
  
  prevSlide() {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    
    // Update current slide index
    this.currentSlide = this.currentSlide === 0 ? this.totalSlides - 1 : this.currentSlide - 1;
    
    // Animate and update positions
    this.updateCardPositions();
    this.updateIndicators();
    this.updateAriaLabels();
    
    setTimeout(() => {
      this.isAnimating = false;
    }, 600);
  }
  
  goToSlide(targetIndex) {
    if (this.isAnimating || targetIndex === this.currentSlide) return;
    
    this.currentSlide = targetIndex;
    this.updateCardPositions();
    this.updateIndicators();
    this.updateAriaLabels();
  }
  
  updateCardPositions() {
    // Define positions for each stack level
    const positions = [
      { z: 4, y: 0, rotation: 0, scale: 1, opacity: 1 },
      { z: 3, y: -8, rotation: -2, scale: 0.98, opacity: 1 },
      { z: 2, y: -16, rotation: 1, scale: 0.96, opacity: 1 },
      { z: 1, y: -24, rotation: -1, scale: 0.94, opacity: 1 }
    ];
    
    this.slides.forEach((slide, index) => {
      // Calculate which position this card should be in
      const positionIndex = (index - this.currentSlide + this.totalSlides) % this.totalSlides;
      
      if (positionIndex < positions.length) {
        const pos = positions[positionIndex];
        slide.style.zIndex = pos.z;
        slide.style.transform = `translateY(${pos.y}px) rotate(${pos.rotation}deg) scale(${pos.scale})`;
        slide.style.opacity = pos.opacity;
        slide.style.transition = 'all 600ms cubic-bezier(0.68, -0.55, 0.265, 1.55)';
      } else {
        // Cards beyond the 4th position are hidden behind
        slide.style.zIndex = 0;
        slide.style.transform = `translateY(-32px) rotate(${Math.random() * 6 - 3}deg) scale(0.9)`;
        slide.style.opacity = 0;
        slide.style.transition = 'all 600ms cubic-bezier(0.68, -0.55, 0.265, 1.55)';
      }
    });
  }
  
  updateIndicators() {
    this.dots.forEach((dot, index) => {
      const isActive = index === this.currentSlide;
      dot.classList.toggle('card-deck__dot--active', isActive);
      dot.setAttribute('aria-pressed', isActive.toString());
    });
  }
  
  updateAriaLabels() {
    this.slides.forEach((slide, index) => {
      const isActive = index === this.currentSlide;
      slide.setAttribute('aria-hidden', (!isActive).toString());
      
      if (isActive) {
        slide.setAttribute('aria-live', 'polite');
      } else {
        slide.removeAttribute('aria-live');
      }
    });
    
    // Update carousel aria-label
    this.carousel.setAttribute('aria-label', `Kortti ${this.currentSlide + 1}/${this.totalSlides}`);
  }
  
  // Autoplay methods
  startAutoplay() {
    if (!this.isPlaying) return;
    
    this.autoplayInterval = setInterval(() => {
      this.nextSlide();
    }, this.autoplayDelay);
  }
  
  pauseAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
  }
  
  resumeAutoplay() {
    if (this.isPlaying && !this.autoplayInterval) {
      this.startAutoplay();
    }
  }
  
  stopAutoplay() {
    this.isPlaying = false;
    this.pauseAutoplay();
  }
  
  // Keyboard navigation
  handleKeydown(e) {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        this.prevSlide();
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.nextSlide();
        break;
      case 'Home':
        e.preventDefault();
        this.goToSlide(0);
        break;
      case 'End':
        e.preventDefault();
        this.goToSlide(this.totalSlides - 1);
        break;
      case ' ': // Spacebar
      case 'Enter':
        e.preventDefault();
        if (this.isPlaying) {
          this.stopAutoplay();
        } else {
          this.isPlaying = true;
          this.startAutoplay();
        }
        break;
    }
  }
  
  // Touch/swipe handling
  handleTouchStart(e) {
    this.touchStartX = e.touches[0].clientX;
    this.pauseAutoplay();
  }
  
  handleTouchMove(e) {
    if (!this.touchStartX) return;
    this.touchEndX = e.touches[0].clientX;
  }
  
  handleTouchEnd(e) {
    if (!this.touchStartX || !this.touchEndX) {
      this.resumeAutoplay();
      return;
    }
    
    const swipeThreshold = 50; // Minimum distance for a swipe
    const swipeDistance = this.touchStartX - this.touchEndX;
    
    if (Math.abs(swipeDistance) > swipeThreshold) {
      if (swipeDistance > 0) {
        // Swiped left - go to next slide
        this.nextSlide();
      } else {
        // Swiped right - go to previous slide
        this.prevSlide();
      }
    }
    
    // Reset touch coordinates
    this.touchStartX = 0;
    this.touchEndX = 0;
    
    this.resumeAutoplay();
  }
  
  // Mouse drag handling (desktop enhancement)
  handleMouseDown(e) {
    e.preventDefault();
    this.isDragging = true;
    this.touchStartX = e.clientX;
    this.container.style.cursor = 'grabbing';
    this.pauseAutoplay();
  }
  
  handleMouseMove(e) {
    if (!this.isDragging) return;
    e.preventDefault();
    this.touchEndX = e.clientX;
  }
  
  handleMouseUp(e) {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.container.style.cursor = '';
    
    if (this.touchStartX && this.touchEndX) {
      const swipeThreshold = 50;
      const swipeDistance = this.touchStartX - this.touchEndX;
      
      if (Math.abs(swipeDistance) > swipeThreshold) {
        if (swipeDistance > 0) {
          this.nextSlide();
        } else {
          this.prevSlide();
        }
      }
    }
    
    // Reset coordinates
    this.touchStartX = 0;
    this.touchEndX = 0;
    
    this.resumeAutoplay();
  }
  
  // Public API methods
  destroy() {
    this.pauseAutoplay();
    // Remove event listeners if needed for cleanup
  }
  
  play() {
    this.isPlaying = true;
    this.startAutoplay();
  }
  
  pause() {
    this.stopAutoplay();
  }
}

// Mobile navigation toggle functionality
class MobileNav {
  constructor() {
    this.burger = document.querySelector('.header__burger');
    this.navList = document.querySelector('.header__nav-list');
    this.navLinks = document.querySelectorAll('.header__nav-link');
    
    this.init();
  }
  
  init() {
    if (!this.burger || !this.navList) return;
    
    this.burger.addEventListener('click', () => this.toggleNav());
    
    // Close nav when clicking on a link
    this.navLinks.forEach(link => {
      link.addEventListener('click', () => this.closeNav());
    });
    
    // Close nav when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.header__nav')) {
        this.closeNav();
      }
    });
    
    // Close nav on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeNav();
      }
    });
  }
  
  toggleNav() {
    const isOpen = this.navList.classList.contains('active');
    
    if (isOpen) {
      this.closeNav();
    } else {
      this.openNav();
    }
  }
  
  openNav() {
    this.navList.classList.add('active');
    this.burger.setAttribute('aria-expanded', 'true');
    
    // Animate burger lines
    const lines = this.burger.querySelectorAll('.header__burger-line');
    lines[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
    lines[1].style.opacity = '0';
    lines[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
  }
  
  closeNav() {
    this.navList.classList.remove('active');
    this.burger.setAttribute('aria-expanded', 'false');
    
    // Reset burger lines
    const lines = this.burger.querySelectorAll('.header__burger-line');
    lines[0].style.transform = '';
    lines[1].style.opacity = '';
    lines[2].style.transform = '';
  }
}

// Smooth scrolling for anchor links
function initSmoothScrolling() {
  const links = document.querySelectorAll('a[href^="#"]');
  
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      
      // Skip if it's just "#"
      if (href === '#') return;
      
      const target = document.querySelector(href);
      
      if (target) {
        e.preventDefault();
        
        const headerHeight = document.querySelector('.header').offsetHeight;
        const targetPosition = target.offsetTop - headerHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize card deck
  const carouselElement = document.querySelector('[data-carousel]');
  if (carouselElement) {
    new CardDeck(carouselElement);
  }
  
  // Initialize mobile navigation
  new MobileNav();
  
  // Initialize smooth scrolling
  initSmoothScrolling();
  
  // Add loading class removal for any fade-in animations
  document.body.classList.add('loaded');
});

// Handle reduced motion preference
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // Disable autoplay for users who prefer reduced motion
  document.addEventListener('DOMContentLoaded', () => {
    const carouselElement = document.querySelector('[data-carousel]');
    if (carouselElement && carouselElement.cardDeck) {
      carouselElement.cardDeck.stopAutoplay();
    }
  });
}

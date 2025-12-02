// Hero Background Image Carousel
// Manages dynamic background images in the hero section

class HeroCarousel {
  constructor() {
    this.currentSlide = 0;
    this.slides = document.querySelectorAll('.carousel-slide');
    this.indicators = document.getElementById('carouselIndicators');
    this.prevBtn = document.getElementById('carouselPrev');
    this.nextBtn = document.getElementById('carouselNext');
    this.autoSlideInterval = null;
    this.slideDuration = 5000; // 5 seconds per slide
    
    this.init();
  }
  
  init() {
    if (this.slides.length === 0) return;
    
    // Create indicators
    this.createIndicators();
    
    // Set up event listeners
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.prevSlide());
    }
    
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.nextSlide());
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.prevSlide();
      if (e.key === 'ArrowRight') this.nextSlide();
    });
    
    // Touch/swipe support
    this.setupTouchEvents();
    
    // Start auto-slide
    this.startAutoSlide();
    
    // Pause on hover
    const carousel = document.getElementById('heroCarousel');
    if (carousel) {
      carousel.addEventListener('mouseenter', () => this.stopAutoSlide());
      carousel.addEventListener('mouseleave', () => this.startAutoSlide());
    }
  }
  
  createIndicators() {
    if (!this.indicators) return;
    
    this.indicators.innerHTML = '';
    this.slides.forEach((_, index) => {
      const indicator = document.createElement('button');
      indicator.className = 'indicator';
      if (index === 0) indicator.classList.add('active');
      indicator.setAttribute('aria-label', `Go to slide ${index + 1}`);
      indicator.addEventListener('click', () => this.goToSlide(index));
      this.indicators.appendChild(indicator);
    });
  }
  
  goToSlide(index) {
    if (index < 0 || index >= this.slides.length) return;
    
    // Remove active class from current slide
    this.slides[this.currentSlide].classList.remove('active');
    this.updateIndicator(this.currentSlide, false);
    
    // Set new slide
    this.currentSlide = index;
    this.slides[this.currentSlide].classList.add('active');
    this.updateIndicator(this.currentSlide, true);
  }
  
  nextSlide() {
    const nextIndex = (this.currentSlide + 1) % this.slides.length;
    this.goToSlide(nextIndex);
  }
  
  prevSlide() {
    const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
    this.goToSlide(prevIndex);
  }
  
  updateIndicator(index, isActive) {
    const indicators = this.indicators.querySelectorAll('.indicator');
    if (indicators[index]) {
      if (isActive) {
        indicators[index].classList.add('active');
      } else {
        indicators[index].classList.remove('active');
      }
    }
  }
  
  startAutoSlide() {
    this.stopAutoSlide();
    this.autoSlideInterval = setInterval(() => {
      this.nextSlide();
    }, this.slideDuration);
  }
  
  stopAutoSlide() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
      this.autoSlideInterval = null;
    }
  }
  
  setupTouchEvents() {
    const carousel = document.getElementById('heroCarousel');
    if (!carousel) return;
    
    let touchStartX = 0;
    let touchEndX = 0;
    
    carousel.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });
    
    carousel.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    });
    
    this.handleSwipe = () => {
      const swipeThreshold = 50;
      const diff = touchStartX - touchEndX;
      
      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          this.nextSlide();
        } else {
          this.prevSlide();
        }
      }
    };
  }
}

// Initialize carousel when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new HeroCarousel();
  });
} else {
  new HeroCarousel();
}


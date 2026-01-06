/* VedaWell Tools - Shared JavaScript */

// ===== Mobile Menu Toggle =====
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('open');
            menuBtn.classList.toggle('open');
        });
        
        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
                menuBtn.classList.remove('open');
            });
        });
    }
}

// ===== Scroll Reveal Animation =====
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    
    const revealOnScroll = () => {
        reveals.forEach(element => {
            const windowHeight = window.innerHeight;
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < windowHeight - elementVisible) {
                element.classList.add('active');
            }
        });
    };
    
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Initial check
}

// ===== Search & Filter =====
function initSearch() {
    const searchInput = document.querySelector('.search-box input');
    const toolCards = document.querySelectorAll('.tool-card');
    
    if (searchInput && toolCards.length > 0) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            
            toolCards.forEach(card => {
                const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
                const description = card.querySelector('.card-description')?.textContent.toLowerCase() || '';
                const tags = card.dataset.tags?.toLowerCase() || '';
                
                const matches = title.includes(query) || description.includes(query) || tags.includes(query);
                card.style.display = matches ? '' : 'none';
            });
            
            // Update visible count
            updateVisibleCount();
        });
    }
}

function updateVisibleCount() {
    const visibleCards = document.querySelectorAll('.tool-card:not([style*="display: none"])').length;
    const countEl = document.querySelector('.tools-count');
    if (countEl) {
        countEl.textContent = `${visibleCards} tool${visibleCards !== 1 ? 's' : ''} found`;
    }
}

// ===== Category Filter =====
function initCategoryFilter() {
    const pills = document.querySelectorAll('.category-pill');
    const toolCards = document.querySelectorAll('.tool-card');
    
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            // Update active state
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            
            const category = pill.dataset.category;
            
            toolCards.forEach(card => {
                if (category === 'all' || card.dataset.category === category) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
            
            updateVisibleCount();
        });
    });
}

// ===== Animated Counter =====
function animateCounters() {
    const counters = document.querySelectorAll('.stat-value[data-count]');
    
    counters.forEach(counter => {
        const target = parseInt(counter.dataset.count);
        const duration = 2000;
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;
        
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current) + '+';
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target + '+';
            }
        };
        
        // Start animation when element is in view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(counter);
    });
}

// ===== Lazy Load Ads =====
function initAdsLazyLoad() {
    const adContainers = document.querySelectorAll('.ad-container[data-ad-slot]');
    
    const loadAd = (container) => {
        const slot = container.dataset.adSlot;
        const client = container.dataset.adClient || 'ca-pub-3026726001538425';
        
        // Only load if AdSense is available
        if (typeof adsbygoogle !== 'undefined') {
            container.innerHTML = `
                <ins class="adsbygoogle"
                     style="display:block"
                     data-ad-client="ca-pub-3026726001538425"
                     data-ad-slot="${slot}"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
            `;
            (adsbygoogle = window.adsbygoogle || []).push({});
        }
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                loadAd(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { rootMargin: '200px' });
    
    adContainers.forEach(container => observer.observe(container));
}

// ===== Newsletter Form =====
function initNewsletterForm() {
    const form = document.getElementById('newsletterForm');
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = form.querySelector('input[type="email"]').value;
            
            // Store in localStorage (replace with actual API call)
            const subscribers = JSON.parse(localStorage.getItem('vedawell_subscribers') || '[]');
            if (!subscribers.includes(email)) {
                subscribers.push(email);
                localStorage.setItem('vedawell_subscribers', JSON.stringify(subscribers));
            }
            
            // Show success
            const successMsg = form.querySelector('.success-message');
            if (successMsg) {
                successMsg.style.display = 'block';
                form.querySelector('input[type="email"]').value = '';
            }
            
            console.log('Newsletter signup:', email);
        });
    }
}

// ===== Beta Form =====
function initBetaForm() {
    const form = document.getElementById('betaForm');
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('betaEmail').value;
            
            // Store email in localStorage
            const betaEmails = JSON.parse(localStorage.getItem('betaEmails') || '[]');
            if (!betaEmails.includes(email)) {
                betaEmails.push(email);
                localStorage.setItem('betaEmails', JSON.stringify(betaEmails));
            }
            
            // Show success message
            document.getElementById('betaSuccess').style.display = 'block';
            document.getElementById('betaEmail').value = '';
            
            console.log('Beta signup:', email);
        });
    }
}

// ===== Active Navigation =====
function setActiveNavLink() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || (currentPath === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// ===== Smooth Scroll =====
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ===== Back to Top Button =====
function initBackToTop() {
    const btn = document.querySelector('.back-to-top');
    
    if (btn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        });
        
        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// ===== Initialize All =====
document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initScrollReveal();
    initSearch();
    initCategoryFilter();
    animateCounters();
    initAdsLazyLoad();
    initNewsletterForm();
    initBetaForm();
    setActiveNavLink();
    initSmoothScroll();
    initBackToTop();
});

// ===== Export for module usage =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initMobileMenu,
        initScrollReveal,
        initSearch,
        initCategoryFilter,
        animateCounters
    };
}

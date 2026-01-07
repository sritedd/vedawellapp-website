/* VedaWell Tools - Enhanced Shared JavaScript */

// ===== Tool Database (for dynamic features) =====
const TOOLS_DATABASE = [
    { id: 'focus-timer', name: 'Focus Timer Pro', icon: '🍅', href: 'tool-focus-timer.html', category: 'productivity' },
    { id: 'invoice-generator', name: 'Invoice Generator', icon: '📄', href: 'tool-invoice-generator.html', category: 'generator' },
    { id: 'image-watermarker', name: 'Image Watermarker', icon: '🖼️', href: 'tool-image-watermarker.html', category: 'image' },
    { id: 'tax-calculator', name: 'AU Tax Calculator', icon: '💰', href: 'tool-tax-calculator.html', category: 'calculator' },
    { id: 'password-generator', name: 'Password Generator', icon: '🔑', href: 'tool-password-generator.html', category: 'generator' },
    { id: 'qr-code-generator', name: 'QR Code Generator', icon: '📱', href: 'tool-qr-code-generator.html', category: 'generator' },
    { id: 'json-formatter', name: 'JSON Formatter', icon: '{ }', href: 'tool-json-formatter.html', category: 'developer' },
    { id: 'color-converter', name: 'Color Converter', icon: '🎨', href: 'tool-color-converter.html', category: 'converter' },
    { id: 'markdown-editor', name: 'Markdown Editor', icon: '📑', href: 'tool-markdown-editor.html', category: 'developer' },
    { id: 'gradient-generator', name: 'Gradient Generator', icon: '🌈', href: 'tool-gradient-generator.html', category: 'generator' },
    { id: 'unit-converter', name: 'Unit Converter', icon: '📏', href: 'tool-unit-converter.html', category: 'converter' },
    { id: 'bmi-calculator', name: 'BMI Calculator', icon: '⚖️', href: 'tool-bmi-calculator.html', category: 'calculator' },
    { id: 'todo-list', name: 'Todo List', icon: '✅', href: 'tool-todo-list.html', category: 'productivity' },
    { id: 'habit-tracker', name: 'Habit Tracker', icon: '📊', href: 'tool-habit-tracker.html', category: 'productivity' },
    { id: 'typing-speed-test', name: 'Typing Speed Test', icon: '⌨️', href: 'tool-typing-speed-test.html', category: 'productivity' }
];

// ===== Achievements Definition =====
const ACHIEVEMENTS = [
    { id: 'first-visit', name: 'Welcome!', desc: 'Visit VedaWell Tools for the first time', icon: '👋', target: 1 },
    { id: 'explorer-5', name: 'Explorer', desc: 'Use 5 different tools', icon: '🧭', target: 5 },
    { id: 'explorer-15', name: 'Power User', desc: 'Use 15 different tools', icon: '⚡', target: 15 },
    { id: 'streak-3', name: 'Consistent', desc: 'Visit 3 days in a row', icon: '🔥', target: 3 },
    { id: 'streak-7', name: 'Dedicated', desc: 'Visit 7 days in a row', icon: '🏆', target: 7 },
    { id: 'favorites-3', name: 'Collector', desc: 'Favorite 3 tools', icon: '⭐', target: 3 }
];

// ===== Mobile Menu Toggle =====
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('open');
            menuBtn.classList.toggle('open');
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
                menuBtn.classList.remove('open');
            });
        });
    }
}

// ===== Theme Toggle =====
function initThemeToggle() {
    const savedTheme = localStorage.getItem('vedawell-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Set initial theme
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);

    // Create and insert theme toggle button if not exists
    const navLinks = document.querySelector('.nav-links');
    if (navLinks && !document.querySelector('.theme-toggle')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'theme-toggle';
        toggleBtn.setAttribute('aria-label', 'Toggle theme');
        toggleBtn.innerHTML = '<span class="sun">☀️</span><span class="moon">🌙</span>';
        navLinks.appendChild(toggleBtn);

        toggleBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('vedawell-theme', next);
        });
    }
}

// ===== Scroll Reveal Animation =====
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');

    const revealOnScroll = () => {
        reveals.forEach((element, index) => {
            const windowHeight = window.innerHeight;
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;

            if (elementTop < windowHeight - elementVisible) {
                // Staggered delay for cards
                setTimeout(() => {
                    element.classList.add('active');
                }, index * 50);
            }
        });
    };

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll();
}

// ===== Search & Filter =====
function initSearch() {
    const searchInput = document.querySelector('.search-box input, #toolSearch');
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

// ===== Keyboard Shortcuts =====
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Focus search on '/' key
        if (e.key === '/' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            const searchInput = document.querySelector('.search-box input, #toolSearch, #global-search');
            if (searchInput) {
                searchInput.focus();
            }
        }

        // Close search/dropdown on Escape
        if (e.key === 'Escape') {
            const searchInput = document.querySelector('.search-box input, #toolSearch');
            if (searchInput && document.activeElement === searchInput) {
                searchInput.blur();
            }
        }
    });
}

// ===== Category Filter =====
function initCategoryFilter() {
    const pills = document.querySelectorAll('.category-pill');
    const toolCards = document.querySelectorAll('.tool-card');
    const categoryDividers = document.querySelectorAll('.category-divider');
    const adContainers = document.querySelectorAll('.tools-section .ad-container, .tools-grid .ad-container');

    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            const category = pill.dataset.category;

            // Handle favorites filter
            if (category === 'favorites') {
                const favorites = JSON.parse(localStorage.getItem('vedawell-favorites') || '[]');
                toolCards.forEach(card => {
                    const toolHref = card.getAttribute('href');
                    const toolId = toolHref?.replace('tool-', '').replace('.html', '');
                    card.style.display = favorites.includes(toolId) ? '' : 'none';
                });
                categoryDividers.forEach(d => d.style.display = 'none');
                adContainers.forEach(a => a.style.display = 'none');
            } else {
                toolCards.forEach(card => {
                    if (category === 'all' || card.dataset.category === category) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                });

                categoryDividers.forEach(divider => {
                    divider.style.display = category === 'all' ? '' : 'none';
                });

                adContainers.forEach(ad => {
                    ad.style.display = category === 'all' ? '' : 'none';
                });
            }

            updateVisibleCount();
        });
    });
}

// ===== Favorites System =====
function initFavorites() {
    const favorites = JSON.parse(localStorage.getItem('vedawell-favorites') || '[]');

    // Add favorite buttons to tool cards
    document.querySelectorAll('.tool-card').forEach(card => {
        const toolHref = card.getAttribute('href');
        const toolId = toolHref?.replace('tool-', '').replace('.html', '');

        if (toolId && !card.querySelector('.favorite-btn')) {
            const btn = document.createElement('button');
            btn.className = 'favorite-btn' + (favorites.includes(toolId) ? ' active' : '');
            btn.innerHTML = '<span class="heart-empty">🤍</span><span class="heart-filled">❤️</span>';
            btn.setAttribute('aria-label', 'Toggle favorite');

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite(toolId, btn);
            });

            card.appendChild(btn);
        }
    });

    // Render favorites section on homepage
    renderFavoritesSection();
}

function toggleFavorite(toolId, btn) {
    let favorites = JSON.parse(localStorage.getItem('vedawell-favorites') || '[]');

    if (favorites.includes(toolId)) {
        favorites = favorites.filter(f => f !== toolId);
        btn?.classList.remove('active');
    } else {
        favorites.push(toolId);
        btn?.classList.add('active');
        checkAchievements('favorites', favorites.length);
    }

    localStorage.setItem('vedawell-favorites', JSON.stringify(favorites));
    renderFavoritesSection();
}

function renderFavoritesSection() {
    const container = document.getElementById('favorites-section');
    if (!container) return;

    const favorites = JSON.parse(localStorage.getItem('vedawell-favorites') || '[]');

    if (favorites.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    const scrollContainer = container.querySelector('.tools-scroll');
    if (!scrollContainer) return;

    scrollContainer.innerHTML = favorites.map(id => {
        const tool = TOOLS_DATABASE.find(t => t.id === id);
        if (!tool) return '';
        return `
            <a href="${tool.href}" class="mini-card">
                <div class="card-icon">${tool.icon}</div>
                <h4 class="card-title">${tool.name}</h4>
            </a>
        `;
    }).join('');
}

// ===== Recently Used =====
function initRecentlyUsed() {
    // Track current page as recently used
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage?.startsWith('tool-')) {
        const toolId = currentPage.replace('tool-', '').replace('.html', '');
        trackRecentlyUsed(toolId);
        checkAchievements('tools-used');
    }

    // Render recently used section on homepage
    renderRecentlyUsedSection();
}

function trackRecentlyUsed(toolId) {
    let recent = JSON.parse(localStorage.getItem('vedawell-recent') || '[]');
    recent = [toolId, ...recent.filter(t => t !== toolId)].slice(0, 5);
    localStorage.setItem('vedawell-recent', JSON.stringify(recent));

    // Track unique tools used
    let uniqueTools = JSON.parse(localStorage.getItem('vedawell-unique-tools') || '[]');
    if (!uniqueTools.includes(toolId)) {
        uniqueTools.push(toolId);
        localStorage.setItem('vedawell-unique-tools', JSON.stringify(uniqueTools));
    }
}

function renderRecentlyUsedSection() {
    const container = document.getElementById('recently-used-section');
    if (!container) return;

    const recent = JSON.parse(localStorage.getItem('vedawell-recent') || '[]');

    if (recent.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    const scrollContainer = container.querySelector('.tools-scroll');
    if (!scrollContainer) return;

    scrollContainer.innerHTML = recent.map(id => {
        const tool = TOOLS_DATABASE.find(t => t.id === id);
        if (!tool) return '';
        return `
            <a href="${tool.href}" class="mini-card">
                <div class="card-icon">${tool.icon}</div>
                <h4 class="card-title">${tool.name}</h4>
            </a>
        `;
    }).join('');
}

// ===== Tool of the Day =====
function initToolOfTheDay() {
    const container = document.getElementById('tool-of-day');
    if (!container) return;

    // Get today's tool based on date (deterministic)
    const today = new Date().toDateString();
    const seed = hashCode(today);
    const index = Math.abs(seed) % TOOLS_DATABASE.length;
    const tool = TOOLS_DATABASE[index];

    container.innerHTML = `
        <div class="tool-of-day-header">
            <span class="badge">✨ Tool of the Day</span>
        </div>
        <a href="${tool.href}" class="card" style="display: flex; align-items: center; gap: var(--space-lg); padding: var(--space-lg);">
            <div class="card-icon" style="margin: 0;">${tool.icon}</div>
            <div>
                <h3 class="card-title" style="margin-bottom: 0.25rem;">${tool.name}</h3>
                <p style="color: var(--text-secondary); font-size: var(--font-size-sm); margin: 0;">Discover today's featured tool!</p>
            </div>
            <span class="card-arrow" style="position: static; margin-left: auto;">→</span>
        </a>
    `;
}

function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
}

// ===== Daily Streak =====
function initDailyStreak() {
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem('vedawell-last-visit');
    let streak = parseInt(localStorage.getItem('vedawell-streak') || '0');

    if (lastVisit) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (lastVisit === yesterday) {
            streak++;
        } else if (lastVisit !== today) {
            streak = 1;
        }
    } else {
        streak = 1;
        checkAchievements('first-visit', 1);
    }

    localStorage.setItem('vedawell-streak', streak.toString());
    localStorage.setItem('vedawell-last-visit', today);

    // Check streak achievements
    checkAchievements('streak', streak);

    // Render streak badge
    renderStreakBadge(streak);
}

function renderStreakBadge(streak) {
    const container = document.getElementById('streak-container');
    if (!container) return;

    if (streak >= 2) {
        container.innerHTML = `
            <div class="streak-badge">
                <span class="fire">🔥</span>
                <span>${streak} day streak!</span>
            </div>
        `;
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

// ===== Achievements System =====
function checkAchievements(type, value) {
    const earned = JSON.parse(localStorage.getItem('vedawell-achievements') || '[]');

    let newAchievement = null;

    switch (type) {
        case 'first-visit':
            if (!earned.includes('first-visit')) {
                newAchievement = ACHIEVEMENTS.find(a => a.id === 'first-visit');
            }
            break;
        case 'tools-used':
            const uniqueTools = JSON.parse(localStorage.getItem('vedawell-unique-tools') || '[]');
            if (uniqueTools.length >= 5 && !earned.includes('explorer-5')) {
                newAchievement = ACHIEVEMENTS.find(a => a.id === 'explorer-5');
            } else if (uniqueTools.length >= 15 && !earned.includes('explorer-15')) {
                newAchievement = ACHIEVEMENTS.find(a => a.id === 'explorer-15');
            }
            break;
        case 'streak':
            if (value >= 3 && !earned.includes('streak-3')) {
                newAchievement = ACHIEVEMENTS.find(a => a.id === 'streak-3');
            } else if (value >= 7 && !earned.includes('streak-7')) {
                newAchievement = ACHIEVEMENTS.find(a => a.id === 'streak-7');
            }
            break;
        case 'favorites':
            if (value >= 3 && !earned.includes('favorites-3')) {
                newAchievement = ACHIEVEMENTS.find(a => a.id === 'favorites-3');
            }
            break;
    }

    if (newAchievement) {
        earned.push(newAchievement.id);
        localStorage.setItem('vedawell-achievements', JSON.stringify(earned));
        showAchievementToast(newAchievement);
    }
}

function showAchievementToast(achievement) {
    // Remove existing toast
    document.querySelector('.achievement-toast')?.remove();

    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
        <span class="icon">${achievement.icon}</span>
        <div class="content">
            <h4>Achievement Unlocked!</h4>
            <p>${achievement.name}</p>
        </div>
    `;

    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
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

            const subscribers = JSON.parse(localStorage.getItem('vedawell_subscribers') || '[]');
            if (!subscribers.includes(email)) {
                subscribers.push(email);
                localStorage.setItem('vedawell_subscribers', JSON.stringify(subscribers));
            }

            const successMsg = form.querySelector('.success-message');
            if (successMsg) {
                successMsg.style.display = 'block';
                form.querySelector('input[type="email"]').value = '';
            }
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

            const betaEmails = JSON.parse(localStorage.getItem('betaEmails') || '[]');
            if (!betaEmails.includes(email)) {
                betaEmails.push(email);
                localStorage.setItem('betaEmails', JSON.stringify(betaEmails));
            }

            document.getElementById('betaSuccess').style.display = 'block';
            document.getElementById('betaEmail').value = '';
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
        anchor.addEventListener('click', function (e) {
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

// ===== Global Search (Navbar) =====
function initGlobalSearch() {
    const navbar = document.querySelector('.navbar');
    // Only init if navbar exists and search doesn't
    if (!navbar || document.querySelector('.search-container')) return;

    // Create Search Container
    const searchDiv = document.createElement('div');
    searchDiv.className = 'search-container';
    searchDiv.innerHTML = `
        <div class="search-wrapper">
            <span class="search-icon">🔍</span>
            <input type="text" class="search-input" placeholder="Search 65+ tools..." aria-label="Search">
            <div class="search-dropdown"></div>
        </div>
    `;

    // Insert before mobile menu button (so it's separate from centered nav links if we adjust css later)
    // Or after nav-links. 
    // Current CSS says margin-left: auto, so it will push right.
    // Let's insert before mobile button.
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    if (mobileBtn) {
        navbar.insertBefore(searchDiv, mobileBtn);
    } else {
        navbar.appendChild(searchDiv);
    }

    // Logic
    const input = searchDiv.querySelector('.search-input');
    const dropdown = searchDiv.querySelector('.search-dropdown');

    // Close logic
    document.addEventListener('click', (e) => {
        if (!searchDiv.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });

    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (query.length < 1) {
            dropdown.classList.remove('show');
            return;
        }

        // Use TOOLS_DATABASE (defined at top of file)
        const results = TOOLS_DATABASE.filter(tool =>
            tool.name.toLowerCase().includes(query) ||
            tool.category.toLowerCase().includes(query)
        ).slice(0, 8);

        renderResults(results, dropdown);
    });

    input.addEventListener('focus', () => {
        if (input.value.trim().length > 0) dropdown.classList.add('show');
    });

    function renderResults(results, container) {
        if (results.length === 0) {
            container.innerHTML = '<div class="search-no-results">No tools found</div>';
        } else {
            container.innerHTML = results.map(tool => `
                <a href="${tool.href}" class="search-result-item">
                    <div class="search-result-icon">${tool.icon}</div>
                    <div class="search-result-info">
                        <h4>${tool.name}</h4>
                        <p>${tool.category}</p>
                    </div>
                </a>
            `).join('');
        }
        container.classList.add('show');
    }
}

// ===== Initialize All =====
document.addEventListener('DOMContentLoaded', () => {
    // Core functionality
    initMobileMenu();
    initThemeToggle();
    initScrollReveal();
    initGlobalSearch(); // Added Global Search
    initSearch(); // Existing page-specific search
    initCategoryFilter();
    initKeyboardShortcuts();

    // Engagement features
    initFavorites();
    initRecentlyUsed();
    initToolOfTheDay();
    initDailyStreak();

    // Other features
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
        initThemeToggle,
        initScrollReveal,
        initSearch,
        initCategoryFilter,
        initFavorites,
        initRecentlyUsed,
        initToolOfTheDay,
        initDailyStreak,
        animateCounters
    };
}

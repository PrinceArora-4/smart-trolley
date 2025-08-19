// SmartCart Main JavaScript

// Global Configuration
const SmartCart = {
    config: {
        apiTimeout: 10000,
        debounceDelay: 300,
        animationDuration: 300,
    },
    
    // Initialize the application
    init() {
        this.setupTheme();
        this.setupToastr();
        this.setupGlobalEventListeners();
        console.log('SmartCart initialized');
    },
    
    // Theme Management
    setupTheme() {
        const themeToggle = document.getElementById('theme-toggle');
        const html = document.documentElement;
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            html.classList.add('dark');
        }
        
        // Theme toggle handler
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                html.classList.toggle('dark');
                const isDark = html.classList.contains('dark');
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
                
                // Animate theme change
                document.body.style.transition = 'background-color 0.3s ease';
                setTimeout(() => {
                    document.body.style.transition = '';
                }, 300);
            });
        }
    },
    
    // Toastr Configuration
    setupToastr() {
        if (typeof toastr !== 'undefined') {
            toastr.options = {
                closeButton: true,
                progressBar: true,
                positionClass: 'toast-top-right',
                timeOut: 3000,
                extendedTimeOut: 1000,
                showEasing: 'swing',
                hideEasing: 'linear',
                showMethod: 'fadeIn',
                hideMethod: 'fadeOut'
            };
        }
    },
    
    // Global Event Listeners
    setupGlobalEventListeners() {
        // Handle mobile menu toggle
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenuToggle && mobileMenu) {
            mobileMenuToggle.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
        
        // Handle modal close on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                this.closeModal(e.target.querySelector('.modal-content'));
            }
        });
        
        // Handle escape key for modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal-backdrop:not(.hidden)');
                if (openModal) {
                    this.closeModal(openModal);
                }
            }
        });
        
        // Smooth scroll for anchor links
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href^="#"]')) {
                e.preventDefault();
                const target = document.querySelector(e.target.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    },
    
    // Utility Functions
    utils: {
        // Debounce function
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        
        // Fetch with timeout
        async fetchWithTimeout(url, options = {}, timeout = 10000) {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);
            
            try {
                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal
                });
                clearTimeout(id);
                return response;
            } catch (error) {
                clearTimeout(id);
                throw error;
            }
        },
        
        // Format currency
        formatCurrency(amount) {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR'
            }).format(amount);
        },
        
        // Validate email
        isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },
        
        // Generate unique ID
        generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        },
        
        // Local storage helpers
        storage: {
            set(key, value) {
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                } catch (error) {
                    console.error('Error saving to localStorage:', error);
                }
            },
            
            get(key) {
                try {
                    const item = localStorage.getItem(key);
                    return item ? JSON.parse(item) : null;
                } catch (error) {
                    console.error('Error reading from localStorage:', error);
                    return null;
                }
            },
            
            remove(key) {
                try {
                    localStorage.removeItem(key);
                } catch (error) {
                    console.error('Error removing from localStorage:', error);
                }
            }
        }
    },
    
    // Modal Management
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('animate-fade-in');
            document.body.style.overflow = 'hidden';
        }
    },
    
    closeModal(modal) {
        if (typeof modal === 'string') {
            modal = document.getElementById(modal);
        }
        
        if (modal) {
            const backdrop = modal.closest('.modal-backdrop');
            if (backdrop) {
                backdrop.classList.add('hidden');
                document.body.style.overflow = '';
            }
        }
    },
    
    // Loading States
    showLoading(element, text = 'Loading...') {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (element) {
            element.disabled = true;
            element.innerHTML = `
                <div class="flex items-center justify-center">
                    <div class="spinner mr-2"></div>
                    ${text}
                </div>
            `;
        }
    },
    
    hideLoading(element, originalText) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (element) {
            element.disabled = false;
            element.innerHTML = originalText;
        }
    },
    
    // Form Validation
    validateForm(formElement) {
        const inputs = formElement.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            const errorElement = input.parentNode.querySelector('.form-error');
            
            // Remove existing error
            if (errorElement) {
                errorElement.remove();
            }
            
            // Validate input
            let error = '';
            
            if (!input.value.trim()) {
                error = 'This field is required';
            } else if (input.type === 'email' && !this.utils.isValidEmail(input.value)) {
                error = 'Please enter a valid email address';
            } else if (input.type === 'password' && input.value.length < 6) {
                error = 'Password must be at least 6 characters';
            }
            
            if (error) {
                isValid = false;
                input.classList.add('border-red-500');
                
                const errorDiv = document.createElement('div');
                errorDiv.className = 'form-error';
                errorDiv.textContent = error;
                input.parentNode.appendChild(errorDiv);
            } else {
                input.classList.remove('border-red-500');
            }
        });
        
        return isValid;
    },
    
    // Animation Helpers
    animateElement(element, animation, duration = 300) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (element) {
            element.classList.add(animation);
            setTimeout(() => {
                element.classList.remove(animation);
            }, duration);
        }
    },
    
    // Notification Helpers
    notify: {
        success(message) {
            if (typeof toastr !== 'undefined') {
                toastr.success(message);
            } else {
                console.log('Success:', message);
            }
        },
        
        error(message) {
            if (typeof toastr !== 'undefined') {
                toastr.error(message);
            } else {
                console.error('Error:', message);
            }
        },
        
        warning(message) {
            if (typeof toastr !== 'undefined') {
                toastr.warning(message);
            } else {
                console.warn('Warning:', message);
            }
        },
        
        info(message) {
            if (typeof toastr !== 'undefined') {
                toastr.info(message);
            } else {
                console.info('Info:', message);
            }
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    SmartCart.init();
});

// Export for use in other modules
window.SmartCart = SmartCart;
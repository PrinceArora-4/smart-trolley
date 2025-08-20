// SmartCart Cart Management
class CartManager {
    constructor() {
        this.cart = [];
        this.isLoading = false;
        this.cameraActive = false;
        this.pollInterval = null;
        this.beepSound = new Audio('/static/beep.mp3');
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateCartDisplay();
        this.setupToastr();
    }

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
    }

    bindEvents() {
        // Camera controls
        document.getElementById('start-camera')?.addEventListener('click', () => this.startCamera());
        document.getElementById('stop-camera')?.addEventListener('click', () => this.stopCamera());
        
        // Cart controls
        document.getElementById('clear-cart')?.addEventListener('click', () => this.clearCart());
        document.getElementById('checkout-btn')?.addEventListener('click', (e) => this.handleCheckout(e));
        
        // Search functionality
        const searchBar = document.getElementById('search-bar');
        if (searchBar) {
            searchBar.addEventListener('input', SmartCart.utils.debounce((e) => this.handleSearch(e.target.value), 300));
        }
        
        // Cart item interactions
        document.getElementById('cart-items')?.addEventListener('click', (e) => this.handleCartItemClick(e));
        
        // Modal interactions
        document.getElementById('modal-increment')?.addEventListener('click', () => this.handleModalIncrement());
        document.getElementById('modal-remove')?.addEventListener('click', () => this.handleModalRemove());
        document.getElementById('modal-cancel')?.addEventListener('click', () => this.hideModal());
        
        // Touch gestures for mobile
        this.setupTouchGestures();
    }

    async startCamera() {
        const startBtn = document.getElementById('start-camera');
        const stopBtn = document.getElementById('stop-camera');
        const webcamFeed = document.getElementById('webcam-feed');
        const webcamPlaceholder = document.getElementById('webcam-placeholder');
        const scanEffect = document.getElementById('scan-effect');

        if (this.isLoading) return;

        this.setButtonLoading(startBtn, true);

        try {
            const response = await SmartCart.utils.fetchWithTimeout('/camera/start', { method: 'POST' }, 25000);
            const data = await response.json();

            if (data.success) {
                this.cameraActive = true;
                webcamFeed.src = `/video_feed?${Date.now()}`;
                webcamFeed.classList.remove('hidden');
                webcamPlaceholder.classList.add('hidden');
                scanEffect?.classList.remove('hidden');
                
                startBtn.classList.add('hidden');
                stopBtn.classList.remove('hidden');
                
                this.startCartPolling();
                SmartCart.notify.success('Camera started successfully');
            } else {
                SmartCart.notify.error(`Failed to start camera: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Camera start error:', error);
            SmartCart.notify.error('Error starting camera');
        } finally {
            this.setButtonLoading(startBtn, false);
        }
    }

    async stopCamera() {
        const startBtn = document.getElementById('start-camera');
        const stopBtn = document.getElementById('stop-camera');
        const webcamFeed = document.getElementById('webcam-feed');
        const webcamPlaceholder = document.getElementById('webcam-placeholder');
        const scanEffect = document.getElementById('scan-effect');

        if (this.isLoading) return;

        this.setButtonLoading(stopBtn, true);

        try {
            const response = await SmartCart.utils.fetchWithTimeout('/camera/stop', { method: 'POST' }, 30000);
            const data = await response.json();

            if (data.success) {
                this.cameraActive = false;
                webcamFeed.src = '';
                webcamFeed.classList.add('hidden');
                webcamPlaceholder.classList.remove('hidden');
                scanEffect?.classList.add('hidden');
                
                startBtn.classList.remove('hidden');
                stopBtn.classList.add('hidden');
                
                this.stopCartPolling();
                SmartCart.notify.success('Camera stopped');
            } else {
                SmartCart.notify.error('Failed to stop camera');
            }
        } catch (error) {
            console.error('Camera stop error:', error);
            SmartCart.notify.error('Error stopping camera');
        } finally {
            this.setButtonLoading(stopBtn, false);
        }
    }

    startCartPolling() {
        if (this.pollInterval) return;
        this.pollInterval = setInterval(() => this.updateCart(), 2000);
    }

    stopCartPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    async updateCart() {
        try {
            // Check for prompts first
            if (this.cameraActive) {
                const promptResponse = await SmartCart.utils.fetchWithTimeout('/prompt', {}, 5000);
                const promptData = await promptResponse.json();
                
                if (promptData.action === 'add') {
                    this.handleProductDetected(promptData.item);
                } else if (promptData.action === 'prompt') {
                    this.showDuplicateModal(promptData.item);
                }
            }

            // Update cart data
            const cartResponse = await SmartCart.utils.fetchWithTimeout('/cart', {}, 10000);
            const cartData = await cartResponse.json();
            
            this.cart = cartData.cart;
            this.updateCartDisplay();
            
        } catch (error) {
            console.error('Cart update error:', error);
        }
    }

    handleProductDetected(item) {
        SmartCart.notify.success(`${item.name} added to cart!`);
        this.playBeep();
        
        const existingItem = this.cart.find(cartItem => cartItem.name === item.name);
        if (!existingItem) {
            this.cart.push(item);
            this.animateNewItem(item.id);
        }
        this.updateCartDisplay();
    }

    showDuplicateModal(item) {
        const modal = document.getElementById('duplicate-modal');
        const productName = document.getElementById('modal-product-name');
        
        if (modal && productName) {
            productName.textContent = `${item.name} is already in your cart. What would you like to do?`;
            modal.classList.remove('hidden');
            this.currentModalItem = item;
            this.playBeep();
        }
    }

    hideModal() {
        const modal = document.getElementById('duplicate-modal');
        if (modal) {
            modal.classList.add('hidden');
            this.currentModalItem = null;
        }
    }

    async handleModalIncrement() {
        if (!this.currentModalItem) return;
        
        try {
            const response = await SmartCart.utils.fetchWithTimeout(`/cart/update/${this.currentModalItem.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'increment' })
            });
            
            if (response.ok) {
                SmartCart.notify.success('Quantity increased');
                this.updateCart();
            }
        } catch (error) {
            console.error('Modal increment error:', error);
            SmartCart.notify.error('Error increasing quantity');
        }
        
        this.hideModal();
    }

    async handleModalRemove() {
        if (!this.currentModalItem) return;
        
        try {
            await SmartCart.utils.fetchWithTimeout(`/cart/remove/${this.currentModalItem.id}`, { method: 'POST' });
            SmartCart.notify.success('Item removed');
            this.updateCart();
        } catch (error) {
            console.error('Modal remove error:', error);
            SmartCart.notify.error('Error removing item');
        }
        
        this.hideModal();
    }

    async handleCartItemClick(e) {
        const itemId = parseInt(e.target.dataset.id);
        if (!itemId) return;

        if (e.target.classList.contains('increment')) {
            await this.updateItemQuantity(itemId, 'increment');
        } else if (e.target.classList.contains('decrement')) {
            await this.updateItemQuantity(itemId, 'decrement');
        } else if (e.target.classList.contains('remove-item')) {
            await this.removeItem(itemId);
        }
    }

    async updateItemQuantity(itemId, action) {
        try {
            const response = await SmartCart.utils.fetchWithTimeout(`/cart/update/${itemId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            
            if (response.ok) {
                SmartCart.notify.success(action === 'increment' ? 'Quantity increased' : 'Quantity decreased');
                this.updateCart();
            }
        } catch (error) {
            console.error('Update quantity error:', error);
            SmartCart.notify.error('Error updating quantity');
        }
    }

    async removeItem(itemId) {
        try {
            await SmartCart.utils.fetchWithTimeout(`/cart/remove/${itemId}`, { method: 'POST' });
            SmartCart.notify.success('Item removed');
            this.updateCart();
        } catch (error) {
            console.error('Remove item error:', error);
            SmartCart.notify.error('Error removing item');
        }
    }

    async clearCart() {
        const clearBtn = document.getElementById('clear-cart');
        this.setButtonLoading(clearBtn, true);
        
        try {
            const response = await SmartCart.utils.fetchWithTimeout('/cart/clear', { method: 'POST' });
            const data = await response.json();
            
            if (data.success) {
                this.cart = [];
                this.updateCartDisplay();
                SmartCart.notify.success('Cart cleared');
            } else {
                SmartCart.notify.error('Failed to clear cart');
            }
        } catch (error) {
            console.error('Clear cart error:', error);
            SmartCart.notify.error('Error clearing cart');
        } finally {
            this.setButtonLoading(clearBtn, false);
        }
    }

    handleCheckout(e) {
        const checkoutBtn = e.target.closest('#checkout-btn');
        const loadingSpinner = document.getElementById('checkout-loading');
        
        if (this.cart.length === 0) {
            SmartCart.notify.warning('Your cart is empty');
            e.preventDefault();
            return;
        }
        
        if (loadingSpinner) {
            loadingSpinner.classList.remove('hidden');
            checkoutBtn.querySelector('span:first-child')?.classList.add('opacity-0');
        }
    }

    async handleSearch(query) {
        const searchResults = document.getElementById('search-results');
        if (!searchResults) return;

        if (query.length < 1) {
            searchResults.classList.add('hidden');
            return;
        }

        try {
            const response = await SmartCart.utils.fetchWithTimeout(`/search?query=${encodeURIComponent(query)}`);
            const results = await response.json();
            
            this.displaySearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
            SmartCart.notify.error('Search failed. Please try again.');
        }
    }

    displaySearchResults(results) {
        const searchResults = document.getElementById('search-results');
        if (!searchResults) return;

        searchResults.innerHTML = '';
        
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="p-4 text-gray-600 dark:text-gray-400">No products found</div>';
        } else {
            results.forEach(result => {
                const div = document.createElement('div');
                div.className = 'p-4 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200';
                div.innerHTML = `
                    <h3 class="text-gray-800 dark:text-gray-200 font-semibold">${result.name}</h3>
                    <p class="text-gray-600 dark:text-gray-400 text-sm">${result.description}</p>
                    <p class="text-primary-600 dark:text-primary-400 font-bold">₹${result.price.toFixed(2)}</p>
                `;
                
                div.addEventListener('click', () => this.addSearchResultToCart(result, div));
                searchResults.appendChild(div);
            });
        }
        
        searchResults.classList.remove('hidden');
    }

    async addSearchResultToCart(result, element) {
        element.classList.add('animate-pulse');
        
        try {
            const response = await SmartCart.utils.fetchWithTimeout('/cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: result.name })
            });
            
            const data = await response.json();
            if (data.success) {
                SmartCart.notify.success(`${result.name} added to cart!`);
                this.playBeep();
                this.updateCart();
                
                // Hide search results and clear search bar
                document.getElementById('search-results').classList.add('hidden');
                document.getElementById('search-bar').value = '';
            } else {
                SmartCart.notify.error('Failed to add item to cart');
            }
        } catch (error) {
            console.error('Add to cart error:', error);
            SmartCart.notify.error('Error adding item to cart');
        } finally {
            element.classList.remove('animate-pulse');
        }
    }

    updateCartDisplay() {
        const cartItemsContainer = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        const cartItemCount = document.getElementById('cart-item-count');
        
        if (!cartItemsContainer) return;

        // Update items
        cartItemsContainer.innerHTML = '';
        
        if (this.cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="text-center py-8">
                    <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path>
                    </svg>
                    <p class="text-gray-600 dark:text-gray-400">Your cart is empty</p>
                    <p class="text-sm text-gray-500 dark:text-gray-500 mt-2">Start scanning products or use the search bar</p>
                </div>
            `;
        } else {
            this.cart.forEach(item => {
                const itemElement = this.createCartItemElement(item);
                cartItemsContainer.appendChild(itemElement);
            });
        }

        // Update totals
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const itemCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        if (cartTotal) cartTotal.textContent = total.toFixed(2);
        if (cartItemCount) cartItemCount.textContent = itemCount.toString();
    }

    createCartItemElement(item) {
        const div = document.createElement('div');
        div.className = 'card p-4 flex justify-between items-center hover-lift touch-swipe';
        div.dataset.id = item.id;
        
        div.innerHTML = `
            <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">${item.name}</h3>
                <p class="text-gray-600 dark:text-gray-400 text-sm">${item.description}</p>
                <p class="text-primary-600 dark:text-primary-400 font-bold">₹${item.price.toFixed(2)} x ${item.quantity} = ₹${(item.price * item.quantity).toFixed(2)}</p>
            </div>
            <div class="flex items-center space-x-2 ml-4">
                <button class="btn-icon btn-ghost decrement" data-id="${item.id}">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
                    </svg>
                </button>
                <span class="text-gray-800 dark:text-gray-200 font-medium min-w-[2rem] text-center">${item.quantity}</span>
                <button class="btn-icon btn-ghost increment" data-id="${item.id}">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"></path>
                    </svg>
                </button>
                <button class="btn-icon btn-danger remove-item" data-id="${item.id}">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clip-rule="evenodd"></path>
                        <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3l1.586-1.586a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L8 9V6a1 1 0 011-1z" clip-rule="evenodd"></path>
                    </svg>
                </button>
            </div>
        `;
        
        return div;
    }

    animateNewItem(itemId) {
        setTimeout(() => {
            const element = document.querySelector(`[data-id="${itemId}"]`);
            if (element) {
                element.classList.add('animate-slide-in-right');
                setTimeout(() => element.classList.remove('animate-slide-in-right'), 600);
            }
        }, 100);
    }

    setupTouchGestures() {
        let touchStartX = 0;
        const cartItems = document.getElementById('cart-items');
        
        if (!cartItems) return;

        cartItems.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });

        cartItems.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const swipeDistance = touchStartX - touchEndX;
            
            if (swipeDistance > 50) { // Swipe left to remove
                const item = e.target.closest('.touch-swipe');
                if (item) {
                    const itemId = parseInt(item.dataset.id);
                    this.removeItem(itemId);
                }
            }
        });
    }

    setButtonLoading(button, loading) {
        if (!button) return;
        
        if (loading) {
            button.disabled = true;
            button.classList.add('btn-loading');
        } else {
            button.disabled = false;
            button.classList.remove('btn-loading');
        }
    }

    playBeep() {
        this.beepSound.play().catch(() => console.log('Beep sound failed to play'));
    }
}

// Initialize cart manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.cartManager = new CartManager();
});
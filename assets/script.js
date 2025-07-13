document.addEventListener('DOMContentLoaded', () => {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const cartItemCount = document.getElementById('cart-item-count');
    const clearCartBtn = document.getElementById('clear-cart');
    const searchBar = document.getElementById('search-bar');
    const searchResults = document.getElementById('search-results');
    const searchIcon = document.getElementById('search-icon');
    const duplicateModal = document.getElementById('duplicate-modal');
    const modalProductName = document.getElementById('modal-product-name');
    const modalIncrement = document.getElementById('modal-increment');
    const modalRemove = document.getElementById('modal-remove');
    const modalCancel = document.getElementById('modal-cancel');
    const themeToggle = document.getElementById('theme-toggle');
    const webcamFeed = document.getElementById('webcam-feed');
    const webcamPlaceholder = document.getElementById('webcam-placeholder');
    const scanEffect = document.getElementById('scan-effect');
    const startCameraBtn = document.getElementById('start-camera');
    const stopCameraBtn = document.getElementById('stop-camera');
    const checkoutBtn = document.getElementById('checkout-btn');
    const checkoutLoading = document.getElementById('checkout-loading');

    let currentItem = null;
    let cameraRunning = false;
    let videoFeedErrors = 0;
    let cartErrors = 0;
    const maxErrors = 3;
    const beep = new Audio('/static/beep.mp3');
    let cartPollInterval = null;
    let lastCartErrorTime = 0;
    let localCart = [];
    let lastAddedItemId = null;
    let lastRenderTime = 0;
    const renderDebounceMs = 100;

    // Theme toggle
    themeToggle.addEventListener('click', () => {
        const html = document.documentElement;
        html.classList.toggle('dark');
        const isDark = html.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        console.log('Theme toggled to:', isDark ? 'dark' : 'light');
    });
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
        console.log('Loaded dark theme from local storage');
    }

    // Fetch with timeout
    async function fetchWithTimeout(url, options = {}, timeout = 20000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
            console.log(`Fetching ${url} with timeout ${timeout}ms`);
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);
            console.log(`Fetch ${url} succeeded with status ${response.status}`);
            return response;
        } catch (error) {
            clearTimeout(id);
            console.error(`Fetch ${url} failed: ${error.message}`);
            throw error;
        }
    }

    // Start/stop camera
    startCameraBtn.addEventListener('click', () => {
        startCameraBtn.disabled = true;
        startCameraBtn.innerHTML = '<svg class="w-5 h-5 animate-spin inline-block" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Starting...';
        fetchWithTimeout('/camera/start', { method: 'POST' }, 25000)
            .then(response => response.json())
            .then(data => {
                startCameraBtn.disabled = false;
                startCameraBtn.innerHTML = 'Start Camera';
                if (data.success) {
                    toastr.success('Camera started');
                    webcamFeed.src = "/video_feed";
                    webcamFeed.classList.remove('hidden');
                    webcamPlaceholder.classList.add('hidden');
                    scanEffect.classList.remove('hidden');
                    cameraRunning = true;
                    videoFeedErrors = 0;
                    cartErrors = 0;
                    startCartPolling();
                    setTimeout(() => {
                        if (!webcamFeed.complete || webcamFeed.naturalWidth === 0) {
                            toastr.error('Camera feed failed to load. Stopping camera.');
                            stopCameraBtn.click();
                        }
                    }, 2000);
                } else {
                    toastr.error(`Failed to start camera: ${data.error || 'Unknown error'}`);
                }
            }).catch(error => {
                startCameraBtn.disabled = false;
                startCameraBtn.innerHTML = 'Start Camera';
                console.error('Start camera error:', error.message);
                toastr.error('Error starting camera');
            });
    });
    stopCameraBtn.addEventListener('click', () => {
        fetchWithTimeout('/camera/stop', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    toastr.success('Camera stopped');
                    webcamFeed.src = '';
                    webcamFeed.classList.add('hidden');
                    webcamPlaceholder.classList.remove('hidden');
                    scanEffect.classList.add('hidden');
                    cameraRunning = false;
                    stopCartPolling();
                } else {
                    toastr.error('Failed to stop camera');
                }
            }).catch(error => {
                console.error('Stop camera error:', error.message);
                toastr.error('Error stopping camera');
                webcamFeed.src = '';
                webcamFeed.classList.add('hidden');
                webcamPlaceholder.classList.remove('hidden');
                scanEffect.classList.add('hidden');
                cameraRunning = false;
                stopCartPolling();
            });
    });

    // Magnifying glass focuses search bar
    searchIcon.addEventListener('click', () => {
        console.log('Search icon clicked');
        if (searchBar) {
            searchBar.focus();
        } else {
            console.error('Search bar element not found');
        }
    });

    // Cart polling
    function startCartPolling() {
        if (!cartPollInterval) {
            cartPollInterval = setInterval(() => updateCart(), 2000); // Reduced to 2 seconds
        }
    }
    function stopCartPolling() {
        if (cartPollInterval) {
            clearInterval(cartPollInterval);
            cartPollInterval = null;
        }
    }

    // Render cart UI with animation only for new item
    function renderCart(cartData, newItemId = null) {
        const now = Date.now();
        if (now - lastRenderTime < renderDebounceMs) {
            console.log('Debouncing renderCart call');
            return;
        }
        lastRenderTime = now;
        console.log('Rendering cart with items:', cartData.length, 'newItemId:', newItemId);
        cartItems.innerHTML = '';
        cartData.forEach(item => {
            const isNewItem = newItemId === item.id;
            const itemElement = document.createElement('div');
            itemElement.className = `p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm flex justify-between items-center touch-swipe transform hover:scale-105 transition-transform duration-200 ${isNewItem ? 'animate-slide-in' : ''}`;
            itemElement.dataset.id = item.id;
            itemElement.innerHTML = `
                <div>
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">${item.name}</h3>
                    <p class="text-gray-600 dark:text-gray-400">${item.description}</p>
                    <p class="text-blue-600 dark:text-blue-400 font-bold">₹${item.price.toFixed(2)} x ${item.quantity} = ₹${(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="decrement bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 transition" data-id="${item.id}">-</button>
                    <span class="text-gray-800 dark:text-gray-200">${item.quantity}</span>
                    <button class="increment bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 transition" data-id="${item.id}">+</button>
                    <button class="remove-item bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition" data-id="${item.id}">Remove</button>
                </div>
            `;
            cartItems.appendChild(itemElement);
        });
        cartTotal.textContent = cartData.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);
        if (cartItemCount) {
            cartItemCount.textContent = cartData.reduce((sum, item) => sum + item.quantity, 0);
        }
        console.log('Cart rendered, animated item:', newItemId);
    }

    async function updateCart(skipVideoFeed = false, retries = 3) {
        if (!cameraRunning && !skipVideoFeed) {
            stopCartPolling();
            return;
        }
        if (cartErrors >= maxErrors) {
            return;
        }
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                // Prioritize prompt fetch when camera is running
                if (cameraRunning && !skipVideoFeed) {
                    try {
                        const promptStart = performance.now();
                        const promptResponse = await fetchWithTimeout('/prompt');
                        const promptData = await promptResponse.json();
                        console.log(`Prompt fetch took ${(performance.now() - promptStart).toFixed(2)}ms`);
                        if (promptData.action === 'add') {
                            toastr.success(`${promptData.item.name} added to cart!`);
                            beep.play().catch(() => console.log('Beep sound failed'));
                            const existingItem = localCart.find(item => item.name === promptData.item.name);
                            if (!existingItem) {
                                localCart.push(promptData.item);
                                lastAddedItemId = promptData.item.id;
                                renderCart(localCart, lastAddedItemId);
                            }
                        } else if (promptData.action === 'prompt') {
                            currentItem = promptData.item;
                            modalProductName.textContent = `${promptData.item.name} is already in your cart. What would you like to do?`;
                            duplicateModal.classList.remove('hidden');
                            beep.play().catch(() => console.log('Beep sound failed'));
                        }
                        videoFeedErrors = 0;
                    } catch (error) {
                        console.error('Prompt fetch error:', error.message);
                        videoFeedErrors++;
                        if (videoFeedErrors >= maxErrors) {
                            toastr.error('Prompt feed unavailable. Pausing cart updates.');
                            stopCartPolling();
                        }
                    }
                }

                const cartResponse = await fetchWithTimeout('/cart');
                const data = await cartResponse.json();
                console.log('Cart data:', data);
                localCart = data.cart;
                renderCart(localCart);
                if (cartItemCount) {
                    cartItemCount.textContent = data.item_count;
                }
                cartErrors = 0;
                return;
            } catch (error) {
                console.error('Cart update error (attempt ' + (attempt + 1) + '):', error.message);
                if (attempt === retries) {
                    cartErrors++;
                    const now = Date.now();
                    if (now - lastCartErrorTime > 20000) {
                        toastr.error('Failed to update cart');
                        lastCartErrorTime = now;
                    }
                    if (cartErrors >= maxErrors) {
                        toastr.error('Too many cart update failures. Pausing updates.');
                        stopCartPolling();
                        renderCart(localCart);
                    }
                }
            }
        }
    }

    // Quantity controls
    cartItems.addEventListener('click', (e) => {
        const id = parseInt(e.target.dataset.id);
        if (e.target.classList.contains('increment')) {
            fetchWithTimeout(`/cart/update/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'increment' })
            }).then(response => response.json())
                .then(data => {
                    if (data.success) {
                        toastr.success('Quantity increased');
                        localCart = localCart.map(item => 
                            item.id === id ? { ...item, quantity: item.quantity + 1 } : item
                        );
                        renderCart(localCart);
                        updateCart();
                    } else {
                        toastr.error('Failed to increase quantity');
                    }
                }).catch(error => {
                    console.error('Increment error:', error.message);
                    toastr.error('Error increasing quantity');
                    renderCart(localCart);
                });
        } else if (e.target.classList.contains('decrement')) {
            fetchWithTimeout(`/cart/update/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'decrement' })
            }).then(response => response.json())
                .then(data => {
                    if (data.success) {
                        toastr.success('Quantity decreased');
                        localCart = localCart.map(item => 
                            item.id === id && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item
                        );
                        renderCart(localCart);
                        updateCart();
                    } else {
                        toastr.error('Failed to decrease quantity');
                    }
                }).catch(error => {
                    console.error('Decrement error:', error.message);
                    toastr.error('Error decreasing quantity');
                    renderCart(localCart);
                });
        } else if (e.target.classList.contains('remove-item')) {
            fetchWithTimeout(`/cart/remove/${id}`, { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        console.log('Server confirmed item removal');
                    } else {
                        console.warn('Server failed to remove item:', data.error);
                    }
                }).catch(error => {
                    console.error('Remove error:', error.message);
                }).finally(() => {
                    toastr.success('Item removed');
                    localCart = localCart.filter(item => item.id !== id);
                    renderCart(localCart);
                    updateCart();
                });
        }
    });

    // Modal actions
    modalIncrement.addEventListener('click', () => {
        fetchWithTimeout(`/cart/update/${currentItem.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'increment' })
        }).then(() => {
            toastr.success('Quantity increased');
            localCart = localCart.map(item => 
                item.id === currentItem.id ? { ...item, quantity: item.quantity + 1 } : item
            );
            renderCart(localCart);
            duplicateModal.classList.add('hidden');
            updateCart();
        }).catch(error => {
            console.error('Modal increment error:', error.message);
            toastr.error('Error increasing quantity');
            renderCart(localCart);
        });
    });
    modalRemove.addEventListener('click', () => {
        fetchWithTimeout(`/cart/remove/${currentItem.id}`, { method: 'POST' })
            .then(() => {
                console.log('Server confirmed modal item removal');
            }).catch(error => {
                console.error('Modal remove error:', error.message);
            }).finally(() => {
                toastr.success('Item removed');
                localCart = localCart.filter(item => item.id !== currentItem.id);
                renderCart(localCart);
                duplicateModal.classList.add('hidden');
                updateCart();
            });
    });
    modalCancel.addEventListener('click', () => {
        duplicateModal.classList.add('hidden');
    });

    // Clear cart
    clearCartBtn.addEventListener('click', () => {
        fetchWithTimeout('/cart/clear', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    toastr.success('Cart cleared');
                    localCart = [];
                    renderCart(localCart);
                    updateCart(true);
                } else {
                    toastr.error('Failed to clear cart');
                }
            }).catch(error => {
                console.error('Clear cart error:', error.message);
                toastr.error('Error clearing cart');
                localCart = [];
                renderCart(localCart);
            });
    });

    // Checkout button
    checkoutBtn.addEventListener('click', (e) => {
        checkoutLoading.classList.remove('hidden');
        checkoutBtn.querySelector('span:first-child').classList.add('opacity-0');
        window.location.href = '/checkout';
        setTimeout(() => {
            checkoutLoading.classList.add('hidden');
            checkoutBtn.querySelector('span:first-child').classList.remove('opacity-0');
        }, 2000);
    });

    // Search bar
    searchBar.addEventListener('input', () => {
        const query = searchBar.value.trim();
        console.log('Search query:', query);
        if (query.length < 1) {
            searchResults.classList.add('hidden');
            searchResults.innerHTML = '';
            return;
        }
        fetchWithTimeout(`/search?query=${encodeURIComponent(query)}`)
            .then(response => {
                console.log('Search response status:', response.status);
                return response.json();
            })
            .then(results => {
                console.log('Search results:', results);
                searchResults.innerHTML = '';
                if (results.length === 0) {
                    searchResults.innerHTML = '<div class="p-3 text-gray-600 dark:text-gray-400">No products found</div>';
                    searchResults.classList.remove('hidden');
                    return;
                }
                results.forEach(result => {
                    const div = document.createElement('div');
                    div.className = 'p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer search-result';
                    div.innerHTML = `
                        <h3 class="text-gray-800 dark:text-gray-200 font-semibold">${result.name}</h3>
                        <p class="text-gray-600 dark:text-gray-400 text-sm">${result.description}</p>
                        <p class="text-blue-600 dark:text-blue-400 font-bold">₹${result.price.toFixed(2)}</p>
                    `;
                    div.addEventListener('click', () => {
                        div.classList.add('animate-pulse');
                        setTimeout(() => div.classList.remove('animate-pulse'), 300);
                        fetchWithTimeout('/cart/add', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: result.name })
                        }).then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    toastr.success(`${result.name} added to cart!`);
                                    beep.play().catch(() => console.log('Beep sound failed'));
                                    const existingItem = localCart.find(item => item.name === result.name);
                                    if (existingItem) {
                                        existingItem.quantity += 1;
                                        lastAddedItemId = existingItem.id;
                                    } else {
                                        const newItem = {
                                            id: localCart.length,
                                            name: result.name,
                                            price: result.price,
                                            description: result.description,
                                            quantity: 1
                                        };
                                        localCart.push(newItem);
                                        lastAddedItemId = newItem.id;
                                    }
                                    renderCart(localCart, lastAddedItemId);
                                    searchResults.classList.add('hidden');
                                    searchBar.value = '';
                                } else {
                                    toastr.error('Failed to add item to cart');
                                }
                            }).catch(error => {
                                console.error('Add to cart error:', error.message);
                                toastr.error('Error adding item to cart');
                            });
                    });
                    searchResults.appendChild(div);
                });
                searchResults.classList.remove('hidden');
            }).catch(error => {
                console.error('Search error:', error.message);
                toastr.error('Search failed. Please try again.');
            });
    });

    // Hide search results on click outside
    document.addEventListener('click', (e) => {
        if (!searchBar.contains(e.target) && !searchResults.contains(e.target) && !searchIcon.contains(e.target)) {
            searchResults.classList.add('hidden');
        }
    });

    // Touch gestures
    let touchStartX = 0;
    cartItems.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    });
    cartItems.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        if (touchStartX - touchEndX > 50) {
            const item = e.target.closest('.touch-swipe');
            if (item) {
                const id = parseInt(item.dataset.id);
                fetchWithTimeout(`/cart/remove/${id}`, { method: 'POST' })
                    .then(() => {
                        console.log('Server confirmed swipe item removal');
                    }).catch(error => {
                        console.error('Touch remove error:', error.message);
                    }).finally(() => {
                        toastr.success('Item removed');
                        localCart = localCart.filter(item => item.id !== id);
                        renderCart(localCart);
                        updateCart();
                    });
            }
        }
    });

    // Initial cart update on page load
    updateCart(true);
});
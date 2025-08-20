// SmartCart Dashboard Management
class DashboardManager {
    constructor() {
        this.userType = this.getUserType();
        this.currentStore = null;
        this.currentOutlet = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboardData();
    }

    getUserType() {
        // In a real app, this would come from authentication
        const path = window.location.pathname;
        if (path.includes('admin')) return 'admin';
        if (path.includes('customer')) return 'customer';
        return 'customer'; // default
    }

    setupEventListeners() {
        // Store selection
        document.addEventListener('click', (e) => {
            if (e.target.matches('.store-card')) {
                this.selectStore(e.target.dataset.storeId);
            }
            
            if (e.target.matches('.outlet-card')) {
                this.selectOutlet(e.target.dataset.outletId);
            }
            
            if (e.target.matches('.quick-action-btn')) {
                this.handleQuickAction(e.target.dataset.action);
            }
        });

        // Search functionality
        const searchInput = document.getElementById('dashboard-search');
        if (searchInput) {
            searchInput.addEventListener('input', SmartCart.utils.debounce((e) => {
                this.handleSearch(e.target.value);
            }, 300));
        }
    }

    async loadDashboardData() {
        try {
            // Load user-specific dashboard data
            if (this.userType === 'admin') {
                await this.loadAdminData();
            } else {
                await this.loadCustomerData();
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            SmartCart.notify.error('Failed to load dashboard data');
        }
    }

    async loadCustomerData() {
        // Mock data for customer dashboard
        const stores = [
            { id: 1, name: 'SmartMart Downtown', distance: '0.5 km', outlets: 3, image: 'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=400' },
            { id: 2, name: 'SmartMart Mall', distance: '1.2 km', outlets: 5, image: 'https://images.pexels.com/photos/1005638/pexels-photo-1005638.jpeg?auto=compress&cs=tinysrgb&w=400' },
            { id: 3, name: 'SmartMart Express', distance: '2.1 km', outlets: 2, image: 'https://images.pexels.com/photos/811108/pexels-photo-811108.jpeg?auto=compress&cs=tinysrgb&w=400' }
        ];

        this.renderStoreSelection(stores);
    }

    async loadAdminData() {
        // Mock data for admin dashboard
        const stats = {
            totalSales: 125000,
            todayOrders: 45,
            totalProducts: 1250,
            lowStock: 12
        };

        const recentOrders = [
            { id: '#ORD001', customer: 'John Doe', amount: 1250, status: 'completed', time: '2 mins ago' },
            { id: '#ORD002', customer: 'Jane Smith', amount: 890, status: 'processing', time: '5 mins ago' },
            { id: '#ORD003', customer: 'Mike Johnson', amount: 2100, status: 'completed', time: '8 mins ago' }
        ];

        this.renderAdminDashboard(stats, recentOrders);
    }

    renderStoreSelection(stores) {
        const container = document.getElementById('stores-container');
        if (!container) return;

        container.innerHTML = stores.map(store => `
            <div class="store-card card card-hover cursor-pointer" data-store-id="${store.id}">
                <div class="relative h-48 overflow-hidden">
                    <img src="${store.image}" alt="${store.name}" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div class="absolute bottom-4 left-4 text-white">
                        <h3 class="text-lg font-semibold">${store.name}</h3>
                        <p class="text-sm opacity-90">${store.distance} away</p>
                    </div>
                </div>
                <div class="card-body">
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600 dark:text-gray-400">${store.outlets} outlets available</span>
                        <span class="badge badge-success">Open</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderAdminDashboard(stats, orders) {
        // Render stats cards
        const statsContainer = document.getElementById('admin-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="card">
                    <div class="card-body text-center">
                        <div class="text-3xl font-bold text-green-600">₹${stats.totalSales.toLocaleString()}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Total Sales</div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-body text-center">
                        <div class="text-3xl font-bold text-blue-600">${stats.todayOrders}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Today's Orders</div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-body text-center">
                        <div class="text-3xl font-bold text-purple-600">${stats.totalProducts}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Total Products</div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-body text-center">
                        <div class="text-3xl font-bold text-red-600">${stats.lowStock}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Low Stock Items</div>
                    </div>
                </div>
            `;
        }

        // Render recent orders
        const ordersContainer = document.getElementById('recent-orders');
        if (ordersContainer) {
            ordersContainer.innerHTML = orders.map(order => `
                <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div>
                        <div class="font-semibold text-gray-800 dark:text-gray-200">${order.id}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">${order.customer}</div>
                    </div>
                    <div class="text-right">
                        <div class="font-semibold text-gray-800 dark:text-gray-200">₹${order.amount}</div>
                        <div class="text-xs text-gray-500">${order.time}</div>
                    </div>
                    <span class="badge ${order.status === 'completed' ? 'badge-success' : 'badge-warning'}">${order.status}</span>
                </div>
            `).join('');
        }
    }

    selectStore(storeId) {
        this.currentStore = storeId;
        
        // Mock outlets for selected store
        const outlets = [
            { id: 1, name: 'Ground Floor', status: 'available', queue: 2 },
            { id: 2, name: 'First Floor', status: 'busy', queue: 5 },
            { id: 3, name: 'Food Court', status: 'available', queue: 1 }
        ];

        this.renderOutletSelection(outlets);
    }

    renderOutletSelection(outlets) {
        const container = document.getElementById('outlets-container');
        if (!container) return;

        container.innerHTML = `
            <div class="mb-6">
                <button onclick="history.back()" class="btn btn-outline">
                    <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"></path>
                    </svg>
                    Back to Stores
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${outlets.map(outlet => `
                    <div class="outlet-card card card-hover cursor-pointer" data-outlet-id="${outlet.id}">
                        <div class="card-body">
                            <div class="flex justify-between items-start mb-4">
                                <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">${outlet.name}</h3>
                                <span class="badge ${outlet.status === 'available' ? 'badge-success' : 'badge-warning'}">${outlet.status}</span>
                            </div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">
                                Queue: ${outlet.queue} customers
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    selectOutlet(outletId) {
        this.currentOutlet = outletId;
        
        // Redirect to cart page with store and outlet context
        const params = new URLSearchParams({
            store: this.currentStore,
            outlet: outletId
        });
        
        window.location.href = `/cart?${params.toString()}`;
    }

    handleQuickAction(action) {
        switch (action) {
            case 'scan':
                window.location.href = '/cart';
                break;
            case 'search':
                document.getElementById('dashboard-search')?.focus();
                break;
            case 'orders':
                window.location.href = '/orders';
                break;
            case 'profile':
                window.location.href = '/profile';
                break;
            case 'manage-stock':
                this.showStockManagement();
                break;
            case 'add-product':
                this.showAddProduct();
                break;
            case 'view-reports':
                this.showReports();
                break;
            default:
                console.log('Unknown action:', action);
        }
    }

    handleSearch(query) {
        if (query.length < 2) return;
        
        // Mock search results
        const results = [
            { name: 'Maggi Noodles', price: 28, category: 'Food' },
            { name: 'Amul Milk', price: 60, category: 'Dairy' },
            { name: 'Britannia Biscuits', price: 40, category: 'Snacks' }
        ].filter(item => item.name.toLowerCase().includes(query.toLowerCase()));

        this.displaySearchResults(results);
    }

    displaySearchResults(results) {
        const container = document.getElementById('search-results');
        if (!container) return;

        if (results.length === 0) {
            container.innerHTML = '<div class="p-4 text-gray-600 dark:text-gray-400">No products found</div>';
        } else {
            container.innerHTML = results.map(result => `
                <div class="p-4 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="font-semibold text-gray-800 dark:text-gray-200">${result.name}</h4>
                            <p class="text-sm text-gray-600 dark:text-gray-400">${result.category}</p>
                        </div>
                        <span class="font-bold text-primary-600">₹${result.price}</span>
                    </div>
                </div>
            `).join('');
        }
        
        container.classList.remove('hidden');
    }

    showStockManagement() {
        // Mock implementation - would show stock management interface
        SmartCart.notify.info('Stock management feature coming soon');
    }

    showAddProduct() {
        // Mock implementation - would show add product form
        SmartCart.notify.info('Add product feature coming soon');
    }

    showReports() {
        // Mock implementation - would show reports dashboard
        SmartCart.notify.info('Reports feature coming soon');
    }
}

// Initialize dashboard manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard')) {
        window.dashboardManager = new DashboardManager();
    }
});
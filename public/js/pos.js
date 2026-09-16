// POS System - Hussain Son's Pharmacy
const POS = {
    cart: [],
    customer: { name: 'Walk-in Customer', phone: '' },
    paymentMethod: 'cash',
    discount: 0,
    taxRate: 0.05,

    products: [
        { id: 1, name: 'Paracetamol 500mg', category: 'tablets', price: 25, stock: 150, batch: 'P001', expiry: '2025-12' },
        { id: 2, name: 'Amoxicillin 500mg', category: 'capsules', price: 120, stock: 80, batch: 'A001', expiry: '2025-08' },
        { id: 3, name: 'Cetirizine 10mg', category: 'tablets', price: 35, stock: 200, batch: 'C001', expiry: '2026-03' },
        { id: 4, name: 'Panadol Extra', category: 'tablets', price: 45, stock: 120, batch: 'PE01', expiry: '2025-11' },
        { id: 5, name: 'Brufen 400mg', category: 'tablets', price: 55, stock: 90, batch: 'B001', expiry: '2025-09' },
        { id: 6, name: 'Augmentin 625mg', category: 'tablets', price: 280, stock: 45, batch: 'AU01', expiry: '2025-07' },
        { id: 7, name: 'Nexium 40mg', category: 'capsules', price: 450, stock: 30, batch: 'N001', expiry: '2026-01' },
        { id: 8, name: 'Glucophage 500mg', category: 'tablets', price: 85, stock: 100, batch: 'G001', expiry: '2025-10' },
        { id: 9, name: 'Losartan 50mg', category: 'tablets', price: 95, stock: 75, batch: 'L001', expiry: '2026-02' },
        { id: 10, name: 'Atorvastatin 20mg', category: 'tablets', price: 110, stock: 60, batch: 'AT01', expiry: '2025-12' },
        { id: 11, name: 'Azithromycin 500mg', category: 'tablets', price: 180, stock: 55, batch: 'AZ01', expiry: '2025-08' },
        { id: 12, name: 'Metformin 850mg', category: 'tablets', price: 65, stock: 110, batch: 'M001', expiry: '2026-04' },
        { id: 13, name: 'Omeprazole 20mg', category: 'capsules', price: 75, stock: 85, batch: 'O001', expiry: '2025-11' },
        { id: 14, name: 'Amlodipine 5mg', category: 'tablets', price: 50, stock: 95, batch: 'AM01', expiry: '2026-01' },
        { id: 15, name: 'Cough Syrup', category: 'syrups', price: 120, stock: 40, batch: 'CS01', expiry: '2025-06' },
        { id: 16, name: 'Mixtures syrup', category: 'syrups', price: 90, stock: 35, batch: 'MS01', expiry: '2025-09' },
        { id: 17, name: 'Voltaren Gel', category: 'ointments', price: 220, stock: 25, batch: 'V001', expiry: '2025-10' },
        { id: 18, name: 'Betnovate Cream', category: 'ointments', price: 85, stock: 50, batch: 'BV01', expiry: '2025-08' },
        { id: 19, name: 'Deriphyllin Retard', category: 'tablets', price: 65, stock: 70, batch: 'DR01', expiry: '2026-02' },
        { id: 20, name: 'Voltaren Injection', category: 'injections', price: 95, stock: 30, batch: 'VI01', expiry: '2025-07' }
    ],

    init() {
        this.renderProducts();
        this.bindEvents();
        this.bindKeyboard();
    },

    renderProducts(filter = 'all', search = '') {
        const grid = document.getElementById('productsGrid');
        let filtered = this.products;

        if (filter !== 'all') {
            filtered = filtered.filter(p => p.category === filter);
        }

        if (search) {
            const s = search.toLowerCase();
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(s) || 
                p.batch.toLowerCase().includes(s)
            );
        }

        grid.innerHTML = filtered.map(p => `
            <div class="product-card" onclick="POS.addToCart(${p.id})">
                <div class="product-icon">
                    <i class="fas ${this.getCategoryIcon(p.category)}"></i>
                </div>
                <div class="product-name">${p.name}</div>
                <div class="product-stock">Stock: ${p.stock}</div>
                <div class="product-price">₨ ${p.price}</div>
            </div>
        `).join('');
    },

    getCategoryIcon(category) {
        const icons = {
            tablets: 'fa-tablets',
            capsules: 'fa-capsules',
            syrups: 'fa-flask',
            injections: 'fa-syringe',
            ointments: 'fa-tube'
        };
        return icons[category] || 'fa-pills';
    },

    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product || product.stock <= 0) return;

        const existing = this.cart.find(item => item.id === productId);
        if (existing) {
            if (existing.qty < product.stock) {
                existing.qty++;
            }
        } else {
            this.cart.push({ ...product, qty: 1 });
        }
        this.updateCart();
    },

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.updateCart();
    },

    updateQty(productId, change) {
        const item = this.cart.find(i => i.id === productId);
        const product = this.products.find(p => p.id === productId);
        if (!item || !product) return;

        item.qty += change;
        if (item.qty <= 0) {
            this.removeFromCart(productId);
        } else if (item.qty > product.stock) {
            item.qty = product.stock;
        }
        this.updateCart();
    },

    updateCart() {
        const cartEl = document.getElementById('cartItems');
        
        if (this.cart.length === 0) {
            cartEl.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-basket"></i>
                    <p>Cart is empty</p>
                    <span>Scan or search medicine to add</span>
                </div>
            `;
        } else {
            cartEl.innerHTML = this.cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">₨ ${item.price} × ${item.qty}</div>
                    </div>
                    <div class="cart-item-qty">
                        <button class="qty-btn" onclick="POS.updateQty(${item.id}, -1)">-</button>
                        <span class="qty-value">${item.qty}</span>
                        <button class="qty-btn" onclick="POS.updateQty(${item.id}, 1)">+</button>
                    </div>
                    <div class="cart-item-total">
                        <strong>₨ ${(item.price * item.qty).toFixed(2)}</strong>
                        <button class="cart-item-remove" onclick="POS.removeFromCart(${item.id})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        this.updateTotals();
    },

    updateTotals() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const discount = this.discount;
        const taxable = subtotal - discount;
        const tax = taxable * this.taxRate;
        const total = taxable + tax;

        document.getElementById('subtotal').textContent = `₨ ${subtotal.toFixed(2)}`;
        document.getElementById('discount').textContent = `- ₨ ${discount.toFixed(2)}`;
        document.getElementById('tax').textContent = `₨ ${tax.toFixed(2)}`;
        document.getElementById('total').textContent = `₨ ${total.toFixed(2)}`;

        // Update change
        const received = parseFloat(document.getElementById('receivedAmount').value) || 0;
        const change = received - total;
        document.getElementById('changeAmount').textContent = `₨ ${change >= 0 ? change.toFixed(2) : '0.00'}`;
    },

    clearCart() {
        if (this.cart.length === 0) return;
        if (confirm('Are you sure you want to clear the cart?')) {
            this.cart = [];
            this.discount = 0;
            this.updateCart();
            document.getElementById('receivedAmount').value = '';
        }
    },

    holdSale() {
        if (this.cart.length === 0) return;
        const heldSales = JSON.parse(localStorage.getItem('heldSales') || '[]');
        heldSales.push({
            cart: [...this.cart],
            customer: this.customer,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('heldSales', JSON.stringify(heldSales));
        this.cart = [];
        this.updateCart();
        alert('Sale held successfully!');
    },

    completeSale() {
        if (this.cart.length === 0) {
            alert('Cart is empty!');
            return;
        }

        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const total = (subtotal - this.discount) * (1 + this.taxRate);
        const received = parseFloat(document.getElementById('receivedAmount').value) || 0;

        if (received < total) {
            alert('Insufficient amount received!');
            return;
        }

        // Here you would send to backend
        console.log('Sale completed:', {
            cart: this.cart,
            customer: this.customer,
            subtotal,
            discount: this.discount,
            tax: subtotal * this.taxRate,
            total,
            received,
            change: received - total,
            paymentMethod: this.paymentMethod
        });

        alert(`Sale completed!\nTotal: ₨ ${total.toFixed(2)}\nChange: ₨ ${(received - total).toFixed(2)}`);
        this.cart = [];
        this.discount = 0;
        this.customer = { name: 'Walk-in Customer', phone: '' };
        document.getElementById('receivedAmount').value = '';
        document.getElementById('selectCustomerBtn').previousElementSibling.textContent = 'Walk-in Customer';
        this.updateCart();
    },

    bindEvents() {
        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            const activeFilter = document.querySelector('.filter-btn.active').dataset.category;
            this.renderProducts(activeFilter, e.target.value);
        });

        // Category filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderProducts(btn.dataset.category, document.getElementById('searchInput').value);
            });
        });

        // Payment method
        document.querySelectorAll('.payment-method').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.payment-method').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.paymentMethod = btn.dataset.method;
            });
        });

        // Received amount
        document.getElementById('receivedAmount').addEventListener('input', () => this.updateTotals());

        // Buttons
        document.getElementById('clearCartBtn').addEventListener('click', () => this.clearCart());
        document.getElementById('holdSaleBtn').addEventListener('click', () => this.holdSale());
        document.getElementById('completeSaleBtn').addEventListener('click', () => this.completeSale());

        // Customer modal
        document.getElementById('selectCustomerBtn').addEventListener('click', () => {
            document.getElementById('customerModal').classList.add('active');
        });

        document.querySelector('.modal-close').addEventListener('click', () => {
            document.getElementById('customerModal').classList.remove('active');
        });

        document.querySelectorAll('.customer-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.customer-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                const name = item.querySelector('strong').textContent;
                document.getElementById('selectCustomerBtn').previousElementSibling.textContent = name;
                this.customer = { name, phone: item.querySelector('span').textContent };
                document.getElementById('customerModal').classList.remove('active');
            });
        });
    },

    bindKeyboard() {
        document.addEventListener('keydown', (e) => {
            // F2 - Focus search
            if (e.key === 'F2') {
                e.preventDefault();
                document.getElementById('searchInput').focus();
            }
            // F8 - Hold sale
            if (e.key === 'F8') {
                e.preventDefault();
                this.holdSale();
            }
            // Ctrl+Enter - Complete sale
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.completeSale();
            }
            // Escape - Close modal
            if (e.key === 'Escape') {
                document.getElementById('customerModal').classList.remove('active');
            }
        });
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => POS.init());

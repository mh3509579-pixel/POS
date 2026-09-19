import { medicineStore, Medicine } from '../stores/medicine.store';
import { printInvoice, InvoiceData } from '../utils/invoice';
import { authService } from '../services/auth.service';
import { salesService } from '../services/sales.service';
import { confirmAction, successToast, errorToast } from '../utils/alerts';

export function renderPOS(): string {
  return `
    <div class="pos-container">
      <!-- Left Side: Products -->
      <div class="pos-products">
        <div class="pos-search">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input type="text" id="searchInput" placeholder="Search medicine or scan barcode..." autofocus>
            <kbd>F2</kbd>
          </div>
          <div class="category-filters">
            <button class="filter-btn active" data-category="all">All</button>
            <button class="filter-btn" data-category="tablets">Tablets</button>
            <button class="filter-btn" data-category="syrups">Syrups</button>
            <button class="filter-btn" data-category="injections">Injections</button>
            <button class="filter-btn" data-category="capsules">Capsules</button>
            <button class="filter-btn" data-category="ointments">Ointments</button>
          </div>
        </div>
        <div class="products-grid" id="productsGrid"></div>
        <button class="pos-cart-toggle" id="posCartToggle" title="Open Cart">
          <i class="bi bi-cart3"></i>
          <span class="cart-count-badge" id="cartCountBadge">0</span>
        </button>
      </div>

      <!-- Right Side: Cart -->
      <div class="pos-cart" id="posCart">
        <button class="pos-cart-close d-lg-none" id="posCartClose" title="Close Cart">
          <i class="bi bi-x-lg"></i>
        </button>
        <div class="cart-header">
          <h3><i class="bi bi-cart3"></i> Current Sale</h3>
          <div class="cart-actions">
            <button class="btn-icon" id="holdSaleBtn" title="Hold Sale (F8)">
              <i class="bi bi-pause-circle"></i>
            </button>
            <button class="btn-icon" id="clearCartBtn" title="Clear Cart">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>

        <div class="cart-customer">
          <i class="bi bi-person"></i>
          <span id="customerName">Walk-in Customer</span>
          <button class="btn-link" id="selectCustomerBtn">Change</button>
        </div>

        <div class="cart-items" id="cartItems">
          <div class="empty-cart">
            <i class="bi bi-cart-x"></i>
            <p>Cart is empty</p>
            <span>Scan or search medicine to add</span>
          </div>
        </div>

        <div class="cart-summary">
          <div class="summary-row">
            <span>Subtotal</span>
            <span id="subtotal">₨ 0.00</span>
          </div>
          <div class="summary-row">
            <span>Discount</span>
            <span id="discount">- ₨ 0.00</span>
          </div>
          <div class="summary-row">
            <span>Tax (5%)</span>
            <span id="tax">₨ 0.00</span>
          </div>
          <div class="summary-row total">
            <span>Total</span>
            <span id="total">₨ 0.00</span>
          </div>
        </div>

        <div class="cart-payment">
          <div class="payment-input">
            <label>Received</label>
            <input type="number" id="receivedAmount" placeholder="0.00" min="0">
          </div>
          <div class="payment-input">
            <label>Change</label>
            <input type="text" id="changeAmount" readonly value="₨ 0.00">
          </div>
        </div>

        <div class="cart-footer">
          <div class="payment-methods">
            <button class="payment-method active" data-method="cash">
              <i class="bi bi-cash"></i> Cash
            </button>
            <button class="payment-method" data-method="card">
              <i class="bi bi-credit-card"></i> Card
            </button>
          </div>
          <button class="btn-complete" id="completeSaleBtn">
            <i class="bi bi-check-circle"></i> Complete Sale
            <kbd>Ctrl+Enter</kbd>
          </button>
        </div>
      </div>
    </div>

    <!-- Customer Modal -->
    <div class="modal" id="customerModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Select Customer</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <input type="text" class="modal-search" placeholder="Search customer...">
          <div class="customer-list">
            <div class="customer-item selected">
              <div class="customer-avatar">W</div>
              <div class="customer-info">
                <strong>Walk-in Customer</strong>
                <span>Default</span>
              </div>
            </div>
            <div class="customer-item">
              <div class="customer-avatar">AK</div>
              <div class="customer-info">
                <strong>Ahmed Khan</strong>
                <span>0321-1234567</span>
              </div>
            </div>
            <div class="customer-item">
              <div class="customer-avatar">FS</div>
              <div class="customer-info">
                <strong>Fatima Shah</strong>
                <span>0333-7654321</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initPOS(): () => void {
  const cart: Array<{ id: number; name: string; price: number; qty: number; stock: number }> = [];
  let discount = 0;
  const taxRate = 0.05;
  let customer = { name: 'Walk-in Customer', phone: '' };
  let paymentMethod = 'cash';

  medicineStore.loadMedicines().then(() => {
    renderProducts();
  }).catch(() => {});

  function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      tablets: 'bi-tablet',
      capsules: 'bi-capsule',
      syrups: 'bi-droplet-half',
      injections: 'bi-syringe',
      ointments: 'bi-tube',
    };
    return icons[category] || 'bi-pill';
  }

  function renderProducts(filter = 'all', search = ''): void {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    let medicines = medicineStore.getAll();

    if (filter !== 'all') {
      medicines = medicines.filter((m) => m.category === filter);
    }
    if (search) {
      const s = search.toLowerCase();
      medicines = medicines.filter(
        (m) =>
          m.name.toLowerCase().includes(s) ||
          m.generic.toLowerCase().includes(s) ||
          m.batch.toLowerCase().includes(s) ||
          m.barcode.includes(s),
      );
    }

    grid.innerHTML = medicines
      .map(
        (m) => `
      <div class="product-card" data-id="${m.id}">
        <div class="product-icon">
          <i class="bi ${getCategoryIcon(m.category)}"></i>
        </div>
        <div class="product-name">${m.name}</div>
        <div class="product-stock">Stock: ${m.stock}</div>
        <div class="product-price">₨ ${m.salePrice}</div>
      </div>
    `,
      )
      .join('');

    grid.querySelectorAll('.product-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = parseInt(card.getAttribute('data-id') || '0');
        addToCart(id);
      });
    });
  }

  function addToCart(medicineId: number): void {
    const medicine = medicineStore.getById(medicineId);
    if (!medicine || medicine.stock <= 0) return;

    const existing = cart.find((item) => item.id === medicineId);
    if (existing) {
      if (existing.qty < medicine.stock) {
        existing.qty++;
      }
    } else {
      cart.push({
        id: medicine.id,
        name: medicine.name,
        price: medicine.salePrice,
        qty: 1,
        stock: medicine.stock,
      });
    }
    updateCart();
  }

  function removeFromCart(productId: number): void {
    const index = cart.findIndex((item) => item.id === productId);
    if (index > -1) {
      cart.splice(index, 1);
    }
    updateCart();
  }

  function updateQty(productId: number, change: number): void {
    const item = cart.find((i) => i.id === productId);
    if (!item) return;

    const medicine = medicineStore.getById(productId);
    if (!medicine) return;

    item.qty += change;
    if (item.qty <= 0) {
      removeFromCart(productId);
    } else if (item.qty > medicine.stock) {
      item.qty = medicine.stock;
    }
    updateCart();
  }

  function updateCart(): void {
    const cartEl = document.getElementById('cartItems');
    if (!cartEl) return;

    if (cart.length === 0) {
      cartEl.innerHTML = `
        <div class="empty-cart">
          <i class="bi bi-cart-x"></i>
          <p>Cart is empty</p>
          <span>Scan or search medicine to add</span>
        </div>
      `;
    } else {
      cartEl.innerHTML = cart
        .map(
          (item) => `
        <div class="cart-item">
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">₨ ${item.price} × ${item.qty}</div>
          </div>
          <div class="cart-item-qty">
            <button class="qty-btn" data-action="minus" data-id="${item.id}">-</button>
            <span class="qty-value">${item.qty}</span>
            <button class="qty-btn" data-action="plus" data-id="${item.id}">+</button>
          </div>
          <div class="cart-item-total">
            <strong>₨ ${(item.price * item.qty).toFixed(2)}</strong>
            <button class="cart-item-remove" data-id="${item.id}">
              <i class="bi bi-x"></i>
            </button>
          </div>
        </div>
      `,
        )
        .join('');

      cartEl.querySelectorAll('.qty-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.getAttribute('data-id') || '0');
          const action = btn.getAttribute('data-action');
          updateQty(id, action === 'plus' ? 1 : -1);
        });
      });

      cartEl.querySelectorAll('.cart-item-remove').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.getAttribute('data-id') || '0');
          removeFromCart(id);
        });
      });
    }

    updateTotals();
    updateCartBadge();
  }

  function updateTotals(): void {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const taxable = subtotal - discount;
    const tax = taxable * taxRate;
    const total = taxable + tax;

    const subtotalEl = document.getElementById('subtotal');
    const discountEl = document.getElementById('discount');
    const taxEl = document.getElementById('tax');
    const totalEl = document.getElementById('total');

    if (subtotalEl) subtotalEl.textContent = `₨ ${subtotal.toFixed(2)}`;
    if (discountEl) discountEl.textContent = `- ₨ ${discount.toFixed(2)}`;
    if (taxEl) taxEl.textContent = `₨ ${tax.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `₨ ${total.toFixed(2)}`;

    const receivedInput = document.getElementById('receivedAmount') as HTMLInputElement;
    const changeInput = document.getElementById('changeAmount') as HTMLInputElement;
    const received = parseFloat(receivedInput?.value || '0');
    const change = received - total;
    if (changeInput) {
      changeInput.value = change >= 0 ? `₨ ${change.toFixed(2)}` : '₨ 0.00';
    }
  }

  async function clearCart(): Promise<void> {
    if (cart.length === 0) return;
    const confirmed = await confirmAction('Clear Cart?', 'All items will be removed.');
    if (!confirmed) return;
    cart.length = 0;
    discount = 0;
    updateCart();
    const receivedInput = document.getElementById('receivedAmount') as HTMLInputElement;
    if (receivedInput) receivedInput.value = '';
  }

  function holdSale(): void {
    if (cart.length === 0) return;
    const heldSales = JSON.parse(localStorage.getItem('heldSales') || '[]');
    heldSales.push({
      cart: [...cart],
      customer,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('heldSales', JSON.stringify(heldSales));
    cart.length = 0;
    updateCart();
    successToast('Sale held successfully!');
  }

  async function completeSale(): Promise<void> {
    if (cart.length === 0) {
      errorToast('Cart is empty!');
      return;
    }

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const taxable = subtotal - discount;
    const tax = taxable * taxRate;
    const total = taxable + tax;
    const receivedInput = document.getElementById('receivedAmount') as HTMLInputElement;
    const received = parseFloat(receivedInput?.value || '0');

    if (received < total) {
      errorToast('Insufficient amount received!');
      return;
    }

    const user = authService.getUser();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`;

    try {
      await salesService.create({
        items: cart.map((item) => ({
          medicine_id: item.id,
          batch_number: '',
          quantity: item.qty,
          unit_price: item.price,
          discount: 0,
        })),
        discount,
        tax_rate: taxRate,
        payment_method: paymentMethod as 'cash' | 'card' | 'credit',
        amount_paid: received,
      });
    } catch (error) {
      console.warn('API sale creation failed, processing locally:', error);
      errorToast('Sale API failed but processed locally.');
    }

    const invoiceData: InvoiceData = {
      invoiceNumber,
      date: new Date().toISOString(),
      customer: {
        name: customer.name,
        phone: customer.phone,
      },
      cashier: user?.full_name || 'Cashier',
      items: cart.map((item) => ({
        name: item.name,
        batch: '',
        quantity: item.qty,
        unitPrice: item.price,
        discount: 0,
        total: item.price * item.qty,
      })),
      subtotal,
      discount,
      tax,
      total,
      paymentMethod,
      amountPaid: received,
      change: received - total,
    };

    printInvoice(invoiceData);

    successToast('Sale completed successfully! Invoice: ' + invoiceNumber);

    cart.length = 0;
    discount = 0;
    customer = { name: 'Walk-in Customer', phone: '' };
    const customerNameEl = document.getElementById('customerName');
    if (customerNameEl) customerNameEl.textContent = 'Walk-in Customer';
    if (receivedInput) receivedInput.value = '';
    updateCart();
  }

  // Subscribe to store changes to refresh products
  const unsubscribe = medicineStore.subscribe(() => {
    const activeFilter =
      document.querySelector('.filter-btn.active')?.getAttribute('data-category') || 'all';
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    renderProducts(activeFilter, searchInput?.value || '');
  });

  // Initialize products from store
  renderProducts();

  // Search
  const searchInput = document.getElementById('searchInput') as HTMLInputElement;
  searchInput?.addEventListener('input', () => {
    const activeFilter =
      document.querySelector('.filter-btn.active')?.getAttribute('data-category') || 'all';
    renderProducts(activeFilter, searchInput.value);
  });

  // Category filters
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderProducts(btn.getAttribute('data-category') || 'all', searchInput?.value || '');
    });
  });

  // Payment method
  document.querySelectorAll('.payment-method').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.payment-method').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      paymentMethod = btn.getAttribute('data-method') || 'cash';
    });
  });

  // Received amount
  const receivedInput = document.getElementById('receivedAmount') as HTMLInputElement;
  receivedInput?.addEventListener('input', () => updateTotals());

  // Buttons
  document.getElementById('clearCartBtn')?.addEventListener('click', () => clearCart());
  document.getElementById('holdSaleBtn')?.addEventListener('click', () => holdSale());
  document.getElementById('completeSaleBtn')?.addEventListener('click', () => completeSale());

  // Customer modal
  document.getElementById('selectCustomerBtn')?.addEventListener('click', () => {
    document.getElementById('customerModal')?.classList.add('active');
  });

  document.querySelector('.modal-close')?.addEventListener('click', () => {
    document.getElementById('customerModal')?.classList.remove('active');
  });

  // Mobile cart toggle
  const posCart = document.getElementById('posCart');
  const cartToggleBtn = document.getElementById('posCartToggle');
  const cartCloseBtn = document.getElementById('posCartClose');

  cartToggleBtn?.addEventListener('click', () => {
    posCart?.classList.add('show');
  });
  cartCloseBtn?.addEventListener('click', () => {
    posCart?.classList.remove('show');
  });

  // Auto-open cart on desktop, close on mobile when adding item
  function updateCartBadge() {
    const badge = document.getElementById('cartCountBadge');
    if (badge) badge.textContent = String(cart.length);
  }

  document.querySelectorAll('.customer-item').forEach((item) => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.customer-item').forEach((i) => i.classList.remove('selected'));
      item.classList.add('selected');
      const name = item.querySelector('strong')?.textContent || 'Walk-in Customer';
      const customerNameEl = document.getElementById('customerName');
      if (customerNameEl) customerNameEl.textContent = name;
      customer = {
        name,
        phone: item.querySelector('span')?.textContent || '',
      };
      document.getElementById('customerModal')?.classList.remove('active');
    });
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'F2') {
      e.preventDefault();
      searchInput?.focus();
    }
    if (e.key === 'F8') {
      e.preventDefault();
      holdSale();
    }
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      completeSale();
    }
    if (e.key === 'Escape') {
      document.getElementById('customerModal')?.classList.remove('active');
    }
  });

  // Return cleanup function
  return () => {
    unsubscribe();
  };
}

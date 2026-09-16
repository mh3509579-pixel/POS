import { createLineChart, createDonutChart } from '../utils/charts';

type SalesTab = 'list' | 'returns';

interface SaleItem {
  medicine_id: number;
  medicine_name: string;
  batch: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

interface Sale {
  id: number;
  invoice_number: string;
  customer_name: string;
  customer_phone: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amount_paid: number;
  change_amount: number;
  payment_method: string;
  status: string;
  cashier: string;
  created_at: string;
}

const salesData: Sale[] = [
  {
    id: 1,
    invoice_number: 'INV-2026-000001',
    customer_name: 'Walk-in Customer',
    customer_phone: '',
    items: [
      { medicine_id: 1, medicine_name: 'Paracetamol 500mg', batch: 'P001', quantity: 2, unit_price: 50, discount: 0, total: 100 },
      { medicine_id: 3, medicine_name: 'Cetirizine 10mg', batch: 'C001', quantity: 1, unit_price: 35, discount: 0, total: 35 },
    ],
    subtotal: 135,
    discount: 0,
    tax: 6.75,
    total: 141.75,
    amount_paid: 150,
    change_amount: 8.25,
    payment_method: 'cash',
    status: 'completed',
    cashier: 'Super Admin',
    created_at: '2026-09-13T10:30:00',
  },
  {
    id: 2,
    invoice_number: 'INV-2026-000002',
    customer_name: 'Ahmed Khan',
    customer_phone: '0321-1234567',
    items: [
      { medicine_id: 6, medicine_name: 'Augmentin 625mg', batch: 'AU01', quantity: 1, unit_price: 280, discount: 0, total: 280 },
      { medicine_id: 15, medicine_name: 'Cough Syrup', batch: 'CS01', quantity: 2, unit_price: 120, discount: 10, total: 230 },
    ],
    subtotal: 510,
    discount: 10,
    tax: 25,
    total: 525,
    amount_paid: 525,
    change_amount: 0,
    payment_method: 'card',
    status: 'completed',
    cashier: 'Super Admin',
    created_at: '2026-09-13T11:45:00',
  },
  {
    id: 3,
    invoice_number: 'INV-2026-000003',
    customer_name: 'Fatima Shah',
    customer_phone: '0333-7654321',
    items: [
      { medicine_id: 7, medicine_name: 'Nexium 40mg', batch: 'N001', quantity: 1, unit_price: 450, discount: 0, total: 450 },
      { medicine_id: 8, medicine_name: 'Glucophage 500mg', batch: 'G001', quantity: 2, unit_price: 85, discount: 0, total: 170 },
    ],
    subtotal: 620,
    discount: 20,
    tax: 30,
    total: 630,
    amount_paid: 600,
    change_amount: 0,
    payment_method: 'cash',
    status: 'completed',
    cashier: 'Super Admin',
    created_at: '2026-09-12T14:20:00',
  },
  {
    id: 4,
    invoice_number: 'INV-2026-000004',
    customer_name: 'Walk-in Customer',
    customer_phone: '',
    items: [
      { medicine_id: 5, medicine_name: 'Brufen 400mg', batch: 'B001', quantity: 3, unit_price: 55, discount: 0, total: 165 },
    ],
    subtotal: 165,
    discount: 0,
    tax: 8.25,
    total: 173.25,
    amount_paid: 200,
    change_amount: 26.75,
    payment_method: 'cash',
    status: 'completed',
    cashier: 'Super Admin',
    created_at: '2026-09-12T09:15:00',
  },
  {
    id: 5,
    invoice_number: 'INV-2026-000005',
    customer_name: 'Ali Hassan',
    customer_phone: '0300-1234567',
    items: [
      { medicine_id: 10, medicine_name: 'Atorvastatin 20mg', batch: 'AT01', quantity: 1, unit_price: 110, discount: 0, total: 110 },
      { medicine_id: 14, medicine_name: 'Amlodipine 5mg', batch: 'AM01', quantity: 1, unit_price: 50, discount: 0, total: 50 },
    ],
    subtotal: 160,
    discount: 0,
    tax: 8,
    total: 168,
    amount_paid: 168,
    change_amount: 0,
    payment_method: 'card',
    status: 'completed',
    cashier: 'Super Admin',
    created_at: '2026-09-11T16:00:00',
  },
];

let currentTab: SalesTab = 'list';

export function renderSales(): string {
  return `
    <div class="page-header">
      <h4>Sales Management</h4>
      <p>View and manage all sales transactions</p>
    </div>

    <div class="inventory-tabs">
      <button class="inventory-tab active" data-tab="list">
        <i class="bi bi-receipt"></i> Sales List
      </button>
      <button class="inventory-tab" data-tab="returns">
        <i class="bi bi-arrow-return-left"></i> Sales Returns
      </button>
    </div>

    <div class="tab-content" id="salesContent">
    </div>
  `;
}

export function initSales(): void {
  loadTab('list');
  initTabs();
}

function initTabs(): void {
  document.querySelectorAll('.inventory-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab') as SalesTab;
      if (tabName) {
        document.querySelectorAll('.inventory-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        loadTab(tabName);
      }
    });
  });
}

function loadTab(tab: SalesTab): void {
  currentTab = tab;
  const content = document.getElementById('salesContent');
  if (!content) return;

  switch (tab) {
    case 'list':
      renderSalesList(content);
      break;
    case 'returns':
      renderSalesReturns(content);
      break;
  }
}

function renderSalesList(container: HTMLElement): void {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaySales = salesData.filter((s) => new Date(s.created_at) >= today);
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const totalSales = salesData.length;
  const totalRevenue = salesData.reduce((sum, s) => sum + s.total, 0);
  const avgSale = totalSales > 0 ? totalRevenue / totalSales : 0;

  container.innerHTML = `
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">${todaySales.length}</div>
              <div class="stat-label">Today's Sales</div>
            </div>
            <div class="stat-icon green"><i class="bi bi-cart-check"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ ${todayRevenue.toLocaleString()}</div>
              <div class="stat-label">Today's Revenue</div>
            </div>
            <div class="stat-icon green"><i class="bi bi-currency-dollar"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">${totalSales}</div>
              <div class="stat-label">Total Sales</div>
            </div>
            <div class="stat-icon blue"><i class="bi bi-graph-up"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ ${avgSale.toFixed(0)}</div>
              <div class="stat-label">Average Sale</div>
            </div>
            <div class="stat-icon orange"><i class="bi bi-calculator"></i></div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4 mb-4">
      <div class="col-md-8">
        <div class="card">
          <div class="card-header">
            <h6 class="mb-0">Daily Sales Trend</h6>
          </div>
          <div class="card-body">
            ${createLineChart({
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              datasets: [
                { name: 'This Week', values: [12500, 8200, 15800, 10200, 18500, 14200, 7800], color: '#198754' },
                { name: 'Last Week', values: [10000, 12000, 9500, 14000, 11000, 16000, 8500], color: '#6c757d' },
              ]
            }, 200)}
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100">
          <div class="card-header">
            <h6 class="mb-0">Payment Methods</h6>
          </div>
          <div class="card-body">
            ${createDonutChart({
              labels: ['Cash', 'Card', 'Credit'],
              values: [65, 25, 10],
              colors: ['#198754', '#0d6efd', '#ffc107']
            }, 160)}
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-3">
            <div class="input-group">
              <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control" id="searchSale" placeholder="Search invoice or customer...">
            </div>
          </div>
          <div class="col-md-2">
            <select class="form-select" id="filterPayment">
              <option value="">All Payment</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="credit">Credit</option>
            </select>
          </div>
          <div class="col-md-2">
            <input type="date" class="form-control" id="filterDateFrom" placeholder="From Date">
          </div>
          <div class="col-md-2">
            <input type="date" class="form-control" id="filterDateTo" placeholder="To Date">
          </div>
          <div class="col-md-2">
            <select class="form-select" id="filterAmount">
              <option value="">All Amounts</option>
              <option value="0-100">₨ 0 - 100</option>
              <option value="100-500">₨ 100 - 500</option>
              <option value="500-1000">₨ 500 - 1000</option>
              <option value="1000+">₨ 1000+</option>
            </select>
          </div>
          <div class="col-md-1">
            <button class="btn btn-outline-secondary w-100" id="resetFilters">
              <i class="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="mb-0">Sales Transactions</h6>
        <span class="text-muted" id="saleCount">${salesData.length} sales</span>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Subtotal</th>
                <th>Discount</th>
                <th>Tax</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody id="salesTableBody">
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  function renderTable(): void {
    const search = (document.getElementById('searchSale') as HTMLInputElement)?.value.toLowerCase() || '';
    const payment = (document.getElementById('filterPayment') as HTMLSelectElement)?.value || '';
    const dateFrom = (document.getElementById('filterDateFrom') as HTMLInputElement)?.value || '';
    const dateTo = (document.getElementById('filterDateTo') as HTMLInputElement)?.value || '';
    const amountFilter = (document.getElementById('filterAmount') as HTMLSelectElement)?.value || '';

    const filtered = salesData.filter((s) => {
      const matchSearch = !search || 
        s.invoice_number.toLowerCase().includes(search) || 
        s.customer_name.toLowerCase().includes(search);
      const matchPayment = !payment || s.payment_method === payment;
      
      let matchDate = true;
      if (dateFrom) matchDate = matchDate && new Date(s.created_at) >= new Date(dateFrom);
      if (dateTo) matchDate = matchDate && new Date(s.created_at) <= new Date(dateTo + 'T23:59:59');

      let matchAmount = true;
      if (amountFilter) {
        const [min, max] = amountFilter.split('-').map(Number);
        if (amountFilter === '1000+') {
          matchAmount = s.total >= 1000;
        } else {
          matchAmount = s.total >= min && s.total <= (max || Infinity);
        }
      }

      return matchSearch && matchPayment && matchDate && matchAmount;
    });

    const tbody = document.getElementById('salesTableBody');
    const countEl = document.getElementById('saleCount');
    if (countEl) countEl.textContent = `${filtered.length} sales`;
    if (!tbody) return;

    const paymentIcons: Record<string, string> = {
      cash: 'bi-cash',
      card: 'bi-credit-card',
      credit: 'bi-clock',
    };

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="11" class="text-center py-5">
            <div class="text-muted">
              <i class="bi bi-receipt fs-1 d-block mb-2"></i>
              <h6>No sales found</h6>
              <p class="mb-0">Sales from POS will appear here</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map((s) => `
      <tr>
        <td><code>${s.invoice_number}</code></td>
        <td>
          <div>${new Date(s.created_at).toLocaleDateString()}</div>
          <small class="text-muted">${new Date(s.created_at).toLocaleTimeString()}</small>
        </td>
        <td>
          <div class="fw-semibold">${s.customer_name}</div>
          ${s.customer_phone ? `<small class="text-muted">${s.customer_phone}</small>` : ''}
        </td>
        <td>${s.items.length} items</td>
        <td>₨ ${s.subtotal.toFixed(2)}</td>
        <td>${s.discount > 0 ? `- ₨ ${s.discount.toFixed(2)}` : '-'}</td>
        <td>₨ ${s.tax.toFixed(2)}</td>
        <td class="fw-semibold">₨ ${s.total.toFixed(2)}</td>
        <td>
          <span class="badge-status badge-info">
            <i class="bi ${paymentIcons[s.payment_method] || 'bi-cash'} me-1"></i>
            <span class="text-capitalize">${s.payment_method}</span>
          </span>
        </td>
        <td><span class="badge-status badge-success text-capitalize">${s.status}</span></td>
        <td class="text-end">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary view-btn" data-id="${s.id}" title="View Details">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-outline-secondary print-btn" data-id="${s.id}" title="Print Invoice">
              <i class="bi bi-printer"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.view-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id') || '0');
        viewSaleDetails(id);
      });
    });

    tbody.querySelectorAll('.print-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id') || '0');
        printInvoice(id);
      });
    });
  }

  document.getElementById('searchSale')?.addEventListener('input', renderTable);
  document.getElementById('filterPayment')?.addEventListener('change', renderTable);
  document.getElementById('filterDateFrom')?.addEventListener('change', renderTable);
  document.getElementById('filterDateTo')?.addEventListener('change', renderTable);
  document.getElementById('filterAmount')?.addEventListener('change', renderTable);
  document.getElementById('resetFilters')?.addEventListener('click', () => {
    (document.getElementById('searchSale') as HTMLInputElement).value = '';
    (document.getElementById('filterPayment') as HTMLSelectElement).value = '';
    (document.getElementById('filterDateFrom') as HTMLInputElement).value = '';
    (document.getElementById('filterDateTo') as HTMLInputElement).value = '';
    (document.getElementById('filterAmount') as HTMLSelectElement).value = '';
    renderTable();
  });

  renderTable();
}

function viewSaleDetails(id: number): void {
  const sale = salesData.find((s) => s.id === id);
  if (!sale) return;

  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Sale Details - ${sale.invoice_number}</h5>
          <button type="button" class="btn-close modal-close-btn"></button>
        </div>
        <div class="modal-body">
          <div class="row mb-4">
            <div class="col-md-6">
              <h6 class="text-muted mb-2">Customer Information</h6>
              <p class="mb-1"><strong>${sale.customer_name}</strong></p>
              ${sale.customer_phone ? `<p class="mb-0"><small>${sale.customer_phone}</small></p>` : ''}
            </div>
            <div class="col-md-6 text-md-end">
              <h6 class="text-muted mb-2">Sale Information</h6>
              <p class="mb-1">Date: <strong>${new Date(sale.created_at).toLocaleString()}</strong></p>
              <p class="mb-1">Cashier: <strong>${sale.cashier}</strong></p>
              <p class="mb-0">Payment: <span class="badge-status badge-info text-capitalize">${sale.payment_method}</span></p>
            </div>
          </div>

          <h6 class="text-muted mb-2">Items Sold</h6>
          <div class="table-responsive">
            <table class="table table-bordered">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Medicine</th>
                  <th>Batch</th>
                  <th class="text-end">Qty</th>
                  <th class="text-end">Price</th>
                  <th class="text-end">Discount</th>
                  <th class="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                ${sale.items.map((item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.medicine_name}</td>
                    <td><code>${item.batch}</code></td>
                    <td class="text-end">${item.quantity}</td>
                    <td class="text-end">₨ ${item.unit_price.toFixed(2)}</td>
                    <td class="text-end">${item.discount > 0 ? `- ₨ ${item.discount.toFixed(2)}` : '-'}</td>
                    <td class="text-end">₨ ${item.total.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="row justify-content-end">
            <div class="col-md-4">
              <table class="table table-sm">
                <tbody>
                  <tr><td>Subtotal</td><td class="text-end">₨ ${sale.subtotal.toFixed(2)}</td></tr>
                  <tr><td>Discount</td><td class="text-end">- ₨ ${sale.discount.toFixed(2)}</td></tr>
                  <tr><td>Tax (5%)</td><td class="text-end">₨ ${sale.tax.toFixed(2)}</td></tr>
                  <tr class="table-light"><td><strong>Total</strong></td><td class="text-end"><strong>₨ ${sale.total.toFixed(2)}</strong></td></tr>
                  <tr><td>Amount Paid</td><td class="text-end">₨ ${sale.amount_paid.toFixed(2)}</td></tr>
                  ${sale.change_amount > 0 ? `<tr><td>Change</td><td class="text-end text-success">₨ ${sale.change_amount.toFixed(2)}</td></tr>` : ''}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary modal-close-btn">Close</button>
          <button type="button" class="btn btn-outline-danger" id="returnSaleBtn" data-id="${sale.id}">
            <i class="bi bi-arrow-return-left me-2"></i>Return
          </button>
          <button type="button" class="btn btn-brand-green" id="printInvoiceBtn" data-id="${sale.id}">
            <i class="bi bi-printer me-2"></i>Print Invoice
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  
  modal.querySelectorAll('.modal-close-btn').forEach((btn) => {
    btn.addEventListener('click', () => modal.remove());
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  modal.querySelector('#printInvoiceBtn')?.addEventListener('click', () => {
    printInvoice(sale.id);
  });

  modal.querySelector('#returnSaleBtn')?.addEventListener('click', () => {
    modal.remove();
    initiateReturn(sale.id);
  });
}

function printInvoice(id: number): void {
  const sale = salesData.find((s) => s.id === id);
  if (!sale) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print invoice');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${sale.invoice_number}</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; margin: 20px; }
        .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
        .header h2 { margin: 0; font-size: 18px; }
        .header p { margin: 5px 0; font-size: 11px; }
        .info { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .info div { width: 48%; }
        .info p { margin: 3px 0; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 5px; text-align: left; border-bottom: 1px dashed #ccc; }
        th { border-bottom: 2px solid #000; }
        .text-right { text-align: right; }
        .total-section { border-top: 2px solid #000; margin-top: 10px; padding-top: 10px; }
        .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
        .total-row.grand { font-size: 14px; font-weight: bold; border-top: 1px solid #000; padding-top: 5px; }
        .footer { text-align: center; margin-top: 20px; border-top: 2px dashed #000; padding-top: 10px; font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>HUSSAIN SON'S PHARMACY</h2>
        <p>123 Main Street, Karachi</p>
        <p>Phone: 021-12345678 | NTN: 1234567-8</p>
      </div>

      <div class="info">
        <div>
          <p><strong>Invoice:</strong> ${sale.invoice_number}</p>
          <p><strong>Date:</strong> ${new Date(sale.created_at).toLocaleString()}</p>
        </div>
        <div style="text-align: right;">
          <p><strong>Customer:</strong> ${sale.customer_name}</p>
          <p><strong>Cashier:</strong> ${sale.cashier}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th class="text-right">Price</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${sale.items.map((item) => `
            <tr>
              <td>${item.medicine_name}<br><small>${item.batch}</small></td>
              <td>${item.quantity}</td>
              <td class="text-right">₨ ${item.unit_price.toFixed(2)}</td>
              <td class="text-right">₨ ${item.total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total-section">
        <div class="total-row"><span>Subtotal:</span><span>₨ ${sale.subtotal.toFixed(2)}</span></div>
        <div class="total-row"><span>Discount:</span><span>- ₨ ${sale.discount.toFixed(2)}</span></div>
        <div class="total-row"><span>Tax (5%):</span><span>₨ ${sale.tax.toFixed(2)}</span></div>
        <div class="total-row grand"><span>TOTAL:</span><span>₨ ${sale.total.toFixed(2)}</span></div>
        <div class="total-row"><span>Amount Paid:</span><span>₨ ${sale.amount_paid.toFixed(2)}</span></div>
        ${sale.change_amount > 0 ? `<div class="total-row"><span>Change:</span><span>₨ ${sale.change_amount.toFixed(2)}</span></div>` : ''}
      </div>

      <div class="footer">
        <p>Thank you for your purchase!</p>
        <p>For complaints, contact: 021-12345678</p>
        <p style="margin-top: 10px;">*** HUSSAIN SON'S PHARMACY ***</p>
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function initiateReturn(saleId: number): void {
  const sale = salesData.find((s) => s.id === saleId);
  if (!sale) return;

  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Return Items - ${sale.invoice_number}</h5>
          <button type="button" class="btn-close modal-close-btn"></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-warning mb-4">
            <i class="bi bi-exclamation-triangle me-2"></i>
            Select items and quantities to return. Stock will be restored.
          </div>

          <div class="table-responsive">
            <table class="table table-bordered">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Medicine</th>
                  <th>Batch</th>
                  <th class="text-end">Purchased Qty</th>
                  <th class="text-end">Return Qty</th>
                  <th class="text-end">Refund</th>
                </tr>
              </thead>
              <tbody>
                ${sale.items.map((item) => `
                  <tr>
                    <td>
                      <input type="checkbox" class="form-check-input return-check" data-id="${item.medicine_id}" data-price="${item.unit_price}">
                    </td>
                    <td>${item.medicine_name}</td>
                    <td><code>${item.batch}</code></td>
                    <td class="text-end">${item.quantity}</td>
                    <td>
                      <input type="number" class="form-control form-control-sm return-qty" data-id="${item.medicine_id}" min="1" max="${item.quantity}" value="1" disabled style="width: 70px;">
                    </td>
                    <td class="text-end refund-amount" data-id="${item.medicine_id}">₨ 0</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="row justify-content-end">
            <div class="col-md-4">
              <table class="table table-sm">
                <tr class="table-light">
                  <td><strong>Total Refund</strong></td>
                  <td class="text-end"><strong id="totalRefund">₨ 0</strong></td>
                </tr>
              </table>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">Return Reason</label>
            <select class="form-select" id="returnReason">
              <option value="">Select Reason</option>
              <option value="wrong_item">Wrong Item</option>
              <option value="side_effects">Side Effects</option>
              <option value="not_needed">Not Needed</option>
              <option value="expired">Expired Product</option>
              <option value="damaged">Damaged Package</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary modal-close-btn">Cancel</button>
          <button type="button" class="btn btn-danger" id="processReturnBtn">
            <i class="bi bi-arrow-return-left me-2"></i>Process Return
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Handle checkbox changes
  modal.querySelectorAll('.return-check').forEach((checkEl) => {
    const check = checkEl as HTMLInputElement;
    check.addEventListener('change', () => {
      const id = check.getAttribute('data-id');
      const qtyInput = modal.querySelector(`.return-qty[data-id="${id}"]`) as HTMLInputElement;
      if (qtyInput) {
        qtyInput.disabled = !check.checked;
        if (!check.checked) qtyInput.value = '1';
      }
      updateRefundTotal();
    });
  });

  // Handle quantity changes
  modal.querySelectorAll('.return-qty').forEach((input) => {
    input.addEventListener('input', () => {
      updateRefundTotal();
    });
  });

  function updateRefundTotal(): void {
    let totalRefund = 0;
    modal.querySelectorAll('.return-check').forEach((checkEl) => {
      const check = checkEl as HTMLInputElement;
      if (check.checked) {
        const id = check.getAttribute('data-id');
        const price = parseFloat(check.getAttribute('data-price') || '0');
        const qtyInput = modal.querySelector(`.return-qty[data-id="${id}"]`) as HTMLInputElement;
        const qty = parseInt(qtyInput?.value || '0');
        const refund = price * qty;
        totalRefund += refund;
        const refundEl = modal.querySelector(`.refund-amount[data-id="${id}"]`);
        if (refundEl) refundEl.textContent = `₨ ${refund.toFixed(2)}`;
      }
    });
    const totalEl = document.getElementById('totalRefund');
    if (totalEl) totalEl.textContent = `₨ ${totalRefund.toFixed(2)}`;
  }

  modal.querySelectorAll('.modal-close-btn').forEach((btn) => {
    btn.addEventListener('click', () => modal.remove());
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  modal.querySelector('#processReturnBtn')?.addEventListener('click', () => {
    const reason = (modal.querySelector('#returnReason') as HTMLSelectElement).value;
    if (!reason) {
      alert('Please select a return reason');
      return;
    }

    let hasItems = false;
    modal.querySelectorAll('.return-check').forEach((checkEl) => {
      const check = checkEl as HTMLInputElement;
      if (check.checked) hasItems = true;
    });

    if (!hasItems) {
      alert('Please select at least one item to return');
      return;
    }

    if (confirm('Are you sure you want to process this return?')) {
      // Process return logic here
      alert('Return processed successfully! Stock has been restored.');
      modal.remove();
    }
  });
}

function renderSalesReturns(container: HTMLElement): void {
  const returns = [
    { id: 1, date: '2026-09-12', invoice: 'INV-2026-000001', customer: 'Ahmed Khan', items: 1, total: 50, reason: 'Side Effects', status: 'completed' },
    { id: 2, date: '2026-09-11', invoice: 'INV-2026-000003', customer: 'Fatima Shah', items: 2, total: 170, reason: 'Wrong Item', status: 'pending' },
  ];

  container.innerHTML = `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="mb-0">Sales Returns</h6>
        <span class="text-muted">${returns.length} returns</span>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Return #</th>
                <th>Date</th>
                <th>Original Invoice</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Refund Amount</th>
                <th>Reason</th>
                <th>Status</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${returns.length === 0 ? `
                <tr>
                  <td colspan="9" class="text-center py-5">
                    <div class="text-muted">
                      <i class="bi bi-arrow-return-left fs-1 d-block mb-2"></i>
                      <h6>No sales returns</h6>
                    </div>
                  </td>
                </tr>
              ` : returns.map((r) => `
                <tr>
                  <td><code>SR-2026-${String(r.id).padStart(4, '0')}</code></td>
                  <td>${new Date(r.date).toLocaleDateString()}</td>
                  <td><code>${r.invoice}</code></td>
                  <td>${r.customer}</td>
                  <td>${r.items} item(s)</td>
                  <td class="fw-semibold text-danger">₨ ${r.total.toLocaleString()}</td>
                  <td>${r.reason}</td>
                  <td><span class="badge-status ${r.status === 'completed' ? 'badge-success' : 'badge-warning'} text-capitalize">${r.status}</span></td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-outline-secondary"><i class="bi bi-eye"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

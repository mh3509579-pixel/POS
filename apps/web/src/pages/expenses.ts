import { createBarChart, createDonutChart } from '../utils/charts';
import { expenseService, Expense as ApiExpense, ExpenseCategory as ApiExpenseCategory } from '../services/expense.service';

interface Expense {
  id: number;
  date: string;
  category: string;
  subcategory: string;
  description: string;
  amount: number;
  payment_method: string;
  reference: string;
  vendor: string;
  status: string;
  approved_by: string;
  created_at: string;
}

interface ExpenseCategory {
  id: number;
  name: string;
  description: string;
  budget: number;
  spent: number;
  icon: string;
  color: string;
}

type ExpensesTab = 'list' | 'categories' | 'reports';

let expenseCategories: ExpenseCategory[] = [];
let expenses: Expense[] = [];
let currentTab: ExpensesTab = 'list';

export function renderExpenses(): string {
  return `
    <div class="page-header">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h4>Expense Management</h4>
          <p>Track and manage all business expenses</p>
        </div>
        <button class="btn btn-brand-green" id="addExpenseBtn">
          <i class="bi bi-plus-circle me-2"></i>Add Expense
        </button>
      </div>
    </div>

    <div class="inventory-tabs">
      <button class="inventory-tab active" data-tab="list">
        <i class="bi bi-receipt"></i> Expenses List
      </button>
      <button class="inventory-tab" data-tab="categories">
        <i class="bi bi-folder"></i> Categories
      </button>
      <button class="inventory-tab" data-tab="reports">
        <i class="bi bi-graph-up"></i> Reports
      </button>
    </div>

    <div class="tab-content" id="expensesContent">
    </div>
  `;
}

export function initExpenses(): void {
  loadExpenses();
  initTabs();
  document.getElementById('addExpenseBtn')?.addEventListener('click', () => {
    showExpenseModal();
  });
}

async function loadExpenses(): Promise<void> {
  try {
    const { data } = await expenseService.getAll(500);
    expenses = data.map((e) => ({
      id: e.id,
      date: e.expense_date,
      category: e.category_name || 'Miscellaneous',
      subcategory: '',
      description: e.description,
      amount: e.amount,
      payment_method: e.payment_method === 'bank_transfer' ? 'bank' : e.payment_method,
      reference: e.expense_number || '',
      vendor: '',
      status: 'approved',
      approved_by: 'Admin',
      created_at: e.created_at,
    }));
  } catch {
    expenses = [];
  }
  loadTab(currentTab);
}

function initTabs(): void {
  document.querySelectorAll('.inventory-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab') as ExpensesTab;
      if (tabName) {
        document.querySelectorAll('.inventory-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        loadTab(tabName);
      }
    });
  });
}

function loadTab(tab: ExpensesTab): void {
  currentTab = tab;
  const content = document.getElementById('expensesContent');
  if (!content) return;

  switch (tab) {
    case 'list':
      renderExpensesList(content);
      break;
    case 'categories':
      renderCategories(content);
      break;
    case 'reports':
      renderReports(content);
      break;
  }
}

function renderExpensesList(container: HTMLElement): void {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const todayExpenses = expenses.filter((e) => new Date(e.date) >= today);
  const monthExpenses = expenses.filter((e) => new Date(e.date) >= thisMonth);
  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  container.innerHTML = `
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ ${todayTotal.toLocaleString()}</div>
              <div class="stat-label">Today's Expenses</div>
            </div>
            <div class="stat-icon red"><i class="bi bi-cash-stack"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ ${monthTotal.toLocaleString()}</div>
              <div class="stat-label">This Month</div>
            </div>
            <div class="stat-icon orange"><i class="bi bi-calendar-month"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">${expenses.length}</div>
              <div class="stat-label">Total Transactions</div>
            </div>
            <div class="stat-icon blue"><i class="bi bi-receipt"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">${expenseCategories.length}</div>
              <div class="stat-label">Categories</div>
            </div>
            <div class="stat-icon green"><i class="bi bi-folder"></i></div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4 mb-4">
      <div class="col-md-8">
        <div class="card">
          <div class="card-header">
            <h6 class="mb-0">Monthly Expenses Trend</h6>
          </div>
          <div class="card-body">
            ${createBarChart({
              labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
              values: [180000, 220000, 195000, 210000, 254700, 254700],
              colors: ['#dc3545', '#dc3545', '#dc3545', '#dc3545', '#dc3545', '#ffc107']
            }, 200)}
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100">
          <div class="card-header">
            <h6 class="mb-0">Category Distribution</h6>
          </div>
          <div class="card-body">
            ${createDonutChart({
              labels: expenseCategories.slice(0, 5).map((c) => c.name),
              values: expenseCategories.slice(0, 5).map((c) => c.spent),
              colors: ['#0d6efd', '#198754', '#ffc107', '#0dcaf0', '#dc3545']
            }, 140)}
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-2">
            <select class="form-select" id="filterCategory">
              <option value="">All Categories</option>
              ${expenseCategories.map((c) => `<option value="${c.name}">${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="col-md-2">
            <select class="form-select" id="filterPayment">
              <option value="">All Payment</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>
          <div class="col-md-2">
            <input type="date" class="form-control" id="filterDateFrom" placeholder="From Date">
          </div>
          <div class="col-md-2">
            <input type="date" class="form-control" id="filterDateTo" placeholder="To Date">
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
        <h6 class="mb-0">Expense Transactions</h6>
        <span class="text-muted" id="expenseCount">${expenses.length} expenses</span>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Vendor</th>
                <th>Reference</th>
                <th>Payment</th>
                <th class="text-end">Amount</th>
                <th>Status</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody id="expensesTableBody">
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  renderTable();
  initListEvents();
}

function initListEvents(): void {
  document.getElementById('searchExpense')?.addEventListener('input', renderTable);
  document.getElementById('filterCategory')?.addEventListener('change', renderTable);
  document.getElementById('filterPayment')?.addEventListener('change', renderTable);
  document.getElementById('filterDateFrom')?.addEventListener('change', renderTable);
  document.getElementById('filterDateTo')?.addEventListener('change', renderTable);
  document.getElementById('resetFilters')?.addEventListener('click', () => {
    (document.getElementById('searchExpense') as HTMLInputElement).value = '';
    (document.getElementById('filterCategory') as HTMLSelectElement).value = '';
    (document.getElementById('filterPayment') as HTMLSelectElement).value = '';
    (document.getElementById('filterDateFrom') as HTMLInputElement).value = '';
    (document.getElementById('filterDateTo') as HTMLInputElement).value = '';
    renderTable();
  });
}

function renderTable(): void {
  const search = (document.getElementById('searchExpense') as HTMLInputElement)?.value.toLowerCase() || '';
  const category = (document.getElementById('filterCategory') as HTMLSelectElement)?.value || '';
  const payment = (document.getElementById('filterPayment') as HTMLSelectElement)?.value || '';
  const dateFrom = (document.getElementById('filterDateFrom') as HTMLInputElement)?.value || '';
  const dateTo = (document.getElementById('filterDateTo') as HTMLInputElement)?.value || '';

  const filtered = expenses.filter((e) => {
    const matchSearch = !search || 
      e.description.toLowerCase().includes(search) || 
      e.vendor.toLowerCase().includes(search);
    const matchCategory = !category || e.category === category;
    const matchPayment = !payment || e.payment_method === payment;
    
    let matchDate = true;
    if (dateFrom) matchDate = matchDate && new Date(e.date) >= new Date(dateFrom);
    if (dateTo) matchDate = matchDate && new Date(e.date) <= new Date(dateTo);

    return matchSearch && matchCategory && matchPayment && matchDate;
  });

  const tbody = document.getElementById('expensesTableBody');
  const countEl = document.getElementById('expenseCount');
  if (countEl) countEl.textContent = `${filtered.length} expenses`;
  if (!tbody) return;

  const paymentIcons: Record<string, string> = {
    cash: 'bi-cash',
    card: 'bi-credit-card',
    bank: 'bi-bank',
  };

  const categoryColors: Record<string, string> = {
    Rent: 'primary',
    Utilities: 'warning',
    Salaries: 'success',
    Marketing: 'info',
    Maintenance: 'secondary',
    'Office Supplies': 'dark',
    Transport: 'danger',
    Insurance: 'primary',
    Tax: 'warning',
    Miscellaneous: 'secondary',
  };

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center py-5">
          <div class="text-muted">
            <i class="bi bi-receipt fs-1 d-block mb-2"></i>
            <h6>No expenses found</h6>
            <p class="mb-0">Add your first expense to get started</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((e) => `
    <tr>
      <td>${new Date(e.date).toLocaleDateString()}</td>
      <td><span class="badge bg-${categoryColors[e.category] || 'secondary'}">${e.category}</span></td>
      <td>
        <div class="fw-semibold">${e.description}</div>
        <small class="text-muted">${e.subcategory}</small>
      </td>
      <td>${e.vendor}</td>
      <td><code>${e.reference}</code></td>
      <td>
        <span class="badge-status badge-info">
          <i class="bi ${paymentIcons[e.payment_method] || 'bi-cash'} me-1"></i>
          <span class="text-capitalize">${e.payment_method}</span>
        </span>
      </td>
      <td class="text-end fw-semibold text-danger">₨ ${e.amount.toLocaleString()}</td>
      <td><span class="badge-status badge-success text-capitalize">${e.status}</span></td>
      <td class="text-end">
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-secondary view-btn" data-id="${e.id}" title="View">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn btn-outline-secondary edit-btn" data-id="${e.id}" title="Edit">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-outline-danger delete-btn" data-id="${e.id}" title="Delete">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.view-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id') || '0');
      viewExpense(id);
    });
  });

  tbody.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id') || '0');
      showExpenseModal(id);
    });
  });

  tbody.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id') || '0');
      deleteExpense(id);
    });
  });
}

function showExpenseModal(editId?: number): void {
  const isEdit = editId !== undefined;
  const expense = isEdit ? expenses.find((e) => e.id === editId) : null;

  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">${isEdit ? 'Edit Expense' : 'Add New Expense'}</h5>
          <button type="button" class="btn-close modal-close-btn"></button>
        </div>
        <div class="modal-body">
          <form id="expenseForm">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Date *</label>
                <input type="date" class="form-control" id="expDate" required value="${expense?.date || new Date().toISOString().split('T')[0]}">
              </div>
              <div class="col-md-6">
                <label class="form-label">Category *</label>
                <select class="form-select" id="expCategory" required>
                  ${expenseCategories.map((c) => `<option value="${c.name}" ${expense?.category === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Subcategory</label>
                <input type="text" class="form-control" id="expSubcategory" value="${expense?.subcategory || ''}" placeholder="e.g., Electricity, Stationery">
              </div>
              <div class="col-md-6">
                <label class="form-label">Amount (₨) *</label>
                <input type="number" class="form-control" id="expAmount" required min="1" value="${expense?.amount || ''}">
              </div>
              <div class="col-md-12">
                <label class="form-label">Description *</label>
                <textarea class="form-control" id="expDescription" rows="2" required>${expense?.description || ''}</textarea>
              </div>
              <div class="col-md-6">
                <label class="form-label">Vendor/Payee</label>
                <input type="text" class="form-control" id="expVendor" value="${expense?.vendor || ''}" placeholder="Who was paid?">
              </div>
              <div class="col-md-6">
                <label class="form-label">Payment Method *</label>
                <select class="form-select" id="expPayment" required>
                  <option value="cash" ${expense?.payment_method === 'cash' ? 'selected' : ''}>Cash</option>
                  <option value="card" ${expense?.payment_method === 'card' ? 'selected' : ''}>Card</option>
                  <option value="bank" ${expense?.payment_method === 'bank' ? 'selected' : ''}>Bank Transfer</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Reference/Receipt #</label>
                <input type="text" class="form-control" id="expReference" value="${expense?.reference || ''}" placeholder="Receipt or transaction ID">
              </div>
              <div class="col-md-6">
                <label class="form-label">Status</label>
                <select class="form-select" id="expStatus">
                  <option value="approved" ${expense?.status === 'approved' ? 'selected' : ''}>Approved</option>
                  <option value="pending" ${expense?.status === 'pending' ? 'selected' : ''}>Pending</option>
                  <option value="rejected" ${expense?.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                </select>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary modal-close-btn">Cancel</button>
          <button type="button" class="btn btn-brand-green" id="saveExpenseBtn">
            <i class="bi bi-check-lg me-2"></i>${isEdit ? 'Update' : 'Add'} Expense
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

  modal.querySelector('#saveExpenseBtn')?.addEventListener('click', async () => {
    const date = (modal.querySelector('#expDate') as HTMLInputElement).value;
    const category = (modal.querySelector('#expCategory') as HTMLSelectElement).value;
    const amount = parseInt((modal.querySelector('#expAmount') as HTMLInputElement).value) || 0;
    const description = (modal.querySelector('#expDescription') as HTMLTextAreaElement).value;
    const payment_method = (modal.querySelector('#expPayment') as HTMLSelectElement).value;
    const reference = (modal.querySelector('#expReference') as HTMLInputElement).value;

    if (!date || !category || !amount || !description) {
      alert('Please fill required fields');
      return;
    }

    try {
      if (isEdit && expense) {
        await expenseService.update(expense.id, {
          amount,
          description,
          expense_date: date,
          payment_method: payment_method as any,
          receipt_number: reference || undefined,
        });
      } else {
        await expenseService.create({
          category_id: 1,
          amount,
          description,
          expense_date: date,
          payment_method: payment_method as any,
          receipt_number: reference || undefined,
        });
      }
      modal.remove();
      await loadExpenses();
    } catch {
      alert('Failed to save expense. Please try again.');
    }
  });
}

function viewExpense(id: number): void {
  const expense = expenses.find((e) => e.id === id);
  if (!expense) return;

  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Expense Details</h5>
          <button type="button" class="btn-close modal-close-btn"></button>
        </div>
        <div class="modal-body">
          <div class="row mb-3">
            <div class="col-6">
              <label class="text-muted small">Date</label>
              <p class="fw-semibold mb-0">${new Date(expense.date).toLocaleDateString()}</p>
            </div>
            <div class="col-6">
              <label class="text-muted small">Reference</label>
              <p class="fw-semibold mb-0"><code>${expense.reference}</code></p>
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-6">
              <label class="text-muted small">Category</label>
              <p class="mb-0"><span class="badge bg-primary">${expense.category}</span></p>
            </div>
            <div class="col-6">
              <label class="text-muted small">Subcategory</label>
              <p class="fw-semibold mb-0">${expense.subcategory || '-'}</p>
            </div>
          </div>
          <div class="mb-3">
            <label class="text-muted small">Description</label>
            <p class="fw-semibold mb-0">${expense.description}</p>
          </div>
          <div class="row mb-3">
            <div class="col-6">
              <label class="text-muted small">Vendor</label>
              <p class="mb-0">${expense.vendor || '-'}</p>
            </div>
            <div class="col-6">
              <label class="text-muted small">Payment Method</label>
              <p class="mb-0 text-capitalize">${expense.payment_method}</p>
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-6">
              <label class="text-muted small">Amount</label>
              <p class="fs-4 fw-bold text-danger mb-0">₨ ${expense.amount.toLocaleString()}</p>
            </div>
            <div class="col-6">
              <label class="text-muted small">Status</label>
              <p class="mb-0"><span class="badge-status badge-success text-capitalize">${expense.status}</span></p>
            </div>
          </div>
          ${expense.approved_by ? `
            <div class="alert alert-success mb-0">
              <i class="bi bi-check-circle me-2"></i>Approved by ${expense.approved_by}
            </div>
          ` : ''}
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary modal-close-btn">Close</button>
          <button type="button" class="btn btn-outline-danger" id="deleteFromViewBtn">
            <i class="bi bi-trash me-2"></i>Delete
          </button>
          <button type="button" class="btn btn-brand-green" id="editFromViewBtn">
            <i class="bi bi-pencil me-2"></i>Edit
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

  modal.querySelector('#editFromViewBtn')?.addEventListener('click', () => {
    modal.remove();
    showExpenseModal(expense.id);
  });

  modal.querySelector('#deleteFromViewBtn')?.addEventListener('click', () => {
    modal.remove();
    deleteExpense(expense.id);
  });
}

async function deleteExpense(id: number): Promise<void> {
  const expense = expenses.find((e) => e.id === id);
  if (!expense) return;

  if (confirm(`Are you sure you want to delete this expense?\n\n"${expense.description}"\nAmount: ₨ ${expense.amount.toLocaleString()}`)) {
    try {
      await expenseService.delete(id);
      await loadExpenses();
    } catch {
      alert('Failed to delete expense. Please try again.');
    }
  }
}

function renderCategories(container: HTMLElement): void {
  const totalBudget = expenseCategories.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = expenseCategories.reduce((sum, c) => sum + c.spent, 0);

  container.innerHTML = `
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">${expenseCategories.length}</div>
              <div class="stat-label">Total Categories</div>
            </div>
            <div class="stat-icon blue"><i class="bi bi-folder"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ ${totalBudget.toLocaleString()}</div>
              <div class="stat-label">Total Budget</div>
            </div>
            <div class="stat-icon green"><i class="bi bi-wallet2"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ ${totalSpent.toLocaleString()}</div>
              <div class="stat-label">Total Spent</div>
            </div>
            <div class="stat-icon red"><i class="bi bi-cash-stack"></i></div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3">
      ${expenseCategories.map((c) => {
        const percentage = Math.round((c.spent / c.budget) * 100);
        const isOver = c.spent > c.budget;
        const barColor = isOver ? 'danger' : percentage > 80 ? 'warning' : 'success';
        
        return `
          <div class="col-md-6 col-xl-4">
            <div class="card h-100">
              <div class="card-body">
                <div class="d-flex align-items-center mb-3">
                  <div class="avatar-circle bg-${c.color} me-3" style="width: 48px; height: 48px;">
                    <i class="bi ${c.icon}"></i>
                  </div>
                  <div class="flex-grow-1">
                    <h6 class="mb-0">${c.name}</h6>
                    <small class="text-muted">${c.description}</small>
                  </div>
                </div>
                
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted">Spent:</span>
                  <span class="${isOver ? 'text-danger' : ''} fw-semibold">₨ ${c.spent.toLocaleString()}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted">Budget:</span>
                  <span>₨ ${c.budget.toLocaleString()}</span>
                </div>
                <div class="d-flex justify-content-between mb-3">
                  <span class="text-muted">Remaining:</span>
                  <span class="${c.budget - c.spent < 0 ? 'text-danger' : 'text-success'}">
                    ₨ ${(c.budget - c.spent).toLocaleString()}
                  </span>
                </div>

                <div class="progress mb-2" style="height: 8px;">
                  <div class="progress-bar bg-${barColor}" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
                <div class="d-flex justify-content-between">
                  <small class="text-muted">${percentage}% used</small>
                  ${isOver ? '<small class="text-danger">Over budget!</small>' : ''}
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderReports(container: HTMLElement): void {
  const today = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const thisYear = new Date(today.getFullYear(), 0, 1);

  const thisMonthExpenses = expenses.filter((e) => new Date(e.date) >= thisMonth);
  const lastMonthExpenses = expenses.filter((e) => new Date(e.date) >= lastMonth && new Date(e.date) < thisMonth);
  const yearExpenses = expenses.filter((e) => new Date(e.date) >= thisYear);

  const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const yearTotal = yearExpenses.reduce((sum, e) => sum + e.amount, 0);
  const avgMonthly = yearTotal / (today.getMonth() + 1);

  // Category breakdown
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  container.innerHTML = `
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ ${thisMonthTotal.toLocaleString()}</div>
              <div class="stat-label">This Month</div>
            </div>
            <div class="stat-icon green"><i class="bi bi-calendar-check"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ ${lastMonthTotal.toLocaleString()}</div>
              <div class="stat-label">Last Month</div>
            </div>
            <div class="stat-icon blue"><i class="bi bi-calendar"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ ${yearTotal.toLocaleString()}</div>
              <div class="stat-label">This Year</div>
            </div>
            <div class="stat-icon orange"><i class="bi bi-graph-up"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ ${avgMonthly.toFixed(0)}</div>
              <div class="stat-label">Avg Monthly</div>
            </div>
            <div class="stat-icon red"><i class="bi bi-calculator"></i></div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-md-8">
        <div class="card h-100">
          <div class="card-header">
            <h6 class="mb-0">Category-wise Breakdown</h6>
          </div>
          <div class="card-body">
            ${sortedCategories.map(([cat, amount]) => {
              const percentage = ((amount / yearTotal) * 100).toFixed(1);
              const catInfo = expenseCategories.find((c) => c.name === cat);
              return `
                <div class="d-flex align-items-center mb-3">
                  <div class="avatar-circle bg-${catInfo?.color || 'secondary'} me-3" style="width: 36px; height: 36px; font-size: 14px;">
                    <i class="bi ${catInfo?.icon || 'bi-folder'}"></i>
                  </div>
                  <div class="flex-grow-1">
                    <div class="d-flex justify-content-between">
                      <span class="fw-semibold">${cat}</span>
                      <span>₨ ${amount.toLocaleString()} (${percentage}%)</span>
                    </div>
                    <div class="progress mt-1" style="height: 6px;">
                      <div class="progress-bar" style="width: ${percentage}%"></div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100">
          <div class="card-header">
            <h6 class="mb-0">Monthly Comparison</h6>
          </div>
          <div class="card-body">
            <div class="text-center mb-4">
              <div class="d-inline-block position-relative">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#e9ecef" stroke-width="10"/>
                  <circle cx="60" cy="60" r="50" fill="none" stroke="${thisMonthTotal > lastMonthTotal ? '#dc3545' : '#198754'}" 
                    stroke-width="10" stroke-dasharray="${(thisMonthTotal / (thisMonthTotal + lastMonthTotal)) * 314} 314"
                    stroke-dashoffset="78.5" stroke-linecap="round"/>
                </svg>
                <div class="position-absolute top-50 start-50 translate-middle text-center">
                  <div class="fs-4 fw-bold">${thisMonthTotal > lastMonthTotal ? '+' : '-'}${Math.abs(Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100))}%</div>
                </div>
              </div>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span>This Month:</span>
              <span class="fw-semibold">₨ ${thisMonthTotal.toLocaleString()}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span>Last Month:</span>
              <span class="fw-semibold">₨ ${lastMonthTotal.toLocaleString()}</span>
            </div>
            <div class="d-flex justify-content-between">
              <span>Difference:</span>
              <span class="${thisMonthTotal > lastMonthTotal ? 'text-danger' : 'text-success'} fw-semibold">
                ₨ ${Math.abs(thisMonthTotal - lastMonthTotal).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

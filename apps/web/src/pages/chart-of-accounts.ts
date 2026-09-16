import { accountingService } from '../services/accounting.service';

export function renderChartOfAccounts(): string {
  return `
    <div class="page-header d-flex justify-content-between align-items-center">
      <div>
        <h4>Chart of Accounts</h4>
        <p>Manage your accounts and financial structure</p>
      </div>
      <button class="btn btn-brand-green" id="addAccountBtn">
        <i class="bi bi-plus-lg me-2"></i>Add Account
      </button>
    </div>

    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <div class="input-group">
              <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control" id="searchAccount" placeholder="Search accounts...">
            </div>
          </div>
          <div class="col-md-3">
            <select class="form-select" id="filterType">
              <option value="">All Types</option>
              <option value="asset">Assets</option>
              <option value="liability">Liabilities</option>
              <option value="equity">Equity</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="mb-0">Accounts List</h6>
        <span class="text-muted" id="accountCount">0 accounts</span>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Code</th>
                <th>Account Name</th>
                <th>Type</th>
                <th>Parent</th>
                <th>Description</th>
                <th>Status</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody id="accountsTableBody">
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add/Edit Account Modal -->
    <div class="modal" id="accountModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="accountModalTitle">Add New Account</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="accountForm">
              <input type="hidden" id="accountId">
              <div class="mb-3">
                <label class="form-label">Account Code <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="accountCode" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Account Name <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="accountName" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Account Type <span class="text-danger">*</span></label>
                <select class="form-select" id="accountType" required>
                  <option value="">Select Type</option>
                  <option value="asset">Asset</option>
                  <option value="liability">Liability</option>
                  <option value="equity">Equity</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Parent Account</label>
                <select class="form-select" id="parentAccount">
                  <option value="">None (Top Level)</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Description</label>
                <textarea class="form-control" id="accountDescription" rows="2"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-brand-green" id="saveAccountBtn">Save Account</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initChartOfAccounts(): void {
  let accounts: any[] = [];
  let filteredAccounts: any[] = [];

  const typeColors: Record<string, string> = {
    asset: 'badge-success',
    liability: 'badge-danger',
    equity: 'badge-info',
    income: 'badge-primary',
    expense: 'badge-warning',
  };

  async function loadAccounts(): Promise<void> {
    try {
      const response = await accountingService.getAllAccounts();
      accounts = response.data;
      filteredAccounts = [...accounts];
      renderTable();
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  }

  function renderTable(): void {
    const tbody = document.getElementById('accountsTableBody');
    const countEl = document.getElementById('accountCount');
    if (!tbody) return;

    if (countEl) {
      countEl.textContent = `${filteredAccounts.length} account${filteredAccounts.length !== 1 ? 's' : ''}`;
    }

    if (filteredAccounts.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-5">
            <div class="text-muted">
              <i class="bi bi-journal-bookmark fs-1 d-block mb-2"></i>
              <h6>No accounts found</h6>
              <p class="mb-0">Add your first account to get started</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filteredAccounts
      .map((account) => {
        const parentAccount = accounts.find((a) => a.id === account.parent_id);
        return `
        <tr>
          <td><code>${account.code}</code></td>
          <td class="fw-semibold">${account.name}</td>
          <td><span class="badge-status ${typeColors[account.type] || ''} text-capitalize">${account.type}</span></td>
          <td>${parentAccount ? parentAccount.name : '-'}</td>
          <td>${account.description || '-'}</td>
          <td>
            <span class="badge-status ${account.is_active ? 'badge-success' : 'badge-danger'}">
              ${account.is_active ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td class="text-end">
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-secondary edit-btn" data-id="${account.id}" title="Edit">
                <i class="bi bi-pencil"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
      })
      .join('');

    attachTableEvents();
  }

  function filterAccounts(): void {
    const search = (document.getElementById('searchAccount') as HTMLInputElement)?.value.toLowerCase() || '';
    const type = (document.getElementById('filterType') as HTMLSelectElement)?.value || '';

    filteredAccounts = accounts.filter((account) => {
      const matchSearch = !search || 
        account.name.toLowerCase().includes(search) || 
        account.code.toLowerCase().includes(search);
      const matchType = !type || account.type === type;
      return matchSearch && matchType;
    });

    renderTable();
  }

  function attachTableEvents(): void {
    document.querySelectorAll('.edit-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id') || '0');
        const account = accounts.find((a) => a.id === id);
        if (account) {
          openModal(account);
        }
      });
    });
  }

  function openModal(account?: any): void {
    const modal = document.getElementById('accountModal');
    const title = document.getElementById('accountModalTitle');
    if (!modal) return;

    // Populate parent account dropdown
    const parentSelect = document.getElementById('parentAccount') as HTMLSelectElement;
    if (parentSelect) {
      parentSelect.innerHTML = '<option value="">None (Top Level)</option>';
      accounts.forEach((a) => {
        if (a.id !== account?.id) {
          parentSelect.innerHTML += `<option value="${a.id}">${a.code} - ${a.name}</option>`;
        }
      });
    }

    if (account) {
      if (title) title.textContent = 'Edit Account';
      (document.getElementById('accountId') as HTMLInputElement).value = account.id;
      (document.getElementById('accountCode') as HTMLInputElement).value = account.code;
      (document.getElementById('accountName') as HTMLInputElement).value = account.name;
      (document.getElementById('accountType') as HTMLSelectElement).value = account.type;
      (document.getElementById('parentAccount') as HTMLSelectElement).value = account.parent_id || '';
      (document.getElementById('accountDescription') as HTMLTextAreaElement).value = account.description || '';
    } else {
      if (title) title.textContent = 'Add New Account';
      (document.getElementById('accountForm') as HTMLFormElement)?.reset();
      (document.getElementById('accountId') as HTMLInputElement).value = '';
    }

    modal.classList.add('show');
  }

  function closeModal(): void {
    const modal = document.getElementById('accountModal');
    if (modal) {
      modal.classList.remove('show');
    }
  }

  async function saveAccount(): Promise<void> {
    const form = document.getElementById('accountForm') as HTMLFormElement;
    if (!form?.checkValidity()) {
      form?.reportValidity();
      return;
    }

    const id = (document.getElementById('accountId') as HTMLInputElement).value;
    const accountData = {
      code: (document.getElementById('accountCode') as HTMLInputElement).value,
      name: (document.getElementById('accountName') as HTMLInputElement).value,
      type: (document.getElementById('accountType') as HTMLSelectElement).value,
      parent_id: (document.getElementById('parentAccount') as HTMLSelectElement).value 
        ? parseInt((document.getElementById('parentAccount') as HTMLSelectElement).value) 
        : null,
      description: (document.getElementById('accountDescription') as HTMLTextAreaElement).value,
    };

    try {
      if (id) {
        await accountingService.updateAccount(parseInt(id), accountData);
      } else {
        await accountingService.createAccount(accountData);
      }
      closeModal();
      await loadAccounts();
    } catch (error) {
      console.error('Failed to save account:', error);
      alert('Failed to save account');
    }
  }

  // Event listeners
  document.getElementById('searchAccount')?.addEventListener('input', filterAccounts);
  document.getElementById('filterType')?.addEventListener('change', filterAccounts);
  document.getElementById('addAccountBtn')?.addEventListener('click', () => openModal());
  document.getElementById('saveAccountBtn')?.addEventListener('click', saveAccount);

  document.querySelector('#accountModal .btn-close')?.addEventListener('click', closeModal);
  document.querySelector('#accountModal [data-bs-dismiss="modal"]')?.addEventListener('click', closeModal);

  document.getElementById('accountModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Initial load
  loadAccounts();
}

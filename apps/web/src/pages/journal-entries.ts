import { accountingService } from '../services/accounting.service';

export function renderJournalEntries(): string {
  return `
    <div class="page-header d-flex justify-content-between align-items-center">
      <div>
        <h4>Journal Entries</h4>
        <p>View and manage all financial transactions</p>
      </div>
      <button class="btn btn-brand-green" id="addEntryBtn">
        <i class="bi bi-plus-lg me-2"></i>New Journal Entry
      </button>
    </div>

    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-3">
            <label class="form-label">From Date</label>
            <input type="date" class="form-control" id="startDate">
          </div>
          <div class="col-md-3">
            <label class="form-label">To Date</label>
            <input type="date" class="form-control" id="endDate">
          </div>
          <div class="col-md-3">
            <label class="form-label">Status</label>
            <select class="form-select" id="filterStatus">
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="posted">Posted</option>
              <option value="voided">Voided</option>
            </select>
          </div>
          <div class="col-md-3 d-flex align-items-end">
            <button class="btn btn-outline-secondary w-100" id="filterBtn">
              <i class="bi bi-funnel me-2"></i>Filter
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="mb-0">Journal Entries</h6>
        <span class="text-muted" id="entryCount">0 entries</span>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Entry #</th>
                <th>Date</th>
                <th>Description</th>
                <th>Reference</th>
                <th>Total Debit</th>
                <th>Total Credit</th>
                <th>Status</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody id="entriesTableBody">
            </tbody>
          </table>
        </div>
      </div>
      <div class="card-footer">
        <nav aria-label="Journal entries pagination">
          <ul class="pagination justify-content-center mb-0" id="pagination">
          </ul>
        </nav>
      </div>
    </div>

    <!-- View Journal Entry Modal -->
    <div class="modal" id="entryModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="entryModalTitle">Journal Entry Details</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" id="entryModalBody">
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-success d-none" id="postEntryBtn">Post Entry</button>
            <button type="button" class="btn btn-danger d-none" id="voidEntryBtn">Void Entry</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Journal Entry Modal -->
    <div class="modal" id="createEntryModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Create Journal Entry</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="entryForm">
              <div class="row g-3 mb-4">
                <div class="col-md-6">
                  <label class="form-label">Entry Date <span class="text-danger">*</span></label>
                  <input type="date" class="form-control" id="entryDate" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Description <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" id="entryDescription" required>
                </div>
              </div>

              <h6>Entry Lines</h6>
              <div class="table-responsive mb-3">
                <table class="table table-bordered">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Debit</th>
                      <th>Credit</th>
                      <th>Description</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody id="entryLinesBody">
                    <tr>
                      <td><select class="form-select form-select-sm account-select" required></select></td>
                      <td><input type="number" class="form-control form-control-sm debit-input" step="0.01" min="0" value="0"></td>
                      <td><input type="number" class="form-control form-select-sm credit-input" step="0.01" min="0" value="0"></td>
                      <td><input type="text" class="form-control form-control-sm" placeholder="Description"></td>
                      <td><button type="button" class="btn btn-sm btn-outline-danger remove-line"><i class="bi bi-trash"></i></button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <button type="button" class="btn btn-sm btn-outline-secondary mb-3" id="addLineBtn">
                <i class="bi bi-plus me-1"></i>Add Line
              </button>

              <div class="row">
                <div class="col-md-6 offset-md-6">
                  <div class="card bg-light">
                    <div class="card-body">
                      <div class="d-flex justify-content-between mb-2">
                        <span>Total Debit:</span>
                        <strong id="totalDebit">₨ 0.00</strong>
                      </div>
                      <div class="d-flex justify-content-between mb-2">
                        <span>Total Credit:</span>
                        <strong id="totalCredit">₨ 0.00</strong>
                      </div>
                      <hr>
                      <div class="d-flex justify-content-between">
                        <span>Difference:</span>
                        <strong id="difference" class="text-danger">₨ 0.00</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-brand-green" id="saveEntryBtn">Save Entry</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initJournalEntries(): void {
  let entries: any[] = [];
  let accounts: any[] = [];
  const itemsPerPage = 10;
  let selectedEntryId: number | null = null;

  const statusColors: Record<string, string> = {
    draft: 'badge-warning',
    posted: 'badge-success',
    voided: 'badge-danger',
  };

  async function loadAccounts(): Promise<void> {
    try {
      const response = await accountingService.getAllAccounts();
      accounts = response.data;
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  }

  async function loadEntries(): Promise<void> {
    try {
      const startDate = (document.getElementById('startDate') as HTMLInputElement)?.value;
      const endDate = (document.getElementById('endDate') as HTMLInputElement)?.value;
      
      const response = await accountingService.getAllJournalEntries({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      entries = response.data;
      renderTable();
    } catch (error) {
      console.error('Failed to load entries:', error);
    }
  }

  function renderTable(): void {
    const tbody = document.getElementById('entriesTableBody');
    const countEl = document.getElementById('entryCount');
    if (!tbody) return;

    if (countEl) {
      countEl.textContent = `${entries.length} entr${entries.length !== 1 ? 'ies' : 'y'}`;
    }

    if (entries.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-5">
            <div class="text-muted">
              <i class="bi bi-journal-text fs-1 d-block mb-2"></i>
              <h6>No journal entries found</h6>
              <p class="mb-0">Create your first journal entry to get started</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = entries
      .map((entry) => {
        const totalDebit = entry.lines?.reduce((sum: number, line: any) => sum + line.debit, 0) || 0;
        const totalCredit = entry.lines?.reduce((sum: number, line: any) => sum + line.credit, 0) || 0;
        return `
        <tr>
          <td><code>${entry.entry_number}</code></td>
          <td>${new Date(entry.entry_date).toLocaleDateString()}</td>
          <td>${entry.description}</td>
          <td>${entry.reference_type ? `${entry.reference_type} #${entry.reference_id}` : '-'}</td>
          <td>₨ ${totalDebit.toFixed(2)}</td>
          <td>₨ ${totalCredit.toFixed(2)}</td>
          <td><span class="badge-status ${statusColors[entry.status] || ''} text-capitalize">${entry.status}</span></td>
          <td class="text-end">
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-secondary view-btn" data-id="${entry.id}" title="View">
                <i class="bi bi-eye"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
      })
      .join('');

    attachTableEvents();
  }

  function attachTableEvents(): void {
    document.querySelectorAll('.view-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id') || '0');
        viewEntry(id);
      });
    });
  }

  async function viewEntry(id: number): Promise<void> {
    try {
      const response = await accountingService.getJournalEntry(id);
      const entry = response.data;
      selectedEntryId = entry.id;

      const modal = document.getElementById('entryModal');
      const title = document.getElementById('entryModalTitle');
      const body = document.getElementById('entryModalBody');
      const postBtn = document.getElementById('postEntryBtn');
      const voidBtn = document.getElementById('voidEntryBtn');

      if (title) title.textContent = `Journal Entry ${entry.entry_number}`;

      if (body) {
        const totalDebit = entry.lines?.reduce((sum: number, line: any) => sum + line.debit, 0) || 0;
        const totalCredit = entry.lines?.reduce((sum: number, line: any) => sum + line.credit, 0) || 0;

        body.innerHTML = `
          <div class="row mb-4">
            <div class="col-md-6">
              <p><strong>Date:</strong> ${new Date(entry.entry_date).toLocaleDateString()}</p>
              <p><strong>Description:</strong> ${entry.description}</p>
              <p><strong>Reference:</strong> ${entry.reference_type ? `${entry.reference_type} #${entry.reference_id}` : 'N/A'}</p>
            </div>
            <div class="col-md-6 text-md-end">
              <p><strong>Status:</strong> <span class="badge-status ${statusColors[entry.status] || ''} text-capitalize">${entry.status}</span></p>
              ${entry.posted_at ? `<p><strong>Posted:</strong> ${new Date(entry.posted_at).toLocaleString()}</p>` : ''}
              ${entry.voided_at ? `<p><strong>Voided:</strong> ${new Date(entry.voided_at).toLocaleString()}</p>` : ''}
              ${entry.void_reason ? `<p><strong>Reason:</strong> ${entry.void_reason}</p>` : ''}
            </div>
          </div>

          <h6>Entry Lines</h6>
          <div class="table-responsive">
            <table class="table table-bordered">
              <thead>
                <tr>
                  <th>Account</th>
                  <th class="text-end">Debit</th>
                  <th class="text-end">Credit</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                ${entry.lines?.map((line: any) => `
                  <tr>
                    <td>${line.account_code} - ${line.account_name || 'N/A'}</td>
                    <td class="text-end">${line.debit > 0 ? `₨ ${line.debit.toFixed(2)}` : '-'}</td>
                    <td class="text-end">${line.credit > 0 ? `₨ ${line.credit.toFixed(2)}` : '-'}</td>
                    <td>${line.description || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr class="table-light">
                  <td><strong>Total</strong></td>
                  <td class="text-end"><strong>₨ ${totalDebit.toFixed(2)}</strong></td>
                  <td class="text-end"><strong>₨ ${totalCredit.toFixed(2)}</strong></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        `;
      }

      // Show/hide action buttons based on status
      if (postBtn) {
        postBtn.classList.toggle('d-none', entry.status !== 'draft');
        postBtn.onclick = () => postEntry(entry.id);
      }
      if (voidBtn) {
        voidBtn.classList.toggle('d-none', entry.status !== 'posted');
        voidBtn.onclick = () => voidEntry(entry.id);
      }

      modal?.classList.add('show');
    } catch (error) {
      console.error('Failed to load entry:', error);
    }
  }

  async function postEntry(id: number): Promise<void> {
    if (!confirm('Are you sure you want to post this journal entry?')) return;
    try {
      await accountingService.postJournalEntry(id);
      closeModal();
      await loadEntries();
    } catch (error) {
      console.error('Failed to post entry:', error);
      alert('Failed to post entry');
    }
  }

  async function voidEntry(id: number): Promise<void> {
    const reason = prompt('Enter reason for voiding:');
    if (!reason) return;
    try {
      await accountingService.voidJournalEntry(id, reason);
      closeModal();
      await loadEntries();
    } catch (error) {
      console.error('Failed to void entry:', error);
      alert('Failed to void entry');
    }
  }

  function closeModal(): void {
    document.getElementById('entryModal')?.classList.remove('show');
  }

  function openCreateModal(): void {
    const modal = document.getElementById('createEntryModal');
    const dateInput = document.getElementById('entryDate') as HTMLInputElement;
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    
    // Populate account dropdowns
    const accountSelects = document.querySelectorAll('.account-select');
    accountSelects.forEach((select) => {
      const selectEl = select as HTMLSelectElement;
      selectEl.innerHTML = '<option value="">Select Account</option>';
      accounts.forEach((account) => {
        selectEl.innerHTML += `<option value="${account.id}">${account.code} - ${account.name}</option>`;
      });
    });

    modal?.classList.add('show');
  }

  function closeCreateModal(): void {
    document.getElementById('createEntryModal')?.classList.remove('show');
    (document.getElementById('entryForm') as HTMLFormElement)?.reset();
    const tbody = document.getElementById('entryLinesBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td><select class="form-select form-select-sm account-select" required></select></td>
          <td><input type="number" class="form-control form-control-sm debit-input" step="0.01" min="0" value="0"></td>
          <td><input type="number" class="form-control form-select-sm credit-input" step="0.01" min="0" value="0"></td>
          <td><input type="text" class="form-control form-control-sm" placeholder="Description"></td>
          <td><button type="button" class="btn btn-sm btn-outline-danger remove-line"><i class="bi bi-trash"></i></button></td>
        </tr>
      `;
    }
  }

  function addLine(): void {
    const tbody = document.getElementById('entryLinesBody');
    if (!tbody) return;

    const newRow = document.createElement('tr');
    newRow.innerHTML = `
      <td><select class="form-select form-select-sm account-select" required></select></td>
      <td><input type="number" class="form-control form-control-sm debit-input" step="0.01" min="0" value="0"></td>
      <td><input type="number" class="form-control form-select-sm credit-input" step="0.01" min="0" value="0"></td>
      <td><input type="text" class="form-control form-control-sm" placeholder="Description"></td>
      <td><button type="button" class="btn btn-sm btn-outline-danger remove-line"><i class="bi bi-trash"></i></button></td>
    `;
    tbody.appendChild(newRow);

    // Populate account dropdown in new row
    const selectEl = newRow.querySelector('.account-select') as HTMLSelectElement;
    if (selectEl) {
      selectEl.innerHTML = '<option value="">Select Account</option>';
      accounts.forEach((account) => {
        selectEl.innerHTML += `<option value="${account.id}">${account.code} - ${account.name}</option>`;
      });
    }

    // Add event listeners
    newRow.querySelector('.remove-line')?.addEventListener('click', () => {
      newRow.remove();
      updateTotals();
    });

    newRow.querySelectorAll('.debit-input, .credit-input').forEach((input) => {
      input.addEventListener('input', updateTotals);
    });
  }

  function updateTotals(): void {
    let totalDebit = 0;
    let totalCredit = 0;

    document.querySelectorAll('.debit-input').forEach((input) => {
      totalDebit += parseFloat((input as HTMLInputElement).value) || 0;
    });

    document.querySelectorAll('.credit-input').forEach((input) => {
      totalCredit += parseFloat((input as HTMLInputElement).value) || 0;
    });

    const difference = totalDebit - totalCredit;

    const debitEl = document.getElementById('totalDebit');
    const creditEl = document.getElementById('totalCredit');
    const diffEl = document.getElementById('difference');

    if (debitEl) debitEl.textContent = `₨ ${totalDebit.toFixed(2)}`;
    if (creditEl) creditEl.textContent = `₨ ${totalCredit.toFixed(2)}`;
    if (diffEl) {
      diffEl.textContent = `₨ ${Math.abs(difference).toFixed(2)}`;
      diffEl.className = difference === 0 ? 'text-success' : 'text-danger';
    }
  }

  async function saveEntry(): Promise<void> {
    const form = document.getElementById('entryForm') as HTMLFormElement;
    if (!form?.checkValidity()) {
      form?.reportValidity();
      return;
    }

    const lines: any[] = [];
    document.querySelectorAll('#entryLinesBody tr').forEach((row) => {
      const accountSelect = row.querySelector('.account-select') as HTMLSelectElement;
      const debitInput = row.querySelector('.debit-input') as HTMLInputElement;
      const creditInput = row.querySelector('.credit-input') as HTMLInputElement;
      const descriptionInput = row.querySelector('input[type="text"]') as HTMLInputElement;

      if (accountSelect?.value) {
        lines.push({
          account_id: parseInt(accountSelect.value),
          debit: parseFloat(debitInput?.value) || 0,
          credit: parseFloat(creditInput?.value) || 0,
          description: descriptionInput?.value || '',
        });
      }
    });

    const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      alert('Total debits must equal total credits');
      return;
    }

    if (lines.length < 2) {
      alert('At least two lines are required');
      return;
    }

    try {
      await accountingService.createJournalEntry({
        entry_date: (document.getElementById('entryDate') as HTMLInputElement).value,
        description: (document.getElementById('entryDescription') as HTMLInputElement).value,
        lines,
      });
      closeCreateModal();
      await loadEntries();
    } catch (error) {
      console.error('Failed to save entry:', error);
      alert('Failed to save entry');
    }
  }

  // Event listeners
  document.getElementById('filterBtn')?.addEventListener('click', loadEntries);
  document.getElementById('addEntryBtn')?.addEventListener('click', openCreateModal);
  document.getElementById('saveEntryBtn')?.addEventListener('click', saveEntry);
  document.getElementById('addLineBtn')?.addEventListener('click', addLine);

  document.querySelector('#entryModal .btn-close')?.addEventListener('click', closeModal);
  document.querySelector('#entryModal [data-bs-dismiss="modal"]')?.addEventListener('click', closeModal);
  document.getElementById('entryModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.querySelector('#createEntryModal .btn-close')?.addEventListener('click', closeCreateModal);
  document.querySelector('#createEntryModal [data-bs-dismiss="modal"]')?.addEventListener('click', closeCreateModal);
  document.getElementById('createEntryModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeCreateModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeCreateModal();
    }
  });

  // Initial load
  loadAccounts().then(() => loadEntries());
}

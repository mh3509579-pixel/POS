import { accountingService } from '../services/accounting.service';

export function renderTrialBalance(): string {
  return `
    <div class="page-header">
      <h4>Trial Balance</h4>
      <p>Verify that debits equal credits across all accounts</p>
    </div>

    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label">From Date</label>
            <input type="date" class="form-control" id="startDate">
          </div>
          <div class="col-md-4">
            <label class="form-label">To Date</label>
            <input type="date" class="form-control" id="endDate">
          </div>
          <div class="col-md-4 d-flex align-items-end">
            <button class="btn btn-brand-green w-100" id="generateBtn">
              <i class="bi bi-calculator me-2"></i>Generate Trial Balance
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="mb-0">Trial Balance</h6>
        <span class="text-muted" id="reportPeriod"></span>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Code</th>
                <th>Account Name</th>
                <th>Type</th>
                <th class="text-end">Debit</th>
                <th class="text-end">Credit</th>
              </tr>
            </thead>
            <tbody id="trialBalanceBody">
            </tbody>
            <tfoot id="trialBalanceFooter">
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <div class="card mt-4">
      <div class="card-header">
        <h6 class="mb-0">Account Balances Summary</h6>
      </div>
      <div class="card-body">
        <div class="row" id="accountSummary">
          <div class="col-md-2">
            <div class="stat-card">
              <div class="stat-icon green">
                <i class="bi bi-cash"></i>
              </div>
              <div class="stat-value" id="totalAssets">₨ 0</div>
              <div class="stat-label">Total Assets</div>
            </div>
          </div>
          <div class="col-md-2">
            <div class="stat-card">
              <div class="stat-icon red">
                <i class="bi bi-credit-card"></i>
              </div>
              <div class="stat-value" id="totalLiabilities">₨ 0</div>
              <div class="stat-label">Total Liabilities</div>
            </div>
          </div>
          <div class="col-md-2">
            <div class="stat-card">
              <div class="stat-icon blue">
                <i class="bi bi-briefcase"></i>
              </div>
              <div class="stat-value" id="totalEquity">₨ 0</div>
              <div class="stat-label">Total Equity</div>
            </div>
          </div>
          <div class="col-md-2">
            <div class="stat-card">
              <div class="stat-icon green">
                <i class="bi bi-graph-up"></i>
              </div>
              <div class="stat-value" id="totalIncome">₨ 0</div>
              <div class="stat-label">Total Income</div>
            </div>
          </div>
          <div class="col-md-2">
            <div class="stat-card">
              <div class="stat-icon orange">
                <i class="bi bi-graph-down"></i>
              </div>
              <div class="stat-value" id="totalExpenses">₨ 0</div>
              <div class="stat-label">Total Expenses</div>
            </div>
          </div>
          <div class="col-md-2">
            <div class="stat-card">
              <div class="stat-icon green">
                <i class="bi bi-balance"></i>
              </div>
              <div class="stat-value" id="netProfit">₨ 0</div>
              <div class="stat-label">Net Profit/Loss</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initTrialBalance(): void {
  let trialBalanceData: any[] = [];

  const typeColors: Record<string, string> = {
    asset: 'badge-success',
    liability: 'badge-danger',
    equity: 'badge-info',
    income: 'badge-primary',
    expense: 'badge-warning',
  };

  async function loadTrialBalance(): Promise<void> {
    try {
      const startDate = (document.getElementById('startDate') as HTMLInputElement)?.value;
      const endDate = (document.getElementById('endDate') as HTMLInputElement)?.value;

      const response = await accountingService.getTrialBalance({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });

      trialBalanceData = response.data;
      renderTable();
      updateSummary();
    } catch (error) {
      console.error('Failed to load trial balance:', error);
    }
  }

  function renderTable(): void {
    const tbody = document.getElementById('trialBalanceBody');
    const tfoot = document.getElementById('trialBalanceFooter');
    const periodEl = document.getElementById('reportPeriod');

    if (!tbody) return;

    const startDate = (document.getElementById('startDate') as HTMLInputElement)?.value;
    const endDate = (document.getElementById('endDate') as HTMLInputElement)?.value;

    if (periodEl) {
      periodEl.textContent = startDate && endDate 
        ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
        : 'All Time';
    }

    if (trialBalanceData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-5">
            <div class="text-muted">
              <i class="bi bi-calculator fs-1 d-block mb-2"></i>
              <h6>No data available</h6>
              <p class="mb-0">Generate a trial balance to see account summaries</p>
            </div>
          </td>
        </tr>
      `;
      if (tfoot) tfoot.innerHTML = '';
      return;
    }

    tbody.innerHTML = trialBalanceData
      .map((row) => `
        <tr>
          <td><code>${row.account_code}</code></td>
          <td>${row.account_name}</td>
          <td><span class="badge-status ${typeColors[row.account_type] || ''} text-capitalize">${row.account_type}</span></td>
          <td class="text-end">${row.total_debit > 0 ? `₨ ${row.total_debit.toFixed(2)}` : '-'}</td>
          <td class="text-end">${row.total_credit > 0 ? `₨ ${row.total_credit.toFixed(2)}` : '-'}</td>
        </tr>
      `)
      .join('');

    // Calculate totals
    const totalDebit = trialBalanceData.reduce((sum, row) => sum + row.total_debit, 0);
    const totalCredit = trialBalanceData.reduce((sum, row) => sum + row.total_credit, 0);

    if (tfoot) {
      tfoot.innerHTML = `
        <tr class="table-light">
          <td colspan="3"><strong>Total</strong></td>
          <td class="text-end"><strong>₨ ${totalDebit.toFixed(2)}</strong></td>
          <td class="text-end"><strong>₨ ${totalCredit.toFixed(2)}</strong></td>
        </tr>
        <tr class="${Math.abs(totalDebit - totalCredit) < 0.01 ? 'table-success' : 'table-danger'}">
          <td colspan="3"><strong>Difference</strong></td>
          <td colspan="2" class="text-center">
            <strong>${Math.abs(totalDebit - totalCredit) < 0.01 ? 'Balanced ✓' : `₨ ${Math.abs(totalDebit - totalCredit).toFixed(2)} Difference`}</strong>
          </td>
        </tr>
      `;
    }
  }

  function updateSummary(): void {
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    let totalIncome = 0;
    let totalExpenses = 0;

    trialBalanceData.forEach((row) => {
      const net = row.total_debit - row.total_credit;
      switch (row.account_type) {
        case 'asset':
          totalAssets += net;
          break;
        case 'liability':
          totalLiabilities -= net;
          break;
        case 'equity':
          totalEquity -= net;
          break;
        case 'income':
          totalIncome -= net;
          break;
        case 'expense':
          totalExpenses += net;
          break;
      }
    });

    const netProfit = totalIncome - totalExpenses;

    const el = (id: string) => document.getElementById(id);
    if (el('totalAssets')) el('totalAssets')!.textContent = `₨ ${totalAssets.toFixed(2)}`;
    if (el('totalLiabilities')) el('totalLiabilities')!.textContent = `₨ ${totalLiabilities.toFixed(2)}`;
    if (el('totalEquity')) el('totalEquity')!.textContent = `₨ ${totalEquity.toFixed(2)}`;
    if (el('totalIncome')) el('totalIncome')!.textContent = `₨ ${totalIncome.toFixed(2)}`;
    if (el('totalExpenses')) el('totalExpenses')!.textContent = `₨ ${totalExpenses.toFixed(2)}`;
    if (el('netProfit')) {
      el('netProfit')!.textContent = `₨ ${netProfit.toFixed(2)}`;
      el('netProfit')!.className = `stat-value ${netProfit >= 0 ? 'text-success' : 'text-danger'}`;
    }
  }

  // Set default dates
  const startDate = document.getElementById('startDate') as HTMLInputElement;
  const endDate = document.getElementById('endDate') as HTMLInputElement;
  if (startDate) {
    const now = new Date();
    startDate.value = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
  }
  if (endDate) {
    endDate.value = new Date().toISOString().split('T')[0];
  }

  // Event listeners
  document.getElementById('generateBtn')?.addEventListener('click', loadTrialBalance);

  // Initial load
  loadTrialBalance();
}

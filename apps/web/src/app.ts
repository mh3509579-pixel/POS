import api from './services/api.service';
import { authService } from './services/auth.service';
import { renderLoginPage } from './pages/login';
import { renderAppShell } from './layouts/app-shell';
import { renderDashboard, initDashboard } from './pages/dashboard';
import { renderPOS, initPOS } from './pages/pos';
import { renderMedicines, initMedicines } from './pages/medicines';
import { renderChartOfAccounts, initChartOfAccounts } from './pages/chart-of-accounts';
import { renderJournalEntries, initJournalEntries } from './pages/journal-entries';
import { renderTrialBalance, initTrialBalance } from './pages/trial-balance';
import { renderInventory, initInventory } from './pages/inventory';
import { renderPurchases, initPurchases } from './pages/purchases';
import { renderSales, initSales } from './pages/sales';
import { renderCustomers, initCustomers } from './pages/customers';
import { renderSuppliers, initSuppliers } from './pages/suppliers';
import { renderExpenses, initExpenses } from './pages/expenses';
import { renderReports, initReports } from './pages/reports';
import { renderUsers, initUsers } from './pages/users';
import { renderAudit, initAudit } from './pages/audit';
import { renderBackup, initBackup } from './pages/backup';
import { renderSettings, initSettings } from './pages/settings';

let currentPage = 'dashboard';
let isLoggedIn = false;
let currentCleanup: (() => void) | null = null;

async function initLogin(): Promise<void> {
  const form = document.getElementById('loginForm') as HTMLFormElement;
  const toggleBtn = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password') as HTMLInputElement;

  toggleBtn?.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    const icon = toggleBtn.querySelector('i');
    if (icon) {
      icon.className = isPassword ? 'bi bi-eye' : 'bi bi-eye-slash';
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = (document.getElementById('username') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;
    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;

    if (!username || !password) {
      alert('Please enter username and password');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Signing In...';

    try {
      await authService.login({ username, password });
      isLoggedIn = true;
      navigateTo('dashboard');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Login failed. Please check your credentials.';
      alert(message);
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Sign In';
    }
  });
}

function navigateTo(page: string): void {
  if (!isLoggedIn) {
    showLogin();
    return;
  }

  currentPage = page;
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = renderAppShell();
  loadPage(page);
  initSidebar();
  setActiveNavItem(page);
}

function setActiveNavItem(page: string): void {
  document.querySelectorAll('.sidebar-nav .nav-item').forEach((item) => {
    item.classList.remove('active');
    if (item.getAttribute('data-page') === page) {
      item.classList.add('active');
      // Scroll active item into view without moving sidebar
      const sidebarNav = document.querySelector('.sidebar-nav');
      if (sidebarNav && item instanceof HTMLElement) {
        const navRect = sidebarNav.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();
        if (itemRect.top < navRect.top || itemRect.bottom > navRect.bottom) {
          item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
  });
}

function showLogin(): void {
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = renderLoginPage();
  initLogin();
}

function loadPage(page: string): void {
  // Cleanup previous page
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }

  const content = document.getElementById('pageContent');
  const breadcrumb = document.getElementById('breadcrumbPage');
  if (!content) return;

  const pageNames: Record<string, string> = {
    dashboard: 'Dashboard',
    pos: 'Point of Sale',
    medicines: 'Medicines',
    inventory: 'Inventory',
    purchases: 'Purchases',
    sales: 'Sales',
    customers: 'Customers',
    suppliers: 'Suppliers',
    expenses: 'Expenses',
    reports: 'Reports',
    users: 'Users',
    audit: 'Audit Log',
    settings: 'Settings',
    'chart-of-accounts': 'Chart of Accounts',
    'journal-entries': 'Journal Entries',
    'trial-balance': 'Trial Balance',
  };

  if (breadcrumb) {
    breadcrumb.textContent = pageNames[page] || page;
  }

  switch (page) {
    case 'dashboard':
      content.innerHTML = renderDashboard();
      initDashboard();
      break;
    case 'pos':
      content.innerHTML = renderPOS();
      currentCleanup = initPOS();
      break;
    case 'medicines':
      content.innerHTML = renderMedicines();
      currentCleanup = initMedicines();
      break;
    case 'inventory':
      content.innerHTML = renderInventory();
      initInventory();
      break;
    case 'purchases':
      content.innerHTML = renderPurchases();
      initPurchases();
      break;
    case 'sales':
      content.innerHTML = renderSales();
      initSales();
      break;
    case 'customers':
      content.innerHTML = renderCustomers();
      initCustomers();
      break;
    case 'suppliers':
      content.innerHTML = renderSuppliers();
      initSuppliers();
      break;
    case 'expenses':
      content.innerHTML = renderExpenses();
      initExpenses();
      break;
    case 'reports':
      content.innerHTML = renderReports();
      initReports();
      break;
    case 'users':
      content.innerHTML = renderUsers();
      initUsers();
      break;
    case 'audit':
      content.innerHTML = renderAudit();
      initAudit();
      break;
    case 'backup':
      content.innerHTML = renderBackup();
      initBackup();
      break;
    case 'settings':
      content.innerHTML = renderSettings();
      initSettings();
      break;
    case 'chart-of-accounts':
      content.innerHTML = renderChartOfAccounts();
      initChartOfAccounts();
      break;
    case 'journal-entries':
      content.innerHTML = renderJournalEntries();
      initJournalEntries();
      break;
    case 'trial-balance':
      content.innerHTML = renderTrialBalance();
      initTrialBalance();
      break;
    default:
      content.innerHTML = `
        <div class="page-header">
          <h4>${pageNames[page] || page}</h4>
          <p>This page is under development. Coming in future phases.</p>
        </div>
        <div class="card">
          <div class="card-body text-center py-5">
            <i class="bi bi-tools fs-1 text-muted d-block mb-3"></i>
            <h5 class="text-muted">Under Construction</h5>
            <p class="text-muted">This module will be implemented in a future phase.</p>
          </div>
        </div>
      `;
      break;
  }
}

function initSidebar(): void {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('toggleSidebar');
  const logoutBtn = document.getElementById('logoutBtn');

  toggleBtn?.addEventListener('click', () => {
    sidebar?.classList.toggle('show');
  });

  logoutBtn?.addEventListener('click', () => {
    authService.logout();
    isLoggedIn = false;
    showLogin();
  });

  document.querySelectorAll('.sidebar-nav .nav-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.getAttribute('data-page');
      if (page) {
        navigateTo(page);
      }
    });
  });
}

export function initApp(): void {
  if (authService.isAuthenticated()) {
    isLoggedIn = true;
    navigateTo('dashboard');
  } else {
    showLogin();
  }
}

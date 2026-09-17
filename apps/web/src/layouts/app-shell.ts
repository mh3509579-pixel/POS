import { authService } from '../services/auth.service';

function hasPermission(page: string, role: string): boolean {
  const rolePermissions: Record<string, string[]> = {
    admin: ['dashboard', 'pos', 'medicines', 'inventory', 'purchases', 'sales', 'customers', 'suppliers', 'expenses', 'chart-of-accounts', 'journal-entries', 'trial-balance', 'reports', 'users', 'audit', 'backup', 'settings'],
    stock_manager: ['dashboard', 'medicines', 'inventory', 'purchases', 'suppliers', 'sales'],
    cashier: ['dashboard', 'pos', 'customers'],
  };
  return rolePermissions[role]?.includes(page) ?? false;
}

export function renderAppShell(): string {
  const user = authService.getUser();
  const role = user?.role_name || 'admin';

  const navItems = [
    { section: 'Main', items: [
      { page: 'dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
      { page: 'pos', icon: 'bi-cart3', label: 'POS' },
    ]},
    { section: 'Inventory', items: [
      { page: 'medicines', icon: 'bi-capsule', label: 'Medicines' },
      { page: 'inventory', icon: 'bi-box-seam', label: 'Inventory' },
    ]},
    { section: 'Transactions', items: [
      { page: 'purchases', icon: 'bi-bag-plus', label: 'Purchases' },
      { page: 'sales', icon: 'bi-receipt', label: 'Sales' },
    ]},
    { section: 'People', items: [
      { page: 'customers', icon: 'bi-people', label: 'Customers' },
      { page: 'suppliers', icon: 'bi-truck', label: 'Suppliers' },
    ]},
    { section: 'Finance', items: [
      { page: 'expenses', icon: 'bi-wallet2', label: 'Expenses' },
      { page: 'chart-of-accounts', icon: 'bi-journal-bookmark', label: 'Chart of Accounts' },
      { page: 'journal-entries', icon: 'bi-journal-text', label: 'Journal Entries' },
      { page: 'trial-balance', icon: 'bi-calculator', label: 'Trial Balance' },
      { page: 'reports', icon: 'bi-bar-chart-line', label: 'Reports' },
    ]},
    { section: 'Administration', items: [
      { page: 'users', icon: 'bi-person-gear', label: 'Users' },
      { page: 'audit', icon: 'bi-journal-text', label: 'Audit Log' },
      { page: 'backup', icon: 'bi-cloud-upload', label: 'Backup' },
      { page: 'settings', icon: 'bi-gear', label: 'Settings' },
    ]},
  ];

  let sidebarNav = '';
  for (const group of navItems) {
    const visibleItems = group.items.filter((item) => hasPermission(item.page, role));
    if (visibleItems.length === 0) continue;
    sidebarNav += `<div class="nav-section">${group.section}</div>`;
    for (const item of visibleItems) {
      const activeClass = item.page === 'dashboard' ? ' active' : '';
      sidebarNav += `
        <a class="nav-item${activeClass}" data-page="${item.page}" href="#${item.page}">
          <i class="bi ${item.icon}"></i>
          <span>${item.label}</span>
        </a>`;
    }
  }

  return `
    <div class="app-shell">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo-wrapper">
            <img src="/POS logo.png" alt="Hussain Son's Pharmacy" class="sidebar-logo" />
          </div>
          <div class="brand-text">
            <h5>Hussain Son's Pharmacy</h5>
            <small>POS & Management System</small>
          </div>
        </div>
        <nav class="sidebar-nav">
          ${sidebarNav}
        </nav>
        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">${user?.full_name?.substring(0, 2).toUpperCase() || 'GU'}</div>
            <div class="user-details">
              <div class="user-name">${user?.full_name || 'Guest User'}</div>
              <div class="user-role">${user?.role_name || 'User'}</div>
            </div>
            <button class="btn btn-link text-white p-0" title="Logout">
              <i class="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </div>
      </aside>

      <main class="main-content">
        <header class="topbar">
          <div class="topbar-left">
            <button class="btn btn-link d-lg-none" id="toggleSidebar">
              <i class="bi bi-list fs-4"></i>
            </button>
            <nav aria-label="breadcrumb">
              <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="#dashboard">Home</a></li>
                <li class="breadcrumb-item active" id="breadcrumbPage">Dashboard</li>
              </ol>
            </nav>
          </div>
          <div class="topbar-right">
            <button class="icon-btn" title="Notifications">
              <i class="bi bi-bell"></i>
              <span class="badge"></span>
            </button>
            <button class="icon-btn" title="Settings">
              <i class="bi bi-gear"></i>
            </button>
            <button class="icon-btn" title="Logout" id="logoutBtn">
              <i class="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </header>
        <div class="page-content" id="pageContent">
        </div>
      </main>
    </div>
  `;
}

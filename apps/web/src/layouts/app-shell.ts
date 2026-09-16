import { authService } from '../services/auth.service';

export function renderAppShell(): string {
  const user = authService.getUser();

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
          <div class="nav-section">Main</div>
          <a class="nav-item active" data-page="dashboard" href="#dashboard">
            <i class="bi bi-speedometer2"></i>
            <span>Dashboard</span>
          </a>
          <a class="nav-item" data-page="pos" href="#pos">
            <i class="bi bi-cart3"></i>
            <span>POS</span>
          </a>

          <div class="nav-section">Inventory</div>
          <a class="nav-item" data-page="medicines" href="#medicines">
            <i class="bi bi-capsule"></i>
            <span>Medicines</span>
          </a>
          <a class="nav-item" data-page="inventory" href="#inventory">
            <i class="bi bi-box-seam"></i>
            <span>Inventory</span>
          </a>

          <div class="nav-section">Transactions</div>
          <a class="nav-item" data-page="purchases" href="#purchases">
            <i class="bi bi-bag-plus"></i>
            <span>Purchases</span>
          </a>
          <a class="nav-item" data-page="sales" href="#sales">
            <i class="bi bi-receipt"></i>
            <span>Sales</span>
          </a>

          <div class="nav-section">People</div>
          <a class="nav-item" data-page="customers" href="#customers">
            <i class="bi bi-people"></i>
            <span>Customers</span>
          </a>
          <a class="nav-item" data-page="suppliers" href="#suppliers">
            <i class="bi bi-truck"></i>
            <span>Suppliers</span>
          </a>

          <div class="nav-section">Finance</div>
          <a class="nav-item" data-page="expenses" href="#expenses">
            <i class="bi bi-wallet2"></i>
            <span>Expenses</span>
          </a>
          <a class="nav-item" data-page="chart-of-accounts" href="#chart-of-accounts">
            <i class="bi bi-journal-bookmark"></i>
            <span>Chart of Accounts</span>
          </a>
          <a class="nav-item" data-page="journal-entries" href="#journal-entries">
            <i class="bi bi-journal-text"></i>
            <span>Journal Entries</span>
          </a>
          <a class="nav-item" data-page="trial-balance" href="#trial-balance">
            <i class="bi bi-calculator"></i>
            <span>Trial Balance</span>
          </a>
          <a class="nav-item" data-page="reports" href="#reports">
            <i class="bi bi-bar-chart-line"></i>
            <span>Reports</span>
          </a>

          <div class="nav-section">Administration</div>
          <a class="nav-item" data-page="users" href="#users">
            <i class="bi bi-person-gear"></i>
            <span>Users</span>
          </a>
          <a class="nav-item" data-page="audit" href="#audit">
            <i class="bi bi-journal-text"></i>
            <span>Audit Log</span>
          </a>
          <a class="nav-item" data-page="backup" href="#backup">
            <i class="bi bi-cloud-upload"></i>
            <span>Backup</span>
          </a>
          <a class="nav-item" data-page="settings" href="#settings">
            <i class="bi bi-gear"></i>
            <span>Settings</span>
          </a>
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
          <!-- Dynamic content loaded here -->
        </div>
      </main>
    </div>
  `;
}

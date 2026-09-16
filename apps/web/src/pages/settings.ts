export function renderSettings(): string {
  return `
    <div class="page-header">
      <h4>System Settings</h4>
      <p>Configure pharmacy system preferences and options</p>
    </div>

    <div class="row g-4">
      <div class="col-md-3">
        <div class="card sticky-top" style="top: 80px;">
          <div class="card-body p-2">
            <nav class="nav flex-column">
              <a class="nav-link active settings-nav" href="#" data-tab="pharmacy">
                <i class="bi bi-shop me-2"></i>Pharmacy Info
              </a>
              <a class="nav-link settings-nav" href="#" data-tab="invoice">
                <i class="bi bi-receipt me-2"></i>Invoice Settings
              </a>
              <a class="nav-link settings-nav" href="#" data-tab="tax">
                <i class="bi bi-percent me-2"></i>Tax & Discount
              </a>
              <a class="nav-link settings-nav" href="#" data-tab="notifications">
                <i class="bi bi-bell me-2"></i>Notifications
              </a>
              <a class="nav-link settings-nav" href="#" data-tab="receipt">
                <i class="bi bi-printer me-2"></i>Receipt Printer
              </a>
              <a class="nav-link settings-nav" href="#" data-tab="security">
                <i class="bi bi-shield-lock me-2"></i>Security
              </a>
              <a class="nav-link settings-nav" href="#" data-tab="system">
                <i class="bi bi-gear me-2"></i>System
              </a>
            </nav>
          </div>
        </div>
      </div>

      <div class="col-md-9">
        <div id="settingsContent">
        </div>
      </div>
    </div>
  `;
}

export function initSettings(): void {
  loadSettingsTab('pharmacy');
  
  document.querySelectorAll('.settings-nav').forEach((nav) => {
    nav.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.settings-nav').forEach((n) => n.classList.remove('active'));
      nav.classList.add('active');
      const tab = nav.getAttribute('data-tab');
      if (tab) loadSettingsTab(tab);
    });
  });
}

function loadSettingsTab(tab: string): void {
  const container = document.getElementById('settingsContent');
  if (!container) return;

  switch (tab) {
    case 'pharmacy':
      renderPharmacySettings(container);
      break;
    case 'invoice':
      renderInvoiceSettings(container);
      break;
    case 'tax':
      renderTaxSettings(container);
      break;
    case 'notifications':
      renderNotificationSettings(container);
      break;
    case 'receipt':
      renderReceiptSettings(container);
      break;
    case 'security':
      renderSecuritySettings(container);
      break;
    case 'system':
      renderSystemSettings(container);
      break;
  }
}

function renderPharmacySettings(container: HTMLElement): void {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">Pharmacy Information</h5>
      </div>
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-8">
            <label class="form-label">Pharmacy Name *</label>
            <input type="text" class="form-control" value="Hussain Son's Pharmacy">
          </div>
          <div class="col-md-4">
            <label class="form-label">Registration #</label>
            <input type="text" class="form-control" value="PHR-2024-12345">
          </div>
          <div class="col-md-6">
            <label class="form-label">Phone Number *</label>
            <input type="tel" class="form-control" value="021-12345678">
          </div>
          <div class="col-md-6">
            <label class="form-label">Mobile Number *</label>
            <input type="tel" class="form-control" value="0321-1234567">
          </div>
          <div class="col-md-6">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" value="info@hussainsons.com">
          </div>
          <div class="col-md-6">
            <label class="form-label">Website</label>
            <input type="url" class="form-control" value="https://hussainsons.com">
          </div>
          <div class="col-md-6">
            <label class="form-label">NTN Number</label>
            <input type="text" class="form-control" value="1234567-8">
          </div>
          <div class="col-md-6">
            <label class="form-label">STRN Number</label>
            <input type="text" class="form-control" value="1712345678901">
          </div>
          <div class="col-md-6">
            <label class="form-label">Pharmacist Name</label>
            <input type="text" class="form-control" value="Dr. Ahmed Khan">
          </div>
          <div class="col-md-6">
            <label class="form-label">Pharmacist License #</label>
            <input type="text" class="form-control" value="PH-2024-98765">
          </div>
          <div class="col-md-12">
            <label class="form-label">Address *</label>
            <textarea class="form-control" rows="2">123 Main Street, Gulshan-e-Iqbal, Karachi, Sindh, Pakistan</textarea>
          </div>
        </div>
        <button class="btn btn-brand-green mt-3" id="savePharmacyInfo">
          <i class="bi bi-check-lg me-2"></i>Save Changes
        </button>
      </div>
    </div>
  `;

  container.querySelector('#savePharmacyInfo')?.addEventListener('click', () => {
    alert('Pharmacy information saved successfully!');
  });
}

function renderInvoiceSettings(container: HTMLElement): void {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">Invoice Settings</h5>
      </div>
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Invoice Prefix</label>
            <input type="text" class="form-control" value="INV-">
          </div>
          <div class="col-md-6">
            <label class="form-label">Starting Number</label>
            <input type="number" class="form-control" value="1">
          </div>
          <div class="col-md-6">
            <label class="form-label">Invoice Template</label>
            <select class="form-select">
              <option value="standard" selected>Standard</option>
              <option value="minimal">Minimal</option>
              <option value="detailed">Detailed</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Paper Size</label>
            <select class="form-select">
              <option value="thermal" selected>Thermal (80mm)</option>
              <option value="a5">A5</option>
              <option value="a4">A4</option>
            </select>
          </div>
          <div class="col-md-12">
            <label class="form-label">Invoice Header Text</label>
            <textarea class="form-control" rows="2">Thank you for choosing Hussain Son's Pharmacy!</textarea>
          </div>
          <div class="col-md-12">
            <label class="form-label">Invoice Footer Text</label>
            <textarea class="form-control" rows="2">For complaints, contact: 021-12345678 | Visit us at hussainsons.com</textarea>
          </div>
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="showLogo" checked>
              <label class="form-check-label" for="showLogo">Show Logo on Invoice</label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="showBarcode" checked>
              <label class="form-check-label" for="showBarcode">Show Barcode</label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="autoPrint">
              <label class="form-check-label" for="autoPrint">Auto Print After Sale</label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="showGST" checked>
              <label class="form-check-label" for="showGST">Show GST on Invoice</label>
            </div>
          </div>
        </div>
        <button class="btn btn-brand-green mt-3" id="saveInvoiceSettings">
          <i class="bi bi-check-lg me-2"></i>Save Changes
        </button>
      </div>
    </div>
  `;

  container.querySelector('#saveInvoiceSettings')?.addEventListener('click', () => {
    alert('Invoice settings saved successfully!');
  });
}

function renderTaxSettings(container: HTMLElement): void {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">Tax & Discount Settings</h5>
      </div>
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">GST Rate (%)</label>
            <input type="number" class="form-control" value="5" step="0.5">
          </div>
          <div class="col-md-6">
            <label class="form-label">Sales Tax Number</label>
            <input type="text" class="form-control" value="1712345678901">
          </div>
          <div class="col-md-6">
            <label class="form-label">Default Discount (%)</label>
            <input type="number" class="form-control" value="0" min="0" max="100">
          </div>
          <div class="col-md-6">
            <label class="form-label">Maximum Discount (%)</label>
            <input type="number" class="form-control" value="20" min="0" max="100">
          </div>
          <div class="col-md-12">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="enableGST" checked>
              <label class="form-check-label" for="enableGST">Enable GST</label>
            </div>
          </div>
          <div class="col-md-12">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="inclusiveTax">
              <label class="form-check-label" for="inclusiveTax">Tax Inclusive Pricing</label>
            </div>
          </div>
        </div>
        <button class="btn btn-brand-green mt-3" id="saveTaxSettings">
          <i class="bi bi-check-lg me-2"></i>Save Changes
        </button>
      </div>
    </div>
  `;

  container.querySelector('#saveTaxSettings')?.addEventListener('click', () => {
    alert('Tax settings saved successfully!');
  });
}

function renderNotificationSettings(container: HTMLElement): void {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">Notification Settings</h5>
      </div>
      <div class="card-body">
        <h6 class="mb-3">Low Stock Alerts</h6>
        <div class="row g-3 mb-4">
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="lowStockEmail" checked>
              <label class="form-check-label" for="lowStockEmail">Email Notification</label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="lowStockSms">
              <label class="form-check-label" for="lowStockSms">SMS Notification</label>
            </div>
          </div>
          <div class="col-md-6">
            <label class="form-label">Low Stock Threshold</label>
            <input type="number" class="form-control" value="50">
          </div>
          <div class="col-md-6">
            <label class="form-label">Alert Email</label>
            <input type="email" class="form-control" value="admin@hussainsons.com">
          </div>
        </div>

        <h6 class="mb-3">Expiry Alerts</h6>
        <div class="row g-3 mb-4">
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="expiryEmail" checked>
              <label class="form-check-label" for="expiryEmail">Email Notification</label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="expirySms">
              <label class="form-check-label" for="expirySms">SMS Notification</label>
            </div>
          </div>
          <div class="col-md-6">
            <label class="form-label">Expiry Alert Days</label>
            <input type="number" class="form-control" value="30">
          </div>
        </div>

        <h6 class="mb-3">Daily Reports</h6>
        <div class="row g-3">
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="dailySalesReport" checked>
              <label class="form-check-label" for="dailySalesReport">Daily Sales Report</label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="dailyBackupReport">
              <label class="form-check-label" for="dailyBackupReport">Daily Backup Status</label>
            </div>
          </div>
        </div>
        <button class="btn btn-brand-green mt-3" id="saveNotificationSettings">
          <i class="bi bi-check-lg me-2"></i>Save Changes
        </button>
      </div>
    </div>
  `;

  container.querySelector('#saveNotificationSettings')?.addEventListener('click', () => {
    alert('Notification settings saved successfully!');
  });
}

function renderReceiptSettings(container: HTMLElement): void {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">Receipt Printer Settings</h5>
      </div>
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Printer Type</label>
            <select class="form-select">
              <option value="thermal" selected>Thermal Printer</option>
              <option value="inkjet">Inkjet Printer</option>
              <option value="laser">Laser Printer</option>
              <option value="dot">Dot Matrix</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Printer Port</label>
            <select class="form-select">
              <option value="usb" selected>USB</option>
              <option value="serial">Serial (COM1)</option>
              <option value="parallel">Parallel (LPT1)</option>
              <option value="network">Network</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Paper Width</label>
            <select class="form-select">
              <option value="58" selected>58mm</option>
              <option value="80">80mm</option>
              <option value="a4">A4</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Copies</label>
            <input type="number" class="form-control" value="1" min="1" max="5">
          </div>
          <div class="col-md-12">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="autoCut" checked>
              <label class="form-check-label" for="autoCut">Auto Cut Paper</label>
            </div>
          </div>
          <div class="col-md-12">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="cashDrawer" checked>
              <label class="form-check-label" for="cashDrawer">Open Cash Drawer</label>
            </div>
          </div>
        </div>
        <div class="d-flex gap-2 mt-3">
          <button class="btn btn-brand-green" id="saveReceiptSettings">
            <i class="bi bi-check-lg me-2"></i>Save Changes
          </button>
          <button class="btn btn-outline-primary" id="testPrintBtn">
            <i class="bi bi-printer me-2"></i>Test Print
          </button>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#saveReceiptSettings')?.addEventListener('click', () => {
    alert('Receipt printer settings saved successfully!');
  });

  container.querySelector('#testPrintBtn')?.addEventListener('click', () => {
    alert('Test print sent to printer!');
  });
}

function renderSecuritySettings(container: HTMLElement): void {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">Security Settings</h5>
      </div>
      <div class="card-body">
        <h6 class="mb-3">Password Policy</h6>
        <div class="row g-3 mb-4">
          <div class="col-md-6">
            <label class="form-label">Minimum Password Length</label>
            <input type="number" class="form-control" value="8" min="6">
          </div>
          <div class="col-md-6">
            <label class="form-label">Password Expiry (Days)</label>
            <input type="number" class="form-control" value="90" min="30">
          </div>
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="requireUppercase" checked>
              <label class="form-check-label" for="requireUppercase">Require Uppercase Letters</label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="requireNumbers" checked>
              <label class="form-check-label" for="requireNumbers">Require Numbers</label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="requireSpecial" checked>
              <label class="form-check-label" for="requireSpecial">Require Special Characters</label>
            </div>
          </div>
        </div>

        <h6 class="mb-3">Session Settings</h6>
        <div class="row g-3 mb-4">
          <div class="col-md-6">
            <label class="form-label">Session Timeout (Minutes)</label>
            <input type="number" class="form-control" value="30" min="5">
          </div>
          <div class="col-md-6">
            <label class="form-label">Max Login Attempts</label>
            <input type="number" class="form-control" value="5" min="3">
          </div>
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="lockoutEnabled" checked>
              <label class="form-check-label" for="lockoutEnabled">Enable Account Lockout</label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="twoFactor">
              <label class="form-check-label" for="twoFactor">Two-Factor Authentication</label>
            </div>
          </div>
        </div>

        <h6 class="mb-3">Audit Settings</h6>
        <div class="row g-3">
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="logLogins" checked>
              <label class="form-check-label" for="logLogins">Log Login Attempts</label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="logDataChanges" checked>
              <label class="form-check-label" for="logDataChanges">Log Data Changes</label>
            </div>
          </div>
          <div class="col-md-6">
            <label class="form-label">Keep Audit Logs (Days)</label>
            <input type="number" class="form-control" value="90" min="30">
          </div>
        </div>
        <button class="btn btn-brand-green mt-3" id="saveSecuritySettings">
          <i class="bi bi-check-lg me-2"></i>Save Changes
        </button>
      </div>
    </div>
  `;

  container.querySelector('#saveSecuritySettings')?.addEventListener('click', () => {
    alert('Security settings saved successfully!');
  });
}

function renderSystemSettings(container: HTMLElement): void {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">System Settings</h5>
      </div>
      <div class="card-body">
        <h6 class="mb-3">General</h6>
        <div class="row g-3 mb-4">
          <div class="col-md-6">
            <label class="form-label">Currency</label>
            <select class="form-select">
              <option value="pkr" selected>Pakistani Rupee (₨)</option>
              <option value="usd">US Dollar ($)</option>
              <option value="eur">Euro (€)</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Date Format</label>
            <select class="form-select">
              <option value="ymd" selected>YYYY-MM-DD</option>
              <option value="dmy">DD/MM/YYYY</option>
              <option value="mdy">MM/DD/YYYY</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Timezone</label>
            <select class="form-select">
              <option value="pk" selected>Pakistan (PKT +5:00)</option>
              <option value="uae">UAE (GST +4:00)</option>
              <option value="uk">UK (GMT +0:00)</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Language</label>
            <select class="form-select">
              <option value="en" selected>English</option>
              <option value="ur">Urdu</option>
            </select>
          </div>
        </div>

        <h6 class="mb-3">Display</h6>
        <div class="row g-3 mb-4">
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="darkMode">
              <label class="form-check-label" for="darkMode">Dark Mode</label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="compactMode">
              <label class="form-check-label" for="compactMode">Compact Mode</label>
            </div>
          </div>
          <div class="col-md-6">
            <label class="form-label">Items Per Page</label>
            <select class="form-select">
              <option value="10">10</option>
              <option value="20" selected>20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        <h6 class="mb-3">Database</h6>
        <div class="row g-3 mb-4">
          <div class="col-md-6">
            <label class="form-label">Database Host</label>
            <input type="text" class="form-control" value="localhost">
          </div>
          <div class="col-md-6">
            <label class="form-label">Database Name</label>
            <input type="text" class="form-control" value="pharmacy_pos">
          </div>
          <div class="col-md-6">
            <label class="form-label">Database Port</label>
            <input type="number" class="form-control" value="3306">
          </div>
          <div class="col-md-6">
            <label class="form-label">Connection Pool Size</label>
            <input type="number" class="form-control" value="10" min="5" max="50">
          </div>
        </div>

        <div class="alert alert-info">
          <i class="bi bi-info-circle me-2"></i>
          <strong>System Version:</strong> v1.0.0 | <strong>Last Updated:</strong> 2026-09-13
        </div>

        <button class="btn btn-brand-green" id="saveSystemSettings">
          <i class="bi bi-check-lg me-2"></i>Save Changes
        </button>
      </div>
    </div>
  `;

  container.querySelector('#saveSystemSettings')?.addEventListener('click', () => {
    alert('System settings saved successfully!');
  });
}

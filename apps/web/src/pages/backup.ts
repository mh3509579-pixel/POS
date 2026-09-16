interface BackupEntry {
  id: number;
  filename: string;
  date: string;
  size: string;
  type: string;
  status: string;
  created_by: string;
}

const backups: BackupEntry[] = [
  { id: 1, filename: 'backup_2026-09-13_14-00.sql', date: '2026-09-13T14:00:00', size: '2.4 MB', type: 'auto', status: 'completed', created_by: 'System' },
  { id: 2, filename: 'backup_2026-09-13_08-00.sql', date: '2026-09-13T08:00:00', size: '2.3 MB', type: 'auto', status: 'completed', created_by: 'System' },
  { id: 3, filename: 'backup_2026-09-12_14-00.sql', date: '2026-09-12T14:00:00', size: '2.2 MB', type: 'auto', status: 'completed', created_by: 'System' },
  { id: 4, filename: 'manual_backup_2026-09-12.sql', date: '2026-09-12T10:30:00', size: '2.2 MB', type: 'manual', status: 'completed', created_by: 'Super Admin' },
  { id: 5, filename: 'backup_2026-09-11_14-00.sql', date: '2026-09-11T14:00:00', size: '2.1 MB', type: 'auto', status: 'completed', created_by: 'System' },
  { id: 6, filename: 'backup_2026-09-10_14-00.sql', date: '2026-09-10T14:00:00', size: '2.0 MB', type: 'auto', status: 'completed', created_by: 'System' },
];

export function renderBackup(): string {
  return `
    <div class="page-header">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h4>Backup & Restore</h4>
          <p>Manage database backups and system recovery</p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" id="restoreBtn">
            <i class="bi bi-arrow-counterclockwise me-2"></i>Restore
          </button>
          <button class="btn btn-brand-green" id="createBackupBtn">
            <i class="bi bi-cloud-upload me-2"></i>Create Backup
          </button>
        </div>
      </div>
    </div>

    <div class="row g-4 mb-4">
      <div class="col-md-8">
        <div class="card mb-4">
          <div class="card-header">
            <h6 class="mb-0">Backup Settings</h6>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Auto Backup Schedule</label>
                <select class="form-select" id="backupSchedule">
                  <option value="twice_daily" selected>Twice Daily (8:00 & 14:00)</option>
                  <option value="daily">Daily (8:00)</option>
                  <option value="weekly">Weekly (Sunday 8:00)</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Keep Backups For</label>
                <select class="form-select" id="keepBackups">
                  <option value="7">7 Days</option>
                  <option value="14" selected>14 Days</option>
                  <option value="30">30 Days</option>
                  <option value="90">90 Days</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Backup Location</label>
                <select class="form-select" id="backupLocation">
                  <option value="local" selected>Local Server</option>
                  <option value="google_drive">Google Drive</option>
                  <option value="aws">AWS S3</option>
                  <option value="ftp">FTP Server</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Backup Format</label>
                <select class="form-select" id="backupFormat">
                  <option value="sql" selected>SQL Dump</option>
                  <option value="zip">Compressed (ZIP)</option>
                  <option value="json">JSON Export</option>
                </select>
              </div>
            </div>
            <button class="btn btn-brand-green mt-3" id="saveBackupSettings">
              <i class="bi bi-check-lg me-2"></i>Save Settings
            </button>
          </div>
        </div>

        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h6 class="mb-0">Backup History</h6>
            <span class="text-muted">${backups.length} backups</span>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Filename</th>
                    <th>Date & Time</th>
                    <th>Size</th>
                    <th>Type</th>
                    <th>Created By</th>
                    <th>Status</th>
                    <th class="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${backups.map((b) => `
                    <tr>
                      <td><code>${b.filename}</code></td>
                      <td>${new Date(b.date).toLocaleString()}</td>
                      <td>${b.size}</td>
                      <td><span class="badge ${b.type === 'auto' ? 'bg-info' : 'bg-primary'} text-capitalize">${b.type}</span></td>
                      <td>${b.created_by}</td>
                      <td><span class="badge-status badge-success text-capitalize">${b.status}</span></td>
                      <td class="text-end">
                        <div class="btn-group btn-group-sm">
                          <button class="btn btn-outline-secondary download-btn" title="Download">
                            <i class="bi bi-download"></i>
                          </button>
                          <button class="btn btn-outline-secondary restore-btn" title="Restore">
                            <i class="bi bi-arrow-counterclockwise"></i>
                          </button>
                          <button class="btn btn-outline-danger delete-btn" title="Delete">
                            <i class="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card mb-4">
          <div class="card-header">
            <h6 class="mb-0">System Status</h6>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <div class="d-flex justify-content-between mb-1">
                <span>Database Size:</span>
                <span class="fw-semibold">2.4 MB</span>
              </div>
              <div class="progress" style="height: 8px;">
                <div class="progress-bar bg-primary" style="width: 24%"></div>
              </div>
            </div>
            <div class="mb-3">
              <div class="d-flex justify-content-between mb-1">
                <span>Storage Used:</span>
                <span class="fw-semibold">156 MB / 1 GB</span>
              </div>
              <div class="progress" style="height: 8px;">
                <div class="progress-bar bg-warning" style="width: 15%"></div>
              </div>
            </div>
            <div class="mb-3">
              <div class="d-flex justify-content-between mb-1">
                <span>Last Backup:</span>
                <span class="fw-semibold text-success">Today 14:00</span>
              </div>
            </div>
            <div class="mb-3">
              <div class="d-flex justify-content-between mb-1">
                <span>Next Backup:</span>
                <span class="fw-semibold">Today 20:00</span>
              </div>
            </div>
            <div>
              <div class="d-flex justify-content-between mb-1">
                <span>Backup Status:</span>
                <span class="badge bg-success">Healthy</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-header">
            <h6 class="mb-0">Quick Actions</h6>
          </div>
          <div class="card-body">
            <button class="btn btn-outline-primary w-100 mb-2" id="downloadLatestBtn">
              <i class="bi bi-download me-2"></i>Download Latest Backup
            </button>
            <button class="btn btn-outline-success w-100 mb-2" id="verifyBackupBtn">
              <i class="bi bi-shield-check me-2"></i>Verify Backup Integrity
            </button>
            <button class="btn btn-outline-warning w-100 mb-2" id="cleanupBtn">
              <i class="bi bi-trash me-2"></i>Cleanup Old Backups
            </button>
            <button class="btn btn-outline-info w-100" id="scheduleBtn">
              <i class="bi bi-clock me-2"></i>View Backup Schedule
            </button>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h6 class="mb-0">Backup Progress</h6>
          </div>
          <div class="card-body" id="backupProgress" style="display: none;">
            <div class="text-center mb-3">
              <div class="spinner-border text-brand-green" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
            <div class="mb-2">
              <div class="d-flex justify-content-between mb-1">
                <span id="backupStatus">Creating backup...</span>
                <span id="backupPercent">0%</span>
              </div>
              <div class="progress">
                <div class="progress-bar progress-bar-striped progress-bar-animated" id="backupProgressBar" style="width: 0%"></div>
              </div>
            </div>
            <small class="text-muted" id="backupEta">Estimated time remaining: Calculating...</small>
          </div>
          <div class="card-body" id="backupComplete" style="display: none;">
            <div class="alert alert-success mb-0">
              <i class="bi bi-check-circle me-2"></i>
              <strong>Backup completed successfully!</strong>
              <br><small>File: backup_2026-09-13_14-00.sql (2.4 MB)</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initBackup(): void {
  document.getElementById('createBackupBtn')?.addEventListener('click', createBackup);
  document.getElementById('saveBackupSettings')?.addEventListener('click', () => {
    alert('Backup settings saved successfully!');
  });

  document.getElementById('downloadLatestBtn')?.addEventListener('click', () => {
    alert('Downloading backup_2026-09-13_14-00.sql...');
  });

  document.getElementById('verifyBackupBtn')?.addEventListener('click', () => {
    alert('Verifying backup integrity...\n\nAll backups are valid and intact!');
  });

  document.getElementById('cleanupBtn')?.addEventListener('click', () => {
    alert('Cleaning up backups older than 14 days...\n\n2 old backups removed.');
  });

  document.getElementById('scheduleBtn')?.addEventListener('click', () => {
    alert('Backup Schedule:\n\n• 08:00 - Auto Backup\n• 14:00 - Auto Backup\n\nNext: Today 20:00');
  });

  document.querySelectorAll('.download-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      alert('Downloading backup file...');
    });
  });

  document.querySelectorAll('.restore-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (confirm('Are you sure you want to restore this backup?\n\nWARNING: This will overwrite current data!')) {
        alert('Restoring backup...\n\nBackup restored successfully!');
      }
    });
  });

  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this backup?')) {
        alert('Backup deleted successfully!');
      }
    });
  });
}

function createBackup(): void {
  const progressDiv = document.getElementById('backupProgress');
  const completeDiv = document.getElementById('backupComplete');
  const progressBar = document.getElementById('backupProgressBar') as HTMLElement;
  const statusText = document.getElementById('backupStatus');
  const percentText = document.getElementById('backupPercent');
  const etaText = document.getElementById('backupEta');

  if (!progressDiv || !completeDiv || !progressBar || !statusText || !percentText || !etaText) return;

  progressDiv.style.display = 'block';
  completeDiv.style.display = 'none';

  const stages = [
    { progress: 20, text: 'Connecting to database...', eta: '5 seconds' },
    { progress: 40, text: 'Exporting tables...', eta: '10 seconds' },
    { progress: 60, text: 'Backing up data...', eta: '8 seconds' },
    { progress: 80, text: 'Compressing file...', eta: '3 seconds' },
    { progress: 95, text: 'Verifying backup...', eta: '2 seconds' },
    { progress: 100, text: 'Backup complete!', eta: 'Done' },
  ];

  let stageIndex = 0;

  const interval = setInterval(() => {
    if (stageIndex < stages.length) {
      const stage = stages[stageIndex];
      progressBar.style.width = `${stage.progress}%`;
      percentText.textContent = `${stage.progress}%`;
      statusText.textContent = stage.text;
      etaText.textContent = `Estimated time remaining: ${stage.eta}`;
      stageIndex++;
    } else {
      clearInterval(interval);
      setTimeout(() => {
        progressDiv.style.display = 'none';
        completeDiv.style.display = 'block';
      }, 500);
    }
  }, 800);
}

export interface BackupRecord {
  id: number;
  backup_number: string;
  backup_type: 'full' | 'partial';
  status: 'pending' | 'completed' | 'failed';
  file_path: string | null;
  file_size: number | null;
  notes: string | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBackupDTO {
  backup_type: 'full' | 'partial';
  notes?: string;
}

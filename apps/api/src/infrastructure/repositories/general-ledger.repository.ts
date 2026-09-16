import { GeneralLedger, AccountBalance, LedgerEntryWithDetails, TrialBalanceRow } from '../../modules/accounting/domain/general-ledger.entity.js';
import { IGeneralLedgerRepository } from '../../modules/accounting/domain/general-ledger.repository.js';
import { query, queryOne, execute } from '../database/connection.js';

export class GeneralLedgerRepository implements IGeneralLedgerRepository {
  async findByAccountId(accountId: number, startDate?: Date, endDate?: Date): Promise<LedgerEntryWithDetails[]> {
    let sql = `
      SELECT gl.*, a.code as account_code, a.name as account_name, a.type as account_type,
             je.entry_number
      FROM general_ledger gl
      JOIN accounts a ON gl.account_id = a.id
      JOIN journal_entries je ON gl.journal_entry_id = je.id
      WHERE gl.account_id = ?
    `;
    const params: any[] = [accountId];

    if (startDate) {
      sql += ' AND gl.entry_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND gl.entry_date <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY gl.entry_date ASC, gl.id ASC';

    return query<LedgerEntryWithDetails[]>(sql, params);
  }

  async getAccountBalance(accountId: number): Promise<AccountBalance | null> {
    return queryOne<AccountBalance>(
      'SELECT * FROM account_balances WHERE account_id = ?',
      [accountId]
    );
  }

  async getAllAccountBalances(): Promise<AccountBalance[]> {
    return query<AccountBalance[]>('SELECT * FROM account_balances ORDER BY account_id');
  }

  async updateAccountBalance(accountId: number, debit: number, credit: number): Promise<AccountBalance> {
    const existing = await this.getAccountBalance(accountId);

    if (existing) {
      const newDebitBalance = existing.debit_balance + debit;
      const newCreditBalance = existing.credit_balance + credit;
      const netBalance = newDebitBalance - newCreditBalance;

      await execute(
        'UPDATE account_balances SET debit_balance = ?, credit_balance = ?, net_balance = ? WHERE account_id = ?',
        [newDebitBalance, newCreditBalance, netBalance, accountId]
      );
    } else {
      const netBalance = debit - credit;
      await execute(
        'INSERT INTO account_balances (account_id, debit_balance, credit_balance, net_balance) VALUES (?, ?, ?, ?)',
        [accountId, debit, credit, netBalance]
      );
    }

    return (await this.getAccountBalance(accountId))!;
  }

  async getTrialBalance(startDate: Date, endDate: Date): Promise<TrialBalanceRow[]> {
    return query<TrialBalanceRow[]>(`
      SELECT 
        a.id as account_id,
        a.code as account_code,
        a.name as account_name,
        a.type as account_type,
        COALESCE(SUM(gl.debit), 0) as total_debit,
        COALESCE(SUM(gl.credit), 0) as total_credit
      FROM accounts a
      LEFT JOIN general_ledger gl ON a.id = gl.account_id 
        AND gl.entry_date BETWEEN ? AND ?
      WHERE a.is_active = true
      GROUP BY a.id, a.code, a.name, a.type
      HAVING total_debit > 0 OR total_credit > 0
      ORDER BY a.code
    `, [startDate, endDate]);
  }

  async getAccountStatement(accountId: number, startDate: Date, endDate: Date): Promise<{
    opening_balance: number;
    entries: LedgerEntryWithDetails[];
    closing_balance: number;
  }> {
    // Get opening balance (sum of all entries before start date)
    const openingResult = await queryOne<{ opening_debit: number; opening_credit: number }>(`
      SELECT 
        COALESCE(SUM(debit), 0) as opening_debit,
        COALESCE(SUM(credit), 0) as opening_credit
      FROM general_ledger
      WHERE account_id = ? AND entry_date < ?
    `, [accountId, startDate]);

    const opening_balance = (openingResult?.opening_debit || 0) - (openingResult?.opening_credit || 0);

    // Get entries in date range
    const entries = await this.findByAccountId(accountId, startDate, endDate);

    // Calculate closing balance
    let closing_balance = opening_balance;
    for (const entry of entries) {
      closing_balance += entry.debit - entry.credit;
    }

    return {
      opening_balance,
      entries,
      closing_balance,
    };
  }
}

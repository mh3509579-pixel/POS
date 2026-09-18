import { GeneralLedger, AccountBalance, LedgerEntryWithDetails, TrialBalanceRow } from '../domain/general-ledger.entity.js';
import { IGeneralLedgerRepository } from '../domain/general-ledger.repository.js';
import { query, queryOne, execute } from '../../../infrastructure/database/connection.js';

export class GeneralLedgerRepository implements IGeneralLedgerRepository {
  async findByAccountId(accountId: number, startDate?: Date, endDate?: Date): Promise<LedgerEntryWithDetails[]> {
    let sql = `
      SELECT gl.*, a.name as account_name, a.code as account_code, a.type as account_type, je.entry_number
      FROM general_ledger gl
      INNER JOIN accounts a ON gl.account_id = a.id
      INNER JOIN journal_entries je ON gl.journal_entry_id = je.id
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
    return query<AccountBalance[]>(
      `SELECT ab.*, a.name as account_name, a.code as account_code, a.type as account_type
       FROM account_balances ab
       INNER JOIN accounts a ON ab.account_id = a.id
       ORDER BY a.code`
    );
  }

  async updateAccountBalance(accountId: number, debit: number, credit: number): Promise<AccountBalance> {
    await execute(
      `INSERT INTO account_balances (account_id, debit_balance, credit_balance, net_balance)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         debit_balance = debit_balance + VALUES(debit_balance),
         credit_balance = credit_balance + VALUES(credit_balance),
         net_balance = net_balance + (VALUES(debit_balance) - VALUES(credit_balance))`,
      [accountId, debit, credit, debit - credit]
    );

    return this.getAccountBalance(accountId) as Promise<AccountBalance>;
  }

  async getTrialBalance(startDate: Date, endDate: Date): Promise<TrialBalanceRow[]> {
    return query<TrialBalanceRow[]>(
      `SELECT
        a.id as account_id,
        a.code as account_code,
        a.name as account_name,
        a.type as account_type,
        COALESCE(SUM(gl.debit), 0) as total_debit,
        COALESCE(SUM(gl.credit), 0) as total_credit,
        COALESCE(ab.net_balance, 0) as balance
      FROM accounts a
      LEFT JOIN general_ledger gl ON a.id = gl.account_id AND gl.entry_date BETWEEN ? AND ?
      LEFT JOIN account_balances ab ON a.id = ab.account_id
      WHERE a.is_active = TRUE
      GROUP BY a.id, a.code, a.name, a.type, ab.net_balance
      HAVING total_debit > 0 OR total_credit > 0 OR balance != 0
      ORDER BY a.code`,
      [startDate, endDate]
    );
  }

  async getAccountStatement(accountId: number, startDate: Date, endDate: Date): Promise<{
    opening_balance: number;
    entries: LedgerEntryWithDetails[];
    closing_balance: number;
  }> {
    const openingResult = await queryOne<{ balance: number }>(
      `SELECT COALESCE(net_balance, 0) as balance FROM account_balances WHERE account_id = ?`,
      [accountId]
    );

    const entries = await this.findByAccountId(accountId, startDate, endDate);

    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

    return {
      opening_balance: openingResult?.balance || 0,
      entries,
      closing_balance: (openingResult?.balance || 0) + totalDebit - totalCredit,
    };
  }
}

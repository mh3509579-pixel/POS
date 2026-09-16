import { Request, Response, NextFunction } from 'express';
import { AccountRepository } from '../infrastructure/account.repository.js';
import { JournalEntryRepository } from '../infrastructure/journal-entry.repository.js';
import { GeneralLedgerRepository } from '../infrastructure/general-ledger.repository.js';
import { AccountingService } from '../application/accounting.service.js';

const accountRepo = new AccountRepository();
const journalEntryRepo = new JournalEntryRepository();
const generalLedgerRepo = new GeneralLedgerRepository();
const accountingService = new AccountingService(journalEntryRepo, generalLedgerRepo, accountRepo);

// Account Controllers
export async function getAllAccounts(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const accounts = await accountRepo.findAll();
    res.json({ status: 'success', data: accounts });
  } catch (error) {
    next(error);
  }
}

export async function getAccountById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = await accountRepo.findById(parseInt(req.params.id));
    if (!account) {
      res.status(404).json({ status: 'error', message: 'Account not found' });
      return;
    }
    res.json({ status: 'success', data: account });
  } catch (error) {
    next(error);
  }
}

export async function createAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = await accountRepo.create(req.body);
    res.status(201).json({ status: 'success', data: account });
  } catch (error) {
    next(error);
  }
}

export async function updateAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = await accountRepo.update(parseInt(req.params.id), req.body);
    if (!account) {
      res.status(404).json({ status: 'error', message: 'Account not found' });
      return;
    }
    res.json({ status: 'success', data: account });
  } catch (error) {
    next(error);
  }
}

// Journal Entry Controllers
export async function getAllJournalEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const entries = await journalEntryRepo.findAll(limit, offset);
    const total = await journalEntryRepo.count();
    res.json({ status: 'success', data: entries, total });
  } catch (error) {
    next(error);
  }
}

export async function getJournalEntryById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const entry = await journalEntryRepo.findById(parseInt(req.params.id));
    if (!entry) {
      res.status(404).json({ status: 'error', message: 'Journal entry not found' });
      return;
    }
    res.json({ status: 'success', data: entry });
  } catch (error) {
    next(error);
  }
}

export async function createJournalEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const entry = await accountingService.createJournalEntry(req.body);
    res.status(201).json({ status: 'success', data: entry });
  } catch (error) {
    next(error);
  }
}

export async function postJournalEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const entry = await accountingService.postJournalEntry(parseInt(req.params.id));
    res.json({ status: 'success', data: entry });
  } catch (error) {
    next(error);
  }
}

export async function voidJournalEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { reason } = req.body;
    const entry = await accountingService.voidJournalEntry(parseInt(req.params.id), reason);
    res.json({ status: 'success', data: entry });
  } catch (error) {
    next(error);
  }
}

// Ledger Controllers
export async function getTrialBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { start_date, end_date } = req.query;
    const startDate = start_date ? new Date(start_date as string) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = end_date ? new Date(end_date as string) : new Date();
    const trialBalance = await accountingService.getTrialBalance(startDate, endDate);
    res.json({ status: 'success', data: trialBalance });
  } catch (error) {
    next(error);
  }
}

export async function getAccountStatement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const accountId = parseInt(req.params.accountId);
    const { start_date, end_date } = req.query;
    const startDate = start_date ? new Date(start_date as string) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = end_date ? new Date(end_date as string) : new Date();
    const statement = await accountingService.getAccountStatement(accountId, startDate, endDate);
    res.json({ status: 'success', data: statement });
  } catch (error) {
    next(error);
  }
}

export async function getAccountBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const balance = await accountingService.getAccountBalance(parseInt(req.params.accountId));
    res.json({ status: 'success', data: { balance } });
  } catch (error) {
    next(error);
  }
}

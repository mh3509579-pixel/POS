import { Router } from 'express';
import {
  getAllAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  getAllJournalEntries,
  getJournalEntryById,
  createJournalEntry,
  postJournalEntry,
  voidJournalEntry,
  getTrialBalance,
  getAccountStatement,
  getAccountBalance,
} from './accounting.controller.js';

const router = Router();

// Account routes
router.get('/accounts', getAllAccounts);
router.get('/accounts/:id', getAccountById);
router.post('/accounts', createAccount);
router.put('/accounts/:id', updateAccount);

// Journal Entry routes
router.get('/journal-entries', getAllJournalEntries);
router.get('/journal-entries/:id', getJournalEntryById);
router.post('/journal-entries', createJournalEntry);
router.post('/journal-entries/:id/post', postJournalEntry);
router.post('/journal-entries/:id/void', voidJournalEntry);

// Ledger routes
router.get('/trial-balance', getTrialBalance);
router.get('/accounts/:accountId/statement', getAccountStatement);
router.get('/accounts/:accountId/balance', getAccountBalance);

export { router as accountingRoutes };

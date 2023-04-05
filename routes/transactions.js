import { Router } from 'express';
import * as transactionController from '../controllers/transactions.js';

export const router = Router();

router.get('/transactions', transactionController.getTransactionsWithPagination);

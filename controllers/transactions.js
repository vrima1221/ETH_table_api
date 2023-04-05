import * as transactionService from '../services/transactions.js';
import Joi from 'joi';

const transactionsQuerySchema = Joi.object({
  page: Joi.string().required(),
  limit: Joi.string().required(),
  filter: Joi.string().valid('from', 'to', 'hash', 'blockNumberString', ''),
  input: Joi.string().allow(null).empty(''),
});

export const getTransactionsWithPagination = async (req, res) => {
  try {
    const { page, limit, filter, input } = await transactionsQuerySchema.validateAsync(req.query);
    const totalTransactionsCount = await transactionService.getTransactionsCount();
    const totalPageCount = Math.ceil(totalTransactionsCount / limit);

    const transactions = await transactionService.getTransactionsWithPagination(page, limit, filter, input);

    if (transactions) {
      res.json({
        totalPageCount,
        transactions,
      });
    } else {
      res.sendStatus(500);
    }
  } catch (error) {
    res.status(400).json({ error: error.details[0].message });
  }
};
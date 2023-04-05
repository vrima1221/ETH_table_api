import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import * as transactionService from './services/transactions.js';
import Joi from 'joi'

mongoose.connect('mongodb+srv://qwerty:qwerty123@ethtableapi.o91p1yp.mongodb.net/?retryWrites=true&w=majority');

const PORT = process.env.PORT || 5000;

const server = express();

server.use(cors());

const start = () => {
  if (transactionService.getTransactionsCount() === 0) {
    transactionService.getLastThousandBloks();
  }

  transactionService.fetchAndSaveTransactions();
  server.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
};


const transactionsQuerySchema = Joi.object({
  page: Joi.string().required(),
  limit: Joi.string().required(),
  filter: Joi.string().valid('from', 'to', 'hash', 'blockNumberString', ''),
  input: Joi.string().allow(null).empty(''),
});

server.get('/transactions', express.json(), async (req, res) => {
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
});

start();


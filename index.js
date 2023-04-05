import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import * as transactionService from './services/transactions.js';
import { router as transactionRouter } from './routes/transactions.js';

mongoose.connect('mongodb+srv://qwerty:qwerty123@ethtableapi.o91p1yp.mongodb.net/?retryWrites=true&w=majority');

const PORT = process.env.PORT || 5000;

const server = express();

server.use(cors());
server.use(transactionRouter);

const start = () => {
  if (transactionService.getTransactionsCount() === 0) {
    transactionService.getLastThousandBloks();
  }

  transactionService.fetchAndSaveTransactions();
  server.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
};


start();


import axios from 'axios';
import { Transaction } from '../models/transaction.js';

export async function getAndSaveTransactions() {
  try {
    const latestBlockResponse = await axios.get('https://api.etherscan.io/api', {
      params: {
        module: 'proxy',
        action: 'eth_blockNumber',
        apikey: 'J6PEYE3M6YPDRXFYXD2UR9ZJSKFZ86RT1J',
      },
    });

    const latestBlock = latestBlockResponse.data.result;

    const blockResponse = await axios.get('https://api.etherscan.io/api', {
      params: {
        module: 'proxy',
        action: 'eth_getBlockByNumber',
        tag: latestBlock,
        boolean: true,
        apikey: 'J6PEYE3M6YPDRXFYXD2UR9ZJSKFZ86RT1J',
      },
    });

    const { transactions } = blockResponse.data.result;

    await Transaction.insertMany(transactions.map((transaction) => ({
      hash: transaction.hash,
      blockNumber: parseInt(transaction.blockNumber, 16),
      blockNumberString: parseInt(transaction.blockNumber, 16).toString(),
      from: transaction.from,
      to: transaction.to,
      value: parseInt(transaction.value, 16) / Math.pow(10, 18),
      confirmations: latestBlock - transaction.blockNumber,
      sentAt: new Date(blockResponse.data.result.timestamp * 1000),
      fee: (parseInt(transaction.gasPrice, 16) * parseInt(transaction.gas, 16))
        / 1000000000000000000,
    })));

    console.log('Transactions saved to database');
  } catch (err) {
    console.error('Error while getting and saving transactions:', err);
  }
};

export async function updateConfirmations() {
  try {
    const latestBlockResponse = await axios.get('https://api.etherscan.io/api', {
      params: {
        module: 'proxy',
        action: 'eth_blockNumber',
        apikey: 'J6PEYE3M6YPDRXFYXD2UR9ZJSKFZ86RT1J',
      },
    });

    const latestBlock = parseInt(latestBlockResponse.data.result, 16);

    await Transaction.updateMany({ confirmations: { $gte: 0 } }, [
      {
        $set: {
          confirmations: {
            $subtract: [latestBlock, '$blockNumber'],
          },
        },
      },
    ]);

    console.log('Confirmations updated');
  } catch (err) {
    console.error('Error while updating confirmations:', err);
  }
};

export async function fetchAndSaveTransactions() {
  await getAndSaveTransactions();
  await updateConfirmations();
  setTimeout(fetchAndSaveTransactions, 10000);
}

export async function getTransactionsCount() {
  const transactionsCount = await Transaction.countDocuments();

  return transactionsCount;
};

export async function getTransactionsWithPagination(currentPage = 1, limit, filter, input) {
  try {
    const page = currentPage;
    const limitPerPage = +limit;

  if (filter && input) {
    const query = {
      [filter]: {
        $regex: input
      }
    }

    const transactionsToSend = await Transaction.find(query).sort({ sentAt: -1 }).skip((page - 1) * limitPerPage).limit(limitPerPage);

    return transactionsToSend;
  }
  
  const transactionsToSend = await Transaction.find().sort({ sentAt: -1 }).skip((page - 1) * limitPerPage).limit(limitPerPage);

  return transactionsToSend;
  } catch (error) {
    console.error('Error while getting transactions:', error);
  }
};

export async function getLastThousandBloks() {
  try {
    const transactionCount = await Transaction.countDocuments();
    if (transactionCount > 0) {
      console.log('Database already contains transactions, skipping block download');
      return;
    }

    const latestBlockResponse = await axios.get('https://api.etherscan.io/api', {
      params: {
        module: 'proxy',
        action: 'eth_blockNumber',
        apikey: 'J6PEYE3M6YPDRXFYXD2UR9ZJSKFZ86RT1J',
      },
    });
    const latestBlock = latestBlockResponse.data.result;

    const startBlock = latestBlock - 999;
    const blocksResponse = await axios.get('https://api.etherscan.io/api', {
      params: {
        module: 'proxy',
        action: 'eth_getBlockByNumber',
        tag: startBlock,
        boolean: true,
        apikey: 'J6PEYE3M6YPDRXFYXD2UR9ZJSKFZ86RT1J',
      },
    });

    const blocks = [];

    blocks.push(blocksResponse.data.result);

    let currentBlock = startBlock;

    while (currentBlock < latestBlock) {
      currentBlock++;
      const blockResponse = await axios.get('https://api.etherscan.io/api', {
        params: {
          module: 'proxy',
          action: 'eth_getBlockByNumber',
          tag: `0x${currentBlock.toString(16)}`,
          boolean: true,
          apikey: 'J6PEYE3M6YPDRXFYXD2UR9ZJSKFZ86RT1J',
        },
      });
      blocks.push(blockResponse.data.result);
    }

    const transactions = blocks.reduce((acc, block) => [...acc, ...block.transactions], []);

    await Transaction.insertMany(transactions.map((transaction) => ({
      hash: transaction.hash,
      blockNumber: parseInt(transaction.blockNumber, 16),
      blockNumberString: parseInt(transaction.blockNumber, 16).toString(),
      from: transaction.from,
      to: transaction.to,
      value: parseInt(transaction.value, 16) / Math.pow(10, 18),
      confirmations: latestBlock - transaction.blockNumber,
      sentAt: new Date(block.timestamp * 1000),
      fee: (parseInt(transaction.gasPrice, 16) * parseInt(transaction.gas, 16))
        / 1000000000000000000,
    })));

    console.log('Transactions saved to database');
  } catch (err) {
    console.error('Error while getting and saving transactions from last 100 blocks:', err);
  }
};

import { Router } from 'express';
import path from 'path';

import { getCustomRepository } from 'typeorm';
import multer from 'multer';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();
const upload = multer({ dest: path.resolve(__dirname, '..', '..', 'tmp') });

interface AllTransactionsStructure {
  id: string;
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: {
    id: string;
    title: string;
    created_at: Date;
    updated_at: Date;
  };
  created_at: Date;
  updated_at: Date;
}

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

interface Extract {
  transactions: AllTransactionsStructure[];
  balance: Balance;
}

transactionsRouter.get('/', async (request, response) => {
  const transactionRepository = getCustomRepository(TransactionsRepository);
  const transactions = await transactionRepository.find({
    relations: ['category'],
  });

  const allTransactions: AllTransactionsStructure[] = [];

  transactions.forEach(element => {
    allTransactions.push({
      id: element.id,
      title: element.title,
      value: +element.value,
      type: element.type,
      category: {
        id: element.category.id,
        title: element.category.title,
        created_at: element.category.created_at,
        updated_at: element.category.updated_at,
      },
      created_at: element.created_at,
      updated_at: element.updated_at,
    });
  });

  const extract: Extract = {
    transactions: allTransactions,
    balance: await transactionRepository.getBalance(),
  };

  return response.json(extract);
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  const createTransaction = new CreateTransactionService();

  const transaction = await createTransaction.execute({
    title,
    value,
    type,
    category,
  });

  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  // DELETE /transactions/:id: A rota deve deletar uma transação com o id presente nos parâmetros da rota;
  const { id } = request.params;

  const deleteTransaction = new DeleteTransactionService();

  await deleteTransaction.execute(id);

  return response.json({ message: 'Transaction deleted!' });
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    const importTransactionsService = new ImportTransactionsService();
    const transactions = await importTransactionsService.execute({
      csvFileName: request.file.filename,
    });

    return response.json(transactions);
  },
);

export default transactionsRouter;

import path from 'path';
import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';

interface Request {
  csvFileName: string;
}

class ImportTransactionsService {
  async execute({ csvFileName }: Request): Promise<Transaction[]> {
    const transactionRepository = getCustomRepository(TransactionsRepository);

    const csvFilePath = path.join(
      path.resolve(__dirname, '..', '..', 'tmp'),
      csvFileName,
    );

    const lines = await transactionRepository.loadTransactionsCSV(csvFilePath);
    const transactions: Transaction[] = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const line of lines) {
      // eslint-disable-next-line no-await-in-loop
      const category = await transactionRepository.getCategoryByName(line[3]);
      transactions.push(
        transactionRepository.create({
          title: line[0],
          type: line[1] === 'income' ? 'income' : 'outcome',
          value: parseFloat(line[2]),
          category_id: category.id,
        }),
      );
    }

    await transactionRepository.save(transactions);

    return transactions;
  }
}

export default ImportTransactionsService;

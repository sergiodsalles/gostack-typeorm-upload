import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionsRepository);

    const categoryEntity = await transactionRepository.getCategoryByName(
      category,
    );

    const { total } = await transactionRepository.getBalance();

    if (type === 'outcome' && +total < value) {
      throw new AppError('Insufficient funds!', 400);
    }

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category_id: categoryEntity.id,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;

import { getCustomRepository, DeleteResult } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<DeleteResult> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const foundTransaction = await transactionsRepository.findOne({
      where: { id },
    });

    if (!foundTransaction) {
      throw new AppError('Transaction not found!', 404);
    }

    const result = await transactionsRepository.delete({ id });

    return result;
  }
}

export default DeleteTransactionService;

import { EntityRepository, Repository, getRepository } from 'typeorm';

import fs from 'fs';
import csvParse from 'csv-parse';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const allTransactions = await this.find();
    const incomes = allTransactions.reduce((sum, record) => {
      if (record.type === 'income') {
        return +sum + +record.value;
      }
      return sum;
    }, 0);

    const outcomes = allTransactions.reduce((sum, record) => {
      if (record.type === 'outcome') {
        return +sum + +record.value;
      }
      return sum;
    }, 0);

    const balance: Balance = {
      income: incomes,
      outcome: outcomes,
      total: incomes - outcomes,
    };

    return balance;
  }

  public async getCategoryByName(categoryName: string): Promise<Category> {
    const categoryRepository = getRepository(Category);

    const categoryFound = await categoryRepository.findOne({
      where: { title: categoryName },
    });

    if (!categoryFound) {
      const newCategory = categoryRepository.create({
        title: categoryName,
      });
      const savedCategory = await categoryRepository.save(newCategory);
      return savedCategory;
    }

    return categoryFound;
  }

  public async loadTransactionsCSV(filePath: string): Promise<string[]> {
    const readCSVStream = fs.createReadStream(filePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const lines: string[] = [];

    parseCSV.on('data', line => {
      lines.push(line);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    return lines;
  }
}

export default TransactionsRepository;

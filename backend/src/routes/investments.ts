import { Router, Request, Response } from 'express';
import { readData, appendData, updateData, deleteData } from '../storage';
import logger from '../logger';

const router = Router();

interface Investment {
  id: string;
  userId: string;
  accountName: string;
  accountType: 'RRSP' | 'TFSA' | 'FHSA' | 'Savings';
  investedAmount: number;
  currentValue: number;
}

interface ContributionLimit {
  id: string;
  userId: string;
  year: number;
  accountType: 'RRSP' | 'TFSA' | 'FHSA';
  limit: number;
}

interface InvestmentTransaction {
  id: string;
  userId: string;
  amount: number;
  date: string;
  accountId: string;
}

// ============ INVESTMENT ACCOUNT ENDPOINTS ============

// Get all investments for a user
router.get('/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    logger.debug('Fetching investments', { userId });
    const investments = readData('investments') as Investment[];
    const userInvestments = investments.filter((i: Investment) => i.userId === userId);
    logger.info('Investments fetched', { userId, count: userInvestments.length });
    res.status(200).json(userInvestments);
  } catch (error) {
    logger.error('Failed to fetch investments', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to fetch investments' });
  }
});

// Get investment by id
router.get('/:userId/:id', (req: Request, res: Response) => {
  try {
    const { userId, id } = req.params;
    logger.debug('Fetching investment by id', { userId, investmentId: id });
    const investments = readData('investments') as Investment[];
    const investment = investments.find((i: Investment) => i.id === id && i.userId === userId);

    if (!investment) {
      logger.warn('Investment not found', { userId, investmentId: id });
      res.status(404).json({ error: 'Investment not found' });
      return;
    }

    logger.debug('Investment retrieved', { userId, investmentId: id });
    res.status(200).json(investment);
  } catch (error) {
    logger.error('Failed to fetch investment', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to fetch investment' });
  }
});

// Create a new investment
router.post('/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { accountName, accountType, investedAmount, currentValue } = req.body;
    logger.debug('Creating investment', { userId, accountType, accountName });

    // Validation
    if (!accountName || !accountType || investedAmount === undefined || currentValue === undefined) {
      logger.warn('Create investment failed: missing fields', { userId });
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Validate account type
    if (!['RRSP', 'TFSA', 'FHSA', 'Savings'].includes(accountType)) {
      res.status(400).json({ error: 'Invalid account type. Must be one of: RRSP, TFSA, FHSA, Savings' });
      return;
    }

    // Validate amounts
    if (typeof investedAmount !== 'number' || investedAmount < 0) {
      res.status(400).json({ error: 'Invested amount must be a non-negative number' });
      return;
    }

    if (typeof currentValue !== 'number' || currentValue < 0) {
      res.status(400).json({ error: 'Current value must be a non-negative number' });
      return;
    }

    // Validate account name is not empty
    if (typeof accountName !== 'string' || accountName.trim().length === 0) {
      res.status(400).json({ error: 'Account name cannot be empty' });
      return;
    }

    const newInvestment = appendData('investments', {
      userId,
      accountName,
      accountType,
      investedAmount,
      currentValue
    });

    logger.info('Investment created', { userId, investmentId: newInvestment.id, accountType });
    res.status(201).json(newInvestment);
  } catch (error) {
    logger.error('Failed to create investment', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to create investment' });
  }
});

// Update an investment
router.put('/:userId/:id', (req: Request, res: Response) => {
  try {
    const { userId, id } = req.params;
    const { accountName, accountType, investedAmount, currentValue } = req.body;
    logger.debug('Updating investment', { userId, investmentId: id });

    // Validation
    const VALID_ACCOUNT_TYPES = ['RRSP', 'TFSA', 'FHSA', 'Savings'];
    if (!accountName || !accountType || investedAmount === undefined || currentValue === undefined) {
      logger.warn('Update investment failed: missing fields', { userId, investmentId: id });
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    if (!VALID_ACCOUNT_TYPES.includes(accountType)) {
      res.status(400).json({ error: `Invalid accountType. Must be one of: ${VALID_ACCOUNT_TYPES.join(', ')}` });
      return;
    }
    if (typeof accountName !== 'string' || accountName.trim() === '') {
      res.status(400).json({ error: 'Account name must be a non-empty string' });
      return;
    }
    if (typeof investedAmount !== 'number' || investedAmount < 0) {
      res.status(400).json({ error: 'Invested amount must be a non-negative number' });
      return;
    }
    if (typeof currentValue !== 'number' || currentValue < 0) {
      res.status(400).json({ error: 'Current value must be a non-negative number' });
      return;
    }

    const investments = readData('investments') as Investment[];
    const investment = investments.find((i: Investment) => i.id === id && i.userId === userId);

    if (!investment) {
      res.status(404).json({ error: 'Investment not found' });
      return;
    }

    const updatedInvestment = updateData('investments', id, {
      userId,
      accountName: accountName.trim(),
      accountType,
      investedAmount,
      currentValue
    });

    logger.info('Investment updated', { userId, investmentId: id });
    res.status(200).json(updatedInvestment);
  } catch (error) {
    logger.error('Failed to update investment', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to update investment' });
  }
});

// Delete an investment
router.delete('/:userId/:id', (req: Request, res: Response) => {
  try {
    const { userId, id } = req.params;
    logger.debug('Deleting investment', { userId, investmentId: id });

    const investments = readData('investments') as Investment[];
    const investment = investments.find((i: Investment) => i.id === id && i.userId === userId);

    if (!investment) {
      logger.warn('Delete investment failed: not found', { userId, investmentId: id });
      res.status(404).json({ error: 'Investment not found' });
      return;
    }

    deleteData('investments', id);
    logger.info('Investment deleted', { userId, investmentId: id });
    res.status(200).json({ message: 'Investment deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete investment', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to delete investment' });
  }
});

// ============ CONTRIBUTION LIMITS ENDPOINTS ============

// Get contribution limits for a user
router.get('/:userId/limits/all', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    logger.debug('Fetching contribution limits', { userId });
    const limits = readData('contributionLimits') as ContributionLimit[];
    const userLimits = limits.filter((l: ContributionLimit) => l.userId === userId);
    logger.info('Contribution limits fetched', { userId, count: userLimits.length });
    res.status(200).json(userLimits);
  } catch (error) {
    logger.error('Failed to fetch contribution limits', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to fetch contribution limits' });
  }
});

// Create contribution limit
router.post('/:userId/limits', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { year, accountType, limit } = req.body;

    // Validation
    const VALID_ACCOUNT_TYPES = ['RRSP', 'TFSA', 'FHSA', 'Savings'];
    if (!year || !accountType || limit === undefined) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    if (!VALID_ACCOUNT_TYPES.includes(accountType)) {
      res.status(400).json({ error: `Invalid accountType. Must be one of: ${VALID_ACCOUNT_TYPES.join(', ')}` });
      return;
    }
    if (typeof year !== 'number' || year < 2000 || year > 2100) {
      res.status(400).json({ error: 'Year must be a valid number between 2000 and 2100' });
      return;
    }
    if (typeof limit !== 'number' || limit < 0) {
      res.status(400).json({ error: 'Limit must be a non-negative number' });
      return;
    }

    const newLimit = appendData('contributionLimits', {
      userId,
      year,
      accountType,
      limit
    });

    logger.info('Contribution limit created', { userId, limitId: newLimit.id, year, accountType });
    res.status(201).json(newLimit);
  } catch (error) {
    logger.error('Failed to create contribution limit', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to create contribution limit' });
  }
});

// Update contribution limit
router.put('/:userId/limits/:id', (req: Request, res: Response) => {
  try {
    const { userId, id } = req.params;
    const { year, accountType, limit } = req.body;

    // Validation
    const VALID_ACCOUNT_TYPES = ['RRSP', 'TFSA', 'FHSA', 'Savings'];
    if (!year || !accountType || limit === undefined) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    if (!VALID_ACCOUNT_TYPES.includes(accountType)) {
      res.status(400).json({ error: `Invalid accountType. Must be one of: ${VALID_ACCOUNT_TYPES.join(', ')}` });
      return;
    }
    if (typeof year !== 'number' || year < 2000 || year > 2100) {
      res.status(400).json({ error: 'Year must be a valid number between 2000 and 2100' });
      return;
    }
    if (typeof limit !== 'number' || limit < 0) {
      res.status(400).json({ error: 'Limit must be a non-negative number' });
      return;
    }

    const limits = readData('contributionLimits') as ContributionLimit[];
    const existing = limits.find((l: ContributionLimit) => l.id === id && l.userId === userId);

    if (!existing) {
      res.status(404).json({ error: 'Contribution limit not found' });
      return;
    }

    const updatedLimit = updateData('contributionLimits', id, {
      userId,
      year,
      accountType,
      limit
    });

    logger.info('Contribution limit updated', { userId, limitId: id });
    res.status(200).json(updatedLimit);
  } catch (error) {
    logger.error('Failed to update contribution limit', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to update contribution limit' });
  }
});

// Delete contribution limit
router.delete('/:userId/limits/:id', (req: Request, res: Response) => {
  try {
    const { userId, id } = req.params;
    logger.debug('Deleting contribution limit', { userId, limitId: id });

    const limits = readData('contributionLimits') as ContributionLimit[];
    const existing = limits.find((l: ContributionLimit) => l.id === id && l.userId === userId);

    if (!existing) {
      logger.warn('Delete contribution limit failed: not found', { userId, limitId: id });
      res.status(404).json({ error: 'Contribution limit not found' });
      return;
    }

    deleteData('contributionLimits', id);
    logger.info('Contribution limit deleted', { userId, limitId: id });
    res.status(200).json({ message: 'Contribution limit deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete contribution limit', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to delete contribution limit' });
  }
});

// ============ TRANSACTIONS ENDPOINTS ============

// Get all transactions for a user
router.get('/:userId/transactions/all', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    logger.debug('Fetching transactions', { userId });
    const transactions = readData('investmentTransactions') as InvestmentTransaction[];
    const userTransactions = transactions.filter((t: InvestmentTransaction) => t.userId === userId);
    logger.info('Transactions fetched', { userId, count: userTransactions.length });
    res.status(200).json(userTransactions);
  } catch (error) {
    logger.error('Failed to fetch transactions', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Create transaction
router.post('/:userId/transactions', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { amount, date, accountId } = req.body;
    logger.debug('Creating transaction', { userId, accountId, amount });

    // Validation
    if (!amount || !date || !accountId) {
      logger.warn('Create transaction failed: missing fields', { userId });
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    if (typeof amount !== 'number' || amount === 0) {
      res.status(400).json({ error: 'Amount must be a non-zero number' });
      return;
    }
    // Validate date is ISO 8601 format
    if (typeof date !== 'string' || !date.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/)) {
      res.status(400).json({ error: 'Date must be in ISO 8601 format (e.g., 2024-01-15T10:30:00Z)' });
      return;
    }
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      res.status(400).json({ error: 'Date is not a valid date' });
      return;
    }
    if (typeof accountId !== 'string' || accountId.trim() === '') {
      res.status(400).json({ error: 'Account ID must be a non-empty string' });
      return;
    }

    // Verify that the investment account exists for this user
    const investments = readData('investments') as Investment[];
    const investment = investments.find((i: Investment) => i.id === accountId && i.userId === userId);
    if (!investment) {
      res.status(404).json({ error: 'Investment account not found' });
      return;
    }

    const newTransaction = appendData('investmentTransactions', {
      userId,
      amount,
      date,
      accountId
    });

    // Re-read the investment to get the latest data
    const currentInvestments = readData('investments') as Investment[];
    const currentInvestment = currentInvestments.find((i: Investment) => i.id === accountId && i.userId === userId);
    
    if (!currentInvestment) {
      logger.error('Investment not found after transaction creation', { userId, accountId });
      res.status(201).json({
        transaction: newTransaction,
        updatedInvestment: null
      });
      return;
    }

    // Update the account's invested amount and current value (keeping growth % same)
    // Example: invested=5000, current=5500, growth=10%
    // Add 1000 -> new invested=6000, new current=6000 * 1.10 = 6600
    const growthPercentage = currentInvestment.investedAmount > 0 
      ? ((currentInvestment.currentValue - currentInvestment.investedAmount) / currentInvestment.investedAmount) 
      : 0;
    
    const newInvestedAmount = currentInvestment.investedAmount + amount;
    const newCurrentValue = newInvestedAmount * (1 + growthPercentage);
    
    logger.debug('Updating investment after transaction', {
      accountId,
      oldInvested: currentInvestment.investedAmount,
      oldCurrent: currentInvestment.currentValue,
      growthPercentage: (growthPercentage * 100).toFixed(2) + '%',
      transactionAmount: amount,
      newInvested: newInvestedAmount,
      newCurrent: newCurrentValue
    });
    
    try {
      const updatedInvestment = updateData('investments', accountId, {
        investedAmount: newInvestedAmount,
        currentValue: newCurrentValue
      });
      
      logger.info('Transaction created and investment updated', { userId, transactionId: newTransaction.id, accountId });

      // Return both the transaction and updated investment
      res.status(201).json({
        transaction: newTransaction,
        updatedInvestment: updatedInvestment
      });
    } catch (updateError) {
      logger.error('Error updating investment after transaction', { error: (updateError as Error).message });
      res.status(201).json({
        transaction: newTransaction,
        updatedInvestment: null
      });
    }
  } catch (error) {
    logger.error('Failed to create transaction', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Delete transaction
router.delete('/:userId/transactions/:id', (req: Request, res: Response) => {
  try {
    const { userId, id } = req.params;
    logger.debug('Deleting transaction', { userId, transactionId: id });

    const transactions = readData('investmentTransactions') as InvestmentTransaction[];
    const transaction = transactions.find((t: InvestmentTransaction) => t.id === id && t.userId === userId);

    if (!transaction) {
      logger.warn('Delete transaction failed: not found', { userId, transactionId: id });
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    deleteData('investmentTransactions', id);
    logger.info('Transaction deleted', { userId, transactionId: id });
    res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete transaction', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// ============ CONTRIBUTION STATUS ENDPOINTS ============

// Get contribution status for a user (calculate used from transactions by year)
router.get('/:userId/limits/status', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();

    // Validate year
    if (isNaN(year) || year < 2000 || year > 2100) {
      res.status(400).json({ error: 'Invalid year parameter' });
      return;
    }

    // Get contribution limits for this user and year
    const limits = readData('contributionLimits') as ContributionLimit[];
    const yearLimits = limits.filter((l: ContributionLimit) => l.userId === userId && l.year === year);

    // Get investments for this user (to map accountId to accountType)
    const investments = readData('investments') as Investment[];
    const userInvestments = investments.filter((i: Investment) => i.userId === userId);

    // Get transactions for this user
    const transactions = readData('investmentTransactions') as InvestmentTransaction[];
    const userTransactions = transactions.filter((t: InvestmentTransaction) => t.userId === userId);

    // Calculate used amounts by account type from transactions in the selected year
    const result = yearLimits.map((limit: ContributionLimit) => {
      // Get all accounts of this type
      const accountsOfType = userInvestments.filter((i: Investment) => i.accountType === limit.accountType);
      const accountIds = accountsOfType.map((i: Investment) => i.id);
      
      // Sum all transactions for these accounts in the selected year
      const used = userTransactions
        .filter((t: InvestmentTransaction) => {
          const transactionDate = new Date(t.date);
          const transactionYear = transactionDate.getFullYear();
          return accountIds.includes(t.accountId) && transactionYear === year;
        })
        .reduce((sum: number, t: InvestmentTransaction) => sum + t.amount, 0);

      return {
        accountType: limit.accountType,
        limit: limit.limit,
        used,
        remaining: Math.max(0, limit.limit - used)
      };
    });

    logger.debug('Contribution status retrieved', { userId, year, accountTypes: result.length });
    res.status(200).json(result);
  } catch (error) {
    logger.error('Failed to fetch contribution status', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to fetch contribution status' });
  }
});

// Get investment summary by account type
router.get('/:userId/aggregates/by-account-type', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const investments = readData('investments') as Investment[];
    const userInvestments = investments.filter((i: Investment) => i.userId === userId);

    // Group by account type
    const accountTypeData: { [key: string]: { accountType: string; totalInvested: number; totalValue: number; count: number; growth: number; growthPercentage: number } } = {};
    
    userInvestments.forEach((investment: Investment) => {
      if (!accountTypeData[investment.accountType]) {
        accountTypeData[investment.accountType] = {
          accountType: investment.accountType,
          totalInvested: 0,
          totalValue: 0,
          count: 0,
          growth: 0,
          growthPercentage: 0
        };
      }
      
      accountTypeData[investment.accountType].totalInvested += investment.investedAmount;
      accountTypeData[investment.accountType].totalValue += investment.currentValue;
      accountTypeData[investment.accountType].count++;
    });

    // Calculate growth for each account type
    Object.values(accountTypeData).forEach(data => {
      data.growth = data.totalValue - data.totalInvested;
      data.growthPercentage = data.totalInvested > 0 
        ? ((data.totalValue - data.totalInvested) / data.totalInvested) * 100 
        : 0;
    });

    const result = Object.values(accountTypeData);
    logger.debug('Investment aggregates by account type retrieved', { userId, count: result.length });
    res.status(200).json(result);
  } catch (error) {
    logger.error('Failed to get investment aggregates by account type', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to get investment aggregates' });
  }
});

// Get overall investment summary
router.get('/:userId/summary', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const investments = readData('investments') as Investment[];
    const userInvestments = investments.filter((i: Investment) => i.userId === userId);

    const totalInvested = userInvestments.reduce((sum, inv) => sum + inv.investedAmount, 0);
    const totalValue = userInvestments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const count = userInvestments.length;
    const growth = totalValue - totalInvested;
    const growthPercentage = totalInvested > 0 ? (growth / totalInvested) * 100 : 0;

    // Get breakdown by account type
    const byAccountType: { [key: string]: { invested: number; value: number } } = {};
    userInvestments.forEach((investment: Investment) => {
      if (!byAccountType[investment.accountType]) {
        byAccountType[investment.accountType] = { invested: 0, value: 0 };
      }
      byAccountType[investment.accountType].invested += investment.investedAmount;
      byAccountType[investment.accountType].value += investment.currentValue;
    });

    logger.debug('Investment summary retrieved', { userId, totalInvested, totalValue, count });
    res.status(200).json({
      totalInvested,
      totalValue,
      count,
      growth,
      growthPercentage,
      byAccountType
    });
  } catch (error) {
    logger.error('Failed to get investment summary', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to get investment summary' });
  }
});

export default router;

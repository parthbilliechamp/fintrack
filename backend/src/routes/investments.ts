import { Router, Request, Response } from 'express';
import { Investment, ContributionLimit, InvestmentTransaction } from '../database/models';
import logger from '../logger';

const router = Router();

// ============ INVESTMENT ACCOUNT ENDPOINTS ============

// Get all investments for a user
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    logger.debug('Fetching investments', { userId });
    const userInvestments = await Investment.find({ userId });
    logger.info('Investments fetched', { userId, count: userInvestments.length });
    res.status(200).json(userInvestments);
  } catch (error) {
    logger.error('Failed to fetch investments', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to fetch investments' });
  }
});

// Get investment by id
router.get('/:userId/:id', async (req: Request, res: Response) => {
  try {
    const { userId, id } = req.params;
    logger.debug('Fetching investment by id', { userId, investmentId: id });
    const investment = await Investment.findOne({ _id: id, userId });

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
router.post('/:userId', async (req: Request, res: Response) => {
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

    const newInvestment = new Investment({
      userId,
      accountName: accountName.trim(),
      accountType,
      investedAmount,
      currentValue
    });
    await newInvestment.save();

    logger.info('Investment created', { userId, investmentId: newInvestment._id, accountType });
    res.status(201).json(newInvestment);
  } catch (error) {
    logger.error('Failed to create investment', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to create investment' });
  }
});

// Update an investment
router.put('/:userId/:id', async (req: Request, res: Response) => {
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

    const updatedInvestment = await Investment.findOneAndUpdate(
      { _id: id, userId },
      {
        accountName: accountName.trim(),
        accountType,
        investedAmount,
        currentValue
      },
      { new: true }
    );

    if (!updatedInvestment) {
      res.status(404).json({ error: 'Investment not found' });
      return;
    }

    logger.info('Investment updated', { userId, investmentId: id });
    res.status(200).json(updatedInvestment);
  } catch (error) {
    logger.error('Failed to update investment', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to update investment' });
  }
});

// Delete an investment
router.delete('/:userId/:id', async (req: Request, res: Response) => {
  try {
    const { userId, id } = req.params;
    logger.debug('Deleting investment', { userId, investmentId: id });

    const deletedInvestment = await Investment.findOneAndDelete({ _id: id, userId });

    if (!deletedInvestment) {
      logger.warn('Delete investment failed: not found', { userId, investmentId: id });
      res.status(404).json({ error: 'Investment not found' });
      return;
    }

    // Also delete related transactions
    await InvestmentTransaction.deleteMany({ accountId: id });

    logger.info('Investment deleted', { userId, investmentId: id });
    res.status(200).json({ message: 'Investment deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete investment', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to delete investment' });
  }
});

// ============ CONTRIBUTION LIMITS ENDPOINTS ============

// Get contribution limits for a user
router.get('/:userId/limits/all', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    logger.debug('Fetching contribution limits', { userId });
    const userLimits = await ContributionLimit.find({ userId });
    logger.info('Contribution limits fetched', { userId, count: userLimits.length });
    res.status(200).json(userLimits);
  } catch (error) {
    logger.error('Failed to fetch contribution limits', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to fetch contribution limits' });
  }
});

// Create contribution limit
router.post('/:userId/limits', async (req: Request, res: Response) => {
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

    const newLimit = new ContributionLimit({
      userId,
      year,
      accountType,
      limit
    });
    await newLimit.save();

    logger.info('Contribution limit created', { userId, limitId: newLimit._id, year, accountType });
    res.status(201).json(newLimit);
  } catch (error: any) {
    // Handle duplicate key error
    if (error.code === 11000) {
      res.status(409).json({ error: 'Contribution limit for this year and account type already exists' });
      return;
    }
    logger.error('Failed to create contribution limit', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to create contribution limit' });
  }
});

// Update contribution limit
router.put('/:userId/limits/:id', async (req: Request, res: Response) => {
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

    const updatedLimit = await ContributionLimit.findOneAndUpdate(
      { _id: id, userId },
      { year, accountType, limit },
      { new: true }
    );

    if (!updatedLimit) {
      res.status(404).json({ error: 'Contribution limit not found' });
      return;
    }

    logger.info('Contribution limit updated', { userId, limitId: id });
    res.status(200).json(updatedLimit);
  } catch (error) {
    logger.error('Failed to update contribution limit', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to update contribution limit' });
  }
});

// Delete contribution limit
router.delete('/:userId/limits/:id', async (req: Request, res: Response) => {
  try {
    const { userId, id } = req.params;
    logger.debug('Deleting contribution limit', { userId, limitId: id });

    const deletedLimit = await ContributionLimit.findOneAndDelete({ _id: id, userId });

    if (!deletedLimit) {
      logger.warn('Delete contribution limit failed: not found', { userId, limitId: id });
      res.status(404).json({ error: 'Contribution limit not found' });
      return;
    }

    logger.info('Contribution limit deleted', { userId, limitId: id });
    res.status(200).json({ message: 'Contribution limit deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete contribution limit', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to delete contribution limit' });
  }
});

// ============ TRANSACTIONS ENDPOINTS ============

// Get all transactions for a user
router.get('/:userId/transactions/all', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    logger.debug('Fetching transactions', { userId });
    const userTransactions = await InvestmentTransaction.find({ userId }).sort({ date: -1 });
    logger.info('Transactions fetched', { userId, count: userTransactions.length });
    res.status(200).json(userTransactions);
  } catch (error) {
    logger.error('Failed to fetch transactions', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Create transaction
router.post('/:userId/transactions', async (req: Request, res: Response) => {
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
    const investment = await Investment.findOne({ _id: accountId, userId });
    if (!investment) {
      res.status(404).json({ error: 'Investment account not found' });
      return;
    }

    // Create the transaction
    const newTransaction = new InvestmentTransaction({
      userId,
      amount,
      date: dateObj,
      accountId
    });
    await newTransaction.save();

    // Update the account's invested amount and current value (keeping growth % same)
    const growthPercentage = investment.investedAmount > 0 
      ? ((investment.currentValue - investment.investedAmount) / investment.investedAmount) 
      : 0;
    
    const newInvestedAmount = investment.investedAmount + amount;
    const newCurrentValue = newInvestedAmount * (1 + growthPercentage);
    
    logger.debug('Updating investment after transaction', {
      accountId,
      oldInvested: investment.investedAmount,
      oldCurrent: investment.currentValue,
      growthPercentage: (growthPercentage * 100).toFixed(2) + '%',
      transactionAmount: amount,
      newInvested: newInvestedAmount,
      newCurrent: newCurrentValue
    });

    const updatedInvestment = await Investment.findByIdAndUpdate(
      accountId,
      {
        investedAmount: newInvestedAmount,
        currentValue: newCurrentValue
      },
      { new: true }
    );

    logger.info('Transaction created and investment updated', { userId, transactionId: newTransaction._id, accountId });

    res.status(201).json({
      transaction: newTransaction,
      updatedInvestment: updatedInvestment
    });
  } catch (error) {
    logger.error('Failed to create transaction', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Delete transaction
router.delete('/:userId/transactions/:id', async (req: Request, res: Response) => {
  try {
    const { userId, id } = req.params;
    logger.debug('Deleting transaction', { userId, transactionId: id });

    const deletedTransaction = await InvestmentTransaction.findOneAndDelete({ _id: id, userId });

    if (!deletedTransaction) {
      logger.warn('Delete transaction failed: not found', { userId, transactionId: id });
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    logger.info('Transaction deleted', { userId, transactionId: id });
    res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete transaction', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// ============ CONTRIBUTION STATUS ENDPOINTS ============

// Get contribution status for a user (calculate used from total invested amounts)
router.get('/:userId/limits/status', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();

    // Validate year
    if (isNaN(year) || year < 2000 || year > 2100) {
      res.status(400).json({ error: 'Invalid year parameter' });
      return;
    }

    // Define all account types that have contribution limits
    const accountTypesWithLimits = ['RRSP', 'TFSA', 'FHSA'];

    // Get contribution limits for this user and year
    const yearLimits = await ContributionLimit.find({ userId, year });

    // Get investments for this user and calculate total invested by account type
    const userInvestments = await Investment.find({ userId });

    // Calculate used amounts for all account types with limits
    // "Used" is the total investedAmount across all investments of that account type
    const result = accountTypesWithLimits.map(accountType => {
      // Get the limit for this account type (if set)
      const existingLimit = yearLimits.find(l => l.accountType === accountType);
      const limit = existingLimit ? existingLimit.limit : 0;
      
      // Get all accounts of this type and sum their invested amounts
      const accountsOfType = userInvestments.filter(inv => inv.accountType === accountType);
      const used = accountsOfType.reduce((sum, inv) => sum + inv.investedAmount, 0);

      return {
        accountType,
        limit,
        used,
        remaining: limit > 0 ? Math.max(0, limit - used) : 0
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
router.get('/:userId/aggregates/by-account-type', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await Investment.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$accountType',
          totalInvested: { $sum: '$investedAmount' },
          totalValue: { $sum: '$currentValue' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          accountType: '$_id',
          totalInvested: 1,
          totalValue: 1,
          count: 1,
          growth: { $subtract: ['$totalValue', '$totalInvested'] },
          growthPercentage: {
            $cond: [
              { $eq: ['$totalInvested', 0] },
              0,
              { $multiply: [{ $divide: [{ $subtract: ['$totalValue', '$totalInvested'] }, '$totalInvested'] }, 100] }
            ]
          }
        }
      }
    ]);

    logger.debug('Investment aggregates by account type retrieved', { userId, count: result.length });
    res.status(200).json(result);
  } catch (error) {
    logger.error('Failed to get investment aggregates by account type', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to get investment aggregates' });
  }
});

// Get overall investment summary
router.get('/:userId/summary', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const [summaryResult, byAccountTypeResult] = await Promise.all([
      Investment.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalInvested: { $sum: '$investedAmount' },
            totalValue: { $sum: '$currentValue' },
            count: { $sum: 1 }
          }
        }
      ]),
      Investment.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$accountType',
            invested: { $sum: '$investedAmount' },
            value: { $sum: '$currentValue' }
          }
        }
      ])
    ]);

    const summary = summaryResult[0] || { totalInvested: 0, totalValue: 0, count: 0 };
    const growth = summary.totalValue - summary.totalInvested;
    const growthPercentage = summary.totalInvested > 0 ? (growth / summary.totalInvested) * 100 : 0;

    const byAccountType: { [key: string]: { invested: number; value: number } } = {};
    byAccountTypeResult.forEach((item: any) => {
      byAccountType[item._id] = { invested: item.invested, value: item.value };
    });

    logger.debug('Investment summary retrieved', { userId, totalInvested: summary.totalInvested, totalValue: summary.totalValue, count: summary.count });
    res.status(200).json({
      totalInvested: summary.totalInvested,
      totalValue: summary.totalValue,
      count: summary.count,
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

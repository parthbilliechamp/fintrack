import { Router, Request, Response } from 'express';
import { Expense } from '../database/models';
import logger from '../logger';

const router = Router();

// Get monthly aggregates for a user (MUST be before /:userId/:id route)
router.get('/:userId/aggregates/monthly', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { year, month } = req.query;
    
    // Build date filter
    const dateFilter: any = {};
    if (year) {
      const yearNum = parseInt(year as string);
      dateFilter.$gte = new Date(yearNum, month ? parseInt(month as string) : 0, 1);
      dateFilter.$lt = month 
        ? new Date(yearNum, parseInt(month as string) + 1, 1)
        : new Date(yearNum + 1, 0, 1);
    } else if (month) {
      const currentYear = new Date().getFullYear();
      const monthNum = parseInt(month as string);
      dateFilter.$gte = new Date(currentYear, monthNum, 1);
      dateFilter.$lt = new Date(currentYear, monthNum + 1, 1);
    }

    const matchStage: any = { userId };
    if (Object.keys(dateFilter).length > 0) {
      matchStage.date = dateFilter;
    }

    const result = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $cond: [{ $lt: ['$_id.month', 10] }, { $concat: ['0', { $toString: '$_id.month' }] }, { $toString: '$_id.month' }] }
            ]
          },
          total: 1,
          count: 1
        }
      },
      { $sort: { month: 1 } }
    ]);

    logger.debug('Monthly aggregates retrieved', { userId, count: result.length });
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error getting monthly aggregates', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to get monthly aggregates' });
  }
});

// Get category aggregates for a user (MUST be before /:userId/:id route)
router.get('/:userId/aggregates/category', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { year, month } = req.query;
    
    // Build date filter
    const dateFilter: any = {};
    if (year) {
      const yearNum = parseInt(year as string);
      dateFilter.$gte = new Date(yearNum, month ? parseInt(month as string) : 0, 1);
      dateFilter.$lt = month 
        ? new Date(yearNum, parseInt(month as string) + 1, 1)
        : new Date(yearNum + 1, 0, 1);
    } else if (month) {
      const currentYear = new Date().getFullYear();
      const monthNum = parseInt(month as string);
      dateFilter.$gte = new Date(currentYear, monthNum, 1);
      dateFilter.$lt = new Date(currentYear, monthNum + 1, 1);
    }

    const matchStage: any = { userId };
    if (Object.keys(dateFilter).length > 0) {
      matchStage.date = dateFilter;
    }

    const result = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          total: 1,
          count: 1
        }
      }
    ]);

    logger.debug('Category aggregates retrieved', { userId, count: result.length });
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error getting category aggregates', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to get category aggregates' });
  }
});

// Get expense summary (totals, averages, etc.) (MUST be before /:userId/:id route)
router.get('/:userId/summary', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { year, month } = req.query;
    
    // Build date filter
    const dateFilter: any = {};
    if (year) {
      const yearNum = parseInt(year as string);
      dateFilter.$gte = new Date(yearNum, month ? parseInt(month as string) : 0, 1);
      dateFilter.$lt = month 
        ? new Date(yearNum, parseInt(month as string) + 1, 1)
        : new Date(yearNum + 1, 0, 1);
    } else if (month) {
      const currentYear = new Date().getFullYear();
      const monthNum = parseInt(month as string);
      dateFilter.$gte = new Date(currentYear, monthNum, 1);
      dateFilter.$lt = new Date(currentYear, monthNum + 1, 1);
    }

    const matchStage: any = { userId };
    if (Object.keys(dateFilter).length > 0) {
      matchStage.date = dateFilter;
    }

    // Get summary with category breakdown
    const [summaryResult, categoryResult] = await Promise.all([
      Expense.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            average: { $avg: '$amount' }
          }
        }
      ]),
      Expense.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' }
          }
        }
      ])
    ]);

    const summary = summaryResult[0] || { total: 0, count: 0, average: 0 };
    const byCategory: { [key: string]: number } = {};
    categoryResult.forEach((cat: any) => {
      byCategory[cat._id] = cat.total;
    });

    logger.debug('Expense summary retrieved', { userId, total: summary.total, count: summary.count });
    res.status(200).json({
      total: summary.total,
      count: summary.count,
      average: summary.average || 0,
      byCategory
    });
  } catch (error) {
    logger.error('Error getting expense summary', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to get expense summary' });
  }
});

// Get all expenses for a user
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    logger.debug('Fetching expenses', { userId });
    const userExpenses = await Expense.find({ userId }).sort({ date: -1 });
    logger.info('Expenses fetched', { userId, count: userExpenses.length });
    res.status(200).json(userExpenses);
  } catch (error) {
    logger.error('Failed to fetch expenses', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Get expense by id
router.get('/:userId/:id', async (req: Request, res: Response) => {
  try {
    const { userId, id } = req.params;
    logger.debug('Fetching expense by id', { userId, expenseId: id });
    const expense = await Expense.findOne({ _id: id, userId });

    if (!expense) {
      logger.warn('Expense not found', { userId, expenseId: id });
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    logger.debug('Expense retrieved', { userId, expenseId: id });
    res.status(200).json(expense);
  } catch (error) {
    logger.error('Failed to fetch expense', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// Create a new expense
router.post('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { category, details, date, amount } = req.body;
    logger.debug('Creating expense', { userId, category, amount });

    // Validation
    if (!category || !details || !date || amount === undefined) {
      logger.warn('Create expense failed: missing fields', { userId });
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Validate category
    if (!['Dine', 'Grocery', 'Personal'].includes(category)) {
      res.status(400).json({ error: 'Invalid category. Must be one of: Dine, Grocery, Personal' });
      return;
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ error: 'Amount must be a positive number' });
      return;
    }

    // Validate date format (ISO string)
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      res.status(400).json({ error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)' });
      return;
    }

    // Validate details is not empty
    if (typeof details !== 'string' || details.trim().length === 0) {
      res.status(400).json({ error: 'Details cannot be empty' });
      return;
    }

    const newExpense = new Expense({
      userId,
      category,
      details,
      date: dateObj,
      amount
    });
    await newExpense.save();

    logger.info('Expense created', { userId, expenseId: newExpense._id, category, amount });
    res.status(201).json(newExpense);
  } catch (error) {
    logger.error('Failed to create expense', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Update an expense
router.put('/:userId/:id', async (req: Request, res: Response) => {
  try {
    const { userId, id } = req.params;
    const { category, details, date, amount } = req.body;
    logger.debug('Updating expense', { userId, expenseId: id });

    // Validation
    if (!category || !details || !date || amount === undefined) {
      logger.warn('Update expense failed: missing fields', { userId, expenseId: id });
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Validate category
    if (!['Dine', 'Grocery', 'Personal'].includes(category)) {
      res.status(400).json({ error: 'Invalid category. Must be one of: Dine, Grocery, Personal' });
      return;
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ error: 'Amount must be a positive number' });
      return;
    }

    // Validate date format
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      res.status(400).json({ error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)' });
      return;
    }

    // Validate details is not empty
    if (typeof details !== 'string' || details.trim().length === 0) {
      res.status(400).json({ error: 'Details cannot be empty' });
      return;
    }

    const updatedExpense = await Expense.findOneAndUpdate(
      { _id: id, userId },
      { category, details, date: dateObj, amount },
      { new: true }
    );

    if (!updatedExpense) {
      logger.warn('Update expense failed: not found', { userId, expenseId: id });
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    logger.info('Expense updated', { userId, expenseId: id });
    res.status(200).json(updatedExpense);
  } catch (error) {
    logger.error('Failed to update expense', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete an expense
router.delete('/:userId/:id', async (req: Request, res: Response) => {
  try {
    const { userId, id } = req.params;
    logger.debug('Deleting expense', { userId, expenseId: id });

    const deletedExpense = await Expense.findOneAndDelete({ _id: id, userId });

    if (!deletedExpense) {
      logger.warn('Delete expense failed: not found', { userId, expenseId: id });
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    logger.info('Expense deleted', { userId, expenseId: id });
    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete expense', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;

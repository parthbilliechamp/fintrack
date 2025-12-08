import { Router, Request, Response } from 'express';
import { readData, appendData, updateData, deleteData } from '../storage';

const router = Router();

interface Expense {
  id: string;
  userId: string;
  category: 'Dine' | 'Grocery' | 'Personal';
  details: string;
  date: string;
  amount: number;
}

// Get monthly aggregates for a user (MUST be before /:userId/:id route)
router.get('/:userId/aggregates/monthly', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { year, month } = req.query;
    
    const expenses = readData('expenses') as Expense[];
    let userExpenses = expenses.filter((e: Expense) => e.userId === userId);

    // Filter by year and month if provided
    if (year || month) {
      userExpenses = userExpenses.filter((expense: Expense) => {
        const expenseDate = new Date(expense.date);
        const matchesYear = !year || expenseDate.getFullYear() === parseInt(year as string);
        const matchesMonth = !month || expenseDate.getMonth() === parseInt(month as string);
        return matchesYear && matchesMonth;
      });
    }

    // Group by month
    const monthlyData: { [key: string]: { month: string; total: number; count: number } } = {};
    
    userExpenses.forEach((expense: Expense) => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          total: 0,
          count: 0
        };
      }
      
      monthlyData[monthKey].total += expense.amount;
      monthlyData[monthKey].count++;
    });

    const result = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting monthly aggregates:', error);
    res.status(500).json({ error: 'Failed to get monthly aggregates' });
  }
});

// Get category aggregates for a user (MUST be before /:userId/:id route)
router.get('/:userId/aggregates/category', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { year, month } = req.query;
    
    const expenses = readData('expenses') as Expense[];
    let userExpenses = expenses.filter((e: Expense) => e.userId === userId);

    // Filter by year and month if provided
    if (year || month) {
      userExpenses = userExpenses.filter((expense: Expense) => {
        const expenseDate = new Date(expense.date);
        const matchesYear = !year || expenseDate.getFullYear() === parseInt(year as string);
        const matchesMonth = !month || expenseDate.getMonth() === parseInt(month as string);
        return matchesYear && matchesMonth;
      });
    }

    // Group by category
    const categoryData: { [key: string]: { category: string; total: number; count: number } } = {};
    
    userExpenses.forEach((expense: Expense) => {
      if (!categoryData[expense.category]) {
        categoryData[expense.category] = {
          category: expense.category,
          total: 0,
          count: 0
        };
      }
      
      categoryData[expense.category].total += expense.amount;
      categoryData[expense.category].count++;
    });

    const result = Object.values(categoryData);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting category aggregates:', error);
    res.status(500).json({ error: 'Failed to get category aggregates' });
  }
});

// Get expense summary (totals, averages, etc.) (MUST be before /:userId/:id route)
router.get('/:userId/summary', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { year, month } = req.query;
    
    const expenses = readData('expenses') as Expense[];
    let userExpenses = expenses.filter((e: Expense) => e.userId === userId);

    // Filter by year and month if provided
    if (year || month) {
      userExpenses = userExpenses.filter((expense: Expense) => {
        const expenseDate = new Date(expense.date);
        const matchesYear = !year || expenseDate.getFullYear() === parseInt(year as string);
        const matchesMonth = !month || expenseDate.getMonth() === parseInt(month as string);
        return matchesYear && matchesMonth;
      });
    }

    const total = userExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const count = userExpenses.length;
    const average = count > 0 ? total / count : 0;

    // Get category breakdown
    const byCategory: { [key: string]: number } = {};
    userExpenses.forEach((expense: Expense) => {
      byCategory[expense.category] = (byCategory[expense.category] || 0) + expense.amount;
    });

    res.status(200).json({
      total,
      count,
      average,
      byCategory
    });
  } catch (error) {
    console.error('Error getting expense summary:', error);
    res.status(500).json({ error: 'Failed to get expense summary' });
  }
});

// Get all expenses for a user
router.get('/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const expenses = readData('expenses') as Expense[];
    const userExpenses = expenses.filter((e: Expense) => e.userId === userId);
    res.status(200).json(userExpenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Get expense by id
router.get('/:userId/:id', (req: Request, res: Response) => {
  try {
    const { userId, id } = req.params;
    const expenses = readData('expenses') as Expense[];
    const expense = expenses.find((e: Expense) => e.id === id && e.userId === userId);

    if (!expense) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    res.status(200).json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// Create a new expense
router.post('/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { category, details, date, amount } = req.body;

    // Validation
    if (!category || !details || !date || amount === undefined) {
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

    const newExpense = appendData('expenses', {
      userId,
      category,
      details,
      date, // Store as ISO string
      amount
    });

    res.status(201).json(newExpense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Update an expense
router.put('/:userId/:id', (req: Request, res: Response) => {
  try {
    const { userId, id } = req.params;
    const { category, details, date, amount } = req.body;

    // Validation
    if (!category || !details || !date || amount === undefined) {
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

    const expenses = readData('expenses') as Expense[];
    const expense = expenses.find((e: Expense) => e.id === id && e.userId === userId);

    if (!expense) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    const updatedExpense = updateData('expenses', id, {
      userId,
      category,
      details,
      date,
      amount
    });

    res.status(200).json(updatedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete an expense
router.delete('/:userId/:id', (req: Request, res: Response) => {
  try {
    const { userId, id } = req.params;

    const expenses = readData('expenses') as Expense[];
    const expense = expenses.find((e: Expense) => e.id === id && e.userId === userId);

    if (!expense) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    deleteData('expenses', id);
    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;

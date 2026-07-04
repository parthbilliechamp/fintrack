import { Router, Request, Response } from 'express';
import { FinancialPlan } from '../database/models';
import logger from '../logger';

const router = Router();

const PLAN_ID = 'default';

type PlanSection = 'salaryBreakdown' | 'monthlyInvestments' | 'etfAllocation' | 'monthlyExpenses';

const VALID_SECTIONS: PlanSection[] = [
  'salaryBreakdown',
  'monthlyInvestments',
  'etfAllocation',
  'monthlyExpenses'
];

interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value >= 0;
}

const SECTION_VALIDATORS: Record<PlanSection, (body: any) => ValidationResult> = {
  salaryBreakdown: (body) => {
    const { label, amount } = body;
    if (!isNonEmptyString(label)) return { valid: false, error: 'Label is required' };
    if (!isNonNegativeNumber(amount)) return { valid: false, error: 'Amount must be a non-negative number' };
    return { valid: true, data: { label: label.trim(), amount } };
  },
  monthlyInvestments: (body) => {
    const { label, monthlyAmount, rowType, category, subCategory, subSubCategory, contributionSource, sortOrder } = body;
    if (!isNonEmptyString(label)) return { valid: false, error: 'Label is required' };
    if (!isNonNegativeNumber(monthlyAmount)) return { valid: false, error: 'Monthly amount must be a non-negative number' };
    const data: Record<string, unknown> = { label: label.trim(), monthlyAmount };
    if (rowType) data.rowType = rowType;
    if (category) data.category = category.trim();
    if (subCategory) data.subCategory = subCategory.trim();
    if (subSubCategory) data.subSubCategory = subSubCategory.trim();
    if (contributionSource) data.contributionSource = contributionSource;
    if (typeof sortOrder === 'number') data.sortOrder = sortOrder;
    return { valid: true, data };
  },
  etfAllocation: (body) => {
    const { ticker, targetPercent, monthlyAmount, biweeklyAmount, rowType, accountCategory, accountSubCategory, sortOrder } = body;
    if (!isNonEmptyString(ticker)) return { valid: false, error: 'Ticker is required' };
    if (typeof targetPercent !== 'number' || isNaN(targetPercent) || targetPercent < 0 || targetPercent > 100) {
      return { valid: false, error: 'Target percent must be between 0 and 100' };
    }
    const resolvedBiweekly = typeof biweeklyAmount === 'number' ? biweeklyAmount : undefined;
    const resolvedMonthly = typeof monthlyAmount === 'number'
      ? monthlyAmount
      : resolvedBiweekly !== undefined
        ? resolvedBiweekly * 2
        : NaN;
    if (!isNonNegativeNumber(resolvedMonthly)) {
      return { valid: false, error: 'Monthly amount must be a non-negative number' };
    }
    const data: Record<string, unknown> = {
      ticker: ticker.trim(),
      targetPercent,
      monthlyAmount: resolvedMonthly,
      biweeklyAmount: resolvedBiweekly ?? resolvedMonthly / 2
    };
    if (rowType) data.rowType = rowType;
    if (accountCategory) data.accountCategory = accountCategory.trim();
    if (accountSubCategory) data.accountSubCategory = accountSubCategory.trim();
    if (typeof sortOrder === 'number') data.sortOrder = sortOrder;
    return { valid: true, data };
  },
  monthlyExpenses: (body) => {
    const { label, monthlyAmount } = body;
    if (!isNonEmptyString(label)) return { valid: false, error: 'Label is required' };
    if (!isNonNegativeNumber(monthlyAmount)) return { valid: false, error: 'Monthly amount must be a non-negative number' };
    return { valid: true, data: { label: label.trim(), monthlyAmount } };
  }
};

function isValidSection(section: string): section is PlanSection {
  return (VALID_SECTIONS as string[]).includes(section);
}

// Get the singleton financial plan
router.get('/', async (_req: Request, res: Response) => {
  try {
    logger.debug('Fetching financial plan');
    const plan = await FinancialPlan.findById(PLAN_ID);

    if (!plan) {
      logger.warn('Financial plan not found');
      res.status(404).json({ error: 'Financial plan not found' });
      return;
    }

    res.status(200).json(plan);
  } catch (error) {
    logger.error('Failed to fetch financial plan', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to fetch financial plan' });
  }
});

// Update top-level settings (currently biweekly income after tax)
router.put('/settings', async (req: Request, res: Response) => {
  try {
    const { biweeklyIncomeAfterTax } = req.body;

    if (!isNonNegativeNumber(biweeklyIncomeAfterTax)) {
      res.status(400).json({ error: 'Biweekly income after tax must be a non-negative number' });
      return;
    }

    const plan = await FinancialPlan.findByIdAndUpdate(
      PLAN_ID,
      { biweeklyIncomeAfterTax },
      { new: true, runValidators: true }
    );

    if (!plan) {
      res.status(404).json({ error: 'Financial plan not found' });
      return;
    }

    logger.info('Financial plan settings updated', { biweeklyIncomeAfterTax });
    res.status(200).json(plan);
  } catch (error) {
    logger.error('Failed to update financial plan settings', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to update financial plan settings' });
  }
});

// Add a new row to a section
router.post('/:section', async (req: Request, res: Response) => {
  try {
    const { section } = req.params;

    if (!isValidSection(section)) {
      res.status(400).json({ error: `Invalid section. Must be one of: ${VALID_SECTIONS.join(', ')}` });
      return;
    }

    const result = SECTION_VALIDATORS[section](req.body);
    if (!result.valid) {
      res.status(400).json({ error: result.error });
      return;
    }

    const plan = await FinancialPlan.findByIdAndUpdate(
      PLAN_ID,
      { $push: { [section]: result.data } },
      { new: true, runValidators: true }
    );

    if (!plan) {
      res.status(404).json({ error: 'Financial plan not found' });
      return;
    }

    logger.info('Financial plan row added', { section });
    res.status(201).json(plan);
  } catch (error) {
    logger.error('Failed to add financial plan row', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to add row' });
  }
});

// Update an existing row within a section
router.put('/:section/:itemId', async (req: Request, res: Response) => {
  try {
    const { section, itemId } = req.params;

    if (!isValidSection(section)) {
      res.status(400).json({ error: `Invalid section. Must be one of: ${VALID_SECTIONS.join(', ')}` });
      return;
    }

    const result = SECTION_VALIDATORS[section](req.body);
    if (!result.valid) {
      res.status(400).json({ error: result.error });
      return;
    }

    const setFields = Object.entries(result.data!).reduce((acc: Record<string, unknown>, [key, value]) => {
      acc[`${section}.$.${key}`] = value;
      return acc;
    }, {});

    const plan = await FinancialPlan.findOneAndUpdate(
      { _id: PLAN_ID, [`${section}._id`]: itemId },
      { $set: setFields },
      { new: true, runValidators: true }
    );

    if (!plan) {
      res.status(404).json({ error: 'Row not found' });
      return;
    }

    logger.info('Financial plan row updated', { section, itemId });
    res.status(200).json(plan);
  } catch (error) {
    logger.error('Failed to update financial plan row', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to update row' });
  }
});

// Delete a row within a section
router.delete('/:section/:itemId', async (req: Request, res: Response) => {
  try {
    const { section, itemId } = req.params;

    if (!isValidSection(section)) {
      res.status(400).json({ error: `Invalid section. Must be one of: ${VALID_SECTIONS.join(', ')}` });
      return;
    }

    const plan = await FinancialPlan.findByIdAndUpdate(
      PLAN_ID,
      { $pull: { [section]: { _id: itemId } } },
      { new: true }
    );

    if (!plan) {
      res.status(404).json({ error: 'Financial plan not found' });
      return;
    }

    logger.info('Financial plan row deleted', { section, itemId });
    res.status(200).json(plan);
  } catch (error) {
    logger.error('Failed to delete financial plan row', { error: (error as Error).message });
    res.status(500).json({ error: 'Failed to delete row' });
  }
});

export default router;

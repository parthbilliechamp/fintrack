import mongoose from 'mongoose';
import { FinancialPlan } from './models/FinancialPlan';
import logger from '../logger';

const PLAN_ID = 'default';
const COLLECTION_NAME = 'financialplans';
const PLAN_SECTIONS = ['salaryBreakdown', 'monthlyInvestments', 'etfAllocation', 'monthlyExpenses'] as const;

const rbcFundEtfs = (accountCategory: string, accountSubCategory: string, sortBase: number) => [
  { ticker: 'BLK CDN Equity Index', biweeklyAmount: 37.64, targetPercent: 0, monthlyAmount: 75.28, rowType: 'etf' as const, accountCategory, accountSubCategory, sortOrder: sortBase },
  { ticker: 'BLK US Equity Index', biweeklyAmount: 125.48, targetPercent: 0, monthlyAmount: 250.96, rowType: 'etf' as const, accountCategory, accountSubCategory, sortOrder: sortBase + 1 },
  { ticker: 'BLK INTL Equity Index', biweeklyAmount: 75.29, targetPercent: 0, monthlyAmount: 150.58, rowType: 'etf' as const, accountCategory, accountSubCategory, sortOrder: sortBase + 2 },
  { ticker: 'RBC Canadian Money Market Fund', biweeklyAmount: 12.55, targetPercent: 0, monthlyAmount: 25.10, rowType: 'etf' as const, accountCategory, accountSubCategory, sortOrder: sortBase + 3 },
];

/**
 * Canonical financial-plan reference data.
 * Salary items are biweekly; investment, ETF and expense items are monthly
 * (ETF biweekly amounts are stored explicitly; monthly = biweekly × 2).
 */
export const planData = {
  _id: PLAN_ID,
  biweeklyIncomeAfterTax: 3070,
  payPeriodsPerYear: 26,
  salaryBreakdown: [
    { label: 'RBC Investment RESSOP', amount: 251 },
    { label: 'RBC Investment DC Plan', amount: 251 },
    { label: 'Emergency Fund Cash', amount: 1075 },
    { label: 'Wealth Simple Investment', amount: 400 },
    { label: 'Monthly Expense', amount: 1450 }
  ],
  monthlyInvestments: [
    { label: 'Emergency Funds - Cash', monthlyAmount: 2150, rowType: 'category', category: 'Emergency Funds', sortOrder: 1 },
    { label: 'RBC Investments', monthlyAmount: 500, rowType: 'category', category: 'RBC Investments', sortOrder: 10 },
    { label: 'RESSOP', monthlyAmount: 0, rowType: 'subcategory', category: 'RBC Investments', subCategory: 'RESSOP', sortOrder: 11 },
    { label: 'TFSA', monthlyAmount: 0, rowType: 'account', category: 'RBC Investments', subCategory: 'RESSOP', subSubCategory: 'TFSA', contributionSource: 'personal', sortOrder: 12 },
    { label: 'RRSP', monthlyAmount: 250, rowType: 'account', category: 'RBC Investments', subCategory: 'RESSOP', subSubCategory: 'RRSP', contributionSource: 'personal', sortOrder: 13 },
    { label: 'DPSP', monthlyAmount: 125, rowType: 'account', category: 'RBC Investments', subCategory: 'RESSOP', subSubCategory: 'DPSP', contributionSource: 'dpsp', sortOrder: 14 },
    { label: 'DC Plan', monthlyAmount: 0, rowType: 'subcategory', category: 'RBC Investments', subCategory: 'DC Plan', sortOrder: 15 },
    { label: 'Employer', monthlyAmount: 250, rowType: 'account', category: 'RBC Investments', subCategory: 'DC Plan', subSubCategory: 'Employer', contributionSource: 'employer', sortOrder: 16 },
    { label: 'Contributor', monthlyAmount: 250, rowType: 'account', category: 'RBC Investments', subCategory: 'DC Plan', subSubCategory: 'Contributor', contributionSource: 'member', sortOrder: 17 },
    { label: 'Wealth Simple Investments', monthlyAmount: 800, rowType: 'category', category: 'Wealth Simple', sortOrder: 20 },
    { label: 'RRSP', monthlyAmount: 0, rowType: 'account', category: 'Wealth Simple', subCategory: 'RRSP', contributionSource: 'personal', sortOrder: 21 },
    { label: 'TFSA', monthlyAmount: 0, rowType: 'account', category: 'Wealth Simple', subCategory: 'TFSA', contributionSource: 'personal', sortOrder: 22 },
    { label: 'FHSA', monthlyAmount: 0, rowType: 'account', category: 'Wealth Simple', subCategory: 'FHSA', contributionSource: 'personal', sortOrder: 23 }
  ],
  etfAllocation: [
    { rowType: 'group', ticker: 'Wealth Simple', targetPercent: 0, monthlyAmount: 0, biweeklyAmount: 0, accountCategory: 'Wealth Simple', sortOrder: 100 },
    { ticker: 'VFV', biweeklyAmount: 148, targetPercent: 0, monthlyAmount: 296, rowType: 'etf', accountCategory: 'Wealth Simple', accountSubCategory: 'TFSA', sortOrder: 101 },
    { ticker: 'XEQT', biweeklyAmount: 180, targetPercent: 0, monthlyAmount: 360, rowType: 'etf', accountCategory: 'Wealth Simple', accountSubCategory: 'TFSA', sortOrder: 102 },
    { ticker: 'ZGLD', biweeklyAmount: 72, targetPercent: 0, monthlyAmount: 144, rowType: 'etf', accountCategory: 'Wealth Simple', accountSubCategory: 'TFSA', sortOrder: 103 },
    { rowType: 'group', ticker: 'RBC RESSOP — TFSA', targetPercent: 0, monthlyAmount: 0, biweeklyAmount: 0, accountCategory: 'RBC RESSOP', accountSubCategory: 'TFSA', sortOrder: 200 },
    ...rbcFundEtfs('RBC RESSOP', 'TFSA', 201),
    { ticker: 'RBC Shares', biweeklyAmount: 125.48, targetPercent: 0, monthlyAmount: 250.96, rowType: 'etf', accountCategory: 'RBC RESSOP', accountSubCategory: 'TFSA', sortOrder: 205 },
    { rowType: 'group', ticker: 'RBC DC Plan — Employer', targetPercent: 0, monthlyAmount: 0, biweeklyAmount: 0, accountCategory: 'RBC DC Plan', accountSubCategory: 'Employer', sortOrder: 300 },
    ...rbcFundEtfs('RBC DC Plan', 'Employer', 301),
    { rowType: 'group', ticker: 'RBC DC Plan — Contributor', targetPercent: 0, monthlyAmount: 0, biweeklyAmount: 0, accountCategory: 'RBC DC Plan', accountSubCategory: 'Contributor', sortOrder: 400 },
    ...rbcFundEtfs('RBC DC Plan', 'Contributor', 401)
  ],
  monthlyExpenses: [
    { label: 'Rent', monthlyAmount: 1400 },
    { label: 'Apple Subscription', monthlyAmount: 11 },
    { label: 'Gym', monthlyAmount: 125 },
    { label: 'Mobile', monthlyAmount: 65 },
    { label: 'Transport', monthlyAmount: 60 },
    { label: 'Electricity', monthlyAmount: 30 },
    { label: 'Tenant Insurance', monthlyAmount: 11 },
    { label: 'Money Home', monthlyAmount: 420 },
    { label: 'Uber Eats', monthlyAmount: 200 },
    { label: 'Grocery', monthlyAmount: 250 },
    { label: 'Personal Expense', monthlyAmount: 350 }
  ]
};

export const seedFinancialPlan = async (): Promise<void> => {
  try {
    const existing = await FinancialPlan.findById(PLAN_ID);
    if (existing) {
      logger.debug('Financial plan already seeded, skipping');
      return;
    }

    await FinancialPlan.create(planData);
    logger.info('Financial plan seeded successfully');
  } catch (error) {
    logger.error('Failed to seed financial plan', { error: (error as Error).message });
  }
};

/** Replace the singleton plan with canonical data (preserves _id, regenerates row ids). */
export const replaceFinancialPlanData = async (): Promise<void> => {
  try {
    await FinancialPlan.findByIdAndUpdate(
      PLAN_ID,
      {
        biweeklyIncomeAfterTax: planData.biweeklyIncomeAfterTax,
        payPeriodsPerYear: planData.payPeriodsPerYear,
        salaryBreakdown: planData.salaryBreakdown,
        monthlyInvestments: planData.monthlyInvestments,
        etfAllocation: planData.etfAllocation,
        monthlyExpenses: planData.monthlyExpenses
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    logger.info('Financial plan data replaced with canonical values');
  } catch (error) {
    logger.error('Failed to replace financial plan data', { error: (error as Error).message });
    throw error;
  }
};

export const repairFinancialPlanRowIds = async (): Promise<void> => {
  try {
    const db = mongoose.connection.db;
    if (!db) return;

    const raw = await db.collection(COLLECTION_NAME).findOne({ _id: PLAN_ID as any });
    if (!raw) return;

    const updates: Record<string, unknown> = {};
    let needsRepair = false;

    for (const section of PLAN_SECTIONS) {
      const items = (raw as any)[section];
      if (!Array.isArray(items)) continue;

      updates[section] = items.map((item: any) => {
        if (item && item._id) return item;
        needsRepair = true;
        return { ...item, _id: new mongoose.Types.ObjectId() };
      });
    }

    if (needsRepair) {
      await db.collection(COLLECTION_NAME).updateOne({ _id: PLAN_ID as any }, { $set: updates });
      logger.info('Repaired missing financial plan row ids');
    }
  } catch (error) {
    logger.error('Failed to repair financial plan row ids', { error: (error as Error).message });
  }
};

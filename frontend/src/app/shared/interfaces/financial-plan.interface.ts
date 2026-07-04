export type InvestmentRowType = 'category' | 'subcategory' | 'account';
export type EtfRowType = 'group' | 'etf';
export type ContributionSource = 'personal' | 'employer' | 'dpsp' | 'member';

export interface SalaryItem {
  id?: string;
  label: string;
  amount: number; // biweekly amount
}

export interface InvestmentItem {
  id?: string;
  label: string;
  monthlyAmount: number;
  rowType?: InvestmentRowType;
  category?: string;
  subCategory?: string;
  subSubCategory?: string;
  contributionSource?: ContributionSource;
  sortOrder?: number;
}

export interface EtfItem {
  id?: string;
  ticker: string;
  targetPercent: number;
  monthlyAmount: number;
  biweeklyAmount?: number;
  rowType?: EtfRowType;
  accountCategory?: string;
  accountSubCategory?: string;
  sortOrder?: number;
}

export interface ExpenseItem {
  id?: string;
  label: string;
  monthlyAmount: number;
}

export interface FinancialPlan {
  id?: string;
  biweeklyIncomeAfterTax: number;
  payPeriodsPerYear: number;
  salaryBreakdown: SalaryItem[];
  monthlyInvestments: InvestmentItem[];
  etfAllocation: EtfItem[];
  monthlyExpenses: ExpenseItem[];
}

export type PlanSection = 'salaryBreakdown' | 'monthlyInvestments' | 'etfAllocation' | 'monthlyExpenses';

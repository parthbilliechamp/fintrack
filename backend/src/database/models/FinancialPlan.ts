import mongoose, { Schema } from 'mongoose';

/**
 * FinancialPlan is a global singleton document (not user-scoped) that stores the
 * salary / investment / ETF / expense planning data. Amounts are stored in their
 * native frequency ('biweekly' or 'monthly'); the frontend derives the other
 * frequency using a 2-paychecks-per-month rule (monthly = biweekly × 2).
 */

export interface ISalaryItem {
  _id: mongoose.Types.ObjectId;
  label: string;
  amount: number; // biweekly amount
}

export interface IInvestmentItem {
  _id: mongoose.Types.ObjectId;
  label: string;
  monthlyAmount: number;
  rowType?: 'category' | 'subcategory' | 'account';
  category?: string;
  subCategory?: string;
  subSubCategory?: string;
  contributionSource?: 'personal' | 'employer' | 'dpsp' | 'member';
  sortOrder?: number;
}

export interface IEtfItem {
  _id: mongoose.Types.ObjectId;
  ticker: string;
  targetPercent: number;
  monthlyAmount: number;
  biweeklyAmount?: number;
  rowType?: 'group' | 'etf';
  accountCategory?: string;
  accountSubCategory?: string;
  sortOrder?: number;
}

export interface IExpenseItem {
  _id: mongoose.Types.ObjectId;
  label: string;
  monthlyAmount: number;
}

export interface IFinancialPlan {
  _id: string;
  biweeklyIncomeAfterTax: number;
  payPeriodsPerYear: number;
  salaryBreakdown: ISalaryItem[];
  monthlyInvestments: IInvestmentItem[];
  etfAllocation: IEtfItem[];
  monthlyExpenses: IExpenseItem[];
  createdAt: Date;
  updatedAt: Date;
}

const salaryItemSchema = new Schema<ISalaryItem>({
  label: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 }
});

const investmentItemSchema = new Schema<IInvestmentItem>({
  label: { type: String, required: true, trim: true },
  monthlyAmount: { type: Number, required: true, min: 0 },
  rowType: { type: String, enum: ['category', 'subcategory', 'account'], default: 'category' },
  category: { type: String, trim: true },
  subCategory: { type: String, trim: true },
  subSubCategory: { type: String, trim: true },
  contributionSource: { type: String, enum: ['personal', 'employer', 'dpsp', 'member'] },
  sortOrder: { type: Number, default: 0 }
});

const etfItemSchema = new Schema<IEtfItem>({
  ticker: { type: String, required: true, trim: true },
  targetPercent: { type: Number, required: true, min: 0, max: 100 },
  monthlyAmount: { type: Number, required: true, min: 0 },
  biweeklyAmount: { type: Number, min: 0 },
  rowType: { type: String, enum: ['group', 'etf'], default: 'etf' },
  accountCategory: { type: String, trim: true },
  accountSubCategory: { type: String, trim: true },
  sortOrder: { type: Number, default: 0 }
});

const expenseItemSchema = new Schema<IExpenseItem>({
  label: { type: String, required: true, trim: true },
  monthlyAmount: { type: Number, required: true, min: 0 }
});

const financialPlanSchema = new Schema<IFinancialPlan>(
  {
    _id: { type: String, default: 'default' },
    biweeklyIncomeAfterTax: { type: Number, required: true, min: 0 },
    payPeriodsPerYear: { type: Number, required: true, min: 1, default: 26 },
    salaryBreakdown: { type: [salaryItemSchema], default: [] },
    monthlyInvestments: { type: [investmentItemSchema], default: [] },
    etfAllocation: { type: [etfItemSchema], default: [] },
    monthlyExpenses: { type: [expenseItemSchema], default: [] }
  },
  {
    timestamps: true,
    _id: false
  }
);

function mapItemIds<T extends { _id?: unknown }>(items: T[] | undefined): any[] {
  return (items || []).map(item => {
    const { _id, ...rest } = item as any;
    return { id: _id?.toString?.() ?? _id, ...rest };
  });
}

financialPlanSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id;
    delete ret.__v;
    ret.salaryBreakdown = mapItemIds(ret.salaryBreakdown);
    ret.monthlyInvestments = mapItemIds(ret.monthlyInvestments);
    ret.etfAllocation = mapItemIds(ret.etfAllocation);
    ret.monthlyExpenses = mapItemIds(ret.monthlyExpenses);
    return ret;
  }
});

export const FinancialPlan = mongoose.model<IFinancialPlan>('FinancialPlan', financialPlanSchema);

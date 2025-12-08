import mongoose, { Schema } from 'mongoose';

export interface IInvestmentTransaction {
  _id: string;
  userId: string;
  amount: number;
  date: Date;
  accountId: string;
  createdAt: Date;
  updatedAt: Date;
}

const investmentTransactionSchema = new Schema<IInvestmentTransaction>(
  {
    _id: {
      type: String,
      default: () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      ref: 'User',
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      validate: {
        validator: (v: number) => v !== 0,
        message: 'Amount must be a non-zero number'
      }
    },
    date: {
      type: Date,
      required: [true, 'Date is required']
    },
    accountId: {
      type: String,
      required: [true, 'Account ID is required'],
      ref: 'Investment'
    }
  },
  {
    timestamps: true,
    _id: false
  }
);

// Compound indexes for efficient queries
investmentTransactionSchema.index({ userId: 1, date: -1 });
investmentTransactionSchema.index({ accountId: 1, date: -1 });
investmentTransactionSchema.index({ userId: 1, accountId: 1 });

// Transform output to match existing API format
investmentTransactionSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id;
    ret.date = ret.date instanceof Date ? ret.date.toISOString() : ret.date;
    delete ret.__v;
    return ret;
  }
});

export const InvestmentTransaction = mongoose.model<IInvestmentTransaction>(
  'InvestmentTransaction',
  investmentTransactionSchema
);

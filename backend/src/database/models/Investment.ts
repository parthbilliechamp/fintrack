import mongoose, { Schema } from 'mongoose';

export interface IInvestment {
  _id: string;
  userId: string;
  accountName: string;
  accountType: 'RRSP' | 'TFSA' | 'FHSA' | 'Savings';
  investedAmount: number;
  currentValue: number;
  createdAt: Date;
  updatedAt: Date;
}

const investmentSchema = new Schema<IInvestment>(
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
    accountName: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
      minlength: [1, 'Account name cannot be empty']
    },
    accountType: {
      type: String,
      required: [true, 'Account type is required'],
      enum: {
        values: ['RRSP', 'TFSA', 'FHSA', 'Savings'],
        message: 'Account type must be one of: RRSP, TFSA, FHSA, Savings'
      }
    },
    investedAmount: {
      type: Number,
      required: [true, 'Invested amount is required'],
      min: [0, 'Invested amount must be a non-negative number']
    },
    currentValue: {
      type: Number,
      required: [true, 'Current value is required'],
      min: [0, 'Current value must be a non-negative number']
    }
  },
  {
    timestamps: true,
    _id: false
  }
);

// Index for user queries
investmentSchema.index({ userId: 1, accountType: 1 });

// Transform output to match existing API format
investmentSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Investment = mongoose.model<IInvestment>('Investment', investmentSchema);

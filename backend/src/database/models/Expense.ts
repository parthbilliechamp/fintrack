import mongoose, { Schema } from 'mongoose';

export interface IExpense {
  _id: string;
  userId: string;
  category: 'Dine' | 'Grocery' | 'Personal';
  details: string;
  date: Date;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
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
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Dine', 'Grocery', 'Personal'],
        message: 'Category must be one of: Dine, Grocery, Personal'
      }
    },
    details: {
      type: String,
      required: [true, 'Details are required'],
      trim: true,
      minlength: [1, 'Details cannot be empty']
    },
    date: {
      type: Date,
      required: [true, 'Date is required']
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be a positive number']
    }
  },
  {
    timestamps: true,
    _id: false
  }
);

// Compound index for user queries with date filtering
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });

// Transform output to match existing API format
expenseSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id;
    // Return date as ISO string to maintain API compatibility
    ret.date = ret.date instanceof Date ? ret.date.toISOString() : ret.date;
    delete ret.__v;
    return ret;
  }
});

export const Expense = mongoose.model<IExpense>('Expense', expenseSchema);

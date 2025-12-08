import mongoose, { Schema } from 'mongoose';

export interface IContributionLimit {
  _id: string;
  userId: string;
  year: number;
  accountType: 'RRSP' | 'TFSA' | 'FHSA';
  limit: number;
  createdAt: Date;
  updatedAt: Date;
}

const contributionLimitSchema = new Schema<IContributionLimit>(
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
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [2000, 'Year must be 2000 or later'],
      max: [2100, 'Year must be 2100 or earlier']
    },
    accountType: {
      type: String,
      required: [true, 'Account type is required'],
      enum: {
        values: ['RRSP', 'TFSA', 'FHSA'],
        message: 'Account type must be one of: RRSP, TFSA, FHSA'
      }
    },
    limit: {
      type: Number,
      required: [true, 'Limit is required'],
      min: [0, 'Limit must be a non-negative number']
    }
  },
  {
    timestamps: true,
    _id: false
  }
);

// Compound index for user queries by year
contributionLimitSchema.index({ userId: 1, year: 1 });
// Unique constraint: one limit per user/year/accountType combination
contributionLimitSchema.index({ userId: 1, year: 1, accountType: 1 }, { unique: true });

// Transform output to match existing API format
contributionLimitSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  }
});

export const ContributionLimit = mongoose.model<IContributionLimit>(
  'ContributionLimit',
  contributionLimitSchema
);

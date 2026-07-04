export interface Investment {
    id: string;
    userId: string;
    accountName: string;
    accountType: 'RRSP' | 'TFSA' | 'FHSA' | 'Savings';
    investedAmount: number;
    currentValue: number;
    yearInvestedAmount: number;
}

export interface ContributionLimit {
    id: string;
    userId: string;
    year: number;
    accountType: 'RRSP' | 'TFSA' | 'FHSA';
    limit: number;
}

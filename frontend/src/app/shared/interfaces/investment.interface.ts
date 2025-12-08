export interface Investment {
    id: string;
    userId: string;
    accountName: string;
    accountType: 'RRSP' | 'TFSA' | 'FHSA' | 'Savings';
    investedAmount: number;
    currentValue: number;
}

export interface ContributionLimit {
    id: string;
    userId: string;
    year: number;
    accountType: 'RRSP' | 'TFSA' | 'FHSA';
    limit: number;
}

export interface InvestmentTransaction {
    id: string;
    userId: string;
    amount: number;
    date: string;
    accountId: string;
}


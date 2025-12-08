export interface Expense {
    id: string;
    userId: string;
    category: ExpenseCategory;
    details: string;
    date: string;
    amount: number;
}

export type ExpenseCategory = 'Dine' | 'Grocery' | 'Personal';

export interface ExpenseFormData {
    category: ExpenseCategory;
    details: string;
    date: Date;
    amount: number;
}

export interface MonthlyAggregate {
    month: string;
    total: number;
    count: number;
}

export interface CategoryAggregate {
    category: ExpenseCategory;
    total: number;
    count: number;
    percentage?: number;
}

export interface ExpenseSummary {
    total: number;
    count: number;
    average: number;
    byCategory: CategoryAggregate[];
}

export interface ExpenseFilters {
    year?: number;
    month?: number;
    category?: ExpenseCategory;
}

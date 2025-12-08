import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, catchError, of, BehaviorSubject } from 'rxjs';
import { 
  Expense, 
  ExpenseFormData, 
  MonthlyAggregate, 
  CategoryAggregate,
  ExpenseSummary,
  ExpenseCategory 
} from '../interfaces/expense.interface';
import { AuthService } from './auth.service';
import { LoggerService, ContextLogger } from './logger.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly API_URL = `${environment.apiUrl}/expenses`;
  private logger: ContextLogger;
  
  // Use BehaviorSubject for reactive state management
  private expensesSubject = new BehaviorSubject<Expense[]>([]);
  public expenses$ = this.expensesSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createContextLogger('ExpenseService');
    
    // Load expenses when user logs in
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.logger.debug('User logged in, loading expenses', { userId: user.id });
        this.loadExpenses();
      } else {
        this.logger.debug('User logged out, clearing expenses');
        this.expensesSubject.next([]);
      }
    });
  }

  /**
   * Load all expenses for the current user
   */
  private loadExpenses(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.logger.debug('Loading expenses from server');
    this.http.get<Expense[]>(`${this.API_URL}/${user.id}`).pipe(
      tap(expenses => {
        this.logger.info('Expenses loaded successfully', { count: expenses.length });
        this.expensesSubject.next(expenses);
      }),
      catchError(error => {
        this.logger.error('Failed to load expenses', error);
        this.expensesSubject.next([]);
        return of([]);
      })
    ).subscribe();
  }

  /**
   * Refresh expenses from the server
   */
  public refreshExpenses(): void {
    this.loadExpenses();
  }

  /**
   * Get expenses filtered by year and month
   */
  public getExpensesByMonth(year: number, month: number): Observable<Expense[]> {
    return this.expenses$.pipe(
      map(expenses => expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear() === year && expenseDate.getMonth() === month;
      }))
    );
  }

  /**
   * Get unique expense details for autocomplete
   */
  public getUniqueDetails(): Observable<string[]> {
    return this.expenses$.pipe(
      map(expenses => {
        const details = expenses.map(e => e.details);
        return Array.from(new Set(details)).sort();
      })
    );
  }

  /**
   * Add a new expense
   */
  public addExpense(expenseData: ExpenseFormData): Observable<Expense> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.logger.error('Cannot add expense: user not authenticated');
      throw new Error('User not authenticated');
    }

    this.logger.debug('Adding new expense', { category: expenseData.category, amount: expenseData.amount });
    const payload = {
      ...expenseData,
      date: expenseData.date.toISOString()
    };

    return this.http.post<Expense>(`${this.API_URL}/${user.id}`, payload).pipe(
      tap(newExpense => {
        this.logger.info('Expense added successfully', { expenseId: newExpense.id });
        const current = this.expensesSubject.value;
        this.expensesSubject.next([...current, newExpense]);
      }),
      catchError(error => {
        this.logger.error('Failed to add expense', error);
        throw error;
      })
    );
  }

  /**
   * Update an existing expense
   */
  public updateExpense(id: string, expenseData: ExpenseFormData): Observable<Expense> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.logger.error('Cannot update expense: user not authenticated');
      throw new Error('User not authenticated');
    }

    this.logger.debug('Updating expense', { expenseId: id });
    const payload = {
      ...expenseData,
      date: expenseData.date.toISOString()
    };

    return this.http.put<Expense>(`${this.API_URL}/${user.id}/${id}`, payload).pipe(
      tap(updatedExpense => {
        this.logger.info('Expense updated successfully', { expenseId: id });
        const current = this.expensesSubject.value;
        const index = current.findIndex(e => e.id === id);
        if (index !== -1) {
          current[index] = updatedExpense;
          this.expensesSubject.next([...current]);
        }
      }),
      catchError(error => {
        this.logger.error('Failed to update expense', { expenseId: id, error });
        throw error;
      })
    );
  }

  /**
   * Delete an expense
   */
  public deleteExpense(id: string): Observable<void> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.logger.error('Cannot delete expense: user not authenticated');
      throw new Error('User not authenticated');
    }

    this.logger.debug('Deleting expense', { expenseId: id });
    return this.http.delete<void>(`${this.API_URL}/${user.id}/${id}`).pipe(
      tap(() => {
        this.logger.info('Expense deleted successfully', { expenseId: id });
        const current = this.expensesSubject.value;
        this.expensesSubject.next(current.filter(e => e.id !== id));
      }),
      catchError(error => {
        this.logger.error('Failed to delete expense', { expenseId: id, error });
        throw error;
      })
    );
  }

  /**
   * Get monthly aggregates from backend
   */
  public getMonthlyAggregates(year?: number, month?: number): Observable<MonthlyAggregate[]> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.logger.error('Cannot get monthly aggregates: user not authenticated');
      throw new Error('User not authenticated');
    }

    let url = `${this.API_URL}/${user.id}/aggregates/monthly`;
    const params: string[] = [];
    if (year !== undefined) params.push(`year=${year}`);
    if (month !== undefined) params.push(`month=${month}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    this.logger.debug('Fetching monthly aggregates', { year, month });
    return this.http.get<MonthlyAggregate[]>(url).pipe(
      tap(data => this.logger.debug('Monthly aggregates received', { count: data.length })),
      catchError(error => {
        this.logger.error('Failed to get monthly aggregates', error);
        return of([]);
      })
    );
  }

  /**
   * Get category aggregates from backend
   */
  public getCategoryAggregates(year?: number, month?: number): Observable<CategoryAggregate[]> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.logger.error('Cannot get category aggregates: user not authenticated');
      throw new Error('User not authenticated');
    }

    let url = `${this.API_URL}/${user.id}/aggregates/category`;
    const params: string[] = [];
    if (year !== undefined) params.push(`year=${year}`);
    if (month !== undefined) params.push(`month=${month}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    this.logger.debug('Fetching category aggregates', { year, month });
    return this.http.get<CategoryAggregate[]>(url).pipe(
      tap(data => this.logger.debug('Category aggregates received', { count: data.length })),
      catchError(error => {
        this.logger.error('Failed to get category aggregates', error);
        return of([]);
      })
    );
  }

  /**
   * Get expense summary from backend
   */
  public getExpenseSummary(year?: number, month?: number): Observable<ExpenseSummary> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.logger.error('Cannot get expense summary: user not authenticated');
      throw new Error('User not authenticated');
    }

    let url = `${this.API_URL}/${user.id}/summary`;
    const params: string[] = [];
    if (year !== undefined) params.push(`year=${year}`);
    if (month !== undefined) params.push(`month=${month}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    this.logger.debug('Fetching expense summary', { year, month });
    return this.http.get<ExpenseSummary>(url).pipe(
      tap(data => this.logger.debug('Expense summary received', { total: data.total, count: data.count })),
      catchError(error => {
        this.logger.error('Failed to get expense summary', error);
        return of({
          total: 0,
          count: 0,
          average: 0,
          byCategory: []
        });
      })
    );
  }

  /**
   * Get all available expense categories
   */
  public getCategories(): ExpenseCategory[] {
    return ['Dine', 'Grocery', 'Personal'];
  }

  /**
   * Format currency amount
   */
  public formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}

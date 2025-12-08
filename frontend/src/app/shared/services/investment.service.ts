import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap, catchError } from 'rxjs';
import { Investment, ContributionLimit, InvestmentTransaction } from '../interfaces/investment.interface';
import { AuthService } from './auth.service';
import { LoggerService, ContextLogger } from './logger.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InvestmentService {
  private readonly API_URL = `${environment.apiUrl}/investments`;
  private logger: ContextLogger;

  private investmentsSubject: BehaviorSubject<Investment[]>;
  private contributionLimitsSubject: BehaviorSubject<ContributionLimit[]>;
  private transactionsSubject: BehaviorSubject<InvestmentTransaction[]>;

  public investments$: Observable<Investment[]>;
  public contributionLimits$: Observable<ContributionLimit[]>;
  public transactions$: Observable<InvestmentTransaction[]>;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createContextLogger('InvestmentService');
    this.investmentsSubject = new BehaviorSubject<Investment[]>([]);
    this.contributionLimitsSubject = new BehaviorSubject<ContributionLimit[]>([]);
    this.transactionsSubject = new BehaviorSubject<InvestmentTransaction[]>([]);

    this.investments$ = this.investmentsSubject.asObservable();
    this.contributionLimits$ = this.contributionLimitsSubject.asObservable();
    this.transactions$ = this.transactionsSubject.asObservable();

    // Load data when user logs in
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.logger.debug('User logged in, loading investment data', { userId: user.id });
        this.loadData();
      } else {
        this.logger.debug('User logged out, clearing investment data');
        this.investmentsSubject.next([]);
        this.contributionLimitsSubject.next([]);
        this.transactionsSubject.next([]);
      }
    });
  }

  private loadData(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.logger.debug('Loading investment data from server');

    // Load investments
    this.http.get<Investment[]>(`${this.API_URL}/${user.id}`).pipe(
      tap(investments => {
        this.logger.info('Investments loaded', { count: investments.length });
        this.investmentsSubject.next(investments);
      }),
      catchError(error => {
        this.logger.error('Error loading investments', error);
        this.investmentsSubject.next([]);
        return [];
      })
    ).subscribe();

    // Load contribution limits
    this.http.get<ContributionLimit[]>(`${this.API_URL}/${user.id}/limits/all`).pipe(
      tap(limits => {
        this.logger.info('Contribution limits loaded', { count: limits.length });
        this.contributionLimitsSubject.next(limits);
      }),
      catchError(error => {
        this.logger.error('Error loading contribution limits', error);
        this.contributionLimitsSubject.next([]);
        return [];
      })
    ).subscribe();

    // Load transactions
    this.http.get<InvestmentTransaction[]>(`${this.API_URL}/${user.id}/transactions/all`).pipe(
      tap(transactions => {
        this.logger.info('Transactions loaded', { count: transactions.length });
        this.transactionsSubject.next(transactions);
      }),
      catchError(error => {
        this.logger.error('Error loading transactions', error);
        this.transactionsSubject.next([]);
        return [];
      })
    ).subscribe();
  }

  public reloadData(): void {
    this.loadData();
  }

  // ============ INVESTMENT ACCOUNT MANAGEMENT ============

  addInvestment(investment: Omit<Investment, 'id' | 'userId'>): Observable<Investment> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.logger.error('Cannot add investment: user not authenticated');
      throw new Error('User not authenticated');
    }

    this.logger.debug('Adding investment', { accountType: investment.accountType, accountName: investment.accountName });
    return this.http.post<Investment>(`${this.API_URL}/${user.id}`, investment).pipe(
      tap(newInvestment => {
        this.logger.info('Investment added successfully', { investmentId: newInvestment.id });
        const investments = this.investmentsSubject.value;
        investments.push(newInvestment);
        this.investmentsSubject.next([...investments]);
      }),
      catchError(error => {
        this.logger.error('Error adding investment', error);
        throw error;
      })
    );
  }

  updateInvestment(id: string, investment: Omit<Investment, 'id' | 'userId'>): Observable<Investment> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.logger.error('Cannot update investment: user not authenticated');
      throw new Error('User not authenticated');
    }

    this.logger.debug('Updating investment', { investmentId: id });
    return this.http.put<Investment>(`${this.API_URL}/${user.id}/${id}`, investment).pipe(
      tap(updatedInvestment => {
        this.logger.info('Investment updated successfully', { investmentId: id });
        const investments = this.investmentsSubject.value;
        const index = investments.findIndex(i => i.id === id);
        if (index !== -1) {
          investments[index] = updatedInvestment;
          this.investmentsSubject.next([...investments]);
        }
      }),
      catchError(error => {
        this.logger.error('Error updating investment', { investmentId: id, error });
        throw error;
      })
    );
  }

  deleteInvestment(id: string): Observable<any> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.logger.error('Cannot delete investment: user not authenticated');
      throw new Error('User not authenticated');
    }

    this.logger.debug('Deleting investment', { investmentId: id });
    return this.http.delete(`${this.API_URL}/${user.id}/${id}`).pipe(
      tap(() => {
        this.logger.info('Investment deleted successfully', { investmentId: id });
        const investments = this.investmentsSubject.value;
        const filteredInvestments = investments.filter(i => i.id !== id);
        this.investmentsSubject.next(filteredInvestments);
      }),
      catchError(error => {
        this.logger.error('Error deleting investment', { investmentId: id, error });
        throw error;
      })
    );
  }

  // ============ CONTRIBUTION LIMITS MANAGEMENT ============

  addContributionLimit(limit: Omit<ContributionLimit, 'id' | 'userId'>): Observable<ContributionLimit> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.logger.error('Cannot add contribution limit: user not authenticated');
      throw new Error('User not authenticated');
    }

    this.logger.debug('Adding contribution limit', { year: limit.year, accountType: limit.accountType });
    return this.http.post<ContributionLimit>(`${this.API_URL}/${user.id}/limits`, limit).pipe(
      tap(newLimit => {
        this.logger.info('Contribution limit added successfully', { limitId: newLimit.id });
        const limits = this.contributionLimitsSubject.value;
        limits.push(newLimit);
        this.contributionLimitsSubject.next([...limits]);
      }),
      catchError(error => {
        this.logger.error('Error adding contribution limit', error);
        throw error;
      })
    );
  }

  updateContributionLimit(id: string, limit: Omit<ContributionLimit, 'id' | 'userId'>): Observable<ContributionLimit> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.logger.error('Cannot update contribution limit: user not authenticated');
      throw new Error('User not authenticated');
    }

    this.logger.debug('Updating contribution limit', { limitId: id });
    return this.http.put<ContributionLimit>(`${this.API_URL}/${user.id}/limits/${id}`, limit).pipe(
      tap(updatedLimit => {
        this.logger.info('Contribution limit updated successfully', { limitId: id });
        const limits = this.contributionLimitsSubject.value;
        const index = limits.findIndex(l => l.id === id);
        if (index !== -1) {
          limits[index] = updatedLimit;
          this.contributionLimitsSubject.next([...limits]);
        }
      }),
      catchError(error => {
        this.logger.error('Error updating contribution limit', { limitId: id, error });
        throw error;
      })
    );
  }

  deleteContributionLimit(id: string): Observable<any> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.logger.error('Cannot delete contribution limit: user not authenticated');
      throw new Error('User not authenticated');
    }

    this.logger.debug('Deleting contribution limit', { limitId: id });
    return this.http.delete(`${this.API_URL}/${user.id}/limits/${id}`).pipe(
      tap(() => {
        this.logger.info('Contribution limit deleted successfully', { limitId: id });
        const limits = this.contributionLimitsSubject.value;
        const filteredLimits = limits.filter(l => l.id !== id);
        this.contributionLimitsSubject.next(filteredLimits);
      }),
      catchError(error => {
        this.logger.error('Error deleting contribution limit', { limitId: id, error });
        throw error;
      })
    );
  }

  getContributionLimits(year: number): Observable<ContributionLimit[]> {
    return this.contributionLimits$.pipe(
      map(limits => limits.filter(l => l.year === year))
    );
  }

  // ============ INVESTMENT TRANSACTIONS MANAGEMENT ============

  addTransaction(transaction: Omit<InvestmentTransaction, 'id' | 'userId'>): Observable<InvestmentTransaction> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.logger.error('Cannot add transaction: user not authenticated');
      throw new Error('User not authenticated');
    }

    this.logger.debug('Adding transaction', { accountId: transaction.accountId, amount: transaction.amount });
    return this.http.post<{ transaction: InvestmentTransaction; updatedInvestment: any }>(`${this.API_URL}/${user.id}/transactions`, transaction).pipe(
      tap(response => {
        this.logger.info('Transaction added successfully', { transactionId: response.transaction.id });
        // Add the new transaction
        const transactions = this.transactionsSubject.value;
        transactions.push(response.transaction);
        this.transactionsSubject.next([...transactions]);
        
        // Update the investment in the local state
        if (response.updatedInvestment) {
          this.logger.debug('Updating local investment state after transaction');
          const investments = this.investmentsSubject.value;
          const index = investments.findIndex(i => i.id === response.updatedInvestment.id);
          if (index !== -1) {
            investments[index] = response.updatedInvestment;
            this.investmentsSubject.next([...investments]);
          }
        }
      }),
      map(response => response.transaction),
      catchError(error => {
        this.logger.error('Error adding transaction', error);
        throw error;
      })
    );
  }

  deleteTransaction(id: string): Observable<any> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.logger.error('Cannot delete transaction: user not authenticated');
      throw new Error('User not authenticated');
    }

    this.logger.debug('Deleting transaction', { transactionId: id });
    return this.http.delete(`${this.API_URL}/${user.id}/transactions/${id}`).pipe(
      tap(() => {
        this.logger.info('Transaction deleted successfully', { transactionId: id });
        const transactions = this.transactionsSubject.value;
        const filteredTransactions = transactions.filter(t => t.id !== id);
        this.transactionsSubject.next(filteredTransactions);
      }),
      catchError(error => {
        this.logger.error('Error deleting transaction', { transactionId: id, error });
        throw error;
      })
    );
  }

  // ============ ANALYTICS AND SUMMARIES ============

  // Get investment aggregates by account type from backend
  getInvestmentsByAccountType(): Observable<any[]> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.logger.error('Cannot get investment aggregates: user not authenticated');
      throw new Error('User not authenticated');
    }

    this.logger.debug('Fetching investment aggregates by account type');
    return this.http.get<any[]>(`${this.API_URL}/${user.id}/aggregates/by-account-type`).pipe(
      tap(data => this.logger.debug('Investment aggregates received', { count: data.length })),
      catchError(error => {
        this.logger.error('Error getting investment aggregates', error);
        throw error;
      })
    );
  }

  // Get overall investment summary from backend
  getInvestmentSummary(): Observable<any> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.logger.error('Cannot get investment summary: user not authenticated');
      throw new Error('User not authenticated');
    }

    this.logger.debug('Fetching investment summary');
    return this.http.get<any>(`${this.API_URL}/${user.id}/summary`).pipe(
      tap(data => this.logger.debug('Investment summary received', { totalValue: data.totalValue })),
      catchError(error => {
        this.logger.error('Error getting investment summary', error);
        throw error;
      })
    );
  }

  // Get contribution status from backend
  getContributionStatus(year: number): Observable<Array<{
    accountType: string;
    limit: number;
    used: number;
    remaining: number;
  }>> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.logger.error('Cannot get contribution status: user not authenticated');
      throw new Error('User not authenticated');
    }

    this.logger.debug('Fetching contribution status', { year });
    return this.http.get<Array<{
      accountType: string;
      limit: number;
      used: number;
      remaining: number;
    }>>(`${this.API_URL}/${user.id}/limits/status?year=${year}`).pipe(
      tap(data => this.logger.debug('Contribution status received', { accountTypes: data.length })),
      catchError(error => {
        this.logger.error('Error getting contribution status', error);
        throw error;
      })
    );
  }
}

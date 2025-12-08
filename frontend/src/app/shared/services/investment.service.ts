import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap, catchError } from 'rxjs';
import { Investment, ContributionLimit, InvestmentTransaction } from '../interfaces/investment.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class InvestmentService {
  private readonly API_URL = 'http://localhost:3000/api/investments';

  private investmentsSubject: BehaviorSubject<Investment[]>;
  private contributionLimitsSubject: BehaviorSubject<ContributionLimit[]>;
  private transactionsSubject: BehaviorSubject<InvestmentTransaction[]>;

  public investments$: Observable<Investment[]>;
  public contributionLimits$: Observable<ContributionLimit[]>;
  public transactions$: Observable<InvestmentTransaction[]>;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.investmentsSubject = new BehaviorSubject<Investment[]>([]);
    this.contributionLimitsSubject = new BehaviorSubject<ContributionLimit[]>([]);
    this.transactionsSubject = new BehaviorSubject<InvestmentTransaction[]>([]);

    this.investments$ = this.investmentsSubject.asObservable();
    this.contributionLimits$ = this.contributionLimitsSubject.asObservable();
    this.transactions$ = this.transactionsSubject.asObservable();

    // Load data when user logs in
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadData();
      } else {
        this.investmentsSubject.next([]);
        this.contributionLimitsSubject.next([]);
        this.transactionsSubject.next([]);
      }
    });
  }

  private loadData(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    // Load investments
    this.http.get<Investment[]>(`${this.API_URL}/${user.id}`).pipe(
      tap(investments => {
        console.log('Loaded investments:', investments);
        this.investmentsSubject.next(investments);
      }),
      catchError(error => {
        console.error('Error loading investments:', error);
        this.investmentsSubject.next([]);
        return [];
      })
    ).subscribe();

    // Load contribution limits
    this.http.get<ContributionLimit[]>(`${this.API_URL}/${user.id}/limits/all`).pipe(
      tap(limits => {
        console.log('Loaded contribution limits:', limits);
        this.contributionLimitsSubject.next(limits);
      }),
      catchError(error => {
        console.error('Error loading contribution limits:', error);
        this.contributionLimitsSubject.next([]);
        return [];
      })
    ).subscribe();

    // Load transactions
    this.http.get<InvestmentTransaction[]>(`${this.API_URL}/${user.id}/transactions/all`).pipe(
      tap(transactions => {
        console.log('Loaded transactions:', transactions);
        this.transactionsSubject.next(transactions);
      }),
      catchError(error => {
        console.error('Error loading transactions:', error);
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
      throw new Error('User not authenticated');
    }

    return this.http.post<Investment>(`${this.API_URL}/${user.id}`, investment).pipe(
      tap(newInvestment => {
        const investments = this.investmentsSubject.value;
        investments.push(newInvestment);
        this.investmentsSubject.next([...investments]);
      }),
      catchError(error => {
        console.error('Error adding investment:', error);
        throw error;
      })
    );
  }

  updateInvestment(id: string, investment: Omit<Investment, 'id' | 'userId'>): Observable<Investment> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    return this.http.put<Investment>(`${this.API_URL}/${user.id}/${id}`, investment).pipe(
      tap(updatedInvestment => {
        const investments = this.investmentsSubject.value;
        const index = investments.findIndex(i => i.id === id);
        if (index !== -1) {
          investments[index] = updatedInvestment;
          this.investmentsSubject.next([...investments]);
        }
      }),
      catchError(error => {
        console.error('Error updating investment:', error);
        throw error;
      })
    );
  }

  deleteInvestment(id: string): Observable<any> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    return this.http.delete(`${this.API_URL}/${user.id}/${id}`).pipe(
      tap(() => {
        const investments = this.investmentsSubject.value;
        const filteredInvestments = investments.filter(i => i.id !== id);
        this.investmentsSubject.next(filteredInvestments);
      }),
      catchError(error => {
        console.error('Error deleting investment:', error);
        throw error;
      })
    );
  }

  // ============ CONTRIBUTION LIMITS MANAGEMENT ============

  addContributionLimit(limit: Omit<ContributionLimit, 'id' | 'userId'>): Observable<ContributionLimit> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    return this.http.post<ContributionLimit>(`${this.API_URL}/${user.id}/limits`, limit).pipe(
      tap(newLimit => {
        const limits = this.contributionLimitsSubject.value;
        limits.push(newLimit);
        this.contributionLimitsSubject.next([...limits]);
      }),
      catchError(error => {
        console.error('Error adding contribution limit:', error);
        throw error;
      })
    );
  }

  updateContributionLimit(id: string, limit: Omit<ContributionLimit, 'id' | 'userId'>): Observable<ContributionLimit> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    return this.http.put<ContributionLimit>(`${this.API_URL}/${user.id}/limits/${id}`, limit).pipe(
      tap(updatedLimit => {
        const limits = this.contributionLimitsSubject.value;
        const index = limits.findIndex(l => l.id === id);
        if (index !== -1) {
          limits[index] = updatedLimit;
          this.contributionLimitsSubject.next([...limits]);
        }
      }),
      catchError(error => {
        console.error('Error updating contribution limit:', error);
        throw error;
      })
    );
  }

  deleteContributionLimit(id: string): Observable<any> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    return this.http.delete(`${this.API_URL}/${user.id}/limits/${id}`).pipe(
      tap(() => {
        const limits = this.contributionLimitsSubject.value;
        const filteredLimits = limits.filter(l => l.id !== id);
        this.contributionLimitsSubject.next(filteredLimits);
      }),
      catchError(error => {
        console.error('Error deleting contribution limit:', error);
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
      throw new Error('User not authenticated');
    }

    return this.http.post<{ transaction: InvestmentTransaction; updatedInvestment: any }>(`${this.API_URL}/${user.id}/transactions`, transaction).pipe(
      tap(response => {
        // Add the new transaction
        const transactions = this.transactionsSubject.value;
        transactions.push(response.transaction);
        this.transactionsSubject.next([...transactions]);
        
        // Update the investment in the local state
        if (response.updatedInvestment) {
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
        console.error('Error adding transaction:', error);
        throw error;
      })
    );
  }

  deleteTransaction(id: string): Observable<any> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    return this.http.delete(`${this.API_URL}/${user.id}/transactions/${id}`).pipe(
      tap(() => {
        const transactions = this.transactionsSubject.value;
        const filteredTransactions = transactions.filter(t => t.id !== id);
        this.transactionsSubject.next(filteredTransactions);
      }),
      catchError(error => {
        console.error('Error deleting transaction:', error);
        throw error;
      })
    );
  }

  // ============ ANALYTICS AND SUMMARIES ============

  // Get investment aggregates by account type from backend
  getInvestmentsByAccountType(): Observable<any[]> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    return this.http.get<any[]>(`${this.API_URL}/${user.id}/aggregates/by-account-type`).pipe(
      catchError(error => {
        console.error('Error getting investment aggregates:', error);
        throw error;
      })
    );
  }

  // Get overall investment summary from backend
  getInvestmentSummary(): Observable<any> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    return this.http.get<any>(`${this.API_URL}/${user.id}/summary`).pipe(
      catchError(error => {
        console.error('Error getting investment summary:', error);
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
      throw new Error('User not authenticated');
    }

    return this.http.get<Array<{
      accountType: string;
      limit: number;
      used: number;
      remaining: number;
    }>>(`${this.API_URL}/${user.id}/limits/status?year=${year}`).pipe(
      catchError(error => {
        console.error('Error getting contribution status:', error);
        throw error;
      })
    );
  }
}

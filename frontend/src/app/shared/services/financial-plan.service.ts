import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { FinancialPlan, PlanSection } from '../interfaces/financial-plan.interface';
import { LoggerService, ContextLogger } from './logger.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FinancialPlanService {
  private readonly API_URL = `${environment.apiUrl}/financial-plan`;
  private logger: ContextLogger;

  constructor(
    private http: HttpClient,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createContextLogger('FinancialPlanService');
  }

  /**
   * Fetch the singleton financial plan.
   */
  public getFinancialPlan(): Observable<FinancialPlan | null> {
    this.logger.debug('Fetching financial plan');
    return this.http.get<FinancialPlan>(this.API_URL).pipe(
      tap(() => this.logger.info('Financial plan loaded')),
      catchError(error => {
        this.logger.error('Failed to load financial plan', error);
        return of(null);
      })
    );
  }

  /**
   * Update top-level plan settings (currently the biweekly income after tax).
   */
  public updateSettings(payload: { biweeklyIncomeAfterTax: number }): Observable<FinancialPlan> {
    this.logger.debug('Updating financial plan settings', payload);
    return this.http.put<FinancialPlan>(`${this.API_URL}/settings`, payload).pipe(
      tap(() => this.logger.info('Financial plan settings updated')),
      catchError(error => {
        this.logger.error('Failed to update financial plan settings', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add a new row to the given section (salaryBreakdown, monthlyInvestments, etfAllocation, monthlyExpenses).
   */
  public addItem(section: PlanSection, payload: Record<string, unknown>): Observable<FinancialPlan> {
    this.logger.debug('Adding financial plan row', { section });
    return this.http.post<FinancialPlan>(`${this.API_URL}/${section}`, payload).pipe(
      tap(() => this.logger.info('Financial plan row added', { section })),
      catchError(error => {
        this.logger.error('Failed to add financial plan row', { section, error });
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing row within the given section.
   */
  public updateItem(section: PlanSection, itemId: string, payload: Record<string, unknown>): Observable<FinancialPlan> {
    this.logger.debug('Updating financial plan row', { section, itemId });
    return this.http.put<FinancialPlan>(`${this.API_URL}/${section}/${itemId}`, payload).pipe(
      tap(() => this.logger.info('Financial plan row updated', { section, itemId })),
      catchError(error => {
        this.logger.error('Failed to update financial plan row', { section, itemId, error });
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a row within the given section.
   */
  public deleteItem(section: PlanSection, itemId: string): Observable<FinancialPlan> {
    this.logger.debug('Deleting financial plan row', { section, itemId });
    return this.http.delete<FinancialPlan>(`${this.API_URL}/${section}/${itemId}`).pipe(
      tap(() => this.logger.info('Financial plan row deleted', { section, itemId })),
      catchError(error => {
        this.logger.error('Failed to delete financial plan row', { section, itemId, error });
        return throwError(() => error);
      })
    );
  }

  /** Biweekly pay periods per calendar month (2 paychecks per month). */
  public static readonly PAY_PERIODS_PER_MONTH = 2;

  /** Convert monthly → biweekly (monthly / 2). */
  public monthlyToBiweekly(monthlyAmount: number): number {
    return monthlyAmount / FinancialPlanService.PAY_PERIODS_PER_MONTH;
  }

  /** Convert biweekly → monthly (biweekly × 2). */
  public biweeklyToMonthly(biweeklyAmount: number): number {
    return biweeklyAmount * FinancialPlanService.PAY_PERIODS_PER_MONTH;
  }
}

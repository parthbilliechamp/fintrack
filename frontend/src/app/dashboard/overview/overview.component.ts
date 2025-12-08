import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, combineLatest, map } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { ExpenseService } from '../../shared/services/expense.service';
import { InvestmentService } from '../../shared/services/investment.service';

interface OverviewStats {
  userName: string;
  netWorth: number;
  currentMonthExpense: number;
  totalInvestments: number;
}

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  stats: OverviewStats = {
    userName: '',
    netWorth: 0,
    currentMonthExpense: 0,
    totalInvestments: 0
  };

  loading = true;

  constructor(
    private authService: AuthService,
    private expenseService: ExpenseService,
    private investmentService: InvestmentService
  ) {}

  ngOnInit(): void {
    this.loadOverviewData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadOverviewData(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.stats.userName = currentUser.name;
    }

    // Get current month and year
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Combine expenses and investments data
    combineLatest([
      this.expenseService.getExpensesByMonth(currentYear, currentMonth),
      this.investmentService.investments$
    ]).pipe(
      takeUntil(this.destroy$),
      map(([expenses, investments]) => {
        // Calculate current month expenses
        const monthlyExpenseTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        
        // Calculate total investments (current value)
        const totalInvestmentsValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
        
        // Net worth = Total Assets (investments) - we don't have liabilities tracked
        const netWorth = totalInvestmentsValue;

        return {
          currentMonthExpense: monthlyExpenseTotal,
          totalInvestments: totalInvestmentsValue,
          netWorth: netWorth
        };
      })
    ).subscribe(data => {
      this.stats.currentMonthExpense = data.currentMonthExpense;
      this.stats.totalInvestments = data.totalInvestments;
      this.stats.netWorth = data.netWorth;
      this.loading = false;
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  getCurrentMonthName(): string {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
}

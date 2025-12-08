import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { ExpenseService } from '../../shared/services/expense.service';

@Component({
  selector: 'app-expense-overview',
  templateUrl: './expense-overview.component.html',
  styleUrls: ['./expense-overview.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterModule
  ]
})
export class ExpenseOverviewComponent implements OnInit {
  monthlyData: any[] = [];
  categoryData: any[] = [];
  summary: any = null;
  loading = true;
  
  constructor(private expenseService: ExpenseService) {}

  ngOnInit(): void {
    this.loadExpenseData();
  }

  private loadExpenseData(): void {
    const currentYear = new Date().getFullYear();

    let completedRequests = 0;
    const checkComplete = () => {
      completedRequests++;
      if (completedRequests >= 3) {
        this.loading = false;
      }
    };

    // Get monthly aggregates for the year
    this.expenseService.getMonthlyAggregates(currentYear)
      .subscribe({
        next: data => {
          this.monthlyData = data;
        },
        error: () => {},
        complete: checkComplete
      });

    // Get category aggregates for the year
    this.expenseService.getCategoryAggregates(currentYear)
      .subscribe({
        next: data => {
          this.categoryData = data;
        },
        error: () => {},
        complete: checkComplete
      });

    // Get overall summary
    this.expenseService.getExpenseSummary(currentYear)
      .subscribe({
        next: data => {
          this.summary = data;
        },
        error: () => {},
        complete: checkComplete
      });
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'CAD'
    });
  }

  calculatePercentageOfTotal(amount: number): number {
    return this.summary && this.summary.total > 0 ? (amount / this.summary.total) * 100 : 0;
  }

  calculateMonthlyBarWidth(amount: number): number {
    if (!this.monthlyData || this.monthlyData.length === 0) return 0;
    const maxAmount = Math.max(...this.monthlyData.map(m => m.total));
    return maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
  }

  calculateCategoryBarWidth(amount: number): number {
    if (!this.categoryData || this.categoryData.length === 0) return 0;
    const maxAmount = Math.max(...this.categoryData.map(c => c.total));
    return maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
  }
}

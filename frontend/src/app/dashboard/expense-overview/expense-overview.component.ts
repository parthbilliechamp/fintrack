import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
    RouterModule
  ]
})
export class ExpenseOverviewComponent implements OnInit {
  monthlyData: any[] = [];
  categoryData: any[] = [];
  summary: any = null;
  
  constructor(private expenseService: ExpenseService) {}

  ngOnInit(): void {
    this.loadExpenseData();
  }

  private loadExpenseData(): void {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    // Get monthly aggregates for the past 12 months
    this.expenseService.getMonthlyAggregates()
      .subscribe(data => {
        this.monthlyData = data;
      });

    // Get category aggregates for current month
    this.expenseService.getCategoryAggregates(currentYear, currentMonth)
      .subscribe(data => {
        this.categoryData = data;
      });

    // Get overall summary
    this.expenseService.getExpenseSummary()
      .subscribe(data => {
        this.summary = data;
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
}

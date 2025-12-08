import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { ExpenseService } from '../../shared/services/expense.service';
import { Expense } from '../../shared/interfaces/expense.interface';

@Component({
  selector: 'app-expense-list',
  templateUrl: './expense-list.component.html',
  styleUrls: ['./expense-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ]
})
export class ExpenseListComponent implements OnInit {
  displayedColumns: string[] = ['date', 'category', 'details', 'amount', 'actions'];
  expenses = signal<Expense[]>([]);
  loading = signal<boolean>(false);
  
  selectedYear: number;
  selectedMonth: number;
  totalAmount = signal<number>(0);

  months = [
    { value: 0, name: 'January' },
    { value: 1, name: 'February' },
    { value: 2, name: 'March' },
    { value: 3, name: 'April' },
    { value: 4, name: 'May' },
    { value: 5, name: 'June' },
    { value: 6, name: 'July' },
    { value: 7, name: 'August' },
    { value: 8, name: 'September' },
    { value: 9, name: 'October' },
    { value: 10, name: 'November' },
    { value: 11, name: 'December' }
  ];

  years: number[] = [];

  constructor(
    private expenseService: ExpenseService,
    private router: Router
  ) {
    const today = new Date();
    this.selectedYear = today.getFullYear();
    this.selectedMonth = today.getMonth();
    
    // Generate last 5 years
    const currentYear = new Date().getFullYear();
    this.years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  }

  ngOnInit(): void {
    this.loadExpenses();
  }

  loadExpenses(): void {
    this.loading.set(true);
    this.expenseService.getExpensesByMonth(this.selectedYear, this.selectedMonth)
      .subscribe({
        next: (expenses) => {
          const sorted = expenses.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          this.expenses.set(sorted);
          
          // Calculate total
          const total = sorted.reduce((sum, exp) => sum + exp.amount, 0);
          this.totalAmount.set(total);
          
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Failed to load expenses:', error);
          this.loading.set(false);
        }
      });
  }

  onMonthYearChange(): void {
    this.loadExpenses();
  }

  addExpense(): void {
    this.router.navigate(['/expenses/new']);
  }

  editExpense(expense: Expense): void {
    this.router.navigate(['/expenses/edit', expense.id]);
  }

  deleteExpense(expense: Expense): void {
    if (confirm(`Are you sure you want to delete the expense "${expense.details}" for ${this.formatCurrency(expense.amount)}?`)) {
      this.expenseService.deleteExpense(expense.id).subscribe({
        next: () => {
          this.loadExpenses();
        },
        error: (error) => {
          console.error('Failed to delete expense:', error);
          alert('Failed to delete expense. Please try again.');
        }
      });
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return this.expenseService.formatCurrency(amount);
  }

  getCategoryTotal(category: string): number {
    return this.expenses()
      .filter(exp => exp.category === category)
      .reduce((sum, exp) => sum + exp.amount, 0);
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'Dine': 'restaurant',
      'Grocery': 'shopping_cart',
      'Personal': 'person'
    };
    return icons[category] || 'attach_money';
  }
}

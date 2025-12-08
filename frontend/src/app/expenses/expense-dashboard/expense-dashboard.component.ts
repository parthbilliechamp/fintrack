import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { ExpenseService } from '../../shared/services/expense.service';
import { ExpenseSummary, MonthlyAggregate, CategoryAggregate } from '../../shared/interfaces/expense.interface';

Chart.register(...registerables);

@Component({
  selector: 'app-expense-dashboard',
  templateUrl: './expense-dashboard.component.html',
  styleUrls: ['./expense-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule
  ]
})
export class ExpenseDashboardComponent implements OnInit, AfterViewChecked {
  @ViewChild('monthlyChart') monthlyChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart') categoryChartRef!: ElementRef<HTMLCanvasElement>;

  loading = signal<boolean>(true);
  summary = signal<ExpenseSummary | null>(null);
  
  monthlyChart: Chart | null = null;
  categoryChart: Chart | null = null;
  
  // Store data for charts to handle race condition
  private monthlyData: MonthlyAggregate[] = [];
  private categoryData: CategoryAggregate[] = [];
  private chartsInitialized = false;

  selectedYear: number;
  years: number[] = [];

  constructor(private expenseService: ExpenseService) {
    const currentYear = new Date().getFullYear();
    this.selectedYear = currentYear;
    this.years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewChecked(): void {
    // Initialize charts when canvas elements become available (after *ngIf renders them)
    if (!this.chartsInitialized && this.monthlyChartRef?.nativeElement && this.categoryChartRef?.nativeElement) {
      this.initializeCharts();
      this.chartsInitialized = true;
      
      // Apply any data that was loaded before charts were initialized
      if (this.monthlyData.length > 0) {
        this.updateMonthlyChart(this.monthlyData);
      }
      if (this.categoryData.length > 0) {
        this.updateCategoryChart(this.categoryData);
      }
    }
  }

  loadDashboardData(): void {
    this.loading.set(true);

    // Load summary
    this.expenseService.getExpenseSummary(this.selectedYear).subscribe(summary => {
      this.summary.set(summary);
      this.loading.set(false);
    });

    // Load monthly data
    this.expenseService.getMonthlyAggregates(this.selectedYear).subscribe(data => {
      this.monthlyData = data;
      if (this.chartsInitialized) {
        this.updateMonthlyChart(data);
      }
    });

    // Load category data
    this.expenseService.getCategoryAggregates(this.selectedYear).subscribe(data => {
      this.categoryData = data;
      if (this.chartsInitialized) {
        this.updateCategoryChart(data);
      }
    });
  }

  onYearChange(): void {
    this.loadDashboardData();
  }

  private initializeCharts(): void {
    // Initialize Monthly Chart
    if (this.monthlyChartRef?.nativeElement) {
      this.monthlyChart = new Chart(this.monthlyChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{
            label: 'Monthly Expenses',
            data: [],
            backgroundColor: '#3f51b5',
            borderColor: '#3f51b5',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => '$' + value.toLocaleString()
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.parsed.y ?? 0;
                  return '$' + value.toLocaleString();
                }
              }
            }
          }
        }
      });
    }

    // Initialize Category Chart
    if (this.categoryChartRef?.nativeElement) {
      this.categoryChart = new Chart(this.categoryChartRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: [],
          datasets: [{
            data: [],
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF'
            ],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  return `${label}: $${value.toLocaleString()}`;
                }
              }
            }
          }
        }
      });
    }
  }

  private updateMonthlyChart(data: MonthlyAggregate[]): void {
    if (!this.monthlyChart) return;

    const labels = data.map(item => {
      const [year, month] = item.month.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });
    const amounts = data.map(item => item.total);

    this.monthlyChart.data.labels = labels;
    this.monthlyChart.data.datasets[0].data = amounts;
    this.monthlyChart.update();
  }

  private updateCategoryChart(data: CategoryAggregate[]): void {
    if (!this.categoryChart) return;

    const labels = data.map(item => item.category);
    const amounts = data.map(item => item.total);

    this.categoryChart.data.labels = labels;
    this.categoryChart.data.datasets[0].data = amounts;
    this.categoryChart.update();
  }

  formatCurrency(amount: number): string {
    return this.expenseService.formatCurrency(amount);
  }

  getCategoryTotal(category: string): number {
    const categoryItem = this.categoryData.find(item => item.category === category);
    return categoryItem?.total || 0;
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

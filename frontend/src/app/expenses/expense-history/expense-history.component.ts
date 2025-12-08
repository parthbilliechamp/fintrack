import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { ExpenseService } from '../../shared/services/expense.service';
import { MonthlyAggregate, CategoryAggregate, ExpenseCategory } from '../../shared/interfaces/expense.interface';
import { forkJoin } from 'rxjs';

Chart.register(...registerables);

interface MonthlyCategoryData {
  month: string;
  categories: { [key in ExpenseCategory]?: number };
}

@Component({
  selector: 'app-expense-history',
  templateUrl: './expense-history.component.html',
  styleUrls: ['./expense-history.component.scss'],
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
    MatFormFieldModule,
    MatButtonToggleModule
  ]
})
export class ExpenseHistoryComponent implements OnInit, AfterViewChecked {
  @ViewChild('overallChart') overallChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryBreakdownChart') categoryBreakdownChartRef!: ElementRef<HTMLCanvasElement>;

  loading = signal<boolean>(true);
  
  overallChart: Chart | null = null;
  categoryBreakdownChart: Chart | null = null;
  private chartsInitialized = false;

  selectedYear: number;
  years: number[] = [];
  viewMode: 'monthly' | 'yearly' = 'monthly';

  monthlyData = signal<MonthlyAggregate[]>([]);
  categoryData = signal<CategoryAggregate[]>([]);
  monthlyCategoryData = signal<MonthlyCategoryData[]>([]);

  categoryColors: { [key in ExpenseCategory]: string } = {
    'Dine': '#FF6384',
    'Grocery': '#36A2EB',
    'Personal': '#FFCE56'
  };

  constructor(private expenseService: ExpenseService) {
    const currentYear = new Date().getFullYear();
    this.selectedYear = currentYear;
    this.years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  }

  ngOnInit(): void {
    this.loadHistoryData();
  }

  ngAfterViewChecked(): void {
    // Initialize charts when canvas elements become available (after *ngIf renders them)
    if (!this.chartsInitialized && !this.loading() && 
        this.overallChartRef?.nativeElement && this.categoryBreakdownChartRef?.nativeElement) {
      this.initializeCharts();
      this.chartsInitialized = true;
      this.updateCharts();
    }
  }

  loadHistoryData(): void {
    this.loading.set(true);
    this.chartsInitialized = false; // Reset so charts can be reinitialized after loading

    forkJoin({
      monthly: this.expenseService.getMonthlyAggregates(this.selectedYear),
      category: this.expenseService.getCategoryAggregates(this.selectedYear)
    }).subscribe({
      next: ({ monthly, category }) => {
        this.monthlyData.set(monthly);
        this.categoryData.set(category);
        this.loadMonthlyCategoryData();
        this.loading.set(false);
        // Charts will be updated in ngAfterViewChecked once they're initialized
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private loadMonthlyCategoryData(): void {
    // Get category data for each month
    const months = this.getMonthsForYear();
    const monthlyCategoryPromises: MonthlyCategoryData[] = [];

    // For now, we'll compute this from the expenses observable
    this.expenseService.expenses$.subscribe(expenses => {
      const yearExpenses = expenses.filter(e => {
        const date = new Date(e.date);
        return date.getFullYear() === this.selectedYear;
      });

      const monthlyMap = new Map<string, { [key in ExpenseCategory]?: number }>();

      yearExpenses.forEach(expense => {
        const date = new Date(expense.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, {});
        }
        
        const monthData = monthlyMap.get(monthKey)!;
        monthData[expense.category] = (monthData[expense.category] || 0) + expense.amount;
      });

      const result: MonthlyCategoryData[] = months.map(month => ({
        month,
        categories: monthlyMap.get(month) || {}
      }));

      this.monthlyCategoryData.set(result);
      this.updateCategoryBreakdownChart();
    });
  }

  private getMonthsForYear(): string[] {
    return Array.from({ length: 12 }, (_, i) => 
      `${this.selectedYear}-${String(i + 1).padStart(2, '0')}`
    );
  }

  onYearChange(): void {
    // Destroy existing charts before reloading
    if (this.overallChart) {
      this.overallChart.destroy();
      this.overallChart = null;
    }
    if (this.categoryBreakdownChart) {
      this.categoryBreakdownChart.destroy();
      this.categoryBreakdownChart = null;
    }
    this.chartsInitialized = false;
    this.loadHistoryData();
  }

  onViewModeChange(): void {
    this.updateCharts();
  }

  private initializeCharts(): void {
    this.initializeOverallChart();
    this.initializeCategoryBreakdownChart();
  }

  private initializeOverallChart(): void {
    if (this.overallChartRef?.nativeElement) {
      this.overallChart = new Chart(this.overallChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{
            label: 'Monthly Expenses',
            data: [],
            backgroundColor: 'rgba(63, 81, 181, 0.8)',
            borderColor: '#3f51b5',
            borderWidth: 1,
            borderRadius: 6,
            barPercentage: 0.7
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                callback: (value) => '$' + Number(value).toLocaleString()
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              titleFont: {
                size: 14,
                weight: 'bold'
              },
              bodyFont: {
                size: 13
              },
              callbacks: {
                label: (context) => {
                  const value = context.parsed.y ?? 0;
                  return 'Total: $' + value.toLocaleString();
                }
              }
            }
          }
        }
      });
    }
  }

  private initializeCategoryBreakdownChart(): void {
    if (this.categoryBreakdownChartRef?.nativeElement) {
      this.categoryBreakdownChart = new Chart(this.categoryBreakdownChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: [],
          datasets: []
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              stacked: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                callback: (value) => '$' + Number(value).toLocaleString()
              }
            },
            x: {
              stacked: true,
              grid: {
                display: false
              }
            }
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                  size: 12
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              titleFont: {
                size: 14,
                weight: 'bold'
              },
              bodyFont: {
                size: 13
              },
              callbacks: {
                label: (context) => {
                  const label = context.dataset.label || '';
                  const value = context.parsed.y ?? 0;
                  return `${label}: $${value.toLocaleString()}`;
                }
              }
            }
          }
        }
      });
    }
  }

  private updateCharts(): void {
    this.updateOverallChart();
    this.updateCategoryBreakdownChart();
  }

  private updateOverallChart(): void {
    if (!this.overallChart) return;

    const data = this.monthlyData();
    const labels = this.getMonthLabels(data);
    
    // Create an array of 12 months with 0 values
    const monthlyAmounts = new Array(12).fill(0);
    
    // Map actual data to correct month positions
    data.forEach(item => {
      const [year, month] = item.month.split('-');
      const monthIndex = parseInt(month) - 1; // Convert to 0-based index
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyAmounts[monthIndex] = item.total;
      }
    });

    // Calculate average for reference line (only non-zero months)
    const nonZeroAmounts = monthlyAmounts.filter(a => a > 0);
    const average = nonZeroAmounts.length > 0 
      ? nonZeroAmounts.reduce((a, b) => a + b, 0) / nonZeroAmounts.length 
      : 0;

    this.overallChart.data.labels = labels;
    this.overallChart.data.datasets[0].data = monthlyAmounts;
    
    // Color bars based on whether above or below average
    this.overallChart.data.datasets[0].backgroundColor = monthlyAmounts.map(amount => 
      amount > average ? 'rgba(244, 67, 54, 0.8)' : 'rgba(63, 81, 181, 0.8)'
    );

    this.overallChart.update();
  }

  private updateCategoryBreakdownChart(): void {
    if (!this.categoryBreakdownChart) return;

    const data = this.monthlyCategoryData();
    const labels = data.map(item => {
      const [year, month] = item.month.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'short' });
    });

    const categories: ExpenseCategory[] = ['Dine', 'Grocery', 'Personal'];
    
    const datasets = categories.map(category => ({
      label: category,
      data: data.map(item => item.categories[category] || 0),
      backgroundColor: this.categoryColors[category],
      borderColor: this.categoryColors[category],
      borderWidth: 1,
      borderRadius: 4,
      barPercentage: 0.8
    }));

    this.categoryBreakdownChart.data.labels = labels;
    this.categoryBreakdownChart.data.datasets = datasets;
    this.categoryBreakdownChart.update();
  }

  private getMonthLabels(data: MonthlyAggregate[]): string[] {
    // Generate all 12 months for the year
    const months = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(this.selectedYear, i);
      months.push(date.toLocaleDateString('en-US', { month: 'short' }));
    }
    return months;
  }

  formatCurrency(amount: number): string {
    return this.expenseService.formatCurrency(amount);
  }

  getTotalForYear(): number {
    return this.monthlyData().reduce((sum, item) => sum + item.total, 0);
  }

  getAverageMonthlyExpense(): number {
    const data = this.monthlyData();
    const nonZeroMonths = data.filter(item => item.total > 0);
    if (nonZeroMonths.length === 0) return 0;
    return nonZeroMonths.reduce((sum, item) => sum + item.total, 0) / nonZeroMonths.length;
  }

  getHighestMonth(): { month: string; total: number } | null {
    const data = this.monthlyData();
    if (data.length === 0) return null;
    
    const highest = data.reduce((max, item) => item.total > max.total ? item : max, data[0]);
    if (highest.total === 0) return null;

    const [year, month] = highest.month.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return {
      month: date.toLocaleDateString('en-US', { month: 'long' }),
      total: highest.total
    };
  }

  getLowestMonth(): { month: string; total: number } | null {
    const data = this.monthlyData().filter(item => item.total > 0);
    if (data.length === 0) return null;
    
    const lowest = data.reduce((min, item) => item.total < min.total ? item : min, data[0]);

    const [year, month] = lowest.month.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return {
      month: date.toLocaleDateString('en-US', { month: 'long' }),
      total: lowest.total
    };
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

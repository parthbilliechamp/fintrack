import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { Chart } from 'chart.js/auto';
import { InvestmentService } from '../../shared/services/investment.service';

@Component({
  selector: 'app-investment-dashboard',
  templateUrl: './investment-dashboard.component.html',
  styleUrls: ['./investment-dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule
  ]
})
export class InvestmentDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('portfolioChart') portfolioChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('allocationChart') allocationChart!: ElementRef<HTMLCanvasElement>;

  summary: any = null;
  accountTypeData: any[] = [];
  charts: { [key: string]: Chart } = {};

  constructor(private investmentService: InvestmentService) {}

  ngOnInit(): void {
    this.loadInvestmentData();
  }

  ngAfterViewInit(): void {
    this.initializeCharts();
  }

  private loadInvestmentData(): void {
    // Get overall summary from backend
    this.investmentService.getInvestmentSummary().subscribe(data => {
      this.summary = data;
      this.updateCharts();
    });

    // Get account type aggregates from backend
    this.investmentService.getInvestmentsByAccountType().subscribe(data => {
      this.accountTypeData = data;
      this.updateCharts();
    });
  }

  private initializeCharts(): void {
    this.charts['portfolio'] = new Chart(this.portfolioChart.nativeElement, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Invested',
            data: [],
            borderColor: '#3f51b5',
            backgroundColor: 'rgba(63, 81, 181, 0.1)',
            fill: true
          },
          {
            label: 'Current Value',
            data: [],
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Portfolio Growth Over Time',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: value => '$' + value.toLocaleString()
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });

    this.charts['allocation'] = new Chart(this.allocationChart.nativeElement, {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [
            '#3f51b5',
            '#f44336',
            '#4caf50',
            '#ff9800',
            '#9c27b0'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Portfolio Allocation by Account Type',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              padding: 15
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((context.parsed * 100) / total).toFixed(1);
                return `${context.label}: $${context.parsed.toLocaleString()} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  private updateCharts(): void {
    if (!this.accountTypeData || this.accountTypeData.length === 0) return;

    if (this.charts['portfolio']) {
      const labels = this.accountTypeData.map(item => item.accountType);
      const investedData = this.accountTypeData.map(item => item.totalInvested);
      const currentData = this.accountTypeData.map(item => item.totalValue);

      this.charts['portfolio'].data.labels = labels;
      this.charts['portfolio'].data.datasets[0].data = investedData;
      this.charts['portfolio'].data.datasets[1].data = currentData;
      this.charts['portfolio'].update();
    }

    if (this.charts['allocation']) {
      const labels = this.accountTypeData.map(item => item.accountType);
      const data = this.accountTypeData.map(item => item.totalValue);

      this.charts['allocation'].data.labels = labels;
      this.charts['allocation'].data.datasets[0].data = data;
      this.charts['allocation'].update();
    }
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'CAD'
    });
  }

  formatPercentage(value: number): string {
    return value.toFixed(2) + '%';
  }

  getAccountIcon(accountType: string): string {
    const iconMap: { [key: string]: string } = {
      'TFSA': 'account_balance',
      'RRSP': 'savings',
      'FHSA': 'home',
      'Non-Registered': 'trending_up',
      'Cash': 'payments',
      'Investment': 'show_chart',
      'Brokerage': 'business_center'
    };
    return iconMap[accountType] || 'account_balance_wallet';
  }

  calculateAllocation(value: number): string {
    if (!this.summary || this.summary.totalValue === 0) return '0.0';
    return ((value / this.summary.totalValue) * 100).toFixed(1);
  }
}

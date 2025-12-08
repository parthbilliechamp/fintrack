import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InvestmentService } from '../../shared/services/investment.service';

@Component({
  selector: 'app-investment-overview',
  templateUrl: './investment-overview.component.html',
  styleUrls: ['./investment-overview.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule
  ]
})
export class InvestmentOverviewComponent implements OnInit {
  summary: any = null;
  accountTypeData: any[] = [];
  contributionStatus: Array<{
    accountType: string;
    limit: number;
    used: number;
    remaining: number;
  }> = [];
  loading = true;

  constructor(private investmentService: InvestmentService) {}

  ngOnInit(): void {
    this.loadInvestmentData();
    this.loadContributionStatus();
  }

  private loadInvestmentData(): void {
    let completedRequests = 0;
    const checkComplete = () => {
      completedRequests++;
      if (completedRequests >= 3) {
        this.loading = false;
      }
    };

    // Get overall summary from backend
    this.investmentService.getInvestmentSummary().subscribe({
      next: data => {
        this.summary = data;
      },
      error: () => {},
      complete: checkComplete
    });

    // Get account type aggregates from backend
    this.investmentService.getInvestmentsByAccountType().subscribe({
      next: data => {
        this.accountTypeData = data;
      },
      error: () => {},
      complete: checkComplete
    });
  }

  private loadContributionStatus(): void {
    const currentYear = new Date().getFullYear();
    this.investmentService.getContributionStatus(currentYear)
      .subscribe({
        next: status => {
          this.contributionStatus = status;
        },
        error: () => {
          this.loading = false;
        },
        complete: () => {
          // This is the third request
        }
      });
  }

  calculateProgress(used: number, limit: number): number {
    return limit > 0 ? (used / limit) * 100 : 0;
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
}

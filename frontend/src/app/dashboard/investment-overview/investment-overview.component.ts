import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
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
    MatProgressBarModule
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

  constructor(private investmentService: InvestmentService) {}

  ngOnInit(): void {
    this.loadInvestmentData();
    this.loadContributionStatus();
  }

  private loadInvestmentData(): void {
    // Get overall summary from backend
    this.investmentService.getInvestmentSummary().subscribe(data => {
      this.summary = data;
    });

    // Get account type aggregates from backend
    this.investmentService.getInvestmentsByAccountType().subscribe(data => {
      this.accountTypeData = data;
    });
  }

  private loadContributionStatus(): void {
    const currentYear = new Date().getFullYear();
    this.investmentService.getContributionStatus(currentYear)
      .subscribe(status => {
        this.contributionStatus = status;
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

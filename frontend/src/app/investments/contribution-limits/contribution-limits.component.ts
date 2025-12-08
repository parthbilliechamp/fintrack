import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { InvestmentService } from '../../shared/services/investment.service';
import { ContributionLimit } from '../../shared/interfaces/investment.interface';

interface LimitRow {
  accountType: string;
  limit: number;
  used: number;
  remaining: number;
  limitId?: string;
}

@Component({
  selector: 'app-contribution-limits',
  templateUrl: './contribution-limits.component.html',
  styleUrls: ['./contribution-limits.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    MatIconModule
  ]
})
export class ContributionLimitsComponent implements OnInit {
  accountTypes = ['RRSP', 'TFSA', 'FHSA'];
  selectedYear: number;
  years: number[];
  limitRows: LimitRow[] = [];
  private contributionLimits: ContributionLimit[] = [];

  constructor(
    private investmentService: InvestmentService
  ) {
    const currentYear = new Date().getFullYear();
    this.selectedYear = currentYear;
    this.years = Array.from({ length: 5 }, (_, i) => currentYear + i);
    
    // Initialize with predefined rows
    this.initializeLimitRows();
  }

  ngOnInit(): void {
    this.loadContributionLimits();
    this.loadContributionStatus();
  }

  private initializeLimitRows(): void {
    this.limitRows = this.accountTypes.map(type => ({
      accountType: type,
      limit: 0,
      used: 0,
      remaining: 0
    }));
  }

  loadContributionLimits(): void {
    this.investmentService.contributionLimits$.subscribe(limits => {
      this.contributionLimits = limits;
      this.updateLimitRowsFromLimits();
    });
  }

  loadContributionStatus(): void {
    this.investmentService.getContributionStatus(this.selectedYear)
      .subscribe(status => {
        // Update used and remaining values from status
        status.forEach(s => {
          const row = this.limitRows.find(r => r.accountType === s.accountType);
          if (row) {
            row.used = s.used;
            row.limit = s.limit;
            row.remaining = s.remaining;
          }
        });
      });
  }

  private updateLimitRowsFromLimits(): void {
    const yearLimits = this.contributionLimits.filter(l => l.year === this.selectedYear);
    
    this.limitRows.forEach(row => {
      const existingLimit = yearLimits.find(l => l.accountType === row.accountType);
      if (existingLimit) {
        row.limit = existingLimit.limit;
        row.limitId = existingLimit.id;
        row.remaining = row.limit - row.used;
      }
    });
  }

  onYearChange(year: number): void {
    this.selectedYear = year;
    this.initializeLimitRows();
    this.updateLimitRowsFromLimits();
    this.loadContributionStatus();
  }

  onLimitChange(item: LimitRow): void {
    const yearLimits = this.contributionLimits.filter(l => l.year === this.selectedYear);
    const existingLimit = yearLimits.find(l => l.accountType === item.accountType);
    
    // Update remaining value immediately
    item.remaining = item.limit - item.used;
    
    if (existingLimit) {
      // Update existing limit
      this.investmentService.updateContributionLimit(existingLimit.id, {
        year: this.selectedYear,
        accountType: item.accountType as 'RRSP' | 'TFSA' | 'FHSA',
        limit: item.limit
      }).subscribe({
        next: () => {
          console.log('Limit updated successfully');
        },
        error: (error) => {
          console.error('Error updating limit:', error);
        }
      });
    } else if (item.limit > 0) {
      // Create new limit
      this.investmentService.addContributionLimit({
        year: this.selectedYear,
        accountType: item.accountType as 'RRSP' | 'TFSA' | 'FHSA',
        limit: item.limit
      }).subscribe({
        next: (newLimit) => {
          item.limitId = newLimit.id;
          console.log('Limit created successfully');
        },
        error: (error) => {
          console.error('Error creating limit:', error);
        }
      });
    }
  }

  calculateProgress(used: number, limit: number): number {
    if (limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'CAD'
    });
  }

  formatPercentage(value: number): string {
    return value.toFixed(1) + '%';
  }

  getAccountIcon(accountType: string): string {
    const icons: Record<string, string> = {
      'RRSP': 'account_balance',
      'TFSA': 'savings',
      'FHSA': 'home'
    };
    return icons[accountType] || 'account_balance_wallet';
  }
}

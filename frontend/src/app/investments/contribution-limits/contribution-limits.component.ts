import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { Subject, takeUntil } from 'rxjs';
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
export class ContributionLimitsComponent implements OnInit, OnDestroy {
  accountTypes = ['RRSP', 'TFSA', 'FHSA'];
  selectedYear: number;
  years: number[];
  limitRows: LimitRow[] = [];
  private contributionLimits: ContributionLimit[] = [];
  private destroy$ = new Subject<void>();

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
    // Subscribe to contribution limits first - this will trigger loadContributionStatus when limits are loaded
    this.investmentService.contributionLimits$.pipe(takeUntil(this.destroy$)).subscribe(limits => {
      console.log('Contribution limits loaded:', limits);
      this.contributionLimits = limits;
      this.updateLimitRowsFromLimits();
      // Load contribution status after limits are loaded so we can set limitIds
      this.loadContributionStatus();
    });
    
    // Subscribe to investment changes to reload contribution status
    this.investmentService.investments$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadContributionStatus();
    });
    
    // Subscribe to transactions changes to reload contribution status
    this.investmentService.transactions$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadContributionStatus();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeLimitRows(): void {
    this.limitRows = this.accountTypes.map(type => ({
      accountType: type,
      limit: 0,
      used: 0,
      remaining: 0
    }));
  }

  loadContributionStatus(): void {
    this.investmentService.getContributionStatus(this.selectedYear)
      .subscribe(status => {
        console.log('Contribution status loaded:', status);
        // Update used values from status, but also sync limits and find limitIds
        status.forEach(s => {
          const row = this.limitRows.find(r => r.accountType === s.accountType);
          if (row) {
            row.used = s.used;
            row.limit = s.limit;
            row.remaining = s.limit > 0 ? s.limit - s.used : 0;
            
            // Find and set the limitId from contributionLimits
            const existingLimit = this.contributionLimits.find(
              l => l.year === this.selectedYear && l.accountType === s.accountType
            );
            if (existingLimit) {
              row.limitId = existingLimit.id;
              console.log(`Found limitId for ${row.accountType}:`, row.limitId);
            }
          }
        });
      });
  }

  private updateLimitRowsFromLimits(): void {
    const yearLimits = this.contributionLimits.filter(l => l.year === this.selectedYear);
    console.log('Updating limit rows from limits:', yearLimits);
    
    this.limitRows.forEach(row => {
      const existingLimit = yearLimits.find(l => l.accountType === row.accountType);
      if (existingLimit) {
        row.limit = existingLimit.limit;
        row.limitId = existingLimit.id;
        row.remaining = row.limit - row.used;
        console.log(`Set limitId for ${row.accountType}:`, row.limitId);
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
    // Update remaining value immediately
    item.remaining = item.limit - item.used;
    
    console.log('onLimitChange called:', { accountType: item.accountType, limit: item.limit, limitId: item.limitId });
    
    if (item.limitId) {
      // Update existing limit using the stored limitId
      console.log('Updating existing limit with id:', item.limitId);
      this.investmentService.updateContributionLimit(item.limitId, {
        year: this.selectedYear,
        accountType: item.accountType as 'RRSP' | 'TFSA' | 'FHSA',
        limit: item.limit
      }).subscribe({
        next: (updatedLimit) => {
          console.log('Limit updated successfully:', updatedLimit);
          // Update the local contributionLimits cache
          const index = this.contributionLimits.findIndex(l => l.id === item.limitId);
          if (index !== -1) {
            this.contributionLimits[index].limit = item.limit;
          }
        },
        error: (error) => {
          console.error('Error updating limit:', error);
        }
      });
    } else if (item.limit > 0) {
      // Create new limit
      console.log('Creating new limit for:', item.accountType);
      this.investmentService.addContributionLimit({
        year: this.selectedYear,
        accountType: item.accountType as 'RRSP' | 'TFSA' | 'FHSA',
        limit: item.limit
      }).subscribe({
        next: (newLimit) => {
          item.limitId = newLimit.id;
          console.log('Limit created successfully:', newLimit);
          // Add to local contributionLimits cache
          this.contributionLimits.push(newLimit);
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

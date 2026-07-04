import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InvestmentService } from '../../shared/services/investment.service';
import { Investment } from '../../shared/interfaces/investment.interface';

@Component({
  selector: 'app-investment-list',
  templateUrl: './investment-list.component.html',
  styleUrls: ['./investment-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule
  ]
})
export class InvestmentListComponent implements OnInit {
  overviewDisplayedColumns: string[] = [
    'accountName',
    'accountType',
    'investedAmount',
    'currentValue',
    'yearInvestedAmount'
  ];
  displayedColumns: string[] = [
    'accountName',
    'accountType',
    'investedAmount',
    'currentValue',
    'yearInvestedAmount',
    'actions'
  ];
  investments: Investment[] = [];
  accountTypeTotals: Record<string, { invested: number; current: number; yearInvested: number }> = {};
  totalInvested = 0;
  totalCurrent = 0;
  totalYearInvested = 0;
  currentYear = new Date().getFullYear();
  activeTab: 'overview' | 'accounts' = 'overview';

  constructor(
    private investmentService: InvestmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadInvestments();
  }

  loadInvestments(): void {
    this.investmentService.investments$.subscribe(investments => {
      this.investments = investments;
      this.calculateTotals();
    });
  }

  private calculateTotals(): void {
    this.accountTypeTotals = {};
    this.totalInvested = 0;
    this.totalCurrent = 0;
    this.totalYearInvested = 0;

    this.investments.forEach(investment => {
      const yearInvested = investment.yearInvestedAmount ?? 0;

      if (!this.accountTypeTotals[investment.accountType]) {
        this.accountTypeTotals[investment.accountType] = {
          invested: 0,
          current: 0,
          yearInvested: 0
        };
      }

      this.accountTypeTotals[investment.accountType].invested += investment.investedAmount;
      this.accountTypeTotals[investment.accountType].current += investment.currentValue;
      this.accountTypeTotals[investment.accountType].yearInvested += yearInvested;

      this.totalInvested += investment.investedAmount;
      this.totalCurrent += investment.currentValue;
      this.totalYearInvested += yearInvested;
    });
  }

  calculateGrowth(invested: number, current: number): number {
    if (invested === 0) return 0;
    return ((current - invested) / invested) * 100;
  }

  getYearInvested(investment: Investment): number {
    return investment.yearInvestedAmount ?? 0;
  }

  getAccountIcon(accountType: string): string {
    const icons: Record<string, string> = {
      'TFSA': 'savings',
      'RRSP': 'account_balance',
      'FHSA': 'home',
      'Savings': 'account_balance_wallet'
    };
    return icons[accountType] || 'account_balance_wallet';
  }

  getAccountTypeClass(accountType: string): string {
    return accountType.toLowerCase().replace(/\s+/g, '-');
  }

  addInvestment(): void {
    this.router.navigate(['/investments/new']);
  }

  addContribution(): void {
    this.router.navigate(['/contribution-limits']);
  }

  editInvestment(investment: Investment): void {
    this.router.navigate(['/investments/edit', investment.id]);
  }

  deleteInvestment(investment: Investment): void {
    if (confirm('Are you sure you want to delete this investment account?')) {
      this.investmentService.deleteInvestment(investment.id).subscribe({
        next: () => {
          console.log('Investment deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting investment:', error);
        }
      });
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
}

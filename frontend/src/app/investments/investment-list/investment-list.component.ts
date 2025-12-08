import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { InvestmentService } from '../../shared/services/investment.service';
import { Investment, InvestmentTransaction } from '../../shared/interfaces/investment.interface';

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
    MatExpansionModule
  ]
})
export class InvestmentListComponent implements OnInit {
  displayedColumns: string[] = ['accountName', 'accountType', 'investedAmount', 'currentValue', 'growth', 'actions'];
  investments: Investment[] = [];
  transactions: InvestmentTransaction[] = [];
  accountTypeTotals: Record<string, { invested: number; current: number }> = {};
  totalInvested = 0;
  totalCurrent = 0;
  activeTab: 'overview' | 'accounts' | 'transactions' = 'overview';
  contributions: any[] = [];
  expandedAccountId: string | null = null;

  constructor(
    private investmentService: InvestmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadInvestments();
    this.loadTransactions();
  }

  loadInvestments(): void {
    this.investmentService.investments$.subscribe(investments => {
      this.investments = investments;
      this.calculateTotals();
    });
  }

  loadTransactions(): void {
    this.investmentService.transactions$.subscribe(transactions => {
      this.transactions = transactions;
    });
  }

  getTransactionsForAccount(accountId: string): InvestmentTransaction[] {
    return this.transactions.filter(t => t.accountId === accountId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  toggleAccountExpansion(accountId: string): void {
    this.expandedAccountId = this.expandedAccountId === accountId ? null : accountId;
  }

  private calculateTotals(): void {
    this.accountTypeTotals = {};
    this.totalInvested = 0;
    this.totalCurrent = 0;

    this.investments.forEach(investment => {
      if (!this.accountTypeTotals[investment.accountType]) {
        this.accountTypeTotals[investment.accountType] = {
          invested: 0,
          current: 0
        };
      }

      this.accountTypeTotals[investment.accountType].invested += investment.investedAmount;
      this.accountTypeTotals[investment.accountType].current += investment.currentValue;
      
      this.totalInvested += investment.investedAmount;
      this.totalCurrent += investment.currentValue;
    });
  }

  calculateGrowth(invested: number, current: number): number {
    if (invested === 0) return 0;
    return ((current - invested) / invested) * 100;
  }

  addInvestment(): void {
    this.router.navigate(['/investments/new']);
  }

  addContribution(): void {
    this.router.navigate(['/investments/contribution-limits']);
  }

  addTransaction(): void {
    this.router.navigate(['/investments/add-transaction']);
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

  getAccountIcon(accountType: string): string {
    const icons: Record<string, string> = {
      'TFSA': 'savings',
      'RRSP': 'account_balance',
      'FHSA': 'home',
      'Non-Registered': 'trending_up',
      'RESP': 'school'
    };
    return icons[accountType] || 'account_balance_wallet';
  }

  formatPercentage(value: number): string {
    return value.toFixed(2) + '%';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

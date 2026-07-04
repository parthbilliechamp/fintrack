import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, combineLatest, map, interval, startWith } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { ExpenseService } from '../../shared/services/expense.service';
import { InvestmentService } from '../../shared/services/investment.service';
import { FinancialPlanService } from '../../shared/services/financial-plan.service';
import { Expense } from '../../shared/interfaces/expense.interface';
import { Investment } from '../../shared/interfaces/investment.interface';

interface OverviewStats {
  userName: string;
  netWorth: number;
  currentMonthExpense: number;
  portfolioGrowthPercentage: number;
  portfolioGain: number;
  portfolioValue: number;
  totalInvested: number;
  biweeklyIncome: number;
  monthlyIncome: number;
  savingsRate: number;
}

interface CategorySlice {
  category: string;
  total: number;
  percentage: number;
  count: number;
  icon: string;
  colorVar: string;
}

interface PortfolioRow {
  accountName: string;
  accountType: string;
  currentValue: number;
  investedAmount: number;
  growth: number;
  icon: string;
}

interface RoomRow {
  accountType: string;
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
  icon: string;
}

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  stats: OverviewStats = {
    userName: '',
    netWorth: 0,
    currentMonthExpense: 0,
    portfolioGrowthPercentage: 0,
    portfolioGain: 0,
    portfolioValue: 0,
    totalInvested: 0,
    biweeklyIncome: 0,
    monthlyIncome: 0,
    savingsRate: 0
  };

  categoryBreakdown: CategorySlice[] = [];
  recentTransactions: Expense[] = [];
  portfolioRows: PortfolioRow[] = [];
  contributionRoom: RoomRow[] = [];

  loading = true;

  constructor(
    private authService: AuthService,
    private expenseService: ExpenseService,
    private investmentService: InvestmentService,
    private financialPlanService: FinancialPlanService
  ) {}

  ngOnInit(): void {
    interval(15000).pipe(
      startWith(0),
      takeUntil(this.destroy$)
    ).subscribe(() => this.investmentService.reloadData());

    this.loadOverviewData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadOverviewData(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.stats.userName = currentUser.name;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    combineLatest([
      this.expenseService.expenses$,
      this.investmentService.investments$,
      this.financialPlanService.getFinancialPlan(),
      this.investmentService.contributionLimits$
    ]).pipe(
      takeUntil(this.destroy$),
      map(([expenses, investments, plan, limits]) => {
        const monthExpenses = expenses.filter(e => {
          const d = new Date(e.date);
          return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        });

        const monthlyExpenseTotal = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        const totalInvestmentsValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
        const totalInvestedValue = investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
        const portfolioGain = totalInvestmentsValue - totalInvestedValue;
        const portfolioGrowthPercentage = totalInvestedValue > 0 ? (portfolioGain / totalInvestedValue) * 100 : 0;

        const biweeklyIncome = plan?.biweeklyIncomeAfterTax ?? 0;
        const monthlyIncome = biweeklyIncome * 2;
        const savingsRate = monthlyIncome > 0
          ? Math.max(0, Math.min(100, ((monthlyIncome - monthlyExpenseTotal) / monthlyIncome) * 100))
          : 0;

        return {
          monthExpenses,
          monthlyExpenseTotal,
          investments,
          limits,
          currentYear,
          netWorth: totalInvestmentsValue,
          portfolioValue: totalInvestmentsValue,
          totalInvested: totalInvestedValue,
          portfolioGain,
          portfolioGrowthPercentage,
          biweeklyIncome,
          monthlyIncome,
          savingsRate,
          recent: [...expenses]
        };
      })
    ).subscribe(data => {
      this.stats.currentMonthExpense = data.monthlyExpenseTotal;
      this.stats.netWorth = data.netWorth;
      this.stats.portfolioValue = data.portfolioValue;
      this.stats.totalInvested = data.totalInvested;
      this.stats.portfolioGain = data.portfolioGain;
      this.stats.portfolioGrowthPercentage = data.portfolioGrowthPercentage;
      this.stats.biweeklyIncome = data.biweeklyIncome;
      this.stats.monthlyIncome = data.monthlyIncome;
      this.stats.savingsRate = data.savingsRate;

      this.categoryBreakdown = this.buildCategoryBreakdown(data.monthExpenses);
      this.recentTransactions = data.recent
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
      this.portfolioRows = this.buildPortfolioRows(data.investments);
      this.contributionRoom = this.buildContributionRoom(data.investments, data.limits, data.currentYear);

      this.loading = false;
    });
  }

  private buildCategoryBreakdown(expenses: Expense[]): CategorySlice[] {
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const categories: { name: string; icon: string; colorVar: string }[] = [
      { name: 'Dine', icon: 'restaurant', colorVar: 'var(--cat-dine)' },
      { name: 'Grocery', icon: 'shopping_cart', colorVar: 'var(--cat-grocery)' },
      { name: 'Personal', icon: 'person', colorVar: 'var(--cat-personal)' }
    ];

    return categories.map(cat => {
      const items = expenses.filter(e => e.category === cat.name);
      const catTotal = items.reduce((s, e) => s + e.amount, 0);
      return {
        category: cat.name,
        total: catTotal,
        count: items.length,
        percentage: total > 0 ? (catTotal / total) * 100 : 0,
        icon: cat.icon,
        colorVar: cat.colorVar
      };
    }).sort((a, b) => b.total - a.total);
  }

  private buildPortfolioRows(investments: Investment[]): PortfolioRow[] {
    return [...investments]
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(0, 4)
      .map(inv => ({
        accountName: inv.accountName,
        accountType: inv.accountType,
        currentValue: inv.currentValue,
        investedAmount: inv.investedAmount,
        growth: inv.investedAmount > 0
          ? ((inv.currentValue - inv.investedAmount) / inv.investedAmount) * 100
          : 0,
        icon: this.getAccountIcon(inv.accountType)
      }));
  }

  private buildContributionRoom(investments: Investment[], limits: any[], year: number): RoomRow[] {
    const types = ['RRSP', 'TFSA', 'FHSA'];
    return types.map(type => {
      const used = investments
        .filter(i => i.accountType === type)
        .reduce((s, i) => s + (i.yearInvestedAmount ?? 0), 0);
      const limitEntry = limits.find(l => l.accountType === type && l.year === year);
      const limit = limitEntry?.limit ?? 0;
      const remaining = limit - used;
      return {
        accountType: type,
        used,
        limit,
        remaining,
        percentage: limit > 0 ? Math.min(100, (used / limit) * 100) : 0,
        icon: this.getAccountIcon(type)
      };
    }).filter(r => r.limit > 0 || r.used > 0);
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

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'Dine': 'restaurant',
      'Grocery': 'shopping_cart',
      'Personal': 'person'
    };
    return icons[category] || 'payments';
  }

  get hasExpenses(): boolean {
    return this.categoryBreakdown.some(c => c.total > 0);
  }

  get hasPortfolio(): boolean {
    return this.portfolioRows.length > 0;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  formatCurrencyPrecise(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  getCurrentMonthName(): string {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  formatPercentage(value: number): string {
    return (value >= 0 ? '+' : '') + value.toFixed(1) + '%';
  }
}

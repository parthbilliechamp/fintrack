import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FinancialPlanService } from '../shared/services/financial-plan.service';
import { ConfirmDialogService } from '../shared/services/confirm-dialog.service';
import { FinancialPlan, PlanSection, InvestmentRowType, EtfRowType, ContributionSource } from '../shared/interfaces/financial-plan.interface';

type PlanTab = 'salary' | 'investments' | 'etf' | 'expenses';

interface SalaryRow {
  id: string;
  label: string;
  biweekly: number;
  monthly: number;
  percent: number;
}

interface AmountRow {
  id: string;
  label: string;
  monthly: number;
  biweekly: number;
  percent: number;
  targetPercent?: number;
  rowType?: InvestmentRowType | EtfRowType;
  indent?: number;
  isGroup?: boolean;
  accountCategory?: string;
  accountSubCategory?: string;
  contributionSource?: ContributionSource;
  category?: string;
}

@Component({
  selector: 'app-financial-plan',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './financial-plan.component.html',
  styleUrls: ['./financial-plan.component.scss']
})
export class FinancialPlanComponent implements OnInit {
  loading = true;
  saving = false;
  errorMessage: string | null = null;
  plan: FinancialPlan | null = null;
  activeTab: PlanTab = 'salary';

  payPeriodsPerYear = 26;
  biweeklyIncome = 0;
  monthlyIncome = 0;

  // Derived rows
  salaryRows: SalaryRow[] = [];
  investmentRows: AmountRow[] = [];
  etfRows: AmountRow[] = [];
  expenseRows: AmountRow[] = [];

  // Biweekly headline totals
  biweeklyInvestments = 0;
  biweeklyExpenses = 0;
  biweeklyEtf = 0;
  biweeklySalaryAllocated = 0;

  // Monthly totals (for table footers)
  monthlyInvestmentsTotal = 0;
  monthlyExpensesTotal = 0;
  monthlyEtfTotal = 0;

  // Inline income edit
  editingIncome = false;
  incomeDraft = 0;

  // Inline row edit (generic across all 4 sections)
  editingSection: PlanSection | null = null;
  editingRowId: string | null = null;
  editDraft: any = {};

  // New row drafts
  newSalaryRow = { label: '', amount: null as number | null };
  newInvestmentRow = { label: '', monthlyAmount: null as number | null };
  newEtfRow = { ticker: '', targetPercent: null as number | null, monthlyAmount: null as number | null };
  newExpenseRow = { label: '', monthlyAmount: null as number | null };

  constructor(
    private financialPlanService: FinancialPlanService,
    private confirmDialog: ConfirmDialogService
  ) {}

  ngOnInit(): void {
    this.loadPlan();
  }

  private loadPlan(): void {
    this.loading = true;
    this.financialPlanService.getFinancialPlan().subscribe(plan => {
      this.applyPlan(plan);
      this.loading = false;
    });
  }

  setActiveTab(tab: PlanTab): void {
    this.activeTab = tab;
    this.cancelEdit();
  }

  // ============ Income (top-level setting) ============

  startEditIncome(): void {
    this.incomeDraft = this.biweeklyIncome;
    this.editingIncome = true;
  }

  cancelEditIncome(): void {
    this.editingIncome = false;
  }

  saveIncome(): void {
    if (this.incomeDraft === null || this.incomeDraft < 0) {
      this.errorMessage = 'Income must be a non-negative number';
      return;
    }
    this.saving = true;
    this.financialPlanService.updateSettings({ biweeklyIncomeAfterTax: this.incomeDraft }).subscribe({
      next: plan => {
        this.applyPlan(plan);
        this.editingIncome = false;
        this.saving = false;
      },
      error: () => {
        this.errorMessage = 'Failed to update income. Please try again.';
        this.saving = false;
      }
    });
  }

  // ============ Generic row edit/delete ============

  startEdit(section: PlanSection, row: { id: string }, fields: Record<string, unknown>): void {
    this.errorMessage = null;
    this.editingSection = section;
    this.editingRowId = row.id;
    this.editDraft = { ...fields };
  }

  cancelEdit(): void {
    this.editingSection = null;
    this.editingRowId = null;
    this.editDraft = {};
  }

  isEditing(rowId: string): boolean {
    return this.editingRowId === rowId;
  }

  saveEdit(): void {
    if (!this.editingSection || !this.editingRowId) return;
    this.saving = true;
    this.financialPlanService.updateItem(this.editingSection, this.editingRowId, this.editDraft).subscribe({
      next: plan => {
        this.applyPlan(plan);
        this.cancelEdit();
        this.saving = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Failed to update row. Please try again.';
        this.saving = false;
      }
    });
  }

  deleteRow(section: PlanSection, row: { id: string; label?: string; ticker?: string }): void {
    const name = row.label || row.ticker || 'this row';
    this.confirmDialog.confirm({
      title: 'Delete row',
      message: `Are you sure you want to delete "${name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true
    }).subscribe(confirmed => {
      if (!confirmed) return;

      this.saving = true;
      this.financialPlanService.deleteItem(section, row.id).subscribe({
        next: plan => {
          this.applyPlan(plan);
          this.saving = false;
        },
        error: (err) => {
          this.errorMessage = err?.error?.error || 'Failed to delete row. Please try again.';
          this.saving = false;
        }
      });
    });
  }

  // ============ Add new rows ============

  addSalaryRow(): void {
    if (!this.newSalaryRow.label.trim() || this.newSalaryRow.amount === null || this.newSalaryRow.amount < 0) {
      this.errorMessage = 'Please provide a label and a non-negative amount';
      return;
    }
    this.saving = true;
    this.financialPlanService.addItem('salaryBreakdown', {
      label: this.newSalaryRow.label,
      amount: this.newSalaryRow.amount
    }).subscribe({
      next: plan => {
        this.applyPlan(plan);
        this.newSalaryRow = { label: '', amount: null };
        this.saving = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Failed to add row. Please try again.';
        this.saving = false;
      }
    });
  }

  addInvestmentRow(): void {
    if (!this.newInvestmentRow.label.trim() || this.newInvestmentRow.monthlyAmount === null || this.newInvestmentRow.monthlyAmount < 0) {
      this.errorMessage = 'Please provide a label and a non-negative monthly amount';
      return;
    }
    this.saving = true;
    this.financialPlanService.addItem('monthlyInvestments', {
      label: this.newInvestmentRow.label,
      monthlyAmount: this.newInvestmentRow.monthlyAmount
    }).subscribe({
      next: plan => {
        this.applyPlan(plan);
        this.newInvestmentRow = { label: '', monthlyAmount: null };
        this.saving = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Failed to add row. Please try again.';
        this.saving = false;
      }
    });
  }

  addEtfRow(): void {
    if (!this.newEtfRow.ticker.trim() || this.newEtfRow.targetPercent === null || this.newEtfRow.monthlyAmount === null) {
      this.errorMessage = 'Please provide a ticker, target % and monthly amount';
      return;
    }
    this.saving = true;
    this.financialPlanService.addItem('etfAllocation', {
      ticker: this.newEtfRow.ticker,
      targetPercent: this.newEtfRow.targetPercent,
      monthlyAmount: this.newEtfRow.monthlyAmount
    }).subscribe({
      next: plan => {
        this.applyPlan(plan);
        this.newEtfRow = { ticker: '', targetPercent: null, monthlyAmount: null };
        this.saving = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Failed to add row. Please try again.';
        this.saving = false;
      }
    });
  }

  addExpenseRow(): void {
    if (!this.newExpenseRow.label.trim() || this.newExpenseRow.monthlyAmount === null || this.newExpenseRow.monthlyAmount < 0) {
      this.errorMessage = 'Please provide a label and a non-negative monthly amount';
      return;
    }
    this.saving = true;
    this.financialPlanService.addItem('monthlyExpenses', {
      label: this.newExpenseRow.label,
      monthlyAmount: this.newExpenseRow.monthlyAmount
    }).subscribe({
      next: plan => {
        this.applyPlan(plan);
        this.newExpenseRow = { label: '', monthlyAmount: null };
        this.saving = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Failed to add row. Please try again.';
        this.saving = false;
      }
    });
  }

  dismissError(): void {
    this.errorMessage = null;
  }

  // ============ Derived data ============

  private applyPlan(plan: FinancialPlan | null): void {
    this.plan = plan;
    if (plan) {
      this.computeDerivedData(plan);
    }
  }

  private computeDerivedData(plan: FinancialPlan): void {
    this.payPeriodsPerYear = plan.payPeriodsPerYear || 26;
    this.biweeklyIncome = plan.biweeklyIncomeAfterTax;
    this.monthlyIncome = this.financialPlanService.biweeklyToMonthly(plan.biweeklyIncomeAfterTax);

    const toBiweekly = (monthly: number) => this.financialPlanService.monthlyToBiweekly(monthly);
    const toMonthly = (biweekly: number) => this.financialPlanService.biweeklyToMonthly(biweekly);

    // Salary breakdown (stored biweekly)
    this.salaryRows = plan.salaryBreakdown.map(item => ({
      id: item.id!,
      label: item.label,
      biweekly: item.amount,
      monthly: toMonthly(item.amount),
      percent: this.biweeklyIncome > 0 ? (item.amount / this.biweeklyIncome) * 100 : 0
    }));
    this.biweeklySalaryAllocated = this.salaryRows.reduce((s, r) => s + r.biweekly, 0);

    // Monthly investments (hierarchical)
    const categoryItems = plan.monthlyInvestments.filter(i => i.rowType === 'category' || !i.rowType);
    this.monthlyInvestmentsTotal = categoryItems.reduce((s, i) => s + i.monthlyAmount, 0);
    this.investmentRows = [...plan.monthlyInvestments]
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map(item => ({
        id: item.id!,
        label: item.label,
        monthly: item.monthlyAmount,
        biweekly: toBiweekly(item.monthlyAmount),
        percent: item.rowType === 'category' && this.monthlyInvestmentsTotal > 0
          ? (item.monthlyAmount / this.monthlyInvestmentsTotal) * 100
          : 0,
        rowType: item.rowType ?? 'category',
        indent: this.investmentIndent(item.rowType ?? 'category'),
        contributionSource: item.contributionSource,
        category: item.category
      }));
    this.biweeklyInvestments = toBiweekly(this.monthlyInvestmentsTotal);

    // ETF allocation (grouped by account)
    const etfLeafItems = plan.etfAllocation.filter(e => e.rowType !== 'group');
    const totalEtfBiweekly = etfLeafItems.reduce((s, e) => {
      const bw = e.biweeklyAmount ?? toBiweekly(e.monthlyAmount);
      return s + bw;
    }, 0);
    this.monthlyEtfTotal = totalEtfBiweekly * 2;
    this.etfRows = [...plan.etfAllocation]
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map(item => {
        const isGroup = item.rowType === 'group';
        const biweekly = item.biweeklyAmount ?? toBiweekly(item.monthlyAmount);
        const monthly = item.biweeklyAmount !== undefined ? biweekly * 2 : item.monthlyAmount;
        return {
          id: item.id!,
          label: item.ticker,
          monthly,
          biweekly,
          percent: !isGroup && totalEtfBiweekly > 0 ? (biweekly / totalEtfBiweekly) * 100 : 0,
          targetPercent: item.targetPercent,
          rowType: item.rowType ?? 'etf',
          isGroup,
          accountCategory: item.accountCategory,
          accountSubCategory: item.accountSubCategory
        };
      });
    this.biweeklyEtf = totalEtfBiweekly;

    // Monthly expenses
    this.monthlyExpensesTotal = plan.monthlyExpenses.reduce((s, e) => s + e.monthlyAmount, 0);
    this.expenseRows = plan.monthlyExpenses.map(item => ({
      id: item.id!,
      label: item.label,
      monthly: item.monthlyAmount,
      biweekly: toBiweekly(item.monthlyAmount),
      percent: this.monthlyExpensesTotal > 0 ? (item.monthlyAmount / this.monthlyExpensesTotal) * 100 : 0
    }));
    this.biweeklyExpenses = toBiweekly(this.monthlyExpensesTotal);
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  formatCurrencyPrecise(amount: number): string {
    return amount.toLocaleString('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  formatPercent(value: number): string {
    return value.toFixed(1) + '%';
  }

  formatCurrencyOrDash(amount: number, isGroup?: boolean): string {
    if (isGroup) return '—';
    return this.formatCurrency(amount);
  }

  formatCurrencyPreciseOrDash(amount: number, isGroup?: boolean): string {
    if (isGroup) return '—';
    return this.formatCurrencyPrecise(amount);
  }

  investmentRowClass(row: AmountRow): string {
    const classes = [`row-${row.rowType}`];
    if (row.indent !== undefined) classes.push(`indent-${row.indent}`);
    if (row.contributionSource) classes.push(`contrib-${row.contributionSource}`);
    return classes.join(' ');
  }

  investmentShowsAmount(row: AmountRow): boolean {
    return row.rowType === 'category' || row.rowType === 'account';
  }

  investmentIsEditable(row: AmountRow): boolean {
    return row.rowType === 'category' || row.rowType === 'account';
  }

  getContributionBadge(source?: ContributionSource): { label: string; cssClass: string } | null {
    switch (source) {
      case 'employer': return { label: 'Employer', cssClass: 'badge-employer' };
      case 'dpsp': return { label: 'DPSP', cssClass: 'badge-dpsp' };
      case 'member': return { label: 'You', cssClass: 'badge-member' };
      case 'personal': return { label: 'Personal', cssClass: 'badge-personal' };
      default: return null;
    }
  }

  getSalaryIcon(label: string): string {
    const l = label.toLowerCase();
    if (l.includes('ressop') || l.includes('rrsp')) return 'business_center';
    if (l.includes('dc plan')) return 'corporate_fare';
    if (l.includes('emergency')) return 'savings';
    if (l.includes('wealth')) return 'trending_up';
    if (l.includes('expense')) return 'receipt_long';
    return 'account_balance_wallet';
  }

  getSalaryIconClass(label: string): string {
    const l = label.toLowerCase();
    if (l.includes('ressop') || l.includes('rrsp') || l.includes('dc plan')) return 'chip-indigo';
    if (l.includes('emergency')) return 'chip-emerald';
    if (l.includes('wealth')) return 'chip-violet';
    if (l.includes('expense')) return 'chip-rose';
    return 'chip-slate';
  }

  getInvestmentIcon(row: AmountRow): string {
    if (row.rowType === 'category') {
      const l = row.label.toLowerCase();
      if (l.includes('emergency')) return 'savings';
      if (l.includes('rbc')) return 'account_balance';
      if (l.includes('wealth')) return 'trending_up';
      return 'pie_chart';
    }
    if (row.rowType === 'subcategory') return 'folder_open';
    switch (row.label) {
      case 'TFSA': return 'shield';
      case 'RRSP': return 'lock';
      case 'DPSP': return 'corporate_fare';
      case 'Employer': return 'domain';
      case 'Contributor': return 'person';
      case 'FHSA': return 'home_work';
      default: return 'account_balance_wallet';
    }
  }

  getInvestmentIconClass(row: AmountRow): string {
    if (row.rowType === 'category') {
      const l = (row.category ?? row.label).toLowerCase();
      if (l.includes('emergency')) return 'chip-emerald';
      if (l.includes('rbc')) return 'chip-indigo';
      if (l.includes('wealth')) return 'chip-violet';
      return 'chip-slate';
    }
    if (row.rowType === 'subcategory') return 'chip-slate-light';
    switch (row.contributionSource) {
      case 'employer': return 'chip-indigo';
      case 'dpsp': return 'chip-amber';
      case 'member': return 'chip-emerald';
      default: return 'chip-slate-light';
    }
  }

  getExpenseIcon(label: string): string {
    const l = label.toLowerCase();
    if (l.includes('rent')) return 'home';
    if (l.includes('gym') || l.includes('fitness')) return 'fitness_center';
    if (l.includes('grocery') || l.includes('food')) return 'shopping_cart';
    if (l.includes('mobile') || l.includes('phone')) return 'phone_iphone';
    if (l.includes('transport') || l.includes('uber')) return 'directions_car';
    if (l.includes('electric')) return 'bolt';
    if (l.includes('insurance')) return 'verified_user';
    if (l.includes('subscription') || l.includes('apple')) return 'subscriptions';
    if (l.includes('money home')) return 'send';
    return 'payments';
  }

  getExpenseIconClass(label: string): string {
    const l = label.toLowerCase();
    if (l.includes('rent')) return 'chip-indigo';
    if (l.includes('gym')) return 'chip-emerald';
    if (l.includes('grocery') || l.includes('uber')) return 'chip-amber';
    if (l.includes('mobile') || l.includes('electric') || l.includes('insurance')) return 'chip-slate';
    if (l.includes('money home')) return 'chip-violet';
    return 'chip-rose';
  }

  getEtfIcon(row: AmountRow): string {
    if (row.isGroup) return 'folder_special';
    const t = row.label.toUpperCase();
    if (t.includes('MONEY MARKET')) return 'savings';
    if (t.includes('SHARES')) return 'show_chart';
    if (t === 'VFV' || t === 'XEQT' || t.includes('EQUITY')) return 'candlestick_chart';
    if (t === 'ZGLD' || t.includes('GOLD')) return 'diamond';
    return 'donut_small';
  }

  getEtfIconClass(row: AmountRow): string {
    if (row.isGroup) return 'chip-amber';
    const cat = (row.accountCategory ?? '').toLowerCase();
    if (cat.includes('wealth')) return 'chip-violet';
    if (cat.includes('employer')) return 'chip-indigo';
    if (cat.includes('contributor') || cat.includes('member')) return 'chip-emerald';
    return 'chip-amber-light';
  }

  private investmentIndent(rowType: InvestmentRowType): number {
    switch (rowType) {
      case 'category': return 0;
      case 'subcategory': return 1;
      case 'account': return 2;
      default: return 0;
    }
  }

  // ============ Cash-flow ratio bar ============

  get paycheckRemaining(): number {
    return this.biweeklyIncome - this.biweeklyInvestments - this.biweeklyEtf - this.biweeklyExpenses;
  }

  flowPercent(amount: number): number {
    if (this.biweeklyIncome <= 0) return 0;
    return Math.min(100, Math.max(0, (amount / this.biweeklyIncome) * 100));
  }
}

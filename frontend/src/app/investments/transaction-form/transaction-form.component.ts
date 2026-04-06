import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { InvestmentService } from '../../shared/services/investment.service';
import { Investment, InvestmentTransaction } from '../../shared/interfaces/investment.interface';
import { take } from 'rxjs';

@Component({
  selector: 'app-transaction-form',
  templateUrl: './transaction-form.component.html',
  styleUrls: ['./transaction-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCardModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule
  ]
})
export class TransactionFormComponent implements OnInit {
  transactionForm: FormGroup;
  accounts: Investment[] = [];
  loading = false;
  isEditMode = false;
  transactionId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private investmentService: InvestmentService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.transactionForm = this.fb.group({
      accountId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      date: [new Date(), Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadAccounts();
    this.loadTransactionForEdit();
  }

  loadAccounts(): void {
    this.investmentService.investments$.subscribe(investments => {
      this.accounts = investments;
    });
  }

  loadTransactionForEdit(): void {
    this.transactionId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.transactionId;
    if (!this.transactionId) return;

    this.investmentService.transactions$.pipe(take(1)).subscribe(transactions => {
      const transaction = transactions.find(t => t.id === this.transactionId);
      if (!transaction) {
        this.investmentService.reloadData();
        this.router.navigate(['/investments']);
        return;
      }

      this.patchFormFromTransaction(transaction);
    });
  }

  private patchFormFromTransaction(transaction: InvestmentTransaction): void {
    this.transactionForm.patchValue({
      accountId: transaction.accountId,
      amount: transaction.amount,
      date: new Date(transaction.date)
    });
  }

  onSubmit(): void {
    if (this.transactionForm.valid) {
      this.loading = true;
      const { accountId, amount, date } = this.transactionForm.value;
      
      // Convert date to ISO string
      const isoDate = new Date(date).toISOString();
      
      const payload = {
        accountId,
        amount: Number(amount),
        date: isoDate
      };

      const request$ = this.isEditMode && this.transactionId
        ? this.investmentService.updateTransaction(this.transactionId, payload)
        : this.investmentService.addTransaction(payload);

      request$.subscribe({
        next: () => {
          this.router.navigate(['/investments']);
        },
        error: (error) => {
          console.error(`Error ${this.isEditMode ? 'updating' : 'adding'} transaction:`, error);
          this.loading = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/investments']);
  }

  getAccountDisplay(account: Investment): string {
    return `${account.accountName} (${account.accountType})`;
  }
}

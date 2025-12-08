import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { InvestmentService } from '../../shared/services/investment.service';
import { Investment } from '../../shared/interfaces/investment.interface';

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

  constructor(
    private fb: FormBuilder,
    private investmentService: InvestmentService,
    private router: Router
  ) {
    this.transactionForm = this.fb.group({
      accountId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      date: [new Date(), Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.investmentService.investments$.subscribe(investments => {
      this.accounts = investments;
    });
  }

  onSubmit(): void {
    if (this.transactionForm.valid) {
      this.loading = true;
      const { accountId, amount, date } = this.transactionForm.value;
      
      // Convert date to ISO string
      const isoDate = new Date(date).toISOString();
      
      this.investmentService.addTransaction({
        accountId,
        amount: Number(amount),
        date: isoDate
      }).subscribe({
        next: () => {
          // Reload investments to get updated values
          this.investmentService.reloadData();
          this.router.navigate(['/investments']);
        },
        error: (error) => {
          console.error('Error adding transaction:', error);
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

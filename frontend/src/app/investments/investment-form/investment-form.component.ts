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
import { InvestmentService } from '../../shared/services/investment.service';

@Component({
  selector: 'app-investment-form',
  templateUrl: './investment-form.component.html',
  styleUrls: ['./investment-form.component.scss'],
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
    MatIconModule
  ]
})
export class InvestmentFormComponent implements OnInit {
  investmentForm: FormGroup;
  investmentId: string | null = null;
  isEditMode = false;
  accountTypes = ['RRSP', 'TFSA', 'FHSA', 'Savings'];

  constructor(
    private fb: FormBuilder,
    private investmentService: InvestmentService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.investmentForm = this.fb.group({
      accountName: ['', Validators.required],
      accountType: ['', Validators.required],
      investedAmount: ['', [Validators.required, Validators.min(0)]],
      currentValue: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.investmentId = id;
      this.isEditMode = true;
      this.loadInvestment(id);
    }
  }

  private loadInvestment(id: string): void {
    this.investmentService.investments$.subscribe(investments => {
      const investment = investments.find(i => i.id === id);
      if (investment) {
        this.investmentForm.patchValue({
          accountName: investment.accountName,
          accountType: investment.accountType,
          investedAmount: investment.investedAmount,
          currentValue: investment.currentValue
        });
      }
    });
  }

  onSubmit(): void {
    if (this.investmentForm.valid) {
      if (this.isEditMode && this.investmentId) {
        this.investmentService.updateInvestment(this.investmentId, this.investmentForm.value).subscribe({
          next: () => {
            this.router.navigate(['/investments']);
          },
          error: (error) => {
            console.error('Error updating investment:', error);
          }
        });
      } else {
        this.investmentService.addInvestment(this.investmentForm.value).subscribe({
          next: () => {
            this.router.navigate(['/investments']);
          },
          error: (error) => {
            console.error('Error adding investment:', error);
          }
        });
      }
    }
  }

  calculateGrowth(): number {
    const invested = this.investmentForm.get('investedAmount')?.value || 0;
    const current = this.investmentForm.get('currentValue')?.value || 0;
    
    if (invested === 0) return 0;
    return ((current - invested) / invested) * 100;
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

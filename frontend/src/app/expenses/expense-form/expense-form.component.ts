import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, startWith, map } from 'rxjs';
import { ExpenseService } from '../../shared/services/expense.service';
import { Expense, ExpenseCategory } from '../../shared/interfaces/expense.interface';

@Component({
  selector: 'app-expense-form',
  templateUrl: './expense-form.component.html',
  styleUrls: ['./expense-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class ExpenseFormComponent implements OnInit {
  expenseForm: FormGroup;
  expenseId: string | null = null;
  isEditMode = signal<boolean>(false);
  loading = signal<boolean>(false);
  submitting = signal<boolean>(false);
  
  categories: ExpenseCategory[] = [];
  uniqueDetails: string[] = [];
  filteredDetails$!: Observable<string[]>;

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.categories = this.expenseService.getCategories();
    
    this.expenseForm = this.fb.group({
      category: ['', Validators.required],
      details: ['', [Validators.required, Validators.minLength(2)]],
      date: [new Date(), Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]]
    });
  }

  ngOnInit(): void {
    this.loadUniqueDetails();
    this.setupAutocomplete();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.expenseId = id;
      this.isEditMode.set(true);
      this.loadExpense(id);
    }
  }

  private loadUniqueDetails(): void {
    this.expenseService.getUniqueDetails().subscribe(details => {
      this.uniqueDetails = details;
    });
  }

  private setupAutocomplete(): void {
    this.filteredDetails$ = this.expenseForm.get('details')!.valueChanges.pipe(
      startWith(''),
      map(value => this.filterDetails(value || ''))
    );
  }

  private filterDetails(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.uniqueDetails.filter(detail => 
      detail.toLowerCase().includes(filterValue)
    );
  }

  private loadExpense(id: string): void {
    this.loading.set(true);
    this.expenseService.expenses$.subscribe(expenses => {
      const expense = expenses.find(e => e.id === id);
      if (expense) {
        this.expenseForm.patchValue({
          category: expense.category,
          details: expense.details,
          date: new Date(expense.date),
          amount: expense.amount
        });
      }
      this.loading.set(false);
    });
  }

  onSubmit(): void {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const formData = this.expenseForm.value;

    const operation = this.isEditMode() && this.expenseId
      ? this.expenseService.updateExpense(this.expenseId, formData)
      : this.expenseService.addExpense(formData);

    operation.subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/expenses']);
      },
      error: (error) => {
        console.error('Failed to save expense:', error);
        this.submitting.set(false);
        alert('Failed to save expense. Please try again.');
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/expenses']);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.expenseForm.get(fieldName);
    if (!field || !field.errors || !field.touched) {
      return '';
    }

    if (field.errors['required']) {
      return `${this.capitalizeFirst(fieldName)} is required`;
    }
    if (field.errors['min']) {
      return `${this.capitalizeFirst(fieldName)} must be greater than ${field.errors['min'].min}`;
    }
    if (field.errors['minlength']) {
      return `${this.capitalizeFirst(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }

    return 'Invalid input';
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

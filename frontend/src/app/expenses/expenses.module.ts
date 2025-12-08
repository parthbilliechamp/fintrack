import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ExpensesRoutingModule } from './expenses-routing.module';
import { ExpenseListComponent } from './expense-list/expense-list.component';
import { ExpenseFormComponent } from './expense-form/expense-form.component';
import { ExpenseDashboardComponent } from './expense-dashboard/expense-dashboard.component';
import { ExpenseHistoryComponent } from './expense-history/expense-history.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ExpensesRoutingModule,
    ExpenseListComponent,
    ExpenseFormComponent,
    ExpenseDashboardComponent,
    ExpenseHistoryComponent
  ]
})
export class ExpensesModule { }

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExpenseListComponent } from './expense-list/expense-list.component';
import { ExpenseFormComponent } from './expense-form/expense-form.component';
import { ExpenseDashboardComponent } from './expense-dashboard/expense-dashboard.component';
import { ExpenseHistoryComponent } from './expense-history/expense-history.component';

const routes: Routes = [
  {
    path: '',
    component: ExpenseListComponent
  },
  {
    path: 'new',
    component: ExpenseFormComponent
  },
  {
    path: 'edit/:id',
    component: ExpenseFormComponent
  },
  {
    path: 'dashboard',
    component: ExpenseDashboardComponent
  },
  {
    path: 'history',
    component: ExpenseHistoryComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ExpensesRoutingModule { }
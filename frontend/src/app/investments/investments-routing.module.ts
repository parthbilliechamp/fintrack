import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InvestmentListComponent } from './investment-list/investment-list.component';
import { InvestmentFormComponent } from './investment-form/investment-form.component';
import { InvestmentDashboardComponent } from './investment-dashboard/investment-dashboard.component';
import { ContributionLimitsComponent } from './contribution-limits/contribution-limits.component';
import { TransactionFormComponent } from './transaction-form/transaction-form.component';

const routes: Routes = [
  {
    path: '',
    component: InvestmentListComponent
  },
  {
    path: 'new',
    component: InvestmentFormComponent
  },
  {
    path: 'edit/:id',
    component: InvestmentFormComponent
  },
  {
    path: 'dashboard',
    component: InvestmentDashboardComponent
  },
  {
    path: 'contribution-limits',
    component: ContributionLimitsComponent
  },
  {
    path: 'add-transaction',
    component: TransactionFormComponent
  },
  {
    path: 'edit-transaction/:id',
    component: TransactionFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InvestmentsRoutingModule { }
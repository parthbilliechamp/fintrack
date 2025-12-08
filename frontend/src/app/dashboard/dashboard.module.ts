import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { OverviewComponent } from './overview/overview.component';
import { ExpenseOverviewComponent } from './expense-overview/expense-overview.component';
import { InvestmentOverviewComponent } from './investment-overview/investment-overview.component';

@NgModule({
  imports: [
    CommonModule,
    DashboardRoutingModule,
    OverviewComponent,
    ExpenseOverviewComponent,
    InvestmentOverviewComponent
  ]
})
export class DashboardModule { }

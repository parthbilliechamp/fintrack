import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { OverviewComponent } from './overview/overview.component';
import { InvestmentOverviewComponent } from './investment-overview/investment-overview.component';

@NgModule({
  imports: [
    CommonModule,
    DashboardRoutingModule,
    OverviewComponent,
    InvestmentOverviewComponent
  ]
})
export class DashboardModule { }

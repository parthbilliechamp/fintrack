import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { InvestmentsRoutingModule } from './investments-routing.module';
import { InvestmentListComponent } from './investment-list/investment-list.component';
import { InvestmentFormComponent } from './investment-form/investment-form.component';
import { InvestmentDashboardComponent } from './investment-dashboard/investment-dashboard.component';

@NgModule({
  imports: [
    CommonModule,
    InvestmentsRoutingModule,
    ReactiveFormsModule,
    InvestmentListComponent,
    InvestmentFormComponent,
    InvestmentDashboardComponent
  ]
})
export class InvestmentsModule { }

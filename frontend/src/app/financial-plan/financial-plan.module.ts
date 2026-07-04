import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinancialPlanRoutingModule } from './financial-plan-routing.module';
import { FinancialPlanComponent } from './financial-plan.component';

@NgModule({
  imports: [
    CommonModule,
    FinancialPlanRoutingModule,
    FinancialPlanComponent
  ]
})
export class FinancialPlanModule { }

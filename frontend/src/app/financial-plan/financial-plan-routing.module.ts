import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FinancialPlanComponent } from './financial-plan.component';

const routes: Routes = [
  {
    path: '',
    component: FinancialPlanComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FinancialPlanRoutingModule { }

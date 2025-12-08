import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OverviewComponent } from './overview/overview.component';
import { InvestmentOverviewComponent } from './investment-overview/investment-overview.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: '', component: OverviewComponent },
      { path: 'investments', component: InvestmentOverviewComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
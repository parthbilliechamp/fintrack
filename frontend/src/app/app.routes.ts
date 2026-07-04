import { Routes } from '@angular/router';
import { AuthGuard } from './shared/guards/auth.guard';
import { ContributionLimitsComponent } from './investments/contribution-limits/contribution-limits.component';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'expenses',
    loadChildren: () => import('./expenses/expenses.module').then(m => m.ExpensesModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'investments',
    loadChildren: () => import('./investments/investments.module').then(m => m.InvestmentsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'contribution-limits',
    component: ContributionLimitsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'budget-planner',
    loadChildren: () => import('./financial-plan/financial-plan.module').then(m => m.FinancialPlanModule),
    canActivate: [AuthGuard]
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

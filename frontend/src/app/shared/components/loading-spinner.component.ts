import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingService } from '../services/loading.service';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="loading-overlay" *ngIf="loadingService.loading$ | async">
      <mat-spinner diameter="50"></mat-spinner>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(15, 23, 42, 0.28);
      backdrop-filter: blur(3px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }
    .loading-overlay mat-spinner {
      padding: 20px;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 24px 48px rgba(15, 23, 42, 0.18);
    }
    ::ng-deep .loading-overlay .mdc-circular-progress__determinate-circle,
    ::ng-deep .loading-overlay .mdc-circular-progress__indeterminate-circle-graphic {
      stroke: #059669;
    }
  `]
})
export class LoadingSpinnerComponent {
  constructor(public loadingService: LoadingService) {}
}

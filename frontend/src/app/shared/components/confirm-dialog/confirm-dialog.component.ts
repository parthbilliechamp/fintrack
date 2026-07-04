import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog" [class.danger]="data.danger">
      <div class="confirm-dialog-icon">
        <mat-icon>{{ data.danger ? 'warning' : 'help_outline' }}</mat-icon>
      </div>
      <h2 mat-dialog-title>{{ data.title }}</h2>
      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-stroked-button (click)="onCancel()">{{ data.cancelLabel || 'Cancel' }}</button>
        <button mat-raised-button [color]="data.danger ? 'warn' : 'primary'" (click)="onConfirm()">
          {{ data.confirmLabel || 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      display: flex;
      flex-direction: column;
      min-width: 320px;
      max-width: 420px;
    }

    .confirm-dialog-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--primary-light);
      color: var(--primary);
      margin-bottom: 8px;

      mat-icon {
        font-size: 26px;
        width: 26px;
        height: 26px;
      }
    }

    .confirm-dialog.danger .confirm-dialog-icon {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    h2[mat-dialog-title] {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 700;
    }

    mat-dialog-content p {
      margin: 0;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.65);
      line-height: 1.5;
    }

    mat-dialog-actions {
      margin-top: 16px;
      padding: 0;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}

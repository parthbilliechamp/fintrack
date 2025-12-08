import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  exports: [
    MatSnackBarModule,
    MatProgressSpinnerModule
  ]
})
export class SharedModule { }


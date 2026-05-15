import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ProductsState } from '../http-state';

@Component({
  selector: 'app-http-state-card',
  imports: [
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonModule
  ],
  templateUrl: './http-state-card.html',
  styleUrl: './http-state-card.scss',
})
export class HttpStateCard<T> {
  @Input() state: ProductsState<T> | null = null;
  //@Input() state: ProductsState | null = null;
  @Output() retry = new EventEmitter<void>();

  onRetry(): void {
    this.retry.emit();
  }
}

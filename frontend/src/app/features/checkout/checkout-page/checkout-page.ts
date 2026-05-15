import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { MatOption, MatSelect } from '@angular/material/select';
import { CartService } from '../../../core/services/cart';
import { NotificationService } from '../../../core/services/notification.service';
import { OrderService } from '../../../core/services/order-service';
import { map } from 'rxjs/operators';
import { take } from 'rxjs/operators';
import { Order } from '../../../core/models/order';
import { CartItem } from '../../../core/models/cart';
import { MatButtonModule } from "@angular/material/button";
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-checkout-page',
  imports: [CommonModule, ReactiveFormsModule, MatSelect, MatFormFieldModule, MatInputModule, MatCheckboxModule, MatOption, MatButtonModule, RouterLink],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.scss',
})
export class CheckoutPage implements OnInit {
  private fb = inject(FormBuilder);

  readonly form = this.fb.group({
    customer: this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
    }),
    address: this.fb.group({
      street: ['', [Validators.required]],
      city: ['', [Validators.required]],
      zip: ['', [Validators.required, Validators.pattern('^[0-9]{5}$')]],

    }),
    shippingMethod: ['standard', Validators.required],
    privacy: [false, Validators.requiredTrue]
  });


  getControl(path: string) {
    return this.form.get(path);
  }
  hasError(path: string, errorCode: string) {
    const control = this.getControl(path);
    return !!control && control.hasError(errorCode) && control.touched;
  }

  showSummary = false;


  private cart = inject(CartService);
  private orderService = inject(OrderService);
  private notify = inject(NotificationService);
  readonly cart$ = this.cart.cart$;
  readonly items$ = this.cart$.pipe(
    map(cart => cart?.items || [])
  );
  readonly total$ = this.cart$.pipe(
    map(cart => cart?.total || 0)
  );
  loading = false;
  orderSuccess = false;
  orderError = false;

  ngOnInit(): void {
    // Carica il carrello all'inizializzazione
    this.cart.loadCart().subscribe();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showSummary = true;
      this.focusFirstInvalid();
      return;
    }
    this.loading = true;
    this.orderSuccess = false;
    this.orderError = false;
    const value = this.form.getRawValue();
    this.items$.pipe(take(1)).subscribe((items: CartItem[]) => {
      const order: Order = {
        customer: {
          firstName: value.customer!.firstName!,
          lastName: value.customer!.lastName!,
          email: value.customer!.email!
        },
        address: {
          street: value.address!.street!,
          city: value.address!.city!,
          zip: value.address!.zip!
        },
        items: items.map(item => ({
          ...item.product,
          quantity: item.quantity
        })),
        total: items.reduce(
          (sum: number, it: CartItem) => sum + it.subtotal, 0),
        createdAt: new Date().toISOString()
      };
      this.orderService.create(order).subscribe({
        next: () => {
          this.loading = false;
          this.orderSuccess = true;
          this.form.reset();
          // Ricarica il carrello (il backend lo ha svuotato)
          this.cart.loadCart().subscribe();
        },
        error: (err) => {
          this.loading = false;
          this.orderError = true;
          console.error('Error creating order:', err);
          const errorMsg = err.error?.error || 'Errore durante la creazione dell\'ordine';
          this.notify.showError(errorMsg);
        }
      });
    });
  }

  private focusFirstInvalid(): void {
    const firstInvalid = document.querySelector(
      'form.ng-invalid [formcontrolname]'
    ) as HTMLElement | null;
    firstInvalid?.focus();
  }
}

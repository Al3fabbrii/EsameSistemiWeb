import { Component, inject, OnInit } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AdminProductApi, ProductPayload } from '../../../core/services/admin-product-api';
import { NotificationService } from '../../../core/services/notification.service';
import { Product } from '../../../core/models/product';
import { AdminProductDialog, AdminProductDialogData } from '../admin-product-dialog/admin-product-dialog';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-admin-products-page',
  imports: [MatTableModule, MatButtonModule, MatIconModule, CurrencyPipe],
  templateUrl: './admin-products-page.html',
  styleUrl: './admin-products-page.scss',
})
export class AdminProductsPage implements OnInit {
  private api = inject(AdminProductApi);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);

  products: Product[] = [];
  displayedColumns = ['title', 'price', 'stock', 'sale', 'actions'];

  ngOnInit(): void {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.api.list().subscribe({
      next: products => this.products = products,
      error: () => this.notify.showError('Errore nel caricamento dei prodotti')
    });
  }

  openCreateDialog(): void {
    const ref = this.dialog.open<AdminProductDialog, AdminProductDialogData, ProductPayload>(
      AdminProductDialog,
      { data: {} }
    );

    ref.afterClosed().subscribe(payload => {
      if (!payload) return;
      this.api.create(payload).subscribe({
        next: () => {
          this.notify.showSuccess('Prodotto creato con successo');
          this.loadProducts();
        },
        error: () => this.notify.showError('Errore durante la creazione del prodotto')
      });
    });
  }

  openEditDialog(product: Product): void {
    const ref = this.dialog.open<AdminProductDialog, AdminProductDialogData, Partial<ProductPayload>>(
      AdminProductDialog,
      { data: { product } }
    );

    ref.afterClosed().subscribe(payload => {
      if (!payload) return;
      this.api.update(product.id, payload).subscribe({
        next: () => {
          this.notify.showSuccess('Prodotto aggiornato con successo');
          this.loadProducts();
        },
        error: () => this.notify.showError('Errore durante l\'aggiornamento del prodotto')
      });
    });
  }

  deleteProduct(product: Product): void {
    if (!confirm(`Eliminare "${product.title}"?`)) return;

    this.api.delete(product.id).subscribe({
      next: () => {
        this.notify.showSuccess('Prodotto eliminato');
        this.loadProducts();
      },
      error: () => this.notify.showError('Errore durante l\'eliminazione del prodotto')
    });
  }
}

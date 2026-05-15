import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { Product } from '../../../core/models/product';

export interface AdminProductDialogData {
  product?: Product;
}

@Component({
  selector: 'app-admin-product-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, MatButtonModule],
  templateUrl: './admin-product-dialog.html',
  styleUrl: './admin-product-dialog.scss',
})
export class AdminProductDialog {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AdminProductDialog>);
  readonly data: AdminProductDialogData = inject(MAT_DIALOG_DATA);

  readonly isEdit = !!this.data?.product;

  readonly form = this.fb.group({
    title: [this.data?.product?.title ?? '', [Validators.required, Validators.minLength(2)]],
    description: [this.data?.product?.description ?? '', [Validators.required]],
    price: [this.data?.product?.price ?? null, [Validators.required, Validators.min(0.01)]],
    original_price: [this.data?.product?.originalPrice ?? null, [Validators.required, Validators.min(0.01)]],
    sale: [this.data?.product?.sale ?? false],
    thumbnail: [this.data?.product?.thumbnail ?? ''],
    stock: [this.data?.product?.stock ?? null, [Validators.required, Validators.min(0)]],
    tags: [this.data?.product?.tags?.join(', ') ?? ''],
  });

  hasError(field: string, errorCode: string): boolean {
    const control = this.form.get(field);
    return !!control && control.hasError(errorCode) && control.touched;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      title: raw.title!,
      description: raw.description!,
      price: Number(raw.price),
      original_price: Number(raw.original_price),
      sale: raw.sale ?? false,
      thumbnail: raw.thumbnail ?? '',
      stock: Number(raw.stock),
      tags: raw.tags ? raw.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0) : [],
    };

    this.dialogRef.close(payload);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}

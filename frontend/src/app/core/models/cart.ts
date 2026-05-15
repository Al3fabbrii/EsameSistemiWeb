import { Product } from './product';

export interface CartItem {
  id: number;
  cartId: number;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
  total: number;
  createdAt: string;
  updatedAt: string;
}

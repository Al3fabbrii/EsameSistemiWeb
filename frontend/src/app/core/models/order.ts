import { Product } from './product';

export interface Customer {
    firstName: string;
    lastName: string;
    email: string;
}

export interface Address {
    street: string;
    city: string;
    zip: string;
}

export interface OrderItem {
    id: number;
    productId: string;
    quantity: number;
    unitPrice: number;
    product: Product;
}

export interface Order {
    id?: number;
    userId?: number;
    customer: Customer;
    address: Address;
    items: Product[] | OrderItem[];
    total: number;
    createdAt: string;
}
export interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    originalPrice: number;
    sale: boolean;
    thumbnail?: string;
    tags?: string[];
    stock: number;
    createdAt: string;
}
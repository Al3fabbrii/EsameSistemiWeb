import { Product } from './product';

export interface WishlistItem {
    id: number;
    wishlistId: number;
    productId: string;
    product: Product;
}
export interface Wishlist {
    id: number;
    userId: number;
    items: WishlistItem[];
    createdAt: string;
    updatedAt: string;
}

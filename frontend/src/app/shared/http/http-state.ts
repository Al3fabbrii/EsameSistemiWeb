export type ProductsState =
  | { status: 'loading' }
  | { status: 'success' }
  | { status: 'error'; message: string };

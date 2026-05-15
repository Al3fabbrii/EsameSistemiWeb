export type ProductsState<T> =
  | { status: 'loading' }
  | { status: 'success' }
  | { status: 'error'; message: string };

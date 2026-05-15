export interface User {
  id: number;
  email: string;
  role: 'customer' | 'admin';
  createdAt: string;
}

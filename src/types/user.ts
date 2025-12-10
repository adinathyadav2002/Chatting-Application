export interface User {
  id: number;
  name: string;
  password?: string; // Optional for dummy data, not used in production
  isOnline: boolean;
  avatar?: string;
}

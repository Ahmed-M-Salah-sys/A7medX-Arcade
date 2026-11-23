// Stored user record (registered via the sign-up form)
export interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string; // plain-text (no sensitive data risk in this local project)
  role: 'user';
  createdAt: string;
}

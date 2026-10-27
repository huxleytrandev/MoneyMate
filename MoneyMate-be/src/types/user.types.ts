export interface User {
  id: string;
  email: string;
  displayName: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export type RegisterUserData = Pick<User, 'email' | 'displayName' | 'timezone'> & {
  password: string;
};
export type RegisterUserInput = Omit<RegisterUserData, 'timezone'> & { timezone?: string };

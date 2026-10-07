import type { Role } from '@prisma/client';
export type UserResponseDto = {
  id: number;
  fullName: string;
  email: string;
  role: Role;
};

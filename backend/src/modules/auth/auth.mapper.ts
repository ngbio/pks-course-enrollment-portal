import type { UserResponseDto } from './auth.dto.js';
export function toUserResponse(user: UserResponseDto): UserResponseDto {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
  };
}
export const userSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
} as const;

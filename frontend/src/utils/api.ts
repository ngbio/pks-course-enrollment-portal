export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: { field: string; message: string }[] = [],
  ) {
    super(message);
  }
}

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Đã xảy ra lỗi. Vui lòng thử lại.';

export const money = (amount: number) =>
  amount === 0
    ? 'Miễn phí'
    : `${new Intl.NumberFormat('vi-VN').format(amount)} ₫`;

export const isAdmin = (role?: string) => role === 'ADMIN' || role === 'STAFF';

export function parseRouteId(value: string) {
  if (!/^[1-9]\d*$/.test(value)) return Number.NaN;
  const id = Number(value);
  return Number.isInteger(id) && id <= 2147483647 ? id : Number.NaN;
}

export function safeReturnTo(value: string | null, fallback: string) {
  return value &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\') &&
    !/^\/(login|register)(?:[/?#]|$)/.test(value)
    ? value
    : fallback;
}

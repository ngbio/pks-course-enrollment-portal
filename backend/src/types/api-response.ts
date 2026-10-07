export type PageMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
export type ApiResponse<T> = { data: T; meta?: PageMeta };
export type ErrorResponse = {
  error: {
    code: string;
    message: string;
    details: { field: string; message: string }[];
  };
};

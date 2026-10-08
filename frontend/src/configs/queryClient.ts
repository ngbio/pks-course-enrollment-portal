import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../utils/api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20000,
      retry: (count, error) =>
        count < 1 &&
        !(
          error instanceof ApiError &&
          error.status >= 400 &&
          error.status < 500
        ),
    },
    mutations: { retry: false },
  },
});
export async function refreshCourses() {
  await Promise.all(
    [
      'courses',
      'course',
      'admin-courses',
      'admin-course',
      'enrollments',
      'enrollment-status',
      'categories',
      'admin-enrollments',
    ].map((key) => queryClient.invalidateQueries({ queryKey: [key] })),
  );
}

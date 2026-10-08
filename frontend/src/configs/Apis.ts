import axios from 'axios';
import { ApiError } from '../utils/api';

export const endpoints = {
  login: '/auth/login',
  register: '/auth/register',
  logout: '/auth/logout',
  me: '/auth/me',
  courses: '/courses',
  categories: '/categories',
  course: (id: number) => `/courses/${id}`,
  enroll: (id: number) => `/courses/${id}/enrollments`,
  myEnrollments: '/me/enrollments',
  adminCourses: '/admin/courses',
  adminCourse: (id: number) => `/admin/courses/${id}`,
  courseStudents: (id: number) => `/admin/courses/${id}/enrollments`,
};

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 15000,
});

api.interceptors.response.use(
  (response) => {
    if (response.status === 204) return response;
    const payload = response.data;
    if (!payload || typeof payload !== 'object' || !('data' in payload)) {
      throw new ApiError(
        0,
        'INVALID_RESPONSE',
        'Dữ liệu trả về chưa hợp lệ. Vui lòng thử lại.',
      );
    }
    return response;
  },
  (error: unknown) => {
    if (axios.isCancel(error)) return Promise.reject(error);
    if (!axios.isAxiosError(error)) return Promise.reject(error);
    const status = error.response?.status ?? 0;
    const path = error.config?.url?.split('?')[0];
    if (status === 401 && path !== endpoints.me && path !== endpoints.login) {
      window.dispatchEvent(new Event('pks:session-expired'));
    }
    const details = error.response?.data?.error;
    return Promise.reject(
      new ApiError(
        status,
        details?.code ?? (status ? 'REQUEST_FAILED' : 'NETWORK_ERROR'),
        details?.message ??
          (status
            ? 'Không thể thực hiện yêu cầu. Vui lòng thử lại.'
            : 'Không thể kết nối. Vui lòng kiểm tra mạng và thử lại.'),
        details?.details ?? [],
      ),
    );
  },
);

export default api;

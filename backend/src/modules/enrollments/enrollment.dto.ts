import type { CourseDetailDto } from '../courses/course.dto.js';
export type EnrollmentResponseDto = {
  id: number;
  courseId: number;
  status: 'ENROLLED';
  enrolledAt: string;
  enrolledDate: string;
};
export type MyEnrollmentResponseDto = EnrollmentResponseDto & {
  course: CourseDetailDto & { isPublished: boolean };
};
export type AdminEnrollmentResponseDto = EnrollmentResponseDto & {
  student: { id: number; fullName: string; email: string };
  courseTitle: string;
};

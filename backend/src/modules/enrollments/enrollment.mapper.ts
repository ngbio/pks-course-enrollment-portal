import type { Course, Enrollment } from '@prisma/client';
import { vietnamDate, vietnamDateTime } from '../../utils/date.js';
import { toCourseDetail } from '../courses/course.mapper.js';
import type {
  EnrollmentResponseDto,
  MyEnrollmentResponseDto,
  AdminEnrollmentResponseDto,
} from './enrollment.dto.js';
export const toEnrollment = (e: Enrollment): EnrollmentResponseDto => ({
  id: e.id,
  courseId: e.courseId,
  status: e.status,
  enrolledAt: vietnamDateTime(e.enrolledAt),
  enrolledDate: vietnamDate(e.enrolledAt),
});
export const toMyEnrollment = (
  e: Enrollment & { course: Course },
): MyEnrollmentResponseDto => ({
  ...toEnrollment(e),
  course: { ...toCourseDetail(e.course), isPublished: e.course.isPublished },
});
export const toAdminEnrollment = (
  e: Enrollment & {
    user: { id: number; fullName: string; email: string };
    course: { title: string };
  },
): AdminEnrollmentResponseDto => ({
  ...toEnrollment(e),
  student: { id: e.user.id, fullName: e.user.fullName, email: e.user.email },
  courseTitle: e.course.title,
});

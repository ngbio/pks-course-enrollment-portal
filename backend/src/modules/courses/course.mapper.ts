import type { Course } from '@prisma/client';
import type {
  CourseListItemDto,
  CourseDetailDto,
  AdminCourseResponseDto,
} from './course.dto.js';
import { vietnamDateTime } from '../../utils/date.js';
export function toCourseList(c: Course): CourseListItemDto {
  return {
    id: c.id,
    title: c.title,
    category: c.category,
    instructor: c.instructor,
    shortDescription: c.shortDescription,
    tuitionVnd: c.tuitionVnd,
    capacity: c.capacity,
    enrolledCount: c.enrolledCount,
    remainingSeats: c.capacity - c.enrolledCount,
    availability: c.enrolledCount >= c.capacity ? 'FULL' : 'AVAILABLE',
  };
}
export const toCourseDetail = (c: Course): CourseDetailDto => ({
  ...toCourseList(c),
  description: c.description,
});
export const toAdminCourse = (c: Course): AdminCourseResponseDto => ({
  ...toCourseDetail(c),
  isPublished: c.isPublished,
  createdAt: vietnamDateTime(c.createdAt),
  updatedAt: vietnamDateTime(c.updatedAt),
});

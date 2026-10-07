export type CourseListItemDto = {
  id: number;
  title: string;
  category: string;
  instructor: string;
  shortDescription: string;
  tuitionVnd: number;
  capacity: number;
  enrolledCount: number;
  remainingSeats: number;
  availability: 'AVAILABLE' | 'FULL';
};
export type CourseDetailDto = CourseListItemDto & { description: string };
export type AdminCourseResponseDto = CourseDetailDto & {
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

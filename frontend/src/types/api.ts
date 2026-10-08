export type Role = 'STUDENT' | 'ADMIN' | 'STAFF';

export type User = { id: number; fullName: string; email: string; role: Role };
export type Meta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
export type Envelope<T> = { data: T; meta?: Meta };
export type Course = {
  id: number;
  title: string;
  category: string;
  instructor: string;
  shortDescription: string;
  description?: string;
  tuitionVnd: number;
  capacity: number;
  enrolledCount: number;
  remainingSeats: number;
  availability: 'AVAILABLE' | 'FULL';
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
};
export type Enrollment = {
  id: number;
  courseId: number;
  status: 'ENROLLED';
  enrolledAt: string;
  enrolledDate: string;
  course: Course;
};
export type AdminEnrollment = Omit<Enrollment, 'course'> & {
  student: { id: number; fullName: string; email: string };
  courseTitle: string;
};

import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, UsersRound } from 'lucide-react';
import api, { endpoints } from '../../configs/Apis';
import { errorMessage, parseRouteId } from '../../utils/api';
import StatusScreen from '../StatusScreen';
import type { AdminEnrollment, Course, Envelope } from '../../types/api';
import {
  EmptyState,
  ErrorState,
  Loading,
  PageHeading,
  Pagination,
} from '../../components/ui';
import { useFilters } from '../../hooks/useFilters';
export default function CourseStudentsScreen() {
  const { id: routeId = '' } = useParams();
  const id = parseRouteId(routeId);
  const validId = Number.isInteger(id);
  const { page, update } = useFilters();
  const course = useQuery({
    queryKey: ['admin-course', id],
    enabled: validId,
    queryFn: ({ signal }) =>
      api
        .get<Envelope<Course>>(endpoints.adminCourse(id), { signal })
        .then((response) => response.data),
  });
  const students = useQuery({
    queryKey: ['admin-enrollments', id, page],
    enabled: validId,
    queryFn: ({ signal }) =>
      api
        .get<Envelope<AdminEnrollment[]>>(endpoints.courseStudents(id), {
          signal,
          params: { page, limit: 12 },
        })
        .then((response) => response.data),
  });
  if (!validId) return <StatusScreen />;
  return (
    <>
      <Link className="back-link" to="/admin/courses">
        <ArrowLeft size={17} />
        Quản lý khóa học
      </Link>
      <PageHeading
        eyebrow="DANH SÁCH GHI DANH"
        title={course.data?.data.title ?? 'Học viên khóa học'}
        description="Theo dõi học viên và thông tin đăng ký của khóa học."
      >
        {course.data && (
          <span className="enrollment-total">
            <UsersRound size={22} />
            <strong>{course.data.data.enrolledCount}</strong>
            <span>/ {course.data.data.capacity} học viên</span>
          </span>
        )}
      </PageHeading>
      {course.isError && (
        <ErrorState
          message={errorMessage(course.error)}
          retry={() => void course.refetch()}
        />
      )}
      <section className="content-panel admin-panel">
        {students.isPending ? (
          <Loading />
        ) : students.isError ? (
          <ErrorState
            message={errorMessage(students.error)}
            retry={() => void students.refetch()}
          />
        ) : !students.data.data.length ? (
          <EmptyState
            title="Chưa có học viên ghi danh"
            text="Học viên đăng ký khóa học sẽ xuất hiện tại đây."
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Học viên</th>
                  <th>Khóa học</th>
                  <th>Ngày ghi danh</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {students.data.data.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <strong>{e.student.fullName}</strong>
                      <span className="table-subtitle">{e.student.email}</span>
                    </td>
                    <td>{e.courseTitle}</td>
                    <td>
                      <time dateTime={e.enrolledAt}>
                        {e.enrolledDate}
                        <span className="table-subtitle">
                          {e.enrolledAt.slice(11, 16)} · giờ Việt Nam
                        </span>
                      </time>
                    </td>
                    <td>
                      <span className="badge badge-green">Đã ghi danh</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          meta={students.data?.meta}
          onPage={(page) => update({ page })}
        />
      </section>
    </>
  );
}

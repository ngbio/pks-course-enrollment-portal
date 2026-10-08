import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  UserRound,
} from 'lucide-react';
import api, { endpoints } from '../../configs/Apis';
import { errorMessage, money } from '../../utils/api';
import type { Enrollment, Envelope } from '../../types/api';
import { useAuth } from '../../contexts/AuthContext';
import { useFilters } from '../../hooks/useFilters';
import { CourseArtwork } from '../../components/course-card';
import {
  EmptyState,
  ErrorState,
  Loading,
  PageHeading,
  Pagination,
} from '../../components/ui';
export default function MyCoursesScreen() {
  const { user } = useAuth();
  const { page, update } = useFilters();
  const query = useQuery({
    queryKey: ['enrollments', user?.id, page],
    queryFn: ({ signal }) =>
      api
        .get<Envelope<Enrollment[]>>(endpoints.myEnrollments, {
          signal,
          params: { page, limit: 12 },
        })
        .then((response) => response.data),
  });
  return (
    <>
      <PageHeading
        eyebrow="HÀNH TRÌNH CỦA BẠN"
        title="Khóa học của tôi"
        description="Những bước tiến mới, được lưu lại ở đây."
      >
        <Link className="button secondary" to="/courses">
          Khám phá thêm <ArrowUpRight size={17} />
        </Link>
      </PageHeading>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState
          message={errorMessage(query.error)}
          retry={() => void query.refetch()}
        />
      ) : !query.data.data.length ? (
        <EmptyState
          title="Hành trình của bạn đang chờ bắt đầu"
          text="Ghi danh khóa học đầu tiên để xây dựng những kỹ năng mới."
        >
          <Link className="button primary" to="/courses">
            Khám phá khóa học <ArrowUpRight size={17} />
          </Link>
        </EmptyState>
      ) : (
        <>
          <p className="results-count">
            {query.data.meta?.total} khóa học đã ghi danh
          </p>
          <div className="my-course-list">
            {query.data.data.map((enrollment) => (
              <article className="my-course-card" key={enrollment.id}>
                <CourseArtwork course={enrollment.course} />
                <div className="my-course-copy">
                  <div className="card-tags">
                    <span className="category-tag">
                      {enrollment.course.category}
                    </span>
                    <span className="badge badge-green">
                      <CheckCircle2 size={13} />
                      Đã ghi danh
                    </span>
                  </div>
                  <h2>{enrollment.course.title}</h2>
                  <p className="muted">{enrollment.course.shortDescription}</p>
                  <div className="detail-meta">
                    <span>
                      <UserRound size={16} />
                      {enrollment.course.instructor}
                    </span>
                    <span>
                      <CalendarDays size={16} />
                      Ghi danh: {enrollment.enrolledDate}
                    </span>
                  </div>
                  <div className="my-course-bottom">
                    <strong>{money(enrollment.course.tuitionVnd)}</strong>
                    {enrollment.course.isPublished ? (
                      <Link
                        className="text-link"
                        to={`/courses/${enrollment.courseId}`}
                      >
                        Xem chi tiết <ArrowUpRight size={16} />
                      </Link>
                    ) : (
                      <span className="badge badge-muted">
                        Tạm ngừng nhận ghi danh
                      </span>
                    )}
                  </div>
                  {!enrollment.course.isPublished && (
                    <details className="hidden-course-details">
                      <summary>Thông tin khóa đã ghi danh</summary>
                      <p>{enrollment.course.description}</p>
                    </details>
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      <Pagination meta={query.data?.meta} onPage={(page) => update({ page })} />
    </>
  );
}

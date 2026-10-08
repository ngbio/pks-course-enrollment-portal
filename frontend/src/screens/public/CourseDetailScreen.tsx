import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  LoaderCircle,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { toast } from 'sonner';
import api, { endpoints } from '../../configs/Apis';
import {
  ApiError,
  errorMessage,
  isAdmin,
  money,
  parseRouteId,
} from '../../utils/api';
import type { Course, Enrollment, Envelope } from '../../types/api';
import { refreshCourses } from '../../configs/queryClient';
import { CourseArtwork, SeatBadge } from '../../components/course-card';
import { ErrorState, Loading } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import StatusPage from '../StatusScreen';
export default function CourseDetailScreen() {
  const { id: routeId = '' } = useParams();
  const id = parseRouteId(routeId);
  const validId = Number.isInteger(id);
  const auth = useAuth();
  const navigate = useNavigate();
  const [justEnrolled, setJustEnrolled] = useState(false);
  useEffect(() => setJustEnrolled(false), [id, auth.user?.id]);
  const course = useQuery({
    queryKey: ['course', id],
    enabled: validId,
    queryFn: ({ signal }) =>
      api
        .get<Envelope<Course>>(endpoints.course(id), { signal })
        .then((response) => response.data),
  });
  const status = useQuery({
    queryKey: ['enrollment-status', auth.user?.id, id],
    enabled: validId && auth.user?.role === 'STUDENT',
    queryFn: async ({ signal }) => {
      // The API paginates enrollments. Check every necessary page, not just the first.
      let page = 1;
      while (true) {
        const { data: response } = await api.get<Envelope<Enrollment[]>>(
          endpoints.myEnrollments,
          { signal, params: { page, limit: 100 } },
        );
        if (response.data.some((e) => e.courseId === id)) return true;
        if (!response.meta || page >= response.meta.totalPages) return false;
        page++;
      }
    },
  });
  const enrolled = justEnrolled || status.data === true;
  const mutation = useMutation({
    mutationFn: () => api.post(endpoints.enroll(id)),
    onSuccess: async () => {
      setJustEnrolled(true);
      toast.success('Ghi danh thành công! Hẹn gặp bạn tại lớp học.');
      await refreshCourses();
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.code === 'ALREADY_ENROLLED')
        setJustEnrolled(true);
      toast.error(errorMessage(error));
      await refreshCourses();
    },
  });
  if (!validId) return <StatusPage />;
  if (course.isPending) return <Loading />;
  if (course.isError)
    return course.error instanceof ApiError && course.error.status === 404 ? (
      <StatusPage />
    ) : (
      <ErrorState
        message={errorMessage(course.error)}
        retry={() => void course.refetch()}
      />
    );
  const data = course.data.data;
  const admin = isAdmin(auth.user?.role);
  const checking =
    auth.loading || (auth.user?.role === 'STUDENT' && status.isPending);
  return (
    <>
      <Link className="back-link" to="/courses">
        <ArrowLeft size={17} />
        Tất cả khóa học
      </Link>
      <div className="detail-grid">
        <section className="detail-main">
          <div className="detail-cover">
            <CourseArtwork course={data} large />
          </div>
          <div className="detail-intro">
            <span className="category-tag">{data.category}</span>
            <h1>{data.title}</h1>
            <p className="detail-summary">{data.shortDescription}</p>
            <div className="detail-meta">
              <span>
                <UserRound size={18} />
                {data.instructor}
              </span>
              <span>
                <UsersRound size={18} />
                {data.enrolledCount}/{data.capacity} học viên
              </span>
            </div>
          </div>
          <section className="content-panel course-description">
            <h2>
              <BookOpen size={21} />
              Giới thiệu khóa học
            </h2>
            <p>{data.description}</p>
          </section>
        </section>
        <aside className="enrollment-panel">
          <SeatBadge course={data} />
          <p className="price-label">Học phí khóa học</p>
          <div className="detail-price">{money(data.tuitionVnd)}</div>
          <div className="enrollment-facts">
            <div>
              <span>Giảng viên</span>
              <strong>{data.instructor}</strong>
            </div>
            <div>
              <span>Sĩ số tối đa</span>
              <strong>{data.capacity} học viên</strong>
            </div>
            <div>
              <span>Đã ghi danh</span>
              <strong>{data.enrolledCount} học viên</strong>
            </div>
            <div>
              <span>Chỗ còn lại</span>
              <strong className="text-blue">{data.remainingSeats}</strong>
            </div>
          </div>
          {enrolled ? (
            <div className="enrolled-confirmation">
              <CheckCircle2 size={22} />
              <strong>Bạn đã ghi danh khóa học này</strong>
              <Link to="/my-courses">
                Xem khóa học của tôi <ArrowRight size={15} />
              </Link>
            </div>
          ) : admin ? (
            <Link
              className="button primary full-width"
              to={`/admin/courses/${id}/edit`}
            >
              Quản lý khóa học <ArrowRight size={17} />
            </Link>
          ) : (
            <button
              className="button primary full-width"
              disabled={
                checking ||
                mutation.isPending ||
                data.availability === 'FULL' ||
                !!auth.error ||
                (auth.user?.role === 'STUDENT' && status.isError)
              }
              onClick={() => {
                if (!auth.user)
                  navigate(
                    `/login?returnTo=${encodeURIComponent(`/courses/${id}`)}`,
                  );
                else mutation.mutate();
              }}
            >
              {checking || mutation.isPending ? (
                <LoaderCircle className="spin" size={18} />
              ) : null}
              {checking
                ? 'Đang kiểm tra…'
                : data.availability === 'FULL'
                  ? 'Khóa học đã hết chỗ'
                  : mutation.isPending
                    ? 'Đang ghi danh…'
                    : !auth.user
                      ? 'Đăng nhập để ghi danh'
                      : 'Ghi danh khóa học'}
              {!checking &&
                !mutation.isPending &&
                data.availability !== 'FULL' && <ArrowRight size={18} />}
            </button>
          )}
          {auth.error && (
            <p className="form-error">
              {auth.error}{' '}
              <button className="text-button" onClick={auth.retry}>
                Thử lại
              </button>
            </p>
          )}
          {status.isError && (
            <p className="form-error" role="alert">
              Không thể kiểm tra trạng thái ghi danh.{' '}
              <button
                className="text-button"
                onClick={() => void status.refetch()}
              >
                Thử lại
              </button>
            </p>
          )}
          {mutation.isError && (
            <p className="field-error" role="alert">
              {errorMessage(mutation.error)}
            </p>
          )}
          <p className="enrollment-footnote">
            <ShieldCheck size={15} />
            Thông tin ghi danh được lưu trong tài khoản của bạn.
          </p>
        </aside>
      </div>
    </>
  );
}

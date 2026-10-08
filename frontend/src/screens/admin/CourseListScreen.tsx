import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Search,
  Trash2,
  UsersRound,
} from 'lucide-react';
import { toast } from 'sonner';
import api, { endpoints } from '../../configs/Apis';
import { errorMessage, money } from '../../utils/api';
import { refreshCourses } from '../../configs/queryClient';
import type { Course, Envelope } from '../../types/api';
import { useFilters } from '../../hooks/useFilters';
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Loading,
  PageHeading,
  Pagination,
} from '../../components/ui';
export default function CourseListScreen() {
  const filters = useFilters();
  const [search, setSearch] = useState(filters.search);
  const [deleting, setDeleting] = useState<Course | null>(null);
  useEffect(() => setSearch(filters.search), [filters.search]);
  const query = useQuery({
    queryKey: ['admin-courses', filters.query],
    queryFn: ({ signal }) =>
      api
        .get<Envelope<Course[]>>(endpoints.adminCourses, {
          signal,
          params: new URLSearchParams(filters.query),
        })
        .then((response) => response.data),
  });
  const visibility = useMutation({
    mutationFn: (course: Course) =>
      api.patch(endpoints.adminCourse(course.id), {
        isPublished: !course.isPublished,
      }),
    onSuccess: async () => {
      toast.success('Đã cập nhật trạng thái khóa học.');
      await refreshCourses();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.delete(endpoints.adminCourse(id)),
    onSuccess: async () => {
      setDeleting(null);
      toast.success('Đã xóa khóa học.');
      await refreshCourses();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    filters.update({ search: search.trim(), page: 1 });
  }
  return (
    <>
      <PageHeading
        eyebrow="KHÔNG GIAN QUẢN TRỊ"
        title="Quản lý khóa học"
        description="Cập nhật nội dung, sĩ số và trạng thái các khóa học."
      >
        <Link className="button primary" to="/admin/courses/new">
          <Plus size={18} />
          Thêm khóa học
        </Link>
      </PageHeading>
      <section className="content-panel admin-panel">
        <div className="admin-table-top">
          <div>
            <h2>Danh sách khóa học</h2>
            <span className="muted">
              {query.data?.meta?.total ?? '—'} khóa học trong kết quả
            </span>
          </div>
          <form className="search-input admin-search" onSubmit={submit}>
            <Search size={18} />
            <input
              aria-label="Tìm khóa học quản trị"
              placeholder="Tìm theo tên khóa học…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              maxLength={100}
            />
            <button className="button secondary small">Tìm</button>
          </form>
        </div>
        {query.isPending ? (
          <Loading />
        ) : query.isError ? (
          <ErrorState
            message={errorMessage(query.error)}
            retry={() => void query.refetch()}
          />
        ) : !query.data.data.length ? (
          <EmptyState
            title="Chưa có khóa học phù hợp"
            text="Thêm khóa học mới hoặc thử một từ khóa khác."
          >
            <button
              className="button secondary"
              onClick={() =>
                filters.update({ search: '', category: '', page: 1 })
              }
            >
              Xóa bộ lọc
            </button>
          </EmptyState>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Khóa học</th>
                  <th>Học phí</th>
                  <th>Sĩ số</th>
                  <th>Trạng thái</th>
                  <th className="align-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {query.data.data.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <Link
                        className="table-title"
                        to={`/admin/courses/${course.id}/edit`}
                      >
                        {course.title}
                      </Link>
                      <span className="table-subtitle">
                        {course.category} · {course.instructor}
                      </span>
                    </td>
                    <td className="nowrap">{money(course.tuitionVnd)}</td>
                    <td>
                      <span className="seat-label">
                        {course.enrolledCount} <span>/ {course.capacity}</span>
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${course.isPublished ? 'badge-green' : 'badge-muted'}`}
                      >
                        {course.isPublished ? 'Đang hiển thị' : 'Đã ẩn'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link
                          className="icon-button"
                          title="Danh sách học viên"
                          aria-label={`Học viên ${course.title}`}
                          to={`/admin/courses/${course.id}/enrollments`}
                        >
                          <UsersRound size={17} />
                        </Link>
                        <Link
                          className="icon-button"
                          title="Chỉnh sửa"
                          aria-label={`Sửa ${course.title}`}
                          to={`/admin/courses/${course.id}/edit`}
                        >
                          <Pencil size={16} />
                        </Link>
                        <button
                          className="icon-button"
                          disabled={visibility.isPending}
                          title={
                            course.isPublished
                              ? 'Ẩn khóa học'
                              : 'Hiển thị khóa học'
                          }
                          aria-label={`${course.isPublished ? 'Ẩn' : 'Hiện'} ${course.title}`}
                          onClick={() => visibility.mutate(course)}
                        >
                          {course.isPublished ? (
                            <EyeOff size={17} />
                          ) : (
                            <Eye size={17} />
                          )}
                        </button>
                        <button
                          className="icon-button delete-button"
                          title={
                            course.enrolledCount
                              ? 'Khóa có học viên: hãy sử dụng chức năng ẩn'
                              : 'Xóa khóa học'
                          }
                          aria-label={`Xóa ${course.title}`}
                          disabled={course.enrolledCount > 0}
                          onClick={() => {
                            remove.reset();
                            setDeleting(course);
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          meta={query.data?.meta}
          onPage={(page) => filters.update({ page })}
        />
      </section>
      <p className="admin-note">
        Khóa học đã có học viên được giữ lại lịch sử. Bạn có thể ẩn khóa để
        ngừng nhận ghi danh mới.
      </p>
      <ConfirmDialog
        open={!!deleting}
        title="Xóa khóa học này?"
        pending={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
        }}
      >
        <p>
          Khóa <strong>{deleting?.title}</strong> sẽ được xóa khỏi hệ thống.
          Thao tác này không thể hoàn tác.
        </p>
        {remove.isError && (
          <p className="field-error" role="alert">
            {errorMessage(remove.error)}
          </p>
        )}
      </ConfirmDialog>
    </>
  );
}

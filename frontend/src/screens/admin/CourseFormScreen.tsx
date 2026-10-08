import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Info, LoaderCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import api, { endpoints } from '../../configs/Apis';
import { ApiError, errorMessage, parseRouteId } from '../../utils/api';
import type { Course, Envelope } from '../../types/api';
import { refreshCourses } from '../../configs/queryClient';
import { ErrorState, Field, Loading, PageHeading } from '../../components/ui';
import StatusPage from '../StatusScreen';
const text = (max: number) =>
  z
    .string()
    .trim()
    .min(1, 'Vui lòng điền thông tin.')
    .max(max, `Tối đa ${max} ký tự.`);
const schema = z.object({
  title: text(200),
  category: text(100),
  instructor: text(100),
  shortDescription: text(300),
  description: text(5000),
  tuitionVnd: z
    .number({ invalid_type_error: 'Nhập học phí hợp lệ.' })
    .int('Học phí phải là số nguyên.')
    .min(0, 'Học phí không được âm.')
    .max(2147483647),
  capacity: z
    .number({ invalid_type_error: 'Nhập sĩ số hợp lệ.' })
    .int('Sĩ số phải là số nguyên.')
    .min(1, 'Sĩ số tối thiểu là 1.')
    .max(2147483647),
  isPublished: z.boolean(),
});
type Values = z.infer<typeof schema>;
function CourseForm({ course }: { course?: Course }) {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: course?.title ?? '',
      category: course?.category ?? '',
      instructor: course?.instructor ?? '',
      shortDescription: course?.shortDescription ?? '',
      description: course?.description ?? '',
      tuitionVnd: course?.tuitionVnd ?? 0,
      capacity: course?.capacity ?? 20,
      isPublished: course?.isPublished ?? true,
    },
  });
  const mutation = useMutation({
    mutationFn: (values: Values) =>
      course
        ? api.patch(endpoints.adminCourse(course.id), values)
        : api.post(endpoints.adminCourses, values),
    onSuccess: async () => {
      toast.success(
        course ? 'Đã lưu thay đổi khóa học.' : 'Đã tạo khóa học mới.',
      );
      await refreshCourses();
      navigate('/admin/courses');
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'CAPACITY_TOO_LOW')
        setError('capacity', { message: error.message });
      toast.error(errorMessage(error));
    },
  });
  function submit(values: Values) {
    if (course && values.capacity < course.enrolledCount) {
      setError('capacity', {
        message: `Sĩ số không được thấp hơn ${course.enrolledCount} học viên đã ghi danh.`,
      });
      return;
    }
    mutation.mutate(values);
  }
  const fieldProps = (key: keyof Values) => ({
    'aria-invalid': !!errors[key],
    'aria-describedby': errors[key] ? `${key}-error` : undefined,
  });
  return (
    <form
      className="course-form-layout"
      onSubmit={handleSubmit(submit)}
      noValidate
    >
      <section className="content-panel form-panel">
        <h2>Thông tin khóa học</h2>
        <p className="muted form-section-description">
          Giúp học viên hiểu rõ điều họ sắp khám phá.
        </p>
        <Field label="Tên khóa học" id="title" error={errors.title?.message}>
          <input
            id="title"
            placeholder="Ví dụ: React thực chiến"
            {...register('title')}
            {...fieldProps('title')}
          />
        </Field>
        <div className="form-row">
          <Field
            label="Danh mục"
            id="category"
            error={errors.category?.message}
          >
            <input
              id="category"
              placeholder="Ví dụ: Co-op IT"
              {...register('category')}
              {...fieldProps('category')}
            />
          </Field>
          <Field
            label="Giảng viên"
            id="instructor"
            error={errors.instructor?.message}
          >
            <input
              id="instructor"
              placeholder="Tên giảng viên"
              {...register('instructor')}
              {...fieldProps('instructor')}
            />
          </Field>
        </div>
        <Field
          label="Mô tả ngắn"
          id="shortDescription"
          error={errors.shortDescription?.message}
          hint="Tối đa 300 ký tự, hiển thị trên thẻ khóa học."
        >
          <textarea
            id="shortDescription"
            rows={3}
            {...register('shortDescription')}
            {...fieldProps('shortDescription')}
          />
        </Field>
        <Field
          label="Nội dung chi tiết"
          id="description"
          error={errors.description?.message}
          hint="Mô tả mục tiêu và nội dung học, tối đa 5.000 ký tự."
        >
          <textarea
            id="description"
            rows={8}
            {...register('description')}
            {...fieldProps('description')}
          />
        </Field>
      </section>
      <aside className="form-settings">
        <section className="content-panel form-panel">
          <h2>Thiết lập ghi danh</h2>
          <Field
            label="Học phí (VND)"
            id="tuitionVnd"
            error={errors.tuitionVnd?.message}
            hint="Nhập 0 cho khóa học miễn phí."
          >
            <input
              id="tuitionVnd"
              type="number"
              min={0}
              step={1}
              {...register('tuitionVnd', { valueAsNumber: true })}
              {...fieldProps('tuitionVnd')}
            />
          </Field>
          <Field
            label="Sĩ số tối đa"
            id="capacity"
            error={errors.capacity?.message}
          >
            <input
              id="capacity"
              type="number"
              min={Math.max(1, course?.enrolledCount ?? 0)}
              step={1}
              {...register('capacity', { valueAsNumber: true })}
              {...fieldProps('capacity')}
            />
          </Field>
          {course && (
            <p className="info-note">
              <Info size={16} />
              Đã có {course.enrolledCount} học viên ghi danh.
            </p>
          )}
          <label className="checkbox-field">
            <input type="checkbox" {...register('isPublished')} />
            <span>
              <strong>Hiển thị khóa học</strong>
              <small>Cho phép học viên xem và ghi danh.</small>
            </span>
          </label>
        </section>
        {mutation.isError && (
          <p className="form-error" role="alert">
            {errorMessage(mutation.error)}
          </p>
        )}
        <button
          className="button primary full-width"
          type="submit"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <LoaderCircle className="spin" size={18} />
          ) : (
            <Save size={18} />
          )}
          {mutation.isPending
            ? 'Đang lưu…'
            : course
              ? 'Lưu thay đổi'
              : 'Tạo khóa học'}
        </button>
        <Link className="button secondary full-width" to="/admin/courses">
          Quay lại danh sách
        </Link>
      </aside>
    </form>
  );
}
export default function CourseFormScreen() {
  const { id: routeId } = useParams();
  const id = routeId === undefined ? undefined : parseRouteId(routeId);
  const query = useQuery({
    queryKey: ['admin-course', id],
    queryFn: ({ signal }) =>
      api
        .get<Envelope<Course>>(endpoints.adminCourse(id ?? 0), { signal })
        .then((response) => response.data),
    enabled: routeId !== undefined && Number.isInteger(id),
  });
  if (routeId !== undefined && !Number.isInteger(id)) return <StatusPage />;
  if (routeId !== undefined && query.isPending) return <Loading />;
  if (routeId !== undefined && query.isError)
    return query.error instanceof ApiError && query.error.status === 404 ? (
      <StatusPage />
    ) : (
      <ErrorState
        message={errorMessage(query.error)}
        retry={() => void query.refetch()}
      />
    );
  return (
    <>
      <Link className="back-link" to="/admin/courses">
        <ArrowLeft size={17} />
        Quản lý khóa học
      </Link>
      <PageHeading
        eyebrow="KHÔNG GIAN QUẢN TRỊ"
        title={
          routeId !== undefined ? 'Chỉnh sửa khóa học' : 'Thêm khóa học mới'
        }
        description="Điền đầy đủ thông tin trước khi mở ghi danh."
      />
      <CourseForm
        key={id ?? 'new'}
        course={routeId !== undefined ? query.data?.data : undefined}
      />
    </>
  );
}

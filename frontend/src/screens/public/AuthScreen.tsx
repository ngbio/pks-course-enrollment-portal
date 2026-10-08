import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { ApiError, errorMessage, isAdmin, safeReturnTo } from '../../utils/api';
import api, { endpoints } from '../../configs/Apis';
import { Field, Loading } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
function AuthForm({ register: signingUp = false }: { register?: boolean }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const schema = z.object({
    fullName: signingUp
      ? z
          .string()
          .trim()
          .min(2, 'Nhập họ tên từ 2 ký tự.')
          .max(100, 'Tối đa 100 ký tự.')
      : z.string().optional(),
    email: z.string().trim().email('Nhập địa chỉ email hợp lệ.').max(254),
    password: z
      .string()
      .min(8, 'Mật khẩu cần ít nhất 8 ký tự.')
      .refine(
        (v) => new TextEncoder().encode(v).length <= 72,
        'Mật khẩu quá dài (tối đa 72 byte).',
      ),
  });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const target = safeReturnTo(
    params.get('returnTo'),
    isAdmin(auth.user?.role) ? '/admin/courses' : '/courses',
  );
  if (auth.loading) return <Loading />;
  if (auth.user) return <Navigate to={target} replace />;
  async function submit(values: z.infer<typeof schema>) {
    try {
      if (signingUp) {
        await api.post(endpoints.register, {
          fullName: values.fullName,
          email: values.email,
          password: values.password,
        });
        toast.success('Tạo tài khoản thành công. Hãy đăng nhập để bắt đầu!');
        navigate(
          `/login${params.get('returnTo') ? `?returnTo=${encodeURIComponent(target)}` : ''}`,
          { replace: true },
        );
      } else {
        const user = await auth.signIn(values.email, values.password);
        toast.success(`Chào mừng ${user.fullName}!`);
        navigate(
          safeReturnTo(
            params.get('returnTo'),
            isAdmin(user.role) ? '/admin/courses' : '/courses',
          ),
          { replace: true },
        );
      }
    } catch (error) {
      if (error instanceof ApiError && error.code === 'EMAIL_EXISTS')
        setError('email', { message: error.message });
      else setError('root', { message: errorMessage(error) });
      toast.error(errorMessage(error));
    }
  }
  const alternate = `${signingUp ? '/login' : '/register'}${params.get('returnTo') ? `?returnTo=${encodeURIComponent(target)}` : ''}`;
  return (
    <div className="auth-layout">
      <section className="auth-story">
        <p className="eyebrow">PKS EDUCATION</p>
        <h1>
          Một tài khoản.
          <br />
          Nhiều bước tiến.
        </h1>
        <p>
          Khám phá kiến thức mới và chủ động xây dựng hành trình học tập của
          bạn.
        </p>
        <div className="auth-orbit" aria-hidden="true">
          <span>learn.</span>
          <span>build.</span>
          <span>grow.</span>
          <ArrowRight size={38} />
        </div>
        <ul>
          <li>
            <Check size={18} />
            Tìm khóa học phù hợp với bạn
          </li>
          <li>
            <Check size={18} />
            Ghi danh trực tuyến dễ dàng
          </li>
          <li>
            <Check size={18} />
            Theo dõi các khóa đã đăng ký
          </li>
        </ul>
      </section>
      <section className="auth-form-panel">
        <div className="auth-form-heading">
          <span className="state-icon">
            <ShieldCheck size={23} />
          </span>
          <h2>
            {signingUp ? 'Bắt đầu hành trình mới' : 'Chào mừng bạn trở lại'}
          </h2>
          <p>
            {signingUp
              ? 'Tạo tài khoản học viên tại PKS Education.'
              : 'Đăng nhập để tiếp tục hành trình học tập.'}
          </p>
        </div>
        <form
          key={signingUp ? 'register' : 'login'}
          onSubmit={handleSubmit(submit)}
          noValidate
        >
          {signingUp && (
            <Field
              label="Họ và tên"
              id="fullName"
              error={errors.fullName?.message}
            >
              <input
                id="fullName"
                autoComplete="name"
                placeholder="Nguyễn Văn An"
                {...register('fullName')}
                aria-invalid={!!errors.fullName}
                aria-describedby={
                  errors.fullName ? 'fullName-error' : undefined
                }
              />
            </Field>
          )}
          <Field label="Email" id="email" error={errors.email?.message}>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="ban@example.com"
              {...register('email')}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
          </Field>
          <Field
            label="Mật khẩu"
            id="password"
            error={errors.password?.message}
            hint={signingUp ? 'Ít nhất 8 ký tự, tối đa 72 byte.' : undefined}
          >
            <div className="password-input">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={signingUp ? 'new-password' : 'current-password'}
                placeholder="Nhập mật khẩu của bạn"
                {...register('password')}
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password
                    ? 'password-error'
                    : signingUp
                      ? 'password-hint'
                      : undefined
                }
              />
              <button
                type="button"
                className="icon-button"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>
          {errors.root && (
            <p role="alert" className="form-error">
              {errors.root.message}
            </p>
          )}
          <button
            className="button primary full-width"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? <LoaderCircle size={18} className="spin" /> : null}
            {signingUp ? 'Tạo tài khoản' : 'Đăng nhập'}
            {!isSubmitting && <ArrowRight size={18} />}
          </button>
        </form>
        <p className="auth-switch">
          {signingUp ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
          <Link to={alternate}>{signingUp ? 'Đăng nhập' : 'Đăng ký ngay'}</Link>
        </p>
        <p className="auth-footnote">
          <ShieldCheck size={14} />
          Thông tin của bạn được bảo vệ.
        </p>
      </section>
    </div>
  );
}

export default function AuthScreen({
  register = false,
}: {
  register?: boolean;
}) {
  return <AuthForm key={register ? 'register' : 'login'} register={register} />;
}

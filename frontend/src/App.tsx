import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Loading } from './components/ui';
import Layout from './components/Layout';
import Protected from './components/ProtectedRoute';
import StatusPage from './screens/StatusScreen';
const Catalog = lazy(() => import('./screens/public/CoursesScreen'));
const Detail = lazy(() => import('./screens/public/CourseDetailScreen'));
const AuthPage = lazy(() => import('./screens/public/AuthScreen'));
const MyCourses = lazy(() => import('./screens/public/MyCoursesScreen'));
const AdminCourses = lazy(() => import('./screens/admin/CourseListScreen'));
const CourseForm = lazy(() => import('./screens/admin/CourseFormScreen'));
const CourseStudents = lazy(
  () => import('./screens/admin/CourseStudentsScreen'),
);

export default function App() {
  const location = useLocation();
  useEffect(() => {
    document.title = `${location.pathname.startsWith('/admin') ? 'Quản trị' : location.pathname === '/login' ? 'Đăng nhập' : location.pathname === '/register' ? 'Tạo tài khoản' : 'Khóa học'} · PKS Education`;
  }, [location.pathname]);
  return (
    <Suspense fallback={<Loading label="Đang mở trang…" />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/courses" replace />} />
          <Route path="courses" element={<Catalog />} />
          <Route path="courses/:id" element={<Detail />} />
          <Route path="login" element={<AuthPage />} />
          <Route path="register" element={<AuthPage register />} />
          <Route
            path="my-courses"
            element={
              <Protected>
                <MyCourses />
              </Protected>
            }
          />
          <Route
            path="admin/courses"
            element={
              <Protected admin>
                <AdminCourses />
              </Protected>
            }
          />
          <Route
            path="admin/courses/new"
            element={
              <Protected admin>
                <CourseForm />
              </Protected>
            }
          />
          <Route
            path="admin/courses/:id/edit"
            element={
              <Protected admin>
                <CourseForm />
              </Protected>
            }
          />
          <Route
            path="admin/courses/:id/enrollments"
            element={
              <Protected admin>
                <CourseStudents />
              </Protected>
            }
          />
          <Route path="*" element={<StatusPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

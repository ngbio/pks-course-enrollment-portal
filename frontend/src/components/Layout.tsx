import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  Compass,
  GraduationCap,
  LayoutGrid,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { errorMessage, isAdmin } from '../utils/api';
export function Brand() {
  return (
    <Link
      className="brand"
      to="/courses"
      aria-label="PKS Education - Trang chủ"
    >
      <span className="brand-mark">
        <GraduationCap size={24} strokeWidth={1.8} />
      </span>
      <span>
        <strong>
          PKS<span className="brand-dot">.</span>
        </strong>
        <small>EDUCATION</small>
      </span>
    </Link>
  );
}
export default function Layout() {
  const { user, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [menuOpen]);
  const admin = isAdmin(user?.role);
  const section = location.pathname.startsWith('/admin')
    ? 'Không gian quản trị'
    : location.pathname === '/my-courses'
      ? 'Khóa học của tôi'
      : 'Khám phá khóa học';
  async function logout() {
    setLeaving(true);
    try {
      await signOut();
      toast.success('Đã đăng xuất. Hẹn gặp lại bạn!');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setLeaving(false);
    }
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Đến nội dung chính
      </a>
      {menuOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Đóng menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside
        className={`sidebar ${menuOpen ? 'is-open' : ''}`}
        id="main-navigation"
      >
        <div className="sidebar-brand">
          <Brand />
          <button
            className="icon-button mobile-only"
            aria-label="Đóng menu"
            onClick={() => setMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-label">KHÔNG GIAN HỌC TẬP</div>
        <nav className="side-nav" aria-label="Điều hướng chính">
          <NavLink to="/courses">
            <Compass size={19} />
            Khám phá khóa học
            <ChevronRight className="nav-arrow" size={15} />
          </NavLink>
          {(!user || user.role === 'STUDENT') && (
            <NavLink to="/my-courses">
              <BookOpen size={19} />
              Khóa học của tôi
            </NavLink>
          )}
          {admin && (
            <>
              <div className="workspace-label nav-section">QUẢN TRỊ</div>
              <NavLink to="/admin/courses">
                <LayoutGrid size={19} />
                Quản lý khóa học
              </NavLink>
            </>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="learning-note">
            <span className="note-icon">
              <Sparkles size={20} />
            </span>
            <h3>
              Một kỹ năng mới.
              <br />
              Một cơ hội mới.
            </h3>
            <p>Bắt đầu hành trình của bạn từ một khóa học phù hợp.</p>
            <Link to="/courses">
              Khám phá ngay <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="sidebar-signature">
            <span className="tiny-dot" />
            Learn. Build. Grow.
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-only"
              aria-label="Mở menu"
              aria-expanded={menuOpen}
              aria-controls="main-navigation"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={22} />
            </button>
            <span className="header-prefix">PKS Education</span>
            <ChevronRight className="header-prefix" size={14} />
            <span>{section}</span>
          </div>
          <div className="header-account">
            {loading ? (
              <span className="muted">Đang tải…</span>
            ) : user ? (
              <>
                <span className="avatar">
                  {user.fullName
                    .trim()
                    .split(/\s+/)
                    .at(-1)
                    ?.slice(0, 1)
                    .toUpperCase()}
                </span>
                <div className="account-name">
                  <strong>{user.fullName}</strong>
                  <small>
                    {admin ? (
                      <>
                        <ShieldCheck size={12} />
                        {user.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên'}
                      </>
                    ) : (
                      'Học viên'
                    )}
                  </small>
                </div>
                <button
                  className="icon-button logout-button"
                  aria-label="Đăng xuất"
                  title="Đăng xuất"
                  disabled={leaving}
                  onClick={() => void logout()}
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <>
                <Link className="login-link" to="/login">
                  Đăng nhập
                </Link>
                <Link className="button primary small" to="/register">
                  Tạo tài khoản <ArrowUpRight size={15} />
                </Link>
              </>
            )}
          </div>
        </header>
        <main id="main-content" className="main-content">
          <Outlet />
        </main>
        <footer className="site-footer">
          <span>© {new Date().getFullYear()} PKS Education</span>
          <span>Kiến thức thực tế. Tương lai rộng mở.</span>
        </footer>
      </div>
    </div>
  );
}

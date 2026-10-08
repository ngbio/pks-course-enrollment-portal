import { useEffect, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUpRight,
  Braces,
  Check,
  Search,
  Sparkles,
} from 'lucide-react';
import api, { endpoints } from '../../configs/Apis';
import { errorMessage } from '../../utils/api';
import type { Course, Envelope } from '../../types/api';
import { CourseCard } from '../../components/course-card';
import {
  EmptyState,
  ErrorState,
  Loading,
  Pagination,
} from '../../components/ui';
import { useFilters } from '../../hooks/useFilters';
export default function CoursesScreen() {
  const filters = useFilters();
  const [search, setSearch] = useState(filters.search);
  useEffect(() => setSearch(filters.search), [filters.search]);
  const courses = useQuery({
    queryKey: ['courses', filters.query],
    queryFn: ({ signal }) =>
      api
        .get<Envelope<Course[]>>(endpoints.courses, {
          signal,
          params: new URLSearchParams(filters.query),
        })
        .then((response) => response.data),
  });
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: ({ signal }) =>
      api
        .get<Envelope<string[]>>(endpoints.categories, { signal })
        .then((response) => response.data),
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    filters.update({ search: search.trim(), page: 1 });
  }
  return (
    <>
      <section className="catalog-hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="hero-dot" /> HỌC THỰC CHIẾN, VỮNG TƯƠNG LAI
          </p>
          <h1>
            Đầu tư vào kỹ năng.
            <br />
            <span>Mở lối tương lai.</span>
          </h1>
          <p>
            Khám phá các khóa học công nghệ và tin học.
            <br className="desktop-break" /> Chọn điều bạn muốn học, bắt đầu
            điều bạn muốn làm.
          </p>
          <a className="button primary" href="#course-list">
            Tìm khóa học của bạn <ArrowDown size={17} />
          </a>
          <div className="hero-footnote">
            <Check size={15} /> Tra cứu dễ dàng <span /> Ghi danh trực tuyến
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="floating-star">
            <Sparkles size={26} />
          </div>
          <div className="code-window">
            <div className="window-top">
              <i />
              <i />
              <i />
              <span>your-next-chapter.ts</span>
            </div>
            <div className="window-code">
              <span className="code-line-number">01</span>
              <span>
                <b>const</b> yourFuture = {'{'}
              </span>
              <span className="code-line-number">02</span>
              <span className="code-indent">
                skills: <em>'always growing'</em>,
              </span>
              <span className="code-line-number">03</span>
              <span className="code-indent">
                possibilities: <em>'endless'</em>
              </span>
              <span className="code-line-number">04</span>
              <span>{'};'}</span>
              <span className="code-line-number">05</span>
              <span />
              <span className="code-line-number">06</span>
              <span>
                <b>startLearning</b>(you);
                <i className="cursor" />
              </span>
            </div>
          </div>
          <div className="floating-label">
            <span>
              <Braces size={22} />
            </span>
            <div>
              <strong>Học. Thực hành. Phát triển.</strong>
              <small>Mỗi ngày một bước tiến.</small>
            </div>
            <ArrowUpRight size={19} />
          </div>
        </div>
      </section>
      <section id="course-list" className="catalog-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CHỌN HÀNH TRÌNH CỦA BẠN</p>
            <div className="catalog-title-row">
              <h2>Khám phá khóa học</h2>
              {courses.data?.meta && (
                <span className="count-pill">
                  {courses.data.meta.total} khóa học
                </span>
              )}
            </div>
          </div>
          <p className="muted">Kỹ năng hôm nay, cơ hội ngày mai.</p>
        </div>
        <form className="catalog-toolbar" onSubmit={submit}>
          <div className="search-input">
            <Search size={19} />
            <input
              aria-label="Tìm kiếm khóa học"
              placeholder="Bạn muốn học điều gì?"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              maxLength={100}
            />
            <button className="button primary small" type="submit">
              Tìm kiếm
            </button>
          </div>
          <label className="category-select">
            <span>Danh mục</span>
            <select
              aria-label="Lọc danh mục"
              value={filters.category}
              onChange={(e) =>
                filters.update({ category: e.target.value, page: 1 })
              }
            >
              <option value="">Tất cả danh mục</option>
              {filters.category &&
                !categories.data?.data.includes(filters.category) && (
                  <option>{filters.category}</option>
                )}
              {categories.data?.data.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </form>
        {categories.isError && (
          <p className="inline-warning">
            Chưa tải được danh mục.{' '}
            <button
              className="text-button"
              onClick={() => void categories.refetch()}
            >
              Thử lại
            </button>
          </p>
        )}
        <div className="catalog-result-label">
          <span>
            {filters.search
              ? `Kết quả cho “${filters.search}”`
              : 'Tất cả khóa học'}
            {filters.category && ` · ${filters.category}`}
          </span>
          {(filters.search || filters.category) && (
            <button
              className="text-button"
              onClick={() =>
                filters.update({ search: '', category: '', page: 1 })
              }
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
        {courses.isPending ? (
          <Loading />
        ) : courses.isError ? (
          <ErrorState
            message={errorMessage(courses.error)}
            retry={() => void courses.refetch()}
          />
        ) : courses.data.data.length ? (
          <div className="course-grid">
            {courses.data.data.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Chưa tìm thấy khóa học"
            text="Thử một từ khóa hoặc danh mục khác để khám phá thêm."
          >
            <button
              className="button secondary"
              onClick={() =>
                filters.update({ search: '', category: '', page: 1 })
              }
            >
              Xem tất cả khóa học
            </button>
          </EmptyState>
        )}
        <Pagination
          meta={courses.data?.meta}
          onPage={(page) => filters.update({ page })}
        />
      </section>
      <div className="catalog-bottom-note">
        <span className="bottom-note-icon">
          <Sparkles size={21} />
        </span>
        <div>
          <strong>Hành trình lớn bắt đầu từ một bước nhỏ.</strong>
          <p>
            Chọn khóa học phù hợp và dành thời gian cho phiên bản tốt hơn của
            chính mình.
          </p>
        </div>
      </div>
    </>
  );
}

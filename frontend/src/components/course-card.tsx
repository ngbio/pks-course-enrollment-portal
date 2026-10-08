import {
  ArrowUpRight,
  Atom,
  Braces,
  FileSpreadsheet,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Course } from '../types/api';
import { money } from '../utils/api';
export function CourseArtwork({
  course,
  large = false,
}: {
  course: Pick<Course, 'title' | 'category'>;
  large?: boolean;
}) {
  const kind = /mos|excel|word|office/i.test(
    `${course.title} ${course.category}`,
  )
    ? 'office'
    : /react|front|web/i.test(course.title)
      ? 'react'
      : 'backend';
  return (
    <div
      className={`course-art art-${kind}${large ? ' art-large' : ''}`}
      aria-hidden="true"
    >
      <div className="art-grid" />
      <span className="art-caption">
        {kind === 'office' ? 'DIGITAL SKILLS' : 'BUILD SOMETHING GREAT'}
      </span>
      <div className="art-symbol">
        {kind === 'react' ? (
          <Atom strokeWidth={1.2} />
        ) : kind === 'office' ? (
          <FileSpreadsheet strokeWidth={1.2} />
        ) : (
          <Braces strokeWidth={1.3} />
        )}
      </div>
      <div className="art-code">
        <span className="code-dot" />
        <span>
          {kind === 'office'
            ? '= YOUR.NEXT.LEVEL()'
            : kind === 'react'
              ? '<YourFuture />'
              : 'const future = you;'}
        </span>
      </div>
      <span className="art-word">
        {kind === 'office'
          ? 'work smarter.'
          : kind === 'react'
            ? 'create.'
            : 'build.'}
      </span>
    </div>
  );
}
export function SeatBadge({ course }: { course: Course }) {
  return (
    <span
      className={`badge ${course.availability === 'FULL' ? 'badge-muted' : 'badge-green'}`}
    >
      <span className="badge-dot" />
      {course.availability === 'FULL' ? 'Hết chỗ' : 'Còn chỗ'}
    </span>
  );
}
export function CourseCard({ course }: { course: Course }) {
  return (
    <article className="course-card">
      <Link
        className="course-cover-link"
        to={`/courses/${course.id}`}
        aria-label={`Xem ${course.title}`}
      >
        <CourseArtwork course={course} />
      </Link>
      <div className="course-card-body">
        <div className="card-tags">
          <span className="category-tag">{course.category}</span>
          <SeatBadge course={course} />
        </div>
        <h3>
          <Link to={`/courses/${course.id}`}>{course.title}</Link>
        </h3>
        <p className="course-summary">{course.shortDescription}</p>
        <div className="course-meta">
          <span>
            <UserRound size={15} />
            {course.instructor}
          </span>
          <span>
            <UsersRound size={15} />
            {course.enrolledCount}/{course.capacity} học viên
          </span>
        </div>
        <div
          className="seat-track"
          aria-label={`${course.enrolledCount} trên ${course.capacity} chỗ đã đăng ký`}
        >
          <span
            style={{
              width: `${Math.min(100, (course.enrolledCount / course.capacity) * 100)}%`,
            }}
          />
        </div>
        <div className="course-card-footer">
          <div>
            <span className="price-label">Học phí</span>
            <strong>{money(course.tuitionVnd)}</strong>
          </div>
          <Link
            className="card-link"
            to={`/courses/${course.id}`}
            aria-label={`Chi tiết ${course.title}`}
          >
            <ArrowUpRight size={21} />
          </Link>
        </div>
      </div>
    </article>
  );
}

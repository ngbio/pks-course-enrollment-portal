import { useEffect, useRef, type ReactNode } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  LoaderCircle,
  X,
} from 'lucide-react';
import type { Meta } from '../types/api';
export function Loading({ label = 'Đang tải dữ liệu…' }: { label?: string }) {
  return (
    <div className="loading-state" role="status">
      <LoaderCircle className="spin" size={25} />
      <span>{label}</span>
    </div>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="state-panel error-state" role="alert">
      <span className="state-icon">
        <AlertCircle size={26} />
      </span>
      <h2>Chưa thể tải nội dung</h2>
      <p>{message}</p>
      {retry && (
        <button className="button secondary" onClick={retry}>
          Thử lại
        </button>
      )}
    </div>
  );
}
export function EmptyState({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <div className="state-panel">
      <span className="state-icon">
        <BookOpen size={28} />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      {children}
    </div>
  );
}
export function Pagination({
  meta,
  onPage,
}: {
  meta?: Meta;
  onPage: (page: number) => void;
}) {
  if (!meta || (meta.totalPages <= 1 && meta.page === 1)) return null;
  return (
    <nav className="pagination" aria-label="Phân trang">
      <span>
        Trang {meta.page} / {Math.max(meta.totalPages, 1)}
      </span>
      <div>
        <button
          className="button secondary small"
          disabled={meta.page <= 1}
          onClick={() => onPage(meta.page - 1)}
        >
          <ArrowLeft size={16} /> Trước
        </button>
        <button
          className="button secondary small"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPage(meta.page + 1)}
        >
          Sau <ArrowRight size={16} />
        </button>
      </div>
    </nav>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}
export function Field({
  label,
  id,
  error,
  children,
  hint,
}: {
  label: string;
  id: string;
  error?: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
export function ConfirmDialog({
  open,
  title,
  children,
  pending,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      aria-labelledby="dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!pending) onCancel();
      }}
    >
      <div className="dialog-heading">
        <h2 id="dialog-title">{title}</h2>
        <button
          className="icon-button"
          aria-label="Đóng hộp thoại"
          disabled={pending}
          onClick={onCancel}
        >
          <X size={20} />
        </button>
      </div>
      <div className="dialog-copy">{children}</div>
      <div className="dialog-actions">
        <button
          className="button secondary"
          disabled={pending}
          onClick={onCancel}
          autoFocus
        >
          Giữ lại
        </button>
        <button
          className="button danger"
          disabled={pending}
          onClick={onConfirm}
        >
          {pending && <LoaderCircle className="spin" size={16} />}Xóa khóa học
        </button>
      </div>
    </dialog>
  );
}

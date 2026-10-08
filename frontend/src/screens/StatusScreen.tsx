import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldX, MapPinOff } from 'lucide-react';
export default function StatusScreen({
  forbidden = false,
}: {
  forbidden?: boolean;
}) {
  return (
    <div className="state-panel status-page">
      <span className="state-icon">
        {forbidden ? <ShieldX size={32} /> : <MapPinOff size={32} />}
      </span>
      <p className="eyebrow">
        {forbidden ? '403 · KHÔNG CÓ QUYỀN' : '404 · KHÔNG TÌM THẤY'}
      </p>
      <h1>
        {forbidden ? 'Trang này dành cho vai trò khác' : 'Có vẻ bạn đã đi lạc'}
      </h1>
      <p>
        {forbidden
          ? 'Tài khoản hiện tại không được truy cập chức năng này.'
          : 'Trang hoặc khóa học không tồn tại, hoặc đã được ẩn.'}
      </p>
      <Link className="button primary" to="/courses">
        <ArrowLeft size={16} />
        Về danh sách khóa học
      </Link>
    </div>
  );
}

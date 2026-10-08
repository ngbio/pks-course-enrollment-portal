import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';

const password = process.env.SEED_DEMO_PASSWORD;
if (!password) throw new Error('Set SEED_DEMO_PASSWORD in backend/.env.test');
const origin = 'http://127.0.0.1:5174';
const runId = randomUUID().slice(0, 8);
const evidence = '../docs/frontend-evidence';
mkdirSync(evidence, { recursive: true });

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password!);
  const [response] = await Promise.all([
    page.waitForResponse(
      (result) =>
        result.url().endsWith('/api/auth/login') &&
        result.request().method() === 'POST',
    ),
    page.getByRole('button', { name: 'Đăng nhập', exact: true }).click(),
  ]);
  expect(response.status()).toBe(200);
  await expect(
    page.getByRole('button', { name: 'Đăng xuất', exact: true }),
  ).toBeVisible();
}

async function adminApi(request: APIRequestContext) {
  const result = await request.post('/api/auth/login', {
    headers: { Origin: origin },
    data: { email: 'admin@pks.test', password },
  });
  expect(result.status()).toBe(200);
}
async function createCourse(
  request: APIRequestContext,
  title: string,
  capacity = 2,
) {
  await adminApi(request);
  const result = await request.post('/api/admin/courses', {
    headers: { Origin: origin },
    data: {
      title,
      category: `E2E ${runId}`,
      instructor: 'Giảng viên kiểm thử',
      shortDescription: 'Khóa học dành cho kiểm thử trình duyệt.',
      description: 'Nội dung khóa học dùng để xác minh luồng ghi danh thực tế.',
      tuitionVnd: 100000,
      capacity,
      isPublished: true,
    },
  });
  expect(result.status()).toBe(201);
  const id = (await result.json()).data.id as number;
  expect(Number.isInteger(id)).toBe(true);
  return id;
}
async function createStudent(request: APIRequestContext, suffix: string) {
  const email = `${suffix}-${randomUUID()}@pks.test`;
  const result = await request.post('/api/auth/register', {
    headers: { Origin: origin },
    data: { email, fullName: `Học viên ${suffix}`, password },
  });
  expect(result.status()).toBe(201);
  return email;
}

test('public catalog: real data, search/filter URL, empty result, mobile layout', async ({
  page,
  request,
}) => {
  await createCourse(request, `Search ${runId}`);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/courses');
  await expect(
    page.getByRole('heading', { name: 'Đầu tư vào kỹ năng.' }),
  ).toBeVisible();
  await page.getByRole('textbox', { name: 'Tìm kiếm khóa học' }).fill(runId);
  await page.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`search=${runId}`));
  await page.getByLabel('Lọc danh mục').selectOption(`E2E ${runId}`);
  await expect(page.locator('.course-card')).toHaveCount(1);
  await expect(page).toHaveURL(new RegExp(`search=${runId}`));
  await page.reload();
  await expect(
    page.getByRole('textbox', { name: 'Tìm kiếm khóa học' }),
  ).toHaveValue(runId);
  await expect(page.locator('.course-card')).toHaveCount(1);
  await page
    .getByRole('textbox', { name: 'Tìm kiếm khóa học' })
    .fill(`not-found-${runId}`);
  await page.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Chưa tìm thấy khóa học' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Xem tất cả khóa học' }).click();
  await expect(page.locator('.course-card').first()).toBeVisible();
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Mở menu' }).click();
  await expect(
    page.getByRole('navigation', { name: 'Điều hướng chính' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Đóng menu', exact: true })
    .last()
    .click();
  expect(errors).toEqual([]);
});

test('protected route, login errors, restored session and logout', async ({
  page,
}) => {
  await page.goto('/my-courses');
  await expect(page).toHaveURL(/login\?returnTo=/);
  await page.getByLabel('Email', { exact: true }).fill('student@pks.test');
  await page
    .getByLabel('Mật khẩu', { exact: true })
    .fill('Incorrect-password-123');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.locator('form .form-error')).toContainText(
    'Email hoặc mật khẩu không đúng',
  );
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password!);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL('/my-courses');
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Khóa học của tôi', exact: true }),
  ).toBeVisible();
  await page.goto('/admin/courses');
  await expect(
    page.getByRole('heading', { name: 'Trang này dành cho vai trò khác' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page).toHaveURL('/courses');
  await page.goto('/my-courses');
  await expect(page).toHaveURL(/login/);
});

test('registration validates fields and creates a real student', async ({
  page,
}) => {
  await page.goto('/register');
  await page
    .getByRole('button', { name: 'Tạo tài khoản', exact: true })
    .click();
  await expect(page.getByText('Nhập họ tên từ 2 ký tự.')).toBeVisible();
  await expect(page.getByText('Nhập địa chỉ email hợp lệ.')).toBeVisible();
  const email = `ui-${randomUUID()}@pks.test`;
  await page.getByLabel('Họ và tên').fill('Học viên giao diện');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password!);
  await page.getByRole('button', { name: 'Hiện mật khẩu' }).click();
  await expect(page.getByLabel('Mật khẩu', { exact: true })).toHaveAttribute(
    'type',
    'text',
  );
  await page.getByRole('button', { name: 'Ẩn mật khẩu' }).click();
  let release: (() => void) | undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/auth/register', async (route) => {
    await gate;
    await route.continue();
  });
  await page
    .getByRole('button', { name: 'Tạo tài khoản', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Tạo tài khoản', exact: true }),
  ).toBeDisabled();
  release!();
  await expect(page).toHaveURL('/login');
  await login(page, email);
  await page.goto('/my-courses');
  await expect(
    page.getByRole('heading', { name: 'Hành trình của bạn đang chờ bắt đầu' }),
  ).toBeVisible();
});

test('guest returns to detail; enrollment updates count, survives reload and stays visible after hide', async ({
  page,
  request,
}) => {
  const title = `React trải nghiệm ${runId}`;
  const id = await createCourse(request, title);
  const email = await createStudent(request, 'enroll');
  await page.goto(`/courses/${id}`);
  await page.getByRole('button', { name: 'Đăng nhập để ghi danh' }).click();
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password!);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(`/courses/${id}`);
  await page
    .getByRole('button', { name: 'Ghi danh khóa học', exact: true })
    .click();
  await expect(page.getByText('Bạn đã ghi danh khóa học này')).toBeVisible();
  await expect(page.locator('.detail-meta')).toContainText('1/2 học viên');
  await page.screenshot({
    path: `${evidence}/detail-enrolled.png`,
    fullPage: true,
  });
  await page.reload();
  await expect(page.getByText('Bạn đã ghi danh khóa học này')).toBeVisible();
  await adminApi(request);
  expect(
    (
      await request.patch(`/api/admin/courses/${id}`, {
        headers: { Origin: origin },
        data: { isPublished: false },
      })
    ).status(),
  ).toBe(200);
  await page.goto('/my-courses');
  await expect(
    page.getByRole('heading', { name: title, exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Tạm ngừng nhận ghi danh')).toBeVisible();
  await page.getByText('Thông tin khóa đã ghi danh').click();
  await expect(
    page.getByText(
      'Nội dung khóa học dùng để xác minh luồng ghi danh thực tế.',
    ),
  ).toBeVisible();
  await page.screenshot({ path: `${evidence}/my-courses.png`, fullPage: true });
  await page.goto(`/courses/${id}`);
  await expect(
    page.getByRole('heading', { name: 'Có vẻ bạn đã đi lạc' }),
  ).toBeVisible();
});

test('full course disables enrollment and 409 race failure refreshes stale capacity', async ({
  page,
  request,
}) => {
  const id = await createCourse(request, `Full course ${runId}`, 1);
  const email = await createStudent(request, 'last-seat');
  await login(page, email);
  await page.goto(`/courses/${id}`);
  await expect(
    page.getByRole('button', { name: 'Ghi danh khóa học', exact: true }),
  ).toBeEnabled();
  // Another user takes the seat after the page loads: exercise the real 409 response.
  const other = await createStudent(request, 'other');
  await request.post('/api/auth/login', {
    headers: { Origin: origin },
    data: { email: other, password },
  });
  expect(
    (
      await request.post(`/api/courses/${id}/enrollments`, {
        headers: { Origin: origin },
      })
    ).status(),
  ).toBe(201);
  await page
    .getByRole('button', { name: 'Ghi danh khóa học', exact: true })
    .click();
  await expect(page.locator('.enrollment-panel .field-error')).toContainText(
    'hết chỗ',
  );
  await expect(
    page.getByRole('button', { name: 'Khóa học đã hết chỗ' }),
  ).toBeDisabled();
});

test('admin CRUD, hide/show, delete confirmation, mobile table', async ({
  page,
}) => {
  await login(page, 'admin@pks.test');
  await expect(page).toHaveURL('/admin/courses');
  await page.getByRole('link', { name: 'Thêm khóa học', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo khóa học', exact: true }).click();
  await expect(
    page.getByText('Vui lòng điền thông tin.').first(),
  ).toBeVisible();
  const title = `Khóa giao diện ${runId}`;
  await page.getByLabel('Tên khóa học').fill(title);
  await page.getByLabel('Danh mục', { exact: true }).fill('Tin học');
  await page.getByLabel('Giảng viên', { exact: true }).fill('Giảng viên E2E');
  await page
    .getByLabel('Mô tả ngắn')
    .fill('Thực hành trên giao diện quản trị.');
  await page
    .getByLabel('Nội dung chi tiết')
    .fill('Nội dung chi tiết khóa học kiểm thử.');
  await page.getByLabel('Học phí (VND)').fill('250000');
  await page.getByLabel('Sĩ số tối đa').fill('12');
  await page.screenshot({
    path: `${evidence}/admin-course-form.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Tạo khóa học', exact: true }).click();
  await expect(page).toHaveURL('/admin/courses');
  await page
    .getByRole('textbox', { name: 'Tìm khóa học quản trị' })
    .fill(title);
  await page.getByRole('button', { name: 'Tìm', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: `Ẩn ${title}`, exact: true }).click();
  await expect(page.locator('tbody .badge')).toHaveText('Đã ẩn');
  await page
    .getByRole('button', { name: `Hiện ${title}`, exact: true })
    .click();
  await expect(page.locator('tbody .badge')).toHaveText('Đang hiển thị');
  await page.getByRole('link', { name: `Sửa ${title}`, exact: true }).click();
  await expect(page.getByLabel('Tên khóa học')).toHaveValue(title);
  await page.getByLabel('Học phí (VND)').fill('300000');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page).toHaveURL('/admin/courses');
  await page
    .getByRole('textbox', { name: 'Tìm khóa học quản trị' })
    .fill(title);
  await page.getByRole('button', { name: 'Tìm', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody')).toContainText('300.000');
  await page.screenshot({
    path: `${evidence}/admin-courses.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 360, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: `Xóa ${title}`, exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Giữ lại', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: `Xóa ${title}`, exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Xóa khóa học', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Chưa có khóa học phù hợp' }),
  ).toBeVisible();
});

test('staff can view students and cannot reduce capacity below enrollment count', async ({
  page,
  request,
}) => {
  const id = await createCourse(request, `Staff course ${runId}`, 2);
  for (const name of ['staff-a', 'staff-b']) {
    const email = await createStudent(request, name);
    await request.post('/api/auth/login', {
      headers: { Origin: origin },
      data: { email, password },
    });
    expect(
      (
        await request.post(`/api/courses/${id}/enrollments`, {
          headers: { Origin: origin },
        })
      ).status(),
    ).toBe(201);
  }
  await login(page, 'staff@pks.test');
  await page.goto(`/admin/courses/${id}/enrollments`);
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await expect(page.locator('tbody')).toContainText('Đã ghi danh');
  await page.screenshot({
    path: `${evidence}/admin-enrollments.png`,
    fullPage: true,
  });
  await page.goto(`/admin/courses/${id}/edit`);
  await page.getByLabel('Sĩ số tối đa').fill('1');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(
    page.getByText('Sĩ số không được thấp hơn 2 học viên đã ghi danh.'),
  ).toBeVisible();
});

test('loading, error retry, session expiry and not-found states', async ({
  page,
}) => {
  let release: (() => void) | undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/courses?*', async (route) => {
    await gate;
    await route.fulfill({
      status: 500,
      json: {
        error: {
          code: 'TEST_FAILURE',
          message: 'Lỗi kiểm thử tải danh sách.',
          details: [],
        },
      },
    });
  });
  await page.goto('/courses');
  await expect(
    page.getByRole('status').filter({ hasText: 'Đang tải dữ liệu' }),
  ).toBeVisible();
  release!();
  await expect(
    page.getByRole('heading', { name: 'Chưa thể tải nội dung' }),
  ).toBeVisible();
  await page.unroute('**/api/courses?*');
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.locator('.course-card').first()).toBeVisible();
  await login(page, 'student@pks.test');
  await page.route('**/api/me/enrollments?*', (route) =>
    route.fulfill({
      status: 401,
      json: {
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Vui lòng đăng nhập.',
          details: [],
        },
      },
    }),
  );
  await page
    .getByRole('link', { name: 'Khóa học của tôi', exact: true })
    .click();
  await expect(page).toHaveURL(/login/);
  await page.goto('/not-a-page');
  await expect(
    page.getByRole('heading', { name: 'Có vẻ bạn đã đi lạc' }),
  ).toBeVisible();
});

test('catalog pagination uses backend metadata and preserves filters across reload', async ({
  page,
  request,
}) => {
  await adminApi(request);
  const prefix = `Paging-${runId}`;
  for (let i = 1; i <= 13; i++) {
    const response = await request.post('/api/admin/courses', {
      headers: { Origin: origin },
      data: {
        title: `${prefix} ${String(i).padStart(2, '0')}`,
        category: prefix,
        instructor: 'PKS',
        shortDescription: 'Pagination fixture',
        description: 'Pagination fixture',
        tuitionVnd: 0,
        capacity: 10,
        isPublished: true,
      },
    });
    expect(response.status()).toBe(201);
  }
  await page.goto(`/courses?search=${prefix}`);
  await expect(page.locator('.course-card')).toHaveCount(12);
  await page.getByRole('button', { name: 'Sau', exact: true }).click();
  await expect(page.locator('.course-card')).toHaveCount(1);
  await expect(page).toHaveURL(/page=2/);
  await expect(
    page.getByRole('button', { name: 'Sau', exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(page.locator('.course-card')).toHaveCount(1);
  await expect(
    page.getByRole('textbox', { name: 'Tìm kiếm khóa học' }),
  ).toHaveValue(prefix);
  await page.getByRole('button', { name: 'Trước', exact: true }).click();
  await expect(page.locator('.course-card')).toHaveCount(12);
});

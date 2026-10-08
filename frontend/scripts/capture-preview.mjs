import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
mkdirSync('../docs/frontend-evidence', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
await page.goto('http://127.0.0.1:5173/courses');
await page
  .getByRole('heading', { name: 'Khám phá khóa học', exact: false })
  .waitFor();
await page.locator('.course-card').first().waitFor();
await page.evaluate(() => document.fonts.ready);
await page.screenshot({
  path: '../docs/frontend-evidence/catalog-desktop.png',
  fullPage: true,
});
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({
  path: '../docs/frontend-evidence/catalog-mobile.png',
  fullPage: true,
});
console.log(
  JSON.stringify({
    pageErrors: errors,
    horizontalOverflow: await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  }),
);
await browser.close();

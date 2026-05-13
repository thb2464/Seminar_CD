import { expect, test } from '@playwright/test';
import { mockGateway, seedAuthenticatedSession } from '../fixtures/gateway';

const tomorrowIso = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
};

test.beforeEach(async ({ page, baseURL }) => {
  await mockGateway(page, { appUrl: baseURL || 'http://127.0.0.1:5173' });
});

test('E2E-01 / BW-01 browses tours, filters by category, and opens detail', async ({ page }) => {
  await page.goto('/tours');

  await expect(page.getByRole('heading', { name: 'Tours' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Northern Discovery' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Southern River Escape' })).toBeVisible();

  await page.getByRole('button', { name: 'Northern Vietnam' }).click();
  await expect(page.getByRole('heading', { name: 'Northern Discovery' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Southern River Escape' })).toBeHidden();

  await page.getByRole('heading', { name: 'Northern Discovery' }).click();
  await expect(page).toHaveURL(/\/tours\/northern-discovery$/);
  await expect(page.getByRole('heading', { name: 'Northern Discovery' }).first()).toBeVisible();
  await expect(page.getByText('Old Quarter walking tour')).toBeVisible();
});

test('E2E-02 / BW-02 registers and keeps a persistent session', async ({ page }) => {
  await page.goto('/register');

  await page.getByPlaceholder('Enter your full name').fill('E2E Traveler');
  await page.getByPlaceholder('Choose a username').fill('e2e-traveler');
  await page.getByPlaceholder('Enter your email').fill('traveler@example.com');
  await page.getByPlaceholder('Enter your phone number').fill('0900000000');
  await page.getByPlaceholder('Enter password (min 6 characters)').fill('Password123!');
  await page.getByPlaceholder('Re-enter your password').fill('Password123!');
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page.getByText('E2E Traveler')).toBeVisible();
  await page.reload();
  await expect(page.getByText('E2E Traveler')).toBeVisible();
});

test('E2E-03 / BW-03 logs in, books a tour, and reaches VNPay success', async ({ page }) => {
  await page.goto('/login');

  await page.getByPlaceholder('Enter your email or username').fill('traveler@example.com');
  await page.getByPlaceholder('Enter your password').fill('Password123!');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByText('E2E Traveler')).toBeVisible();

  await page.goto('/tours/northern-discovery');
  await page.locator('.booking-field input[type="date"]').fill(tomorrowIso());
  await expect(page.getByText('12 spots left')).toBeVisible();
  await page.locator('.booking-field input[type="text"]').fill('E2E Traveler');
  await page.locator('.booking-field input[type="email"]').fill('traveler@example.com');
  await page.locator('.booking-field input[type="tel"]').fill('0900000000');
  await page.getByRole('button', { name: 'Pay with VNPay' }).click();

  await expect(page).toHaveURL(/\/payment-return\?status=success&bookingId=9001$/);
  await expect(page.getByRole('heading', { name: 'Payment Successful!' })).toBeVisible();
  await expect(page.getByText('#9001')).toBeVisible();
});

test('E2E-04 / BW-04 cancels a paid booking and shows refund state', async ({ page }) => {
  await seedAuthenticatedSession(page);
  page.on('dialog', (dialog) => dialog.accept());

  await page.goto('/profile');

  await expect(page.getByRole('heading', { name: 'My Profile' })).toBeVisible();
  await expect(page.getByText('Northern Discovery')).toBeVisible();
  await expect(page.getByText('Paid')).toBeVisible();

  await page.getByRole('button', { name: 'Cancel Booking' }).click();
  await expect(page.getByText('Cancelled')).toBeVisible();
  await expect(page.getByText('Refunded via VNPay')).toBeVisible();
});

test('E2E-05 / BW-05 asks the chatbot and receives grounded tour sources', async ({ page }) => {
  await page.goto('/tours');

  await page.getByRole('button', { name: 'Open chat' }).click();
  await expect(page.getByRole('heading', { name: 'Travel Assistant' })).toBeVisible();

  await page.getByPlaceholder('Type a message...').fill('Which northern mountain tour should I book?');
  await page.getByRole('button', { name: 'Send' }).click();

  await expect(page.getByText('grounded in the catalog')).toBeVisible();
  await expect(page.locator('.chatbot-source-link', { hasText: 'Northern Discovery' })).toBeVisible();
});

test('E2E-06 / BW-07 switches language and reloads localized content', async ({ page }) => {
  await page.goto('/tours');

  await expect(page.getByRole('link', { name: 'Home' }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Select language' }).first().click();
  await page.locator('.language-dropdown .language-option').nth(2).click();

  await expect(page.locator('body')).toHaveClass(/locale-zh/);
  await expect(page.getByRole('link', { name: 'Home ZH' }).first()).toBeVisible();
});

# E2E Test Authentication Setup Guide

This guide explains how to set up authentication for E2E tests in this project.

## Overview

All E2E tests that interact with protected routes (like `/receipts/new`) require user authentication. The test suite automatically logs in a test user before running each test.

## Quick Setup

### 1. Create Test User in Supabase

Before running E2E tests, you need to create a test user in your Supabase database:

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Users**
3. Click **Add user** → **Create new user**
4. Enter the following credentials (or your own):
   - Email: `test@test.com`
   - Password: `!Test123`
5. Confirm the user's email (if required in your project)
6. Note the user ID (UUID) from the user details page

### 2. Configure Test Environment Variables

The test credentials are stored in `.env.test` file:

```bash
# .env.test - Playwright E2E Configuration

# Test user credentials
E2E_USERNAME_ID=2a2d64c3-e8f0-469a-84fc-96c7d67efce0
E2E_USERNAME=test@test.com
E2E_PASSWORD=!Test123

# Supabase credentials (required for teardown to cleanup test data)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Note**: Update these values with your actual test user credentials from Supabase.

**Important**: `SUPABASE_SERVICE_ROLE_KEY` is required for the global teardown to delete test data after tests complete.

### 3. Run Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test receipt-form.spec.ts

# Run in UI mode (recommended for debugging)
npx playwright test --ui
```

## How Authentication Works

### Architecture

```
BEFORE ALL TESTS (Global Setup)
  ↓
  1. Create browser instance
  2. Navigate to /login
  3. Fill email & password
  4. Submit form
  5. Wait for redirect to /
  6. Save session to ./test-results/.auth/user.json
  ↓
ALL TESTS RUN
  ↓
  Each test automatically loads saved session
  Tests run with authenticated user
  ↓
AFTER ALL TESTS (Global Teardown)
  ↓
  1. Connect to Supabase with service role key
  2. Delete all receipts for test user
  3. Receipt items cascade deleted automatically
  4. Verify cleanup completed
```

### Key Files

- **[src/__tests__/e2e/global-setup.ts](src/__tests__/e2e/global-setup.ts)** - Global setup (login once)
- **[src/__tests__/e2e/global-teardown.ts](src/__tests__/e2e/global-teardown.ts)** - Global teardown (cleanup test data)
- **[src/__tests__/e2e/pages/LoginPage.ts](src/__tests__/e2e/pages/LoginPage.ts)** - Login page POM
- **[.env.test](.env.test)** - Test credentials (git-ignored)
- **[playwright.config.ts](playwright.config.ts)** - Playwright configuration with globalSetup and globalTeardown

### Usage in Tests

```typescript
import { test } from '@playwright/test';
import { setupAuthenticatedSession } from './helpers/auth.helper';

test.beforeEach(async ({ page }) => {
  // Authenticate before each test
  await setupAuthenticatedSession(page);

  // Now you can navigate to protected routes
  await page.goto('/receipts/new');
});
```

## Troubleshooting

### Test fails with "waiting for login-form to be visible"

**Cause**: The login page is not loading properly.

**Solutions**:
1. Ensure the dev server is running (`npm run dev`)
2. Check that the base URL in `playwright.config.ts` matches your dev server
3. Verify the LoginForm component has the correct test IDs

### Test fails with "Invalid credentials"

**Cause**: Test user doesn't exist or credentials are wrong.

**Solutions**:
1. Verify the test user exists in Supabase Authentication
2. Check that `.env.test` has the correct credentials
3. Ensure the user's email is confirmed (if required)

### Test times out at login

**Cause**: Login is not completing successfully.

**Solutions**:
1. Check browser console for errors (run with `--headed` flag)
2. Verify Supabase is configured correctly
3. Check middleware is not blocking the login endpoint
4. Increase timeout in `LoginPage.login()` if network is slow

### Authentication works but form not visible

**Cause**: User is logged in but lacks permissions or the form isn't loading.

**Solutions**:
1. Check middleware and route guards
2. Verify the test user has necessary permissions in database
3. Check RLS policies in Supabase

### Test data is not cleaned up when running via VSCode Playwright plugin

**Cause**: The VSCode Playwright plugin may not properly invoke `globalTeardown` in all scenarios.

**Why this happens**:
- VSCode plugin runs Playwright differently than CLI
- If VSCode is closed or plugin is stopped, cleanup may not execute
- Global teardown timeout may not be respected by the plugin

**Solution**:
The project now has **redundant cleanup mechanisms** to ensure data is always cleaned:

1. **Global Teardown** (`playwright.config.ts`) - Runs after all tests via Playwright (CLI and UI mode)
2. **Test-level Cleanup** (`receipt-form.spec.ts`) - Added `test.afterAll()` hook that runs cleanup even if global teardown doesn't

**What this means:**
- ✅ Tests will **always** clean up test data, regardless of how they're run
- ✅ Works with CLI (`npm run test:e2e`)
- ✅ Works with VSCode plugin
- ✅ Works with Playwright UI mode (`--ui`)
- ✅ Safe: cleanup runs twice but is idempotent (safe to run multiple times)

**If data still accumulates**:
1. Check `.env.test` has correct `SUPABASE_SERVICE_ROLE_KEY`
2. Verify `E2E_USERNAME_ID` matches your test user ID
3. Try running cleanup manually:
   ```bash
   # Connect to Supabase and run:
   DELETE FROM receipts WHERE user_id = 'your-test-user-id';
   ```

## Test Data Management

### Automatic Cleanup (Global Teardown)

After all tests complete, the global teardown automatically cleans up test data:

```typescript
// src/__tests__/e2e/global-teardown.ts
```

**What gets cleaned:**
- ✅ All receipts created by test user (`receipts` table)
- ✅ All receipt items (cascade deleted via `ON DELETE CASCADE`)

**What gets preserved:**
- ✅ Test user account (for reuse in next test run)
- ✅ Categories (shared data)

**How it works:**
1. Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS
2. Deletes all receipts where `user_id = E2E_USERNAME_ID`
3. Database cascades delete to related `receipt_items`
4. Verifies cleanup completed successfully

**Benefits:**
- 🧹 Clean slate for every test run
- 🚀 No manual cleanup needed
- 📊 Tests don't interfere with each other
- 💾 Prevents test data accumulation

### Using Different Test Users

You can create multiple test users for different scenarios:

```typescript
// Create admin test user in Supabase first, then use:
const adminCredentials = {
  email: 'admin@test.com',
  password: 'AdminPass123!'
};

// In your test
import { LoginPage } from './pages/LoginPage';

test('admin can access admin panel', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login(adminCredentials.email, adminCredentials.password);

  await page.goto('/admin');
  // ... test admin features
});
```

### Manual Cleanup (if needed)

The global teardown automatically runs after all tests, but if you need to clean up during development:

```bash
# The teardown will run automatically after: npx playwright test

# Or run cleanup manually by connecting to Supabase and running:
# DELETE FROM receipts WHERE user_id = 'your-test-user-id';
```

## CI/CD Integration

For CI/CD pipelines, set environment variables:

```yaml
# GitHub Actions example
- name: Run E2E tests
  env:
    E2E_USERNAME_ID: ${{ secrets.E2E_USERNAME_ID }}
    E2E_USERNAME: ${{ secrets.E2E_USERNAME }}
    E2E_PASSWORD: ${{ secrets.E2E_PASSWORD }}
  run: npm run test:e2e
```

## Security Best Practices

1. **Never commit `.env.test`** - It's git-ignored by default
2. **Use dedicated test database** - Don't run tests against production
3. **Rotate test credentials** - Change them periodically
4. **Limit test user permissions** - Only grant necessary access
5. **Use separate Supabase project** - For test environment

## Page Object Model Structure

```
src/__tests__/e2e/
├── helpers/
│   └── auth.helper.ts          # Authentication utilities
├── pages/
│   ├── BasePage.ts             # Base page class
│   ├── LoginPage.ts            # Login page POM
│   ├── ReceiptFormPage.ts      # Receipt form POM
│   └── ...
└── *.spec.ts                   # Test files
```

## Additional Resources

- [Playwright Authentication Guide](https://playwright.dev/docs/auth)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Page Object Model Best Practices](https://playwright.dev/docs/pom)

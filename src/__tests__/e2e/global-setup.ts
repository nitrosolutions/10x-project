import { chromium, FullConfig } from '@playwright/test';
import { getTestCredentials } from './helpers/auth.helper';

/**
 * Global setup for E2E tests
 * Authenticates once and saves the session state for all tests
 */
async function globalSetup(config: FullConfig) {
  console.log('\n=== Global Setup: Authenticating Test User ===\n');

  const { baseURL } = config.projects[0].use;
  const { email, password } = getTestCredentials();

  console.log(`Base URL: ${baseURL}`);
  console.log(`Test user: ${email}\n`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to login page
    console.log('1. Navigating to /login...');
    await page.goto(`${baseURL}/login`);

    // Wait for login form
    console.log('2. Waiting for login form...');
    await page.getByTestId('login-form').waitFor({ state: 'visible', timeout: 10000 });

    // Fill in credentials
    console.log('3. Filling credentials...');
    await page.getByTestId('login-email-input').fill(email);
    await page.getByTestId('login-password-input').fill(password);

    // Wait for form to be valid
    console.log('4. Waiting for form validation...');
    await page.waitForTimeout(1000);

    // Try to wait for button to be enabled
    const submitButton = page.getByTestId('login-submit-button');

    // Check if button is still disabled and log detailed info
    const isDisabled = await submitButton.isDisabled();
    if (isDisabled) {
      console.log('   ⚠️  Submit button is disabled');

      // Get form state for debugging
      const emailValue = await page.getByTestId('login-email-input').inputValue();
      const passwordValue = await page.getByTestId('login-password-input').inputValue();

      console.log(`   Email field value: "${emailValue}"`);
      console.log(`   Password field length: ${passwordValue.length} characters`);

      // Wait a bit more and check again
      console.log('   Waiting additional 2 seconds for validation...');
      await page.waitForTimeout(2000);

      const stillDisabled = await submitButton.isDisabled();
      if (stillDisabled) {
        console.error('   ❌ Button still disabled after waiting!');

        // Take screenshot for debugging
        await page.screenshot({ path: './test-results/login-form-disabled.png' });
        console.log('   Screenshot saved to: ./test-results/login-form-disabled.png');

        // Force click anyway (form might work even if validation is stuck)
        console.log('   Attempting to click disabled button...');
      } else {
        console.log('   ✅ Button is now enabled');
      }
    }

    // Submit the form
    console.log('5. Submitting login form...');
    await Promise.all([
      page.waitForURL((url) => url.pathname === '/', { timeout: 15000 }),
      submitButton.click({ force: true }), // Force click in case button is still disabled
    ]);

    console.log('6. Login successful! Current URL:', page.url());

    // Wait for network to settle
    await page.waitForLoadState('networkidle');

    // Save authentication state
    console.log('7. Saving authentication state...');
    await page.context().storageState({ path: './test-results/.auth/user.json' });

    console.log('✅ Global setup complete!\n');
    console.log('===========================================\n');
  } catch (error) {
    console.error('\n❌ Global setup failed:', error);

    // Take screenshot for debugging
    await page.screenshot({ path: './test-results/global-setup-error.png' });
    console.log('Screenshot saved to: ./test-results/global-setup-error.png\n');

    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;

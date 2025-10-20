import { Page } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

/**
 * Authentication helper for E2E tests
 * Provides utilities for logging in users during tests
 */

/**
 * Get test user credentials from environment variables
 */
export function getTestCredentials() {
  const email = process.env.E2E_USERNAME || "test@test.com";
  const password = process.env.E2E_PASSWORD || "!Test123";
  const userId = process.env.E2E_USERNAME_ID;

  return { email, password, userId };
}

/**
 * Authenticate using API (faster and more reliable than UI)
 *
 * @param page - Playwright Page object
 * @returns Promise that resolves when authentication is complete
 */
export async function authenticateUserViaAPI(page: Page): Promise<void> {
  const { email, password } = getTestCredentials();

  const response = await page.request.post("http://localhost:3000/api/auth/login", {
    data: {
      email,
      password,
    },
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok()) {
    const errorData = await response.json().catch(() => ({}));
    // eslint-disable-next-line no-console
    console.error(`[Auth Helper - API] Login failed:`, errorData);
    throw new Error(`Login failed: ${response.status()} - ${JSON.stringify(errorData)}`);
  }

  await response.json();

  // Navigate to home page to trigger middleware and set cookies properly
  await page.goto("/");
  await page.waitForLoadState("networkidle");
}

/**
 * Authenticate a user for testing using UI
 * This function logs in using the UI and waits for successful authentication
 *
 * @param page - Playwright Page object
 * @returns Promise that resolves when authentication is complete
 */
export async function authenticateUserViaUI(page: Page): Promise<void> {
  const { email, password } = getTestCredentials();
  const loginPage = new LoginPage(page);

  await loginPage.login(email, password);
}

/**
 * Setup authentication for tests that require a logged-in user
 * This can be used in beforeEach hooks
 * Uses API authentication by default for speed and reliability
 *
 * @param page - Playwright Page object
 * @param method - Authentication method: 'api' (default) or 'ui'
 */
export async function setupAuthenticatedSession(page: Page, method: "api" | "ui" = "ui"): Promise<void> {
  try {
    if (method === "api") {
      await authenticateUserViaAPI(page);
    } else {
      await authenticateUserViaUI(page);
    }

    // Verify cookies are set
    await page.context().cookies();

    // Wait a moment for all async processes to complete
    await page.waitForTimeout(1000);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`\n[Auth Helper] ERROR during authentication:`, error);
    throw error;
  }
}

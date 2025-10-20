import { BasePage } from "./BasePage";

/**
 * Page Object Model for the Login page
 * Handles user authentication interactions
 */
export class LoginPage extends BasePage {
  // Locators
  private get emailInput() {
    return this.page.getByTestId("login-email-input");
  }

  private get passwordInput() {
    return this.page.getByTestId("login-password-input");
  }

  private get submitButton() {
    return this.page.getByTestId("login-submit-button");
  }

  private get togglePasswordVisibility() {
    return this.page.getByTestId("login-toggle-password-visibility");
  }

  private get loginForm() {
    return this.page.getByTestId("login-form");
  }

  /**
   * Navigate to the login page
   */
  async goto() {
    await this.page.goto("/login");
    await this.waitForLoadState("domcontentloaded");
  }

  /**
   * Wait for the login form to be visible
   */
  async waitForLoginForm() {
    await this.loginForm.waitFor({ state: "visible" });
  }

  /**
   * Fill in the email field
   */
  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  /**
   * Fill in the password field
   */
  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  /**
   * Toggle password visibility
   */
  async togglePassword() {
    await this.togglePasswordVisibility.click();
  }

  /**
   * Click the submit button
   */
  async submit() {
    await this.submitButton.click();
  }

  /**
   * Complete login flow with provided credentials
   * @param email - User email
   * @param password - User password
   */
  async login(email: string, password: string) {
    console.log(`[LoginPage] Navigating to /login`);
    await this.goto();

    console.log(`[LoginPage] Waiting for login form`);
    await this.waitForLoginForm();

    console.log(`[LoginPage] Filling email: ${email}`);
    await this.fillEmail(email);

    console.log(`[LoginPage] Filling password`);
    await this.fillPassword(password);

    console.log(`[LoginPage] Waiting for form validation (submit button to be enabled)`);
    // Wait for React Hook Form to validate (it uses onChange mode)
    await this.submitButton.waitFor({ state: "attached" });

    // Give React Hook Form time to validate
    await this.page.waitForTimeout(500);

    // Wait for button to be enabled (form becomes valid)
    await this.submitButton.waitFor({ state: "visible" });
    const isDisabled = await this.submitButton.isDisabled();
    if (isDisabled) {
      console.log(`[LoginPage] Submit button still disabled, waiting for validation...`);
      // Wait up to 3 seconds for form to become valid
      await this.page
        .waitForFunction(
          () => {
            const button = document.querySelector('[data-testid="login-submit-button"]') as HTMLButtonElement;
            return button && !button.disabled;
          },
          { timeout: 3000 }
        )
        .catch(() => {
          console.error(`[LoginPage] Form validation timeout - button still disabled`);
        });
    }

    console.log(`[LoginPage] Submitting form`);

    // Wait for navigation to start before clicking submit
    const navigationPromise = this.page.waitForURL((url) => url.pathname === "/", { timeout: 15000 });
    await this.submit();

    console.log(`[LoginPage] Waiting for redirect to /`);
    await navigationPromise;

    console.log(`[LoginPage] Login successful, current URL: ${this.page.url()}`);

    // Wait for network to be idle to ensure all auth cookies are set
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitDisabled() {
    return await this.submitButton.isDisabled();
  }

  /**
   * Get the current password input type (to verify visibility toggle)
   */
  async getPasswordInputType() {
    return await this.passwordInput.getAttribute("type");
  }
}

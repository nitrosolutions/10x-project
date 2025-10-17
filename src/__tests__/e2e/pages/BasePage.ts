import { Page } from '@playwright/test';

/**
 * Base Page class for Page Object Model pattern
 * Provides common functionality for all page objects
 */
export class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string = '/') {
    await this.page.goto(path);
  }

  async getTitle() {
    return this.page.title();
  }

  async waitForLoadState(state: 'load' | 'domcontentloaded' | 'networkidle' = 'load') {
    await this.page.waitForLoadState(state);
  }

  async screenshot(name: string) {
    await this.page.screenshot({ path: `./test-results/screenshots/${name}.png` });
  }

  async fillInput(selector: string, text: string) {
    await this.page.fill(selector, text);
  }

  async click(selector: string) {
    await this.page.click(selector);
  }

  async getText(selector: string) {
    return this.page.textContent(selector);
  }

  async isVisible(selector: string) {
    return this.page.isVisible(selector);
  }

  async waitForSelector(selector: string) {
    await this.page.waitForSelector(selector);
  }
}

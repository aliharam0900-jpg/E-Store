import { test, expect } from "@playwright/test";
import * as fs from "fs";

test.describe("Homepage UI & Theme Injection", () => {
  test("Test 1 (Button Text): Verify button or link with exact visible text 'All Categories' exists and is visible", async ({
    page,
  }) => {
    // 1. Load the homepage
    await page.goto("/");

    // 2. Assert that a button or link with the exact visible text "All Categories" exists and is visible
    const allCategoriesButton = page
      .getByRole("link", { name: "All Categories", exact: true })
      .or(page.getByRole("button", { name: "All Categories", exact: true }))
      .first();

    await expect(allCategoriesButton).toBeVisible();
    await expect(allCategoriesButton).toHaveText("All Categories");
  });

  test("Test 2 (CSS Variable): Verify <html> or <body> element style attribute contains the --primary custom property", async ({
    page,
  }) => {
    // 1. Load the homepage
    await page.goto("/");

    // 2. Evaluate the <html> or <body> element to ensure the style attribute contains the --primary custom property
    const styleProperties = await page.evaluate(() => {
      const htmlStyle = document.documentElement.getAttribute("style") || "";
      const bodyStyle = document.body.getAttribute("style") || "";
      return { htmlStyle, bodyStyle };
    });

    const containsPrimaryVar =
      styleProperties.htmlStyle.includes("--primary") ||
      styleProperties.bodyStyle.includes("--primary");

    expect(containsPrimaryVar).toBe(true);
  });
});

test.describe("Customer Authentication", () => {
  test("Customer Auth: Navigate to /login, fill out dummy credentials, and assert the presence of validation errors or success redirects", async ({
    page,
  }) => {
    // 1. Navigate to /login
    await page.goto("/login");

    // 2. Verify login card and heading are visible
    await expect(
      page.getByRole("heading", { name: "Sign In to Your Account" })
    ).toBeVisible();

    // 3. Fill out dummy credentials
    await page.locator("#email").fill("dummy.customer.unknown@domain.test");
    await page.locator("#password").fill("InvalidSecretPass999!");

    // 4. Submit the login form
    await page.getByRole("button", { name: "Sign In", exact: true }).click();

    // 5. Assert the presence of validation errors (alert banner or toast notification)
    const alertBanner = page.locator('[role="alert"]');
    const toastNotification = page.locator("[data-sonner-toast]");

    await expect(alertBanner.or(toastNotification)).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Storefront Theme Toggle (Light/Dark Mode)", () => {
  test("Theme Toggle: Click the Dark Mode toggle in the Navbar and assert that the <html> or <body> tag receives the class='dark' attribute", async ({
    page,
  }) => {
    // 1. Navigate to the storefront
    await page.goto("/");

    // 2. Locate the theme toggle button in the navbar and wait for hydration
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible();
    await expect(themeToggle).toHaveAttribute("data-hydrated", "true", { timeout: 10000 });

    // 3. Inspect initial theme state
    const htmlElement = page.locator("html");
    const isInitiallyDark = await htmlElement.evaluate((el) =>
      el.classList.contains("dark")
    );

    // 4. Click the toggle to switch theme
    await themeToggle.click();

    if (!isInitiallyDark) {
      // Should now have the dark class
      await expect(htmlElement).toHaveClass(/dark/);
    } else {
      // If initially dark, clicking toggles to light, clicking again toggles back to dark
      await expect(htmlElement).not.toHaveClass(/dark/);
      await themeToggle.click();
      await expect(htmlElement).toHaveClass(/dark/);
    }
  });
});

test.describe("Newsletter Subscription System", () => {
  test("Newsletter: Fill out the footer newsletter form with a test email, submit, and assert the success Toast appears", async ({
    page,
  }) => {
    // 1. Navigate to the storefront
    await page.goto("/");

    // 2. Locate footer newsletter form
    const footerForm = page.locator('footer form[aria-label="Join our Newsletter"]');
    await expect(footerForm).toBeVisible();

    const emailInput = footerForm.locator('input[type="email"]');
    const submitButton = footerForm.locator('button[type="submit"]');

    // 3. Generate unique test email to avoid duplicate constraints across runs
    const testEmail = `newsletter.test.${Date.now()}.${Math.floor(Math.random() * 1000)}@atelier-luxury.test`;

    await emailInput.fill(testEmail);
    await submitButton.click();

    // 4. Assert that the success Toast appears
    const toast = page.locator("[data-sonner-toast]");
    await expect(toast).toBeVisible({ timeout: 12000 });
    await expect(toast).toContainText(/thank you|already subscribed|subscribed/i);
  });
});

test.describe("In-House Shopping Bot", () => {
  test("In-House Chatbot: Open widget, send 'hello', assert greeting, send 'shirt', and assert search response", async ({
    page,
  }) => {
    // 1. Navigate to the storefront
    await page.goto("/");

    // 2. Click the floating Chat Widget to open it
    const chatTrigger = page.locator('[data-testid="ai-chat-trigger"]');
    await expect(chatTrigger).toBeVisible();
    await chatTrigger.click();

    // 3. Assert that the chat window expanded
    const chatWindow = page.locator('[data-testid="ai-chat-window"]');
    await expect(chatWindow).toBeVisible();

    const chatInput = page.locator('[data-testid="ai-chat-input"]');
    const chatSubmit = page.locator('[data-testid="ai-chat-submit"]');

    // 4. Fill the chat input with the text "hello" and submit
    await chatInput.fill("hello");
    await chatSubmit.click();

    // 5. Assert that the chatbot replies with the hardcoded greeting
    await expect(
      chatWindow.getByText(/Concierge assistant/i)
    ).toBeVisible({ timeout: 10000 });

    // 6. Fill the chat input with a dummy product keyword (e.g., "shirt") and submit
    await chatInput.fill("shirt");
    await chatSubmit.click();

    // 7. Assert that the chatbot replies with a search result format or fallback message
    const resultOrFallback = chatWindow
      .getByText(/I found these items for you|couldn't find anything matching/i)
      .first();
    await expect(resultOrFallback).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Admin Newsletter CSV Export", () => {
  test("Admin CSV Export: Authenticate as admin, navigate to /sys-admin-portal/marketing, export CSV, and verify non-empty file", async ({
    page,
    context,
  }) => {
    // 1. Authenticate as an admin via session cookie and UI fallback
    await context.addCookies([
      {
        name: "monolith_dev_admin_session",
        value: "true",
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    // Also execute UI demo login to guarantee server session synchronization
    await page.goto("/login");
    const demoAdminBtn = page.getByRole("button", {
      name: "Instant Demo Admin Access",
    });
    if (await demoAdminBtn.isVisible()) {
      await demoAdminBtn.click();
      await page.waitForURL("**/sys-admin-portal**", { timeout: 15000 }).catch(() => null);
    }

    // 2. Navigate to /sys-admin-portal/marketing
    await page.goto("/sys-admin-portal/marketing");

    // Assert that the marketing header is visible
    await expect(
      page.getByRole("heading", { name: "Marketing & Newsletters" })
    ).toBeVisible();

    // 3. Locate the "Export to CSV" button
    const exportButton = page.locator('[data-testid="export-csv-btn"]').or(
      page.getByRole("button", { name: "Export to CSV" })
    );
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    // 4. Intercept the download event in Playwright and click export
    const downloadPromise = page.waitForEvent("download");
    await exportButton.click();
    const download = await downloadPromise;

    // 5. Assert that the downloaded filename ends in .csv
    const filename = download.suggestedFilename();
    expect(filename.toLowerCase().endsWith(".csv")).toBe(true);

    // 6. Assert that the downloaded file is not empty
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    if (downloadPath) {
      const stats = fs.statSync(downloadPath);
      expect(stats.size).toBeGreaterThan(0);
      const fileContent = fs.readFileSync(downloadPath, "utf-8");
      expect(fileContent).toContain("Email");
    }
  });
});

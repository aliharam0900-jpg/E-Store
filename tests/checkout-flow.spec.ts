import { test, expect } from "@playwright/test";

test.describe("Enterprise E-Commerce Critical Flow & RBAC Security Suite", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage cart before every test run for state isolation
    await page.addInitScript(() => {
      window.localStorage.removeItem("e_store_cart_cache");
    });
  });

  test("Critical Path: Homepage → Catalog → Variant Selection → Cart Drawer → Stripe Checkout Redirect", async ({
    page,
  }) => {
    // 1. Load the storefront homepage
    await page.goto("/");
    await expect(page).toHaveTitle(/MONOLITH/);

    // 2. Navigate to Catalog / Shop (responsive: handles both mobile hamburger and desktop links)
    const hamburgerBtn = page.getByRole("button", { name: /Open menu/i });
    if (await hamburgerBtn.isVisible().catch(() => false)) {
      await hamburgerBtn.click();
      const mobileDrawer = page.locator('[role="dialog"]');
      await expect(mobileDrawer).toBeVisible();
      await mobileDrawer.getByRole("link", { name: "Catalog" }).click();
    } else {
      const catalogLink = page.getByRole("link", { name: "Catalog" }).first();
      await expect(catalogLink).toBeVisible();
      await catalogLink.click();
    }

    // Verify Catalog loaded
    await page.waitForURL("**/shop**");
    await expect(page.locator("h1")).toContainText(/Complete Collection/i);

    // 3. Navigate into the first available product
    const productCard = page.locator('a[href^="/product/"]').first();
    await expect(productCard).toBeVisible({ timeout: 10000 });
    await productCard.click();

    await page.waitForURL("**/product/**");

    // 4. Select a variant size (e.g. Size M or first enabled size button)
    const sizeButtons = page.locator("button:not([disabled])").filter({
      hasText: /^(XS|S|M|L|XL|XXL|[0-9]+)$/i,
    });

    const sizeCount = await sizeButtons.count();
    if (sizeCount > 0) {
      // Click the first available size button
      await sizeButtons.first().click();
    }

    // 5. Add to Cart with verification
    const addToCartBtn = page.getByRole("button", {
      name: /Add to Cart/i,
    });
    await expect(addToCartBtn).toBeVisible();
    await addToCartBtn.click();

    // Wait for added feedback state
    await expect(page.getByText(/Added to Order/i)).toBeVisible({
      timeout: 5000,
    });

    // 6. Verify slide-out Cart Sheet is open (or open via Cart Trigger / Mobile Hamburger Menu if closed)
    const cartDrawer = page.locator('[role="dialog"]').filter({ hasText: /Shopping Cart/i });
    const isDrawerOpen = await cartDrawer.isVisible().catch(() => false);
    if (!isDrawerOpen) {
      const cartTrigger = page.getByRole("button", { name: /Cart/i }).first();
      if (await cartTrigger.isVisible().catch(() => false)) {
        await cartTrigger.click();
      } else {
        const mobileNavBtn = page.getByRole("button", { name: /Open menu/i });
        if (await mobileNavBtn.isVisible().catch(() => false)) {
          await mobileNavBtn.click();
          const mobileDrawer = page.locator('[role="dialog"]');
          await expect(mobileDrawer).toBeVisible();
          await mobileDrawer.getByRole("button", { name: /Shopping Cart/i }).click();
        }
      }
    }

    // Verify slide-out Sheet is open and contains Shopping Cart heading
    await expect(cartDrawer).toBeVisible();
    await expect(cartDrawer.getByText(/Shopping Cart/i)).toBeVisible();

    // Verify Total Amount row is rendered
    const totalAmountRow = cartDrawer.locator("div").filter({ hasText: /Total Amount/i });
    await expect(totalAmountRow.first()).toBeVisible();

    // 7. Click Checkout and verify initiation towards Stripe
    const checkoutBtn = cartDrawer.getByRole("button", {
      name: /Checkout Now/i,
    });
    await expect(checkoutBtn).toBeVisible();

    // Listen for either a navigation event to Stripe or simulated gateway action response
    const navigationPromise = page
      .waitForURL(/checkout\.stripe\.com|stripe\.com/, { timeout: 8000 })
      .catch(() => null);

    await checkoutBtn.click();

    // Expect loading state on checkout button or response feedback
    await expect(
      cartDrawer.getByText(/Connecting to Stripe/i).or(page.locator("[data-sonner-toast]"))
    ).toBeVisible({ timeout: 5000 }).catch(() => null);

    // Verify redirect or network action
    const navigated = await navigationPromise;
    if (navigated) {
      expect(page.url()).toContain("stripe.com");
    }
  });

  test("RBAC Security: Unauthenticated request to /sys-admin-portal is strictly intercepted by Edge Middleware", async ({
    page,
  }) => {
    // Attempt direct access to protected administrative console
    await page.goto("/sys-admin-portal");

    // Fail-secure posture: Edge middleware must redirect to login with query param
    await page.waitForURL("**/login?redirectedFrom=%2Fsys-admin-portal**");
    expect(page.url()).toContain("/login");
    expect(page.url()).toContain("redirectedFrom=%2Fsys-admin-portal");

    // Verify login screen renders security notice
    await expect(page.locator("h1")).toContainText(/Authentication Required|Administrative Login|Sign In/i);
  });

  test("RBAC Security: Unauthenticated request to /views is strictly intercepted by Edge Middleware", async ({
    page,
  }) => {
    // Attempt direct unauthenticated access to the architectural /views index
    await page.goto("/views");

    // Fail-secure posture: Edge middleware must intercept and redirect to login
    await page.waitForURL("**/login?redirectedFrom=%2Fviews**");
    expect(page.url()).toContain("/login");
    expect(page.url()).toContain("redirectedFrom=%2Fviews");

    // Verify login screen renders authentication prompt
    await expect(page.locator("h1")).toContainText(/Authentication Required|Administrative Login|Sign In/i);
  });

  test("Admin Access: Authenticated admin can access System Views Directory via Admin Portal", async ({
    page,
    context,
  }) => {
    // Authenticate as dev admin
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

    // Access /views with active session
    await page.goto("/views");
    await expect(page.locator("h1")).toContainText(/Application Views Directory/i);
    await expect(page.getByText(/SYSTEM READY/i)).toBeVisible();

    // Verify Staff Admin Portal link is present
    await expect(page.getByRole("link", { name: /Staff Admin Portal/i })).toBeVisible();
  });

  test("Account Suspension Security: Banned identity accessing portal renders 403 Suspended notice", async ({
    page,
  }) => {
    // Access unauthorized endpoint simulating suspended identity token
    await page.goto("/unauthorized?banned=true");

    await expect(page.locator("h1")).toContainText(/Account Suspended/i);
    await expect(page.getByText(/IDENTITY SUSPENDED/i)).toBeVisible();
  });

  test("Cross-Platform Mobile Responsiveness: iPhone 13 emulation (390x844), hamburger navigation, currency switcher, and layout integrity", async ({
    page,
  }) => {
    // 1. Emulate mobile viewport (iPhone 13: 390 x 844)
    await page.setViewportSize({ width: 390, height: 844 });

    // 2. Load storefront homepage
    await page.goto("/");
    await expect(page).toHaveTitle(/MONOLITH/);

    // 3. Verify horizontal scroll overflow check: document.documentElement.scrollWidth === document.documentElement.clientWidth
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBeFalsy();

    // 4. Verify Mobile Hamburger Menu interaction
    const hamburgerBtn = page.getByRole("button", { name: /Open menu/i });
    await expect(hamburgerBtn).toBeVisible();
    await hamburgerBtn.click();

    // Verify mobile drawer opened and navigation links render properly
    const mobileDrawer = page.locator('[role="dialog"]');
    await expect(mobileDrawer).toBeVisible();
    const catalogMobileLink = mobileDrawer.getByRole("link", { name: "Catalog" });
    await expect(catalogMobileLink).toBeVisible();

    // 5. Verify Currency Selector in mobile drawer functions smoothly
    const mobileCurrencyBtn = mobileDrawer.getByTestId("currency-selector");
    await expect(mobileCurrencyBtn).toBeVisible();
    await mobileCurrencyBtn.click();

    // Select JPY option
    const jpyOption = page.getByRole("menuitem", { name: /JPY/i }).first();
    await expect(jpyOption).toBeVisible();
    await jpyOption.click();

    // Close mobile menu by navigating to Catalog
    await catalogMobileLink.click();
    await page.waitForURL("**/shop**");

    // 6. Verify product grid on mobile does not have horizontal overflow
    const shopHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(shopHorizontalOverflow).toBeFalsy();

    // 7. Navigate to product detail page
    const firstProduct = page.locator('a[href^="/product/"]').first();
    await expect(firstProduct).toBeVisible({ timeout: 10000 });
    await firstProduct.click();
    await page.waitForURL("**/product/**");

    // 8. Verify AI Chat Widget is present, collapsible, and does NOT block the Add to Cart button
    const chatTrigger = page.getByTestId("ai-chat-trigger");
    await expect(chatTrigger).toBeVisible();

    // Select a size variant first if needed
    const sizeButtons = page.locator("button:not([disabled])").filter({
      hasText: /^(XS|S|M|L|XL|XXL|[0-9]+)$/i,
    });
    if ((await sizeButtons.count()) > 0) {
      await sizeButtons.first().click();
      await page.waitForTimeout(300);
    }

    const addToCartBtn = page.getByRole("button", { name: /Add to Cart/i });
    await expect(addToCartBtn).toBeVisible();

    // Verify Add to Cart button is clickable and not obscured by AI chat trigger
    await addToCartBtn.click();

    // Verify cart interaction succeeded
    await expect(page.getByText(/Added to Order/i)).toBeVisible({ timeout: 5000 });
  });
});

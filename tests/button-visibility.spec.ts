import { test, expect } from "@playwright/test";

test.describe("Button Title & Visibility Verification", () => {
  test("Homepage primary buttons have visible text and non-transparent background", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // 1. Explore Collection button
    const exploreBtn = page.getByRole("link", { name: "Explore Collection" });
    await expect(exploreBtn).toBeVisible();
    await expect(exploreBtn).toHaveText(/Explore Collection/);

    const exploreStyles = await exploreBtn.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { color: s.color, bg: s.backgroundColor };
    });
    expect(exploreStyles.bg).not.toBe("rgba(0, 0, 0, 0)");
    expect(exploreStyles.bg).not.toBe("transparent");

    // 2. All Categories button
    const allCatBtn = page.getByRole("link", { name: "All Categories" });
    await expect(allCatBtn).toBeVisible();
    await expect(allCatBtn).toHaveText("All Categories");

    // 3. Newsletter Join button
    const joinBtn = page.getByRole("button", { name: "Join" });
    await expect(joinBtn).toBeVisible();
    await expect(joinBtn).toHaveText("Join");
    const joinStyles = await joinBtn.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { color: s.color, bg: s.backgroundColor };
    });
    expect(joinStyles.bg).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("Product detail page ADD TO CART button is visible with proper title text and background", async ({
    page,
  }) => {
    await page.goto("/shop");
    await page.waitForLoadState("domcontentloaded");
    const productCard = page.locator('a[href^="/product/"]').first();
    await expect(productCard).toBeVisible({ timeout: 10000 });
    await productCard.click();
    await page.waitForURL("**/product/**");

    const addToCartBtn = page.getByRole("button", { name: /ADD TO CART/i });
    await expect(addToCartBtn).toBeVisible();
    const btnStyles = await addToCartBtn.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { color: s.color, bg: s.backgroundColor, text: el.textContent?.trim() };
    });
    expect(btnStyles.text?.toLowerCase()).toContain("add to cart");
    expect(btnStyles.bg).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("Login page submit button has visible title text and non-transparent background", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    const signInBtn = page.getByRole("button", { name: /Sign In/i }).first();
    await expect(signInBtn).toBeVisible();
    await expect(signInBtn).toHaveText(/Sign In/i);

    const signInStyles = await signInBtn.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { color: s.color, bg: s.backgroundColor };
    });
    expect(signInStyles.bg).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("Icon-only buttons have descriptive titles or accessible labels", async ({
    page,
  }) => {
    await page.goto("/");
    // Navbar search link
    const searchLink = page.locator("a[title='Search Catalog']");
    await expect(searchLink).toBeVisible();

    // Cart trigger
    const cartBtn = page.locator("button[title='Shopping Cart']");
    await expect(cartBtn).toBeVisible();
  });
});

import { test, expect } from "@playwright/test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const backendRequire = createRequire(resolve("../codevera-nest/package.json"));
const { Pool } = backendRequire("pg");
const { parse } = backendRequire("dotenv");
const environment = parse(readFileSync(resolve("../codevera-nest/.env")));

for (const locale of ["en", "fa"]) {
  test(`${locale}: slow server content streams an accessible skeleton before real data`, async ({
    page,
  }) => {
    const url =
      process.env.BROWSER_TEST_DATABASE_URL ||
      environment.BROWSER_TEST_DATABASE_URL;
    if (!url || !new URL(url).pathname.endsWith("_test"))
      throw new Error("A dedicated browser test database is required");
    const pool = new Pool({ connectionString: url });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "SET LOCAL idle_in_transaction_session_timeout = '20s'",
      );
      await client.query(
        "LOCK TABLE projects, company IN ACCESS EXCLUSIVE MODE",
      );
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(locale === "fa" ? "/portfolio" : "/en/portfolio", {
        waitUntil: "commit",
      });
      const loading = page.getByTestId("page-loading");
      await expect(loading).toBeVisible();
      await expect(loading).toHaveAttribute("aria-busy", "true");
      await expect(loading).toHaveAttribute(
        "aria-label",
        locale === "fa" ? "در حال دریافت محتوا" : "Loading content",
      );
      await expect(page.locator(".site-header")).toBeVisible();
      await expect(page.getByTestId("footer-loading")).toBeVisible();
      expect(
        await loading
          .locator(".skeleton")
          .first()
          .evaluate((el) => getComputedStyle(el, "::after").animationName),
      ).toBe("none");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await client.query("COMMIT");
      await expect(loading).toHaveCount(0);
      await expect(page.locator(".project-grid")).toBeVisible();
      await expect(page.locator(".site-footer")).toBeVisible();
    } finally {
      await client.query("ROLLBACK").catch(() => {});
      client.release();
      await pool.end();
    }
  });
}

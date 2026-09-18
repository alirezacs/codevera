import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const routes = [
  "/",
  "/about",
  "/contact",
  "/portfolio",
  "/portfolio/forma",
  "/portfolio/aurelia",
  "/portfolio/meridian",
];
test("Persian pages have localized SEO, Vazir, RTL, working links, and responsive accessible layouts", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const links = new Set<string>();
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of routes) {
      expect((await page.goto(path))?.status()).toBe(200);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator("html")).toHaveAttribute("lang", "fa");
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      expect(
        await page
          .locator("h1")
          .evaluate((element) => getComputedStyle(element).fontFamily),
      ).toMatch(/vazir/i);
      expect(
        await page.evaluate(() =>
          [...document.fonts].some(
            (font) => /vazir/i.test(font.family) && font.status === "loaded",
          ),
        ),
      ).toBe(true);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${path} at ${width}`,
      ).toBe(true);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `http://localhost:3000${path === "/" ? "" : path}`,
      );
      await expect(
        page.locator('link[rel="alternate"][hreflang="en"]'),
      ).toHaveAttribute(
        "href",
        `http://localhost:3000/en${path === "/" ? "" : path}`,
      );
      if (width === 390 || width === 1440) {
        const scan = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        expect(
          scan.violations.map((item) => ({
            id: item.id,
            targets: item.nodes.map((node) => node.target),
          })),
          path,
        ).toEqual([]);
      }
      for (const href of await page
        .locator('a[href^="/"]:not(.language-switch)')
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute("href")!),
        )) {
        expect(href).toMatch(/^\/(?!en(?:\/|$))/);
        links.add(href);
      }
    }
  }
  for (const href of links)
    expect((await request.get(href)).status(), href).toBe(200);
  expect(errors).toEqual([]);
  await page.goto("/portfolio/missing-project");
  await expect(page.getByRole("heading", { name: /پیدا نشد/ })).toBeVisible();
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/portfolio/forma");
  expect(sitemap).toContain('hreflang="fa"');
});
test("language switch preserves the page, search parameters, and anchor in both directions", async ({
  page,
}) => {
  await page.goto("/en/about?ref=language#founders");
  await page.getByRole("link", { name: "تغییر زبان به فارسی" }).click();
  await expect(page).toHaveURL(/\/about\?ref=language#founders$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("#founders")).toContainText("بنیان‌گذاران");
  await page.getByRole("link", { name: "Switch to English" }).click();
  await expect(page).toHaveURL(/\/en\/about\?ref=language#founders$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("#founders")).toContainText("The founders");
  await page.goto("/portfolio/forma");
  await page.getByRole("link", { name: "Switch to English" }).click();
  await expect(page).toHaveURL(/\/en\/portfolio\/forma$/);
});
test("Persian mobile navigation and same-language links work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "باز کردن منو" }).click();
  await page
    .getByRole("navigation", { name: "منوی موبایل" })
    .getByRole("link", { name: "درباره ما" })
    .click();
  await expect(page).toHaveURL(/\/about$/);
  await page.getByRole("button", { name: "باز کردن منو" }).click();
  await page
    .getByRole("navigation", { name: "منوی موبایل" })
    .getByRole("link", { name: "خانه" })
    .focus();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "باز کردن منو" }),
  ).toBeFocused();
});
test("Persian booking accepts Persian digits and stores the same UTC slot used by English", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#consultation");
  await page.getByRole("button", { name: "انتخاب زمان", exact: true }).click();
  await expect(page.locator("#consultation").getByRole("alert")).toContainText(
    "نام و نام خانوادگی",
  );
  await page.getByLabel("نام شما", { exact: false }).fill("آزمایش فارسی");
  await page
    .getByLabel("شماره تلفن", { exact: false })
    .fill("+۹۸ ۹۱۲ ۳۴۵ ۶۷۸۹");
  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/api/availability"),
  );
  await page.getByRole("button", { name: "انتخاب زمان", exact: true }).click();
  const data = await (await responsePromise).json();
  const day = data.dates.find((item: { slots: string[] }) => item.slots.length);
  const dateLabel = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${day.date}T12:00:00Z`));
  const dateButton = page
    .getByRole("group", { name: "تاریخ‌های آزاد مشاوره" })
    .getByRole("button", { name: dateLabel, exact: true });
  await expect(dateButton).toHaveAttribute("aria-pressed", "true");
  const scan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(scan.violations).toEqual([]);
  await page
    .getByRole("group", { name: "زمان‌های آزاد", exact: true })
    .getByRole("button")
    .first()
    .click();
  await page.getByRole("button", { name: "بررسی رزرو" }).click();
  await expect(page.locator(".booking-review")).toContainText(dateLabel);
  const created = page.waitForResponse((response) =>
    response.url().endsWith("/api/bookings"),
  );
  await page.getByRole("button", { name: "تأیید مشاوره" }).click();
  const booking = await (await created).json();
  expect(booking.booking.date).toBe(day.date);
  expect(booking.booking.startTime).toBe(day.slots[0]);
  await expect(page.getByText("زمان مشاوره شما رزرو شد.")).toBeVisible();
  const duplicate = await request.post("/api/bookings", {
    data: {
      name: "English Visitor",
      phone: "+15551234567",
      date: day.date,
      startTime: day.slots[0],
    },
  });
  expect(duplicate.status()).toBe(409);
  await page
    .locator(".booking-panel")
    .screenshot({ path: "artifacts/persian-booking-confirmed.png" });
});
test("Persian contact submission and server conflict errors are translated", async ({
  page,
}) => {
  await page.goto("/contact");
  await page.getByLabel("نام شما", { exact: true }).fill("آزمایش پیام");
  await page.getByLabel("ایمیل یا شماره تلفن").fill("test@example.com");
  await page
    .getByLabel("چه چیزی در ذهن دارید؟")
    .fill("برای طراحی یک وب‌سایت جدید به مشاوره نیاز داریم.");
  await page.getByRole("button", { name: "ذخیره پیام" }).click();
  await expect(page.getByRole("status")).toContainText(
    "پیام شما در این وب‌سایت ذخیره شد",
  );
  await page.goto("/#consultation");
  await page.getByLabel("نام شما", { exact: false }).fill("آزمایش خطا");
  await page.getByLabel("شماره تلفن", { exact: false }).fill("+989123456789");
  await page.getByRole("button", { name: "انتخاب زمان", exact: true }).click();
  await page
    .getByRole("group", { name: "زمان‌های آزاد", exact: true })
    .getByRole("button")
    .first()
    .click();
  await page.getByRole("button", { name: "بررسی رزرو" }).click();
  await page.route("**/api/bookings", (route) =>
    route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({
        error: "That time is no longer available. Please choose another slot.",
      }),
    }),
  );
  await page.getByRole("button", { name: "تأیید مشاوره" }).click();
  await expect(page.locator("#consultation").getByRole("alert")).toContainText(
    "این زمان دیگر آزاد نیست",
  );
});

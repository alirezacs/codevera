import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";
const routes = [
  "/en",
  "/en/portfolio",
  "/en/portfolio/forma",
  "/en/portfolio/aurelia",
  "/en/portfolio/meridian",
  "/en/about",
  "/en/contact",
];
test("all pages, internal links, responsive layout, and accessibility", async ({
  page,
  request,
}) => {
  const links = new Set<string>();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `Overflow at ${route} (${width})`,
      ).toBe(true);
      if (width === 1440 || width === 390) {
        const scan = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        expect(
          scan.violations.map((item) => ({
            id: item.id,
            elements: item.nodes.map((node) => node.target),
          })),
          `${route} ${width}`,
        ).toEqual([]);
      }
      for (const href of await page
        .locator('a[href^="/"]')
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute("href")!),
        ))
        links.add(href);
      if (route === "/en" && [1440, 390].includes(width)) {
        mkdirSync("artifacts", { recursive: true });
        await page.screenshot({
          path: `artifacts/home-${width}.png`,
          fullPage: true,
        });
      }
    }
  }
  for (const href of links) {
    const [route, hash] = href.split("#");
    expect((await request.get(route || "/")).status(), href).toBe(200);
    if (hash) {
      await page.goto(route || "/");
      await expect(page.locator(`[id="${hash}"]`)).toHaveCount(1);
    }
  }
  expect(errors).toEqual([]);
  await page.goto("/en/portfolio/does-not-exist");
  await expect(
    page.getByRole("heading", { name: /off the drawing board/ }),
  ).toBeVisible();
});
test("mobile menu is keyboard accessible and closes after navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "About Us" })
    .click();
  await expect(page).toHaveURL(/about/);
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeVisible();
});
test("booking completes and remains unavailable across reloads", async ({
  page,
  request,
}) => {
  await page.goto("/en#consultation");
  await page
    .getByLabel("Your name", { exact: false })
    .fill("Browser Test Visitor");
  await page
    .getByLabel("Phone number", { exact: false })
    .fill("+44 20 7946 0958");
  await page.getByRole("button", { name: "Choose a time" }).click();
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  const firstTime = page
    .getByRole("group", { name: "Available times", exact: true })
    .getByRole("button")
    .first();
  await firstTime.click();
  await page.getByRole("button", { name: "Review booking" }).click();
  await expect(
    page.getByRole("heading", { name: "A quick look before we book." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirm consultation" }).click();
  await expect(
    page.getByRole("heading", { name: "A good beginning, Browser." }),
  ).toBeVisible();
  const availability = await (await request.get("/api/availability")).json();
  const day = availability.dates.find(
    (item: { slots: string[] }) => item.slots.length,
  );
  const payload = {
    name: "API Test Visitor",
    phone: "+15551234567",
    date: day.date,
    startTime: day.slots[0],
  };
  const results = await Promise.all([
    request.post("/api/bookings", { data: payload }),
    request.post("/api/bookings", { data: payload }),
  ]);
  expect(results.map((result) => result.status()).sort()).toEqual([201, 409]);
  const refreshed = await (await request.get("/api/availability")).json();
  expect(
    refreshed.dates.find((item: { date: string }) => item.date === payload.date)
      .slots,
  ).not.toContain(payload.startTime);
  expect(
    (
      await request.post("/api/bookings", {
        data: { ...payload, startTime: "03:00" },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await request.post("/api/bookings", {
        data: { ...payload, phone: "bad" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/bookings", {
        data: "{bad",
        headers: { "Content-Type": "application/json" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/bookings", {
        data: payload,
        headers: { Origin: "https://unrelated.example" },
      })
    ).status(),
  ).toBe(400);
});
test("contact message is persisted with an honest confirmation", async ({
  page,
  request,
}) => {
  await page.goto("/en/contact");
  await page.getByLabel("Your name").fill("Contact Test Visitor");
  await page.getByLabel("Email or phone number").fill("test@example.com");
  await page
    .getByLabel("What are you thinking?")
    .fill("We are planning a new company website.");
  await page.getByRole("button", { name: "Save your message" }).click();
  await expect(
    page.getByRole("heading", { name: "Thank you for the introduction." }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText(
    "Email delivery is not connected yet",
  );
  expect(
    (
      await request.post("/api/contact", {
        data: { name: "Alex", contact: "bad", message: "Hello world" },
      })
    ).status(),
  ).toBe(400);
});

test("a slot taken during review refreshes choices and allows recovery", async ({
  page,
  request,
}) => {
  const available = await (await request.get("/api/availability")).json();
  const day = available.dates.find(
    (item: { slots: string[] }) => item.slots.length,
  );
  await page.goto("/en#consultation");
  await page
    .getByLabel("Your name", { exact: false })
    .fill("Stale Slot Visitor");
  await page.getByLabel("Phone number", { exact: false }).fill("+15551234567");
  await page.getByRole("button", { name: "Choose a time" }).click();
  await page
    .getByRole("group", { name: "Available times", exact: true })
    .getByRole("button", { name: day.slots[0], exact: true })
    .click();
  await page.getByRole("button", { name: "Review booking" }).click();
  const response = await request.post("/api/bookings", {
    data: {
      name: "Other Visitor",
      phone: "+15557654321",
      date: day.date,
      startTime: day.slots[0],
    },
  });
  expect(response.status()).toBe(201);
  await page.getByRole("button", { name: "Confirm consultation" }).click();
  await expect(page.locator("#consultation").getByRole("alert")).toContainText(
    "no longer available",
  );
  await expect(
    page.getByRole("button", { name: "Review booking" }),
  ).toBeDisabled();
  if (day.slots.length > 1) {
    await expect(
      page
        .getByRole("group", { name: "Available times", exact: true })
        .getByRole("button", { name: day.slots[0], exact: true }),
    ).toHaveCount(0);
  } else {
    const dateLabel = new Intl.DateTimeFormat("en", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${day.date}T12:00:00Z`));
    await expect(
      page.getByRole("button", { name: dateLabel, exact: true }),
    ).toBeDisabled();
  }
  await page
    .getByRole("group", { name: "Available times", exact: true })
    .getByRole("button")
    .first()
    .click();
  await page.getByRole("button", { name: "Review booking" }).click();
  await page.getByRole("button", { name: "Confirm consultation" }).click();
  await expect(
    page.getByRole("heading", { name: "A good beginning, Stale." }),
  ).toBeVisible();
});
test("availability failure can be retried without losing contact details", async ({
  page,
}) => {
  let fail = true;
  await page.route("**/api/availability", (route) =>
    fail
      ? route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Availability couldn’t be loaded. Please try again.",
          }),
        })
      : route.continue(),
  );
  await page.goto("/en#consultation");
  await page.getByLabel("Your name", { exact: false }).fill("Retry Visitor");
  await page.getByLabel("Phone number", { exact: false }).fill("+15551234567");
  await page.getByRole("button", { name: "Choose a time" }).click();
  await expect(page.locator("#consultation").getByRole("alert")).toContainText(
    "couldn’t be loaded",
  );
  fail = false;
  await page.getByRole("button", { name: "Retry availability" }).click();
  await expect(
    page.getByRole("group", { name: "Available times", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByLabel("Your name", { exact: false })).toHaveValue(
    "Retry Visitor",
  );
});

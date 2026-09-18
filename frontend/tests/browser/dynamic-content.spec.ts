import { test, expect } from "@playwright/test";
test("admin content changes appear immediately in English and Persian without rebuilding", async ({
  page,
  request,
}) => {
  const api = "http://127.0.0.1:4100/api/v1";
  const login = await request.post(api + "/auth/login", {
    data: {
      email: "browser-owner@example.test",
      password: process.env.CODEVERA_TEST_ADMIN_PASSWORD,
    },
  });
  expect(login.status()).toBe(200);
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };
  const tool = await request.post(api + "/admin/content/tools", {
    headers,
    data: {
      slug: "dynamic-tool",
      name: { en: "Live Database Tool", fa: "ابزار زنده پایگاه داده" },
      published: true,
    },
  });
  expect(tool.status()).toBe(201);
  const { id: toolId } = await tool.json();
  const original = await (await request.get(api + "/company")).json();
  let projectId = "";
  try {
    await page.goto("/en/about");
    await expect(page.locator(".tech-strip")).toContainText(
      "Live Database Tool",
    );
    await page.goto("/about");
    await expect(page.locator(".tech-strip")).toContainText(
      "ابزار زنده پایگاه داده",
    );
    const company = await request.put(api + "/admin/company", {
      headers,
      data: {
        ...original,
        contactConfigured: true,
        emails: ["live@example.test"],
        phones: ["+989123456789"],
        addresses: [
          {
            label: { en: "Office", fa: "دفتر" },
            address: {
              en: "Live database address",
              fa: "نشانی زنده پایگاه داده",
            },
          },
        ],
      },
    });
    expect(company.status()).toBe(200);
    await page.goto("/en/contact");
    await expect(
      page.getByRole("link", { name: "live@example.test" }),
    ).toHaveAttribute("href", "mailto:live@example.test");
    await page.goto("/contact");
    await expect(page.getByText("نشانی زنده پایگاه داده")).toBeVisible();
    const existing = await (
      await request.get(api + "/admin/content/projects", { headers })
    ).json();
    const source = existing.items[0];
    const { id, createdAt, updatedAt, ...input } = source;
    void id;
    void createdAt;
    void updatedAt;
    const created = await request.post(api + "/admin/content/projects", {
      headers,
      data: {
        ...input,
        slug: "live-project",
        published: true,
        translations: {
          ...input.translations,
          en: { ...input.translations.en, title: "Published from PostgreSQL" },
          fa: { ...input.translations.fa, title: "منتشرشده از پایگاه داده" },
        },
      },
    });
    expect(created.status()).toBe(201);
    projectId = (await created.json()).id;
    await page.goto("/en/portfolio/live-project");
    await expect(page.locator("h1")).toContainText("Published from PostgreSQL");
    await page.goto("/portfolio/live-project");
    await expect(page.locator("h1")).toContainText("منتشرشده از پایگاه داده");
  } finally {
    await request.delete(api + "/admin/content/tools/" + toolId, { headers });
    if (projectId)
      await request.delete(api + "/admin/content/projects/" + projectId, {
        headers,
      });
    await request.put(api + "/admin/company", { headers, data: original });
  }
});

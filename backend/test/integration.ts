import "dotenv/config";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createApp } from "../src/bootstrap";
import { createPool } from "../src/database/database";
import { hashPassword } from "../src/auth/password";
import { resetTestDatabase } from "./database";
import { scheduledSlots } from "../src/bookings/bookings.service";
import { Settings } from "../src/bookings/schemas";
async function main() {
  const url = await resetTestDatabase();
  process.env.DATABASE_URL = url;
  process.env.NODE_ENV = "test";
  process.env.DOCS_ENABLED = "true";
  const pool = createPool(url);
  const password = randomBytes(24).toString("base64url");
  const owner = (
    await pool.query<{ id: string }>(
      "INSERT INTO users(email,name,password_hash,role) VALUES($1,$2,$3,'OWNER') RETURNING id",
      ["owner@example.test", "Test Owner", await hashPassword(password)],
    )
  ).rows[0];
  const app = await createApp();
  await app.listen(0, "127.0.0.1");
  const base = (await app.getUrl()) + "/api/v1";
  let token = "";
  let passed = 0;
  async function request<T = Record<string, unknown>>(
    path: string,
    method = "GET",
    body?: unknown,
    auth = token,
  ) {
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: response.status,
      body: (response.status === 204 ? {} : await response.json()) as T,
    };
  }
  async function check(name: string, fn: () => Promise<void> | void) {
    await fn();
    passed++;
    console.log("PASS " + name);
  }
  try {
    await check(
      "private routes require authentication; public content is bilingual",
      async () => {
        assert.equal((await request("/admin/users")).status, 401);
        const en = await request<{ items: { title: string }[]; total: number }>(
          "/projects",
        );
        const fa = await request<{ items: { title: string }[] }>(
          "/projects?locale=fa",
        );
        assert.equal(en.body.total, 3);
        assert.notEqual(en.body.items[0].title, fa.body.items[0].title);
        assert.equal((await request("/projects?limit=1000")).status, 400);
      },
    );
    await check(
      "owner login uses a revocable session and never returns password hashes",
      async () => {
        const result = await request<{
          accessToken: string;
          user: { id: string };
        }>("/auth/login", "POST", { email: "owner@example.test", password });
        assert.equal(result.status, 200);
        token = result.body.accessToken;
        assert.equal(result.body.user.id, owner.id);
        assert.ok(!JSON.stringify(result.body).includes("password_hash"));
        assert.equal((await request("/auth/me")).status, 200);
      },
    );
    let projectId = "";
    const seed = JSON.parse(readFileSync("seed/content.json", "utf8")) as {
      projects: Record<string, unknown>[];
      settings: Settings;
    };
    const draft = {
      ...seed.projects[0],
      slug: "integration-project",
      published: false,
    };
    await check(
      "project CRUD, drafts, publishing and duplicate slug checks",
      async () => {
        const created = await request<{ id: string }>(
          "/admin/content/projects",
          "POST",
          draft,
        );
        assert.equal(created.status, 201);
        projectId = created.body.id;
        assert.equal(
          (await request("/projects/integration-project")).status,
          404,
        );
        assert.equal(
          (await request("/admin/content/projects/" + projectId)).status,
          200,
        );
        assert.equal(
          (await request("/admin/content/projects", "POST", draft)).status,
          409,
        );
        assert.equal(
          (
            await request("/admin/content/projects/" + projectId, "PUT", {
              ...draft,
              published: true,
            })
          ).status,
          200,
        );
        assert.equal(
          (await request("/projects/integration-project")).status,
          200,
        );
        assert.equal(
          (
            await request("/admin/content/projects", "POST", {
              ...draft,
              slug: "invalid",
              unexpected: true,
            })
          ).status,
          400,
        );
        assert.equal(
          (await request("/admin/content/projects/" + projectId, "DELETE"))
            .status,
          204,
        );
        assert.equal(
          (await request("/projects/integration-project")).status,
          404,
        );
      },
    );
    await check(
      "tools and founders persist with publish controls",
      async () => {
        const tool = await request<{ id: string }>(
          "/admin/content/tools",
          "POST",
          {
            slug: "postgres",
            name: { en: "PostgreSQL", fa: "پستگرس" },
            published: true,
          },
        );
        assert.equal(tool.status, 201);
        const founder = await request<{ id: string }>(
          "/admin/content/founders",
          "POST",
          {
            slug: "test-founder",
            name: { en: "Test Person", fa: "فرد آزمایشی" },
            role: { en: "Founder", fa: "بنیان‌گذار" },
            bio: {
              en: "An integration test profile.",
              fa: "یک معرفی آزمایشی.",
            },
            published: false,
          },
        );
        assert.equal(founder.status, 201);
        const list = await request<{ total: number }>("/founders");
        assert.equal(list.body.total, 0);
        assert.equal(
          (await request("/admin/content/tools/" + tool.body.id, "DELETE"))
            .status,
          204,
        );
      },
    );
    await check(
      "company updates are visible publicly and unknown fields are rejected",
      async () => {
        const current = await request("/company");
        const updated = {
          ...current.body,
          emails: ["new@example.test"],
          phones: ["+۹۸۹۱۲۳۴۵۶۷۸۹"],
          contactConfigured: true,
        };
        assert.equal(
          (await request("/admin/company", "PUT", updated)).status,
          200,
        );
        const company = await request<{ emails: string[]; phones: string[] }>(
          "/company",
        );
        assert.equal(company.body.emails[0], "new@example.test");
        assert.equal(company.body.phones[0], "+989123456789");
        assert.equal(
          (
            await request("/admin/company", "PUT", {
              ...updated,
              password: "unexpected",
            })
          ).status,
          400,
        );
      },
    );
    const availability = await request<{
      dates: { date: string; slots: string[] }[];
    }>("/availability");
    const day = availability.body.dates.find((d) => d.slots.length >= 2)!;
    const reservation = {
      name: "Persian Visitor",
      phone: "+۹۸ ۹۱۲ ۳۴۵ ۶۷۸۹",
      date: day.date,
      startTime: day.slots[0],
      locale: "fa",
    };
    let bookingId = "";
    await check(
      "concurrent reservations cannot double book; phone is normalized",
      async () => {
        const responses = await Promise.all([
          request<{ booking: { id: string } }>(
            "/bookings",
            "POST",
            reservation,
            "",
          ),
          request<{ booking: { id: string } }>(
            "/bookings",
            "POST",
            reservation,
            "",
          ),
        ]);
        assert.deepEqual(responses.map((r) => r.status).sort(), [201, 409]);
        bookingId = responses.find((r) => r.status === 201)!.body.booking.id;
        const stored = (
          await pool.query<{ phone: string }>(
            "SELECT phone FROM bookings WHERE id=$1",
            [bookingId],
          )
        ).rows[0];
        assert.equal(stored.phone, "+989123456789");
        const fresh = await request<{
          dates: { date: string; slots: string[] }[];
        }>("/availability");
        assert.ok(
          !fresh.body.dates
            .find((d) => d.date === day.date)!
            .slots.includes(day.slots[0]),
        );
      },
    );
    await check(
      "PostgreSQL rejects overlapping intervals, not just equal starts",
      async () => {
        const start = new Date(`${day.date}T${day.slots[0]}:00Z`);
        await assert.rejects(
          pool.query(
            "INSERT INTO bookings(name,phone,starts_at,ends_at) VALUES('Overlap','+15551234567',$1,$2)",
            [
              new Date(start.getTime() + 15 * 60000),
              new Date(start.getTime() + 45 * 60000),
            ],
          ),
          (error: unknown) =>
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "23P01",
        );
      },
    );
    await check(
      "cancellation releases the slot and invalid dates/hours fail",
      async () => {
        assert.equal(
          (
            await request("/admin/bookings/" + bookingId, "PATCH", {
              status: "cancelled",
            })
          ).status,
          200,
        );
        const fresh = await request<{
          dates: { date: string; slots: string[] }[];
        }>("/availability");
        assert.ok(
          fresh.body.dates
            .find((d) => d.date === day.date)!
            .slots.includes(day.slots[0]),
        );
        assert.equal(
          (
            await request(
              "/bookings",
              "POST",
              { ...reservation, startTime: "03:00" },
              "",
            )
          ).status,
          409,
        );
        assert.equal(
          (
            await request(
              "/bookings",
              "POST",
              { ...reservation, date: "2026-02-30" },
              "",
            )
          ).status,
          400,
        );
        assert.equal(
          (
            await request(
              "/bookings",
              "POST",
              { ...reservation, phone: "bad" },
              "",
            )
          ).status,
          400,
        );
      },
    );
    await check(
      "schedule changes take effect and blocked dates cannot be booked",
      async () => {
        assert.equal(
          (
            await request("/admin/consultation-settings", "PUT", {
              ...seed.settings,
              unavailableDates: [day.date],
            })
          ).status,
          200,
        );
        assert.equal(
          (await request("/bookings", "POST", reservation, "")).status,
          409,
        );
        assert.equal(
          (await request("/admin/consultation-settings", "PUT", seed.settings))
            .status,
          200,
        );
        const now = new Date("2026-09-14T10:00:00Z");
        assert.deepEqual(scheduledSlots(seed.settings, "2026-09-19", now), []);
        assert.equal(
          scheduledSlots(seed.settings, "2026-09-15", now)[0],
          "10:00",
        );
      },
    );
    await check(
      "contact messages persist and only admins can read them",
      async () => {
        assert.equal(
          (
            await request(
              "/contact",
              "POST",
              {
                name: "Test Contact",
                contact: "test@example.test",
                message: "A new company website project.",
                locale: "fa",
              },
              "",
            )
          ).status,
          201,
        );
        assert.equal(
          (await request("/admin/messages", "GET", undefined, "")).status,
          401,
        );
        const result = await request<{
          items: { id: string; locale: string }[];
        }>("/admin/messages");
        assert.equal(result.body.items[0].locale, "fa");
        assert.equal(
          (
            await request(
              "/admin/messages/" + result.body.items[0].id,
              "PATCH",
              { status: "read" },
            )
          ).status,
          204,
        );
      },
    );
    let adminId = "",
      adminToken = "";
    await check(
      "only owners manage users; disabled accounts lose access",
      async () => {
        const user = await request<{ id: string }>("/admin/users", "POST", {
          name: "Test Admin",
          email: "admin@example.test",
          password,
          role: "ADMIN",
        });
        assert.equal(user.status, 201);
        adminId = user.body.id;
        const login = await request<{ accessToken: string }>(
          "/auth/login",
          "POST",
          { email: "admin@example.test", password },
          "",
        );
        adminToken = login.body.accessToken;
        assert.equal(
          (await request("/admin/users", "GET", undefined, adminToken)).status,
          403,
        );
        assert.equal(
          (
            await request("/admin/users/" + owner.id, "PATCH", {
              active: false,
            })
          ).status,
          400,
        );
        assert.equal(
          (await request("/admin/users/" + adminId, "PATCH", { active: false }))
            .status,
          200,
        );
        assert.equal(
          (await request("/auth/me", "GET", undefined, adminToken)).status,
          401,
        );
      },
    );
    await check(
      "audit records exist without secrets; malformed JSON is safe",
      async () => {
        const audit = await request<{ items: unknown[] }>("/admin/audit-logs");
        assert.ok(audit.body.items.length > 0);
        assert.ok(!JSON.stringify(audit.body).includes(password));
        const bad = await fetch(base + "/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{broken",
        });
        assert.equal(bad.status, 400);
      },
    );
    await check(
      "password changes revoke all existing sessions; login throttles repeated attempts",
      async () => {
        assert.equal(
          (
            await request("/auth/password", "POST", {
              currentPassword: password,
              newPassword: password + "new",
            })
          ).status,
          204,
        );
        assert.equal((await request("/auth/me")).status, 401);
        const statuses: number[] = [];
        for (let i = 0; i < 5; i++)
          statuses.push(
            (
              await request(
                "/auth/login",
                "POST",
                { email: "missing@example.test", password: "wrong" },
                "",
              )
            ).status,
          );
        assert.ok(statuses.includes(429));
      },
    );
    console.log(`${passed} PostgreSQL/API integration checks passed.`);
  } finally {
    await app.close();
    await pool.end();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

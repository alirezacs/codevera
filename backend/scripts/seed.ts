import "dotenv/config";
import { readFileSync } from "node:fs";
import { createPool } from "../src/database/database";
import {
  contentSchemas,
  ContentKind,
  companySchema,
} from "../src/content/schemas";
import { settingsSchema } from "../src/bookings/schemas";
export async function seed(url = process.env.DATABASE_URL) {
  const data = JSON.parse(readFileSync("seed/content.json", "utf8")) as Record<
    string,
    unknown
  >;
  const pool = createPool(url);
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    for (const kind of ["projects", "tools", "founders"] as ContentKind[]) {
      for (const value of data[kind] as unknown[]) {
        const parsed = contentSchemas[kind].parse(value);
        const { slug, published, sortOrder, ...body } = parsed;
        const featured = "featured" in body ? body.featured : false;
        if ("featured" in body)
          delete (body as { featured?: boolean }).featured;
        await c.query(
          kind === "projects"
            ? "INSERT INTO projects(slug,published,sort_order,data,featured) VALUES($1,$2,$3,$4,$5) ON CONFLICT(slug) DO NOTHING"
            : `INSERT INTO ${kind}(slug,published,sort_order,data) VALUES($1,$2,$3,$4) ON CONFLICT(slug) DO NOTHING`,
          kind === "projects"
            ? [slug, published, sortOrder, JSON.stringify(body), featured]
            : [slug, published, sortOrder, JSON.stringify(body)],
        );
      }
    }
    await c.query(
      "INSERT INTO company(id,data) VALUES(1,$1) ON CONFLICT(id) DO NOTHING",
      [JSON.stringify(companySchema.parse(data.company))],
    );
    await c.query(
      "INSERT INTO consultation_settings(id,data) VALUES(1,$1) ON CONFLICT(id) DO NOTHING",
      [JSON.stringify(settingsSchema.parse(data.settings))],
    );
    await c.query("COMMIT");
    console.log(
      "Demo content seeded; existing content preserved. No admin account was created.",
    );
  } catch (error) {
    await c.query("ROLLBACK");
    throw error;
  } finally {
    c.release();
    await pool.end();
  }
}
if (require.main === module)
  seed().catch(() => {
    console.error("Seed failed. Run migrations and check seed/content.json.");
    process.exitCode = 1;
  });

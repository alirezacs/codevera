import { Injectable, NotFoundException } from "@nestjs/common";
import { Database } from "../database/database.js";
import { contentSchemas, ContentKind } from "./schemas.js";
import { Pagination } from "../common/validation.js";
export type ContentRow = {
  id: string;
  slug: string;
  published: boolean;
  featured?: boolean;
  sort_order: number;
  data: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
};
export function adminRecord(row: ContentRow) {
  return {
    ...row.data,
    id: row.id,
    slug: row.slug,
    published: row.published,
    ...(row.featured !== undefined ? { featured: row.featured } : {}),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
export function publicRecord(
  kind: ContentKind,
  row: ContentRow,
  locale: "en" | "fa",
) {
  const { translations, ...data } = row.data;
  if (kind === "projects")
    return {
      id: row.id,
      slug: row.slug,
      featured: row.featured,
      ...data,
      ...(translations as Record<string, object>)[locale],
    };
  return { id: row.id, slug: row.slug, ...data };
}
@Injectable()
export class ContentService {
  constructor(private readonly db: Database) {}
  async list(
    kind: ContentKind,
    paging: Pagination,
    admin = false,
    locale: "en" | "fa" = "en",
  ) {
    const where = admin ? "" : "WHERE published=true";
    const count = await this.db.query<{ total: string }>(
      `SELECT count(*) AS total FROM ${kind} ${where}`,
    );
    const rows = await this.db.query<ContentRow>(
      `SELECT * FROM ${kind} ${where} ORDER BY sort_order,id LIMIT $1 OFFSET $2`,
      [paging.limit, (paging.page - 1) * paging.limit],
    );
    return {
      items: rows.rows.map((r) =>
        admin ? adminRecord(r) : publicRecord(kind, r, locale),
      ),
      total: Number(count.rows[0].total),
      page: paging.page,
      limit: paging.limit,
    };
  }
  async get(
    kind: ContentKind,
    key: string,
    admin = false,
    locale: "en" | "fa" = "en",
  ) {
    const row = (
      await this.db.query<ContentRow>(
        `SELECT * FROM ${kind} WHERE ${admin ? "id" : "slug"}=$1 ${admin ? "" : "AND published=true"}`,
        [key],
      )
    ).rows[0];
    if (!row) throw new NotFoundException("Record not found.");
    return admin ? adminRecord(row) : publicRecord(kind, row, locale);
  }
  async save(kind: ContentKind, body: unknown, actor: string, id?: string) {
    const parsed = contentSchemas[kind].parse(body);
    const { slug, published, sortOrder, ...data } = parsed;
    const featured = "featured" in data ? data.featured : false;
    const stored = { ...data };
    if ("featured" in stored)
      delete (stored as { featured?: boolean }).featured;
    return this.db.transaction(async (c) => {
      let row: ContentRow | undefined;
      if (id) {
        const q =
          kind === "projects"
            ? `UPDATE projects SET slug=$1,published=$2,sort_order=$3,data=$4,featured=$6,updated_at=now() WHERE id=$5 RETURNING *`
            : `UPDATE ${kind} SET slug=$1,published=$2,sort_order=$3,data=$4,updated_at=now() WHERE id=$5 RETURNING *`;
        row = (
          await c.query<ContentRow>(
            q,
            kind === "projects"
              ? [
                  slug,
                  published,
                  sortOrder,
                  JSON.stringify(stored),
                  id,
                  featured,
                ]
              : [slug, published, sortOrder, JSON.stringify(stored), id],
          )
        ).rows[0];
      } else {
        const q =
          kind === "projects"
            ? "INSERT INTO projects(slug,published,sort_order,data,featured) VALUES($1,$2,$3,$4,$5) RETURNING *"
            : `INSERT INTO ${kind}(slug,published,sort_order,data) VALUES($1,$2,$3,$4) RETURNING *`;
        row = (
          await c.query<ContentRow>(
            q,
            kind === "projects"
              ? [slug, published, sortOrder, JSON.stringify(stored), featured]
              : [slug, published, sortOrder, JSON.stringify(stored)],
          )
        ).rows[0];
      }
      if (!row) throw new NotFoundException("Record not found.");
      await c.query(
        "INSERT INTO audit_logs(actor_id,action,entity,entity_id) VALUES($1,$2,$3,$4)",
        [actor, id ? "update" : "create", kind, row.id],
      );
      return adminRecord(row);
    });
  }
  async remove(kind: ContentKind, id: string, actor: string) {
    await this.db.transaction(async (c) => {
      const result = await c.query(`DELETE FROM ${kind} WHERE id=$1`, [id]);
      if (!result.rowCount) throw new NotFoundException("Record not found.");
      await c.query(
        "INSERT INTO audit_logs(actor_id,action,entity,entity_id) VALUES($1,'delete',$2,$3)",
        [actor, kind, id],
      );
    });
  }
  async company() {
    const row = (
      await this.db.query<{ data: unknown }>(
        "SELECT data FROM company WHERE id=1",
      )
    ).rows[0];
    if (!row)
      throw new NotFoundException(
        "Company information has not been configured.",
      );
    return row.data;
  }
  async saveCompany(data: unknown, actor: string) {
    return this.db.transaction(async (c) => {
      await c.query(
        "INSERT INTO company(id,data) VALUES(1,$1) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated_at=now()",
        [JSON.stringify(data)],
      );
      await c.query(
        "INSERT INTO audit_logs(actor_id,action,entity,entity_id) VALUES($1,'update','company','1')",
        [actor],
      );
      return data;
    });
  }
}

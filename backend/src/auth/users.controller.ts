import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { Database } from "../database/database.js";
import {
  Validate,
  nameSchema,
  pagination,
  Pagination,
} from "../common/validation.js";
import { AdminRequest, Owner } from "./guard.js";
import { hashPassword } from "./password.js";
export const createSchema = z
  .object({
    email: z.email().trim().toLowerCase().max(254),
    name: nameSchema,
    password: z.string().min(12).max(128),
    role: z.enum(["OWNER", "ADMIN"]).default("ADMIN"),
  })
  .strict();
export const updateSchema = z
  .object({
    name: nameSchema.optional(),
    active: z.boolean().optional(),
    role: z.enum(["OWNER", "ADMIN"]).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, "Provide at least one field.");
@ApiTags("Admin users")
@ApiBearerAuth()
@Owner()
@Controller("admin/users")
export class UsersController {
  constructor(private readonly db: Database) {}
  @Get() async list(@Query(new Validate(pagination)) q: Pagination) {
    const total = Number(
      (
        await this.db.query<{ total: string }>(
          "SELECT count(*) AS total FROM users",
        )
      ).rows[0].total,
    );
    const items = (
      await this.db.query(
        "SELECT id,email,name,role,active,created_at,updated_at FROM users ORDER BY created_at,id LIMIT $1 OFFSET $2",
        [q.limit, (q.page - 1) * q.limit],
      )
    ).rows;
    return { items, total, ...q };
  }
  @Post() async create(
    @Body(new Validate(createSchema)) body: z.infer<typeof createSchema>,
    @Req() req: AdminRequest,
  ) {
    const hash = await hashPassword(body.password);
    return this.db.transaction(async (c) => {
      const user = (
        await c.query(
          "INSERT INTO users(email,name,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,email,name,role,active",
          [body.email, body.name, hash, body.role],
        )
      ).rows[0];
      await c.query(
        "INSERT INTO audit_logs(actor_id,action,entity,entity_id) VALUES($1,'create','users',$2)",
        [req.user.id, user.id],
      );
      return user;
    });
  }
  @Patch(":id") async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new Validate(updateSchema)) body: z.infer<typeof updateSchema>,
    @Req() req: AdminRequest,
  ) {
    if (id === req.user.id && (body.active === false || body.role === "ADMIN"))
      throw new BadRequestException(
        "You cannot disable or demote your own account.",
      );
    return this.db.transaction(async (c) => {
      await c.query("SELECT pg_advisory_xact_lock(61042002)");
      const current = (
        await c.query<{ name: string; role: string; active: boolean }>(
          "SELECT name,role,active FROM users WHERE id=$1 FOR UPDATE",
          [id],
        )
      ).rows[0];
      if (!current) throw new NotFoundException("User not found.");
      if (
        current.role === "OWNER" &&
        current.active &&
        (body.active === false || body.role === "ADMIN")
      ) {
        const owners = Number(
          (
            await c.query<{ total: string }>(
              "SELECT count(*) AS total FROM users WHERE role='OWNER' AND active=true",
            )
          ).rows[0].total,
        );
        if (owners <= 1)
          throw new BadRequestException(
            "At least one active owner is required.",
          );
      }
      const user = (
        await c.query(
          "UPDATE users SET name=$1,role=$2,active=$3,updated_at=now() WHERE id=$4 RETURNING id,email,name,role,active",
          [
            body.name ?? current.name,
            body.role ?? current.role,
            body.active ?? current.active,
            id,
          ],
        )
      ).rows[0];
      if (body.active === false || body.role)
        await c.query("DELETE FROM sessions WHERE user_id=$1", [id]);
      await c.query(
        "INSERT INTO audit_logs(actor_id,action,entity,entity_id) VALUES($1,'update','users',$2)",
        [req.user.id, id],
      );
      return user;
    });
  }
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { Database } from "../database/database.js";
import { Validate } from "../common/validation.js";
import { Public, tokenHash, AdminRequest, AdminUser } from "./guard.js";
import { hashPassword, verifyPassword } from "./password.js";
export const loginSchema = z
  .object({
    email: z.email().trim().toLowerCase().max(254),
    password: z.string().min(1).max(128),
  })
  .strict();
export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(12).max(128),
  })
  .strict();
@ApiTags("Authentication")
@ApiBearerAuth()
@Controller("auth")
export class AuthController {
  constructor(private readonly db: Database) {}
  @Public()
  @Post("login")
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(
    @Body(new Validate(loginSchema)) body: z.infer<typeof loginSchema>,
  ) {
    const row = (
      await this.db.query<AdminUser & { password_hash: string }>(
        "SELECT * FROM users WHERE email=$1",
        [body.email],
      )
    ).rows[0];
    const valid = await verifyPassword(
      body.password,
      row?.password_hash ??
        "scrypt:00000000000000000000000000000000:" + "00".repeat(64),
    );
    if (!row || !row.active || !valid)
      throw new UnauthorizedException("Invalid email or password.");
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(
      Date.now() + Number(process.env.SESSION_HOURS || 8) * 3600000,
    );
    await this.db.transaction(async (client) => {
      await client.query("DELETE FROM sessions WHERE expires_at<=now()");
      await client.query(
        "INSERT INTO sessions(user_id,token_hash,expires_at) VALUES($1,$2,$3)",
        [row.id, tokenHash(token), expiresAt],
      );
      await client.query(
        "INSERT INTO audit_logs(actor_id,action,entity,entity_id) VALUES($1::uuid,'login','users',$1::text)",
        [row.id],
      );
    });
    return {
      accessToken: token,
      tokenType: "Bearer",
      expiresAt,
      user: { id: row.id, name: row.name, email: row.email, role: row.role },
    };
  }
  @Get("me") me(@Req() req: AdminRequest) {
    return req.user;
  }
  @Post("logout") @HttpCode(204) async logout(@Req() req: AdminRequest) {
    await this.db.query("DELETE FROM sessions WHERE token_hash=$1", [
      req.sessionHash,
    ]);
  }
  @Post("password") @HttpCode(204) async password(
    @Req() req: AdminRequest,
    @Body(new Validate(passwordSchema)) body: z.infer<typeof passwordSchema>,
  ) {
    const row = (
      await this.db.query<{ password_hash: string }>(
        "SELECT password_hash FROM users WHERE id=$1",
        [req.user.id],
      )
    ).rows[0];
    if (!(await verifyPassword(body.currentPassword, row.password_hash)))
      throw new UnauthorizedException("Current password is incorrect.");
    const hash = await hashPassword(body.newPassword);
    await this.db.transaction(async (c) => {
      await c.query(
        "UPDATE users SET password_hash=$1,updated_at=now() WHERE id=$2",
        [hash, req.user.id],
      );
      await c.query("DELETE FROM sessions WHERE user_id=$1", [req.user.id]);
      await c.query(
        "INSERT INTO audit_logs(actor_id,action,entity,entity_id) VALUES($1::uuid,'password_changed','users',$1::text)",
        [req.user.id],
      );
    });
  }
}

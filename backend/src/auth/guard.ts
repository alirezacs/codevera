import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { createHash } from "node:crypto";
import type { Request } from "express";
import { Database } from "../database/database.js";
export const Public = () => SetMetadata("public", true);
export const Owner = () => SetMetadata("owner", true);
export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: "OWNER" | "ADMIN";
  active: boolean;
};
export type AdminRequest = Request & { user: AdminUser; sessionHash: string };
export const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly db: Database,
    private readonly reflector: Reflector,
  ) {}
  async canActivate(context: ExecutionContext) {
    if (
      this.reflector.getAllAndOverride("public", [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true;
    const req = context.switchToHttp().getRequest<AdminRequest>();
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ") || header.length > 300)
      throw new UnauthorizedException("Authentication required.");
    const hash = tokenHash(header.slice(7));
    const result = await this.db.query<AdminUser>(
      `SELECT u.id,u.email,u.name,u.role,u.active FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active=true`,
      [hash],
    );
    if (!result.rows[0])
      throw new UnauthorizedException("Invalid or expired session.");
    req.user = result.rows[0];
    req.sessionHash = hash;
    if (
      this.reflector.getAllAndOverride("owner", [
        context.getHandler(),
        context.getClass(),
      ]) &&
      req.user.role !== "OWNER"
    )
      throw new ForbiddenException("Owner access required.");
    return true;
  }
}

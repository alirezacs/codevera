import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UploadedFile, UseInterceptors } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { Public, AdminRequest } from "../auth/guard.js";
import {
  Validate,
  pagination,
  Pagination,
  localeSchema,
} from "../common/validation.js";
import { companySchema, Company, ContentKind, kindSchema } from "./schemas.js";
import { ContentService } from "./content.service.js";
const publicQuery = pagination.extend({ locale: localeSchema });
@ApiTags("Public content")
@Controller()
export class PublicContentController {
  constructor(private readonly content: ContentService) {}
  @Public() @Get("company") company() {
    return this.content.company();
  }
  @Public() @Get("projects") projects(
    @Query(new Validate(publicQuery)) q: z.infer<typeof publicQuery>,
  ) {
    return this.content.list("projects", q, false, q.locale);
  }
  @Public() @Get("projects/:slug") project(
    @Param("slug") slug: string,
    @Query(new Validate(z.object({ locale: localeSchema }).strict()))
    q: { locale: "en" | "fa" },
  ) {
    return this.content.get("projects", slug, false, q.locale);
  }
  @Public() @Get("tools") tools(
    @Query(new Validate(pagination)) q: Pagination,
  ) {
    return this.content.list("tools", q);
  }
  @Public() @Get("founders") founders(
    @Query(new Validate(pagination)) q: Pagination,
  ) {
    return this.content.list("founders", q);
  }
}
@ApiTags("Admin content")
@ApiBearerAuth()
@Controller("admin")
export class AdminContentController {
  constructor(private readonly content: ContentService) {}
  @Get("company") company() {
    return this.content.company();
  }
  @Post("uploads")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
      fileFilter: (_req, file, done) =>
        done(null, ["image/png", "image/jpeg", "image/webp", "image/avif"].includes(file.mimetype)),
    }),
  )
  async upload(@UploadedFile() file?: { buffer: Buffer; mimetype: string }) {
    if (!file) throw new BadRequestException("Upload a PNG, JPEG, WebP, or AVIF image up to 5 MB.");
    const extension = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/avif": "avif" }[file.mimetype];
    const directory = join(process.cwd(), "uploads", "projects");
    await mkdir(directory, { recursive: true });
    const filename = `${randomUUID()}.${extension}`;
    await writeFile(join(directory, filename), file.buffer, { flag: "wx" });
    return { path: `/uploads/projects/${filename}` };
  }
  @Put("company") saveCompany(
    @Body(new Validate(companySchema)) body: Company,
    @Req() req: AdminRequest,
  ) {
    return this.content.saveCompany(body, req.user.id);
  }
  @Get("content/:kind") list(
    @Param("kind", new Validate(kindSchema)) kind: ContentKind,
    @Query(new Validate(pagination)) q: Pagination,
  ) {
    return this.content.list(kind, q, true);
  }
  @Get("content/:kind/:id") get(
    @Param("kind", new Validate(kindSchema)) kind: ContentKind,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.content.get(kind, id, true);
  }
  @Post("content/:kind") create(
    @Param("kind", new Validate(kindSchema)) kind: ContentKind,
    @Body() body: unknown,
    @Req() req: AdminRequest,
  ) {
    return this.content.save(kind, body, req.user.id);
  }
  @Put("content/:kind/:id") update(
    @Param("kind", new Validate(kindSchema)) kind: ContentKind,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: unknown,
    @Req() req: AdminRequest,
  ) {
    return this.content.save(kind, body, req.user.id, id);
  }
  @Delete("content/:kind/:id") @HttpCode(204) remove(
    @Param("kind", new Validate(kindSchema)) kind: ContentKind,
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AdminRequest,
  ) {
    return this.content.remove(kind, id, req.user.id);
  }
}

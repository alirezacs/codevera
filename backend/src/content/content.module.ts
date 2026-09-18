import { Module } from "@nestjs/common";
import {
  PublicContentController,
  AdminContentController,
} from "./content.controller.js";
import { ContentService } from "./content.service.js";
@Module({
  controllers: [PublicContentController, AdminContentController],
  providers: [ContentService],
})
export class ContentModule {}

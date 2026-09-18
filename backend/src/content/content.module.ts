import { Module } from "@nestjs/common";
import {
  PublicContentController,
  AdminContentController,
} from "./content.controller";
import { ContentService } from "./content.service";
@Module({
  controllers: [PublicContentController, AdminContentController],
  providers: [ContentService],
})
export class ContentModule {}

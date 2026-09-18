import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller.js";
import { UsersController } from "./users.controller.js";
@Module({ controllers: [AuthController, UsersController] })
export class AuthModule {}

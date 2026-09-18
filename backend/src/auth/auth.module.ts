import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { UsersController } from "./users.controller";
@Module({ controllers: [AuthController, UsersController] })
export class AuthModule {}

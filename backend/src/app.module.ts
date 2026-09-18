import { Module, Controller, Get } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { Database, DatabaseModule } from "./database/database.js";
import { AuthGuard, Public } from "./auth/guard.js";
import { AuthModule } from "./auth/auth.module.js";
import { ContentModule } from "./content/content.module.js";
import { BookingsModule } from "./bookings/bookings.module.js";
@Controller("health")
class HealthController {
  constructor(private readonly db: Database) {}
  @Public() @Get() async health() {
    await this.db.query("SELECT 1");
    return { status: "ok" };
  }
}
@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    ContentModule,
    BookingsModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 600 }]),
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}

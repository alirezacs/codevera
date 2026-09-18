import { Module, Controller, Get } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { Database, DatabaseModule } from "./database/database";
import { AuthGuard, Public } from "./auth/guard";
import { AuthModule } from "./auth/auth.module";
import { ContentModule } from "./content/content.module";
import { BookingsModule } from "./bookings/bookings.module";
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

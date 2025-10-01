import { Module } from '@nestjs/common';
import { DatabaseModule } from './shared/db/db.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

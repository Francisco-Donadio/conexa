import { Module } from '@nestjs/common';
import { DatabaseModule } from './shared/db/db.module';
import { AuthModule } from './auth/auth.module';
import { MoviesModule } from './movies/movies.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot(), DatabaseModule, AuthModule, MoviesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

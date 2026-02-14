import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { validate } from './config/env/validate';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
      isGlobal: true,
    }),
    CommonModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}

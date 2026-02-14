import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordResetToken } from 'src/auth/entities/password-reset-token.entity';
import { Session } from 'src/auth/entities/session.entity';
import { VerificationCode } from 'src/auth/entities/verification-code.entity';
import { Password } from 'src/users/entities/password.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        synchronize: false,
        logging: false,
        subscribers: [],
        entities: [
          User,
          Password,
          Session,
          PasswordResetToken,
          VerificationCode,
        ],
      }),
    }),
  ],
})
export class DatabaseModule {}

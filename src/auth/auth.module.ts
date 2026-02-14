import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Password } from 'src/users/entities/password.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DbTransactionFactory } from 'src/database/transaction-factory';
import { Session } from './entities/session.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { VerificationCode } from './entities/verification-code.entity';
import { MailModule } from 'src/mail/mail.module';
import { CustomJwtService } from './services/jwt.service';
import { VerificationCodeService } from './services/verification-code.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Password,
      Session,
      PasswordResetToken,
      VerificationCode,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    MailModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    ConfigService,
    DbTransactionFactory,
    CustomJwtService,
    VerificationCodeService,
  ],
  exports: [AuthService],
})
export class AuthModule {}

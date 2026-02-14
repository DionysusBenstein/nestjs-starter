import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Password } from 'src/users/entities/password.entity';
import { ConfigService } from '@nestjs/config';
import { DbTransactionFactory } from 'src/database/transaction-factory';
import { Session } from './entities/session.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { VerificationCode } from './entities/verification-code.entity';
import { MailModule } from 'src/mail/mail.module';
import { VerificationCodeService } from './services/verification-code.service';
import { UsersModule } from 'src/users/users.module';
import { JwtSharedModule } from './jwt-shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Password,
      Session,
      PasswordResetToken,
      VerificationCode,
    ]),
    JwtSharedModule,
    MailModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    ConfigService,
    DbTransactionFactory,
    VerificationCodeService,
  ],
  exports: [AuthService],
})
export class AuthModule {}

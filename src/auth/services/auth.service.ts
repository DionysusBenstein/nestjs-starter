import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Request } from 'express';
import { ErrorCode } from 'src/common/enums/error-code.enum';
import { pick } from 'src/common/utils/object.util';
import { DbTransactionFactory, updateWithTransactions } from 'src/database/transaction-factory';
import { MailService } from 'src/mail/mail.service';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { In, Repository } from 'typeorm';
import { RegisterDto } from '../dto/register.dto';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { Session } from '../entities/session.entity';
import { VerificationCodeTypeEnum } from '../entities/verification-code.entity';
import { CustomJwtService } from './jwt.service';
import { VerificationCodeService } from './verification-code.service';

type TokenPayload = Pick<User, 'id' | 'first_name' | 'last_name' | 'email'>;

@Injectable()
export class AuthService {
  private readonly _logger = new Logger(AuthService.name);
  private readonly MAX_ACTIVE_TOKENS: number = 5;

  constructor(
    @InjectRepository(Session) private readonly refreshTokenRepository: Repository<Session>,
    @InjectRepository(PasswordResetToken) private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly usersService: UsersService,
    private readonly jwtService: CustomJwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly verificationCodeService: VerificationCodeService,
    private readonly transactionRunner: DbTransactionFactory,
  ) {}

  private createTokens(payload: TokenPayload) {
    const accessToken = this.jwtService.createAccessToken(payload);
    const refreshToken = this.jwtService.createRefreshToken(payload);

    return { accessToken, refreshToken };
  }

  private saveRefreshToken(user: User, token: string, deviceInfo: string, ipAddress: string) {
    return this.refreshTokenRepository.save({
      refresh_token: token,
      user_id: user.id,
      device_info: deviceInfo,
      ip_address: ipAddress,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
  }

  private async deactivateOldTokens(userId: number) {
    const activeTokens = await this.refreshTokenRepository.find({
      where: { user_id: userId, is_active: true },
      order: { created_at: 'DESC' },
    });

    if (activeTokens.length >= this.MAX_ACTIVE_TOKENS) {
      const tokensToDeactivate = activeTokens.slice(this.MAX_ACTIVE_TOKENS - 1);
      await this.refreshTokenRepository.update(
        { id: In(tokensToDeactivate.map((t) => t.id)) },
        { is_active: false },
      );
    }
  }

  async login(email: string, password: string, req: Request): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.usersService.findOneByEmailWithPassword(email);
    const isMatch = await bcrypt.compare(password, user.password.value);

    if (!isMatch) {
      throw new UnauthorizedException(ErrorCode.WrongPassword);
    }

    if (!user.is_active) {
      throw new UnauthorizedException(ErrorCode.BlockedUser);
    }

    if (!user.is_verified) {
      throw new UnauthorizedException(ErrorCode.UserNotVerified);
    }

    const tokens = this.createTokens({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
    });

    const deviceInfo = req.headers['user-agent'] || 'unknown';
    const ipAddress = req.ip;

    await this.deactivateOldTokens(user.id);
    await this.saveRefreshToken(user, tokens.refreshToken, deviceInfo, ipAddress);

    return tokens;
  }

  async refreshToken(refreshToken: string, req: Request): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = await this.jwtService.verifyRefreshToken(refreshToken);

      const storedToken = await this.refreshTokenRepository.findOne({
        where: { refresh_token: refreshToken, is_active: true },
        relations: ['user'],
      });

      if (!storedToken) {
        throw new UnauthorizedException(ErrorCode.InvalidRefreshToken);
      }

      const deviceInfo = req.headers['user-agent'] || 'unknown';
      const ipAddress = req.ip || req.connection.remoteAddress;

      if (storedToken.device_info !== deviceInfo || storedToken.ip_address !== ipAddress) {
        await this.refreshTokenRepository.update(storedToken.id, { is_active: false });
        throw new UnauthorizedException(ErrorCode.InvalidRefreshToken);
      }

      const tokens = this.createTokens({
        id: payload.id,
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
      });

      await this.refreshTokenRepository.update(storedToken.id, { is_active: false });
      await this.saveRefreshToken(storedToken.user, tokens.refreshToken, deviceInfo, ipAddress);

      return tokens;
    } catch (error) {
      this._logger.error(error);
      throw new UnauthorizedException(ErrorCode.InvalidRefreshToken);
    }
  }

  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenRepository.update({ refresh_token: refreshToken }, { is_active: false });
  }

  async register({ email, first_name, last_name, password }: RegisterDto): Promise<Pick<User, 'email' | 'is_verified'>> {
    const existingUser = await this.usersService.findOneByEmail(email);

    if (existingUser) {
      throw new BadRequestException(ErrorCode.UserAlreadyExists);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { id } = await this.usersService.create({
      email,
      first_name,
      last_name,
      password: hashedPassword,
      is_verified: false,
    });

    const newUser = await this.usersService.findOne(id);
    const code = await this.verificationCodeService.createVerificationCode(email, VerificationCodeTypeEnum.Email);

    await this.mailService.sendVerificationCodeEmail(email, code);
    return pick(newUser, ['email', 'is_verified']);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      return;
    }

    await this.passwordResetTokenRepository.update({ user_id: user.id, is_active: true }, { is_active: false });

    const token = randomBytes(32).toString('hex');
    const resetToken = this.passwordResetTokenRepository.create({
      token,
      user_id: user.id,
      expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    await this.passwordResetTokenRepository.save(resetToken);

    const resetUrl = `${this.configService.get('FRONTEND_URL')}/auth/reset-password?token=${token}`;
    await this.mailService.sendPasswordResetEmail(user.email, resetUrl);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: { token, is_active: true },
      relations: ['user'],
    });

    if (!resetToken || resetToken.expires_at < new Date()) {
      throw new UnauthorizedException(ErrorCode.InvalidResetToken);
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await this.usersService.updatePassword(resetToken.user.id, hashedPassword);
    await this.passwordResetTokenRepository.update(resetToken.id, { is_active: false });
  }

  async resendVerificationCode(email: string): Promise<void> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new NotFoundException(ErrorCode.UserNotFound);
    }

    if (user.is_verified) {
      throw new BadRequestException(ErrorCode.UserAlreadyExists);
    }

    const code = await this.verificationCodeService.createVerificationCode(email, VerificationCodeTypeEnum.Email);

    await this.mailService.sendVerificationCodeEmail(email, code);
  }

  async verifyEmail(email: string, code: string, req: Request): Promise<{ accessToken: string; refreshToken: string }> {
    const transactionalRunner = await this.transactionRunner.createTransaction();

    try {
      await transactionalRunner.startTransaction();
      const user = await this.usersService.findOneByEmail(email);

      if (!user) {
        throw new NotFoundException(ErrorCode.UserNotFound);
      }

      if (user.is_verified) {
        throw new BadRequestException(ErrorCode.UserAlreadyExists);
      }

      await this.verificationCodeService.verifyCode(
        email,
        code,
        VerificationCodeTypeEnum.Email,
        transactionalRunner.transactionManager,
      );

      await updateWithTransactions.call(
        this.userRepository,
        { id: user.id },
        { is_verified: true },
        transactionalRunner.transactionManager,
      );

      const tokens = this.createTokens({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      });

      const deviceInfo = req.headers['user-agent'] || 'unknown';
      const ipAddress = req.ip;

      await this.deactivateOldTokens(user.id);
      await this.saveRefreshToken(user, tokens.refreshToken, deviceInfo, ipAddress);

      await transactionalRunner.commitTransaction();
      return tokens;
    } catch (error) {
      await transactionalRunner.rollbackTransaction();
      this._logger.error(error.message, error.stack);
      throw error;
    } finally {
      await transactionalRunner.releaseTransaction();
    }
  }
}

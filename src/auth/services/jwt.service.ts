import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from 'src/common/enums/error-code.enum';

@Injectable()
export class CustomJwtService {
  private readonly _logger = new Logger(CustomJwtService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  createAccessToken<T>(payload: T) {
    const isDevelop = this.configService.get<string>('NODE_ENV') === 'development';
    return this.jwtService.sign(payload as object, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: isDevelop ? '7d' : '15m',
    });
  }

  createRefreshToken<T>(payload: T) {
    return this.jwtService.sign(payload as object, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });
  }

  async verifyAccessToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      return payload;
    } catch (error) {
      this._logger.error(error);
      throw new UnauthorizedException(ErrorCode.InvalidToken);
    }
  }

  async verifyRefreshToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      return payload;
    } catch (error) {
      this._logger.error(error);
      throw new UnauthorizedException(ErrorCode.InvalidRefreshToken);
    }
  }
}

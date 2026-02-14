import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ErrorCode } from 'src/common/enums/error-code.enum';
import { extractTokenFromHeader } from '../utils/request.util';
import { CustomJwtService } from '../services/jwt.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly _logger = new Logger(AuthGuard.name);

  constructor(
    private jwtService: CustomJwtService,
    private userService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(ErrorCode.InvalidToken);
    }

    try {
      const payload = await this.jwtService.verifyAccessToken(token);
      request.user = await this.userService.findOne(payload.id);
      return true;
    } catch (error) {
      this._logger.error(error.message, error.stack);
      throw new UnauthorizedException(ErrorCode.InvalidToken);
    }
  }
}

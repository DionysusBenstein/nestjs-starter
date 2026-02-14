import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestPasswordResetDto, ResetPasswordDto } from './dto/reset-password.dto';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { UsersService } from 'src/users/users.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
  ) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'User with this email already exists' })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @ApiOperation({ summary: 'Log in' })
  @ApiResponse({ status: 200, description: 'Successful login, returns tokens' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    return this.authService.login(loginDto.email, loginDto.password, req);
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @Post('refresh-token')
  async refreshToken(@Body() { refreshToken }: RefreshTokenDto, @Req() req: Request) {
    return this.authService.refreshToken(refreshToken, req);
  }

  @ApiOperation({ summary: 'Verify token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('verify-token')
  verifyToken(@CurrentUser() user: User) {
    return this.userService.findOne(user.id);
  }

  @ApiOperation({ summary: 'Log out' })
  @ApiResponse({ status: 200, description: 'Session terminated' })
  @ApiBearerAuth()
  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Body() { refreshToken }: RefreshTokenDto) {
    return this.authService.logout(refreshToken);
  }

  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Request accepted' })
  @Post('request-password-reset')
  async requestPasswordReset(@Body() { email }: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(email);
  }

  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  @Post('reset-password')
  async resetPassword(@Body() { token, newPassword }: ResetPasswordDto) {
    return this.authService.resetPassword(token, newPassword);
  }

  @ApiOperation({ summary: 'Resend verification code' })
  @ApiResponse({ status: 200, description: 'Code sent successfully' })
  @ApiResponse({ status: 400, description: 'User not found or already verified' })
  @Post('resend-verification')
  async resendVerificationCode(@Body() { email }: ResendVerificationDto) {
    return this.authService.resendVerificationCode(email);
  }

  @ApiOperation({ summary: 'Verify email' })
  @ApiResponse({ status: 200, description: 'Email verified successfully, returns tokens' })
  @ApiResponse({ status: 400, description: 'Invalid verification code or email already verified' })
  @Post('verify-email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto, @Req() req: Request) {
    return this.authService.verifyEmail(verifyEmailDto.email, verifyEmailDto.code, req);
  }
}

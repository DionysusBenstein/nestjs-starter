import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsStrongPassword, MinLength } from 'class-validator';

export class RequestPasswordResetDto {
  @ApiProperty({ description: 'User email' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Reset token' })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'New password',
    example: 'Password123!',
    required: true,
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @IsStrongPassword({
    minLength: 8,
    minSymbols: 1,
    minNumbers: 1,
    minLowercase: 1,
    minUppercase: 1,
  })
  newPassword: string;
}

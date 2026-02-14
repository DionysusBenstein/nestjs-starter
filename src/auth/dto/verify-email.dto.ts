import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'Verification code' })
  code: string;
}

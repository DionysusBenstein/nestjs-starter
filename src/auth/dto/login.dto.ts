import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password',
    example: 'Password123!',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

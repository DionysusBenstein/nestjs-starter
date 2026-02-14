import { IsEmail, IsNotEmpty, MinLength, IsString, IsStrongPassword } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'First name',
    example: 'John',
    required: true,
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  first_name: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
    required: true,
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  last_name: string;

  @ApiProperty({
    description: 'Password',
    example: 'Password123!',
    required: true,
    minLength: 8,
  })
  @IsString()
  @IsStrongPassword({
    minLength: 8,
    minSymbols: 1,
    minNumbers: 1,
    minLowercase: 1,
    minUppercase: 1,
  })
  password: string;
}

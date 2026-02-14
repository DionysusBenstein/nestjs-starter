import { IsEmail, IsNotEmpty, IsString, MinLength, IsBoolean, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  first_name: string;

  @IsString()
  @IsOptional()
  last_name?: string | null;

  @IsString()
  @IsOptional()
  password?: string | null;

  @IsBoolean()
  @IsOptional()
  is_verified?: boolean;
}

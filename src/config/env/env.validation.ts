import { IsEnum, IsNumber, IsString, IsStrongPassword, IsNotEmpty, IsPositive, IsBoolean } from 'class-validator';

enum NodeEnvironment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  // App config
  @IsEnum(NodeEnvironment)
  NODE_ENV: NodeEnvironment;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET: string;

  @IsNumber()
  @IsPositive()
  PORT: number;

  // Database config
  @IsString()
  @IsNotEmpty()
  DB_HOST: string;

  @IsNumber()
  @IsPositive()
  DB_PORT: number;

  @IsString()
  @IsNotEmpty()
  DB_NAME: string;

  @IsString()
  @IsNotEmpty()
  DB_USERNAME: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({
    minLength: 16,
    minSymbols: 0,
    minNumbers: 3,
    minLowercase: 4,
    minUppercase: 4,
  })
  DB_PASSWORD: string;

  // Redis config
  @IsString()
  @IsNotEmpty()
  REDIS_HOST: string;

  @IsNumber()
  @IsPositive()
  REDIS_PORT: number;

  // SMTP config
  @IsString()
  @IsNotEmpty()
  SMTP_HOST: string;

  @IsNumber()
  @IsPositive()
  SMTP_PORT: number;

  @IsBoolean()
  SMTP_SECURE: boolean;

  @IsString()
  @IsNotEmpty()
  SMTP_USER: string;

  @IsString()
  @IsNotEmpty()
  SMTP_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  FRONTEND_URL: string;
}

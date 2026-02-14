import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Password } from './entities/password.entity';
import { DbTransactionFactory } from 'src/database/transaction-factory';
import { JwtSharedModule } from 'src/auth/jwt-shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Password]),
    JwtSharedModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, DbTransactionFactory],
  exports: [UsersService],
})
export class UsersModule {}

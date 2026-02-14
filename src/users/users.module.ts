import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Password } from './entities/password.entity';
import { DbTransactionFactory } from 'src/database/transaction-factory';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Password]),
  ],
  controllers: [UsersController],
  providers: [UsersService, DbTransactionFactory],
  exports: [UsersService],
})
export class UsersModule {}

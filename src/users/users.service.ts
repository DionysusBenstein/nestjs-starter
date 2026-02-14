import * as bcrypt from 'bcrypt';
import { ConflictException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Password } from './entities/password.entity';
import { ErrorCode } from 'src/common/enums/error-code.enum';
import { DbTransactionFactory, saveWithTransactions } from 'src/database/transaction-factory';

@Injectable()
export class UsersService {
  private readonly _logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Password) private passwordRepository: Repository<Password>,
    private transactionRunner: DbTransactionFactory,
  ) {}

  async create({ first_name, last_name, email, password, is_verified }: CreateUserDto): Promise<User> {
    const transactionalRunner = await this.transactionRunner.createTransaction();

    try {
      await transactionalRunner.startTransaction();

      if (email) {
        const existingUser = await this.findOneByEmail(email);

        if (existingUser) {
          throw new ConflictException(ErrorCode.UserAlreadyExists);
        }
      }

      const newPassword = password && this.passwordRepository.create({ value: password });

      const newUser = await saveWithTransactions.call(
        this.userRepository,
        {
          first_name,
          last_name,
          email,
          password: newPassword,
          is_verified,
        },
        transactionalRunner.transactionManager,
      );

      delete newUser.password;

      await transactionalRunner.commitTransaction();
      return newUser;
    } catch (error) {
      await transactionalRunner.rollbackTransaction();
      this._logger.error(error.message, error.stack);
      throw error;
    } finally {
      await transactionalRunner.releaseTransaction();
    }
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: id ? id : IsNull() },
    });

    if (!user) {
      throw new NotFoundException(ErrorCode.UserNotFound);
    }

    return user;
  }

  async findOneByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email } });
    return user;
  }

  async findOneByEmailWithPassword(email: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email }, relations: ['password'] });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }

  async update(id: number, { first_name, last_name, email, password }: UpdateUserDto) {
    const transactionalRunner = await this.transactionRunner.createTransaction();

    try {
      await transactionalRunner.startTransaction();

      const existingUser = await this.userRepository.findOne({
        where: { id },
        relations: ['password'],
      });

      if (!existingUser) {
        throw new NotFoundException();
      }

      if (password) {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);
        existingUser.password.value = hashedPassword;
      }

      existingUser.email = email;
      existingUser.first_name = first_name;
      existingUser.last_name = last_name;

      const newUser = await saveWithTransactions.call(
        this.userRepository,
        existingUser,
        transactionalRunner.transactionManager,
      );

      delete newUser.password;

      await transactionalRunner.commitTransaction();
      return newUser;
    } catch (error) {
      await transactionalRunner.rollbackTransaction();
      this._logger.error(error.message, error.stack);
      throw error;
    } finally {
      await transactionalRunner.releaseTransaction();
    }
  }

  public async updatePassword(userId: number, hashedPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['password'],
    });

    if (!user) {
      throw new NotFoundException(ErrorCode.UserNotFound);
    }

    user.password.value = hashedPassword;
    await this.userRepository.save(user);
  }
}

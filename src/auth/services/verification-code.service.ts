import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { generateVerificationCode } from "src/common/utils/auth.util";
import { VerificationCode, VerificationCodeTypeEnum } from "../entities/verification-code.entity";
import { EntityManager, MoreThan, Repository } from "typeorm";
import { ErrorCode } from 'src/common/enums/error-code.enum';
import { updateWithTransactions } from "src/database/transaction-factory";

@Injectable()
export class VerificationCodeService {
  private readonly VERIFICATION_CODE_EXPIRY_MINUTES: number = 15;

  constructor(
    @InjectRepository(VerificationCode) private readonly verificationCodeRepository: Repository<VerificationCode>,
  ) {}

  public async createVerificationCode(email: string, type: VerificationCodeTypeEnum) {
    const code = generateVerificationCode();

    await this.verificationCodeRepository.save({
      email,
      code,
      type,
      expires_at: new Date(Date.now() + this.VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000),
    });

    return code;
  }

  public async verifyCode(
    email: string,
    code: string,
    type: VerificationCodeTypeEnum,
    transactionManager?: EntityManager,
  ): Promise<VerificationCode> {
    const verificationCode = await this.verificationCodeRepository.findOne({
      where: {
        email,
        code,
        type,
        is_active: true,
        expires_at: MoreThan(new Date()),
      },
    });

    if (!verificationCode) {
      throw new BadRequestException(ErrorCode.InvalidVerificationCode);
    }

    await updateWithTransactions.call(
      this.verificationCodeRepository,
      { id: verificationCode.id, type },
      { is_active: false },
      transactionManager,
    );

    return verificationCode;
  }
}


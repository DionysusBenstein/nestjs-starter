import { AbstractEntity } from 'src/common/entities/abstract.entity';
import { Entity, Column } from 'typeorm';

export enum VerificationCodeTypeEnum {
  Email = 'email',
}

@Entity('verification_codes')
export class VerificationCode extends AbstractEntity {
  @Column()
  email: string;

  @Column()
  code: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({
    type: 'enum',
    enum: VerificationCodeTypeEnum,
    nullable: false,
    default: VerificationCodeTypeEnum.Email,
  })
  type: VerificationCodeTypeEnum;

  @Column({ type: 'timestamp' })
  expires_at: Date;
}

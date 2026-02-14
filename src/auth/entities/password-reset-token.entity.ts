import { Entity, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AbstractEntity } from 'src/common/entities/abstract.entity';

@Entity('password_reset_tokens')
export class PasswordResetToken extends AbstractEntity {
  @Column()
  token: string;

  @Column()
  user_id: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

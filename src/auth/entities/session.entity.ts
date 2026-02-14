import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AbstractEntity } from 'src/common/entities/abstract.entity';

@Entity('sessions')
export class Session extends AbstractEntity {
  @Column()
  refresh_token: string;

  @Column()
  user_id: number;

  @Column({ nullable: true })
  device_info: string;

  @Column({ nullable: true })
  ip_address: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;
} 

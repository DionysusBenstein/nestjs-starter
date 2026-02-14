import { AbstractEntity } from 'src/common/entities/abstract.entity';
import { Column, Entity, OneToOne } from 'typeorm';
import { Password } from './password.entity';

@Entity('users')
export class User extends AbstractEntity {
  @Column({ length: 255 })
  first_name: string;

  @Column({ length: 255, nullable: true, default: null })
  last_name?: string | null;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_verified: boolean;

  @OneToOne(() => Password, (password) => password.user, { cascade: true })
  password: Password;
}

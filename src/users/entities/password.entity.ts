import { AbstractEntity } from "src/common/entities/abstract.entity";
import { Column, Entity, OneToOne, JoinColumn } from "typeorm";
import { User } from "./user.entity";

@Entity('passwords')
export class Password extends AbstractEntity {
  @Column({ length: 255 })
  value: string;

  @Column({ unique: true })
  user_id: number;

  @OneToOne(
    () => User,
    (user) => user.password,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;
}

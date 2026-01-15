import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable } from 'typeorm';
import { Role } from '../role/role.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column()
  email: string;

  @Column({ default: 'user' })
  role: string;

  @Column({ default: '' })
  avatar: string;

  @ManyToMany(() => Role, role => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: {
      name: 'userId',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'roleId',
      referencedColumnName: 'id'
    }
  })
  roles: Role[];
}
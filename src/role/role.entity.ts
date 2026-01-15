import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Menu } from '../menu/menu.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  explain: string;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ type: 'simple-array', nullable: true })
  menuKeys: string[];

  @Column({ default: 'enable' })
  status: string;

  @ManyToMany(() => User, user => user.roles)
  users: User[];

  @ManyToMany(() => Menu, menu => menu.roles)
  @JoinTable({
    name: 'role_menus',
    joinColumn: {
      name: 'roleId',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'menuId',
      referencedColumnName: 'id'
    }
  })
  menus: Menu[];

  @CreateDateColumn()
  create_date: Date;

  @UpdateDateColumn()
  update_date: Date;
}

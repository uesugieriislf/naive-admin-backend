import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Role } from '../role/role.entity';

@Entity('menus')
export class Menu {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  label: string;

  @Column({ unique: true })
  key: string;

  @Column({ default: 1 })
  type: number;

  @Column({ nullable: true })
  subtitle: string;

  @Column({ default: 1 })
  openType: number;

  @Column({ nullable: true })
  auth: string;

  @Column({ nullable: true })
  path: string;

  @Column({ nullable: true })
  component: string;

  @Column({ type: 'json', nullable: true })
  meta: any;

  @Column({ default: 0 })
  sort: number;

  @Column({ default: true })
  hidden: boolean;

  @Column({ nullable: true })
  parentId: number;

  @ManyToMany(() => Role, role => role.menus)
  roles: Role[];
}

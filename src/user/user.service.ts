import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as CryptoJS from 'crypto-js';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findOne(username: string): Promise<User | undefined> {
    return await this.userRepository.findOne({
      where: { username },
      relations: ['roles'],
    });
  }

  async findOneById(id: number): Promise<User | undefined> {
    return await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.menus'],
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    const hashedPassword = this.hashPassword(userData.password);
    const user = this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });
    return await this.userRepository.save(user);
  }

  hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString();
  }

  public verifyPassword(plainPassword: string, hashedPassword: string): boolean {
    return this.hashPassword(plainPassword) === hashedPassword;
  }

  async initializeDefaultUser(): Promise<void> {
    const existingUser = await this.findOne('admin');
    if (!existingUser) {
      await this.create({
        username: 'admin',
        password: 'admin123',
        email: 'admin@example.com',
        role: 'admin',
        avatar: '',
      });
      console.log('Default admin user created: username=admin, password=admin123');
    }
  }

  async findAll(query: any) {
    const { page = 1, pageSize = 10, username } = query;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (username) {
      queryBuilder.andWhere('user.username LIKE :username', { username: `%${username}%` });
    }

    const [list, total] = await queryBuilder
      .skip(skip)
      .take(pageSize)
      .orderBy('user.id', 'DESC')
      .getManyAndCount();

    return {
      page: Number(page),
      pageSize: Number(pageSize),
      pageCount: Math.ceil(total / pageSize),
      itemCount: total,
      list,
    };
  }

  async update(id: number, userData: Partial<User>) {
    if (userData.password) {
      userData.password = this.hashPassword(userData.password);
    }
    await this.userRepository.update(id, userData);
    return await this.findOneById(id);
  }

  async delete(id: number) {
    return await this.userRepository.delete(id);
  }
}
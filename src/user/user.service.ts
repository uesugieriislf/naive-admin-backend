import { Injectable } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';

// 用户接口
interface User {
  id: number;
  username: string;
  password: string;
  email: string;
  role: string;
  avatar: string;
}

@Injectable()
export class UserService {
  // 内存存储用户数据
  private users: User[] = [];

  async findOne(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }

  async findOneById(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async create(userData: Partial<User>): Promise<User> {
    // 哈希密码
    const hashedPassword = this.hashPassword(userData.password);
    const user: User = {
      id: this.users.length + 1,
      username: userData.username,
      password: hashedPassword,
      email: userData.email,
      role: userData.role || 'user',
      avatar: userData.avatar || '',
    };
    this.users.push(user);
    return user;
  }

  // 哈希密码方法
  hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString();
  }

  // 验证密码方法
  public verifyPassword(plainPassword: string, hashedPassword: string): boolean {
    return this.hashPassword(plainPassword) === hashedPassword;
  }

  // 初始化默认用户
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
}
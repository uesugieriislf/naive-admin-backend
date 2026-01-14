import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.userService.findOne(username);
    if (user && this.userService.verifyPassword(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id };
    return {
      code: 200,
      result: {
        token: this.jwtService.sign(payload),
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        permissions: user.role === 'admin' ? ['*'] : [],
      },
    };
  }
}
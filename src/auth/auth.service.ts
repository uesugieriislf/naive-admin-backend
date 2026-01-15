import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { MenuService } from '../menu/menu.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private menuService: MenuService,
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
    
    let permissions: string[] = [];
    let menus: any[] = [];

    if (user.roles && user.roles.length > 0) {
      const role = user.roles[0];
      
      if (role.menuKeys && role.menuKeys.length > 0) {
        const menuList = await this.menuService.findByKeys(role.menuKeys);
        menus = this.menuService['buildMenuTree'](menuList);
        permissions = role.menuKeys;
      }

      if (role.name === 'admin') {
        permissions = ['*'];
      }
    } else if (user.role === 'admin') {
      permissions = ['*'];
    }

    return {
      code: 200,
      result: {
        token: this.jwtService.sign(payload),
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        permissions,
        menus,
      },
    };
  }
}
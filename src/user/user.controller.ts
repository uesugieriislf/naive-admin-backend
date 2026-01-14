import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('api/admin_info')
  async getAdminInfo(@Param('id') id: number) {
    const user = await this.userService.findOneById(id || 1); // 默认获取ID为1的用户
    if (!user) {
      return { code: 404, message: 'User not found' };
    }
    
    return {
      code: 200,
      result: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        permissions: user.role === 'admin' ? ['*'] : [],
      },
    };
  }
}
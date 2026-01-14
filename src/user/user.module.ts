import { Module, OnModuleInit } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule implements OnModuleInit {
  constructor(private userService: UserService) {}

  async onModuleInit() {
    // 初始化默认用户
    await this.userService.initializeDefaultUser();
  }
}
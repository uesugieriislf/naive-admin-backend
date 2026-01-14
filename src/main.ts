import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { UserService } from './user/user.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 启用CORS
  app.enableCors({
    origin: 'http://localhost:8002',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  // 使用全局验证管道
  app.useGlobalPipes(new ValidationPipe());
  
  // 初始化默认用户
  const userService = app.get(UserService);
  await userService.initializeDefaultUser();
  
  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
}
bootstrap();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { UserService } from './user/user.service';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 启用CORS
  app.enableCors({
    origin: 'http://localhost:8001',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  // 添加静态文件服务，用于访问上传的图片
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
  
  // 使用全局验证管道
  app.useGlobalPipes(new ValidationPipe());
  
  // 初始化默认用户
  const userService = app.get(UserService);
  await userService.initializeDefaultUser();
  
  await app.listen(3001);
  console.log('Application is running on: http://localhost:3001');
}
bootstrap();
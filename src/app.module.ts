import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { TableModule } from './table/table.module';
import { RoleModule } from './role/role.module';
import { MenuModule } from './menu/menu.module';
import { MulterModule } from '@nestjs/platform-express';
import { User } from './user/user.entity';
import { Role } from './role/role.entity';
import { Menu } from './menu/menu.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: './data/database.sqlite',
      entities: [User, Role, Menu],
      synchronize: true,
      logging: false,
    }),
    UserModule,
    AuthModule,
    TableModule,
    RoleModule,
    MenuModule,
    MulterModule.register({
      dest: './uploads',
    }),
  ],
})
export class AppModule {}
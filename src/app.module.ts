import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { TableModule } from './table/table.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    UserModule,
    AuthModule,
    TableModule,
    MulterModule.register({
      dest: './uploads',
    }),
  ],
})
export class AppModule {}